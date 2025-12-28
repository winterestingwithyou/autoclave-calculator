/**
 * Results View Component
 * Mobile-friendly display of autoclave calculation results
 */

import type { AutoclaveCalculation } from "../lib/autoclave";
import type { ValueCalculation, ToolValueBreakdown } from "../lib/pricing";
import { TOOL_METADATA, type ToolType } from "../lib/tools";

interface ResultsViewProps {
  calculation: AutoclaveCalculation;
  valueCalc: ValueCalculation;
  breakdown: ToolValueBreakdown[];
}

export function ResultsView({
  calculation,
  valueCalc,
  breakdown,
}: ResultsViewProps) {
  const hasAutoclave = calculation.results.some((r) => r.autoclaveCount > 0);

  if (!hasAutoclave) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-12 sm:py-16">
        <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-800 sm:mb-4 sm:h-20 sm:w-20">
          <span className="text-3xl sm:text-4xl">🔬</span>
        </div>
        <h3 className="mb-2 text-base font-semibold text-white sm:text-lg">
          Belum Ada Autoclave
        </h3>
        <p className="max-w-xs text-center text-xs text-neutral-500 sm:text-sm">
          Masukkan minimal 20 tools dari jenis yang sama untuk memulai autoclave
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <SummaryCard
          label="Nilai Sebelum"
          value={`${valueCalc.beforeValue.toFixed(1).replace(".", ",")} WL`}
        />
        <SummaryCard
          label="Nilai Sesudah"
          value={`${valueCalc.afterValue.toFixed(1).replace(".", ",")} WL`}
          highlight
        />
      </div>

      {/* Profit/Loss Banner */}
      <div
        className={`rounded-xl p-3 sm:p-4 ${
          valueCalc.isProfitable
            ? "border border-emerald-500/20 bg-emerald-500/10"
            : valueCalc.difference === 0
              ? "border border-neutral-700 bg-neutral-800"
              : "border border-red-500/20 bg-red-500/10"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="mb-0.5 text-[10px] text-neutral-400 sm:mb-1 sm:text-xs">
              Selisih Nilai
            </p>
            <p
              className={`text-xl font-bold sm:text-2xl ${
                valueCalc.isProfitable
                  ? "text-emerald-400"
                  : valueCalc.difference === 0
                    ? "text-neutral-300"
                    : "text-red-400"
              }`}
            >
              {valueCalc.difference >= 0 ? "+" : ""}
              {valueCalc.difference.toFixed(2).replace(".", ",")} WL
            </p>
          </div>
          <div
            className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium sm:px-3 sm:py-1.5 sm:text-sm ${
              valueCalc.isProfitable
                ? "bg-emerald-500/20 text-emerald-400"
                : valueCalc.difference === 0
                  ? "bg-neutral-700 text-neutral-400"
                  : "bg-red-500/20 text-red-400"
            }`}
          >
            {valueCalc.profitPercent >= 0 ? "+" : ""}
            {valueCalc.profitPercent.toFixed(1).replace(".", ",")}%
          </div>
        </div>
      </div>

      {/* Iterations Info */}
      {calculation.iterations > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 sm:p-4">
          <div className="mb-2 flex items-center gap-1.5 sm:mb-3 sm:gap-2">
            <span className="text-sm text-amber-400 sm:text-base">🔄</span>
            <span className="text-xs font-medium text-amber-300 sm:text-sm">
              {calculation.iterations} Iterasi
            </span>
          </div>
          <div className="space-y-1.5 sm:space-y-2">
            {calculation.iterationDetails.slice(0, 5).map((detail) => (
              <div
                key={detail.iteration}
                className="flex items-center gap-1.5 text-[10px] sm:gap-2 sm:text-xs"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-medium text-amber-400 sm:h-6 sm:w-6 sm:text-xs">
                  {detail.iteration}
                </span>
                <span className="truncate text-neutral-400">
                  {detail.totalAutoclaves}× dari {detail.toolsProcessed.length}{" "}
                  tool
                </span>
              </div>
            ))}
            {calculation.iterations > 5 && (
              <p className="pl-6 text-[10px] text-neutral-500 sm:pl-8 sm:text-xs">
                +{calculation.iterations - 5} iterasi lainnya...
              </p>
            )}
          </div>
        </div>
      )}

      {/* Tool Results */}
      <div>
        <h3 className="mb-2 px-1 text-xs font-medium text-neutral-400 sm:mb-3 sm:text-sm">
          Perubahan per Tool
        </h3>
        <div className="space-y-1.5 sm:space-y-2">
          {breakdown
            .filter((item) => item.beforeQuantity > 0 || item.afterQuantity > 0)
            .map((item) => (
              <ToolResultRow key={item.tool} item={item} />
            ))}
        </div>
      </div>

      {/* Detailed Operations */}
      <details className="group">
        <summary className="flex cursor-pointer items-center gap-1.5 px-1 py-2 text-xs text-neutral-500 transition-colors hover:text-neutral-300 sm:gap-2 sm:py-3 sm:text-sm">
          <span className="text-[10px] transition-transform group-open:rotate-90 sm:text-xs">
            ▶
          </span>
          Detail Operasi
        </summary>
        <div className="mt-1.5 space-y-1.5 rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 sm:mt-2 sm:space-y-2 sm:p-4">
          {calculation.summary
            .filter((s) => s.totalToolsUsed > 0 || s.totalReceived > 0)
            .map((summary) => (
              <div
                key={summary.tool}
                className="flex flex-wrap items-center gap-1.5 text-xs sm:gap-2 sm:text-sm"
              >
                <img
                  src={TOOL_METADATA[summary.tool].image}
                  alt={TOOL_METADATA[summary.tool].shortName}
                  className="h-4 w-4 shrink-0 object-contain sm:h-5 sm:w-5"
                  loading="lazy"
                />
                <span className="max-w-15 truncate font-medium text-neutral-300 sm:max-w-none">
                  {TOOL_METADATA[summary.tool].shortName}:
                </span>
                {summary.totalToolsUsed > 0 && (
                  <span className="text-[10px] text-red-400 sm:text-xs">
                    -{summary.totalToolsUsed}
                  </span>
                )}
                {summary.totalReceived > 0 && (
                  <span className="text-[10px] text-emerald-400 sm:text-xs">
                    +{summary.totalReceived}
                  </span>
                )}
                <span className="text-[10px] text-neutral-500 sm:text-xs">
                  → {summary.finalQuantity}
                </span>
              </div>
            ))}
        </div>
      </details>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-3 sm:p-4 ${
        highlight
          ? "border border-amber-500/20 bg-linear-to-br from-amber-500/10 to-orange-500/5"
          : "border border-neutral-800 bg-neutral-900/50"
      }`}
    >
      <p className="mb-0.5 text-[10px] text-neutral-500 sm:mb-1 sm:text-xs">
        {label}
      </p>
      <p
        className={`truncate text-sm font-bold sm:text-lg ${highlight ? "text-amber-400" : "text-white"}`}
      >
        {value}
      </p>
    </div>
  );
}

function ToolResultRow({ item }: { item: ToolValueBreakdown }) {
  const metadata = TOOL_METADATA[item.tool as ToolType];
  const quantityChange = item.afterQuantity - item.beforeQuantity;
  const hasChange = quantityChange !== 0;

  return (
    <div className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/50 p-2.5 sm:gap-3 sm:p-3">
      {/* Tool image */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-800/50 sm:h-10 sm:w-10">
        <img
          src={metadata.image}
          alt={metadata.shortName}
          className="h-6 w-6 object-contain sm:h-8 sm:w-8"
          loading="lazy"
        />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-white sm:text-sm">
          {metadata.shortName}
        </p>
        <p className="text-[10px] text-neutral-500 sm:text-xs">
          {item.beforeQuantity} → {item.afterQuantity}
        </p>
      </div>

      {/* Change */}
      {hasChange && (
        <div
          className={`shrink-0 rounded-lg px-2 py-0.5 text-xs font-medium sm:px-2.5 sm:py-1 sm:text-sm ${
            quantityChange > 0
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-red-500/20 text-red-400"
          }`}
        >
          {quantityChange > 0 ? "+" : ""}
          {quantityChange}
        </div>
      )}
    </div>
  );
}
