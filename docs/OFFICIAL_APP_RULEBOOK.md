# Official App Rulebook — Production Mode

This document defines the **official functioning rules** of the app. All code must enforce these rules. No silent assumptions.

---

## A) Who can join and how

### A1) Invite code / join code meaning

- **Invite code** = `sponsorCode` of an existing ACTIVE user. It is the **only** way to assign a new user’s parent in the tree.
- When someone registers with a valid invite code, they become a **direct child** of the user who owns that code.
- Invite codes are **case-insensitive**: the system normalizes to uppercase before lookup and storage (e.g. `abc123` → `ABC123`).

### A2) Invalid or expired code

- If the code does not match any ACTIVE user’s `sponsorCode`, registration is **rejected** with a clear error: **invalid_invite_code** (or `INVALID_SPONSOR_CODE`). UI shows: “Invalid invite code.”
- There is no concept of “expired” invite code: if the sponsor is ACTIVE, the code is valid. If the sponsor is not ACTIVE, the code is invalid.
- **No demo or hardcoded sponsor**: Sponsor preview (name, rank, code) comes **only** from the database after successful invite validation. There is no default invite code (e.g. DEMO1234) or placeholder sponsor name (e.g. “John Director”) in the registration flow.

### A2b) Bootstrap (first user) and invite-only registration

- **Invite code is required only on the registration screen.** Login never asks for an invite code; users sign in with email/password or OTP only.
- **Bootstrap rule (server-side):**
  - If the database has **0 users** (excluding pending placeholder records): the app allows creation of the **first account** without any invite code. This first account becomes SUPER_ADMIN/ADMIN and root. This is the only time invite code is bypassed. Enforcement: server checks user count in DB.
  - If the database has **1+ users**: registration **must** require a valid invite code, validated server-side. No invite code = no registration.
- **Bootstrap status**: A public endpoint `GET /api/bootstrap-status` returns `{ hasUsers: boolean }` so the registration page can show either “Create Root Admin” (when `hasUsers === false`) or “Enter invite code” (when `hasUsers === true`).

### A3) Changing sponsor later

- **Default: NO.** A user’s parent (sponsor) is set **once** at registration and is **not** editable by the user.
- Only **admin tools** (e.g. SUPER_ADMIN/ADMIN) may reassign a user’s sponsor, and that must use a controlled flow that preserves tree integrity (no cycles, path recompute). Normal members cannot change their own sponsor.

---

## B) Tree creation rules

### B1) Assigning parent when someone joins

- **Only** the invite code determines the parent.
- **Server-side only**: The client sends the invite code. The server resolves it to a user ID (sponsor). The client must **never** send `parentId` or `sponsorId` for tree placement.
- Parent assignment:
  - `sponsorId` = ID of the user whose `sponsorCode` matched the provided invite code.
  - `path` = sponsor’s path + sponsor’s ID: `path = [...(sponsor.path || []), sponsor.id]`.
  - For the very first user (no ACTIVE sponsor in DB), `sponsorId` = null, `path` = [].

### B2) Edge cases

- **Sponsor’s “team full”**: There is **no** limit on how many direct children a sponsor can have. No “team full” rejection.
- **Sponsor is FROZEN/INACTIVE**: Only users with status **ACTIVE** are valid sponsors. If the code belongs to a non-ACTIVE user, treat as **invalid_invite_code**.
- **Duplicate email/phone**: Same email cannot register twice (`already_registered` / `EMAIL_TAKEN`). Same phone cannot register twice when phone is required (enforced by unique constraint or application check).
- **User tries to use their own invite code**: Not applicable at registration (new user has no code yet). After join, a user cannot “re-invite” themselves. If in future any flow allows entering a code that could be one’s own, the server must reject with a clear error.

### B3) No cycles

- No user may be their own ancestor. When assigning parent:
  - Parent must not be the new user (they don’t exist yet).
  - Any admin reassignment must validate: new sponsor must not be the user themselves and must not be in the user’s current downline (otherwise a cycle would be created).

### B4) Path / level rules (materialized path)

- **path**: Array of ancestor user IDs from root down to (but not including) the current user. Root users have `path = []`.
- **path** must always equal: `sponsor ? [...sponsor.path, sponsor.id] : []`.
- **Level** (depth) can be derived as `path.length`. There is no separate `level` column required; if added, it must equal `path.length`.

---

## C) Visibility and permissions

### C1) Member (non-admin)

- A member sees **only**:
  - Themselves.
  - Their **downline**: all users who have them in their `path` (direct and indirect children).
- A member must **not** see:
  - Uplines (except the immediate sponsor’s name/code for “You joined under” display).
  - Siblings (other direct children of their sponsor).
  - Other branches or parallel teams.
- Tree and network APIs must **enforce** subtree-only: data returned is always “current user + their downline” and never includes uplines or siblings.

### C2) Admin and Super Admin

- **ADMIN** and **SUPER_ADMIN** may:
  - List all users (e.g. for admin dropdowns, view-as).
  - Run tree invariant checks and see full tree for support.
- Visibility in **tree/network** APIs: today the tree API returns “subtree of root.” For admin, “root” can be chosen (e.g. a specific user) so they can inspect any subtree. Full “see entire org” can be provided via admin-only user list. Rule: **member = subtree only; admin = can see all users via admin APIs.**

---

## D) Ordering rules

- **Stable ordering** for children of a node: by **join time** (`createdAt` ascending = first-joined first). APIs that return “children” or “tree” must use a consistent order (e.g. `orderBy: { createdAt: 'asc' }` for natural join order).
- UI and API must return the same ordering so that the tree does not “jump” between loads.

---

## E) Data integrity rules (must never break)

- **sponsorCode**: Must be **unique** across all users. Synced with active **InviteCodeRecord** (one-time use). Stored uppercase/normalized.
- **Invite code (one-time)**: Resolved via `InviteCodeRecord` where `usedAt` is null. After successful registration the code is marked used and a new code is generated for the inviter.
- **sponsorId**: Must reference an existing user ID or be null (root). No dangling references.
- **path**: Must match ancestry: `path === (sponsor ? [...sponsor.path, sponsor.id] : [])`. No cycles: current user’s ID must not appear in their own `path`.
- **One account per email**: Enforced by unique constraint on `email`.
- **One account per phone** (when phone is required): Enforced by unique constraint or application check; duplicate phone registration is rejected.
- **Invite code**: Single source of truth for team identity. Parent assignment **only** via invite code resolution on the server.

---

## F) Audit rules

- For every **join** (successful registration after OTP):
  - Store: **who invited whom** = `sponsorId` (invitedByUserId), **which code was used** = `sponsorCodeUsed` (invitedBySponsorCode), **when** = `createdAt` (joinTimestamp).
  - Write an **audit log** entry: action e.g. `USER_CREATED`, entityType `User`, entityId = new user id, metaJson = { invitedByUserId, invitedBySponsorCode, joinTimestamp }.
- These fields are not editable by the user and are used for support and compliance.

---

## Official join and invite code behavior (summary)

1. **Automatic team recognition**: On registration (invite code validated), the system assigns the new user under the sponsor and stores `sponsorId`, `sponsorCodeUsed`, and join time.
2. **UI confirmation**: After login, the app shows “You joined under: [Sponsor Name]” and “Sponsor Code: [Sponsor Code]” from **backend** (e.g. from `/api/auth/me`). Not editable by the user.
3. **Unique invite code per user**: Every user gets a unique `sponsorCode` at account creation (after OTP). It is permanent and shown in dashboard/profile; easily copyable.
4. **Invite flow guarantee**: If Person A shares their invite code, anyone who registers with that code becomes a **direct child** of Person A. No silent reassignment; placement is deterministic and traceable.
5. **Tree identity integrity**: Parent assignment **only** via valid invite code resolution. Client never sends `parentId` for tree positioning. Invite code lookup is server-side only.
6. **Duplicate protection**: Same email cannot register twice. Same phone cannot register twice (when required). Invite code is case-insensitive and normalized.
7. **Visibility**: Each user sees their own sponsor (for “joined under”), their own invite code, their direct children, and full downline subtree. They do not see other branches or parallel teams.
8. **Guarantee**: Every join results in exactly one parent (or none for first user). Tree remains stable. Ordering is consistent. Sponsor recognition is automatic and permanent.

---

## Error codes (API)

- **invalid_invite_code** / **INVALID_SPONSOR_CODE**: Invite code not found or sponsor not ACTIVE.
- **invite_code_required**: Users exist; registration requires a valid invite code.
- **rank_not_allowed**: The chosen rank is not in the allowed set for this sponsor.
- **director_restricted**: Only Admin can create Director-level accounts.
- **already_registered** / **EMAIL_TAKEN**: Email already in use.
- **PHONE_TAKEN**: Phone already in use (when phone unique is enforced).
- **forbidden_visibility**: Requested resource is outside the caller’s allowed subtree (or not allowed for role).
- **RATE_LIMIT**: Too many attempts.

---

---

## G) Organised start — first user (root) rule

- **The first user ever created in the system** may register **without** an invite code.
- This first user becomes **SUPER_ADMIN** (role) and **ADMIN** (rank). They are the root of the tree.
- **Enforcement**: Server-side only. Before accepting registration, the server checks total user count (excluding pending). If count is 0, invite code is not required and the registrant is created as root admin. If count ≥ 1, a valid invite code is **required**.
- No UI-only gating: the API must enforce this regardless of what the client sends.

---

## H) Short invite code format

- Invite codes are **4–5 character** alphanumeric (e.g. `A9K2`, `Q7X3P`).
- **Allowed characters**: A–Z and 0–9 only. Case-insensitive; stored and compared in uppercase.
- **Uniqueness**: Enforced by database unique constraint on `sponsorCode`. Generation must retry on collision (e.g. P2002).
- Generated server-side only. Never guessable from user id; use a safe random source.

---

## I) Position / rank system (separate from role)

- **Role** = permissions (SUPER_ADMIN, ADMIN for admin capabilities). Kept for access control.
- **Rank** = hierarchy position. Every user has exactly one **Rank**.
- **Ranks** (top to bottom): **ADMIN** (root only) > **DIRECTOR** > **VP** > **SSM** > **SM** > **BDM**.
- Rank is stored in `User.rank`. It is used for: allowed ranks under a sponsor, display (“Position”), and reporting structure.

---

## J) Strict rank creation / assignment rules (critical)

- **Only SUPER_ADMIN or ADMIN (role) can create or assign the DIRECTOR rank.** No one else may create a DIRECTOR, including via:
  - Client-side manipulation (e.g. sending rank=DIRECTOR in payload).
  - Direct API calls without admin context.
  - Changing payload fields.
- **Allowed ranks under a sponsor** (server-enforced):
  - If sponsor has **role** ADMIN or SUPER_ADMIN (or rank ADMIN): allowed = DIRECTOR, VP, SSM, SM, BDM.
  - If sponsor **rank** is DIRECTOR: allowed = VP, SSM, SM, BDM.
  - If sponsor rank is VP: allowed = SSM, SM, BDM.
  - If sponsor rank is SSM: allowed = SM, BDM.
  - If sponsor rank is SM: allowed = BDM.
  - If sponsor rank is BDM: allowed = BDM only (optional; can be restricted to “no new direct BDM under BDM” if desired; default: BDM can only add BDM).
- At registration, the client may only **choose** from the allowed set returned by the server. The server must reject any rank not in that set and must reject DIRECTOR unless the sponsor is admin.

---

## K) Official onboarding flow

1. **If no users exist**
   - Show “Create Root Admin” / “Initialize Organization” (no invite code).
   - Fields: Full Name, Email, Phone, Password.
   - On success: create user with role=SUPER_ADMIN, rank=ADMIN, sponsorId=null, path=[], treeId=id, and a short unique invite code (stored in InviteCodeRecord).
2. **If users exist**
   - Invite code **required**. Validate invite code (via InviteCodeRecord, usedAt null) → resolve sponsor.
   - Show sponsor preview: “Sponsor” / “[Name]”, “[Rank]”, “Invite Code: [CODE]”; or “Organization Invitation (Issued by Director/Admin)” when `isDirectorSeed`.
   - **No “Choose Position” for public**: Rank is **automatic** — Entry (performanceRank R5). Higher ranks only via Admin/Director tools or performance upgrade.
   - Create account: parentId/path/treeId set by server; if Director/Admin invite → new user is **tree root** (treeId=user.id, sponsorId=null, path=[], createdByDirectorId, createdViaInviteType=DIRECTOR_SEED).
   - After OTP: mark invite code used, regenerate new code for inviter; assign new user a new invite code.
   - Show success: “Welcome…”, “Your Invite Code” (masked by default with show/copy).

---

## L) Tree visibility (unchanged)

- Members see only their **downline** subtree. They must not see other branches, uplines (except for “reporting to” display), or siblings in tree APIs.
- Admin / Super Admin can see all users via admin APIs.

---

## M) Tree root seeding (Director/Admin invite)

- When a user registers using an **Admin or Director** invite code, they do **not** join “under” the director as a normal downline.
- They become the **first root of a new tree**: `treeId = user.id`, `sponsorId = null`, `path = []`, `createdByDirectorId = inviter id`, `createdViaInviteType = DIRECTOR_SEED`.
- Directors/Admin can seed multiple independent tree roots. They are “issuers,” not tree parents for those users.
- UI: sponsor preview shows “Organization Invitation (Issued by Director/Admin)” and issuer name.

## N) Performance rank (R0–R5) and auto Entry

- **Performance rank** is stored as `User.performanceRank` (enum R0..R5). Labels from config (`lib/performanceRank.ts`): R0=Director, R1=VP, R2=AVP, R3=Senior Manager, R4=Manager, R5=Associate (Entry).
- **Public registration**: All new members get **R5 (Entry)** automatically. No rank selection at signup.
- Higher ranks (R4–R0) are granted only by Admin/Director (promote) or by **performance upgrade rule** (documented separately).

## O) Commission rules v1 (summary)

- Entry-level closer: 40% direct. Uplines: 5% each up the chain. Rank caps: SM 60%, SSM 70%, AVP 80%, VP 90%, Director 100%.
- Bookings stored with createdByUserId, treeId; payout distribution calculated on creation; **PayoutLedger** stores per-user, per-booking amount and pct.
- Total payout must not exceed 100%. Admin UI can view ledger and per-user totals. (Full engine and “self vs downline” % logic in Open Decisions.)

## P) Govt ID and exports

- **Govt ID**: Registration may include ID image upload (JPG/PNG, size limit server-side). Stored in `User.idImageUrl`; member can see “Uploaded” status but not download; Admin/Director can download single or bulk (zip).
- **Exports**: Admin/Director-only. Users CSV (name, email, phone, rank, treeId, join date, sponsor/issuer); media zip (profile pics, govt IDs); full zip (CSV + media + manifest). APIs protected; bulk zip streamed server-side.

## Q) Permissions matrix

- **Admin/Director**: Create/edit/delete projects, slabs, training, offers; view all users (or scoped to trees they seeded); download IDs; export data.
- **Member**: View allowed content; update own profile (name, phone, city, profile pic); upload govt ID at registration; view own ID status only. **Cannot** create/edit/delete org-level entities.

## Open decisions

- **Invite code expiry**: One-time use is enforced; no time-based expiry.
- **Rank progression (5 bookings → subtree upgrade)**: Exact “subtree upgrade + new tree root” behavior to be finalized; implement non-destructive default (e.g. leader becomes new tree root, downline preserved).
- **Commission “self vs downline” %**: SM direct 60% vs 10% when downline does booking — exact split to be defined; v1 uses single cap per rank.
- **Maximum tree depth**: No limit enforced.
- **Director scope**: Global access for now; can be scoped to “trees they seeded” later.

---

## Verification checklist (production)

- [ ] Fresh DB (0 users): `/register` shows only “Create Root Admin”; no invite field.
- [ ] After root exists: `/register` requires invite code; no “Choose Position”; sponsor preview shows Sponsor or “Organization Invitation (Issued by Director/Admin)” when applicable.
- [ ] Login never asks for invite code.
- [ ] Invalid or already-used invite code: “Invalid invite code.” (no demo names/codes).
- [ ] After one user registers with a valid code: that code is marked used; inviter gets a new code; new user has Entry (R5).
- [ ] Director/Admin invite: new user has treeId=id, sponsorId=null, createdByDirectorId set.
- [ ] Dashboard: invite code shown masked (•••••) with Show/Hide and Copy; “New code generated after each successful join.”
- [ ] No demo labels or hardcoded sponsor in registration flow.

---

*Last updated: Production spec — one-time invite, tree root seeding, performance rank R0–R5, auto Entry, permissions, commission v1, govt ID & exports.*
