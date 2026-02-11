# Database: Alternatives to Neon (Local or Other Providers)

Neon can have connectivity issues (paused DB, network). Here are **two alternatives** so your app is **fast and ready** without depending on Neon. You can switch to a premium/global Postgres later when ready.

---

## Option 1: Local PostgreSQL (Docker) – No cloud, no connectivity issues

Run Postgres on your machine. No external server, works offline.

### 1. Install Docker

- Windows: [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Mac: Docker Desktop or `brew install docker`
- Start Docker.

### 2. Start a local Postgres container

In a terminal:

```bash
docker run --name realty-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres
```

(To stop later: `docker stop realty-pg`. To start again: `docker start realty-pg`.)

### 3. Set DATABASE_URL in `.env`

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"
```

### 4. Create DB and seed

```bash
npm run db:generate
npm run db:migrate
```
When prompted for migration name, type: `init` (or any name).

```bash
npm run db:seed
npm run seed:demo   # optional
```

### 5. Run the app

```bash
npm run dev
```

Log in: `admin@realtycollective.com` / `admin123`

---

## Option 2: Supabase (Free Postgres in the cloud)

Same schema as Neon, but a different provider – often better connectivity.

### 1. Create a project

1. Go to [supabase.com](https://supabase.com) and sign up.
2. Create a new project (name, password, region).
3. Wait until the project is ready.

### 2. Get the connection string

1. In the project: **Settings** → **Database**.
2. Under **Connection string**, choose **URI**.
3. Copy the URI. It looks like:  
   `postgresql://postgres.[ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres`
4. Replace `[YOUR-PASSWORD]` with your database password.
5. Add `?sslmode=require` at the end if it’s not there.

### 3. Set DATABASE_URL in `.env`

```env
DATABASE_URL="postgresql://postgres.[ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require"
```

### 4. Run migrations and seed

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
npm run seed:demo   # optional
```

### 5. Run the app

```bash
npm run dev
```

---

## Summary

| Option              | Pros                          | Cons              |
|---------------------|-------------------------------|-------------------|
| **Local Docker**    | No cloud, no Neon, works offline | Requires Docker   |
| **Supabase**        | Free, hosted, different from Neon | Still needs internet |

Use **Option 1** if you want zero dependency on any cloud. Use **Option 2** if you prefer a hosted DB but want to avoid Neon. When you’re ready for production/global, you can move to a premium Postgres (e.g. Neon paid, Supabase Pro, Railway, etc.) with the same schema and code.
