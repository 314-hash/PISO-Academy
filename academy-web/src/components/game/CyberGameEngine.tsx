import React, { useState, useRef, useCallback } from 'react';
import { useAcademy, NavView } from '../../context/AcademyContext';
import { Cyber3DWorld, DistrictInfo, NPCLocationInfo, CruiseTargetInfo } from './Cyber3DWorld';
import { GameTopBar } from './GameTopBar';
import { GameMinimap } from './GameMinimap';
import { GameActionBar } from './GameActionBar';
import { GameQuestTracker } from './GameQuestTracker';
import { FloatingGameWindow } from './FloatingGameWindow';
import { SoundFX } from '../../services/soundFX';

// Modals
import { GameTutorialModal } from './GameTutorialModal';
import { GameOptionsModal } from './GameOptionsModal';
import { NPCMentorModal } from './NPCMentorModal';
import { AvatarHangarModal } from './AvatarHangarModal';
import { DailyQuestsModal } from './DailyQuestsModal';
import { Img2ThreejsStudio } from './Img2ThreejsStudio';
import { WalletStudioTerminalModal } from './WalletStudioTerminalModal';
import { PisoP2PChatRoom } from './PisoP2PChatRoom';
import { LiveHUDChatBox } from './LiveHUDChatBox';

// Content Views
import { CourseCatalog } from '../CourseCatalog';
import { Web3Lab } from '../Web3Lab';
import { DeploymentManager } from '../DeploymentManager';
import { CertificateVerifier } from '../CertificateVerifier';
import { BuilderProfile } from '../BuilderProfile';
import { ProjectDirectory } from '../ProjectDirectory';
import { PisoWorldMap3D } from '../PisoWorldMap3D';

import { ArrowRight, Bot, Navigation } from 'lucide-react';

interface CyberGameEngineProps {
  gameMode: boolean;
  onToggleGameMode: () => void;
}

export const CyberGameEngine: React.FC<CyberGameEngineProps> = ({
  gameMode,
  onToggleGameMode,
}) => {
  const {
    activeView,
    setActiveView,
    requestFaucet,
    setNotification,
    showTutorial,
    setShowTutorial,
    claimedMentorRewards,
  } = useAcademy();

  const [nearbyDistrict, setNearbyDistrict] = useState<DistrictInfo | null>(null);
  const [nearbyMentor, setNearbyMentor] = useState<NPCLocationInfo | null>(null);
  const [cruiseTarget, setCruiseTarget] = useState<CruiseTargetInfo | null>(null);

  // Active Modals
  const [activeWindow, setActiveWindow] = useState<NavView | null>(null);
  const [activeMentor, setActiveMentor] = useState<NPCLocationInfo | null>(null);
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const [showQuests, setShowQuests] = useState<boolean>(false);
  const [showHangar, setShowHangar] = useState<boolean>(false);
  const [showWalletTerminal, setShowWalletTerminal] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState(SoundFX.isMuted);

  // Listen for custom event to open wallet studio terminal
  React.useEffect(() => {
    const handleOpenWalletEvent = () => {
      setShowWalletTerminal(true);
    };
    window.addEventListener('piso-open-wallet-terminal', handleOpenWalletEvent);
    return () => window.removeEventListener('piso-open-wallet-terminal', handleOpenWalletEvent);
  }, []);

  const playerPosRef = useRef<{ x: number; z: number; heading: number }>({
    x: 0,
    z: 8,
    heading: 0,
  });

  const handleDistrictSelect = useCallback((district: DistrictInfo) => {
    SoundFX.playWarp();
    if (district.toolView === 'faucet') {
      requestFaucet();
    } else {
      setActiveWindow(district.toolView);
    }
  }, [requestFaucet]);

  const handleMentorSelect = useCallback((mentor: NPCLocationInfo) => {
    SoundFX.playBlip();
    setActiveMentor(mentor);
  }, []);

  const handleOpenTool = (view: NavView) => {
    SoundFX.playClick();
    setActiveWindow(view);
  };

  const handleToggleMute = () => {
    const next = SoundFX.toggleMute();
    setIsMuted(next);
    setNotification({
      message: next ? 'Audio Muted' : 'Audio Enabled',
      type: 'info',
    });
  };

  const getWindowTitle = (v: NavView) => {
    switch (v) {
      case 'courses':
        return { title: 'Mga Kurso at Quests', subtitle: 'PISO Academy Curriculum Hub', icon: '📜' };
      case 'lab':
        return { title: 'Smart Contract Forge', subtitle: 'Solidity ^0.8.20 Coding Lab', icon: '💻' };
      case 'deploy':
        return { title: 'Deploy Launchpad', subtitle: 'PISO Chain Devnet Rig (2026001)', icon: '🚀' };
      case 'verify':
        return { title: 'Katunayan ng Pag-aari', subtitle: 'Soulbound Credential Verifier (0x...1014)', icon: '🏛️' };
      case 'profile':
        return { title: 'Builder Inventory', subtitle: 'Developer Profile, XP & Badges', icon: '🎒' };
      case 'projects':
        return { title: 'Built on PISO Directory', subtitle: 'Ecosystem Showcase & Submissions', icon: '🌐' };
      case 'img2threejs':
        return { title: 'img2threejs 3D Studio', subtitle: 'Procedural Three.js NFT & Asset Sculptor', icon: '💎' };
      case 'worldmap':
        return { title: 'PISO World Map 3D & Ecosystem Rewards', subtitle: 'DePIN 3D Global Blockchain Network (15 Hubs)', icon: '🌍' };
      case 'chat':
        return { title: 'PISO P2P MESH CHAT // GUN.JS', subtitle: 'Decentralized Peer-to-Peer Validator Broadcast Network', icon: '💬' };
      default:
        return { title: 'PISO Cyber Cockpit', subtitle: 'New Manila 2090', icon: '₱' };
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0B0F17] flex flex-col select-none">
      {/* 1. LovecraftUI Top Status Bar */}
      <div className="relative z-30">
        <GameTopBar
          gameMode={gameMode}
          onToggleGameMode={onToggleGameMode}
          onOpenTutorial={() => setShowTutorial(true)}
          onOpenQuests={() => setShowQuests(true)}
          onOpenHangar={() => setShowHangar(true)}
          onOpenOptions={() => setShowOptions(true)}
          onOpenWalletTerminal={() => setShowWalletTerminal(true)}
        />
      </div>

      {/* 2. Three.js Persistent 3D Cyberpunk Metaverse Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <Cyber3DWorld
          onProximityChange={setNearbyDistrict}
          onDistrictSelect={handleDistrictSelect}
          onMentorProximity={setNearbyMentor}
          onMentorSelect={handleMentorSelect}
          onCruiseTargetChange={setCruiseTarget}
          playerPosRef={playerPosRef}
        />

        {/* 3. Top-Right Cyber Minimap Radar */}
        <div className="absolute top-4 right-4 z-20">
          <GameMinimap
            playerPosRef={playerPosRef}
            onSelectDistrict={handleDistrictSelect}
            cruiseTargetMentorId={cruiseTarget?.id || null}
          />
        </div>

        {/* 4. Mid-Left LovecraftUI Quest Tracker */}
        <div className="absolute top-4 left-4 z-20 hidden sm:block">
          <GameQuestTracker
            onOpenQuest={() => handleOpenTool('lab')}
            onOpenDailyQuests={() => setShowQuests(true)}
          />
        </div>

        {/* 4B. Active Autopilot Cruise Banner (Shown while cruising to target mentor) */}
        {cruiseTarget && !activeWindow && !activeMentor && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 animate-fade-in">
            <div className="px-4 py-2.5 rounded-2xl bg-[#161F30]/95 border-2 border-cyan-400 shadow-[0_0_35px_rgba(6,182,212,0.35)] backdrop-blur-md flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-xl shrink-0">
                {cruiseTarget.avatar}
              </div>
              <div className="min-w-[170px]">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-[10px] font-black text-cyan-400 px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/30 flex items-center space-x-1">
                    <Navigation className="w-2.5 h-2.5 inline mr-1" />
                    AUTOPILOT CRUISING
                  </span>
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    {cruiseTarget.name}
                  </span>
                </div>
                <div className="flex items-center space-x-2 mt-0.5">
                  <p className="text-[11px] text-slate-300 font-mono truncate">{cruiseTarget.title}</p>
                  <span className="text-[11px] font-mono font-bold text-amber-400 shrink-0">
                    • {cruiseTarget.distance.toFixed(1)}m away
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2 pl-3 border-l border-slate-700/80">
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('piso-cycle-next-mentor'));
                  }}
                  className="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400 text-purple-300 hover:text-white font-mono text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm active:scale-95"
                  title="Switch to next NPC Mentor [N]"
                >
                  <span>Next [N]</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('piso-cancel-autopilot'));
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-mono text-xs transition-colors"
                  title="Cancel autopilot and take manual control"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 5. Interactive Proximity Prompt Card (NPC Mentor or District Beacon) */}
        {!activeWindow && !activeMentor && (
          <>
            {nearbyMentor ? (
              <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 animate-bounce-short">
                <div
                  onClick={() => handleMentorSelect(nearbyMentor)}
                  className="p-4 rounded-2xl bg-[#161F30]/95 border-2 border-purple-400 shadow-[0_0_40px_rgba(168,85,247,0.4)] backdrop-blur-md cursor-pointer hover:scale-105 transition-all flex items-center space-x-3.5"
                >
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-400 flex items-center justify-center text-2xl">
                    {nearbyMentor.avatar}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-black text-purple-400 px-1.5 py-0.5 rounded bg-purple-500/20 border border-purple-500/30 flex items-center space-x-1">
                        <Bot className="w-3 h-3 inline mr-1" />
                        PRESS [E] TO TALK
                      </span>
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        {nearbyMentor.name}
                      </span>
                      {claimedMentorRewards.includes(nearbyMentor.id) ? (
                        <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                          ✓ 1x Claimed
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-400/15 px-1.5 py-0.5 rounded border border-amber-400/30 animate-pulse">
                          🎁 +50 XP Ready
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5 font-mono">{nearbyMentor.title}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-purple-400 animate-pulse" />
                </div>
              </div>
            ) : nearbyDistrict ? (
              <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 animate-bounce-short">
                <div
                  onClick={() => handleDistrictSelect(nearbyDistrict)}
                  className="p-4 rounded-2xl bg-[#161F30]/95 border-2 border-amber-400 shadow-[0_0_40px_rgba(245,158,11,0.4)] backdrop-blur-md cursor-pointer hover:scale-105 transition-all flex items-center space-x-3.5"
                >
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-2xl">
                    {nearbyDistrict.icon}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-black text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/30">
                        PRESS [E] OR CLICK
                      </span>
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        {nearbyDistrict.name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5 font-mono">{nearbyDistrict.tagline}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-amber-400 animate-pulse" />
                </div>
              </div>
            ) : null}
          </>
        )}

        {/* 6. Live Gun.js P2P On-Screen Chatbox with 3D Avatar Sync */}
        {!activeWindow && (
          <LiveHUDChatBox onOpenFullChat={() => setActiveWindow('chat')} />
        )}

        {/* 7. On-Screen Navigation Controls Reminder & Quick Jump Action */}
        <div className="absolute bottom-24 right-4 z-20 flex flex-col items-end space-y-2">
          {/* Quick Jump Action Button (Touch & Desktop) */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('piso-player-jump'))}
            title="Jump / Double Jump (Spacebar)"
            className="group flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 border border-amber-500/40 text-amber-300 hover:text-amber-200 font-mono text-xs font-bold transition shadow-[0_0_20px_rgba(245,158,11,0.2)] backdrop-blur-md"
          >
            <span className="flex items-center space-x-0.5 text-amber-400 font-black">
              <span>▲</span>
              <span className="text-[10px]">▲</span>
            </span>
            <span>JUMP / 2X</span>
            <span className="px-1.5 py-0.5 rounded bg-amber-500/30 text-[10px] text-amber-200 border border-amber-500/40">
              SPACE
            </span>
          </button>

          <div className="hidden md:flex flex-col items-end space-y-1 font-mono text-[10px] text-slate-400 bg-slate-950/70 p-2 rounded-xl border border-slate-800 backdrop-blur-sm">
            <span>Move: <strong className="text-white">WASD / Arrows</strong></span>
            <span>Jump / Double Jump: <strong className="text-amber-400">Space [2x]</strong></span>
            <span>Live Chat: <strong className="text-purple-400">[C] / Enter</strong></span>
            <span>Turbo: <strong className="text-amber-400">Shift</strong></span>
            <span>Wallet Studio: <strong className="text-amber-400">[K] / [W]</strong> Terminal</span>
            <span>Next Mentor: <strong className="text-purple-400">[N]</strong> Autopilot</span>
            <span>Cam Orbit: <strong className="text-cyan-400">Right-Click Drag</strong></span>
            <span>Zoom: <strong className="text-cyan-400">Mouse Wheel</strong></span>
            <span>Interact / Next Dest: <strong className="text-amber-400">[E]</strong> / Click</span>
          </div>
        </div>
      </div>

      {/* 7. Bottom LovecraftUI Action Bar (Hotkeys 1-6 + 7, F, Q, O, H, K) */}
      <div className="relative z-30 flex justify-center pb-3 pt-1">
        <GameActionBar
          activeView={activeWindow || activeView}
          onSelectView={handleOpenTool}
          onRequestFaucet={requestFaucet}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onOpenHangar={() => setShowHangar(true)}
          onOpenQuests={() => setShowQuests(true)}
          onOpenOptions={() => setShowOptions(true)}
          onOpenTutorial={() => setShowTutorial(true)}
          onOpenWalletTerminal={() => setShowWalletTerminal(true)}
        />
      </div>

      {/* 8. Floating Game Window (LovecraftUI Draggable Cyber Window) */}
      {activeWindow && (
        <FloatingGameWindow
          title={getWindowTitle(activeWindow).title}
          subtitle={getWindowTitle(activeWindow).subtitle}
          icon={getWindowTitle(activeWindow).icon}
          isOpen={true}
          onClose={() => setActiveWindow(null)}
        >
          {activeWindow === 'courses' && <CourseCatalog />}
          {activeWindow === 'lab' && <Web3Lab />}
          {activeWindow === 'deploy' && <DeploymentManager />}
          {activeWindow === 'verify' && <CertificateVerifier />}
          {activeWindow === 'profile' && <BuilderProfile />}
          {activeWindow === 'projects' && <ProjectDirectory />}
          {activeWindow === 'img2threejs' && <Img2ThreejsStudio />}
          {activeWindow === 'worldmap' && <PisoWorldMap3D />}
          {activeWindow === 'chat' && <PisoP2PChatRoom onClose={() => setActiveWindow(null)} />}
        </FloatingGameWindow>

      )}

      {/* 9. NPC Mentor Modal */}
      {activeMentor && (
        <NPCMentorModal
          mentorId={activeMentor.id}
          onClose={() => setActiveMentor(null)}
          onNavigateToMentor={(mentorId) => {
            setActiveMentor(null);
            window.dispatchEvent(
              new CustomEvent('piso-navigate-to-mentor', { detail: { mentorId } })
            );
          }}
        />
      )}

      {/* 10. Tutorial & Flight Manual Modal */}
      {showTutorial && (
        <GameTutorialModal onClose={() => setShowTutorial(false)} />
      )}

      {/* 11. Settings & Options Modal */}
      {showOptions && (
        <GameOptionsModal onClose={() => setShowOptions(false)} />
      )}

      {/* 12. Daily Quests Modal */}
      {showQuests && (
        <DailyQuestsModal onClose={() => setShowQuests(false)} />
      )}

      {/* 13. Drone Hangar Modal */}
      {showHangar && (
        <AvatarHangarModal onClose={() => setShowHangar(false)} />
      )}

      {/* 14. Interactive Wallet Studio Sandbox Terminal */}
      {showWalletTerminal && (
        <WalletStudioTerminalModal
          isOpen={showWalletTerminal}
          onClose={() => setShowWalletTerminal(false)}
        />
      )}
    </div>
  );
};
