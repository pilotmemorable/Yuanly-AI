# Yuanly AI — API Contract v1 (implemented)

This document is the **source of truth** for the REST API consumed by the iOS app
(`src/frontend-mobile`) and the admin web panel (`src/admin-web`). It supersedes the
aspirational `API_Detailed_Specs.md`.

* Base URL: `https://<host>/v1` (local: `http://localhost:5000/v1`)
* Format: JSON. All timestamps are ISO-8601 UTC strings.
* Auth: `Authorization: Bearer <jwt>`.
* Language: optional `Accept-Language: zh|en|tr` header.
* Errors: HTTP status + `{ "error": "message", "error_code": "ERR_..."? }`.
  Statuses used: 400 validation, 401 unauthenticated, 403 forbidden, 404, 409 conflict, 429 rate limit.
* Venue time zone is **Europe/Istanbul (UTC+03:00, no DST)**. Clients must display slot
  times in that zone and send merchant-entered local times with an explicit `+03:00` offset.

## 1. Roles

| Role       | Meaning (TR / EN)                    | How it is assigned |
|------------|---------------------------------------|--------------------|
| `ADMIN`    | Yönetici — **only** `pilotmemorable@gmail.com` | Bootstrapped by the server from `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Cannot be granted, revoked or created through any API. |
| `MERCHANT` | Firma yetkilisi / company representative | Set by the admin (admin panel). Linked to exactly one `Merchant` (company). |
| `USER`     | Son kullanıcı / end user              | Default for every self-registered account. |

Mobile app: `USER` and `MERCHANT` see the **same screens**; `MERCHANT` additionally gets one
extra **Reservations** tab. The admin panel is web-only and only `ADMIN` may log in.

## 2. Objects

### User
```json
{
  "id": "uuid", "email": "a@b.com", "fullName": "Zhang Wei", "phone": "+86…"|null,
  "avatar": null, "role": "USER|MERCHANT|ADMIN",
  "membershipLevel": "GUEST|SILVER|GOLD|VIP", "preferredLanguage": "CN|EN|TR",
  "trustScore": 0, "travelStyle": null, "createdAt": "…",
  "merchant": null | { "id": "uuid", "businessName": "…", "category": "…", "location": "…",
                       "isVerified": true, "isActive": true }
}
```

### Experience (list + detail)
`id, merchantId, title, titleCn, titleTr, description, descriptionCn, descriptionTr, priceCny,
duration, capacity, images: string[], tags: string[], rating, reviewCount, isActive, aiBadge?,
merchant: { id, businessName, location, rating, isVerified, category, contactInfo?(detail only) }`.
Detail additionally returns `slots: Slot[]` (next 14 days, bookable only) and `reviews: Review[]`.
Only experiences whose merchant is `isVerified && isActive` are public.

### Slot
`{ id, experienceId, startTime, endTime, capacity, bookedCount, remaining, priceCny }`
(`remaining = capacity - bookedCount`; only slots with `remaining > 0` and `startTime > now` are returned publicly.)

### Booking
```json
{
  "id": "uuid", "status": "PENDING|CONFIRMED|REJECTED|CANCELLED|COMPLETED|NO_SHOW",
  "slotTime": "ISO", "guestCount": 2, "totalAmount": 1600, "currency": "CNY",
  "guestName": "…"|null, "guestPhone": "…"|null, "notes": "…"|null,
  "cancelReason": "…"|null, "source": "APP|MANUAL", "qrCode": "hex"|null,
  "createdAt": "ISO",
  "experience": { "id", "title", "titleCn", "titleTr", "images": [], "duration",
                  "merchant": { "id", "businessName", "location", "contactInfo": {"phone"?, "email"?} } },
  "user": { "id", "fullName", "email", "phone" }      // only in merchant/admin listings
}
```
Payment: **no online payment in this release.** Customers pay the company at the venue.
`totalAmount` is informational (`slot.priceCny × guestCount`).

Status lifecycle:
`PENDING → CONFIRMED | REJECTED | CANCELLED`, `CONFIRMED → COMPLETED | NO_SHOW | CANCELLED`.
`REJECTED`/`CANCELLED` release the reserved seats. `qrCode` exists only for `CONFIRMED`/`COMPLETED`.
A reservation made by a company (manual) is `CONFIRMED` immediately unless `status: "PENDING"` is sent.

## 3. Auth — `/v1/auth`

| Method & path | Body | Response |
|---|---|---|
| `POST /register` | `{ email, password (≥8), fullName?, preferredLanguage? }` | `201 { token, user }` (role `USER`). `409 ERR_EMAIL_TAKEN`. Reserved admin email → `403`. |
| `POST /login` | `{ email, password }` | `200 { token, user }`. `401 ERR_INVALID_CREDENTIALS`. |
| `GET /me` | – | `{ user }` |
| `PUT /me` | `{ fullName?, phone?, preferredLanguage?, travelStyle? }` | `{ user }` |
| `POST /change-password` | `{ currentPassword, newPassword (≥8) }` | `{ message }` |
| `DELETE /me` | `{ password }` | `{ message }` — permanently deletes/anonymises the account (App Store 5.1.1(v)). Admin cannot be deleted. |
| `GET /me/notifications` | `?unreadOnly=true` | `{ notifications, unreadCount }` |
| `PUT /me/notifications/:id/read` | – | `{ message }` |

Removed in this release (insecure mock): `/wechat-login`, `/verify-2fa`.
Tokens: 30 days for `USER`/`MERCHANT`, 12 hours for `ADMIN`.
Admin web login uses the same `POST /login`; the panel refuses any role other than `ADMIN`.

## 4. Catalogue (public) — `/v1/experiences`, `/v1/slots`

* `GET /experiences/explore?vibe=&location=&category=&sort=rating|newest|price_low|price_high&page=&limit=` → `{ experiences, pagination:{page,limit,total,pages} }`
* `GET /experiences/search?q=` → `{ experiences, query, count }`
* `GET /experiences/trending?limit=` → `{ experiences }`
* `GET /experiences/:id` → `{ experience }` (404 if inactive/unverified)
* `GET /slots/available?experienceId=&date=YYYY-MM-DD` → `{ slots, count }` (date optional → next 14 days)
* `GET /reviews/experience/:experienceId` → `{ reviews, … }`
* `POST /reviews` (auth) `{ bookingId, rating 1-5, comment? }` — only for own `COMPLETED` booking.

## 5. Bookings (any logged-in user) — `/v1/bookings`

| Method & path | Body | Response |
|---|---|---|
| `POST /` | `{ experienceId, slotId, guestCount (1..remaining), guestName?, guestPhone?, notes? }` | `201 { booking }` status `PENDING`; seats are reserved atomically. `409 ERR_SLOT_TAKEN` (slot gone/past) or `409 ERR_CAPACITY_FULL`. |
| `GET /` | `?status=&page=&limit=` | `{ bookings, pagination }` — own bookings (including those a company created *as the user*). |
| `GET /:id` | – | `{ booking }` |
| `POST /:id/cancel` | `{ reason? }` | `{ booking }` — only own `PENDING`/`CONFIRMED` bookings that have not started. |
| `GET /:id/qr` | – | `{ qrCode, booking:{ id, experience, merchant, date, guestCount, status } }` — only when `CONFIRMED`/`COMPLETED`. |

Removed: `/hold`, `/confirm`, and every `/v1/payment/*` endpoint (no gateway is integrated yet).

## 6. Company representative (role `MERCHANT`) — `/v1/merchant`

All endpoints require `role = MERCHANT` with a linked, active company; everything is scoped to that company.

| Method & path | Body / query | Response |
|---|---|---|
| `GET /me` | – | `{ merchant, experiences: [{ id, title, titleCn, priceCny, capacity, duration, isActive }] }` |
| `GET /bookings` | `?status=PENDING|CONFIRMED|…&scope=upcoming|past&date=YYYY-MM-DD&page=&limit=` | `{ bookings, pagination, counts: { PENDING, CONFIRMED, COMPLETED, CANCELLED, REJECTED, NO_SHOW } }` (bookings include `user`). Default order: `slotTime asc` for upcoming, `desc` for past. |
| `POST /bookings` | `{ experienceId, startTime (ISO with offset), guestCount, guestName, guestPhone?, notes?, status?: "CONFIRMED"\|"PENDING" }` | `201 { booking }` — manual reservation (phone/walk-in). Finds or creates the slot at `startTime` for that experience; fails `409 ERR_CAPACITY_FULL` if not enough seats; start time must be in the future. |
| `PUT /bookings/:id/status` | `{ status: "CONFIRMED"\|"REJECTED"\|"CANCELLED"\|"COMPLETED"\|"NO_SHOW", reason? }` | `{ booking }` per lifecycle above; `409 ERR_INVALID_TRANSITION` otherwise. Customer gets an in-app notification. |

Company experience CRUD (`/v1/merchants/:id/experiences…`) and slot endpoints (`POST /v1/slots`, `POST /v1/slots/bulk`, `DELETE /v1/slots/:id`) remain available to the owning `MERCHANT`; the admin panel can do the same for any company.

## 7. Admin — `/v1/admin` (role `ADMIN` only)

| Method & path | Body / query | Response |
|---|---|---|
| `GET /stats` | – | `{ totals:{ users, merchantUsers, merchants, experiences, bookings, pendingBookings, pendingMerchants }, bookingsByStatus:{…}, recentBookings:[…] }` |
| `GET /users` | `?role=USER|MERCHANT&q=&page=&limit=` | `{ users:[User + {_count:{bookings}}], pagination }` (admin account never listed) |
| `POST /users` | `{ email, password (≥8), fullName?, role: "USER"\|"MERCHANT", merchantId? , merchant?: { businessName, category, location, description?, contactPhone?, contactEmail? } }` | `201 { user }` — for `MERCHANT` either links an existing company (`merchantId`, must not already have a representative) or creates a new verified company. |
| `PUT /users/:id/role` | `{ role: "USER"\|"MERCHANT", merchantId? }` | `{ user }` — `MERCHANT` requires a company; `USER` unlinks it. Any attempt to set `ADMIN`, or to touch the admin account → `403`. |
| `POST /users/:id/reset-password` | `{ newPassword (≥8) }` | `{ message }` |
| `DELETE /users/:id` | – | `{ message }` (cannot delete admin) |
| `GET /merchants` | `?q=&verified=true|false` | `{ merchants:[… + representative:{id,email,fullName}|null, _count:{experiences}] }` |
| `POST /merchants` | `{ businessName, category (PARAGLIDING|BALLOON|TOUR|HOTEL|OTHER), location, description?, contactPhone?, contactEmail?, commissionRate? }` | `201 { merchant }` (verified + active) |
| `PUT /merchants/:id` | any of `businessName, category, location, description, contactPhone, contactEmail, commissionRate, isVerified, isActive` | `{ merchant }` |
| `GET /experiences` | `?merchantId=&q=` | `{ experiences }` (all, incl. inactive) |
| `POST /experiences` | `{ merchantId, title, titleCn?, titleTr?, description, descriptionCn?, descriptionTr?, priceCny, duration?, capacity?, images?: string[], tags?: string[] }` | `201 { experience }` |
| `PUT /experiences/:id` | same fields + `isActive` | `{ experience }` |
| `POST /experiences/:id/slots/bulk` | `{ startDate: "YYYY-MM-DD", endDate, times: ["08:00","14:00"], capacity?, priceCny? }` (Istanbul local times) | `201 { created }` |
| `GET /bookings` | `?status=&merchantId=&q=&page=&limit=` | `{ bookings (with user + merchant), pagination }` |
| `PUT /bookings/:id/status` | `{ status, reason? }` | `{ booking }` (any lifecycle transition) |
| `GET /audit-logs` | `?page=` | `{ logs }` |

## 8. AI concierge — `/v1/ai`
Optional auth. `POST /interact { text, language?, context? }` → `{ intent, userLanguage, message:{original,originalLanguage,translated,translatedLanguage,isTranslated}, data, timestamp }`.
`POST /translate`, `GET /recommend` unchanged. Speech-to-text and machine translation are **simulated** in this beta
(rule-based) — the client must not present them as production-grade.

## 9. Public pages & ops (served by the backend)
`GET /health`, `GET /privacy`, `GET /terms`, `GET /support`, `GET /admin/*` (admin SPA).
