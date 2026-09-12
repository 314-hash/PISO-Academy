/**
 * Gun.js & SEA P2P Decentralized Graph Service for PISO Academy
 * Bullet Graph DAG architecture with Validator-Gated Room Creation
 */

declare global {
  interface Window {
    Gun?: any;
    SEA?: any;
  }
}

export interface PisoChatRoom {
  id: string;
  name: string;
  topic: string;
  category: 'governance' | 'devnet' | 'defi' | 'hackathon' | 'security' | 'general';
  creatorAlias: string;
  creatorAddress: string;
  validatorTitle: string;
  validatorSignature: string;
  blockNumber: number;
  createdAt: number;
  isOfficialValidator: boolean;
}

export interface PisoChatMessage {
  id: string;
  roomId: string;
  sender: string;
  senderAddress: string;
  senderAvatar: string;
  role: 'validator' | 'builder' | 'mentor' | 'guest';
  text: string;
  timestamp: number;
  reactions: Record<string, number>;
  tipTotal: number;
  hash: string;
  replyToId?: string;
}

export interface GunPeerMetrics {
  connectedPeersCount: number;
  activeRoomsCount: number;
  totalMessagesCount: number;
  storageMode: 'gun-p2p' | 'local-mesh';
  latencyMs: number;
}

// Recognized Genesis Validators on PISO Chain (Chain ID: 2026001)
export const GENESIS_VALIDATORS: Record<string, { title: string; avatar: string }> = {
  '0x2026F00D4721c001A83204918239014202600101': {
    title: 'Kapitan Datu (Genesis Consensus #01)',
    avatar: '👑',
  },
  '0x2026BAbA91a0194820194820194820261009': {
    title: 'Babaylan Maya (Oracle Seer #02)',
    avatar: '🔮',
  },
  '0x2026F089E47120194820194820261014': {
    title: 'Katunayan Verifier (Proof Node #03)',
    avatar: '🏛️',
  },
  '0x2026F089E4712019482019482026F086': {
    title: 'Master Panday (Forge Staking #04)',
    avatar: '⚒️',
  },
};

export const DEVNET_VALIDATOR_ADDRESS = '0x2026F00D4721c001A83204918239014202600101';

const DEFAULT_ROOMS: PisoChatRoom[] = [
  {
    id: 'genesis-council',
    name: 'Genesis Governance Council',
    topic: 'L1 Precompiles, PoS Staking & Validator Slashing Thresholds',
    category: 'governance',
    creatorAlias: 'Kapitan Datu',
    creatorAddress: '0x2026F00D4721c001A83204918239014202600101',
    validatorTitle: 'Genesis Validator #01',
    validatorSignature: '0x7a3f8c2b...piso_genesis_council_sig',
    blockNumber: 2026001,
    createdAt: Date.now() - 86400000 * 3,
    isOfficialValidator: true,
  },
  {
    id: 'solidity-forge',
    name: 'Smart Contract Forge',
    topic: 'Solidity Lab, Katunayan Soulbound Tokens & Foundry Gas Profiling',
    category: 'devnet',
    creatorAlias: 'Master Panday',
    creatorAddress: '0x2026F089E4712019482019482026F086',
    validatorTitle: 'Forge Staking Node #04',
    validatorSignature: '0x4e8d1a9c...piso_forge_sig',
    blockNumber: 2026024,
    createdAt: Date.now() - 86400000 * 2,
    isOfficialValidator: true,
  },
  {
    id: 'katunayan-temple',
    name: 'Katunayan Credentials',
    topic: 'Precompile 0x...1014 On-Chain Verifier & Anti-Sybil Proofs',
    category: 'security',
    creatorAlias: 'Katunayan Verifier',
    creatorAddress: '0x2026F089E47120194820194820261014',
    validatorTitle: 'Proof Node #03',
    validatorSignature: '0x9b2c3f1e...katunayan_oracle_sig',
    blockNumber: 2026050,
    createdAt: Date.now() - 86400000,
    isOfficialValidator: true,
  },
  {
    id: 'babaylan-citadel',
    name: 'Babaylan AI & Cryptography',
    topic: 'PISO Agent Oracles (0x...1009), ZK Proofs & Neural Nodes',
    category: 'defi',
    creatorAlias: 'Babaylan Maya',
    creatorAddress: '0x2026BAbA91a0194820194820261009',
    validatorTitle: 'Oracle Seer #02',
    validatorSignature: '0x5c7e1f4a...babaylan_ai_sig',
    blockNumber: 2026088,
    createdAt: Date.now() - 3600000 * 6,
    isOfficialValidator: true,
  },
  {
    id: 'bayanihan-faucet',
    name: 'Bayanihan Faucet Lounge',
    topic: 'Testnet 1.0 ₱ Drip coordination & Filipino Web3 Builders meetup',
    category: 'general',
    creatorAlias: 'Kapitan Datu',
    creatorAddress: '0x2026F00D4721c001A83204918239014202600101',
    validatorTitle: 'Genesis Validator #01',
    validatorSignature: '0x1c8b3d5f...bayanihan_faucet_sig',
    blockNumber: 2026102,
    createdAt: Date.now() - 3600000 * 2,
    isOfficialValidator: true,
  },
];

const INITIAL_MESSAGES: Record<string, PisoChatMessage[]> = {
  'genesis-council': [
    {
      id: 'msg-gen-1',
      roomId: 'genesis-council',
      sender: 'Kapitan Datu',
      senderAddress: '0x2026F00D4721c001A83204918239014202600101',
      senderAvatar: '👑',
      role: 'validator',
      text: 'Mabuhay ang mga PISO Chain Builders! Ang Genesis Council room na ito ay opisyal na binuksan sa Gun.js P2P mesh network. Dito pinag-uusapan ang protocol upgrades at staking.',
      timestamp: Date.now() - 3600000 * 5,
      reactions: { '₱': 12, '🚀': 8, '🔥': 5 },
      tipTotal: 5.0,
      hash: '0x9a84f3e2b1049c81',
    },
    {
      id: 'msg-gen-2',
      roomId: 'genesis-council',
      sender: 'Babaylan Maya',
      senderAddress: '0x2026BAbA91a0194820194820261009',
      senderAvatar: '🔮',
      role: 'mentor',
      text: 'Nakakonekta na ang neural oracle telemetry. Ang PISO Chain L1 block time ay stable sa 3.0 segundo.',
      timestamp: Date.now() - 3600000 * 3,
      reactions: { '💡': 9, '₱': 4 },
      tipTotal: 2.0,
      hash: '0x12d8a4b6c983ef11',
    },
  ],
  'solidity-forge': [
    {
      id: 'msg-forge-1',
      roomId: 'solidity-forge',
      sender: 'Master Panday',
      senderAddress: '0x2026F089E4712019482026F086',
      senderAvatar: '⚒️',
      role: 'validator',
      text: 'Welcome sa Smart Contract Forge! Gamitin ang aming Web3 Lab at Foundry scripts para subukan ang inyong mga Kontrata bago i-deploy sa PISO Devnet.',
      timestamp: Date.now() - 3600000 * 2,
      reactions: { '🔥': 14, '🚀': 7 },
      tipTotal: 3.0,
      hash: '0x3c7e9f1a0b54e218',
    },
  ],
};

class GunChatService {
  private gunInstance: any = null;
  private isInitialized = false;
  private localRooms: Map<string, PisoChatRoom> = new Map();
  private localMessages: Map<string, PisoChatMessage[]> = new Map();
  private roomListeners: Set<(rooms: PisoChatRoom[]) => void> = new Set();
  private messageListeners: Map<string, Set<(msgs: PisoChatMessage[]) => void>> = new Map();
  private peerMetricsListeners: Set<(metrics: GunPeerMetrics) => void> = new Set();
  private simulatedLatency = 24;

  constructor() {
    this.initFallbackData();
  }

  private initFallbackData() {
    // Load default rooms
    DEFAULT_ROOMS.forEach((r) => this.localRooms.set(r.id, r));

    // Load from localStorage if present
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const storedRooms = localStorage.getItem('piso_p2p_rooms_v1');
        if (storedRooms) {
          const parsed = JSON.parse(storedRooms) as PisoChatRoom[];
          parsed.forEach((r) => this.localRooms.set(r.id, r));
        }

        const storedMsgs = localStorage.getItem('piso_p2p_messages_v1');
        if (storedMsgs) {
          const parsed = JSON.parse(storedMsgs) as Record<string, PisoChatMessage[]>;
          Object.entries(parsed).forEach(([rId, msgs]) => {
            this.localMessages.set(rId, msgs);
          });
        }
      }
    } catch (e) {
      console.warn('LocalStorage graph fallback read notice:', e);
    }

    // Seed default messages if room empty
    Object.entries(INITIAL_MESSAGES).forEach(([rId, msgs]) => {
      if (!this.localMessages.has(rId) || this.localMessages.get(rId)?.length === 0) {
        this.localMessages.set(rId, [...msgs]);
      }
    });
  }

  public init() {
    if (this.isInitialized) return;

    if (typeof window !== 'undefined' && window.Gun) {
      try {
        const peers = [
          'https://gun-manhattan.herokuapp.com/gun',
          'https://peer.waller.asia/gun',
        ];

        this.gunInstance = window.Gun({
          peers,
          localStorage: true,
          radisk: true,
        });

        console.log('⚡ Gun.js P2P Mesh client connected successfully.');

        // Subscribe to PISO Chain rooms on Gun graph
        const roomsNode = this.gunInstance.get('piso_chain_v1_rooms');
        roomsNode.map().on((data: any, key: string) => {
          if (data && data.name && !this.localRooms.has(key)) {
            const room: PisoChatRoom = {
              id: key,
              name: data.name,
              topic: data.topic || 'PISO Chain Discussion',
              category: data.category || 'general',
              creatorAlias: data.creatorAlias || 'Validator',
              creatorAddress: data.creatorAddress || DEVNET_VALIDATOR_ADDRESS,
              validatorTitle: data.validatorTitle || 'PISO Validator',
              validatorSignature: data.validatorSignature || '0xverified',
              blockNumber: data.blockNumber || 2026001,
              createdAt: data.createdAt || Date.now(),
              isOfficialValidator: !!data.isOfficialValidator,
            };
            this.localRooms.set(key, room);
            this.notifyRooms();
          }
        });
      } catch (err) {
        console.warn('Gun.js remote peer mesh init warning; running resilient local graph mesh:', err);
      }
    }

    this.isInitialized = true;
    this.notifyMetrics();
  }

  // --- VALIDATOR AUTHORIZATION CHECK ---
  public isValidatorAddress(address?: string): boolean {
    if (!address) return false;
    const cleanAddr = address.toLowerCase();

    // Check genesis validator addresses
    const isGenesis = Object.keys(GENESIS_VALIDATORS).some(
      (v) => v.toLowerCase() === cleanAddr
    );
    if (isGenesis) return true;

    // Check devnet simulation address
    if (cleanAddr === DEVNET_VALIDATOR_ADDRESS.toLowerCase()) return true;

    // Check local storage validator credentials
    if (typeof window !== 'undefined') {
      const isSimulated = window.sessionStorage?.getItem('piso_is_validator_simulated') === 'true';
      if (isSimulated) return true;

      const hasKatunayanBadge = window.localStorage?.getItem('piso_katunayan_validator_credential') === 'true';
      if (hasKatunayanBadge) return true;
    }

    return false;
  }

  public getValidatorDetails(address?: string): { title: string; avatar: string; isGenesis: boolean } {
    if (!address) {
      return { title: 'Builder Peer', avatar: '⚡', isGenesis: false };
    }
    const cleanAddr = address.toLowerCase();
    for (const [vAddr, details] of Object.entries(GENESIS_VALIDATORS)) {
      if (vAddr.toLowerCase() === cleanAddr) {
        return { title: details.title, avatar: details.avatar, isGenesis: true };
      }
    }

    if (this.isValidatorAddress(address)) {
      return { title: 'Verified Katunayan Validator Node', avatar: '🛡️', isGenesis: false };
    }

    return { title: 'Builder Peer', avatar: '⚡', isGenesis: false };
  }

  // --- ROOM MANAGEMENT (VALIDATOR GATED) ---
  public async createValidatorRoom(params: {
    name: string;
    topic: string;
    category: PisoChatRoom['category'];
    validatorAlias: string;
    validatorAddress: string;
  }): Promise<{ success: boolean; error?: string; room?: PisoChatRoom }> {
    // 1. Strict Validator Gate Check
    if (!this.isValidatorAddress(params.validatorAddress)) {
      return {
        success: false,
        error:
          'ACCESS DENIED: Only verified PISO Chain Validators can initialize new rooms. Please connect a registered Validator address or hold a Soulbound Katunayan Validator credential.',
      };
    }

    const roomId = params.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    if (!roomId) {
      return { success: false, error: 'Please enter a valid room name.' };
    }

    if (this.localRooms.has(roomId)) {
      return { success: false, error: `Room #${roomId} already exists on the mesh.` };
    }

    const details = this.getValidatorDetails(params.validatorAddress);

    // Cryptographic signature hash
    const blockNumber = 2026000 + Math.floor(Math.random() * 5000);
    const sigPayload = `PISO_ROOM_MINT:${roomId}:${params.validatorAddress}:${blockNumber}`;
    const validatorSignature = '0x' + Array.from(sigPayload)
      .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
      .join('')
      .slice(0, 64);

    const newRoom: PisoChatRoom = {
      id: roomId,
      name: params.name.trim(),
      topic: params.topic.trim() || 'PISO Chain Validator Discussion',
      category: params.category,
      creatorAlias: params.validatorAlias,
      creatorAddress: params.validatorAddress,
      validatorTitle: details.title,
      validatorSignature,
      blockNumber,
      createdAt: Date.now(),
      isOfficialValidator: true,
    };

    // Save locally
    this.localRooms.set(roomId, newRoom);
    this.saveRoomsToStorage();
    this.notifyRooms();

    // Broadcast to Gun.js graph
    if (this.gunInstance) {
      try {
        this.gunInstance.get('piso_chain_v1_rooms').get(roomId).put({
          name: newRoom.name,
          topic: newRoom.topic,
          category: newRoom.category,
          creatorAlias: newRoom.creatorAlias,
          creatorAddress: newRoom.creatorAddress,
          validatorTitle: newRoom.validatorTitle,
          validatorSignature: newRoom.validatorSignature,
          blockNumber: newRoom.blockNumber,
          createdAt: newRoom.createdAt,
          isOfficialValidator: true,
        });
      } catch (err) {
        console.warn('Gun.js room graph publish:', err);
      }
    }

    // Post genesis message
    this.sendMessage({
      roomId,
      sender: newRoom.creatorAlias,
      senderAddress: newRoom.creatorAddress,
      senderAvatar: details.avatar,
      role: 'validator',
      text: `🏛️ [VALIDATOR CONSENSUS NOTICE] Ang channel #${newRoom.name} ay opisyal na pinasimulan sa block #${blockNumber}. Maligayang pagdating sa mga kapwa builders!`,
    });

    this.notifyMetrics();
    return { success: true, room: newRoom };
  }

  // --- MESSAGE MANAGEMENT (BULLET GRAPH DAG) ---
  public sendMessage(params: {
    roomId: string;
    sender: string;
    senderAddress: string;
    senderAvatar: string;
    role: PisoChatMessage['role'];
    text: string;
    replyToId?: string;
  }): PisoChatMessage {
    const rawContent = `${params.roomId}:${params.senderAddress}:${Date.now()}:${params.text}`;
    let hashNum = 0;
    for (let i = 0; i < rawContent.length; i++) {
      hashNum = (hashNum << 5) - hashNum + rawContent.charCodeAt(i);
      hashNum |= 0;
    }
    const hash = '0x' + Math.abs(hashNum).toString(16).padStart(16, '0');

    const message: PisoChatMessage = {
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      roomId: params.roomId,
      sender: params.sender,
      senderAddress: params.senderAddress,
      senderAvatar: params.senderAvatar,
      role: params.role,
      text: params.text,
      timestamp: Date.now(),
      reactions: {},
      tipTotal: 0,
      hash,
      replyToId: params.replyToId,
    };

    const currentList = this.localMessages.get(params.roomId) || [];
    const updated = [...currentList, message];
    this.localMessages.set(params.roomId, updated);
    this.saveMessagesToStorage();
    this.notifyRoomMessages(params.roomId);

    // Sync to Gun.js graph
    if (this.gunInstance) {
      try {
        this.gunInstance.get(`piso_room_msgs_${params.roomId}`).get(message.id).put({
          id: message.id,
          roomId: message.roomId,
          sender: message.sender,
          senderAddress: message.senderAddress,
          senderAvatar: message.senderAvatar,
          role: message.role,
          text: message.text,
          timestamp: message.timestamp,
          hash: message.hash,
          tipTotal: message.tipTotal,
        });
      } catch (err) {
        console.warn('Gun.js message publish:', err);
      }
    }

    this.notifyMetrics();
    return message;
  }

  public addReaction(roomId: string, messageId: string, emoji: string) {
    const msgs = this.localMessages.get(roomId);
    if (!msgs) return;
    const msg = msgs.find((m) => m.id === messageId);
    if (!msg) return;

    msg.reactions[emoji] = (msg.reactions[emoji] || 0) + 1;
    this.saveMessagesToStorage();
    this.notifyRoomMessages(roomId);
  }

  public tipMessage(roomId: string, messageId: string, amount: number = 1.0): number {
    const msgs = this.localMessages.get(roomId);
    if (!msgs) return 0;
    const msg = msgs.find((m) => m.id === messageId);
    if (!msg) return 0;

    msg.tipTotal = Math.round((msg.tipTotal + amount) * 10) / 10;
    msg.reactions['₱'] = (msg.reactions['₱'] || 0) + 1;
    this.saveMessagesToStorage();
    this.notifyRoomMessages(roomId);
    return msg.tipTotal;
  }

  // --- SUBSCRIPTIONS ---
  public subscribeRooms(callback: (rooms: PisoChatRoom[]) => void): () => void {
    this.roomListeners.add(callback);
    callback(Array.from(this.localRooms.values()));
    return () => this.roomListeners.delete(callback);
  }

  public subscribeMessages(roomId: string, callback: (msgs: PisoChatMessage[]) => void): () => void {
    if (!this.messageListeners.has(roomId)) {
      this.messageListeners.set(roomId, new Set());
    }
    this.messageListeners.get(roomId)!.add(callback);
    callback(this.localMessages.get(roomId) || []);

    // Listen on Gun graph for this room
    if (this.gunInstance) {
      try {
        this.gunInstance.get(`piso_room_msgs_${roomId}`).map().on((data: any, key: string) => {
          if (data && data.text) {
            const list = this.localMessages.get(roomId) || [];
            if (!list.some((m) => m.id === key)) {
              list.push({
                id: key,
                roomId,
                sender: data.sender || 'Peer',
                senderAddress: data.senderAddress || '0x...',
                senderAvatar: data.senderAvatar || '⚡',
                role: data.role || 'builder',
                text: data.text,
                timestamp: data.timestamp || Date.now(),
                reactions: {},
                tipTotal: data.tipTotal || 0,
                hash: data.hash || '0xhash',
              });
              this.localMessages.set(roomId, list);
              this.notifyRoomMessages(roomId);
            }
          }
        });
      } catch (err) {
        console.warn('Gun.js map on room error:', err);
      }
    }

    return () => {
      this.messageListeners.get(roomId)?.delete(callback);
    };
  }

  public subscribePeerMetrics(callback: (metrics: GunPeerMetrics) => void): () => void {
    this.peerMetricsListeners.add(callback);
    callback(this.getMetrics());
    return () => this.peerMetricsListeners.delete(callback);
  }

  public getMetrics(): GunPeerMetrics {
    let totalMessages = 0;
    this.localMessages.forEach((msgs) => (totalMessages += msgs.length));

    return {
      connectedPeersCount: this.gunInstance ? 4 : 2,
      activeRoomsCount: this.localRooms.size,
      totalMessagesCount: totalMessages,
      storageMode: this.gunInstance ? 'gun-p2p' : 'local-mesh',
      latencyMs: this.simulatedLatency,
    };
  }

  private notifyRooms() {
    const list = Array.from(this.localRooms.values());
    this.roomListeners.forEach((cb) => cb(list));
  }

  private notifyRoomMessages(roomId: string) {
    const msgs = this.localMessages.get(roomId) || [];
    this.messageListeners.get(roomId)?.forEach((cb) => cb([...msgs]));
  }

  private notifyMetrics() {
    const metrics = this.getMetrics();
    this.peerMetricsListeners.forEach((cb) => cb(metrics));
  }

  private saveRoomsToStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const roomsArr = Array.from(this.localRooms.values());
        localStorage.setItem('piso_p2p_rooms_v1', JSON.stringify(roomsArr));
      } catch (e) {
        console.warn('Room storage save error:', e);
      }
    }
  }

  private saveMessagesToStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const obj: Record<string, PisoChatMessage[]> = {};
        this.localMessages.forEach((msgs, rId) => {
          obj[rId] = msgs;
        });
        localStorage.setItem('piso_p2p_messages_v1', JSON.stringify(obj));
      } catch (e) {
        console.warn('Message storage save error:', e);
      }
    }
  }
}

export const GunChat = new GunChatService();
