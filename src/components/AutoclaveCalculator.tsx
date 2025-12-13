/**
 * Autoclave Calculator - Main Interactive Component
 * Mobile-first, aesthetic design with great UX
 */

import { useState, useEffect, useCallback } from 'react';
import { TOOL_NAMES, type ToolType } from '../lib/tools';
import { calculateFullAutoclave, type ToolInput } from '../lib/autoclave';
import {
  calculateValueDifference,
  getValueBreakdown,
  createPriceMap,
  type PriceType,
} from '../lib/pricing';
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
} from '../lib/db';
import { MobileToolCard } from './MobileToolCard';
import { ResultsView } from './ResultsView';

interface PriceData {
  value: number;
  type: PriceType;
}

export function AutoclaveCalculator() {
  const [quantities, setQuantities] = useState<Map<ToolType, number>>(new Map());
  const [prices, setPrices] = useState<Map<ToolType, PriceData>>(new Map());
  const [minRemainders, setMinRemainders] = useState<ToolMinRemainders>({});
  const [autoRepeats, setAutoRepeats] = useState<ToolAutoRepeats>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'input' | 'result'>('input');
  const [expandedTool, setExpandedTool] = useState<ToolType | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        await initializeDB();
        const storedQuantities = await getAllToolQuantities();
        const storedPrices = await getAllToolPrices();
        const storedMinRemainders = await getAllMinRemainders();
        const storedAutoRepeats = await getAllAutoRepeats();

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
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

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
        console.error(e);
      }
    },
    []
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
        console.error(e);
      }
    },
    []
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
    []
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
    []
  );

  const handleResetAll = useCallback(async () => {
    if (!confirm('Reset semua data?')) return;
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
        newPrices.set(t, { value: 0, type: 'wl-each' });
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

  const inputs: ToolInput[] = TOOL_NAMES.map((tool) => ({
    tool,
    quantity: quantities.get(tool) || 0,
    minRemainder: minRemainders[tool] || 0,
    autoRepeat: autoRepeats[tool] !== false,
  }));

  const calculation = calculateFullAutoclave(inputs);
  const priceMap = createPriceMap(
    TOOL_NAMES.map((tool) => {
      const p = prices.get(tool) || { value: 0, type: 'wl-each' as PriceType };
      return { tool, priceValue: p.value, priceType: p.type };
    })
  );
  const valueCalc = calculateValueDifference(calculation, priceMap);
  const breakdown = getValueBreakdown(calculation, priceMap);
  const totalTools = inputs.reduce((sum, i) => sum + i.quantity, 0);
  const totalAutoclaves = calculation.results.reduce(
    (sum, r) => sum + r.autoclaveCount,
    0
  );
  const toolsWithQuantity = inputs.filter((i) => i.quantity > 0).length;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          <p className="text-neutral-400 text-sm">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pb-24">
      {/* Hero Stats Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 p-5 mb-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-neutral-400 text-xs uppercase tracking-wider mb-1">
                Total Nilai
              </p>
              <p className="text-2xl font-bold text-white">
                {valueCalc.beforeValue.toFixed(1)}{' '}
                <span className="text-amber-400">WL</span>
              </p>
            </div>
            {totalAutoclaves > 0 && (
              <div
                className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                  valueCalc.difference >= 0
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {valueCalc.difference >= 0 ? '+' : ''}
                {valueCalc.difference.toFixed(2)} WL
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <MiniStat label="Tools" value={totalTools} />
            <MiniStat label="Autoclave" value={`${totalAutoclaves}x`} highlight />
            <MiniStat label="Iterasi" value={calculation.iterations} />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 p-1 bg-neutral-900/80 backdrop-blur-lg rounded-xl mb-4 sticky top-2 z-20">
        <TabButton
          active={activeTab === 'input'}
          onClick={() => setActiveTab('input')}
          icon="📝"
        >
          Input
        </TabButton>
        <TabButton
          active={activeTab === 'result'}
          onClick={() => setActiveTab('result')}
          icon="📊"
          badge={totalAutoclaves > 0 ? totalAutoclaves : undefined}
        >
          Hasil
        </TabButton>
      </div>

      {activeTab === 'input' ? (
        <div className="space-y-3">
          {/* Help text */}
          <div className="flex items-center gap-2 text-xs text-neutral-500 px-1">
            <span>💡</span>
            <span>
              Tap card untuk expand • {toolsWithQuantity}/13 tools diisi
            </span>
          </div>

          {/* Tool Cards */}
          {TOOL_NAMES.map((tool) => {
            const priceData = prices.get(tool) || {
              value: 0,
              type: 'wl-each' as PriceType,
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
            className="w-full py-3 text-neutral-500 text-sm flex items-center justify-center gap-2 hover:text-neutral-300 transition-colors"
          >
            <span>⚙️</span>
            <span>{showSettings ? 'Sembunyikan' : 'Tampilkan'} Pengaturan</span>
          </button>

          {showSettings && (
            <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 space-y-3">
              <p className="text-sm font-medium text-neutral-300">Reset Data</p>
              <button
                onClick={handleResetAll}
                className="w-full py-2.5 px-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors"
              >
                🗑️ Reset Semua Data
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
      {activeTab === 'input' && totalAutoclaves > 0 && (
        <div className="fixed bottom-6 left-4 right-4 max-w-lg mx-auto z-30">
          <button
            onClick={() => setActiveTab('result')}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-lg shadow-amber-500/25 flex items-center justify-between active:scale-[0.98] transition-transform"
          >
            <span>Lihat Hasil Autoclave</span>
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
              {totalAutoclaves}x • {calculation.iterations} iterasi
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
    <div className="text-center">
      <p className="text-neutral-500 text-xs mb-0.5">{label}</p>
      <p className={`font-semibold ${highlight ? 'text-amber-400' : 'text-white'}`}>
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
      className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
        active
          ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25'
          : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
      }`}
    >
      <span>{icon}</span>
      <span>{children}</span>
      {badge !== undefined && (
        <span
          className={`px-1.5 py-0.5 rounded-full text-xs ${
            active ? 'bg-white/20' : 'bg-amber-500/20 text-amber-400'
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
