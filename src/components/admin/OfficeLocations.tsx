import { useState } from 'react';
import { Office, Employee } from '../../types';
import { OfficeInput } from '../../lib/api';
import { MapPin, Plus, Pencil, Trash2, ExternalLink, X, Save, Users, Navigation, Info } from 'lucide-react';

interface OfficeLocationsProps {
  offices: Office[];
  employees: Employee[];
  onAddOffice: (data: OfficeInput) => Promise<void>;
  onUpdateOffice: (id: string, data: OfficeInput) => Promise<void>;
  onDeleteOffice: (id: string) => Promise<void>;
}

interface FormState {
  name: string;
  city: string;
  address: string;
  latitude: string;
  longitude: string;
  radiusMeters: number;
  workingHours: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  city: '',
  address: '',
  latitude: '',
  longitude: '',
  radiusMeters: 100,
  workingHours: '10:00 AM – 06:00 PM',
};

// Google Maps se copy kiya hua "19.0657, 72.8687" ya poora Maps link, dono chalenge
function parseCoordinates(text: string): { lat: number; lng: number } | null {
  const fromUrl = text.match(/!3d(-?\d{1,3}\.\d+)!4d(-?\d{1,3}\.\d+)/);
  const plain = text.match(/(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/);
  const m = fromUrl || plain;
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

const inputCls =
  'w-full bg-white border border-blue-200 rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500 placeholder:text-slate-400';
const labelCls = 'block text-[11px] font-semibold text-slate-700 mb-1';

export function OfficeLocations({ offices, employees, onAddOffice, onUpdateOffice, onDeleteOffice }: OfficeLocationsProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [pasteText, setPasteText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setPasteText('');
    setError(null);
    setNote(null);
    setShowForm(true);
  };

  const openEdit = (o: Office) => {
    setEditingId(o.id);
    setForm({
      name: o.name,
      city: o.city || '',
      address: o.address || '',
      latitude: String(o.latitude),
      longitude: String(o.longitude),
      radiusMeters: o.radiusMeters,
      workingHours: o.workingHours || '',
    });
    setPasteText('');
    setError(null);
    setNote(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setError(null);
    setNote(null);
  };

  const applyPaste = (text: string) => {
    setPasteText(text);
    const c = parseCoordinates(text);
    if (c) {
      setForm((f) => ({ ...f, latitude: String(c.lat), longitude: String(c.lng) }));
      setNote('Coordinates mil gaye ✓');
      setError(null);
    } else if (text.trim()) {
      setNote(null);
    }
  };

  const useMyLocation = () => {
    setError(null);
    setNote(null);
    if (!navigator.geolocation) {
      setError('Is browser me location available nahi hai. Google Maps se coordinates paste karo.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setNote(`Aapki current location li gayi (±${Math.round(pos.coords.accuracy)}m) ✓`);
      },
      () => {
        setError('Browser ne location nahi di (http website par aksar block hoti hai). Neeche Google Maps se coordinates paste karo.');
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const submit = async () => {
    setError(null);
    const lat = Number(form.latitude);
    const lng = Number(form.longitude);
    if (!form.name.trim()) return setError('Office ka naam likho');
    if (form.latitude.trim() === '' || !Number.isFinite(lat) || Math.abs(lat) > 90) return setError('Latitude sahi daalo (jaise 19.0657)');
    if (form.longitude.trim() === '' || !Number.isFinite(lng) || Math.abs(lng) > 180) return setError('Longitude sahi daalo (jaise 72.8687)');

    const payload: OfficeInput = {
      name: form.name.trim(),
      city: form.city.trim(),
      address: form.address.trim(),
      latitude: lat,
      longitude: lng,
      radiusMeters: form.radiusMeters,
      workingHours: form.workingHours.trim(),
    };
    setBusy(true);
    try {
      if (editingId) await onUpdateOffice(editingId, payload);
      else await onAddOffice(payload);
      closeForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save nahi ho paaya');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (o: Office) => {
    if (!window.confirm(`"${o.name}" delete karna hai?`)) return;
    try {
      await onDeleteOffice(o.id);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Delete nahi ho paaya');
    }
  };

  const mapsLink = (lat: number | string, lng: number | string) => `https://www.google.com/maps?q=${lat},${lng}`;
  const formHasPoint = Number.isFinite(Number(form.latitude)) && Number.isFinite(Number(form.longitude)) && form.latitude !== '' && form.longitude !== '';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>Office Locations (Geofence Setup)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Apne office ki location aur radius yahan set karo.</p>
          </div>
          <button
            onClick={openAdd}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-emerald-500 hover:opacity-90 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Office Location</span>
          </button>
        </div>
        <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 text-[11px] text-slate-600 flex gap-2">
          <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div>Employee ke phone me app khuli ho aur wo office ke radius me aaye, to attendance apne aap <b className="text-emerald-700">PRESENT</b> ho jati hai.</div>
            <div>Radius ke bahar grace time se zyada rahe to <b className="text-rose-600">ABSENT</b> ho jati hai (grace time "Policy &amp; Shift Engine" me set hota hai).</div>
          </div>
        </div>
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <div className="bg-white border border-blue-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 text-sm">{editingId ? 'Office Edit Karo' : 'Naya Office Add Karo'}</h4>
            <button onClick={closeForm} className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100">
              <X className="w-4 h-4" />
            </button>
          </div>

          {error && <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">{error}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Office ka naam *</label>
              <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jaise: Nashik Head Office" />
            </div>
            <div>
              <label className={labelCls}>City</label>
              <input className={inputCls} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Nashik" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Address</label>
              <input className={inputCls} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Poora address" />
            </div>
          </div>

          {/* Location */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 space-y-3">
            <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Office ki location</div>

            <div>
              <label className={labelCls}>Google Maps se paste karo (sabse aasan)</label>
              <input
                className={inputCls}
                value={pasteText}
                onChange={(e) => applyPaste(e.target.value)}
                placeholder="19.0657, 72.8687   ya   Google Maps ka link"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Google Maps me office par right-click karo, sabse upar likhe numbers par click karke copy karo, yahan paste kar do.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Latitude *</label>
                <input className={`${inputCls} font-mono`} value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="19.065700" />
              </div>
              <div>
                <label className={labelCls}>Longitude *</label>
                <input className={`${inputCls} font-mono`} value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="72.868700" />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={useMyLocation}
                className="px-3 py-1.5 bg-white border border-blue-200 text-blue-700 hover:bg-blue-100 text-[11px] font-semibold rounded-lg flex items-center gap-1.5"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Meri current location use karo</span>
              </button>
              {formHasPoint && (
                <a
                  href={mapsLink(form.latitude, form.longitude)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-[11px] font-semibold rounded-lg flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Map par check karo</span>
                </a>
              )}
              {note && <span className="text-[11px] text-emerald-700 font-medium">{note}</span>}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className={labelCls + ' mb-0'}>Geofence radius</label>
                <span className="font-mono text-blue-700 font-bold text-xs">{form.radiusMeters} meter</span>
              </div>
              <input
                type="range"
                min={20}
                max={500}
                step={10}
                value={form.radiusMeters}
                onChange={(e) => setForm({ ...form, radiusMeters: Number(e.target.value) })}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>20m (bahut tight)</span>
                <span>100m (standard)</span>
                <span>500m (campus)</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Phone ka GPS 10-30 meter idhar-udhar ho sakta hai, isliye 50 meter se kam radius mat rakho.</p>
            </div>
          </div>

          <div>
            <label className={labelCls}>Working hours (optional)</label>
            <input className={inputCls} value={form.workingHours} onChange={(e) => setForm({ ...form, workingHours: e.target.value })} placeholder="10:00 AM – 06:00 PM" />
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={closeForm} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl">
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={busy}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-emerald-500 hover:opacity-90 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{busy ? 'Save ho raha hai…' : editingId ? 'Update Karo' : 'Office Save Karo'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Office list */}
      {offices.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-500">
          Abhi koi office nahi hai. Upar "Add Office Location" dabao.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {offices.map((o) => {
            const staff = employees.filter((e) => e.officeId === o.id && e.status === 'ACTIVE').length;
            return (
              <div key={o.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 text-sm truncate">{o.name}</div>
                      <div className="text-[11px] text-slate-500">{[o.city, o.address].filter(Boolean).join(' · ') || '—'}</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold font-mono shrink-0">
                    {o.radiusMeters}m
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-slate-50 rounded-lg p-2">
                    <div className="text-slate-500">Latitude, Longitude</div>
                    <div className="font-mono text-slate-800">{o.latitude.toFixed(5)}, {o.longitude.toFixed(5)}</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2">
                    <div className="text-slate-500">Employees</div>
                    <div className="font-semibold text-slate-800 flex items-center gap-1"><Users className="w-3 h-3 text-blue-600" /> {staff}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <a href={mapsLink(o.latitude, o.longitude)} target="_blank" rel="noreferrer" className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />
                    <span>Map par dekho</span>
                  </a>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(o)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg flex items-center gap-1">
                      <Pencil className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button onClick={() => remove(o)} className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[11px] font-semibold rounded-lg flex items-center gap-1">
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
