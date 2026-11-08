# Lostly frontend

## Setup

1. Install Node.js and the frontend dependencies from this directory:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_API_URL` to the backend API URL.
3. Start the frontend:

   ```bash
   npm run dev
   ```

   Open `http://localhost:3000`.

## Scripts

- `npm run dev` — start the development server.
- `npm run lint` — run Next.js ESLint checks.
- `npx tsc --noEmit` — type-check the frontend.
- `npm run build` — create a production build.
