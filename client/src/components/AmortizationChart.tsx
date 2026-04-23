import { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, LineChart, Line, ReferenceLine
} from "recharts";
import { ScenarioResult, buildAmortizationSchedule, fmtCAD, Term } from "@/lib/mortgage";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface Props {
  scenarios: ScenarioResult[];
  annualRate: number;
}

const SCENARIO_COLORS = [
  { bar: "hsl(var(--chart-1))", line: "hsl(var(--chart-1))" },
  { bar: "hsl(var(--chart-2))", line: "hsl(var(--chart-2))" },
  { bar: "hsl(var(--chart-3))", line: "hsl(var(--chart-3))" },
  { bar: "hsl(var(--chart-4))", line: "hsl(var(--chart-4))" },
];

function fmtK(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string | number;
}

function ChartTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-popover-border rounded-lg p-3 shadow-md text-xs min-w-[160px]">
      <p className="font-semibold mb-1.5 text-popover-foreground">Year {label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex justify-between gap-4 mb-0.5">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-sm flex-shrink-0" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="tabular-nums font-semibold">{fmtCAD(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// Single scenario stacked bar chart
function SingleScenarioChart({ scenario, term }: { scenario: ScenarioResult; term: Term }) {
  const termResult = scenario.terms[term];
  const schedule = useMemo(
    () => buildAmortizationSchedule(termResult.insuredPrincipal, 0, term),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [termResult.insuredPrincipal, term]
  );

  // Need the actual rate from the scenario — pass via parent
  return null; // Placeholder
}

// Per-term content
function TermContent({ scenarios, annualRate, term }: { scenarios: ScenarioResult[]; annualRate: number; term: Term }) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const scenario = scenarios[selectedIdx];
  const termResult = scenario.terms[term];

  const schedule = useMemo(
    () => buildAmortizationSchedule(termResult.insuredPrincipal, annualRate, term),
    [termResult.insuredPrincipal, annualRate, term]
  );

  // Cumulative chart data
  const cumulativeData = schedule.map((y) => ({
    year: y.year,
    "Principal Paid": Math.round(y.cumulativePrincipal),
    "Interest Paid": Math.round(y.cumulativeInterest),
    "Remaining Balance": Math.round(y.balance),
  }));

  // Yearly breakdown data
  const yearlyData = schedule.map((y) => ({
    year: y.year,
    Principal: Math.round(y.principalPaid),
    Interest: Math.round(y.interestPaid),
  }));

  const totalInterest = Math.round(schedule[schedule.length - 1]?.cumulativeInterest ?? 0);
  const totalPrincipal = Math.round(termResult.insuredPrincipal);
  const interestRatio = totalInterest / (totalInterest + totalPrincipal);

  return (
    <div className="space-y-5">
      {/* Scenario selector */}
      <div className="flex gap-2 flex-wrap">
        {scenarios.map((s, i) => (
          <button
            key={s.label}
            onClick={() => setSelectedIdx(i)}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors",
              selectedIdx === i
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-border hover:bg-muted/50"
            )}
            data-testid={`amort-scenario-${i}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-muted/40 rounded-lg p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Loan Amount</p>
          <p className="tabular-nums font-bold text-sm">{fmtCAD(totalPrincipal, true)}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Total Interest</p>
          <p className="tabular-nums font-bold text-sm text-red-600 dark:text-red-400">{fmtCAD(totalInterest, true)}</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Interest %</p>
          <p className="tabular-nums font-bold text-sm text-blue-600 dark:text-blue-400">
            {(interestRatio * 100).toFixed(1)}% of total paid
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-5">
      {/* Stacked bar — yearly principal vs interest */}
      <div className="flex-1 w-full min-w-0">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Annual Principal vs Interest
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={yearlyData} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false} tickLine={false}
              label={{ value: "Year", position: "insideBottom", offset: -2, fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              tickFormatter={fmtK}
              tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false} tickLine={false} width={44}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.4)" }} />
            <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: 10, color: "hsl(var(--muted-foreground))" }} />
            <Bar dataKey="Interest" stackId="a" fill="hsl(var(--chart-4))" />
            <Bar dataKey="Principal" stackId="a" fill="hsl(var(--chart-1))" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Line chart — cumulative principal vs interest vs balance */}
      <div className="flex-1 w-full min-w-0">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Cumulative Over Time
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={cumulativeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              tickFormatter={fmtK}
              tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false} tickLine={false} width={44}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10, color: "hsl(var(--muted-foreground))" }} />
            <Line type="monotone" dataKey="Principal Paid" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Interest Paid" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={false} strokeDasharray="4 2" />
            <Line type="monotone" dataKey="Remaining Balance" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      </div>

      {/* The crossover point — when you've paid more principal than interest */}
      {(() => {
        const crossover = schedule.find((y) => y.cumulativePrincipal >= y.cumulativeInterest);
        if (!crossover) return null;
        return (
          <p className="text-[11px] text-muted-foreground bg-muted/40 rounded-md px-3 py-2">
            💡 By Year <span className="font-semibold text-foreground">{crossover.year}</span>, cumulative principal paid surpasses interest — you're building more equity than paying interest costs.
          </p>
        );
      })()}
    </div>
  );
}

export function AmortizationChart({ scenarios, annualRate }: Props) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Amortization Breakdown
        </h2>
      </div>

      <Tabs defaultValue="25">
        <div className="bg-card border border-card-border rounded-lg p-4">
          <TabsList className="h-7 bg-muted mb-4 w-full">
            <TabsTrigger value="25" className="text-xs h-6 flex-1">25 Years</TabsTrigger>
            <TabsTrigger value="30" className="text-xs h-6 flex-1">30 Years</TabsTrigger>
          </TabsList>
          <TabsContent value="25" className="m-0">
            <TermContent scenarios={scenarios} annualRate={annualRate} term={25} />
          </TabsContent>
          <TabsContent value="30" className="m-0">
            <TermContent scenarios={scenarios} annualRate={annualRate} term={30} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
