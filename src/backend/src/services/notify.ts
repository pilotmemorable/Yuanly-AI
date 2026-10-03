import prisma from '../config/db';
import { formatIstanbul } from '../utils/time';

type Lang = 'CN' | 'EN' | 'TR';

interface Vars {
  experience?: string;
  when?: Date | string;
  guests?: number;
  customer?: string;
  reason?: string | null;
}

const templates: Record<string, Record<Lang, (v: Vars) => { title: string; body: string }>> = {
  booking_requested: {
    CN: (v) => ({ title: '新的预订请求', body: `${v.customer} 预订了「${v.experience}」，${formatIstanbul(v.when!)}，${v.guests} 人。请确认。` }),
    EN: (v) => ({ title: 'New reservation request', body: `${v.customer} requested "${v.experience}" on ${formatIstanbul(v.when!)} for ${v.guests} guest(s). Please confirm.` }),
    TR: (v) => ({ title: 'Yeni rezervasyon talebi', body: `${v.customer}, "${v.experience}" için ${formatIstanbul(v.when!)} tarihinde ${v.guests} kişilik talepte bulundu. Lütfen onaylayın.` }),
  },
  booking_confirmed: {
    CN: (v) => ({ title: '预订已确认', body: `您预订的「${v.experience}」（${formatIstanbul(v.when!)}）已确认，二维码票已生成。` }),
    EN: (v) => ({ title: 'Reservation confirmed', body: `Your reservation for "${v.experience}" on ${formatIstanbul(v.when!)} is confirmed. Your QR ticket is ready.` }),
    TR: (v) => ({ title: 'Rezervasyon onaylandı', body: `"${v.experience}" için ${formatIstanbul(v.when!)} rezervasyonunuz onaylandı. QR biletiniz hazır.` }),
  },
  booking_rejected: {
    CN: (v) => ({ title: '预订未被接受', body: `很抱歉，「${v.experience}」（${formatIstanbul(v.when!)}）的预订未被接受。${v.reason ? '原因：' + v.reason : ''}` }),
    EN: (v) => ({ title: 'Reservation declined', body: `Sorry, your reservation for "${v.experience}" on ${formatIstanbul(v.when!)} was declined.${v.reason ? ' Reason: ' + v.reason : ''}` }),
    TR: (v) => ({ title: 'Rezervasyon reddedildi', body: `Üzgünüz, "${v.experience}" için ${formatIstanbul(v.when!)} rezervasyonunuz reddedildi.${v.reason ? ' Sebep: ' + v.reason : ''}` }),
  },
  booking_cancelled: {
    CN: (v) => ({ title: '预订已取消', body: `「${v.experience}」（${formatIstanbul(v.when!)}）的预订已取消。${v.reason ? '原因：' + v.reason : ''}` }),
    EN: (v) => ({ title: 'Reservation cancelled', body: `The reservation for "${v.experience}" on ${formatIstanbul(v.when!)} was cancelled.${v.reason ? ' Reason: ' + v.reason : ''}` }),
    TR: (v) => ({ title: 'Rezervasyon iptal edildi', body: `"${v.experience}" için ${formatIstanbul(v.when!)} rezervasyonu iptal edildi.${v.reason ? ' Sebep: ' + v.reason : ''}` }),
  },
  booking_completed: {
    CN: (v) => ({ title: '体验已完成', body: `感谢您体验「${v.experience}」，欢迎留下评价！` }),
    EN: (v) => ({ title: 'Experience completed', body: `Thanks for joining "${v.experience}". We would love your review!` }),
    TR: (v) => ({ title: 'Deneyim tamamlandı', body: `"${v.experience}" deneyimine katıldığınız için teşekkürler. Yorumunuzu bekliyoruz!` }),
  },
};

export async function notify(userId: string, type: string, vars: Vars, data?: Record<string, any>) {
  try {
    const template = templates[type];
    if (!template) return;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { preferredLanguage: true } });
    const lang = (['CN', 'EN', 'TR'].includes(user?.preferredLanguage || '') ? user!.preferredLanguage : 'EN') as Lang;
    const { title, body } = template[lang](vars);
    await prisma.notification.create({
      data: { userId, type, title, body, data: data ? JSON.stringify(data) : null },
    });
  } catch (err) {
    console.error('[notify] failed', err);
  }
}
