import React, { useState, useEffect } from 'react';
import { useAcademy, ControlSettings, DEFAULT_KEYBINDS, KeybindConfig } from '../../context/AcademyContext';
import { SoundFX } from '../../services/soundFX';
import {
  Sliders,
  Eye,
  Zap,
  RotateCcw,
  X,
  Check,
  Compass,
  Crosshair,
  Smartphone,
  Cpu,
  RefreshCw,
  Keyboard,
  Sparkles,
  Flame,
  Pickaxe,
  Wrench,
  Shield,
  HelpCircle,
} from 'lucide-react';

interface GameOptionsModalProps {
  onClose: () => void;
}

export const GameOptionsModal: React.FC<GameOptionsModalProps> = ({ onClose }) => {
  const { controlSettings, setControlSettings, setNotification } = useAcademy();
  const [activeTab, setActiveTab] = useState<'camera' | 'controls'>('controls');
  const [activeRebindAction, setActiveRebindAction] = useState<keyof KeybindConfig | null>(null);

  const currentKeybinds: KeybindConfig = {
    ...DEFAULT_KEYBINDS,
    ...(controlSettings.keybinds || {}),
  };

  const updateSetting = <K extends keyof ControlSettings>(key: K, val: ControlSettings[K]) => {
    SoundFX.playClick();
    setControlSettings((prev) => {
      const next = { ...prev, [key]: val };
      localStorage.setItem('piso_control_settings', JSON.stringify(next));
      return next;
    });
  };

  // Rebind key listener
  useEffect(() => {
    if (!activeRebindAction) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Escape cancels rebinding
      if (e.key === 'Escape') {
        setActiveRebindAction(null);
        SoundFX.playClick();
        return;
      }

      let newKey = e.key;
      if (e.code === 'Space') newKey = ' ';
      else if (e.key === 'Shift') newKey = 'shift';
      else if (e.key === 'Control') newKey = 'ctrl';
      else if (e.key === 'Alt') newKey = 'alt';
      else newKey = e.key.toLowerCase();

      SoundFX.playBlip();
      setControlSettings((prev) => {
        const nextKeybinds: KeybindConfig = {
          ...(prev.keybinds || DEFAULT_KEYBINDS),
          [activeRebindAction]: newKey,
        };
        const next = { ...prev, keybinds: nextKeybinds };
        localStorage.setItem('piso_control_settings', JSON.stringify(next));
        return next;
      });

      const displayKey = newKey === ' ' ? 'SPACE' : newKey.toUpperCase();
      setNotification({
        message: `🎮 Control bound: [${displayKey}]`,
        type: 'success',
      });

      setActiveRebindAction(null);
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [activeRebindAction, setControlSettings, setNotification]);

  const handleResetDefaults = () => {
    SoundFX.playLaser();
    const def: ControlSettings = {
      cameraMode: 'isometric',
      flightSpeed: 'normal',
      zoom: 18,
      soundVolume: 80,
      particleDensity: 'high',
      controlScheme: 'camera_relative',
      invertPitch: false,
      invertYaw: false,
      swapJoystickSide: false,
      autoTargetLock: true,
      performanceTier: 'balanced',
      keybinds: DEFAULT_KEYBINDS,
    };
    setControlSettings(def);
    localStorage.setItem('piso_control_settings', JSON.stringify(def));
    setNotification({
      message: 'Default controls & settings restored.',
      type: 'info',
    });
  };

  const handleApplyPreset = (preset: 'wasd' | 'arrows' | 'esdf') => {
    SoundFX.playWarp();
    let newBinds: Partial<KeybindConfig> = {};
    if (preset === 'wasd') {
      newBinds = { ...DEFAULT_KEYBINDS };
    } else if (preset === 'arrows') {
      newBinds = {
        ...DEFAULT_KEYBINDS,
        forward: 'arrowup',
        backward: 'arrowdown',
        left: 'arrowleft',
        right: 'arrowright',
      };
    } else if (preset === 'esdf') {
      newBinds = {
        ...DEFAULT_KEYBINDS,
        forward: 'e',
        backward: 'd',
        left: 's',
        right: 'f',
        interact: 'r',
        mine: 'w',
        skillPrimary: 'q',
      };
    }

    setControlSettings((prev) => {
      const next = {
        ...prev,
        keybinds: { ...(prev.keybinds || DEFAULT_KEYBINDS), ...newBinds },
      };
      localStorage.setItem('piso_control_settings', JSON.stringify(next));
      return next;
    });

    setNotification({
      message: `Switched to ${preset.toUpperCase()} Control Preset!`,
      type: 'success',
    });
  };

  const formatKeyName = (key: string) => {
    if (!key) return 'UNSET';
    if (key === ' ') return 'SPACE';
    if (key === 'arrowup') return '↑ UP';
    if (key === 'arrowdown') return '↓ DOWN';
    if (key === 'arrowleft') return '← LEFT';
    if (key === 'arrowright') return '→ RIGHT';
    return key.toUpperCase();
  };

  const controlSections = [
    {
      title: 'Combat & Anime Superpowers',
      icon: <Flame className="w-4 h-4 text-amber-400" />,
      desc: 'Customize your combat skills and attack hotkeys (compatibility for any layout)',
      items: [
        {
          id: 'skillPrimary' as keyof KeybindConfig,
          label: 'Primary Anime Superpower',
          desc: 'Cast Kamehame-PISO / Equipped Special Power',
          badge: 'High Priority',
          color: 'border-amber-500/50 text-amber-300',
        },
        {
          id: 'autoAttack' as keyof KeybindConfig,
          label: 'Auto-Attack / Target Lock',
          desc: 'Toggle automatic target cycling and spell barrage',
          badge: 'Combat',
          color: 'border-cyan-500/40 text-cyan-300',
        },
        {
          id: 'skill1' as keyof KeybindConfig,
          label: 'Skill 1 (Kamehameha / Burst)',
          desc: 'Supernova Plasma Beam (3,500 DMG)',
          badge: 'Hotkey [1]',
          color: 'border-cyan-500/40 text-cyan-300',
        },
        {
          id: 'skill2' as keyof KeybindConfig,
          label: 'Skill 2 (Chidori ng Meralco)',
          desc: '1.21 GW Electric Thrust (1,200 DMG)',
          badge: 'Hotkey [2]',
          color: 'border-purple-500/40 text-purple-300',
        },
        {
          id: 'skill3' as keyof KeybindConfig,
          label: 'Skill 3 (Tsinelas ni Nanay)',
          desc: 'Homing Flying Slipper (650 DMG)',
          badge: 'Hotkey [3]',
          color: 'border-blue-500/40 text-blue-300',
        },
        {
          id: 'skill4' as keyof KeybindConfig,
          label: 'Skill 4 (Gear 5 Loko-Loko)',
          desc: 'Sun God Nika Bounce Overkill (9,999 DMG)',
          badge: 'Hotkey [4]',
          color: 'border-yellow-500/40 text-yellow-300',
        },
        {
          id: 'skill5' as keyof KeybindConfig,
          label: 'Skill 5 (Rasengan ng Baguio)',
          desc: 'Whirlwind Ki Sphere Vortex (2,200 DMG)',
          badge: 'Hotkey [5]',
          color: 'border-cyan-500/40 text-cyan-300',
        },
        {
          id: 'skill6' as keyof KeybindConfig,
          label: 'Skill 6 (Sapapok Gatling)',
          desc: 'Bayanihan Rapid Fist Barrage (1,800 DMG)',
          badge: 'Hotkey [6]',
          color: 'border-orange-500/40 text-orange-300',
        },
        {
          id: 'skill7' as keyof KeybindConfig,
          label: "Skill 7 (Bathala's Lightning)",
          desc: '5 Celestial Cloud Lightning Strikes (5,000 DMG)',
          badge: 'Hotkey [7]',
          color: 'border-amber-500/40 text-amber-300',
        },
        {
          id: 'skill8' as keyof KeybindConfig,
          label: 'Skill 8 (Walis Cyclone Spin)',
          desc: '360° Tornado Avatar Spin (1,400 DMG)',
          badge: 'Hotkey [8]',
          color: 'border-emerald-500/40 text-emerald-300',
        },
        {
          id: 'skill9' as keyof KeybindConfig,
          label: 'Skill 9 (Tabo Hydro Surge)',
          desc: 'Holy Cyber Water Tidal Wave (800 DMG)',
          badge: 'Hotkey [9]',
          color: 'border-blue-500/40 text-blue-300',
        },
        {
          id: 'skill10' as keyof KeybindConfig,
          label: 'Skill 10 (Pinoy Banat / Pun)',
          desc: 'Floating 3D Comic Joke Balloons (100 DMG)',
          badge: 'Hotkey [0]',
          color: 'border-pink-500/40 text-pink-300',
        },
      ],
    },
    {
      title: 'World Exploration & Mining',
      icon: <Pickaxe className="w-4 h-4 text-emerald-400" />,
      desc: 'Interact with mentors, harvest voxel blocks, and construct buildings',
      items: [
        {
          id: 'interact' as keyof KeybindConfig,
          label: 'NPC Talk / Interact / Cycle (Letter B)',
          desc: 'Talk with NPC Mentors, Enter Districts, or Cycle Next Mentor',
          badge: 'Core [B]',
          color: 'border-emerald-500/50 text-emerald-300',
        },
        {
          id: 'mine' as keyof KeybindConfig,
          label: 'Mine Nearest Block (Axe / Pickaxe)',
          desc: 'Chop trees, mine gold/crystal/stone voxels for EXP and materials',
          badge: 'Voxel [Q]',
          color: 'border-emerald-500/50 text-emerald-300',
        },
        {
          id: 'builderMode' as keyof KeybindConfig,
          label: 'Toggle Builder Mode',
          desc: 'Place custom architectural blocks in the 3D metaverse',
          badge: 'Creative [V]',
          color: 'border-blue-500/40 text-blue-300',
        },
        {
          id: 'miningStudio' as keyof KeybindConfig,
          label: 'Open Mining & Crafting Studio',
          desc: 'Open inventory, craft buildings, donate to builder funds',
          badge: 'Menu [M]',
          color: 'border-indigo-500/40 text-indigo-300',
        },
        {
          id: 'avatarOptions' as keyof KeybindConfig,
          label: 'Avatar Options & Suiting Studio (N)',
          desc: 'Open 3D Avatar Hangar, Customize Pinoy Cultural Gear & Drone Frames',
          badge: 'Hero [N]',
          color: 'border-amber-500/50 text-amber-300',
        },
        {
          id: 'inventory' as keyof KeybindConfig,
          label: 'Inventory, Sell & Bidding Market (I)',
          desc: 'Suit Up, Sell for Fixed $PISO, or Auction & Place Bids',
          badge: 'P2P [I]',
          color: 'border-cyan-500/50 text-cyan-300',
        },
      ],
    },
    {
      title: 'Movement & Navigation',
      icon: <Compass className="w-4 h-4 text-cyan-400" />,
      desc: 'Direct your hero or drone across the 380m terrain',
      items: [
        {
          id: 'forward' as keyof KeybindConfig,
          label: 'Move Forward',
          desc: 'Walk forward in current direction',
          badge: 'Move',
          color: 'border-slate-700 text-slate-300',
        },
        {
          id: 'backward' as keyof KeybindConfig,
          label: 'Move Backward',
          desc: 'Step backward',
          badge: 'Move',
          color: 'border-slate-700 text-slate-300',
        },
        {
          id: 'left' as keyof KeybindConfig,
          label: 'Strafe Left',
          desc: 'Move left',
          badge: 'Move',
          color: 'border-slate-700 text-slate-300',
        },
        {
          id: 'right' as keyof KeybindConfig,
          label: 'Strafe Right',
          desc: 'Move right',
          badge: 'Move',
          color: 'border-slate-700 text-slate-300',
        },
        {
          id: 'jump' as keyof KeybindConfig,
          label: 'Jump / Ascend',
          desc: 'Leap over obstacles and low walls',
          badge: 'Phys',
          color: 'border-slate-700 text-slate-300',
        },
        {
          id: 'sprint' as keyof KeybindConfig,
          label: 'Sprint / Turbo Run',
          desc: 'Boost flight and running speed by 50%',
          badge: 'Boost',
          color: 'border-slate-700 text-slate-300',
        },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-2xl bg-[#0F172A] border-2 border-cyan-500/70 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.3)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#161F30]/95">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-xl">
              ⚙️
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-black text-cyan-400 uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-400/10 border border-cyan-400/30">
                  SYSTEM OPTIONS
                </span>
                <span className="text-xs text-slate-400 font-mono">PISO Metaverse Engine</span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                Controls, Keybindings & Flight
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center px-6 border-b border-slate-800 bg-[#111827]">
          <button
            onClick={() => {
              setActiveTab('controls');
              SoundFX.playClick();
            }}
            className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-mono text-xs font-bold transition-all ${
              activeTab === 'controls'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            <span>⌨️ EDIT CONTROLS & KEYMAP</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('camera');
              SoundFX.playClick();
            }}
            className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-mono text-xs font-bold transition-all ${
              activeTab === 'camera'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>🎮 FLIGHT CAMERA & GRAPHICS</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="relative z-20 flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-300">
          {activeTab === 'controls' ? (
            <div className="space-y-6">
              {/* Presets & Active Rebind Banner */}
              <div className="p-4 rounded-xl bg-[#161F30] border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-xs text-white flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Quick Compatibility Presets</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Click any key to rebind individually, or pick a layout preset:
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleApplyPreset('wasd')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-cyan-500/20 border border-slate-700 hover:border-cyan-400 text-xs font-mono font-bold text-slate-200 hover:text-cyan-300 transition-all"
                  >
                    WASD + E-Skill
                  </button>
                  <button
                    onClick={() => handleApplyPreset('arrows')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-cyan-500/20 border border-slate-700 hover:border-cyan-400 text-xs font-mono font-bold text-slate-200 hover:text-cyan-300 transition-all"
                  >
                    Arrow Keys
                  </button>
                  <button
                    onClick={() => handleApplyPreset('esdf')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-cyan-500/20 border border-slate-700 hover:border-cyan-400 text-xs font-mono font-bold text-slate-200 hover:text-cyan-300 transition-all"
                  >
                    ESDF Mode
                  </button>
                </div>
              </div>

              {/* Active Rebinding Prompt Modal Banner */}
              {activeRebindAction && (
                <div className="p-4 rounded-xl bg-cyan-950/80 border-2 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.4)] flex items-center justify-between animate-pulse">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500 text-slate-950 font-mono font-black flex items-center justify-center text-sm">
                      ⌨️
                    </div>
                    <div>
                      <div className="text-xs font-bold text-cyan-200">
                        PRESS ANY KEY ON YOUR KEYBOARD NOW
                      </div>
                      <div className="text-[11px] text-slate-300">
                        Rebinding: <span className="font-mono font-bold text-white">{activeRebindAction}</span>. Press <span className="font-mono text-cyan-300">ESC</span> to cancel.
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveRebindAction(null)}
                    className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-mono"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Control Sections */}
              {controlSections.map((sec) => (
                <div key={sec.title} className="space-y-3">
                  <div>
                    <div className="flex items-center space-x-2 text-xs font-mono font-bold text-slate-300 uppercase">
                      {sec.icon}
                      <span>{sec.title}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{sec.desc}</div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {sec.items.map((item) => {
                      const currentKey = currentKeybinds[item.id] || '';
                      const isRebinding = activeRebindAction === item.id;

                      return (
                        <div
                          key={item.id}
                          className={`p-3 rounded-xl border bg-[#161F30]/80 transition-all flex items-center justify-between gap-3 ${
                            isRebinding
                              ? 'border-cyan-400 ring-2 ring-cyan-400/50 bg-cyan-950/40'
                              : 'border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-xs text-white truncate">
                                {item.label}
                              </span>
                              <span
                                className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${item.color} bg-slate-900/60`}
                              >
                                {item.badge}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate mt-0.5">
                              {item.desc}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              SoundFX.playBlip();
                              setActiveRebindAction(item.id);
                            }}
                            className={`min-w-[68px] h-9 px-3 rounded-lg font-mono font-bold text-xs flex items-center justify-center transition-all shadow-sm ${
                              isRebinding
                                ? 'bg-cyan-400 text-slate-950 ring-2 ring-cyan-300 animate-bounce'
                                : 'bg-slate-900 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 hover:border-cyan-400 active:scale-95'
                            }`}
                            title={`Click to rebind ${item.label}`}
                          >
                            {isRebinding ? 'PRESS...' : `[ ${formatKeyName(currentKey)} ]`}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Camera & Flight Graphics Settings */
            <div className="space-y-6">
              {/* Navigation & Control Scheme */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-slate-400 uppercase flex items-center space-x-2">
                  <Compass className="w-4 h-4 text-emerald-400" />
                  <span>Directional Movement Scheme (Direksyon ng Kontrol)</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      id: 'camera_relative',
                      label: 'Camera-Relative (Recommended)',
                      desc: 'W always moves into screen, regardless of camera rotation. Eliminates inverted navigation!',
                    },
                    {
                      id: 'world_axis',
                      label: 'Fixed World Coordinates',
                      desc: 'W always moves North in world space regardless of camera heading.',
                    },
                  ].map((opt) => {
                    const isActive = (controlSettings.controlScheme || 'camera_relative') === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => updateSetting('controlScheme', opt.id as any)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isActive
                            ? 'border-emerald-400 bg-emerald-500/20 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                            : 'border-slate-800 bg-[#161F30] text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="font-bold text-xs">{opt.label}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{opt.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Invert Axes & Auto-Lock Toggles */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-slate-400 uppercase flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4 text-amber-400" />
                  <span>Invert & Targeting Compatibility</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    onClick={() => updateSetting('invertPitch', !controlSettings.invertPitch)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                      controlSettings.invertPitch
                        ? 'border-amber-400 bg-amber-500/20 text-white'
                        : 'border-slate-800 bg-[#161F30] text-slate-400'
                    }`}
                  >
                    <span className="text-xs font-semibold">Invert Pitch (Y)</span>
                    <span className={`text-xs font-mono font-bold ${controlSettings.invertPitch ? 'text-amber-400' : 'text-slate-600'}`}>
                      {controlSettings.invertPitch ? 'ON' : 'OFF'}
                    </span>
                  </button>

                  <button
                    onClick={() => updateSetting('invertYaw', !controlSettings.invertYaw)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                      controlSettings.invertYaw
                        ? 'border-amber-400 bg-amber-500/20 text-white'
                        : 'border-slate-800 bg-[#161F30] text-slate-400'
                    }`}
                  >
                    <span className="text-xs font-semibold">Invert Yaw (X)</span>
                    <span className={`text-xs font-mono font-bold ${controlSettings.invertYaw ? 'text-amber-400' : 'text-slate-600'}`}>
                      {controlSettings.invertYaw ? 'ON' : 'OFF'}
                    </span>
                  </button>

                  <button
                    onClick={() => updateSetting('autoTargetLock', controlSettings.autoTargetLock === false ? true : false)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                      controlSettings.autoTargetLock !== false
                        ? 'border-cyan-400 bg-cyan-500/20 text-white'
                        : 'border-slate-800 bg-[#161F30] text-slate-400'
                    }`}
                  >
                    <span className="text-xs font-semibold">Target Lock</span>
                    <span className={`text-xs font-mono font-bold ${controlSettings.autoTargetLock !== false ? 'text-cyan-400' : 'text-slate-600'}`}>
                      {controlSettings.autoTargetLock !== false ? 'ON' : 'OFF'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Mobile Joystick Position */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-slate-400 uppercase flex items-center space-x-2">
                  <Smartphone className="w-4 h-4 text-purple-400" />
                  <span>Mobile On-Screen Virtual Joystick Placement</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: false, label: '🕹️ Left-Hand Joystick (Default)', desc: 'Standard movement thumbpad on lower-left, abilities on right.' },
                    { id: true, label: '🕹️ Right-Hand Joystick (Southpaw)', desc: 'Swaps virtual stick to right side for left-handed ergonomics.' },
                  ].map((opt) => {
                    const isActive = (controlSettings.swapJoystickSide || false) === opt.id;
                    return (
                      <button
                        key={String(opt.id)}
                        onClick={() => updateSetting('swapJoystickSide', opt.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isActive
                            ? 'border-purple-400 bg-purple-500/20 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                            : 'border-slate-800 bg-[#161F30] text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="font-bold text-xs">{opt.label}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Performance Tier */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-slate-400 uppercase flex items-center space-x-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span>Performance Tier & 3D Shaders</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'low', label: '⚡ Low / Mobile', desc: '400 particles, simplified fog. 60 FPS on older phones.' },
                    { id: 'balanced', label: '⚖️ Balanced', desc: '800 particles, full bloom and dynamic lights.' },
                    { id: 'ultra', label: '🔥 Ultra', desc: '1400 particles, maximum volumetric lighting & post-fx.' },
                  ].map((opt) => {
                    const isActive = (controlSettings.performanceTier || 'balanced') === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => updateSetting('performanceTier', opt.id as any)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isActive
                            ? 'border-cyan-400 bg-cyan-500/20 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                            : 'border-slate-800 bg-[#161F30] text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="font-bold text-xs">{opt.label}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Camera Perspective Mode */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-slate-400 uppercase flex items-center space-x-2">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <span>Camera Perspective Mode</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'isometric', label: 'Isometric 45°', desc: 'Tactical RTS perspective' },
                    { id: 'follow', label: 'Follow 3rd Person', desc: 'Cinematic rear-chase camera' },
                    { id: 'topdown', label: 'Top-Down Radar', desc: 'Bird-eye navigation grid' },
                  ].map((opt) => {
                    const isActive = controlSettings.cameraMode === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => updateSetting('cameraMode', opt.id as any)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isActive
                            ? 'border-cyan-400 bg-cyan-500/20 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                            : 'border-slate-800 bg-[#161F30] text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="font-bold text-xs">{opt.label}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Flight Speed */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-slate-400 uppercase flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Flight Thruster Velocity</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'normal', label: 'Cruising (14 m/s)', desc: 'Smooth exploration speed' },
                    { id: 'turbo', label: 'Turbo Thrusters (22 m/s)', desc: 'Fast warp travel across districts' },
                  ].map((opt) => {
                    const isActive = controlSettings.flightSpeed === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => updateSetting('flightSpeed', opt.id as any)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isActive
                            ? 'border-amber-400 bg-amber-500/20 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                            : 'border-slate-800 bg-[#161F30] text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="font-bold text-xs">{opt.label}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Zoom Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-400 font-bold uppercase flex items-center space-x-2">
                    <Sliders className="w-4 h-4 text-blue-400" />
                    <span>Camera Elevation / Zoom</span>
                  </span>
                  <span className="text-cyan-400 font-bold">{controlSettings.zoom}m</span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="32"
                  step="1"
                  value={controlSettings.zoom}
                  onChange={(e) => updateSetting('zoom', Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>Close Tactical (12m)</span>
                  <span>Overview Radar (32m)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="relative z-20 flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-[#161F30]/95">
          <button
            onClick={handleResetDefaults}
            className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white font-mono transition-colors"
            title="Reset all settings and controls to factory default"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Defaults</span>
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all flex items-center space-x-2"
          >
            <Check className="w-4 h-4" />
            <span>I-save at Isara</span>
          </button>
        </div>
      </div>
    </div>
  );
};
