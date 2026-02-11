# Database connection error on login – what to do

Login fails with **"Database connection failed"** when the app cannot reach PostgreSQL. Fix it in one of these ways.

---

## 1. Check that `.env` has `DATABASE_URL`

1. Open the **`realty-collective`** folder.
2. Open the **`.env`** file (create it if it doesn’t exist, by copying `.env.example`).
3. Ensure you have exactly one line like this (no spaces around `=`):

   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
   ```

4. **Restart the dev server** after changing `.env` (stop with Ctrl+C, then run `npm run dev` again).

---

## 2. Use a free cloud database (e.g. Neon)

1. Go to **https://neon.tech** and sign up (free).
2. Create a new project and copy the **connection string** (starts with `postgresql://`).
3. In `realty-collective/.env`, set:

   ```env
   DATABASE_URL="postgresql://user:password@ep-xxxxx.region.aws.neon.tech/neondb?sslmode=require"
   ```

   (Use your actual string; it must end with `?sslmode=require` for Neon.)

4. Apply migrations and restart:

   ```bash
   cd realty-collective
   npx prisma migrate deploy
   npm run dev
   ```

---

## 3. Use local PostgreSQL

**If PostgreSQL is installed on your machine:**

1. Create a database (e.g. in psql or pgAdmin):

   ```sql
   CREATE DATABASE realty_collective;
   ```

2. In `.env`:

   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/realty_collective?schema=public"
   ```

   Replace `YOUR_PASSWORD` with your Postgres user password.

3. Run migrations and start the app:

   ```bash
   cd realty-collective
   npx prisma migrate deploy
   npm run dev
   ```

**Using Docker:**

```bash
docker run --name realty-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres
```

Then in `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"
```

Then: `npx prisma migrate deploy` and `npm run dev`.

---

## 4. Test the connection

From the project root (`realty-collective`):

```bash
npx prisma db pull
```

- If this succeeds, the database URL is correct and the server is reachable.
- If it fails, it will show the real error (wrong host, password, SSL, etc.).

Or open in the browser (with the app running):

**http://localhost:3000/api/health**

- `"database": "connected"` → connection is OK; try logging in again.
- `"database": "disconnected"` → check the `error` field in the JSON for the exact message.

---

## Checklist

- [ ] `.env` exists inside the **realty-collective** folder.
- [ ] `.env` contains a single `DATABASE_URL="postgresql://..."` line (no typos, no extra spaces).
- [ ] If using Neon: connection string includes `?sslmode=require`.
- [ ] If using local Postgres: the server is running and the database exists.
- [ ] You restarted the dev server after changing `.env`.
- [ ] Migrations were run: `npx prisma migrate deploy` (or `npx prisma db push` for dev).

After fixing `DATABASE_URL` and restarting, try logging in again.
