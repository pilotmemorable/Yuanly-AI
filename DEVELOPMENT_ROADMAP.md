# Yuanly AI — Gerçek Geliştirme Yol Haritası

> Bu doküman, projenin gerçek durumunu ve sırasıyla yapılacak işleri içerir.
> Tarih: 2026-10-03 | Durum: Aktif Geliştirme

## Mevcut Durum Özeti
- Planlama dokümanları: ✅ Tam (brand, UX, API spec, DB schema, legal)
- Backend kod: 🔴 %15 (iskelet + kırık import)
- Mobil kod: 🔴 %15 (4 ekran, mock data, API'ye bağlı değil)
- Web kod: 🔴 %5 (tek dosya)
- AI: 🔴 %0
- Ödeme: 🔴 %0
- Test/CI/CD: 🔴 %0

---

## Phase 1: Backend Foundation (Öncelik: KRİTİK)

### 1.1 Fix Broken Code
- [ ] aiController.ts oluştur (aiRoutes.ts kırık import'u fixle)

### 1.2 Prisma Schema Genişletme
- [ ] Payment modeli ekle
- [ ] Slot modeli ekle (availability calendar)
- [ ] Notification modeli ekle
- [ ] SocialPost modeli ekle
- [ ] User modeline fields ekle (avatar, phone, trustScore, language)
- [ ] Merchant modeline fields ekle (description, images, hours)
- [ ] Experience modeline fields ekle (capacity, latitude, longitude)

### 1.3 Eksik Controller'lar
- [ ] bookingController (hold, confirm, cancel, list, detail)
- [ ] paymentController (initiate, webhook, refund, status)
- [ ] merchantController (register, login, CRUD experiences, bookings dashboard)
- [ ] reviewController (create, list by experience, list by user)
- [ ] aiController (voice interaction, text chat, translation, recommendations)
- [ ] adminController (stats, merchant vetting, financial overview)
- [ ] slotController (availability, create slots, update slots)

### 1.4 Eksik Route'lar
- [ ] /v1/booking/* (hold, confirm, cancel, GET /)
- [ ] /v1/payment/* (initiate, webhook, refund)
- [ ] /v1/merchants/* (register, login, experiences CRUD)
- [ ] /v1/reviews/* (POST, GET)
- [ ] /v1/ai/* (interact, translate, recommend)
- [ ] /v1/admin/* (stats, merchants, bookings)
- [ ] /v1/slots/* (availability, CRUD)

### 1.5 Middleware & Infrastructure
- [ ] Localization middleware (Accept-Language header)
- [ ] Error handling middleware (standardized error responses)
- [ ] Request validation (zod veya joi)
- [ ] Rate limiting
- [ ] Logging enhancement

---

## Phase 2: Mobile App Core (Backend sonrası)

### 2.1 API Layer
- [ ] API client service (axios/fetch wrapper)
- [ ] Token management (secure storage)
- [ ] Error handling & retry logic

### 2.2 Auth Flow
- [ ] WeChat login screen
- [ ] 2FA verification screen
- [ ] Biometric (FaceID/TouchID) entegrasyonu
- [ ] Guest mode

### 2.3 Explore → Detail → Booking Flow
- [ ] ExploreScreen'i API'ye bağla
- [ ] Infinite scroll / pagination
- [ ] Search & filter
- [ ] DetailScreen'i API'ye bağla
- [ ] Booking calendar (slot selection)
- [ ] Booking confirmation

### 2.4 Payment
- [ ] WeChat Pay WebView entegrasyonu
- [ ] Alipay WebView entegrasyonu
- [ ] Payment status polling

### 2.5 Profile & My Trips
- [ ] Profile screen (real data)
- [ ] My Bookings/Trips screen
- [ ] QR Ticket screen
- [ ] Settings screen
- [ ] Language switcher

### 2.6 i18n
- [ ] CN/EN/TR translation files
- [ ] Language context provider

---

## Phase 3: AI Integration

### 3.1 Voice Concierge
- [ ] Speech-to-text (Chinese + English)
- [ ] LLM entegrasyonu (intent recognition, booking logic)
- [ ] Text-to-speech (responses)
- [ ] Yuanly Orb görsel feedback

### 3.2 Translation
- [ ] Real-time CN ↔ EN ↔ TR translation API
- [ ] On-site translation mode

### 3.3 Recommendation Engine
- [ ] User behavior tracking
- [ ] AI badge generation ("Top Recommended", "Most Romantic")
- [ ] Personalized feed

---

## Phase 4: Web Frontend

### 4.1 Merchant Panel
- [ ] Merchant login/register
- [ ] Dashboard (real stats from API)
- [ ] Experience CRUD
- [ ] Slot/calendar management
- [ ] Booking management
- [ ] Revenue analytics

### 4.2 Admin Panel
- [ ] Admin login
- [ ] Merchant verification/vetting
- [ ] Platform analytics
- [ ] Financial overview
- [ ] AI agent training interface

### 4.3 User Web Portal
- [ ] Pre-trip planning page
- [ ] Experience discovery (web)
- [ ] Blog/stories

---

## Phase 5: Social, Testing & Deployment

### 5.1 Social Layer
- [ ] Social sharing (Rednote, WeChat, Instagram)
- [ ] Review system with media uploads
- [ ] User travel blog/posts
- [ ] Trust score system

### 5.2 Testing
- [ ] Backend unit tests
- [ ] Backend integration tests
- [ ] Mobile component tests
- [ ] E2E tests

### 5.3 Infrastructure
- [ ] Docker & docker-compose
- [ ] CI/CD pipeline
- [ ] Environment management
- [ ] Database migrations
- [ ] Monitoring & logging

### 5.4 Store Preparation
- [ ] App Store assets (real screenshots)
- [ ] Google Play assets
- [ ] Huawei AppGallery