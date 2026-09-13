import React, { useState, useEffect } from 'react';
import { PlayerStatsEngine, PlayerStats } from '../../services/PlayerStatsEngine';
import { PisoEconomyService, OnChainWeaponGear, OnChainRelic } from '../../services/pisoEconomyService';
import { SoundFX } from '../../services/soundFX';
import {
  Skull,
  Shield,
  Zap,
  Sword,
  Heart,
  Target,
  Sparkles,
  Award,
  Coins,
  Flame,
  ChevronRight,
  TrendingUp,
  ShoppingBag,
  Tag,
  Crosshair,
  Lock,
  Unlock,
  AlertTriangle,
  Minus,
} from 'lucide-react';

interface MonsterHunterStudioProps {
  onMinimize?: () => void;
  playerPos?: { x: number; z: number };
}

interface MarketListing {
  id: string;
  seller: string;
  itemName: string;
  itemType: 'WEAPON' | 'RELIC';
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
  pricePiso: number;
  icon: string;
  stats: string;
  levelReq: number;
}

export const MonsterHunterStudio: React.FC<MonsterHunterStudioProps> = ({
  onMinimize,
  playerPos = { x: 0, z: 0 },
}) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'bounties' | 'market'>('stats');
  const [playerStats, setPlayerStats] = useState<PlayerStats>(PlayerStatsEngine.getStats());
  const [gearBonuses, setGearBonuses] = useState(PlayerStatsEngine.getGearBonuses());
  const [weapons, setWeapons] = useState<OnChainWeaponGear[]>(PisoEconomyService.getWeapons());
  const [relics, setRelics] = useState<OnChainRelic[]>(PisoEconomyService.getRelics());
  const [taxReturnNotification, setTaxReturnNotification] = useState<string | null>(null);
  const [tierInfo, setTierInfo] = useState(PlayerStatsEngine.getEducationTierInfo());
  const [farmingQuota, setFarmingQuota] = useState(PlayerStatsEngine.getFarmingQuota());

  // P2P Marketplace Listings
  const [listings, setListings] = useState<MarketListing[]>([
    {
      id: 'list-1',
      seller: '0x71C...4b92',
      itemName: 'Kampilan Plasma Saber (+4)',
      itemType: 'WEAPON',
      rarity: 'Epic',
      pricePiso: 1800,
      icon: '🗡️',
      stats: '+630 ATK • +56 DEF',
      levelReq: 15,
    },
    {
      id: 'list-2',
      seller: '0x32A...89cF',
      itemName: 'Agimat ni Nardong Dikit',
      itemType: 'RELIC',
      rarity: 'Epic',
      pricePiso: 950,
      icon: '🧿',
      stats: '+15% APR • +120 Sp. ATK',
      levelReq: 10,
    },
    {
      id: 'list-3',
      seller: '0x99B...12e4',
      itemName: 'Barong Cyber Vest (+6)',
      itemType: 'WEAPON',
      rarity: 'Legendary',
      pricePiso: 4200,
      icon: '🥋',
      stats: '+850 DEF • +200 HP',
      levelReq: 20,
    },
    {
      id: 'list-4',
      seller: '0x44D...a178',
      itemName: 'Balisong Neon Dagger (+2)',
      itemType: 'WEAPON',
      rarity: 'Rare',
      pricePiso: 650,
      icon: '🔪',
      stats: '+336 ATK • +15% Speed',
      levelReq: 5,
    },
    {
      id: 'list-5',
      seller: '0x12F...63c9',
      itemName: 'Magic Kaldero Lid Aegis',
      itemType: 'RELIC',
      rarity: 'Epic',
      pricePiso: 1100,
      icon: '🛡️',
      stats: '+40% Shield DEF',
      levelReq: 8,
    },
  ]);

  // Sell form
  const [selectedItemToSell, setSelectedItemToSell] = useState<string>('');
  const [sellPriceInput, setSellPriceInput] = useState<number>(500);

  // Sync state with custom events
  useEffect(() => {
    const handleStatsUpdated = (e: any) => {
      setPlayerStats(e.detail || PlayerStatsEngine.getStats());
      setGearBonuses(PlayerStatsEngine.getGearBonuses());
      setTierInfo(PlayerStatsEngine.getEducationTierInfo());
      setFarmingQuota(PlayerStatsEngine.getFarmingQuota());
    };

    const handleTaxReturn = (e: any) => {
      const detail = e.detail;
      setTaxReturnNotification(
        `🏛️ TAX RETURN FESTIVAL! You defeated ${detail.titanName}! +${detail.bountyPiso?.toLocaleString()} $PISO returned from stolen taxes!`
      );
      setTimeout(() => setTaxReturnNotification(null), 8000);
    };

    window.addEventListener('piso-player-stats-updated', handleStatsUpdated);
    window.addEventListener('piso-tax-return-festival', handleTaxReturn);

    return () => {
      window.removeEventListener('piso-player-stats-updated', handleStatsUpdated);
      window.removeEventListener('piso-tax-return-festival', handleTaxReturn);
    };
  }, []);

  const handleAllocate = (stat: 'statAtk' | 'statDef' | 'statHp' | 'statCrit') => {
    const success = PlayerStatsEngine.allocatePoint(stat);
    if (success) {
      setPlayerStats(PlayerStatsEngine.getStats());
      setGearBonuses(PlayerStatsEngine.getGearBonuses());
    }
  };

  const handleBuyListing = (item: MarketListing) => {
    SoundFX.playSuccess();
    // 1% burn fee
    const burnFee = Math.floor(item.pricePiso * 0.01);
    const sellerEarned = item.pricePiso - burnFee;

    // Remove from market
    setListings((prev) => prev.filter((l) => l.id !== item.id));

    // Award item to local player
    if (item.itemType === 'WEAPON') {
      const newWeapon: OnChainWeaponGear = {
        id: Date.now(),
        name: item.itemName,
        category: 'WEAPON',
        rarity: item.rarity,
        attackPower: 350,
        defensePower: 50,
        enhancementLevel: 2,
        durability: 100,
        icon: item.icon,
      };
      const updated = [...weapons, newWeapon];
      setWeapons(updated);
      localStorage.setItem('piso_economy_weapons', JSON.stringify(updated));
    }

    setGearBonuses(PlayerStatsEngine.getGearBonuses());
    alert(
      `🎉 P2P Trade Complete!\nBought: ${item.itemName} for ${item.pricePiso} $PISO.\n🔥 1% Burn Fee: ${burnFee} $PISO sent to dead address!\n💼 Seller Received: ${sellerEarned} $PISO.`
    );
  };

  const handleListItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemToSell || sellPriceInput <= 0) return;

    SoundFX.playClick();
    const newListing: MarketListing = {
      id: `list-${Date.now()}`,
      seller: '0xYou (Current Player)',
      itemName: selectedItemToSell,
      itemType: 'WEAPON',
      rarity: 'Rare',
      pricePiso: sellPriceInput,
      icon: '📦',
      stats: '+Scaled Damage & Defense',
      levelReq: Math.max(1, playerStats.level - 2),
    };

    setListings([newListing, ...listings]);
    setSelectedItemToSell('');
    alert(`🏷️ Item listed on P2P Marketplace for ${sellPriceInput} $PISO! (1% burn fee applies upon trade).`);
  };

  // Rank title
  const getRankTitle = (lvl: number) => {
    if (lvl >= 35) return { title: 'Supreme Katipunero Titan-Slayer', color: 'text-amber-400' };
    if (lvl >= 20) return { title: 'Titan Slayer (Buwaya Hunter)', color: 'text-rose-400' };
    if (lvl >= 15) return { title: 'Veteran Highland Hunter', color: 'text-purple-400' };
    if (lvl >= 10) return { title: 'Canyon Tracker', color: 'text-cyan-400' };
    if (lvl >= 5) return { title: 'Apprentice Beast Farmer', color: 'text-emerald-400' };
    return { title: 'Rookie Farm Recruit', color: 'text-slate-400' };
  };

  const rank = getRankTitle(playerStats.level);
  const expPct = Math.min(100, (playerStats.currentExp / Math.max(1, playerStats.expToNextLevel)) * 100);
  const totalDmgMultiplier = (1 + (playerStats.statAtk * 0.05) + (gearBonuses.totalGearAtk / 250)) * (1 + playerStats.level * 0.03);

  // Monster Catalog for Radar
  const monstersCatalog = [
    {
      name: 'Senator Buwaya Croc',
      level: 25,
      minLevel: 20,
      isBoss: true,
      coords: { x: 75, z: -65 },
      hp: '45,000 HP',
      bounty: '75 $PISO',
      exp: '1,500 EXP',
      icon: '🐊',
      description: 'Towering bipedal crocodile wearing embroidered Barong Tagalog and gold naval sash. Stole coastal municipality budget.',
    },
    {
      name: 'Admiral General Buwaya',
      level: 35,
      minLevel: 25,
      isBoss: true,
      coords: { x: -95, z: -110 },
      hp: '95,000 HP',
      bounty: '200 $PISO',
      exp: '3,000 EXP',
      icon: '👑',
      description: 'Heavily armored titan crocodile with navy admiral cape and twin gold epaulets. Diverted defense procurement taxes.',
    },
    {
      name: 'Supreme Oligarch Buwaya',
      level: 50,
      minLevel: 30,
      isBoss: true,
      coords: { x: 125, z: 105 },
      hp: '250,000 HP',
      bounty: '500 $PISO',
      exp: '6,000 EXP',
      icon: '🏛️',
      description: 'Apex corrupt titan oligarch holed up in Capitol Ruins. Slaying him triggers nationwide Tax Return Festival!',
    },
    {
      name: 'Highland Cobra Pack',
      level: 3,
      minLevel: 1,
      isBoss: false,
      coords: { x: -25, z: 35 },
      hp: '950 HP',
      bounty: '1 $PISO',
      exp: '30 EXP',
      icon: '🐍',
      description: 'Slithering venomous cobras. Best rookie monster to farm initial EXP for levels 1 to 5.',
    },
    {
      name: 'Sky Vulture Scavengers',
      level: 7,
      minLevel: 5,
      isBoss: false,
      coords: { x: 45, z: 40 },
      hp: '3,200 HP',
      bounty: '2 $PISO',
      exp: '80 EXP',
      icon: '🦅',
      description: 'Aerial scavengers circling highland cliffs. Good farm beast for levels 5 to 10.',
    },
    {
      name: 'Canyon Bayawak (Komodos)',
      level: 12,
      minLevel: 10,
      isBoss: false,
      coords: { x: -80, z: 30 },
      hp: '8,500 HP',
      bounty: '5 $PISO',
      exp: '200 EXP',
      icon: '🦎',
      description: 'Armored quadruped monitor lizards with thick scaly plates. Intermediate farm for levels 10 to 15.',
    },
    {
      name: 'Cyber Mountain Askals (Hyenas)',
      level: 17,
      minLevel: 15,
      isBoss: false,
      coords: { x: 10, z: -85 },
      hp: '18,000 HP',
      bounty: '10 $PISO',
      exp: '400 EXP',
      icon: '🐺',
      description: 'Cybernetically enhanced feral predators. Slay these to reach Level 20+ and qualify for Giga Buwaya hunts!',
    },
  ];

  return (
    <div className="flex flex-col h-full bg-[#0B0F17] text-slate-100 selection:bg-amber-500/30 selection:text-amber-300 font-sans">
      {/* Tax Return Festival Banner if active */}
      {taxReturnNotification && (
        <div className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-700 text-black px-4 py-2 font-bold font-mono text-xs flex items-center justify-between shadow-lg animate-pulse">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4" />
            <span>{taxReturnNotification}</span>
          </div>
          <button
            onClick={() => setTaxReturnNotification(null)}
            className="text-xs bg-black/20 hover:bg-black/40 px-2 py-0.5 rounded"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="p-4 border-b border-slate-800 bg-[#0F172A]/70 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(245,158,11,0.25)]">
            🐊
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold font-mono text-white tracking-wide">
                MONSTER HUNTER HUB // 70M TOKEN POOL
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                70% USER ALLOCATION
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Rank: <span className={`font-bold ${rank.color}`}>{rank.title}</span> • Level {playerStats.level}
            </p>
          </div>
        </div>

        {/* Action Controls & Navigation Tabs */}
        <div className="flex items-center space-x-2">
          <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                SoundFX.playClick();
                setActiveTab('stats');
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition ${
                activeTab === 'stats'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Attributes & Upgrades</span>
            </button>
            <button
              onClick={() => {
                SoundFX.playClick();
                setActiveTab('bounties');
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition ${
                activeTab === 'bounties'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Skull className="w-3.5 h-3.5" />
              <span>Giant Bounties Radar</span>
            </button>
            <button
              onClick={() => {
                SoundFX.playClick();
                setActiveTab('market');
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition ${
                activeTab === 'market'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>P2P Marketplace (₱)</span>
            </button>
          </div>

          {onMinimize && (
            <button
              onClick={onMinimize}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              title="Minimize to background"
            >
              <Minus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ==================================================================== */}
        {/* TAB 1: ATTRIBUTES & STAT UPGRADES */}
        {/* ==================================================================== */}
        {activeTab === 'stats' && (
          <div className="space-y-4">
            {/* Level & EXP Progress Bar */}
            <div className="p-4 rounded-2xl bg-[#0F172A]/80 border border-slate-800 shadow-lg space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-400 flex items-center justify-center font-mono font-black text-xl text-black shadow-md">
                    {playerStats.level}
                  </div>
                  <div>
                    <h3 className="font-mono text-sm font-bold text-white">
                      Hunter Level {playerStats.level}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {playerStats.currentExp.toLocaleString()} / {playerStats.expToNextLevel.toLocaleString()} EXP to next level
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Attribute Points</span>
                    <p className="font-mono font-bold text-amber-400 text-base">
                      {playerStats.unallocatedPoints} Available
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress Track */}
              <div className="w-full bg-slate-950/80 rounded-full h-3 p-0.5 border border-slate-800 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-yellow-300 h-full rounded-full transition-all duration-300"
                  style={{ width: `${expPct}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Monsters Slain: <strong className="text-white">{playerStats.monstersSlain}</strong></span>
                <span>Buwaya Titans Defeated: <strong className="text-amber-400">{playerStats.titansDefeated}</strong></span>
                <span>Tax Returns Claimed: <strong className="text-emerald-400">{playerStats.totalBountiesClaimedPiso.toLocaleString()} ₱PISO</strong></span>
              </div>
            </div>

            {/* Proof-of-Education Farming Limit & Quotas */}
            <div className="p-3.5 rounded-2xl bg-[#090F1C] border border-cyan-800/40 space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                  <span className="text-base">🎓</span>
                  <div>
                    <div className="font-mono text-xs font-bold text-cyan-300">
                      Proof-of-Education Farming Quota: Tier {tierInfo.tier} ({tierInfo.tierName})
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Based on {tierInfo.completedLessonsCount} completed Academy modules • {tierInfo.yieldMultiplier}x Yield Multiplier
                    </div>
                  </div>
                </div>
                <div className="text-right font-mono text-xs">
                  <span className="text-slate-400">Daily Harvest: </span>
                  <span className="font-bold text-amber-400">{farmingQuota.dailyHarvested.toLocaleString()}</span>
                  <span className="text-slate-500"> / {farmingQuota.dailyCap.toLocaleString()} PISO</span>
                </div>
              </div>

              {/* Quota Progress Bar */}
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-300 ${
                    farmingQuota.percentCapUsed >= 100
                      ? 'bg-rose-500'
                      : farmingQuota.percentCapUsed >= 80
                      ? 'bg-amber-500'
                      : 'bg-cyan-500'
                  }`}
                  style={{ width: `${farmingQuota.percentCapUsed}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>
                  Anti-Bot Rate Limit: <strong className="text-white">{farmingQuota.killsInWindow} / {farmingQuota.maxKillsPer10Min}</strong> kills (10-min window)
                </span>
                <span>
                  Titan Hunting: <strong className={tierInfo.titanHuntAllowed ? 'text-emerald-400' : 'text-amber-400'}>
                    {tierInfo.titanHuntAllowed ? 'AUTHORIZED' : 'LOCKED (Tier 2+ Required)'}
                  </strong>
                </span>
              </div>
            </div>

            {/* 4 Core Attributes Allocation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* ATK */}
              <div className="p-3.5 rounded-xl bg-[#0F172A]/70 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                    <Sword className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-mono text-xs font-bold text-white">ATK Power</h4>
                    <p className="text-[11px] text-slate-400">
                      Level {playerStats.statAtk} <span className="text-rose-400">(+{(playerStats.statAtk * 5)}% Skill DMG)</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleAllocate('statAtk')}
                  disabled={playerStats.unallocatedPoints <= 0}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-600 font-mono text-xs font-bold text-white transition active:scale-95 shadow"
                >
                  +1 ATK
                </button>
              </div>

              {/* DEF */}
              <div className="p-3.5 rounded-xl bg-[#0F172A]/70 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-mono text-xs font-bold text-white">Armor & DEF</h4>
                    <p className="text-[11px] text-slate-400">
                      Level {playerStats.statDef} <span className="text-cyan-400">(+{(playerStats.statDef * 3)}% Mitigation)</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleAllocate('statDef')}
                  disabled={playerStats.unallocatedPoints <= 0}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 font-mono text-xs font-bold text-white transition active:scale-95 shadow"
                >
                  +1 DEF
                </button>
              </div>

              {/* HP */}
              <div className="p-3.5 rounded-xl bg-[#0F172A]/70 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <Heart className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-mono text-xs font-bold text-white">Vitality (HP)</h4>
                    <p className="text-[11px] text-slate-400">
                      {playerStats.maxHp.toLocaleString()} Max HP <span className="text-emerald-400">(Lv. {playerStats.statHp})</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleAllocate('statHp')}
                  disabled={playerStats.unallocatedPoints <= 0}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 font-mono text-xs font-bold text-white transition active:scale-95 shadow"
                >
                  +100 HP
                </button>
              </div>

              {/* CRIT */}
              <div className="p-3.5 rounded-xl bg-[#0F172A]/70 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-mono text-xs font-bold text-white">Critical Strike</h4>
                    <p className="text-[11px] text-slate-400">
                      Level {playerStats.statCrit} <span className="text-amber-400">({(playerStats.statCrit * 1.2).toFixed(1)}% Chance • 1.85x DMG)</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleAllocate('statCrit')}
                  disabled={playerStats.unallocatedPoints <= 0}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-600 font-mono text-xs font-bold text-white transition active:scale-95 shadow"
                >
                  +1 CRIT
                </button>
              </div>
            </div>

            {/* Gear Scaling: "More items = More damage taken by monsters" */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#1E293B] to-[#0F172A] border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h4 className="font-mono text-xs font-bold text-amber-300">
                    GEAR DAMAGE SCALING ENGINE (MORE ITEMS = MORE DAMAGE)
                  </h4>
                </div>
                <span className="font-mono text-xs font-bold text-emerald-400">
                  {totalDmgMultiplier.toFixed(2)}x Combined Skill Multiplier
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400">Equipped Items</span>
                  <p className="font-mono text-sm font-bold text-white">{gearBonuses.itemCount} Items</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400">Total Gear ATK</span>
                  <p className="font-mono text-sm font-bold text-rose-400">+{gearBonuses.totalGearAtk} ATK</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400">Total Gear DEF</span>
                  <p className="font-mono text-sm font-bold text-cyan-400">+{gearBonuses.totalGearDef} DEF</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400">Relic APR Buff</span>
                  <p className="font-mono text-sm font-bold text-amber-400">+{(gearBonuses.totalGearBuffApr / 100).toFixed(1)}%</p>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                💡 <strong className="text-slate-200">Rule of the Forge:</strong> Every weapon, relic, and enhanced gear piece directly magnifies all 10 Anime Super Powers (Kamehameha, Chidori, Tsinelas, Gear 5, Rasengan) against monsters. Buy and forge gears in the P2P Marketplace or Panday Forge to conquer Level 20+ Giga Buwaya Titans!
              </p>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: GIANT BOUNTY BOARD & BEAST RADAR */}
        {/* ==================================================================== */}
        {activeTab === 'bounties' && (
          <div className="space-y-4">
            {/* 70M Pool Notice */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start space-x-3">
              <Coins className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <h4 className="font-mono font-bold text-amber-300">
                  70,000,000 $PISO USER BOUNTY ALLOCATION (70% OF TOTAL SUPPLY)
                </h4>
                <p className="text-slate-300 leading-relaxed">
                  Corrupt Buwaya Titans stockpiled the nation's taxes in offshore vaults across the metaverse. Slay them to trigger a <strong>Tax Return Festival</strong> and distribute $PISO tokens directly into your wallet!
                </p>
              </div>
            </div>

            {/* Monsters List */}
            <div className="space-y-3">
              {monstersCatalog.map((monster, idx) => {
                const isLocked = playerStats.level < monster.minLevel;
                const dist = Math.round(
                  Math.hypot(monster.coords.x - playerPos.x, monster.coords.z - playerPos.z)
                );

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border transition-all ${
                      monster.isBoss
                        ? isLocked
                          ? 'bg-gradient-to-b from-[#161F30] to-[#0F172A] border-rose-500/40 opacity-90'
                          : 'bg-gradient-to-b from-[#1C253B] to-[#0F172A] border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                        : 'bg-[#0F172A]/70 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div className="flex items-start space-x-3">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border ${
                            monster.isBoss
                              ? 'bg-amber-500/20 border-amber-500/40'
                              : 'bg-slate-800 border-slate-700'
                          }`}
                        >
                          {monster.icon}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 flex-wrap">
                            <h4 className="font-mono text-sm font-bold text-white">
                              {monster.name}
                            </h4>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
                              Lv. {monster.level}
                            </span>
                            {monster.isBoss && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/30 text-amber-300 border border-amber-500/40">
                                👑 GIGA BUWAYA TITAN
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-1 max-w-xl">
                            {monster.description}
                          </p>
                        </div>
                      </div>

                      {/* Status / Level Requirement Badge */}
                      <div>
                        {isLocked ? (
                          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/40 font-mono text-xs font-bold">
                            <Lock className="w-3.5 h-3.5" />
                            <span>REQ LV. {monster.minLevel}+ (LOCKED)</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono text-xs font-bold">
                            <Unlock className="w-3.5 h-3.5" />
                            <span>HUNTABLE NOW</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stats & Rewards Strip */}
                    <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
                      <div className="flex items-center space-x-4 text-slate-400">
                        <span>HP: <strong className="text-slate-200">{monster.hp}</strong></span>
                        <span>EXP: <strong className="text-yellow-400">+{monster.exp}</strong></span>
                        <span>Bounty: <strong className="text-emerald-400">+{monster.bounty}</strong></span>
                      </div>

                      <div className="flex items-center space-x-2 text-slate-400">
                        <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Coords: [{monster.coords.x}, {monster.coords.z}] • Distance: <strong className="text-cyan-300">{dist}m</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 3: TOKENIZED P2P ITEM MARKETPLACE */}
        {/* ==================================================================== */}
        {activeTab === 'market' && (
          <div className="space-y-4">
            {/* 1% Deflationary Burn Fee Notice */}
            <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-start space-x-3">
              <Flame className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <h4 className="font-mono font-bold text-purple-300">
                  TOKENIZED P2P ECONOMY • 1% DEFLATIONARY TOKEN BURN
                </h4>
                <p className="text-slate-300 leading-relaxed">
                  Every transaction between hunters burns 1% of the $PISO tokens permanently from circulation, creating organic deflation while empowering players to cash out earned monster bounties!
                </p>
              </div>
            </div>

            {/* List an Item for Sale Form */}
            <form onSubmit={handleListItem} className="p-4 rounded-2xl bg-[#0F172A]/80 border border-slate-800 space-y-3">
              <h4 className="font-mono text-xs font-bold text-white flex items-center space-x-2">
                <Tag className="w-4 h-4 text-amber-400" />
                <span>LIST AN ITEM FOR SALE IN $PISO</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                    Select Weapon / Gear from Inventory
                  </label>
                  <select
                    value={selectedItemToSell}
                    onChange={(e) => setSelectedItemToSell(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="">-- Choose item to list --</option>
                    {weapons.map((w) => (
                      <option key={w.id} value={`${w.name} (+${w.enhancementLevel})`}>
                        {w.icon} {w.name} (+{w.enhancementLevel}) — {w.rarity}
                      </option>
                    ))}
                    {relics.map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.icon} {r.name} — {r.rarity}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                    Price in $PISO
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={10}
                      value={sellPriceInput}
                      onChange={(e) => setSellPriceInput(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-3 pr-12 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                    />
                    <span className="absolute right-3 top-2 text-xs font-mono font-bold text-amber-400">
                      ₱PISO
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!selectedItemToSell}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 font-mono text-xs font-bold text-black transition active:scale-95"
                >
                  Create P2P Listing
                </button>
              </div>
            </form>

            {/* Active Market Listings */}
            <div className="space-y-3">
              <h4 className="font-mono text-xs font-bold text-slate-400 uppercase">
                Active Listings ({listings.length})
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {listings.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-[#0F172A]/70 border border-slate-800 flex items-center justify-between gap-3 hover:border-amber-500/50 transition"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl">
                        {item.icon}
                      </div>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <h5 className="font-mono text-xs font-bold text-white">
                            {item.itemName}
                          </h5>
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                              item.rarity === 'Legendary'
                                ? 'bg-amber-500/20 text-amber-300'
                                : item.rarity === 'Epic'
                                ? 'bg-purple-500/20 text-purple-300'
                                : 'bg-cyan-500/20 text-cyan-300'
                            }`}
                          >
                            {item.rarity}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">{item.stats}</p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          Seller: {item.seller} • Req Lv. {item.levelReq}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end space-y-1">
                      <span className="font-mono text-xs font-bold text-amber-400">
                        {item.pricePiso.toLocaleString()} ₱PISO
                      </span>
                      <button
                        onClick={() => handleBuyListing(item)}
                        className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition active:scale-95 shadow"
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
