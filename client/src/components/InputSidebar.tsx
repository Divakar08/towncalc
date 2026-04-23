import React, { useState, useEffect } from "react";
import { MortgageInputs } from "@/lib/mortgage";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RefreshCw, Building2 } from "lucide-react";

interface Props {
  inputs: MortgageInputs;
  onChange: (inputs: MortgageInputs) => void;
  onRecalculate: () => void;
}

function FieldGroup({ title }: { title: string }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40 mt-5 mb-2 px-5">
      {title}
    </p>
  );
}

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
  min?: number;
  testId?: string;
  hint?: string;
}

function NumberField({ label, value, onChange, prefix, suffix, step = 1, min = 0, testId, hint }: NumberFieldProps) {
  const [localValue, setLocalValue] = useState(value.toString());

  useEffect(() => {
    setLocalValue(value.toString());
  }, [value]);

  const handleBlur = () => {
    const num = Number(localValue);
    if (!isNaN(num)) {
      onChange(num);
      setLocalValue(num.toString()); // Reformat based on valid number
    } else {
      setLocalValue(value.toString()); // Revert if invalid
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleBlur();
    }
  };

  return (
    <div className="px-5 mb-3">
      <Label className="text-sidebar-foreground/70 text-xs mb-1.5 block">{label}</Label>
      {hint && <p className="text-[10px] text-sidebar-foreground/40 mb-1 leading-tight">{hint}</p>}
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-2.5 text-sidebar-foreground/50 text-xs pointer-events-none select-none">
            {prefix}
          </span>
        )}
        <Input
          type="number"
          value={localValue}
          step={step}
          min={min}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`h-8 text-xs bg-sidebar-accent/30 border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/30 focus-visible:ring-sidebar-primary ${prefix ? "pl-6" : ""} ${suffix ? "pr-10" : ""}`}
          data-testid={testId}
        />
        {suffix && (
          <span className="absolute right-2.5 text-sidebar-foreground/50 text-xs pointer-events-none select-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function RateField({ label, value, onChange, testId }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  testId?: string;
}) {
  const [localValue, setLocalValue] = useState((value * 100).toFixed(2));

  useEffect(() => {
    setLocalValue((value * 100).toFixed(2));
  }, [value]);

  const handleBlur = () => {
    const num = Number(localValue);
    if (!isNaN(num)) {
      onChange(num / 100);
      setLocalValue(num.toFixed(2)); // Reformat based on valid number
    } else {
      setLocalValue((value * 100).toFixed(2)); // Revert if invalid
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleBlur();
    }
  };

  return (
    <div className="px-5 mb-3">
      <Label className="text-sidebar-foreground/70 text-xs mb-1.5 block">{label}</Label>
      <div className="relative flex items-center">
        <Input
          type="number"
          value={localValue}
          step={0.05}
          min={0}
          max={25}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="h-8 text-xs bg-sidebar-accent/30 border-sidebar-border text-sidebar-foreground focus-visible:ring-sidebar-primary pr-8"
          data-testid={testId}
        />
        <span className="absolute right-2.5 text-sidebar-foreground/50 text-xs pointer-events-none select-none">%</span>
      </div>
    </div>
  );
}

function CustomDownPaymentField({ label, value, mode, onChangeValue, onChangeMode, testId }: {
  label: string;
  value: number;
  mode: "percent" | "dollar";
  onChangeValue: (v: number) => void;
  onChangeMode: (m: "percent" | "dollar") => void;
  testId?: string;
}) {
  const [localValue, setLocalValue] = useState(value.toString());

  useEffect(() => {
    setLocalValue(value.toString());
  }, [value]);

  const handleBlur = () => {
    const num = Number(localValue);
    if (!isNaN(num)) {
      onChangeValue(num);
      setLocalValue(num.toString());
    } else {
      setLocalValue(value.toString());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleBlur();
    }
  };

  return (
    <div className="px-5 mb-3">
      <div className="flex justify-between items-end mb-1.5">
        <Label className="text-sidebar-foreground/70 text-xs">{label}</Label>
        <div className="flex items-center gap-1 bg-sidebar-accent/30 rounded p-0.5 border border-sidebar-border">
          <button
            type="button"
            className={`px-2 py-0.5 text-[10px] rounded ${mode === 'percent' ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium' : 'text-sidebar-foreground/50 hover:text-sidebar-foreground'}`}
            onClick={() => onChangeMode('percent')}
          >
            %
          </button>
          <button
            type="button"
            className={`px-2 py-0.5 text-[10px] rounded ${mode === 'dollar' ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium' : 'text-sidebar-foreground/50 hover:text-sidebar-foreground'}`}
            onClick={() => onChangeMode('dollar')}
          >
            $
          </button>
        </div>
      </div>
      <div className="relative flex items-center">
        {mode === 'dollar' && (
          <span className="absolute left-2.5 text-sidebar-foreground/50 text-xs pointer-events-none select-none">
            $
          </span>
        )}
        <Input
          type="number"
          value={localValue}
          step={mode === 'percent' ? 1 : 1000}
          min={0}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`h-8 text-xs bg-sidebar-accent/30 border-sidebar-border text-sidebar-foreground focus-visible:ring-sidebar-primary ${mode === 'dollar' ? "pl-6" : ""} ${mode === 'percent' ? "pr-8" : ""}`}
          data-testid={testId}
        />
        {mode === 'percent' && (
          <span className="absolute right-2.5 text-sidebar-foreground/50 text-xs pointer-events-none select-none">
            %
          </span>
        )}
      </div>
    </div>
  );
}

export function InputSidebar({ inputs, onChange, onRecalculate }: Props) {
  const set = (key: keyof MortgageInputs) => (v: number) =>
    onChange({ ...inputs, [key]: v });

  return (
    <div className="pt-2 pb-4">
      {/* Property Type — read only */}
      <div className="px-5 mt-3 mb-1">
        <Label className="text-sidebar-foreground/70 text-xs mb-1.5 block">Property Type</Label>
        <div className="h-8 flex items-center gap-2 px-2.5 rounded-md border border-sidebar-border bg-sidebar-accent/20 text-sidebar-foreground/50 text-xs">
          <Building2 size={13} />
          <span>Townhouse</span>
          <span className="ml-auto text-[10px] bg-sidebar-primary/20 text-sidebar-primary rounded px-1.5 py-0.5 font-medium">Fixed</span>
        </div>
      </div>

      <FieldGroup title="Property" />
      <NumberField
        label="Property Value"
        value={inputs.propertyValue}
        onChange={set("propertyValue")}
        prefix="$"
        step={5000}
        testId="input-property-value"
        hint="Total purchase price"
      />
      <RateField
        label="Annual Mortgage Rate"
        value={inputs.annualRate}
        onChange={set("annualRate")}
        testId="input-mortgage-rate"
      />
      <CustomDownPaymentField
        label="Custom Down Payment"
        value={inputs.customDownPaymentValue ?? 20}
        mode={inputs.customDownPaymentMode ?? "percent"}
        onChangeValue={set("customDownPaymentValue")}
        onChangeMode={(mode) => onChange({ ...inputs, customDownPaymentMode: mode as "percent" | "dollar" })}
        testId="input-custom-down"
      />

      <FieldGroup title="Monthly Costs" />
      <NumberField
        label="Strata / HOA Fees"
        value={inputs.strataMonthly}
        onChange={set("strataMonthly")}
        prefix="$"
        suffix="/mo"
        testId="input-strata"
      />
      <NumberField
        label="Property Tax"
        value={inputs.propertyTaxMonthly}
        onChange={set("propertyTaxMonthly")}
        prefix="$"
        suffix="/mo"
        testId="input-property-tax"
      />
      <NumberField
        label="Home Insurance"
        value={inputs.homeInsuranceMonthly}
        onChange={set("homeInsuranceMonthly")}
        prefix="$"
        suffix="/mo"
        testId="input-insurance"
      />

      <FieldGroup title="Income & Spending" />
      <NumberField
        label="Post-Tax Family Income"
        value={inputs.postTaxIncomeMonthly}
        onChange={set("postTaxIncomeMonthly")}
        prefix="$"
        suffix="/mo"
        testId="input-income"
      />
      <NumberField
        label="Household Spending"
        value={inputs.householdSpendingMonthly}
        onChange={set("householdSpendingMonthly")}
        prefix="$"
        suffix="/mo"
        hint="Excl. mortgage, strata, tax, insurance"
        testId="input-spending"
      />

      {/* Recalculate button */}
      <div className="px-5 mt-5">
        <Button
          onClick={onRecalculate}
          className="w-full h-9 text-xs font-semibold gap-2 bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
          data-testid="button-recalculate"
        >
          <RefreshCw size={13} />
          Recalculate
        </Button>
      </div>
    </div>
  );
}
