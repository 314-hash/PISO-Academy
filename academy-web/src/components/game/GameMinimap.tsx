import React, { useEffect, useState } from 'react';
import { DISTRICTS, DistrictInfo, NPC_LOCATIONS } from './Cyber3DWorld';
import { Navigation } from 'lucide-react';
import { SoundFX } from '../../services/soundFX';
import { useAcademy } from '../../context/AcademyContext';

interface GameMinimapProps {
  playerPosRef: React.MutableRefObject<{ x: number; z: number; heading: number }>;
  onSelectDistrict: (district: DistrictInfo) => void;
  cruiseTargetMentorId?: 'panday' | 'babaylan' | 'datu' | null;
}

export const GameMinimap: React.FC<GameMinimapProps> = ({
  playerPosRef,
  onSelectDistrict,
  cruiseTargetMentorId,
}) => {
  const { claimedMentorRewards } = useAcademy();
  const [coords, setCoords] = useState({ x: 0, z: 0, heading: 0 });
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCoords({ ...playerPosRef.current });
    }, 60);
    return () => clearInterval(interval);
  }, [playerPosRef]);

  // Radar scale: maps -40..+40 to 0..120px
  const radarRadius = 60;
  const toRadarX = (worldX: number) => radarRadius + (worldX / 40) * (radarRadius - 10);
  const toRadarY = (worldZ: number) => radarRadius + (worldZ / 40) * (radarRadius - 10);

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
        title="Restore Radar Minimap"
      >
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        <span>📡 RADAR</span>
        <span className="text-[10px] text-slate-400 font-mono">
          ({coords.x.toFixed(0)}, {coords.z.toFixed(0)})
        </span>
      </button>
    );
  }

  return (
    <div className="relative group animate-fade-in">
      {/* Minimize Button */}
      <button
        type="button"
        onClick={() => {
          setIsMinimized(true);
          SoundFX.playClick();
        }}
        className="absolute -top-2 -left-2 z-30 w-5 h-5 rounded-full bg-slate-900/90 hover:bg-amber-500 text-slate-400 hover:text-slate-950 border border-slate-700 flex items-center justify-center text-xs font-bold transition-all shadow-md"
        title="Minimize Radar (Clear Screen)"
      >
        _
      </button>

      {/* Radar Container */}
      <div className="w-36 h-36 rounded-full bg-[#0B0F17]/85 border-2 border-amber-500/60 shadow-[0_0_25px_rgba(245,158,11,0.25)] backdrop-blur-md relative overflow-hidden flex items-center justify-center p-1">
        {/* Radar Concentric Rings */}
        <div className="absolute inset-2 rounded-full border border-slate-700/50 pointer-events-none" />
        <div className="absolute inset-6 rounded-full border border-slate-800/60 pointer-events-none" />
        <div className="absolute inset-10 rounded-full border border-slate-800/40 pointer-events-none" />

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

        {/* Player Indicator Blip */}
        <div
          className="absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full bg-blue-500 border border-white shadow-glow z-20 transition-all duration-75"
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

      {/* Live Coordinate Badge */}
      <div className="mt-1 text-center font-mono text-[10px] text-amber-400 bg-slate-900/90 border border-slate-800 rounded-md py-0.5 px-2">
        X: {coords.x > 0 ? `+${coords.x.toFixed(0)}` : coords.x.toFixed(0)} | Z:{' '}
        {coords.z > 0 ? `+${coords.z.toFixed(0)}` : coords.z.toFixed(0)}
      </div>
    </div>
  );
};
