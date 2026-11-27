# Brew & Book

Coffee shop booking platform MVP for Bangladesh (floor map, booking, pre-order, payments, QR token).

## Prerequisites

- Node.js 20+ (tested with Node 24)
- Docker (for local PostgreSQL)
- npm

## Setup

1. Copy env file:
   ```bash
   cp .env.example .env
   ```
2. Start PostgreSQL:
   ```bash
   docker compose up -d
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Emit Prisma contract and initialize DB:
   ```bash
   npx prisma contract emit
   npx prisma db init
   ```
5. Run dev server:
   ```bash
   npm run dev
   ```

## Key folders

- `src/app` - Next.js App Router
- `src/prisma/contract.prisma` - Prisma ORM contract (data model)
- `src/prisma/db.ts` - database client
- `docker-compose.yml` - local PostgreSQL

## Notes

- This project was initialized with Prisma 8 ORM (contract-based). Use `npx prisma contract emit` after schema changes.
- Payment/SMS credentials in `.env` are placeholders; configure SSLCommerz sandbox and a Bangladesh SMS provider before enabling live flows.
- MVP plan reference: `../Coffee_Shop_Website_5Day_Plan.pdf`
