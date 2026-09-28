import { useState } from 'react';
import {
  ShieldCheck,
  MapPin,
  Clock,
  IndianRupee,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Printer,
  Sparkles,
  TrendingUp,
  Building2,
  Users,
  Lock,
} from 'lucide-react';
import { formatINR } from '../../utils/payroll';

interface CustomerBrochureProps {
  onLaunchDemo: (view: 'admin' | 'mobile') => void;
}

export function CustomerBrochure({ onLaunchDemo }: CustomerBrochureProps) {
  const [lang, setLang] = useState<'en' | 'hi'>('hi');
  const [empCount, setEmpCount] = useState<number>(65);
  const [avgSalary, setAvgSalary] = useState<number>(32000);

  // ROI calculations
  const monthlySalaryLeakageWithoutGeofence = Math.round(empCount * avgSalary * 0.035);
  const biometricHardwareSavingsOneTime = Math.ceil(empCount / 35) * 16000;
  const annualBiometricAMCSavings = Math.ceil(empCount / 35) * 4500;
  const totalAnnualSavings = monthlySalaryLeakageWithoutGeofence * 12 + annualBiometricAMCSavings;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 font-sans">
      {/* Top Action Bar / Language Switcher */}
      <div className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
            G
          </div>
          <div>
            <span className="font-bold text-white tracking-tight">GeoAttend HRMS™</span>
            <span className="text-xs text-slate-400 ml-2 hidden sm:inline">
              Enterprise Client Presentation Console
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700 text-xs">
            <button
              onClick={() => setLang('hi')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${lang === 'hi' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'}`}
            >
              हिंदी (Hindi)
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${lang === 'en' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'}`}
            >
              English
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'प्रिंट / PDF' : 'Print / Export PDF'}</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-12 text-xs">
        {/* Hero Section */}
        <div className="relative rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-6 sm:p-10 overflow-hidden shadow-2xl">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>{lang === 'hi' ? '100% सुरक्षित जियोफेंसिंग अटेंडेंस' : '100% Secured Geo-Fenced Workforce Platform'}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
                {lang === 'hi' ? 'स्मार्ट जियोफेंस हाजिरी और स्वचालित भारतीय पेरोल इंजन' : 'Smart Geo-Fenced Attendance & Automated Indian Payroll'}
              </h1>

              <p className="text-slate-300 text-sm leading-relaxed">
                {lang === 'hi'
                  ? 'यह सिस्टम कर्मचारियों के कार्यालय परिसर में प्रवेश करते ही बिना छुए ऑटो-हाजिरी दर्ज करता है। यह नकली GPS एप्लीकेशन को ब्लॉक करता है और सीधे भारतीय श्रम कानूनों के तहत PF और ESIC की गणना करता है।'
                  : 'Zero-touch geofenced check-in as employees enter authorized office perimeters. Complete anti-fraud location verification and automated payroll.'}
              </p>
            </div>

            {/* Visual Feature Info */}
            <div className="lg:col-span-5">
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                  <span className="text-xs font-bold text-white uppercase">{lang === 'hi' ? 'सुरक्षा ऑडिट' : 'Security Live Check'}</span>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
                    GPS PASSED
                  </span>
                </div>
                <div className="space-y-2 text-slate-300 text-[11px]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{lang === 'hi' ? 'एंटी-फैक GPS शील्ड एक्टिव' : 'Anti-Mock GPS App Shield Blocked'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{lang === 'hi' ? '10-मिनट एक्जिट ग्रेस एक्टिव' : '10-minute Exit Grace Enabled'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ROI Calculator */}
        <div className="rounded-2xl border border-indigo-900/60 bg-gradient-to-br from-slate-900 to-indigo-950/40 p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">{lang === 'hi' ? 'कंपनी की मासिक बचत गणना' : 'Projected Enterprise Savings'}</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-5 bg-slate-900/80 p-5 rounded-xl border border-slate-800">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">{lang === 'hi' ? 'कुल कर्मचारी संख्या:' : 'Total Employee Headcount:'}</span>
                  <span className="font-mono text-indigo-400 font-bold">{empCount} Staff</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="500"
                  step="5"
                  value={empCount}
                  onChange={(e) => setEmpCount(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">{lang === 'hi' ? 'औसत मासिक वेतन:' : 'Average Monthly Salary:'}</span>
                  <span className="font-mono text-indigo-400 font-bold">{formatINR(avgSalary)}</span>
                </div>
                <input
                  type="range"
                  min="15000"
                  max="120000"
                  step="2000"
                  value={avgSalary}
                  onChange={(e) => setAvgSalary(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="bg-slate-900/90 border border-indigo-800/40 rounded-xl p-5 flex flex-col justify-center space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase">{lang === 'hi' ? 'अनुमानित वार्षिक शुद्ध बचत:' : 'Projected Annual Net Savings'}</div>
              <div className="text-2xl font-extrabold text-emerald-400 font-mono">
                {formatINR(totalAnnualSavings)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}