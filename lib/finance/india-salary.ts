/**
 * Indian salary: CTC → take-home, for FY 2026-27 rates. Budget 2025 set these
 * slabs and Budget 2026 (1 Feb 2026) left them unchanged; re-check each budget.
 *
 * Kept as pure functions, separate from the UI, so the tax rules can be read
 * and checked in one place. It is an estimate for a typical salaried
 * structure, not a tax computation: HRA exemption, other deductions and
 * surcharge marginal relief are not modelled.
 */

export type TaxRegime = "new" | "old";

interface Slab {
  upTo: number; // upper bound of the slab (Infinity for the last)
  rate: number;
}

/** New regime, FY 2025-26 and 2026-27 (section 115BAC). */
export const NEW_REGIME_SLABS: Slab[] = [
  { upTo: 400000, rate: 0 },
  { upTo: 800000, rate: 0.05 },
  { upTo: 1200000, rate: 0.1 },
  { upTo: 1600000, rate: 0.15 },
  { upTo: 2000000, rate: 0.2 },
  { upTo: 2400000, rate: 0.25 },
  { upTo: Infinity, rate: 0.3 },
];

/** Old regime, individuals under 60. */
export const OLD_REGIME_SLABS: Slab[] = [
  { upTo: 250000, rate: 0 },
  { upTo: 500000, rate: 0.05 },
  { upTo: 1000000, rate: 0.2 },
  { upTo: Infinity, rate: 0.3 },
];

export const STANDARD_DEDUCTION: Record<TaxRegime, number> = { new: 75000, old: 50000 };
/** Section 87A: no tax up to this taxable income. */
export const REBATE_LIMIT: Record<TaxRegime, number> = { new: 1200000, old: 500000 };
const SECTION_80C_CAP = 150000;
/** Statutory PF wage ceiling many employers use: 12% of ₹15,000 a month. */
export const PF_CAPPED_MONTHLY = 1800;

export function slabTax(income: number, slabs: Slab[]): number {
  let tax = 0;
  let lower = 0;
  for (const { upTo, rate } of slabs) {
    if (income <= lower) break;
    tax += (Math.min(income, upTo) - lower) * rate;
    lower = upTo;
  }
  return tax;
}

function surchargeRate(income: number, regime: TaxRegime): number {
  if (income > 50000000) return regime === "new" ? 0.25 : 0.37;
  if (income > 20000000) return 0.25;
  if (income > 10000000) return 0.15;
  if (income > 5000000) return 0.1;
  return 0;
}

/** Income tax including 87A rebate (with marginal relief), surcharge and 4% cess. */
export function incomeTax(taxable: number, regime: TaxRegime): number {
  const income = Math.max(0, taxable);
  let tax = slabTax(income, regime === "new" ? NEW_REGIME_SLABS : OLD_REGIME_SLABS);
  const limit = REBATE_LIMIT[regime];
  if (income <= limit) {
    tax = 0;
  } else if (regime === "new") {
    // Marginal relief: tax cannot exceed the income above the rebate limit.
    tax = Math.min(tax, income - limit);
  }
  tax += tax * surchargeRate(income, regime);
  return tax * 1.04;
}

export interface SalaryInput {
  ctc: number;
  variablePct: number;
  regime: TaxRegime;
  pf: "full" | "capped" | "none";
  /** Professional tax per year; ₹2,400–2,500 in most states that levy it. */
  professionalTax: number;
}

export interface SalaryBreakdown {
  variable: number;
  fixedCtc: number;
  basic: number;
  hra: number;
  special: number;
  employerPf: number;
  employeePf: number;
  fixedGross: number;
  taxableIncome: number;
  tax: number;
  professionalTax: number;
  annualTakeHome: number;
  monthlyInHand: number;
  variableTakeHome: number;
}

export function salaryBreakdown(input: SalaryInput): SalaryBreakdown {
  const ctc = Math.max(0, input.ctc);
  const variable = ctc * Math.min(Math.max(input.variablePct, 0), 100) / 100;
  const fixedCtc = ctc - variable;

  // A common structure: basic 50% of fixed pay, HRA 40% of basic.
  const basic = fixedCtc * 0.5;
  const pfMonthly = input.pf === "none" ? 0 : input.pf === "capped" ? Math.min(PF_CAPPED_MONTHLY, (basic / 12) * 0.12) : (basic / 12) * 0.12;
  const employerPf = pfMonthly * 12;
  const employeePf = employerPf;

  // Employer PF is part of CTC but never reaches the payslip.
  const fixedGross = fixedCtc - employerPf;
  const hra = basic * 0.4;
  const special = Math.max(0, fixedGross - basic - hra);

  const professionalTax = Math.max(0, input.professionalTax);
  const gross = fixedGross + variable;
  const deductions =
    STANDARD_DEDUCTION[input.regime] +
    (input.regime === "old" ? Math.min(SECTION_80C_CAP, employeePf) + professionalTax : 0);
  const taxableIncome = Math.max(0, gross - deductions);
  const tax = incomeTax(taxableIncome, input.regime);

  const annualTakeHome = Math.max(0, gross - employeePf - professionalTax - tax);
  // TDS is spread across the year in proportion to what is paid.
  const taxOnFixed = gross > 0 ? tax * (fixedGross / gross) : 0;
  const monthlyInHand = Math.max(0, (fixedGross - employeePf - professionalTax - taxOnFixed) / 12);
  const variableTakeHome = Math.max(0, variable - (tax - taxOnFixed));

  return {
    variable,
    fixedCtc,
    basic,
    hra,
    special,
    employerPf,
    employeePf,
    fixedGross,
    taxableIncome,
    tax,
    professionalTax,
    annualTakeHome,
    monthlyInHand,
    variableTakeHome,
  };
}
