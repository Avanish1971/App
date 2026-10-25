import {
  Navigation,
  MapPin,
  Users,
  FileCheck,
  Sliders,
  Shield,
  UserPlus,
  CalendarDays,
  UserSearch,
  MessageSquare,
  Route,
  X,
} from 'lucide-react';

export type AdminTab =
  | 'map'
  | 'locations'
  | 'roster'
  | 'monthly'
  | 'employees'
  | 'messages'
  | 'visits'
  | 'approvals'
  | 'policy'
  | 'audit';

interface AdminSidebarProps {
  activeTab: AdminTab;
  onChange: (tab: AdminTab) => void;
  onAddEmployee: () => void;
  pendingApprovalsCount: number;
  // Mobile par sidebar drawer ki tarah khulta hai
  open: boolean;
  onClose: () => void;
}

const NAV_GROUPS: { title: string; items: { id: AdminTab; label: string; icon: typeof Users }[] }[] = [
  {
    title: 'Employees',
    items: [
      { id: 'employees', label: 'Employee Details', icon: UserSearch },
      { id: 'monthly', label: 'Monthly Attendance', icon: CalendarDays },
      { id: 'messages', label: 'Messages', icon: MessageSquare },
      { id: 'roster', label: 'Daily Attendance Roster', icon: Users },
    ],
  },
  {
    title: 'Operations',
    items: [
      { id: 'map', label: 'Live Geofence Radar', icon: Navigation },
      { id: 'visits', label: 'Field Visits', icon: Route },
      { id: 'locations', label: 'Office Locations', icon: MapPin },
      { id: 'approvals', label: 'Approval Center', icon: FileCheck },
    ],
  },
  {
    title: 'Settings',
    items: [
      { id: 'policy', label: 'Policy & Shift Engine', icon: Sliders },
      { id: 'audit', label: 'Audit Logs', icon: Shield },
    ],
  },
];

export function AdminSidebar({
  activeTab,
  onChange,
  onAddEmployee,
  pendingApprovalsCount,
  open,
  onClose,
}: AdminSidebarProps) {
  const content = (
    <nav className="h-full flex flex-col gap-5 p-4 overflow-y-auto">
      {/* Add New Employee */}
      <button
        onClick={() => {
          onAddEmployee();
          onClose();
        }}
        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md shadow-indigo-600/30 transition-all"
      >
        <UserPlus className="w-4 h-4" />
        <span>Add New Employee</span>
      </button>

      {NAV_GROUPS.map((group) => (
        <div key={group.title} className="space-y-1">
          <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {group.title}
          </div>
          {group.items.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => {
                  onChange(id);
                  onClose();
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-colors ${
                  active
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="flex-1">{label}</span>
                {id === 'approvals' && pendingApprovalsCount > 0 && (
                  <span className="px-1.5 bg-indigo-600 text-white font-mono text-[10px] rounded-full">
                    {pendingApprovalsCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Desktop: header ke neeche fixed left sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-16 self-start h-[calc(100vh-4rem)] bg-white border-r border-slate-200">
        {content}
      </aside>

      {/* Mobile: drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-[60] flex">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
          <aside className="relative w-72 max-w-[85%] h-full bg-white shadow-2xl">
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="pt-8 h-full">{content}</div>
          </aside>
        </div>
      )}
    </>
  );
}
