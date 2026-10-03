# Yuanly AI — Deployment Checklist (Gerçek Durum)

## Backend Deployment
- [x] Express.js server kodu tamam
- [x] Prisma schema tamam (12 model)
- [x] Tüm controller ve route'lar hazır
- [x] TypeScript sıfır hatayla derleniyor
- [x] Seed data hazır
- [ ] PostgreSQL veritabanı kurulumu (Railway / Supabase / DigitalOcean)
- [ ] `prisma migrate deploy` çalıştır
- [ ] `npm run seed` ile verileri yükle
- [ ] Environment variables (DATABASE_URL, JWT_SECRET) ayarla
- [ ] Backend'i deploy et (Railway / Render / Fly.io)

## Mobile App
- [x] Expo projesi kuruldu
- [x] 8 ekran tamamlandı (Login, Explore, Detail, AI, MyTrips, QR, Payment, Profile)
- [x] API'ye bağlı (gerçek veri)
- [x] i18n (CN/EN/TR) tamam
- [x] Çift dilli mesajlaşma + sesli çeviri
- [x] Auth akışı (WeChat + email + 2FA + guest)
- [x] app.json iOS/Android konfigürasyonu
- [x] eas.json build profilleri
- [ ] Logo ve icon görsellerini assets/images/ içine koy (photos klasöründen seç)
- [ ] Splash screen tasarımını ekle
- [ ] `eas build --platform ios --profile production`
- [ ] Screenshots al (6.7", 6.5", 12.9")
- [ ] `eas submit --platform ios --profile production`

## Web Frontend
- [x] Merchant dashboard (gerçek API)
- [x] Merchant login/register
- [x] Merchant experiences CRUD
- [x] Merchant bookings management
- [x] Admin panel
- [x] Admin merchant verification
- [x] Admin financial overview
- [x] Landing page (user portal)
- [ ] `npm install && npm start` ile lokal test
- [ ] Web frontend deploy et (Vercel / Netlify)

## Apple App Store
- [x] App Store metadata (EN + CN)
- [x] Privacy Policy
- [x] Terms of Service
- [x] Bundle ID: com.yuanly.ai
- [x] iOS permissions tanımlandı
- [ ] Apple Developer Program üyeliği aktif
- [ ] eas.json: appleId, ascAppId, appleTeamId doldur
- [ ] Production build oluştur
- [ ] Screenshots yükle
- [ ] App Store Connect'te app oluştur
- [ ] Review information doldur
- [ ] Submit to Apple Review

## Google Play (Opsiyonel - Sonra)
- [ ] Google Play Developer hesabı
- [ ] google-service-account-key.json
- [ ] AAB build
- [ ] Play Console'da app oluştur
- [ ] Submit

## DevOps
- [x] Error handling middleware
- [x] Rate limiting
- [x] Localization middleware
- [ ] Docker & docker-compose
- [ ] CI/CD pipeline
- [ ] Monitoring (Sentry / LogRocket)