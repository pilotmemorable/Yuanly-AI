# CLAUDE.md — Yuanly 缘旅

Read `PROJECT_HANDOFF.md` first (status, decisions, remaining tasks with exact commands), then `docs/03_Architecture/API_Contract_v1.md` (REST contract — keep it in sync with the code).

## Rules
* Language with the owner: **Turkish** (replies concise). Code/comments/docs: English.
* Never commit secrets: `.env*`, `*.p8`, `~/yuanly-private/secrets.env`. They are git-ignored.
* Exactly one admin: `pilotmemorable@gmail.com`; the ADMIN role must never be assignable via the API.
* Roles: `ADMIN` (web panel only) · `MERCHANT` (company rep: normal app + extra Reservations tab) · `USER`.
* Venue time = Europe/Istanbul (UTC+3, no DST) — never rely on `Intl` time zones in the app.
* No online payments in this release; do not re-introduce fake payment/WeChat/2FA flows.

## Verify before claiming done
```
cd src/backend && npx tsc --noEmit && BASE_URL=http://localhost:5050 npm test     # needs local Postgres (see handoff §6)
cd src/admin-web && npm run typecheck && npm run build
cd src/frontend-mobile && npx tsc --noEmit && npx expo-doctor && npx expo export --platform ios --output-dir .expo-export-check   # delete the output dir afterwards
```
