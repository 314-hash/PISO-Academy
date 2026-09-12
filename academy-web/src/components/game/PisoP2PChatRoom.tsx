import React, { useState, useEffect, useRef } from 'react';
import {
  GunChat,
  PisoChatRoom,
  PisoChatMessage,
  GunPeerMetrics,
  DEVNET_VALIDATOR_ADDRESS,
} from '../../services/gunService';
import { useAcademy } from '../../context/AcademyContext';
import { SoundFX } from '../../services/soundFX';
import { Piso3DNetworkGraph } from './Piso3DNetworkGraph';
import {
  MessageSquare,
  Shield,
  ShieldCheck,
  Send,
  Plus,
  Radio,
  Flame,
  Rocket,
  Lightbulb,
  Coins,
  Cpu,
  Lock,
  ChevronDown,
  ChevronUp,
  Search,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Sparkles,
} from 'lucide-react';

interface PisoP2PChatRoomProps {
  onClose?: () => void;
}

export const PisoP2PChatRoom: React.FC<PisoP2PChatRoomProps> = () => {
  const { wallet, humanAvatar } = useAcademy();

  const [rooms, setRooms] = useState<PisoChatRoom[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string>('genesis-council');
  const [messages, setMessages] = useState<PisoChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [metrics, setMetrics] = useState<GunPeerMetrics>(GunChat.getMetrics());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // View Toggles
  const [show3DGraph, setShow3DGraph] = useState<boolean>(true);
  const [showDagInspector, setShowDagInspector] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showValidatorGateModal, setShowValidatorGateModal] = useState<boolean>(false);

  // New Room Form State
  const [newRoomName, setNewRoomName] = useState<string>('');
  const [newRoomTopic, setNewRoomTopic] = useState<string>('');
  const [newRoomCategory, setNewRoomCategory] = useState<PisoChatRoom['category']>('devnet');
  const [formError, setFormError] = useState<string>('');

  // Simulated Validator Node State for Students / Devnet Testers
  const [isValidatorSimulated, setIsValidatorSimulated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.sessionStorage?.getItem('piso_is_validator_simulated') === 'true';
    }
    return false;
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Determine user identity
  const userAddress = isValidatorSimulated
    ? DEVNET_VALIDATOR_ADDRESS
    : wallet.address || '0x' + Math.random().toString(16).substring(2, 10) + '...guest';

  const isValidator = GunChat.isValidatorAddress(userAddress);
  const userAlias = isValidatorSimulated
    ? 'Kapitan Datu (Devnet Validator #01)'
    : humanAvatar?.name || (wallet.address ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : 'Anonymous Builder');
  const userAvatar = isValidator ? '🛡️' : '⚡';

  // Initialize GunChat and subscriptions
  useEffect(() => {
    GunChat.init();

    const unsubRooms = GunChat.subscribeRooms((r) => setRooms(r));
    const unsubMetrics = GunChat.subscribePeerMetrics((m) => setMetrics(m));

    return () => {
      unsubRooms();
      unsubMetrics();
    };
  }, []);

  // Subscribe to messages in active room
  useEffect(() => {
    const unsubMsgs = GunChat.subscribeMessages(activeRoomId, (msgs) => {
      setMessages(msgs);
    });

    return () => {
      unsubMsgs();
    };
  }, [activeRoomId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeRoom = rooms.find((r) => r.id === activeRoomId) || rooms[0];

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = inputText.trim();
    if (!clean) return;

    SoundFX.playLaser();
    GunChat.sendMessage({
      roomId: activeRoomId,
      sender: userAlias,
      senderAddress: userAddress,
      senderAvatar: userAvatar,
      role: isValidator ? 'validator' : 'builder',
      text: clean,
    });

    window.dispatchEvent(
      new CustomEvent('piso-avatar-chat', {
        detail: {
          sender: userAlias,
          text: clean,
          isValidator,
        },
      })
    );

    setInputText('');
  };

  const handleAddReaction = (msgId: string, emoji: string) => {
    SoundFX.playBlip();
    GunChat.addReaction(activeRoomId, msgId, emoji);
  };

  const handleTip = (msgId: string) => {
    SoundFX.playLaser();
    GunChat.tipMessage(activeRoomId, msgId, 1.0);
  };

  const handleToggleValidatorSimulation = () => {
    const nextVal = !isValidatorSimulated;
    setIsValidatorSimulated(nextVal);
    if (typeof window !== 'undefined') {
      window.sessionStorage?.setItem('piso_is_validator_simulated', String(nextVal));
    }
    SoundFX.playWarp();
    setShowValidatorGateModal(false);
  };

  const handleOpenCreateRoom = () => {
    if (isValidator) {
      setFormError('');
      setShowCreateModal(true);
    } else {
      setShowValidatorGateModal(true);
    }
  };

  const handleCreateRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const res = await GunChat.createValidatorRoom({
      name: newRoomName,
      topic: newRoomTopic,
      category: newRoomCategory,
      validatorAlias: userAlias,
      validatorAddress: userAddress,
    });

    if (!res.success) {
      setFormError(res.error || 'Failed to create room.');
      return;
    }

    SoundFX.playSuccess();
    if (res.room) {
      setActiveRoomId(res.room.id);
    }
    setNewRoomName('');
    setNewRoomTopic('');
    setShowCreateModal(false);
  };

  // Filtered rooms
  const filteredRooms = rooms.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || r.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col h-[750px] max-h-[85vh] w-full bg-[#0B0F17] rounded-3xl overflow-hidden border border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.9)] text-slate-100 select-none">
      {/* 1. Global Header Bar */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-[#161F30]/90 border-b border-slate-800 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-purple-600 flex items-center justify-center shadow-glow">
            <Radio className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-bold text-white text-base tracking-wide font-sans">
                PISO P2P MESH // GUN.JS CHATROOM
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono font-bold flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>P2P SYNC</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Decentralized DAG Broadcast Network • Only Validators Mint Broadcast Channels
            </p>
          </div>
        </div>

        {/* Validator Status & 3D Toggle */}
        <div className="flex items-center space-x-3">
          {isValidator ? (
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-mono font-bold">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span className="hidden sm:inline">VALIDATOR NODE ACTIVE</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowValidatorGateModal(true)}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold transition"
            >
              <Shield className="w-4 h-4 text-amber-400" />
              <span>BUILDER PEER</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShow3DGraph(!show3DGraph)}
            className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border transition flex items-center space-x-1.5 ${
              show3DGraph
                ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden md:inline">3D MESH</span>
          </button>
        </div>
      </div>

      {/* 2. Main Content Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Rooms & Channels */}
        <div className="w-72 md:w-80 flex-shrink-0 flex flex-col bg-[#0F172A]/80 border-r border-slate-800">
          {/* Action: Initialize Validator Room */}
          <div className="p-3 border-b border-slate-800/80">
            <button
              type="button"
              onClick={handleOpenCreateRoom}
              className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold font-mono text-xs transition shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>INITIALIZE VALIDATOR ROOM</span>
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="p-3 space-y-2 border-b border-slate-800/80">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search rooms or topics..."
                className="w-full bg-[#161F30] border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex flex-wrap gap-1">
              {['all', 'governance', 'devnet', 'defi', 'security'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase transition ${
                    selectedCategory === cat
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Room List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {filteredRooms.map((room) => {
              const isActive = room.id === activeRoomId;
              return (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => {
                    SoundFX.playWarp();
                    setActiveRoomId(room.id);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl border transition group flex flex-col space-y-1 ${
                    isActive
                      ? 'bg-[#161F30] border-amber-400/80 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                      : 'bg-slate-900/50 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-white group-hover:text-amber-300 flex items-center space-x-1.5">
                      <span>#</span>
                      <span>{room.name}</span>
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[9px] font-mono">
                      VALIDATOR
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1 font-sans">
                    {room.topic}
                  </p>
                  <div className="flex items-center justify-between pt-1 text-[9px] font-mono text-slate-500">
                    <span>{room.creatorAlias}</span>
                    <span className="uppercase text-amber-500/80">{room.category}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Peer Mesh Metrics Box */}
          <div className="p-3 bg-[#0B0F17] border-t border-slate-800/80 font-mono text-[10px] text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Connected Peers:</span>
              <span className="text-emerald-400 font-bold">{metrics.connectedPeersCount} Nodes</span>
            </div>
            <div className="flex justify-between">
              <span>Gun Graph Latency:</span>
              <span className="text-cyan-400">{metrics.latencyMs} ms</span>
            </div>
            <div className="flex justify-between">
              <span>Protocol:</span>
              <span className="text-amber-400">PISO-P2P-GUN-DAG</span>
            </div>
          </div>
        </div>

        {/* Right Area: 3D Visualizer + Messages + Input */}
        <div className="flex-1 flex flex-col bg-[#0B0F17] overflow-hidden">
          {/* Active Room Title Bar */}
          <div className="px-5 py-3 bg-[#161F30]/60 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-amber-400 font-mono text-lg font-bold">#</span>
                <h3 className="text-base font-bold text-white font-sans">{activeRoom?.name}</h3>
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-mono font-bold">
                  {activeRoom?.validatorTitle}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{activeRoom?.topic}</p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowDagInspector(!showDagInspector)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono border transition flex items-center space-x-1 ${
                  showDagInspector
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                    : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>DAG INSPECTOR</span>
                {showDagInspector ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Optional Three.js 3D Mesh Visualizer */}
          {show3DGraph && (
            <div className="p-3 border-b border-slate-800 bg-[#070A10]">
              <Piso3DNetworkGraph
                rooms={rooms}
                activeRoomId={activeRoomId}
                onSelectRoom={(rId) => {
                  SoundFX.playWarp();
                  setActiveRoomId(rId);
                }}
                connectedPeersCount={metrics.connectedPeersCount}
              />
            </div>
          )}

          {/* Optional Bullet Graph DAG Inspector */}
          {showDagInspector && (
            <div className="p-4 bg-[#070A10] border-b border-slate-800 font-mono text-xs text-slate-300 space-y-2">
              <div className="flex items-center justify-between text-cyan-400 font-bold">
                <span>BULLET GRAPH DAG TELEMETRY // GUN.JS ROOT</span>
                <span>ROOT HASH: {activeRoom?.validatorSignature.substring(0, 18)}...</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-500">Validator Signer:</span>
                  <p className="text-white truncate">{activeRoom?.creatorAddress}</p>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-500">Genesis Block:</span>
                  <p className="text-amber-400 font-bold">#{activeRoom?.blockNumber}</p>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-500">Chain ID:</span>
                  <p className="text-emerald-400 font-bold">2026001 (PISO L1)</p>
                </div>
              </div>
            </div>
          )}

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
                <MessageSquare className="w-10 h-10 text-slate-600" />
                <p className="font-bold text-sm text-slate-400">Walang mensahe sa channel na ito.</p>
                <p className="text-xs max-w-sm">
                  Maging unang mag-transmit sa P2P mesh network. Lahat ng mensahe ay naka-sync sa Gun graph!
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMyMessage =
                  msg.senderAddress.toLowerCase() === userAddress.toLowerCase();
                const isVal = msg.role === 'validator';

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col space-y-1 p-3.5 rounded-2xl border transition ${
                      isVal
                        ? 'bg-gradient-to-r from-purple-950/20 to-slate-900/80 border-purple-500/30'
                        : isMyMessage
                        ? 'bg-slate-900/90 border-amber-500/30'
                        : 'bg-[#161F30]/70 border-slate-800'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center space-x-2">
                        <span className="text-base">{msg.senderAvatar}</span>
                        <span className="font-bold text-white font-sans">{msg.sender}</span>
                        {isVal && (
                          <span className="px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-300 border border-purple-500/40 text-[9px] font-bold">
                            VALIDATOR
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500 truncate max-w-[120px]">
                          {msg.senderAddress}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Text Body */}
                    <p className="text-xs text-slate-200 leading-relaxed font-sans pl-6">
                      {msg.text}
                    </p>

                    {/* Footer: Reactions, Tips & Hash */}
                    <div className="flex items-center justify-between pt-1 pl-6">
                      <div className="flex items-center space-x-2">
                        {/* Reaction Buttons */}
                        <div className="flex items-center space-x-1">
                          {[
                            { emoji: '₱', icon: '₱' },
                            { emoji: '🚀', icon: <Rocket className="w-3 h-3 text-cyan-400" /> },
                            { emoji: '🔥', icon: <Flame className="w-3 h-3 text-orange-400" /> },
                            { emoji: '💡', icon: <Lightbulb className="w-3 h-3 text-amber-400" /> },
                          ].map(({ emoji, icon }) => {
                            const count = msg.reactions[emoji] || 0;
                            return (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => handleAddReaction(msg.id, emoji)}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-mono flex items-center space-x-1 border transition ${
                                  count > 0
                                    ? 'bg-slate-800 text-amber-300 border-amber-500/40'
                                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
                                }`}
                              >
                                <span>{icon}</span>
                                {count > 0 && <span>{count}</span>}
                              </button>
                            );
                          })}
                        </div>

                        {/* Tip Button */}
                        <button
                          type="button"
                          onClick={() => handleTip(msg.id)}
                          className="px-2 py-0.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold flex items-center space-x-1 transition"
                        >
                          <Coins className="w-3 h-3 text-amber-400" />
                          <span>TIP 1.0 ₱</span>
                          {msg.tipTotal > 0 && <span>({msg.tipTotal} ₱)</span>}
                        </button>
                      </div>

                      {/* Cryptographic Hash Digest */}
                      <span className="text-[9px] font-mono text-slate-600 hidden sm:inline">
                        #{msg.hash.slice(0, 10)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Bar */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-[#161F30]/90 border-t border-slate-800 flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Transmit message to #${activeRoom?.name} via Gun.js P2P mesh...`}
              className="flex-1 bg-[#0B0F17] border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
            />

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold font-mono text-xs flex items-center space-x-1.5 transition active:scale-95 shadow-glow"
            >
              <span>SEND</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* MODAL 1: VALIDATOR ONLY RESTRICTION & CONSENSUS PROOF */}
      {showValidatorGateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-3xl bg-[#0B0F17] border border-amber-500/40 p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Lock className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white font-sans">
                VALIDATOR CONSENSUS RESTRICTION
              </h3>
              <p className="text-xs text-slate-400">
                PISO Chain PoS / PoA Anti-Sybil Protection
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#161F30] border border-slate-800 space-y-2 text-xs text-slate-300">
              <p>
                Upang maprotektahan ang decentralized Gun.js graph laban sa spam at sybil attacks, tanging ang mga
                <strong> verified PISO Chain Validators</strong> (Genesis Nodes o mga address na may Soulbound
                Katunayan Validator Credential) ang may pahintulot mag-mint ng bagong broadcast channels.
              </p>
              <p className="text-slate-400">
                Ang lahat ng builders at mag-aaral ay maaaring sumali, magbasa, magpadala ng mensahe, at mag-tip ng ₱ sa anumang umiiral na room.
              </p>
            </div>

            {/* Simulation Option for Testing Devnet Validators */}
            <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/40 space-y-2">
              <div className="flex items-center space-x-2 text-purple-300 font-mono text-xs font-bold">
                <Sparkles className="w-4 h-4" />
                <span>DEVNET VALIDATOR SIMULATOR</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Nais mo bang subukan ang pag-mint ng room bilang Genesis Validator gamit ang devnet keypair ({DEVNET_VALIDATOR_ADDRESS.slice(0, 10)}...)?
              </p>
              <button
                type="button"
                onClick={handleToggleValidatorSimulation}
                className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold text-xs transition"
              >
                {isValidatorSimulated ? 'DEACTIVATE VALIDATOR MODE' : 'ACTIVATE DEVNET VALIDATOR MODE'}
              </button>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowValidatorGateModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs transition"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: INITIALIZE VALIDATOR ROOM FORM */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateRoomSubmit}
            className="max-w-lg w-full rounded-3xl bg-[#0B0F17] border border-purple-500/40 p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">INITIALIZE VALIDATOR BROADCAST ROOM</h3>
                <p className="text-xs text-purple-300 font-mono">Sign & publish new channel to Gun.js graph</p>
              </div>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-mono">
                {formError}
              </div>
            )}

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Room Name (Identifier)</label>
                <input
                  type="text"
                  required
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="e.g. hackathon-builders-2026"
                  className="w-full bg-[#161F30] border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Topic / Description</label>
                <input
                  type="text"
                  required
                  value={newRoomTopic}
                  onChange={(e) => setNewRoomTopic(e.target.value)}
                  placeholder="e.g. Hackathon collaboration & team formation"
                  className="w-full bg-[#161F30] border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Category</label>
                <select
                  value={newRoomCategory}
                  onChange={(e) => setNewRoomCategory(e.target.value as any)}
                  className="w-full bg-[#161F30] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="devnet">Devnet & Smart Contracts</option>
                  <option value="governance">Consensus & Governance</option>
                  <option value="defi">DeFi & DEX Forge</option>
                  <option value="security">Security & Soulbound Katunayan</option>
                  <option value="hackathon">Hackathons & Projects</option>
                  <option value="general">Bayanihan Community</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <span className="text-slate-500 font-bold">Consensus Signing Proof:</span>
                <p className="truncate text-purple-400">Signer: {userAddress}</p>
                <p className="text-emerald-400">Network: PISO Chain (Chain ID: 2026001)</p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs transition"
              >
                CANCEL
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-mono font-bold text-xs transition shadow-glow"
              >
                SIGN & MINT ROOM
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
