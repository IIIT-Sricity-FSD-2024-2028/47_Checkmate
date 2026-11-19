/**
 * PAYMENTS — checkout through a SIMULATED gateway (no real money moves).
 *
 * Flow (the client's Billing page drives it):
 *   1. POST /bookings/:id/checkout { method, amount }
 *        -> checks, then creates a payment record "processing" and marks the
 *           booking paymentStatus "processing"
 *   2. POST /payments/:id/confirm { outcome }
 *        -> the gateway's answer: "paid" (booking fully paid, receipt number)
 *           or "failed" (booking "failed", the client may try again)
 *
 * Checks (400/403/404 with a clear message):
 *   - only the client who owns the booking may pay
 *   - nothing to pay / already paid / a payment already processing -> 400
 *   - the event is cancelled or rejected -> 400
 *   - the amount must equal the balance due (cost - already paid)
 *
 * Why simulated: Razorpay test mode needs the owner's own API keys plus their
 * checkout script and webhook signature check. Swapping it in later only
 * changes step 2 (the gateway's answer); the records stay the same.
 */
import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { DataService } from '../../database/data.service';
import { Booking, PaymentRecord } from '../../domain/models';

type Caller = { id?: string; name?: string; role?: string } | undefined;
const round2 = (n: number) => Number(Number(n || 0).toFixed(2));

export const PAYMENT_METHODS = ['upi', 'card', 'netbanking'] as const;

@Injectable()
export class PaymentsService {
  constructor(private readonly data: DataService) {}

  /** What the client still owes on a booking. */
  async balanceDue(booking: Booking) {
    return round2(Math.max(0, Number(booking.cost || 0) - Number(booking.advancePaid || 0)));
  }

  // Step 1: start a checkout -> payment record "processing"
  async startCheckout(bookingId: string, body: { method: string; amount: number; methodLabel?: string }, user: Caller) {
    const booking = (await this.data.find('bookings', bookingId)) as Booking;
    if (!booking.clientId || booking.clientId !== user?.id) throw new ForbiddenException('You can only pay your own bookings.');

    const event: any = (await this.data.collection('events')).find((e) => e.id === booking.eventId);
    const eventStatus = String(event?.status || '').toLowerCase();
    if (['cancelled', 'rejected'].includes(eventStatus) || booking.status === 'Cancelled') {
      throw new BadRequestException('This event was cancelled or rejected, so it cannot be paid. Contact the admin about any fee or refund.');
    }
    if (booking.paymentStatus === 'paid') throw new BadRequestException('This booking is already paid.');
    if (booking.paymentStatus === 'processing') throw new BadRequestException('A payment for this booking is already being processed.');
    const due = (await this.balanceDue(booking));
    if (due <= 0) throw new BadRequestException('Nothing is due on this booking.');
    if (!PAYMENT_METHODS.includes(body.method as any)) throw new BadRequestException('Choose UPI, Card or Net banking.');
    if (round2(body.amount) !== due) {
      throw new BadRequestException(`The amount must be the balance due: ₹${due.toLocaleString('en-IN')}.`);
    }

    const payment = (await this.data.create('payments', 'PAY', {
      bookingId: booking.id,
      eventId: booking.eventId,
      clientId: user!.id!,
      amount: due,
      method: body.method as PaymentRecord['method'],
      methodLabel: body.methodLabel,
      status: 'processing',
      gateway: 'simulated',
      createdAt: new Date().toISOString(),
    } as any)) as PaymentRecord;
    await this.data.update('bookings', booking.id, { paymentStatus: 'processing', lastPaymentId: payment.id } as any);
    return payment;
  }

  // Step 2: the gateway's answer for a processing payment
  async confirm(paymentId: string, outcome: 'success' | 'failure', user: Caller) {
    const payment = (await this.data.find('payments', paymentId)) as PaymentRecord;
    if (payment.clientId !== user?.id) throw new ForbiddenException('You can only confirm your own payment.');
    if (payment.status !== 'processing') throw new BadRequestException(`This payment is already ${payment.status}.`);
    const booking = (await this.data.find('bookings', payment.bookingId)) as Booking;
    const now = new Date().toISOString();
    const gatewayRef = `SIM-${Date.now().toString(36).toUpperCase()}`;

    if (outcome === 'failure') {
      await this.data.update('payments', payment.id, { status: 'failed', completedAt: now, gatewayRef, failureReason: 'Declined by the bank (simulated)' } as any);
      await this.data.update('bookings', booking.id, { paymentStatus: 'failed' } as any);
      return await this.data.find('payments', payment.id);
    }

    const paidTotal = round2(Number(booking.advancePaid || 0) + payment.amount);
    await this.data.update('payments', payment.id, { status: 'paid', completedAt: now, gatewayRef, receiptNo: `RCPT-${payment.id}` } as any);
    await this.data.update('bookings', booking.id, { advancePaid: paidTotal, paymentStatus: 'paid', paidAt: now } as any);
    await this.data.logActivity('PAYMENT_RECORDED', 'BOOKING', booking.id, { bookingId: booking.id, paymentId: payment.id, amount: payment.amount, method: payment.method, gateway: 'simulated' }, user!.id, 'Client');
    // Tell the vendor the client has paid (their payout can be released after the event)
    (await this.data.notifyUser(
      (await this.data.vendorUserId(booking.vendorId)),
      `Payment received: ${booking.eventName}`,
      `${booking.client || 'The client'} paid ₹${payment.amount.toLocaleString('en-IN')} (simulated gateway).`,
      'success',
      '/vendor/dashboard',
    ));
    return await this.data.find('payments', payment.id);
  }

  /** Clients: their own payments. Vendors: payments on their bookings. Admins: all. */
  async list(user: Caller) {
    const all = (await this.data.collection('payments')) as PaymentRecord[];
    const role = String(user?.role || '').toLowerCase();
    if (['admin', 'superuser'].includes(role)) return all;
    if (role === 'client') return all.filter((p) => p.clientId === user?.id);
    if (role === 'vendor') {
      const vendorId = (await this.data.collection('vendors')).find((v: any) => v.userId === user?.id)?.id;
      const mine = new Set((await this.data.collection('bookings')).filter((b) => b.vendorId === vendorId).map((b) => b.id));
      return all.filter((p) => mine.has(p.bookingId));
    }
    return [];
  }
}
