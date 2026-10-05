import React from "react";

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  trend?: { value: string; up: boolean };
}

export default React.memo(function StatCard({ label, value, sub, accent, trend }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col shadow-sm transition-shadow">
      <div className="text-[14px] text-gray-500 font-sans mb-3">{label}</div>
      <div className={`text-[42px] leading-none font-light tracking-[-0.04em] font-sans ${accent ? "text-orange-500" : "text-gray-900"}`}>
        {value}
      </div>
      {(sub || trend) && (
        <div className="mt-5 flex items-center gap-3">
          {trend && (
            <div className={`text-[12px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 ${trend.up ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"}`}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                {trend.up ? <path d="M7 17L17 7M7 7h10v10" /> : <path d="M7 7l10 10M17 7v10H7" />}
              </svg>
              <span>{trend.value}</span>
            </div>
          )}
          {sub && <span className="text-[12px] text-gray-400 font-sans">{sub}</span>}
        </div>
      )}
    </div>
  );
});
