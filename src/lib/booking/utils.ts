import crypto from 'crypto';

export function normalizeBdPhone(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  let normalized = digits;
  if (normalized.startsWith('00880')) normalized = normalized.slice(2);
  if (normalized.startsWith('8801')) normalized = `0${normalized.slice(3)}`;
  if (normalized.startsWith('01')) normalized = normalized;
  if (/^1\d{9}$/.test(normalized)) normalized = `0${normalized}`;
  if (!/^01[3-9]\d{8}$/.test(normalized)) return null;
  return normalized;
}

export function maskPhone(phone: string): string {
  const n = normalizeBdPhone(phone) || phone;
  if (n.length < 6) return '***';
  return `${n.slice(0, 3)}****${n.slice(-3)}`;
}

const PLACEHOLDER = 'change-me-in-production';
function secretOrThrow(value: string | undefined): string {
  if (value && value !== PLACEHOLDER) return value;
  if (process.env.NODE_ENV === 'production') throw new Error('OTP_SECRET / TOKEN_SECRET must be set to a real secret in production');
  return 'dev-only-secret';
}

export function otpHash(phone: string, code: string): string {
  const secret = secretOrThrow(process.env.OTP_SECRET);
  return crypto.createHmac('sha256', secret).update(`${phone}:${code}`).digest('hex');
}

export function makeOtpCode(): string {
  return String(crypto.randomInt(100000, 1000000));
}

export function signPayload(payload: string): string {
  const secret = secretOrThrow(process.env.TOKEN_SECRET || process.env.OTP_SECRET);
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

export function verifySignedPayload(payload: string, signature: string): boolean {
  const expected = signPayload(payload);
  const a = Buffer.from(expected);
  const b = Buffer.from(signature || '');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function bookingToken(tableCode: string, dateStr: string, serial: number): string {
  const date = dateStr.replace(/-/g, '');
  return `BB-${date}-${tableCode}-S${String(serial).padStart(3, '0')}`;
}

export function parseTokenDate(token: string): string | null {
  const m = token.match(/^BB-(\d{4})(\d{2})(\d{2})-/);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}
