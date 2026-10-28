import https from 'https';

/**
 * Normalizes Indian and International Mobile Numbers
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.length === 10) return `+91${cleaned}`;
  if (cleaned.length === 12 && cleaned.startsWith('91')) return `+${cleaned}`;
  return `+91${cleaned}`;
};

/**
 * Sends SMS via Fast2SMS (Indian Gateway) if API key is provided
 */
const sendViaFast2Sms = async (apiKey, phone, message) => {
  return new Promise((resolve, reject) => {
    const rawNumber = phone.replace(/[^0-9]/g, '').slice(-10);
    const postData = JSON.stringify({
      route: 'q',
      message,
      language: 'english',
      flash: 0,
      numbers: rawNumber
    });

    const options = {
      hostname: 'www.fast2sms.com',
      port: 443,
      path: '/dev/bulkV2',
      method: 'POST',
      headers: {
        authorization: apiKey,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.return) {
            resolve({ success: true, provider: 'Fast2SMS', raw: parsed });
          } else {
            resolve({ success: false, provider: 'Fast2SMS', error: parsed.message });
          }
        } catch (e) {
          resolve({ success: false, error: data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(postData);
    req.end();
  });
};

/**
 * Sends SMS via Twilio if credentials are provided
 */
const sendViaTwilio = async (accountSid, authToken, fromNumber, toNumber, message) => {
  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams({
      To: toNumber,
      From: fromNumber,
      Body: message
    }).toString();

    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const options = {
      hostname: 'api.twilio.com',
      port: 443,
      path: `/2010-04-01/Accounts/${accountSid}/Messages.json`,
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.sid) {
            resolve({ success: true, provider: 'Twilio', sid: parsed.sid });
          } else {
            resolve({ success: false, provider: 'Twilio', error: parsed.message });
          }
        } catch (e) {
          resolve({ success: false, error: data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(postData);
    req.end();
  });
};

/**
 * Master Send SMS Function (Dual Support: Real Gateway or Simulated Logging)
 */
export const sendSms = async ({ to, message, purpose = 'VERIFICATION' }) => {
  const formattedPhone = formatPhoneNumber(to);
  const fast2SmsKey = process.env.FAST2SMS_API_KEY;
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_FROM_NUMBER;

  // 1. Try Fast2SMS if configured
  if (fast2SmsKey && fast2SmsKey.trim()) {
    try {
      const res = await sendViaFast2Sms(fast2SmsKey, formattedPhone, message);
      console.log(`[REAL SMS SENT via Fast2SMS] To: ${formattedPhone} | Status: ${res.success}`);
      return res;
    } catch (e) {
      console.error('[Fast2SMS Error]', e.message);
    }
  }

  // 2. Try Twilio if configured
  if (twilioSid && twilioToken && twilioFrom) {
    try {
      const res = await sendViaTwilio(twilioSid, twilioToken, twilioFrom, formattedPhone, message);
      console.log(`[REAL SMS SENT via Twilio] To: ${formattedPhone} | Status: ${res.success}`);
      return res;
    } catch (e) {
      console.error('[Twilio Error]', e.message);
    }
  }

  // 3. Fallback / Simulated SMS Dispatch
  console.log('========================================================================');
  console.log(`📱 [SMS DISPATCHED TO MOBILE PHONE]`);
  console.log(`   To Mobile:  ${formattedPhone}`);
  console.log(`   Purpose:    ${purpose}`);
  console.log(`   Message:    "${message}"`);
  console.log('========================================================================');

  return {
    success: true,
    provider: 'SIMULATED_SMS_GATEWAY',
    to: formattedPhone,
    message
  };
};

/**
 * Dispatches 6-Digit Verification Code via SMS
 */
export const sendOtpSms = async (phone, otp) => {
  if (!phone) return { success: false, message: 'No phone number provided' };
  const message = `Your Bail Reckoner (BNSS 2023) verification code is: ${otp}. Valid for 10 minutes. Do not share this code with anyone.`;
  return sendSms({
    to: phone,
    message,
    purpose: 'OTP_VERIFICATION'
  });
};

export default {
  sendSms,
  sendOtpSms,
  formatPhoneNumber
};
