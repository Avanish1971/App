// import { useState } from 'react';
// import { PayrollRun, IndianPayrollItem } from '../../types';
// import { formatINR } from '../../utils/payroll';
// import { PayslipViewer } from '../mobile/PayslipViewer';
// import {
//   IndianRupee,
//   Lock,
//   CheckCircle2,
//   FileText,
//   AlertTriangle,
//   Download,
//   Building,
//   ShieldCheck,
//   Printer,
// } from 'lucide-react';

// interface PayrollModuleProps {
//   payrollRun: PayrollRun;
//   onLockPayroll: () => void;
// }

// export function PayrollModule({ payrollRun, onLockPayroll }: PayrollModuleProps) {
//   const [selectedPayslipItem, setSelectedPayslipItem] = useState<IndianPayrollItem | null>(null);
//   const [searchEmployee, setSearchEmployee] = useState('');

//   const isLocked = payrollRun.status === 'LOCKED' || payrollRun.status === 'PAID';

//   const filteredItems = payrollRun.items.filter((item) =>
//     item.employeeName.toLowerCase().includes(searchEmployee.toLowerCase()) ||
//     item.department.toLowerCase().includes(searchEmployee.toLowerCase())
//   );

//   return (
//     <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl space-y-5 p-5">
//       {/* Top Banner & Actions */}
//       <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
//         <div>
//           <div className="flex items-center gap-2">
//             <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Payroll Processing Engine</span>
//             <span
//               className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
//                 isLocked
//                   ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
//                   : 'bg-amber-50 text-amber-600 border border-amber-200'
//               }`}
//             >
//               {payrollRun.status}
//             </span>
//           </div>
//           <h3 className="font-extrabold text-slate-900 text-lg tracking-tight mt-0.5">
//             Salary Register: {payrollRun.month}
//           </h3>
//           <p className="text-xs text-slate-500">
//             Attendance-integrated Indian statutory payroll with EPF, ESIC, Professional Tax, and LOP deductions
//           </p>
//         </div>

//         <div className="flex items-center gap-2">
//           {isLocked ? (
//             <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold">
//               <Lock className="w-3.5 h-3.5 text-emerald-600" />
//               <span>Payroll Frozen & Locked</span>
//             </div>
//           ) : (
//             <button
//               onClick={onLockPayroll}
//               className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
//             >
//               <Lock className="w-3.5 h-3.5" />
//               <span>Lock Payroll & Issue Payslips</span>
//             </button>
//           )}
//         </div>
//       </div>

//       {/* Statutory Summary Metric Cards */}
//       <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
//         <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
//           <div className="text-[10px] text-slate-500 uppercase font-semibold">Total Gross Earned</div>
//           <div className="text-base font-bold text-slate-900 font-mono mt-1">
//             {formatINR(payrollRun.totalGrossPayable)}
//           </div>
//           <div className="text-[10px] text-slate-500">{payrollRun.totalEmployees} Employees</div>
//         </div>

//         <div className="bg-slate-50 p-3.5 rounded-xl border border-emerald-200">
//           <div className="text-[10px] text-emerald-600 uppercase font-semibold">Net Take-Home</div>
//           <div className="text-base font-bold text-emerald-600 font-mono mt-1">
//             {formatINR(payrollRun.totalNetPayable)}
//           </div>
//           <div className="text-[10px] text-slate-500">Bank Transfer Ready</div>
//         </div>

//         <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
//           <div className="text-[10px] text-indigo-600 uppercase font-semibold">EPF (PF 12%)</div>
//           <div className="text-base font-bold text-slate-900 font-mono mt-1">
//             {formatINR(payrollRun.items.reduce((acc, i) => acc + i.epfEmployee, 0))}
//           </div>
//           <div className="text-[10px] text-slate-500">Statutory EPFO</div>
//         </div>

//         <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
//           <div className="text-[10px] text-cyan-600 uppercase font-semibold">ESIC (0.75%)</div>
//           <div className="text-base font-bold text-slate-900 font-mono mt-1">
//             {formatINR(payrollRun.items.reduce((acc, i) => acc + i.esiEmployee, 0))}
//           </div>
//           <div className="text-[10px] text-slate-500">Gross &lt; ₹21k</div>
//         </div>

//         <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
//           <div className="text-[10px] text-amber-600 uppercase font-semibold">Prof. Tax (PT)</div>
//           <div className="text-base font-bold text-slate-900 font-mono mt-1">
//             {formatINR(payrollRun.items.reduce((acc, i) => acc + i.professionalTax, 0))}
//           </div>
//           <div className="text-[10px] text-slate-500">State Revenue Slab</div>
//         </div>

//         <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
//           <div className="text-[10px] text-rose-600 uppercase font-semibold">TDS / Income Tax</div>
//           <div className="text-base font-bold text-slate-900 font-mono mt-1">
//             {formatINR(payrollRun.items.reduce((acc, i) => acc + i.tdsDeduction, 0))}
//           </div>
//           <div className="text-[10px] text-slate-500">Direct Tax Portal</div>
//         </div>
//       </div>

//       {/* Statutory Disclaimer Banner */}
//       <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-500 flex items-start gap-2">
//         <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
//         <span>
//           <strong>Indian Statutory Payroll Disclaimer:</strong> Computations apply standard Indian EPFO (12%), ESIC (0.75%), State Professional Tax (₹200 slab), and Income Tax TDS slabs. Final statutory filings must be audited by organization charter/tax counsel per latest central and state notifications.
//         </span>
//       </div>

//       {/* Salary Register Table */}
//       <div className="space-y-3">
//         <div className="flex items-center justify-between">
//           <input
//             type="text"
//             placeholder="Search employee in payroll register..."
//             value={searchEmployee}
//             onChange={(e) => setSearchEmployee(e.target.value)}
//             className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-500 w-72 focus:outline-none focus:border-indigo-500"
//           />
//           <span className="text-xs text-slate-500 font-mono">
//             Showing {filteredItems.length} Staff Records
//           </span>
//         </div>

//         <div className="overflow-x-auto rounded-xl border border-slate-200">
//           <table className="w-full text-left text-xs border-collapse">
//             <thead>
//               <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
//                 <th className="py-3 px-4">Employee</th>
//                 <th className="py-3 px-4">Dept</th>
//                 <th className="py-3 px-4">Paid / LOP Days</th>
//                 <th className="py-3 px-4">Basic + HRA</th>
//                 <th className="py-3 px-4">Earned Gross</th>
//                 <th className="py-3 px-4">Statutory Deductions</th>
//                 <th className="py-3 px-4 font-bold text-emerald-600">Net Take-Home</th>
//                 <th className="py-3 px-4 text-right">Payslip</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-200 text-slate-700">
//               {filteredItems.map((item) => (
//                 <tr key={item.id} className="hover:bg-slate-50 transition-colors">
//                   <td className="py-3 px-4">
//                     <div className="font-semibold text-slate-900">{item.employeeName}</div>
//                     <div className="text-[10px] text-slate-500 font-mono">PAN: {item.pan}</div>
//                   </td>
//                   <td className="py-3 px-4">{item.department}</td>
//                   <td className="py-3 px-4 font-mono">
//                     <span className="text-emerald-600 font-medium">
//                       {item.presentDays + item.paidLeaveDays}d
//                     </span>
//                     {item.lopDays > 0 && (
//                       <span className="text-rose-600 ml-1">({item.lopDays}d LOP)</span>
//                     )}
//                   </td>
//                   <td className="py-3 px-4 font-mono text-slate-700">
//                     {formatINR(item.basicSalary + item.hra)}
//                   </td>
//                   <td className="py-3 px-4 font-mono font-medium text-slate-900">
//                     {formatINR(item.earnedGross)}
//                   </td>
//                   <td className="py-3 px-4 font-mono text-rose-700">
//                     -{formatINR(item.totalDeductions)}
//                     <span className="text-[10px] text-slate-500 block">
//                       PF:{item.epfEmployee} · PT:{item.professionalTax}
//                     </span>
//                   </td>
//                   <td className="py-3 px-4 font-mono font-bold text-emerald-600">
//                     {formatINR(item.netPayableSalary)}
//                   </td>
//                   <td className="py-3 px-4 text-right">
//                     <button
//                       onClick={() => setSelectedPayslipItem(item)}
//                       className="px-2.5 py-1 bg-slate-100 hover:bg-slate-100 text-indigo-600 hover:text-indigo-700 border border-slate-300 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
//                     >
//                       <FileText className="w-3.5 h-3.5" />
//                       <span>Slip</span>
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Render Payslip Viewer when an employee is inspected */}
//       {selectedPayslipItem && (
//         <PayslipViewer
//           payrollItem={selectedPayslipItem}
//           onClose={() => setSelectedPayslipItem(null)}
//         />
//       )}
//     </div>
//   );
// }
