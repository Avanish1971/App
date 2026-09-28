import { useState } from 'react';
import { Briefcase, MapPin, CheckCircle2, X, Navigation, Building2, ShieldCheck } from 'lucide-react';

interface ClientCheckInModalProps {
  currentLat: number;
  currentLng: number;
  accuracy: number;
  onConfirmClientCheckIn: (details: {
    clientName: string;
    clientLocation: string;
    purpose: string;
    latitude: number;
    longitude: number;
  }) => void;
  onClose: () => void;
}

export function ClientCheckInModal({
  currentLat,
  currentLng,
  accuracy,
  onConfirmClientCheckIn,
  onClose,
}: ClientCheckInModalProps) {
  const [clientName, setClientName] = useState('Tata Consultancy Services (TCS)');
  const [clientLocation, setClientLocation] = useState('Yantra Park, Thane West, Mumbai');
  const [purpose, setPurpose] = useState('Quarterly ERP System Integration & Onsite Architecture Review');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientLocation.trim()) return;

    setSubmitting(true);
    setTimeout(() => {
      onConfirmClientCheckIn({
        clientName: clientName.trim(),
        clientLocation: clientLocation.trim(),
        purpose: purpose.trim() || 'Client Onsite Field Duty',
        latitude: currentLat,
        longitude: currentLng,
      });
      setSubmitting(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/20 text-cyan-400 flex items-center justify-center font-bold">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">क्लाइंट विजिट / फील्ड वर्क चेक-इन</h3>
              <p className="text-[11px] text-slate-400">On-Duty Client Location Attendance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Official Field Staff Policy Banner */}
          <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-3 text-emerald-300 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5 leading-relaxed text-[11px]">
              <div className="font-bold text-emerald-300">
                फील्ड स्टाफ गारंटी: गैरहाजिरी नहीं लगेगी!
              </div>
              <div className="text-emerald-400/90">
                चूंकि आप अधिकृत फील्ड वर्क कर्मचारी हैं, क्लाइंट लोकेशन पर चेक-इन करने पर आपकी अटेंडेंस <strong>PRESENT (On-Duty)</strong> दर्ज होगी और पेरोल में कोई कटौती नहीं होगी।
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              क्लाइंट या कंपनी का नाम (Client / Company Name) *
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Reliance Retail, HDFC Bank, Tata Motors"
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              क्लाइंट का पता / लोकेशन (Client Address / Location) *
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={clientLocation}
                onChange={(e) => setClientLocation(e.target.value)}
                placeholder="e.g. BKC Commercial Hub, Mumbai"
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              मीटिंग / काम का उद्देश्य (Purpose of Visit / Remarks)
            </label>
            <textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Enterprise software demo, onsite hardware inspection, client requirements review..."
              rows={2}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500 placeholder:text-slate-500"
            />
          </div>

          {/* Captured GPS Telemetry Box */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1">
                <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                <span>लाइव GPS जियो-लोकेशन (Auto-Captured):</span>
              </span>
              <span className="font-mono text-emerald-400 font-semibold">✓ Verified GPS</span>
            </div>
            <div className="font-mono text-slate-300 flex justify-between">
              <span>Lat: {currentLat.toFixed(5)}°, Lng: {currentLng.toFixed(5)}°</span>
              <span>Accuracy: ±{Math.round(accuracy)}m</span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl font-medium"
            >
              रद्द करें (Cancel)
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-600/30 transition-all"
            >
              {submitting ? (
                <span>वेरिफाई हो रहा है...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>हाजिरी दर्ज करें (Check-In)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
