import { useRef, useState } from 'react';
import { Paperclip, X } from 'lucide-react';
import { ACCEPTED_FILES, validateFile, formatBytes } from '../../lib/files';

interface FilePickerProps {
  file: File | null;
  onChange: (file: File | null) => void;
  placeholder?: string;
}

// Chhota "file chuno" button: PDF/photo, max 3 MB
export function FilePicker({ file, onChange, placeholder = 'File chuno (PDF/Photo)' }: FilePickerProps) {
  const ref = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-1">
      <input
        ref={ref}
        type="file"
        accept={ACCEPTED_FILES}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0] || null;
          e.target.value = '';
          if (!f) return;
          const err = validateFile(f);
          setError(err);
          if (!err) onChange(f);
        }}
      />
      {file ? (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
          <Paperclip className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="flex-1 truncate text-[11px] font-semibold text-emerald-800">{file.name}</span>
          <span className="text-[10px] text-emerald-600 font-mono">{formatBytes(file.size)}</span>
          <button type="button" onClick={() => onChange(null)} className="text-emerald-700 hover:text-rose-600" aria-label="Remove file">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="w-full flex items-center gap-2 bg-white border border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/40 rounded-xl px-3 py-2 text-[11px] text-slate-500 transition-colors"
        >
          <Paperclip className="w-3.5 h-3.5" />
          <span>{placeholder}</span>
        </button>
      )}
      {error && <div className="text-[10px] text-rose-600">{error}</div>}
    </div>
  );
}
