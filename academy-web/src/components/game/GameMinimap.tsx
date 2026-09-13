import React, { useEffect, useState } from 'react';
import { DISTRICTS, DistrictInfo, NPC_LOCATIONS } from './Cyber3DWorld';
import { Navigation, Crosshair, Skull, ShieldAlert, Layers } from 'lucide-react';
import { SoundFX } from '../../services/soundFX';
import { useAcademy } from '../../context/AcademyContext';
import { MonsterSpawnEngine, MonsterEntity } from '../../services/MonsterSpawnEngine';
import { MultiplayerNetworkEngine } from '../../services/multiplayer/MultiplayerNetworkEngine';
import { RemotePlayerState } from '../../types/multiplayer';

interface GameMinimapProps {
  playerPosRef: React.MutableRefObject<{ x: number; z: number; heading: number }>;
  onSelectDistrict: (district: DistrictInfo) => void;
  cruiseTargetMentorId?: 'panday' | 'babaylan' | 'datu' | null;
  monsterEngine?: MonsterSpawnEngine | null;
}

export type MonsterDifficulty = 'easy' | 'medium' | 'hard' | 'boss';

export interface MinimapMonsterBlip {
  id: string;
  name: string;
  level: number;
  minPlayerLevel: number;
  isBoss: boolean;
  x: number;
  z: number;
  difficulty: MonsterDifficulty;
  color: string;
  hp: number;
  maxHp: number;
}

export const GameMinimap: React.FC<GameMinimapProps> = ({
  playerPosRef,
  onSelectDistrict,
  cruiseTargetMentorId,
  monsterEngine,
}) => {
  const { claimedMentorRewards } = useAcademy();
  const [coords, setCoords] = useState({ x: 0, z: 0, heading: 0 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [radarRange, setRadarRange] = useState<140 | 60>(140); // 140m Full World, 60m Tactical Local
  const [activeMonsters, setActiveMonsters] = useState<MinimapMonsterBlip[]>([]);
  const [hoveredMonster, setHoveredMonster] = useState<MinimapMonsterBlip | null>(null);
  const [remoteStudents, setRemoteStudents] = useState<RemotePlayerState[]>([]);

  // Sync player position and monster entities periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setCoords({ ...playerPosRef.current });

      if (monsterEngine && monsterEngine.monsters) {
        const blips: MinimapMonsterBlip[] = [];
        for (const m of monsterEngine.monsters) {
          if (!m.isAlive) continue;

          let diff: MonsterDifficulty = 'easy';
          let color = '#10B981'; // Emerald

          if (m.isBoss || m.level >= 25) {
            diff = 'boss';
            color = '#EF4444'; // Red
          } else if (m.level >= 15) {
            diff = 'hard';
            color = '#F97316'; // Orange
          } else if (m.level >= 5) {
            diff = 'medium';
            color = '#F59E0B'; // Amber
          }

          blips.push({
            id: m.id,
            name: m.name,
            level: m.level,
            minPlayerLevel: m.minPlayerLevel,
            isBoss: m.isBoss,
            x: m.mesh ? m.mesh.position.x : m.spawnPos.x,
            z: m.mesh ? m.mesh.position.z : m.spawnPos.z,
            difficulty: diff,
            color,
            hp: m.currentHp,
            maxHp: m.maxHp,
          });
        }
        setActiveMonsters(blips);
      }

      // Sync active remote students in radar
      try {
        const peers = Array.from(MultiplayerNetworkEngine.instance.getRemotePlayers().values());
        setRemoteStudents(peers);
      } catch {}
    }, 80);

    return () => clearInterval(interval);
  }, [playerPosRef, monsterEngine]);

  // Radar container size: w-44 h-44 = 176px x 176px, center radius = 88
  const radarRadius = 88;
  const toRadarX = (worldX: number) => {
    const clamped = Math.max(-radarRange, Math.min(radarRange, worldX));
    return radarRadius + (clamped / radarRange) * (radarRadius - 14);
  };
  const toRadarY = (worldZ: number) => {
    const clamped = Math.max(-radarRange, Math.min(radarRange, worldZ));
    return radarRadius + (clamped / radarRange) * (radarRadius - 14);
  };

  const counts = {
    easy: activeMonsters.filter((m) => m.difficulty === 'easy').length,
    medium: activeMonsters.filter((m) => m.difficulty === 'medium').length,
    hard: activeMonsters.filter((m) => m.difficulty === 'hard').length,
    boss: activeMonsters.filter((m) => m.difficulty === 'boss').length,
  };

  // Minimized Compact Chip
  if (isMinimized) {
    return (
      <button
        type="button"
        onClick={() => {
          setIsMinimized(false);
          SoundFX.playClick();
        }}
        className="group flex items-center space-x-1.5 px-3 py-1.5 rounded-2xl bg-[#0B0F17]/90 hover:bg-[#161F30] border border-amber-500/50 hover:border-amber-400 text-amber-300 font-mono text-xs font-bold transition shadow-[0_0_20px_rgba(245,158,11,0.3)] backdrop-blur-md active:scale-95 animate-fade-in"
        title="Restore Monster Radar Minimap"
      >
        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
        <span>📡 RADAR ({activeMonsters.length} MOBS)</span>
        <span className="text-[10px] text-slate-400 font-mono">
          ({coords.x.toFixed(0)}, {coords.z.toFixed(0)})
        </span>
      </button>
    );
  }

  return (
    <div className="relative group animate-fade-in flex flex-col items-center">
      {/* Header controls: Minimize & Radar Range Toggle */}
      <div className="w-full flex items-center justify-between mb-1 px-1">
        <button
          type="button"
          onClick={() => {
            setIsMinimized(true);
            SoundFX.playClick();
          }}
          className="w-5 h-5 rounded-full bg-slate-900/90 hover:bg-amber-500 text-slate-400 hover:text-slate-950 border border-slate-700 flex items-center justify-center text-xs font-bold transition-all shadow-md"
          title="Minimize Radar (Clear Screen)"
        >
          _
        </button>

        <button
          type="button"
          onClick={() => {
            SoundFX.playBlip();
            setRadarRange((prev) => (prev === 140 ? 60 : 140));
          }}
          className="px-2 py-0.5 rounded-md bg-[#161F30]/90 hover:bg-cyan-950 border border-cyan-500/40 text-[9px] font-mono text-cyan-300 flex items-center space-x-1 shadow-sm transition-all"
          title="Toggle Radar Zoom Scale"
        >
          <Layers className="w-2.5 h-2.5" />
          <span>{radarRange === 140 ? '140m World' : '60m Local'}</span>
        </button>
      </div>

      {/* Radar Container Circle */}
      <div className="w-44 h-44 rounded-full bg-[#0B0F17]/90 border-2 border-amber-500/70 shadow-[0_0_30px_rgba(245,158,11,0.3)] backdrop-blur-md relative overflow-hidden flex items-center justify-center p-1">
        {/* Radar Concentric Rings */}
        <div className="absolute inset-2 rounded-full border border-slate-700/50 pointer-events-none" />
        <div className="absolute inset-8 rounded-full border border-slate-800/60 pointer-events-none" />
        <div className="absolute inset-14 rounded-full border border-slate-800/40 pointer-events-none" />

        {/* Crosshair Lines */}
        <div className="absolute inset-x-0 top-1/2 h-[1px] bg-slate-700/40 pointer-events-none" />
        <div className="absolute inset-y-0 left-1/2 w-[1px] bg-slate-700/40 pointer-events-none" />

        {/* Rotating Radar Sweep Beam */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500/20 via-transparent to-transparent animate-spin duration-[4000ms] pointer-events-none" />

        {/* District Waypoints */}
        {DISTRICTS.map((d) => {
          const rx = toRadarX(d.pos[0]);
          const ry = toRadarY(d.pos[1]);
          return (
            <button
              key={d.id}
              onClick={() => {
                SoundFX.playClick();
                onSelectDistrict(d);
              }}
              title={`${d.name} (${d.tagline})`}
              className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full flex items-center justify-center text-[9px] hover:scale-125 transition-transform z-10"
              style={{
                left: `${rx}px`,
                top: `${ry}px`,
                backgroundColor: `#${d.color.toString(16).padStart(6, '0')}40`,
                border: `1px solid #${d.color.toString(16).padStart(6, '0')}`,
              }}
            >
              <span>{d.icon}</span>
            </button>
          );
        })}

        {/* Active Target Guidance Line */}
        {cruiseTargetMentorId && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            {(() => {
              const targetMentor = NPC_LOCATIONS.find((m) => m.id === cruiseTargetMentorId);
              if (!targetMentor) return null;
              return (
                <line
                  x1={toRadarX(coords.x)}
                  y1={toRadarY(coords.z)}
                  x2={toRadarX(targetMentor.pos[0])}
                  y2={toRadarY(targetMentor.pos[1])}
                  stroke="#06B6D4"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  opacity="0.85"
                />
              );
            })()}
          </svg>
        )}

        {/* NPC Mentor Waypoints */}
        {NPC_LOCATIONS.map((m) => {
          const rx = toRadarX(m.pos[0]);
          const ry = toRadarY(m.pos[1]);
          const isClaimed = claimedMentorRewards.includes(m.id);
          const isCruisingTo = cruiseTargetMentorId === m.id;

          return (
            <button
              key={m.id}
              onClick={() => {
                SoundFX.playWarp();
                window.dispatchEvent(
                  new CustomEvent('piso-navigate-to-mentor', { detail: { mentorId: m.id } })
                );
              }}
              title={`Mentor: ${m.name} [${isClaimed ? '✓ Claimed' : '🎁 +50 XP Ready'}] - Click to Fly!`}
              className={`absolute w-5 h-5 -ml-2.5 -mt-2.5 rounded-md flex items-center justify-center text-[10px] hover:scale-140 transition-transform z-15 shadow-md ${
                isCruisingTo
                  ? 'border-cyan-400 bg-cyan-950/90 ring-2 ring-cyan-400 scale-125 animate-pulse'
                  : isClaimed
                  ? 'border-emerald-400 bg-emerald-950/80'
                  : 'border-purple-400 bg-purple-950/90 animate-pulse'
              } border`}
              style={{
                left: `${rx}px`,
                top: `${ry}px`,
              }}
            >
              <span>{m.avatar}</span>
            </button>
          );
        })}

        {/* REMOTE STUDENTS RADAR BLIPS */}
        {remoteStudents.map((peer) => {
          const px = toRadarX(peer.transform.x);
          const py = toRadarY(peer.transform.z);
          return (
            <div
              key={peer.playerId}
              title={`🧑‍🎓 ${peer.username} (${peer.rankTitle})`}
              className="absolute w-3.5 h-3.5 -ml-1.75 -mt-1.75 rounded-full z-20 flex items-center justify-center cursor-pointer hover:scale-150 transition-transform"
              style={{ left: `${px}px`, top: `${py}px` }}
              onClick={() => {
                window.dispatchEvent(new CustomEvent('piso-interact-player', { detail: { player: peer } }));
                SoundFX.playBlip();
              }}
            >
              <span className="absolute w-full h-full rounded-full bg-cyan-400 animate-ping opacity-60" />
              <span className="relative w-2 h-2 rounded-full bg-cyan-400 border border-white shadow-[0_0_8px_#06B6D4]" />
            </div>
          );
        })}

        {/* MONSTER RADAR BLIPS (Easy to Hard & Titan Bosses) */}
        {activeMonsters.map((mob) => {
          const mx = toRadarX(mob.x);
          const my = toRadarY(mob.z);
          const isBoss = mob.difficulty === 'boss';

          return (
            <div
              key={mob.id}
              onMouseEnter={() => setHoveredMonster(mob)}
              onMouseLeave={() => setHoveredMonster(null)}
              onClick={() => {
                SoundFX.playBlip();
                // Dispatch navigation/target focus towards this monster's world location
                window.dispatchEvent(
                  new CustomEvent('piso-avatar-chat', {
                    detail: {
                      speaker: 'Radar AI',
                      text: `🎯 Locked on ${mob.name} [${mob.difficulty.toUpperCase()} Lvl ${mob.level}] at (${mob.x.toFixed(0)}, ${mob.z.toFixed(0)})!`,
                    },
                  })
                );
              }}
              title={`${mob.isBoss ? '💀 [BOSS TITAN]' : `[${mob.difficulty.toUpperCase()}]`} ${mob.name} (Lvl ${mob.level}) • Req Lvl: ${mob.minPlayerLevel} • HP: ${mob.hp.toLocaleString()}/${mob.maxHp.toLocaleString()}`}
              className={`absolute cursor-pointer transition-transform hover:scale-150 z-20 ${
                isBoss
                  ? 'w-4 h-4 -ml-2 -mt-2 flex items-center justify-center'
                  : 'w-2.5 h-2.5 -ml-1.25 -mt-1.25 rounded-full'
              }`}
              style={{
                left: `${mx}px`,
                top: `${my}px`,
              }}
            >
              {isBoss ? (
                <div className="relative flex items-center justify-center w-full h-full">
                  <span className="absolute w-3.5 h-3.5 rounded-full bg-red-600 animate-ping opacity-75" />
                  <span className="relative w-3.5 h-3.5 rounded-sm bg-red-950 border border-red-500 shadow-[0_0_8px_#EF4444] flex items-center justify-center text-[8px]">
                    💀
                  </span>
                </div>
              ) : (
                <div
                  className="w-full h-full rounded-full shadow-sm"
                  style={{
                    backgroundColor: mob.color,
                    border: `1px solid ${mob.color}`,
                    boxShadow: `0 0 6px ${mob.color}`,
                  }}
                />
              )}
            </div>
          );
        })}

        {/* Player Indicator Blip */}
        <div
          className="absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full bg-cyan-400 border-2 border-white shadow-[0_0_10px_#06B6D4] z-30 transition-all duration-75"
          style={{
            left: `${toRadarX(coords.x)}px`,
            top: `${toRadarY(coords.z)}px`,
          }}
        >
          {/* Vision Direction Arrow */}
          <div
            className="w-full h-full flex items-center justify-center text-white"
            style={{ transform: `rotate(${coords.heading}rad)` }}
          >
            <Navigation className="w-2.5 h-2.5 fill-white text-white" />
          </div>
        </div>
      </div>

      {/* Monster Tooltip on Hover */}
      {hoveredMonster && (
        <div className="mt-1 px-2.5 py-1 rounded-lg bg-slate-900/95 border border-slate-700 shadow-xl text-[10px] font-mono text-center animate-fade-in max-w-[190px]">
          <div className="font-bold flex items-center justify-center space-x-1" style={{ color: hoveredMonster.color }}>
            <span>{hoveredMonster.isBoss ? '💀 BOSS:' : '👾 MOB:'}</span>
            <span className="truncate">{hoveredMonster.name}</span>
          </div>
          <div className="text-slate-400 text-[9px]">
            Lvl {hoveredMonster.level} • Req Lvl {hoveredMonster.minPlayerLevel} • HP {hoveredMonster.hp}/{hoveredMonster.maxHp}
          </div>
        </div>
      )}

      {/* Monster Difficulty Legend & Counts */}
      <div className="mt-1.5 w-full flex items-center justify-between px-2 py-0.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[9px] font-mono select-none">
        <span className="text-emerald-400 flex items-center space-x-0.5" title="Easy Monsters (Cobras Lvl 1-4)">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
          <span>{counts.easy}</span>
        </span>
        <span className="text-amber-400 flex items-center space-x-0.5" title="Medium Monsters (Vultures / Bayawak Lvl 5-14)">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
          <span>{counts.medium}</span>
        </span>
        <span className="text-orange-400 flex items-center space-x-0.5" title="Hard Monsters (Mountain Askal Lvl 15-24)">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block" />
          <span>{counts.hard}</span>
        </span>
        <span className="text-red-400 flex items-center space-x-0.5" title="Titan Bosses (Senator / Admiral Buwaya Lvl 25+)">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
          <span>{counts.boss}</span>
        </span>
      </div>

      {/* Live Coordinate Badge */}
      <div className="mt-1 text-center font-mono text-[10px] text-amber-400 bg-slate-900/90 border border-slate-800 rounded-md py-0.5 px-2">
        X: {coords.x > 0 ? `+${coords.x.toFixed(0)}` : coords.x.toFixed(0)} | Z:{' '}
        {coords.z > 0 ? `+${coords.z.toFixed(0)}` : coords.z.toFixed(0)}
      </div>
    </div>
  );
};
