import { useState } from 'react';
import { Employee } from '../../types';
import { X, UserX, UserCheck, ShieldAlert, AlertTriangle, Key, Building2, CheckCircle2 } from 'lucide-react';

interface DeactivateEmployeeModalProps {
  employee: Employee;
  onConfirm: (employeeId: string, newStatus: 'ACTIVE' | 'INACTIVE', reason?: string) => void;
  onClose: () => void;
}

export function DeactivateEmployeeModal({ employee, onConfirm, onClose }: DeactivateEmployeeModalProps) {
  const isCurrentlyInactive = employee.status === 'INACTIVE';
  const [reason, setReason] = useState('कंपनी छोड़ दी / इस्तीफा (Resigned / Left Company)');
  const [notes, setNotes] = useState('');

  const handleAction = () => {
    if (isCurrentlyInactive) {
      onConfirm(employee.id, 'ACTIVE');
    } else {
      const fullReason = notes.trim() ? `${reason} - ${notes.trim()}` : reason;
      onConfirm(employee.id, 'INACTIVE', fullReason);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col my-auto">
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${
          isCurrentlyInactive ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
              isCurrentlyInactive ? 'bg-emerald-600' : 'bg-rose-600'
            }`}>
              {isCurrentlyInactive ? <UserCheck className="w-5 h-5" /> : <UserX className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {isCurrentlyInactive ? 'कर्मचारी आईडी पुनः सक्रिय (Reactivate)' : 'कर्मचारी आईडी निष्क्रिय (Deactivate) करें'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isCurrentlyInactive ? 'App login will be restored' : 'App login will be immediately blocked'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Employee Info Card */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center gap-3">
            <img
              src={employee.avatar}
              alt={employee.fullName}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full border border-slate-300 object-cover"
            />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-slate-900 text-sm truncate">{employee.fullName}</div>
              <div className="text-[11px] text-slate-500 flex items-center gap-2">
                <span>{employee.designation}</span>
                <span>•</span>
                <span className="font-mono text-cyan-600">ID: {employee.loginId || employee.empId}</span>
              </div>
            </div>
          </div>

          {!isCurrentlyInactive ? (
            <>
              {/* Warning Notice */}
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-rose-800">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>आईडी निष्क्रिय होने पर क्या होगा?</span>
                </div>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-rose-700 leading-tight">
                  <li>कर्मचारी अपने मोबाइल ऐप में <strong>लॉगिन नहीं कर सकेगा</strong>।</li>
                  <li>सिस्टम में उसकी हाजिरी लगना तुरंत बंद हो जाएगी।</li>
                  <li>उसका पुराना सारा रिकॉर्ड (अटेंडेंस, पेरोल, हिस्ट्री) सुरक्षित रहेगा।</li>
                </ul>
              </div>

              {/* Reason Selector */}
              <div>
                <label className="block font-medium text-slate-700 mb-1 text-[11px]">
                  निष्क्रिय करने का कारण (Reason for Deactivation)
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-rose-500"
                >
                  <option value="कंपनी छोड़ दी / इस्तीफा (Resigned / Left Company)">
                    कंपनी छोड़ दी / इस्तीफा (Resigned / Left Company)
                  </option>
                  <option value="कार्यकाल समाप्त (Contract / Internship Ended)">
                    कार्यकाल समाप्त (Contract / Internship Ended)
                  </option>
                  <option value="सेवा समाप्ति (Terminated / Relieved)">
                    सेवा समाप्ति (Terminated / Relieved)
                  </option>
                  <option value="अनधिकृत अनुपस्थिति (Absconded)">
                    अनधिकृत अनुपस्थिति (Absconded)
                  </option>
                  <option value="अन्य कारण (Other)">
                    अन्य कारण (Other)
                  </option>
                </select>
              </div>

              {/* Additional notes */}
              <div>
                <label className="block font-medium text-slate-700 mb-1 text-[11px]">
                  अतिरिक्त विवरण या रिमार्क्स (Optional Notes)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="उदा. Relieving letter issued, Last working day: 25th September"
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>
            </>
          ) : (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>पुनः सक्रिय करने पर क्या होगा?</span>
              </div>
              <p className="text-[11px] text-emerald-700 leading-tight">
                कर्मचारी का खाता दोबारा <strong>ACTIVE</strong> हो जाएगा और वह अपने पूर्व क्रेडेंशियल (Login ID: <code>{employee.loginId}</code>) से मोबाइल ऐप में लॉगिन कर सकेगा।
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors"
          >
            रद्द करें (Cancel)
          </button>

          <button
            type="button"
            onClick={handleAction}
            className={`px-4 py-2 font-bold rounded-xl transition-transform active:scale-95 shadow-lg text-white flex items-center gap-1.5 ${
              isCurrentlyInactive
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
            }`}
          >
            {isCurrentlyInactive ? (
              <>
                <UserCheck className="w-4 h-4" />
                <span>आईडी पुनः सक्रिय करें (Reactivate)</span>
              </>
            ) : (
              <>
                <UserX className="w-4 h-4" />
                <span>आईडी डीएक्टिवेट करें (Deactivate & Block)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
