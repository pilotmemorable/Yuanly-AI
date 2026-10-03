# Yuanly 缘旅 — Project Handoff (continue on Claude / any platform)

> Last updated: 2026-10-04 00:20 (Europe/Istanbul). Branch: `pilotmemorable-yuanly-testflight-release` (GitHub `pilotmemorable/Yuanly-AI`).
> Written by GitHub Copilot app before its monthly quota ended. **Everything below is verified against the repo state at the last commit unless marked "NOT VERIFIED".**

## 0. TL;DR (Türkçe özet)

* Hedef: **yarın** son kullanıcılarla test için uygulamayı **App Store Connect → TestFlight**'a hazır hale getirmek.
* Backend (Express + Prisma + **PostgreSQL**), mobil uygulama (Expo SDK 54) ve yönetim paneli (Vite React) yeniden yazıldı. Backend uçtan uca duman testi **55/55 geçti** (yerelde).
* Yetki modeli: **ADMIN = sadece `pilotmemorable@gmail.com`** (yönetim paneli, web). **MERCHANT = firma yetkilisi**: son kullanıcıyla aynı ekranlar + **ekstra "Rezervasyonlar" sekmesi** (rezervasyon alma/yönetme). **USER = son kullanıcı**. Roller yalnızca admin panelinden atanır.
* **Engel #1:** Backend henüz yayında değil. Railway "Free plan resource provision limit exceeded" hatası verdi (hesapta `distinguished-flow` ve `zucchini-optimism` adlı eski projeler var). Plan yükseltilmeli / eski proje silinmeli ya da başka host seçilmeli (bkz. §5.1). Mobil uygulama API adresini `app.json → extra.apiUrl` içinden alıyor (şu an `REPLACE_ME_API_HOST`).
* **Engel #2:** App Store Connect API anahtarı geldi (`Key ID = RN725U76DV`, dosya `~/.appstoreconnect/private_keys/AuthKey_RN725U76DV.p8`), ama **Issuer ID** henüz yok (ASC → Users and Access → Integrations → App Store Connect API sayfasının en üstünde yazar). Bu olmadan ASC API / `eas submit` kullanılamaz.
* Ekran görüntüleri (App Store / iPad) henüz üretilmedi; plan §5.5.

## 1. Repository layout

```
Dockerfile, railway.json, .dockerignore     single image: API + admin panel (Railway-ready)
src/backend/                                Express 4 + Prisma 5 + PostgreSQL (TypeScript)
  prisma/schema.prisma, migrations/         Postgres init migration (20261003205816_init)
  prisma/seed.ts                            admin bootstrap + demo catalogue
  src/{controllers,routes,services,middleware,utils,config}
  scripts/smoke-test.ts                     55-check E2E API test  (npm test)
  legal/{privacy,terms,support}.md          served at /privacy /terms /support
  .env.example
src/admin-web/                              Vite + React + TS admin panel (Turkish UI), served by backend at /admin
src/frontend-mobile/                        Expo SDK 54 / RN 0.81 iOS app (CN/EN/TR)
docs/03_Architecture/API_Contract_v1.md     **source of truth for the REST API**
docs/Legal/                                 privacy / terms / support (EN + 中文)
metadata/ios/{en-US,zh-Hans}/               App Store text metadata (needs refresh: no WeChat/payment claims)
screenshots/, outputs/                      OLD mock screenshots + generator (stale, to be replaced)
photos/                                     brand images (logo: "Y" wave+gold ribbon, 缘旅)
eksik_isler.md                              checklist (Turkish)
```
Removed as obsolete/insecure: old `src/frontend-web` (incompatible with backend), mock `server.js`, `/v1/payment/*`, WeChat login, mock 2FA `123456`, SQLite schema.

## 2. Product requirements (from the owner)

1. Ship to TestFlight, test with real end users tomorrow.
2. Admin panel: **only `pilotmemorable@gmail.com`** may be admin. Everyone else is either **firma yetkilisi** (company rep, `MERCHANT`) or **son kullanıcı** (`USER`).
3. Company rep takes and manages reservations; has the same screens as end users **plus one extra "Reservations" tab**.
4. End-user UI: simple, elegant, visual, "3D / AI-assisted" look (brand: turquoise `#40E0D0`, gold `#D4AF37`, logo in `photos/`). App Store/TestFlight needs screenshots for all required iPhone + iPad sizes.
5. Automate everything possible in App Store Connect.

## 3. Architecture & key decisions

* **Auth**: email + password (scrypt hash), JWT (30d user/rep, 12h admin). No SMS/email provider yet → no email verification / self-service password reset (admin can reset passwords in the panel). WeChat login and 2FA removed (they were mock = account takeover).
* **Admin binding**: `ADMIN_EMAIL` env (default `pilotmemorable@gmail.com`). `bootstrapAdmin()` creates/keeps exactly one ADMIN, demotes any other ADMIN, password from `ADMIN_PASSWORD` on first boot (`ADMIN_FORCE_PASSWORD_RESET=true` re-applies). ADMIN role cannot be granted/created through any API; `requireAdmin` checks role **and** email.
* **Roles in mobile**: `GET /auth/me` returns `role` + `merchant`. `MERCHANT` gets 5 tabs (Explore, **Reservations**, My Trips, AI, Profile); others 4. Guests can browse (App Store 5.1.1) and are prompted to sign in to reserve.
* **Reservations**: no online payment in this release ("pay at venue"). User creates `PENDING` booking → seats reserved atomically (row lock) → company confirms/rejects → `CONFIRMED` gets QR token. Statuses `PENDING|CONFIRMED|REJECTED|CANCELLED|COMPLETED|NO_SHOW`. Companies can create manual (phone/walk-in) reservations (`source=MANUAL`, find-or-create slot). Time zone **Europe/Istanbul UTC+3** everywhere.
* **Account deletion** (`DELETE /auth/me`) anonymises data (App Store 5.1.1(v)).
* **Security fixes vs. prior code**: removed SQL-"sanitizer" that corrupted data (now strips HTML only, passwords untouched), mass-assignment in experience update, unauthenticated payment webhook/refund, default JWT secret (now required ≥32 chars in prod), `trust proxy`, rate limits, helmet CSP, 1 MB body limit, CORS allow-list.
* **AI concierge**: rule-based + simulated translation/STT (beta). Mobile hides the microphone and shows a disclaimer. Do not market it as real LLM/voice.
* **Demo data**: `SEED_DEMO=true` creates 3 companies / 4 experiences (Wikimedia Commons images, ratings 0) and 30 days of slots (topped up every 6 h). `DEMO_USER_*` / `DEMO_MERCHANT_*` env create review/test accounts (merchant linked to `demo-merchant-azure`).

## 4. Verification status

| Item | Status |
|---|---|
| Backend `tsc --noEmit`, `npm run build` | ✅ |
| Backend smoke test (local Postgres 16) `npm test` | ✅ 55/55 |
| Admin panel `npm run typecheck && npm run build`; served at `/admin` by backend (HTTP 200) | ✅ (UI not clicked through) |
| Mobile `npm install`, `expo install --check`, `tsc --noEmit`, `expo-doctor`, `expo export --platform ios` | ✅ (per sub-agent report) |
| Docker image build (`Dockerfile`) | ❌ NOT VERIFIED (no Docker locally; will run on Railway) |
| Mobile app running in simulator / on device against the API | ❌ NOT VERIFIED |
| Admin panel in a real browser against the API | ❌ NOT VERIFIED |
| EAS cloud build of the new SDK 54 app | ❌ NOT DONE |
| Anything in App Store Connect | ❌ NOT DONE |

Code review of the mobile/admin code written by sub-agents has **not** been done line-by-line — review `ReservationsScreen`, `NewReservationScreen`, `api.ts`, `AuthContext`, `AppNavigator`, and the admin `UsersPage`/`ReservationsPage` before release.

## 5. Remaining work (priority order, with commands)

### 5.1 Deploy backend + Postgres (BLOCKER)
Railway CLI is logged in as `pilotmemorable@gmail.com` (`npx @railway/cli whoami`). `railway init --name yuanly-ai` failed: **"Free plan resource provision limit exceeded"**. Options: (a) upgrade the Railway plan, (b) delete an old project (`distinguished-flow`, `zucchini-optimism` — check they are not needed), (c) use another host (Render, Fly.io, etc. — anything that runs the root `Dockerfile` and provides Postgres; health check `GET /health`).
Required env vars (values: `~/yuanly-private/secrets.env`, **never commit**):
`DATABASE_URL` (Railway Postgres reference), `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SEED_DEMO=true`, `DEMO_USER_EMAIL/PASSWORD`, `DEMO_MERCHANT_EMAIL/PASSWORD`, `NODE_ENV=production`. Container start = `prisma migrate deploy && node dist/src/index.js`; listens on `$PORT`.
Railway flow: `railway init -n yuanly-ai` → `railway add --database postgres` → `railway add --service api` → `railway variables --set ...` → `railway up --service api --detach` → `railway domain`. Then run:
`cd src/backend && BASE_URL=https://<domain> ADMIN_PASSWORD=<...> npm test` (creates/deletes its own test users; leaves a few test rows).

### 5.2 Point the app at the API
Edit `src/frontend-mobile/app.json → expo.extra.apiUrl = "https://<domain>/v1"` (HTTPS only, no ATS exceptions). Commit.

### 5.3 Build & upload iOS (EAS)
EAS account `pilotmemorable` (logged in), project id `517b0337-e186-440c-b6c9-b724f2a75a79`, slug `yuanly-backend`, bundle `com.yuanly.ai`, ASC app id `6818868954`, team `7SB3772A34`. Old builds 1–3 are the *previous* (non-functional) app — ignore them.
```
cd src/frontend-mobile && npm install
npx eas-cli build --platform ios --profile production --non-interactive   # SDK 54 image = Xcode 26 (Apple requires iOS 26 SDK since Apr 2026)
npx eas-cli submit --platform ios --profile production --latest
```
For non-interactive submit put the ASC API key in `eas.json → submit.production.ios`: `ascApiKeyPath` (`~/.appstoreconnect/private_keys/AuthKey_RN725U76DV.p8`), `ascApiKeyId` (`RN725U76DV`), `ascApiKeyIssuerId` (**ask owner**) — don't commit the issuer/path if you consider them sensitive. Increment: `autoIncrement: true` (remote). If EAS cannot sign, Apple team `7SB3772A34` (Mehmet Tuluoglu) needs a distribution cert/profile — EAS manages it via the API key.
Fallback: local build with Xcode 27 + fastlane 2.240.1 (`~/.local/bin/fastlane`) — risky with RN 0.81 on Xcode 27.

### 5.4 App Store Connect automation (needs Key ID RN725U76DV + Issuer ID)
Use the App Store Connect API (JWT ES256, `aud=appstoreconnect-v1`, ≤20 min) or fastlane (`deliver`, `pilot`, `produce`). Set:
* App info: name `Yuanly 缘旅` (en: "Yuanly AI"), subtitle, category Travel, primary language zh-Hans (+ en-US, tr optional), copyright, age rating (no UGC/gambling; AI chat → answer honestly), content rights, price Free.
* Version metadata from `metadata/ios/{en-US,zh-Hans}` — **rewrite first**: remove WeChat Pay/Alipay/"2FA"/"voice" claims; say "reserve, pay at venue; AI assistant (beta)".
* URLs: privacy `https://<domain>/privacy`, support `https://<domain>/support`, marketing optional.
* App Privacy ("nutrition label"): Contact info (email, name, phone optional), User content (AI chat messages), Identifiers none, **no tracking**. Account deletion is in-app (Profile → Delete account).
* Export compliance: `ITSAppUsesNonExemptEncryption=false` already in `app.json`.
* TestFlight: beta app description, feedback email `pilotmemorable@gmail.com`, contact name Mehmet Tuluoglu / phone +905301424515, **beta review notes + demo accounts** (`reviewer.user@yuanly.app`, `reviewer.company@yuanly.app` — passwords in `~/yuanly-private/secrets.env`), internal group "Internal" (add ASC users; no review, available as soon as the build finishes processing — **the only way to test tomorrow without waiting**), external group "Beta Testers" + public link (first external build needs Beta App Review, usually <24–48 h).
* Screenshots (§5.5) via `appScreenshotSets`/`appScreenshots` or `fastlane deliver`.

### 5.5 Screenshots / visuals
Required: **iPhone 6.9" 1320×2868** (mandatory; older sizes scale), optionally 6.5" 1284×2778; **iPad 13" 2064×2752** (mandatory because `supportsTablet: true` — set it to `false` in `app.json` to skip iPad). Plan: run the app in Xcode simulators (iPhone 17 Pro Max / iPad Pro 13", Xcode 27 installed) against the seeded local backend, capture real screens (Explore, Detail, Reserve, My Trips + QR, AI concierge, Company "Reservations"), then compose marketing frames with Pillow (venv: `python3 -m venv /tmp/imgenv && /tmp/imgenv/bin/pip install pillow`): soft turquoise→white gradient, glass cards, 3D-style floating device, gold accent, CN headline + EN/TR subtitle, font `/System/Library/Fonts/PingFang.ttc`. 6–8 images per size. Output under `screenshots/ios/<size>/`. Old `screenshots/*` and `outputs/generate_screenshots.py` are stale mock-ups — replace.
Logo/icon already generated: `src/frontend-mobile/assets/{icon,splash-icon,adaptive-icon,favicon}.png` (from `photos/ChatGPT Görseli 2 Eki 2026 17_27_04.png`).

### 5.6 Hardening backlog (after tomorrow's test)
SMTP (Resend/Postmark) for email verification + password reset; push notifications (expo-notifications + APNs via EAS); real payments (WeChat Pay/Alipay/Stripe) + the existing `Payment` model; real LLM/STT/translation; Sentry; CI (typecheck + `npm test` on PR); admin 2FA (TOTP); pagination in mobile lists; i18n review by a native speaker.

## 6. Run everything locally

```bash
# Postgres 16 (brew installed). Private throw-away instance:
PGBIN=/opt/homebrew/opt/postgresql@16/bin
$PGBIN/initdb -D /tmp/yuanly-pg -U yuanly --auth=trust -E UTF8
$PGBIN/pg_ctl -D /tmp/yuanly-pg -o "-p 54329 -k /tmp" -l /tmp/yuanly-pg.log start
$PGBIN/createdb -h localhost -p 54329 -U yuanly yuanly_dev

cd src/backend && npm install
export DATABASE_URL=postgresql://yuanly@localhost:54329/yuanly_dev ADMIN_PASSWORD='LocalAdmin#2026test' SEED_DEMO=true \
       JWT_SECRET=local-test-secret-0123456789-0123456789-abcdef PORT=5050   # macOS AirPlay occupies :5000
npx prisma migrate deploy && npx ts-node src/index.ts          # or: npm run dev
BASE_URL=http://localhost:5050 npm test                        # smoke test
cd ../admin-web && npm install && npm run build                # backend serves it at /admin
cd ../frontend-mobile && npm install && EXPO_PUBLIC_API_URL=http://<LAN-IP>:5050/v1 npx expo start
```
Gotchas: `pkill` is blocked in the Copilot sandbox (use `kill <pid>`); npm 11 prints "install-scripts" warnings — harmless; Prisma needs `openssl` in Docker (already in Dockerfile).

## 7. Credentials & where they live (none are in git)

| What | Where |
|---|---|
| Generated prod secrets (`JWT_SECRET`, `ADMIN_PASSWORD`, demo/reviewer passwords) | `~/yuanly-private/secrets.env` (mode 600; copy also in Copilot session files) |
| ASC API key `.p8` (Key ID `RN725U76DV`) | `~/.appstoreconnect/private_keys/AuthKey_RN725U76DV.p8` (+ copy in `~/yuanly-private/`) — **Issuer ID still needed** |
| Railway | CLI session (`railway whoami` = pilotmemorable@gmail.com) |
| Expo/EAS | CLI session (`eas whoami` = pilotmemorable; second account `pilotmemorable-app`) |
| GitHub | `gh` as `pilotmemorable` |
| Apple team | `7SB3772A34` (Mehmet Tuluoglu); ASC app id `6818868954`; bundle `com.yuanly.ai` |

Admin login (after deploy): `https://<domain>/admin` → `pilotmemorable@gmail.com` + `ADMIN_PASSWORD`. Change it from the "Hesabım" page after first login.

## 8. Open questions for the owner
1. Railway: upgrade, delete an old project, or switch host?
2. ASC **Issuer ID**.
3. Internal testers' Apple-ID emails (to invite as App Store Connect users) and the list of external testers.
4. Keep `supportsTablet: true` (needs iPad screenshots) or ship iPhone-only for the first beta?
5. Final display name: "Yuanly 缘旅" vs "Yuanly AI".
