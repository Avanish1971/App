import { Employee, PayrollRun } from '../types';
import { calculateIndianPayrollItem } from './payroll';

// Payroll ki list ab asli (database ke) employees se banti hai, kisi demo data se nahi.
export function buildPayrollRun(employees: Employee[]): PayrollRun {
  const items = employees
    .filter((e) => e.status === 'ACTIVE')
    .map((e) =>
      calculateIndianPayrollItem(e.id, e.fullName, e.department, e.designation, e.pan, e.bankAccount, {
        grossMonthly: (e.basicMonthly || 0) + (e.hraMonthly || 0) + (e.specialAllowanceMonthly || 0),
        workingDays: 26,
        presentDays: 26,
        paidLeaveDays: 0,
        lopDays: 0,
        overtimeHours: 0,
      })
    );

  const now = new Date();
  const month = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });
  const ym = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }).slice(0, 7).replace('-', '_');

  return {
    id: `payrun_${ym}`,
    month,
    totalEmployees: items.length,
    totalGrossPayable: items.reduce((a, c) => a + c.earnedGross, 0),
    totalNetPayable: items.reduce((a, c) => a + c.netPayableSalary, 0),
    totalStatutoryDeductions: items.reduce((a, c) => a + c.totalDeductions, 0),
    status: 'DRAFT',
    items,
  };
}
