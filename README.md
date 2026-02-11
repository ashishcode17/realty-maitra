# Realty Maitra

A production-ready web application for real estate networking, training, and performance-based rewards. The app is branded as **Realty Maitra** (config-driven branding in `lib/brand.ts`).

## Features

- **User Authentication**: Email/password with OTP verification
- **Hierarchical Network**: Tree-based downline structure with subtree-only visibility
- **Role-Based Access Control**: DIRECTOR, VP, AVP, SSM, SM, BDM roles
- **Project Management**: View projects, access documents, and track allocations
- **Income Tracking**: Transparent earnings tracking with slab-based allocations
- **Training Center**: Access training materials and book training sessions
- **Challenges & Offers**: Public challenges with wall of challengers
- **Notifications**: Global hot notice bar and user notifications
- **Admin Dashboard**: Full admin control over all features

## Tech Stack

- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based with email OTP verification
- **Icons**: Lucide React

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- SMTP credentials for email (optional for development)

## Setup Instructions

### 1. Clone and Install

```bash
cd realty-collective
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory (copy from `.env.example`):

```env
# Database - use local Postgres (Docker) or Supabase/Neon (see DATABASE_ALTERNATIVES.md if Neon has connectivity issues)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Email (Optional - for OTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@realtymaitra.com"
```

### 3. Database Setup

```bash
# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed the database
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Default Login Credentials

After seeding, you can login with:

- **Admin**: 
  - Email: `admin@realtycollective.com`
  - Password: `admin123`

- **Director**: 
  - Email: `director@realtycollective.com`
  - Password: `director123`

- **VP**: 
  - Email: `vp@realtycollective.com`
  - Password: `vp123`

## Demo Mode (Realistic Sample Data)

This repo includes a **full demo seeder** that generates realistic sample data (network tree, projects, training, offers/challenges, earnings, notices) and places **local files** into `/uploads/*` so training/project/offer documents are **NOT URLs**.

### Run demo seeder

1. **Run migrations (required after schema updates)**

```bash
npm run db:migrate
```

2. **Seed demo data**

```bash
npm run seed:demo
```

The demo seeder is **idempotent**:
- It deletes records tagged `isDemo=true`
- Re-inserts fresh demo records
- Cleans up demo files in `/uploads/*` that start with `demo-`

### Demo login credentials

- **Admin (real)**: `admin@realtycollective.com` / `admin123`
- **Admin (demo)**: `demo-admin@realtycollective.com` / `admin123`
- **User (SSM)**: `ssm1@demo.realtycollective.com` / `demo123`
- **User (BDM)**: `bdm1-1@demo.realtycollective.com` / `demo123`

### Demo assets + where files live

- Demo source assets are generated locally under:
  - `scripts/demo_assets/`
- Seeder copies them into:
  - `uploads/training/`
  - `uploads/projects/`
  - `uploads/offers/`

### Secure downloads (no direct /uploads access)

- Direct access to `/uploads/*` is blocked by `proxy.ts`
- Files are downloaded only via API (auth required):
  - `GET /api/files/download/:fileId`


## Branding

The app is branded as **Realty Maitra**. All visible app name, tagline, and support email are driven by a single config:

- **`lib/brand.ts`** – `appName`, `shortName`, `tagline`, `supportEmail`, `emailFrom`
- **`components/BrandLogo.tsx`** – RM monogram + “Realty Maitra” wordmark (used in header, login, register, homepage)
- **Favicon** – `app/icon.svg` (RM monogram)

Update `lib/brand.ts` to change the app name, tagline, or support email across the app.

## Project Structure

```
realty-collective/
├── app/
│   ├── (authenticated)/     # Authenticated pages
│   │   ├── dashboard/
│   │   ├── network/
│   │   ├── projects/
│   │   ├── income/
│   │   ├── training/
│   │   └── offers/
│   ├── api/                 # API routes
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── network/
│   │   ├── projects/
│   │   ├── income/
│   │   ├── training/
│   │   └── offers/
│   ├── login/
│   ├── register/
│   └── page.tsx             # Homepage
├── components/              # Shared components
├── lib/                    # Utilities
│   ├── auth.ts
│   ├── tree.ts
│   ├── email.ts
│   └── prisma.ts
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts            # Seed data
└── README.md
```

## Key Features Explained

### Hierarchical Network

Users can only see their own subtree (downline). This is enforced server-side in all API routes. The tree structure is built using parent-child relationships via `sponsorId`.

### Slab System

Each project has a slab configuration that determines the percentage allocation based on role:
- DIRECTOR: 100%
- VP: 90%
- AVP: 80%
- SSM: 70%
- SM: 60%
- BDM: 40%
- Upline bonuses: 5% each for two direct uplines

### Training Sessions

Admin can create training sessions (online/offline) with capacity limits. Members can book slots, and bookings are tracked.

### Challenges

Admin creates challenges with requirements (JSON). Members can enroll, and progress is tracked. The "Wall of Challengers" shows all active participants publicly.

## API Routes

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/verify-otp` - Verify email OTP
- `POST /api/auth/resend-otp` - Resend OTP
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Network
- `GET /api/network/direct` - Get direct downlines
- `GET /api/network/all` - Get all subtree members

### Projects
- `GET /api/projects` - List all projects

### Income
- `GET /api/income` - Get user earnings

### Training
- `GET /api/training/content` - Get training content
- `GET /api/training/sessions` - Get training sessions
- `POST /api/training/sessions/[id]/book` - Book a session

### Offers
- `GET /api/offers/challenges` - Get all challenges
- `GET /api/offers/my-enrollments` - Get user enrollments
- `POST /api/offers/challenges/[id]/enroll` - Enroll in challenge

## Database Schema

The Prisma schema includes:
- User (with hierarchical relationships)
- Project
- SlabConfig
- Earnings
- TrainingContent
- TrainingSession
- TrainingBooking
- OfferChallenge
- ChallengeEnrollment
- Notification
- Lead
- AuditLog

## Security

- All API routes require authentication (except public pages)
- Subtree visibility is enforced server-side
- Passwords are hashed with bcrypt
- JWT tokens stored in httpOnly cookies
- Admin routes require ADMIN role

## Production Deployment

1. Set up PostgreSQL database
2. Update environment variables
3. Run migrations: `npm run db:migrate`
4. Build: `npm run build`
5. Start: `npm start`

## Development

- Database Studio: `npm run db:studio`
- Linting: `npm run lint`

## Notes

- Email OTP uses in-memory storage (use Redis in production)
- QR codes are generated client-side
- Tree visualization can be enhanced with a proper tree component library
- Admin dashboard is basic - can be expanded with full CRUD operations

## License

Private - All rights reserved

## Support

For issues or questions, contact the development team.
