// ============================================================
// deviceParser.js — Parse User-Agent into readable device info
// ============================================================

function parseDevice(userAgent) {
  if (!userAgent) return 'Unknown Device';

  // Detect OS
  let os = 'Unknown OS';
  if      (/windows nt 10/i.test(userAgent)) os = 'Windows 10/11';
  else if (/windows nt/i.test(userAgent))    os = 'Windows';
  else if (/android/i.test(userAgent))       os = 'Android';
  else if (/iphone/i.test(userAgent))        os = 'iPhone';
  else if (/ipad/i.test(userAgent))          os = 'iPad';
  else if (/mac os/i.test(userAgent))        os = 'macOS';
  else if (/linux/i.test(userAgent))         os = 'Linux';

  // Detect browser
  let browser = 'Unknown Browser';
  if      (/edg\//i.test(userAgent))     browser = 'Edge';
  else if (/opr\//i.test(userAgent))     browser = 'Opera';
  else if (/chrome/i.test(userAgent))    browser = 'Chrome';
  else if (/firefox/i.test(userAgent))   browser = 'Firefox';
  else if (/safari/i.test(userAgent))    browser = 'Safari';

  return `${browser} on ${os}`;
}

module.exports = { parseDevice };
