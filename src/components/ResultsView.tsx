/**
 * Results View Component
 * Mobile-friendly display of autoclave calculation results
 */

import type { AutoclaveCalculation } from '../lib/autoclave';
import type { ValueCalculation, ToolValueBreakdown } from '../lib/pricing';
import { TOOL_METADATA, type ToolType } from '../lib/tools';

interface ResultsViewProps {
  calculation: AutoclaveCalculation;
  valueCalc: ValueCalculation;
  breakdown: ToolValueBreakdown[];
}

export function ResultsView({ calculation, valueCalc, breakdown }: ResultsViewProps) {
  const hasAutoclave = calculation.results.some((r) => r.autoclaveCount > 0);

  if (!hasAutoclave) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-20 h-20 rounded-full bg-neutral-800 flex items-center justify-center mb-4">
          <span className="text-4xl">🔬</span>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Belum Ada Autoclave</h3>
        <p className="text-neutral-500 text-sm text-center max-w-xs">
          Masukkan minimal 20 tools dari jenis yang sama untuk memulai autoclave
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <SummaryCard
          label="Nilai Sebelum"
          value={`${valueCalc.beforeValue.toFixed(1)} WL`}
        />
        <SummaryCard
          label="Nilai Sesudah"
          value={`${valueCalc.afterValue.toFixed(1)} WL`}
          highlight
        />
      </div>

      {/* Profit/Loss Banner */}
      <div className={`p-4 rounded-xl ${
        valueCalc.isProfitable 
          ? 'bg-emerald-500/10 border border-emerald-500/20' 
          : valueCalc.difference === 0
            ? 'bg-neutral-800 border border-neutral-700'
            : 'bg-red-500/10 border border-red-500/20'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-neutral-400 mb-1">Selisih Nilai</p>
            <p className={`text-2xl font-bold ${
              valueCalc.isProfitable 
                ? 'text-emerald-400' 
                : valueCalc.difference === 0
                  ? 'text-neutral-300'
                  : 'text-red-400'
            }`}>
              {valueCalc.difference >= 0 ? '+' : ''}{valueCalc.difference.toFixed(2)} WL
            </p>
          </div>
          <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${
            valueCalc.isProfitable 
              ? 'bg-emerald-500/20 text-emerald-400' 
              : valueCalc.difference === 0
                ? 'bg-neutral-700 text-neutral-400'
                : 'bg-red-500/20 text-red-400'
          }`}>
            {valueCalc.profitPercent >= 0 ? '+' : ''}{valueCalc.profitPercent.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Iterations Info */}
      {calculation.iterations > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-amber-400">🔄</span>
            <span className="text-sm font-medium text-amber-300">
              {calculation.iterations} Iterasi Autoclave
            </span>
          </div>
          <div className="space-y-2">
            {calculation.iterationDetails.slice(0, 5).map((detail) => (
              <div key={detail.iteration} className="flex items-center gap-2 text-xs">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-medium">
                  {detail.iteration}
                </span>
                <span className="text-neutral-400">
                  {detail.totalAutoclaves}× dari {detail.toolsProcessed.length} jenis tool
                </span>
              </div>
            ))}
            {calculation.iterations > 5 && (
              <p className="text-xs text-neutral-500 pl-8">
                +{calculation.iterations - 5} iterasi lainnya...
              </p>
            )}
          </div>
        </div>
      )}

      {/* Tool Results */}
      <div>
        <h3 className="text-sm font-medium text-neutral-400 mb-3 px-1">Perubahan per Tool</h3>
        <div className="space-y-2">
          {breakdown
            .filter(item => item.beforeQuantity > 0 || item.afterQuantity > 0)
            .map((item) => (
              <ToolResultRow key={item.tool} item={item} />
            ))}
        </div>
      </div>

      {/* Detailed Operations */}
      <details className="group">
        <summary className="py-3 px-1 text-sm text-neutral-500 cursor-pointer hover:text-neutral-300 transition-colors flex items-center gap-2">
          <span className="group-open:rotate-90 transition-transform">▶</span>
          Detail Operasi Autoclave
        </summary>
        <div className="mt-2 p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 space-y-2">
          {calculation.summary
            .filter((s) => s.totalToolsUsed > 0 || s.totalReceived > 0)
            .map((summary) => (
              <div key={summary.tool} className="text-sm flex flex-wrap items-center gap-2">
                <span 
                  className="w-3 h-3 rounded-sm shrink-0"
                  style={{ backgroundColor: TOOL_METADATA[summary.tool].color }}
                />
                <span className="text-neutral-300 font-medium">
                  {TOOL_METADATA[summary.tool].shortName}:
                </span>
                {summary.totalToolsUsed > 0 && (
                  <span className="text-red-400 text-xs">-{summary.totalToolsUsed}</span>
                )}
                {summary.totalReceived > 0 && (
                  <span className="text-emerald-400 text-xs">+{summary.totalReceived}</span>
                )}
                <span className="text-neutral-500 text-xs">
                  → {summary.finalQuantity}
                </span>
              </div>
            ))}
        </div>
      </details>
    </div>
  );
}

function SummaryCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`p-4 rounded-xl ${
      highlight 
        ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20' 
        : 'bg-neutral-900/50 border border-neutral-800'
    }`}>
      <p className="text-xs text-neutral-500 mb-1">{label}</p>
      <p className={`text-lg font-bold ${highlight ? 'text-amber-400' : 'text-white'}`}>
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
    <div className="p-3 rounded-xl bg-neutral-900/50 border border-neutral-800 flex items-center gap-3">
      {/* Color indicator */}
      <div 
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${metadata.color}15` }}
      >
        <div 
          className="w-4 h-4 rounded-md"
          style={{ backgroundColor: metadata.color }}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white text-sm truncate">{metadata.shortName}</p>
        <p className="text-xs text-neutral-500">
          {item.beforeQuantity} → {item.afterQuantity}
        </p>
      </div>

      {/* Change */}
      {hasChange && (
        <div className={`px-2.5 py-1 rounded-lg text-sm font-medium ${
          quantityChange > 0 
            ? 'bg-emerald-500/20 text-emerald-400' 
            : 'bg-red-500/20 text-red-400'
        }`}>
          {quantityChange > 0 ? '+' : ''}{quantityChange}
        </div>
      )}
    </div>
  );
}
