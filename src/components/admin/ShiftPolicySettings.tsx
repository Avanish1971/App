import { useState } from 'react';
import { AttendancePolicy, Shift } from '../../types';
import { Sliders, Shield, Clock, CheckCircle2, Save, AlertCircle } from 'lucide-react';

interface ShiftPolicySettingsProps {
  policy: AttendancePolicy;
  shifts: Shift[];
  onSavePolicy: (newPolicy: AttendancePolicy) => void;
}

export function ShiftPolicySettings({ policy, shifts, onSavePolicy }: ShiftPolicySettingsProps) {
  const [formData, setFormData] = useState<AttendancePolicy>(policy);
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSavePolicy(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl p-5 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Attendance & Geofence Policy Engine</h3>
          <p className="text-xs text-slate-500">
            Configure data-driven rules for automatic check-in, exit grace windows, and fraud protection
          </p>
        </div>

        <button
          onClick={handleSubmit}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition-all"
        >
          {saved ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" /> : <Save className="w-3.5 h-3.5" />}
          <span>{saved ? 'Policy Saved & Deployed' : 'Save & Deploy Policy'}</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* Geofence & Location Thresholds */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 text-indigo-600 font-bold uppercase tracking-wider text-[11px]">
            <Sliders className="w-4 h-4" />
            <span>Geofence & GPS Accuracy Boundaries</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between font-medium text-slate-700">
              <label>Default Geofence Radius</label>
              <span className="font-mono text-indigo-600">{formData.geofenceRadiusMeters} meters</span>
            </div>
            <input
              type="range"
              min="50"
              max="300"
              step="10"
              value={formData.geofenceRadiusMeters}
              onChange={(e) => setFormData({ ...formData, geofenceRadiusMeters: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <p className="text-[10px] text-slate-500">
              Maximum allowable circular distance from office centroid to trigger auto check-in.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between font-medium text-slate-700">
              <label>Maximum Allowed GPS Accuracy Jitter</label>
              <span className="font-mono text-indigo-600">±{formData.gpsAccuracyMaxMeters} meters</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              step="5"
              value={formData.gpsAccuracyMaxMeters}
              onChange={(e) => setFormData({ ...formData, gpsAccuracyMaxMeters: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <p className="text-[10px] text-slate-500">
              Rejects inaccurate cell-tower triangulation where GPS accuracy exceeds this value.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-900">Anti-Mock GPS / Fake App Detection</div>
              <div className="text-[10px] text-slate-500">Flag mock locations and fake GPS tools</div>
            </div>
            <input
              type="checkbox"
              checked={formData.requireMockLocationCheck}
              onChange={(e) => setFormData({ ...formData, requireMockLocationCheck: e.target.checked })}
              className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Timing, Exit Grace & Shift Cutoffs */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 text-cyan-600 font-bold uppercase tracking-wider text-[11px]">
            <Clock className="w-4 h-4" />
            <span>Shift Grace Periods & Exit Rules</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between font-medium text-slate-700">
              <label>Exit Grace Window (Prevents False Absences)</label>
              <span className="font-mono text-cyan-600">{formData.exitGracePeriodMinutes} minutes</span>
            </div>
            <input
              type="range"
              min="5"
              max="30"
              step="5"
              value={formData.exitGracePeriodMinutes}
              onChange={(e) => setFormData({ ...formData, exitGracePeriodMinutes: Number(e.target.value) })}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <p className="text-[10px] text-slate-500">
              When an employee leaves the geofence, system waits this buffer period before finalizing checkout.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Morning Grace Period</label>
              <input
                type="number"
                value={formData.gracePeriodForLateMinutes}
                onChange={(e) => setFormData({ ...formData, gracePeriodForLateMinutes: Number(e.target.value) })}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 font-mono"
              />
              <span className="text-[10px] text-slate-500">Mins past shift start</span>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Late Mark Threshold</label>
              <input
                type="number"
                value={formData.lateMarkThresholdMinutes}
                onChange={(e) => setFormData({ ...formData, lateMarkThresholdMinutes: Number(e.target.value) })}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 font-mono"
              />
              <span className="text-[10px] text-slate-500">Triggers late mark</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-900">Offline Mode Attendance Queue</div>
              <div className="text-[10px] text-slate-500">Allow local storage queue in basements</div>
            </div>
            <input
              type="checkbox"
              checked={formData.allowOfflineAttendance}
              onChange={(e) => setFormData({ ...formData, allowOfflineAttendance: e.target.checked })}
              className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
            />
          </div>
        </div>
      </form>
    </div>
  );
}
