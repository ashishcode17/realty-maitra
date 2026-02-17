# Confirmation Checklist (Admin/Director Tooling)

## 1) Invite code masking

**Where `<InviteCodeField />` is used:**
- **Dashboard** (`app/(authenticated)/dashboard/page.tsx`) – invite code card
- **Settings / Profile** (`app/(authenticated)/settings/page.tsx`) – Invite details section (Profile tab)
- **Register success step** (`app/register/page.tsx`) – “Your Personal Invite Code” after successful registration

**Behaviour:** Masked by default (••••• same length as code), Eye toggle to show/hide, Copy button (always copies real value). No code in DOM when masked; no leak in HTML attributes, logs, or query params.

---

## 2) Registration flow with Govt ID

**Screens & validation:**
- Registration form includes a **required** Govt ID image upload (when not the first/root user).
- Accepted formats: JPG, PNG only. Max size: 2MB (enforced client-side and server-side).
- Server returns clear errors: `GOVT_ID_REQUIRED`, `GOVT_ID_TOO_LARGE`, `GOVT_ID_INVALID_TYPE`.
- After successful registration, the success copy includes **“Govt ID: Uploaded ✅”** when a file was uploaded.
- Root admin bootstrap (first user) can register without Govt ID.

**Storage:** Files stored under `uploads/govt-ids/`; DB stores `idImageUrl` and `idImageUploadedAt` (on pending user, then copied to final user on verify-otp).

**Admin/Director access:** Secure download at `GET /api/files/govt-id/[userId]` (Admin/Director only, server-enforced).

---

## 3) Ledger panel and when it updates

**Path:** `/admin/ledger` (Admin/Director only).

**How it updates:**
- **JOINED:** One row written when a user is created (in `app/api/auth/verify-otp/route.ts` after user create), with snapshot (name, email, phone, city, state, rank, role, treeId, profileImageUrl, govtIdImageUrl, inviter metadata).
- **DEACTIVATED / REACTIVATED:** Rows written from `app/api/admin/users/[id]/route.ts` when an admin/director changes user status (e.g. to DEACTIVATED/INACTIVE/SUSPENDED or back to ACTIVE). Snapshot taken before update; `performedBy` = admin userId.
- **DELETED:** Not yet implemented (no user-delete API in the app). When a delete flow is added, a DELETED event should be written to the ledger.

**Table:** Append-only `UserLedger`; filters: date range, event type, treeId, search (name/phone/email). Export CSV via “Export CSV” (same filters), Admin/Director only.

---

## 4) Online users panel and how online/offline is computed

**Path:** `/admin/online` (Admin/Director only).

**How online/offline is computed:**
- **lastActive:** Stored on `User` (existing field). Updated by:
  - **Heartbeat:** `POST /api/heartbeat` (authenticated). Updates `User.lastActive = now`. Throttled to at most once per 25 seconds.
  - Client: `HeartbeatProvider` in the authenticated layout calls heartbeat every 30s when the tab is visible (Page Visibility API); pauses when tab is hidden.
- **isOnline:** Computed server-side in `GET /api/admin/online-users`: `lastActive` within the last **90 seconds** → online; otherwise offline.
- List is sorted: online first, then offline by `lastActive` descending.

**UI:** Green dot for online; “Active now” count; offline shows “Last seen: X minutes/hours/days ago”. Panel auto-refreshes every 15s.

---

## 5) Assumptions

- **User deletion:** No “delete user” API exists yet; ledger supports DELETED event type for when you add it.
- **Heartbeat:** Uses existing `User.lastActive`; no new DB migration.
- **Admin/Director:** Enforced via `requireAdminOrDirector()` in middleware for ledger, ledger export, govt-id download, and online-users API.
- **Invite code:** Single reusable `InviteCodeField` used everywhere the code is shown to avoid future leaks.
- **Govt ID:** Optional for the very first user (root bootstrap); required for all other registrations.
