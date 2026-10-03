# Yuanly AI — Proje Devir Dokümanı

> Son güncelleme: 2026-10-03 23:30
> Durum: Build alındı, App Store Connect'e yüklendi, metadata/screenshots manuel bekliyor

## 📌 Mevcut Durum

### Apple Store Connect Bilgileri
- **App Store Connect App ID:** 6818868954
- **Apple Team ID:** 7SB3772A34
- **Bundle ID:** com.yuanly.ai
- **Expo Project Slug:** yuanly-backend
- **Expo Account:** pilotmemorable
- **Build Version:** 1.0.0 (Build 3)
- **Build URL:** https://expo.dev/artifacts/eas/THbSd1WLPd13i9sJGo31Wf4afqxBKjYHylaE8K2Wrtg.ipa
- **TestFlight URL:** https://appstoreconnect.apple.com/apps/6818868954/testflight/ios
- **EAS Project ID:** 517b0337-e186-440c-b6c9-b724f2a75a79

### Kalan İşler (App Store Connect — Manuel)
1. App Store Connect → App Information doldur (Name, Subtitle, Category=Travel)
2. Version 1.0.0 → Description, Keywords yükle (metadata hazır: metadata/ios/en-US/ ve metadata/ios/zh-Hans/)
3. Screenshots yükle (hazır: screenshots/iphone-6.7/, screenshots/iphone-6.5/, screenshots/ipad-12.9/ — her biri 6 PNG)
4. TestFlight → test kullanıcıları ekle (3-4 email)
5. Build'i test grubuna ekle, Notify Testers

## 🏗️ Teknik Durum

### Backend (src/backend/) — ✅ Çalışıyor
- Express.js + Prisma + SQLite (lokal) / PostgreSQL (production)
- 9 controller, 9 route grubu, 12 veritabanı modeli
- TypeScript sıfır hatayla derleniyor
- Çeviri servisi (translationService.ts) — çift dilli mesaj sistemi
- Güvenlik: Helmet, CORS, sanitization, rate limiting, audit log, AES-256 encryption
- RBAC: ADMIN (tek kişi) → MERCHANT (yetkili) → USER
- Seed data: 3 kullanıcı, 3 işletme, 4 deneyim, 84 slot

### Mobil Uygulama (src/frontend-mobile/) — ✅ Build Alındı
- Expo SDK 50, React Native 0.73
- 8 ekran: Login, Explore, Detail, AIConcierge, MyTrips, QRTicket, Payment, Profile
- i18n: CN/EN/TR tam çeviriler
- Çift dilli AI Concierge (orijinal + çeviri gösterimi)
- Sesli çeviri endpoint (/v1/ai/voice)
- Takvim görünümü, paylaşım (email/SMS/WeChat)
- App.json: iOS permissions tanımlandı
- Build: Başarıyla alındı, App Store Connect'e yüklendi

### Web Frontend (src/frontend-web/) — ✅ Hazır
- 21 dosya: Merchant panel, Admin panel, Landing page
- Merchant: dashboard (grafikler), deneyim CRUD, rezervasyon yönetimi
- Admin: istatistikler, merchant doğrulama, finansal özet, kullanıcı role yönetimi
- Role-based access: ADMIN sadece tek kişi, MERCHANT yetkiyle

### Görsel Varlıklar
- Logo: src/frontend-mobile/assets/images/logo.svg (缘 turkuaz daire)
- Splash: src/frontend-mobile/assets/images/splash.svg
- Icon: src/frontend-mobile/assets/images/icon-mark.svg
- Screenshots: screenshots/ klasöründe 18 PNG (3 boyut × 6 ekran)
- Photos: photos/ klasöründe 11 tasarım görseli

### Production Konfigürasyon
- .env.production: PostgreSQL SSL, JWT, encryption key, CORS, Redis, payment gateways
- docker-compose.yml: PostgreSQL + Redis + Backend + Web
- Dockerfile: backend ve web için

## 📁 Proje Yapısı
```
Yuanly-AI/
├── src/
│   ├── backend/          # Express + Prisma API (çalışıyor)
│   ├── frontend-mobile/  # Expo React Native (build alındı)
│   └── frontend-web/     # React merchant + admin panel
├── screenshots/          # App Store screenshot'ları (18 PNG)
├── metadata/ios/         # App Store metadata (EN + CN)
├── photos/               # Tasarım görselleri (11 PNG)
├── docs/                 # Planlama dokümanları
├── agents/               # AI system prompt
├── skills/               # AI skill tanımları
├── docker-compose.yml    # Production setup
├── eas.json              # EAS Build/Submit config
├── APP_STORE_GUIDE.md    # Apple Store rehberi
├── DEVELOPMENT_ROADMAP.md # Geliştirme yol haritası
└── eksik_isler.md        # Güncel durum
```

## 🔑 Kullanıcı Gereksinimleri
1. Çift dilli mesajlaşma: Orijinal + otomatik çeviri ✅
2. Sesli çeviri: Voice → text → translation ✅
3. Takvim: Rezervasyon takibi + paylaşım (email/SMS/WeChat) ✅
4. RBAC: Admin tek kişi, merchant yetkili ✅
5. Veritabanı güvenliği: Üst seviye ✅
6. Logo ve görseller: Yuanly branding ✅

## 🚀 Build Komutları
```bash
# Backend lokal
cd src/backend && npx ts-node src/index.ts

# Mobil build
cd src/frontend-mobile && npx eas-cli build --platform ios --profile production

# App Store submit
cd /Users/macbook/Desktop/Yuanly/yen/Yuanly-AI && npx eas-cli submit --platform ios --profile production
```