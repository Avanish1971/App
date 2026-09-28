/**
 * Indian Statutory Payroll Engine
 * Calculates Basic, HRA, Special Allowance, EPF, ESIC, Professional Tax, TDS and LOP deductions
 */

import { IndianPayrollItem } from '../types';

export interface SalaryBreakdownParams {
  grossMonthly: number;
  workingDays: number;
  presentDays: number;
  paidLeaveDays: number;
  lopDays: number;
  overtimeHours?: number;
  hourlyRate?: number;
}

export function calculateIndianPayrollItem(
  employeeId: string,
  employeeName: string,
  department: string,
  designation: string,
  pan: string,
  bankAccount: string,
  params: SalaryBreakdownParams
): IndianPayrollItem {
  const { grossMonthly, workingDays, presentDays, paidLeaveDays, lopDays, overtimeHours = 0 } = params;

  // Typical Indian salary structure allocation:
  // Basic: 40% - 50% of gross
  // HRA: 40% - 50% of basic (20% of gross)
  // Special Allowance: Balance
  const basicSalary = Math.round(grossMonthly * 0.45);
  const hra = Math.round(grossMonthly * 0.25);
  const specialAllowance = Math.max(0, grossMonthly - basicSalary - hra);

  // Daily gross rate
  const perDayRate = workingDays > 0 ? grossMonthly / workingDays : 0;
  const lopDeduction = Math.round(perDayRate * lopDays);

  // Overtime pay (approx 1.5x standard hourly rate based on 8hr shift)
  const hourlyRate = workingDays > 0 ? perDayRate / 8 : 0;
  const overtimePay = Math.round(overtimeHours * hourlyRate * 1.5);

  const earnedGross = Math.max(0, grossMonthly - lopDeduction + overtimePay);

  // Statutory Deductions (India):
  // 1. Employee Provident Fund (EPF): 12% of Basic salary (up to wage ceiling of ₹15,000 basic, or uncapped per policy)
  // Standard statutory calculation: 12% of Basic (capped at ₹1,800 or uncapped)
  const epfEmployee = Math.round(Math.min(basicSalary, 15000) * 0.12);

  // 2. Employee State Insurance (ESIC): 0.75% of Gross if gross <= ₹21,000 / month
  let esiEmployee = 0;
  if (grossMonthly <= 21000) {
    esiEmployee = Math.round(earnedGross * 0.0075);
  }

  // 3. Professional Tax (PT): Standard slab ₹200/month (e.g. Maharashtra / Karnataka standard)
  const professionalTax = grossMonthly > 10000 ? 200 : 0;

  // 4. Tax Deducted at Source (TDS estimate based on annualized new tax regime slab)
  const annualTaxableApprox = earnedGross * 12;
  let tdsDeduction = 0;
  if (annualTaxableApprox > 700000) {
    // New regime threshold roughly ₹7L
    const taxableSurplus = annualTaxableApprox - 700000;
    tdsDeduction = Math.round((taxableSurplus * 0.10) / 12);
  }

  const totalDeductions = epfEmployee + esiEmployee + professionalTax + tdsDeduction;
  const netPayableSalary = Math.max(0, earnedGross - totalDeductions);

  return {
    id: `pay_${employeeId}_${Date.now()}`,
    employeeId,
    employeeName,
    department,
    designation,
    pan,
    bankAccount,
    workingDaysInMonth: workingDays,
    presentDays,
    paidLeaveDays,
    lopDays,
    grossMonthlySalary: grossMonthly,
    basicSalary,
    hra,
    specialAllowance,
    overtimePay,
    lopDeduction,
    earnedGross,
    epfEmployee,
    esiEmployee,
    professionalTax,
    tdsDeduction,
    totalDeductions,
    netPayableSalary,
    payslipGenerated: true,
  };
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}
