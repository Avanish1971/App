// Document file ke helper: check karna aur base64 me badalna (server ko JSON me bhejne ke liye)
import { EmployeeDocType } from '../types';

export const MAX_FILE_BYTES = 3 * 1024 * 1024; // 3 MB
export const ACCEPTED_FILES = 'application/pdf,image/jpeg,image/png,image/webp';
const ALLOWED = ACCEPTED_FILES.split(',');

export const DOC_TYPE_LABELS: Record<EmployeeDocType, string> = {
  AADHAAR: 'Aadhaar Card',
  PAN: 'PAN Card',
  BANK_PROOF: 'Bank Passbook / Cancelled Cheque',
  EDUCATION: 'Education Certificate',
  PHOTO: 'Photo',
  RESUME: 'Resume',
  OFFER_LETTER: 'Offer Letter',
  OTHER: 'Other Document',
};

export interface PendingDocument {
  type: EmployeeDocType;
  label: string;
  file: File;
}

export function validateFile(file: File): string | null {
  if (!ALLOWED.includes(file.type)) return 'Sirf PDF, JPG, PNG ya WEBP file chalegi';
  if (file.size > MAX_FILE_BYTES) return 'File 3 MB se badi hai, chhoti file chuno';
  return null;
}

export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(new Error('File padhi nahi ja saki'));
    reader.readAsDataURL(file);
  });
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
