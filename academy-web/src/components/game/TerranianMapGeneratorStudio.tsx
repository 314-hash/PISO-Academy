import React, { useState } from 'react';
import {
  Globe,
  Trees,
  Building2,
  Waves,
  Sparkles,
  Dices,
  Eye,
  CheckCircle2,
  Minus,
  Maximize2,
  Bird,
} from 'lucide-react';
import {
  BIOME_PRESETS,
  BiomeId,
  WorldGenOptions,
} from '../../services/TerranianWorldEngine';

interface TerranianMapGeneratorStudioProps {
  onMinimize?: () => void;
}

export const TerranianMapGeneratorStudio: React.FC<TerranianMapGeneratorStudioProps> = ({
  onMinimize,
}) => {
  const [selectedBiome, setSelectedBiome] = useState<BiomeId>('cyberManila');
  const [seed, setSeed] = useState<number>(42);
  const [buildingDensityMult, setBuildingDensityMult] = useState<number>(1.0);
  const [treeDensityMult, setTreeDensityMult] = useState<number>(1.0);
  const [riverWidthMult, setRiverWidthMult] = useState<number>(1.0);
  const [animalCountMult, setAnimalCountMult] = useState<number>(1.0);
  const [isApplied, setIsApplied] = useState<boolean>(false);

  const handleRollSeed = () => {
    const newSeed = Math.floor(Math.random() * 99999) + 1;
    setSeed(newSeed);
  };

  const handleApplyWorldGen = () => {
    const config: WorldGenOptions = {
      biome: selectedBiome,
      seed,
      buildingDensityMult,
      treeDensityMult,
      riverWidthMult,
      animalCountMult,
    };

    window.dispatchEvent(
      new CustomEvent('piso-world-regenerate', { detail: config })
    );

    setIsApplied(true);
    setTimeout(() => setIsApplied(false), 2500);
  };

  const currentBiome = BIOME_PRESETS[selectedBiome];

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col space-y-5 text-slate-100 p-2 select-none">
      {/* Header Banner */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-slate-900/80 to-blue-950/60 border border-cyan-500/30 backdrop-blur-md shadow-2xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            <Globe className="w-6 h-6 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-black tracking-wider text-white">
                TERRANIAN WORLD GENERATOR
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-[10px] font-mono text-cyan-300 font-bold">
                PROCEDURAL 3D BIOMES
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Procedural elevation, riverbeds, extruded buildings, instanced forests & living fauna
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

      {/* Main Grid: Biomes & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Biome Presets */}
        <div className="lg:col-span-5 flex flex-col space-y-3">
          <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Select Landscape Biome</span>
          </label>

          <div className="grid grid-cols-1 gap-2.5">
            {(Object.keys(BIOME_PRESETS) as BiomeId[]).map((bId) => {
              const b = BIOME_PRESETS[bId];
              const isSelected = selectedBiome === bId;
              return (
                <button
                  key={bId}
                  type="button"
                  onClick={() => setSelectedBiome(bId)}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col space-y-1.5 ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#161F30] via-cyan-950/40 to-slate-900 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400/50'
                      : 'bg-[#0B0F17]/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white tracking-wide">
                      {b.name}
                    </span>
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${
                        isSelected
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      ELEV: {b.elevationScale}m
                    </span>
                  </div>
                  <div className="text-[11px] text-cyan-300/80 font-mono">
                    {b.subtitle}
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-2">
                    {b.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Seed Input & Randomizer */}
          <div className="p-3.5 rounded-2xl bg-[#161F30]/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono text-slate-300">WORLD SEED:</span>
              <span className="font-mono text-sm font-black text-amber-400 bg-black/40 px-2.5 py-1 rounded-lg border border-amber-500/30">
                #{seed}
              </span>
            </div>
            <button
              type="button"
              onClick={handleRollSeed}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold transition active:scale-95 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
            >
              <Dices className="w-3.5 h-3.5" />
              <span>ROLL SEED</span>
            </button>
          </div>
        </div>

        {/* Right Column: Density & Generation Sliders */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="p-4 rounded-2xl bg-[#161F30]/80 border border-slate-800 space-y-4 font-mono text-xs">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2 border-b border-slate-800 pb-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>Fine-Tune Biome & Density Parameters</span>
            </h3>

            {/* Buildings Density Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span className="flex items-center space-x-1.5">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Procedural Buildings Density</span>
                </span>
                <span className="text-cyan-300 font-bold">
                  {Math.round(buildingDensityMult * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={2.0}
                step={0.1}
                value={buildingDensityMult}
                onChange={(e) => setBuildingDensityMult(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Tree / Forest Density Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span className="flex items-center space-x-1.5">
                  <Trees className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Forest & Vegetation Density</span>
                </span>
                <span className="text-emerald-300 font-bold">
                  {Math.round(treeDensityMult * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0.2}
                max={2.0}
                step={0.1}
                value={treeDensityMult}
                onChange={(e) => setTreeDensityMult(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
            </div>

            {/* River Width Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span className="flex items-center space-x-1.5">
                  <Waves className="w-3.5 h-3.5 text-blue-400" />
                  <span>River Width & Water Flow</span>
                </span>
                <span className="text-blue-300 font-bold">
                  {(currentBiome.riverWidth * riverWidthMult).toFixed(1)}m
                </span>
              </div>
              <input
                type="range"
                min={0.5}
                max={2.0}
                step={0.1}
                value={riverWidthMult}
                onChange={(e) => setRiverWidthMult(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-400"
              />
            </div>

            {/* Animal & Fauna Population Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span className="flex items-center space-x-1.5">
                  <Bird className="w-3.5 h-3.5 text-amber-400" />
                  <span>Wildlife Population (Carabao, Eagle, Fish)</span>
                </span>
                <span className="text-amber-300 font-bold">
                  {Math.round(animalCountMult * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0.3}
                max={2.5}
                step={0.1}
                value={animalCountMult}
                onChange={(e) => setAnimalCountMult(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>
          </div>

          {/* Active Biome Summary Badges */}
          <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center space-x-2 text-cyan-300">
              <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Active Preset: <strong>{currentBiome.name}</strong></span>
            </div>
            <div className="flex items-center space-x-2 text-slate-400 text-[10px]">
              <span>🐂 {Math.round(currentBiome.animalCount.carabaos * animalCountMult)} Carabaos</span>
              <span>•</span>
              <span>🦅 {Math.round(currentBiome.animalCount.eagles * animalCountMult)} Eagles</span>
              <span>•</span>
              <span>🐟 {Math.round(currentBiome.animalCount.fish * animalCountMult)} Fish</span>
            </div>
          </div>

          {/* Apply Button */}
          <button
            type="button"
            onClick={handleApplyWorldGen}
            className={`w-full py-3.5 px-4 rounded-2xl font-mono text-xs font-black tracking-wider uppercase transition-all flex items-center justify-center space-x-2.5 shadow-2xl active:scale-[0.98] ${
              isApplied
                ? 'bg-emerald-500 text-slate-950 border border-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.7)]'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 border border-cyan-300 shadow-[0_0_25px_rgba(6,182,212,0.4)]'
            }`}
          >
            {isApplied ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-slate-950 animate-bounce" />
                <span>WORLD REGENERATED LIVE IN METAVERSE!</span>
              </>
            ) : (
              <>
                <Globe className="w-4 h-4" />
                <span>GENERATE PROCEDURAL WORLD IN 3D</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
