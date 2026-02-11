# Demo Experience Checklist

After running `npm run seed:demo`, use these logins and verify each section shows real data. All numbers and lists come from the same demo data (no hardcoded UI counts).

---

## Demo logins

| Role        | Email                              | Password  |
|------------|-------------------------------------|-----------|
| Admin      | admin@realtycollective.com          | admin123  |
| Demo Admin | demo-admin@realtycollective.com    | admin123  |
| SSM        | ssm1@demo.realtycollective.com      | demo123   |
| BDM        | bdm1-1@demo.realtycollective.com    | demo123   |

---

## 1. Dashboard

- [ ] **Network Size** – Same count as “Total Network” on My Network tab (downline count from DB).
- [ ] **Total Earned** – Sum of PAID + APPROVED earnings; same underlying data as Income tab.
- [ ] **Upcoming Trainings** – Count of confirmed bookings for future sessions; matches Training → Sessions.
- [ ] **Quick Actions** – Links to Network, Projects, Training, Offers work.

**Login as:** admin@realtycollective.com → should see network size > 0, total earned > 0, upcoming trainings ≥ 0.

---

## 2. Income / Rewards

- [ ] **Total / Pending / Approved / Paid** – Computed from same `Earnings` table used for dashboard “Total Earned”.
- [ ] **Table** – Rows for current user only (admin sees admin earnings; BDM sees BDM + upline bonus rows).
- [ ] **BDM** – Sees own deal earnings; SSM/SM see upline bonus rows from BDM deals (5% each).

**Login as:** bdm1-1@demo.realtycollective.com → should see deal earnings.  
**Login as:** ssm1@demo.realtycollective.com → should see upline bonus earnings.

---

## 3. My Network / Teams (tree)

**Tree View applies to all demo accounts.** Every demo login (Admin, Demo Admin, SSM, BDM) gets the same Tree View experience: hierarchy with You at top, expand/collapse, role/city/team count on cards.

- [ ] **Admin** – Sees full tree (Demo Admin + all SSMs, SMs, BDMs under demo admin).
- [ ] **Demo Admin** – Sees only their downline (SSMs and below).
- [ ] **SSM/SM/BDM** – Sees only their own subtree (direct + indirect downlines).
- [ ] **List view** – Same users as tree; “Total Network” and “Direct Downlines” match dashboard “Network Size” where applicable.
- [ ] **Tree view** – Shows hierarchy (You → direct downlines → their teams); expand/collapse per node; no upline or sibling branches. **Demo accounts default to Tree View** when opening My Network.
- [ ] **All demo logins** – Verify Tree View loads and shows correct subtree for that user (no 403, no empty tree when downlines exist).

**Login as:** admin@realtycollective.com → full tree.  
**Login as:** demo-admin@realtycollective.com → Demo Admin’s downline.  
**Login as:** ssm1@demo.realtycollective.com → only SSM1’s team.  
**Login as:** bdm1-1@demo.realtycollective.com → only BDM1-1’s team.

---

## 4. Projects

- [ ] **List** – Shows demo projects (e.g. 4) with name, status, media.
- [ ] **Detail** – Slab config, description, media, documents (or “no documents”).
- [ ] **Links** – Notices that link to “/projects” open projects list.

---

## 5. Training

- [ ] **Content** – Categories and items (PDFs, DOCX, videos) with download/embed where applicable.
- [ ] **Completion** – Demo completion tracking reflected (e.g. checkmarks) for seeded users.
- [ ] **Sessions** – Upcoming sessions with slots; slot capacities and booked count shown.
- [ ] **Bookings** – Some demo users have bookings; “Upcoming Trainings” on dashboard matches.

---

## 6. Offers / Challenges

- [ ] **Available Challenges** – List of active demo challenges (rewards, requirements, end date).
- [ ] **Wall of Challengers** – Enrollments with user name, role, city, challenge title, status (Active/Completed).
- [ ] **My enrollments** – “Take This Challenge” / “You’re enrolled!” consistent with backend.
- [ ] **Interactions** – Enrolling updates my-enrollments and wall (real API, no fake counters).

---

## 7. Notices / Hot bar

- [ ] **Hot notice bar** – Shows at least one global notice with title/body and link (when logged in).
- [ ] **Links** – Notices link to real routes: /projects, /training, /offers, /dashboard.
- [ ] **Notifications page** – Same global notices listed with “View →” to same links.

---

## 8. Data consistency (no fake numbers)

- [ ] Dashboard “Network Size” = count from `/api/network/all` (or tree) for that user.
- [ ] Dashboard “Total Earned” = sum of PAID + APPROVED from same Earnings rows shown in Income tab.
- [ ] Dashboard “Upcoming Trainings” = count of user’s future confirmed bookings (same as in Training → Sessions).
- [ ] Income tab totals = sum of amounts from the same Earnings API used for dashboard.

---

## Quick verification (one admin + one user)

1. **Admin (admin@realtycollective.com / admin123)**  
   - Dashboard: Network Size > 0, Total Earned > 0.  
   - Income: rows present, totals match dashboard logic.  
   - Network: full tree with Demo Admin and all demo users.  
   - Projects, Training, Offers: lists and detail pages populated.  
   - Hot bar: at least one notice with link.

2. **User (bdm1-1@demo.realtycollective.com / demo123)**  
   - Dashboard: Network Size = their downline count; Total Earned from their earnings (deals + any upline bonus).  
   - Income: only their earnings.  
   - Network: only their subtree.  
   - Projects, Training, Offers: same modules, data filtered by role/visibility where applicable.

If any section is empty after re-seeding, check:

- `npm run seed:demo` completed without errors.
- Logged in with the correct demo user (token present; requests use `Authorization: Bearer <token>`).
- Backend uses subtree/earnings for current user only (no cross-user data for non-admin).
