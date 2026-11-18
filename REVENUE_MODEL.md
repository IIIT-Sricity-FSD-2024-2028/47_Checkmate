# Revenue Model — EventPro / Checkmate

**All payments are simulated.** No gateway, card or bank is connected. "Pay Now", "Refund" and "Release payout" only change fields on the booking in `back-end/data/database.json`.

## The money in one picture

```
Client pays price P ──► Platform keeps commission  C = P × rate   (Global Settings, default 10%)
                    └─► Vendor is paid out         V = P − C       (after the event is completed)
```

Example at 10%: P = ₹10,000 → C = ₹1,000 → V = ₹9,000.

## Lifecycle of a booking

| Event status | Booking | Money |
|---|---|---|
| pending / waiting | — (no booking yet) | nothing is billed |
| **confirmed / approved** (vendor approves with a final price) | created: `Confirmed` | P, C and V are calculated once and **stored on the booking**. A later change to the rate never alters it. |
| live | `In Progress` | unchanged |
| completed | `Completed` | the admin can release V once the client has paid |
| **cancelled / rejected after confirmation** | `Cancelled` | the client owes only the **cancellation fee** F = P × fee%. C and V are recalculated from F. If the client already paid more than F, the difference is recorded as `refundAmount`. |
| confirmed again after a cancel | back to `Confirmed` | the original P returns |

- **Cancellation fee %** is set by the admin on **Global Settings**. The default is **0%**: a cancelled or rejected event earns nobody anything and is fully refunded.
- Rejecting a request that was never confirmed creates no booking, so there is no revenue at all.
- A payout that was already released is never changed by a later cancel.

## Who sees what

| Role | Where | What |
|---|---|---|
| Client | Billing & Invoices | price, paid, balance; for a cancelled booking: the original price struck through, the fee due, and the refund |
| Vendor | Event Review (after approval) | Booking id, what the client pays, the platform commission, **your payout**, payment and payout status |
| Vendor | Dashboard | gross, platform fee, net earnings, pending/settled payouts |
| Admin | Monitor Events → View | the booking, **commission earned**, vendor payout |
| Admin | Financial Payouts | live commission %, commission retained and collected (client paid), per-booking fee and net payout, Release Payout |

## Rules enforced by the backend
- Only the approval trigger creates bookings. `POST/PUT/PATCH /bookings` are **admin/superuser only**, so a vendor cannot change the cost or zero the commission.
- `PATCH /bookings/:id/pay` works only for the client who owns the booking, and only when something is due.
- `PATCH /bookings/:id/settle` works only when the client has paid, there is something to pay out, and the event is completed (or the booking is a cancelled booking whose fee was paid). `settledBy` comes from the signed-in admin.
- Dashboard revenue counts a cancelled booking only at its fee.

## Code
- `back-end/src/database/booking-rules.ts`: cancel, reinstate and status sync (pure functions, tested in `booking-rules.spec.ts`)
- `back-end/src/database/data.service.ts`: `triggerEventUpdated` creates the booking and calls `syncEventBooking`
- `back-end/src/common/constants/finance.constants.ts`: commission split and fee %
- `back-end/src/modules/bookings/bookings.service.ts`: pay and settle rules
