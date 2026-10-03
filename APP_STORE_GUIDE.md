# Yuanly AI — Apple App Store Yayın Rehberi

> Bu rehber, uygulamayı Apple App Store'a göndermek için gereken tüm adımları içerir.
> Tarih: 2026-10-03 | Durum: Hazırlık aşamasında

## ⚠️ Önemli Not
Ben (Claude) Apple Developer hesabınıza, App Store Connect'e veya sertifika yönetimine doğrudan erişemem. Bu işlemler sizin Apple kimliğinizle yapılmalıdır. Ancak tüm teknik hazırlığı tamamladım ve süreçte adım adım yönlendirebilirim.

---

## 1. Önkoşullar (Sizin yapmanız gereken)

### Apple Developer Hesabı
- [ ] Apple Developer Program üyeliği aktif (yıllık $99)
- [ ] App Store Connect'e erişim var
- [ ] Team ID alınmış (developer.apple.com → Account → Membership)

### EAS CLI Kurulumu
```bash
npm install -g eas-cli
eas login  # Expo hesabınızla giriş yapın
```

### Apple Kimlik Bilgileri
`eas.json` dosyasında şu alanları kendi bilgilerinizle doldurun:
- `appleId`: Apple ID email adresiniz
- `ascAppId`: App Store Connect'teki App ID (numbers'dan oluşur)
- `appleTeamId`: Apple Developer Team ID

---

## 2. Teknik Hazırlık (Tamamlandı ✅)

### Konfigürasyon Dosyaları
- ✅ `app.json` — iOS konfigürasyonu (Bundle ID, infoPlist, permissions, plugins)
- ✅ `eas.json` — Build profilleri (development, staging, production)
- ✅ `metadata/ios/en-US/` — İngilizce App Store metadata
- ✅ `metadata/ios/zh-Hans/` — Çince App Store metadata
- ✅ `app.json` — EAS Project ID yapılandırıldı

### iOS Permissions Tanımlandı
- Kamera (QR tarama + review fotoğrafları)
- Mikrofon (sesli çeviri + AI concierge)
- Lokasyon (yakındaki deneyimler)
- Fotoğraf Galerisi (review fotoğrafları)

### App Store Metadata Hazır
- App adı: "Yuanly AI" (EN) / "Yuanly缘ly — 土耳其AI导游" (CN)
- Alt başlık: "Discover Turkey — AI Travel Guide" (EN)
- Açıklama: Tam (her iki dilde)
- Anahtar kelimeler: Tam (her iki dilde)
- Promotional text: Tam (her iki dilde)

---

## 3. Sertifika ve Provisioning (Sizin yapmanız gereken)

### Yöntem A: EAS ile otomatik (Önerilen)
```bash
cd src/frontend-mobile
eas build --platform ios --profile production
```
EAS, sertifikaları ve provisioning profillerini otomatik oluşturur ve yönetir.

### Yöntem B: Manuel
1. developer.apple.com → Certificates, IDs & Profiles
2. Distribution Certificate oluştur
3. App ID: `com.yuanly.ai` kaydet
4. Provisioning Profile (App Store) oluştur
5. Xcode'da Archive → Validate → Upload

---

## 4. Build Süreci

### Development Build (Test için)
```bash
cd src/frontend-mobile
eas build --platform ios --profile development
# Simulator'da test edin
```

### Staging Build (TestFlight için)
```bash
eas build --platform ios --profile staging
# TestFlight'a yüklenecek
```

### Production Build (App Store için)
```bash
eas build --platform ios --profile production
# App Store'a gönderilmeye hazır
```

---

## 5. App Store Submit

### Otomatik Submit (EAS Submit)
```bash
# Metadata ve screenshots otomatik gönderilir
eas submit --platform ios --profile production
```

### Manuel Submit
1. App Store Connect'e giriş yapın
2. "My Apps" → "+" → "New App"
3. App adı: Yuanly AI
4. Primary Language: Simplified Chinese
5. Bundle ID: com.yuanly.ai
6. SKU: yuanly_ai_001

### App Store Connect'te doldurulacak alanlar:
- **App Information**: Name, subtitle, category (Travel)
- **Pricing**: Free
- **App Privacy**: Privacy Policy URL (https://yuanly.ai/privacy)
- **App Review Information**: Contact info, demo account
- **Version Information**: Description, keywords, screenshots

---

## 6. Screenshots

### Gerekli ekran boyutları:
- iPhone 6.7" (iPhone 15 Pro Max) — 1290x2796
- iPhone 6.5" (iPhone 11 Pro Max) — 1242x2688
- iPad 12.9" (iPad Pro) — 2048x2732

### Screenshot konumları:
```
screenshots/ios/
  6.7-inch/     # iPhone 15 Pro Max
  6.5-inch/     # iPhone 11 Pro Max
  12.9-inch/    # iPad Pro
```

### Önerilen screenshot'lar (her boyut için):
1. Explore ekranı (keşfet)
2. Experience Detail (deneyim detayı)
3. AI Concierge (AI asistan — sesli çeviri)
4. My Trips (rezervasyonlar)
5. QR Ticket (QR bilet)
6. Payment (ödeme ekranı)

---

## 7. App Review Hazırlığı

### Demo Account (Reviewer için)
- Email: demo@yuanly.ai
- 2FA Code: 123456
- Not: Mevcut seed data ile çalışır

### Review Notes
```
This app is designed for Chinese tourists visiting Turkey.
Key features to test:
1. Login with email + 2FA (use code: 123456)
2. Explore experiences (Rednote-style feed)
3. AI Concierge — type or speak in Chinese
4. Book an experience — select slot, proceed to payment
5. View QR ticket in My Trips

The AI concierge shows both original and translated text.
Backend API: https://api.yuanly.ai/v1
```

---

## 8. Checklist (Gerçek Durum)

### Tamamlandı ✅
- [x] app.json iOS konfigürasyonu
- [x] eas.json build profilleri
- [x] App Store metadata (EN + CN)
- [x] Privacy Policy (docs/Legal/Privacy_Policy.md)
- [x] Terms of Service (docs/Legal/Terms_of_Service.md)
- [x] Bundle ID: com.yuanly.ai
- [x] iOS permissions tanımlandı
- [x] Demo account hazır

### Sizin yapmanız gereken ⬜
- [ ] Apple Developer Program üyeliğini aktifleştir
- [ ] eas.json'daki `appleId`, `ascAppId`, `appleTeamId` alanlarını doldur
- [ ] `eas build --platform ios --profile production` komutunu çalıştır
- [ ] App Store screenshots al (6.7", 6.5", 12.9")
- [ ] `eas submit --platform ios --profile production` ile gönder
- [ ] App Store Connect'te App Review Information doldur
- [ ] Privacy Policy URL'ini yayına al (https://yuanly.ai/privacy)
- [ ] Support URL'ini yayına al (https://yuanly.ai/support)

---

## 9. Komut Referansı

```bash
# EAS CLI kurulumu
npm install -g eas-cli
eas login

# Build
eas build --platform ios --profile development    # Test
eas build --platform ios --profile staging         # TestFlight
eas build --platform ios --profile production      # App Store

# Submit
eas submit --platform ios --profile production

# Build durumu kontrol
eas build:list

# Update (OTA)
eas update --branch production
```

---

## 10. Sorun Giderme

### "Missing Apple Developer account"
→ `eas login` ile Expo'ya, Apple ID ile App Store Connect'e giriş yapın

### "No certificates found"
→ `eas build` otomatik oluşturur. İlk build'te Apple kimlik bilgileri istenir.

### "Bundle identifier unavailable"
→ App Store Connect'te farklı bir app aynı Bundle ID'yi kullanıyor. com.yuanly.ai doğru.

### Screenshot boyutları
→ Simulator'da: `xcrun simctl io booted screenshot`
→ veya EAS Build çıktısından gerçek cihazda alın