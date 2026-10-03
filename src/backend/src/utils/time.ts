// Venue time zone is Europe/Istanbul: UTC+03:00 all year (no DST since 2016).
const IST_OFFSET_MS = 3 * 60 * 60 * 1000;

export function istanbulToDate(date: string, time: string): Date {
  return new Date(`${date}T${time}:00+03:00`);
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function formatIstanbul(d: Date | string): string {
  const shifted = new Date(new Date(d).getTime() + IST_OFFSET_MS);
  return `${pad(shifted.getUTCDate())}.${pad(shifted.getUTCMonth() + 1)}.${shifted.getUTCFullYear()} ${pad(
    shifted.getUTCHours()
  )}:${pad(shifted.getUTCMinutes())}`;
}

export function parseDurationMinutes(duration: string | null | undefined): number {
  if (!duration) return 120;
  const m = String(duration).match(/(\d+(?:\.\d+)?)\s*(h|hour|hours|saat|小时)/i);
  if (m) return Math.round(parseFloat(m[1]) * 60);
  const n = String(duration).match(/(\d+)\s*(m|min|mins|minutes|dk|分钟)/i);
  if (n) return parseInt(n[1], 10);
  return 120;
}
