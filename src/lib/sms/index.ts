import { normalizeBdPhone } from '@/lib/booking/utils';

type SendResult = { ok: true; provider: string; devCode?: string } | { ok: false; error: string };

export async function sendOtpSms(phone: string, code: string): Promise<SendResult> {
  const normalized = normalizeBdPhone(phone);
  if (!normalized) return { ok: false, error: 'Invalid phone number' };
  const provider = (process.env.SMS_PROVIDER || '').toLowerCase().trim();
  const message = `Your Brew & Book OTP is ${code}. It expires in ${process.env.OTP_EXPIRY_MINUTES || 5} minutes.`;

  if (!provider) {
    if (process.env.NODE_ENV === 'production') return { ok: false, error: 'SMS provider not configured' };
    console.log(`[DEV OTP] ${normalized}: ${code}`);
    return { ok: true, provider: 'dev-console', devCode: code };
  }

  const apiKey = process.env.SMS_API_KEY || '';
  const senderId = process.env.SMS_SENDER_ID || '';
  const apiUrl = process.env.SMS_API_URL || '';

  try {
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
          MobileNumber: normalized.replace(/^0/, '880'),
          Message: message,
        }),
      });
      if (!res.ok) return { ok: false, error: `SMS failed (${res.status})` };
      return { ok: true, provider: 'mimsms' };
    }

    if (provider === 'smsbd' || provider === 'sms.bd') {
      const url = apiUrl || 'https://api.sms.net.bd/sendsms';
      const qs = new URLSearchParams({ api_key: apiKey, msg: message, to: normalized });
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
        body: JSON.stringify({ to: normalized, senderId, message, code }),
      });
      if (!res.ok) return { ok: false, error: `SMS failed (${res.status})` };
      return { ok: true, provider };
    }

    return { ok: false, error: 'Unsupported SMS provider' };
  } catch (e) {
    console.error('sendOtpSms failed', e);
    return { ok: false, error: 'Failed to send SMS' };
  }
}
