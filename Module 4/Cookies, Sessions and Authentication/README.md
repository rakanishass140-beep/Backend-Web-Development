# LU48 — Cookie and Server-Side Session Authentication

Express and Prisma demo implementing login, protected identity, and logout with a signed `sid` cookie and server-side session mapping.

## Setup

```bash
cp .env.example .env
npm install
npm run setup
npm run dev
```

Set `COOKIE_SECRET` to a random secret with at least 32 characters. Use `COOKIE_SECURE=false` for local HTTP testing; set it to `true` in production and serve over HTTPS. Cookie options are centralized: HttpOnly, SameSite=Lax, signed, path=/, and a deliberate max age controlled by `SESSION_TTL_MS`.

Seeded demo account: `sam@example.com` / `SessionDemo!48`.

## Endpoints

- `POST /auth/login`: accepts email/password, verifies credentials, creates a server-side session, sets signed `sid`, and returns only safe identity fields.
- `GET /auth/me`: resolves a verified signed cookie through the store and returns safe identity fields for a valid session.
- `POST /auth/logout`: destroys the server-side session and clears the cookie; idempotently returns `204`.

Unknown email and incorrect password use the same generic `401`. Missing, invalid, expired, or orphaned sessions return generic `401`. Malformed JSON/input returns `400`; unexpected errors return controlled `500` output.

## Local verification (curl)

Login and save cookies:

```bash
curl -i -c cookies.txt -H 'Content-Type: application/json' \
  -d '{"email":"sam@example.com","password":"SessionDemo!48"}' \
  http://localhost:3000/auth/login
```

Call protected identity:

```bash
curl -i -b cookies.txt http://localhost:3000/auth/me
```

Logout and test the cleared session:

```bash
curl -i -b cookies.txt -c cookies.txt -X POST http://localhost:3000/auth/logout
curl -i -b cookies.txt http://localhost:3000/auth/me
```

Inspect login `Set-Cookie` for `sid`, `HttpOnly`, and `SameSite=Lax`. Production configuration adds `Secure`; clients must use HTTPS to send Secure cookies.

## Session storage caveat

The provided Map-based session store is for learning and local execution only. It is lost on restart and is not shared across server instances. Production should use a shared expiring store such as Redis, with appropriate access and operational controls.

Do not commit `.env`, real secrets, passwords, session IDs, or password hashes.
