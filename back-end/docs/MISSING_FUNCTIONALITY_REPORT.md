# Missing Functionality Report

The implemented backend and integrated frontend stores cover the core CRUD flows for users, events, resources, staff, staff assignments, packages, issues, vendor applications, vendors, bookings, messages, dashboard summaries, and shared state.

## Remaining Unclear Or Static UI Areas

- Authentication is now implemented for login and signup. It is in-memory like the rest of the backend, so newly registered accounts reset when the server restarts.
- Some staff-only pages contain mostly visual dashboard widgets and do not expose enough form/action requirements to infer backend mutations safely.
- Admin service moderation, payouts, audit logs, and settings pages include static informational panels or UI-only controls where the expected domain behavior was not specified.

## Notes

- Role authorization is enforced by the backend through the `x-role` request header.
- The application data is intentionally in memory. Restarting the NestJS server resets it to realistic seed data.
