import { BadRequestException, Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { hashPassword } from '../../common/security/password';
import { DecisionDto } from '../../common/dto/action.dto';
import { DataService } from '../../database/data.service';
import { CreateVendorApplicationDto, CreateVendorDto, UpdateVendorApplicationDto, UpdateVendorDto, VendorFeedbackDto } from './dto';
import { DEFAULT_COMMISSION_RATE, VENDOR_SHARE_RATE } from '../../common/constants/finance.constants';

// Two related things live here: the approved `vendors` list, and the
// `vendorApplications` queue that admins approve or reject.
//
// WATCH OUT: between signup and approval, the application's `passwordHash`
// field holds the RAW password, not a hash. It is only hashed at the moment
// of approval (decideApplication), just before the account is created.
@Injectable()
export class VendorsService {
  constructor(private readonly data: DataService) {}
  async vendors() { return (await this.data.collection('vendors')); }
  async findVendor(id: string) { return (await this.data.find('vendors', id)); }
  async createVendor(dto: CreateVendorDto) { return (await this.data.create('vendors', 'V', dto)); }
  async updateVendor(id: string, dto: UpdateVendorDto) { return (await this.data.update('vendors', id, dto)); }
  async removeVendor(id: string) { return (await this.data.remove('vendors', id)); }

  async applications() { return (await this.data.collection('vendorApplications')); }
  async findApplication(id: string) { return (await this.data.find('vendorApplications', id)); }
  async createApplication(dto: CreateVendorApplicationDto) {
    // The signup form sends the raw password in `passwordHash`. It is hashed
    // straight away (it used to sit in database.json as plain text until an admin
    // decided), and `passwordHashed` tells decideApplication not to hash it twice.
    // The status is always "pending": an applicant cannot approve themselves.
    const rawPassword = dto.passwordHash;
    const appPayload = {
      submittedAt: new Date().toISOString(),
      ...dto,
      status: 'pending' as const,
      passwordHash: rawPassword ? hashPassword(rawPassword) : '',
      passwordHashed: true,
    };
    const app = (await this.data.create('vendorApplications', 'VAPP', appPayload));
    await this.data.setValue('vendorDocSubmission', app);
    return app;
  }
  async updateApplication(id: string, dto: UpdateVendorApplicationDto) { return (await this.data.update('vendorApplications', id, dto)); }
  // `user` is the admin/superuser deciding; a rejection keeps the reason so the
  // applicant is shown it when they try to sign in (AuthService.login).
  async decideApplication(id: string, dto: DecisionDto, user?: { id?: string; name?: string; role?: string }) {
    // Hash the raw password stored in the application BEFORE updating status.
    // This ensures the DataService trigger (triggerVendorApplicationUpdated) uses the hashed value.
    const currentApp = (await this.data.find('vendorApplications', id));
    const rawPassword = currentApp.passwordHash || '';
    // Only hash if it still looks like plain text -- guards against hashing twice
    // if an application is approved, reopened, and approved again.
    const hashedPassword = (currentApp as any).passwordHashed || !rawPassword
      ? rawPassword // hashed when the application was submitted
      : hashPassword(rawPassword); // older applications still hold the raw text

    // Pre-set the hashed password on the application before the status change triggers auto-provisioning
    const app = (await this.data.update('vendorApplications', id, {
      status: dto.status,
      note: dto.note,
      rejectionReason: dto.status === 'rejected' ? dto.note || 'No reason given' : undefined,
      decidedBy: user?.name ? `${user.name} (${String(user.role || '').toLowerCase()})` : undefined,
      decidedAt: new Date().toISOString(),
      passwordHash: hashedPassword,
    }));

    // The DataService triggerVendorApplicationUpdated handles vendor + user creation,
    // but we need to ensure the user gets the properly hashed password.
    // Check if the trigger already created the user; if so, update the password hash.
    if (dto.status === 'approved') {
      const createdUser = (await this.data.collection('users')).find((u) => u.email.toLowerCase() === app.email.toLowerCase());
      if (createdUser && createdUser.passwordHash !== hashedPassword) {
        await this.data.update('users', createdUser.id, { passwordHash: hashedPassword });
      }
    }

    return app;
  }
  async removeApplication(id: string) { return (await this.data.remove('vendorApplications', id)); }

  /**
   * Retrieves financial earnings, platform commission deductions, and payout history for a vendor
   */
  // A vendor may only read their own earnings (admins/superusers: anyone's)
  async getVendorPayouts(vendorId: string, user?: { id?: string; role?: string }) {
    if (String(user?.role || '').toLowerCase() === 'vendor') {
      const own = (await this.data.collection('vendors')).find((v: any) => v.userId === user?.id);
      if (!own || own.id.toLowerCase() !== vendorId.toLowerCase()) {
        throw new ForbiddenException("You can only view your own payouts.");
      }
    }
    const vendor = (await this.findVendor(vendorId));
    const allBookings = (await this.data.collection('bookings'));
    const vendorBookings = allBookings.filter(
      (b) =>
        b.vendorSplits?.some((s) => s.vendorId.toLowerCase() === vendorId.toLowerCase()) ||
        (b.vendorId && b.vendorId.toLowerCase() === vendorId.toLowerCase()) ||
        (b.vendor && vendor && (b.vendor.toLowerCase() === vendor.name.toLowerCase() || b.vendor.toLowerCase() === (vendor.businessName || '').toLowerCase())),
    ).map((b) => {
      // On a shared booking, this vendor only earns their part
      const share = b.vendorSplits?.find((s) => s.vendorId.toLowerCase() === vendorId.toLowerCase());
      if (!share) return b;
      // A cancelled booking keeps only the fee, so each vendor's share shrinks by the same ratio
      const ratio = b.originalCost ? Number(b.cost || 0) / b.originalCost : 1;
      const scaled = (n: number) => Number((Number(n || 0) * ratio).toFixed(2));
      return { ...b, ...share, cost: scaled(share.cost), commissionAmount: scaled(share.commissionAmount), vendorPayoutAmount: scaled(share.vendorPayoutAmount), vendorSplits: undefined };
    });

    const totalEarnedGross = vendorBookings.reduce((sum, b) => sum + Number(b.cost || 0), 0);
    const platformFeeDeducted = vendorBookings.reduce((sum, b) => sum + Number(b.commissionAmount !== undefined ? b.commissionAmount : (b.cost || 0) * DEFAULT_COMMISSION_RATE), 0);
    const netPayoutAmount = vendorBookings.reduce((sum, b) => sum + Number(b.vendorPayoutAmount !== undefined ? b.vendorPayoutAmount : (b.cost || 0) * VENDOR_SHARE_RATE), 0);
    const pendingPayouts = vendorBookings
      .filter((b) => (b.payoutStatus || 'pending') === 'pending')
      .reduce((sum, b) => sum + Number(b.vendorPayoutAmount !== undefined ? b.vendorPayoutAmount : (b.cost || 0) * VENDOR_SHARE_RATE), 0);
    const settledPayouts = vendorBookings
      .filter((b) => b.payoutStatus === 'settled')
      .reduce((sum, b) => sum + Number(b.vendorPayoutAmount !== undefined ? b.vendorPayoutAmount : (b.cost || 0) * VENDOR_SHARE_RATE), 0);

    return {
      vendorId: vendor.id,
      vendorName: vendor.name,
      businessName: vendor.businessName,
      commissionRate: (await this.data.getCommissionRate()),
      totalEarnedGross,
      platformFeeDeducted,
      netPayoutAmount,
      pendingPayouts,
      settledPayouts,
      completedEventsCount: vendorBookings.filter((b) => String(b.status).toLowerCase() === 'completed').length,
      bookings: vendorBookings,
    };
  }

  // ── Client feedback about the vendor (after a completed event) ──────────────
  // One feedback per event, only from the client who owns it, editable.
  // The vendor's rating is the average of all feedback, worked out on every read.

  /** { vendorId, rating, ratingCount, recent[] } -- rating is null with no feedback yet. */
  async feedbackSummary(vendorId: string) {
    const list = (await this.data.collection('vendorFeedback')).filter((f) => f.vendorId === vendorId);
    const rating = list.length ? Math.round((list.reduce((sum, f) => sum + Number(f.stars || 0), 0) / list.length) * 10) / 10 : null;
    const recent = [...list]
      .sort((a, b) => String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt)))
      .slice(0, 5)
      .map((f) => ({ stars: f.stars, comment: f.comment || '', by: f.clientName || 'Client', eventName: f.eventName, at: f.updatedAt || f.createdAt }));
    return { vendorId, rating, ratingCount: list.length, recent };
  }

  /** Every vendor's summary keyed by id (for cards that list several vendors). */
  async feedbackSummaries() {
    const result: Record<string, Awaited<ReturnType<VendorsService['feedbackSummary']>>> = {};
    for (const v of await this.data.collection('vendors')) result[v.id] = await this.feedbackSummary(v.id);
    return result;
  }

  // 403 unless the signed-in client owns the event; 400 until it is completed
  private async assertCanGiveFeedback(eventId: string, user: { id?: string }) {
    const event: any = (await this.data.find('events', eventId));
    if (!event.clientId || event.clientId !== user?.id) throw new ForbiddenException('Only the client who booked this event can rate the vendor.');
    if (String(event.status).toLowerCase() !== 'completed') throw new BadRequestException('You can rate the vendor only after the event is completed.');
    if (!event.vendorId) throw new BadRequestException('This event has no vendor to rate.');
    return event;
  }

  /** The feedback already given for this event (or null). Client owner, the vendor or admins. */
  async eventFeedback(eventId: string) {
    return (await this.data.collection('vendorFeedback')).find((f) => f.eventId === eventId) || null;
  }

  // POST: create, or edit if this client already rated this event (never a duplicate)
  async giveFeedback(eventId: string, dto: VendorFeedbackDto, user: { id?: string; name?: string }) {
    const event = (await this.assertCanGiveFeedback(eventId, user));
    const existing = (await this.eventFeedback(eventId));
    if (existing) return await this.editFeedback(eventId, dto, user);
    const saved = (await this.data.create('vendorFeedback', 'VF', {
      vendorId: event.vendorId,
      eventId: event.id,
      eventName: event.name,
      clientId: user.id!,
      clientName: user.name || event.client || 'Client',
      stars: dto.stars,
      comment: dto.comment?.trim() || '',
      createdAt: new Date().toISOString(),
    } as any));
    await this.notifyVendorOfFeedback(event, dto, false);
    return saved;
  }

  // PATCH: change your earlier feedback (404 if there is none yet)
  async editFeedback(eventId: string, dto: VendorFeedbackDto, user: { id?: string; name?: string }) {
    const event = (await this.assertCanGiveFeedback(eventId, user));
    const existing = (await this.eventFeedback(eventId));
    if (!existing) throw new NotFoundException('You have not rated this vendor for this event yet.');
    const saved = (await this.data.update('vendorFeedback', existing.id, { stars: dto.stars, comment: dto.comment?.trim() || '', updatedAt: new Date().toISOString() } as any));
    await this.notifyVendorOfFeedback(event, dto, true);
    return saved;
  }

  // Bell notification for the vendor whenever feedback arrives or changes
  private async notifyVendorOfFeedback(event: any, dto: VendorFeedbackDto, edited: boolean) {
    (await this.data.notifyUser(
      (await this.data.vendorUserId(event.vendorId)),
      `${edited ? 'Updated feedback' : 'New feedback'}: ${event.name}`,
      `${event.client || 'Your client'} rated you ${dto.stars}/5${dto.comment ? `: "${dto.comment.trim()}"` : ''}`,
      dto.stars >= 4 ? 'success' : 'info',
      '/vendor/dashboard',
    ));
  }
}
