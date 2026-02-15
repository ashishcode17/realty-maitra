# Official production mode — summary and verification

## What rules were written

- **docs/OFFICIAL_APP_RULEBOOK.md** defines:
  - **Join**: Invite code is the only way to assign parent; case-insensitive; invalid code → reject. No changing sponsor unless admin.
  - **Tree**: Parent = sponsor from invite code; path = sponsor.path + sponsor.id; no cycles; first user can have null sponsor.
  - **Visibility**: Member sees only self + downline; admin can see all via admin APIs.
  - **Ordering**: Stable by join time (createdAt asc).
  - **Integrity**: sponsorCode unique; path matches ancestry; one email/phone per account.
  - **Audit**: Store invitedByUserId (sponsorId), invitedBySponsorCode (sponsorCodeUsed), joinTimestamp (createdAt); audit log on join.

## Files changed

| File | Change |
|------|--------|
| **docs/OFFICIAL_APP_RULEBOOK.md** | New. Full rulebook (join, tree, visibility, ordering, integrity, audit, error codes, open decisions). |
| **docs/VERIFICATION_AND_SUMMARY.md** | New. This file. |
| **lib/join.ts** | New. Centralized: normalizeInviteCode, resolveSponsorFromInviteCode, computePathForNewUser, validateEmailNotTaken, validatePhoneNotTaken, JOIN_ERROR_CODES. |
| **lib/treeInvariants.ts** | New. runTreeInvariantChecks() — path matches ancestry, no cycles, parent exists. |
| **app/api/auth/register/route.ts** | Uses join.ts for invite resolution and validation; normalizeInviteCode; validatePhoneNotTaken; error code INVALID_SPONSOR_CODE / PHONE_TAKEN. |
| **app/api/auth/verify-otp/route.ts** | Audit meta: invitedByUserId, invitedBySponsorCode, joinTimestamp; retry on sponsorCode unique conflict (P2002). |
| **app/api/auth/me/route.ts** | Returns sponsorCode, sponsorCodeUsed, joinedUnderSponsorName, joinedUnderSponsorCode (from sponsor + sponsorCodeUsed). |
| **app/(authenticated)/dashboard/page.tsx** | “You joined under: [Sponsor Name]”, “Sponsor code: [Code]”, “Your invite code” with Copy button (from backend data). |
| **lib/tree.ts** | getSubtreeWithDetails and getDirectDownlines: orderBy createdAt asc (stable join order). |
| **app/api/network/children/route.ts** | orderBy createdAt asc; 403 response includes code: 'forbidden_visibility'. |
| **app/api/admin/tree-invariants/route.ts** | New. GET admin-only; runs runTreeInvariantChecks(), returns { ok, errors, checked }. |
| **scripts/verify-tree-rules.ts** | New. Script: invalid code → null, normalize, subtree only, canAccessUser, invariants. |
| **package.json** | Added script: "verify:tree-rules": "tsx scripts/verify-tree-rules.ts". |

## How to verify (click-by-click)

1. **Invite code and join**
   - Register a new user with a **valid** invite code (e.g. an existing user’s sponsor code). → Registration should succeed; after OTP, user is in tree under that sponsor.
   - Register with an **invalid** code (e.g. `INVALID999`). → Error “Invalid invite code” (or equivalent), code `INVALID_SPONSOR_CODE`.
   - Register with an **email** already in use. → Error “Email already registered”, code `EMAIL_TAKEN`.
   - Register with a **phone** already in use (if your app enforces it). → Error “Phone already registered”, code `PHONE_TAKEN`.

2. **“You joined under” and invite code in UI**
   - Log in as a user who has a sponsor. Open **Dashboard**. You should see:
     - “You joined under: [Sponsor Name]” and “Sponsor code: [Sponsor Code]” (read-only, from backend).
     - “Your invite code” with a code and a **Copy** button (this is the user’s own sponsorCode).

3. **Tree visibility**
   - Log in as a **member** (non-admin). Go to **Network**. You should see only yourself and your downline (no uplines, no siblings, no other branches).
   - Log in as **Admin/Super Admin**. Use admin user list or tree with a chosen root; you can see all users / any subtree.

4. **Child ordering**
   - In Network, expand a node that has multiple direct children. Order should be stable (e.g. first-joined first) and the same on refresh.

5. **Invariant check (admin)**
   - Log in as admin. Call **GET /api/admin/tree-invariants** (e.g. from browser dev tools or Postman with Bearer token). Response should be `{ ok: true, errors: [], checked: N }`. If `ok: false`, `errors` lists violations.

6. **Verify script**
   - From repo root: `npm run verify:tree-rules` (with DATABASE_URL set). Output should be “All checks passed.”

## Assumptions

- **Phone uniqueness**: Enforced in application (validatePhoneNotTaken) only; no DB unique constraint on phone. If you add a DB constraint, handle existing duplicates first.
- **First user / bootstrap**: FIRST_SPONSOR_CODE and DEMO1234 behavior is unchanged; rulebook documents them as the only exceptions to “code must belong to ACTIVE user.”
- **Admin reassignment**: Existing logic (e.g. updateSponsorAndRecomputePaths) is used for admin-only sponsor changes; no new admin UI was added.
- **Level column**: No separate `level` column; depth = path.length. Rulebook allows adding it later as long as it equals path.length.
- **Tree API for admin**: Admin “sees all” via /api/admin/users (list) and can use /api/network/tree or /api/network/all with a chosen root; no separate “full org tree” API was added.
