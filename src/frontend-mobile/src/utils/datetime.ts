import { Language } from '../i18n/translations';

const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const TR_MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function getIstanbulDate(iso: string) {
  const timestamp = Date.parse(iso);
  const istanbulDate = new Date(timestamp + 3 * 60 * 60 * 1000);

  return {
    year: istanbulDate.getUTCFullYear(),
    month: istanbulDate.getUTCMonth() + 1,
    day: istanbulDate.getUTCDate(),
    hour: istanbulDate.getUTCHours(),
    minute: istanbulDate.getUTCMinutes(),
  };
}

export function formatDate(iso: string, language: Language) {
  const { year, month, day } = getIstanbulDate(iso);

  if (language === 'CN') {
    return `${year}年${month}月${day}日`;
  }

  if (language === 'TR') {
    return `${day} ${TR_MONTHS[month - 1]} ${year}`;
  }

  return `${EN_MONTHS[month - 1]} ${day}, ${year}`;
}

export function formatTime(iso: string) {
  const { hour, minute } = getIstanbulDate(iso);
  return `${pad(hour)}:${pad(minute)}`;
}

export function formatDateTime(iso: string, language: Language) {
  return `${formatDate(iso, language)} ${formatTime(iso)}`;
}

export function istanbulIsoFromParts(dateStr: string, timeStr: string) {
  const normalizedTime = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  return `${dateStr}T${normalizedTime}+03:00`;
}
