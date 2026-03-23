import { useState } from "react";
import { ScenarioResult, fmtCAD, Term } from "@/lib/mortgage";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TrendingDown, Calendar } from "lucide-react";

interface Props {
  scenarios: ScenarioResult[];
}

const SCENARIO_COLORS = [
  { monthly: "hsl(var(--chart-1))", biweekly: "hsl(var(--chart-1) / 0.5)" },
  { monthly: "hsl(var(--chart-2))", biweekly: "hsl(var(--chart-2) / 0.5)" },
  { monthly: "hsl(var(--chart-3))", biweekly: "hsl(var(--chart-3) / 0.5)" },
  { monthly: "hsl(var(--chart-4))", biweekly: "hsl(var(--chart-4) / 0.5)" },
];

// Short label formatter for Y axis
function fmtK(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-popover-border rounded-lg p-3 shadow-md text-xs">
      <p className="font-semibold mb-1.5 text-popover-foreground">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex justify-between gap-4 mb-0.5">
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="tabular-nums font-semibold">{fmtCAD(p.value)}</span>
        </div>
      ))}
      {payload.length === 2 && (
        <div className="mt-1.5 pt-1.5 border-t border-border">
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
            Save {fmtCAD(payload[0].value - payload[1].value)} with bi-weekly
          </span>
        </div>
      )}
    </div>
  );
}

function TermChartContent({ scenarios, term }: { scenarios: ScenarioResult[]; term: Term }) {
  const data = scenarios.map((s) => ({
    name: s.label,
    Monthly: Math.round(s.terms[term].monthly.totalInterest),
    "Bi-weekly": Math.round(s.terms[term].biweekly.totalInterest),
  }));

  // Best scenario: most savings (20% down, 25 years typically)
  const bestSavings = scenarios.reduce((best, s) => {
    const savings = s.terms[term].interestSavings;
    return savings > best.savings ? { label: s.label, savings } : best;
  }, { label: "", savings: 0 });

  return (
    <div>
      {/* Savings highlight */}
      {bestSavings.savings > 0 && (
        <div className="flex items-start gap-2 p-3 mb-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
          <TrendingDown size={14} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 leading-relaxed">
            Switching to bi-weekly for <span className="font-bold">{term} years</span> at{" "}
            <span className="font-bold">{bestSavings.label}</span> saves{" "}
            <span className="font-bold tabular-nums">{fmtCAD(bestSavings.savings)}</span> in interest.
          </p>
        </div>
      )}

      {/* Bar chart */}
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barGap={2} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={fmtK}
            tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.4)" }} />
          <Legend
            iconType="square"
            iconSize={8}
            wrapperStyle={{ fontSize: 10, color: "hsl(var(--muted-foreground))" }}
          />
          <Bar dataKey="Monthly" fill="hsl(var(--chart-1))" radius={[3, 3, 0, 0]} />
          <Bar dataKey="Bi-weekly" fill="hsl(var(--chart-3))" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* Per-scenario breakdown */}
      <div className="mt-3 space-y-2">
        {scenarios.map((s, i) => {
          const tr = s.terms[term];
          return (
            <div key={s.label} className="flex items-center gap-2 text-[11px]">
              <div
                className="w-2 h-2 rounded-sm flex-shrink-0"
                style={{ background: `hsl(var(--chart-${i + 1}))` }}
              />
              <span className="text-muted-foreground flex-1 truncate">{s.label}</span>
              <span className="tabular-nums text-emerald-600 dark:text-emerald-400 font-semibold">
                Save {fmtCAD(tr.interestSavings, true)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Payment comparison mini table */}
      <div className="mt-4 pt-3 border-t border-border">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Bi-weekly vs Monthly</p>
        <table className="w-full text-[11px] border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left pb-1.5 font-medium text-muted-foreground">Scenario</th>
              <th className="text-right pb-1.5 font-medium text-muted-foreground">Monthly equiv.</th>
              <th className="text-right pb-1.5 font-medium text-muted-foreground">Bi-wkly</th>
            </tr>
          </thead>
          <tbody>
            {scenarios.map((s) => {
              const tr = s.terms[term];
              return (
                <tr key={s.label} className="border-b border-border/40">
                  <td className="py-1.5 pr-2 text-muted-foreground">{s.label}</td>
                  <td className="py-1.5 px-1 text-right tabular-nums">{fmtCAD(tr.monthly.monthlyEquivalent)}</td>
                  <td className="py-1.5 pl-1 text-right tabular-nums font-medium">{fmtCAD(tr.biweekly.payment)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function BiWeeklyPanel({ scenarios }: Props) {
  return (
    <div>
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <Calendar size={12} />
        Bi-weekly vs Monthly Interest
      </h2>

      <Tabs defaultValue="25">
        <div className="bg-card border border-card-border rounded-lg p-4">
          <TabsList className="h-7 bg-muted mb-4 w-full">
            <TabsTrigger value="25" className="text-xs h-6 flex-1" data-testid="biweekly-tab-25yr">25 Years</TabsTrigger>
            <TabsTrigger value="30" className="text-xs h-6 flex-1" data-testid="biweekly-tab-30yr">30 Years</TabsTrigger>
          </TabsList>

          <TabsContent value="25" className="m-0">
            <TermChartContent scenarios={scenarios} term={25} />
          </TabsContent>
          <TabsContent value="30" className="m-0">
            <TermChartContent scenarios={scenarios} term={30} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
