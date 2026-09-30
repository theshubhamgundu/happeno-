# Tri-City AI Hackathon

The Tri-City AI Hackathon platform supports participant registration, payments, team submissions, and event operations for administrators, judges, and volunteers.

## Technology

- Next.js 16 with the App Router, React 19, and TypeScript
- Supabase for application data
- Manual UPI/UTR payment review for registrations
- Nodemailer and authenticated SMTP for email notifications
- Tailwind CSS and Framer Motion for the interface

## Project Structure

- `app/` contains public pages, dashboards, and API routes.
- `components/` contains shared and landing-page UI.
- `context/` contains shared application state.
- `data/` contains legacy import files; runtime application records are stored in Supabase.
- `lib/` contains database, payment, email, and application helpers.
- `public/` contains static assets.
- `scripts/` contains the one-time data migration utility.
- `database_setup.sql` defines the Supabase schema and access policy.

## Local Development

Use Node.js 20.9 or later, then install dependencies:

```sh
npm install
```

Create `.env.local` in the project root. The service-role key must remain server-only; never prefix it with `NEXT_PUBLIC_` or commit it.

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=
AUTH_SESSION_SECRET=
ADMIN_LOGIN_ID=
ADMIN_PASSWORD=
LIVESCORE_PASSWORD=
NEXT_PUBLIC_APP_URL=http://localhost:3000
SMTP_HOST=cloud-xent.crazzydns.com
SMTP_CONNECT_HOST=148.113.0.192
SMTP_TLS_SERVERNAME=cloud-xent.crazzydns.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=business@centle.in
SMTP_PASSWORD=
EMAIL_FROM=TRI-CITY AI HACKATHON <business@centle.in>
PUBLIC_REGISTRATIONS_OPEN=false
NEXT_PUBLIC_REGISTRATIONS_OPEN=false
```

Apply `database_setup.sql` to the Supabase SQL editor before starting the app. The app uses one Supabase project for registrations, settings, judges, and volunteers; it no longer falls back to local JSON files. `AUTH_SESSION_SECRET` should be a long random value. `ADMIN_LOGIN_ID`, `ADMIN_PASSWORD`, `LIVESCORE_PASSWORD`, and `PUBLIC_REGISTRATIONS_OPEN` are server-only configuration. Set both registration flags to `true` to open the registration form and API.

To import the existing CSV/JSON records, configure the environment variables above and run `npm run migrate:data`. The importer is safe to rerun and upserts records by their IDs. Keep the source files until you have checked the imported row counts and sample records in Supabase. Configure the SMTP variables to enable email notifications; keep `SMTP_PASSWORD` secret and out of source control.

Start the development server:

```sh
npm run dev
```

## Validation

```sh
npm run lint
npm run build
```
