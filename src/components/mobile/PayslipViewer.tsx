import { useState } from 'react';
import { IndianPayrollItem } from '../../types';
import { formatINR } from '../../utils/payroll';
import { Printer, Download, X, Building, CheckCircle } from 'lucide-react';

interface PayslipViewerProps {
  payrollItem: IndianPayrollItem;
  onClose: () => void;
}

export function PayslipViewer({ payrollItem, onClose }: PayslipViewerProps) {
  const [downloaded, setDownloaded] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">
              SLIP
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Monthly Payslip / Salary Statement</h3>
              <p className="text-xs text-slate-400">Pay Period: September 2026</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Print Payslip"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-1.5 transition-colors"
            >
              {downloaded ? <CheckCircle className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
              <span>{downloaded ? 'Downloaded PDF' : 'Download PDF'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Payslip Document Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-200 text-xs">
          {/* Company & Employee Lockup */}
          <div className="border-b border-slate-800 pb-5 flex flex-wrap justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-white text-base">Acme Technologies Pvt. Ltd.</span>
              </div>
              <p className="text-slate-400 mt-1">Maker Maxity, Bandra Kurla Complex (BKC), Mumbai - 400051</p>
              <p className="text-slate-400">CIN: U72200MH2021PTC123456 | GSTIN: 27AABCA1234F1Z8</p>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
                ✓ ELECTRONICALLY VERIFIED
              </span>
              <p className="text-slate-400 mt-1 font-mono text-[11px]">Payslip Ref: SLIP-202609-{payrollItem.employeeId}</p>
            </div>
          </div>

          {/* Employee Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-800/40 p-4 rounded-xl border border-slate-800">
            <div>
              <div className="text-slate-400 text-[11px]">Employee Name</div>
              <div className="font-semibold text-white">{payrollItem.employeeName}</div>
            </div>
            <div>
              <div className="text-slate-400 text-[11px]">Employee ID</div>
              <div className="font-mono text-slate-200">ACME-1001</div>
            </div>
            <div>
              <div className="text-slate-400 text-[11px]">Department</div>
              <div className="text-slate-200">{payrollItem.department}</div>
            </div>
            <div>
              <div className="text-slate-400 text-[11px]">Designation</div>
              <div className="text-slate-200">{payrollItem.designation}</div>
            </div>
            <div>
              <div className="text-slate-400 text-[11px]">Bank Account</div>
              <div className="font-mono text-slate-200">{payrollItem.bankAccount}</div>
            </div>
            <div>
              <div className="text-slate-400 text-[11px]">PAN Number</div>
              <div className="font-mono text-slate-200">{payrollItem.pan}</div>
            </div>
            <div>
              <div className="text-slate-400 text-[11px]">Working Days</div>
              <div className="font-mono text-slate-200">{payrollItem.workingDaysInMonth} Days</div>
            </div>
            <div>
              <div className="text-slate-400 text-[11px]">Days Payable</div>
              <div className="font-mono text-emerald-400 font-semibold">
                {payrollItem.presentDays + payrollItem.paidLeaveDays} Days
              </div>
            </div>
          </div>

          {/* Earnings & Deductions Breakdown Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Earnings */}
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <div className="bg-slate-800/60 px-4 py-2 font-bold text-white text-xs border-b border-slate-800 flex justify-between">
                <span>EARNINGS (उपलब्धियां)</span>
                <span>AMOUNT (₹)</span>
              </div>
              <div className="divide-y divide-slate-800/50 p-1">
                <div className="flex justify-between px-3 py-2 text-slate-300">
                  <span>Basic Salary</span>
                  <span className="font-mono font-medium">{formatINR(payrollItem.basicSalary)}</span>
                </div>
                <div className="flex justify-between px-3 py-2 text-slate-300">
                  <span>House Rent Allowance (HRA)</span>
                  <span className="font-mono font-medium">{formatINR(payrollItem.hra)}</span>
                </div>
                <div className="flex justify-between px-3 py-2 text-slate-300">
                  <span>Special Allowance</span>
                  <span className="font-mono font-medium">{formatINR(payrollItem.specialAllowance)}</span>
                </div>
                {payrollItem.overtimePay > 0 && (
                  <div className="flex justify-between px-3 py-2 text-emerald-400">
                    <span>Approved Overtime Pay</span>
                    <span className="font-mono font-medium">+{formatINR(payrollItem.overtimePay)}</span>
                  </div>
                )}
                {payrollItem.lopDeduction > 0 && (
                  <div className="flex justify-between px-3 py-2 text-rose-400">
                    <span>Loss of Pay (LOP) Adj. ({payrollItem.lopDays} days)</span>
                    <span className="font-mono font-medium">-{formatINR(payrollItem.lopDeduction)}</span>
                  </div>
                )}
                <div className="flex justify-between px-3 py-2.5 font-bold text-white bg-slate-800/40">
                  <span>Total Gross Earnings</span>
                  <span className="font-mono text-cyan-400">{formatINR(payrollItem.earnedGross)}</span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <div className="bg-slate-800/60 px-4 py-2 font-bold text-white text-xs border-b border-slate-800 flex justify-between">
                <span>STATUTORY DEDUCTIONS (कटौतियां)</span>
                <span>AMOUNT (₹)</span>
              </div>
              <div className="divide-y divide-slate-800/50 p-1">
                <div className="flex justify-between px-3 py-2 text-slate-300">
                  <span>Employee Provident Fund (EPF 12%)</span>
                  <span className="font-mono font-medium">{formatINR(payrollItem.epfEmployee)}</span>
                </div>
                <div className="flex justify-between px-3 py-2 text-slate-300">
                  <span>Employee State Insurance (ESIC)</span>
                  <span className="font-mono font-medium">
                    {payrollItem.esiEmployee > 0 ? formatINR(payrollItem.esiEmployee) : '₹0 (Exempt)'}
                  </span>
                </div>
                <div className="flex justify-between px-3 py-2 text-slate-300">
                  <span>Professional Tax (PT - State Slab)</span>
                  <span className="font-mono font-medium">{formatINR(payrollItem.professionalTax)}</span>
                </div>
                <div className="flex justify-between px-3 py-2 text-slate-300">
                  <span>TDS / Income Tax Withholding</span>
                  <span className="font-mono font-medium">{formatINR(payrollItem.tdsDeduction)}</span>
                </div>
                <div className="flex justify-between px-3 py-2.5 font-bold text-white bg-slate-800/40">
                  <span>Total Deductions</span>
                  <span className="font-mono text-rose-400">{formatINR(payrollItem.totalDeductions)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Pay Highlight Banner */}
          <div className="bg-gradient-to-r from-indigo-950/60 via-slate-800/80 to-slate-900 border border-indigo-700/50 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                NET TAKE-HOME SALARY (हस्तांतरित वेतन)
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono mt-0.5">
                {formatINR(payrollItem.netPayableSalary)}
              </div>
            </div>
            <div className="text-right text-[11px] text-slate-400">
              <p>Disbursed to: {payrollItem.bankAccount}</p>
              <p className="text-emerald-400 font-semibold">Status: Cleared via NEFT/IMPS</p>
            </div>
          </div>

          {/* Statutory Disclaimer */}
          <p className="text-[10px] text-slate-500 italic text-center">
            * This payslip is electronically generated by GeoAttend HRMS based on geo-verified attendance and approved leaves. No physical signature is required under IT Act 2000. Statutory deductions calculated per Indian Labor Code guidelines.
          </p>
        </div>
      </div>
    </div>
  );
}
