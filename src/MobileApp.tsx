import { useState, useEffect } from 'react';
import {
  getMeApi,
  getMyLeaveBalanceApi,
  updateAttendanceTodayApi,
  applyLeaveApi,
  applyRegularizationApi,
} from './lib/api';
import type { MeData } from './lib/api';
import { clearToken, getToken, isTokenValid, AUTH_EXPIRED_EVENT } from './lib/auth';
import { AttendanceRecord, LeaveRequest, RegularizationRequest } from './types';
import { calculateIndianPayrollItem } from './utils/payroll';
import { MobileAppSimulator } from './components/mobile/MobileAppSimulator';
import { MobileLoginScreen } from './components/mobile/MobileLoginScreen';
import { useGeofenceTracking } from './components/mobile/useGeofenceTracking';
import { useLiveEvents } from './lib/realtime';
import { UpdateBanner } from './components/UpdateBanner.tsx';
import { MessageInbox } from './components/mobile/MessageInbox';
import { LocationSetupGate, isNativeApp } from './components/mobile/LocationSetupGate';

// Server bhi India (IST) ki date use karta hai
const todayStr = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

function buildBlankAttendance(employeeId: string, officeId: string, shiftId: string): AttendanceRecord {
  return {
    id: `att_${employeeId}_${todayStr()}`,
    employeeId,
    date: todayStr(),
    officeId,
    shiftId,
    status: 'SCHEDULED',
    workingMinutes: 0,
    breakMinutes: 0,
    overtimeMinutes: 0,
    isLate: false,
    isEarlyExit: false,
    source: 'MANUAL',
    verificationStatus: 'PENDING',
    events: [],
  };
}

// Phone ka app: pehle login page, login ke baad hi app. Sirf apna data aata hai.
export default function MobileApp() {
  const [authed, setAuthed] = useState<boolean>(() => isTokenValid(getToken('employee')));
  const [me, setMe] = useState<MeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logout = () => {
    clearToken('employee');
    setMe(null);
    setError(null);
    setAuthed(false);
  };

  // Server ne bola "token galat/expire" -> login page
  useEffect(() => {
    const onExpired = () => {
      setMe(null);
      setError(null);
      setAuthed(false);
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, []);

  // Login ke baad apna data mangao
  useEffect(() => {
    if (!authed) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getMeApi()
      .then((data) => {
        if (!cancelled) setMe(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Data nahi aa paaya');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authed]);

  // Phone ki live location se aaya attendance record
  const handleLiveRecord = (record: AttendanceRecord) => {
    setMe((m) => (m ? { ...m, attendance: record } : m));
  };
  const { position: livePosition, status: locationStatus } = useGeofenceTracking(
    authed && me ? me.employee.id : null,
    handleLiveRecord
  );

  const handleUpdateAttendance = async (newRecord: AttendanceRecord) => {
    if (!me) return;
    setMe((m) => (m ? { ...m, attendance: newRecord } : m));
    try {
      const saved = await updateAttendanceTodayApi(me.employee.id, newRecord);
      setMe((m) => (m ? { ...m, attendance: saved } : m));
    } catch (err) {
      console.error('Failed to save attendance:', err);
    }
  };

  // Leave apply: server mana kare (jaise leave kam hai) to error screen par dikhne ke liye upar throw hota hai
  const handleApplyLeave = async (leave: Omit<LeaveRequest, 'id' | 'appliedAt' | 'status'>) => {
    const created = await applyLeaveApi(leave);
    setMe((m) => (m ? { ...m, leaves: [created, ...m.leaves] } : m));
    // Leave li hai to balance me se turant kam dikhao
    getMyLeaveBalanceApi()
      .then((leaveBalance) => setMe((m) => (m ? { ...m, leaveBalance } : m)))
      .catch(() => {});
  };

  const handleApplyRegularization = async (reg: Omit<RegularizationRequest, 'id' | 'appliedAt' | 'status'>) => {
    try {
      await applyRegularizationApi(reg);
    } catch (err) {
      console.error('Failed to apply regularization:', err);
    }
  };

  // Admin ne leave approve/reject ki ya branch transfer kiya: apna data turant naya le lo
  useLiveEvents('employee', authed && !!me, (event) => {
    if (event === 'leave-updated' || event === 'profile-updated') {
      getMeApi()
        .then((data) => setMe(data))
        .catch(() => {});
    }
  });

  // Phone app me: pehle location permission + GPS ON hona zaroori (install ke baad pehli baar bhi). Browser me skip.
  const [locationReady, setLocationReady] = useState(() => !isNativeApp());
  if (!locationReady) {
    return <LocationSetupGate onReady={() => setLocationReady(true)} />;
  }

  // ---- Login nahi hai ----
  if (!authed) {
    return (
      <>
        <UpdateBanner />
        <MobileLoginScreen
          onLoggedIn={() => {
            setError(null);
            setAuthed(true);
          }}
        />
      </>
    );
  }

  const messageScreen = (title: string, text: string) => (
    <>
      <UpdateBanner />
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-slate-50 flex items-center justify-center p-6">
        <div className="max-w-sm w-full bg-white border border-slate-200 rounded-3xl shadow-sm p-6 text-center space-y-3">
          <div className="font-bold text-slate-900 text-sm">{title}</div>
          <p className="text-xs text-slate-500">{text}</p>
          <button
            onClick={logout}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
          >
            Logout
          </button>
        </div>
      </div>
    </>
  );

  if (loading && !me) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-sm text-slate-500">Aapka data aa raha hai…</div>
      </div>
    );
  }
  if (error) return messageScreen('Data nahi aa paaya', error);
  if (!me) return null;

  // Office assign nahi hai (ya delete ho gaya)
  if (!me.office) {
    return messageScreen(
      `${me.employee.fullName}, aapka office assign nahi hai`,
      'Admin se kahein ki "Office Locations" me aapka office set kar de. Tab tak auto attendance band rahegi.'
    );
  }

  const e = me.employee;
  const attendance = me.attendance || buildBlankAttendance(e.id, e.officeId, e.shiftId);
  const payrollItem = calculateIndianPayrollItem(e.id, e.fullName, e.department, e.designation, e.pan, e.bankAccount, {
    grossMonthly: (e.basicMonthly || 0) + (e.hraMonthly || 0) + (e.specialAllowanceMonthly || 0),
    workingDays: 26,
    presentDays: 26,
    paidLeaveDays: 0,
    lopDays: 0,
    overtimeHours: 0,
  });

  return (
    <>
      <UpdateBanner />
      <MobileAppSimulator
        employee={e}
        office={me.office}
        attendance={attendance}
        payrollItem={payrollItem}
        livePosition={livePosition}
        locationStatus={locationStatus}
        leaves={me.leaves}
        leaveBalance={me.leaveBalance || null}
        onUpdateAttendance={handleUpdateAttendance}
        onApplyLeave={handleApplyLeave}
        onApplyRegularization={handleApplyRegularization}
        onClientVisitSaved={handleLiveRecord}
        onLogout={logout}
      />
      <MessageInbox enabled={authed} />
    </>
  );
}
