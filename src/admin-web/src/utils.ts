import { ApiError, type Booking, type BookingStatus, type Experience, type UserRole } from './api';

const ISTANBUL_OFFSET_MS = 3 * 60 * 60 * 1000;

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'gold';

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

function toIstanbulDate(iso?: string | null): Date | null {
  if (!iso) return null;
  const timestamp = Date.parse(iso);
  if (Number.isNaN(timestamp)) return null;
  return new Date(timestamp + ISTANBUL_OFFSET_MS);
}

export function formatNumber(value: number | null | undefined): string {
  return new Intl.NumberFormat('tr-TR').format(value ?? 0);
}

export function formatCny(value: number | string | null | undefined): string {
  const numeric = typeof value === 'string' ? Number(value) : value ?? 0;
  const safeNumber = Number.isFinite(numeric) ? numeric : 0;
  return `¥ ${new Intl.NumberFormat('tr-TR', {
    maximumFractionDigits: 2,
  }).format(safeNumber)}`;
}

export function formatIstanbulDateTime(iso?: string | null): string {
  const date = toIstanbulDate(iso);
  if (!date) return '—';
  return `${pad(date.getUTCDate())}.${pad(date.getUTCMonth() + 1)}.${date.getUTCFullYear()} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
}

export function formatIstanbulDate(iso?: string | null): string {
  const date = toIstanbulDate(iso);
  if (!date) return '—';
  return `${pad(date.getUTCDate())}.${pad(date.getUTCMonth() + 1)}.${date.getUTCFullYear()}`;
}

export function formatIstanbulTime(iso?: string | null): string {
  const date = toIstanbulDate(iso);
  if (!date) return '—';
  return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
}

export function displayExperienceTitle(experience?: Pick<Experience, 'title' | 'titleCn' | 'titleTr'> | null): string {
  if (!experience) return 'Başlıksız deneyim';
  return experience.titleTr?.trim() || experience.title?.trim() || experience.titleCn?.trim() || 'Başlıksız deneyim';
}

export function displayCustomerName(booking: Pick<Booking, 'guestName' | 'user'>): string {
  return booking.guestName?.trim() || booking.user?.fullName?.trim() || 'Misafir';
}

export function splitLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function splitCommaList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function joinLines(values?: string[] | null): string {
  return (values ?? []).join('\n');
}

export function joinComma(values?: string[] | null): string {
  return (values ?? []).join(', ');
}

export function toOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const numeric = Number(trimmed);
  return Number.isFinite(numeric) ? numeric : undefined;
}

export function toOptionalInteger(value: string): number | undefined {
  const numeric = toOptionalNumber(value);
  return numeric === undefined ? undefined : Math.round(numeric);
}

export function toOptionalText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function generateStrongPassword(length = 16): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
  const buffer = new Uint32Array(length);
  crypto.getRandomValues(buffer);
  return Array.from(buffer, (token) => alphabet[token % alphabet.length]).join('');
}

export async function copyText(value: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // ignore clipboard fallback errors
    }
  }

  const textArea = document.createElement('textarea');
  textArea.value = value;
  textArea.setAttribute('readonly', 'true');
  textArea.style.position = 'absolute';
  textArea.style.left = '-9999px';
  document.body.appendChild(textArea);
  textArea.select();
  const copied = document.execCommand('copy');
  document.body.removeChild(textArea);
  return copied;
}

export function bookingStatusTone(status: BookingStatus | string): BadgeTone {
  switch (status) {
    case 'CONFIRMED':
    case 'COMPLETED':
      return 'success';
    case 'PENDING':
      return 'warning';
    case 'REJECTED':
    case 'CANCELLED':
    case 'NO_SHOW':
      return 'danger';
    default:
      return 'neutral';
  }
}

export function roleTone(role: UserRole | string): BadgeTone {
  switch (role) {
    case 'ADMIN':
      return 'gold';
    case 'MERCHANT':
      return 'info';
    default:
      return 'neutral';
  }
}

export function merchantVerificationTone(isVerified: boolean): BadgeTone {
  return isVerified ? 'success' : 'warning';
}

export function merchantActiveTone(isActive: boolean): BadgeTone {
  return isActive ? 'info' : 'neutral';
}

export function getErrorMessage(error: unknown, fallback = 'Beklenmeyen bir hata oluştu.'): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

export function summarizeUnknown(value: unknown): string {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
