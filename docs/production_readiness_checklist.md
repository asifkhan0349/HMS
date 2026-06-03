# HMS Production Readiness Checklist

Use this checklist before any real customer launch or storage of production patient data.

## Hosting and Domains

- Move API, app, landing, and database services to paid production plans.
- Configure `hms.com` for the public site.
- Configure `app.hms.com` or `app.hms.in` for the authenticated app.
- Configure `api.hms.com` for backend APIs.
- Confirm TLS certificates renew automatically.

## Environment

- Set `ENV=production`.
- Set a strong `HMS_SECRET_KEY` with at least 32 characters.
- Set `DATABASE_URL` to managed PostgreSQL.
- Set `ALLOWED_ORIGINS` to exact production origins only.
- Remove development-only credentials, test accounts, and sample secrets.

## Backups and Restore

- Enable daily automated PostgreSQL backups.
- Keep at least 30 days of backup retention.
- Document the restore procedure.
- Run a restore test before launch and after major schema changes.

## Monitoring

- Add uptime checks for:
  - public landing page
  - authenticated app shell
  - `/api/health`
  - one authenticated database-backed endpoint
- Add backend error tracking.
- Add frontend error tracking.
- Alert on repeated 5xx errors, failed health checks, and database connectivity failures.

## Audit and Security

- Capture audit logs for login/logout, patient changes, EMR changes, invoice/payment edits, user/role updates, and exports.
- Review role access for every product module.
- Confirm security headers are enabled in production.
- Confirm CORS rejects unapproved origins.
- Document incident response, data retention, and export procedures.

## Launch Gate

- Lighthouse performance is 85 or higher on the primary public landing page.
- Known QA accessibility issues are resolved.
- Public claims are verified or softened.
- Backup restore has been tested.
- Monitoring alerts have been tested.
