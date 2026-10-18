// India (IST) ke hisaab se date/time. AWS server aksar UTC me chalta hai,
// isliye yahan time zone saaf-saaf Asia/Kolkata rakha hai.
const TZ = 'Asia/Kolkata';

// "2026-10-14" jaisi date
function todayIST() {
  return new Date().toLocaleDateString('en-CA', { timeZone: TZ });
}

// "09:48 AM" jaisa time (app me checkInTime isi format me hota hai)
function nowTimeIST() {
  return new Date().toLocaleTimeString('en-US', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
}

// Raat 12 baje se abhi tak ke minutes (IST)
function minutesNowIST() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === 'hour').value) % 24;
  const m = Number(parts.find((p) => p.type === 'minute').value);
  return h * 60 + m;
}

// "10:00 AM" -> 600 (minutes). Samajh na aaye to null.
function parseClock(str) {
  const m = String(str || '').trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2]);
  const ap = (m[3] || '').toUpperCase();
  if (ap === 'PM' && h < 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return h * 60 + min;
}

module.exports = { todayIST, nowTimeIST, minutesNowIST, parseClock };