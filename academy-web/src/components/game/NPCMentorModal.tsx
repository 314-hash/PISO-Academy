import React, { useState, useEffect } from 'react';
import { useAcademy } from '../../context/AcademyContext';
import { SoundFX } from '../../services/soundFX';
import {
  Sparkles,
  Bot,
  MessageSquare,
  Check,
  X,
  Award,
  ChevronRight,
  Navigation,
  ArrowRight,
} from 'lucide-react';

export interface NPCMentorData {
  id: 'panday' | 'babaylan' | 'datu';
  name: string;
  title: string;
  district: string;
  avatar: string;
  color: string;
  greeting: string;
  dialogues: {
    prompt: string;
    response: string;
  }[];
  questRewardPrompt: string;
  questRewardText: string;
  xpReward: number;
}

export const NPC_MENTORS: Record<string, NPCMentorData> = {
  panday: {
    id: 'panday',
    name: 'Master Panday (Kiko)',
    title: 'Senior EVM Architect & Smart Contract Blacksmith',
    district: 'Smart Contract Forge',
    avatar: '⚒️',
    color: 'from-amber-500 to-orange-600',
    greeting:
      'Maligayang pagdating sa Forge, Ka-Builder! Dito natin pinapanday ang pinakamatitibay na smart contracts sa EVM. Huwag kailanman mag-deploy nang walang reentrancy guard at storage optimization!',
    dialogues: [
      {
        prompt: 'Paano mag-optimize ng gas sa PISO Chain?',
        response:
          'Gamitin ang storage packing! Kapag pinagsama mo ang dalawang uint128 sa iisang 32-byte slot, makatitipid ka ng 20,000 gas kada write (SSTORE). At kung tiyak kang hindi mag-o-overflow ang loop counter, gamitin ang unchecked { ++i; }!',
      },
      {
        prompt: 'Bakit Soulbound (ERC-5192) ang Katunayan Certificate?',
        response:
          'Dahil ang karunungan at kasanayan ay hindi nabibili o naililipat sa ibang wallet! Sa pamamagitan ng precompile 0x...1014, ang iyong Katunayan NFT ay permanenteng naka-lock sa iyong address bilang patunay ng iyong galing.',
      },
      {
        prompt: 'Ano ang pinakamalaking pagkakamali ng mga baguhang builder?',
        response:
          'Ang paggamit ng tx.origin sa halip na msg.sender para sa authorization! Madali itong ma-phish sa pamamagitan ng intermediary malicious contract. Laging msg.sender ang gamitin, bata!',
      },
    ],
    questRewardPrompt: 'Hilingin ang Basbas ng Panday (+50 XP)',
    questRewardText:
      'Iginagawad ko sa iyo ang Basbas ng Panday! Nawa ay maging kasing tibay ng bakal ang iyong mga smart contracts.',
    xpReward: 50,
  },
  babaylan: {
    id: 'babaylan',
    name: 'Babaylan Maya',
    title: 'Cryptographic Seer & AI Oracle Matriarch',
    district: 'Babaylan AI Citadel',
    avatar: '🔮',
    color: 'from-purple-500 to-pink-600',
    greeting:
      'Naririnig mo ba ang ugong ng mga nodes, anak? Ako si Babaylan Maya. Pinagdurugtong ko ang deterministic world ng blockchain at ang dynamic world ng Artificial Intelligence sa pamamagitan ng Babaylan AI Oracle (0x...1009).',
    dialogues: [
      {
        prompt: 'Ano ang Determinism Gap sa Web3 at AI?',
        response:
          'Ang EVM ay nangangailangan ng 100% determinism — bawat validator ay dapat maglabas ng eksaktong parehong state. Ngunit ang LLMs at floating-point AI ay non-deterministic! Dito pumapasok ang aming oracle: pinapatakbo ang AI off-chain at nagve-verify ng cryptographic ZK proof on-chain.',
      },
      {
        prompt: 'Paano gamitin ang precompile 0x...1009?',
        response:
          'Maaari kang tumawag sa IBabaylanAIOracle(0x0000000000000000000000000000000000001009).requestInference(prompt, modelHash). Nagbabalik ito ng requestId na susulatan ng aming consensus oracle kapag tapos na ang inference!',
      },
      {
        prompt: 'Ano ang hinaharap ng autonomous Web3 AI agents?',
        response:
          'Mga AI agents na may sariling ERC-4337 smart account sa PISO Chain! Kaya nilang magbayad ng gas, magpatakbo ng micro-services, at mag-settle ng payments sa ₱PISO nang walang kailangan pang tao.',
      },
    ],
    questRewardPrompt: 'Tanggapin ang Liwanag ng Babaylan (+50 XP)',
    questRewardText:
      'Sumaiyo ang pananaw ng Babaylan! Binuksan ko ang iyong isipan sa mas malalim na misteryo ng cryptography.',
    xpReward: 50,
  },
  datu: {
    id: 'datu',
    name: 'Kapitan Datu',
    title: 'Elder of the Bayanihan DAO & Ecosystem Sovereign',
    district: 'Genesis Plaza',
    avatar: '👑',
    color: 'from-amber-400 to-yellow-600',
    greeting:
      'Mabuhay, Ka-Barangay! Ako si Kapitan Datu, tagapangalaga ng Bayanihan DAO. Ang PISO Chain ay nilikha upang palayain ang mga Pilipinong manggagawa at developers mula sa mabibigat na remittance fees at sentralisadong monopolyo.',
    dialogues: [
      {
        prompt: 'Bakit Clique Proof-of-Authority ang consensus ng PISO Devnet?',
        response:
          'Ang Clique PoA ay nagbibigay sa atin ng garantisadong 3.0-segundong block time na walang nasasayang na kuryente o gas! Perpekto ito para sa instant micro-transactions at masiglang developer education.',
      },
      {
        prompt: 'Paano ako makakukuha ng Builder Grant sa PISO?',
        response:
          'Magtayo ng kapaki-pakinabang na dApp sa aming Smart Contract Lab, i-deploy ito sa PISO Devnet (2026001), at i-submit sa ating Ecosystem Directory [6]! Ang Bayanihan DAO ay nagkakaloob ng pondo para sa mga pinakamahuhusay na proyekto.',
      },
      {
        prompt: 'Ano ang ibig sabihin ng Bayanihan sa Web3?',
        response:
          'Sa sinaunang tradisyon, sama-samang binubuhat ng mga magkakapitbahay ang bahay-kubo. Sa Web3, sama-samang pinapatakbo ng mga nodes at builders ang transparent ledger — walang boss, walang middleman, purong pagkakaisa!',
      },
    ],
    questRewardPrompt: 'Humingi ng Basbas ng Datu (+50 XP)',
    questRewardText:
      'Tinatanggap kita bilang opisyal na Builder ng Barangay PISO! Patuloy kang maglingkod sa komunidad.',
    xpReward: 50,
  },
};

export const MENTOR_LIST: ('panday' | 'babaylan' | 'datu')[] = ['panday', 'babaylan', 'datu'];

interface NPCMentorModalProps {
  mentorId: 'panday' | 'babaylan' | 'datu';
  onClose: () => void;
  onNavigateToMentor?: (mentorId: 'panday' | 'babaylan' | 'datu') => void;
}

export const NPCMentorModal: React.FC<NPCMentorModalProps> = ({
  mentorId,
  onClose,
  onNavigateToMentor,
}) => {
  const [currentMentorId, setCurrentMentorId] = useState<'panday' | 'babaylan' | 'datu'>(mentorId);
  const mentor = NPC_MENTORS[currentMentorId] || NPC_MENTORS.panday;

  const {
    claimedMentorRewards,
    claimMentorReward,
    recordTalkToMentor,
  } = useAcademy();

  const [activeSpeech, setActiveSpeech] = useState<string>(mentor.greeting);
  const [selectedDialogueIndex, setSelectedDialogueIndex] = useState<number>(-1);

  // Sync prop changes
  useEffect(() => {
    setCurrentMentorId(mentorId);
  }, [mentorId]);

  // When mentor changes, reset dialogue & register conversation
  useEffect(() => {
    setActiveSpeech(mentor.greeting);
    setSelectedDialogueIndex(-1);
    recordTalkToMentor(mentor.id);
  }, [currentMentorId, mentor.id, mentor.greeting]);

  // Determine 1-time claim status from global persisted state
  const isClaimed = claimedMentorRewards.includes(mentor.id);

  // Calculate next mentor for easy navigation
  const currentIndex = MENTOR_LIST.indexOf(currentMentorId);
  const nextMentorId = MENTOR_LIST[(currentIndex + 1) % MENTOR_LIST.length];
  const nextMentor = NPC_MENTORS[nextMentorId];

  // Total claimed count (out of 3)
  const totalClaimedCount = MENTOR_LIST.filter((id) => claimedMentorRewards.includes(id)).length;

  const handleSelectDialogue = (idx: number, response: string) => {
    SoundFX.playBlip();
    setSelectedDialogueIndex(idx);
    setActiveSpeech(response);
  };

  const handleClaimReward = () => {
    if (isClaimed) return;
    const success = claimMentorReward(mentor.id, mentor.xpReward);
    if (success) {
      SoundFX.playQuestComplete();
      setActiveSpeech(mentor.questRewardText);
    }
  };

  const handleSwitchMentorTab = (id: 'panday' | 'babaylan' | 'datu') => {
    SoundFX.playClick();
    setCurrentMentorId(id);
  };

  const handleFlyToMentor = (id: 'panday' | 'babaylan' | 'datu') => {
    SoundFX.playWarp();
    if (onNavigateToMentor) {
      onNavigateToMentor(id);
    } else {
      window.dispatchEvent(
        new CustomEvent('piso-navigate-to-mentor', { detail: { mentorId: id } })
      );
    }
    onClose();
  };

  // Keyboard navigation:
  // [N] or [Tab]: Autopilot cruise to next mentor!
  // [E] / [Space] / [Enter]: advances dialogue, or claims reward if ready, or flies to next mentor!
  // [1-3]: selects dialogue options.
  // [Esc]: Closes modal.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const k = e.key.toLowerCase();

      // [N] or [Tab] -> Auto-cruise to next mentor
      if (k === 'n' || e.key === 'Tab') {
        e.preventDefault();
        handleFlyToMentor(nextMentorId);
        return;
      }

      // [E], [Space], [Enter] -> Advance conversation or Claim
      if (k === 'e' || k === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (selectedDialogueIndex < mentor.dialogues.length - 1) {
          const nextIdx = selectedDialogueIndex + 1;
          handleSelectDialogue(nextIdx, mentor.dialogues[nextIdx].response);
        } else if (!isClaimed) {
          handleClaimReward();
        } else {
          // If already claimed and finished questions, offer quick cruise to next mentor
          handleFlyToMentor(nextMentorId);
        }
      } else if (e.key === '1' && mentor.dialogues[0]) {
        handleSelectDialogue(0, mentor.dialogues[0].response);
      } else if (e.key === '2' && mentor.dialogues[1]) {
        handleSelectDialogue(1, mentor.dialogues[1].response);
      } else if (e.key === '3' && mentor.dialogues[2]) {
        handleSelectDialogue(2, mentor.dialogues[2].response);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDialogueIndex, isClaimed, mentor, nextMentorId, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-2xl bg-[#0F172A] border-2 border-amber-400/80 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.3)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* CRT Scanline Overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-25 z-10" />

        {/* Top Mentor Selector Bar (User-Friendly NPC Navigation Tracker) */}
        <div className="relative z-20 px-6 pt-3 pb-2 bg-[#0B0F17] border-b border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Navigation className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-mono font-bold uppercase text-slate-300 tracking-wider">
                Mentor Navigation & 1-Time Basbas Hub
              </span>
            </div>
            <div className="flex items-center space-x-1.5 font-mono text-[10px]">
              <span className="text-slate-400">Total Claimed:</span>
              <span className="text-amber-400 font-bold px-1.5 py-0.2 rounded bg-amber-400/10 border border-amber-400/30">
                {totalClaimedCount}/3 ({totalClaimedCount * 50} XP)
              </span>
            </div>
          </div>

          {/* Mentor Tabs */}
          <div className="grid grid-cols-3 gap-2">
            {MENTOR_LIST.map((id) => {
              const m = NPC_MENTORS[id];
              const isCurrent = currentMentorId === id;
              const hasClaimed = claimedMentorRewards.includes(id);

              return (
                <button
                  key={id}
                  onClick={() => handleSwitchMentorTab(id)}
                  className={`p-2 rounded-xl text-left transition-all border flex flex-col justify-between relative group ${
                    isCurrent
                      ? 'bg-[#161F30] border-amber-400/80 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 truncate">
                      <span className="text-base">{m.avatar}</span>
                      <span
                        className={`text-xs font-bold truncate ${
                          isCurrent ? 'text-amber-400' : 'text-slate-300 group-hover:text-white'
                        }`}
                      >
                        {m.name.split(' ')[0]} {m.name.split(' ')[1] || ''}
                      </span>
                    </div>
                  </div>

                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[9px] font-mono text-slate-400 truncate">
                      {m.district.split(' ')[0]}
                    </span>
                    {hasClaimed ? (
                      <span className="inline-flex items-center text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded border border-emerald-500/30">
                        <Check className="w-2.5 h-2.5 mr-0.5" />
                        1x Done
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[9px] font-mono font-bold text-amber-400 bg-amber-400/10 px-1 py-0.2 rounded border border-amber-400/30 animate-pulse">
                        +50 XP
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Mentor Header */}
        <div className="relative z-20 flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-[#161F30]/90">
          <div className="flex items-center space-x-3">
            <div
              className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${mentor.color} flex items-center justify-center text-2xl shadow-lg border border-white/20`}
            >
              {mentor.avatar}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-[10px] font-black text-amber-400 uppercase tracking-wider px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/30">
                  ON-CHAIN MENTOR
                </span>
                <span className="text-xs text-slate-400 font-mono">{mentor.district}</span>
              </div>
              <h2 className="text-base font-bold text-white tracking-wide">{mentor.name}</h2>
              <p className="text-[11px] text-slate-400">{mentor.title}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Quick Autopilot Cruise Button to Next Mentor */}
            <button
              onClick={() => handleFlyToMentor(nextMentorId)}
              title={`Lumipad patungo kay ${nextMentor.name}`}
              className="px-2.5 py-1.5 rounded-lg bg-purple-500/15 border border-purple-500/40 text-purple-300 hover:text-white hover:bg-purple-500/30 text-xs font-mono font-bold flex items-center space-x-1.5 transition-all shadow-sm"
            >
              <span>{nextMentor.avatar}</span>
              <span>Fly Next [N]</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dialog & Dialogue Body */}
        <div className="relative z-20 flex-1 overflow-y-auto p-5 space-y-4">
          {/* Holographic Speech Box */}
          <div className="p-4 rounded-2xl bg-[#161F30]/90 border border-amber-400/40 relative shadow-inner">
            <div className="absolute -top-3 left-4 px-2 py-0.5 bg-[#0F172A] border border-amber-400/40 rounded text-[10px] font-mono font-bold text-amber-400 flex items-center space-x-1">
              <Bot className="w-3 h-3" />
              <span>HOLO-COMM TRANSMISSION</span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-mono mt-1 whitespace-pre-wrap">
              "{activeSpeech}"
            </p>
          </div>

          {/* Dialogue Prompts */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-slate-400 uppercase flex items-center space-x-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                <span>Pumili ng Itatanong o Pag-uusapan:</span>
              </span>
              <span className="text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30 text-[10px]">
                [E] Advance | [1-3] Question Hotkey
              </span>
            </div>
            <div className="space-y-2">
              {mentor.dialogues.map((d, idx) => {
                const isSelected = selectedDialogueIndex === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectDialogue(idx, d.response)}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between group ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-400 text-white shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                        : 'bg-[#161F30] border-slate-800 hover:border-amber-400/50 hover:bg-amber-400/5 text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <span
                        className={`font-mono text-[10px] font-black px-1.5 py-0.5 rounded border ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950 border-amber-400'
                            : 'bg-slate-800 text-amber-400 border-slate-700'
                        }`}
                      >
                        [{idx + 1}]
                      </span>
                      <span className="font-mono">💬 "{d.prompt}"</span>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 transition-colors ${
                        isSelected
                          ? 'text-amber-400 translate-x-1'
                          : 'text-slate-500 group-hover:text-amber-400'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Strict 1-Time Mentor Reward / Blessing Action */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-purple-500/5 to-blue-500/10 border border-amber-400/30 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-amber-400/10 border border-amber-400/30">
                <Award className="w-7 h-7 text-amber-400 shrink-0" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-bold text-white text-xs">Basbas ng Mentor ({mentor.name})</h4>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-400/15 text-amber-300 font-bold border border-amber-400/30">
                    1-TIME ONLY
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {isClaimed
                    ? '✓ Nakuha mo na ang 1-time basbas (+50 XP). Isang beses lamang ito bawat mentor.'
                    : `Humingi ng gabay at basbas para kumita ng +${mentor.xpReward} Katunayan XP (1-time only).`}
                </p>
              </div>
            </div>

            <button
              disabled={isClaimed}
              onClick={handleClaimReward}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs font-mono uppercase tracking-wider transition-all flex items-center space-x-2 ${
                isClaimed
                  ? 'bg-slate-800/90 text-emerald-400 border border-emerald-500/40 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 hover:brightness-110 shadow-[0_0_20px_rgba(245,158,11,0.5)] active:scale-95'
              }`}
            >
              {isClaimed ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>✓ 1-TIME XP NATANGGAP NA (+{mentor.xpReward} XP)</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>[E] {mentor.questRewardPrompt}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer with Navigation Hotkeys & Next Mentor Actions */}
        <div className="relative z-20 flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-[#161F30]/90 text-xs font-mono text-slate-400">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleFlyToMentor(nextMentorId)}
              className="text-amber-400 hover:text-amber-300 font-bold flex items-center space-x-1.5 transition-colors"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>[N / Tab] Lumipad kay {nextMentor.name.split(' ')[0]} ➔</span>
            </button>
            <span className="text-slate-600">•</span>
            <span>[E / Space] Ipagpatuloy</span>
            <span className="text-slate-600">•</span>
            <span>[Esc] Isara</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors font-mono"
          >
            Tapusin ang Usapan [Esc]
          </button>
        </div>
      </div>
    </div>
  );
};
