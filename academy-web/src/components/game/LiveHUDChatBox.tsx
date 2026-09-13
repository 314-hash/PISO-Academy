import React, { useState, useEffect, useRef } from 'react';
import {
  GunChat,
  PisoChatRoom,
  PisoChatMessage,
  DEVNET_VALIDATOR_ADDRESS,
} from '../../services/gunService';
import { useAcademy } from '../../context/AcademyContext';
import { SoundFX } from '../../services/soundFX';
import { PlayerProgressionEngine } from '../../services/playerProgressionEngine';
import { MultiplayerNetworkEngine } from '../../services/multiplayer/MultiplayerNetworkEngine';
import { NetworkChatPayload } from '../../types/multiplayer';
import {
  MessageSquare,
  Send,
  Minimize2,
  Maximize2,
  ExternalLink,
  ChevronDown,
  Sparkles,
  Shield,
  Coins,
  Flame,
  Radio,
} from 'lucide-react';

interface LiveHUDChatBoxProps {
  onOpenFullChat: () => void;
  hasTouchControls?: boolean;
}

export const LiveHUDChatBox: React.FC<LiveHUDChatBoxProps> = ({ onOpenFullChat, hasTouchControls = false }) => {
  const { wallet, humanAvatar } = useAcademy();

  const [rooms, setRooms] = useState<PisoChatRoom[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string>('genesis-council');
  const [messages, setMessages] = useState<PisoChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [chatScope, setChatScope] = useState<'world' | 'proximity'>('world');
  const [isMinimized, setIsMinimized] = useState<boolean>(() => {
    return hasTouchControls || (typeof window !== 'undefined' && window.innerWidth < 768);
  });
  const [showRoomDropdown, setShowRoomDropdown] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const isValidatorSimulated =
    typeof window !== 'undefined' &&
    window.sessionStorage?.getItem('piso_is_validator_simulated') === 'true';

  const userAddress = isValidatorSimulated
    ? DEVNET_VALIDATOR_ADDRESS
    : wallet.address || '0x' + Math.random().toString(16).substring(2, 10) + '...guest';

  const isValidator = GunChat.isValidatorAddress(userAddress);
  const userAlias = isValidatorSimulated
    ? 'Kapitan Datu (Devnet Validator #01)'
    : humanAvatar?.name ||
      (wallet.address
        ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`
        : 'Anonymous Builder');
  const userAvatar = isValidator ? '🛡️' : '⚡';

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Subscribe to rooms
  useEffect(() => {
    GunChat.init();
    const unsub = GunChat.subscribeRooms((r) => setRooms(r));
    return () => unsub();
  }, []);

  // Subscribe to room messages
  useEffect(() => {
    const unsub = GunChat.subscribeMessages(activeRoomId, (msgs) => {
      setMessages(msgs);
      if (isMinimized) {
        setUnreadCount((prev) => prev + 1);
      }
    });

    return () => unsub();
  }, [activeRoomId, isMinimized]);

  // Subscribe to real-time multiplayer peer chat messages
  useEffect(() => {
    const handleMultiplayerChat = (chat: NetworkChatPayload) => {
      const incomingMsg: PisoChatMessage = {
        id: chat.messageId,
        roomId: activeRoomId,
        sender: chat.senderName,
        senderAddress: '0x' + chat.senderId.slice(0, 10),
        senderAvatar: chat.senderRank?.includes('🌟') ? '🌟' : '🧑‍🎓',
        role: 'builder',
        text: chat.isProximity ? `[Proximity] ${chat.text}` : chat.text,
        timestamp: chat.timestamp,
        reactions: {},
        tipTotal: 0,
        hash: '0x' + Math.random().toString(16).slice(2, 10),
      };

      setMessages((prev) => {
        if (prev.some((m) => m.id === incomingMsg.id)) return prev;
        return [...prev, incomingMsg];
      });

      if (isMinimized) {
        setUnreadCount((c) => c + 1);
      }
    };

    MultiplayerNetworkEngine.instance.on('onChatMessage', handleMultiplayerChat);
    return () => {
      MultiplayerNetworkEngine.instance.off('onChatMessage', handleMultiplayerChat);
    };
  }, [activeRoomId, isMinimized]);

  useEffect(() => {
    if (!isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isMinimized]);

  const activeRoom = rooms.find((r) => r.id === activeRoomId) || rooms[0];

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = inputText.trim();
    if (!clean) return;

    SoundFX.playLaser();

    // 1. Send via Gun.js P2P
    GunChat.sendMessage({
      roomId: activeRoomId,
      sender: userAlias,
      senderAddress: userAddress,
      senderAvatar: userAvatar,
      role: isValidator ? 'validator' : 'builder',
      text: clean,
    });

    // 2. Broadcast to Multiplayer Network Mesh (3D world & peers)
    MultiplayerNetworkEngine.instance.sendChatMessage(clean, chatScope === 'proximity');

    // 3. Broadcast 3D in-world speech bubble over the local avatar!
    window.dispatchEvent(
      new CustomEvent('piso-avatar-chat', {
        detail: {
          sender: userAlias,
          text: clean,
          isValidator,
        },
      })
    );

    // 4. Award Bayanihan community action
    try {
      PlayerProgressionEngine.awardAction('help_player', { text: clean });
    } catch {}

    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      inputRef.current?.blur();
    }
  };

  // If minimized, show small glowing cyber notification pill
  if (isMinimized) {
    return (
      <div className={`fixed z-20 transition-all ${hasTouchControls ? 'bottom-56 left-4' : 'bottom-24 left-4'}`}>
        <button
          type="button"
          onClick={() => {
            setIsMinimized(false);
            setUnreadCount(0);
            SoundFX.playClick();
          }}
          className="group flex items-center space-x-2 px-3.5 py-2 rounded-2xl bg-[#0B0F17]/90 hover:bg-[#161F30] border border-amber-500/50 hover:border-amber-400 text-slate-200 font-mono text-xs font-bold transition shadow-[0_0_20px_rgba(0,0,0,0.8)] backdrop-blur-md active:scale-95"
        >
          <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="text-white">LIVE CHAT</span>
          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px]">
            #{activeRoom?.name ? activeRoom.name.slice(0, 10) : 'genesis'}
          </span>
          {unreadCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[10px] font-black animate-bounce">
              {unreadCount}
            </span>
          )}
          <Maximize2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
        </button>
      </div>
    );
  }

  return (
    <div className={`fixed z-20 w-[calc(100vw-2rem)] sm:w-96 max-w-sm flex flex-col rounded-2xl bg-[#0B0F17]/95 border border-slate-700/80 shadow-[0_0_30px_rgba(0,0,0,0.85)] backdrop-blur-md overflow-hidden text-slate-100 select-none transition-all ${
      hasTouchControls ? 'bottom-56 left-4 max-h-[45vh]' : 'bottom-24 left-4'
    }`}>
      {/* 1. Header Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#161F30]/90 border-b border-slate-800">
        {/* Room Switcher Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowRoomDropdown(!showRoomDropdown)}
            className="flex items-center space-x-1.5 text-xs font-mono font-bold text-amber-400 hover:text-amber-300 transition"
          >
            <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>#{activeRoom?.name ? activeRoom.name.slice(0, 16) : 'genesis'}</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {showRoomDropdown && (
            <div className="absolute top-full left-0 mt-1 w-56 rounded-xl bg-[#0F172A] border border-slate-700 shadow-2xl p-1 z-30 space-y-0.5">
              {rooms.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setActiveRoomId(r.id);
                    setShowRoomDropdown(false);
                    SoundFX.playWarp();
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-mono flex items-center justify-between transition ${
                    r.id === activeRoomId
                      ? 'bg-amber-500/20 text-amber-300 font-bold'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="truncate">#{r.name}</span>
                  <span className="text-[9px] text-purple-400 uppercase">{r.category}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1.5">
          {/* Proximity vs World Chat Scope Toggle */}
          <button
            type="button"
            onClick={() => {
              const nextScope = chatScope === 'world' ? 'proximity' : 'world';
              setChatScope(nextScope);
              SoundFX.playBlip();
            }}
            title="Toggle between World & Proximity Chat"
            className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border transition flex items-center space-x-1 ${
              chatScope === 'proximity'
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                : 'bg-amber-500/20 border-amber-400/60 text-amber-300'
            }`}
          >
            <span>{chatScope === 'proximity' ? '🔊' : '🌐'}</span>
            <span>{chatScope === 'proximity' ? 'PROX' : 'WORLD'}</span>
          </button>

          {/* Open Full P2P Console */}
          <button
            type="button"
            onClick={() => {
              SoundFX.playClick();
              onOpenFullChat();
            }}
            title="Open Full P2P Chatroom Console [Hotkey: C]"
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          {/* Minimize HUD */}
          <button
            type="button"
            onClick={() => {
              setIsMinimized(true);
              SoundFX.playClick();
            }}
            title="Minimize Chatbox"
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Messages Stream (Latest messages) */}
      <div className="h-44 overflow-y-auto p-2.5 space-y-2 text-xs">
        {messages.slice(-12).map((m) => {
          const isVal = m.role === 'validator';
          return (
            <div
              key={m.id}
              className={`p-2 rounded-xl border transition ${
                isVal
                  ? 'bg-purple-950/20 border-purple-500/30'
                  : 'bg-slate-900/60 border-slate-800/80'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-0.5">
                <div className="flex items-center space-x-1">
                  <span>{m.senderAvatar}</span>
                  <span className="font-bold text-white truncate max-w-[110px]">{m.sender}</span>
                  {isVal && (
                    <span className="px-1 py-0.2 rounded bg-purple-500/30 text-purple-300 text-[8px] font-bold">
                      VAL
                    </span>
                  )}
                </div>
                <span className="text-[9px] text-slate-500">
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-[11px] text-slate-200 leading-snug pl-4">{m.text}</p>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Fast On-Screen Quick Transmit Input */}
      <form
        onSubmit={handleSend}
        className="p-2 bg-[#161F30]/90 border-t border-slate-800 flex items-center space-x-1.5"
      >
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type message & press Enter (or [ESC] to move)..."
          className="flex-1 bg-[#0B0F17] border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
        />

        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed text-slate-950 transition active:scale-95"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
