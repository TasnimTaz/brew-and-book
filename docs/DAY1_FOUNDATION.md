# Day 1 - Foundation, Design, and Data

## Status

- [x] Repo scaffolded (Next.js + Tailwind + TypeScript + ESLint, App Router, `src/`)
- [x] Git initialized with baseline commits
- [x] PostgreSQL running via Docker Compose (host port `5433`)
- [x] Prisma 8 ORM contract defined at `src/prisma/contract.prisma`
- [x] DB initialized (`npx prisma db init`) and seeded (`npm run db:seed`)
- [x] Read-only APIs: `GET /api/tables`, `GET /api/menu`, `GET /api/slots`
- [x] Base theme: coffee brown/cream palette, Noto Sans + Noto Sans Bengali
- [ ] SSLCommerz merchant/sandbox application submitted (manual)
- [ ] SMS provider account/application submitted (manual)

## Seed data

- 15 tables across zones: Window, Center, Family, Outdoor, Quiet (2/4/6 seats)
- 9 time slots (90-minute intervals, 08:00-21:30)
- 5 menu categories, 25 menu items (BDT prices, Bangla names, options/tags)

## Wireframe outline (mobile-first)

1. **Home / Floor Plan** - date + slot selector, seat/zone filters, SVG map with color legend, table tap opens bottom sheet.
2. **Table Detail / Menu Panel** - table info (code, seats, zone), menu categories tabs, item cards (name, Bangla name, BDT price, options/tags), add-to-order CTA.
3. **Booking Form** - name, phone (OTP), guests (<= seats), special note, pre-order summary, payment choice.
4. **Token Page** - token ID, serial, table, masked phone, date/time, guests, payment status, QR, download/share.
5. **Admin** - login, today's bookings, live map override, menu/table CRUD, check-in by QR/token.

## Theme tokens

- Background: `#f7f3ee` (cream)
- Surface: `#fffaf5`
- Primary: `#6b4f3a` (coffee brown)
- Primary dark: `#4e3828`
- Accent: `#c89b6d`
- Fonts: Noto Sans + Noto Sans Bengali

## Manual prereq actions

- **SSLCommerz:** apply for sandbox/merchant account, obtain Store ID/Password, set `SSLCOMMERZ_*` in `.env`.
- **SMS provider (BD):** evaluate SSL Wireless/BulkSMSBD or equivalent, obtain API credentials, set `SMS_*` in `.env`.
- **Payment safety:** confirm payments server-side via IPN/validation; never trust browser redirect alone.
