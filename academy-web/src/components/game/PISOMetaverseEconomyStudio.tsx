import React, { useState, useEffect } from 'react';
import {
  Coins,
  Shield,
  Sword,
  Sparkles,
  Heart,
  Zap,
  TrendingUp,
  Plus,
  Minus,
  CheckCircle2,
  Hammer,
  Crown,
  Egg,
  PawPrint,
} from 'lucide-react';
import {
  PisoEconomyService,
  FarmingStats,
  OnChainRelic,
  OnChainWeaponGear,
  OnChainPet,
} from '../../services/pisoEconomyService';
import { SoundFX } from '../../services/soundFX';

interface PISOMetaverseEconomyStudioProps {
  onMinimize?: () => void;
}

type TabType = 'farm' | 'weapons' | 'relics' | 'pets';

export const PISOMetaverseEconomyStudio: React.FC<PISOMetaverseEconomyStudioProps> = ({
  onMinimize,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('farm');
  const [farmingStats, setFarmingStats] = useState<FarmingStats>(PisoEconomyService.getFarmingStats());
  const [relics, setRelics] = useState<OnChainRelic[]>(PisoEconomyService.getRelics());
  const [weapons, setWeapons] = useState<OnChainWeaponGear[]>(PisoEconomyService.getWeapons());
  const [pets, setPets] = useState<OnChainPet[]>(PisoEconomyService.getPets());
  const [harvestNotification, setHarvestNotification] = useState<string | null>(null);

  // Live auto-farming counter
  useEffect(() => {
    const interval = setInterval(() => {
      setFarmingStats((prev) => {
        const increment = (prev.idleEarnRatePerMinute / 60) * 1.5;
        const next = {
          ...prev,
          userPendingHarvest: prev.userPendingHarvest + increment,
        };
        PisoEconomyService.saveFarmingStats(next);
        return next;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const handleHarvest = () => {
    const harvested = PisoEconomyService.harvestRewards();
    if (harvested > 0) {
      SoundFX.playLevelUp();
      setFarmingStats(PisoEconomyService.getFarmingStats());
      setHarvestNotification(`🎉 Successfully Harvested ${harvested.toFixed(2)} ₱ PISO to your Wallet!`);
      setTimeout(() => setHarvestNotification(null), 3500);
    }
  };

  const handleUpgradeWeapon = (id: number) => {
    const updated = PisoEconomyService.upgradeWeapon(id);
    if (updated) {
      SoundFX.playLaser();
      setWeapons(PisoEconomyService.getWeapons());
      setHarvestNotification(`🔨 Panday Blacksmith upgraded ${updated.name} to +${updated.enhancementLevel}! (ATK: ${updated.attackPower})`);
      setTimeout(() => setHarvestNotification(null), 3500);
    }
  };

  const handleCraftRelic = (id: number) => {
    const success = PisoEconomyService.craftRelic(id);
    if (success) {
      SoundFX.playClick();
      setRelics(PisoEconomyService.getRelics());
      setHarvestNotification('🧿 Babaylan Maya enchanted and crafted your Cultural Relic!');
      setTimeout(() => setHarvestNotification(null), 3500);
    }
  };

  const handleSelectActivePet = (id: number) => {
    PisoEconomyService.setActivePet(id);
    setPets(PisoEconomyService.getPets());
    SoundFX.playLevelUp();
    setHarvestNotification('🐾 Active 3D Metaverse Companion updated! Companion will follow your avatar.');
    setTimeout(() => setHarvestNotification(null), 3500);
  };

  const handleFeedPet = (id: number) => {
    PisoEconomyService.feedPet(id);
    setPets(PisoEconomyService.getPets());
    SoundFX.playClick();
  };

  const handleTrainPet = (id: number) => {
    PisoEconomyService.trainPet(id);
    setPets(PisoEconomyService.getPets());
    SoundFX.playBlip();
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col space-y-4 text-slate-100 p-2 select-none">
      {/* Top Banner & Minimizer */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-amber-950/50 via-slate-900/90 to-blue-950/60 border border-amber-500/40 backdrop-blur-md shadow-2xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-slate-950 text-2xl font-black shadow-[0_0_25px_rgba(245,158,11,0.5)]">
            ₱
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-black tracking-wider text-white">
                PISO CHAIN METAVERSE ECONOMY
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-[10px] font-mono text-amber-300 font-bold">
                100M FARM & FORGE
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Farmed Tokens • Panday Weapon Forge • Babaylan Relics • On-Chain NFT Pets
            </p>
          </div>
        </div>

        {onMinimize && (
          <button
            type="button"
            onClick={onMinimize}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-mono transition active:scale-95"
            title="Minimize to taskbar chip"
          >
            <Minus className="w-3.5 h-3.5" />
            <span>MINIMIZE</span>
          </button>
        )}
      </div>

      {/* Notification Toast */}
      {harvestNotification && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-400/60 text-emerald-200 text-xs font-mono flex items-center space-x-2.5 animate-fade-in shadow-[0_0_20px_rgba(16,185,129,0.3)]">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{harvestNotification}</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="grid grid-cols-4 gap-2 font-mono text-xs">
        <button
          type="button"
          onClick={() => {
            setActiveTab('farm');
            SoundFX.playClick();
          }}
          className={`py-2.5 px-3 rounded-xl border flex items-center justify-center space-x-2 transition ${
            activeTab === 'farm'
              ? 'bg-amber-500/20 text-amber-300 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)] font-bold'
              : 'bg-[#161F30]/60 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <Coins className="w-4 h-4 text-amber-400" />
          <span>100M YIELD FARM</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('weapons');
            SoundFX.playClick();
          }}
          className={`py-2.5 px-3 rounded-xl border flex items-center justify-center space-x-2 transition ${
            activeTab === 'weapons'
              ? 'bg-blue-500/20 text-blue-300 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)] font-bold'
              : 'bg-[#161F30]/60 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <Hammer className="w-4 h-4 text-blue-400" />
          <span>PANDAY FORGE</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('relics');
            SoundFX.playClick();
          }}
          className={`py-2.5 px-3 rounded-xl border flex items-center justify-center space-x-2 transition ${
            activeTab === 'relics'
              ? 'bg-purple-500/20 text-purple-300 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)] font-bold'
              : 'bg-[#161F30]/60 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>BABAYLAN RELICS</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('pets');
            SoundFX.playClick();
          }}
          className={`py-2.5 px-3 rounded-xl border flex items-center justify-center space-x-2 transition ${
            activeTab === 'pets'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] font-bold'
              : 'bg-[#161F30]/60 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <PawPrint className="w-4 h-4 text-emerald-400" />
          <span>NFT PETS</span>
        </button>
      </div>

      {/* TAB 1: 100M TOKEN FARM */}
      {activeTab === 'farm' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 animate-fade-in">
          {/* Main Harvest Card */}
          <div className="lg:col-span-7 p-5 rounded-2xl bg-gradient-to-br from-[#161F30] via-slate-900 to-amber-950/30 border border-amber-500/30 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>Pending Farm Yield (Proof-of-Gameplay)</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mr-1" />
                  EMITTING 1.5 ₱/MIN
                </span>
              </div>
              <div className="font-mono text-4xl font-black text-amber-400 flex items-baseline space-x-2">
                <span>{farmingStats.userPendingHarvest.toFixed(2)}</span>
                <span className="text-base text-amber-300 font-normal">₱ PISO</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Earned via in-metaverse quest completions, continuous auto-idle combat, smart contract deployments, and cultural staking.
              </p>
            </div>

            <button
              type="button"
              onClick={handleHarvest}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-mono text-xs font-black uppercase tracking-wider transition shadow-[0_0_25px_rgba(245,158,11,0.4)] active:scale-[0.98] flex items-center justify-center space-x-2"
            >
              <Coins className="w-4 h-4" />
              <span>HARVEST ALL ₱ PISO TO WALLET</span>
            </button>
          </div>

          {/* Staking & Pool Metrics */}
          <div className="lg:col-span-5 flex flex-col space-y-3 font-mono text-xs">
            <div className="p-4 rounded-2xl bg-[#161F30]/80 border border-slate-800 space-y-2">
              <div className="text-slate-400 text-[11px]">Total Farming Supply Allocation</div>
              <div className="text-xl font-black text-white">100,000,000.00 ₱</div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-400 h-full rounded-full"
                  style={{ width: `${(farmingStats.totalHarvested / farmingStats.totalFarmSupply) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Harvested: {(farmingStats.totalHarvested / 1e6).toFixed(2)}M</span>
                <span>Remaining: {((farmingStats.totalFarmSupply - farmingStats.totalHarvested) / 1e6).toFixed(2)}M</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#161F30]/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-300">
                <span>Your Staked Balance:</span>
                <strong className="text-cyan-300">{farmingStats.userStakedBalance} ₱</strong>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Farming APR Boost:</span>
                <strong className="text-emerald-400">+{farmingStats.userFarmingApr}% APR</strong>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>NPC Vault Keeper:</span>
                <strong className="text-amber-300">Kapitan Datu (Bayanihan)</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PANDAY'S WEAPONS & ARMOR FORGE */}
      {activeTab === 'weapons' && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-3.5 rounded-2xl bg-blue-950/20 border border-blue-500/30 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center space-x-2 text-blue-300">
              <Hammer className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Forge Master: <strong>Panday Blacksmith</strong> (Upgrade +0..+15 on PISO Chain)</span>
            </div>
            <span className="text-[10px] text-slate-400">Burns farmed PISO to upgrade combat stats</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {weapons.map((w) => (
              <div
                key={w.id}
                className="p-4 rounded-2xl bg-[#161F30]/90 border border-slate-800 hover:border-blue-500/50 transition flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-2xl">{w.icon}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      +{w.enhancementLevel}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white tracking-wide">{w.name}</h4>
                  <div className="text-[10px] font-mono text-amber-400">{w.rarity} {w.category}</div>
                </div>

                <div className="space-y-1 font-mono text-[11px] bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  <div className="flex justify-between text-slate-400">
                    <span>Attack Power:</span>
                    <strong className="text-rose-400">+{w.attackPower}</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Defense Power:</span>
                    <strong className="text-cyan-400">+{w.defensePower}</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Durability:</span>
                    <strong className="text-emerald-400">{w.durability}%</strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleUpgradeWeapon(w.id)}
                  disabled={w.enhancementLevel >= 15}
                  className={`w-full py-2 px-2.5 rounded-xl font-mono text-[11px] font-bold transition flex items-center justify-center space-x-1.5 ${
                    w.enhancementLevel >= 15
                      ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-400 active:scale-95 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                  }`}
                >
                  <Hammer className="w-3.5 h-3.5" />
                  <span>
                    {w.enhancementLevel >= 15
                      ? 'MAX +15 REACHED'
                      : `UPGRADE TO +${w.enhancementLevel + 1} (${(w.enhancementLevel + 1) * 75} ₱)`}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: BABAYLAN'S CULTURAL RELICS */}
      {activeTab === 'relics' && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-3.5 rounded-2xl bg-purple-950/20 border border-purple-500/30 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center space-x-2 text-purple-300">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
              <span>Seer & Alchemist: <strong>Babaylan Maya</strong> (ERC-1155 Cultural Relics)</span>
            </div>
            <span className="text-[10px] text-slate-400">Relics grant farming APR & ability boosts</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {relics.map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-2xl bg-[#161F30]/90 border border-slate-800 hover:border-purple-500/50 transition flex flex-col justify-between space-y-2.5"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-2xl">{r.icon}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      OWNED: {r.count}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white tracking-wide">{r.name}</h4>
                  <div className="text-[10px] font-mono text-amber-400">{r.rarity} Cultural Relic</div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{r.description}</p>
                </div>

                <div className="flex items-center justify-between font-mono text-[10px] text-emerald-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                  <span>Farm Boost:</span>
                  <strong>+{(r.buffAprBps / 100).toFixed(1)}% APR</strong>
                </div>

                <button
                  type="button"
                  onClick={() => handleCraftRelic(r.id)}
                  className="w-full py-2 px-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-[11px] font-bold transition flex items-center justify-center space-x-1.5 active:scale-95 shadow-[0_0_15px_rgba(168,85,247,0.3)] border border-purple-400"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>CRAFT RELIC ({r.craftingCostPiso} ₱)</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: NFT PETS & COMPANIONS */}
      {activeTab === 'pets' && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center space-x-2 text-emerald-300">
              <PawPrint className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Pet Sanctuary: <strong>On-Chain ERC-721 Companions in 3D World</strong></span>
            </div>
            <span className="text-[10px] text-slate-400">Companions follow avatar in metaverse</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {pets.map((p) => (
              <div
                key={p.id}
                className={`p-4 rounded-2xl border transition flex flex-col justify-between space-y-3 ${
                  p.isActive
                    ? 'bg-gradient-to-b from-[#161F30] to-emerald-950/40 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)] ring-1 ring-emerald-400/50'
                    : 'bg-[#161F30]/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-3xl">{p.icon}</span>
                    {p.isActive ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-black bg-emerald-500/30 text-emerald-300 border border-emerald-400 animate-pulse">
                        ACTIVE IN 3D
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono text-slate-400 bg-slate-800 border border-slate-700">
                        IN RESERVE
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-white tracking-wide">{p.name}</h4>
                  <div className="text-[10px] font-mono text-cyan-300">{p.speciesTitle}</div>
                </div>

                <div className="space-y-1.5 font-mono text-[10px] bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  <div className="flex justify-between text-slate-400">
                    <span>Level & XP:</span>
                    <strong className="text-amber-400">Lv.{p.level} ({p.xp} XP)</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Stamina:</span>
                    <strong className="text-cyan-400">{p.stamina}/100</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Happiness:</span>
                    <strong className="text-rose-400">{p.happiness}%</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Farm Boost:</span>
                    <strong className="text-emerald-400">+{(p.buffAprBps / 100).toFixed(1)}% APR</strong>
                  </div>
                </div>

                <div className="flex space-x-1.5">
                  <button
                    type="button"
                    onClick={() => handleFeedPet(p.id)}
                    className="flex-1 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-mono text-[10px] font-bold transition"
                  >
                    FEED (10 ₱)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTrainPet(p.id)}
                    className="flex-1 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-mono text-[10px] font-bold transition"
                  >
                    TRAIN
                  </button>
                </div>

                {!p.isActive && (
                  <button
                    type="button"
                    onClick={() => handleSelectActivePet(p.id)}
                    className="w-full py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-mono text-[11px] font-black transition flex items-center justify-center space-x-1.5 active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  >
                    <PawPrint className="w-3.5 h-3.5" />
                    <span>SET AS 3D COMPANION</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
