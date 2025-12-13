/**
 * Tool Input Row Component
 * Single row for inputting tool quantity and price
 * Supports Growtopia price formats: items/WL or WL/item
 */

import { type ToolType, TOOL_METADATA, AUTOCLAVE_REQUIREMENT } from '../lib/tools';
import { calculateAutoclaveCount, calculateRemainder } from '../lib/autoclave';
import { type PriceType, toWLPerItem } from '../lib/pricing';

interface ToolInputRowProps {
  tool: ToolType;
  quantity: number;
  priceValue: number;
  priceType: PriceType;
  minRemainder: number;
  onQuantityChange: (tool: ToolType, quantity: number) => void;
  onPriceChange: (tool: ToolType, value: number, type: PriceType) => void;
  onMinRemainderChange: (tool: ToolType, minRemainder: number) => void;
}

export function ToolInputRow({
  tool,
  quantity,
  priceValue,
  priceType,
  minRemainder,
  onQuantityChange,
  onPriceChange,
  onMinRemainderChange,
}: ToolInputRowProps) {
  const metadata = TOOL_METADATA[tool];
  const autoclaveCount = calculateAutoclaveCount(quantity, minRemainder);
  const remainder = calculateRemainder(quantity, autoclaveCount);
  const canAutoclave = autoclaveCount > 0;
  const wlPerItem = toWLPerItem(priceValue, priceType);

  return (
    <tr className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors">
      {/* Tool Name */}
      <td className="py-2 px-3">
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-sm inline-block border border-gray-600"
            style={{ backgroundColor: metadata.color }}
          />
          <span className="text-sm font-medium text-gray-200">
            {metadata.shortName}
          </span>
        </div>
      </td>

      {/* Quantity Input */}
      <td className="py-2 px-3">
        <input
          type="number"
          min="0"
          value={quantity || ''}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            onQuantityChange(tool, isNaN(val) ? 0 : val);
          }}
          placeholder="0"
          className="w-20 px-2 py-1 text-sm bg-gray-900 border border-gray-600 rounded 
                     text-white text-center focus:border-amber-500 focus:outline-none
                     [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none 
                     [&::-webkit-inner-spin-button]:appearance-none"
        />
      </td>

      {/* Min Remainder Input */}
      <td className="py-2 px-3">
        <input
          type="number"
          min="0"
          value={minRemainder || ''}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            onMinRemainderChange(tool, isNaN(val) ? 0 : val);
          }}
          placeholder="0"
          className="w-16 px-2 py-1 text-sm bg-gray-900 border border-gray-600 rounded 
                     text-white text-center focus:border-amber-500 focus:outline-none
                     [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none 
                     [&::-webkit-inner-spin-button]:appearance-none"
        />
      </td>

      {/* Price Input with Type Selector */}
      <td className="py-2 px-3">
        <div className="flex items-center gap-1">
          <input
            type="number"
            min="0"
            step="0.01"
            value={priceValue || ''}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onPriceChange(tool, isNaN(val) ? 0 : val, priceType);
            }}
            placeholder="0"
            required
            className="w-16 px-2 py-1 text-sm bg-gray-900 border border-gray-600 rounded 
                       text-white text-center focus:border-amber-500 focus:outline-none
                       [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none 
                       [&::-webkit-inner-spin-button]:appearance-none"
          />
          <select
            value={priceType}
            onChange={(e) => onPriceChange(tool, priceValue, e.target.value as PriceType)}
            className="px-1 py-1 text-xs bg-gray-900 border border-gray-600 rounded 
                       text-gray-300 focus:border-amber-500 focus:outline-none cursor-pointer"
          >
            <option value="items-per-wl">/WL</option>
            <option value="wl-each">WL</option>
          </select>
        </div>
      </td>

      {/* WL per Item (calculated) */}
      <td className="py-2 px-3 text-center">
        {priceValue > 0 ? (
          <span className="text-xs text-gray-400">
            {wlPerItem < 1 
              ? `${(wlPerItem * 100).toFixed(2)}%` 
              : `${wlPerItem.toFixed(2)}`}
            <span className="text-gray-600"> WL/ea</span>
          </span>
        ) : (
          <span className="text-gray-600 text-xs">-</span>
        )}
      </td>

      {/* Autoclave Count */}
      <td className="py-2 px-3 text-center">
        {canAutoclave ? (
          <span className="text-green-400 font-bold">×{autoclaveCount}</span>
        ) : (
          <span className="text-gray-600">-</span>
        )}
      </td>

      {/* Remainder */}
      <td className="py-2 px-3 text-center">
        <span className={quantity > 0 ? 'text-gray-300' : 'text-gray-600'}>
          {quantity > 0 ? remainder : '-'}
        </span>
      </td>
    </tr>
  );
}
