import { useState, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine
} from "recharts";
import { ScenarioResult, calcLumpSumScenario, fmtCAD, Term } from "@/lib/mortgage";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TrendingDown, Clock, DollarSign, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";

interface Props {
  scenarios: ScenarioResult[];
  annualRate: number;
}

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
    <div className="bg-popover border border-popover-border rounded-lg p-3 shadow-md text-xs min-w-[180px]">
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

function TermContent({
  scenarios,
  annualRate,
  term,
  lumpSum,
}: {
  scenarios: ScenarioResult[];
  annualRate: number;
  term: Term;
  lumpSum: number;
}) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const scenario = scenarios[selectedIdx];

  const result = useMemo(
    () => calcLumpSumScenario(scenario.insuredPrincipal, annualRate, term, lumpSum),
    [scenario.insuredPrincipal, annualRate, term, lumpSum]
  );

  const yearsSaved = term - result.yearsToPayoff;
  const monthsSaved = term * 12 - result.totalMonthsToPayoff;

  // Build chart comparing balance with vs without lump sum
  const noLumpResult = useMemo(
    () => calcLumpSumScenario(scenario.insuredPrincipal, annualRate, term, 0),
    [scenario.insuredPrincipal, annualRate, term]
  );

  // Merge data up to baseline term
  const chartData = Array.from({ length: term }, (_, i) => {
    const year = i + 1;
    const noLump = noLumpResult.schedule.find((s) => s.year === year);
    const withLump = result.schedule.find((s) => s.year === year);
    return {
      year,
      "No Lump Sum": noLump ? Math.round(noLump.balance) : 0,
      "With Lump Sum": withLump ? Math.round(withLump.balance) : 0,
    };
  });

  // Interest comparison chart
  const interestCompData = Array.from({ length: term }, (_, i) => {
    const year = i + 1;
    const noLump = noLumpResult.schedule.find((s) => s.year === year);
    const withLump = result.schedule.find((s) => s.year === year);
    return {
      year,
      "No Lump Sum": noLump ? Math.round(noLump.cumulativeInterest) : (noLumpResult.schedule[noLumpResult.schedule.length - 1]?.cumulativeInterest ?? 0),
      "With Lump Sum": withLump ? Math.round(withLump.cumulativeInterest) : (result.schedule[result.schedule.length - 1]?.cumulativeInterest ?? 0),
    };
  });

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
                : "border-border text-muted-foreground hover:bg-muted/50"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <DollarSign size={12} className="text-emerald-600 dark:text-emerald-400" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Interest Saved</p>
          </div>
          <p className="tabular-nums font-bold text-base text-emerald-600 dark:text-emerald-400">
            {lumpSum > 0 ? fmtCAD(result.interestSaved, true) : "—"}
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock size={12} className="text-blue-600 dark:text-blue-400" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Time Saved</p>
          </div>
          <p className="tabular-nums font-bold text-base text-blue-600 dark:text-blue-400">
            {lumpSum > 0 && yearsSaved > 0
              ? `${yearsSaved}y ${monthsSaved % 12}mo`
              : lumpSum > 0 && monthsSaved > 0
              ? `${monthsSaved} mo`
              : "—"}
          </p>
        </div>

        <div className="bg-muted/50 border border-border rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap size={12} className="text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Paid Off By</p>
          </div>
          <p className="tabular-nums font-bold text-base">
            {lumpSum > 0 ? `Year ${result.yearsToPayoff}` : `Year ${term}`}
          </p>
        </div>

        <div className="bg-muted/50 border border-border rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingDown size={12} className="text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Interest</p>
          </div>
          <p className="tabular-nums font-bold text-base">
            {fmtCAD(result.lumpSumInterest, true)}
          </p>
          {lumpSum > 0 && (
            <p className="text-[10px] text-muted-foreground tabular-nums">
              vs {fmtCAD(result.baselineInterest, true)} baseline
            </p>
          )}
        </div>
      </div>

      {/* Remaining balance comparison */}
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Remaining Balance Over Time
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="gradNoLump" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0.03} />
              </linearGradient>
              <linearGradient id="gradWithLump" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0.03} />
              </linearGradient>
            </defs>
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
            <Area
              type="monotone"
              dataKey="No Lump Sum"
              stroke="hsl(var(--chart-4))"
              fill="url(#gradNoLump)"
              strokeWidth={2}
              dot={false}
            />
            {lumpSum > 0 && (
              <Area
                type="monotone"
                dataKey="With Lump Sum"
                stroke="hsl(var(--chart-3))"
                fill="url(#gradWithLump)"
                strokeWidth={2}
                dot={false}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Cumulative interest comparison */}
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Cumulative Interest Paid
        </p>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={interestCompData}>
            <defs>
              <linearGradient id="gradIntNoLump" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.25} />
                <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradIntWithLump" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmtK} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={44} />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10, color: "hsl(var(--muted-foreground))" }} />
            <Area type="monotone" dataKey="No Lump Sum" stroke="hsl(var(--chart-4))" fill="url(#gradIntNoLump)" strokeWidth={2} dot={false} />
            {lumpSum > 0 && (
              <Area type="monotone" dataKey="With Lump Sum" stroke="hsl(var(--chart-3))" fill="url(#gradIntWithLump)" strokeWidth={2} dot={false} />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Year-by-year lump sum impact table (compact) */}
      {lumpSum > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Year-by-Year Impact</p>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] border-collapse min-w-[400px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left pb-1.5 font-medium text-muted-foreground pr-3">Year</th>
                  <th className="text-right pb-1.5 font-medium text-muted-foreground px-2">Interest Paid</th>
                  <th className="text-right pb-1.5 font-medium text-muted-foreground px-2">Regular Principal</th>
                  <th className="text-right pb-1.5 font-medium text-muted-foreground px-2">Lump Sum</th>
                  <th className="text-right pb-1.5 font-medium text-muted-foreground pl-2">Balance</th>
                </tr>
              </thead>
              <tbody>
                {result.schedule.slice(0, 10).map((row) => (
                  <tr key={row.year} className="border-b border-border/40 hover:bg-muted/30">
                    <td className="py-1.5 pr-3 font-medium">{row.year}</td>
                    <td className="py-1.5 px-2 text-right tabular-nums text-red-600 dark:text-red-400">{fmtCAD(row.interestPaid)}</td>
                    <td className="py-1.5 px-2 text-right tabular-nums">{fmtCAD(row.principalPaid - row.lumpSumApplied)}</td>
                    <td className="py-1.5 px-2 text-right tabular-nums text-emerald-600 dark:text-emerald-400 font-semibold">
                      {row.lumpSumApplied > 0 ? fmtCAD(row.lumpSumApplied) : "—"}
                    </td>
                    <td className="py-1.5 pl-2 text-right tabular-nums">{fmtCAD(row.balance)}</td>
                  </tr>
                ))}
                {result.schedule.length > 10 && (
                  <tr>
                    <td colSpan={5} className="py-1.5 text-center text-muted-foreground text-[10px]">
                      … {result.schedule.length - 10} more years until payoff
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export function LumpSumCalculator({ scenarios, annualRate }: Props) {
  const [lumpSum, setLumpSum] = useState(5000);
  const [inputValue, setInputValue] = useState("5000");

  const handleInputChange = (v: string) => {
    setInputValue(v);
    const n = Number(v);
    if (!isNaN(n) && n >= 0) setLumpSum(n);
  };

  const maxSlider = 50000;

  return (
    <div>
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <TrendingDown size={12} />
        Annual Lump-Sum Prepayment
      </h2>

      <div className="bg-card border border-card-border rounded-lg p-4 space-y-5">
        {/* Lump sum input */}
        <div>
          <Label className="text-xs font-semibold mb-2 block">Annual Extra Payment</Label>
          <div className="flex items-center gap-3 mb-3">
            <div className="relative flex items-center flex-1">
              <span className="absolute left-2.5 text-muted-foreground text-xs pointer-events-none">$</span>
              <Input
                type="number"
                value={inputValue}
                min={0}
                max={maxSlider}
                step={500}
                onChange={(e) => handleInputChange(e.target.value)}
                className="pl-6 h-9 text-sm font-semibold tabular-nums"
                data-testid="input-lumpsum"
              />
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">/year</span>
          </div>
          <Slider
            value={[Math.min(lumpSum, maxSlider)]}
            min={0}
            max={maxSlider}
            step={500}
            onValueChange={([v]) => { setLumpSum(v); setInputValue(String(v)); }}
            className="w-full"
            data-testid="slider-lumpsum"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>$0</span>
            <span>$50K</span>
          </div>
        </div>

        {/* Tabs for term */}
        <Tabs defaultValue="25">
          <TabsList className="h-7 bg-muted w-full">
            <TabsTrigger value="25" className="text-xs h-6 flex-1">25 Years</TabsTrigger>
            <TabsTrigger value="30" className="text-xs h-6 flex-1">30 Years</TabsTrigger>
          </TabsList>
          <TabsContent value="25" className="m-0 mt-4">
            <TermContent scenarios={scenarios} annualRate={annualRate} term={25} lumpSum={lumpSum} />
          </TabsContent>
          <TabsContent value="30" className="m-0 mt-4">
            <TermContent scenarios={scenarios} annualRate={annualRate} term={30} lumpSum={lumpSum} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
