/**
 * Bulk Price Update Component
 * Allows updating prices for multiple tools at once
 */

import { useState } from "react";
import { TOOL_NAMES, TOOL_METADATA, type ToolType } from "../lib/tools";
import type { PriceType } from "../lib/pricing";

interface BulkPriceUpdateProps {
  onBulkUpdate: (
    tools: ToolType[],
    priceValue: number,
    priceType: PriceType,
  ) => void;
  onClose: () => void;
}

export function BulkPriceUpdate({
  onBulkUpdate,
  onClose,
}: BulkPriceUpdateProps) {
  const [selectedTools, setSelectedTools] = useState<Set<ToolType>>(new Set());
  const [priceValue, setPriceValue] = useState<number>(0);
  const [priceType, setPriceType] = useState<PriceType>("wl-each");

  const toggleTool = (tool: ToolType) => {
    setSelectedTools((prev) => {
      const next = new Set(prev);
      if (next.has(tool)) {
        next.delete(tool);
      } else {
        next.add(tool);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedTools(new Set(TOOL_NAMES));
  };

  const deselectAll = () => {
    setSelectedTools(new Set());
  };

  const handleApply = () => {
    if (selectedTools.size === 0) {
      alert("Pilih minimal 1 tool");
      return;
    }
    if (priceValue <= 0) {
      alert("Masukkan harga yang valid");
      return;
    }
    onBulkUpdate(Array.from(selectedTools), priceValue, priceType);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 mx-auto flex items-end justify-center bg-black/60 px-2 py-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-t-2xl border border-neutral-800 bg-neutral-900 shadow-2xl sm:max-w-2xl sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 p-3 sm:p-5">
          <div className="flex items-center gap-2">
            <span className="text-lg sm:text-2xl">💰</span>
            <h2 className="text-sm font-bold text-white sm:text-lg">
              Update Harga Sekaligus
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-white sm:h-8 sm:w-8"
          >
            <svg
              className="h-4 w-4 sm:h-5 sm:w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[50vh] overflow-y-auto p-3 sm:max-h-[60vh] sm:p-5">
          {/* Tool Selection */}
          <div className="mb-3 sm:mb-4">
            <div className="mb-2 flex items-center justify-between sm:mb-3">
              <label className="text-xs font-medium text-neutral-300 sm:text-sm">
                Pilih Tools ({selectedTools.size}/13)
              </label>
              <div className="flex gap-1.5 sm:gap-2">
                <button
                  onClick={selectAll}
                  className="rounded-lg bg-neutral-800 px-2 py-0.5 text-[10px] text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white sm:px-3 sm:py-1 sm:text-xs"
                >
                  Pilih Semua
                </button>
                <button
                  onClick={deselectAll}
                  className="rounded-lg bg-neutral-800 px-2 py-0.5 text-[10px] text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white sm:px-3 sm:py-1 sm:text-xs"
                >
                  Hapus Semua
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5 sm:gap-3">
              {TOOL_NAMES.map((tool) => {
                const metadata = TOOL_METADATA[tool];
                const isSelected = selectedTools.has(tool);
                return (
                  <button
                    key={tool}
                    onClick={() => toggleTool(tool)}
                    className={`flex flex-col items-center gap-1 rounded-lg border-2 p-1.5 transition-all sm:gap-2 sm:rounded-xl sm:p-3 ${
                      isSelected
                        ? "border-amber-500 bg-amber-500/10"
                        : "border-neutral-800 bg-neutral-900/50 hover:border-neutral-700"
                    }`}
                    title={metadata.shortName}
                  >
                    <div
                      className={`relative flex h-8 w-8 items-center justify-center rounded-md sm:h-12 sm:w-12 sm:rounded-lg ${
                        isSelected ? "bg-amber-500/20" : "bg-neutral-800/50"
                      }`}
                    >
                      <img
                        src={metadata.image}
                        alt={metadata.shortName}
                        className="h-6 w-6 object-contain sm:h-10 sm:w-10"
                        loading="lazy"
                      />
                      {isSelected && (
                        <div className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[8px] text-white sm:-top-1 sm:-right-1 sm:h-4 sm:w-4 sm:text-[10px]">
                          ✓
                        </div>
                      )}
                    </div>
                    <span
                      className={`line-clamp-2 text-center text-[8px] leading-tight sm:text-[10px] ${
                        isSelected
                          ? "font-medium text-amber-400"
                          : "text-neutral-500"
                      }`}
                    >
                      {metadata.shortName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Input */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 sm:p-4">
            <label className="mb-2 block text-xs font-medium text-neutral-300 sm:mb-3 sm:text-sm">
              Harga yang Akan Diterapkan
            </label>
            <div className="flex items-center gap-2 sm:gap-3">
              <input
                type="number"
                min="0"
                step="0.01"
                value={priceValue || ""}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setPriceValue(isNaN(val) ? 0 : val);
                }}
                placeholder="0"
                className="flex-1 [appearance:textfield] rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none sm:px-4 sm:py-2.5 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <select
                value={priceType}
                onChange={(e) => setPriceType(e.target.value as PriceType)}
                className="cursor-pointer rounded-lg border border-neutral-700 bg-neutral-900 px-2 py-2 text-xs text-white focus:border-amber-500 focus:outline-none sm:px-4 sm:py-2.5 sm:text-sm"
              >
                <option value="wl-each">WL each</option>
                <option value="items-per-wl">Items per WL</option>
              </select>
            </div>
            <p className="mt-2 text-[10px] text-neutral-500 sm:text-xs">
              {priceType === "wl-each"
                ? "Harga per 1 tool (contoh: 0.5 = 1/2 WL per tool)"
                : "Jumlah tools per 1 WL (contoh: 2 = 2 tools untuk 1 WL)"}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 border-t border-neutral-800 p-3 sm:gap-3 sm:p-5">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-neutral-700 bg-neutral-800 py-2 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-700 hover:text-white sm:py-3"
          >
            Batal
          </button>
          <button
            onClick={handleApply}
            disabled={selectedTools.size === 0 || priceValue <= 0}
            className="flex-1 rounded-xl bg-linear-to-r from-amber-500 to-orange-500 py-2 text-sm font-bold text-white shadow-lg shadow-amber-500/25 transition-all hover:from-amber-400 hover:to-orange-400 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none sm:py-3"
          >
            Terapkan ({selectedTools.size} tools)
          </button>
        </div>
      </div>
    </div>
  );
}
