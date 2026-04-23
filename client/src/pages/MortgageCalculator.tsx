import { useState, useMemo, useEffect } from "react";
import { computeScenarios, MortgageInputs, ScenarioResult, fmtCAD, fmtPct, Term } from "@/lib/mortgage";
import { InputSidebar } from "@/components/InputSidebar";
import { ScenarioCards } from "@/components/ScenarioCards";
import { TermTabs } from "@/components/TermTabs";
import { BiWeeklyPanel } from "@/components/BiWeeklyPanel";
import { AmortizationChart } from "@/components/AmortizationChart";
import { LumpSumCalculator } from "@/components/LumpSumCalculator";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";
import { Moon, Sun, Home } from "lucide-react";

const DEFAULT_INPUTS: MortgageInputs = {
  propertyValue: 850_000,
  annualRate: 0.055,
  strataMonthly: 450,
  propertyTaxMonthly: 350,
  homeInsuranceMonthly: 120,
  postTaxIncomeMonthly: 12_000,
  householdSpendingMonthly: 3_500,
  customDownPayment: 12,
  customDownPaymentType: "percent",
};

export default function MortgageCalculator() {
  const [inputs, setInputs] = useState<MortgageInputs>(DEFAULT_INPUTS);
  const [pendingInputs, setPendingInputs] = useState<MortgageInputs>(DEFAULT_INPUTS);
  const [selectedTerm, setSelectedTerm] = useState<Term>(25);
  const [darkMode, setDarkMode] = useState(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const scenarios: ScenarioResult[] = useMemo(() => computeScenarios(inputs), [inputs]);

  const handleRecalculate = () => {
    setInputs({ ...pendingInputs });
  };

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-background text-foreground">
      {/* ── Left Sidebar ── */}
      <aside className="w-full md:w-72 md:min-w-[270px] flex-shrink-0 bg-sidebar text-sidebar-foreground border-b md:border-b-0 md:border-r border-sidebar-border overflow-y-auto flex flex-col max-h-[50vh] md:max-h-full">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-sidebar-border flex items-center gap-3">
          <div className="w-8 h-8 flex-shrink-0">
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Townhouse logo" className="w-full h-full">
              <rect x="4" y="14" width="24" height="16" rx="1" fill="hsl(var(--sidebar-primary))" fillOpacity="0.15"/>
              <path d="M2 16 L16 4 L30 16" stroke="hsl(var(--sidebar-primary))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <rect x="9" y="20" width="5" height="10" rx="0.5" fill="hsl(var(--sidebar-primary))" fillOpacity="0.8"/>
              <rect x="18" y="20" width="5" height="6" rx="0.5" fill="hsl(var(--sidebar-primary))" fillOpacity="0.5"/>
            </svg>
          </div>
          <div>
            <p className="font-bold text-sm text-sidebar-foreground leading-tight">TownCalc</p>
            <p className="text-xs text-sidebar-foreground/50 leading-tight">Canadian Mortgage Planner</p>
          </div>
          <button
            onClick={toggleDark}
            className="ml-auto p-1.5 rounded-md hover:bg-sidebar-accent transition-colors text-sidebar-foreground/60 hover:text-sidebar-foreground"
            aria-label="Toggle dark mode"
            data-testid="toggle-darkmode"
          >
            {darkMode ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>

        <div className="flex-1">
          <InputSidebar
            inputs={pendingInputs}
            onChange={setPendingInputs}
            onRecalculate={handleRecalculate}
          />
        </div>

        <div className="px-5 py-3 border-t border-sidebar-border">
          <PerplexityAttribution />
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-6 py-3 flex items-center gap-3">
          <Home size={16} className="text-muted-foreground flex-shrink-0" />
          <div>
            <h1 className="font-bold text-base leading-tight">Townhouse Affordability Calculator</h1>
            <p className="text-xs text-muted-foreground">
              Property value: {fmtCAD(inputs.propertyValue)} · Rate: {fmtPct(inputs.annualRate)} · Income: {fmtCAD(inputs.postTaxIncomeMonthly)}/mo
            </p>
          </div>
        </header>

        <div className="p-4 md:p-6 flex flex-col gap-6 min-w-0">
          {/* Down-payment scenario cards */}
          <section>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Down Payment Scenarios</h2>
            <ScenarioCards scenarios={scenarios} selectedTerm={selectedTerm} />
          </section>

          <div className="flex flex-col lg:flex-row gap-6 items-start min-w-0">
            <div className="flex flex-col gap-6 w-full lg:flex-1 min-w-0">
              {/* Payment analysis tabs */}
              <section className="w-full min-w-0">
                <TermTabs
                  scenarios={scenarios}
                  selectedTerm={selectedTerm}
                  onTermChange={setSelectedTerm}
                  inputs={inputs}
                />
              </section>

              {/* Amortization breakdown */}
              <section className="w-full min-w-0">
                <AmortizationChart scenarios={scenarios} annualRate={inputs.annualRate} />
              </section>
            </div>

            <div className="flex flex-col gap-6 w-full lg:w-[360px] xl:w-[420px] flex-shrink-0">
              {/* Bi-weekly panel */}
              <section className="w-full">
                <BiWeeklyPanel scenarios={scenarios} />
              </section>

              {/* Lump-sum calculator */}
              <section className="w-full">
                <LumpSumCalculator scenarios={scenarios} annualRate={inputs.annualRate} />
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
