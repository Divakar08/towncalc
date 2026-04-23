import { ScenarioResult, fmtCAD, fmtPct, Term, Decision } from "@/lib/mortgage";
import { Shield, ShieldOff, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  scenarios: ScenarioResult[];
  selectedTerm: Term;
}

function DecisionBadge({ decision }: { decision: Decision }) {
  if (decision === "Buy") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
        <TrendingUp size={9} />
        Buy
      </span>
    );
  }
  if (decision === "Caution") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        <Minus size={9} />
        Caution
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
      <TrendingDown size={9} />
      Do not buy
    </span>
  );
}

export function ScenarioCards({ scenarios, selectedTerm }: Props) {
  const colors = [
    "border-l-chart-1",
    "border-l-[hsl(var(--chart-2))]",
    "border-l-[hsl(var(--chart-3))]",
    "border-l-[hsl(var(--chart-4))]",
    "border-l-[hsl(var(--chart-5))]",
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
      {scenarios.map((s, i) => {
        const termResult = s.terms[selectedTerm];
        return (
          <div
            key={s.label}
            className={cn(
              "bg-card border border-card-border rounded-lg p-4 border-l-[3px]",
              colors[i]
            )}
            data-testid={`card-scenario-${i}`}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <p className="font-bold text-sm leading-tight">{s.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {fmtPct(s.downPaymentPercent, s.downPaymentPercent < 0.095 ? 2 : 0)} of value
                </p>
              </div>
              {s.isCMHC ? (
                <span title="CMHC insurance required" className="flex-shrink-0">
                  <Shield size={14} className="text-amber-500" />
                </span>
              ) : (
                <span title="No CMHC required" className="flex-shrink-0">
                  <ShieldOff size={14} className="text-emerald-500" />
                </span>
              )}
            </div>

            {/* Key figures */}
            <div className="space-y-1.5 mb-3">
              <div className="flex justify-between items-baseline">
                <span className="text-[11px] text-muted-foreground">Down payment</span>
                <span className="tabular-nums text-xs font-semibold">{fmtCAD(s.downPaymentAmount, true)}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-[11px] text-muted-foreground">Principal</span>
                <span className="tabular-nums text-xs font-semibold">{fmtCAD(termResult.insuredPrincipal, true)}</span>
              </div>
              {s.isCMHC && termResult.cmhcPremium > 0 && (
                <div className="flex justify-between items-baseline">
                  <span
                    className="text-[11px] text-muted-foreground border-b border-dashed border-muted-foreground/50 cursor-help"
                    title="Provincial Sales Tax (PST) may apply"
                  >
                    CMHC premium
                  </span>
                  <span className="tabular-nums text-[11px] text-amber-600 dark:text-amber-400">+{fmtCAD(termResult.cmhcPremium, true)}</span>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-border my-2.5" />

            {/* Monthly EMI */}
            <div className="mb-1">
              <p className="text-[10px] text-muted-foreground mb-0.5">{selectedTerm}-yr monthly total</p>
              <p className="tabular-nums text-base font-bold leading-tight">
                {fmtCAD(termResult.totalEMI)}
                <span className="text-[10px] font-normal text-muted-foreground ml-1">/mo</span>
              </p>
              <p className="text-[10px] text-muted-foreground tabular-nums">
                Mortgage: {fmtCAD(termResult.monthlyEMI)}/mo
              </p>
            </div>

            {/* Decision badge */}
            <div className="mt-2.5">
              <DecisionBadge decision={termResult.decision} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
