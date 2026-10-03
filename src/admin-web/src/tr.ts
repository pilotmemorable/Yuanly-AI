import type { BookingStatus, MerchantCategory, UserRole } from './api';

export const tr = {
  brand: {
    name: 'Yuanly Admin',
    subtitle: 'Yönetim paneli',
  },
  auth: {
    adminOnly: 'Bu panele yalnızca yönetici erişebilir',
    sessionExpired: 'Oturumunuz sona erdi. Lütfen yeniden giriş yapın.',
    invalidCredentials: 'E-posta veya şifre hatalı.',
    tooManyAttempts: 'Çok fazla başarısız deneme. Lütfen biraz sonra tekrar deneyin.',
  },
  nav: {
    dashboard: 'Genel Bakış',
    users: 'Kullanıcılar',
    companies: 'Firmalar',
    experiences: 'Deneyimler',
    reservations: 'Rezervasyonlar',
    audit: 'Denetim Kayıtları',
    account: 'Hesabım',
  },
} as const;

export const roleLabels = {
  USER: 'Son kullanıcı',
  MERCHANT: 'Firma yetkilisi',
  ADMIN: 'Yönetici',
} satisfies Record<UserRole, string>;

export const bookingStatusLabels = {
  PENDING: 'Beklemede',
  CONFIRMED: 'Onaylandı',
  REJECTED: 'Reddedildi',
  CANCELLED: 'İptal edildi',
  COMPLETED: 'Tamamlandı',
  NO_SHOW: 'Gelmedi',
} satisfies Record<BookingStatus, string>;

export const categoryLabels = {
  PARAGLIDING: 'Yamaç paraşütü',
  BALLOON: 'Balon',
  TOUR: 'Tur',
  HOTEL: 'Otel',
  OTHER: 'Diğer',
} satisfies Record<MerchantCategory, string>;

export const sourceLabels = {
  APP: 'Uygulama',
  MANUAL: 'Manuel',
} as const;
