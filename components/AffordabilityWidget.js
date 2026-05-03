"use client";
import { useState } from "react";
import { formatCurrency, getAffordabilityRating } from "@/lib/mortgage";
import { TrendingUp, AlertTriangle, CheckCircle, Info } from "lucide-react";
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  PolarAngleAxis,
} from "recharts";

export default function AffordabilityWidget({ result, inputs }) {
  const [annualIncome, setAnnualIncome] = useState(120000);
  const [monthlyDebts, setMonthlyDebts] = useState(500);
  const [creditScore, setCreditScore] = useState(720);

  const monthlyIncome = annualIncome / 12;
  const housingRatio = (result.monthlyPayment / monthlyIncome) * 100;
  const totalDebtRatio =
    ((result.monthlyPayment + monthlyDebts) / monthlyIncome) * 100;
  const rating = getAffordabilityRating(result.monthlyPayment, annualIncome);

  const ratingColors = {
    green: {
      text: "text-emerald-400",
      bg: "bg-emerald-500/15",
      border: "border-emerald-500/20",
      icon: CheckCircle,
    },
    blue: {
      text: "text-blue-400",
      bg: "bg-blue-500/15",
      border: "border-blue-500/20",
      icon: Info,
    },
    yellow: {
      text: "text-amber-400",
      bg: "bg-amber-500/15",
      border: "border-amber-500/20",
      icon: AlertTriangle,
    },
    red: {
      text: "text-red-400",
      bg: "bg-red-500/15",
      border: "border-red-500/20",
      icon: AlertTriangle,
    },
  };

  const rc = ratingColors[rating.color];
  const RatingIcon = rc.icon;

  // Max affordable loan at 28% rule
  const maxMonthlyHousing = monthlyIncome * 0.28;
  const affordableMonthly = Math.max(
    0,
    maxMonthlyHousing - (result.monthlyPayment - result.monthlyPI),
  );

  const gaugeData = [{ value: Math.min(housingRatio, 100) }];

  const getCreditRating = (score) => {
    if (score >= 800)
      return { label: "Exceptional", color: "text-emerald-400" };
    if (score >= 740) return { label: "Very Good", color: "text-blue-400" };
    if (score >= 670) return { label: "Good", color: "text-indigo-400" };
    if (score >= 580) return { label: "Fair", color: "text-amber-400" };
    return { label: "Poor", color: "text-red-400" };
  };

  const creditRating = getCreditRating(creditScore);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Inputs */}
      <div className="glass-card p-6">
        <h3
          className="text-sm font-bold text-slate-300 mb-5"
          style={{ fontFamily: "Syne, sans-serif" }}
        >
          Affordability Analysis
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="input-label">Annual Income</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm">
                $
              </span>
              <input
                type="number"
                className="input-field pl-7"
                value={annualIncome}
                onChange={(e) =>
                  setAnnualIncome(parseFloat(e.target.value) || 0)
                }
              />
            </div>
          </div>
          <div>
            <label className="input-label">Other Monthly Debts</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm">
                $
              </span>
              <input
                type="number"
                className="input-field pl-7"
                value={monthlyDebts}
                onChange={(e) =>
                  setMonthlyDebts(parseFloat(e.target.value) || 0)
                }
              />
            </div>
          </div>
          <div>
            <label className="input-label">Credit Score</label>
            <input
              type="number"
              className="input-field"
              value={creditScore}
              onChange={(e) => setCreditScore(parseInt(e.target.value) || 0)}
              min={300}
              max={850}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gauge */}
        <div className="glass-card p-6">
          <h4
            className="text-xs font-bold text-slate-400 mb-4"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            HOUSING COST RATIO
          </h4>
          <div className="flex items-center gap-6">
            <div style={{ width: 160, height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="100%"
                  startAngle={180}
                  endAngle={0}
                  data={gaugeData}
                >
                  <PolarAngleAxis
                    type="number"
                    domain={[0, 100]}
                    angleAxisId={0}
                    tick={false}
                  />
                  <RadialBar
                    background={{ fill: "#1e293b" }}
                    dataKey="value"
                    cornerRadius={8}
                    fill={
                      housingRatio < 28
                        ? "#10b981"
                        : housingRatio < 36
                          ? "#6366f1"
                          : housingRatio < 43
                            ? "#f59e0b"
                            : "#ef4444"
                    }
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <div
                className="text-4xl font-bold text-slate-100 mb-1"
                style={{ fontFamily: "Syne, sans-serif" }}
              >
                {housingRatio.toFixed(1)}%
              </div>
              <div className="text-xs text-slate-500 mb-3">
                of monthly income
              </div>
              <div
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${rc.bg} ${rc.border} border`}
              >
                <RatingIcon size={13} className={rc.text} />
                <span
                  className={`text-xs font-bold ${rc.text}`}
                  style={{ fontFamily: "Syne, sans-serif" }}
                >
                  {rating.rating}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-2 max-w-[140px]">
                {rating.message}
              </p>
            </div>
          </div>
        </div>

        {/* DTI Breakdown */}
        <div className="glass-card p-6">
          <h4
            className="text-xs font-bold text-slate-400 mb-5"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            DEBT-TO-INCOME ANALYSIS
          </h4>
          <div className="space-y-4">
            {[
              {
                label: "Housing Ratio",
                value: housingRatio,
                limit: 28,
                color: "#6366f1",
              },
              {
                label: "Total DTI",
                value: totalDebtRatio,
                limit: 43,
                color: "#10b981",
              },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span
                    className="text-slate-400"
                    style={{ fontFamily: "Syne, sans-serif" }}
                  >
                    {item.label}
                  </span>
                  <span className="font-mono text-slate-300">
                    {item.value.toFixed(1)}% / {item.limit}% max
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min((item.value / item.limit) * 100, 100)}%`,
                      background:
                        item.value <= item.limit ? item.color : "#ef4444",
                    }}
                  />
                </div>
              </div>
            ))}

            <div className="pt-2 border-t border-white/[0.06] space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Monthly Income</span>
                <span className="font-mono text-slate-300">
                  {formatCurrency(monthlyIncome)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Max Housing (28%)</span>
                <span className="font-mono text-emerald-400">
                  {formatCurrency(maxMonthlyHousing)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Your Payment</span>
                <span
                  className={`font-mono ${result.monthlyPayment <= maxMonthlyHousing ? "text-emerald-400" : "text-red-400"}`}
                >
                  {formatCurrency(result.monthlyPayment)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Credit impact + recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h4
            className="text-xs font-bold text-slate-400 mb-4"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            CREDIT SCORE IMPACT
          </h4>
          <div className="flex items-center gap-4 mb-4">
            <div
              style={{
                fontFamily: "Syne, sans-serif",
                color: creditRating.color
                  .replace("text-", "")
                  .includes("emerald")
                  ? "#34d399"
                  : undefined,
              }}
              className={`text-5xl font-bold ${creditRating.color}`}
            >
              {creditScore}
            </div>
            <div>
              <div
                className={`font-bold text-lg ${creditRating.color}`}
                style={{ fontFamily: "Syne, sans-serif" }}
              >
                {creditRating.label}
              </div>
              <div className="text-xs text-slate-500">FICO Score</div>
            </div>
          </div>
          <div className="space-y-2 text-xs text-slate-500">
            <p>• Scores above 740 typically qualify for best rates</p>
            <p>• Each 20-point increase can lower rate ~0.25%</p>
            <p>
              • Improving by 50pts could save{" "}
              {formatCurrency((inputs.loanAmount - inputs.downPayment) * 0.005)}{" "}
              total
            </p>
          </div>
        </div>

        <div className="glass-card p-6">
          <h4
            className="text-xs font-bold text-slate-400 mb-4"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            RECOMMENDATIONS
          </h4>
          <div className="space-y-3">
            {housingRatio > 28 && (
              <div className="flex gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/15">
                <AlertTriangle
                  size={14}
                  className="text-amber-400 mt-0.5 flex-shrink-0"
                />
                <p className="text-xs text-slate-400">
                  Consider increasing down payment or choosing a longer term to
                  reduce monthly payments.
                </p>
              </div>
            )}
            {inputs.extraMonthlyPayment === 0 && (
              <div className="flex gap-2 p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/15">
                <Info
                  size={14}
                  className="text-indigo-400 mt-0.5 flex-shrink-0"
                />
                <p className="text-xs text-slate-400">
                  Adding even $100/month in extra payments can save thousands in
                  interest.
                </p>
              </div>
            )}
            {housingRatio <= 28 && totalDebtRatio <= 36 && (
              <div className="flex gap-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                <CheckCircle
                  size={14}
                  className="text-emerald-400 mt-0.5 flex-shrink-0"
                />
                <p className="text-xs text-slate-400">
                  Your debt ratios are well within recommended limits. You're in
                  a strong borrowing position.
                </p>
              </div>
            )}
            {creditScore < 700 && (
              <div className="flex gap-2 p-3 rounded-lg bg-rose-500/5 border border-rose-500/15">
                <AlertTriangle
                  size={14}
                  className="text-rose-400 mt-0.5 flex-shrink-0"
                />
                <p className="text-xs text-slate-400">
                  Improving your credit score before applying could save
                  significant interest over the loan term.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
