# Common Goods — Phase 7 (admin dashboard)

There's now a protected `/admin` area: a dashboard, product/category
management, and order management with status updates that email the
customer automatically.

## What changed from Phase 6

- `supabase/migrations/0005_admin_access.sql` — an `admins` table, an
  `is_admin()` helper function, and admin read/write RLS policies across
  products, categories, product_images, orders, order_items, payments,
  and customers. Also adds one small column (`detail`) to `email_log`
  from Phase 6, needed so a status-update email can go out once per
  status rather than only the first time ever.
- `proxy.ts` / `lib/supabase/middleware.ts` — now also protects
  `/admin/*`: signed out → sent to login; signed in but not an admin →
  sent home (not to login, since logging in again wouldn't help).
- `app/admin/*` — dashboard, products (list/create/edit/publish/delete),
  categories (list/create/delete), orders (search/filter/detail/status
  update).
- `lib/actions/admin-products.ts`, `admin-categories.ts`,
  `admin-orders.ts` — the Server Actions behind all of the above. Every
  one of them checks `isCurrentUserAdmin()` itself, on top of the
  middleware and the admin layout both already checking — nothing here
  relies on a link just being hidden from non-admins.

## Making yourself an admin

There's deliberately no "become an admin" button anywhere in the app —
the spec is explicit that public registration must never grant admin
access. The only way in is a manual database insert, run once by you:

**1.** Sign in to the storefront at least once with the Google account
you want to use as admin (so a row exists for you in `auth.users`).

**2.** In Supabase's SQL Editor, run:
```sql
insert into admins (auth_user_id)
select id from auth.users where email = 'your-email@gmail.com';
```

**3.** Run the migration first if you haven't:
`supabase/migrations/0005_admin_access.sql`.

**4.** Visit `/admin` while signed in as that account.

## What admins can do

- **Dashboard** — order counts by status, total revenue from paid
  orders, and a low-stock list (anything under 5 units).
- **Products** — create, edit, publish/unpublish, delete. Images are
  managed by pasting a URL for now (see note below).
- **Categories** — create and delete. Deleting a category never deletes
  its products — they just become uncategorized (`category_id` is set
  to null, same as the Phase 1 schema already allowed).
- **Orders** — search by order number or customer name, filter by
  status, view full detail (items, totals, customer contact info,
  delivery address, payment status/reference), and change status.
  Changing status to Shipped, Delivered, or Cancelled sends the
  matching email from Phase 6 automatically — that's the payoff of
  having written those templates ahead of time.

## One decision worth knowing about

**Product images are URLs, not file uploads.** Building a real upload
flow means setting up a Supabase Storage bucket, upload policies, and
image-processing concerns that are a whole topic on their own. Pasting a
URL (e.g. from Unsplash, or your own hosting) gets the feature working
now; swapping it for real file uploads to Supabase Storage later only
touches `ProductImageManager.tsx` and the `addProductImage` action —
nothing else in the app needs to change.

## Running it

`npm install` only if you're setting this up fresh (nothing new was
added to package.json this phase, so if you're copying files into an
existing Phase 6 folder, no install needed). Run the new migration, make
yourself an admin as above, `npm run dev`, and visit `/admin`.
