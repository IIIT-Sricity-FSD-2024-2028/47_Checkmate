# React Frontend Development Guide

## 1. Project Goal

We are migrating the existing frontend to React and building it as a React SPA.

The React frontend is located in:

```text
frontend-react/
```

The backend is not the main focus of this migration yet. Until backend APIs and database integration are ready, use **mock data** wherever data is required.

The goal is to:

- Rebuild the existing pages in React.
- Use reusable React components wherever possible.
- Keep a clean and consistent folder structure.
- Keep role-specific pages separated.
- Avoid unnecessary duplication.
- Make each feature easy to review and maintain.
- Keep the React frontend independent from the old implementation.

### Design approach

For now, **do not spend too much time on advanced design or visual improvements**.

> We will use AI later for good design. For now, just do basic formatting and focus on proper file structure, React components, routing, and functionality.

The existing frontend should be used as the reference for the required pages and functionality.

---

# 2. React Frontend Structure

The main React project is:

```text
frontend-react/
├── public/
│   └── images/
│
├── src/
│   ├── assets/
│   │
│   ├── components/
│   │
│   ├── layouts/
│   │
│   ├── pages/
│   │   ├── public/
│   │   ├── auth/
│   │   ├── client/
│   │   ├── vendor/
│   │   ├── staff/
│   │   ├── admin/
│   │   └── superuser/
│   │
│   ├── routes/
│   │
│   ├── context/
│   │
│   ├── services/
│   │
│   ├── hooks/
│   │
│   ├── utils/
│   │
│   ├── data/
│   │
│   ├── styles/
│   │   ├── global.css
│   │   ├── variables.css
│   │   ├── layout.css
│   │   ├── sidebar.css
│   │   ├── client/
│   │   ├── vendor/
│   │   ├── staff/
│   │   ├── admin/
│   │   └── superuser/
│   │
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
│
├── package.json
└── vite.config.js
```

---

# 3. Folder Responsibilities

## `public/`

Contains static files that can be accessed directly by the browser.

Example:

```text
public/
└── images/
    ├── logo.png
    └── event-banner.jpg
```

Use this for static images that do not need to be imported through JavaScript.

---

## `src/assets/`

Contains assets that are imported and used by React components.

Examples:

```text
src/assets/
├── icons/
├── images/
└── fonts/
```

Use `assets/` when the asset is part of the React application's source code.

---

## `src/components/`

Contains **reusable components** that can be used by multiple pages or roles.

Examples:

```text
src/components/
├── Sidebar.jsx
├── Navbar.jsx
├── Button.jsx
├── Modal.jsx
├── ReportIssueForm.jsx
└── ...
```

### Rule

If the same UI/functionality is needed in multiple places, consider making it a component instead of copying the code.

For example, `ReportIssueForm.jsx` can be reused by Client, Vendor, Staff, and Admin.

Do not create a component just to make a very small piece of code more complicated. Keep components meaningful and reusable.

---

# 4. Layouts

## `src/layouts/`

Layouts contain the common structure around pages.

For example:

```text
src/layouts/
├── ClientLayout.jsx
├── VendorLayout.jsx
├── StaffLayout.jsx
├── AdminLayout.jsx
└── SuperuserLayout.jsx
```

A role layout normally contains:

- Sidebar
- Common page structure
- `<Outlet />`

Example:

```jsx
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

function ClientLayout() {
    return (
        <div className="client-layout">
            <Sidebar
                role="Client Portal"
                menuItems={clientMenuItems}
                userName="John"
            />

            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}

export default ClientLayout;
```

The actual page is rendered inside `<Outlet />`.

---

# 5. Pages

## `src/pages/`

All actual application pages should be placed here.

Pages are separated by role:

```text
src/pages/
├── public/
├── auth/
├── client/
├── vendor/
├── staff/
├── admin/
└── superuser/
```

### Public pages

Pages accessible before logging in.

Examples:

```text
src/pages/public/
├── LandingPage.jsx
└── ...
```

### Auth pages

Authentication-related pages.

Examples:

```text
src/pages/auth/
├── Login.jsx
├── Register.jsx
└── ...
```

### Role pages

Role-specific application pages go inside the appropriate role folder.

Example:

```text
src/pages/client/
├── Dashboard.jsx
├── CreateEvent.jsx
├── MyEvents.jsx
├── BrowsePackages.jsx
├── Coordination.jsx
├── Billing.jsx
└── ReportIssue.jsx
```

Similarly:

```text
src/pages/vendor/
src/pages/staff/
src/pages/admin/
src/pages/superuser/
```

---

# 6. Page-Specific CSS

Page-specific CSS should **not** all be placed in `global.css`.

Use the role-specific style folders:

```text
src/styles/
├── global.css
├── variables.css
├── layout.css
├── sidebar.css
│
├── client/
│   ├── dashboard.css
│   ├── createEvent.css
│   ├── myEvents.css
│   └── ...
│
├── vendor/
│
├── staff/
│
├── admin/
│
└── superuser/
```

For example:

```text
src/pages/client/Dashboard.jsx
src/styles/client/dashboard.css
```

The dashboard component imports its own page CSS:

```jsx
import "../../styles/client/dashboard.css";
```

### Shared CSS

Use these for styles that are shared across the application:

```text
global.css
variables.css
layout.css
sidebar.css
```

Do not put role-specific or page-specific styling into these files unless it is genuinely shared.

---

# 7. CSS Responsibilities

### `global.css`

Global browser/application styles.

Examples:

- `box-sizing`
- body margin
- body font
- root sizing
- basic global resets

### `variables.css`

Common CSS variables.

Example:

```css
:root {
    --sidebar-bg: #ffffff;
    --border-color: #dddddd;
}
```

### `layout.css`

Common layout-related styles.

Example:

```css
.main-content {
    flex: 1;
    padding: 24px;
}
```

### `sidebar.css`

Styles for the reusable Sidebar component.

---

# 8. Naming Conventions

Use clear and consistent names.

## React components

Use **PascalCase**:

```text
Dashboard.jsx
CreateEvent.jsx
ReportIssue.jsx
Sidebar.jsx
ClientLayout.jsx
```

## CSS files

Use descriptive names.

Examples:

```text
dashboard.css
createEvent.css
myEvents.css
sidebar.css
```

## JavaScript utility/data files

Use descriptive names, generally in camelCase:

```text
roleRoutes.js
mockEvents.js
api.js
formatDate.js
```

## Variables and functions

Use camelCase:

```js
const menuItems = [];
const userName = "John";

function handleSubmit() {
}
```

Do not use vague names such as:

```text
a.js
test1.jsx
newfile.jsx
temp.css
```

unless it is genuinely a temporary local file that will not be committed.

---

# 9. Routing

Routes should be managed in:

```text
src/routes/
```

The application uses nested routes for role layouts.

Example:

```jsx
<Route path="/client" element={<ClientLayout />}>
    <Route index element={<Navigate to="dashboard" replace />} />
    <Route path="dashboard" element={<ClientDashboard />} />
</Route>
```

The flow is:

```text
/client/dashboard
        ↓
ClientLayout
        ↓
Sidebar + <Outlet />
        ↓
ClientDashboard
```

This allows the Sidebar and other common layout elements to remain consistent while only the page inside `<Outlet />` changes.

Use the same pattern for:

```text
/client
/vendor
/staff
/admin
/superuser
```

---

# 10. Reusable Sidebar

There should be **one reusable Sidebar component**:

```text
src/components/Sidebar.jsx
```

The Sidebar should receive role-specific information through props.

Example:

```jsx
<Sidebar
    role="Client Portal"
    menuItems={clientMenuItems}
    userName="John"
/>
```

The Sidebar contains:

```text
Sidebar
├── EventPro brand
├── Role name
├── Navigation
└── User section
    ├── User name
    └── Logout
```

Do not create five separate Sidebar components unless there is a genuine structural difference that cannot be handled through props.

---

# 11. Role Menu Configuration

Role navigation should be kept in a central configuration file such as:

```text
src/routes/roleRoutes.js
```

Example:

```js
export const clientMenuItems = [
    {
        label: "Dashboard",
        path: "/client/dashboard",
        icon: "ph ph-squares-four"
    },
    {
        label: "Create Event",
        path: "/client/create-event",
        icon: "ph ph-plus"
    }
];
```

This keeps the Sidebar reusable.

The Sidebar should not contain hard-coded navigation for every role.

---

# 12. Mock Data

The backend is not ready yet.

Therefore, when a page needs data from the backend, use mock data temporarily.

Mock data can be placed in:

```text
src/data/
```

Example:

```text
src/data/
├── mockEvents.js
├── mockUsers.js
├── mockPackages.js
└── ...
```

Example:

```js
export const mockEvents = [
    {
        id: 1,
        name: "College Fest",
        date: "2026-10-10",
        status: "Upcoming"
    }
];
```

### Important

Do not block frontend development waiting for backend APIs.

Build the UI and functionality using mock data first.

When the backend becomes available, the data-fetching logic can be moved into:

```text
src/services/
```

---

# 13. Services

## `src/services/`

Contains communication with backend APIs.

Examples:

```text
src/services/
├── authService.js
├── eventService.js
├── userService.js
└── packageService.js
```

Do not put API calls directly throughout multiple page components when they can be centralized into services.

For now, if the backend endpoint does not exist, use mock data.

---

# 14. Hooks

## `src/hooks/`

Contains reusable custom React hooks.

Example:

```text
src/hooks/
├── useAuth.js
├── useEvents.js
└── ...
```

Do not create custom hooks unnecessarily. Use this folder when logic needs to be reused between components/pages.

---

# 15. Context

## `src/context/`

Contains React Context used for application-wide state.

Examples:

```text
src/context/
├── AuthContext.jsx
└── ...
```

Use Context for genuinely shared state, not for every piece of state.

---

# 16. Utils

## `src/utils/`

Contains small reusable helper functions.

Examples:

```text
src/utils/
├── formatDate.js
├── formatCurrency.js
└── validation.js
```

Keep these functions independent from UI components whenever possible.

---

# 17. App Files

## `src/main.jsx`

Application entry point.

It mounts the React application.

## `src/App.jsx`

Main application component.

Usually this will connect the application to the route structure.

## `src/index.css`

This is the main CSS entry point.

It imports the shared CSS files:

```css
@import "./styles/global.css";
@import "./styles/variables.css";
@import "./styles/layout.css";
@import "./styles/sidebar.css";
```

Do **not** create another `index.css` just for a role or page.

---

# 18. Component vs Page

Use this rule:

### Page

A complete route/screen.

Example:

```text
src/pages/client/Dashboard.jsx
```

### Component

A reusable part of a page.

Example:

```text
src/components/Sidebar.jsx
src/components/ReportIssueForm.jsx
```

For example, if the Client Dashboard contains:

```text
Dashboard
├── Header
├── StatisticsCard
├── UpcomingEvents
└── EventCard
```

If `StatisticsCard` or `EventCard` is useful in multiple places, make it a reusable component.

---

# 19. Common Components

Before creating a new component, check:

```text
src/components/
```

If a suitable component already exists, reuse it.

Do not create duplicate components with slightly different names.

For example, avoid:

```text
ClientButton.jsx
VendorButton.jsx
StaffButton.jsx
```

if the same Button can be handled by one reusable:

```text
Button.jsx
```

---

# 20. Report Issue

Report Issue exists for multiple roles.

Use a common component:

```text
src/components/ReportIssueForm.jsx
```

If a role-specific page is required:

```text
src/pages/client/ReportIssue.jsx
src/pages/vendor/ReportIssue.jsx
src/pages/staff/ReportIssue.jsx
src/pages/admin/ReportIssue.jsx
```

These pages can use the common form and pass the required role/context.

Avoid copying the entire form into every role.

---

# 21. Working on a Page

When you are assigned a page:

### Step 1 — Check the existing frontend

Use the existing implementation as the reference for:

- UI structure
- text
- fields
- buttons
- functionality
- navigation
- existing behavior

Do not blindly copy the old HTML into React.

Convert it into proper React components.

### Step 2 — Find reusable components

Check:

```text
src/components/
```

Reuse existing components where appropriate.

### Step 3 — Create the page

Place the page in the correct role folder:

```text
src/pages/<role>/
```

Example:

```text
src/pages/staff/Dashboard.jsx
```

### Step 4 — Create page CSS

Place the page-specific CSS here:

```text
src/styles/<role>/
```

Example:

```text
src/styles/staff/dashboard.css
```

### Step 5 — Add the route

Add the route through the appropriate route/layout structure.

### Step 6 — Use mock data

If backend data is unavailable, create/use mock data.

### Step 7 — Test manually

Open the page in the browser and test:

- Navigation
- Buttons
- Forms
- Inputs
- Basic interactions
- Layout
- Console errors

---

# 22. Do Not Modify Shared Files Without Checking

Some files are shared by the whole team.

Examples:

```text
src/components/Sidebar.jsx
src/routes/roleRoutes.js
src/routes/AppRoutes.jsx
src/styles/global.css
src/styles/variables.css
src/styles/layout.css
src/styles/sidebar.css
```

Before changing a shared file, check with the team lead if the change can affect another person's work.

This is especially important when multiple people are working simultaneously.

---

# 23. Git Branching Rule

**Do not work directly on `main`.**

Each feature/page must have its own branch.

Example:

```text
main
  │
  ├── client-dashboard
  ├── staff-dashboard
  ├── vendor-events
  ├── admin-users
  └── superuser-events
```

Use a descriptive branch name.

Examples:

```text
client-dashboard
staff-dashboard
vendor-events
admin-users
superuser-reports
client-create-event
```

Avoid:

```text
mybranch
test
new
changes
branch1
```

---

# 24. Starting a New Feature

Always start from the latest `main`.

```bash
git checkout main
git pull origin main
git checkout -b your-feature-branch
```

Example:

```bash
git checkout main
git pull origin main
git checkout -b staff-dashboard
```

Then work only on your feature branch.

---

# 25. Keep Your Branch Updated

If `main` receives important changes while you are working:

```bash
git checkout main
git pull origin main

git checkout your-feature-branch
git merge main
```

Resolve conflicts carefully.

If you are unsure about a conflict, **do not randomly choose one side**. Ask the team lead before resolving it.

---

# 26. Commit Messages

Make commits clear and related to the actual work.

Good examples:

```text
Add client dashboard
Add staff event page
Create reusable event card
Add mock event data
Fix client dashboard routing
Add report issue form
```

Avoid:

```text
update
changes
done
final
asdf
```

Try to keep commits focused rather than putting unrelated changes into one commit.

---

# 27. Push Your Branch

After completing your work:

```bash
git add .
git commit -m "Add staff dashboard"
git push -u origin staff-dashboard
```

For later pushes:

```bash
git add .
git commit -m "Fix staff dashboard layout"
git push
```

---

# 28. Pull Request

When your feature is ready:

1. Push your branch.
2. Open GitHub.
3. Create a Pull Request.
4. Set the target branch to `main`.
5. Add a clear PR description.
6. Request review from the team lead.

Do not merge your own PR unless specifically instructed.

The team lead will review the code and merge it.

---

# 29. Pull Request Description

A PR should briefly explain:

### What was added?

Example:

```text
Added the Staff Dashboard page.
```

### What was changed?

Example:

```text
- Added dashboard layout
- Added event summary cards
- Added mock event data
- Added dashboard CSS
- Added dashboard route
```

### Testing

Example:

```text
Tested manually in browser:
- Dashboard loads
- Sidebar navigation works
- Cards display correctly
- No console errors
```

### Screenshots

If the UI has meaningful visual changes, add screenshots to the PR.

---

# 30. Before Creating a PR

Check the following:

```text
[ ] Page is in the correct folder
[ ] CSS is in the correct role folder
[ ] Correct naming convention is followed
[ ] Existing reusable components were checked
[ ] No unnecessary duplicate components
[ ] Mock data is used where backend is unavailable
[ ] Route works
[ ] Navigation works
[ ] Buttons/interactions work
[ ] No obvious console errors
[ ] No unrelated files were changed
[ ] Code is formatted
[ ] Changes are committed
[ ] Branch is pushed
```

---

# 31. Avoid Unrelated Changes

If you are working on:

```text
staff-dashboard
```

do not also modify:

```text
admin-dashboard
vendor-events
global.css
Sidebar.jsx
```

unless your feature actually requires it.

Keeping PRs focused makes review and merging easier.

---

# 32. Shared File Conflicts

If two people need to modify the same shared file, communicate before doing it.

For example:

```text
Person A → Sidebar.jsx
Person B → Sidebar.jsx
```

This can easily create merge conflicts.

Prefer:

- Keeping role-specific changes in role-specific files.
- Creating reusable components instead of repeatedly modifying shared files.
- Informing the team lead when a shared file needs modification.

---

# 33. Team Development Flow

The overall workflow is:

```text
1. Get assigned a page/feature
        ↓
2. Pull latest main
        ↓
3. Create feature branch
        ↓
4. Check existing frontend
        ↓
5. Build React page
        ↓
6. Reuse common components
        ↓
7. Add page-specific CSS
        ↓
8. Use mock data if needed
        ↓
9. Test manually
        ↓
10. Commit
        ↓
11. Push branch
        ↓
12. Create Pull Request
        ↓
13. Team lead reviews
        ↓
14. Fix review comments if needed
        ↓
15. Team lead merges into main
```

---

# 34. Important Rules

### Rule 1

**Do not push directly to `main`.**

### Rule 2

**Every feature should have its own branch.**

### Rule 3

**Use the existing frontend as the reference for functionality and content.**

### Rule 4

**Use mock data until backend APIs are available.**

### Rule 5

**Reuse common components.**

### Rule 6

**Keep page-specific CSS inside `src/styles/<role>/`.**

### Rule 7

**Do not modify shared files unnecessarily.**

### Rule 8

**Keep PRs focused on one feature/page.**

### Rule 9

**Test your page before creating a PR.**

### Rule 10

**Ask before making large changes to the shared React structure.**

---

# 35. Quick Reference

For a new Client page:

```text
frontend-react/
└── src/
    ├── pages/
    │   └── client/
    │       └── MyEvents.jsx
    │
    └── styles/
        └── client/
            └── myEvents.css
```

For a new Staff page:

```text
frontend-react/
└── src/
    ├── pages/
    │   └── staff/
    │       └── Dashboard.jsx
    │
    └── styles/
        └── staff/
            └── dashboard.css
```

For a reusable component:

```text
frontend-react/
└── src/
    └── components/
        └── EventCard.jsx
```

For mock data:

```text
frontend-react/
└── src/
    └── data/
        └── mockEvents.js
```

For an API service:

```text
frontend-react/
└── src/
    └── services/
        └── eventService.js
```

---

# 36. Final Structure to Follow

The main principle is:

```text
pages       → complete screens
components  → reusable UI
layouts     → common role/page structure
routes      → application navigation
data        → temporary mock data
services    → backend/API communication
hooks       → reusable React logic
context     → shared application state
utils       → helper functions
styles      → global + role/page-specific styling
```

Keep the React frontend clean, modular, and easy for another team member to understand.

**Build the functionality and proper structure first. We will improve the visual design later.**
