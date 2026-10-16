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

Each team member lists the work they did and the files they created or changed.

### Nitish Gorontala Badrinarayanan (S20240010165)

**React frontend: Admin module** (`frontend-react/`)

Converted seven Admin pages from the old HTML/JS frontend to React, connected to the
live backend, and built shared table and pop-up components that other roles can reuse.

| File | Work |
|---|---|
| `src/pages/admin/Dashboard.jsx` | Admin dashboard: live stat cards with "since last visit" trends, pending vendor approvals, user distribution |
| `src/pages/admin/VendorApprovals.jsx` | Vendor application table with review pop-up, Approve / Reject with an optional note, read-only view, `?review=<id>` links |
| `src/pages/admin/ManageUsers.jsx` | User directory with stat cards, filters, an edit pop-up that checks the name and email, and Disable / Enable |
| `src/pages/admin/MonitorEvents.jsx` | Event registry with details pop-up, Approve, and Refund after confirmation |
| `src/pages/admin/ServiceModeration.jsx` | Vendor package review with Approve / Reject / Terminate |
| `src/pages/admin/IssueTracking.jsx` | Support tickets going Open → Investigating → Resolved, with a details pop-up |
| `src/pages/admin/SystemLogs.jsx` | Activity log with type filter, search, load older and refresh |
| `src/components/Modal.jsx` | Generic pop-up dialog (Escape, click outside, X to close) |
| `src/components/NotificationModal.jsx` | Notifications pop-up built on `Modal` |
| `src/components/table/DataTable.jsx`, `TableToolbar.jsx`, `Pagination.jsx` | Reusable table, filter/search toolbar and page controls |
| `src/components/admin/AdminTopBar.jsx` | Admin page header with the live notifications bell |
| `src/components/admin/ApprovalItem.jsx`, `DistributionRow.jsx` | Dashboard list rows |
| `src/components/admin/DetailField.jsx` | Label + value pair for detail pop-ups |
| `src/components/admin/LogItem.jsx` | One row of the system log |
| `src/hooks/usePagination.js` | Splits a list into pages |
| `src/hooks/useAdminNotifications.js` | Builds the bell's notifications from live data |
| `src/utils/formatRelativeTime.js`, `formatCurrency.js`, `logText.js` | Formatting helpers |
| `src/styles/admin.css`, `src/styles/components/modal.css`, `src/styles/components/table.css` | Styles for the above |
| `src/styles/dashboard.css` | Fix: `StatisticCard`'s `color` setting was ignored; added a red colour |
| `src/routes/AppRoutes.jsx`, `src/routes/roleRoutes.js`, `src/layouts/AdminLayout.jsx` | Admin routes, sidebar menu and layout |

**Backend** (`back-end/`)

| Area | Files |
|---|---|
| Middleware layer: logging with daily rotation, global error handling, upload limits, CORS / helmet / rate limiting, request IDs, audit log of changes, `.env` configuration | `src/common/logging/*` (`logger.ts`, `file-logger.service.ts`, `http-logger.ts`, `logger-flush.service.ts`, `request-id.middleware.ts`), `src/common/security/*` (`cors.config.ts`, `helmet.config.ts`, `rate-limit.ts`), `src/common/middleware/mutation-audit.middleware.ts`, `src/common/middleware/upload-guard.middleware.ts`, `src/common/filters/all-exceptions.filter.ts`, `src/common/upload/multer.config.ts`, `src/common/paths.ts`, `src/common/middleware.e2e.spec.ts`, `src/main.ts`, `src/app.module.ts`, `.env.example` |
| Vendor approval and package moderation endpoints | `src/modules/vendors/vendors.controller.ts`, `vendors.service.ts`, `dto.ts`; `src/modules/packages/packages.controller.ts`, `packages.service.ts`, `dto.ts`; `src/domain/models.ts` |
| Bug fix in coordination messages | `src/modules/messages/messages.service.ts` |

**Original frontend** (`front-end/`)

| Area | Files |
|---|---|
| Initial folder structure for pages, scripts and styles by role | `front-end/**` |
| Admin vendor approvals, service moderation and analytics pages | `pages/admin/admin.html`, `pages/admin/report-analytics.html`, `pages/admin/service-moderation.html`, `scripts/admin_js/admin.js`, `scripts/admin_js/admin-reports.js`, `pages/Login/signup-step4.html` |
| Consistent layout and design across all roles' pages | `pages/{admin,client,vendor,staff,superuser,Login}/*`, `styles/*` |
| Fixes for broken links, errors that failed without a message, and corrupted IDs | `pages/Login/login_js/script.js`, `scripts/client_js/create_event_client.js`, `scripts/vendor_js/report.js`, plus page links in admin / client / staff / vendor pages |

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

### Sai teja (S20240010136)

**Area:** Superuser portal in React, platform governance, and data services  
**Branch:** `sai` (merged into `main` via PR #25)

I rebuilt and converted every Superuser portal page from the old HTML/CSS/JavaScript version into the React app
(`frontend-react`), preserving all administrative governance capabilities and connecting them directly to the NestJS
backend. Every page incorporates comprehensive CRUD operations, search filtering, status indicators, and modal workflows,
accompanied by in-code documentation and comments addressing potential faculty questions. I also engineered interactive
HTML5 canvas charts for real-time analytics without external dependencies, built reusable superuser components and modals,
implemented the dedicated `superuserApi` service, and styled the entire portal.

**1. Superuser pages** – `frontend-react/src/pages/superuser/`

| File | Status | What it does |
|---|---|---|
| `Dashboard.jsx` | Rewritten | Executive overview dashboard: real-time KPI metrics (total users, total vendors, total events, total revenue), pure HTML5 canvas visualizations (user signups, cumulative event growth, revenue trends), system health indicators, and quick navigation |
| `Bookings.jsx` | New | All system bookings table: revenue KPI cards, instant search, full CRUD (create booking, edit active bookings, view detailed breakdown modal, and delete cancellations), and backend sync |
| `Events.jsx` | New | Platform-wide event governance: multi-field search across titles/venues/clients/vendors, status updates, event details inspection modal, event registration, and cancellation |
| `Resources.jsx` | New | System-wide resource inventory oversight: total/available unit counters, category and supplier filters, dynamic color-coded inventory progress bars, and full CRUD for equipment and decor |
| `Staff.jsx` | New | Global workforce administration: personnel metrics, search across roles and vendor affiliations, real-time status badges, and complete CRUD (add staff, update role/contact/availability, delete) |
| `Users.jsx` | New | System-wide user administration: multi-field search (name, email, role), role and status badges, and complete user lifecycle governance (create account with password, update profile/role/status, permanent deletion) |

**2. Superuser components** – `frontend-react/src/pages/superuser/components/` (all new)

| Component | Purpose |
|---|---|
| `ConfirmModal.jsx` | Reusable confirmation popup dialog with danger/warning styling for destructive actions (delete, cancel) |
| `DataTable.jsx` | Reusable data table component supporting customizable columns, row rendering, and empty states |
| `DetailModal.jsx` | Detailed record inspection modal displaying full attributes for events, bookings, users, resources, and staff |
| `SearchBar.jsx` | Search input bar with debounce and instant clear button for real-time table filtering |
| `StatCard.jsx` | Metric display card with icon, title, value, and subtitle/trend indication |
| `StatusBadge.jsx` | Color-coded status badge for events, bookings, and user account statuses |
| `Toast.jsx` | Alert toast notification banner for real-time action feedback (success and error messages) |

**3. Services and styles created**

| File | Purpose |
|---|---|
| `frontend-react/src/services/superuserApi.js` | Dedicated superuser API service handling REST calls to NestJS backend (`/api/users`, `/api/events`, `/api/resources`, `/api/staff`, `/api/bookings`, `/api/vendors`, `/api/analytics`) and session token handling |
| `frontend-react/src/styles/superuser.css` | Comprehensive styles for all superuser pages, dashboards, stats grids, data tables, modals, badges, and canvas charts |

**4. Routing and navigation**

| File | Change |
|---|---|
| `frontend-react/src/routes/AppRoutes.jsx` | Registered superuser routes (`/superuser/dashboard`, `/superuser/users`, `/superuser/events`, `/superuser/resources`, `/superuser/bookings`) wrapped in `SuperuserLayout` |
| `frontend-react/src/routes/roleRoutes.js` | Configured `superuserMenuItems` (Dashboard, Users, Events, Resources, Bookings) with icons for the sidebar |
| `frontend-react/src/layouts/SuperUser.jsx` | Superuser layout wrapper with dynamic role-based sidebar and user session info |
| `frontend-react/src/services/index.js` | Exported `superuserApi` client for use across the application |

**5. Earlier contributions**

- **Initial React frontend setup** (commit `85afab1`, 92 files): Initial project scaffolding for `react-frontend/` (Vite, React, routing, component hierarchy, layouts, AuthContext, role-based pages, and CSS stylesheets).
- **Swagger API documentation** (commit `331102c`): Updated and expanded Swagger API specifications in `back-end/docs/swagger.json` (243 additions) documenting endpoints, request/response models, and parameters.
- **Backend documentation** (commit `73272dc`): Updated backend functionality tracking in `back-end/docs/MISSING_FUNCTIONALITY_REPORT.md`.

**Commits:** `4772c97` (superuser pages in React), `85afab1` (initial React setup), `331102c` (Swagger documentation), `73272dc` (backend docs), `a908ae3` / `9644467` (merges)

### Moulidharan (S20240010152)

- `src/components/vendor/` — Developed reusable UI components for vendor-specific functionality.
- `src/components/StatisticCard.jsx` — Developed a reusable component to display statistics and summary metrics.
- `src/components/TopHeaderBar.jsx` — Implemented the top header bar for navigation and user-related actions.
- `src/pages/vendor/` — Developed vendor-specific pages and their functionality.
- `src/services/vendor/` — Implemented API service functions for vendor-related operations and backend integration.

### Cefan (S20240010040)

- `src/components/auth/` — Developed reusable UI components for authentication-related functionality, ensuring consistency across authentication interfaces.
- `src/components/profile/` — Developed reusable components for displaying and managing user profile information.
- `src/components/public/` — Developed reusable UI components for publicly accessible sections of the application.
- `src/components/Sidebar.jsx` — Implemented the sidebar navigation component to provide access to relevant application sections and support role-based navigation.
- `src/pages/auth/` — Developed page components for authentication workflows, integrating relevant UI components to create structured authentication interfaces.
- `src/pages/public/` — Developed public-facing pages and organized their layouts and content for users accessing the application without authentication.
- `src/routes/` — Organized application routing to connect URLs with their corresponding page components and support navigation between public and authenticated sections.
- `src/services/auth/` — Implemented and organized authentication-related API service functions to handle communication between the frontend and backend.
- `src/layouts/` — Developed and organized reusable layout components to maintain a consistent structure across different sections of the application.
