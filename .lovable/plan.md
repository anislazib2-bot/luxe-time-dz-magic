# LUXE TIME DZ — Build Plan

A luxury Arabic-first watch e‑commerce site for Algeria, with a working admin dashboard backed by Lovable Cloud (Postgres + Auth + Storage).

The spec is very large. To ship something **actually production-ready** instead of a shallow demo, I'll build it in 2 phases. **Phase 1 in this turn** delivers a complete, usable store + admin. **Phase 2** in a follow-up turn adds the secondary features (wishlist, coupons, multi-language switch, customer area pages, content editor).

---

## Phase 1 — Core store + admin (this turn)

### Design system
- Black + Gold + White luxury theme in `src/styles.css` (oklch tokens, gold gradient, elegant shadows)
- Arabic-first: `<html lang="ar" dir="rtl">`, Cairo (Arabic) + Playfair Display (Latin display) via Google Fonts `<link>` in `__root.tsx`
- Mobile-first responsive, premium hover/transition utilities

### Database (one migration)
- `profiles` (id → auth.users, full_name, phone)
- `app_role` enum + `user_roles` + `has_role()` security-definer function (admin role gate)
- `categories` (id, slug, name_ar, name_fr, name_en)
- `products` (id, slug, name_ar, name_fr, name_en, description_ar, brand, gender, category_id, price_dzd, discount_price_dzd, stock, images jsonb, featured, is_new, is_limited, created_at)
- `wilayas` (code, name_ar, name_fr, delivery_home_dzd, delivery_office_dzd) — seeded with all 58 Algerian wilayas
- `orders` (id, order_number, customer_user_id nullable, full_name, phone, wilaya_code, commune, address, delivery_type, subtotal_dzd, delivery_dzd, total_dzd, status enum, notes, created_at)
- `order_items` (order_id, product_id, name_snapshot, price_snapshot, quantity)
- Full GRANTs + RLS: public SELECT on products/categories/wilayas; orders insertable by anyone (guest checkout), admin-only update; profiles self-only; user_roles admin-managed
- Seed ~12 realistic watches using the uploaded reference images (uploaded to Cloud Storage `product-images` bucket)

### Public storefront (TanStack routes, SSR, SEO meta on every route)
- `/` Home — luxury hero, featured, new arrivals, limited edition, trust strip, FAQ accordion, newsletter, footer
- `/shop` — grid with filters (brand, gender, category, price range, in-stock) + sort + search, URL-driven via `validateSearch`
- `/product/$slug` — gallery with zoom, specs, DZD price w/ discount, stock badge, qty + Add to cart
- Cart drawer (Zustand) persisted to localStorage
- `/checkout` — full name, phone (DZ format validated), wilaya select (auto-computes delivery), commune, address, delivery type (home/office), COD only, places order via server fn → success page with order number
- `/order/$orderNumber` — public order lookup (by number + phone)
- `/auth` — email/password + Google sign-in (Lovable managed)

### Admin dashboard `/admin/*` (role-gated)
- `_authenticated` route + admin role check via `has_role` RPC; redirect non-admins
- `/admin` overview — total revenue, order count by status, top 5 products, recent orders
- `/admin/orders` — table with status filter, click to detail, update status (pending → confirmed → preparing → shipping → delivered / cancelled)
- `/admin/products` — list, create, edit, delete, toggle stock/featured, multi-image upload to Storage
- `/admin/wilayas` — edit delivery price per wilaya

### Server layer
- `createServerFn` for: `placeOrder` (public), `lookupOrder`, `adminListOrders/updateOrderStatus`, `adminCreate/Update/DeleteProduct`, `adminStats` — all admin fns gated by `requireSupabaseAuth` + `has_role` check
- Zod validation on every input
- TanStack Query for cache + invalidation

### Bootstrapping the first admin
On `/admin` first visit, if zero admins exist in `user_roles`, the signed-in user can claim admin (one-time). After that the page is locked.

---

## Phase 2 — Follow-up (next turn, after you confirm Phase 1 looks right)

- Customer area: `/account` profile, order history, wishlist
- Wishlist table + heart toggle on product cards
- Coupons table + apply at checkout
- Language switch (ar/fr/en) with i18n context — schema already stores all three locales
- Homepage banner/content editor in admin
- Customer reviews on product page
- Newsletter subscribers table
- Sitemap.xml + robots.txt

---

## Technical notes (for me)
- TanStack Start v1, file-based routes, RTL via `dir="rtl"` on `<html>` + Tailwind logical properties (`ps-*`, `pe-*`, `ms-*`, `me-*`)
- Product images → Lovable Cloud Storage bucket `product-images` (public read)
- All money stored as integer DZD (no decimals — DZD has no subunit in practice)
- All admin server fns: `requireSupabaseAuth` + `has_role(userId, 'admin')` check inside handler
- No mock data on rendered pages — everything reads from DB; seed runs in migration

---

## What I will NOT do this turn
- Wishlist, coupons, language switcher UI, content editor, customer profile page, reviews. They're listed in Phase 2 above.

If this plan is good, approve it and I'll start building. If you want me to reshuffle priorities (e.g. skip admin and do customer area first, or do language switcher in Phase 1), tell me now.
