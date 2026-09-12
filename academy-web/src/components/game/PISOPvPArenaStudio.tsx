import React, { useState, useEffect } from 'react';
import { PlayerStatsEngine, PlayerStats } from '../../services/PlayerStatsEngine';
import { PisoEconomyService, OnChainWeaponGear, OnChainRelic, FarmingStats } from '../../services/pisoEconomyService';
import { SoundFX } from '../../services/soundFX';

interface PISOPvPArenaStudioProps {
  onClose: () => void;
}

interface QueuedDuelist {
  id: string;
  name: string;
  title: string;
  avatar: string;
  level: number;
  coins: number;
  wagerType: 'PISO_TOKEN' | 'WEAPON' | 'RELIC';
  wagerName: string;
  wagerIcon: string;
  wagerValue: number;
  gearItem?: OnChainWeaponGear;
  relicItem?: OnChainRelic;
  winRatio: string;
}

interface CombatLogEntry {
  turn: number;
  attacker: string;
  action: string;
  damage: number;
  isCrit: boolean;
  type: 'player' | 'opponent' | 'system';
}

interface PvPCombatRecord {
  duelsWon: number;
  duelsLost: number;
  itemsWon: number;
  pisoWon: number;
  recentDuels: Array<{
    opponent: string;
    result: 'VICTORY' | 'DEFEAT';
    wagerWonOrLost: string;
    timestamp: number;
  }>;
}

const STORAGE_KEY_RECORDS = 'piso_pvp_records_v1';

export const PISOPvPArenaStudio: React.FC<PISOPvPArenaStudioProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'queue' | 'wager' | 'duel' | 'records'>('queue');
  const [playerStats, setPlayerStats] = useState<PlayerStats>(PlayerStatsEngine.getStats());
  const [farmingStats, setFarmingStats] = useState<FarmingStats>(PisoEconomyService.getFarmingStats());
  const [weapons, setWeapons] = useState<OnChainWeaponGear[]>(PisoEconomyService.getWeapons());
  const [relics, setRelics] = useState<OnChainRelic[]>(PisoEconomyService.getRelics());

  // Player Wager Selection
  const [wagerType, setWagerType] = useState<'PISO_TOKEN' | 'WEAPON' | 'RELIC'>('PISO_TOKEN');
  const [tokenWagerAmount, setTokenWagerAmount] = useState<number>(100);
  const [selectedWeaponId, setSelectedWeaponId] = useState<number>(weapons[0]?.id || 1);
  const [selectedRelicId, setSelectedRelicId] = useState<number>(relics[0]?.id || 1);

  // Active Duel State
  const [activeOpponent, setActiveOpponent] = useState<QueuedDuelist | null>(null);
  const [playerHp, setPlayerHp] = useState<number>(playerStats.maxHp);
  const [opponentHp, setOpponentHp] = useState<number>(1000);
  const [opponentMaxHp, setOpponentMaxHp] = useState<number>(1000);
  const [combatLog, setCombatLog] = useState<CombatLogEntry[]>([]);
  const [turnCount, setTurnCount] = useState<number>(1);
  const [isDuelActive, setIsDuelActive] = useState<boolean>(false);
  const [duelResult, setDuelResult] = useState<'VICTORY' | 'DEFEAT' | null>(null);
  const [duelSpoilsMessage, setDuelSpoilsMessage] = useState<string>('');
  const [isTurnProcessing, setIsTurnProcessing] = useState<boolean>(false);

  // Records
  const [combatRecords, setCombatRecords] = useState<PvPCombatRecord>(() => {
    if (typeof window === 'undefined') {
      return { duelsWon: 0, duelsLost: 0, itemsWon: 0, pisoWon: 0, recentDuels: [] };
    }
    const raw = localStorage.getItem(STORAGE_KEY_RECORDS);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {}
    }
    return { duelsWon: 0, duelsLost: 0, itemsWon: 0, pisoWon: 0, recentDuels: [] };
  });

  // Simulated queue pool of combatants dynamically scaled to player level & coins
  const [queuedPool, setQueuedPool] = useState<QueuedDuelist[]>([]);

  useEffect(() => {
    // Generate matched and mismatched duelists based on player's current level & coins
    const pLvl = playerStats.level;
    const pCoins = Math.max(100, Math.round(farmingStats.totalHarvested + farmingStats.userPendingHarvest));

    const pool: QueuedDuelist[] = [
      // 1. Perfectly Fair Matched Opponent (Level equal, Coins within 10%)
      {
        id: 'duel_fair_1',
        name: 'Lapu-Lapu_0x',
        title: 'Mactan Cyber Chieftain',
        avatar: '🗡️',
        level: pLvl,
        coins: Math.round(pCoins * 0.95),
        wagerType: 'PISO_TOKEN',
        wagerName: '100 $PISO Stake',
        wagerIcon: '🪙',
        wagerValue: 100,
        winRatio: '68% (34W / 16L)',
      },
      // 2. Fair Matched (+1 Level, Coins +15%)
      {
        id: 'duel_fair_2',
        name: 'CyberDarna_99',
        title: 'Narda Ki Prodigy',
        avatar: '⚡',
        level: pLvl + 1,
        coins: Math.round(pCoins * 1.12),
        wagerType: 'WEAPON',
        wagerName: 'Kampilan Plasma Blade +2',
        wagerIcon: '⚔️',
        wagerValue: 250,
        gearItem: {
          id: 991,
          name: 'Kampilan Plasma Blade +2',
          category: 'WEAPON',
          rarity: 'Epic',
          attackPower: 380,
          defensePower: 30,
          enhancementLevel: 2,
          durability: 100,
          icon: '⚔️',
        },
        winRatio: '72% (48W / 18L)',
      },
      // 3. Fair Matched (-1 Level, Coins -12%)
      {
        id: 'duel_fair_3',
        name: 'Panday_Forge',
        title: 'Blacksmith of Bulacan',
        avatar: '🔨',
        level: Math.max(1, pLvl - 1),
        coins: Math.round(pCoins * 0.88),
        wagerType: 'RELIC',
        wagerName: 'Agimat ng Kidlat Relic',
        wagerIcon: '🧿',
        wagerValue: 200,
        relicItem: {
          id: 992,
          name: 'Agimat ng Kidlat Relic',
          count: 1,
          rarity: 'Rare',
          craftingCostPiso: 180,
          buffAprBps: 950,
          icon: '🧿',
          description: 'Thunder lightning talisman won in colosseum duel.',
        },
        winRatio: '61% (25W / 16L)',
      },
      // 4. UNFAIR: Level Gap Too High (+5 Levels - GRIEFING PREVENTION)
      {
        id: 'duel_unfair_lvl_high',
        name: 'Grand_Buwaya_Lord',
        title: 'Whale Overlord of Pasig',
        avatar: '🐊',
        level: pLvl + 5,
        coins: Math.round(pCoins * 1.8),
        wagerType: 'PISO_TOKEN',
        wagerName: '1,000 $PISO Stake',
        wagerIcon: '🪙',
        wagerValue: 1000,
        winRatio: '89% (120W / 14L)',
      },
      // 5. UNFAIR: Coin Gap Too High (+80% Net Worth disparity)
      {
        id: 'duel_unfair_coin_high',
        name: 'Makiling_Tycoon',
        title: 'Forest Treasury Keeper',
        avatar: '💰',
        level: pLvl,
        coins: Math.round(pCoins * 2.2),
        wagerType: 'PISO_TOKEN',
        wagerName: '500 $PISO Stake',
        wagerIcon: '🪙',
        wagerValue: 500,
        winRatio: '58% (30W / 22L)',
      },
      // 6. UNFAIR: Under-leveled (-4 Levels - SMURFING PREVENTION)
      {
        id: 'duel_unfair_lvl_low',
        name: 'Rookie_Tarsier',
        title: 'Bohol Novice Cadet',
        avatar: '🐒',
        level: Math.max(1, pLvl - 4),
        coins: Math.round(pCoins * 0.4),
        wagerType: 'PISO_TOKEN',
        wagerName: '50 $PISO Stake',
        wagerIcon: '🪙',
        wagerValue: 50,
        winRatio: '35% (7W / 13L)',
      },
    ];

    setQueuedPool(pool);
  }, [playerStats.level, farmingStats.totalHarvested, farmingStats.userPendingHarvest]);

  // Refresh player stats & inventory on window events
  useEffect(() => {
    const handleUpdate = () => {
      setPlayerStats(PlayerStatsEngine.getStats());
      setFarmingStats(PisoEconomyService.getFarmingStats());
      setWeapons(PisoEconomyService.getWeapons());
      setRelics(PisoEconomyService.getRelics());
    };
    window.addEventListener('piso-player-stats-updated', handleUpdate);
    window.addEventListener('piso-harvest-success', handleUpdate);
    window.addEventListener('piso-activity-earned', handleUpdate);
    return () => {
      window.removeEventListener('piso-player-stats-updated', handleUpdate);
      window.removeEventListener('piso-harvest-success', handleUpdate);
      window.removeEventListener('piso-activity-earned', handleUpdate);
    };
  }, []);

  const saveRecords = (newRecords: PvPCombatRecord) => {
    setCombatRecords(newRecords);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(newRecords));
    }
  };

  /**
   * Fair Matchmaking Validation Rule:
   * 1. |PlayerLevel - OpponentLevel| <= 2
   * 2. |PlayerCoins - OpponentCoins| <= 25% max
   */
  const evaluateMatchmakingFairness = (opponent: QueuedDuelist): {
    isFair: boolean;
    levelDiff: number;
    levelOk: boolean;
    coinDiffPct: number;
    coinsOk: boolean;
    reason: string;
  } => {
    const levelDiff = Math.abs(playerStats.level - opponent.level);
    const levelOk = levelDiff <= 2;

    const playerCoins = Math.max(1, Math.round(farmingStats.totalHarvested + farmingStats.userPendingHarvest));
    const higherCoins = Math.max(playerCoins, opponent.coins);
    const coinDiff = Math.abs(playerCoins - opponent.coins);
    const coinDiffPct = Math.round((coinDiff / higherCoins) * 100);
    const coinsOk = coinDiffPct <= 25;

    const isFair = levelOk && coinsOk;

    let reason = '✅ EQUAL FAIR MATCH (Level ±2 & Coins ±25%)';
    if (!levelOk && !coinsOk) {
      reason = `❌ UNFAIR: Level gap (${levelDiff} lvls) & Net Worth gap (${coinDiffPct}%) exceed fair duel limits!`;
    } else if (!levelOk) {
      reason = `❌ UNFAIR: Level difference (${levelDiff} levels) exceeds ±2 maximum!`;
    } else if (!coinsOk) {
      reason = `❌ UNFAIR: Coin net worth difference (${coinDiffPct}%) exceeds 25% tolerance!`;
    }

    return { isFair, levelDiff, levelOk, coinDiffPct, coinsOk, reason };
  };

  /**
   * Starts a Duel against the selected opponent.
   */
  const initiateDuel = (opponent: QueuedDuelist) => {
    const fairness = evaluateMatchmakingFairness(opponent);
    if (!fairness.isFair) {
      try {
        SoundFX.playClick();
      } catch {}
      return;
    }

    // Verify player has enough wager
    if (wagerType === 'PISO_TOKEN') {
      const playerBalance = farmingStats.totalHarvested + farmingStats.userPendingHarvest;
      if (playerBalance < tokenWagerAmount) {
        alert(`⚠️ Insufficient PISO tokens! You need ${tokenWagerAmount} PISO to place this wager.`);
        return;
      }
    }

    try {
      SoundFX.playClick();
      SoundFX.playLaser();
    } catch {}

    const oppHp = 1000 + opponent.level * 150;
    setActiveOpponent(opponent);
    setPlayerHp(playerStats.maxHp);
    setOpponentHp(oppHp);
    setOpponentMaxHp(oppHp);
    setCombatLog([
      {
        turn: 1,
        attacker: 'SYSTEM',
        action: `⚔️ HIGH-STAKES DUEL COMMENCED! ${playerStats.level >= opponent.level ? 'Player' : opponent.name} holds colosseum advantage!`,
        damage: 0,
        isCrit: false,
        type: 'system',
      },
      {
        turn: 1,
        attacker: 'ESCROW',
        action: `🛡️ Both fighters locked their wagers in escrow! Loser forfeits their offered item/tokens to the victor!`,
        damage: 0,
        isCrit: false,
        type: 'system',
      },
    ]);
    setTurnCount(1);
    setIsDuelActive(true);
    setDuelResult(null);
    setDuelSpoilsMessage('');
    setActiveTab('duel');
  };

  /**
   * Executes a player turn action in the Colosseum.
   */
  const executeCombatMove = (
    skillName: string,
    basePower: number,
    sfxType: 'laser' | 'kamehameha' | 'impact'
  ) => {
    if (!isDuelActive || !activeOpponent || isTurnProcessing || opponentHp <= 0 || playerHp <= 0) return;

    setIsTurnProcessing(true);

    try {
      if (sfxType === 'laser') SoundFX.playLaser();
      else if (sfxType === 'kamehameha') SoundFX.playKamehameha();
      else SoundFX.playImpact();
    } catch {}

    // Calculate player damage
    const { finalDamage, isCrit } = PlayerStatsEngine.calculateDamage(basePower);
    const newOppHp = Math.max(0, opponentHp - finalDamage);
    setOpponentHp(newOppHp);

    const playerEntry: CombatLogEntry = {
      turn: turnCount,
      attacker: 'Hero (You)',
      action: `${skillName}${isCrit ? ' [CRITICAL IMPACT!]' : ''}`,
      damage: finalDamage,
      isCrit,
      type: 'player',
    };

    const nextLog = [...combatLog, playerEntry];

    // Check if opponent defeated
    if (newOppHp <= 0) {
      handleDuelResolution('VICTORY', nextLog, activeOpponent);
      setIsTurnProcessing(false);
      return;
    }

    // Opponent counter-attack after 650ms delay
    setTimeout(() => {
      try {
        SoundFX.playImpact();
      } catch {}

      const oppBase = 80 + activeOpponent.level * 15;
      const oppCrit = Math.random() < 0.2;
      const defReduction = (playerStats.statDef * 0.03);
      const oppDamage = Math.max(20, Math.round((oppBase * (oppCrit ? 1.5 : 1.0)) * (1 - Math.min(0.6, defReduction))));
      const newPlayerHp = Math.max(0, playerHp - oppDamage);
      setPlayerHp(newPlayerHp);

      const oppEntry: CombatLogEntry = {
        turn: turnCount,
        attacker: activeOpponent.name,
        action: `Counters with ${activeOpponent.level > 10 ? 'GIGA TSUNAMI SLASH' : 'CYBER BLADE RUSH'}!`,
        damage: oppDamage,
        isCrit: oppCrit,
        type: 'opponent',
      };

      const updatedLog = [...nextLog, oppEntry];
      setCombatLog(updatedLog);
      setTurnCount((prev) => prev + 1);

      if (newPlayerHp <= 0) {
        handleDuelResolution('DEFEAT', updatedLog, activeOpponent);
      }
      setIsTurnProcessing(false);
    }, 650);
  };

  /**
   * Resolves the duel, settling item escrow and transfers.
   */
  const handleDuelResolution = (
    result: 'VICTORY' | 'DEFEAT',
    finalLogs: CombatLogEntry[],
    opponent: QueuedDuelist
  ) => {
    setIsDuelActive(false);
    setDuelResult(result);

    const now = Date.now();
    let spoilsSummary = '';

    if (result === 'VICTORY') {
      try {
        SoundFX.playLevelUp();
      } catch {}

      // Player won! Opponent forfeits their wager
      if (opponent.wagerType === 'WEAPON' && opponent.gearItem) {
        PisoEconomyService.addWeapon(opponent.gearItem);
        spoilsSummary = `🎁 SPOILS OF WAR: You claimed ${opponent.name}'s [${opponent.gearItem.name}]! Added to your Gear Inventory!`;
      } else if (opponent.wagerType === 'RELIC' && opponent.relicItem) {
        PisoEconomyService.addRelic(opponent.relicItem);
        spoilsSummary = `🧿 SPOILS OF WAR: You claimed ${opponent.name}'s [${opponent.relicItem.name}]! Added to your Relic Vault!`;
      } else {
        // Token wager: 99% to player, 1% deflationary burn
        const wonTokens = Math.round(opponent.wagerValue * 0.99);
        PisoEconomyService.recordActivityReward(wonTokens, `🏆 PvP Colosseum Victory vs ${opponent.name}`);
        spoilsSummary = `🪙 SPOILS OF WAR: You claimed ${wonTokens} $PISO tokens! (1% protocol fee burned to 0x0...dead).`;
      }

      // Update records
      const newRec: PvPCombatRecord = {
        duelsWon: combatRecords.duelsWon + 1,
        duelsLost: combatRecords.duelsLost,
        itemsWon: combatRecords.itemsWon + (opponent.wagerType !== 'PISO_TOKEN' ? 1 : 0),
        pisoWon: combatRecords.pisoWon + (opponent.wagerType === 'PISO_TOKEN' ? Math.round(opponent.wagerValue * 0.99) : 0),
        recentDuels: [
          {
            opponent: opponent.name,
            result: 'VICTORY',
            wagerWonOrLost: opponent.wagerName,
            timestamp: now,
          },
          ...combatRecords.recentDuels.slice(0, 9),
        ],
      };
      saveRecords(newRec);

      // Award bonus XP to player
      PlayerStatsEngine.addExp(250 + opponent.level * 50);

    } else {
      // DEFEAT! Player forfeits their selected wager
      try {
        SoundFX.playImpact();
      } catch {}

      if (wagerType === 'WEAPON') {
        const weaponLost = weapons.find((w) => w.id === selectedWeaponId);
        if (weaponLost) {
          PisoEconomyService.removeWeapon(selectedWeaponId);
          spoilsSummary = `💀 ITEM FORFEITED: You lost your [${weaponLost.name}] to ${opponent.name}!`;
        }
      } else if (wagerType === 'RELIC') {
        const relicLost = relics.find((r) => r.id === selectedRelicId);
        if (relicLost) {
          PisoEconomyService.adjustRelicCount(selectedRelicId, -1);
          spoilsSummary = `💀 RELIC FORFEITED: You lost 1x [${relicLost.name}] to ${opponent.name}!`;
        }
      } else {
        PisoEconomyService.deductActivityReward(tokenWagerAmount);
        spoilsSummary = `💀 TOKENS FORFEITED: ${tokenWagerAmount} $PISO forfeited to ${opponent.name}!`;
      }

      // Update records
      const newRec: PvPCombatRecord = {
        duelsWon: combatRecords.duelsWon,
        duelsLost: combatRecords.duelsLost + 1,
        itemsWon: combatRecords.itemsWon,
        pisoWon: combatRecords.pisoWon,
        recentDuels: [
          {
            opponent: opponent.name,
            result: 'DEFEAT',
            wagerWonOrLost:
              wagerType === 'WEAPON'
                ? weapons.find((w) => w.id === selectedWeaponId)?.name || 'Weapon'
                : wagerType === 'RELIC'
                ? relics.find((r) => r.id === selectedRelicId)?.name || 'Relic'
                : `${tokenWagerAmount} PISO`,
            timestamp: now,
          },
          ...combatRecords.recentDuels.slice(0, 9),
        ],
      };
      saveRecords(newRec);
    }

    setDuelSpoilsMessage(spoilsSummary);
    setCombatLog([
      ...finalLogs,
      {
        turn: turnCount,
        attacker: 'COLOSSEUM',
        action: spoilsSummary,
        damage: 0,
        isCrit: false,
        type: 'system',
      },
    ]);
  };

  const getPlayerNetWorth = () => {
    return Math.round(farmingStats.totalHarvested + farmingStats.userPendingHarvest);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
      <div className="relative w-full max-w-5xl h-[92vh] max-h-[860px] bg-[#090D16] border-2 border-[#2A3B5C] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0D1424] border-b border-[#1E293B]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center text-2xl shadow-lg shadow-red-900/30">
              ⚔️
            </div>
            <div>
              <h2 className="text-xl font-black tracking-wide text-white flex items-center gap-2">
                PISO PVP COLOSSEUM
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-900/40 text-red-400 border border-red-700/50 uppercase tracking-widest">
                  High-Stakes Arena
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Item-wagered duels with strictly equal queue matchmaking (±2 Levels, ±25% Net Worth)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick Stats Pill */}
            <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-[#151D30] border border-[#263550] text-xs">
              <span className="text-slate-400">Hero:</span>
              <span className="font-bold text-amber-400 font-mono">Lv. {playerStats.level}</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">Coins:</span>
              <span className="font-bold text-cyan-300 font-mono">{getPlayerNetWorth().toLocaleString()} PISO</span>
              <span className="text-slate-600">|</span>
              <span className="text-emerald-400 font-bold">{combatRecords.duelsWon}W</span>
              <span className="text-red-400 font-bold">{combatRecords.duelsLost}L</span>
            </div>

            <button
              onClick={() => {
                try {
                  SoundFX.playClick();
                } catch {}
                onClose();
              }}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Close PvP Colosseum"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#1E293B] bg-[#0A0F1D] px-6">
          <button
            onClick={() => {
              try {
                SoundFX.playClick();
              } catch {}
              setActiveTab('queue');
            }}
            className={`flex items-center gap-2 px-4 py-3 font-bold text-xs uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'queue'
                ? 'border-red-500 text-red-400 bg-red-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🎯</span> Equal Queue Matchmaking
          </button>
          <button
            onClick={() => {
              try {
                SoundFX.playClick();
              } catch {}
              setActiveTab('wager');
            }}
            className={`flex items-center gap-2 px-4 py-3 font-bold text-xs uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'wager'
                ? 'border-amber-500 text-amber-400 bg-amber-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🛡️</span> Your Wager Vault
          </button>
          <button
            onClick={() => {
              try {
                SoundFX.playClick();
              } catch {}
              setActiveTab('duel');
            }}
            className={`flex items-center gap-2 px-4 py-3 font-bold text-xs uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'duel'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🏟️</span> Colosseum Ring {isDuelActive && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>}
          </button>
          <button
            onClick={() => {
              try {
                SoundFX.playClick();
              } catch {}
              setActiveTab('records');
            }}
            className={`flex items-center gap-2 px-4 py-3 font-bold text-xs uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'records'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🏆</span> Records & Spoils ({combatRecords.itemsWon} Items)
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#070B14]">

          {/* TAB 1: EQUAL QUEUE MATCHMAKING */}
          {activeTab === 'queue' && (
            <div className="space-y-6 animate-fade-in">
              {/* Matchmaking Fairness Notice Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/40 via-purple-950/30 to-slate-900/60 border border-blue-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">⚖️</div>
                  <div>
                    <h3 className="text-sm font-black text-cyan-300 uppercase tracking-wide">
                      Anti-Griefing & Anti-Smurfing Queue Engine
                    </h3>
                    <p className="text-xs text-slate-300">
                      Fair duels strictly require <span className="text-amber-300 font-bold">Level within ±2</span> and{' '}
                      <span className="text-cyan-300 font-bold">Coin Net Worth within ±25%</span>. Overpowered challengers are automatically locked out!
                    </p>
                  </div>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-black/40 border border-slate-700/60 text-xs font-mono">
                  <span className="text-slate-400">Current Tolerance: </span>
                  <span className="text-emerald-400 font-bold">Lv. {Math.max(1, playerStats.level - 2)} - {playerStats.level + 2}</span>
                </div>
              </div>

              {/* Your Active Wager Summary */}
              <div className="p-3.5 rounded-xl bg-[#0F1626] border border-[#23314D] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {wagerType === 'WEAPON' ? '⚔️' : wagerType === 'RELIC' ? '🧿' : '🪙'}
                  </span>
                  <div>
                    <div className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">
                      Your Offered Wager (Loser Forfeits)
                    </div>
                    <div className="text-sm font-bold text-amber-400">
                      {wagerType === 'WEAPON'
                        ? weapons.find((w) => w.id === selectedWeaponId)?.name || 'Kampilan Plasma Saber'
                        : wagerType === 'RELIC'
                        ? relics.find((r) => r.id === selectedRelicId)?.name || 'Agimat'
                        : `${tokenWagerAmount} $PISO Tokens`}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('wager')}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-colors"
                >
                  Change Wager ⚙️
                </button>
              </div>

              {/* Queue List */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
                  <span>Duelists Currently Waiting in Queue ({queuedPool.length})</span>
                  <span className="text-[11px] text-cyan-400">Live PISO Chain Matchmaking</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {queuedPool.map((duelist) => {
                    const fairness = evaluateMatchmakingFairness(duelist);
                    return (
                      <div
                        key={duelist.id}
                        className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                          fairness.isFair
                            ? 'bg-[#0E1729] border-[#223961] hover:border-cyan-500/60 shadow-lg'
                            : 'bg-[#111622]/60 border-slate-800/80 opacity-75'
                        }`}
                      >
                        {/* Top: Avatar & Info */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-[#1A253D] border border-slate-700 flex items-center justify-center text-2xl">
                              {duelist.avatar}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-sm">{duelist.name}</span>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40">
                                  Lv. {duelist.level}
                                </span>
                              </div>
                              <div className="text-xs text-slate-400">{duelist.title}</div>
                              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                                Winrate: {duelist.winRatio}
                              </div>
                            </div>
                          </div>

                          {/* Coins badge */}
                          <div className="text-right font-mono">
                            <div className="text-xs text-cyan-400 font-bold">
                              {duelist.coins.toLocaleString()} PISO
                            </div>
                            <div className="text-[10px] text-slate-500">Net Worth</div>
                          </div>
                        </div>

                        {/* Wager Offered */}
                        <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800 mb-3 flex items-center justify-between text-xs">
                          <span className="text-slate-400">Offered Wager:</span>
                          <span className="font-bold text-amber-300 flex items-center gap-1">
                            <span>{duelist.wagerIcon}</span> {duelist.wagerName}
                          </span>
                        </div>

                        {/* Fairness Check Badge & Button */}
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                          <div className="text-[11px] font-semibold">
                            {fairness.isFair ? (
                              <span className="text-emerald-400 flex items-center gap-1">
                                <span>✅</span> Fair Match
                              </span>
                            ) : (
                              <span className="text-red-400 flex items-center gap-1" title={fairness.reason}>
                                <span>⛔</span> Unfair Match
                              </span>
                            )}
                          </div>

                          <button
                            disabled={!fairness.isFair}
                            onClick={() => initiateDuel(duelist)}
                            className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                              fairness.isFair
                                ? 'bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-lg shadow-red-950/50 active:scale-95'
                                : 'bg-slate-800/60 text-slate-500 border border-slate-700/40 cursor-not-allowed'
                            }`}
                          >
                            <span>⚔️</span> {fairness.isFair ? 'Duel Now' : 'Locked (Unfair)'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: YOUR WAGER VAULT */}
          {activeTab === 'wager' && (
            <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-black text-white uppercase tracking-wider">
                  Colosseum Escrow Wager Selector
                </h3>
                <p className="text-xs text-slate-400 max-w-lg mx-auto">
                  Choose the item or tokens you are willing to wager. If you win, you take the opponent's item.
                  If you are defeated, your wager is forfeited directly to the victor!
                </p>
              </div>

              {/* Type Selectors */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => {
                    try {
                      SoundFX.playClick();
                    } catch {}
                    setWagerType('PISO_TOKEN');
                  }}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                    wagerType === 'PISO_TOKEN'
                      ? 'bg-amber-950/30 border-amber-500 text-amber-300 shadow-lg'
                      : 'bg-[#0E1524] border-[#223048] text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <span className="text-3xl">🪙</span>
                  <span className="text-xs font-bold uppercase tracking-wider">$PISO Tokens</span>
                  <span className="text-[10px] text-slate-400">1% Deflationary Burn</span>
                </button>

                <button
                  onClick={() => {
                    try {
                      SoundFX.playClick();
                    } catch {}
                    setWagerType('WEAPON');
                  }}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                    wagerType === 'WEAPON'
                      ? 'bg-red-950/30 border-red-500 text-red-300 shadow-lg'
                      : 'bg-[#0E1524] border-[#223048] text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <span className="text-3xl">⚔️</span>
                  <span className="text-xs font-bold uppercase tracking-wider">Equipped Weapon</span>
                  <span className="text-[10px] text-slate-400">ERC-721 NFT Forfeit</span>
                </button>

                <button
                  onClick={() => {
                    try {
                      SoundFX.playClick();
                    } catch {}
                    setWagerType('RELIC');
                  }}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                    wagerType === 'RELIC'
                      ? 'bg-purple-950/30 border-purple-500 text-purple-300 shadow-lg'
                      : 'bg-[#0E1524] border-[#223048] text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <span className="text-3xl">🧿</span>
                  <span className="text-xs font-bold uppercase tracking-wider">Crafted Relic</span>
                  <span className="text-[10px] text-slate-400">ERC-1155 Forfeit</span>
                </button>
              </div>

              {/* Sub-selectors */}
              {wagerType === 'PISO_TOKEN' && (
                <div className="p-5 rounded-xl bg-[#0F1728] border border-[#253655] space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">Select Token Wager Amount:</span>
                    <span className="text-xs font-mono text-cyan-300">
                      Balance: {getPlayerNetWorth().toLocaleString()} PISO
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    {[50, 100, 250, 500].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => {
                          try {
                            SoundFX.playClick();
                          } catch {}
                          setTokenWagerAmount(amt);
                        }}
                        className={`py-3 rounded-lg font-mono font-bold text-sm border transition-all ${
                          tokenWagerAmount === amt
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                            : 'bg-black/30 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        {amt} PISO
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {wagerType === 'WEAPON' && (
                <div className="p-5 rounded-xl bg-[#0F1728] border border-[#253655] space-y-4">
                  <div className="text-xs font-bold text-slate-300">
                    Select Weapon to Wager (Will be forfeited if defeated):
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {weapons.map((w) => (
                      <div
                        key={w.id}
                        onClick={() => {
                          try {
                            SoundFX.playClick();
                          } catch {}
                          setSelectedWeaponId(w.id);
                        }}
                        className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                          selectedWeaponId === w.id
                            ? 'bg-red-950/30 border-red-500 ring-1 ring-red-500'
                            : 'bg-black/30 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{w.icon}</span>
                          <div>
                            <div className="text-xs font-bold text-white">
                              {w.name} {w.enhancementLevel > 0 ? `+${w.enhancementLevel}` : ''}
                            </div>
                            <div className="text-[10px] text-red-400 font-mono">
                              ATK +{w.attackPower} | DEF +{w.defensePower}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {w.rarity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {wagerType === 'RELIC' && (
                <div className="p-5 rounded-xl bg-[#0F1728] border border-[#253655] space-y-4">
                  <div className="text-xs font-bold text-slate-300">
                    Select Relic to Wager (1 count will be forfeited if defeated):
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {relics
                      .filter((r) => r.count > 0)
                      .map((r) => (
                        <div
                          key={r.id}
                          onClick={() => {
                            try {
                              SoundFX.playClick();
                            } catch {}
                            setSelectedRelicId(r.id);
                          }}
                          className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                            selectedRelicId === r.id
                              ? 'bg-purple-950/30 border-purple-500 ring-1 ring-purple-500'
                              : 'bg-black/30 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl">{r.icon}</span>
                            <div>
                              <div className="text-xs font-bold text-white">{r.name}</div>
                              <div className="text-[10px] text-purple-400 font-mono">
                                Owned: {r.count}x | +{r.buffAprBps / 100}% APR
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {r.rarity}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="text-center pt-2">
                <button
                  onClick={() => {
                    try {
                      SoundFX.playClick();
                    } catch {}
                    setActiveTab('queue');
                  }}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg"
                >
                  Confirm Wager & Return to Queue ⚔️
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: COLOSSEUM COMBAT RING */}
          {activeTab === 'duel' && (
            <div className="space-y-4 animate-fade-in max-w-4xl mx-auto">
              {!activeOpponent ? (
                <div className="text-center py-16 space-y-3">
                  <div className="text-5xl">🏟️</div>
                  <h3 className="text-base font-black text-slate-300">No Active Duel in the Ring</h3>
                  <p className="text-xs text-slate-500">
                    Visit the Matchmaking Queue tab to find a fair challenger within ±2 levels and ±25% Net Worth!
                  </p>
                  <button
                    onClick={() => setActiveTab('queue')}
                    className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider"
                  >
                    Go to Queue
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Combatant Health Gauges */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Player Card */}
                    <div className="p-4 rounded-xl bg-[#0E1626] border-2 border-cyan-700/60 shadow-lg relative overflow-hidden">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">🦸‍♂️</span>
                          <div>
                            <div className="text-sm font-bold text-white">Hero (You)</div>
                            <div className="text-[10px] text-cyan-400 font-mono">
                              Lv. {playerStats.level} | ATK {playerStats.statAtk} | DEF {playerStats.statDef}
                            </div>
                          </div>
                        </div>
                        <div className="text-right font-mono font-bold text-sm text-cyan-300">
                          {playerHp} / {playerStats.maxHp} HP
                        </div>
                      </div>

                      {/* HP Bar */}
                      <div className="w-full h-3 bg-black/60 rounded-full overflow-hidden border border-slate-700">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                          style={{ width: `${Math.max(0, (playerHp / playerStats.maxHp) * 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Opponent Card */}
                    <div className="p-4 rounded-xl bg-[#0E1626] border-2 border-red-700/60 shadow-lg relative overflow-hidden">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{activeOpponent.avatar}</span>
                          <div>
                            <div className="text-sm font-bold text-white">{activeOpponent.name}</div>
                            <div className="text-[10px] text-red-400 font-mono">
                              Lv. {activeOpponent.level} | {activeOpponent.title}
                            </div>
                          </div>
                        </div>
                        <div className="text-right font-mono font-bold text-sm text-red-300">
                          {opponentHp} / {opponentMaxHp} HP
                        </div>
                      </div>

                      {/* HP Bar */}
                      <div className="w-full h-3 bg-black/60 rounded-full overflow-hidden border border-slate-700">
                        <div
                          className="h-full bg-gradient-to-r from-red-500 to-amber-500 transition-all duration-300"
                          style={{ width: `${Math.max(0, (opponentHp / opponentMaxHp) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Duel Result Banner */}
                  {duelResult && (
                    <div
                      className={`p-4 rounded-xl border text-center space-y-2 animate-bounce-in ${
                        duelResult === 'VICTORY'
                          ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                          : 'bg-red-950/40 border-red-500 text-red-300'
                      }`}
                    >
                      <div className="text-3xl font-black tracking-widest uppercase">
                        {duelResult === 'VICTORY' ? '🏆 VICTORY!' : '💀 DEFEAT!'}
                      </div>
                      <div className="text-xs font-bold">{duelSpoilsMessage}</div>
                      <div className="pt-2">
                        <button
                          onClick={() => {
                            try {
                              SoundFX.playClick();
                            } catch {}
                            setActiveTab('queue');
                          }}
                          className="px-5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider"
                        >
                          Find Next Opponent ⚔️
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Combat Controls */}
                  {isDuelActive && (
                    <div className="p-4 rounded-xl bg-[#0F1729] border border-[#23334F] space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-300 uppercase tracking-wider">
                          Choose Super Power Strike:
                        </span>
                        <span className="text-slate-400 font-mono">Turn #{turnCount}</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <button
                          disabled={isTurnProcessing}
                          onClick={() => executeCombatMove('⚡ GIGA KAMEHAMEHA BEAM', 380, 'kamehameha')}
                          className="p-3 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-900 hover:from-blue-600 hover:to-indigo-800 disabled:opacity-50 text-white font-bold text-xs flex flex-col items-center gap-1 shadow transition-all active:scale-95"
                        >
                          <span className="text-xl">⚡</span>
                          <span>Giga Kamehameha</span>
                          <span className="text-[10px] text-cyan-300 font-mono">380 Base ATK</span>
                        </button>

                        <button
                          disabled={isTurnProcessing}
                          onClick={() => executeCombatMove('💥 GEAR FIFTH PISO FIST', 450, 'impact')}
                          className="p-3 rounded-xl bg-gradient-to-br from-amber-600 to-red-800 hover:from-amber-500 hover:to-red-700 disabled:opacity-50 text-white font-bold text-xs flex flex-col items-center gap-1 shadow transition-all active:scale-95"
                        >
                          <span className="text-xl">💥</span>
                          <span>Gear 5 Piso Fist</span>
                          <span className="text-[10px] text-amber-300 font-mono">450 Base ATK</span>
                        </button>

                        <button
                          disabled={isTurnProcessing}
                          onClick={() => executeCombatMove('🩴 DISCIPLINE TSINELAS HOMING', 320, 'laser')}
                          className="p-3 rounded-xl bg-gradient-to-br from-pink-700 to-rose-900 hover:from-pink-600 hover:to-rose-800 disabled:opacity-50 text-white font-bold text-xs flex flex-col items-center gap-1 shadow transition-all active:scale-95"
                        >
                          <span className="text-xl">🩴</span>
                          <span>Nanay Tsinelas</span>
                          <span className="text-[10px] text-pink-300 font-mono">320 Base ATK</span>
                        </button>

                        <button
                          disabled={isTurnProcessing}
                          onClick={() => executeCombatMove('🛡️ KALASAG AEGIS COUNTER', 260, 'impact')}
                          className="p-3 rounded-xl bg-gradient-to-br from-emerald-700 to-teal-900 hover:from-emerald-600 hover:to-teal-800 disabled:opacity-50 text-white font-bold text-xs flex flex-col items-center gap-1 shadow transition-all active:scale-95"
                        >
                          <span className="text-xl">🛡️</span>
                          <span>Kalasag Counter</span>
                          <span className="text-[10px] text-emerald-300 font-mono">260 Base ATK</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Battle Log Box */}
                  <div className="p-3.5 rounded-xl bg-[#060911] border border-slate-800 max-h-48 overflow-y-auto space-y-1.5 font-mono text-xs">
                    <div className="text-slate-500 text-[10px] uppercase tracking-wider font-bold mb-1">
                      Live Combat Telemetry & Clashes:
                    </div>
                    {combatLog.map((log, idx) => (
                      <div
                        key={idx}
                        className={`py-0.5 ${
                          log.type === 'player'
                            ? 'text-cyan-300'
                            : log.type === 'opponent'
                            ? 'text-red-300'
                            : 'text-amber-300 font-bold'
                        }`}
                      >
                        <span className="text-slate-500">[{log.attacker}]</span> {log.action}{' '}
                        {log.damage > 0 && (
                          <span className="font-bold">(-{log.damage} HP)</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: RECORDS & SPOILS */}
          {activeTab === 'records' && (
            <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
              <div className="grid grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-[#0E1626] border border-[#23314D] text-center">
                  <div className="text-2xl font-black text-emerald-400 font-mono">{combatRecords.duelsWon}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold mt-1">Duels Won</div>
                </div>
                <div className="p-4 rounded-xl bg-[#0E1626] border border-[#23314D] text-center">
                  <div className="text-2xl font-black text-red-400 font-mono">{combatRecords.duelsLost}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold mt-1">Duels Lost</div>
                </div>
                <div className="p-4 rounded-xl bg-[#0E1626] border border-[#23314D] text-center">
                  <div className="text-2xl font-black text-amber-400 font-mono">{combatRecords.itemsWon}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold mt-1">Items Won</div>
                </div>
                <div className="p-4 rounded-xl bg-[#0E1626] border border-[#23314D] text-center">
                  <div className="text-2xl font-black text-cyan-300 font-mono">{combatRecords.pisoWon.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold mt-1">Net PISO Won</div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
                  Recent Duel History & Forfeitures
                </h4>

                {combatRecords.recentDuels.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    No recent duels recorded. Enter the Colosseum queue to fight for wagered items!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {combatRecords.recentDuels.map((d, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg bg-[#0E1524] border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`font-black px-2 py-0.5 rounded text-[10px] ${
                              d.result === 'VICTORY'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/50'
                                : 'bg-red-950 text-red-400 border border-red-700/50'
                            }`}
                          >
                            {d.result}
                          </span>
                          <span className="font-bold text-white">vs {d.opponent}</span>
                        </div>
                        <div className="text-slate-300 font-mono">
                          {d.result === 'VICTORY' ? 'Spoils Claimed: ' : 'Forfeited: '}
                          <span className={d.result === 'VICTORY' ? 'text-amber-300 font-bold' : 'text-red-400'}>
                            {d.wagerWonOrLost}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer info bar */}
        <div className="px-6 py-2.5 bg-[#0A0E18] border-t border-[#1C2538] flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Connected: PISO Dev Chain (piso-rpc-dev.loca.lt)</span>
          </div>
          <div>Strict Fair Queue: Level ±2 | Coins ±25% | Loser Forfeits Item</div>
        </div>

      </div>
    </div>
  );
};
