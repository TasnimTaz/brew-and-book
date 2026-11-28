import { normalizeBdPhone } from '@/lib/booking/utils';

type SendResult = { ok: true; provider: string; devCode?: string } | { ok: false; error: string };

type AlphaSmsResponse = {
  error?: number | string;
  msg?: string;
  data?: unknown;
  [key: string]: unknown;
};

function toInternationalBdPhone(phone: string): string {
  return phone.replace(/^0/, '880');
}

async function sendAlphaSms(to: string, msg: string): Promise<SendResult> {
  const apiKey = (process.env.ALPHA_SMS_API || process.env.SMS_API_KEY || '').trim();
  const apiUrl = (process.env.SMS_API_URL || 'https://api.sms.net.bd/sendsms').trim();

  if (!apiKey) {
    return { ok: false, error: 'Alpha SMS API key not configured' };
  }

  try {
    const body = new URLSearchParams({
      api_key: apiKey,
      msg,
      to: toInternationalBdPhone(to),
    });

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: body.toString(),
    });

    const raw = await res.text();
    let parsed: AlphaSmsResponse | null = null;
    try {
      parsed = raw ? (JSON.parse(raw) as AlphaSmsResponse) : null;
    } catch {
      parsed = null;
    }

    console.log('[Alpha SMS response]', { status: res.status, ok: res.ok, body: parsed ?? raw });

    if (!res.ok) {
      return { ok: false, error: `SMS failed (${res.status})` };
    }

    const hasError = parsed !== null && typeof parsed.error !== 'undefined' && Number(parsed.error) !== 0;
    if (hasError) {
      return { ok: false, error: `SMS failed (${String(parsed?.error)})` };
    }

    return { ok: true, provider: 'alpha-sms' };
  } catch (e) {
    console.error('sendAlphaSms failed', e);
    return { ok: false, error: 'Failed to send SMS' };
  }
}

export async function sendSms(to: string, msg: string): Promise<SendResult> {
  const normalized = normalizeBdPhone(to);
  if (!normalized) return { ok: false, error: 'Invalid phone number' };

  const provider = (process.env.SMS_PROVIDER || '').toLowerCase().trim();
  const apiKey = process.env.SMS_API_KEY || process.env.ALPHA_SMS_API || '';
  const senderId = process.env.SMS_SENDER_ID || '';
  const apiUrl = process.env.SMS_API_URL || '';

  if (!provider) {
    if (process.env.ALPHA_SMS_API) return sendAlphaSms(normalized, msg);
    if (process.env.NODE_ENV === 'production') return { ok: false, error: 'SMS provider not configured' };
    console.log(`[DEV SMS] ${normalized}: ${msg}`);
    return { ok: true, provider: 'dev-console' };
  }

  try {
    if (provider === 'alpha' || provider === 'alphasms' || provider === 'sms.net.bd') {
      return await sendAlphaSms(normalized, msg);
    }

    if (provider === 'mimsms') {
      // MiMSMS common API shape; override with SMS_API_URL if needed.
      const url = apiUrl || 'https://api.mimsms.com/api/SmsSending/SMS';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          UserName: process.env.SMS_USERNAME || '',
          ApiKey: apiKey,
          SenderName: senderId,
          TransactionType: 'T',
          CampaignId: null,
          MobileNumber: toInternationalBdPhone(normalized),
          Message: msg,
        }),
      });
      if (!res.ok) return { ok: false, error: `SMS failed (${res.status})` };
      return { ok: true, provider: 'mimsms' };
    }

    if (provider === 'smsbd' || provider === 'sms.bd') {
      if (process.env.ALPHA_SMS_API || apiUrl.includes('sms.net.bd')) {
        return await sendAlphaSms(normalized, msg);
      }
      const url = apiUrl || 'https://api.sms.net.bd/sendsms';
      const qs = new URLSearchParams({ api_key: apiKey, msg, to: normalized });
      if (senderId) qs.set('sender_id', senderId);
      const res = await fetch(`${url}?${qs.toString()}`);
      if (!res.ok) return { ok: false, error: `SMS failed (${res.status})` };
      return { ok: true, provider: 'smsbd' };
    }

    // Generic JSON provider
    if (apiUrl) {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: apiKey ? `Bearer ${apiKey}` : '' },
        body: JSON.stringify({ to: normalized, senderId, message: msg }),
      });
      if (!res.ok) return { ok: false, error: `SMS failed (${res.status})` };
      return { ok: true, provider };
    }

    return { ok: false, error: 'Unsupported SMS provider' };
  } catch (e) {
    console.error('sendSms failed', e);
    return { ok: false, error: 'Failed to send SMS' };
  }
}

export async function sendOtpSms(phone: string, code: string): Promise<SendResult> {
  const normalized = normalizeBdPhone(phone);
  if (!normalized) return { ok: false, error: 'Invalid phone number' };

  const message = `Your Brew & Book OTP Code is ${code}. It expires in ${process.env.OTP_EXPIRY_MINUTES || 5} minutes.`;
  const result = await sendSms(normalized, message);

  if (result.ok && result.provider === 'dev-console') {
    return { ...result, devCode: code };
  }
  return result;
}
