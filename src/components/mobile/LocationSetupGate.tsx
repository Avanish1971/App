import { useCallback, useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { MapPin, ShieldCheck, Settings, Loader2, CheckCircle2, Smartphone, BatteryCharging } from 'lucide-react';
import { openLocationSettings } from './useGeofenceTracking';

type Step = 'checking' | 'permission' | 'gps' | 'always' | 'ready';

const ALWAYS_ACK_KEY = 'loc_always_ack_v1';

// Location ki taiyari check karo: permission mili? phone ka GPS ON hai?
async function detectStep(): Promise<Step> {
  try {
    const perm = await Geolocation.checkPermissions();
    if (perm.location !== 'granted' && perm.coarseLocation !== 'granted') return 'permission';
  } catch {
    return 'permission';
  }
  try {
    await Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 8000, maximumAge: 120000 });
  } catch (e) {
    const msg = String((e as { message?: string })?.message || e).toLowerCase();
    if (msg.includes('disabled') || msg.includes('not enabled') || msg.includes('services')) return 'gps';
    if (msg.includes('denied') || msg.includes('permission') || msg.includes('authoriz')) return 'permission';
    // timeout waghera: GPS ON hai bas abhi fix nahi mila (indoor), rokna nahi hai
  }
  let acked = false;
  try {
    acked = localStorage.getItem(ALWAYS_ACK_KEY) === '1';
  } catch {
    // storage nahi
  }
  return acked ? 'ready' : 'always';
}

// App kholte hi (install ke baad pehli baar bhi): location permission aur GPS ON karwata hai.
// Jab tak location ready na ho, aage nahi jaane deta (taaki attendance sahi lage).
export function LocationSetupGate({ onReady }: { onReady: () => void }) {
  const [step, setStep] = useState<Step>('checking');
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  const recheck = useCallback(async () => {
    const s = await detectStep();
    setStep(s);
    if (s === 'ready') onReadyRef.current();
  }, []);

  useEffect(() => {
    recheck();
    // Settings se wapas aate hi dobara check
    const onVisible = () => {
      if (document.visibilityState === 'visible') recheck();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [recheck]);

  const askPermission = async () => {
    setBusy(true);
    setHint(null);
    try {
      const res = await Geolocation.requestPermissions();
      if (res.location !== 'granted' && res.coarseLocation !== 'granted') {
        setHint('Permission nahi mili. Neeche "Settings kholo" dabakar Permissions → Location → Allow karo.');
      }
    } catch (e) {
      const msg = String((e as { message?: string })?.message || e).toLowerCase();
      if (msg.includes('disabled') || msg.includes('services')) setStep('gps');
      else setHint('Permission nahi maangi ja saki. "Settings kholo" se allow karo.');
    } finally {
      setBusy(false);
      recheck();
    }
  };

  const confirmAlways = () => {
    try {
      localStorage.setItem(ALWAYS_ACK_KEY, '1');
    } catch {
      // storage nahi
    }
    onReadyRef.current();
  };

  const Card = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex items-center justify-center p-5">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 text-center">{children}</div>
    </div>
  );

  if (step === 'checking') {
    return (
      <Card>
        <Loader2 className="w-7 h-7 mx-auto text-indigo-500 animate-spin" />
        <div className="text-xs text-slate-500">Location check ho rahi hai…</div>
      </Card>
    );
  }

  if (step === 'permission') {
    return (
      <Card>
        <div className="w-16 h-16 mx-auto rounded-full bg-indigo-100 flex items-center justify-center">
          <MapPin className="w-8 h-8 text-indigo-600" />
        </div>
        <h2 className="font-extrabold text-slate-900 text-lg">Location Permission Chahiye</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Office aate hi aapki <strong>attendance apne aap</strong> lagane ke liye app ko aapki location chahiye. Aage jo popup aaye usme{' '}
          <strong>"Allow" / "While using the app"</strong> chuniye.
        </p>
        <button
          onClick={askPermission}
          disabled={busy}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
          Location Allow Karo
        </button>
        {hint && <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-left">{hint}</div>}
        <button onClick={() => openLocationSettings()} className="text-[11px] font-semibold text-indigo-600 underline flex items-center justify-center gap-1 mx-auto">
          <Settings className="w-3 h-3" /> Settings kholo
        </button>
      </Card>
    );
  }

  if (step === 'gps') {
    return (
      <Card>
        <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 flex items-center justify-center">
          <Smartphone className="w-8 h-8 text-amber-600" />
        </div>
        <h2 className="font-extrabold text-slate-900 text-lg">Phone ki Location (GPS) ON Karo</h2>
        <p className="text-xs text-slate-600 leading-relaxed text-left">
          Abhi aapke phone ki Location band hai, isliye office me aakar bhi attendance nahi lagegi.
          <br />
          <br />
          <strong>Kaise ON karein:</strong> phone ki screen ko upar se neeche kheenchiye aur <strong>Location</strong> ke icon ko dabaiye (ON/neela ho jaye). Phir yahan wapas aaiye.
        </p>
        <button onClick={recheck} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm">
          Maine ON kar diya, check karo
        </button>
      </Card>
    );
  }

  // step === 'always'
  return (
    <Card>
      <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
      </div>
      <h2 className="font-extrabold text-slate-900 text-lg">Aakhri Step: "Hamesha Allow" Karo</h2>
      <p className="text-xs text-slate-600 leading-relaxed text-left">
        App band ya screen lock hone par bhi attendance lagne ke liye location <strong>hamesha</strong> allow honi chahiye.
        <br />
        <br />
        1. Neeche <strong>Settings kholo</strong> dabaiye
        <br />
        2. <strong>Permissions → Location</strong> par jaiye
        <br />
        3. <strong>"Allow all the time"</strong> (Hamesha allow) chuniye
        <br />
        4. Wapas is app me aaiye
      </p>
      <button
        onClick={() => openLocationSettings()}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2"
      >
        <Settings className="w-4 h-4" /> Settings Kholo
      </button>
      <div className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-left flex gap-2">
        <BatteryCharging className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
        <span>Wahin <strong>Battery</strong> me jaakar app ko <strong>Unrestricted / No restrictions</strong> kar dijiye, warna phone app ko background me band kar dega.</span>
      </div>
      <button onClick={confirmAlways} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm">
        Ho gaya, aage badho
      </button>
    </Card>
  );
}

export const isNativeApp = () => Capacitor.isNativePlatform();
