# Realty Maitra – QA Checklist

Run the app (`npm run dev`), then apply migrations if needed:  
`npm run db:migrate`  
(Adds: FROZEN user status, audit log ip, challenge proof/verification, earnings isVerified, lead nextFollowUpAt.)

---

## Admin login

- [ ] Login with admin credentials (e.g. `admin@realtycollective.com` / `admin123` or your demo admin).
- [ ] **Dashboard**: Stats (users, projects, challenges, training) load.
- [ ] **Admin Dashboard**: Cards for Training Center, Manage Members, Manage Projects, **Audit Log**.
- [ ] **Audit Log** (`/admin/audit`): Page loads; list shows recent audit entries (after you perform audited actions).
- [ ] **Leads**: Admin can create/assign leads via API (e.g. POST `/api/admin/leads`, PATCH `/api/admin/leads/[id]`). No admin leads UI in this pass; use API or add later.
- [ ] **Challenge completion**: PATCH `/api/admin/challenges/enrollment/[id]` with `{ "status": "COMPLETED", "reason": "Approved" }` — enrollment becomes COMPLETED, approvedBy set, audit log entry created.

---

## Normal user login

- [ ] Login with a normal user (e.g. BDM/SSM demo user).
- [ ] **Dashboard**: Stats match backend (network size, earnings, challenges, trainings).
- [ ] **My Network**: Tree/list shows only that user’s subtree.
- [ ] **Income**: Earnings list matches dashboard totals (same source).
- [ ] **Offers & Challenges**: Can enroll in challenges; Wall shows enrollments.
- [ ] **Leads**: Only leads assigned to this user appear; can update stage via dropdown (PATCH `/api/leads/[id]`).
- [ ] **Training**: Content and sessions load; download works via secure API where applicable.

---

## Trust layer

- [ ] **FROZEN user**: If a user’s status is set to FROZEN (DB or future admin UI), they can still log in but cannot enroll in challenges (API returns 403).
- [ ] **Challenge completion**: Only admin can set enrollment to COMPLETED (via admin API). User cannot self-complete.
- [ ] **Audit log**: Role changes, earnings changes, challenge completion approval, lead assignment/stage changes (when implemented) create audit entries visible in Admin → Audit Log.

---

## Quick API checks (with valid token)

- `GET /api/admin/audit?page=1` → 200, `logs` + `pagination`.
- `GET /api/leads` → 200, `leads` (assigned to current user).
- `PATCH /api/leads/[id]` (body: `{ "status": "CONTACTED" }`) → 200, lead updated; only if lead is assigned to current user.
- `PATCH /api/admin/challenges/enrollment/[id]` (body: `{ "status": "COMPLETED" }`) → 200, enrollment updated; admin only.
