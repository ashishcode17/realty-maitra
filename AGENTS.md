# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Realty Maitra (`realty-collective`) is a single Next.js 16 monolith (App Router + API Routes) for real estate networking, training, and performance-based rewards. It uses PostgreSQL via Prisma ORM, JWT-based auth, and React 19 with Tailwind CSS.

### Prerequisites

- **Node.js 18+** (system has v22)
- **PostgreSQL 16** (must be running on port 5432)

### Running services

1. **Start PostgreSQL** (if not already running):
   ```bash
   sudo pg_ctlcluster 16 main start
   ```

2. **Start the dev server**:
   ```bash
   npm run dev
   ```
   The app runs at `http://localhost:3000` (binds `0.0.0.0`).

### Key commands

| Task | Command |
|------|---------|
| Install deps | `npm install` |
| Lint | `npm run lint` |
| Generate Prisma client | `npm run db:generate` |
| Run migrations | `npm run db:migrate` |
| Seed database | `npm run db:seed` |
| Seed demo data | `npm run seed:demo` |
| Dev server | `npm run dev` |
| Prisma Studio | `npm run db:studio` |

### Default credentials (after seeding)

- **Admin**: `admin@realtycollective.com` / `admin123`
- **Director**: `director@realtycollective.com` / `director123`
- **VP**: `vp@realtycollective.com` / `vp123`

### Non-obvious caveats

- The `.env` file must exist with at least `DATABASE_URL` and `JWT_SECRET`. Copy from `.env.example` if missing.
- PostgreSQL auth is configured for `md5` (password: `postgres`). The `DATABASE_URL` is `postgresql://postgres:postgres@localhost:5432/postgres`.
- `npm run lint` exits with code 1 due to pre-existing lint errors in the codebase (207 errors, 49 warnings). This is expected and does not indicate a problem with your changes.
- There are no automated test suites (no `jest`, `vitest`, `playwright`, etc.). Testing is done manually via the UI or API endpoints.
- Email/SMS/Firebase are all optional for local dev. OTP codes are logged to console when SMTP is not configured.
- The app uses `uploads/` directory for local file storage. This directory is created automatically.
- `prisma migrate dev` may prompt for a migration name interactively; use `--name <name>` flag to avoid this.
