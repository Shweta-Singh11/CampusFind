# CampusFind — KNIT Lost & Found — Office

A full-stack web application for a college's Lost & Found Office at Kamla Nehru Institute of Technology (KNIT), Sultanpur. Found items are posted publicly so community members can check from their phone, submit claims, and track claim status — all without visiting the office.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Vite + React (JavaScript), React Router v6, Tailwind CSS v3 |
| Backend | Supabase (Postgres, Auth, Storage, RPC) |
| Deployment | Vercel (SPA rewrite via `vercel.json`) |

---

## Project Structure

```
├── index.html
├── vercel.json
├── .env.example
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── supabase/
│   ├── migrations/
│   │   └── 001_init.sql      # Full schema, RLS, views, RPC functions
│   └── seed.sql              # Realistic seed data
└── src/
    ├── main.jsx
    ├── App.jsx               # Router + AuthProvider + Toaster
    ├── index.css             # Tailwind directives + design system
    ├── lib/
    │   ├── supabase.js       # Supabase client (anon key only)
    │   └── api.js            # API layer — all Supabase calls
    ├── contexts/
    │   └── AuthContext.jsx   # Auth state (session + admin profile)
    ├── components/
    │   ├── AdminLayout.jsx   # Admin sidebar / mobile nav
    │   ├── Modal.jsx
    │   ├── Pagination.jsx
    │   ├── PublicHeader.jsx
    │   ├── RequireAuth.jsx
    │   ├── Skeletons.jsx
    │   └── StatusBadge.jsx
    └── pages/
        ├── FoundItemsPage.jsx
        ├── ItemDetailPage.jsx
        ├── ClaimFormPage.jsx
        ├── TrackClaimPage.jsx
        └── admin/
            ├── AdminLoginPage.jsx
            ├── ClaimsDashboardPage.jsx
            ├── ClaimReviewPage.jsx
            ├── LogItemPage.jsx
            ├── InventoryPage.jsx
            └── ReturnsPage.jsx
```

---

## Setup — Step by Step

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → **New Project**.
2. Note your **Project URL** and **anon public key** (Settings → API).

### 2. Run the Database Migration

In the Supabase SQL Editor, open and execute:

```
supabase/migrations/001_init.sql
```

This creates all tables, indexes, RLS policies, the `is_admin()` helper, the `public_found_items` view, and the four RPC functions.

> **Schema note:** The `public_found_items` view uses `security_invoker = false` (definer-style) so the anonymous role can read it without direct table access, satisfying NFR-002. The view only returns unreturned items ("returned" is derived from the `item_return` table, not an `is_returned` column).

### 3. Create Storage Buckets & Policies

In your Supabase SQL Editor, simply open and execute:

```
supabase/migrations/003_storage_setup.sql
```

This single script will automatically:
1. Create the `item-photos-public` bucket (public) and `restricted-files` bucket (private) with 5 MB file limits.
2. Set up all required Row Level Security (RLS) policies allowing public users to view item photos and submit claims/reports, while keeping high-value photos and claimant proofs protected for administrators.

### 4. Create the First Admin Account

**Step A** — In Supabase Dashboard → **Authentication → Users** → **Add user**, create the admin with their email and a secure password. Copy the resulting UUID.

**Step B** — In the SQL Editor:

```sql
insert into office_administrator (auth_user_id, admin_name, admin_contact_no)
values ('cb1c2470-f574-4da8-a2f2-74b883bb530c', 'Vince Ignacio', '09632522467');
```

### 5. Run the Seed (Optional)

After Step 4, run `supabase/seed.sql` in the SQL Editor. Ensure `logged_by = 1` matches your actual `admin_id`. The seed inserts ~10 items (3 high-value), 2 claimants, and claims in each status plus one return record.

### 6. Configure Environment Variables

```bash
cp .env.example .env
# Edit .env:
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 7. Run Locally

```bash
npm install
npm run dev
```

App will be available at `http://localhost:5173`.

### 8. Deploy to Vercel

1. Push the project to GitHub.
2. Import on [vercel.com](https://vercel.com).
3. Add environment variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Deploy. The `vercel.json` SPA rewrite ensures deep links like `/admin/claims/5` work.

---

## Security Design

### RLS

Enabled on every table. Anonymous users have zero direct table access.

### NFR-002 — Photo Access

| Item type | Public list | Admin panel |
|---|---|---|
| Normal | Public URL (`item-photos-public`) | Same |
| High-value | Redacted (null) | Signed URL (10-min TTL, `restricted-files`) |

### NFR-005 — Account Lockout

> **Limitation:** The client tracks failed attempts in `localStorage` and enforces a 15-minute lockout after 5 consecutive failures **per browser session**. A user who clears localStorage can bypass this counter. Supabase Auth's server-side rate limiting is the primary enforcement. For stronger protection, enable it in Supabase Auth settings or implement an Edge Function middleware.

### NFR-006 — Audit Trail

Every approval, rejection, and return records who did it (`reviewed_by` / `returned_by`) and when (`reviewed_at` / `returned_at`).

---

## Functional Requirements Checklist

### FR-001 — Logging Found Items (Admin & Student)
- [ ] Students/Public: Navigate to `/log-item` (or click "Report Found Item" in header) → fill form with photo → item is immediately logged to public view with `logged_by = null`.
- [ ] Administrators: Log in → navigate to `/admin/log-item` → fill form with photo → item is logged with `logged_by = <admin_id>`. Inventory displays the logged administrator's name.

### FR-002 — Finder info is optional
- [ ] On `/admin/log-item`, leave finder fields blank → item logs successfully.

### FR-003 — Public list; high-value items redacted
- [ ] Open `/` without login → high-value items show lock card, no photo, no location.
- [ ] After recording a return, the item disappears from `/`.

### FR-004 — Claim requires info + at least one proof
- [ ] On `/claim/:id`, leave both proof fields blank → Submit disabled.
- [ ] Remove full name or contact → Submit disabled.

### FR-005 — Pending until admin acts; return only for Approved
- [ ] Submit a claim → status is "Pending" in confirmation modal.
- [ ] Approve → status shows "Approved" in dashboard.
- [ ] Try `record_return(pending_claim_id, null)` → error "Only Approved claims".

---

## Bug Fix Checklist (B-01 to B-12)

| ID | Verification |
|---|---|
| B-01 | `/admin/claims/:id`: real data, sticky Approve/Reject bar, "Back to Claims" link, normal scroll. |
| B-02 | Public UI: no "Log Item" link. Admin UI: sidebar shows "Log Item". Log Item form is wide desktop layout. |
| B-03 | High-value card shows real item name. No "Warning" language — uses "High-value item. Details are hidden…". |
| B-04 | `/claim` (no ID): amber notice "No item selected", Submit disabled. `/claim/5`: item chip shows item name. |
| B-05 | Claim with "Remember my details" checked → next `/claim/:id` prefills fields. "Edit" link to unlock. |
| B-06 | Log Item form: category defaults to placeholder, date blank, future dates blocked, `*` on required fields. |
| B-07 | ⓘ tooltip on "High-value item" shows phones, laptops, wallets, IDs, cards, jewelry, cash, ₱1,000+. |
| B-08 | Track a Rejected claim → rejection reason displayed + "Resubmit Claim" button. |
| B-09 | Approve click → confirmation dialog shows claimant name, college ID, item name. Confirm/Cancel. |
| B-10 | Copy proofread: "Successfully", "details", "description", "returned", "Key Chain". Item names from DB. |
| B-11 | Text contrast ≥ 4.5:1. Status labels bold 12 px+. Active nav tab has blue highlight. |
| B-12 | Login page: password show/hide toggle. Wrong credentials → inline error + attempts remaining → lockout message. |
