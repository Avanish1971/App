import { jsPDF } from 'jspdf';
import type { SlipDetails, SlipLine } from '../types';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const monthLabel = (m: string) => {
  const [y, mo] = (m || '').split('-').map(Number);
  return y && mo ? `${MONTH_NAMES[mo - 1]} ${y}` : m || '';
};

// 'YYYY-MM-DD' -> 'DD/MM/YYYY'
export const fmtDMY = (d: string) => {
  const p = (d || '').slice(0, 10).split('-');
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : d || '';
};

export const money = (n: number) => (Number.isFinite(n) ? n : 0).toFixed(2);

export const sumLines = (lines: SlipLine[]) =>
  Math.round(lines.reduce((t, l) => t + (Number.isFinite(l.amount) ? l.amount : 0), 0) * 100) / 100;

// ---- Amount in words (Indian system) ----
const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function below1000(n: number): string {
  const parts: string[] = [];
  if (n >= 100) {
    parts.push(`${ONES[Math.floor(n / 100)]} Hundred`);
    n %= 100;
  }
  if (n >= 20) {
    parts.push(TENS[Math.floor(n / 10)] + (n % 10 ? ` ${ONES[n % 10]}` : ''));
  } else if (n > 0) {
    parts.push(ONES[n]);
  }
  return parts.join(' ');
}

function intToWords(n: number): string {
  if (n === 0) return 'Zero';
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const rest = n % 1000;
  const parts: string[] = [];
  if (crore) parts.push(`${below1000(crore)} Crore`);
  if (lakh) parts.push(`${below1000(lakh)} Lakh`);
  if (thousand) parts.push(`${below1000(thousand)} Thousand`);
  if (rest) parts.push(below1000(rest));
  return parts.join(' ');
}

export function amountInWords(amount: number): string {
  const a = Math.max(0, Math.round((Number.isFinite(amount) ? amount : 0) * 100) / 100);
  const rupees = Math.floor(a);
  const paise = Math.round((a - rupees) * 100);
  let out = `Rupees ${intToWords(rupees)}`;
  if (paise) out += ` and ${intToWords(paise)} Paise`;
  return `${out} Only`;
}

// ---- PDF ----
const fit = (doc: jsPDF, text: string, width: number) => {
  const t = String(text ?? '');
  const line = doc.splitTextToSize(t, width)[0];
  return typeof line === 'string' ? line : t;
};

export function buildSalarySlipPdf(d: SlipDetails, month: string): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const L = 14; // left margin
  const R = 196; // right edge
  const MID = 105; // beech ki vertical line
  const BLACK = 20;

  const hline = (y: number, w = 0.4, x1 = L, x2 = R, gray = BLACK) => {
    doc.setDrawColor(gray);
    doc.setLineWidth(w);
    doc.line(x1, y, x2, y);
  };
  const vline = (x: number, y1: number, y2: number) => {
    doc.setDrawColor(BLACK);
    doc.setLineWidth(0.4);
    doc.line(x, y1, x, y2);
  };
  const text = (t: string, x: number, y: number, o: { bold?: boolean; size?: number; align?: 'left' | 'center' | 'right'; color?: number; italic?: boolean } = {}) => {
    doc.setFont('helvetica', o.bold ? 'bold' : o.italic ? 'italic' : 'normal');
    doc.setFontSize(o.size ?? 9);
    doc.setTextColor(o.color ?? BLACK);
    doc.text(t, x, y, { align: o.align ?? 'left' });
  };

  // Title
  text(fit(doc, (d.headerName || 'PAYSLIP').toUpperCase(), 180), 105, 20, { bold: true, size: 15, align: 'center' });
  text(`PAYSLIP FOR THE MONTH OF ${monthLabel(month).toUpperCase()}`, 105, 27, { size: 9.5, align: 'center', color: 80 });

  // Header block
  const top = 32;
  hline(top, 0.5);
  const rowH = 7.5;
  const left: [string, string][] = [
    ['Employee No.', d.employeeNo],
    ['Account Code', d.accountCode],
    ['Employee Name', d.employeeName],
    ['Designation', d.designation],
    ['Branch Name', d.branchName],
  ];
  const right: [string, string][] = [
    ['Payslip Date', fmtDMY(d.payslipDate)],
    ['Provident Fund A/c', d.pfAccount],
    ['Absent Days', String(d.absentDays ?? 0)],
  ];
  left.forEach(([k, v], i) => {
    const y = top + 6 + i * rowH;
    text(k, L + 2, y, { bold: true, size: 9 });
    text(fit(doc, v, 52), L + 38, y, { size: 9 });
  });
  right.forEach(([k, v], i) => {
    const y = top + 6 + i * rowH;
    text(k, MID + 4, y, { bold: true, size: 9 });
    text(fit(doc, v, 40), MID + 44, y, { size: 9 });
  });
  const blockBottom = top + 6 + (left.length - 1) * rowH + 4.5;
  vline(MID, top, blockBottom);
  hline(blockBottom, 0.5);

  // Salary details
  const sdY = blockBottom + 8;
  text('SALARY DETAILS', 105, sdY, { bold: true, size: 11, align: 'center' });
  const tTop = sdY + 4;
  hline(tTop, 0.5);
  const hdrY = tTop + 6;
  text('Earnings Description', L + 2, hdrY, { bold: true, size: 9 });
  text('Amount', MID - 3, hdrY, { bold: true, size: 9, align: 'right' });
  text('Deductions Description', MID + 4, hdrY, { bold: true, size: 9 });
  text('Amount', R - 2, hdrY, { bold: true, size: 9, align: 'right' });
  const hdrBottom = hdrY + 3.5;
  hline(hdrBottom, 0.5);

  const rows = Math.max(d.earnings.length, d.deductions.length, 6);
  const rH = 8;
  for (let i = 0; i < rows; i++) {
    const y = hdrBottom + i * rH + 5.6;
    const e = d.earnings[i];
    const de = d.deductions[i];
    if (e) {
      text(fit(doc, e.label.toUpperCase(), 62), L + 2, y, { size: 8.5 });
      text(money(e.amount), MID - 3, y, { size: 8.5, align: 'right' });
    }
    if (de) {
      text(fit(doc, de.label.toUpperCase(), 62), MID + 4, y, { size: 8.5 });
      text(money(de.amount), R - 2, y, { size: 8.5, align: 'right' });
    }
    hline(hdrBottom + (i + 1) * rH, 0.15, L, R, 170);
  }
  const rowsBottom = hdrBottom + rows * rH;

  // Totals
  hline(rowsBottom, 0.5);
  const totY = rowsBottom + 6;
  text('TOTAL EARNING', L + 2, totY, { bold: true, size: 9 });
  text(money(d.totalEarning), MID - 3, totY, { bold: true, size: 9, align: 'right' });
  text('TOTAL DEDUCTION', MID + 4, totY, { bold: true, size: 9 });
  text(money(d.totalDeduction), R - 2, totY, { bold: true, size: 9, align: 'right' });
  const totBottom = totY + 3.5;
  vline(MID, tTop, totBottom);
  hline(totBottom, 0.5);

  // Net salary
  const netY = totBottom + 8;
  text('NET SALARY', L + 2, netY, { bold: true, size: 11 });
  text(`Rs. ${money(d.netSalary)}`, R - 2, netY, { bold: true, size: 11, align: 'right' });
  const words = doc.splitTextToSize(`Amount in words: ${amountInWords(d.netSalary)}`, R - L - 4) as string[];
  words.forEach((w, i) => text(w, L + 2, netY + 7 + i * 4.8, { size: 9, italic: true }));
  const netBottom = netY + 7 + words.length * 4.8 + 1;
  hline(netBottom, 0.5);

  // Signatures
  const sigY = netBottom + 42;
  hline(sigY, 0.3, L + 2, L + 62);
  hline(sigY, 0.3, R - 62, R - 2);
  text('Employee Signature', L + 2, sigY + 5, { size: 8.5 });
  text('Authorised Signatory', R - 2, sigY + 5, { size: 8.5, align: 'right' });
  text('This is a computer generated payslip.', 105, sigY + 16, { size: 8, align: 'center', italic: true, color: 110 });

  return doc;
}

// jsPDF -> base64 (data: prefix ke bina)
export const pdfToBase64 = (doc: jsPDF) => doc.output('datauristring').replace(/^data:[^,]*,/, '');
