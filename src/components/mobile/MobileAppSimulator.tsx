import { useState, useEffect } from 'react';
import {
  Employee,
  Office,
  AttendanceRecord,
  AttendanceEvent,
  LeaveRequest,
  RegularizationRequest,
  IndianPayrollItem,
  LeaveBalance,
} from '../../types';
import { validateGeofence, formatDistance } from '../../utils/geo';
import { PayslipViewer } from './PayslipViewer';
import { openLocationSettings } from './useGeofenceTracking';
import { LeaveModule } from './LeaveModule';
import { RegularizationModal } from './RegularizationModal';
import { OfflineQueueModal } from './OfflineQueueModal';
import { ClientCheckInModal } from './ClientCheckInModal';
import {
  ShieldCheck,
  MapPin,
  Clock,
  Coffee,
  Calendar,
  FileText,
  Wifi,
  WifiOff,
  AlertTriangle,
  ChevronRight,
  Building,
  Briefcase,
  Lock,
} from 'lucide-react';

interface MobileAppSimulatorProps {
  employee: Employee;
  office: Office;
  attendance: AttendanceRecord;
  payrollItem: IndianPayrollItem;
  leaves: LeaveRequest[];
  onUpdateAttendance: (newRecord: AttendanceRecord) => void;
  leaveBalance?: LeaveBalance | null;
  onApplyLeave: (leave: Omit<LeaveRequest, 'id' | 'appliedAt' | 'status'>) => Promise<void>;
  onApplyRegularization: (reg: Omit<RegularizationRequest, 'id' | 'appliedAt' | 'status'>) => void;
  onClientVisitSaved: (record: AttendanceRecord) => void;
  onLogout: () => void;
  // Phone ki live GPS location (None ho to abhi location nahi mili)
  livePosition?: { latitude: number; longitude: number; accuracy: number } | null;
  locationStatus?: 'idle' | 'requesting' | 'granted' | 'denied' | 'gpsoff' | 'unavailable';
}

export function MobileAppSimulator({
  employee,
  office,
  attendance,
  payrollItem,
  leaves,
  leaveBalance,
  onUpdateAttendance,
  onApplyLeave,
  onApplyRegularization,
  onClientVisitSaved,
  livePosition,
  locationStatus,
  onLogout,
}: MobileAppSimulatorProps) {
  // Ab location asli GPS se aati hai. GPS nahi mila to hasFix = false.
  const hasFix = !!livePosition;
  const userLat = livePosition ? livePosition.latitude : office.latitude;
  const userLng = livePosition ? livePosition.longitude : office.longitude;
  const accuracy = livePosition ? livePosition.accuracy : 0;
  const isMock = false;

  // Modals
  const [showPayslip, setShowPayslip] = useState(false);
  const [showLeave, setShowLeave] = useState(false);
  const [showRegularization, setShowRegularization] = useState(false);
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [showClientCheckIn, setShowClientCheckIn] = useState(false);

  // Offline queue simulation
  const [isOffline, setIsOffline] = useState(false);
  const [offlineEvents, setOfflineEvents] = useState<AttendanceEvent[]>([]);

  // Break timer state
  const [breakTimerSeconds, setBreakTimerSeconds] = useState(0);

  const locationMessage =
    locationStatus === 'denied'
      ? 'Location permission band hai. Phone Settings me is app ko Location allow karo.'
      : locationStatus === 'gpsoff'
        ? 'Phone ki Location (GPS) band hai. Upar se screen neeche kheench kar Location ON karo.'
      : locationStatus === 'unavailable'
        ? 'GPS available nahi hai. Location (GPS) ON karo.'
        : 'Thodi der ruko, aapki location dhoondh rahe hain…';

  // Geofence check
  const geoResult = validateGeofence(userLat, userLng, accuracy, office.latitude, office.longitude, office.radiusMeters, 50, isMock);

  // Live timer for break
  useEffect(() => {
    let interval: any = null;
    if (attendance.status === 'ON_BREAK') {
      interval = setInterval(() => {
        setBreakTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [attendance.status]);

  // Check-In Action
  const handleCheckIn = () => {
    const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const newRecord: AttendanceRecord = {
      ...attendance,
      status: hasFix && geoResult.isInside ? 'PRESENT' : 'WFH',
      checkInTime: nowTime,
      checkInLat: userLat,
      checkInLng: userLng,
      checkInAccuracy: accuracy,
      source: hasFix && geoResult.isInside ? 'AUTO_GEOFENCE' : 'MANUAL',
      verificationStatus: hasFix && geoResult.isInside ? 'VERIFIED' : 'PENDING',
      events: [
        ...attendance.events,
        {
          id: `ev_${Date.now()}`,
          timestamp: nowTime,
          eventType: 'CHECK_IN',
          latitude: userLat,
          longitude: userLng,
          accuracy,
          note: `Geo-verified check-in at ${office.name}`,
        },
      ],
    };
    onUpdateAttendance(newRecord);
  };

  // Toggle Break Action
  const handleToggleBreak = () => {
    const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    if (attendance.status === 'ON_BREAK') {
      const updated: AttendanceRecord = {
        ...attendance,
        status: 'PRESENT',
        events: [
          ...attendance.events,
          {
            id: `ev_${Date.now()}`,
            timestamp: nowTime,
            eventType: 'BREAK_END',
            latitude: userLat,
            longitude: userLng,
            accuracy,
            note: 'Break ended.',
          },
        ],
      };
      setBreakTimerSeconds(0);
      onUpdateAttendance(updated);
    } else {
      const updated: AttendanceRecord = {
        ...attendance,
        status: 'ON_BREAK',
        events: [
          ...attendance.events,
          {
            id: `ev_${Date.now()}`,
            timestamp: nowTime,
            eventType: 'BREAK_START',
            latitude: userLat,
            longitude: userLng,
            accuracy,
            note: 'Break initiated',
          },
        ],
      };
      onUpdateAttendance(updated);
    }
  };

  const handleSyncOfflineEvents = () => {
    if (offlineEvents.length === 0) return;
    const newEvents = [...attendance.events, ...offlineEvents];
    setOfflineEvents([]);
    setIsOffline(false);
    onUpdateAttendance({ ...attendance, events: newEvents });
  };

  return (
    <div className="flex-1 bg-gradient-to-b from-blue-50 via-white to-slate-50 min-h-screen flex flex-col relative text-slate-800 font-sans antialiased">
      {/* Real Mobile Top Bar Status look */}
      {/* <div className="pt-3 px-6 pb-2 flex justify-between items-center text-[11px] text-slate-500 font-mono select-none">
        <div className="flex items-center gap-1.5">
          {isOffline ? <WifiOff className="w-3 h-3 text-amber-500" /> : <Wifi className="w-3 h-3 text-emerald-500" />}
          <div className="w-4 h-2 rounded-sm border border-slate-400 flex items-center p-0.5">
            <div className="w-2.5 h-full bg-emerald-500 rounded-xs" />
          </div>
        </div>
      </div> */}

      {/* Main Full Screen Viewport Area */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3.5 pb-24 text-xs">
        {/* Profile Card */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500">Good Morning 👋</span>
              <span className={`px-1.5 py-0.2 rounded font-mono text-[9px] font-bold ${employee.workType === 'FIELD_WORK' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-indigo-100 text-indigo-700 border border-indigo-200'}`}>
                {employee.workType === 'FIELD_WORK' ? 'Field Work' : 'In-Office'}
              </span>
            </div>
            <div className="font-extrabold text-base text-slate-900 tracking-tight">{employee.fullName}</div>
            <div className="text-[10px] text-slate-500 font-mono">ID: {employee.loginId}</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onLogout} title="Logout" className="w-7 h-7 rounded-lg bg-white text-slate-500 flex items-center justify-center border border-slate-200 shadow-sm">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
            </button>
            <img src={employee.avatar} alt={employee.fullName} className="w-10 h-10 rounded-full border-2 border-blue-400 object-cover" />
          </div>
        </div>

        {/* Office Radius Boundary Check */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-blue-600 font-semibold text-[11px]">
              <Building className="w-3.5 h-3.5" />
              <span>{office.name}</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">{office.workingHours || ''}</span>
          </div>
          <div className={`p-2.5 rounded-xl border text-[11px] flex items-start gap-2 ${hasFix && geoResult.verdict === 'VERIFIED' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">{!hasFix ? 'Location detect ho rahi hai…' : geoResult.isInside ? 'Location Verified Inside Geofence' : 'Office geofence ke bahar'}</div>
              <div className="text-[10px] text-slate-600 opacity-90">{hasFix ? geoResult.message : locationMessage}</div>
              {!hasFix && (locationStatus === 'denied' || locationStatus === 'gpsoff' || locationStatus === 'unavailable') && (
                <button onClick={() => openLocationSettings()} className="mt-1.5 text-[10px] font-bold text-indigo-700 underline">
                  Settings kholo
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Status Dashboard and Punch Logic */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">Today's Status</span>
            <span
              className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] tracking-wide ${
                attendance.status === 'PRESENT' || attendance.status === 'ON_DUTY'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-amber-500 text-white'
              }`}
            >
              {attendance.status === 'ON_DUTY' ? 'PRESENT (On-Duty)' : attendance.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-blue-50 rounded-xl p-2.5 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500 shrink-0" />
              <div>
                <div className="text-[9px] text-slate-500">Check-In Time</div>
                <div className="text-[11px] font-bold text-slate-900">{attendance.checkInTime || '--:--'}</div>
              </div>
            </div>
            <div className="bg-amber-50 rounded-xl p-2.5 flex items-center gap-2">
              <Coffee className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <div className="text-[9px] text-slate-500">
                  {attendance.status === 'ON_BREAK' ? 'Break Elapsed' : 'Working Time'}
                </div>
                <div className="text-[11px] font-bold text-slate-900">
                  {attendance.status === 'ON_BREAK'
                    ? `${Math.floor(breakTimerSeconds / 60)}m ${breakTimerSeconds % 60}s`
                    : '07h 32m'}
                </div>
              </div>
            </div>
          </div>

          {employee.workType === 'FIELD_WORK' ? (
            attendance.status === 'SCHEDULED' || attendance.status === 'OUTSIDE_GEOFENCE' ? (
              <div className="w-full py-2.5 px-3 bg-blue-50 border border-blue-100 text-blue-700 text-[11px] font-medium rounded-xl text-center">
                Field Work: client ke paas pahunchkar neeche <strong>Client Site Check-In</strong> se hazri lagao
              </div>
            ) : (
              <button
                onClick={handleToggleBreak}
                className={`w-full py-2.5 rounded-xl font-semibold flex items-center justify-center gap-1.5 ${
                  attendance.status === 'ON_BREAK'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gradient-to-r from-blue-500 to-emerald-500 text-white'
                }`}
              >
                {attendance.status === 'ON_BREAK' ? 'Resume Work' : 'Take Break'}
              </button>
            )
          ) : attendance.status === 'SCHEDULED' || attendance.status === 'OUTSIDE_GEOFENCE' ? (
            <button
              onClick={handleCheckIn}
              className="w-full py-3 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg"
            >
              <MapPin className="w-4 h-4" />
              Check-In (Office Geofence)
            </button>
          ) : (
            <button
              onClick={handleToggleBreak}
              className={`w-full py-2.5 rounded-xl font-semibold flex items-center justify-center gap-1.5 ${
                attendance.status === 'ON_BREAK'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gradient-to-r from-blue-500 to-emerald-500 text-white'
              }`}
            >
              {attendance.status === 'ON_BREAK' ? 'Resume Work' : 'Take Break'}
            </button>
          )}
        </div>

        {/* Quick Actions List */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold text-slate-500">Quick Actions</span>

          <button
            onClick={() => setShowLeave(true)}
            className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-left flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="font-semibold text-[11px] text-slate-900">Apply Leave</div>
                <div className="text-[9px] text-slate-500">Request Time Off</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={() => setShowRegularization(true)}
            className="bg-violet-50 p-3 rounded-xl border border-violet-100 text-left flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="font-semibold text-[11px] text-slate-900">Regularize</div>
                <div className="text-[9px] text-slate-500">Fix Missed Punch</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          {employee.workType === 'FIELD_WORK' && (
            <button
              onClick={() => setShowClientCheckIn(true)}
              className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-left flex items-center justify-between w-full"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-teal-500 flex items-center justify-center shrink-0">
                  <Briefcase className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-[11px] text-slate-900">Client Site Check-In</div>
                  <div className="text-[9px] text-slate-500">Location, selfie & visit details</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* Fixed Bottom Layout App Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.04)] flex items-center justify-around py-2.5 text-[9px] text-slate-400">
        <button className="flex flex-col items-center gap-0.5 text-blue-600">
          <Clock className="w-4 h-4" />
          Attendance
        </button>
        <button onClick={() => setShowLeave(true)} className="flex flex-col items-center gap-0.5 hover:text-slate-700">
          <Calendar className="w-4 h-4" />
          Leaves
        </button>
        <button onClick={() => setShowPayslip(true)} className="flex flex-col items-center gap-0.5 hover:text-slate-700">
          <Briefcase className="w-4 h-4" />
          Salary
        </button>
      </div>

      {/* Modals Containers */}
      {showPayslip && <PayslipViewer payrollItem={payrollItem} onClose={() => setShowPayslip(false)} />}
      {showLeave && <LeaveModule
          leaves={leaves}
          leaveBalance={leaveBalance || null}
          employeeId={employee.id}
          employeeName={employee.fullName}
          onApplyLeave={onApplyLeave}
          onClose={() => setShowLeave(false)}
        />}
      {showRegularization && (
        <RegularizationModal onApplyRegularization={onApplyRegularization} onClose={() => setShowRegularization(false)} />
      )}
      {showOfflineModal && (
        <OfflineQueueModal
          isOffline={isOffline}
          onToggleOffline={() => setIsOffline(!isOffline)}
          queuedEvents={offlineEvents}
          onSyncEvents={handleSyncOfflineEvents}
          onClose={() => setShowOfflineModal(false)}
        />
      )}
      {showClientCheckIn && (
        <ClientCheckInModal onSaved={onClientVisitSaved} onClose={() => setShowClientCheckIn(false)} />
      )}
    </div>
  );
}