import { useState } from 'react';
import { Office, Employee, AttendanceRecord } from '../../types';
import { calculateDistanceMeters, formatDistance } from '../../utils/geo';
import { MapPin, Navigation, Shield, Users, Sliders, CheckCircle2 } from 'lucide-react';

interface GeofenceMapProps {
  offices: Office[];
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  onUpdateOfficeRadius: (officeId: string, newRadius: number) => void;
}

export function GeofenceMap({
  offices,
  employees,
  attendanceRecords,
  onUpdateOfficeRadius,
}: GeofenceMapProps) {
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>(offices && offices.length > 0 ? offices[0].id : '');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  const activeOffice = offices.find((o) => o.id === selectedOfficeId) || offices[0];
  const officeEmployees = employees.filter((e) => e.officeId === activeOffice.id);

  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId);
  const selectedEmployeeAttendance = attendanceRecords.find(
    (a) => a.employeeId === selectedEmployeeId
  );

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl">
      {/* Top Map Toolbar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Navigation className="w-4 h-4 text-indigo-600" />
            <span>Multi-Branch Geofence Command Center</span>
          </h3>
          <p className="text-xs text-slate-500">
            Real-time visual monitoring of authorized boundaries and live employee presence
          </p>
        </div>

        {/* Office Switcher Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
          {offices.map((off) => (
            <button
              key={off.id}
              onClick={() => {
                setSelectedOfficeId(off.id);
                setSelectedEmployeeId(null);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                selectedOfficeId === off.id
                  ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {off.name} ({off.city})
            </button>
          ))}
        </div>
      </div>

      {/* Main Map Viewport & Details Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[480px]">
        {/* Interactive SVG Radar Map Viewport (8 Cols) */}
        <div className="lg:col-span-8 bg-slate-50 relative p-6 flex flex-col items-center justify-center overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-200">
          {/* Map Grid Pattern Background */}
          <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:24px_24px]" />

          {/* Radar Waves / Map Circles */}
          <div className="relative w-[340px] sm:w-[420px] h-[340px] sm:h-[420px] flex items-center justify-center">
            {/* Outer Geofence Ring */}
            <div
              className="absolute rounded-full border-2 border-dashed border-indigo-300 bg-indigo-500/10 flex items-center justify-center transition-all duration-300"
              style={{
                width: `${Math.min(380, activeOffice.radiusMeters * 3)}px`,
                height: `${Math.min(380, activeOffice.radiusMeters * 3)}px`,
              }}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-mono px-2 py-0.5 rounded-full shadow-md whitespace-nowrap">
                Geofence Radius: {activeOffice.radiusMeters}m
              </div>
            </div>

            {/* Concentric distance markers */}
            <div className="absolute w-56 h-56 rounded-full border border-slate-200 pointer-events-none" />
            <div className="absolute w-28 h-28 rounded-full border border-slate-100 pointer-events-none" />

            {/* Office Center Pin */}
            <div className="relative z-20 flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-indigo-600 border-4 border-slate-100 flex items-center justify-center shadow-lg shadow-indigo-600/40 text-white">
                <MapPin className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 shadow mt-1 whitespace-nowrap">
                {activeOffice.name}
              </span>
              <span className="text-[9px] text-slate-500 font-mono">
                {activeOffice.latitude.toFixed(4)}°N, {activeOffice.longitude.toFixed(4)}°E
              </span>
            </div>

            {/* Plotted Employee Markers */}
            {officeEmployees.map((emp, idx) => {
              const att = attendanceRecords.find((a) => a.employeeId === emp.id);
              const isPresent = att?.status === 'PRESENT';
              const isOnBreak = att?.status === 'ON_BREAK';
              const isWFH = att?.status === 'WFH';
              const dist = calculateDistanceMeters(
                emp.currentLat,
                emp.currentLng,
                activeOffice.latitude,
                activeOffice.longitude
              );

              // Pseudo scatter coordinates relative to center for clean visual layout
              const angle = (idx * (360 / Math.max(1, officeEmployees.length)) * Math.PI) / 180;
              const radiusScaled = Math.min(160, Math.max(45, (dist / activeOffice.radiusMeters) * 110));
              const xPos = Math.cos(angle) * radiusScaled;
              const yPos = Math.sin(angle) * radiusScaled;

              return (
                <button
                  key={emp.id}
                  onClick={() => setSelectedEmployeeId(emp.id)}
                  style={{ transform: `translate(${xPos}px, ${yPos}px)` }}
                  className={`absolute z-30 group p-1 rounded-full transition-transform hover:scale-125 focus:outline-none ${
                    selectedEmployeeId === emp.id ? 'ring-2 ring-blue-500 scale-125' : ''
                  }`}
                  title={`${emp.fullName} - ${att?.status || 'SCHEDULED'}`}
                >
                  <div className="relative">
                    <img
                      src={emp.avatar}
                      alt={emp.fullName}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-full border-2 border-slate-100 object-cover shadow-md"
                    />
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-slate-100 ${
                        isPresent
                          ? 'bg-emerald-400'
                          : isOnBreak
                          ? 'bg-amber-400'
                          : isWFH
                          ? 'bg-cyan-400'
                          : 'bg-rose-400'
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Map Legend */}
          <div className="absolute bottom-3 left-4 right-4 flex flex-wrap items-center justify-between text-[11px] text-slate-500 bg-slate-50 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Present Inside (Verified)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> On Break
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400" /> WFH / Field
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-400" /> Absent
              </span>
            </div>
            <span className="text-[10px] text-slate-500 hidden sm:inline">
              Click any employee avatar to inspect live telemetry
            </span>
          </div>
        </div>

        {/* Right Inspector & Policy Controls Panel (4 Cols) */}
        <div className="lg:col-span-4 p-5 bg-slate-50 flex flex-col justify-between space-y-4 text-xs">
          <div className="space-y-4">
            {/* Office Profile */}
            <div className="border-b border-slate-200 pb-3">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Office Details</span>
              <h4 className="text-base font-bold text-slate-900 mt-0.5">{activeOffice.name}</h4>
              <p className="text-slate-500 text-[11px] mt-1">{activeOffice.address}</p>
            </div>

            {/* Geofence Radius Slider */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-slate-700">
                <span className="font-semibold flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Adjust Geofence Radius</span>
                </span>
                <span className="font-mono text-indigo-600 font-bold">{activeOffice.radiusMeters} meters</span>
              </div>
              <input
                type="range"
                min="50"
                max="300"
                step="10"
                value={activeOffice.radiusMeters}
                onChange={(e) => onUpdateOfficeRadius(activeOffice.id, Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>50m (Tight)</span>
                <span>100m (Standard)</span>
                <span>200m</span>
                <span>300m (Campus)</span>
              </div>
            </div>

            {/* Employee Inspector Card */}
            {selectedEmployee ? (
              <div className="bg-slate-50 border border-slate-300 rounded-xl p-3.5 space-y-2.5 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-300 pb-2">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase">Selected Staff Telemetry</span>
                  <span className="text-[10px] text-slate-500 font-mono">ID: {selectedEmployee.empId}</span>
                </div>

                <div className="flex items-center gap-3">
                  <img
                    src={selectedEmployee.avatar}
                    alt={selectedEmployee.fullName}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full border border-slate-300 object-cover"
                  />
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{selectedEmployee.fullName}</div>
                    <div className="text-[11px] text-slate-500">
                      {selectedEmployee.department} · {selectedEmployee.designation}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-slate-500">Attendance Status:</span>
                    <div className="font-bold text-emerald-600 mt-0.5">
                      {selectedEmployeeAttendance?.status || 'SCHEDULED'}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">Check-in Time:</span>
                    <div className="font-mono text-slate-900 mt-0.5">
                      {selectedEmployeeAttendance?.checkInTime || '--:--'}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">Distance to Centroid:</span>
                    <div className="font-mono text-cyan-600 mt-0.5">
                      {Math.round(
                        calculateDistanceMeters(
                          selectedEmployee.currentLat,
                          selectedEmployee.currentLng,
                          activeOffice.latitude,
                          activeOffice.longitude
                        )
                      )}
                      m
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">GPS Accuracy:</span>
                    <div className="font-mono text-slate-800 mt-0.5">±{selectedEmployee.accuracyMeters}m</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center text-slate-500 text-[11px]">
                Click an employee marker on the radar to inspect live location, shift time, and telemetry accuracy.
              </div>
            )}
          </div>

          {/* Quick Stats Footer */}
          <div className="border-t border-slate-200 pt-3 flex justify-between text-[11px] text-slate-500">
            <span>Active Staff Assigned:</span>
            <span className="font-mono text-slate-900 font-semibold">{officeEmployees.length} Members</span>
          </div>
        </div>
      </div>
    </div>
  );
}
