/**
 * Tool Input Row Component
 * Single row for inputting tool quantity and price
 */

import { type ToolType, TOOL_METADATA, AUTOCLAVE_REQUIREMENT } from '../lib/tools';
import { calculateAutoclaveCount } from '../lib/autoclave';

interface ToolInputRowProps {
  tool: ToolType;
  quantity: number;
  price: number;
  onQuantityChange: (tool: ToolType, quantity: number) => void;
  onPriceChange: (tool: ToolType, price: number) => void;
}

export function ToolInputRow({
  tool,
  quantity,
  price,
  onQuantityChange,
  onPriceChange,
}: ToolInputRowProps) {
  const metadata = TOOL_METADATA[tool];
  const autoclaveCount = calculateAutoclaveCount(quantity);
  const canAutoclave = autoclaveCount > 0;

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

      {/* Price Input (WL per tool) */}
      <td className="py-2 px-3">
        <div className="flex items-center gap-1">
          <input
            type="number"
            min="0"
            step="0.01"
            value={price || ''}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onPriceChange(tool, isNaN(val) ? 0 : val);
            }}
            placeholder="0"
            className="w-20 px-2 py-1 text-sm bg-gray-900 border border-gray-600 rounded 
                       text-white text-center focus:border-amber-500 focus:outline-none
                       [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none 
                       [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-xs text-gray-500">WL</span>
        </div>
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
          {quantity > 0 ? quantity % AUTOCLAVE_REQUIREMENT : '-'}
        </span>
      </td>
    </tr>
  );
}
