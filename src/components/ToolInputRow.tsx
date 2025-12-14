/**
 * Tool Input Row Component
 * Single row for inputting tool quantity and price
 * Supports Growtopia price formats: items/WL or WL/item
 */

import { type ToolType, TOOL_METADATA } from "../lib/tools";
import { calculateAutoclaveCount, calculateRemainder } from "../lib/autoclave";
import { type PriceType, toWLPerItem } from "../lib/pricing";

interface ToolInputRowProps {
  tool: ToolType;
  quantity: number;
  priceValue: number;
  priceType: PriceType;
  minRemainder: number;
  autoRepeat: boolean;
  onQuantityChange: (tool: ToolType, quantity: number) => void;
  onPriceChange: (tool: ToolType, value: number, type: PriceType) => void;
  onMinRemainderChange: (tool: ToolType, minRemainder: number) => void;
  onAutoRepeatChange: (tool: ToolType, autoRepeat: boolean) => void;
}

export function ToolInputRow({
  tool,
  quantity,
  priceValue,
  priceType,
  minRemainder,
  autoRepeat,
  onQuantityChange,
  onPriceChange,
  onMinRemainderChange,
  onAutoRepeatChange,
}: ToolInputRowProps) {
  const metadata = TOOL_METADATA[tool];
  const autoclaveCount = calculateAutoclaveCount(quantity, minRemainder);
  const remainder = calculateRemainder(quantity, autoclaveCount);
  const canAutoclave = autoclaveCount > 0;
  const wlPerItem = toWLPerItem(priceValue, priceType);

  return (
    <tr className="border-b border-gray-700 transition-colors hover:bg-gray-800/50">
      {/* Tool Name */}
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 rounded-sm border border-gray-600"
            style={{ backgroundColor: metadata.color }}
          />
          <span className="text-sm font-medium text-gray-200">
            {metadata.shortName}
          </span>
        </div>
      </td>

      {/* Quantity Input */}
      <td className="px-3 py-2">
        <input
          type="number"
          min="0"
          value={quantity || ""}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            onQuantityChange(tool, isNaN(val) ? 0 : val);
          }}
          placeholder="0"
          className="w-20 [appearance:textfield] rounded border border-gray-600 bg-gray-900 px-2 py-1 text-center text-sm text-white focus:border-amber-500 focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
      </td>

      {/* Min Remainder Input */}
      <td className="px-3 py-2">
        <input
          type="number"
          min="0"
          value={minRemainder || ""}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            onMinRemainderChange(tool, isNaN(val) ? 0 : val);
          }}
          placeholder="0"
          className="w-16 [appearance:textfield] rounded border border-gray-600 bg-gray-900 px-2 py-1 text-center text-sm text-white focus:border-amber-500 focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
      </td>

      {/* Auto Repeat Checkbox */}
      <td className="px-3 py-2 text-center">
        <input
          type="checkbox"
          checked={autoRepeat}
          onChange={(e) => onAutoRepeatChange(tool, e.target.checked)}
          className="h-4 w-4 cursor-pointer rounded border-gray-600 bg-gray-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-gray-800"
          title={autoRepeat ? "Auto-repeat aktif" : "Auto-repeat nonaktif"}
        />
      </td>

      {/* Price Input with Type Selector */}
      <td className="px-3 py-2">
        <div className="flex items-center gap-1">
          <input
            type="number"
            min="0"
            step="0.01"
            value={priceValue || ""}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onPriceChange(tool, isNaN(val) ? 0 : val, priceType);
            }}
            placeholder="0"
            required
            className="w-16 [appearance:textfield] rounded border border-gray-600 bg-gray-900 px-2 py-1 text-center text-sm text-white focus:border-amber-500 focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <select
            value={priceType}
            onChange={(e) =>
              onPriceChange(tool, priceValue, e.target.value as PriceType)
            }
            className="cursor-pointer rounded border border-gray-600 bg-gray-900 px-1 py-1 text-xs text-gray-300 focus:border-amber-500 focus:outline-none"
          >
            <option value="items-per-wl">/WL</option>
            <option value="wl-each">WL</option>
          </select>
        </div>
      </td>

      {/* WL per Item (calculated) */}
      <td className="px-3 py-2 text-center">
        {priceValue > 0 ? (
          <span className="text-xs text-gray-400">
            {wlPerItem < 1
              ? `${(wlPerItem * 100).toFixed(2)}%`
              : `${wlPerItem.toFixed(2)}`}
            <span className="text-gray-600"> WL/ea</span>
          </span>
        ) : (
          <span className="text-xs text-gray-600">-</span>
        )}
      </td>

      {/* Autoclave Count (first iteration only) */}
      <td className="px-3 py-2 text-center">
        {canAutoclave ? (
          <span className="font-bold text-green-400">×{autoclaveCount}</span>
        ) : (
          <span className="text-gray-600">-</span>
        )}
      </td>

      {/* Remainder (first iteration) */}
      <td className="px-3 py-2 text-center">
        <span className={quantity > 0 ? "text-gray-300" : "text-gray-600"}>
          {quantity > 0 ? remainder : "-"}
        </span>
      </td>
    </tr>
  );
}
