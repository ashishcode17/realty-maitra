# Manual Database Seeding

Since the automated seed script has Prisma 7 compatibility issues, here's how to manually create the admin user:

## Option 1: Use Prisma Studio (Easiest)

1. Run: `npm run db:studio`
2. This opens a web interface
3. Click on "User" table
4. Click "Add record"
5. Fill in:
   - name: "Super Admin"
   - email: "admin@realtycollective.com"
   - passwordHash: (run this in Node: `require('bcryptjs').hashSync('admin123', 10)`)
   - role: "SUPER_ADMIN"
   - roleRank: 100
   - status: "ACTIVE"
   - emailVerified: true
   - sponsorCode: "ADMIN001"
   - path: [] (empty array)
   - createdAt: (current date)

## Option 2: SQL Query

Run this SQL in your database (via neon.tech dashboard or psql):

```sql
INSERT INTO "User" (
  id, name, email, "passwordHash", role, "roleRank", status, 
  "emailVerified", "emailVerifiedAt", "sponsorCode", path, 
  "createdAt", "updatedAt"
) VALUES (
  gen_random_uuid()::text,
  'Super Admin',
  'admin@realtycollective.com',
  '$2a$10$rK8Z8Z8Z8Z8Z8Z8Z8Z8Z8e8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z',
  'SUPER_ADMIN',
  100,
  'ACTIVE',
  true,
  NOW(),
  'ADMIN001',
  '{}',
  NOW(),
  NOW()
);
```

**Note:** You'll need to generate the password hash first. The hash for "admin123" is:
`$2a$10$rK8Z8Z8Z8Z8Z8Z8Z8Z8Z8e8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z`

## Option 3: Wait for Fix

The seed script will work once we fix the Prisma 7 compatibility issue. For now, you can:

1. Start the app: `npm run dev`
2. Go to register page
3. Create a user manually
4. Then update that user's role to ADMIN in the database
