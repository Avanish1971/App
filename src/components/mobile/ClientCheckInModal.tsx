import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import {
  Briefcase,
  MapPin,
  CheckCircle2,
  X,
  Navigation,
  Building2,
  ShieldCheck,
  User,
  Phone,
  Camera,
  Loader2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { AttendanceRecord } from '../../types';
import { submitClientVisitApi } from '../../lib/api';
import { compressImage } from '../../lib/image';

interface ClientCheckInModalProps {
  onSaved: (record: AttendanceRecord) => void;
  onClose: () => void;
}

interface Photo {
  base64: string;
  mime: string;
  previewUrl: string;
}

type GpsState =
  | { status: 'loading' }
  | { status: 'ok'; lat: number; lng: number; accuracy: number }
  | { status: 'error'; message: string };

const inputCls =
  'w-full pl-9 pr-3 py-2 bg-white border border-blue-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500';

function PhotoBox({
  title,
  hint,
  facing,
  photo,
  onPick,
}: {
  title: string;
  hint: string;
  facing: 'user' | 'environment';
  photo: Photo | null;
  onPick: (p: Photo) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="space-y-1">
      <input
        ref={ref}
        type="file"
        accept="image/*"
        capture={facing}
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (!f) return;
          setBusy(true);
          setErr(null);
          try {
            onPick(await compressImage(f));
          } catch (ex) {
            setErr(ex instanceof Error ? ex.message : 'Photo nahi ban paayi');
          } finally {
            setBusy(false);
          }
        }}
      />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="relative w-full aspect-[4/3] rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/50 overflow-hidden flex flex-col items-center justify-center gap-1 text-blue-600 hover:bg-blue-50"
      >
        {photo ? (
          <>
            <img src={photo.previewUrl} alt={title} className="absolute inset-0 w-full h-full object-cover" />
            <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Dobara lo
            </span>
          </>
        ) : busy ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <Camera className="w-6 h-6" />
            <span className="text-[11px] font-semibold">{title}</span>
            <span className="text-[9px] text-slate-500 px-2 text-center">{hint}</span>
          </>
        )}
      </button>
      {err && <div className="text-[10px] text-rose-600">{err}</div>}
    </div>
  );
}

// Field work wale employee ka client visit: live location + selfie + jagah ki photo + wajah + client info
export function ClientCheckInModal({ onSaved, onClose }: ClientCheckInModalProps) {
  const [clientName, setClientName] = useState('');
  const [clientLocation, setClientLocation] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [purpose, setPurpose] = useState('');
  const [selfie, setSelfie] = useState<Photo | null>(null);
  const [sitePhoto, setSitePhoto] = useState<Photo | null>(null);
  const [gps, setGps] = useState<GpsState>({ status: 'loading' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Abhi ki live location lo (modal khulte hi)
  const locate = async () => {
    setGps({ status: 'loading' });
    try {
      if (Capacitor.isNativePlatform()) {
        const perm = await Geolocation.requestPermissions();
        if (perm.location !== 'granted' && perm.coarseLocation !== 'granted') {
          setGps({ status: 'error', message: 'Location ki permission nahi mili. Phone settings me allow karo.' });
          return;
        }
      }
      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
      setGps({ status: 'ok', lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy || 0 });
    } catch (err) {
      setGps({ status: 'error', message: err instanceof Error ? err.message : 'Location nahi mil paayi. GPS on karo.' });
    }
  };

  useEffect(() => {
    locate();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (gps.status !== 'ok') {
      setError('Live location abhi nahi mili. GPS on karke "Dobara try karo" dabao.');
      return;
    }
    if (!clientName.trim() || !clientLocation.trim()) return setError('Client ka naam aur jagah (address) likho');
    if (!purpose.trim()) return setError('Kyu gaye the, wajah likho');
    if (!selfie) return setError('Apni selfie lo');
    if (!sitePhoto) return setError('Jis jagah gaye ho uski photo lo');

    setError(null);
    setSubmitting(true);
    try {
      const { record } = await submitClientVisitApi({
        clientName: clientName.trim(),
        clientLocation: clientLocation.trim(),
        contactPerson: contactPerson.trim(),
        contactPhone: contactPhone.trim(),
        purpose: purpose.trim(),
        latitude: gps.lat,
        longitude: gps.lng,
        accuracy: gps.accuracy,
        selfieBase64: selfie.base64,
        selfieMime: selfie.mime,
        sitePhotoBase64: sitePhoto.base64,
        sitePhotoMime: sitePhoto.mime,
      });
      onSaved(record);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Visit save nahi ho paaya');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/30 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col my-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-500 via-teal-500 to-emerald-500">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-white/25 text-white flex items-center justify-center font-bold">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">क्लाइंट विजिट / फील्ड वर्क चेक-इन</h3>
              <p className="text-[11px] text-blue-50">Location, selfie, photo aur client ki jaankari</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/20">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-700 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              Field staff ki attendance <strong>PRESENT (On-Duty)</strong> lagegi. Admin ko aapki live location, selfie aur visit ki saari details dikhengi.
            </div>
          </div>

          {/* Live GPS */}
          <div
            className={`p-3 rounded-xl border text-[11px] space-y-1 ${
              gps.status === 'ok' ? 'bg-blue-50 border-blue-100' : gps.status === 'error' ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 font-semibold text-slate-700">
                <Navigation className="w-3.5 h-3.5 text-blue-600" /> Aapki Live Location
              </span>
              {gps.status === 'ok' && <span className="font-mono text-emerald-600 font-semibold">✓ GPS mil gaya</span>}
              {gps.status === 'loading' && (
                <span className="flex items-center gap-1 text-slate-500">
                  <Loader2 className="w-3 h-3 animate-spin" /> Dhundh raha hai…
                </span>
              )}
            </div>
            {gps.status === 'ok' && (
              <div className="font-mono text-slate-700 flex justify-between">
                <span>
                  {gps.lat.toFixed(5)}°, {gps.lng.toFixed(5)}°
                </span>
                <span>±{Math.round(gps.accuracy)}m</span>
              </div>
            )}
            {gps.status === 'error' && (
              <div className="flex items-start justify-between gap-2 text-rose-700">
                <span>{gps.message}</span>
                <button type="button" onClick={locate} className="shrink-0 font-bold underline">
                  Dobara try karo
                </button>
              </div>
            )}
          </div>

          {/* Client info */}
          <div>
            <label className="block text-slate-700 font-medium mb-1">क्लाइंट / कंपनी का नाम *</label>
            <div className="relative">
              <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" />
              <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="e.g. Reliance Retail" className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">कहाँ गए हो — पता / जगह *</label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" />
              <input type="text" value={clientLocation} onChange={(e) => setClientLocation(e.target.value)} placeholder="e.g. BKC, Mumbai" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Client se kisse mile</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" />
                <input type="text" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Naam" className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Unka phone</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" />
                <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="98xxxxxx" className={inputCls} />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">क्यों गए थे — वजह *</label>
            <textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Naye order ki meeting, payment collection, site inspection..."
              rows={3}
              className="w-full bg-white border border-blue-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
            />
          </div>

          {/* Photos */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-slate-700 font-medium mb-1">आपकी Selfie *</div>
              <PhotoBox title="Selfie lo" hint="Apna chehra dikhao" facing="user" photo={selfie} onPick={setSelfie} />
            </div>
            <div>
              <div className="text-slate-700 font-medium mb-1">जगह की Photo *</div>
              <PhotoBox title="Photo lo" hint="Jahan gaye ho wahan ki" facing="environment" photo={sitePhoto} onPick={setSitePhoto} />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-[11px]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-1 flex gap-2">
            <button type="button" onClick={onClose} disabled={submitting} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium disabled:opacity-50">
              रद्द करें
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 via-teal-500 to-emerald-500 hover:opacity-90 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-teal-500/30 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Bhej raha hai…</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>हाजिरी दर्ज करें</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
