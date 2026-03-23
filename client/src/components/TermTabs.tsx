import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScenarioResult, fmtCAD, fmtPct, Term, MortgageInputs, Decision } from "@/lib/mortgage";
import { TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface Props {
  scenarios: ScenarioResult[];
  selectedTerm: Term;
  onTermChange: (t: Term) => void;
  inputs: MortgageInputs;
}

function DecisionIcon({ decision }: { decision: Decision }) {
  if (decision === "Buy") return <TrendingUp size={13} className="text-emerald-500" />;
  if (decision === "Caution") return <Minus size={13} className="text-amber-500" />;
  return <TrendingDown size={13} className="text-red-500" />;
}

function DecisionCell({ decision }: { decision: Decision }) {
  const color =
    decision === "Buy" ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
    : decision === "Caution" ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
    : "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";

  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-semibold whitespace-nowrap", color)}>
      <DecisionIcon decision={decision} />
      {decision}
    </span>
  );
}

function RatioBar({ ratio, warnAt, dangerAt }: { ratio: number; warnAt: number; dangerAt: number }) {
  const pct = Math.min(ratio * 100, 100);
  const color = ratio > dangerAt ? "bg-red-500" : ratio > warnAt ? "bg-amber-400" : "bg-emerald-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="tabular-nums text-[11px] w-10 text-right font-medium">{fmtPct(ratio)}</span>
    </div>
  );
}

function TermContent({ scenarios, term }: { scenarios: ScenarioResult[]; term: Term }) {
  const scenarioColors = ["text-chart-1", "text-[hsl(var(--chart-2))]", "text-[hsl(var(--chart-3))]", "text-[hsl(var(--chart-4))]"];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse min-w-[700px]">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2.5 pr-3 font-semibold text-muted-foreground text-[11px] uppercase tracking-wider w-24">Scenario</th>
            <th className="text-right py-2.5 px-3 font-semibold text-muted-foreground text-[11px] uppercase tracking-wider whitespace-nowrap">Mortgage /mo</th>
            <th className="text-right py-2.5 px-3 font-semibold text-muted-foreground text-[11px] uppercase tracking-wider whitespace-nowrap">Total EMI /mo</th>
            <th className="text-right py-2.5 px-3 font-semibold text-muted-foreground text-[11px] uppercase tracking-wider whitespace-nowrap">
              <span className="flex items-center justify-end gap-1">
                EMI + Spending
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger><Info size={10} className="text-muted-foreground/60" /></TooltipTrigger>
                    <TooltipContent><p className="text-xs">Total EMI plus household spending per month</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </span>
            </th>
            <th className="text-right py-2.5 px-3 font-semibold text-muted-foreground text-[11px] uppercase tracking-wider whitespace-nowrap">In-Hand /mo</th>
            <th className="py-2.5 px-3 font-semibold text-muted-foreground text-[11px] uppercase tracking-wider w-36">Housing Ratio</th>
            <th className="py-2.5 px-3 font-semibold text-muted-foreground text-[11px] uppercase tracking-wider w-36">Total Ratio</th>
            <th className="text-center py-2.5 pl-3 font-semibold text-muted-foreground text-[11px] uppercase tracking-wider whitespace-nowrap w-28">Decision</th>
          </tr>
        </thead>
        <tbody>
          {scenarios.map((s, i) => {
            const tr = s.terms[term];
            return (
              <tr
                key={s.label}
                className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                data-testid={`row-scenario-${i}-term-${term}`}
              >
                <td className="py-3 pr-3">
                  <p className={cn("font-semibold", scenarioColors[i])}>{s.label}</p>
                  <p className="text-[10px] text-muted-foreground">{fmtCAD(s.downPaymentAmount, true)}</p>
                </td>
                <td className="py-3 px-3 text-right tabular-nums font-medium">
                  {fmtCAD(tr.monthlyEMI)}
                </td>
                <td className="py-3 px-3 text-right tabular-nums font-semibold">
                  {fmtCAD(tr.totalEMI)}
                </td>
                <td className="py-3 px-3 text-right tabular-nums">
                  {fmtCAD(tr.totalEMIWithSpending)}
                </td>
                <td className={cn("py-3 px-3 text-right tabular-nums font-semibold",
                  tr.inHandMonthly < 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
                )}>
                  {tr.inHandMonthly < 0 ? "-" : ""}{fmtCAD(Math.abs(tr.inHandMonthly))}
                </td>
                <td className="py-3 px-3">
                  <RatioBar ratio={tr.housingRatio} warnAt={0.35} dangerAt={0.40} />
                </td>
                <td className="py-3 px-3">
                  <RatioBar ratio={tr.totalRatio} warnAt={0.45} dangerAt={0.50} />
                </td>
                <td className="py-3 pl-3 text-center w-28">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <DecisionCell decision={tr.decision} />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">{tr.decisionExplanation}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-border/50">
        <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
          Housing ≤35% / Total ≤45% → Buy
        </p>
        <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
          Housing 35-40% or Total 45-50% → Caution
        </p>
        <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
          Housing &gt;40% or Total &gt;50% → Do not buy
        </p>
      </div>
    </div>
  );
}

export function TermTabs({ scenarios, selectedTerm, onTermChange, inputs }: Props) {
  return (
    <Tabs value={String(selectedTerm)} onValueChange={(v) => onTermChange(Number(v) as Term)}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment Analysis</h2>
        <TabsList className="h-7 bg-muted">
          <TabsTrigger value="25" className="text-xs h-6 px-3" data-testid="tab-25yr">25 Years</TabsTrigger>
          <TabsTrigger value="30" className="text-xs h-6 px-3" data-testid="tab-30yr">30 Years</TabsTrigger>
        </TabsList>
      </div>

      <div className="bg-card border border-card-border rounded-lg p-4">
        <TabsContent value="25" className="m-0">
          <TermContent scenarios={scenarios} term={25} />
        </TabsContent>
        <TabsContent value="30" className="m-0">
          <TermContent scenarios={scenarios} term={30} />
        </TabsContent>
      </div>
    </Tabs>
  );
}
