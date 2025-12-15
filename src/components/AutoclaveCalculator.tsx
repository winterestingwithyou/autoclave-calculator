/**
 * Autoclave Calculator - Main Interactive Component
 * Mobile-first, aesthetic design with great UX
 */

import { useState, useEffect, useCallback } from "react";
import { TOOL_NAMES, AUTOCLAVE_IMAGE, type ToolType } from "../lib/tools";
import { calculateFullAutoclave, type ToolInput } from "../lib/autoclave";
import {
  calculateValueDifference,
  getValueBreakdown,
  createPriceMap,
  type PriceType,
} from "../lib/pricing";
import {
  initializeDB,
  getAllToolQuantities,
  getAllToolPrices,
  setToolQuantity,
  setToolPrice,
  resetAllToolQuantities,
  resetAllToolPrices,
  getAllMinRemainders,
  setMinRemainder as saveMinRemainder,
  resetAllMinRemainders,
  getAllAutoRepeats,
  setAutoRepeat as saveAutoRepeat,
  resetAllAutoRepeats,
  type ToolMinRemainders,
  type ToolAutoRepeats,
} from "../lib/db";
import { MobileToolCard } from "./MobileToolCard";
import { ResultsView } from "./ResultsView";
import { GrowscanImport } from "./GrowscanImport";

interface PriceData {
  value: number;
  type: PriceType;
}

export function AutoclaveCalculator() {
  const [quantities, setQuantities] = useState<Map<ToolType, number>>(
    new Map(),
  );
  const [prices, setPrices] = useState<Map<ToolType, PriceData>>(new Map());
  const [minRemainders, setMinRemainders] = useState<ToolMinRemainders>({});
  const [autoRepeats, setAutoRepeats] = useState<ToolAutoRepeats>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"input" | "result">("input");
  const [expandedTool, setExpandedTool] = useState<ToolType | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    // Prevent double initialization (React Strict Mode)
    if (hasInitialized) return;

    let isMounted = true;
    async function loadData() {
      try {
        await initializeDB();

        if (!isMounted) return;

        const storedQuantities = await getAllToolQuantities();
        const storedPrices = await getAllToolPrices();
        const storedMinRemainders = await getAllMinRemainders();
        const storedAutoRepeats = await getAllAutoRepeats();

        if (!isMounted) return;

        const qMap = new Map<ToolType, number>();
        for (const { tool, quantity } of storedQuantities) {
          qMap.set(tool, quantity);
        }
        const pMap = new Map<ToolType, PriceData>();
        for (const { tool, priceValue, priceType } of storedPrices) {
          pMap.set(tool, { value: priceValue, type: priceType });
        }

        setQuantities(qMap);
        setPrices(pMap);
        setMinRemainders(storedMinRemainders);
        setAutoRepeats(storedAutoRepeats);
        setHasInitialized(true);
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    loadData();

    return () => {
      isMounted = false;
    };
  }, [hasInitialized]);

  const handleQuantityChange = useCallback(
    async (tool: ToolType, quantity: number) => {
      setQuantities((prev) => {
        const next = new Map(prev);
        next.set(tool, quantity);
        return next;
      });
      try {
        await setToolQuantity(tool, quantity);
      } catch (e) {
        console.error("Failed to save quantity:", e);
      }
    },
    [],
  );

  const handlePriceChange = useCallback(
    async (tool: ToolType, value: number, type: PriceType) => {
      setPrices((prev) => {
        const next = new Map(prev);
        next.set(tool, { value, type });
        return next;
      });
      try {
        await setToolPrice(tool, value, type);
      } catch (e) {
        console.error("Failed to save price:", e);
      }
    },
    [],
  );

  const handleMinRemainderChange = useCallback(
    async (tool: ToolType, value: number) => {
      setMinRemainders((prev) => ({ ...prev, [tool]: Math.max(0, value) }));
      try {
        await saveMinRemainder(tool, Math.max(0, value));
      } catch (e) {
        console.error(e);
      }
    },
    [],
  );

  const handleAutoRepeatChange = useCallback(
    async (tool: ToolType, value: boolean) => {
      setAutoRepeats((prev) => ({ ...prev, [tool]: value }));
      try {
        await saveAutoRepeat(tool, value);
      } catch (e) {
        console.error(e);
      }
    },
    [],
  );

  const handleResetAll = useCallback(async () => {
    if (!confirm("Reset semua data?")) return;
    try {
      await Promise.all([
        resetAllToolQuantities(),
        resetAllToolPrices(),
        resetAllMinRemainders(),
        resetAllAutoRepeats(),
      ]);
      setQuantities(new Map());
      const newPrices = new Map<ToolType, PriceData>();
      const newMin: ToolMinRemainders = {};
      const newAuto: ToolAutoRepeats = {};
      TOOL_NAMES.forEach((t) => {
        newPrices.set(t, { value: 0, type: "wl-each" });
        newMin[t] = 0;
        newAuto[t] = true;
      });
      setPrices(newPrices);
      setMinRemainders(newMin);
      setAutoRepeats(newAuto);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleGrowscanImport = useCallback(
    async (importedQuantities: Map<ToolType, number>) => {
      // Update state
      setQuantities(importedQuantities);
      
      // Save to IndexedDB
      for (const [tool, quantity] of importedQuantities) {
        try {
          await setToolQuantity(tool, quantity);
        } catch (e) {
          console.error(`Failed to save ${tool}:`, e);
        }
      }
    },
    [],
  );

  const inputs: ToolInput[] = TOOL_NAMES.map((tool) => ({
    tool,
    quantity: quantities.get(tool) || 0,
    minRemainder: minRemainders[tool] || 0,
    autoRepeat: autoRepeats[tool] !== false,
  }));

  const calculation = calculateFullAutoclave(inputs);
  const priceMap = createPriceMap(
    TOOL_NAMES.map((tool) => {
      const p = prices.get(tool) || { value: 0, type: "wl-each" as PriceType };
      return { tool, priceValue: p.value, priceType: p.type };
    }),
  );
  const valueCalc = calculateValueDifference(calculation, priceMap);
  const breakdown = getValueBreakdown(calculation, priceMap);
  const totalTools = inputs.reduce((sum, i) => sum + i.quantity, 0);
  const totalAutoclaves = calculation.results.reduce(
    (sum, r) => sum + r.autoclaveCount,
    0,
  );
  const toolsWithQuantity = inputs.filter((i) => i.quantity > 0).length;

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-500/30 border-t-amber-500" />
          <p className="text-sm text-neutral-400">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-2 pb-24 sm:px-4">
      {/* Hero Stats Card */}
      <div className="relative mb-4 overflow-hidden rounded-xl border border-amber-500/20 bg-linear-to-br from-amber-500/10 via-orange-500/5 to-transparent p-3 sm:mb-6 sm:rounded-2xl sm:p-5">
        <div className="absolute top-0 right-0 h-24 w-24 translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/10 blur-3xl sm:h-32 sm:w-32" />
        <div className="relative">
          <div className="mb-3 flex items-center justify-between gap-2 sm:mb-4">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              {/* Autoclave Image */}
              <img
                src={AUTOCLAVE_IMAGE}
                alt="Autoclave"
                className="h-10 w-10 shrink-0 object-contain sm:h-12 sm:w-12"
              />
              <div className="min-w-0">
                <p className="mb-0.5 text-[10px] tracking-wider text-neutral-400 uppercase sm:mb-1 sm:text-xs">
                  Total Nilai
                </p>
                <p className="truncate text-xl font-bold text-white sm:text-2xl">
                  {valueCalc.beforeValue.toFixed(1)}{" "}
                  <span className="text-amber-400">WL</span>
                </p>
              </div>
            </div>
            {totalAutoclaves > 0 && (
              <div
                className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium sm:px-3 sm:py-1.5 sm:text-sm ${
                  valueCalc.difference >= 0
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {valueCalc.difference >= 0 ? "+" : ""}
                {valueCalc.difference.toFixed(2)}
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <MiniStat label="Tools" value={totalTools} />
            <MiniStat
              label="Autoclave"
              value={`${totalAutoclaves}x`}
              highlight
            />
            <MiniStat label="Iterasi" value={calculation.iterations} />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-2 z-20 mb-3 flex gap-1 rounded-xl bg-neutral-900/80 p-1 backdrop-blur-lg sm:mb-4 sm:gap-2">
        <TabButton
          active={activeTab === "input"}
          onClick={() => setActiveTab("input")}
          icon="📝"
        >
          Input
        </TabButton>
        <TabButton
          active={activeTab === "result"}
          onClick={() => setActiveTab("result")}
          icon="📊"
          badge={totalAutoclaves > 0 ? totalAutoclaves : undefined}
        >
          Hasil
        </TabButton>
      </div>

      {activeTab === "input" ? (
        <div className="space-y-2 sm:space-y-3">
          {/* Growscan Import Button */}
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 sm:gap-2 sm:text-xs">
              <span>💡</span>
              <span>Tap untuk expand • {toolsWithQuantity}/13 diisi</span>
            </div>
            <GrowscanImport 
              onImport={handleGrowscanImport}
              currentQuantities={quantities}
            />
          </div>

          {/* Tool Cards */}
          {TOOL_NAMES.map((tool) => {
            const priceData = prices.get(tool) || {
              value: 0,
              type: "wl-each" as PriceType,
            };
            const qty = quantities.get(tool) || 0;
            const summary = calculation.summary.find((s) => s.tool === tool);
            return (
              <MobileToolCard
                key={tool}
                tool={tool}
                quantity={qty}
                priceValue={priceData.value}
                priceType={priceData.type}
                minRemainder={minRemainders[tool] || 0}
                autoRepeat={autoRepeats[tool] !== false}
                finalQuantity={summary?.finalQuantity || qty}
                isExpanded={expandedTool === tool}
                onToggleExpand={() =>
                  setExpandedTool(expandedTool === tool ? null : tool)
                }
                onQuantityChange={handleQuantityChange}
                onPriceChange={handlePriceChange}
                onMinRemainderChange={handleMinRemainderChange}
                onAutoRepeatChange={handleAutoRepeatChange}
              />
            );
          })}

          {/* Settings Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex w-full items-center justify-center gap-1.5 py-2 text-xs text-neutral-500 transition-colors hover:text-neutral-300 sm:gap-2 sm:py-3 sm:text-sm"
          >
            <span>⚙️</span>
            <span>{showSettings ? "Sembunyikan" : "Tampilkan"} Setting</span>
          </button>

          {showSettings && (
            <div className="space-y-2 rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 sm:space-y-3 sm:p-4">
              <p className="text-xs font-medium text-neutral-300 sm:text-sm">
                Reset Data
              </p>
              <button
                onClick={handleResetAll}
                className="w-full rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20 sm:px-4 sm:py-2.5 sm:text-sm"
              >
                🗑️ Reset Semua
              </button>
            </div>
          )}
        </div>
      ) : (
        <ResultsView
          calculation={calculation}
          valueCalc={valueCalc}
          breakdown={breakdown}
        />
      )}

      {/* Floating CTA */}
      {activeTab === "input" && totalAutoclaves > 0 && (
        <div className="fixed right-2 bottom-4 left-2 z-30 mx-auto max-w-lg sm:right-4 sm:bottom-6 sm:left-4">
          <button
            onClick={() => setActiveTab("result")}
            className="flex w-full items-center justify-between gap-2 rounded-xl bg-linear-to-r from-amber-500 to-orange-500 px-3 py-3 font-semibold text-white shadow-lg shadow-amber-500/25 transition-transform active:scale-[0.98] sm:rounded-2xl sm:px-6 sm:py-4"
          >
            <span className="truncate text-sm sm:text-base">Lihat Hasil</span>
            <span className="shrink-0 rounded-full bg-white/20 px-2 py-0.5 text-xs sm:px-3 sm:py-1 sm:text-sm">
              {totalAutoclaves}× • {calculation.iterations}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

function MiniStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className="min-w-0 text-center">
      <p className="mb-0.5 truncate text-[10px] text-neutral-500 sm:text-xs">
        {label}
      </p>
      <p
        className={`truncate text-sm font-semibold sm:text-base ${highlight ? "text-amber-400" : "text-white"}`}
      >
        {value}
      </p>
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: string;
  badge?: number;
  children: React.ReactNode;
}

function TabButton({ active, onClick, icon, badge, children }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-medium transition-all sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm ${
        active
          ? "bg-amber-500 text-white shadow-lg shadow-amber-500/25"
          : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
      }`}
    >
      <span className="text-sm sm:text-base">{icon}</span>
      <span>{children}</span>
      {badge !== undefined && (
        <span
          className={`rounded-full px-1 py-0.5 text-[10px] sm:px-1.5 sm:text-xs ${
            active ? "bg-white/20" : "bg-amber-500/20 text-amber-400"
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
