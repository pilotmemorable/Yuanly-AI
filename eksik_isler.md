# Eksik İşler / Yapılacaklar (güncel: 2026-10-04 00:20)

Ayrıntılar ve komutlar: `PROJECT_HANDOFF.md`.

## Tamamlandı
- [x] Backend yeniden yazıldı (PostgreSQL, şifreli giriş, tek admin, rezervasyon yönetimi, güvenlik düzeltmeleri) — smoke test 55/55
- [x] Rol modeli: ADMIN (yalnızca pilotmemorable@gmail.com) / MERCHANT (firma yetkilisi) / USER
- [x] Mobil uygulama Expo SDK 54'e yükseltildi; e-posta+şifre giriş, misafir gezinme, Rezervasyonlar sekmesi (MERCHANT), gerçek QR, hesap silme, CN/EN/TR
- [x] Yönetim paneli (`src/admin-web`, Türkçe) — kullanıcı/firma/deneyim/rezervasyon/denetim kayıtları
- [x] Gizlilik, şartlar, destek sayfaları (backend `/privacy` `/terms` `/support`)
- [x] Uygulama ikonu/splash (marka logosundan)
- [x] Dockerfile + railway.json (tek imaj: API + panel)
- [x] ASC API anahtarı alındı (Key ID RN725U76DV)

## Yapılacak (öncelik sırasıyla)
- [ ] **Backend'i yayına al** (Railway plan limiti engeli → plan yükselt / eski projeyi sil / başka host) ve `npm test` ile doğrula
- [ ] `app.json → extra.apiUrl` değerini canlı adrese ayarla
- [ ] **ASC Issuer ID** al; `eas.json` submit ayarlarına ASC API anahtarını bağla
- [ ] `eas build --platform ios --profile production` + `eas submit`
- [ ] Mobil uygulamayı simülatörde çalıştır, akışları elle doğrula (misafir → kayıt → rezervasyon → firma onayı → QR)
- [ ] Yönetim panelini tarayıcıda doğrula
- [ ] App Store/TestFlight ekran görüntüleri (iPhone 6.9" 1320×2868, 6.5", iPad 13" 2064×2752) — gerçek simülatör ekranları + 3D/cam efektli pazarlama çerçevesi
- [ ] `metadata/ios/*` metinlerini güncelle (WeChat Pay/Alipay/2FA/ses iddialarını çıkar)
- [ ] ASC: uygulama bilgisi, App Privacy, TestFlight test bilgisi, demo hesaplar, internal grup (anında test), external grup + public link (Beta App Review)
- [ ] Sonra: e-posta doğrulama/şifre sıfırlama (SMTP), push bildirimleri, gerçek ödeme, gerçek AI, Sentry, CI
