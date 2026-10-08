# Tri-City AI Hackathon

The Tri-City AI Hackathon platform supports participant registration, payments, team project submissions, and event operations for administrators, judges, and volunteers.

## Technology

- Next.js 16 App Router, React 19, and TypeScript
- Supabase for application data and server-side persistence
- UPI/UTR-based payment review for registrations
- Nodemailer with SMTP for email notifications
- Tailwind CSS and Framer Motion for the interface

## Project Structure

- `app/` contains public pages, dashboards, and API routes.
- `components/` contains shared layout and landing-page components.
- `context/` contains shared authentication and hackathon state.
- `data/` contains legacy import files; runtime application records are stored in Supabase.
- `lib/` contains database, authentication, email, payment, and event helpers.
- `public/` contains static assets.
- `scripts/` contains project utility scripts, including the data migration utility.
- `database_setup.sql` defines the Supabase tables, functions, and policies required by the app.

## Requirements

- Node.js 20.9 or later
- npm
- A Supabase project with permission to run the SQL setup
- SMTP credentials if you want to test email notifications locally

## Local Setup

1. Clone the repository and change into the project directory:

   ```sh
   git clone https://github.com/theshubhamgundu/tricity-.git
   cd tricity-
   ```

2. Install the dependencies:

   ```sh
   npm install
   ```

3. Create a Supabase project. In its SQL editor, run the contents of [`database_setup.sql`](./database_setup.sql) to create the application schema and database functions.

4. Create `.env.local` in the repository root and provide the credentials for your Supabase project and local app:

   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   AUTH_SESSION_SECRET=replace-with-a-long-random-secret
   ADMIN_LOGIN_ID=your-admin-login
   ADMIN_PASSWORD=your-admin-password
   LIVESCORE_PASSWORD=your-livescore-password
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

   Generate a unique, long random value for `AUTH_SESSION_SECRET`. Keep `SUPABASE_SERVICE_ROLE_KEY`, passwords, and all other secrets private. Do not prefix the service-role key with `NEXT_PUBLIC_`, commit `.env.local`, or share production credentials.

5. To enable email notifications locally, add your SMTP settings to `.env.local`:

   ```env
   SMTP_HOST=your-smtp-host
   SMTP_CONNECT_HOST=your-smtp-host-or-ip
   SMTP_TLS_SERVERNAME=your-smtp-host
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=your-smtp-username
   SMTP_PASSWORD=your-smtp-password
   EMAIL_FROM=TRI-CITY AI HACKATHON <you@example.com>
   ```

   Use the SMTP provider's settings for the host, port, TLS mode, and sender address. Keep `SMTP_PASSWORD` private. Email settings are only needed for flows that send email.

6. To allow public registrations in the local environment, set both flags in `.env.local`:

   ```env
   PUBLIC_REGISTRATIONS_OPEN=true
   NEXT_PUBLIC_REGISTRATIONS_OPEN=true
   ```

   Keep them `false` to leave registration closed. The server-only `PUBLIC_REGISTRATIONS_OPEN` setting must not be exposed to the browser.

7. Start the development server:

   ```sh
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Data Migration

If you need to import the existing CSV/JSON records, first configure the required Supabase environment variables and apply `database_setup.sql`. Then run:

```sh
npm run migrate:data
```

The migration utility can be rerun and upserts records by their IDs. Keep the source files until you have verified the imported record counts and sample data in Supabase.

## Available Commands

```sh
npm run dev       # Start the local development server
npm run lint      # Run ESLint
npm run build     # Create a production build
npm run start     # Serve the production build locally
npm run migrate:data # Import the existing CSV/JSON records
```

For a production-mode local check, build first and then start the production server:

```sh
npm run build
npm run start
```

## Contributors

Each project member should add their name and describe the work they contributed to the project. Replace the example row below with one row per member before submitting the project.

| Member name | Contributions |
| --- | --- |
| Enter your name | Describe the features, design, research, testing, documentation, or other work you contributed. |
