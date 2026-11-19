# Project Context — EventPro / Checkmate (handoff for a new Claude session)

Read this first. It describes the project, how to run it, what was done in earlier sessions, the rules the owner wants followed, and what is still open. Last updated 2026-11-19 (after Phase 2: audit fixes).

---

## 1. What the project is

**EventPro / Checkmate** is a college Full-Stack Development team project (repo `IIIT-Sricity-FSD-2024-2028/47_Checkmate` on GitHub). It is an **event management system** with five user roles:

| Role | What they do |
|---|---|
| **Client** | Creates event requests (date, time, guests, venue, budget), picks resources and staff, tracks progress, pays bookings, messages vendor/admin, reports issues |
| **Vendor** | Reviews client requests, allocates resources / staff / venue, sets the final price and approves, manages inventory, staff, packages, live monitoring |
| **Staff** | Accepts assigned events, task board, schedule, performance, progress updates during live events, reports issues, chats with admin |
| **Admin** | Approves vendor applications, manages users, monitors events, issue tracking, payouts, platform settings |
| **Superuser** | Views/edits all data: users, events, resources, staff, bookings, reports, settings |

Event lifecycle: `pending → (waiting) → confirmed/approved → live → completed` (or `rejected` / `cancelled`). Approving creates a **booking** (platform keeps a commission, default 10%, vendor gets the rest after the client pays and the event completes).

---

## 2. Repository layout

```
47_Checkmate/
├── back-end/            NestJS 11 API (TypeScript)        → http://localhost:3000/api
│   ├── src/modules/     auth, users, events, resources, bookings, staff, staff-onboarding,
│   │                    vendors, packages, issues, messages, analytics (snapshot + /state/:key)
│   ├── src/database/    data.service.ts (JSON "database" + triggers), seed.ts
│   ├── src/domain/      models.ts (TypeScript interfaces)
│   ├── src/common/      guards (JWT + roles), security (cors, jwt-secret, rate limit), logging, uploads
│   ├── data/database.json   the live data (git-ignored; created from seed.ts on first run)
│   └── .env             local config (git-ignored) — copy from .env.example
├── frontend-react/      React 19 + Vite 8 + react-router 7 + lucide-react → http://localhost:5173
│   └── src/ pages/<role>/, components/<role>/, layouts/, routes/ (AppRoutes.jsx, roleRoutes.js),
│            services/ (one file per API area, all fetch + async/await), styles/, utils/
├── front-end/           ORIGINAL HTML/CSS/JS version (reference for the React conversion)
├── Database/            SQL schema (documentation only — the app does NOT use SQL)
├── TEST_REPORT.md       full QA report from the last session (merge, availability, audit, UI test)
└── PROJECT_CONTEXT.md   this file
```

**Data storage:** there is no SQL database. All data lives in memory and is written to `back-end/data/database.json` after every change (survives restarts). `DataService` also acts like DB triggers (e.g. confirming an event auto-creates a booking; completing/cancelling releases resources and staff).

**Auth:** real signed JWTs. Login returns a token; the frontend sends `Authorization: Bearer <token>`. Roles are checked by `@Roles(...)` on every route (guards in `back-end/src/common/guards`). The `x-role` header the frontend also sends is ignored by the backend.

---

## 3. How to run it

One-time setup:
```bash
cd back-end
cp .env.example .env
# put your own random value (≥ 32 chars) in JWT_SECRET, e.g.:
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
npm install
cd ../frontend-react && npm install
```

Every time (two terminals):
```bash
# Terminal 1
cd back-end && npm start            # builds then runs; wait for "Nest application successfully started"
# Terminal 2
cd frontend-react && npm run dev    # open http://localhost:5173
```

- Without `back-end/.env` the site shows **"Failed to fetch"** on login (CORS blocks `localhost:5173`). `.env` must exist **before** the backend starts.
- After changing backend code, restart the backend (`Ctrl+C`, `npm start`). Frontend reloads by itself.
- Forgot-password codes are printed in the **backend terminal** in development (`[DEV ONLY] Password reset code for …`), never shown on the website.
- Login is rate-limited: 20 attempts / 15 min (restart backend to reset).
- Login session is shared across tabs (localStorage) — test one role at a time with Logout, or use two different browsers.

Seed accounts:

| Role | Email | Password |
|---|---|---|
| Admin | aarav.admin@checkmate.com | Aarav@2026 |
| Superuser | nina.ops@checkmate.com | Nina@2026 |
| Vendor | sarah@eliteevents.com | Sarah@2026 |
| Client | emily.client@example.com | Emily@2026 |
| Staff | mike.staff@eliteevents.com | Mike@2026 |

Seed events are dated May–July 2026, which is now in the past, so the backend scheduler has marked them completed. **Use future dates (e.g. 2027) when testing.**

Tests / builds:
```bash
cd back-end && npx jest            # 12 suites, 108 tests, all passing (never touches data/database.json)
cd back-end && npx nest build
cd frontend-react && npm run build
```
Note: `back-end/src/database/data.service.spec.ts` writes into the real `data/database.json`; back it up first if the data matters.

---

## 4. Git branches and state

| Branch | State |
|---|---|
| `hemanth` | **Working branch.** GitHub has `877efbc`; Phase 2 commits (`3522de5` … latest) are **local only, not pushed**. |
| `vendor-react` | Teammate branch — **read only, never modify** (`2c582d0`) |
| `main` | **Read only, never modify** (`3c3cd70`) |
| `hemanth-backup-before-vendor-merge` | Local backup of old hemanth (`f3009d0`), not pushed |
| `staff-html-match` | Other local branch with earlier staff-page work; only used as reference |

---

## 5. Rules the owner wants followed

- **Never push unless the owner explicitly asks.** Never force-push, never open PRs unless asked.
- **Never modify, reset, rebase, rename or delete `main` or `vendor-react`.** Only read from them.
- Never delete working code to make something pass; never fake a result — say plainly when something is broken.
- Keep code simple and readable, in the existing comment style: a block comment at the top of each file, and a comment above every `useState`, `useEffect` and function (many staff pages also use "FACULTY MAY ASK / HOW TO CHANGE" comments — this is a college project that gets explained in a viva).
- React pages: `useState` / `useEffect` / `.map()`; `fetch` with async/await through a **service file**; no `innerHTML`, `querySelector`, `window.DB` or sync XHR.
- Router files (`AppRoutes.jsx`, `roleRoutes.js`) are shared — keep edits small.
- Don't commit `back-end/.env` or `back-end/data/database.json` (both git-ignored).
- The owner prefers short, casual explanations and wants things tested in the real app before being called done.

---

## 6. What was done in the previous session (all on `hemanth`, commit `877efbc`)

### 6.1 Merge
`vendor-react` merged into `hemanth` (merge commit `0ee7525`). It was conflict-free because hemanth had no commits of its own after branching.

### 6.2 Date-based resource availability (main feature)
Before: a resource allocated to *any* event was treated as unavailable on every date. Now availability depends on the event's **date/time window**:
- Core rule: `back-end/src/modules/resources/resource-availability.ts` (pure functions) — counts only events whose window overlaps, ignores rejected/cancelled/declined/completed events and released allocations, ignores the event being edited, supports multi-day (`endDate`) and past-midnight events. `available = total stock − units held in the overlapping window`.
- `ResourcesService.getAvailableQuantity(resourceId, date, excludeEventId)`.
- Enforced on: event create (requested resources), event date change, and saving allocations (`PUT /api/state/resourceAllocations`). Over-booking returns **400**, e.g. *"Only 2 of 10 HD Laser Projector & Screen are free on 2030-01-10 (requested 8)."*
- New endpoints: `GET /api/resources/availability?date=&endDate=&time=&endTime=&excludeEventId=` (or `?eventId=`) and `GET /api/resources/:id/availability`.
- Frontend uses it: client Create Event wizard (cards show "N available on DATE" / "Fully booked", `+` disabled at the limit), vendor Event Review, vendor Manage Resources.
- Tests: `resource-availability.spec.ts` (16 tests).

### 6.3 HTML → React conversion (staff + superuser)
- Created `frontend-react/src/pages/staff/MessagesAdmin.jsx` (route `/staff/admin-messages`, menu "Admin Coordination") and `ReportAdmin.jsx` (route `/staff/report-admin`, menu "Issue to Admin"), converted from `front-end/pages/staff/*.html`. CSS added to `styles/staff.css` (ReportAdmin styles scoped under `.ri-admin-page`).
- Superuser Staff page existed but had no route — added `/superuser/staff` + menu item.
- Superuser forms (Users, Events, Bookings, Resources, Staff) start on "Select…" again so validation works like the HTML.

### 6.4 Security fixes (found in the backend audit, all fixed and re-tested)
- `PUT /users/profile` can no longer change `role`/`status` (new `UpdateProfileDto` + field whitelist); a new email must not belong to another account.
- Password reset: no master code `123456`, code not returned in the response, code thrown away after 5 wrong tries.
- No hard-coded JWT secret: `back-end/src/common/security/jwt-secret.ts` (uses `JWT_SECRET` from `.env`; random per run in dev if missing; production refuses to start without it).
- `PUT /api/state/:key` only accepts an allowlist of keys per role (chat, notifications, allocations, venue/contingency/monitor data, settings, recruitments); core collections → 403.
- Clients can only edit/delete their **own** events, cannot set status/approval fields; new client events are always `pending` and owned by the caller.
- Staff can only update their **own** staff record, and only `workload`.
- Tests: `back-end/src/modules/security-rules.spec.ts` (14 tests).

### 6.5 Later additions
- **Welcome popup for all roles:** `frontend-react/src/components/WelcomeOverlay.jsx` + `styles/welcome-overlay.css`, mounted in all 5 layouts, role-specific message (old `components/client/WelcomeOverlay.jsx` is now unused).
- **End Date for overnight/multi-day events** (e.g. 9 PM → 12 AM next day): in Create Event and Edit Event; shared rule in `utils/clientHelpers.js` (`eventEndError`, `eventDurationMinutes`); backend scheduler ends the event at the real end time and rejects an end date before the start date. Tests: `events/event-schedule.spec.ts` (6 tests).

### 6.6 Testing done
Full results in `TEST_REPORT.md`: 94 endpoints × 6 callers role-guard matrix (all correct), endpoint success/bad-input cases, browser test of every page and button for all 5 roles (Playwright), and a 31-step end-to-end flow (client creates event → vendor allocates and approves → staff accepts and works → issues → admin approves vendor → superuser views data → date-availability proof) — all passing.

---

## 6b. Phase 2 (2026-11-18/19) — see AUDIT.md, REVENUE_MODEL.md, TEST_REPORT.md §8
1. Money: booking follows its event; cancellation fee % (Global Settings, default 0); vendors cannot edit bookings; per-role money views. `back-end/src/database/booking-rules.ts`.
2. Staff profiles (experience, skills, events completed, rating / "New") + vendor-only 1–5★ ratings after completion. `modules/staff/staff-profile.ts`, `components/StaffProfileModal.jsx`, `components/vendor/StaffRatingCard.jsx`. "Unavailable" is date-based.
3. Client staff picks are *preferences*; vendor Confirm / Replace in Event Review.
4. Every reject / cancel / decline asks a reason (`components/ReasonModal.jsx`); saved with who did it; other party notified.
5. Date rules: clients book ≥ 7 days ahead, cancel only > 3 days ahead (`events/event-date-rules.ts`, `utils/dateRules.js`).
6. Live chat: Socket.IO gateway (`modules/messages/messages.gateway.ts`), `hooks/useLiveChat.js` (3 s polling fallback), unread counts, `GET/POST /api/admin-chat` (admin replies need recipientEmail).
7. Data exposure closed (snapshot, users, events/bookings for clients, vendor payouts), package DTO, Schedule views, overnight dates, root scripts fixed and moved to a temp data folder.

Owner decisions: cancellation fee = % of price split like normal revenue; client cancel only pending/waiting; 7-day rule clients only; Socket.IO allowed.

## 7. Still open (not fixed yet)
1. `/issues` and `/staff-assignments` are readable by every role (not scoped); `/vendor-applications` readable by any vendor.
2. Issue reporter name/email come from the request body.
3. Superuser Staff page `status` is overwritten by assignment changes.
4. Events go live only by the scheduler at their real start time (tests use the status API to simulate it).
5. Staff and clients never chat directly (by design: each talks to the vendor).
6. SQL schema in `Database/` is out of date; Dependabot alerts on `main`.
7. Old HTML pages in `front-end/` can no longer use `/snapshot`, `/state/users`, `/state/adminChatMessages`.
8. Payments, refunds and payouts are simulated.

Round 3 (2026-11-19, NOT committed — owner said don't commit): chat root cause + fixes (vendor "Active Events", sidebar unread badges, live/polling pill), rating stars everywhere + vendor Edit rating, Track page team fix, bcrypt, per-user notifications, staff event scoping, vendor ownership. See TEST_REPORT.md §9.
Testing tip: log in each role in a SEPARATE browser / incognito window (one browser shares the login across tabs).

## 8. Useful facts for debugging

- API base: `http://localhost:3000/api`; Swagger: `http://localhost:3000/api/docs`.
- Frontend API base comes from `VITE_API_BASE_URL` or defaults to `http://localhost:3000/api` (`frontend-react/src/services/apiClient.js`).
- CORS allowlist = `CORS_ORIGINS` in `back-end/.env` (must include `http://localhost:5173`).
- The backend scheduler (every 30 s) moves confirmed events to `live` at start time and to `completed` at end time.
- Allocations live in the `resourceAllocations` map (eventId → items) inside `database.json`, written through `PUT /api/state/resourceAllocations` (vendor/admin/superuser only, validated by the availability rule).
- Staff accounts are created when a vendor approves a staff application (`/join-staff` page → vendor "Staff Onboarding").
- Max 2 accounts per phone number on register / staff apply.
- `EMS_DATA_DIR` env var points DataService at another data folder (tests and root scripts use a temp folder). Never run a script that opens DataService without it.
- Socket.IO runs on the same port as the API (path `/socket.io`); CORS comes from `CORS_ORIGINS`.
- Testing trick used in Phase 2: an isolated copy of the backend on :3001 (own data folder) + `VITE_API_BASE_URL=http://localhost:3001/api npx vite --port 5174`, so the owner's servers/data are never touched.
