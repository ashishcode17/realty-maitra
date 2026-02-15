/**
 * Send OTP via SMS.
 * - Indian numbers: Fast2SMS (India-based, free ₹50 credit) – set FAST2SMS_API_KEY.
 * - International: Twilio (optional) – set TWILIO_* env vars.
 */

/** Get 10-digit Indian number for Fast2SMS, or E.164 for Twilio. */
function normalizeIndianNumber(phone: string): string | null {
  const raw = phone.replace(/\s+/g, '').replace(/-/g, '')
  if (!raw || raw.length < 10) return null
  // +91 98765 43210 or 919876543210 or 09876543210 or 9876543210
  if (raw.startsWith('+91')) return raw.replace(/\D/g, '').replace(/^91/, '')
  if (raw.startsWith('91') && raw.length === 12) return raw.slice(2)
  if (/^0?\d{10}$/.test(raw)) return raw.replace(/^0/, '')
  return null
}

function normalizeE164(phone: string): string | null {
  const raw = phone.replace(/\s+/g, '').replace(/-/g, '')
  if (!raw || raw.length < 10) return null
  if (raw.startsWith('+')) return raw
  if (/^91\d{10}$/.test(raw)) return `+${raw}`
  if (/^0?\d{10}$/.test(raw)) return `+91${raw.replace(/^0/, '')}`
  if (/^\d{10,15}$/.test(raw)) return `+${raw}`
  return null
}

/** Indian 10-digit check for Fast2SMS. */
function isIndianNumber(phone: string): boolean {
  return normalizeIndianNumber(phone) !== null
}

/**
 * Fast2SMS – India. Two routes:
 * - route "otp" = OTP route (uses wallet; free ₹50 after signup if you verify mobile + email).
 * - route "q" = Quick SMS (₹5/SMS, no DLT). Set FAST2SMS_USE_QUICK_SMS=true to use this.
 * Docs: https://www.fast2sms.com/otp-sms
 * API key: https://www.fast2sms.com/dashboard/dev-api
 */
async function sendViaFast2SMS(phone: string, otp: string): Promise<boolean> {
  const apiKey = process.env.FAST2SMS_API_KEY?.trim()
  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[SMS] Fast2SMS: FAST2SMS_API_KEY not set in Vercel env')
    }
    return false
  }

  const numbers = normalizeIndianNumber(phone)
  if (!numbers || numbers.length !== 10) {
    console.warn('[SMS] Fast2SMS: invalid Indian number (need 10 digits):', phone?.replace(/\d/g, 'X'))
    return false
  }

  const useQuickSms = process.env.FAST2SMS_USE_QUICK_SMS === 'true'
  const url = 'https://www.fast2sms.com/dev/bulkV2'
  const body = useQuickSms
    ? { route: 'q', message: `Your OTP is ${otp}. Valid for 10 minutes.`, numbers, flash: 0 }
    : { route: 'otp', variables_values: String(otp), numbers, flash: 0 }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        authorization: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    const text = await res.text()
    const data = (() => {
      try {
        return JSON.parse(text)
      } catch {
        return {}
      }
    })()

    if (!res.ok) {
      console.error('[SMS] Fast2SMS HTTP', res.status, text?.slice(0, 300))
      return false
    }
    if (data.return === false || (data.message && String(data.message).toLowerCase().includes('error'))) {
      // Log full response so you can see "Insufficient balance", "Invalid key", etc. in Vercel logs
      console.error('[SMS] Fast2SMS API error:', JSON.stringify(data))
      return false
    }
    return true
  } catch (e) {
    console.error('[SMS] Fast2SMS failed:', e)
    return false
  }
}

/**
 * 2Factor.in – India OTP. Simple API, paid (e.g. ₹0.30/SMS). Set TWO_FACTOR_API_KEY in Vercel.
 * Docs: https://2factor.in/API/DOCS/SMS_OTP.html
 */
async function sendVia2Factor(phone: string, otp: string): Promise<boolean> {
  const apiKey = process.env.TWO_FACTOR_API_KEY?.trim()
  if (!apiKey) return false

  const num = normalizeIndianNumber(phone)
  if (!num || num.length !== 10) return false

  const url = `https://2factor.in/API/V1/${apiKey}/SMS/${num}/${otp}`
  try {
    const res = await fetch(url, { method: 'POST' })
    const text = await res.text()
    if (!res.ok) {
      console.error('[SMS] 2Factor HTTP', res.status, text?.slice(0, 200))
      return false
    }
    const data = (() => {
      try {
        return JSON.parse(text)
      } catch {
        return {}
      }
    })()
    if (data.Status !== 'Success' && data.Status !== 'success') {
      console.error('[SMS] 2Factor API:', JSON.stringify(data))
      return false
    }
    return true
  } catch (e) {
    console.error('[SMS] 2Factor failed:', e)
    return false
  }
}

/**
 * Twilio – international (and India). Optional.
 */
async function sendViaTwilio(phone: string, otp: string): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_PHONE_NUMBER
  if (!accountSid || !authToken || !fromNumber) return false

  const to = normalizeE164(phone)
  if (!to) return false

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64')

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: to,
        From: fromNumber,
        Body: `Your verification code is ${otp}. Valid for 10 minutes.`,
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      console.error('[SMS] Twilio error:', res.status, err)
      return false
    }
    return true
  } catch (e) {
    console.error('[SMS] Twilio failed:', e)
    return false
  }
}

/**
 * Send OTP by SMS.
 * Indian numbers: tries Fast2SMS → 2Factor.in → Twilio (use whichever you set in Vercel).
 * Others: Twilio only.
 */
export async function sendOTPSms(phone: string, otp: string): Promise<boolean> {
  if (isIndianNumber(phone)) {
    if (await sendViaFast2SMS(phone, otp)) return true
    if (await sendVia2Factor(phone, otp)) return true
  }

  if (await sendViaTwilio(phone, otp)) return true

  if (process.env.NODE_ENV !== 'production') {
    console.log('[SMS] No provider configured or send failed. OTP would be:', otp)
  }
  return false
}

export { normalizeIndianNumber, normalizeE164, isIndianNumber }
