# Official App Rulebook — Production Mode

This document defines the **official functioning rules** of the app. All code must enforce these rules. No silent assumptions.

---

## A) Who can join and how

### A1) Invite code / join code meaning

- **Invite code** = `sponsorCode` of an existing ACTIVE user. It is the **only** way to assign a new user’s parent in the tree.
- When someone registers with a valid invite code, they become a **direct child** of the user who owns that code.
- Invite codes are **case-insensitive**: the system normalizes to uppercase before lookup and storage (e.g. `abc123` → `ABC123`).

### A2) Invalid or expired code

- If the code does not match any ACTIVE user’s `sponsorCode`, registration is **rejected** with a clear error: **invalid_invite_code** (or `INVALID_SPONSOR_CODE` in existing code).
- There is no concept of “expired” invite code: if the sponsor is ACTIVE, the code is valid. If the sponsor is not ACTIVE, the code is invalid.
- **First-user bootstrap**: If the database has no ACTIVE user with a sponsor code, the system may accept a one-time code from environment (`FIRST_SPONSOR_CODE`) or a built-in demo code (e.g. DEMO1234) only when explicitly configured. This is the only exception to “code must belong to an ACTIVE user.”

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

- **sponsorCode**: Must be **unique** across all users. Generated once at account creation (after OTP verification). Never changed. Stored uppercase/normalized.
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
- **already_registered** / **EMAIL_TAKEN**: Email already in use.
- **PHONE_TAKEN**: Phone already in use (when phone unique is enforced).
- **forbidden_visibility**: Requested resource is outside the caller’s allowed subtree (or not allowed for role).
- **RATE_LIMIT**: Too many attempts.

---

## Open decisions

- **Invite code expiry**: Currently there is no expiry. If product later adds “time-limited” codes, that will be documented here and implemented explicitly.
- **Maximum tree depth**: No limit is enforced. If a limit is introduced later, it will be documented and enforced in join logic.
- **Sponsor reassignment by admin**: Allowed via existing `updateSponsorAndRecomputePaths`-style logic; exact admin UI/API is out of scope of this rulebook but must preserve no-cycles and path recompute.

---

*Last updated: Official production mode. All join and tree logic must align with this rulebook.*
