/**
 * Mobile Tool Card Component
 * Expandable card design for mobile-first UX
 */

import { type ToolType, TOOL_METADATA } from "../lib/tools";
import { calculateAutoclaveCount } from "../lib/autoclave";
import { type PriceType, toWLPerItem } from "../lib/pricing";

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
      className={`overflow-hidden rounded-xl border transition-all duration-200 ${
        hasQuantity
          ? "border-neutral-700/50 bg-neutral-900/80"
          : "border-neutral-800/50 bg-neutral-900/40"
      } ${isExpanded ? "ring-2 ring-amber-500/30" : ""}`}
    >
      {/* Header - Always visible, clickable */}
      <button
        onClick={onToggleExpand}
        className="flex w-full items-center gap-2 p-3 text-left sm:gap-3 sm:p-4"
      >
        {/* Tool Image */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-800/50 sm:h-10 sm:w-10">
          <img
            src={metadata.image}
            alt={metadata.shortName}
            className="h-6 w-6 object-contain sm:h-8 sm:w-8"
            loading="lazy"
          />
        </div>

        {/* Tool Info */}
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
            <span className="max-w-20 truncate text-sm font-medium text-white sm:max-w-none sm:text-base">
              {metadata.shortName}
            </span>
            {canAutoclave && (
              <span className="shrink-0 rounded-md bg-amber-500/20 px-1 py-0.5 text-[10px] font-medium text-amber-400 sm:px-1.5 sm:text-xs">
                {autoclaveCount}×
              </span>
            )}
            {!autoRepeat && hasQuantity && (
              <span className="shrink-0 text-[10px] text-neutral-500 sm:text-xs">
                🔄✗
              </span>
            )}
          </div>
          {hasQuantity && (
            <p className="mt-0.5 truncate text-[10px] text-neutral-500 sm:text-xs">
              {quantity} → {finalQuantity}
              {quantityDiff !== 0 && (
                <span
                  className={
                    quantityDiff > 0 ? "text-emerald-400" : "text-red-400"
                  }
                >
                  {" "}
                  ({quantityDiff > 0 ? "+" : ""}
                  {quantityDiff})
                </span>
              )}
            </p>
          )}
        </div>

        {/* Quick Quantity Input */}
        <div
          className="flex shrink-0 items-center"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="number"
            min="0"
            value={quantity || ""}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              onQuantityChange(tool, isNaN(val) ? 0 : val);
            }}
            placeholder="0"
            className="h-9 w-12 rounded-lg border border-neutral-700 bg-neutral-800 px-1 text-center text-sm font-medium text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none sm:h-10 sm:w-16 sm:px-2"
          />
        </div>

        {/* Expand Icon */}
        <div
          className={`shrink-0 text-neutral-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
        >
          <svg
            className="h-4 w-4 sm:h-5 sm:w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="space-y-3 border-t border-neutral-800 px-3 pt-0 pb-3 sm:space-y-4 sm:px-4 sm:pb-4">
          {/* Price Section */}
          <div className="pt-3 sm:pt-4">
            <label className="mb-1.5 block text-[10px] text-neutral-500 sm:mb-2 sm:text-xs">
              Harga
            </label>
            <div className="flex gap-2">
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
                className="h-10 min-w-0 flex-1 rounded-lg border border-neutral-700 bg-neutral-800 px-2 text-sm text-white focus:border-amber-500 focus:outline-none sm:h-11 sm:px-3"
              />
              <select
                value={priceType}
                onChange={(e) =>
                  onPriceChange(tool, priceValue, e.target.value as PriceType)
                }
                className="h-10 shrink-0 cursor-pointer rounded-lg border border-neutral-700 bg-neutral-800 px-2 text-xs text-neutral-300 focus:border-amber-500 focus:outline-none sm:h-11 sm:px-3 sm:text-sm"
              >
                <option value="items-per-wl">/WL</option>
                <option value="wl-each">WL</option>
              </select>
            </div>
            {priceValue > 0 && (
              <p className="mt-1 truncate text-[10px] text-neutral-500 sm:mt-1.5 sm:text-xs">
                = {wlPerItem.toFixed(4)} WL/item
                {hasQuantity && ` • ${totalValue.toFixed(2)} WL`}
              </p>
            )}
          </div>

          {/* Advanced Options */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {/* Min Remainder */}
            <div>
              <label className="mb-1.5 block text-[10px] text-neutral-500 sm:mb-2 sm:text-xs">
                Min. Sisa
              </label>
              <input
                type="number"
                min="0"
                value={minRemainder || ""}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  onMinRemainderChange(tool, isNaN(val) ? 0 : val);
                }}
                placeholder="0"
                className="h-10 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-2 text-sm text-white focus:border-amber-500 focus:outline-none sm:h-11 sm:px-3"
              />
            </div>

            {/* Auto Repeat Toggle */}
            <div>
              <label className="mb-1.5 block text-[10px] text-neutral-500 sm:mb-2 sm:text-xs">
                Auto Repeat
              </label>
              <button
                onClick={() => onAutoRepeatChange(tool, !autoRepeat)}
                className={`h-10 w-full rounded-lg border px-2 text-xs font-medium transition-colors sm:h-11 sm:px-3 sm:text-sm ${
                  autoRepeat
                    ? "border-amber-500/50 bg-amber-500/20 text-amber-400"
                    : "border-neutral-700 bg-neutral-800 text-neutral-400"
                }`}
              >
                {autoRepeat ? "🔄 Aktif" : "🔄 Off"}
              </button>
            </div>
          </div>

          {/* Info */}
          {canAutoclave && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-2 sm:p-3">
              <p className="text-[10px] text-amber-300 sm:text-xs">
                ✨ {autoclaveCount}× = {autoclaveCount * 12} tools baru
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
