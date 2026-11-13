# EventPro / Checkmate — Merge, Availability, Conversion & QA Report

Branch: `hemanth` (local only, **nothing pushed**). Tested 2026-11-13 with the NestJS backend (`back-end/`) and the React app (`frontend-react/`, Vite dev server) running together, driven by a real headless Chromium (Playwright).

**Summary**

| Area | Result |
|---|---|
| Merge `vendor-react` → `hemanth` | ✅ Clean (fast-forward content, 0 conflicts), both builds pass, `main` / `vendor-react` untouched |
| Date-based resource availability | ✅ Implemented in backend + 3 React pages; 16 unit tests, 18 live API checks, 7 UI checks all pass |
| HTML → React (staff + superuser) | ✅ 2 missing pages created, 1 unrouted page routed, 5 superuser forms fixed |
| Backend role guard | ✅ 564/564 role checks behave as declared; auth uses real signed JWTs |
| Backend endpoint cases | 165/166 as expected (1 validation bug) |
| Backend security | ✅ The 4 critical + 4 high problems are **fixed and re-verified** (section 6a); 3 lower-priority read/validation issues remain (section 6) |
| End-to-end UI flows | ✅ 31/31 steps pass |
| Buttons / controls | Works: **269** · Disabled: **16** · Partly works: **2** · Not verified: **1** · Does nothing: **4** |

---

## 1. Merge result

**Before:** working tree clean on `vendor-react` (nothing to stash). No local `hemanth` branch existed, so it was created from `origin/hemanth`.

| Branch | Hash before | Hash after | Changed? |
|---|---|---|---|
| `main` | `3c3cd700c6e444ce7bbabfbf08962935df08879b` | `3c3cd700c6e444ce7bbabfbf08962935df08879b` | No |
| `vendor-react` | `2c582d07d54b4419b0abc1d05b43aa289abe7b35` | `2c582d07d54b4419b0abc1d05b43aa289abe7b35` | No |
| `origin/main` | `3c3cd70…` | `3c3cd70…` | No |
| `origin/vendor-react` | `2c582d0…` | `2c582d0…` | No |
| `hemanth-backup-before-vendor-merge` (new) | — | `f3009d0ada304e4c3644999c3438c7a1617e9518` | backup of old `hemanth` |
| `hemanth` | `f3009d0` | `0ee7525` (merge commit) | Yes |

**How the merge went:** `origin/hemanth` (f3009d0) was a direct ancestor of `vendor-react` — hemanth had **0** commits of its own, vendor-react had 14 more. `git merge --no-ff vendor-react` therefore produced **no conflicts**, and the merged tree is byte-identical to `vendor-react`.

**About the per-file rules:** the rules ("keep hemanth's staff/superuser files", "merge shared files by hand") only apply when both sides changed a file. Here hemanth never changed any file after the split, so hemanth's "version" of the staff/superuser pages is simply the older common ancestor. Restoring it would have deleted vendor-react's newer staff and superuser work (e.g. `staff/Messages.jsx`, `superuser/Reports.jsx`, `Settings.jsx`, `ReportIssue.jsx`) and broken the build, so all of vendor-react was kept. Shared files (`AppRoutes.jsx`, `roleRoutes.js`, services, `package.json`) needed no hand merge for the same reason.

**After the merge:** `npm install` + build in both projects: backend `nest build` ✅, frontend `vite build` ✅ (only a "chunk larger than 500 kB" warning). No merge-caused errors.

Note: a separate local branch `staff-html-match` (on top of `main`) contains other staff-page work. It was only read, not merged.

---

## 2. Availability change

### What was wrong
A resource was treated as taken if it was allocated to **any** unfinished event, whatever the date:
- Backend `DataService.triggerAllResourceAllocations` set `available = false` as soon as all stock was allocated anywhere — this hid items from the vendor package builder and disabled "Allocate".
- The backend never checked allocations at all: `PUT /api/state/resourceAllocations` accepted any map, `POST /api/events` any quantity, and moving an event to another date was not re-checked.
- The React pages each had their own browser-side estimate; the vendor Manage Resources page only saw the vendor's own events and ignored units an event already held when adding more.

### Every place that checked availability (before → after)
| Place | Before | After |
|---|---|---|
| `DataService.triggerAllResourceAllocations` | `available=false` when stock used on any date | `available` = has usable stock (not Maintenance/Damaged); `avail` kept as a summary count |
| `PUT /api/state/resourceAllocations` | no check | every changed event list checked → 400 if over-allocated |
| `POST /api/events` (requestedResources) | no check | checked against the event date → 400 |
| `PATCH/PUT /api/events/:id` (date/time change) | no check | event's own allocations re-checked on the new window (own units excluded) |
| Client Create Event wizard (`useCreateEventWizard`) | local same-date estimate | backend `GET /resources/availability`, card shows "N available on DATE" / "Fully booked", `+` disabled at the limit |
| Vendor Event Review (`getResourceAvailableForEvent`) | local estimate | backend `?eventId=` answer; backend 400 message shown in toast |
| Vendor Manage Resources (`useVendorResourcesData`) | own events only, date-less blocking, "add more" bug | backend answer per selected event minus units already held; inventory column = "Free Today" |
| `ResourceTableRow` Allocate button | disabled by date-less count | enabled while the item has usable stock; date check happens in the modal |
| Vendor package builder (`r.available !== false`) | hid fully-allocated items | now only hides broken / zero-stock items |

### The rule (`back-end/src/modules/resources/resource-availability.ts`)
`getAvailableQuantity(resourceId, eventDate | window, excludeEventId)` — exposed as `ResourcesService.getAvailableQuantity`:
1. Counts only events whose window overlaps the requested one. Window = `date`+`time` → `endDate`+`endTime`; no `endDate` = one day; no `time` = from midnight; no `endTime` = to the end of the last day; an end time before the start time runs past midnight. Touching windows (13:00 end / 13:00 start) do not overlap.
2. Ignores `rejected`, `cancelled`, `declined`, `completed` events and allocation rows marked `released` / `returned`.
3. Ignores `excludeEventId` (the event being edited).
4. `available = total stock − units held on overlapping events` (Maintenance/Damaged stock = 0).
5. Over-allocation → **400**, e.g. `Only 2 of 10 HD Laser Projector & Screen are free on 2030-01-10 (requested 8).`

New endpoints (all roles may read):
- `GET /api/resources/availability?date=YYYY-MM-DD[&endDate=&time=&endTime=&excludeEventId=]` or `?eventId=EVT005`
- `GET /api/resources/:id/availability?…` (same query)

Events gained an optional `endDate` field (DTO + model) for multi-day events.

### Test results
**Unit tests** (`resource-availability.spec.ts`, 16/16 pass): no overlap · same-day overlap · partial time overlap & back-to-back slots · multi-day overlap in both directions · cancelled/rejected/declined/released ignored · editing the same event · quantity exceeded message · damaged/unknown resources · 12h/24h times and past-midnight events · service wrapper · report by `eventId` · invalid date 400 · map valid on two different dates · map over-allocation 400 · unchanged legacy lists not re-checked · moving an event onto a busy date refused.

**Live API (18/18 pass):** the same 8 projectors allocated on 2030-01-10 **and** 2030-01-11 (200); a third request for 8 on 2030-01-10 refused (400 with message); 2 more on the same day accepted; 3 refused; moving an event onto the busy date refused; re-saving an event on its own date allowed; cancelling an event frees its units; missing/impossible date → 400; no token → 401.

**Through the UI (flow 7 below):** all 10 projectors requested and allocated on day 1 and again on day 2; on day 1 the wizard then shows "Fully booked on …" with `+` disabled; a free day still shows 10; bypassing the UI with a direct API call → 400.

---

## 3. Page-conversion table (staff + superuser)

| HTML page | React file | Status before | Status now | What was different / done |
|---|---|---|---|---|
| `staff/staff.html` | `pages/staff/Dashboard.jsx` | Matches | Matches | Same stats, schedule, performance, quick actions; live data instead of hard-coded "Mike" text |
| `staff/AssignedEvents.html` | `pages/staff/AssignedEvents.jsx` | Matches | Matches | Same filter bar (All/Pending/Accepted/Rejected), cards, accept/reject/tasks/message buttons |
| `staff/TaskBoard.html` | `pages/staff/TaskBoard.jsx` | Matches | Matches | Same columns, drag & drop, add-task modal |
| `staff/Schedule.html` | `pages/staff/Schedule.jsx` | Matches | Matches | Same calendar + Day/Week/Month buttons (cosmetic in both versions) |
| `staff/Performance.html` | `pages/staff/Performance.jsx` | Matches | Matches | Same metrics and achievements |
| `staff/Report.html` | `pages/staff/ReportIssue.jsx` | Matches | Matches | Same form, validation, reporter box |
| `staff/Messages.html` | `pages/staff/Messages.jsx` | Matches | Matches | Same tabs, conversation list, chat, "+ New Request" modal |
| `staff/MessagesAdmin.html` | `pages/staff/MessagesAdmin.jsx` | **Missing** | **Created** | Single "Admin Support" chat as in the HTML (list + New Request hidden), orange issue notes, Enter to send, 3-second refresh; CSS added for `.chat-msg/.msg-self/.msg-other` which the HTML used but never styled |
| `staff/ReportAdmin.html` | `pages/staff/ReportAdmin.jsx` | **Missing** | **Created** | Same title, fields, emoji priorities, categories, reporter box, toast; saves a `target: 'admin'` ticket and posts the chat note; Cancel now works (HTML threw a ReferenceError); CSS ported and scoped under `.ri-admin-page` |
| `superuser/dashboard.html` | `pages/superuser/Dashboard.jsx` | Matches | Matches | — |
| `superuser/users.html` | `pages/superuser/Users.jsx` | Partly | Matches | Role/Status were pre-filled so "Select role…"/"Select…" validation never fired → placeholders restored |
| `superuser/events.html` | `pages/superuser/Events.jsx` | Partly | Matches | Vendor/Type/Status pre-filled → placeholders restored |
| `superuser/bookings.html` | `pages/superuser/Bookings.jsx` | Partly | Matches | Vendor/Status pre-filled → placeholders restored (currency is ₹ project-wide, intentional) |
| `superuser/resources.html` | `pages/superuser/Resources.jsx` | Partly | Matches | Category/Vendor pre-filled → placeholders restored |
| `superuser/staff.html` | `pages/superuser/Staff.jsx` | **Partly (unreachable)** | Matches | Page existed but had no route or menu item → routed; Vendor/Availability/Status placeholders restored |

All staff/superuser React pages use `useState`/`useEffect`/`.map()` and `fetch` through service files — no `innerHTML`, `querySelector`, `window.DB` or synchronous XHR (checked with grep).

**Router edits (shared file, kept small):**
- `routes/AppRoutes.jsx`: imports `StaffMessagesAdmin`, `StaffReportAdmin`, `SuperuserStaff`; routes `/staff/admin-messages`, `/staff/report-admin`, `/superuser/staff`.
- `routes/roleRoutes.js`: staff menu "Issue to Admin" (`/staff/report-admin`), "Admin Coordination" (`/staff/admin-messages`); superuser menu "Staff" (`/superuser/staff`).

---

## 4. Backend audit

### 4.1 Authentication
- **Real tokens, not headers.** Login returns a signed JWT; `JwtAuthGuard` verifies it and re-reads the user (role, active status) from the database on every request; `RolesGuard` uses that role. The `x-role` / `x-email` headers the frontend sends are **ignored** — verified: a client token with `x-role: admin` gets 403, a request with only `x-role: admin` gets 401, an edited token payload gets 401.
- The signing secret used to fall back to the hard-coded `'eventpro_secret_key'`; a token signed with it was accepted as admin. **Fixed** (section 6a): a real `JWT_SECRET` is used, or a random one per run in development; production refuses to start without it. The old forged token now gets 401.
- Rate limiting works: login → 429 after 20 attempts / 15 min.

### 4.2 Method
- Role matrix: all **94 endpoints** called as admin, superuser, vendor, client, staff and with no token (564 calls). Guards run before validation, so a bogus body / unknown id was used: allowed roles must pass the guard, others must get 403, no token 401. **Result: 564/564 as declared.**
- Success + bad-input cases: 166 targeted requests with real data (created and then deleted). **165/166 as expected.**
- Security probes run on throwaway data; everything changed was restored.

### 4.3 Endpoint table
| Endpoint (`/api` prefix) | Allowed roles | Role guard: 5 roles + no token | Success case | Bad-input / wrong-owner case | Notes |
|---|---|---|---|---|---|
| `GET /public/recruitments` | PUBLIC | ✓ 6/6 | ✓ 200 (none) | n/a |  |
| `GET /analytics/summary` | admin, superuser, vendor | ✓ 6/6 | ✓ 200 (vendor) | n/a |  |
| `GET /analytics/financial-summary` | admin, superuser | ✓ 6/6 | ✓ 200 (admin) | n/a |  |
| `GET /snapshot` | admin, superuser, vendor, client, staff | ✓ 6/6 | ✓ 200 (staff) | n/a | 🟡 MEDIUM: whole database (bookings, payouts, users without hashes) to every role |
| `GET /state/:key` | admin, superuser, vendor, client, staff | ✓ 6/6 | ✓ 200 (client) | ✓ 403 (client: private key) | 🟠 HIGH: any role can read `users` (emails, phones) and every other collection |
| `PUT /state/:key` | admin, superuser, vendor, client, staff | ✓ 6/6 | ✓ 200 (admin) | ✓ 403 (admin: key not on the allowlist)<br>✓ 400 (admin: no value) | ✅ FIXED: was 🔴 any role could overwrite any collection; now per-role key allowlist (others 403) |
| `POST /auth/login` | PUBLIC | ✓ 6/6 | ✓ 201 (none) | ✓ 401 (none: wrong password) | Rate limited: 20 / 15 min (verified 429) |
| `POST /auth/register` | PUBLIC | ✓ 6/6 | ✓ 201 (none) | ✓ 400 (none: duplicate email) |  |
| `POST /auth/forgot-password` | PUBLIC | ✓ 6/6 | ✓ 201 (none) | ✓ 400 (none: bad input) | ✅ FIXED: was 🟠 OTP in the response; now only in the dev console |
| `POST /auth/reset-password` | PUBLIC | ✓ 6/6 | ✓ 201 (none) | ✓ 400 (none: wrong otp) | ✅ FIXED: was 🔴 master OTP `123456`; removed, plus 5-try lockout |
| `POST /auth/find-account` | PUBLIC | ✓ 6/6 | ✓ 201 (none) | ✓ 400 (none: bad input) |  |
| `GET /bookings/commissions` | admin, superuser, vendor | ✓ 6/6 | ✓ 200 (vendor) | n/a |  |
| `GET /bookings` | admin, superuser, vendor, client | ✓ 6/6 | ✓ 200 (client) | n/a |  |
| `GET /bookings/:id` | admin, superuser, vendor, client | ✓ 6/6 | ✓ 200 (client) | ✓ 404 (client: unknown id) |  |
| `POST /bookings` | admin, superuser, vendor | ✓ 6/6 | ✓ 201 (admin) | ✓ 400 (admin: negative cost) |  |
| `PUT /bookings/:id` | admin, superuser, vendor | ✓ 6/6 | ✓ 200 (vendor) | ✓ 400 (vendor: settle via PUT blocked) |  |
| `PATCH /bookings/:id/pay` | client | ✓ 6/6 | ✓ 200 (client) | ✓ 400 (client: already paid) |  |
| `PATCH /bookings/:id/settle` | admin, superuser | ✓ 6/6 | ✓ 200 (admin) | ✓ 400 (admin: unpaid, not completed) | Only after the client paid and the event completed |
| `PATCH /bookings/:id` | admin, superuser, vendor | ✓ 6/6 | ✓ 200 (admin) | ✓ 400 (admin: wrong type) |  |
| `DELETE /bookings/:id` | admin, superuser | ✓ 6/6 | ✓ 200 (admin) | ✓ 404 (admin: already deleted) |  |
| `GET /events` | admin, superuser, vendor, client, staff | ✓ 6/6 | ✓ 200 (staff) | n/a |  |
| `GET /events/:id` | admin, superuser, vendor, client, staff | ✓ 6/6 | ✓ 200 (client) | ✓ 404 (client: unknown id) |  |
| `POST /events` | client, vendor, admin, superuser | ✓ 6/6 | ✓ 201 (client) | ✓ 400 (client: missing fields) | Phase 2: requested quantities checked against the event date |
| `PUT /events/:id` | client, vendor, admin, superuser | ✓ 6/6 | ✓ 200 (client) | ✓ 400 (client: wrong type) | ✅ FIXED: was 🟠 clients could self-confirm; status is now locked for clients |
| `PATCH /events/:id` | client, vendor, admin, superuser | ✓ 6/6 | ✓ 200 (vendor) | ✓ 400 (vendor: unknown field) | ✅ FIXED: was 🟠 clients could edit other clients' events; now 403 |
| `PATCH /events/:id/status` | vendor, admin, superuser | ✓ 6/6 | ✓ 200 (vendor) | ✓ 400 (vendor: no status) |  |
| `PATCH /events/:id/cancel` | client | ✓ 6/6 | ✓ 200 (client) | ✓ 400 (client: already cancelled) |  |
| `DELETE /events/:id` | vendor, admin, superuser, client | ✓ 6/6 | ✓ 200 (vendor) | ✓ 404 (vendor: already deleted) | ✅ FIXED: was 🟠 clients could delete other clients' events; now 403 |
| `GET /issues` | admin, superuser, vendor, client, staff | ✓ 6/6 | ✓ 200 (client) | n/a |  |
| `GET /issues/:id` | admin, superuser, vendor, client, staff | ✓ 6/6 | ✓ 200 (staff) | ✓ 404 (staff: unknown id) |  |
| `POST /issues` | admin, superuser, vendor, client, staff | ✓ 6/6 | ✓ 201 (staff) | ✓ 400 (staff: no title) |  |
| `PUT /issues/:id` | admin, superuser, vendor | ✓ 6/6 | ✓ 200 (vendor) | ✓ 400 (vendor: wrong type) |  |
| `PATCH /issues/:id` | admin, superuser, vendor | ✓ 6/6 | ✓ 200 (admin) | ✓ 404 (admin: unknown id) |  |
| `DELETE /issues/:id` | admin, superuser, vendor | ✓ 6/6 | ✓ 200 (admin) | ✓ 404 (admin: already deleted) |  |
| `GET /messages` | admin, superuser | ✓ 6/6 | ✓ 200 (admin) | n/a |  |
| `GET /messages/:threadId` | admin, superuser, vendor, client, staff | ✓ 6/6 | ✓ 200 (vendor) | ✓ 403 (client: wrong owner (another client's event thread) |  |
| `POST /messages` | admin, superuser, vendor, client, staff | ✓ 6/6 | ✓ 201 (vendor) | ✓ 400 (vendor: no text) |  |
| `GET /packages` | admin, superuser, vendor, client | ✓ 6/6 | ✓ 200 (client) | n/a |  |
| `GET /packages/:id` | admin, superuser, vendor, client | ✓ 6/6 | ✓ 200 (client) | ✓ 404 (client: unknown id) |  |
| `POST /packages` | vendor, admin, superuser | ✓ 6/6 | ✓ 201 (vendor) | ✓ 400 (vendor: duration 0) |  |
| `PUT /packages/:id` | vendor, admin, superuser | ✓ 6/6 | ✓ 200 (vendor) | ✓ 400 (vendor: negative price) |  |
| `PATCH /packages/:id` | vendor, admin, superuser | ✓ 6/6 | ✓ 200 (vendor) | ✓ 404 (vendor: unknown id) |  |
| `PATCH /packages/:id/decision` | admin, superuser | ✓ 6/6 | ✓ 200 (admin) | ✗ 200 (admin: bad status) | 🟡 BUG: no DTO, any `status` value accepted (e.g. "maybe") |
| `DELETE /packages/:id` | vendor, admin, superuser | ✓ 6/6 | ✓ 200 (vendor) | ✓ 404 (vendor: already deleted) |  |
| `GET /resources` | admin, superuser, vendor, client, staff | ✓ 6/6 | ✓ 200 (client) | n/a |  |
| `GET /resources/availability` | admin, superuser, vendor, client, staff | ✓ 6/6 | ✓ 200 (client) | ✓ 400 (client: bad date) | NEW (Phase 2) |
| `GET /resources/:id/availability` | admin, superuser, vendor, client, staff | ✓ 6/6 | ✓ 200 (vendor) | ✓ 404 (vendor: unknown id) | NEW (Phase 2) |
| `GET /resources/:id` | admin, superuser, vendor, client, staff | ✓ 6/6 | ✓ 200 (staff) | ✓ 404 (staff: unknown id) |  |
| `POST /resources` | vendor, admin, superuser | ✓ 6/6 | ✓ 201 (vendor) | ✓ 400 (vendor: negative quantity) |  |
| `PUT /resources/:id` | vendor, admin, superuser | ✓ 6/6 | ✓ 200 (vendor) | ✓ 400 (vendor: wrong type) |  |
| `PATCH /resources/:id` | vendor, admin, superuser | ✓ 6/6 | ✓ 200 (admin) | ✓ 404 (admin: unknown id) |  |
| `DELETE /resources/:id` | vendor, admin, superuser | ✓ 6/6 | ✓ 200 (vendor) | ✓ 404 (vendor: already deleted) |  |
| `GET /public/staff-designations` | PUBLIC | ✓ 6/6 | ✓ 200 (none) | n/a |  |
| `POST /staff-applications` | PUBLIC | ✓ 6/6 | ✓ 201 (none) | ✓ 400 (none: no document)<br>✓ 400 (none: bad input) | Needs ≥1 PDF/PNG/JPEG document (multipart) |
| `GET /staff-applications` | vendor, admin, superuser | ✓ 6/6 | ✓ 200 (vendor) | n/a |  |
| `GET /staff-applications/:id/documents/:docId` | vendor, admin, superuser | ✓ 6/6 | n/a | ✓ 404 (vendor: no such document) |  |
| `PATCH /staff-applications/:id/decision` | vendor, admin, superuser | ✓ 6/6 | ✓ 200 (vendor) | ✓ 400 (vendor: bad status) |  |
| `GET /staff` | admin, superuser, vendor, staff | ✓ 6/6 | ✓ 200 (staff) | n/a |  |
| `GET /staff/:id` | admin, superuser, vendor, staff | ✓ 6/6 | ✓ 200 (vendor) | ✓ 404 (vendor: unknown id) |  |
| `POST /staff` | admin, superuser | ✓ 6/6 | ✓ 201 (admin) | ✓ 400 (admin: missing fields) |  |
| `PUT /staff/:id` | vendor, admin, superuser | ✓ 6/6 | ✓ 200 (vendor) | ✓ 400 (vendor: negative workload) |  |
| `PATCH /staff/:id` | vendor, admin, superuser, staff | ✓ 6/6 | ✓ 200 (admin) | n/a | ✅ FIXED: was 🟠 staff could edit any staff record; now own `workload` only |
| `DELETE /staff/:id` | vendor, admin, superuser | ✓ 6/6 | ✓ 200 (admin) | ✓ 404 (admin: already deleted) |  |
| `POST /staff/login` | PUBLIC | ✓ 6/6 | ✓ 201 (none) | ✓ 401 (none: wrong password) |  |
| `GET /staff/profile/:email` | admin, superuser, vendor, staff | ✓ 6/6 | ✓ 200 (staff) | ✓ 404 (staff: unknown email) |  |
| `GET /staff-assignments` | admin, superuser, vendor, staff, client | ✓ 6/6 | ✓ 200 (client) | n/a |  |
| `POST /staff-assignments` | vendor, admin, superuser | ✓ 6/6 | ✓ 201 (vendor) | ✓ 400 (vendor: missing fields) |  |
| `PATCH /staff-assignments/:id/progress` | staff | ✓ 6/6 | ✓ 400 (staff: business rule (event not live) | ✓ 400 (staff: bad workStatus) | Only allowed while the event is live and the assignment accepted |
| `PATCH /staff-assignments/:id` | vendor, admin, superuser, staff | ✓ 6/6 | ✓ 200 (staff) | ✓ 404 (staff: unknown id) |  |
| `PUT /staff-assignments/:id` | vendor, admin, superuser, staff | ✓ 6/6 | ✓ 200 (vendor) | ✓ 400 (vendor: wrong type) |  |
| `DELETE /staff-assignments/:id` | vendor, admin, superuser | ✓ 6/6 | ✓ 200 (vendor) | ✓ 404 (vendor: already deleted) |  |
| `GET /users/profile` | ANY-AUTHENTICATED | ✓ 6/6 | ✓ 200 (client) | n/a |  |
| `PUT /users/profile` | ANY-AUTHENTICATED | ✓ 6/6 | ✓ 200 (client) | n/a | ✅ FIXED: was 🔴 any user could set `role: "Admin"`; now 400 and only profile fields are saved |
| `POST /users/profile/avatar` | ANY-AUTHENTICATED | ✓ 6/6 | n/a | ✓ 400 (client: no file) |  |
| `GET /users` | admin, superuser | ✓ 6/6 | ✓ 200 (superuser) | n/a |  |
| `GET /users/:id` | admin, superuser | ✓ 6/6 | ✓ 200 (admin) | ✓ 404 (admin: unknown id) |  |
| `POST /users` | admin, superuser | ✓ 6/6 | ✓ 201 (admin) | ✓ 400 (admin: bad email/role) |  |
| `PUT /users/:id` | admin, superuser | ✓ 6/6 | ✓ 200 (admin) | ✓ 400 (admin: bad role) |  |
| `PATCH /users/:id` | admin, superuser | ✓ 6/6 | ✓ 200 (superuser) | ✓ 404 (superuser: unknown id) |  |
| `DELETE /users/:id` | admin, superuser | ✓ 6/6 | ✓ 200 (admin) | ✓ 404 (admin: already deleted) |  |
| `GET /vendors` | admin, superuser, vendor, client | ✓ 6/6 | ✓ 200 (client) | n/a |  |
| `GET /vendors/:id/payouts` | admin, superuser, vendor | ✓ 6/6 | ✓ 200 (vendor) | n/a | 🟡 MEDIUM: a vendor can read another vendor's payouts |
| `GET /vendors/:id` | admin, superuser, vendor, client | ✓ 6/6 | ✓ 200 (client) | ✓ 404 (client: unknown id) |  |
| `POST /vendors` | admin, superuser | ✓ 6/6 | ✓ 201 (admin) | ✓ 400 (admin: bad status) |  |
| `PUT /vendors/:id` | admin, superuser | ✓ 6/6 | ✓ 200 (admin) | ✓ 400 (admin: bad status) |  |
| `PATCH /vendors/:id` | admin, superuser | ✓ 6/6 | ✓ 200 (superuser) | ✓ 404 (superuser: unknown id) |  |
| `DELETE /vendors/:id` | admin, superuser | ✓ 6/6 | ✓ 200 (admin) | ✓ 404 (admin: already deleted) |  |
| `GET /vendor-applications` | admin, superuser, vendor | ✓ 6/6 | ✓ 200 (admin) | n/a |  |
| `GET /vendor-applications/:id` | admin, superuser, vendor | ✓ 6/6 | ✓ 200 (admin) | ✓ 404 (admin: unknown id) |  |
| `POST /vendor-applications` | PUBLIC | ✓ 6/6 | ✓ 201 (none) | ✓ 400 (none: missing fields) |  |
| `PUT /vendor-applications/:id` | vendor, admin, superuser | ✓ 6/6 | ✓ 200 (admin) | ✓ 400 (admin: bad email) |  |
| `PATCH /vendor-applications/:id` | vendor, admin, superuser | ✓ 6/6 | ✓ 200 (admin) | ✓ 404 (admin: unknown id) |  |
| `PATCH /vendor-applications/:id/decision` | admin, superuser | ✓ 6/6 | ✓ 200 (admin) | ✓ 400 (admin: bad status) |  |
| `DELETE /vendor-applications/:id` | admin, superuser | ✓ 6/6 | ✓ 200 (admin) | ✓ 404 (admin: already deleted) |  |

### 4.4 Data layer
- **Persistence: works.** A record created through the API was present in `back-end/data/database.json` immediately, and still returned after stopping and restarting the server.
- **SQL schema (`Database/DBschema.sql`, identical to `DBschema_v2_normalized.sql`) is not used** — the backend has no SQL driver; it is documentation only, and it no longer matches the models:
  - events: no `waiting` status (used by vendors), no `quoted_price`, `requested_resources`, `requested_staff`, `vendor_responses`, `conflicts`, new `end_date`; column names differ (`event_date`/`start_time`/`people_count` vs `date`/`time`/`people`).
  - resources: `resource_name`, `quantity_total` vs `name`, `total`/`quantity`.
  - staff: status enum `available/assigned/on-leave/inactive` but the app writes `busy` (seed) and `Active/Inactive` (superuser page).
  - issues: enum `in_progress` while the app writes `in-progress`, `Open`.
  - `event_resource_allocations` (unique event+resource, statuses) matches the app's allocation model.

### 4.5 Existing backend tests
| Suite | Result |
|---|---|
| `npm test` (Jest): `middleware.e2e.spec.ts`, `data.service.spec.ts`, `resource-availability.spec.ts` (new), `security-rules.spec.ts` (new) | ✅ 4 suites, 39/39 tests |
| `test-client-event-flow.js` | ✅ 5/5 (after making the new `ResourcesService` argument optional — it builds `new EventsService(ds)` by hand) |
| `test-persistence-integrity.js` | ✅ 8/8 (it deletes `data/database.json`; run on a copy and restored) |
| `test-schema-validation.js` | ✅ |
| `test-auth-flow.js` | ❌ outdated: calls `new AuthService(ds)` without the `JwtService` it needs since JWT login was added |
| `test-commission-revenue-model.js` | ❌ outdated: tries to settle a payout for an unpaid booking, which the current rules (correctly) refuse |
| `test-issue-render.js` | ❌ outdated: parses the old admin HTML page and crashes |

---

## 5. Website test — every page, every button

### 5.1 How it was tested
- Backend + Vite dev server running; Playwright drove a real Chromium.
- Each role signed in through the real Sign In form and visited every route (54 pages incl. the new ones). On every page: console errors, JS errors, failed API requests, redirects, empty pages and horizontal overflow were recorded; the first instance of every distinct button/tab was clicked on a freshly loaded page; search boxes were typed into; selects changed; every internal link followed.
- A click counts as **Works** when it navigated, changed the page or called the API without errors; **Partly works** when it did something but with an error or only part of the expected effect; **Broken** on a JS error or when it could not be clicked; **Does nothing** when nothing happened. Results the crawler could not judge (browser confirm dialogs, downloads, already-active tabs, native form validation) were re-checked by hand or by a follow-up script — the reason column says so.
- Delete / Remove / Logout were not clicked on real data; instead each was exercised through the UI on throwaway records and confirmed through the API.

### 5.2 End-to-end flows (31/31 pass)
| Flow | Step | Result | Evidence |
|---|---|---|---|
| Setup | staff applies + vendor approves (onboarding creates a login) | ✅ Pass | apply 201, approve 200 |
| 1 Client creates event | resource card shows free units for the chosen date | ✅ Pass | label "10 available on 2033-06-22" |
| 1 Client creates event | quantity picker selects 2 projectors | ✅ Pass | picked 2 |
| 1 Client creates event | submit creates a pending event with the requested resource + staff | ✅ Pass | EVT008 status=pending |
| 1 Client creates event | event visible on My Events | ✅ Pass |  |
| 2 Vendor review | ▶ Allocate saves the projectors to the event | ✅ Pass | [{"resourceId":"R007","resourceName":"HD Laser Projector & Screen","category":"Equipment","quantity":2}] |
| 2 Vendor review | + Assign creates a staff assignment | ✅ Pass | A006 E2E Staffer 5720 assigned |
| 2 Vendor review | venue confirmed | ✅ Pass | {"venueId":"VN001","venueName":"Grand Hotel Ballroom","allocatedAt":"2026-11-13T18:51:16.405Z"} |
| 2 Vendor review | Approve confirms the event and creates the booking at the quoted price | ✅ Pass | approve button visible=true, status=confirmed, booking=BK005 ₹7500 |
| 3 Staff | Accept on Assigned Events marks the assignment accepted | ✅ Pass | accept visible=true, status=accepted |
| 3 Staff | Task Board "+ Add New Task" saves a task on the assignment | ✅ Pass | 2 task(s) |
| 3 Staff | progress panel saves work status while the event is live | ✅ Pass | workStatus=working |
| 4 Issue | staff Report Issue (event) saves the issue | ✅ Pass |  |
| 4 Issue | staff Issue to Admin (new page) saves a target=admin ticket | ✅ Pass | ISS004 |
| 4 Issue | Issue to Admin shows the success toast and clears the form | ✅ Pass |  |
| 4 Issue | Admin Coordination (new page) shows the issue note | ✅ Pass |  |
| 4 Issue | Admin Coordination sends a chat message | ✅ Pass |  |
| 4 Issue | admin Issue Tracking lists the staff ticket | ✅ Pass |  |
| 5 Admin approves vendor | Approve Vendor marks the application approved | ✅ Pass | status=approved |
| 5 Admin approves vendor | approved vendor can sign in | ✅ Pass | login 201 |
| 6 Superuser | All Events lists the new event | ✅ Pass |  |
| 6 Superuser | All Bookings lists the new booking | ✅ Pass |  |
| 6 Superuser | All Staff (newly routed) lists the onboarded staff member | ✅ Pass |  |
| 6 Superuser | Add User with empty form shows the role/status "Select..." validation (HTML parity fix) | ✅ Pass |  |
| 7 Availability | client can request all 10 projectors on day 1 and again on day 2 | ✅ Pass | d1 picked 10, d2 picked 10 |
| 7 Availability | vendor allocates the SAME 10 projectors to both dates (different days) | ✅ Pass |  |
| 7 Availability | SAME date: wizard shows "Fully booked" and blocks "+" | ✅ Pass | label "Fully booked on 2033-06-24", plus disabled=true, picked=0 |
| 7 Availability | a third, free date still shows all 10 | ✅ Pass | label "10 available on 2033-06-26" |
| 7 Availability | bypassing the UI: backend refuses the same-date request with 400 | ✅ Pass | 400 Only 0 of 10 HD Laser Projector & Screen are free on 2033-06-24 (requested 1). |
| 7 Availability | Manage Resources: Allocate button stays enabled although stock is booked on other dates | ✅ Pass |  |
| 7 Availability | Manage Resources: allocation modal opens and lists approved events | ✅ Pass | Allocate Resource — Step 1 of 2 Audio System Premium Equipment · 12 units in glo |

### 5.3 Console, network, routes, imports, layout
- **Blocking setup bug found first:** with the shipped configuration the React app **cannot sign in at all** — the backend CORS allowlist comes only from `CORS_ORIGINS`, there is no `.env`, and even `.env.example` did not list the Vite origin `http://localhost:5173` (browser: "blocked by CORS policy"). Fixed in `.env.example`; testing was done with `CORS_ORIGINS=http://localhost:5173,...`.
- Console errors on page load: **none** on any page. Failed requests: only `favicon.svg` / Google-font requests cancelled by navigation (`ERR_ABORTED`, the files exist) — harmless.
- Broken routes / links: **none** — every internal link resolved; unknown paths redirect to `/signin`; protected pages redirect to `/signin` after logout.
- Missing imports: none (both builds succeed, lint clean on changed files).
- Layout: no horizontal overflow on any of the 52 checked routes at 1366 px **or** at phone width (390 px).
- The "Welcome back" popup covers the first page after login (it is dismissible; it briefly blocked automated clicks).

### 5.4 Button and functionality table
| Page | Element | Result | Reason / evidence |
|---|---|---|---|
| `/admin/dashboard` | button "Logout" | Works | Verified for all 5 roles: back to "/", protected pages then redirect to /signin |
| `/admin/dashboard` | button "4" | Works | UI updated (modal/tab/toggle/validation) |
| `/admin/dashboard` | button "Review" | Works | navigates to /admin/vendor-approvals?review=VAPP002 |
| `/admin/vendor-approvals` | button "4" | Works | UI updated (modal/tab/toggle/validation) |
| `/admin/vendor-approvals` | button "Review Application" | Works | UI updated (modal/tab/toggle/validation) |
| `/admin/vendor-approvals` | button "View" ×2 | Works | UI updated (modal/tab/toggle/validation) |
| `/admin/vendor-approvals` | button "Previous" | Disabled | Disabled in the current state (e.g. needs a selection / valid form / stock) |
| `/admin/vendor-approvals` | button "Next" | Disabled | Disabled in the current state (e.g. needs a selection / valid form / stock) |
| `/admin/vendor-approvals` | search "Search vendors..." | Works | List re-rendered for the search text |
| `/admin/vendor-approvals` | select "All Statuses Pending Approved Rejected" | Works | Page updated for the chosen option |
| `/admin/users` | button "4" | Works | UI updated (modal/tab/toggle/validation) |
| `/admin/users` | button "Edit" ×10 | Works | UI updated (modal/tab/toggle/validation) |
| `/admin/users` | button "Disable" ×10 | Works | First row is the superuser/own account and is locked on purpose; other rows are enabled → PATCH /users/:id (verified in API audit) |
| `/admin/users` | button "Previous" | Disabled | Disabled in the current state (e.g. needs a selection / valid form / stock) |
| `/admin/users` | button "Next" | Disabled | Disabled in the current state (e.g. needs a selection / valid form / stock) |
| `/admin/users` | search "Search users by name, email..." | Works | List re-rendered for the search text |
| `/admin/users` | select "All Roles Client Vendor Staff Admin Superuser" | Works | Page updated for the chosen option |
| `/admin/users` | select "All Statuses Active Pending Inactive" | Works | Page updated for the chosen option |
| `/admin/events` | button "4" | Works | UI updated (modal/tab/toggle/validation) |
| `/admin/events` | button "View" ×10 | Works | UI updated (modal/tab/toggle/validation) |
| `/admin/events` | button "Approve" ×4 | Works | 1 API call(s), UI updated |
| `/admin/events` | button "Previous" | Disabled | Disabled in the current state (e.g. needs a selection / valid form / stock) |
| `/admin/events` | button "Next" | Disabled | Disabled in the current state (e.g. needs a selection / valid form / stock) |
| `/admin/events` | search "Search events, clients..." | Works | List re-rendered for the search text |
| `/admin/events` | select "All Statuses Pending Approved Confirmed Live Com" | Works | Page updated for the chosen option |
| `/admin/reports` | button "Export CSV" | Works | UI updated (modal/tab/toggle/validation) |
| `/admin/reports` | button "Refresh" | Works | 3 API call(s), UI updated |
| `/admin/reports` | select "All Categories Corporate Conference Wedding Gala" | Works | Page updated for the chosen option |
| `/admin/issues` | button "4" | Works | UI updated (modal/tab/toggle/validation) |
| `/admin/issues` | button "View" ×4 | Works | UI updated (modal/tab/toggle/validation) |
| `/admin/issues` | button "Investigate" ×3 | Works | 3 API call(s), UI updated |
| `/admin/issues` | button "Resolve" | Works | 3 API call(s), UI updated |
| `/admin/issues` | button "Previous" | Disabled | Disabled in the current state (e.g. needs a selection / valid form / stock) |
| `/admin/issues` | button "Next" | Disabled | Disabled in the current state (e.g. needs a selection / valid form / stock) |
| `/admin/issues` | search "Search tickets, reporters..." | Works | List re-rendered for the search text |
| `/admin/issues` | select "All Statuses Open Investigating Resolved" | Works | Page updated for the chosen option |
| `/admin/issues` | select "Addressed To: All Admin Vendor" | Works | Page updated for the chosen option |
| `/admin/moderation` | button "3" | Works | UI updated (modal/tab/toggle/validation) |
| `/admin/moderation` | button "Review" ×5 | Works | UI updated (modal/tab/toggle/validation) |
| `/admin/moderation` | button "Terminate" ×5 | Works | 1 API call(s), UI updated |
| `/admin/moderation` | button "Previous" | Disabled | Disabled in the current state (e.g. needs a selection / valid form / stock) |
| `/admin/moderation` | button "Next" | Disabled | Disabled in the current state (e.g. needs a selection / valid form / stock) |
| `/admin/moderation` | search "Search packages, vendors..." | Works | List re-rendered for the search text |
| `/admin/moderation` | select "All Statuses Pending Approved Rejected" | Works | Page updated for the chosen option |
| `/admin/payouts` | button "Refresh Ledger" | Works | 1 API call(s), UI updated |
| `/admin/payouts` | button "Pending Clearance (5)" | Works | Tab that is already active; switching tabs verified on other tabs |
| `/admin/payouts` | button "Settled History (1)" | Works | UI updated (modal/tab/toggle/validation) |
| `/admin/payouts` | button "BUTTON" ×5 | Works | UI updated (modal/tab/toggle/validation) |
| `/admin/payouts` | button "Release Payout" | Works | Asks window.confirm (crawler dismissed it); then PATCH /bookings/:id/settle (verified in API audit) |
| `/admin/payouts` | search "Search booking ID, event, vendor..." | Works | List re-rendered for the search text |
| `/admin/coordination` | button "Refresh" | Works | 3 API call(s), UI updated |
| `/admin/coordination` | button "Admin Operations Chat" | Works | Tab that is already active |
| `/admin/coordination` | button "Broadcast Alerts (0)" | Works | UI updated (modal/tab/toggle/validation) |
| `/admin/coordination` | button "Staff Recruitment (0)" | Works | UI updated (modal/tab/toggle/validation) |
| `/admin/coordination` | button "Send" | Disabled | Disabled in the current state (e.g. needs a selection / valid form / stock) |
| `/admin/logs` | button "3" | Works | UI updated (modal/tab/toggle/validation) |
| `/admin/logs` | button "Refresh" | Works | 1 API call(s), UI updated |
| `/admin/logs` | button "Load Older Logs (146 more)" | Works | UI updated (modal/tab/toggle/validation) |
| `/admin/logs` | search "Search logs..." | Works | List re-rendered for the search text |
| `/admin/logs` | select "All Activity Events Vendor Approvals API Calls S" | Works | Page updated for the chosen option |
| `/admin/settings` | button "Reload" | Works | 1 API call(s), UI updated |
| `/admin/settings` | button "BUTTON" ×2 | Works | UI updated (modal/tab/toggle/validation) |
| `/admin/settings` | button "Save All Settings" | Works | 1 API call(s), UI updated |
| `/vendor/dashboard` | button "Logout" | Works | Verified for all 5 roles: back to "/", protected pages then redirect to /signin |
| `/vendor/dashboard` | button "2" | Works | UI updated (modal/tab/toggle/validation) |
| `/vendor/dashboard` | button "Upcoming 1" | Works | Tab that is already active |
| `/vendor/dashboard` | button "Pending 1" | Works | UI updated (modal/tab/toggle/validation) |
| `/vendor/dashboard` | button "Past 5" | Works | UI updated (modal/tab/toggle/validation) |
| `/vendor/dashboard` | button "View All" | Works | UI updated (modal/tab/toggle/validation) |
| `/vendor/dashboard` | button "Review now" | Works | navigates to /vendor/events |
| `/vendor/dashboard` | button "1 Review Event" | Works | navigates to /vendor/events?status=pending |
| `/vendor/dashboard` | button "Manage Resources" | Works | navigates to /vendor/resources |
| `/vendor/dashboard` | button "Assign Staff" | Works | navigates to /vendor/staff |
| `/vendor/dashboard` | button "Add Package" | Works | navigates to /vendor/packages |
| `/vendor/dashboard` | button "Manage Inventory" | Works | navigates to /vendor/resources |
| `/vendor/dashboard` | button "Manage Staff Shifts" | Works | navigates to /vendor/staff |
| `/vendor/profile` | button "Edit Profile" | Works | UI updated (modal/tab/toggle/validation) |
| `/vendor/events` | button "1" | Works | UI updated (modal/tab/toggle/validation) |
| `/vendor/events` | button "Review Event" ×7 | Works | navigates to /vendor/events/EVT001/review |
| `/vendor/events` | button "Permanently Delete Event" | Works | UI delete verified on a throwaway record: EVT027 |
| `/vendor/events` | search "Search by event name, ID, venue, or client..." | Works | List re-rendered for the search text |
| `/vendor/events` | select "All Statuses Pending Confirmed Live Completed Re" | Works | Page updated for the chosen option |
| `/vendor/events` | select "All Event Types Conference Wedding Corporate Par" | Works | Page updated for the chosen option |
| `/vendor/events/EVT001/review` | button "1" | Works | UI updated (modal/tab/toggle/validation) |
| `/vendor/events/EVT001/review` | button "▶ Allocate" ×2 | Works | 2 API call(s), UI updated |
| `/vendor/events/EVT001/review` | button "Allocate Extra Staff" | Works | 2 API call(s), UI updated |
| `/vendor/events/EVT001/review` | button "+ Assign" | Works | Assigns the requested staff member (verified in the first crawl and in E2E flow 2); on the re-run he was already assigned |
| `/vendor/events/EVT001/review` | button "Delete this contingency plan" ×3 | Works | UI delete verified on a throwaway record: plans 3 -> 2 |
| `/vendor/events/EVT001/review` | button "Add Plan" | Works | Re-checked by hand: crawler click was covered by the welcome popup |
| `/vendor/events/EVT001/review` | button "Back to Requests" | Works | Re-checked by hand: navigates to /vendor/events |
| `/vendor/resources` | button "1" | Works | UI updated (modal/tab/toggle/validation) |
| `/vendor/resources` | button "More Filters" | Works | UI updated (modal/tab/toggle/validation) |
| `/vendor/resources` | button "Add Resource" | Works | UI updated (modal/tab/toggle/validation) |
| `/vendor/resources` | button "Allocate to Event" ×8 | Works | UI updated (modal/tab/toggle/validation) |
| `/vendor/resources` | button "Edit Resource" ×8 | Works | UI updated (modal/tab/toggle/validation) |
| `/vendor/resources` | button "Delete Resource" ×8 | Works | UI delete verified on a throwaway record: R014 deleted (row found via search; table is paginated) |
| `/vendor/resources` | search "Search resources by name or category..." | Works | List re-rendered for the search text |
| `/vendor/staff` | button "1" | Works | UI updated (modal/tab/toggle/validation) |
| `/vendor/staff` | button "More Filters" | Works | UI updated (modal/tab/toggle/validation) |
| `/vendor/staff` | button "Assign Extra Work" ×2 | Works | UI updated (modal/tab/toggle/validation) |
| `/vendor/staff` | button "Schedule" ×5 | Works | UI updated (modal/tab/toggle/validation) |
| `/vendor/staff` | button "Edit" ×5 | Works | UI updated (modal/tab/toggle/validation) |
| `/vendor/staff` | button "Delete" ×5 | Works | UI delete verified on a throwaway record: S015 deleted |
| `/vendor/staff` | button "Assign" ×3 | Works | UI updated (modal/tab/toggle/validation) |
| `/vendor/staff` | search "Search staff by name, role, or email..." | Works | List re-rendered for the search text |
| `/vendor/staff-onboarding` | button "1" | Works | UI updated (modal/tab/toggle/validation) |
| `/vendor/staff-onboarding` | button "Pending (0)" | Works | Tab that is already active |
| `/vendor/staff-onboarding` | button "Approved (1)" | Works | UI updated (modal/tab/toggle/validation) |
| `/vendor/staff-onboarding` | button "Rejected (1)" | Works | UI updated (modal/tab/toggle/validation) |
| `/vendor/packages` | button "1" | Works | UI updated (modal/tab/toggle/validation) |
| `/vendor/packages` | button "Add Package" | Works | UI updated (modal/tab/toggle/validation) |
| `/vendor/packages` | button "All" | Works | Filter that is already active |
| `/vendor/packages` | button "Wedding" | Works | UI updated (modal/tab/toggle/validation) |
| `/vendor/packages` | button "Birthday" | Works | UI updated (modal/tab/toggle/validation) |
| `/vendor/packages` | button "Conference" | Works | UI updated (modal/tab/toggle/validation) |
| `/vendor/packages` | button "Corporate" | Works | UI updated (modal/tab/toggle/validation) |
| `/vendor/packages` | button "Edit Package" ×5 | Works | UI updated (modal/tab/toggle/validation) |
| `/vendor/packages` | button "Delete Package" ×5 | Works | UI delete verified on a throwaway record: P006 |
| `/vendor/packages` | search "Search packages by name, description, or categor" | Works | List re-rendered for the search text |
| `/vendor/packages` | select "All Prices Under ₹2,000 ₹2,000 – ₹5,000 Over ₹5," | Works | Filter that is already active |
| `/vendor/packages` | select "All Capacities Small (< 100 guests) Medium (100–" | Works | Filter that is already active |
| `/vendor/monitoring` | button "1" | Works | UI updated (modal/tab/toggle/validation) |
| `/vendor/monitoring` | button "Update Bulletin" | Works | UI updated (modal/tab/toggle/validation) |
| `/vendor/monitoring` | button "Allocate Resources" | Works | navigates to /vendor/events/EVT008/review |
| `/vendor/monitoring` | button "Deploy Extra Staff" | Works | navigates to /vendor/events/EVT008/review |
| `/vendor/monitoring` | button "Conclude Event" | Partly works | Looks enabled but only acts when the selected event is LIVE; otherwise silently ignored (no message) |
| `/vendor/monitoring` | button "Advance Next" | Works | 2 API call(s), UI updated |
| `/vendor/monitoring` | button "Weather Emergency Move to indoor backup ballroom" | Works | 1 API call(s), UI updated |
| `/vendor/monitoring` | button "Power Outage Activate backup generators and batt" | Works | 1 API call(s), UI updated |
| `/vendor/monitoring` | button "Staff No-Show Deploy backup staff from reserve p" | Works | 1 API call(s), UI updated |
| `/vendor/coordination` | button "1" | Works | UI updated (modal/tab/toggle/validation) |
| `/vendor/coordination` | button "Client Enquiries (0)" | Works | Tab that is already active |
| `/vendor/coordination` | button "Live Events (1)" | Works | 1 API call(s), UI updated |
| `/vendor/coordination` | button "Send" | Works | Empty box is ignored by design |
| `/vendor/coordination` | search "Search conversations..." | Works | List re-rendered for the search text |
| `/vendor/issues` | button "1" | Works | UI updated (modal/tab/toggle/validation) |
| `/vendor/issues` | button "View issue" ×2 | Works | UI updated (modal/tab/toggle/validation) |
| `/vendor/issues` | button "Previous" | Disabled | Disabled in the current state (e.g. needs a selection / valid form / stock) |
| `/vendor/issues` | button "Next" | Disabled | Disabled in the current state (e.g. needs a selection / valid form / stock) |
| `/vendor/issues` | search "Search title, reporter or event..." | Works | List re-rendered for the search text |
| `/vendor/issues` | select "All Statuses Open In Progress Resolved" | Works | Page updated for the chosen option |
| `/vendor/issues` | select "Open In Progress Resolved" | Works | Page updated for the chosen option |
| `/vendor/issues` | select "?" | Works | Row status select (Open / In Progress / Resolved) → PATCH /issues/:id; crawler hit a select with a single option |
| `/vendor/report-issue` | button "1" | Works | UI updated (modal/tab/toggle/validation) |
| `/vendor/report-issue` | button "Issue on Event" | Works | Tab that is already active |
| `/vendor/report-issue` | button "Issue to Admin" | Works | navigates to /vendor/report-issue-admin |
| `/vendor/report-issue` | button "Low" | Works | UI updated (modal/tab/toggle/validation) |
| `/vendor/report-issue` | button "Medium" | Works | Priority chip that is already selected |
| `/vendor/report-issue` | button "High" | Works | UI updated (modal/tab/toggle/validation) |
| `/vendor/report-issue` | button "Critical" | Works | UI updated (modal/tab/toggle/validation) |
| `/vendor/report-issue` | button "Submit Incident Ticket" | Works | Native `required` validation stops the empty form |
| `/vendor/report-issue` | select "Resource / Equipment Defect Staffing / Attendanc" | Works | Form field: value is sent on submit (no page change expected) |
| `/vendor/report-issue` | select "-- Choose an Event -- Tech Summit 2026 (2026-05-" | Works | Form field: value is sent on submit |
| `/vendor/report-issue-admin` | button "1" | Works | UI updated (modal/tab/toggle/validation) |
| `/vendor/report-issue-admin` | button "Issue on Event" | Works | navigates to /vendor/report-issue |
| `/vendor/report-issue-admin` | button "Issue to Admin" | Works | Tab that is already active |
| `/vendor/report-issue-admin` | button "Low" | Works | UI updated (modal/tab/toggle/validation) |
| `/vendor/report-issue-admin` | button "Medium" | Works | Priority chip that is already selected |
| `/vendor/report-issue-admin` | button "High" | Works | UI updated (modal/tab/toggle/validation) |
| `/vendor/report-issue-admin` | button "Critical" | Works | UI updated (modal/tab/toggle/validation) |
| `/vendor/report-issue-admin` | button "Submit Incident Ticket" | Works | Native `required` validation stops the empty form |
| `/vendor/report-issue-admin` | select "Resource / Equipment Defect Staffing / Attendanc" | Works | Form field: value is sent on submit |
| `/vendor/verify-docs` | button "1" | Works | UI updated (modal/tab/toggle/validation) |
| `/vendor/verify-docs` | button "Remove" ×3 | Works | Traced: removes the chosen file from the local upload list (state only) |
| `/vendor/verify-docs` | button "Reset" | Works | UI updated (modal/tab/toggle/validation) |
| `/vendor/verify-docs` | button "Submit for Verification" | Works | UI updated (modal/tab/toggle/validation) |
| `/vendor/verify-docs` | select "Event Planning & Coordination Catering & Hospita" | Works | Form field: value is sent on submit |
| `/client/dashboard` | button "Logout" | Works | Verified for all 5 roles: back to "/", protected pages then redirect to /signin |
| `/client/dashboard` | button "10" | Works | UI updated (modal/tab/toggle/validation) |
| `/client/dashboard` | button "New Event" | Works | navigates to /client/create-event |
| `/client/dashboard` | button "Pay Invoices" | Works | navigates to /client/billing |
| `/client/dashboard` | button "Packages" | Works | navigates to /client/packages |
| `/client/dashboard` | button "Message" | Works | navigates to /client/messages |
| `/client/dashboard` | button "Go to Dashboard" | Works | Button of the "Welcome back" popup; closes it (used by every E2E login) |
| `/client/profile` | button "Edit Profile" | Works | UI updated (modal/tab/toggle/validation) |
| `/client/create-event` | button "10" | Works | UI updated (modal/tab/toggle/validation) |
| `/client/create-event` | button "1 Event Details" | Works | UI updated (modal/tab/toggle/validation) |
| `/client/create-event` | button "2 Resources" | Works | UI updated (modal/tab/toggle/validation) |
| `/client/create-event` | button "3 Staff" | Works | UI updated (modal/tab/toggle/validation) |
| `/client/create-event` | button "4 Review" | Works | UI updated (modal/tab/toggle/validation) |
| `/client/create-event` | button "Wedding" | Works | UI updated (modal/tab/toggle/validation) |
| `/client/create-event` | button "Birthday" | Works | UI updated (modal/tab/toggle/validation) |
| `/client/create-event` | button "Conference" | Works | UI updated (modal/tab/toggle/validation) |
| `/client/create-event` | button "Party" | Works | UI updated (modal/tab/toggle/validation) |
| `/client/create-event` | button "Corporate" | Works | UI updated (modal/tab/toggle/validation) |
| `/client/create-event` | button "Next: Resources" | Works | UI updated (modal/tab/toggle/validation) |
| `/client/create-event` | select "Let the vendor suggest one Grand Hotel Ballroom " | Works | Page updated for the chosen option |
| `/client/create-event` | select "Select budget range ₹1,000 - ₹5,000 ₹5,000 - ₹15" | Works | Page updated for the chosen option |
| `/client/events` | button "12" | Works | UI updated (modal/tab/toggle/validation) |
| `/client/events` | button "View Reason" | Works | UI updated (modal/tab/toggle/validation) |
| `/client/events` | button "Edit" ×2 | Works | 2 API call(s), UI updated |
| `/client/events` | button "Cancel" ×2 | Works | Asks window.confirm (crawler dismissed it); then PATCH /events/:id/cancel (verified in API audit) |
| `/client/events` | search "Search by Event ID, name or venue..." | Works | List re-rendered for the search text |
| `/client/events` | select "All Statuses Pending Approved Live Completed Rej" | Works | Page updated for the chosen option |
| `/client/events` | select "All Event Types Wedding Birthday Conference Part" | Works | Re-checked: choosing "Wedding" filters the list |
| `/client/track/EVT002` | button "12" | Works | UI updated (modal/tab/toggle/validation) |
| `/client/packages` | button "12" | Works | UI updated (modal/tab/toggle/validation) |
| `/client/packages` | button "All" | Works | Filter pill that is already active |
| `/client/packages` | button "Wedding" | Works | UI updated (modal/tab/toggle/validation) |
| `/client/packages` | button "Birthday" | Works | UI updated (modal/tab/toggle/validation) |
| `/client/packages` | button "Conference" | Works | UI updated (modal/tab/toggle/validation) |
| `/client/packages` | button "Corporate" | Works | UI updated (modal/tab/toggle/validation) |
| `/client/packages` | button "Party" | Works | UI updated (modal/tab/toggle/validation) |
| `/client/packages` | button "Quick Create" ×4 | Works | 2 API call(s), UI updated |
| `/client/packages` | search "Search packages or services..." | Works | List re-rendered for the search text |
| `/client/messages` | button "Attach photo or floorplan" | Works | Opens the native file picker (hidden <input type=file>) |
| `/client/messages` | button "Add reaction" | Works | UI updated (modal/tab/toggle/validation) |
| `/client/messages` | button "Send message" | Disabled | Disabled in the current state (e.g. needs a selection / valid form / stock) |
| `/client/messages` | search "Filter events..." | Works | List re-rendered for the search text |
| `/client/live-monitoring` | button "12" | Works | UI updated (modal/tab/toggle/validation) |
| `/client/billing` | button "12" | Works | UI updated (modal/tab/toggle/validation) |
| `/client/billing` | button "Invoice" ×5 | Works | Re-checked: downloads INV-BK001.txt |
| `/client/billing` | button "Pay Now" ×3 | Works | 1 API call(s), UI updated |
| `/client/billing` | button "Previous" | Disabled | Disabled in the current state (e.g. needs a selection / valid form / stock) |
| `/client/billing` | button "Next" | Not verified | Pagination button; during the re-run it was covered by the welcome popup, so its click could not be confirmed |
| `/client/billing` | search "Search Invoice # or Event..." | Works | List re-rendered for the search text |
| `/client/billing` | select "All Invoices Balance Due Paid in Full" | Works | Page updated for the chosen option |
| `/client/report-issue` | button "12" | Works | UI updated (modal/tab/toggle/validation) |
| `/client/report-issue` | button "Event Team" | Works | Tab that is already active |
| `/client/report-issue` | button "Admin" | Works | UI updated (modal/tab/toggle/validation) |
| `/client/report-issue` | button "Cancel" | Works | navigates to /client/dashboard |
| `/client/report-issue` | button "Submit Issue" | Works | UI updated (modal/tab/toggle/validation) |
| `/client/report-issue` | select "Select Priority 🔴 Critical 🟠 High 🟡 Medium 🟢" | Works | Page updated for the chosen option |
| `/client/report-issue` | select "Select Event E2E Flow Gala 1794595855720" | Works | Page updated for the chosen option |
| `/staff/dashboard` | button "Logout" | Works | Verified for all 5 roles: back to "/", protected pages then redirect to /signin |
| `/staff/dashboard` | button "✓ Update Task Status" | Works | navigates to /staff/task-board |
| `/staff/dashboard` | button "💬 Message Vendor" | Works | navigates to /staff/messages |
| `/staff/dashboard` | button "⚠ Report Issue" | Works | navigates to /staff/report-issue |
| `/staff/dashboard` | button "📅 View Schedule" | Works | navigates to /staff/schedule |
| `/staff/profile` | button "Edit Profile" | Works | UI updated (modal/tab/toggle/validation) |
| `/staff/assigned-events` | button "All" | Works | Filter that is already active |
| `/staff/assigned-events` | button "Pending" | Works | UI updated (modal/tab/toggle/validation) |
| `/staff/assigned-events` | button "Accepted" | Works | UI updated (modal/tab/toggle/validation) |
| `/staff/assigned-events` | button "Rejected" | Works | UI updated (modal/tab/toggle/validation) |
| `/staff/assigned-events` | button "View Tasks" ×2 | Works | navigates to /staff/task-board |
| `/staff/assigned-events` | button "Message" ×2 | Works | navigates to /staff/messages |
| `/staff/schedule` | button "Day" | Works | UI updated (modal/tab/toggle/validation) |
| `/staff/schedule` | button "Week" | Works | UI updated (modal/tab/toggle/validation) |
| `/staff/schedule` | button "Month" | Partly works | Day / Week / Month only move the highlight; the calendar always shows the month (same in the HTML page) |
| `/staff/schedule` | button "‹" | Works | UI updated (modal/tab/toggle/validation) |
| `/staff/schedule` | button "›" | Works | UI updated (modal/tab/toggle/validation) |
| `/staff/report-issue` | button "Submit Issue Report" | Works | UI updated (modal/tab/toggle/validation) |
| `/staff/report-issue` | button "Cancel" | Works | navigates to /staff/performance |
| `/staff/report-issue` | select "Select priority Low Medium High Critical" | Works | Page updated for the chosen option |
| `/staff/report-issue` | select "Select category Technical Logistics Staff Vendor" | Works | Page updated for the chosen option |
| `/staff/report-issue` | select "Select event if applicable Tech Summit 2026 Sara" | Works | Page updated for the chosen option |
| `/staff/messages` | button "New Request" | Works | UI updated (modal/tab/toggle/validation) |
| `/staff/messages` | button "Attach checklist or image" | Works | Opens the native file picker |
| `/staff/messages` | button "Add emoji" | Works | UI updated (modal/tab/toggle/validation) |
| `/staff/messages` | button "Send message" | Disabled | Disabled in the current state (e.g. needs a selection / valid form / stock) |
| `/staff/messages` | search "Search conversations..." | Works | List re-rendered for the search text |
| `/staff/admin-messages` | button "⋮" | Does nothing | Decorative, exactly as in MessagesAdmin.html (no handler there either) |
| `/staff/admin-messages` | button "📎" | Does nothing | Decorative, exactly as in MessagesAdmin.html |
| `/staff/admin-messages` | button "😊" | Does nothing | Decorative, exactly as in MessagesAdmin.html |
| `/staff/admin-messages` | button "Send" | Works | Empty box is ignored by design; sending verified in E2E flow 4 |
| `/staff/report-admin` | button "1" | Does nothing | Notification bell is decorative, exactly as in ReportAdmin.html |
| `/staff/report-admin` | button "Submit Issue Report" | Works | UI updated (modal/tab/toggle/validation) |
| `/staff/report-admin` | button "Cancel" | Works | Clears the form (form was already empty); HTML version threw a ReferenceError |
| `/staff/report-admin` | select "Select Priority 🔴 Critical 🟠 High 🟡 Medium 🟢" | Works | Page updated for the chosen option |
| `/staff/report-admin` | select "Select Category Platform Bug Payment Issue Accou" | Works | Page updated for the chosen option |
| `/superuser/dashboard` | button "Logout" | Works | Verified for all 5 roles: back to "/", protected pages then redirect to /signin |
| `/superuser/users` | button "+ Create User" | Works | UI updated (modal/tab/toggle/validation) |
| `/superuser/users` | button "✏" ×10 | Works | UI updated (modal/tab/toggle/validation) |
| `/superuser/users` | button "🗑" ×10 | Works | UI delete + confirm verified: U020 deleted via API |
| `/superuser/users` | search "Search by name, email, or role..." | Works | List re-rendered for the search text |
| `/superuser/events` | button "+ Add Event" | Works | UI updated (modal/tab/toggle/validation) |
| `/superuser/events` | button "👁" ×10 | Works | UI updated (modal/tab/toggle/validation) |
| `/superuser/events` | button "✏" ×10 | Works | UI updated (modal/tab/toggle/validation) |
| `/superuser/events` | button "🗑" ×10 | Works | UI delete + confirm verified: EVT027 deleted via API |
| `/superuser/events` | search "Search events, clients, venues, or vendors..." | Works | List re-rendered for the search text |
| `/superuser/resources` | button "+ Add Resource" | Works | UI updated (modal/tab/toggle/validation) |
| `/superuser/resources` | button "✏" ×12 | Works | UI updated (modal/tab/toggle/validation) |
| `/superuser/resources` | button "🗑" ×12 | Works | UI delete + confirm verified: R013 deleted via API |
| `/superuser/resources` | search "Search resources by name, category, or vendor..." | Works | List re-rendered for the search text |
| `/superuser/staff` | button "+ Add Staff" | Works | UI updated (modal/tab/toggle/validation) |
| `/superuser/staff` | button "✏" ×7 | Works | UI updated (modal/tab/toggle/validation) |
| `/superuser/staff` | button "🗑" ×7 | Works | UI delete + confirm verified: S014 deleted via API |
| `/superuser/staff` | search "Search staff members by name, role, or vendor..." | Works | List re-rendered for the search text |
| `/superuser/bookings` | button "+ Add Booking" | Works | UI updated (modal/tab/toggle/validation) |
| `/superuser/bookings` | button "👁" ×6 | Works | UI updated (modal/tab/toggle/validation) |
| `/superuser/bookings` | button "✏" ×6 | Works | UI updated (modal/tab/toggle/validation) |
| `/superuser/bookings` | button "🗑" ×6 | Works | UI delete + confirm verified: BK008 deleted via API |
| `/superuser/bookings` | search "Search bookings by event, client, vendor, or ID." | Works | List re-rendered for the search text |
| `/superuser/reports` | button "Export Master CSV" | Works | UI updated (modal/tab/toggle/validation) |
| `/superuser/reports` | button "Refresh" | Works | 4 API call(s), UI updated |
| `/superuser/settings` | button "Reload" | Works | 1 API call(s), UI updated |
| `/superuser/settings` | button "BUTTON" ×3 | Works | UI updated (modal/tab/toggle/validation) |
| `/superuser/settings` | button "Save Engine Settings" | Works | 1 API call(s), UI updated |
| `/superuser/report-issue` | button "Dispatch Incident Alert" | Works | Native `required` validation stops the empty form |
| `/superuser/report-issue` | select "Infrastructure Security & Safety Vendor Dispute " | Works | Page updated for the chosen option |
| `/superuser/report-issue` | select "Critical (P0) High (P1) Medium (P2) Low (P3)" | Works | Page updated for the chosen option |
| `/superuser/report-issue` | select "None / Platform-wide EVT001 — Tech Summit 2026 E" | Works | Page updated for the chosen option |

---

## 6a. Security fixes applied (after the first report)

All re-verified against the running backend (full audit re-run: role matrix 564/564, endpoint cases as expected, probes below) and by 14 new unit tests in `back-end/src/modules/security-rules.spec.ts`. The 31-step UI flow test and a full five-role crawl were re-run afterwards: 31/31 pass, 0 console errors, no 401/403 on any page.

| Problem | Fix | Verified |
|---|---|---|
| `PUT /users/profile {"role":"Admin"}` made anyone Admin | New `UpdateProfileDto` class (unknown fields → 400) **and** the service copies only `PROFILE_FIELDS`; a changed email must not belong to another account | role change → 400, role stays Client; Profile pages (name/email/phone…) still save → 200; email of another account → 400 |
| Master reset code `123456` | Bypass removed; only the code made for that email works; the code is thrown away after 5 wrong guesses | `123456` → 400; real code after 5 wrong tries → 400 |
| `forgot-password` returned the code | Code no longer in the response. No email service exists yet, so in development it is printed in the backend console (`[DEV ONLY] Password reset code for …`); in production it is not shown | response has no `otp`; reset with the code from the console log → 201 |
| Hard-coded JWT secret | `common/security/jwt-secret.ts`: uses `JWT_SECRET` (≥ 32 chars, not the example placeholder); development without it = random secret per run (warning logged); production without it = refuse to start | token signed with `eventpro_secret_key` → 401 |
| `PUT /state/:key` could overwrite any collection | Allowlist of writable keys, each with the roles that use it in the React app (chat, notifications, allocations, venue/contingency/monitor data, settings, recruitments); everything else → 403 | client `PUT /state/bookings` → 403; admin `PUT /state/<unknown>` → 403; all React writes still work |
| Clients could edit/delete other clients' events and approve their own | Clients may only update/delete events whose `clientId` is theirs, may not set status/approval/client/vendor fields, and new client events are always `pending` and owned by the caller | other client's event: PATCH/DELETE → 403; `{status:'confirmed'}` → 403; own edit/delete → 200 |
| Staff could edit any staff record | Staff may only PATCH their own record (matched by user id / email) and only `workload` (what the Task Board sends) | other record → 403; own role → 403; own workload → 200 |

**Side effect to know about:** the old HTML pages in `front-end/` also wrote `liveEvents`, `staffTasks` and `vendorDocSubmission` through the state store; those writes now get 403. The React app never writes those keys and is not affected.

**To keep logins across restarts**, create `back-end/.env` with a real secret:
`JWT_SECRET=` + the output of `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

## 6. Everything that is not working — most serious first

| # | Severity | Problem | Where | Suggested fix |
|---|---|---|---|---|
| 1 | ✅ FIXED (was 🔴 Critical) | Any signed-in user can make themselves **Admin**: `PUT /api/users/profile {"role":"Admin"}` is accepted and saved | `users.service` profile update / DTO | Use a dedicated `UpdateProfileDto` with only name/phone/bio/etc.; never copy `role`, `status`, `email`, `passwordHash` from the body |
| 2 | ✅ FIXED (was 🔴 Critical) | `POST /api/auth/reset-password` accepts the master code **`123456`** for any account → anyone can take over any account, including admin | `auth.service.ts` `resetPassword` | Delete the `|| dto.otp === '123456'` bypass |
| 3 | ✅ FIXED (was 🔴 Critical) | JWT secret falls back to the hard-coded `eventpro_secret_key`; tokens forged with it are accepted as admin | `auth.module.ts`, `jwt.strategy.ts` | Refuse to start without `JWT_SECRET` (throw at boot); put a long random secret in `.env` |
| 4 | ✅ FIXED (was 🔴 Critical) | `PUT /api/state/:key` lets **every role** overwrite any collection (`bookings`, `users`, `events`, `resources`, …) | `analytics.service.ts` `setStateKey` | Allowlist of writable keys per role (e.g. chat, progress, contingency); block all core collections; `resourceAllocations` is now validated but should also be vendor/admin-only |
| 5 | 🔴 Critical (blocking) | React app cannot log in with the shipped config (CORS allowlist empty / missing `localhost:5173`) | `cors.config.ts`, `.env.example` | `.env.example` fixed; also default to `http://localhost:5173` when `NODE_ENV !== 'production'`, and document `cp .env.example .env` in the README |
| 6 | ✅ FIXED (was 🟠 High) | `POST /api/auth/forgot-password` returns the OTP in the response | `auth.service.ts` | Never return the code; send it by email (or log it server-side in dev only) |
| 7 | ✅ FIXED (was 🟠 High) | A client can edit and delete **other clients'** events, and can set `status: "confirmed"` on their own event (auto-creates a booking without vendor approval) | `events.service.ts` `update`/`remove` | Check `event.clientId === req.user.id` for clients; strip `status`, `quotedPrice`, `approvedAt` from client updates; status only through `PATCH /:id/status` |
| 8 | ✅ FIXED (was 🟠 High) | Staff can `PATCH /api/staff/:id` on **any** staff record | `staff.service.ts` | Staff may only update their own record and only safe fields |
| 9 | 🟠 High | `GET /api/state/users` and `GET /api/snapshot` give every role all users (emails, phones), bookings and payouts | `analytics.service.ts` | Scope the snapshot per role; remove `users`/`bookings` from the generic state reader |
| 10 | 🟠 High | Admin replies in the Coordination Hub are saved without `recipientEmail`, so staff/clients never see them (the HTML had the same gap) | `pages/admin/CoordinationHub.jsx` `handleSendMessage` | Let the admin pick a conversation and save `recipientEmail` on each reply |
| 11 | 🟡 Medium | A vendor can read another vendor's payouts (`GET /vendors/V003/payouts` as V001) | `vendors.controller/service` | For vendors, require `id` to be their own vendor id |
| 12 | 🟡 Medium | `PATCH /api/packages/:id/decision` accepts any status (no validation) | `packages.controller.ts` | Use the existing `DecisionDto` |
| 13 | 🟡 Medium | SQL schema is out of date and unused (see 4.4) | `Database/*.sql` | Update the enums/columns or mark the file as documentation of an older design |
| 14 | 🟡 Medium | Superuser Staff page writes `status: Active/Inactive`, but the backend overwrites `status` with `assigned/available` on every assignment change, so the "Active" count is wrong | `superuser/Staff.jsx`, `DataService.triggerStaffAssignmentChanged` | Store employment status in a separate field (e.g. `employment`) |
| 15 | 🟡 Medium | Vendor Monitoring "Conclude Event" looks enabled but silently does nothing unless the event is live | `pages/vendor/Monitoring.jsx` | Disable the button with a tooltip, or show a toast explaining why |
| 16 | 🟡 Medium | 3 root test scripts are outdated and fail (4.5) | `test-auth-flow.js`, `test-commission-revenue-model.js`, `test-issue-render.js` | Pass a `JwtService`; pay before settling; point at the React page or remove |
| 17 | 🟢 Low | `data.service.spec.ts` writes to the real `back-end/data/database.json`; `test-persistence-integrity.js` deletes it | tests | Point `DataService` at a temp file in tests (constructor option / env var) |
| 18 | 🟢 Low | Staff Schedule Day/Week buttons only move the highlight (same in HTML) | `pages/staff/Schedule.jsx` | Render a day/week list for those modes, or remove the buttons |
| 19 | 🟢 Low | Decorative controls with no action: Admin Coordination ⋮ 📎 😊, Report-to-Admin bell (same as HTML) | `MessagesAdmin.jsx`, `ReportAdmin.jsx` | Wire them up or hide them |
| 20 | 🟢 Low | Vendor can allocate other vendors' resources on Event Review (e.g. Sarah/V001 allocating V003's projectors) — allowed by design for multi-vendor events, but nothing tells the owning vendor | `EventReview.jsx` | Confirm intended; notify the owning vendor |
| 21 | 🟢 Low | Main JS bundle is 1.16 MB (Vite warning) | `frontend-react` | Lazy-load role sections with `React.lazy` |

Fixed during this session: date-blind resource blocking (section 2), missing staff pages, unreachable superuser Staff page, superuser forms skipping validation, HTML ReportAdmin Cancel error, CORS origin missing from `.env.example`, `new EventsService(ds)` compatibility for the root scripts.

---

## 7. Files created or changed

**Created**
- `back-end/src/common/security/jwt-secret.ts` — JWT secret rules (no hard-coded fallback)
- `back-end/src/modules/security-rules.spec.ts` — 14 unit tests for the security fixes
- `back-end/src/modules/resources/resource-availability.ts` — availability rule (pure functions)
- `back-end/src/modules/resources/resource-availability.spec.ts` — 16 unit tests
- `frontend-react/src/pages/staff/MessagesAdmin.jsx` — Admin Coordination page
- `frontend-react/src/pages/staff/ReportAdmin.jsx` — Report Issue to Admin page
- `TEST_REPORT.md` — this report

**Changed — backend**
- `back-end/.env.example` — Vite origins added to `CORS_ORIGINS`
- `back-end/src/database/data.service.ts` — `available` no longer depends on allocations on other dates
- `back-end/src/domain/models.ts` — `EventRecord.endDate`
- `back-end/src/modules/events/dto.ts` — optional `endDate`
- `back-end/src/modules/events/events.service.ts` — request check on create, re-check on date change
- `back-end/src/modules/events/events.module.ts` — imports `ResourcesModule`
- `back-end/src/modules/analytics/analytics.service.ts` — validates `resourceAllocations` writes
- `back-end/src/modules/analytics/analytics.module.ts` — imports `ResourcesModule`
- `back-end/src/modules/resources/resources.service.ts` — `getAvailableQuantity`, report, assertion helpers
- `back-end/src/modules/resources/resources.controller.ts` — two availability endpoints
- `back-end/src/modules/resources/resources.module.ts` — exports `ResourcesService`
- `back-end/src/modules/resources/dto.ts` — `AvailabilityQueryDto`

**Changed — security fixes**
- `back-end/src/modules/users/dto.ts`, `users.controller.ts`, `users.service.ts` — profile DTO + field whitelist + email uniqueness
- `back-end/src/modules/auth/auth.service.ts` — no master code, no code in response, 5-try lockout, dev console log
- `back-end/src/modules/auth/auth.module.ts`, `jwt.strategy.ts` — `getJwtSecret()`
- `back-end/src/modules/analytics/analytics.service.ts`, `analytics.controller.ts` — writable-key allowlist per role
- `back-end/src/modules/events/events.service.ts`, `events.controller.ts` — client ownership + locked fields
- `back-end/src/modules/staff/staff.service.ts`, `staff.controller.ts` — staff may only update own workload
- `back-end/.env.example` — how to generate a real `JWT_SECRET`

**Changed — frontend**
- `frontend-react/src/services/resourceService.js` — `getResourceAvailability`, `getResourceAvailabilityMap`
- `frontend-react/src/services/staffApi.js` — `fetchAdminChat`, `postAdminChatMessage`
- `frontend-react/src/components/client/useCreateEventWizard.js` — backend availability per date/time
- `frontend-react/src/components/client/ResourceSelectionStep.jsx` — "N available on DATE", `+` capped
- `frontend-react/src/pages/client/CreateEvent.jsx` — passes the event date
- `frontend-react/src/pages/client/client.css` — availability label style
- `frontend-react/src/pages/vendor/EventReview.jsx` — backend availability, 400 messages shown
- `frontend-react/src/components/vendor/useVendorResourcesData.js` — backend availability, "free today", add-more fix
- `frontend-react/src/components/vendor/ResourceTableRow.jsx` — Allocate not blocked by other dates
- `frontend-react/src/components/vendor/ResourceTable.jsx` — column "Quantity (Free Today / Total)"
- `frontend-react/src/pages/superuser/Users.jsx`, `Events.jsx`, `Bookings.jsx`, `Resources.jsx`, `Staff.jsx` — "Select…" placeholders as in the HTML
- `frontend-react/src/routes/AppRoutes.jsx` — 3 routes
- `frontend-react/src/routes/roleRoutes.js` — 3 menu items
- `frontend-react/src/styles/staff.css` — styles for the two new staff pages

**Changed — later requests**
- `frontend-react/src/components/WelcomeOverlay.jsx` (new) + `src/styles/welcome-overlay.css` (new) — "Welcome back" popup for all five roles (role-specific message, as in the HTML version); mounted in all 5 `layouts/*.jsx`. The old `components/client/WelcomeOverlay.jsx` is no longer used.
- Overnight / multi-day events: optional **End Date** in Create Event (`EventDetailsStep.jsx`, `useCreateEventWizard.js`, `ReviewStep.jsx`, `client.css`) and Edit Event (`EditEventModal.jsx`); shared rule in `utils/clientHelpers.js` (`eventEndError`, `eventDurationMinutes`); backend `events.service.ts` schedules the real end (e.g. 9 PM → 12 AM next day) and rejects an end date before the start; 6 tests in `back-end/src/modules/events/event-schedule.spec.ts` (Jest now 5 suites, 45/45).

Not in the repository (git-ignored / temporary): `back-end/data/database.json` was restored to its pre-test copy; dummy PDFs uploaded by the tests were removed; test scripts live outside the project.
