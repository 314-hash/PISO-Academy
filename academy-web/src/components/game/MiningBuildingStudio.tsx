import React, { useState, useEffect } from 'react';
import { PlayerStatsEngine, PlayerStats } from '../../services/PlayerStatsEngine';
import {
  MiningBlockEngine,
  loadInventory,
  ResourceInventory,
  BLOCK_DEFS,
  BlockType,
  STRUCTURE_DEFS,
  StructureDef,
  StructureCategory,
  StructureStyleTheme,
  StructureModifications,
  PlacedStructureRecord,
  loadPlacedStructures,
  dismantlePlacedStructure,
  BLOCK_BUNDLES,
  BlockBundle,
  buyBlocksWithPiso,
  buyBundleWithPiso,
  buyMissingRecipeMaterialsWithPiso,
} from '../../services/MiningBlockEngine';
import { PisoEconomyService } from '../../services/pisoEconomyService';
import { SoundFX } from '../../services/soundFX';

interface Props {
  onClose: () => void;
  miningEngine: MiningBlockEngine | null;
}

type Tab = 'mine' | 'build' | 'market' | 'leaderboard';

export const MiningBuildingStudio: React.FC<Props> = ({ onClose, miningEngine }) => {
  const [activeTab, setActiveTab] = useState<Tab>('mine');
  const [stats, setStats] = useState<PlayerStats>(PlayerStatsEngine.getStats());
  const [inventory, setInventory] = useState<ResourceInventory>(loadInventory());
  const [pisoBalance, setPisoBalance] = useState<number>(PisoEconomyService.getSpendablePiso());
  const [selectedQtyMap, setSelectedQtyMap] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(null);

  // Real 3D Structure Modifications & Placement State
  const [selectedCategory, setSelectedCategory] = useState<StructureCategory>(
    miningEngine?.selectedStructureCategory || 1
  );
  const [rotationDeg, setRotationDeg] = useState<number>(
    Math.round(((miningEngine?.structureModifications.rotationY || 0) * 180) / Math.PI) % 360
  );
  const [selectedTheme, setSelectedTheme] = useState<StructureStyleTheme>(
    miningEngine?.structureModifications.styleTheme || 'narra'
  );
  const [selectedScale, setSelectedScale] = useState<number>(
    miningEngine?.structureModifications.scale || 1.0
  );
  const [customNameInput, setCustomNameInput] = useState<string>(
    miningEngine?.structureModifications.customName || ''
  );
  const [placedStructures, setPlacedStructures] = useState<PlacedStructureRecord[]>(() =>
    loadPlacedStructures()
  );

  useEffect(() => {
    const handleStatsUpdate = (e: any) => setStats(e.detail || PlayerStatsEngine.getStats());
    const handleInvUpdate = (e: any) => setInventory(e.detail || loadInventory());
    const handleBalanceUpdate = () => setPisoBalance(PisoEconomyService.getSpendablePiso());

    const handleStructuresUpdate = () => {
      setPlacedStructures(loadPlacedStructures());
    };

    window.addEventListener('piso-player-stats-updated', handleStatsUpdate);
    window.addEventListener('piso-inventory-updated', handleInvUpdate);
    window.addEventListener('piso-tokens-deducted', handleBalanceUpdate);
    window.addEventListener('piso-harvest-success', handleBalanceUpdate);
    window.addEventListener('piso-activity-earned', handleBalanceUpdate);
    window.addEventListener('piso-farming-stats-updated', handleBalanceUpdate);
    window.addEventListener('piso-structures-updated', handleStructuresUpdate);

    return () => {
      window.removeEventListener('piso-player-stats-updated', handleStatsUpdate);
      window.removeEventListener('piso-inventory-updated', handleInvUpdate);
      window.removeEventListener('piso-tokens-deducted', handleBalanceUpdate);
      window.removeEventListener('piso-harvest-success', handleBalanceUpdate);
      window.removeEventListener('piso-activity-earned', handleBalanceUpdate);
      window.removeEventListener('piso-farming-stats-updated', handleBalanceUpdate);
      window.removeEventListener('piso-structures-updated', handleStructuresUpdate);
    };
  }, []);

  const showToast = (text: string, isError: boolean = false) => {
    setFeedback({ text, isError });
    setTimeout(() => setFeedback(null), 4000);
  };

  const getQuantity = (type: string) => selectedQtyMap[type] || 10;
  const setQuantity = (type: string, qty: number) => {
    setSelectedQtyMap((prev) => ({ ...prev, [type]: Math.max(1, qty) }));
  };

  const handleBuySingle = (type: BlockType) => {
    const qty = getQuantity(type);
    const result = buyBlocksWithPiso(type, qty, stats.level);
    if (result.success) {
      showToast(result.message, false);
      setPisoBalance(PisoEconomyService.getSpendablePiso());
      setInventory(loadInventory());
    } else {
      showToast(result.message, true);
    }
  };

  const handleBuyBundle = (bundle: BlockBundle) => {
    const result = buyBundleWithPiso(bundle.id, stats.level);
    if (result.success) {
      showToast(result.message, false);
      setPisoBalance(PisoEconomyService.getSpendablePiso());
      setInventory(loadInventory());
    } else {
      showToast(result.message, true);
    }
  };

  const handleAutoBuyMissing = (recipe: Partial<Record<string, number>>) => {
    const result = buyMissingRecipeMaterialsWithPiso(recipe);
    if (result.success) {
      showToast(result.message, false);
      setPisoBalance(PisoEconomyService.getSpendablePiso());
      setInventory(loadInventory());
    } else {
      showToast(result.message, true);
    }
  };

  const handleApplyModifications = (
    cat: StructureCategory = selectedCategory,
    rot: number = rotationDeg,
    theme: StructureStyleTheme = selectedTheme,
    scale: number = selectedScale,
    name: string = customNameInput
  ) => {
    if (!miningEngine) return;
    miningEngine.placementMode = 'structure';
    miningEngine.selectedStructureCategory = cat;
    miningEngine.setModifications({
      rotationY: (rot * Math.PI) / 180,
      scale,
      styleTheme: theme,
      customName: name,
    });
  };

  const handleDismantle = (id: string, name: string) => {
    if (!miningEngine) return;
    const success = miningEngine.dismantleStructure(id);
    if (success) {
      showToast(`Matagumpay na nabaklas ang ${name}! 70% ng materyales ay naibalik.`);
      setInventory(loadInventory());
      setPlacedStructures(loadPlacedStructures());
    } else {
      showToast('Hindi nabaklas ang estruktura.', true);
    }
  };

  // ─── Mine Tab ───────────────────────────────────────────────────────────
  const renderMineTab = () => {
    return (
      <div className="flex flex-col h-full gap-4 overflow-y-auto pr-1">
        {/* Mining & Progression Stats */}
        <div className="bg-slate-900/80 rounded-xl p-4 border border-amber-500/20 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black text-amber-400 font-display uppercase tracking-wider flex items-center gap-2">
              <span>⛏️</span> Progression & Mining
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold">
              Level {stats.level}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-black/40 rounded-lg p-2.5 border border-white/5">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Total Blocks Mined</div>
              <div className="text-lg font-black text-white font-mono">{stats.blocksMinedTotal}</div>
            </div>
            <div className="bg-black/40 rounded-lg p-2.5 border border-white/5">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">EXP to Next Level</div>
              <div className="text-lg font-black text-cyan-300 font-mono">
                {stats.currentExp} / {stats.expToNextLevel}
              </div>
            </div>
          </div>

          {/* Level EXP Bar */}
          <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden border border-white/10">
            <div
              className="bg-gradient-to-r from-amber-500 to-cyan-400 h-full transition-all duration-300"
              style={{
                width: `${Math.min(100, Math.round((stats.currentExp / Math.max(1, stats.expToNextLevel)) * 100))}%`,
              }}
            />
          </div>
        </div>

        {/* Quick Buy Banner */}
        <div className="bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-cyan-950/40 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🪙</span>
            <div>
              <div className="text-xs font-bold text-white">Need building materials?</div>
              <div className="text-[11px] text-amber-300 font-mono">Balance: {pisoBalance.toLocaleString(undefined, { maximumFractionDigits: 1 })} ₱PISO</div>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('market')}
            className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-lg shadow uppercase tracking-wide transition-transform active:scale-95"
          >
            🛒 Buy Blocks
          </button>
        </div>

        {/* Resource Inventory */}
        <div className="bg-slate-900/80 rounded-xl p-4 border border-white/10 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black text-amber-400 font-display uppercase tracking-wider flex items-center gap-2">
              <span>📦</span> Resource Inventory
            </h3>
            <span className="text-[11px] text-slate-400">
              {Object.keys(inventory).length} Item Types
            </span>
          </div>

          {Object.keys(inventory).length === 0 ? (
            <div className="text-center text-slate-400 py-10 flex flex-col items-center justify-center flex-1">
              <span className="text-3xl mb-2 opacity-50">🪵</span>
              <p className="text-xs max-w-xs mb-3">No resources yet. Mine blocks in the Terranian world or purchase with $PISO tokens!</p>
              <button
                onClick={() => setActiveTab('market')}
                className="px-4 py-2 bg-amber-600/80 hover:bg-amber-500 text-white text-xs font-bold rounded-lg transition-colors"
              >
                Go to Block Store
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 overflow-y-auto pr-1 flex-1">
              {Object.entries(inventory).map(([item, qty]) => {
                const def = Object.values(BLOCK_DEFS).find((d) => d.dropItem === item);
                return (
                  <div
                    key={item}
                    className="bg-black/40 rounded-lg p-2.5 flex items-center justify-between border border-white/5 hover:border-white/20 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl flex-shrink-0">{def?.dropEmoji || '📦'}</span>
                      <div className="min-w-0">
                        <div className="text-xs text-slate-300 font-bold truncate">{item}</div>
                        <div className="text-sm font-black text-amber-400 font-mono">{qty}</div>
                      </div>
                    </div>
                    {def && (
                      <button
                        onClick={() => {
                          setActiveTab('market');
                          setSelectedQtyMap((prev) => ({ ...prev, [def.type]: 10 }));
                        }}
                        className="text-[10px] px-2 py-1 bg-white/10 hover:bg-amber-500 hover:text-black text-white/80 rounded transition-colors font-bold uppercase"
                        title={`Buy more ${item} with $PISO`}
                      >
                        +Buy
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─── Build Tab ──────────────────────────────────────────────────────────
  const renderBuildTab = () => {
    return (
      <div className="flex flex-col h-full gap-4 overflow-y-auto pr-1">
        {/* Builder Mode Header & Placement Mode Selector */}
        <div className="bg-slate-900/80 rounded-xl p-4 border border-amber-500/20 text-center shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-black text-amber-400 font-display uppercase tracking-wider flex items-center gap-2">
              <span>🏗️</span> Metaworld Construction Studio
            </h3>
            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
              miningEngine?.builderMode
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}>
              {miningEngine?.builderMode ? '● Builder Active' : '○ Standby'}
            </span>
          </div>

          <p className="text-xs text-slate-300 mb-3 text-left">
            Maglagay ng mga totoong 3D architectural structure na may mga modipikasyon (pag-ikot, tema ng materyal, laki, at pangalan).
          </p>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              type="button"
              onClick={() => {
                if (miningEngine) {
                  miningEngine.placementMode = 'structure';
                  handleApplyModifications(selectedCategory);
                }
              }}
              className={`py-2 rounded-lg text-xs font-bold font-mono transition-all flex items-center justify-center gap-1.5 ${
                miningEngine?.placementMode === 'structure'
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <span>🏠</span>
              <span>3D Structures</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (miningEngine) {
                  miningEngine.placementMode = 'block';
                }
              }}
              className={`py-2 rounded-lg text-xs font-bold font-mono transition-all flex items-center justify-center gap-1.5 ${
                miningEngine?.placementMode === 'block'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <span>🟫</span>
              <span>Single Blocks</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              if (miningEngine) {
                miningEngine.builderMode = !miningEngine.builderMode;
                if (miningEngine.builderMode) {
                  miningEngine.placementMode = 'structure';
                  handleApplyModifications(selectedCategory);
                  showToast('🏗️ Builder Mode Active! I-click ang lupa o pindutin ang "B" para itayo. "R" para paikutin.');
                }
              }
            }}
            className={`w-full py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all shadow-md ${
              miningEngine?.builderMode
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950'
            }`}
          >
            {miningEngine?.builderMode ? 'I-off ang Builder Mode' : 'Paganahin ang Builder Mode (Hotkey: V)'}
          </button>
        </div>

        {/* ─── REAL 3D STRUCTURE MODIFICATIONS PANEL ─── */}
        <div className="bg-gradient-to-br from-[#161F30] via-[#0F172A] to-[#161F30] rounded-xl p-4 border border-cyan-500/30 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center space-x-2">
              <span className="text-xl">{STRUCTURE_DEFS[selectedCategory]?.emoji || '🏠'}</span>
              <div>
                <div className="text-xs font-black text-white font-display uppercase tracking-wider">
                  Modipikasyon: {STRUCTURE_DEFS[selectedCategory]?.name || 'Bahay'}
                </div>
                <div className="text-[10px] text-cyan-400">I-customize bago itayo sa Terranian Metaverse</div>
              </div>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-black/40 px-2 py-0.5 rounded border border-white/5">
              Rot: {rotationDeg}° | Scale: {selectedScale}x
            </span>
          </div>

          {/* 1. Rotation Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400 font-mono flex items-center gap-1">
                <span>🔄</span>
                <span>Direksyon ng Pag-ikot (Rotation):</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  const nextRot = (rotationDeg + 90) % 360;
                  setRotationDeg(nextRot);
                  handleApplyModifications(selectedCategory, nextRot, selectedTheme, selectedScale, customNameInput);
                }}
                className="text-[10px] font-mono text-amber-400 hover:text-amber-300 underline"
              >
                Paikutin +90° (Hotkey: R)
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[0, 90, 180, 270].map((deg) => (
                <button
                  key={deg}
                  type="button"
                  onClick={() => {
                    setRotationDeg(deg);
                    handleApplyModifications(selectedCategory, deg, selectedTheme, selectedScale, customNameInput);
                  }}
                  className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    rotationDeg === deg
                      ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                      : 'bg-black/40 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {deg}° {deg === 0 ? 'Harap' : deg === 90 ? 'Kanan' : deg === 180 ? 'Likod' : 'Kaliwa'}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Style Themes */}
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 font-mono mb-1.5 block">
              🎨 Tema ng Materyal at Disenyo (Style Theme):
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'narra' as StructureStyleTheme, name: 'Narra Timber', desc: 'Katutubong hardwood & sawali', emoji: '🌿', color: 'border-amber-700/50 text-amber-300' },
                { id: 'bamboo' as StructureStyleTheme, name: 'Bamboo Cane', desc: 'Sariwang kawayan & nipa', emoji: '🎋', color: 'border-emerald-600/50 text-emerald-300' },
                { id: 'cyber_neon' as StructureStyleTheme, name: 'Cyber Neon', desc: 'Matte obsidian & cyan glow', emoji: '⚡', color: 'border-cyan-500/50 text-cyan-300' },
                { id: 'kuta_stone' as StructureStyleTheme, name: 'Intramuros Stone', desc: 'Batong adobe at mga sulo', emoji: '🏰', color: 'border-slate-500/50 text-slate-300' },
              ].map((th) => (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => {
                    setSelectedTheme(th.id);
                    handleApplyModifications(selectedCategory, rotationDeg, th.id, selectedScale, customNameInput);
                  }}
                  className={`p-2 rounded-xl text-left border transition-all ${
                    selectedTheme === th.id
                      ? `bg-black/60 ${th.color} shadow-[0_0_12px_rgba(245,158,11,0.2)] font-bold`
                      : 'bg-black/30 border-slate-800/80 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs flex items-center space-x-1.5">
                    <span>{th.emoji}</span>
                    <span className="font-bold">{th.name}</span>
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5">{th.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Scale & Custom Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 font-mono mb-1 block">
                Laki ng Estruktura (Scale):
              </label>
              <div className="flex gap-1">
                {[
                  { s: 0.8, label: '0.8x Maliit' },
                  { s: 1.0, label: '1.0x Normal' },
                  { s: 1.3, label: '1.3x Malaki' },
                ].map((item) => (
                  <button
                    key={item.s}
                    type="button"
                    onClick={() => {
                      setSelectedScale(item.s);
                      handleApplyModifications(selectedCategory, rotationDeg, selectedTheme, item.s, customNameInput);
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-mono transition-all ${
                      selectedScale === item.s
                        ? 'bg-cyan-500 text-slate-950 font-black'
                        : 'bg-black/40 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 font-mono mb-1 block">
                Pangalan / 3D Signboard:
              </label>
              <input
                type="text"
                placeholder="Hal. Juan's Bahay Kubo"
                value={customNameInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomNameInput(val);
                  handleApplyModifications(selectedCategory, rotationDeg, selectedTheme, selectedScale, val);
                }}
                className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-slate-700 text-white text-xs font-mono focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Deploy Action */}
          <button
            type="button"
            onClick={() => {
              if (miningEngine) {
                miningEngine.builderMode = true;
                miningEngine.placementMode = 'structure';
                handleApplyModifications();
                showToast(`🏗️ Handa na ang ${STRUCTURE_DEFS[selectedCategory]?.name}! I-click ang lupa o pindutin ang "B" para itayo.`);
              }
            }}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-500 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-950/50 transition-all flex items-center justify-center space-x-2"
          >
            <span>🔨</span>
            <span>I-equip ang Blueprint na Ito para Itayo</span>
          </button>
        </div>

        {/* Structure Templates with 1-Click Buy Missing Materials */}
        <div className="bg-slate-900/80 rounded-xl p-4 border border-white/10 flex-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black text-cyan-400 font-display uppercase tracking-wider">
              Mga Blueprint ng Estruktura ({STRUCTURE_DEFS.filter(d => d.category !== 0).length})
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">₱PISO: {pisoBalance.toFixed(0)}</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {STRUCTURE_DEFS.map((def, i) => {
              if (def.category === 0) return null; // Skip freeform
              const canBuild = Object.entries(def.recipe).every(
                ([item, qty]) => (inventory[item] || 0) >= (qty ?? 0)
              );
              const isSelected = selectedCategory === def.category;

              // Calculate missing materials and cost
              let missingCost = 0;
              const missingList: string[] = [];
              Object.entries(def.recipe).forEach(([item, reqQty]) => {
                const cur = inventory[item] || 0;
                const diff = (reqQty || 0) - cur;
                if (diff > 0) {
                  const bDef = Object.values(BLOCK_DEFS).find((d) => d.dropItem === item);
                  if (bDef) {
                    missingCost += bDef.pricePiso * diff;
                    missingList.push(`${diff}x ${item}`);
                  }
                }
              });

              return (
                <div
                  key={i}
                  className={`bg-black/40 rounded-xl p-3.5 border transition-all ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-950/20 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                      : canBuild
                      ? 'border-cyan-500/30 hover:border-cyan-500/60'
                      : 'border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{def.emoji}</span>
                      <div>
                        <div className="font-bold text-white font-display uppercase text-sm flex items-center gap-2">
                          <span>{def.name}</span>
                          {isSelected && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-400/40">
                              Naka-pili
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">{def.benefit}</div>
                      </div>
                    </div>
                    {canBuild ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                        Handa
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40">
                        Kulang sa Gamit
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 mb-2.5 leading-relaxed">{def.description}</p>

                  {/* Materials breakdown */}
                  <div className="space-y-1 mb-3 bg-black/30 p-2 rounded-lg border border-white/5">
                    {Object.entries(def.recipe).map(([item, qty]) => {
                      const has = inventory[item] || 0;
                      const enough = has >= (qty ?? 0);
                      return (
                        <div key={item} className="flex justify-between text-xs">
                          <span className="text-slate-300">{item}</span>
                          <span className={enough ? 'text-emerald-400 font-mono font-bold' : 'text-rose-400 font-mono font-bold'}>
                            {has} / {qty}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory(def.category);
                        if (miningEngine) {
                          miningEngine.builderMode = true;
                          miningEngine.placementMode = 'structure';
                          handleApplyModifications(def.category);
                        }
                        showToast(`Napili ang ${def.name}! Handa nang ilagay sa mapa.`);
                      }}
                      className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                        isSelected
                          ? 'bg-cyan-500 text-slate-950 shadow-md'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      {isSelected ? '✓ Kasalukuyang Napili' : 'Piliin ang Blueprint'}
                    </button>

                    {!canBuild && (
                      <button
                        type="button"
                        onClick={() => handleAutoBuyMissing(def.recipe)}
                        className="px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black rounded-lg text-xs uppercase tracking-wider shadow-md transition-transform active:scale-95 flex items-center justify-center gap-1 shrink-0"
                      >
                        <span>🛒</span>
                        <span>Auto-Buy ({missingCost} ₱)</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── ACTIVE PLACED STRUCTURES REGISTRY ─── */}
        <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider font-display flex items-center gap-1.5">
              <span>🏛️</span>
              <span>Mga Naitayong Estruktura sa Mundo ({placedStructures.length})</span>
            </h3>
            <span className="text-[10px] text-slate-400">Naka-save sa Browser</span>
          </div>

          {placedStructures.length === 0 ? (
            <div className="p-4 rounded-xl bg-black/40 border border-slate-800 text-center text-xs text-slate-500">
              Wala ka pang naitatayong estruktura. Pumili ng blueprint sa itaas para magsimula!
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {placedStructures.map((s) => {
                const def = STRUCTURE_DEFS[s.category];
                return (
                  <div
                    key={s.id}
                    className="p-3 rounded-xl bg-black/40 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <span className="text-xl shrink-0">{def?.emoji || '🏠'}</span>
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate">
                          {s.customName || s.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Pos: ({s.position.x}, {s.position.z}) • {Math.round(((s.rotationY || 0) * 180) / Math.PI)}° • {s.styleTheme}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDismantle(s.id, s.customName || s.name)}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[10px] font-bold font-mono transition-colors shrink-0"
                      title="Baklasin at bawiin ang 70% ng mga materyales"
                    >
                      🗑️ Baklasin
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─── Buy Blocks ($PISO) Tab ─────────────────────────────────────────────
  const renderMarketTab = () => {
    return (
      <div className="flex flex-col h-full gap-4 overflow-y-auto pr-1">
        {/* Token Balance & Progression HUD */}
        <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-900/30 rounded-xl p-4 border border-amber-500/30 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-lg shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                ₱
              </span>
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Spendable Balance</div>
                <div className="text-xl font-black text-amber-400 font-mono tracking-tight">
                  {pisoBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $PISO
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Architect Rank</div>
              <div className="text-xs font-black text-cyan-300 font-mono">
                Level {stats.level} (Lv.{stats.level >= 31 ? '31+ Mythic' : stats.level >= 16 ? '16+ Master' : stats.level >= 6 ? '6+ Mason' : '1+ Rookie'})
              </div>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 italic">
            Tokens are deducted instantly from your game wallet to deliver building blocks directly to your inventory.
          </div>
        </div>

        {/* SECTION 1: DISCOUNTED BUILDER BUNDLES */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider font-display flex items-center gap-1.5">
              <span>🎁</span> Builder Bundles (Discounted)
            </h3>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
              Save Up to 20%
            </span>
          </div>

          <div className="space-y-3">
            {BLOCK_BUNDLES.map((bundle) => {
              const isLevelLocked = stats.level < bundle.minLevel;
              const hasBalance = pisoBalance >= bundle.pricePiso;

              return (
                <div
                  key={bundle.id}
                  className={`bg-slate-900/80 rounded-xl p-3.5 border transition-all ${
                    isLevelLocked
                      ? 'border-white/5 opacity-60'
                      : 'border-amber-500/30 hover:border-amber-500/60 shadow-lg'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{bundle.emoji}</span>
                      <div>
                        <div className="font-bold text-white text-xs uppercase font-display flex items-center gap-2">
                          <span>{bundle.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded font-mono font-bold">
                            {bundle.discountPercent}% OFF
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">{bundle.tagline}</div>
                      </div>
                    </div>
                    {isLevelLocked ? (
                      <span className="text-[10px] px-2 py-0.5 bg-rose-500/20 text-rose-300 font-bold rounded border border-rose-500/30">
                        🔒 Lv.{bundle.minLevel}+
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold rounded border border-emerald-500/30">
                        Unlocked
                      </span>
                    )}
                  </div>

                  {/* Items list */}
                  <div className="flex flex-wrap gap-1.5 my-2.5">
                    {bundle.items.map((it, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] bg-black/40 px-2 py-1 rounded border border-white/5 text-slate-300 font-mono"
                      >
                        {it.emoji} {it.qty}x {it.item}
                      </span>
                    ))}
                  </div>

                  {/* Pricing and CTA */}
                  <div className="flex items-center justify-between pt-1 border-t border-white/5">
                    <div className="flex items-baseline gap-2 font-mono">
                      <span className="text-sm font-black text-amber-400">{bundle.pricePiso} ₱</span>
                      <span className="text-xs text-slate-500 line-through">{bundle.originalPricePiso} ₱</span>
                    </div>
                    <button
                      disabled={isLevelLocked || !hasBalance}
                      onClick={() => handleBuyBundle(bundle)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                        isLevelLocked
                          ? 'bg-white/5 text-white/30 cursor-not-allowed'
                          : !hasBalance
                          ? 'bg-amber-900/40 text-amber-500/60 cursor-not-allowed border border-amber-500/20'
                          : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 shadow-md active:scale-95'
                      }`}
                    >
                      {isLevelLocked
                        ? `Req Lv.${bundle.minLevel}`
                        : !hasBalance
                        ? 'Insufficient ₱'
                        : `Buy Bundle (${bundle.pricePiso} ₱)`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: INDIVIDUAL BLOCKS CATALOG */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-xs font-black text-cyan-400 uppercase tracking-wider font-display flex items-center gap-1.5">
              <span>🧱</span> Block Catalog (8 Filipino Tiers)
            </h3>
            <span className="text-[10px] text-slate-400">Direct Delivery to Inventory</span>
          </div>

          <div className="space-y-2.5">
            {Object.values(BLOCK_DEFS).map((def) => {
              const isLocked = stats.level < def.minLevel;
              const qty = getQuantity(def.type);
              const totalCost = def.pricePiso * qty;
              const hasBalance = pisoBalance >= totalCost;

              return (
                <div
                  key={def.type}
                  className={`bg-slate-900/80 rounded-xl p-3 border transition-all ${
                    isLocked ? 'border-white/5 opacity-60' : 'border-white/10 hover:border-cyan-500/40 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{def.emoji}</span>
                      <div>
                        <div className="font-bold text-white text-xs uppercase flex items-center gap-2">
                          <span>{def.displayName}</span>
                          <span className="text-[10px] text-slate-400 font-normal">({def.dropItem})</span>
                        </div>
                        <div className="text-[10px] text-amber-400 font-mono font-bold">
                          {def.pricePiso} $PISO / block
                        </div>
                      </div>
                    </div>

                    {isLocked ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                        🔒 Lvl {def.minLevel}+
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 font-mono">
                        Owned: {inventory[def.dropItem] || 0}
                      </span>
                    )}
                  </div>

                  {/* Quantity selector & buy bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5 gap-2">
                    <div className="flex items-center gap-1">
                      {[1, 10, 25, 50].map((count) => (
                        <button
                          key={count}
                          onClick={() => setQuantity(def.type, count)}
                          className={`px-2 py-1 text-[10px] font-bold rounded transition-colors font-mono ${
                            qty === count
                              ? 'bg-cyan-500 text-slate-950 font-black'
                              : 'bg-black/40 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          x{count}
                        </button>
                      ))}
                    </div>

                    <button
                      disabled={isLocked || !hasBalance}
                      onClick={() => handleBuySingle(def.type)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${
                        isLocked
                          ? 'bg-white/5 text-white/30 cursor-not-allowed'
                          : !hasBalance
                          ? 'bg-rose-950/40 text-rose-400/60 border border-rose-500/20 cursor-not-allowed'
                          : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow active:scale-95'
                      }`}
                    >
                      {isLocked
                        ? `Req Lv.${def.minLevel}`
                        : !hasBalance
                        ? `Need ${totalCost} ₱`
                        : `Buy ${qty}x (${totalCost} ₱)`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ─── Leaderboard Tab ────────────────────────────────────────────────────
  const renderLeaderboardTab = () => {
    return (
      <div className="flex flex-col h-full gap-4 overflow-y-auto pr-1">
        <div className="bg-slate-900/80 rounded-xl p-4 border border-purple-500/20 text-center flex-1 flex flex-col items-center justify-center">
          <span className="text-5xl mb-3">🏆</span>
          <h3 className="text-lg font-black text-amber-400 mb-1 font-display uppercase tracking-wider">
            Best Builders Leaderboard
          </h3>
          <p className="text-xs text-slate-300 max-w-sm mb-4">
            Top tipped architectural creations in the PISO Metaverse. Builders earn community $PISO tips deposited straight into their on-chain wallets!
          </p>

          <div className="w-full space-y-2 text-left mb-4">
            {[
              { rank: 1, name: 'Datu Kastilyo Fort', tips: '14,500 ₱', builder: '0x3F8a...9B14', cat: '🏰 Kastilyo' },
              { rank: 2, name: 'Palengke Cyber Plaza', tips: '8,250 ₱', builder: '0x77c2...A120', cat: '🏪 Palengke' },
              { rank: 3, name: 'Bakunawa Shrine', tips: '5,100 ₱', builder: '0xEE41...88cF', cat: '🐉 Bakunawa Tower' },
              { rank: 4, name: 'Bayani Watchtower', tips: '3,800 ₱', builder: '0x12a9...338D', cat: '🗼 Bantayan' },
            ].map((entry) => (
              <div
                key={entry.rank}
                className="bg-black/40 rounded-lg p-2.5 border border-white/5 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                    entry.rank === 1 ? 'bg-amber-400 text-black' : entry.rank === 2 ? 'bg-slate-300 text-black' : 'bg-amber-700 text-white'
                  }`}>
                    {entry.rank}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-white">{entry.name}</div>
                    <div className="text-[10px] text-slate-400">{entry.cat} • {entry.builder}</div>
                  </div>
                </div>
                <div className="text-xs font-black text-amber-400 font-mono">{entry.tips}</div>
              </div>
            ))}
          </div>

          <div className="text-[11px] text-purple-400/70 italic">
            Connected to PISO Chain Devnet • Smart Contract: PISOMineCraft.sol
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[490px] bg-slate-950/95 backdrop-blur-xl shadow-2xl border-l border-white/10 z-50 flex flex-col pointer-events-auto transition-transform duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(245,158,11,0.4)]">
            ⛏️
          </div>
          <div>
            <h2 className="text-lg font-black text-white font-display tracking-wide uppercase">
              PISO Mine & Build Studio
            </h2>
            <div className="text-[11px] text-amber-400 font-mono flex items-center gap-2">
              <span>Terranian Construction</span>
              <span>•</span>
              <span className="text-cyan-300 font-bold">{pisoBalance.toFixed(0)} ₱PISO</span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-rose-500/20 text-white/60 hover:text-rose-400 flex items-center justify-center transition-colors font-bold"
        >
          ✕
        </button>
      </div>

      {/* Floating Toast / Notification */}
      {feedback && (
        <div
          className={`mx-4 mt-3 p-3 rounded-xl border text-xs font-bold transition-all animate-bounce ${
            feedback.isError
              ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
              : 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* 4 Navigation Tabs */}
      <div className="grid grid-cols-4 p-2 bg-black/40 gap-1 border-b border-white/5">
        <button
          onClick={() => setActiveTab('mine')}
          className={`py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
            activeTab === 'mine'
              ? 'bg-amber-600 text-white shadow-lg'
              : 'text-white/50 hover:bg-white/5 hover:text-white'
          }`}
        >
          ⛏️ Mine
        </button>
        <button
          onClick={() => setActiveTab('build')}
          className={`py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
            activeTab === 'build'
              ? 'bg-cyan-600 text-white shadow-lg'
              : 'text-white/50 hover:bg-white/5 hover:text-white'
          }`}
        >
          🏗️ Build
        </button>
        <button
          onClick={() => setActiveTab('market')}
          className={`py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1 ${
            activeTab === 'market'
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-black shadow-lg'
              : 'text-amber-400 hover:bg-amber-500/10 hover:text-amber-300'
          }`}
        >
          <span>🛒 Buy</span>
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
            activeTab === 'leaderboard'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'text-white/50 hover:bg-white/5 hover:text-white'
          }`}
        >
          🏆 Top
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden p-4">
        {activeTab === 'mine' && renderMineTab()}
        {activeTab === 'build' && renderBuildTab()}
        {activeTab === 'market' && renderMarketTab()}
        {activeTab === 'leaderboard' && renderLeaderboardTab()}
      </div>
    </div>
  );
};
