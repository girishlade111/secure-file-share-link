# Secure File Share Link

A secure file-sharing web app: upload a file, get a short shareable link (`/f/<token>`), optionally protect it with a password and set an expiry time. Links expire automatically; expired files are cleaned up by a cron route. Built with **Next.js 15 (App Router)**, **better-auth**, and **Turso (libSQL)** via Drizzle ORM.

> Originally scaffolded from an Orchids.app project; refactored into this repo.

## Features

- **Upload & share** — drop a file, receive a short token link instantly
- **Password protection** — optional per-file password, hashed with bcrypt
- **Expiring links** — configurable expiry (default 5 minutes); expired files auto-cleaned
- **Auth** — email + password sign-up/login via better-auth (register, login pages)
- **File pages** — `/f/[token]` renders a download page per share link
- **Cleanup cron** — `/api/cron/cleanup` route deletes expired records/files
- **Rate-friendly UI** — shadcn/ui components, Tailwind CSS, Lucide icons

## Tech Stack

- **Next.js 15** (App Router, server components + API routes)
- **better-auth** — email/password auth with drizzle adapter
- **Drizzle ORM** + **@libsql/client** — Turso-hosted SQLite database
- **bcryptjs** — password hashing
- **shadcn/ui** (Radix primitives), **Tailwind CSS**
- **nanoid** — share tokens

## Quick Start

```bash
npm install

# 1. Copy .env.example values into .env:
#    TURSO_CONNECTION_URL=libsql://<db>.turso.io
#    TURSO_AUTH_TOKEN=<token>
#    BETTER_AUTH_SECRET=<random-32+chars>

npm run dev       # http://localhost:3000
npm run build
npm start
```

Requires **Node 20+**. Apply migrations first if the DB is fresh: `npx drizzle-kit push` (see `drizzle/` + `drizzle.config.ts`).

## Project Structure

```
src/
  app/
    page.tsx                 # landing / upload UI
    f/[token]/page.tsx       # share-link download page
    login/ register/         # auth pages
    api/
      upload/route.ts        # POST multipart upload -> token link
      download/[token]/route.ts  # GET file stream
      auth/[...all]/route.ts # better-auth handler
      cleanup/route.ts       # manual cleanup trigger
      cron/cleanup/route.ts  # scheduled expiry cleanup
  db/
    index.ts                 # libsql client + drizzle instance
    schema.ts                # files, user, session, account, verification tables
  lib/
    auth.ts                  # better-auth config (drizzle adapter, bearer plugin)
    auth-client.ts           # client-side auth helpers
    cleanup.ts               # expiry sweep logic
    utils.ts                 # cn() etc.
  components/ui/             # shadcn/ui primitives
  hooks/use-mobile.ts
drizzle/                     # generated migrations
drizzle.config.ts
middleware.ts
```

## Env Vars

| Variable | Purpose |
|---|---|
| `TURSO_CONNECTION_URL` | libSQL connection URL (e.g. `libsql://….turso.io`) |
| `TURSO_AUTH_TOKEN` | Turso auth token |
| `BETTER_AUTH_SECRET` | better-auth session secret (32+ random chars) |

All three are required; the app cannot run without a database.

## Deploy Notes

- Deploys to **Netlify** (Next.js runtime); set the three env vars above in the site settings.
- ⚠️ **Storage caveat:** uploaded files are written to `<cwd>/uploads`, which is **ephemeral** on serverless hosts (Netlify functions). Upload and download usually work within the same warm function instance, but files are not durable — for production, swap `uploads/` for object storage (S3/R2) in `src/app/api/upload/route.ts`.
- Scheduled cleanup: wire `/api/cron/cleanup` to a scheduled function or external cron hit.

## Credits

Built by **Girish Lade** — https://ladestack.in
