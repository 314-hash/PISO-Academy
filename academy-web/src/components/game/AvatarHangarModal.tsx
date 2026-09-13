import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useAcademy, AvatarSkinId, HumanAvatarConfig, safeHexColor } from '../../context/AcademyContext';
import { SoundFX } from '../../services/soundFX';
import {
  createHumanoidCharacter,
  createPetDroneCompanion,
  PetDroneInstance,
} from './CharacterMeshBuilder';
import { GlbAvatarStudioTab } from './GlbAvatarStudioTab';
import {
  Rocket,
  User,
  ShieldCheck,
  Zap,
  Sparkles,
  Check,
  X,
  Award,
  Palette,
  Scissors,
  Shirt,
  Eye,
  Upload,
  Play,
  Pause,
  Trash2,
  RefreshCw,
  Wand2,
  Crown,
  Image as ImageIcon,
  ShoppingBag,
  Tag,
  Gavel,
  Coins,
  Clock,
  ArrowUpRight,
  Package,
  Flame,
  AlertCircle,
  CheckCircle2,
  Bot,
} from 'lucide-react';
import {
  FILIPINO_ITEMS,
  RARITY_CONFIG,
  ItemRarity,
  ItemSlot,
  EQUIP_ALL_PRESET,
} from '../../data/filipinoCultureItems';
import {
  PisoEconomyService,
  OnChainWeaponGear,
  OnChainRelic,
  P2PAuctionListing,
} from '../../services/pisoEconomyService';
import {
  ElementalCombatEngine,
  ElementalMaterial,
  ElementalCategory,
} from '../../services/ElementalCombatEngine';

interface DroneSkinData {
  id: AvatarSkinId;
  name: string;
  tagline: string;
  avatar: string;
  hullColor: string;
  glowColor: string;
  perk: string;
  speedRating: number;
  agilityRating: number;
  armorRating: number;
  lore: string;
}

export const DRONE_SKINS: DroneSkinData[] = [
  {
    id: 'agila',
    name: 'Agila Recon Mk-1',
    tagline: 'Standard Issue PISO Builder Recon Drone',
    avatar: '🛸',
    hullColor: 'from-blue-600 to-cyan-500',
    glowColor: '#06B6D4',
    perk: 'Balanced Handling & Precision Targeting',
    speedRating: 4,
    agilityRating: 5,
    armorRating: 3,
    lore: 'Ang opisyal na explorer drone ng New Manila. Ginawa gamit ang magaan na aero-graphene chassis at dual ion plasma micro-thrusters.',
  },
  {
    id: 'panday',
    name: 'Panday Forge Heavy Drone',
    tagline: 'Solidity Blacksmith Reinforced Chassis',
    avatar: '⚒️',
    hullColor: 'from-amber-600 to-orange-700',
    glowColor: '#F59E0B',
    perk: '+10% Bonus XP sa Smart Contract Lab Challenges',
    speedRating: 3,
    agilityRating: 3,
    armorRating: 5,
    lore: 'Pinanday sa ilalim ng matinding init ng EVM bytecode. Nababalutan ng molten obsidian armor na hindi tinatablan ng reentrancy attacks.',
  },
  {
    id: 'babaylan',
    name: 'Babaylan Astral Core',
    tagline: 'Verifiable AI Oracle Levitating Prism',
    avatar: '🔮',
    hullColor: 'from-purple-600 to-fuchsia-600',
    glowColor: '#A855F7',
    perk: '+10% Bonus XP sa Lahat ng Lesson Quizzes',
    speedRating: 4,
    agilityRating: 4,
    armorRating: 3,
    lore: 'Lumulutang na amethyst crystal core na pinalilibutan ng sinaunang Baybayin rune rings. Direktang nakakunekta sa AI precompile 0x...1009.',
  },
  {
    id: 'jeepney',
    name: 'Bayani Cyber-Jeepney 2090',
    tagline: 'Iconic Philippine King of the Road',
    avatar: '⚡',
    hullColor: 'from-yellow-500 to-red-600',
    glowColor: '#EAB308',
    perk: '+15% Maximum Flight Cruise Velocity (Warp Speed)',
    speedRating: 5,
    agilityRating: 4,
    armorRating: 4,
    lore: 'Ang walang-kamatayang simbolo ng transportasyon ng Pilipino, muling binuhay bilang hovercraft na may stainless chrome finish at neon ilaw ng araw.',
  },
  {
    id: 'sentinel',
    name: 'AI Sentinel Stealth 2090',
    tagline: 'Autonomous Security Auditor Drone',
    avatar: '🤖',
    hullColor: 'from-slate-700 to-rose-900',
    glowColor: '#EF4444',
    perk: 'Ultrasonic Radar Range & Proximity Detection',
    speedRating: 5,
    agilityRating: 5,
    armorRating: 2,
    lore: 'Matte carbon fiber stealth interceptor na may crimson laser visor. Dinisenyo upang maghanap ng smart contract vulnerabilities sa buong network.',
  },
];

// AI Avatar Preset Definitions
const AI_PRESETS = [
  {
    id: 'datu-founder',
    name: '👑 Datu Sovereign (PISO Founder)',
    icon: '₱',
    prompt: 'PISO Chain Founder — 8-ray Philippine sun halo, 3 gold stars, ₱ chest crest, dual-tone cape, long wavy locks, companion recon drone',
    traits: {
      name: 'Datu Sovereign (PISO Chain Founder)',
      gender: 'male' as const,
      outfit: 'founderArmor' as const,
      hairStyle: 'datuLongWavy' as const,
      hairColor: '#0B0F17',
      skinTone: '#8D5524',
      accessory: 'pisoSunCrest' as const,
      backCrest: 'philippineSunStars' as const,
      cape: 'founderCape' as const,
      hasBeard: true,
      auraColor: '#F59E0B',
      petDrone: {
        enabled: true,
        skin: 'panday' as const,
        auraColor: '#F59E0B',
      },
    },
  },
  {
    id: 'maria-clara',
    name: '🌸 Maria Clara 2090 (Katunayan Certificate Exam)',
    icon: '🌸',
    prompt: 'Maria Clara 2090 — Katunayan Soulbound Certificate Exam, Filipino cyber-terno butterfly sleeves, high coiled bun, Sampaguita gold hairpin, Wings of Katunayan',
    traits: {
      name: 'Maria Clara 2090 (Katunayan Scholar)',
      gender: 'female' as const,
      outfit: 'mariaClaraCyber' as const,
      hairStyle: 'mariaClaraBun' as const,
      hairColor: '#0B0F17',
      skinTone: '#C68642',
      accessory: 'sampaguitaPin' as const,
      backCrest: 'wingsOfKatunayan' as const,
      cape: 'none' as const,
      hasBeard: false,
      auraColor: '#06B6D4',
      petDrone: {
        enabled: true,
        skin: 'agila' as const,
        auraColor: '#06B6D4',
      },
    },
  },
  {
    id: 'urduja',
    name: '⚔️ Prinsesa Urduja (Genesis Pioneer Project)',
    icon: '⚔️',
    prompt: 'Prinsesa Urduja — Genesis Pioneer Project, Segmented gold & crimson warrior cuirass, warrior high ponytail, Diwata royal tiara, 8-ray sun halo',
    traits: {
      name: 'Prinsesa Urduja (Genesis Pioneer)',
      gender: 'female' as const,
      outfit: 'urdujaArmor' as const,
      hairStyle: 'urdujaPonytail' as const,
      hairColor: '#0B0F17',
      skinTone: '#8D5524',
      accessory: 'diwataCrown' as const,
      backCrest: 'philippineSunStars' as const,
      cape: 'founderCape' as const,
      hasBeard: false,
      auraColor: '#DC2626',
      petDrone: {
        enabled: true,
        skin: 'sentinel' as const,
        auraColor: '#EF4444',
      },
    },
  },
  {
    id: 'babaylan-oracle',
    name: '🔮 Babaylan Maya (AI Oracle Track Exam)',
    icon: '🔮',
    prompt: 'Babaylan Maya — AI-Web3 Agent Track Exam, Floating Baybayin rune belt, glowing levitating AI oracle prism, Diwata flowing locks, Baybayin face glyphs',
    traits: {
      name: 'Babaylan Maya (AI Oracle)',
      gender: 'female' as const,
      outfit: 'babaylanOracle' as const,
      hairStyle: 'diwataLocks' as const,
      hairColor: '#A855F7',
      skinTone: '#E0AC69',
      accessory: 'baybayinTattoo' as const,
      backCrest: 'cyberRings' as const,
      cape: 'energyCape' as const,
      hasBeard: false,
      auraColor: '#A855F7',
      petDrone: {
        enabled: true,
        skin: 'babaylan' as const,
        auraColor: '#A855F7',
      },
    },
  },
  {
    id: 'panday-master',
    name: '⚒️ Master Panday (Solidity Track Exam)',
    icon: '⚒️',
    prompt: 'Master Panday — Solidity Engineering Track Exam, Heavy EVM forge apron with glowing copper coils, topknot, PISO seal medallion',
    traits: {
      name: 'Master Panday (Solidity Blacksmith)',
      gender: 'male' as const,
      outfit: 'pandayBlacksmith' as const,
      hairStyle: 'topknot' as const,
      hairColor: '#334155',
      skinTone: '#8D5524',
      accessory: 'pisoPendant' as const,
      backCrest: 'philippineSunStars' as const,
      cape: 'none' as const,
      hasBeard: true,
      auraColor: '#F59E0B',
      petDrone: {
        enabled: true,
        skin: 'panday' as const,
        auraColor: '#F59E0B',
      },
    },
  },
  {
    id: 'bayanihan-guardian',
    name: '💧 Bayanihan Guardian (Faucet & DAO Project)',
    icon: '💧',
    prompt: 'Bayanihan Guardian — Bayanihan Faucet & Testnet DAO Project, Dual cyan coolant energy tubes, cyber bob, AR visor',
    traits: {
      name: 'Bayanihan Guardian (DAO Engineer)',
      gender: 'female' as const,
      outfit: 'bayanihanGuardian' as const,
      hairStyle: 'cyberBob' as const,
      hairColor: '#06B6D4',
      skinTone: '#C68642',
      accessory: 'cyberVisor' as const,
      backCrest: 'cyberRings' as const,
      cape: 'none' as const,
      hasBeard: false,
      auraColor: '#06B6D4',
      petDrone: {
        enabled: true,
        skin: 'jeepney' as const,
        auraColor: '#EAB308',
      },
    },
  },
  {
    id: 'katipunero',
    name: '🇵🇭 Cyber Katipunero',
    icon: '🇵🇭',
    prompt: 'Katipunero Cyber-Warrior 2090 — Red bandana, cyber visor, white barong techwear',
    traits: {
      name: 'Cyber Katipunero',
      gender: 'male' as const,
      outfit: 'katipunanTech' as const,
      hairStyle: 'cyberFade' as const,
      hairColor: '#18181B',
      skinTone: '#8D5524',
      accessory: 'cyberVisor' as const,
      auraColor: '#DC2626',
    },
  },
  {
    id: 'android',
    name: '🤖 Autonomous Android',
    icon: '🤖',
    prompt: 'PISO Network Sentinel — Chrome skin, undercut, holo mask',
    traits: {
      name: 'Autonomous Android',
      gender: 'android' as const,
      outfit: 'barongCyber' as const,
      hairStyle: 'undercut' as const,
      hairColor: '#94A3B8',
      skinTone: '#64748B',
      accessory: 'holoMask' as const,
      auraColor: '#3B82F6',
    },
  },
];

// Procedural Full-Body Humanoid 3D Canvas Preview with Live Walking Rig
interface HumanoidPreviewCanvasProps {
  config: HumanAvatarConfig;
  isWalking: boolean;
}

const HumanoidPreviewCanvas: React.FC<HumanoidPreviewCanvasProps> = ({ config, isWalking }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 320;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0A0E17);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 1.25, 4.0);
    camera.lookAt(0, 1.05, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // Studio 3-point illumination
    const amb = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(amb);
    const light1 = new THREE.DirectionalLight(0xf59e0b, 2.2);
    light1.position.set(3, 5, 3);
    scene.add(light1);
    const light2 = new THREE.DirectionalLight(0x3b82f6, 1.8);
    light2.position.set(-3, 2, -2);
    scene.add(light2);
    const rimLight = new THREE.PointLight(0x06b6d4, 2.0, 10);
    rimLight.position.set(0, 2.5, -2);
    scene.add(rimLight);

    // Humanoid Root Group
    const humanGroup = new THREE.Group();
    scene.add(humanGroup);

    // High fidelity procedural 3D Humanoid character matching PISO Founder
    const character = createHumanoidCharacter(config);
    humanGroup.add(character.rootGroup);

    // Companion Pet Recon Drone hovering near the avatar in preview
    let petDrone: PetDroneInstance | null = null;
    if (config?.petDrone?.enabled !== false) {
      petDrone = createPetDroneCompanion(
        config?.petDrone?.skin || 'panday',
        config?.petDrone?.auraColor || config?.auraColor || '#F59E0B'
      );
      humanGroup.add(petDrone.group);
    }

    // Orbit Drag Interaction
    let isDragging = false;
    let prevX = 0;
    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevX = e.clientX;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const dx = e.clientX - prevX;
        humanGroup.rotation.y += dx * 0.015;
        prevX = e.clientX;
      }
    };
    const onMouseUp = () => (isDragging = false);

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Animation Clock & Rigged Walk Cycle
    let animId: number;
    let walkPhase = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      if (isWalking) {
        walkPhase += delta * 7.5;
      }
      character.updateAnimation(walkPhase, isWalking, delta, time);

      if (petDrone) {
        petDrone.updateFollow(new THREE.Vector3(0, 0, 0), 0, time, delta);
      }

      if (!isDragging) {
        humanGroup.rotation.y += 0.006;
      }
      renderer.render(scene, camera);
    };
    animate();

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        if (cr.width > 0 && cr.height > 0) {
          camera.aspect = cr.width / cr.height;
          camera.updateProjectionMatrix();
          renderer.setSize(cr.width, cr.height);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [config, isWalking]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full cursor-grab active:cursor-grabbing relative overflow-hidden rounded-xl"
      style={{ minHeight: '260px' }}
    />
  );
};

interface AvatarHangarModalProps {
  onClose: () => void;
  initialTab?: 'human' | 'pinoy' | 'drone' | 'inventory' | 'glb';
}

export const AvatarHangarModal: React.FC<AvatarHangarModalProps> = ({ onClose, initialTab = 'pinoy' }) => {
  const {
    avatarSkin,
    setAvatarSkin,
    avatarMode,
    setAvatarMode,
    humanAvatar,
    setHumanAvatar,
    setNotification,
    setActiveView,
    avatarNft,
    wallet,
  } = useAcademy();

  const [activeTab, setActiveTab] = useState<'human' | 'pinoy' | 'drone' | 'inventory' | 'glb'>(initialTab || 'pinoy');
  const [inventorySubTab, setInventorySubTab] = useState<'gear' | 'bidding' | 'elements'>('gear');
  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'weapons' | 'relics' | 'blocks'>('all');
  const [rarityFilter, setRarityFilter] = useState<'all' | ItemRarity>('all');
  const [slotFilter, setSlotFilter] = useState<'all' | ItemSlot>('all');
  const [localHuman, setLocalHuman] = useState<HumanAvatarConfig>(humanAvatar);
  const [isWalkingPreview, setIsWalkingPreview] = useState<boolean>(true);
  const [customPrompt, setCustomPrompt] = useState<string>(localHuman.aiPrompt || '');
  const [isAnalyzingImage, setIsAnalyzingImage] = useState<boolean>(false);

  // Inventory & Bidding Marketplace State
  const [ownedWeapons, setOwnedWeapons] = useState<OnChainWeaponGear[]>(PisoEconomyService.getWeapons());
  const [ownedRelics, setOwnedRelics] = useState<OnChainRelic[]>(PisoEconomyService.getRelics());
  const [liveAuctions, setLiveAuctions] = useState<P2PAuctionListing[]>(PisoEconomyService.getAuctions());
  const [spendablePiso, setSpendablePiso] = useState<number>(PisoEconomyService.getSpendablePiso());

  // Elemental Monster Drops & $PISO Swap State
  const [elementalMaterials, setElementalMaterials] = useState<Record<string, ElementalMaterial>>(
    ElementalCombatEngine.getInventoryMaterials()
  );
  const [elementFilter, setElementFilter] = useState<'all' | ElementalCategory>('all');

  // Auction Creation Modal State
  const [auctioningItem, setAuctioningItem] = useState<{
    name: string;
    category: P2PAuctionListing['itemCategory'];
    icon: string;
    rarity: P2PAuctionListing['rarity'];
  } | null>(null);
  const [startBidInput, setStartBidInput] = useState<number>(150);
  const [buyoutInput, setBuyoutInput] = useState<number>(450);
  const [durationInput, setDurationInput] = useState<number>(60);

  useEffect(() => {
    const handleEconomyUpdate = () => {
      setOwnedWeapons(PisoEconomyService.getWeapons());
      setOwnedRelics(PisoEconomyService.getRelics());
      setLiveAuctions(PisoEconomyService.getAuctions());
      setSpendablePiso(PisoEconomyService.getSpendablePiso());
      setElementalMaterials(ElementalCombatEngine.getInventoryMaterials());
    };
    window.addEventListener('piso-farming-stats-updated', handleEconomyUpdate);
    window.addEventListener('piso-tokens-deducted', handleEconomyUpdate);
    window.addEventListener('piso-activity-earned', handleEconomyUpdate);
    window.addEventListener('piso-weapon-won', handleEconomyUpdate);
    window.addEventListener('piso-relic-updated', handleEconomyUpdate);
    window.addEventListener('piso-auction-created', handleEconomyUpdate);
    window.addEventListener('piso-bid-placed', handleEconomyUpdate);
    window.addEventListener('piso-auction-sold', handleEconomyUpdate);
    window.addEventListener('piso-materials-updated', handleEconomyUpdate);
    window.addEventListener('piso-material-acquired', handleEconomyUpdate);
    window.addEventListener('piso-material-swapped', handleEconomyUpdate);
    window.addEventListener('piso-all-materials-swapped', handleEconomyUpdate);
    return () => {
      window.removeEventListener('piso-farming-stats-updated', handleEconomyUpdate);
      window.removeEventListener('piso-tokens-deducted', handleEconomyUpdate);
      window.removeEventListener('piso-activity-earned', handleEconomyUpdate);
      window.removeEventListener('piso-weapon-won', handleEconomyUpdate);
      window.removeEventListener('piso-relic-updated', handleEconomyUpdate);
      window.removeEventListener('piso-auction-created', handleEconomyUpdate);
      window.removeEventListener('piso-bid-placed', handleEconomyUpdate);
      window.removeEventListener('piso-auction-sold', handleEconomyUpdate);
      window.removeEventListener('piso-materials-updated', handleEconomyUpdate);
      window.removeEventListener('piso-material-acquired', handleEconomyUpdate);
      window.removeEventListener('piso-material-swapped', handleEconomyUpdate);
      window.removeEventListener('piso-all-materials-swapped', handleEconomyUpdate);
    };
  }, []);

  // Handler: Swap single elemental material for $PISO tokens
  const handleSwapSingleMaterial = (materialId: string, count: number = 1) => {
    const res = ElementalCombatEngine.swapMaterialForPiso(materialId, count);
    if (res.success) {
      setElementalMaterials(ElementalCombatEngine.getInventoryMaterials());
      setSpendablePiso(PisoEconomyService.getSpendablePiso());
      setNotification({
        message: res.message,
        type: 'success',
      });
    } else {
      setNotification({
        message: res.message,
        type: 'error',
      });
    }
  };

  // Handler: 1-Click Swap All Materials for $PISO tokens (+10% bonus)
  const handleSwapAllMaterials = () => {
    const res = ElementalCombatEngine.swapAllMaterialsForPiso();
    if (res.success) {
      setElementalMaterials(ElementalCombatEngine.getInventoryMaterials());
      setSpendablePiso(PisoEconomyService.getSpendablePiso());
      setNotification({
        message: res.message,
        type: 'success',
      });
    } else {
      setNotification({
        message: res.message,
        type: 'info',
      });
    }
  };

  // 1. Suit Up (Isukat) on Avatar (Online & Idle)
  const handleSuitUp = (itemName: string, category?: string) => {
    PisoEconomyService.autoSuitItem(itemName, category);
    const updated = JSON.parse(localStorage.getItem('piso_human_avatar') || '{}');
    if (updated && Object.keys(updated).length > 0) {
      setLocalHuman(updated);
      setHumanAvatar(updated);
    }
    setAvatarMode('human');
    SoundFX.playLevelUp();
    setNotification({
      message: `👔 Isinuot sa avatar: "${itemName}"! Nakasukat na sa iyong hero (online at idle)!`,
      type: 'success',
    });
  };

  // 2. Sell Item for Fixed Price in $PISO
  const handleSellItem = (type: 'weapon' | 'relic' | 'block', id: number | string, count: number = 1) => {
    const res = PisoEconomyService.sellItemForPiso(type, id, count);
    if (res.success) {
      SoundFX.playCoins?.();
      setOwnedWeapons(PisoEconomyService.getWeapons());
      setOwnedRelics(PisoEconomyService.getRelics());
      setSpendablePiso(PisoEconomyService.getSpendablePiso());
      setNotification({
        message: `💰 Naibenta ang "${res.itemName}" sa halagang +${res.earnedPiso} $PISO!`,
        type: 'success',
      });
    }
  };

  // 3. Open Auction Creation Modal
  const handleOpenAuctionModal = (item: {
    name: string;
    category: P2PAuctionListing['itemCategory'];
    icon: string;
    rarity: P2PAuctionListing['rarity'];
  }) => {
    setAuctioningItem(item);
    setStartBidInput(150);
    setBuyoutInput(450);
    setDurationInput(60);
    SoundFX.playBlip();
  };

  // 4. Confirm Auction Listing
  const handleConfirmCreateAuction = () => {
    if (!auctioningItem) return;
    PisoEconomyService.createAuction(auctioningItem, startBidInput, buyoutInput, durationInput);
    setLiveAuctions(PisoEconomyService.getAuctions());
    setAuctioningItem(null);
    setInventorySubTab('bidding');
    SoundFX.playLevelUp();
    setNotification({
      message: `🔨 Inilista sa P2P Auction ang "${auctioningItem.name}" (Simulang Bid: ${startBidInput} $PISO)!`,
      type: 'success',
    });
  };

  // 5. Place Bid on Live Auction
  const handlePlaceBid = (auctionId: string, amount: number) => {
    const success = PisoEconomyService.placeBid(auctionId, amount);
    if (success) {
      SoundFX.playCoins?.();
      setLiveAuctions(PisoEconomyService.getAuctions());
      setSpendablePiso(PisoEconomyService.getSpendablePiso());
      setNotification({
        message: `🔨 Matagumpay na naglagay ng bid na ${amount} $PISO!`,
        type: 'success',
      });
    } else {
      SoundFX.playLaser?.();
      setNotification({
        message: `Kulang ang $PISO o mas mababa sa kasalukuyang bid!`,
        type: 'error',
      });
    }
  };

  // 6. Accept Auction Bid
  const handleAcceptBid = (auctionId: string) => {
    const res = PisoEconomyService.acceptAuctionBid(auctionId);
    if (res.success) {
      SoundFX.playLevelUp();
      setLiveAuctions(PisoEconomyService.getAuctions());
      setSpendablePiso(PisoEconomyService.getSpendablePiso());
      setNotification({
        message: `🎉 Panalo! Tinanggap ang bid para sa "${res.itemName}" (+${res.earnedPiso} $PISO)!`,
        type: 'success',
      });
    }
  };

  // 7. Cancel Auction
  const handleCancelAuction = (auctionId: string) => {
    PisoEconomyService.cancelAuction(auctionId);
    setLiveAuctions(PisoEconomyService.getAuctions());
    SoundFX.playClick();
    setNotification({
      message: `Ibinaba ang listahan sa merkado.`,
      type: 'info',
    });
  };

  const filteredPinoyItems = FILIPINO_ITEMS.filter((item) => {
    if (rarityFilter !== 'all' && item.rarity !== rarityFilter) return false;
    if (slotFilter !== 'all' && item.slot !== slotFilter) return false;
    return true;
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (humanAvatar) {
      setLocalHuman(humanAvatar);
      if (humanAvatar.aiPrompt) setCustomPrompt(humanAvatar.aiPrompt);
    }
  }, [humanAvatar]);

  const updateOption = (partial: Partial<HumanAvatarConfig>) => {
    const next = { ...localHuman, ...partial };
    setLocalHuman(next);
    setHumanAvatar(next);
    setAvatarMode('human');
    SoundFX.playBlip();
  };

  // Uploading Logic with Automatic Color Palette & Albedo Extraction
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzingImage(true);
    const reader = new FileReader();

    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      if (!dataUrl) {
        setIsAnalyzingImage(false);
        return;
      }

      // Sample pixels on an off-screen canvas
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = 64;
          canvas.height = 64;
          ctx.drawImage(img, 0, 0, 64, 64);
          const data = ctx.getImageData(0, 0, 64, 64).data;

          const toHex = (r: number, g: number, b: number) =>
            `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;

          // Sample center (face/skin)
          const fIdx = (32 * 64 + 32) * 4;
          const detectedSkin = toHex(data[fIdx], data[fIdx + 1], data[fIdx + 2]);

          // Sample top (hair)
          const hIdx = (10 * 64 + 32) * 4;
          const detectedHair = toHex(data[hIdx], data[hIdx + 1], data[hIdx + 2]);

          // Sample bottom center (torso outfit)
          const oIdx = (48 * 64 + 32) * 4;
          const detectedAura = toHex(data[oIdx], data[oIdx + 1], data[oIdx + 2]);

          updateOption({
            uploadedTextureUrl: dataUrl,
            uploadedFileName: file.name,
            skinTone: detectedSkin,
            hairColor: detectedHair,
            auraColor: detectedAura,
            aiPrompt: `AI 3D Reconstructed from upload: ${file.name}`,
          });

          setIsAnalyzingImage(false);
          SoundFX.playLevelUp();
          setNotification({
            message: `✨ AI Avatar Created! Analyzed palette and applied 3D chest texture from "${file.name}"!`,
            type: 'success',
          });
        }
      };
      img.onerror = () => setIsAnalyzingImage(false);
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleClearUpload = () => {
    updateOption({
      uploadedTextureUrl: '',
      uploadedFileName: '',
    });
    setNotification({
      message: 'Nai-reset ang uploaded custom texture.',
      type: 'info',
    });
  };

  // AI Prompt Generation Logic
  const handleApplyPreset = (preset: (typeof AI_PRESETS)[0]) => {
    setCustomPrompt(preset.prompt);
    updateOption({
      ...preset.traits,
      aiPrompt: preset.prompt,
    });
    SoundFX.playLevelUp();
    setNotification({
      message: `✨ AI Avatar Synthesized: ${preset.name}!`,
      type: 'success',
    });
  };

  const handleGenerateFromPrompt = () => {
    if (!customPrompt.trim()) return;

    const lower = customPrompt.toLowerCase();
    let gender: HumanAvatarConfig['gender'] = localHuman.gender || 'male';
    let outfit: HumanAvatarConfig['outfit'] = 'barongCyber';
    let hairStyle: HumanAvatarConfig['hairStyle'] = 'cyberFade';
    let accessory: HumanAvatarConfig['accessory'] = 'cyberVisor';
    let backCrest: HumanAvatarConfig['backCrest'] = 'none';
    let cape: HumanAvatarConfig['cape'] = 'none';
    let hasBeard = false;
    let auraColor = '#F59E0B';

    // Female keyword detection
    if (
      lower.includes('female') ||
      lower.includes('woman') ||
      lower.includes('girl') ||
      lower.includes('babae') ||
      lower.includes('maria clara') ||
      lower.includes('urduja') ||
      lower.includes('diwata') ||
      lower.includes('maya') ||
      lower.includes('prinsesa') ||
      lower.includes('reyna') ||
      lower.includes('terno') ||
      lower.includes('lady')
    ) {
      gender = 'female';
      hasBeard = false;
    } else if (lower.includes('male') || lower.includes('lalaki') || lower.includes('datu') || lower.includes('panday')) {
      gender = 'male';
    } else if (lower.includes('android') || lower.includes('robot') || lower.includes('cyborg')) {
      gender = 'android';
    }

    if (
      lower.includes('founder') ||
      lower.includes('datu') ||
      lower.includes('sovereign') ||
      lower.includes('piso chain') ||
      lower.includes('piso founder') ||
      lower.includes('hero')
    ) {
      gender = 'male';
      outfit = 'founderArmor';
      hairStyle = 'datuLongWavy';
      accessory = 'pisoSunCrest';
      backCrest = 'philippineSunStars';
      cape = 'founderCape';
      hasBeard = true;
      auraColor = '#F59E0B';
    } else if (
      lower.includes('katunayan') ||
      lower.includes('certificate') ||
      lower.includes('maria clara') ||
      lower.includes('terno') ||
      lower.includes('butterfly') ||
      lower.includes('soulbound')
    ) {
      gender = 'female';
      outfit = 'mariaClaraCyber';
      hairStyle = 'mariaClaraBun';
      accessory = 'sampaguitaPin';
      backCrest = 'wingsOfKatunayan';
      cape = 'none';
      hasBeard = false;
      auraColor = '#06B6D4';
    } else if (
      lower.includes('urduja') ||
      lower.includes('genesis') ||
      lower.includes('pioneer') ||
      lower.includes('warrior queen') ||
      lower.includes('amazon')
    ) {
      gender = 'female';
      outfit = 'urdujaArmor';
      hairStyle = 'urdujaPonytail';
      accessory = 'diwataCrown';
      backCrest = 'philippineSunStars';
      cape = 'founderCape';
      hasBeard = false;
      auraColor = '#DC2626';
    } else if (
      lower.includes('oracle') ||
      lower.includes('ai agent') ||
      lower.includes('babaylan') ||
      lower.includes('prism') ||
      lower.includes('rune') ||
      lower.includes('astral')
    ) {
      gender = 'female';
      outfit = 'babaylanOracle';
      hairStyle = 'diwataLocks';
      accessory = 'baybayinTattoo';
      backCrest = 'cyberRings';
      cape = 'energyCape';
      hasBeard = false;
      auraColor = '#A855F7';
    } else if (
      lower.includes('blacksmith') ||
      lower.includes('panday') ||
      lower.includes('solidity') ||
      lower.includes('forge') ||
      lower.includes('compiler') ||
      lower.includes('evm')
    ) {
      gender = 'male';
      outfit = 'pandayBlacksmith';
      hairStyle = 'topknot';
      accessory = 'pisoPendant';
      backCrest = 'philippineSunStars';
      cape = 'none';
      hasBeard = true;
      auraColor = '#F59E0B';
    } else if (
      lower.includes('bayanihan') ||
      lower.includes('faucet') ||
      lower.includes('dao') ||
      lower.includes('coolant') ||
      lower.includes('water')
    ) {
      gender = 'female';
      outfit = 'bayanihanGuardian';
      hairStyle = 'cyberBob';
      accessory = 'cyberVisor';
      backCrest = 'cyberRings';
      cape = 'none';
      hasBeard = false;
      auraColor = '#06B6D4';
    } else if (lower.includes('katipun') || lower.includes('red') || lower.includes('tactical')) {
      outfit = 'katipunanTech';
      hairStyle = 'cyberFade';
      accessory = 'cyberVisor';
      auraColor = '#DC2626';
    } else if (lower.includes('runner') || lower.includes('hoodie') || lower.includes('hacker') || lower.includes('street')) {
      outfit = 'manilaHoodie';
      hairStyle = 'braids';
      auraColor = '#06B6D4';
    } else if (lower.includes('android') || lower.includes('mecha') || lower.includes('chrome') || lower.includes('robot')) {
      gender = 'android';
      hairStyle = 'undercut';
      accessory = 'holoMask';
      auraColor = '#3B82F6';
    }

    if (gender === 'female') {
      hasBeard = false;
    }

    updateOption({
      gender,
      outfit,
      hairStyle,
      accessory,
      backCrest,
      cape,
      hasBeard,
      auraColor,
      aiPrompt: customPrompt,
    });

    SoundFX.playLevelUp();
    setNotification({
      message: `✨ AI Model Generated (${gender === 'female' ? 'Babae' : gender === 'android' ? 'Android' : 'Lalaki'}): "${customPrompt.slice(0, 30)}..."!`,
      type: 'success',
    });
  };

  const handleEquipDrone = (skin: DroneSkinData) => {
    SoundFX.playLevelUp();
    setAvatarSkin(skin.id);
    setAvatarMode('drone');
    setNotification({
      message: `🛸 Drone Frame Equipped & Activated in 3D World: "${skin.name}"!`,
      type: 'success',
    });
    onClose();
  };

  const handleSaveHumanAvatar = () => {
    SoundFX.playLevelUp();
    setHumanAvatar(localHuman);
    setAvatarMode('human');
    setNotification({
      message: `👤 Na-save at Aktibo na ang Full-Body Avatar: "${localHuman.name || 'Bayani Builder'}" sa 3D World!`,
      type: 'success',
    });
    onClose();
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key.toLowerCase() === 'e' || e.key === 'Enter') {
        e.preventDefault();
        handleSaveHumanAvatar();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        setActiveTab((prev) => (prev === 'human' ? 'drone' : 'human'));
        SoundFX.playClick();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [localHuman]);

  const handleOpenImg2Threejs = () => {
    SoundFX.playClick();
    onClose();
    setActiveView('img2threejs');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-5xl bg-[#0F172A] border-2 border-blue-500/70 rounded-2xl shadow-[0_0_50px_rgba(37,99,235,0.3)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* CRT Scanline */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-25 z-10" />

        {/* Top Header */}
        <div className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#161F30]/90">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-blue-600 flex items-center justify-center text-xl shadow-lg border border-white/20">
              {activeTab === 'human' ? '👤' : '🛸'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-[10px] font-black text-amber-400 uppercase tracking-wider px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/30">
                  AI 3D AVATAR FORGE
                </span>
                <span className="text-xs text-slate-400 font-mono">Full-Body Rig & Walking Engine</span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                {activeTab === 'human'
                  ? 'AI Humanoid 3D Avatar (Upload & Walking Rig)'
                  : activeTab === 'pinoy'
                  ? 'Mahiwagang Pinoy Culture Items & Superpowers'
                  : activeTab === 'drone'
                  ? 'Builder Drone Chassis Hangar'
                  : '🎒 Imbentaryo, Fixed Price Sell & P2P Bidding Market'}
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

        {/* Active In-Game World Form Selector Banner */}
        <div className="relative z-20 flex flex-wrap items-center justify-between px-6 py-2 bg-[#0A0F1D] border-b border-slate-800 text-xs font-mono">
          <div className="flex items-center space-x-2 text-slate-300">
            <span className="text-amber-400 font-bold">AKTIbong Anyo sa 3D Metaverse:</span>
            <span className="text-white font-bold">
              {avatarMode === 'custom_glb'
                ? `🤖 Custom 3D .GLB Model (Imported)`
                : avatarMode === 'human'
                ? `👤 ${localHuman?.name || 'Humanoid Builder'} (Full-Body Walking)`
                : `🛸 ${avatarSkin.toUpperCase()} Recon Drone (Hover Flight)`}
            </span>
          </div>

          <div className="flex items-center space-x-2 mt-1 sm:mt-0">
            <button
              onClick={() => {
                SoundFX.playClick();
                setAvatarMode('human');
                setNotification({ message: '👤 Activated Full-Body Walking Humanoid!', type: 'info' });
              }}
              className={`px-3 py-1 rounded-lg border flex items-center space-x-1.5 transition-all text-xs ${
                avatarMode === 'human'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>👤 Full-Body Humanoid (Walking)</span>
              {avatarMode === 'human' && <Check className="w-3 h-3 text-amber-400" />}
            </button>

            <button
              onClick={() => {
                SoundFX.playClick();
                setAvatarMode('custom_glb');
                setNotification({ message: '🤖 Activated 3D .GLB Avatar Model!', type: 'info' });
              }}
              className={`px-3 py-1 rounded-lg border flex items-center space-x-1.5 transition-all text-xs ${
                avatarMode === 'custom_glb'
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>🤖 3D .GLB Model</span>
              {avatarMode === 'custom_glb' && <Check className="w-3 h-3 text-cyan-400" />}
            </button>

            <button
              onClick={() => {
                SoundFX.playClick();
                setAvatarMode('drone');
                setNotification({ message: '🛸 Activated Drone Chassis!', type: 'info' });
              }}
              className={`px-3 py-1 rounded-lg border flex items-center space-x-1.5 transition-all text-xs ${
                avatarMode === 'drone'
                  ? 'bg-blue-500/20 border-blue-400 text-blue-300 font-bold shadow-[0_0_12px_rgba(59,130,246,0.25)]'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>🛸 Recon Drone</span>
              {avatarMode === 'drone' && <Check className="w-3 h-3 text-blue-400" />}
            </button>
          </div>
        </div>

        {/* Tab Switcher: Humanoid vs Pinoy vs Drone vs Inventory */}
        <div className="relative z-20 flex flex-wrap border-b border-slate-800 bg-[#0B0F17] px-6">
          <button
            onClick={() => {
              SoundFX.playClick();
              setActiveTab('inventory');
            }}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-mono font-bold transition-all border-b-2 ${
              activeTab === 'inventory'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-400/10'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <span>🎒 Imbentaryo, Benta & Bidding</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-black border border-emerald-500/40">
              ₱ P2P
            </span>
          </button>

          <button
            onClick={() => {
              SoundFX.playClick();
              setActiveTab('pinoy');
            }}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-mono font-bold transition-all border-b-2 ${
              activeTab === 'pinoy'
                ? 'border-purple-400 text-purple-400 bg-purple-400/10'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>🇵🇭 Pinoy Gear & Superpowers</span>
          </button>

          <button
            onClick={() => {
              SoundFX.playClick();
              setActiveTab('human');
            }}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-mono font-bold transition-all border-b-2 ${
              activeTab === 'human'
                ? 'border-amber-400 text-amber-400 bg-amber-400/10'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>👤 AI Humanoid Avatar</span>
          </button>

          <button
            onClick={() => {
              SoundFX.playClick();
              setActiveTab('glb');
            }}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-mono font-bold transition-all border-b-2 ${
              activeTab === 'glb'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-400/10'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Bot className="w-4 h-4 text-cyan-400" />
            <span>🤖 3D AI Model (.GLB)</span>
            <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-black border border-cyan-500/40">
              RPM / Meshy / Tripo
            </span>
          </button>

          <button
            onClick={() => {
              SoundFX.playClick();
              setActiveTab('drone');
            }}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-mono font-bold transition-all border-b-2 ${
              activeTab === 'drone'
                ? 'border-blue-400 text-blue-400 bg-blue-400/10'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Rocket className="w-4 h-4" />
            <span>🛸 Recon Drones</span>
          </button>

          <div className="ml-auto flex items-center py-1">
            <button
              onClick={() => {
                onClose();
                window.dispatchEvent(new CustomEvent('piso-open-character-creation'));
              }}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-cyan-500 hover:from-amber-400 hover:to-cyan-400 text-slate-950 font-black font-mono text-[11px] flex items-center space-x-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>✨ Lumikha ng Karakter / Avatar NFT</span>
            </button>
          </div>
        </div>

        {/* Content Body: Human Avatar Customizer */}
        {activeTab === 'human' && (
          <div className="relative z-20 flex-1 overflow-hidden flex flex-col md:flex-row">
            {/* Left 3D Humanoid Preview with Walking Rig Controls */}
            <div className="w-full md:w-84 border-b md:border-b-0 md:border-r border-slate-800 bg-[#070A10] relative flex flex-col items-center justify-between p-4 shrink-0">
              {/* Walking / Idle Mode Toggle Switch */}
              <div className="w-full flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-xl p-1.5 mb-2 font-mono text-[11px]">
                <span className="text-slate-400 text-[10px] pl-1 font-bold">ANIMATION RIG:</span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => {
                      SoundFX.playClick();
                      setIsWalkingPreview(true);
                    }}
                    className={`px-2.5 py-1 rounded-lg flex items-center space-x-1 font-bold transition-all ${
                      isWalkingPreview
                        ? 'bg-amber-400 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Walking</span>
                  </button>
                  <button
                    onClick={() => {
                      SoundFX.playClick();
                      setIsWalkingPreview(false);
                    }}
                    className={`px-2.5 py-1 rounded-lg flex items-center space-x-1 font-bold transition-all ${
                      !isWalkingPreview
                        ? 'bg-slate-700 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Pause className="w-3 h-3" />
                    <span>Idle</span>
                  </button>
                </div>
              </div>

              {/* 3D Humanoid Canvas */}
              <div className="w-full h-64 md:h-76 relative">
                <HumanoidPreviewCanvas config={localHuman} isWalking={isWalkingPreview} />
              </div>

              <div className="text-[10px] font-mono text-slate-500 text-center mt-1">
                I-drag upang paikutin ang 3D model (360° View)
              </div>

              {/* Uploaded Texture Status Badge */}
              {localHuman.uploadedTextureUrl && (
                <div className="mt-2 w-full p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-[10px] font-mono">
                  <div className="flex items-center space-x-2 truncate">
                    <img
                      src={localHuman.uploadedTextureUrl}
                      alt="Uploaded ref"
                      className="w-7 h-7 rounded-lg object-cover border border-amber-400 shrink-0"
                    />
                    <div className="truncate">
                      <span className="text-amber-300 font-bold block truncate">
                        {localHuman.uploadedFileName || 'Reference Texture'}
                      </span>
                      <span className="text-slate-400 text-[9px]">3D Chest Projection Synced</span>
                    </div>
                  </div>
                  <button
                    onClick={handleClearUpload}
                    title="Alisin ang uploaded texture"
                    className="p-1 rounded text-red-400 hover:bg-red-500/20"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Link to img2threejs Studio */}
              <div className="mt-2 w-full p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-center">
                <p className="text-[10px] text-purple-300 font-mono">
                  Gusto mo ba ng procedural asset sculpt?
                </p>
                <button
                  onClick={handleOpenImg2Threejs}
                  className="mt-1 px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-mono text-[10px] font-bold uppercase transition-all shadow-sm"
                >
                  Buksan ang img2threejs Studio
                </button>
              </div>
            </div>

            {/* Right Customization & Upload Controls */}
            <div className="flex-1 p-5 space-y-4 overflow-y-auto font-sans text-xs text-slate-300">
              {/* 0. PISO Avatar NFT On-Chain Identity Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/30 via-slate-900 to-cyan-950/30 border border-amber-500/40 shadow-lg space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono font-black text-[10px] uppercase tracking-wider flex items-center space-x-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>PISO AVATAR NFT #{avatarNft?.tokenId || '1'}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 font-mono text-[10px]">
                      PISO Chain ERC-721
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 font-mono text-[10px]">
                      Lv. {avatarNft?.level || 1}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      onClose();
                      window.dispatchEvent(new CustomEvent('piso-open-character-creation'));
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 font-mono text-[10px] font-bold flex items-center space-x-1 transition-all cursor-pointer"
                  >
                    <span>🔄 Re-roll / Lumikha Muli</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] font-mono">
                  <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">WALLET STATUS:</span>
                    <span className="text-slate-200 font-bold truncate block">
                      {avatarNft?.isGuest
                        ? '🟡 Guest (Ikonek Mamaya)'
                        : `🟢 ${avatarNft?.ownerAddress ? avatarNft.ownerAddress.slice(0, 6) + '...' + avatarNft.ownerAddress.slice(-4) : 'Connected'}`}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">DEFAULT ATTIRE:</span>
                    <span className="text-cyan-300 font-bold block">
                      👕 Plain Civilian (No Costume)
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">SUITED ON-CHAIN GEAR:</span>
                    <span className="text-amber-300 font-bold block">
                      {localHuman?.equippedPinoyItems?.allEquipped
                        ? '🛡️ Lahat ng Item Suot'
                        : '📦 Na-earn / Na-mine Lamang'}
                    </span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 font-mono">
                  💡 Ang iyong Avatar ay isang on-chain PISO NFT. Nagsisimula ito nang <strong className="text-white">walang costume</strong> (default civilian). Anumang armas, kalasag, o pakpak na makuha mo sa pakikipagsapalaran o merkado ay awtomatikong isusuot sa kanya online at idle!
                </p>
              </div>

              {/* 1. Upload Reference Image / Model Logic */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-mono font-bold text-white uppercase flex items-center space-x-1.5 text-xs">
                    <Upload className="w-4 h-4 text-blue-400" />
                    <span>Upload Reference Image (AI Model & Texture)</span>
                  </label>
                  <span className="text-[10px] font-mono text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/30">
                    PNG / JPG / WebP
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 font-mono">
                  Mag-upload ng anumang larawan ng character, anime, selfie, o cyber crest. Awtomatikong kukunin ng AI ang kulay ng balat, damit, at ipo-project ito bilang 3D texture sa iyong avatar!
                </p>

                <div className="flex flex-wrap items-center gap-2.5">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isAnalyzingImage}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold flex items-center space-x-2 transition-all shadow-md active:scale-95"
                  >
                    {isAnalyzingImage ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Sinisuri ang Larawan...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Pumili ng Larawan o Texture</span>
                      </>
                    )}
                  </button>

                  {localHuman.uploadedTextureUrl && (
                    <button
                      onClick={handleClearUpload}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-mono text-xs font-bold flex items-center space-x-1.5 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Alisin ang Texture</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 2. AI Prompt Generator & Presets */}
              <div className="p-4 rounded-2xl bg-[#161F30] border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-mono font-bold text-amber-400 uppercase flex items-center space-x-1.5 text-xs">
                    <Wand2 className="w-4 h-4 text-amber-400" />
                    <span>AI Avatar Synthesizer (Prompt to 3D)</span>
                  </label>
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                    Instant Synthesis
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Hal. Katipunero cyberpunk warrior with red visor..."
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:border-amber-400 focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleGenerateFromPrompt();
                      }
                    }}
                  />
                  <button
                    onClick={handleGenerateFromPrompt}
                    className="px-3.5 py-2 rounded-xl bg-amber-400 text-slate-950 hover:brightness-110 font-mono text-xs font-bold flex items-center space-x-1.5 shadow-md shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate</span>
                  </button>
                </div>

                {/* Presets */}
                <div className="space-y-1">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Mabilisang AI Presets:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {AI_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleApplyPreset(p)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-amber-400/20 hover:border-amber-400/50 border border-slate-700 text-slate-300 hover:text-white font-mono text-[10px] flex items-center space-x-1 transition-all"
                      >
                        <span>{p.icon}</span>
                        <span>{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Form / Gender */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-mono font-bold text-slate-300 uppercase flex items-center space-x-1.5 text-xs">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    <span>Anyo ng Katawan at Kasarian (Body Silhouette)</span>
                  </label>
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                    {localHuman.gender === 'female'
                      ? '👩 Babae (Feminine Taper, Bustier & Slender Frame)'
                      : localHuman.gender === 'android'
                      ? '🤖 Android (Cybernetic Frame)'
                      : '👨 Lalaki (Heroic Broader Frame)'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 font-mono">
                  {[
                    { id: 'male', label: '👨 Lalaki (Male)', desc: 'Malapad na baluti & tindig' },
                    { id: 'female', label: '👩 Babae (Female)', desc: 'Bustier, payat na braso & takong' },
                    { id: 'android', label: '🤖 Cyber-Android', desc: 'Synthetic cybernetic chassis' },
                  ].map((g) => (
                    <button
                      key={g.id}
                      onClick={() => {
                        const isF = g.id === 'female';
                        updateOption({
                          gender: g.id as any,
                          ...(isF ? { hasBeard: false } : {}),
                        });
                      }}
                      className={`py-2 px-2.5 rounded-xl border text-center transition-all ${
                        localHuman.gender === g.id
                          ? 'border-amber-400 bg-amber-400/20 text-white font-bold shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                          : 'border-slate-800 bg-[#161F30] text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs">{g.label}</div>
                      <div className="text-[9px] text-slate-400 font-sans mt-0.5">{g.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Skin Tone */}
              <div className="space-y-2">
                <label className="font-mono font-bold text-slate-400 uppercase flex items-center space-x-1.5">
                  <Palette className="w-3.5 h-3.5 text-amber-400" />
                  <span>Kulay ng Balat (Skin Tone)</span>
                </label>
                <div className="flex items-center space-x-3">
                  {[
                    { color: '#8D5524', label: 'Kayumanggi (Warm)' },
                    { color: '#C68642', label: 'Morena' },
                    { color: '#E0AC69', label: 'Fair Tan' },
                    { color: '#3D2314', label: 'Deep Dark' },
                    { color: '#64748B', label: 'Cyber Chrome' },
                  ].map((s) => (
                    <button
                      key={s.color}
                      onClick={() => updateOption({ skinTone: s.color })}
                      title={s.label}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        localHuman.skinTone === s.color
                          ? 'border-amber-400 scale-125 shadow-glow'
                          : 'border-slate-700 hover:scale-110'
                      }`}
                      style={{ backgroundColor: s.color }}
                    />
                  ))}
                </div>
              </div>

              {/* 5. Hairstyle & Hair Color */}
              <div className="space-y-2">
                <label className="font-mono font-bold text-slate-400 uppercase flex items-center space-x-1.5">
                  <Scissors className="w-3.5 h-3.5 text-purple-400" />
                  <span>Estilo ng Buhok (Hairstyle)</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono">
                  {[
                    { id: 'datuLongWavy', label: '👑 Datu Wavy Locks' },
                    { id: 'mariaClaraBun', label: '🌸 Maria Clara Bun' },
                    { id: 'diwataLocks', label: '✨ Diwata Flowing Hair' },
                    { id: 'urdujaPonytail', label: '⚔️ Urduja Ponytail' },
                    { id: 'cyberBob', label: '💇 Cyber Bob' },
                    { id: 'spaceBuns', label: '🛸 Twin Space Buns' },
                    { id: 'cyberFade', label: '⚡ Cyber-Fade' },
                    { id: 'undercut', label: '✂️ Undercut' },
                    { id: 'topknot', label: '🥋 Topknot (Panday)' },
                    { id: 'braids', label: '🧵 Cornrows' },
                    { id: 'neonBangs', label: '💜 Neon Bangs' },
                  ].map((h) => (
                    <button
                      key={h.id}
                      onClick={() => updateOption({ hairStyle: h.id as any })}
                      className={`py-1.5 px-2.5 rounded-xl border text-center text-[11px] transition-all ${
                        localHuman.hairStyle === h.id
                          ? 'border-purple-400 bg-purple-500/20 text-white font-bold shadow-sm'
                          : 'border-slate-800 bg-[#161F30] text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {h.label}
                    </button>
                  ))}
                </div>

                {/* Facial Hair (Founder Goatee & Mustache) - Hidden for female */}
                {localHuman.gender !== 'female' ? (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px]">
                    <span className="text-slate-300 font-bold flex items-center space-x-2">
                      <span>🧔</span>
                      <span>Bigote at Balbas (Founder Goatee & Mustache)</span>
                    </span>
                    <button
                      onClick={() => updateOption({ hasBeard: !localHuman.hasBeard })}
                      className={`px-3 py-1 rounded-lg border font-bold text-xs transition-all ${
                        localHuman.hasBeard
                          ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-sm'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {localHuman.hasBeard ? 'Aktibo ✓' : 'Wala'}
                    </button>
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-[10px] font-mono text-slate-400 flex items-center space-x-1.5">
                    <span>ℹ️</span>
                    <span>Awtomatikong nakatago ang balbas at bigote para sa babaeng anyo ng character.</span>
                  </div>
                )}

                <div className="flex items-center space-x-2.5 pt-1">
                  <span className="text-[10px] font-mono text-slate-400">Kulay ng Buhok:</span>
                  {[
                    { color: '#0B0F17', label: 'Jet Black (Founder)' },
                    { color: '#F59E0B', label: 'Sun Gold' },
                    { color: '#06B6D4', label: 'Cyber Cyan' },
                    { color: '#EC4899', label: 'Magenta' },
                    { color: '#E2E8F0', label: 'Platinum' },
                  ].map((c) => (
                    <button
                      key={c.color}
                      onClick={() => updateOption({ hairColor: c.color })}
                      title={c.label}
                      className={`w-6 h-6 rounded-full border transition-all ${
                        localHuman.hairColor === c.color
                          ? 'border-white scale-125'
                          : 'border-slate-700 hover:scale-110'
                      }`}
                      style={{ backgroundColor: c.color }}
                    />
                  ))}
                </div>
              </div>

              {/* 6. Filipino Cyber Attire & Exam / Project Costumes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-mono font-bold text-slate-400 uppercase flex items-center space-x-1.5 text-xs">
                    <Shirt className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Kasuotan at Baluti (Exam & Project Costumes)</span>
                  </label>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    Track & Project Gear
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    {
                      id: 'founderArmor',
                      name: '👑 Datu Sovereign Armor',
                      track: 'FOUNDER SUIT',
                      desc: 'Nano-carbon armor na may gold contour plating at ₱ sunburst medallion',
                      tagColor: 'text-amber-400 border-amber-400/40 bg-amber-400/10',
                    },
                    {
                      id: 'mariaClaraCyber',
                      name: '🌸 Cyber-Terno Maria Clara',
                      track: 'KATUNAYAN EXAM',
                      desc: 'Katunayan Certificate Exam — Arched butterfly sleeves at cyan Soulbound chest crest',
                      tagColor: 'text-cyan-400 border-cyan-400/40 bg-cyan-400/10',
                    },
                    {
                      id: 'urdujaArmor',
                      name: '⚔️ Prinsesa Urduja Cuirass',
                      track: 'GENESIS PROJECT',
                      desc: 'Genesis Pioneer Project — Segmented gold & crimson cuirass na may royal pauldrons',
                      tagColor: 'text-rose-400 border-rose-400/40 bg-rose-400/10',
                    },
                    {
                      id: 'babaylanOracle',
                      name: '🔮 Babaylan AI Oracle Robes',
                      track: 'AI ORACLE EXAM',
                      desc: 'AI Track Exam — Floating Baybayin rune belt at glowing levitating AI oracle prism',
                      tagColor: 'text-purple-400 border-purple-400/40 bg-purple-400/10',
                    },
                    {
                      id: 'pandayBlacksmith',
                      name: '⚒️ Master Panday Forge Apron',
                      track: 'SOLIDITY EXAM',
                      desc: 'Solidity Track Exam — Heavy forge apron na may kumikinang na copper EVM coils',
                      tagColor: 'text-amber-400 border-amber-400/40 bg-amber-400/10',
                    },
                    {
                      id: 'bayanihanGuardian',
                      name: '💧 Bayanihan Faucet Guardian',
                      track: 'DAO PROJECT',
                      desc: 'Faucet & DAO Project — Dual cyan coolant tubes at water droplet chest medallion',
                      tagColor: 'text-blue-400 border-blue-400/40 bg-blue-400/10',
                    },
                    {
                      id: 'barongCyber',
                      name: '🇵🇭 Barong Tagalog Cyber-Jacket',
                      track: 'CLASSIC',
                      desc: 'Piña fiber na may gold optic embroidery at high-collar techwear',
                      tagColor: 'text-slate-400 border-slate-700 bg-slate-800',
                    },
                    {
                      id: 'katipunanTech',
                      name: '🔴 Katipunan Tactical Wear',
                      track: 'TACTICAL',
                      desc: 'Pulang bandana at tactical armor vest para sa mga frontline builders',
                      tagColor: 'text-red-400 border-red-400/40 bg-red-400/10',
                    },
                    {
                      id: 'babaylanRobes',
                      name: '💜 Babaylan Mystic Robes',
                      track: 'MYSTIC',
                      desc: 'Biyoletang telang celestial na may gintong selyo',
                      tagColor: 'text-purple-400 border-purple-400/40 bg-purple-400/10',
                    },
                    {
                      id: 'manilaHoodie',
                      name: '🏙️ New Manila Tech Hoodie',
                      track: 'STREETWEAR',
                      desc: 'Waterproof matte black hoodie para sa mga metro cyber runners',
                      tagColor: 'text-cyan-400 border-cyan-400/40 bg-cyan-400/10',
                    },
                  ].map((o) => (
                    <button
                      key={o.id}
                      onClick={() => updateOption({ outfit: o.id as any })}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        localHuman.outfit === o.id
                          ? 'border-emerald-400 bg-emerald-500/20 text-white font-bold shadow-sm'
                          : 'border-slate-800 bg-[#161F30] text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold">{o.name}</div>
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${o.tagColor}`}>
                          {o.track}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans mt-1">{o.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 7. Kapa at Mantle (Superhero Cape) */}
              <div className="space-y-2">
                <label className="font-mono font-bold text-slate-400 uppercase flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>Kapa at Mantle (Superhero Flowing Cape)</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                  {[
                    { id: 'founderCape', label: '👑 Dual-Tone (Blue/Red)' },
                    { id: 'energyCape', label: '⚡ Energy Mantle' },
                    { id: 'shadowCape', label: '🌑 Shadow Cloak' },
                    { id: 'none', label: 'Walang Kapa' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      onClick={() => updateOption({ cape: c.id as any })}
                      className={`py-2 px-2 rounded-xl border text-center transition-all ${
                        (localHuman.cape || 'founderCape') === c.id
                          ? 'border-blue-400 bg-blue-500/20 text-white font-bold shadow-sm'
                          : 'border-slate-800 bg-[#161F30] text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 8. Divine Halo sa Likod (Philippine Sun & 3 Stars) */}
              <div className="space-y-2">
                <label className="font-mono font-bold text-slate-400 uppercase flex items-center space-x-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>Halo sa Likod (8-Ray Philippine Sun & 3 Stars)</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                  {[
                    { id: 'philippineSunStars', label: '☀️ 8-Ray Sun & 3 Stars' },
                    { id: 'cyberRings', label: '🪐 Quantum Rings' },
                    { id: 'wingsOfKatunayan', label: '🪽 Wings of Katunayan' },
                    { id: 'none', label: 'Walang Halo' },
                  ].map((b) => (
                    <button
                      key={b.id}
                      onClick={() => updateOption({ backCrest: b.id as any })}
                      className={`py-2 px-2 rounded-xl border text-center transition-all ${
                        (localHuman.backCrest || 'philippineSunStars') === b.id
                          ? 'border-amber-400 bg-amber-400/20 text-white font-bold shadow-sm'
                          : 'border-slate-800 bg-[#161F30] text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 9. Accessories */}
              <div className="space-y-2">
                <label className="font-mono font-bold text-slate-400 uppercase flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Aparato at Accents (Accessories & Emblems)</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                  {[
                    { id: 'pisoSunCrest', label: '₱ Sun Medallion' },
                    { id: 'sampaguitaPin', label: '🌸 Sampaguita Pin' },
                    { id: 'diwataCrown', label: '👑 Diwata Tiara' },
                    { id: 'baybayinTattoo', label: '⚡ Baybayin Glyph' },
                    { id: 'cyberVisor', label: '🕶️ AR Visor' },
                    { id: 'pisoPendant', label: '🪙 PISO Seal' },
                    { id: 'holoMask', label: '😷 Nano Mask' },
                    { id: 'none', label: 'Walang Accent' },
                  ].map((a) => (
                    <button
                      key={a.id}
                      onClick={() => updateOption({ accessory: a.id as any })}
                      className={`py-1.5 px-2 rounded-xl border text-center transition-all ${
                        (localHuman.accessory || 'pisoSunCrest') === a.id
                          ? 'border-cyan-400 bg-cyan-500/20 text-white font-bold shadow-sm'
                          : 'border-slate-800 bg-[#161F30] text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 10. Loyal Companion Pet Recon Drone */}
              <div className="p-4 rounded-2xl bg-[#161F30] border-2 border-cyan-500/40 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-lg">
                      🛸
                    </div>
                    <div>
                      <span className="font-mono font-bold text-white uppercase text-xs block">
                        Recon Drone Pet Companion
                      </span>
                      <span className="text-[10px] text-cyan-300 font-mono">
                        Lumilipad at sumusunod sa balikat ng iyong avatar
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const currentlyEnabled = localHuman.petDrone?.enabled !== false;
                      updateOption({
                        petDrone: {
                          enabled: !currentlyEnabled,
                          skin: localHuman.petDrone?.skin || 'panday',
                          auraColor: localHuman.petDrone?.auraColor || localHuman.auraColor || '#F59E0B',
                        },
                      });
                    }}
                    className={`px-3 py-1.5 rounded-xl border font-mono text-xs font-bold transition-all ${
                      localHuman.petDrone?.enabled !== false
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    {localHuman.petDrone?.enabled !== false ? 'Aktibong Pet ✓' : 'Naka-off'}
                  </button>
                </div>

                {localHuman.petDrone?.enabled !== false && (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">
                      Baluti ng Kasamang Pet Drone:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-[10px]">
                      {[
                        { id: 'panday', name: 'Panday Gold', icon: '⚒️' },
                        { id: 'babaylan', name: 'Babaylan Astral', icon: '🔮' },
                        { id: 'jeepney', name: 'Jeepney Neon', icon: '⚡' },
                        { id: 'sentinel', name: 'Sentinel Stealth', icon: '🤖' },
                        { id: 'agila', name: 'Agila Aero', icon: '🦅' },
                      ].map((skin) => (
                        <button
                          key={skin.id}
                          onClick={() =>
                            updateOption({
                              petDrone: {
                                enabled: true,
                                skin: skin.id as any,
                                auraColor: localHuman.petDrone?.auraColor || localHuman.auraColor || '#F59E0B',
                              },
                            })
                          }
                          className={`py-1.5 px-2 rounded-lg border text-center transition-all ${
                            (localHuman.petDrone?.skin || 'panday') === skin.id
                              ? 'border-cyan-400 bg-cyan-500/20 text-white font-bold shadow-sm'
                              : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="text-sm">{skin.icon}</div>
                          <div className="truncate">{skin.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Quick Save & Close Action */}
              <div className="pt-3">
                <button
                  onClick={handleSaveHumanAvatar}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-slate-950 font-mono text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center space-x-2"
                >
                  <Check className="w-4 h-4" />
                  <span>I-save at Isara (Save & Walk in 3D World) [E]</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Body: Pinoy Cultural Gear & Anime Superpowers */}
        {activeTab === 'pinoy' && (
          <div className="relative z-20 flex-1 overflow-hidden flex flex-col md:flex-row">
            {/* Left 3D Humanoid Preview with Live Walking Rig and Superpower Test Button */}
            <div className="w-full md:w-84 border-b md:border-b-0 md:border-r border-slate-800 bg-[#070A10] relative flex flex-col items-center justify-between p-4 shrink-0">
              <div className="w-full flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-xl p-1.5 mb-2 font-mono text-[11px]">
                <span className="text-purple-400 font-bold">PINOY EQUIPPED 3D PREVIEW</span>
                <span className="text-[10px] text-slate-400">Live 3D Model</span>
              </div>

              {/* 3D Canvas Preview */}
              <div className="w-full h-60 rounded-xl overflow-hidden border border-slate-800/80 relative shadow-inner">
                <HumanoidPreviewCanvas config={localHuman} isWalking={isWalkingPreview} />
              </div>

              {/* Equipped Summary Pills */}
              <div className="w-full mt-2 p-2 rounded-xl bg-slate-950/70 border border-slate-800 text-[10px] font-mono space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Sandata (Weapon):</span>
                  <span className="text-amber-300 font-bold truncate max-w-[130px]">
                    {FILIPINO_ITEMS.find((i) => i.id === localHuman.equippedPinoyItems?.weapon)?.name || 'None'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Headwear:</span>
                  <span className="text-cyan-300 font-bold truncate max-w-[130px]">
                    {FILIPINO_ITEMS.find((i) => i.id === localHuman.equippedPinoyItems?.headwear)?.name || 'None'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Back/Aura:</span>
                  <span className="text-purple-300 font-bold truncate max-w-[130px]">
                    {FILIPINO_ITEMS.find((i) => i.id === localHuman.equippedPinoyItems?.back)?.name || 'None'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Superpower:</span>
                  <span className="text-rose-300 font-bold uppercase">
                    {localHuman.equippedPinoyItems?.superpower || 'kamehameha'}
                  </span>
                </div>
              </div>

              {/* Test Super Power Action Button */}
              <button
                type="button"
                onClick={() => {
                  const power = localHuman.equippedPinoyItems?.superpower || 'kamehameha';
                  window.dispatchEvent(
                    new CustomEvent('piso-trigger-superpower', { detail: { powerId: power } })
                  );
                  setNotification({
                    message: `💥 Triggered Anime Power: ${power.toUpperCase()}! Look at your 3D world!`,
                    type: 'success',
                  });
                }}
                className="w-full mt-2 py-2 rounded-xl bg-gradient-to-r from-rose-600 via-purple-600 to-amber-500 hover:brightness-110 text-white font-mono text-xs font-black uppercase tracking-wider shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all flex items-center justify-center space-x-1.5 active:scale-95"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>Subukan ang Super Power (Test Move)</span>
              </button>

              {/* Save & Return to Metaverse */}
              <button
                type="button"
                onClick={handleSaveHumanAvatar}
                className="w-full mt-2 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold uppercase tracking-wider shadow-sm transition flex items-center justify-center space-x-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>I-save at Isara [E]</span>
              </button>
            </div>

            {/* Right Scrollable Catalog */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Quick God-Mode / All-Items Toggle */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-cyan-500/15 border border-amber-400/40">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">👑</span>
                  <div>
                    <h5 className="text-xs font-bold text-white leading-tight">God-Mode Pinoy Loadout</h5>
                    <p className="text-[10px] text-slate-300">Equip weapon, shield, salakot, towel, crown, wings, sign, agimat, and tabo all at once!</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const isCurrentlyAll = !!localHuman.equippedPinoyItems?.allEquipped;
                    setLocalHuman((prev) => ({
                      ...prev,
                      equippedPinoyItems: isCurrentlyAll
                        ? { superpower: 'kamehameha' }
                        : { ...EQUIP_ALL_PRESET, allEquipped: true },
                    }));
                    SoundFX.playLevelUp();
                  }}
                  className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5 shrink-0 ${
                    localHuman.equippedPinoyItems?.allEquipped
                      ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                      : 'bg-slate-900/80 text-amber-300 hover:text-white border border-amber-500/40'
                  }`}
                >
                  <span>{localHuman.equippedPinoyItems?.allEquipped ? '✓ EQUIPPED ALL' : '🌟 EQUIP ALL'}</span>
                </button>
              </div>

              {/* Rarity Filter Bar */}
              <div className="flex flex-wrap items-center gap-1.5 bg-[#161F30]/80 p-2 rounded-xl border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 font-bold mr-1">RARITY:</span>
                {(['all', 'common', 'uncommon', 'rare', 'epic', 'legend', 'mythical'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setRarityFilter(r);
                      SoundFX.playClick();
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all ${
                      rarityFilter === r
                        ? 'bg-amber-400 text-slate-950 shadow-sm'
                        : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              {/* Slot Filter Bar */}
              <div className="flex flex-wrap items-center gap-1.5 bg-[#161F30]/80 p-2 rounded-xl border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 font-bold mr-1">SLOT:</span>
                {(['all', 'weapon', 'headwear', 'outfit', 'back', 'superpower'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setSlotFilter(s);
                      SoundFX.playClick();
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all ${
                      slotFilter === s
                        ? 'bg-purple-500 text-white shadow-sm'
                        : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredPinoyItems.map((item) => {
                  const isEquipped =
                    item.slot === 'weapon'
                      ? localHuman.equippedPinoyItems?.weapon === item.id
                      : item.slot === 'headwear'
                      ? localHuman.equippedPinoyItems?.headwear === item.id
                      : item.slot === 'back'
                      ? localHuman.equippedPinoyItems?.back === item.id
                      : item.slot === 'outfit'
                      ? localHuman.equippedPinoyItems?.outfit === item.id
                      : localHuman.equippedPinoyItems?.superpower === item.animeSuperPowerId;

                  const rConf = RARITY_CONFIG[item.rarity];

                  return (
                    <div
                      key={item.id}
                      style={{
                        boxShadow: isEquipped ? `0 0 20px ${rConf.glow}` : undefined,
                      }}
                      className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col justify-between bg-gradient-to-br ${rConf.bg} ${
                        isEquipped ? rConf.border : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        {/* Header: Icon + Name + Rarity Badge */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center text-xl shadow-inner">
                              {item.icon}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-white leading-tight">{item.name}</h4>
                              <p className="text-[10px] text-slate-400 italic">{item.filipinoName}</p>
                            </div>
                          </div>

                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-black border uppercase ${rConf.badge}`}>
                            {item.rarity}
                          </span>
                        </div>

                        {/* Tagline & Lore */}
                        <div className="mt-2 text-[11px] font-mono text-amber-300 font-semibold">{item.tagline}</div>
                        <p className="mt-1 text-[10px] text-slate-300 leading-relaxed line-clamp-2">{item.lore}</p>

                        {/* Stats */}
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {item.stats.map((st, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 rounded bg-black/50 border border-slate-700/60 text-[9px] font-mono">
                              <span className="text-slate-400">{st.label}: </span>
                              <strong className={st.color}>{st.value}</strong>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Bottom Action: Equip Button */}
                      <div className="mt-3 flex items-center space-x-2 pt-2 border-t border-white/5">
                        <button
                          type="button"
                          onClick={() => {
                            const cur = localHuman.equippedPinoyItems || {};
                            const updated = { ...cur };
                            if (item.slot === 'weapon') {
                              updated.weapon = isEquipped ? undefined : item.id;
                            } else if (item.slot === 'headwear') {
                              updated.headwear = isEquipped ? undefined : item.id;
                            } else if (item.slot === 'back') {
                              updated.back = isEquipped ? undefined : item.id;
                            } else if (item.slot === 'outfit') {
                              updated.outfit = isEquipped ? undefined : item.id;
                            } else if (item.slot === 'superpower' && item.animeSuperPowerId) {
                              updated.superpower = isEquipped ? undefined : item.animeSuperPowerId;
                            }
                            updateOption({ equippedPinoyItems: updated });
                            SoundFX.playLevelUp();
                            setNotification({
                              message: isEquipped ? `Unequipped "${item.name}"` : `Equipped "${item.name}"!`,
                              type: 'success',
                            });
                          }}
                          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-mono font-bold uppercase transition-all flex items-center justify-center space-x-1 ${
                            isEquipped
                              ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-300 shadow-sm'
                              : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-500'
                          }`}
                        >
                          {isEquipped ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>EQUIPPED</span>
                            </>
                          ) : (
                            <span>EQUIP GEAR</span>
                          )}
                        </button>

                        {item.animeSuperPowerId && (
                          <button
                            type="button"
                            onClick={() => {
                              window.dispatchEvent(
                                new CustomEvent('piso-trigger-superpower', { detail: { powerId: item.animeSuperPowerId } })
                              );
                            }}
                            title="Test this move in 3D"
                            className="p-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400 text-purple-200 transition active:scale-95"
                          >
                            <Zap className="w-3.5 h-3.5 text-amber-300" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Content Body: Drone Recon Hangar */}
        {activeTab === 'drone' && (
          <div className="relative z-20 flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {DRONE_SKINS.map((skin) => {
              const isEquipped = avatarSkin === skin.id;
              return (
                <div
                  key={skin.id}
                  className={`p-5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                    isEquipped
                      ? 'bg-[#161F30] border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.25)]'
                      : 'bg-[#161F30]/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${skin.hullColor} flex items-center justify-center text-2xl shadow-lg border border-white/20`}
                        >
                          {skin.avatar}
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm flex items-center space-x-2">
                            <span>{skin.name}</span>
                            {isEquipped && (
                              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-400/20 px-1.5 py-0.5 rounded border border-amber-400/40">
                                EQUIPPED
                              </span>
                            )}
                          </h4>
                          <p className="text-[11px] text-slate-400">{skin.tagline}</p>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 mt-3 italic">{skin.lore}</p>

                    {/* Stat bars */}
                    <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-800/80 font-mono text-[11px]">
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Velocity (Bilis)</span>
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <span
                              key={s}
                              className={`w-2.5 h-1.5 rounded-sm ${
                                s <= skin.speedRating ? 'bg-amber-400' : 'bg-slate-800'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Agility (Pangangasiwa)</span>
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <span
                              key={s}
                              className={`w-2.5 h-1.5 rounded-sm ${
                                s <= skin.agilityRating ? 'bg-cyan-400' : 'bg-slate-800'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Armor (Tibay)</span>
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <span
                              key={s}
                              className={`w-2.5 h-1.5 rounded-sm ${
                                s <= skin.armorRating ? 'bg-blue-400' : 'bg-slate-800'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-emerald-400 flex items-center space-x-1">
                      <Zap className="w-3 h-3" />
                      <span>{skin.perk}</span>
                    </span>

                    <button
                      disabled={isEquipped}
                      onClick={() => handleEquipDrone(skin)}
                      className={`px-4 py-1.5 rounded-xl font-mono text-xs font-bold uppercase transition-all ${
                        isEquipped
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg'
                      }`}
                    >
                      {isEquipped ? 'Gamit Na' : 'Gamitin Ito'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Content Body: Inventory, Fixed Price Sell & P2P Bidding Market */}
        {activeTab === 'inventory' && (
          <div className="relative z-20 flex-1 overflow-hidden flex flex-col p-6 space-y-4 font-sans text-xs">
            {/* Top Toolbar: Sub-Tabs & Spendable Balance */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#161F30]/90 border border-slate-800">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    SoundFX.playClick();
                    setInventorySubTab('gear');
                  }}
                  className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all flex items-center space-x-2 ${
                    inventorySubTab === 'gear'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <Package className="w-4 h-4 text-emerald-400" />
                  <span>🎒 Aking Imbentaryo & Suot</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px]">
                    {ownedWeapons.length + ownedRelics.length}
                  </span>
                </button>

                <button
                  onClick={() => {
                    SoundFX.playClick();
                    setInventorySubTab('bidding');
                  }}
                  className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all flex items-center space-x-2 ${
                    inventorySubTab === 'bidding'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <Gavel className="w-4 h-4 text-amber-400" />
                  <span>🔨 Live P2P Bidding & Auctions</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px]">
                    {liveAuctions.length}
                  </span>
                </button>

                <button
                  onClick={() => {
                    SoundFX.playClick();
                    setInventorySubTab('elements');
                  }}
                  className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all flex items-center space-x-2 ${
                    inventorySubTab === 'elements'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>🧪 Elemental Drops & $PISO Swap</span>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px]">
                    {Object.values(elementalMaterials).reduce((acc, m) => acc + m.count, 0)}
                  </span>
                </button>
              </div>

              {/* Spendable $PISO Wallet Balance */}
              <div className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <Coins className="w-4 h-4 text-amber-400" />
                <span className="text-slate-400 font-mono text-[11px]">Spendable $PISO:</span>
                <span className="text-amber-300 font-mono font-black text-sm tracking-wide">
                  ₱ {spendablePiso.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Sub-Tab 1: My Inventory (Suit Up / Sell / Auction) */}
            {inventorySubTab === 'gear' && (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {/* Category Filters */}
                <div className="flex items-center space-x-2 font-mono text-xs">
                  {(['all', 'weapons', 'relics', 'blocks'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => {
                        SoundFX.playClick();
                        setInventoryFilter(filter);
                      }}
                      className={`px-3 py-1 rounded-lg uppercase tracking-wider text-[11px] font-bold transition-all ${
                        inventoryFilter === filter
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {filter === 'all'
                        ? 'Lahat'
                        : filter === 'weapons'
                        ? `Sandata (${ownedWeapons.length})`
                        : filter === 'relics'
                        ? `Relikya (${ownedRelics.length})`
                        : 'Kultura & Bloke'}
                    </button>
                  ))}
                </div>

                {/* Grid of Items */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {/* 1. Weapons & Armor */}
                  {(inventoryFilter === 'all' || inventoryFilter === 'weapons') &&
                    ownedWeapons.map((weapon) => {
                      const isEquipped =
                        localHuman?.equippedPinoyItems?.weapon?.toLowerCase().includes(weapon.name.toLowerCase().split(' ')[0]) ||
                        localHuman?.equippedPinoyItems?.weapon === String(weapon.id);
                      const baseSellPrices: Record<string, number> = {
                        Common: 50,
                        Uncommon: 120,
                        Rare: 280,
                        Epic: 650,
                        Legendary: 1500,
                        Mythical: 3500,
                      };
                      const sellVal = Math.round(
                        (baseSellPrices[weapon.rarity] || 150) * (1 + (weapon.enhancementLevel || 0) * 0.15)
                      );

                      return (
                        <div
                          key={`weapon-${weapon.id}`}
                          className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                            isEquipped
                              ? 'bg-emerald-950/20 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                              : 'bg-[#161F30] border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-2.5">
                                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-2xl shadow-inner">
                                  {weapon.icon || '🗡️'}
                                </div>
                                <div>
                                  <div className="flex items-center space-x-1.5">
                                    <span className="font-bold text-white font-mono text-xs tracking-tight">
                                      {weapon.name}
                                    </span>
                                    {weapon.enhancementLevel > 0 && (
                                      <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-mono text-[10px] font-bold border border-amber-400/30">
                                        +{weapon.enhancementLevel}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">
                                    {weapon.rarity} {weapon.category}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Stats */}
                            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-mono bg-slate-900/70 p-2 rounded-xl border border-slate-800/80">
                              <div className="flex items-center justify-between text-slate-400">
                                <span>Lakas (ATK):</span>
                                <span className="text-amber-300 font-bold">+{weapon.attackPower}</span>
                              </div>
                              <div className="flex items-center justify-between text-slate-400">
                                <span>Depensa (DEF):</span>
                                <span className="text-blue-300 font-bold">+{weapon.defensePower}</span>
                              </div>
                            </div>

                            {/* Active Suiting Indicator */}
                            {isEquipped && (
                              <div className="mt-2.5 flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span>SUITED SA AVATAR (ONLINE & IDLE)</span>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="mt-3.5 pt-3 border-t border-slate-800 flex items-center space-x-2">
                            <button
                              onClick={() => handleSuitUp(weapon.name, weapon.category)}
                              className={`flex-1 py-1.5 rounded-xl font-mono text-xs font-bold transition-all uppercase flex items-center justify-center space-x-1 ${
                                isEquipped
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'
                              }`}
                            >
                              <span>👔 {isEquipped ? 'Suot Na' : 'Isukat'}</span>
                            </button>

                            <button
                              onClick={() => handleSellItem('weapon', weapon.id)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 font-mono text-xs font-bold transition-all"
                              title={`Ibenta para sa +${sellVal} $PISO`}
                            >
                              💰 +{sellVal} ₱
                            </button>

                            <button
                              onClick={() =>
                                handleOpenAuctionModal({
                                  name: `${weapon.name} (+${weapon.enhancementLevel})`,
                                  category: weapon.category,
                                  icon: weapon.icon || '🗡️',
                                  rarity: weapon.rarity,
                                })
                              }
                              className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-amber-950/40 text-amber-400 border border-amber-500/30 font-mono text-xs font-bold transition-all"
                              title="I-bidding sa P2P Auction"
                            >
                              🔨 Bid
                            </button>
                          </div>
                        </div>
                      );
                    })}

                  {/* 2. Relics */}
                  {(inventoryFilter === 'all' || inventoryFilter === 'relics') &&
                    ownedRelics.map((relic) => {
                      const isEquipped =
                        localHuman?.equippedPinoyItems?.shield?.toLowerCase().includes('kaldero') ||
                        localHuman?.equippedPinoyItems?.amulet?.toLowerCase().includes('agimat') ||
                        localHuman?.equippedPinoyItems?.tabo?.toLowerCase().includes('tabo') ||
                        localHuman?.equippedPinoyItems?.headwear?.toLowerCase().includes('salakot');
                      const baseRelicPrices: Record<string, number> = {
                        Common: 40,
                        Uncommon: 90,
                        Rare: 200,
                        Epic: 450,
                        Legendary: 1100,
                      };
                      const sellVal = baseRelicPrices[relic.rarity] || 100;

                      return (
                        <div
                          key={`relic-${relic.id}`}
                          className="p-4 rounded-2xl border border-slate-800 bg-[#161F30] hover:border-slate-700 transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-2.5">
                                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-2xl shadow-inner">
                                  {relic.icon}
                                </div>
                                <div>
                                  <span className="font-bold text-white font-mono text-xs block">
                                    {relic.name}
                                  </span>
                                  <span className="text-[10px] font-mono text-purple-400 font-bold uppercase">
                                    {relic.rarity} Relic • Dami: {relic.count}x
                                  </span>
                                </div>
                              </div>
                            </div>

                            <p className="mt-2 text-[11px] text-slate-300 font-sans leading-relaxed">
                              {relic.description}
                            </p>

                            <div className="mt-2 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 p-1.5 rounded-lg border border-emerald-500/20">
                              ⚡ +{(relic.buffAprBps / 100).toFixed(1)}% Farming APR Boost
                            </div>
                          </div>

                          <div className="mt-3.5 pt-3 border-t border-slate-800 flex items-center space-x-2">
                            <button
                              onClick={() => handleSuitUp(relic.name, 'RELIC')}
                              className="flex-1 py-1.5 rounded-xl font-mono text-xs font-bold uppercase bg-purple-600 hover:bg-purple-500 text-white shadow-md transition-all flex items-center justify-center space-x-1"
                            >
                              <span>👔 Isukat sa Avatar</span>
                            </button>

                            <button
                              disabled={relic.count <= 0}
                              onClick={() => handleSellItem('relic', relic.id, 1)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 font-mono text-xs font-bold transition-all disabled:opacity-50"
                              title={`Ibenta ang 1x para sa +${sellVal} $PISO`}
                            >
                              💰 +{sellVal} ₱
                            </button>

                            <button
                              disabled={relic.count <= 0}
                              onClick={() =>
                                handleOpenAuctionModal({
                                  name: relic.name,
                                  category: 'RELIC',
                                  icon: relic.icon,
                                  rarity: relic.rarity,
                                })
                              }
                              className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-amber-950/40 text-amber-400 border border-amber-500/30 font-mono text-xs font-bold transition-all disabled:opacity-50"
                              title="I-bidding sa P2P Auction"
                            >
                              🔨 Bid
                            </button>
                          </div>
                        </div>
                      );
                    })}

                  {/* 3. Filipino Cultural Items Showcase */}
                  {(inventoryFilter === 'all' || inventoryFilter === 'blocks') &&
                    FILIPINO_ITEMS.slice(0, 6).map((item) => {
                      const isEquipped =
                        localHuman?.equippedPinoyItems?.weapon === item.id ||
                        localHuman?.equippedPinoyItems?.headwear === item.id ||
                        localHuman?.equippedPinoyItems?.back === item.id;
                      return (
                        <div
                          key={`culture-${item.id}`}
                          className="p-4 rounded-2xl border border-slate-800 bg-[#161F30] hover:border-slate-700 transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center space-x-2.5">
                              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-2xl shadow-inner">
                                {item.icon}
                              </div>
                              <div>
                                <span className="font-bold text-white font-mono text-xs block">
                                  {item.name}
                                </span>
                                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">
                                  {item.rarity} {item.slot}
                                </span>
                              </div>
                            </div>
                            <p className="mt-2 text-[11px] text-slate-300 font-sans line-clamp-2">
                              {item.lore}
                            </p>
                          </div>

                          <div className="mt-3.5 pt-3 border-t border-slate-800 flex items-center space-x-2">
                            <button
                              onClick={() => handleSuitUp(item.name, item.slot.toUpperCase())}
                              className="flex-1 py-1.5 rounded-xl font-mono text-xs font-bold uppercase bg-amber-600 hover:bg-amber-500 text-white shadow-md transition-all"
                            >
                              👔 Isukat
                            </button>

                            <button
                              onClick={() =>
                                handleOpenAuctionModal({
                                  name: item.name,
                                  category: 'CULTURE',
                                  icon: item.icon,
                                  rarity: (item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)) as any,
                                })
                              }
                              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-amber-950/40 text-amber-400 border border-amber-500/30 font-mono text-xs font-bold transition-all"
                            >
                              🔨 I-bidding
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Sub-Tab 2: Live P2P Bidding & Auctions */}
            {inventorySubTab === 'bidding' && (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-center space-x-2 text-amber-300 font-mono text-xs">
                    <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span className="font-bold">DECENTRALIZED P2P AUCTION BOARD</span>
                    <span className="text-slate-400 text-[11px]">• 1% Burn Tax sa bawat matagumpay na bidding</span>
                  </div>
                  <span className="text-[11px] font-mono text-amber-400">
                    Active Bids: {liveAuctions.length} Listings
                  </span>
                </div>

                {/* Auction Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {liveAuctions.map((auc) => {
                    const isUser = auc.isUserListing || auc.seller.includes('Ikaw');
                    const timeLeftMinutes = Math.max(0, Math.round((auc.expiresAt - Date.now()) / (1000 * 60)));

                    return (
                      <div
                        key={auc.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                          isUser
                            ? 'bg-amber-950/20 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                            : 'bg-[#161F30] border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2.5">
                              <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-2xl shadow-inner">
                                {auc.itemIcon}
                              </div>
                              <div>
                                <span className="font-bold text-white font-mono text-xs block">
                                  {auc.itemName}
                                </span>
                                <div className="flex items-center space-x-1.5 mt-0.5">
                                  <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">
                                    {auc.rarity} {auc.itemCategory}
                                  </span>
                                  <span className="text-slate-500">•</span>
                                  <span className="text-[10px] font-mono text-slate-400">
                                    Seller: {auc.seller}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-amber-300">
                              <Clock className="w-3 h-3 text-amber-400" />
                              <span>{timeLeftMinutes > 0 ? `${timeLeftMinutes}m left` : 'Finished'}</span>
                            </span>
                          </div>

                          {/* Bidding Stats Bar */}
                          <div className="mt-3.5 grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono">
                            <div>
                              <span className="text-[10px] text-slate-400 block uppercase">Kasalukuyang Bid:</span>
                              <span className="text-amber-400 font-black text-sm">
                                ₱ {auc.currentBidPiso.toLocaleString()}
                              </span>
                              <span className="text-[9px] text-slate-400 block truncate">
                                By {auc.highestBidder} ({auc.bidsCount} bids)
                              </span>
                            </div>

                            <div>
                              <span className="text-[10px] text-slate-400 block uppercase">Instant Buyout:</span>
                              <span className="text-emerald-400 font-black text-sm">
                                ₱ {auc.buyoutPricePiso.toLocaleString()}
                              </span>
                              <span className="text-[9px] text-emerald-400/80 block">
                                1-Click Diretsong Panalo
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-3.5 pt-3 border-t border-slate-800 flex flex-wrap items-center gap-2">
                          {isUser ? (
                            <>
                              <button
                                onClick={() => handleAcceptBid(auc.id)}
                                className="flex-1 py-1.5 rounded-xl font-mono text-xs font-bold uppercase bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all flex items-center justify-center space-x-1.5"
                              >
                                <span>🎉 Tanggapin ang Highest Bid (₱ {auc.currentBidPiso})</span>
                              </button>

                              <button
                                onClick={() => handleCancelAuction(auc.id)}
                                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-mono text-xs font-bold transition-all"
                              >
                                Kanselahin
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handlePlaceBid(auc.id, auc.currentBidPiso + 25)}
                                className="px-2.5 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 font-mono text-xs font-bold transition-all"
                              >
                                +25 ₱ Bid
                              </button>

                              <button
                                onClick={() => handlePlaceBid(auc.id, auc.currentBidPiso + 50)}
                                className="px-2.5 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 font-mono text-xs font-bold transition-all"
                              >
                                +50 ₱ Bid
                              </button>

                              <button
                                onClick={() => handlePlaceBid(auc.id, auc.buyoutPricePiso)}
                                className="flex-1 py-1.5 rounded-xl font-mono text-xs font-bold uppercase bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all"
                              >
                                ⚡ Buyout (₱ {auc.buyoutPricePiso})
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sub-Tab 3: Elemental Monster Drops & $PISO Token Swap */}
            {inventorySubTab === 'elements' && (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {/* Header Liquidation Banner */}
                {(() => {
                  const itemsList = Object.values(elementalMaterials).filter((m) => m.count > 0);
                  const totalRawPiso = itemsList.reduce((acc, m) => acc + m.swapPisoValue * m.count, 0);
                  const bonusPiso = Math.floor(totalRawPiso * 0.1);
                  const grandTotalPiso = totalRawPiso + bonusPiso;
                  const totalItemCount = itemsList.reduce((acc, m) => acc + m.count, 0);

                  return (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-blue-950/40 border border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.15)] flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center space-x-2 text-cyan-300 font-mono text-sm font-black">
                          <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
                          <span>ELEMENTAL DROPS EXCHANGE (PALITAN NG MATERYAL)</span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-300 font-sans max-w-xl">
                          Lahat ng halimaw ay naghuhulog ng mga random na <strong>Pagkain (Food)</strong>, <strong>Habi (Textile)</strong>, <strong>Likido (Liquid)</strong>, at <strong>Kristal (Shards)</strong>. Direktang ipalit sa <strong>$PISO Token</strong> para sa agarang kita o gamitin sa hinaharap na pagpapanday!
                        </p>
                        <div className="mt-2 flex items-center space-x-3 text-xs font-mono">
                          <span className="text-slate-400">Kabuuang Materyal: <strong className="text-cyan-300">{totalItemCount} piraso</strong></span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-400">Kabuuang Halaga: <strong className="text-amber-400">₱ {grandTotalPiso.toLocaleString()}</strong> (+10% Bulk Bonus)</span>
                        </div>
                      </div>

                      <button
                        onClick={handleSwapAllMaterials}
                        disabled={totalItemCount === 0}
                        className="px-5 py-3 rounded-xl font-mono text-xs font-black uppercase bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all flex items-center space-x-2 active:scale-95"
                      >
                        <Coins className="w-4 h-4 text-slate-950" />
                        <span>⚡ Palitan Lahat sa $PISO (+₱{grandTotalPiso.toLocaleString()})</span>
                      </button>
                    </div>
                  );
                })()}

                {/* Category Filters for Elements */}
                <div className="flex items-center space-x-2 font-mono text-xs overflow-x-auto pb-1">
                  {(
                    [
                      { id: 'all', label: 'Lahat ng Elemento', icon: '✨' },
                      { id: 'food', label: '🍗 Pagkain (Food)', icon: '🍗' },
                      { id: 'textile', label: '🧵 Habi (Textile)', icon: '🧵' },
                      { id: 'liquid', label: '💧 Likido (Liquid)', icon: '💧' },
                      { id: 'shard', label: '💎 Kristal (Shards)', icon: '💎' },
                    ] as const
                  ).map((f) => {
                    const countInCat = Object.values(elementalMaterials).filter(
                      (m) => (f.id === 'all' || m.category === f.id) && m.count > 0
                    ).length;

                    return (
                      <button
                        key={f.id}
                        onClick={() => {
                          SoundFX.playClick();
                          setElementFilter(f.id as any);
                        }}
                        className={`px-3 py-1.5 rounded-xl uppercase tracking-wider text-[11px] font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                          elementFilter === f.id
                            ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        <span>{f.label}</span>
                        <span className="px-1.5 py-0.2 rounded bg-black/30 text-[10px]">
                          {countInCat}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Grid of Elemental Materials */}
                {(() => {
                  const filtered = Object.values(elementalMaterials).filter(
                    (m) => (elementFilter === 'all' || m.category === elementFilter) && m.count > 0
                  );

                  if (filtered.length === 0) {
                    return (
                      <div className="p-10 text-center rounded-2xl border border-slate-800 bg-[#161F30]/60 space-y-3">
                        <span className="text-4xl block">🏺</span>
                        <h4 className="font-mono text-sm font-bold text-slate-300">Walang Nakitang Elemental Drops</h4>
                        <p className="text-xs text-slate-400 max-w-md mx-auto">
                          Lumalaban sa mga halimaw (Highland Cobra, Sky Vulture, Canyon Komodo, Cyber Hyena, at Giga Buwaya Titan) upang makakuha ng random drops ng pagkain, habi, likido, at kristal!
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {filtered.map((item) => {
                        const rarityColors: Record<string, string> = {
                          common: 'text-slate-400 border-slate-700 bg-slate-800/40',
                          uncommon: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/30',
                          rare: 'text-blue-400 border-blue-500/40 bg-blue-950/30',
                          epic: 'text-purple-400 border-purple-500/40 bg-purple-950/30',
                          legendary: 'text-amber-400 border-amber-500/50 bg-amber-950/40',
                        };

                        const affinityIcons: Record<string, string> = {
                          fire: '🔥 Apoy',
                          water: '💧 Tubig',
                          earth: '🌿 Lupa',
                          lightning: '⚡ Kidlat',
                          spirit: '✨ Diwa',
                        };

                        return (
                          <div
                            key={item.id}
                            className="p-4 rounded-2xl border border-slate-800 bg-[#161F30] hover:border-cyan-500/40 transition-all flex flex-col justify-between group shadow-sm"
                          >
                            <div>
                              <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-2.5">
                                  <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">
                                    {item.icon}
                                  </div>
                                  <div>
                                    <div className="flex items-center space-x-1.5">
                                      <span className="font-bold text-white font-mono text-xs block">
                                        {item.name}
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-sans text-cyan-400/80 block">
                                      {item.tagalogName}
                                    </span>
                                  </div>
                                </div>

                                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-xs font-black border border-cyan-500/30">
                                  x{item.count}
                                </span>
                              </div>

                              <div className="mt-2.5 flex items-center space-x-2">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                                    rarityColors[item.rarity] || rarityColors.common
                                  }`}
                                >
                                  {item.rarity} {item.category}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400">
                                  {affinityIcons[item.elementalAffinity]}
                                </span>
                              </div>

                              <p className="mt-2 text-[11px] text-slate-300 font-sans line-clamp-2">
                                {item.description}
                              </p>
                            </div>

                            <div className="mt-3.5 pt-3 border-t border-slate-800 flex items-center justify-between">
                              <div>
                                <span className="text-[10px] text-slate-400 font-mono block">Halaga sa Swap:</span>
                                <span className="text-amber-400 font-mono font-black text-xs">
                                  +{item.swapPisoValue} ₱PISO bawat isa
                                </span>
                              </div>

                              <div className="flex items-center space-x-1.5">
                                <button
                                  onClick={() => handleSwapSingleMaterial(item.id, 1)}
                                  className="px-2.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 border border-cyan-500/40 font-mono text-xs font-bold transition-all shadow-sm active:scale-95"
                                  title="Ipalit ang 1 piraso sa $PISO"
                                >
                                  Ipalit (1x)
                                </button>
                                {item.count > 1 && (
                                  <button
                                    onClick={() => handleSwapSingleMaterial(item.id, item.count)}
                                    className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-emerald-500/20 hover:from-amber-500 hover:to-emerald-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 font-mono text-xs font-bold transition-all shadow-sm active:scale-95"
                                    title={`Ipalit ang lahat ng ${item.count} piraso sa $PISO`}
                                  >
                                    Lahat (+{item.swapPisoValue * item.count} ₱)
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Auction Creation Modal Overlay */}
            {auctioningItem && (
              <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
                <div className="relative w-full max-w-md bg-[#0F172A] border-2 border-amber-500/80 rounded-2xl p-5 shadow-[0_0_40px_rgba(245,158,11,0.3)] space-y-4 font-mono">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center space-x-2">
                      <Gavel className="w-5 h-5 text-amber-400" />
                      <h3 className="font-bold text-white text-sm">I-bidding sa P2P Auction Board</h3>
                    </div>
                    <button
                      onClick={() => setAuctioningItem(null)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Selected Item Preview */}
                  <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-3xl">{auctioningItem.icon}</span>
                    <div>
                      <span className="font-bold text-white block text-xs">{auctioningItem.name}</span>
                      <span className="text-[10px] text-amber-400 uppercase font-bold">
                        {auctioningItem.rarity} {auctioningItem.category}
                      </span>
                    </div>
                  </div>

                  {/* Form Inputs */}
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="text-slate-300 block mb-1">Simulang Bid (Starting Price in $PISO):</label>
                      <input
                        type="number"
                        min="10"
                        value={startBidInput}
                        onChange={(e) => setStartBidInput(Math.max(10, parseInt(e.target.value) || 10))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-amber-300 font-bold focus:border-amber-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 block mb-1">Instant Buyout Price in $PISO:</label>
                      <input
                        type="number"
                        min={startBidInput}
                        value={buyoutInput}
                        onChange={(e) => setBuyoutInput(Math.max(startBidInput, parseInt(e.target.value) || startBidInput))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-emerald-300 font-bold focus:border-emerald-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 block mb-1">Tagal ng Auction (Duration):</label>
                      <div className="grid grid-cols-4 gap-2">
                        {[15, 60, 240, 1440].map((mins) => (
                          <button
                            key={mins}
                            type="button"
                            onClick={() => setDurationInput(mins)}
                            className={`py-1.5 rounded-lg text-center font-bold text-[11px] transition-all ${
                              durationInput === mins
                                ? 'bg-amber-400 text-slate-950 font-black'
                                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                            }`}
                          >
                            {mins < 60 ? `${mins}m` : mins === 60 ? '1h' : mins === 240 ? '4h' : '24h'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 font-sans leading-tight">
                      ℹ️ Kapag nabili, may 1% deflationary burn tax alinsunod sa smart contract ng{' '}
                      <span className="text-amber-400 font-mono">PISOMarketplace.sol</span>.
                    </p>
                  </div>

                  {/* Submit Buttons */}
                  <div className="pt-2 flex items-center space-x-2">
                    <button
                      onClick={handleConfirmCreateAuction}
                      className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition-all"
                    >
                      🔨 I-lista sa P2P Auction
                    </button>
                    <button
                      onClick={() => setAuctioningItem(null)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold"
                    >
                      Kanselahin
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. 3D .GLB Avatar Loader Studio Tab */}
        {activeTab === 'glb' && (
          <div className="p-6 overflow-y-auto max-h-[72vh]">
            <GlbAvatarStudioTab />
          </div>
        )}

        {/* Footer info */}
        <div className="relative z-20 flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-[#161F30]/90 text-xs font-mono text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="text-amber-400 font-bold">[E / Enter]</span>
            <span>I-save at Isara</span>
            <span className="text-slate-600">•</span>
            <span className="text-blue-400 font-bold">[Tab]</span>
            <span>Palitan ang Tab</span>
            <span className="text-slate-600">•</span>
            <span>[Esc] Isara</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            Isara [Esc]
          </button>
        </div>
      </div>
    </div>
  );
};
