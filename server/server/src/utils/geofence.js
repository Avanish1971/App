// Geofence se automatic attendance:
//   office ke radius ke ANDAR aate hi  -> PRESENT (pehli baar = check-in)
//   radius ke BAHAR grace time se zyada -> ABSENT
// Grace time admin ke "Policy & Shift Engine" me "Exit Grace Window" se aata hai.
const Employee = require('../models/Employee');
const Office = require('../models/Office');
const Shift = require('../models/Shift');
const AttendanceRecord = require('../models/AttendanceRecord');
const AttendancePolicy = require('../models/AttendancePolicy');
const { distanceMeters } = require('./geo');
const { todayIST, nowTimeIST, minutesNowIST, parseClock } = require('./time');
const LeaveRequest = require('../models/LeaveRequest');
const { broadcastAdmin } = require('./realtime');

// In status wale employees ka attendance GPS se nahi badalta
const PROTECTED_STATUSES = ['ON_LEAVE', 'WFH', 'ON_DUTY', 'ON_BREAK'];

function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

async function getPolicy() {
  const p = await AttendancePolicy.findOne({ id: 'policy_global' }).lean();
  return {
    gpsAccuracyMaxMeters: (p && p.gpsAccuracyMaxMeters) || 50,
    exitGracePeriodMinutes: p && typeof p.exitGracePeriodMinutes === 'number' ? p.exitGracePeriodMinutes : 10,
  };
}

function newEvent(eventType, lat, lng, accuracy, note) {
  return {
    id: `ev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: nowTimeIST(),
    eventType,
    latitude: lat,
    longitude: lng,
    accuracy,
    note,
  };
}

function markAbsent(record, lat, lng, accuracy, minutesOutside) {
  record.status = 'ABSENT';
  record.checkOutTime = nowTimeIST();
  record.checkOutLat = lat;
  record.checkOutLng = lng;
  record.outsideSince = undefined;
  record.events.push(
    newEvent('CHECK_OUT', lat, lng, accuracy, `Auto: office radius ke bahar ${minutesOutside} min -> ABSENT`)
  );
}

// App se aayi ek location ko process karta hai
async function processPingInner(employeeId, ping) {
  const lat = Number(ping && ping.latitude);
  const lng = Number(ping && ping.longitude);
  const accuracy = Number(ping && ping.accuracy) || 0;
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    throw httpError(400, 'Latitude/longitude galat hai');
  }

  const employee = await Employee.findOne({ id: employeeId });
  if (!employee) throw httpError(404, 'Employee nahi mila');
  if (employee.status === 'INACTIVE') throw httpError(403, 'Employee ID deactivate hai');

  // Admin ke Live Radar ke liye employee ki taaza location
  await Employee.updateOne({ id: employeeId }, { currentLat: lat, currentLng: lng, accuracyMeters: accuracy });

  const office = await Office.findOne({ id: employee.officeId });
  if (!office) return { record: null, inside: null, reason: 'NO_OFFICE' };

  const policy = await getPolicy();
  const dist = distanceMeters(lat, lng, office.latitude, office.longitude);
  const inside = dist <= office.radiusMeters;
  const date = todayIST();

  // Aaj ka record (nahi hai to ban jata hai)
  const record = await AttendanceRecord.findOneAndUpdate(
    { employeeId, date },
    {
      $setOnInsert: {
        id: `att_${employeeId}_${date}`,
        officeId: office.id,
        shiftId: employee.shiftId,
        status: 'SCHEDULED',
        source: 'AUTO_GEOFENCE',
        verificationStatus: 'PENDING',
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  record.lastPingAt = new Date();
  record.lastLat = lat;
  record.lastLng = lng;
  record.lastDistanceMeters = dist;
  record.insideGeofence = inside;

  const base = { record, inside, distanceMeters: dist, officeName: office.name };

  // GPS kamzor hai -> sirf location save, status mat badlo
  if (accuracy > policy.gpsAccuracyMaxMeters) {
    await record.save();
    return { ...base, ignored: 'LOW_ACCURACY' };
  }
  // Field staff aur leave/WFH/on-duty/break wale: status GPS se nahi badalta
  if (employee.workType === 'FIELD_WORK' || PROTECTED_STATUSES.includes(record.status)) {
    await record.save();
    return { ...base, ignored: 'PROTECTED' };
  }

  if (inside) {
    if (record.status !== 'PRESENT') {
      const firstTime = !record.checkInTime;
      record.status = 'PRESENT';
      record.verificationStatus = 'VERIFIED';
      if (firstTime) {
        record.checkInTime = nowTimeIST();
        record.checkInLat = lat;
        record.checkInLng = lng;
        record.checkInAccuracy = accuracy;
        record.source = 'AUTO_GEOFENCE';
        const shift = await Shift.findOne({ id: record.shiftId || employee.shiftId });
        const start = shift ? parseClock(shift.startTime) : null;
        if (start !== null) record.isLate = minutesNowIST() > start + (shift.gracePeriodMinutes || 0);
        record.events.push(newEvent('GEOFENCE_ENTER', lat, lng, accuracy, `${office.name} ke radius me aaye (${dist}m door)`));
        record.events.push(newEvent('CHECK_IN', lat, lng, accuracy, 'Auto check-in: PRESENT'));
      } else {
        record.checkOutTime = undefined;
        record.checkOutLat = undefined;
        record.checkOutLng = undefined;
        record.events.push(newEvent('GEOFENCE_ENTER', lat, lng, accuracy, `Wapas ${office.name} ke radius me aaye (${dist}m door)`));
      }
    }
    record.outsideSince = undefined;
  } else if (record.status === 'PRESENT') {
    if (!record.outsideSince) {
      record.outsideSince = new Date();
      record.events.push(
        newEvent('GEOFENCE_EXIT', lat, lng, accuracy,
          `${office.name} ke radius se bahar (${dist}m door). ${policy.exitGracePeriodMinutes} min me wapas nahi aaye to ABSENT`)
      );
    }
    const minutesOutside = (Date.now() - new Date(record.outsideSince).getTime()) / 60000;
    if (minutesOutside >= policy.exitGracePeriodMinutes) {
      markAbsent(record, lat, lng, accuracy, Math.round(minutesOutside));
    }
  }

  await record.save();
  return base;
}

// Ping process karke turant admin panel ko live update bhejta hai
async function processPing(employeeId, ping) {
  const result = await processPingInner(employeeId, ping);
  if (result && result.record) {
    const rec = result.record;
    broadcastAdmin('attendance', {
      record: typeof rec.toObject === 'function' ? rec.toObject() : rec,
      location: {
        employeeId,
        latitude: Number(ping.latitude),
        longitude: Number(ping.longitude),
        accuracy: Number(ping.accuracy) || 0,
      },
    });
  }
  return result;
}

// Har minute chalta hai: jo employee radius se bahar nikle aur app band ho gaya
// (isliye naya location nahi aa raha), unhe grace time ke baad ABSENT kar deta hai.
async function sweepExpiredExits() {
  const policy = await getPolicy();
  const cutoff = new Date(Date.now() - policy.exitGracePeriodMinutes * 60000);
  const stale = await AttendanceRecord.find({
    date: todayIST(),
    status: 'PRESENT',
    outsideSince: { $lte: cutoff },
  });
  for (const record of stale) {
    const minutes = Math.round((Date.now() - new Date(record.outsideSince).getTime()) / 60000);
    markAbsent(record, record.lastLat, record.lastLng, 0, minutes);
    await record.save();
    broadcastAdmin('attendance', { record: record.toObject(), reason: 'AUTO_ABSENT' });
  }
  return stale.length;
}

const { WEEKLY_OFF } = require('./weeklyOff');
function weekdayIST() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })).getDay();
}

// Shift start + grace ke baad bhi jo employee office me nahi aaya use LATE mark karta hai.
// (Leave/WFH/on-duty/field staff aur weekly off ko chhod kar.) Aane par wo PRESENT + LATE hi dikhega.
async function markNoShowsLate() {
  if (WEEKLY_OFF.includes(weekdayIST())) return 0;
  const date = todayIST();
  const nowMin = minutesNowIST();
  const [employees, shifts, records, leaves] = await Promise.all([
    Employee.find({ status: { $ne: 'INACTIVE' }, workType: { $ne: 'FIELD_WORK' } }).lean(),
    Shift.find().lean(),
    AttendanceRecord.find({ date }).lean(),
    LeaveRequest.find({ status: 'APPROVED', startDate: { $lte: date }, endDate: { $gte: date } }).lean(),
  ]);
  const onLeave = new Set(leaves.map((l) => l.employeeId));
  const byEmp = new Map(records.map((r) => [r.employeeId, r]));
  let count = 0;

  for (const emp of employees) {
    const shift = shifts.find((s) => s.id === emp.shiftId);
    if (!shift || shift.isOvernight) continue;
    const start = parseClock(shift.startTime);
    const end = parseClock(shift.endTime);
    if (start === null) continue;
    if (nowMin <= start + (shift.gracePeriodMinutes || 0)) continue; // abhi time hai
    if (end !== null && nowMin >= end) continue; // shift khatam, ab late mark ka matlab nahi
    if (onLeave.has(emp.id)) continue;
    const rec = byEmp.get(emp.id);
    if (rec && (rec.checkInTime || rec.isLate || rec.status !== 'SCHEDULED')) continue;

    try {
      const updated = await AttendanceRecord.findOneAndUpdate(
        { employeeId: emp.id, date },
        {
          $set: { isLate: true },
          $setOnInsert: {
            id: `att_${emp.id}_${date}`,
            officeId: emp.officeId,
            shiftId: emp.shiftId,
            status: 'SCHEDULED',
            source: 'AUTO_GEOFENCE',
            verificationStatus: 'PENDING',
          },
          $push: {
            events: newEvent('LATE_MARK', undefined, undefined, 0,
              `Shift ${shift.startTime} + ${shift.gracePeriodMinutes || 0} min grace ke baad bhi office ke radius me nahi aaye -> LATE`),
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      broadcastAdmin('attendance', { record: updated.toObject(), reason: 'LATE_MARK' });
      count += 1;
    } catch (err) {
      console.error('Late mark error:', emp.id, err.message);
    }
  }
  return count;
}

function startSweeper() {
  setInterval(() => {
    sweepExpiredExits().catch((err) => console.error('Geofence sweeper error:', err.message));
    markNoShowsLate().catch((err) => console.error('Late sweeper error:', err.message));
  }, 60000);
  console.log('Geofence sweeper chalu (har 60 sec)');
}

module.exports = { processPing, sweepExpiredExits, markNoShowsLate, startSweeper };
