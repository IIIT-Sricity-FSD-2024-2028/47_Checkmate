# Event Management System

## Running the Full-Stack App

Backend:

```bash
cd back-end
npm install
cp .env.example .env    # required — see below
npm run build
npm run start
```

**The `cp .env.example .env` step is required.** `.env` is gitignored, so a fresh
clone does not have one. Without it the CORS allowlist is empty and the app
rejects browser requests with no visible error, and `JWT_SECRET` falls back to a
default that must not be used outside local development.

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp`.

API base URL: `http://localhost:3000/api`

Swagger UI: `http://localhost:3000/api/docs`

Generated Swagger JSON: `back-end/docs/swagger.json`

Frontend:

The backend serves the frontend, so there is no second server to start. Sign in at
`http://localhost:3000/front-end/pages/Login/signin.html`.

Authentication uses JWTs. Logging in returns a signed token that the frontend
stores in `sessionStorage` and sends as `Authorization: Bearer <token>` on every
later request. The user's role is read from the token, so it cannot be changed by
the client.

Seed login accounts:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `aarav.admin@checkmate.com` | `Aarav@2026` |
| Superuser | `nina.ops@checkmate.com` | `Nina@2026` |
| Vendor | `sarah@eliteevents.com` | `Sarah@2026` |
| Client | `emily.client@example.com` | `Emily@2026` |
| Staff | `mike.staff@eliteevents.com` | `Mike@2026` |

## Middleware and Environment Configuration

Copy `back-end/.env.example` to `back-end/.env` before starting. `.env` is
gitignored; `.env.example` is the committed template.

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | HTTP port |
| `NODE_ENV` | `development` | Enables the console log transport; `production` turns on HSTS |
| `CORS_ORIGINS` | see `.env.example` | Comma-separated origin allowlist. `null` is the literal string sent as the Origin by pages opened via `file://` |
| `LOG_DIR` | `logs` | Log directory, resolved under `back-end/`. Deliberately outside `public/`, so logs are not web-reachable |
| `LOG_LEVEL` | `info` | Console verbosity only; per-file levels are set per transport |
| `LOG_DATE_PATTERN` | `YYYY-MM-DD` | Rotation interval |
| `LOG_MAX_SIZE` | `20m` | Rotate early once a file reaches this size |
| `LOG_MAX_FILES` | `14d` | Retention window |
| `UPLOAD_MAX_BYTES` | `5242880` | Avatar upload ceiling, enforced twice (declared `Content-Length`, then Multer) |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate-limit window |
| `RATE_LIMIT_LOGIN_MAX` | `20` | Login attempts per window per IP |
| `RATE_LIMIT_SIGNUP_MAX` | `5` | Registrations per window per IP |

### Log files

Written to `back-end/logs/`, rotated daily and gzip-archived:

| File | Contents |
| --- | --- |
| `access-%DATE%.log` | One line per HTTP request (morgan) |
| `app-%DATE%.log` | Application and lifecycle events, upload attempts, mutation audit |
| `error-%DATE%.log` | 4xx warnings and 5xx errors, with stack traces |
| `combined-%DATE%.log` | Unfiltered catch-all |

To demonstrate rotation without waiting a day:

```bash
LOG_DATE_PATTERN=YYYY-MM-DD-HH-mm LOG_MAX_FILES=20 npm --prefix back-end run start:dev
```

Rotation then happens every minute. Revert both variables for normal use.

## Problem Statement

**Venue, Resources and Staff Allocation System**

Managing events involves coordinating multiple stakeholders such as admins, vendors, clients, and staff. Manual or poorly integrated systems often lead to delays in vendor approvals, misallocation of staff and resources, lack of real-time visibility into event schedules, and difficulty tracking event execution and issues.

This Event Management System aims to streamline the end-to-end event lifecycle by providing role-based access, structured workflows for approvals and requests, real-time monitoring of resources and schedules, and centralized reporting for better decision-making.

---

##  Identified Actors

- **Admin**
- **Vendor**
- **Client**
- **Staff**

---

##  Planned Features by Actor

###  Admin

**User Management**
- Create, edit, and remove user accounts  
- Assign roles and permissions

**Vendor Approval and Onboarding**
- Approve or reject vendor applications  
- Manage vendor onboarding process  
- Role-based access control

**Preset Creation**
- Create standard event templates or workflows

**Category and Resource Type Management**
- Define categories for events  
- Manage types of resources available

**Oversight Management**
- Monitor ongoing events  
- Track staff and vendor performance

**Reporting and Analytics**
- Generate system and event reports  
- Analyze vendor, client, and staff data

---

###  Client

**Create Event Requests**
- Request for events  
- Select date and time for events  
- Request venue and necessary resources

**View Request Status**
- Track approval or rejection  
- Modify or cancel request before approval

---

###  Vendor

**Inventory and Status Management**
- Track available resources and their condition  
- Update resource inventory in real-time

**Vendor Staff Management**
- Manage vendor team assignments and schedules

**Request Viewing and Availability Checking**
- View client event requests  
- Check staff and resource availability

**Vendor-Client Communication**
- Negotiate, provide extra information, and confirm requirements

**Conflict Detection and Resolution**
- Detect overlapping requests or conflicts automatically  
- Resolve resource allocation conflicts

**Resource Allocation and Approval**
- Allocate staff and resources to approved events  
- Confirm allocations

**Real-Time Fault Reporting & Maintenance**
- Report faults or issues during event execution  
- Automate replacements or maintenance

**Post-Event Resource Release**
- Update and release resources after events

---

###  Staff

**Staff Registration**
- Secure login and account management  

**Staff Dashboard**
- Access schedules, event details, and assigned tasks  

**Schedule & Venue Access**
- View assigned events and locations  

**Operational Status & Progress Updates**
- Update task and operational progress  

**Issue Reporting & Escalation**
- Report problems during events  
- Escalate critical issues to vendors/admins  

**Task Completion & Verification Workflow**
- Mark tasks as complete  
- Verify completion of operational tasks

---

##  System Goals

- Improve efficiency in vendor approval and event request handling  
- Ensure optimal allocation of staff and resources  
- Provide real-time visibility into event schedules and execution  
- Enable transparent reporting and issue tracking  

---

## Individual Contributions

Each team member lists their own work below: name, roll number, area, and the specific
files they created or modified. Add your section after the last one, using the same format.

### Shreeya Jetti (S20240010225)

**Area:** Client portal in React, and client–vendor communication  
**Branch:** `shreeya-react` (merged into `main` via PR #24)

I rebuilt every Client portal page from the old HTML/CSS/JavaScript version into the React app
(`frontend-react`), keeping all of the original functionality and connecting it to the NestJS
backend. Each page is split into a page file, a custom data hook (API calls and state) and small
section components. I also built the client–vendor bridge so the two portals can communicate,
and fixed a shared services file that was breaking the build.

**1. Client pages** – `frontend-react/src/pages/client/`

| File | Status | What it does |
|---|---|---|
| `Dashboard.jsx` | Rewritten | Welcome banner, KPI cards, next-event progress timeline, quick actions, activity feed |
| `MyEvents.jsx` | Rewritten | Event table with search, status/type filters, status-based actions, rejection-reason popup |
| `TrackProgress.jsx` | New | `/client/track/:id` – 5-step progress timeline with allocated resources and staff |
| `LiveMonitoring.jsx` | New | `/client/live/:id` – live task completion, event phases, resources and staff |
| `CreateEvent.jsx` | Rewritten | 4-step wizard: details → resources (availability + budget check) → staff → review |
| `BrowsePackages.jsx` | Rewritten | Approved packages with filters and "Quick Create" event request |
| `Billing.jsx` | Rewritten | Invoices from real bookings, summary cards, filter, pagination, Pay Now, invoice download |
| `ReportIssue.jsx` | Rewritten | Report to the event team (posted into the event chat) or to the admin |
| `Messages.jsx` | New | Event chat with the vendor team and admin support chat |
| `client.css` | New | Styles for all client pages (classes prefixed `cl-`) |

**2. Client data hooks** – `frontend-react/src/components/client/` (all new)

`useClientDashboardData.js`, `useClientEventsData.js`, `useClientTrackData.js`, `useClientLiveData.js`,
`useCreateEventWizard.js`, `useClientPackagesData.js`, `useClientBillingData.js`, `useReportIssueForm.js`,
`useClientMessagesData.js`, `useClientNotifications.js`

**3. Client components** – `frontend-react/src/components/client/` (all new)

| Used in | Files |
|---|---|
| All client pages | `ClientTopbar.jsx`, `WelcomeOverlay.jsx`, `StatusBadge.jsx`, `TabSwitcher.jsx` |
| Dashboard | `ClientStatsGrid.jsx`, `ClientNextEventSection.jsx`, `ClientQuickActionsSection.jsx`, `ClientRecentActivitySection.jsx` |
| My Events | `ClientEventsStatsGrid.jsx`, `ClientEventsToolbar.jsx`, `ClientEventsTable.jsx`, `ClientEventTableRow.jsx`, `RejectionReasonModal.jsx` |
| Track Progress | `TrackHeroCard.jsx`, `TrackTimeline.jsx`, `TrackSidePanel.jsx` |
| Live Monitoring | `LiveTaskProgressCard.jsx`, `LiveStatusCards.jsx` |
| Create Event | `WizardSteps.jsx`, `EventDetailsStep.jsx`, `ResourceSelectionStep.jsx`, `StaffSelectionStep.jsx`, `ReviewStep.jsx` |
| Browse Packages | `ClientPackageToolbar.jsx`, `ClientPackageGrid.jsx`, `ClientPackageCard.jsx`, `QuickCreateModal.jsx` |
| Billing | `BillingStatsGrid.jsx`, `InvoiceTable.jsx` |
| Report Issue | `IssueForm.jsx` |

**4. Shared files created**

| File | Purpose |
|---|---|
| `frontend-react/src/components/chat/ChatWindow.jsx` | Chat header, messages and input (used by the client and vendor chat) |
| `frontend-react/src/components/chat/ConversationList.jsx` | Conversation list (live events / admin support) |
| `frontend-react/src/components/chat/IssueReportModal.jsx` | Issue details popup |
| `frontend-react/src/hooks/useEventChat.js` | Shared event-chat hook – both portals read and write the same messages |
| `frontend-react/src/utils/clientHelpers.js` | Date/money formatting, current user, event progress, error messages |

**5. Client–vendor bridge**

| Feature | How it works |
|---|---|
| Approval notifications | When a vendor approves, rejects, starts or completes an event, the backend notifies that client; the bell links to Track Progress |
| Rejection reasons | The vendor must give a reason when rejecting; the client sees it |
| Two-way event chat | New vendor page to reply to clients, sharing the client's chat hook and components |
| Client issue inbox | New vendor page listing issues on the vendor's events, with status updates |

| File | Status |
|---|---|
| `back-end/src/modules/events/events.service.ts` | Modified – `notifyClient()` creates the client notification |
| `frontend-react/src/pages/vendor/EventCoordination.jsx` | New – `/vendor/coordination` |
| `frontend-react/src/pages/vendor/ClientIssues.jsx` | New – `/vendor/issues` |
| `frontend-react/src/components/vendor/useVendorIssuesData.js` | New |
| `frontend-react/src/components/vendor/RejectReasonModal.jsx` | New |
| `frontend-react/src/styles/bridge.css` | New |
| `frontend-react/src/pages/vendor/Events.jsx`, `EventReview.jsx` | Modified – reject opens the reason popup |
| `frontend-react/src/components/vendor/useVendorEventsData.js` | Modified – sends the rejection reason |

**6. Other files modified**

| File | Change |
|---|---|
| `frontend-react/src/routes/AppRoutes.jsx` | Client routes (`track/:id`, `live/:id`, `messages`) and vendor routes (`coordination`, `issues`) |
| `frontend-react/src/routes/roleRoutes.js` | "Messages" in the client sidebar, "Client Issues" in the vendor sidebar |
| `frontend-react/src/layouts/ClientLayout.jsx` | Welcome overlay |
| `frontend-react/index.html` | Icon font used by the sidebar; page title |
| `frontend-react/src/services/index.js` | Restored shared service exports that had been removed, which was breaking the build |

**7. Earlier contributions**

- **JWT authentication and real data** (commit `3d0cb62`, 45 files): backend auth (`auth.module.ts`, `auth.service.ts`,
  `jwt.strategy.ts`, `jwt-auth.guard.ts`, `roles.guard.ts`, `public.decorator.ts`, `roles.decorator.ts`, `password.ts`,
  `main.ts`, `app.module.ts`, `.env.example`); backend modules (events, analytics, staff, users, vendors, `data.service.ts`,
  `models.ts`, `swagger.json`); and old frontend admin, staff, superuser and vendor pages connected to real data.
- **Team video** (commits `1fa2193`, `455d3cf`).

**Commits:** `985a65e` (client pages), `c6f12a9` (client–vendor bridge), `492982d` (services fix), `3d0cb62` (JWT auth),
`1fa2193` / `455d3cf` (team video)

<!-- Next team member: add your section below, starting with "### Your Name (Roll No.)" -->
