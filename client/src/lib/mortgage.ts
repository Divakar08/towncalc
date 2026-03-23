// ============================================================
// MORTGAGE CALCULATION ENGINE
// Canadian townhouse mortgage calculator
// ============================================================

// Affordability decision thresholds (exposed as constants)
export const THRESHOLDS = {
  BUY_HOUSING_RATIO: 0.35,
  BUY_TOTAL_RATIO: 0.45,
  CAUTION_HOUSING_RATIO: 0.40,
  CAUTION_TOTAL_RATIO: 0.50,
} as const;

export type Term = 25 | 30;
export type Frequency = "monthly" | "biweekly";
export type Decision = "Buy" | "Caution" | "Do not buy";

export interface MortgageInputs {
  propertyValue: number;
  annualRate: number; // as a decimal e.g. 0.055 for 5.5%
  strataMonthly: number;
  propertyTaxMonthly: number;
  homeInsuranceMonthly: number;
  postTaxIncomeMonthly: number;
  householdSpendingMonthly: number;
}

export interface PaymentDetail {
  payment: number;
  totalInterest: number;
  totalPayments: number;
  monthlyEquivalent: number; // for biweekly, this is biweekly * 26 / 12
}

export interface TermResult {
  monthly: PaymentDetail;
  biweekly: PaymentDetail;
  interestSavings: number; // biweekly saves this much vs monthly
  // Monthly housing costs (mortgage monthly + strata + tax + insurance)
  housingCostMonthly: number;
  totalCostMonthly: number; // housing + household spending
  housingRatio: number;
  totalRatio: number;
  decision: Decision;
  decisionExplanation: string;
  // Full monthly payment breakdown
  monthlyEMI: number; // mortgage portion only
  totalEMI: number; // mortgage + strata + tax + insurance
  totalEMIWithSpending: number; // totalEMI + household spending
  inHandMonthly: number; // postTaxIncome - totalEMI - householdSpending
}

export interface ScenarioResult {
  label: string;
  downPaymentPercent: number;
  downPaymentAmount: number;
  principal: number;
  isCMHC: boolean; // true for minimum down payment (requires CMHC insurance)
  cmhcPremium: number;
  insuredPrincipal: number; // principal + CMHC premium
  terms: Record<Term, TermResult>;
}

// ---------------------------------------------------------------
// CMHC (Canadian Mortgage and Housing Corporation) rules
// Minimum down payment per FCAC/CMHC rules (2024)
// ---------------------------------------------------------------
export function calcMinDownPayment(propertyValue: number): number {
  if (propertyValue <= 500_000) {
    return propertyValue * 0.05;
  } else if (propertyValue <= 999_999) {
    // 5% on first $500k + 10% on remainder
    return 500_000 * 0.05 + (propertyValue - 500_000) * 0.10;
  } else {
    // Properties $1M+ require 20% minimum
    return propertyValue * 0.20;
  }
}

// CMHC mortgage insurance premium rate
function cmhcPremiumRate(ltv: number): number {
  // LTV = principal / property value
  if (ltv <= 0.65) return 0.006; // Technically not required but capped
  if (ltv <= 0.75) return 0.017;
  if (ltv <= 0.80) return 0.024;
  if (ltv <= 0.85) return 0.028;
  if (ltv <= 0.90) return 0.031;
  return 0.040; // up to 95%
}

function calcCMHCPremium(principal: number, propertyValue: number): number {
  const ltv = principal / propertyValue;
  if (ltv <= 0.80) return 0; // No CMHC required at 20%+ down
  return principal * cmhcPremiumRate(ltv);
}

// ---------------------------------------------------------------
// Core mortgage payment formula
// Payment = P * [i(1+i)^n] / [(1+i)^n - 1]
// ---------------------------------------------------------------
export function calcPayment(principal: number, periodicRate: number, numPeriods: number): number {
  if (periodicRate === 0) return principal / numPeriods;
  const base = Math.pow(1 + periodicRate, numPeriods);
  return principal * (periodicRate * base) / (base - 1);
}

function calcPaymentDetail(
  principal: number,
  annualRate: number,
  freq: Frequency,
  years: number
): PaymentDetail {
  const periodsPerYear = freq === "monthly" ? 12 : 26;
  const periodicRate = annualRate / periodsPerYear;
  const numPeriods = periodsPerYear * years;

  const payment = calcPayment(principal, periodicRate, numPeriods);
  const totalPaid = payment * numPeriods;
  const totalInterest = totalPaid - principal;
  const monthlyEquivalent = freq === "biweekly"
    ? (payment * 26) / 12
    : payment;

  return { payment, totalInterest, totalPayments: numPeriods, monthlyEquivalent };
}

// ---------------------------------------------------------------
// Affordability decision logic
// ---------------------------------------------------------------
function calcDecision(housingRatio: number, totalRatio: number): Decision {
  if (housingRatio > THRESHOLDS.CAUTION_HOUSING_RATIO || totalRatio > THRESHOLDS.CAUTION_TOTAL_RATIO) {
    return "Do not buy";
  }
  if (housingRatio > THRESHOLDS.BUY_HOUSING_RATIO || totalRatio > THRESHOLDS.BUY_TOTAL_RATIO) {
    return "Caution";
  }
  return "Buy";
}

function calcDecisionExplanation(
  housingRatio: number,
  totalRatio: number,
  decision: Decision
): string {
  const hr = (housingRatio * 100).toFixed(1);
  const tr = (totalRatio * 100).toFixed(1);
  if (decision === "Buy") {
    return `Housing costs are ${hr}% and total costs are ${tr}% of your income, within comfortable ranges.`;
  }
  if (decision === "Caution") {
    return `Housing costs are ${hr}% and total costs are ${tr}% of your income — above recommended thresholds. Proceed with caution.`;
  }
  return `Housing costs are ${hr}% and total costs are ${tr}% of your income — well above safe limits. This property may be unaffordable.`;
}

// ---------------------------------------------------------------
// Compute a single term result
// ---------------------------------------------------------------
function calcTermResult(
  insuredPrincipal: number,
  inputs: MortgageInputs,
  term: Term
): TermResult {
  const { annualRate, strataMonthly, propertyTaxMonthly, homeInsuranceMonthly,
          postTaxIncomeMonthly, householdSpendingMonthly } = inputs;

  const monthly = calcPaymentDetail(insuredPrincipal, annualRate, "monthly", term);
  const biweekly = calcPaymentDetail(insuredPrincipal, annualRate, "biweekly", term);

  const interestSavings = monthly.totalInterest - biweekly.totalInterest;

  // Housing cost = monthly mortgage + strata + tax + insurance
  const housingCostMonthly = monthly.monthlyEquivalent + strataMonthly + propertyTaxMonthly + homeInsuranceMonthly;
  const totalCostMonthly = housingCostMonthly + householdSpendingMonthly;

  const housingRatio = housingCostMonthly / postTaxIncomeMonthly;
  const totalRatio = totalCostMonthly / postTaxIncomeMonthly;

  const decision = calcDecision(housingRatio, totalRatio);
  const decisionExplanation = calcDecisionExplanation(housingRatio, totalRatio, decision);

  const monthlyEMI = monthly.payment; // mortgage only
  const totalEMI = monthlyEMI + strataMonthly + propertyTaxMonthly + homeInsuranceMonthly;
  const totalEMIWithSpending = totalEMI + householdSpendingMonthly;
  const inHandMonthly = postTaxIncomeMonthly - totalEMI - householdSpendingMonthly;

  return {
    monthly,
    biweekly,
    interestSavings,
    housingCostMonthly,
    totalCostMonthly,
    housingRatio,
    totalRatio,
    decision,
    decisionExplanation,
    monthlyEMI,
    totalEMI,
    totalEMIWithSpending,
    inHandMonthly,
  };
}

// ---------------------------------------------------------------
// Main: compute all 4 scenarios
// ---------------------------------------------------------------
export function computeScenarios(inputs: MortgageInputs): ScenarioResult[] {
  const { propertyValue } = inputs;

  const minDown = calcMinDownPayment(propertyValue);
  const minDownPercent = minDown / propertyValue;

  const scenarioDefs = [
    { label: "Min Down", downPaymentAmount: minDown, downPaymentPercent: minDownPercent },
    { label: "10% Down", downPaymentAmount: propertyValue * 0.10, downPaymentPercent: 0.10 },
    { label: "15% Down", downPaymentAmount: propertyValue * 0.15, downPaymentPercent: 0.15 },
    { label: "20% Down", downPaymentAmount: propertyValue * 0.20, downPaymentPercent: 0.20 },
  ];

  return scenarioDefs.map((def) => {
    const principal = propertyValue - def.downPaymentAmount;
    const isCMHC = def.downPaymentPercent < 0.20;
    const cmhcPremium = isCMHC ? calcCMHCPremium(principal, propertyValue) : 0;
    const insuredPrincipal = principal + cmhcPremium;

    const terms: Record<Term, TermResult> = {
      25: calcTermResult(insuredPrincipal, inputs, 25),
      30: calcTermResult(insuredPrincipal, inputs, 30),
    };

    return {
      label: def.label,
      downPaymentPercent: def.downPaymentPercent,
      downPaymentAmount: def.downPaymentAmount,
      principal,
      isCMHC,
      cmhcPremium,
      insuredPrincipal,
      terms,
    };
  });
}

// ---------------------------------------------------------------
// Amortization schedule — yearly principal vs interest breakdown
// ---------------------------------------------------------------
export interface AmortizationYear {
  year: number;
  principalPaid: number;   // principal paid this year
  interestPaid: number;    // interest paid this year
  cumulativePrincipal: number;
  cumulativeInterest: number;
  balance: number;         // remaining balance at end of year
}

export function buildAmortizationSchedule(
  principal: number,
  annualRate: number,
  years: number
): AmortizationYear[] {
  const monthlyRate = annualRate / 12;
  const numPayments = years * 12;
  const payment = calcPayment(principal, monthlyRate, numPayments);

  let balance = principal;
  let cumulativePrincipal = 0;
  let cumulativeInterest = 0;
  const schedule: AmortizationYear[] = [];

  for (let y = 1; y <= years; y++) {
    let yearPrincipal = 0;
    let yearInterest = 0;

    for (let m = 0; m < 12; m++) {
      if (balance <= 0) break;
      const interestThisMonth = balance * monthlyRate;
      const principalThisMonth = Math.min(payment - interestThisMonth, balance);
      yearInterest += interestThisMonth;
      yearPrincipal += principalThisMonth;
      balance -= principalThisMonth;
      if (balance < 0.01) balance = 0;
    }

    cumulativePrincipal += yearPrincipal;
    cumulativeInterest += yearInterest;

    schedule.push({
      year: y,
      principalPaid: yearPrincipal,
      interestPaid: yearInterest,
      cumulativePrincipal,
      cumulativeInterest,
      balance: Math.max(balance, 0),
    });

    if (balance <= 0) break;
  }

  return schedule;
}

// ---------------------------------------------------------------
// Lump-sum prepayment calculator
// Returns: payoff year/month, total interest with lump sum,
// interest saved vs baseline, and yearly schedule with lump sums
// ---------------------------------------------------------------
export interface LumpSumResult {
  annualLumpSum: number;
  baselineInterest: number;       // total interest, no lump sum
  lumpSumInterest: number;        // total interest, with lump sums
  interestSaved: number;          // savings
  yearsToPayoff: number;          // actual years to payoff (may be < term)
  monthsToPayoff: number;         // fractional months within last year
  totalMonthsToPayoff: number;    // total calendar months
  schedule: LumpSumYear[];        // year-by-year breakdown
  baselineTotalPaid: number;
  lumpSumTotalPaid: number;
}

export interface LumpSumYear {
  year: number;
  principalPaid: number;
  interestPaid: number;
  lumpSumApplied: number;
  balance: number;
  cumulativeInterest: number;
}

export function calcLumpSumScenario(
  principal: number,
  annualRate: number,
  years: number,
  annualLumpSum: number
): LumpSumResult {
  const monthlyRate = annualRate / 12;
  const numPayments = years * 12;
  const regularPayment = calcPayment(principal, monthlyRate, numPayments);
  const baselineInterest = regularPayment * numPayments - principal;
  const baselineTotalPaid = regularPayment * numPayments;

  let balance = principal;
  let cumulativeInterest = 0;
  let totalPaid = 0;
  let totalMonthsToPayoff = 0;
  const schedule: LumpSumYear[] = [];

  for (let y = 1; y <= years; y++) {
    let yearPrincipal = 0;
    let yearInterest = 0;
    let monthsThisYear = 0;

    for (let m = 0; m < 12; m++) {
      if (balance <= 0.01) break;
      const interestThisMonth = balance * monthlyRate;
      const principalThisMonth = Math.min(regularPayment - interestThisMonth, balance);
      yearInterest += interestThisMonth;
      yearPrincipal += principalThisMonth;
      totalPaid += regularPayment;
      balance -= principalThisMonth;
      if (balance < 0.01) { balance = 0; monthsThisYear++; break; }
      monthsThisYear++;
    }

    totalMonthsToPayoff += monthsThisYear;

    // Apply annual lump sum at end of year (if still have balance)
    const lumpApplied = Math.min(annualLumpSum, balance);
    balance -= lumpApplied;
    totalPaid += lumpApplied;
    if (balance < 0.01) balance = 0;

    cumulativeInterest += yearInterest;

    schedule.push({
      year: y,
      principalPaid: yearPrincipal + lumpApplied,
      interestPaid: yearInterest,
      lumpSumApplied: lumpApplied,
      balance: Math.max(balance, 0),
      cumulativeInterest,
    });

    if (balance <= 0) break;
  }

  const lumpSumInterest = cumulativeInterest;
  const interestSaved = baselineInterest - lumpSumInterest;
  const yearsToPayoff = schedule[schedule.length - 1].year;
  const monthsRemainder = totalMonthsToPayoff % 12;

  return {
    annualLumpSum,
    baselineInterest,
    lumpSumInterest,
    interestSaved,
    yearsToPayoff,
    monthsToPayoff: monthsRemainder,
    totalMonthsToPayoff,
    schedule,
    baselineTotalPaid,
    lumpSumTotalPaid: totalPaid,
  };
}

// ---------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------
export function fmtCAD(value: number, compact = false): string {
  if (compact && Math.abs(value) >= 1000) {
    if (Math.abs(value) >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(2)}M`;
    }
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function fmtPct(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}
