import { useEffect, useState } from 'react';
import { Employee, EmployeeDocument, EmployeeDocType } from '../../types';
import {
  getEmployeeDocumentsApi,
  uploadEmployeeDocumentApi,
  deleteEmployeeDocumentApi,
  openEmployeeDocumentApi,
} from '../../lib/api';
import { DOC_TYPE_LABELS, readFileAsBase64, formatBytes } from '../../lib/files';
import { FilePicker } from './FilePicker';
import { FileText, Eye, Trash2, CheckCircle2, XCircle, Upload, Loader2 } from 'lucide-react';

interface EmployeeDocumentsProps {
  employee: Employee;
}

function Row({ label, value, hasFile }: { label: string; value?: string; hasFile: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
      <div className="min-w-0">
        <div className="text-xs font-semibold text-slate-900">{label}</div>
        <div className="text-[11px] font-mono text-slate-500 truncate">{value || 'Number add nahi hua'}</div>
      </div>
      {hasFile ? (
        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5" /> File saved
        </span>
      ) : (
        <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 shrink-0">
          <XCircle className="w-3.5 h-3.5" /> File missing
        </span>
      )}
    </div>
  );
}

// Employee ke numbers + database me save hui files (dekho / hatao / nayi upload karo)
export function EmployeeDocuments({ employee }: EmployeeDocumentsProps) {
  const [docs, setDocs] = useState<EmployeeDocument[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<EmployeeDocType>('AADHAAR');
  const [label, setLabel] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setDocs(null);
    setError(null);
    getEmployeeDocumentsApi(employee.id)
      .then((d) => !cancelled && setDocs(d))
      .catch((err) => {
        if (!cancelled) {
          setDocs([]);
          setError(err instanceof Error ? err.message : 'Documents load nahi hue');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [employee.id]);

  const has = (t: EmployeeDocType) => (docs || []).some((d) => d.type === t);
  const needsLabel = type === 'EDUCATION' || type === 'OTHER';

  const upload = async () => {
    if (!file || uploading) return;
    if (needsLabel && !label.trim()) {
      setError('Document ka naam likho (jaise B.Com ya Experience Letter)');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const saved = await uploadEmployeeDocumentApi(employee.id, {
        type,
        label: needsLabel ? label.trim() : DOC_TYPE_LABELS[type],
        fileName: file.name,
        mimeType: file.type,
        dataBase64: await readFileAsBase64(file),
      });
      setDocs((prev) => [...(prev || []), saved]);
      setFile(null);
      setLabel('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload nahi ho paaya');
    } finally {
      setUploading(false);
    }
  };

  const remove = async (d: EmployeeDocument) => {
    if (!window.confirm(`"${d.label || d.fileName}" delete karna hai?`)) return;
    try {
      await deleteEmployeeDocumentApi(employee.id, d.id);
      setDocs((prev) => (prev || []).filter((x) => x.id !== d.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete nahi ho paaya');
    }
  };

  const open = async (d: EmployeeDocument) => {
    try {
      await openEmployeeDocumentApi(employee.id, d.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'File nahi khul paayi');
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Row label="Aadhaar Card" value={employee.aadhaar} hasFile={has('AADHAAR')} />
        <Row label="PAN Card" value={employee.pan} hasFile={has('PAN')} />
        <Row
          label={`Bank${employee.bankName ? ` · ${employee.bankName}` : ''}`}
          value={employee.bankAccount ? `${employee.bankAccount}${employee.ifsc ? ` · ${employee.ifsc}` : ''}` : ''}
          hasFile={has('BANK_PROOF')}
        />
        <Row label="UAN (PF Number)" value={employee.uan} hasFile={true} />
      </div>

      <div className="space-y-2">
        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">Saved Files ({docs?.length ?? 0})</div>
        {docs === null ? (
          <div className="text-xs text-slate-500">Loading…</div>
        ) : docs.length === 0 ? (
          <div className="text-xs text-slate-500 border border-dashed border-slate-300 rounded-xl py-4 text-center">Abhi koi file upload nahi hui</div>
        ) : (
          docs.map((d) => (
            <div key={d.id} className="flex items-center gap-3 border border-slate-200 rounded-xl px-3 py-2">
              <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-900 truncate">
                  {d.label || DOC_TYPE_LABELS[d.type]}
                  {d.type === 'EDUCATION' && <span className="ml-1.5 text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">Education</span>}
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  {d.fileName} · {formatBytes(d.size)} · {new Date(d.uploadedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>
              <button onClick={() => open(d)} className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50" title="Dekho / Download" aria-label="View">
                <Eye className="w-4 h-4" />
              </button>
              <button onClick={() => remove(d)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50" title="Delete" aria-label="Delete">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-slate-100 pt-3 space-y-2">
        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">Nayi file upload karo</div>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as EmployeeDocType)}
            className="sm:col-span-4 bg-slate-100 border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
          >
            {(Object.keys(DOC_TYPE_LABELS) as EmployeeDocType[]).map((t) => (
              <option key={t} value={t}>
                {DOC_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          {needsLabel && (
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Naam (B.Com 2019...)"
              className="sm:col-span-3 bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
            />
          )}
          <div className={needsLabel ? 'sm:col-span-3' : 'sm:col-span-6'}>
            <FilePicker file={file} onChange={setFile} />
          </div>
          <button
            onClick={upload}
            disabled={!file || uploading}
            className="sm:col-span-2 flex items-center justify-center gap-1.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold disabled:opacity-40"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            Upload
          </button>
        </div>
        {error && <div className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2">{error}</div>}
      </div>
    </div>
  );
}
