'use client';
import { Settings2, Sliders, Calculator, FileDown, Plus } from 'lucide-react';

const CORE_FIELDS = [
  { key: 'loanAmount', label: 'Loan Amount', prefix: '$', step: 1000 },
  { key: 'interestRate', label: 'Interest Rate', suffix: '%', step: 0.1 },
  { key: 'downPayment', label: 'Down Payment', prefix: '$', step: 500 },
  { key: 'propertyTaxes', label: 'Property Taxes / yr', prefix: '$', step: 100 },
  { key: 'homeInsurance', label: 'Home Insurance / yr', prefix: '$', step: 100 },
  { key: 'pmi', label: 'PMI Rate', suffix: '%', step: 0.05 },
  { key: 'hoaFees', label: 'HOA Fees / mo', prefix: '$', step: 10 },
  { key: 'extraMonthlyPayment', label: 'Extra Monthly Payment', prefix: '$', step: 50 },
];

export default function LoanInputPanel({
  inputs,
  customFields,
  onInputChange,
  onCalculate,
  onManageFields,
  onManageTerms,
  isCalculating,
}) {
  return (
    <div className="space-y-4 sticky top-24">
      {/* Core Inputs */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center">
            <Calculator size={14} className="text-indigo-400" />
          </div>
          <h2 className="text-sm font-bold text-slate-200" style={{ fontFamily: 'Syne, sans-serif' }}>
            Loan Details
          </h2>
        </div>

        <div className="space-y-4">
          {CORE_FIELDS.map((field) => (
            <div key={field.key}>
              <label className="input-label">{field.label}</label>
              <div className="relative">
                {field.prefix && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-mono">
                    {field.prefix}
                  </span>
                )}
                <input
                  type="number"
                  className="input-field"
                  style={{ paddingLeft: field.prefix ? '28px' : '14px', paddingRight: field.suffix ? '36px' : '14px' }}
                  value={inputs[field.key]}
                  onChange={(e) => onInputChange(field.key, e.target.value)}
                  step={field.step}
                  min={0}
                />
                {field.suffix && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-mono">
                    {field.suffix}
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* Custom fields */}
          {customFields.map((field) => (
            <div key={field._id}>
              <label className="input-label">
                {field.label}
                <span className="ml-1 badge badge-indigo text-[9px]">custom</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-mono">
                  {field.type === 'percentage' ? '%' : '$'}
                </span>
                <input
                  type="number"
                  className="input-field pl-7"
                  defaultValue={field.defaultValue}
                  onChange={(e) => {
                    field.value = parseFloat(e.target.value) || 0;
                  }}
                  min={0}
                />
              </div>
              {field.description && (
                <p className="text-[11px] text-slate-600 mt-1">{field.description}</p>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={onCalculate}
          disabled={isCalculating}
          className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
        >
          {isCalculating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Calculating...
            </>
          ) : (
            <>
              <Calculator size={16} />
              Calculate
            </>
          )}
        </button>
      </div>

      {/* Management buttons */}
      <div className="glass-card p-4 space-y-2">
        <p className="input-label mb-3">Manage</p>

        <button
          onClick={onManageFields}
          className="btn-secondary w-full flex items-center justify-center gap-2 text-sm"
        >
          <Settings2 size={14} />
          Manage Input Fields
        </button>

        <button
          onClick={onManageTerms}
          className="btn-secondary w-full flex items-center justify-center gap-2 text-sm"
        >
          <Sliders size={14} />
          Manage Loan Terms
        </button>
      </div>

      {/* Quick reference */}
      <div className="glass-card p-4">
        <p className="input-label mb-3">Quick Tips</p>
        <div className="space-y-2 text-xs text-slate-500">
          <p>• PMI typically required if down payment &lt; 20%</p>
          <p>• Extra payments reduce total interest significantly</p>
          <p>• Property tax varies by location (0.5%–2.5% annual)</p>
        </div>
      </div>
    </div>
  );
}
