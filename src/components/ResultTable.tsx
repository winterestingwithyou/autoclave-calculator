/**
 * Result Table Component
 * Displays autoclave calculation results with before/after comparison
 */

import type { AutoclaveCalculation } from "../lib/autoclave";
import type { ValueCalculation, ToolValueBreakdown } from "../lib/pricing";
import { TOOL_METADATA, type ToolType } from "../lib/tools";

/**
 * Format WL value for display
 */
function formatWL(value: number): string {
  if (value >= 100) {
    const dls = value / 100;
    return `${dls.toFixed(2)} DL`;
  }
  return `${value.toFixed(2)} WL`;
}

/**
 * Format difference with +/- sign
 */
function formatDifference(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${formatWL(value)}`;
}

interface ResultTableProps {
  calculation: AutoclaveCalculation | null;
  valueCalc: ValueCalculation | null;
  breakdown: ToolValueBreakdown[];
}

export function ResultTable({
  calculation,
  valueCalc,
  breakdown,
}: ResultTableProps) {
  if (!calculation || !valueCalc) {
    return (
      <div className="py-8 text-center text-gray-500">
        <p className="text-lg">Masukkan jumlah tools untuk melihat hasil</p>
        <p className="mt-2 text-sm">
          Minimal 20 tools dari jenis yang sama untuk autoclave
        </p>
      </div>
    );
  }

  const hasAutoclave = calculation.results.some((r) => r.autoclaveCount > 0);

  if (!hasAutoclave) {
    return (
      <div className="py-8 text-center text-amber-500">
        <p className="text-lg">⚠️ Tidak ada tools yang bisa di-autoclave</p>
        <p className="mt-2 text-sm text-gray-400">
          Butuh minimal 20 tools dari jenis yang sama
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ValueCard
          label="Nilai Sebelum"
          value={formatWL(valueCalc.beforeValue)}
          color="text-gray-300"
        />
        <ValueCard
          label="Nilai Sesudah"
          value={formatWL(valueCalc.afterValue)}
          color="text-blue-400"
        />
        <ValueCard
          label="Selisih"
          value={formatDifference(valueCalc.difference)}
          color={valueCalc.isProfitable ? "text-green-400" : "text-red-400"}
          subtext={`${valueCalc.profitPercent >= 0 ? "+" : ""}${valueCalc.profitPercent.toFixed(1)}%`}
        />
      </div>

      {/* Detailed Results Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-600 text-gray-400">
              <th className="px-3 py-2 text-left">Tool</th>
              <th className="px-3 py-2 text-center">Sebelum</th>
              <th className="px-3 py-2 text-center">Sesudah</th>
              <th className="px-3 py-2 text-center">Perubahan</th>
              <th className="px-3 py-2 text-right">Nilai</th>
            </tr>
          </thead>
          <tbody>
            {breakdown.map((item) => (
              <ResultRow key={item.tool} item={item} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Iteration Info */}
      {calculation.iterations > 1 && (
        <div className="rounded-lg border border-amber-700 bg-amber-900/30 p-4">
          <h4 className="mb-2 font-bold text-amber-400">
            🔄 Auto-Repeat: {calculation.iterations} Iterasi
          </h4>
          <div className="space-y-2 text-sm">
            {calculation.iterationDetails.map((detail) => (
              <div key={detail.iteration} className="flex items-start gap-2">
                <span className="font-mono text-amber-500">
                  #{detail.iteration}
                </span>
                <div className="text-gray-400">
                  {detail.totalAutoclaves}× autoclave dari{" "}
                  <span className="text-gray-300">
                    {detail.toolsProcessed
                      .map(
                        (t) =>
                          `${TOOL_METADATA[t.tool].shortName}(${t.autoclaveCount}×)`,
                      )
                      .join(", ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Autoclave Operations Summary */}
      <div className="rounded-lg bg-gray-800/50 p-4">
        <h4 className="mb-3 font-bold text-amber-400">
          📊 Total Operasi Autoclave
        </h4>
        <div className="space-y-2">
          {calculation.summary
            .filter((s) => s.totalToolsUsed > 0)
            .map((summary) => (
              <div key={summary.tool} className="text-sm">
                <span className="text-gray-300">
                  {TOOL_METADATA[summary.tool].shortName}:
                </span>
                <span className="ml-2 text-amber-300">
                  {summary.originalQuantity} → -{summary.totalToolsUsed}{" "}
                  digunakan
                </span>
                <span className="ml-2 text-green-400">
                  +{summary.totalReceived} diterima
                </span>
                <span className="ml-2 font-medium text-white">
                  = {summary.finalQuantity}
                </span>
                {!summary.autoRepeat && (
                  <span className="ml-2 text-gray-500">(no auto-repeat)</span>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

interface ValueCardProps {
  label: string;
  value: string;
  color: string;
  subtext?: string;
}

function ValueCard({ label, value, color, subtext }: ValueCardProps) {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
      <p className="mb-1 text-sm text-gray-400">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      {subtext && <p className={`text-sm ${color} opacity-75`}>{subtext}</p>}
    </div>
  );
}

interface ResultRowProps {
  item: ToolValueBreakdown;
}

function ResultRow({ item }: ResultRowProps) {
  const metadata = TOOL_METADATA[item.tool as ToolType];
  const hasChange = item.beforeQuantity !== item.afterQuantity;
  const quantityChange = item.afterQuantity - item.beforeQuantity;

  return (
    <tr className="border-b border-gray-700/50 hover:bg-gray-800/30">
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-sm"
            style={{ backgroundColor: metadata.color }}
          />
          <span className="text-gray-300">{metadata.shortName}</span>
        </div>
      </td>
      <td className="px-3 py-2 text-center text-gray-400">
        {item.beforeQuantity}
      </td>
      <td className="px-3 py-2 text-center font-medium text-white">
        {item.afterQuantity}
      </td>
      <td className="px-3 py-2 text-center">
        {hasChange ? (
          <span
            className={quantityChange > 0 ? "text-green-400" : "text-red-400"}
          >
            {quantityChange > 0 ? "+" : ""}
            {quantityChange}
          </span>
        ) : (
          <span className="text-gray-600">-</span>
        )}
      </td>
      <td className="px-3 py-2 text-right">
        {item.valueDifference !== 0 ? (
          <span
            className={
              item.valueDifference > 0 ? "text-green-400" : "text-red-400"
            }
          >
            {formatDifference(item.valueDifference)}
          </span>
        ) : (
          <span className="text-gray-600">-</span>
        )}
      </td>
    </tr>
  );
}
