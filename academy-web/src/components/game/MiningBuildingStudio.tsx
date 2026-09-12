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
  StructureCategory
} from '../../services/MiningBlockEngine';

interface Props {
  onClose: () => void;
  miningEngine: MiningBlockEngine | null;
}

type Tab = 'mine' | 'build' | 'leaderboard';

export const MiningBuildingStudio: React.FC<Props> = ({ onClose, miningEngine }) => {
  const [activeTab, setActiveTab] = useState<Tab>('mine');
  const [stats, setStats] = useState<PlayerStats>(PlayerStatsEngine.getStats());
  const [inventory, setInventory] = useState<ResourceInventory>(loadInventory());

  useEffect(() => {
    const handleStatsUpdate = (e: any) => setStats(e.detail);
    const handleInvUpdate = (e: any) => setInventory(e.detail);
    window.addEventListener('piso-player-stats-updated', handleStatsUpdate);
    window.addEventListener('piso-inventory-updated', handleInvUpdate);
    return () => {
      window.removeEventListener('piso-player-stats-updated', handleStatsUpdate);
      window.removeEventListener('piso-inventory-updated', handleInvUpdate);
    };
  }, []);

  // ─── Mine Tab ───────────────────────────────────────────────────────────
  const renderMineTab = () => {
    return (
      <div className="flex flex-col h-full gap-4 overflow-y-auto">
        <div className="bg-black/40 rounded-xl p-4 border border-white/10">
          <h3 className="text-xl font-black text-amber-400 mb-2 font-display uppercase">Mining Stats</h3>
          <div className="flex justify-between text-white/80">
            <span>Level: <span className="text-white font-bold">{stats.level}</span></span>
            <span>Blocks Mined: <span className="text-white font-bold">{stats.blocksMinedTotal}</span></span>
          </div>
        </div>

        <div className="bg-black/40 rounded-xl p-4 border border-white/10 flex-1">
          <h3 className="text-xl font-black text-amber-400 mb-4 font-display uppercase">Resource Inventory</h3>
          {Object.keys(inventory).length === 0 ? (
            <div className="text-center text-white/50 py-8">
              No resources yet. Go explore the world and mine some blocks!
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(inventory).map(([item, qty]) => {
                const def = Object.values(BLOCK_DEFS).find(d => d.dropItem === item);
                return (
                  <div key={item} className="bg-black/30 rounded-lg p-3 flex items-center justify-between border border-white/5">
                    <span className="text-lg mr-2">{def?.dropEmoji || '📦'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-white/60 truncate">{item}</div>
                      <div className="font-bold text-white">{qty}</div>
                    </div>
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
      <div className="flex flex-col h-full gap-4 overflow-y-auto">
        {miningEngine?.builderMode ? (
          <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4 text-center">
            <h3 className="text-xl font-black text-green-400 mb-2 font-display uppercase">Builder Mode Active</h3>
            <p className="text-white/80 mb-4">Click anywhere on the ground in the 3D world to place blocks or structures.</p>
            <button
              onClick={() => { if (miningEngine) miningEngine.builderMode = false; }}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold"
            >
              Exit Builder Mode
            </button>
          </div>
        ) : (
          <div className="bg-black/40 rounded-xl p-4 border border-white/10 text-center">
            <h3 className="text-xl font-black text-amber-400 mb-2 font-display uppercase">Builder Mode</h3>
            <p className="text-white/80 mb-4">Enter builder mode to place structures and blocks in the world.</p>
            <button
              onClick={() => { if (miningEngine) miningEngine.builderMode = true; }}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold w-full"
            >
              Enter Builder Mode
            </button>
          </div>
        )}

        <div className="bg-black/40 rounded-xl p-4 border border-white/10">
          <h3 className="text-xl font-black text-cyan-400 mb-4 font-display uppercase">Structure Templates</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {STRUCTURE_DEFS.map((def, i) => {
              if (def.category === 0) return null; // Skip freeform
              const canBuild = Object.entries(def.recipe).every(([item, qty]) => (inventory[item] || 0) >= (qty ?? 0));
              return (
                <div key={i} className={`bg-black/30 rounded-lg p-3 border ${canBuild ? 'border-cyan-500/30' : 'border-white/5 opacity-60'}`}>
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">{def.emoji}</span>
                    <div className="font-bold text-white font-display uppercase">{def.name}</div>
                  </div>
                  <p className="text-xs text-white/60 mb-2 h-8 line-clamp-2">{def.description}</p>
                  <div className="text-[10px] text-cyan-400 mb-3 bg-cyan-900/30 p-1.5 rounded">{def.benefit}</div>
                  
                  <div className="space-y-1 mb-3">
                    {Object.entries(def.recipe).map(([item, qty]) => {
                      const has = inventory[item] || 0;
                      const enough = has >= (qty ?? 0);
                      return (
                        <div key={item} className="flex justify-between text-xs">
                          <span className="text-white/70">{item}</span>
                          <span className={enough ? 'text-green-400' : 'text-red-400'}>
                            {has} / {qty}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  
                  <button
                    disabled={!canBuild || !miningEngine?.builderMode}
                    onClick={() => { /* Trigger build action in world */ }}
                    className={`w-full py-1.5 rounded text-xs font-bold ${
                      canBuild && miningEngine?.builderMode
                        ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                        : 'bg-white/10 text-white/30 cursor-not-allowed'
                    }`}
                  >
                    Select to Build
                  </button>
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
      <div className="flex flex-col h-full gap-4 overflow-y-auto">
        <div className="bg-black/40 rounded-xl p-4 border border-white/10 flex-1 flex flex-col items-center justify-center text-center">
          <span className="text-6xl mb-4">🏆</span>
          <h3 className="text-2xl font-black text-amber-400 mb-2 font-display uppercase">Best Builders Leaderboard</h3>
          <p className="text-white/70 max-w-sm mb-6">
            The most tipped structures in the PISO Metaverse. Connect your wallet to send tips and support your favorite builders!
          </p>
          <div className="text-amber-500/50 italic">
            Contract integration pending network sync...
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-neutral-900/95 backdrop-blur-md shadow-2xl border-l border-white/10 z-50 flex flex-col pointer-events-auto transition-transform duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(245,158,11,0.4)]">
            ⛏️
          </div>
          <div>
            <h2 className="text-xl font-black text-white font-display tracking-wide uppercase">Mine & Build</h2>
            <div className="text-xs text-amber-400">Terranian Construction Engine</div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/5 hover:bg-red-500/20 text-white/50 hover:text-red-400 flex items-center justify-center transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="flex p-2 bg-black/20">
        <button
          onClick={() => setActiveTab('mine')}
          className={`flex-1 py-2 text-sm font-bold uppercase tracking-wider rounded-md transition-colors ${
            activeTab === 'mine' ? 'bg-amber-600 text-white shadow-lg' : 'text-white/50 hover:bg-white/5 hover:text-white'
          }`}
        >
          ⛏️ Mine
        </button>
        <button
          onClick={() => setActiveTab('build')}
          className={`flex-1 py-2 text-sm font-bold uppercase tracking-wider rounded-md transition-colors ${
            activeTab === 'build' ? 'bg-cyan-600 text-white shadow-lg' : 'text-white/50 hover:bg-white/5 hover:text-white'
          }`}
        >
          🏗️ Build
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex-1 py-2 text-sm font-bold uppercase tracking-wider rounded-md transition-colors ${
            activeTab === 'leaderboard' ? 'bg-purple-600 text-white shadow-lg' : 'text-white/50 hover:bg-white/5 hover:text-white'
          }`}
        >
          🌟 Top
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden p-4">
        {activeTab === 'mine' && renderMineTab()}
        {activeTab === 'build' && renderBuildTab()}
        {activeTab === 'leaderboard' && renderLeaderboardTab()}
      </div>
    </div>
  );
};
