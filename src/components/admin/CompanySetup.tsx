import { useRef, useState } from 'react';
import { Building2, ImagePlus, Trash2, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { saveCompanyApi, companyLogoUrl } from '../../lib/api';
import { compressLogo } from '../../lib/image';
import { useCompany, setCompanyCache } from '../../lib/useCompany';

// Company ka naam + logo: employee ke mobile app me (login screen aur home par) yehi dikhta hai
export function CompanySetup() {
  const { name: savedName, logoUrl: savedLogo } = useCompany();
  const [name, setName] = useState<string | null>(null); // null = abhi edit nahi kiya
  const [newLogo, setNewLogo] = useState<{ base64: string; mime: string; previewUrl: string } | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const shownName = name ?? savedName;
  const shownLogo = removeLogo ? null : newLogo ? newLogo.previewUrl : savedLogo;

  const pick = async (f: File | undefined) => {
    if (!f) return;
    setError(null);
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(f.type)) return setError('Logo PNG, JPG ya WEBP hona chahiye');
    try {
      setNewLogo(await compressLogo(f));
      setRemoveLogo(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Logo nahi khul paaya');
    }
  };

  const save = async () => {
    if (!shownName.trim()) return setError('Company ka naam likho');
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await saveCompanyApi({
        name: shownName.trim(),
        ...(newLogo ? { logoBase64: newLogo.base64, logoMime: newLogo.mime } : {}),
        ...(removeLogo ? { removeLogo: true } : {}),
      });
      setCompanyCache(updated);
      setNewLogo(null);
      setRemoveLogo(false);
      setName(null);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save nahi ho paaya');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-5">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <Building2 className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-base">Company Setup (कंपनी की जानकारी)</h3>
          <p className="text-xs text-slate-500">Yahan ka naam aur logo har employee ke mobile app me dikhega</p>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">Company ka naam *</label>
        <input
          type="text"
          value={shownName}
          maxLength={120}
          onChange={(e) => {
            setName(e.target.value);
            setSaved(false);
          }}
          placeholder="e.g. Sharma Enterprises Pvt Ltd"
          className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-2">Company Logo</label>
        <div className="flex items-center gap-4">
          <div className="w-28 h-28 rounded-2xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden">
            {shownLogo ? (
              <img src={shownLogo} alt="Logo" className="max-w-full max-h-full object-contain p-2" />
            ) : (
              <ImagePlus className="w-7 h-7 text-slate-300" />
            )}
          </div>
          <div className="space-y-2">
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} />
            <button onClick={() => fileRef.current?.click()} className="px-3.5 py-2 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl flex items-center gap-1.5">
              <ImagePlus className="w-3.5 h-3.5" /> {shownLogo ? 'Logo badlo' : 'Logo upload karo'}
            </button>
            {(savedLogo || newLogo) && !removeLogo && (
              <button
                onClick={() => {
                  setRemoveLogo(true);
                  setNewLogo(null);
                  setSaved(false);
                }}
                className="px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Logo hatao
              </button>
            )}
            <div className="text-[10px] text-slate-400">PNG / JPG, chaukor ya lamba logo, saaf background behtar</div>
          </div>
        </div>
      </div>

      {error && <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2.5">{error}</div>}
      {saved && (
        <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4" /> Save ho gaya. Ab employees ke app me yehi naam aur logo dikhega.
        </div>
      )}

      <button onClick={save} disabled={saving} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 disabled:opacity-60">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save karo
      </button>
    </div>
  );
}
