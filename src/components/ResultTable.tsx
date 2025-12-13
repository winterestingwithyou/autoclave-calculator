/**
 * Result Table Component
 * Displays autoclave calculation results with before/after comparison
 */

import type { AutoclaveCalculation } from '../lib/autoclave';
import type { ValueCalculation, ToolValueBreakdown } from '../lib/pricing';
import { TOOL_METADATA, type ToolType } from '../lib/tools';
import { formatWL, formatDifference } from '../lib/pricing';

interface ResultTableProps {
  calculation: AutoclaveCalculation | null;
  valueCalc: ValueCalculation | null;
  breakdown: ToolValueBreakdown[];
}

export function ResultTable({ calculation, valueCalc, breakdown }: ResultTableProps) {
  if (!calculation || !valueCalc) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-lg">Masukkan jumlah tools untuk melihat hasil</p>
        <p className="text-sm mt-2">Minimal 20 tools dari jenis yang sama untuk autoclave</p>
      </div>
    );
  }

  const hasAutoclave = calculation.results.some((r) => r.autoclaveCount > 0);

  if (!hasAutoclave) {
    return (
      <div className="text-center py-8 text-amber-500">
        <p className="text-lg">⚠️ Tidak ada tools yang bisa di-autoclave</p>
        <p className="text-sm mt-2 text-gray-400">
          Butuh minimal 20 tools dari jenis yang sama
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          color={valueCalc.isProfitable ? 'text-green-400' : 'text-red-400'}
          subtext={`${valueCalc.profitPercent >= 0 ? '+' : ''}${valueCalc.profitPercent.toFixed(1)}%`}
        />
      </div>

      {/* Detailed Results Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-600 text-gray-400">
              <th className="py-2 px-3 text-left">Tool</th>
              <th className="py-2 px-3 text-center">Sebelum</th>
              <th className="py-2 px-3 text-center">Sesudah</th>
              <th className="py-2 px-3 text-center">Perubahan</th>
              <th className="py-2 px-3 text-right">Nilai</th>
            </tr>
          </thead>
          <tbody>
            {breakdown.map((item) => (
              <ResultRow key={item.tool} item={item} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Autoclave Operations Summary */}
      <div className="bg-gray-800/50 rounded-lg p-4">
        <h4 className="text-amber-400 font-bold mb-3">📊 Detail Operasi Autoclave</h4>
        <div className="space-y-2">
          {calculation.results
            .filter((r) => r.autoclaveCount > 0)
            .map((result) => (
              <div key={result.inputTool} className="text-sm">
                <span className="text-gray-300">
                  {TOOL_METADATA[result.inputTool].shortName}:
                </span>
                <span className="text-amber-300 ml-2">
                  {result.inputQuantity} → {result.autoclaveCount}× autoclave
                </span>
                <span className="text-gray-500 ml-2">
                  (sisa: {result.remainder})
                </span>
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
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <p className="text-gray-400 text-sm mb-1">{label}</p>
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
      <td className="py-2 px-3">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-sm"
            style={{ backgroundColor: metadata.color }}
          />
          <span className="text-gray-300">{metadata.shortName}</span>
        </div>
      </td>
      <td className="py-2 px-3 text-center text-gray-400">
        {item.beforeQuantity}
      </td>
      <td className="py-2 px-3 text-center text-white font-medium">
        {item.afterQuantity}
      </td>
      <td className="py-2 px-3 text-center">
        {hasChange ? (
          <span className={quantityChange > 0 ? 'text-green-400' : 'text-red-400'}>
            {quantityChange > 0 ? '+' : ''}{quantityChange}
          </span>
        ) : (
          <span className="text-gray-600">-</span>
        )}
      </td>
      <td className="py-2 px-3 text-right">
        {item.valueDifference !== 0 ? (
          <span className={item.valueDifference > 0 ? 'text-green-400' : 'text-red-400'}>
            {formatDifference(item.valueDifference)}
          </span>
        ) : (
          <span className="text-gray-600">-</span>
        )}
      </td>
    </tr>
  );
}
