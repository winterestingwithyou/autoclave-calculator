/**
 * Mobile Tool Card Component
 * Expandable card design for mobile-first UX
 */

import { type ToolType, TOOL_METADATA, AUTOCLAVE_REQUIREMENT } from '../lib/tools';
import { calculateAutoclaveCount } from '../lib/autoclave';
import { type PriceType, toWLPerItem } from '../lib/pricing';

interface MobileToolCardProps {
  tool: ToolType;
  quantity: number;
  priceValue: number;
  priceType: PriceType;
  minRemainder: number;
  autoRepeat: boolean;
  finalQuantity: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onQuantityChange: (tool: ToolType, quantity: number) => void;
  onPriceChange: (tool: ToolType, value: number, type: PriceType) => void;
  onMinRemainderChange: (tool: ToolType, minRemainder: number) => void;
  onAutoRepeatChange: (tool: ToolType, autoRepeat: boolean) => void;
}

export function MobileToolCard({
  tool,
  quantity,
  priceValue,
  priceType,
  minRemainder,
  autoRepeat,
  finalQuantity,
  isExpanded,
  onToggleExpand,
  onQuantityChange,
  onPriceChange,
  onMinRemainderChange,
  onAutoRepeatChange,
}: MobileToolCardProps) {
  const metadata = TOOL_METADATA[tool];
  const autoclaveCount = calculateAutoclaveCount(quantity, minRemainder);
  const canAutoclave = autoclaveCount > 0;
  const hasQuantity = quantity > 0;
  const wlPerItem = toWLPerItem(priceValue, priceType);
  const totalValue = quantity * wlPerItem;
  const quantityDiff = finalQuantity - quantity;

  return (
    <div 
      className={`rounded-xl border transition-all duration-200 overflow-hidden ${
        hasQuantity 
          ? 'bg-neutral-900/80 border-neutral-700/50' 
          : 'bg-neutral-900/40 border-neutral-800/50'
      } ${isExpanded ? 'ring-2 ring-amber-500/30' : ''}`}
    >
      {/* Header - Always visible, clickable */}
      <button
        onClick={onToggleExpand}
        className="w-full p-4 flex items-center gap-3 text-left"
      >
        {/* Tool Color & Icon */}
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
          style={{ backgroundColor: `${metadata.color}20`, borderColor: metadata.color }}
        >
          <div 
            className="w-5 h-5 rounded-md"
            style={{ backgroundColor: metadata.color }}
          />
        </div>

        {/* Tool Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white truncate">{metadata.shortName}</span>
            {canAutoclave && (
              <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-xs font-medium">
                {autoclaveCount}×
              </span>
            )}
            {!autoRepeat && hasQuantity && (
              <span className="text-neutral-500 text-xs">🔄✗</span>
            )}
          </div>
          {hasQuantity && (
            <p className="text-xs text-neutral-500 mt-0.5">
              {quantity} → {finalQuantity}
              {quantityDiff !== 0 && (
                <span className={quantityDiff > 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {' '}({quantityDiff > 0 ? '+' : ''}{quantityDiff})
                </span>
              )}
            </p>
          )}
        </div>

        {/* Quick Quantity Input */}
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <input
            type="number"
            min="0"
            value={quantity || ''}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              onQuantityChange(tool, isNaN(val) ? 0 : val);
            }}
            placeholder="0"
            className="w-16 h-10 px-2 text-center text-white bg-neutral-800 border border-neutral-700 
                       rounded-lg focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20
                       text-sm font-medium"
          />
        </div>

        {/* Expand Icon */}
        <div className={`text-neutral-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-0 border-t border-neutral-800 space-y-4">
          {/* Price Section */}
          <div className="pt-4">
            <label className="text-xs text-neutral-500 mb-2 block">Harga</label>
            <div className="flex gap-2">
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
                className="flex-1 h-11 px-3 text-white bg-neutral-800 border border-neutral-700 
                           rounded-lg focus:border-amber-500 focus:outline-none text-sm"
              />
              <select
                value={priceType}
                onChange={(e) => onPriceChange(tool, priceValue, e.target.value as PriceType)}
                className="h-11 px-3 bg-neutral-800 border border-neutral-700 rounded-lg 
                           text-neutral-300 text-sm focus:border-amber-500 focus:outline-none cursor-pointer"
              >
                <option value="items-per-wl">/WL</option>
                <option value="wl-each">WL</option>
              </select>
            </div>
            {priceValue > 0 && (
              <p className="text-xs text-neutral-500 mt-1.5">
                = {wlPerItem.toFixed(4)} WL per item
                {hasQuantity && ` • Total: ${totalValue.toFixed(2)} WL`}
              </p>
            )}
          </div>

          {/* Advanced Options */}
          <div className="grid grid-cols-2 gap-3">
            {/* Min Remainder */}
            <div>
              <label className="text-xs text-neutral-500 mb-2 block">Min. Sisa</label>
              <input
                type="number"
                min="0"
                value={minRemainder || ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  onMinRemainderChange(tool, isNaN(val) ? 0 : val);
                }}
                placeholder="0"
                className="w-full h-11 px-3 text-white bg-neutral-800 border border-neutral-700 
                           rounded-lg focus:border-amber-500 focus:outline-none text-sm"
              />
            </div>

            {/* Auto Repeat Toggle */}
            <div>
              <label className="text-xs text-neutral-500 mb-2 block">Auto Repeat</label>
              <button
                onClick={() => onAutoRepeatChange(tool, !autoRepeat)}
                className={`w-full h-11 px-3 rounded-lg border text-sm font-medium transition-colors ${
                  autoRepeat
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                }`}
              >
                {autoRepeat ? '🔄 Aktif' : '🔄 Nonaktif'}
              </button>
            </div>
          </div>

          {/* Info */}
          {canAutoclave && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs text-amber-300">
                ✨ {autoclaveCount}× autoclave akan menghasilkan {autoclaveCount * 12} tools dari jenis lain
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
