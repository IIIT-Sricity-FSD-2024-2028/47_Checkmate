# AUDIT — EventPro / Checkmate (branch `hemanth`, before Phase 2 fixes)

Date: 2026-11-18 · Starting commit `877efbc`.

## How this audit was done
- **Browser crawl:** both servers were running. A Playwright script signed in as each of the 5 seed accounts, opened every menu page (49 pages), and clicked every non-destructive button it could reach. It recorded console errors, page crashes, failed `/api` calls, and bad rendered text (`undefined`, `NaN`, `[object Object]`, `Invalid Date`). **Result: 49/49 pages clean.** Buttons that change data (approve, reject, delete, pay, submit and so on) were not clicked by the crawler. They are covered by the code review below and by the Phase 2 flow tests.
- **API probes:** real tokens, read-only requests (see 4.1).
- **Code read** of every backend module plus the money, chat, staff and cancel paths in the React app.

Ratings: **H** = wrong money, data leak or a broken core flow · **M** = a wrong rule or a feature that half works · **L** = cosmetic or minor.

---

## 1. How money flows today (from the real code)

| Step | What triggers it | Code | What happens |
|---|---|---|---|
| 1. Quote | Vendor enters a final price in **Event Review** | `EventQuoteCard.jsx`, `EventReview.jsx` | Shows the price, the platform fee (commission %) and "You Receive". Nothing is stored yet. |
| 2. Booking created | Vendor approves: `PATCH /events/:id/status {status:'confirmed', quotedPrice}` | `events.service.ts updateStatus` → `DataService.update` → `triggerEventUpdated` | The first time an event becomes confirmed or approved, **one booking row** is created: `cost = quotedPrice ‖ budget ‖ estimatedCost`; `commissionRate` = Global Settings `commissionRate` (default **10%**); `commissionAmount = cost × rate`; `vendorPayoutAmount = cost − commission`; `paymentStatus:'unpaid'`, `payoutStatus:'pending'`. When several vendors supplied items, `vendorSplits` shares the cost by item value. The rate is copied onto the booking, so a later change to the setting does not alter old bookings. |
| 3. Client pays | **Billing → Pay Now** → `PATCH /bookings/:id/pay` | `bookings.service.ts recordPayment` | Owner check (`booking.clientId === me`). Sets `advancePaid = cost`, `paymentStatus = 'paid'`. Full amount only. |
| 4. Commission | — | stored on the booking at step 2 | Admin sees the totals on **Financial Payouts** (`GET /bookings/commissions`) and the dashboards (`GET /analytics/summary`). |
| 5. Vendor payout | Admin **Financial Payouts → Release** → `PATCH /bookings/:id/settle` | `settlePayout` + `getSettleBlockReason` | Allowed only when the client has paid in full **and** the event is `completed`. Sets `payoutStatus:'settled'`, `settledAt`, `settledBy`. |

**Payment is only simulated.** There is no payment gateway, card form, bank transfer or refund. "Pay Now" only marks the booking as paid in `database.json`, and "Release payout" only marks it settled. No real money moves anywhere.

---

## 2. (a) Broken

| # | Problem | Rating |
|---|---|---|
| A1 | **Revenue includes cancelled and rejected events.** When an event is cancelled after confirmation (admin "Refund" button, superuser edit), its booking stays `Confirmed`. `analytics.summary` and `/bookings/commissions` still count its cost, commission and payout. | H |
| A2 | **The booking status never follows the event.** Live data: BK001–BK003 events are `completed`, but their bookings still say `Confirmed` or `In Progress`. So the vendor's `completedEventsCount` is wrong, and "confirmed revenue" depends on a stale field. | H |
| A3 | **Admin "Refund" refunds nothing.** It only sets the event to `cancelled`. `paymentStatus` stays `paid`, and the payout is still owed. | H |
| A4 | **Staff show "Unavailable" for every date.** In the client Create Event wizard, a staff member is greyed out if they are on *any* unfinished event, whatever its date (`useCreateEventWizard.getBusyEvent`). The backend rule `staff.service assertFree` is the same, "one event at a time, ever". Example (owner's screenshot): Mike Johnson is greyed out even though his other event is on a different day. | M |
| A5 | **Admin replies never reach the user.** Coordination Hub replies are saved without `recipientEmail`, so staff and clients never see them (known item 4). | H |
| A6 | Vendor Monitoring **"Conclude Event"** does nothing, with no message, unless the event is live (known item 6). | M |
| A7 | Staff Schedule **Day / Week** buttons only move the highlight; the calendar does not change (known item 7). | L |
| A8 | 3 root test scripts (`test-auth-flow.js`, `test-commission-revenue-model.js`, `test-issue-render.js`) are outdated and fail (known item 9). | L |
| A9 | Superuser Staff page sets `status: Active/Inactive`, but the backend recalculates `status` on every assignment change and overwrites it (known item 5). | L |

## 3. (b) Missing

| # | Missing | Rating |
|---|---|---|
| B1 | No **staff profile** (experience, skills, events completed, rating) and **no rating system** at all. | M |
| B2 | Client staff picks are not marked as *preferences*. The vendor has no "confirm / replace" step for them. | M |
| B3 | **No reasons on reject or cancel.** Vendor reject has a free-text note. Staff decline, admin application reject, client cancel and superuser cancel save no reason and no "cancelled by". The other party is never told why. | M |
| B4 | No **cancellation fee** setting. A cancelled confirmed booking cannot keep a fee. | M |
| B5 | No **minimum notice** rules: a client can request an event for tomorrow, and can cancel a pending request the day before. | M |
| B6 | **No live messaging and no unread counts.** Chats poll every 3–8 seconds, and nothing shows how many messages are unread. | M |
| B7 | No real payment gateway or refund flow. This is expected for a college project; it is simulated and labelled as such in the code. | L |

## 4. (c) Business-rule / logic gaps

| # | Gap | Rating |
|---|---|---|
| C1 | A vendor can change any booking through `PATCH/PUT /bookings/:id`, including `cost`, `commissionRate`, `commissionAmount` (e.g. 0%) and `paymentStatus:'paid'`. Through `POST /bookings`, a vendor can create a booking with any commission. The UI never does this, but the API allows it. | H |
| C2 | A vendor can set an event to `confirmed` through the generic `PUT /events/:id`. That bypasses `updateStatus`, so no `approvedAt` and no client notification, but a booking is still created. | M |
| C3 | A vendor can edit or delete **another vendor's** events, packages, resources, staff and issues. There are no owner checks on those modules. | M |
| C4 | `settledBy` is taken from the `x-user-id` request header, not from the signed-in user, so it can be spoofed in the audit log. | L |
| C5 | `PATCH /packages/:id/decision` accepts any `status` because the body has no DTO (known item 3). | M |
| C6 | Event lists and the vendor review page show only the start date of overnight events (known item 12). | L |
| C7 | `platformCommissionEarned` counts unpaid bookings. The dashboard does not separate "earned (paid)" from "expected". | M |

## 5. (d) Security gaps (all proven with real tokens on 2026-11-18)

| # | Who can see what | Rating |
|---|---|---|
| D1 | **Client** `GET /state/users` → all 10 users with email and phone. `GET /snapshot` → the whole database (users, all events, bookings, vendor applications, staff). (known item 1) | H |
| D2 | **Client** `GET /events` → all 11 events from every client. `GET /bookings` → all 6 bookings with prices and commissions. Same for `/issues` and `/staff-assignments`. The React app filters these lists *in the browser*, so the data is already sent. | H |
| D3 | **Any user** `GET /state/adminChatMessages` → every private admin support chat. | H |
| D4 | **Vendor V001** `GET /vendors/V003/payouts` → another vendor's earnings (known item 2). `GET /bookings/commissions` → the whole commission ledger for every vendor. | H |
| D5 | **Staff** `PATCH /staff-assignments/:id` can accept, decline or reassign *someone else's* assignment (there is no owner check, unlike `/progress`). | M |
| D6 | **Staff** `GET /events` → every event with client names and budgets. | M |
| D7 | `POST /issues` takes the reporter's name, email and role from the request body, so a reporter can be faked. | L |
| D8 | Old HTML pages can no longer write some `/state` keys (known item 11). This is the intended effect of the allowlist and only noted here. | L |
| D9 | 49 Dependabot alerts on `main` (npm versions). Not touched here: `main` is read-only. | M |

## 6. (e) UX problems

| # | Problem | Rating |
|---|---|---|
| E1 | The client cannot see a staff member's details before picking them; a card shows only name and role. | M |
| E2 | Client billing shows the price, but the vendor review shows "You Receive" only before approval. Afterwards, the vendor has no per-event payout line, and the admin has no per-event "commission earned" in the event view. | M |
| E3 | The admin chat's admin side has a single shared thread, with no per-person conversations. | M |
| E4 | Client "Messages" lists events only once they are in the vendor's enquiry or live lists. A completed event's chat disappears. | L |
| E5 | `window.confirm` is used for destructive actions on several pages, instead of the app's modals. | L |
| E6 | The SQL schema in `Database/` is out of date (known item 8), which is confusing for the viva. | L |

---

## 7. Fix plan (Phase 2, in this order)
1. Money flow: booking follows the event, cancellation fee, vendor booking writes locked, per-role money views, plus REVENUE_MODEL.md. → A1–A3, C1, C2, C7, E2, B4
2. Staff profiles and vendor-only ratings. → B1, E1, A4
3. Client staff *preference* plus vendor confirm/replace. → B2
4. Reject/cancel reason modal for every role. → B3
5. 7-day create rule and 3-day client cancel rule, backend and frontend. → B5
6. Messaging: `recipientEmail` fix, server-side admin chat, Socket.IO, unread counts. → A5, B6, D3, E3
7. Remaining items: D1, D2, D4, D5, C5, A6, A7, C6, A8.

---

## 8. Found during Phase 2 (not in the first pass)

| # | Problem | Rating | Status |
|---|---|---|---|
| F1 | 4 root test scripts deleted or wrote to the real `back-end/data/database.json`, and every `npx jest` run rewrote it (`data.service.spec.ts`, `middleware.e2e.spec.ts`) | H | Fixed: `EMS_DATA_DIR` temp folder |
| F2 | Pending vendor applications stored the password in **plain text** | H | Fixed: hashed on submit |
| F3 | A public vendor application could set its own `status: "approved"` | M | Fixed: always pending |
| F4 | Staff Schedule showed **made-up data** (a "Johnson Wedding", a demo marker, fixed "10:00 AM – 6:00 PM" / "Live", calendar stuck on March 2026) | M | Fixed: real data |
| F5 | Staff "Dispatch Request" was posted to a thread nobody reads | M | Fixed |
| F6 | Completing an event marked *declined* assignments as completed (inflated "events completed") | M | Fixed |
| F7 | Clients had no admin chat page; admin hub replies had no recipient | H | Fixed (step 6) |
| F8 | **Every user's notifications** are readable through `GET /state/notifications`, and pages save the whole list back (`PUT`) | M | **Open**: needs a per-user notifications endpoint |
| F9 | Passwords are hashed with SHA-256 and one fixed salt for everyone (`common/security/password.ts`) | M | **Open**: should move to scrypt/bcrypt with a per-user salt |
| F10 | Any vendor can still edit or delete another vendor's packages, resources and staff (C3) | M | **Open** |
| F11 | Staff still receive every event through `GET /events` (D6); `/issues` and `/staff-assignments` are not scoped by role | M | **Open** |
| F12 | `GET /vendor-applications` is open to every vendor (other applicants' contact details) | M | **Open** |

## 9. Status of every item after Phase 2

| Item | Status | Item | Status |
|---|---|---|---|
| A1–A3 money / refund | Fixed (step 1) | C1–C2 booking + status bypass | Fixed (step 1) |
| A4 date-less "Unavailable" | Fixed (step 2) | C3 vendor ownership | **Open** (F10) |
| A5 admin replies | Fixed (step 6) | C4 settledBy spoofing | Fixed (step 1) |
| A6 Conclude Event | Fixed (step 7) | C5 package DTO | Fixed (step 7) |
| A7 Schedule Day/Week | Fixed (step 7) | C6 overnight dates | Fixed (step 7) |
| A8 root scripts | Fixed (step 7) | C7 earned vs collected | Fixed (step 1) |
| A9 superuser staff status | **Open** (not in the Phase 2 list) | D1 users / snapshot | Fixed (step 7) |
| B1 profiles + ratings | Fixed (step 2) | D2 events / bookings for clients | Fixed (step 7) |
| B2 preferences | Fixed (step 3) | D3 admin chat leak | Fixed (step 6) |
| B3 reasons | Fixed (step 4) | D4 vendor payouts | Fixed (step 7) |
| B4 cancellation fee | Fixed (step 1) | D5 staff assignments | Fixed (step 4) |
| B5 date rules | Fixed (step 5) | D6 staff read all events | **Open** (F11) |
| B6 live chat + unread | Fixed (step 6) | D7 spoofable issue reporter | **Open** |
| B7 real payments | Out of scope (simulated) | D8 legacy HTML /state writes | Expected |
| E1–E3 UX | Fixed (steps 1, 2, 6) | D9 Dependabot on `main` | **Open** (`main` is read-only) |
| E4–E6 UX | **Open** (low) | | |
