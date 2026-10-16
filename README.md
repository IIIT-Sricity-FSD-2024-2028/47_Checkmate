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

### epictwodude

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
