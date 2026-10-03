import { Request, Response, NextFunction } from 'express';

type Language = 'CN' | 'EN' | 'TR';

/**
 * Localization middleware
 * Reads Accept-Language header or ?lang query param
 * Sets req.locale for controllers to use
 */
export const localizationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const langParam = req.query.lang as string;
  const acceptLang = req.headers['accept-language'] as string;

  let locale: Language = 'CN'; // Default to Chinese (primary audience)

  if (langParam && ['CN', 'EN', 'TR'].includes(langParam.toUpperCase())) {
    locale = langParam.toUpperCase() as Language;
  } else if (acceptLang) {
    if (acceptLang.startsWith('zh')) locale = 'CN';
    else if (acceptLang.startsWith('tr')) locale = 'TR';
    else if (acceptLang.startsWith('en')) locale = 'EN';
  }

  (req as any).locale = locale;
  res.setHeader('Content-Language', locale);

  next();
};

// Error messages in multiple languages
export const MESSAGES = {
  booking_created: { CN: '预订创建成功', EN: 'Booking created successfully', TR: 'Rezervasyon başarıyla oluşturuldu' },
  booking_confirmed: { CN: '预订已确认！您的二维码已就绪。', EN: 'Booking confirmed! Your QR ticket is ready.', TR: 'Rezervasyon onaylandı! QR biletiniz hazır.' },
  booking_cancelled: { CN: '预订已取消', EN: 'Booking cancelled', TR: 'Rezervasyon iptal edildi' },
  payment_initiated: { CN: '支付已发起', EN: 'Payment initiated', TR: 'Ödeme başlatıldı' },
  payment_success: { CN: '支付成功！', EN: 'Payment successful!', TR: 'Ödeme başarılı!' },
  payment_failed: { CN: '支付失败', EN: 'Payment failed', TR: 'Ödeme başarısız' },
  slot_unavailable: { CN: '该时段已不可用', EN: 'This slot is no longer available', TR: 'Bu saat dilimi artık müsait değil' },
  not_authorized: { CN: '未授权', EN: 'Not authorized', TR: 'Yetkisiz erişim' },
  not_found: { CN: '未找到', EN: 'Not found', TR: 'Bulunamadı' },
  merchant_pending: { CN: '商家注册成功，等待审核', EN: 'Merchant registered, pending verification', TR: 'İletme kaydedildi, doğrulama bekliyor' },
} as const;

export function t(key: keyof typeof MESSAGES, locale: Language): string {
  return MESSAGES[key]?.[locale] || MESSAGES[key]?.EN || key;
}