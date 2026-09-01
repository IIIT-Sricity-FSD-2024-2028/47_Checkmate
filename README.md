# Event Management System

## Running the Full-Stack App

Backend:

```bash
cd back-end
npm install
npm run start
```

API base URL: `http://localhost:3000/api`

Swagger UI: `http://localhost:3000/api/docs`

Generated Swagger JSON: `back-end/docs/swagger.json`

Frontend:

Open the HTML pages under `front-end/pages/` in a browser while the backend is running. The shared frontend stores call the NestJS APIs with an `x-role` header and no authentication.

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
