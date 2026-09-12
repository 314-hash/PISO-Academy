/**
 * Filipino Humor & Cultural Gear System with Rarity Tiers
 * and Anime Super Powers (Dragon Ball, Naruto, One Piece inspired)
 */

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legend' | 'mythical';
export type ItemSlot = 'weapon' | 'headwear' | 'outfit' | 'back' | 'superpower';

export interface ItemStatBuff {
  label: string;
  value: string;
  color: string;
}

export interface FilipinoItem {
  id: string;
  name: string;
  filipinoName: string;
  slot: ItemSlot;
  rarity: ItemRarity;
  icon: string;
  tagline: string;
  lore: string;
  perk: string;
  stats: ItemStatBuff[];
  colorHex: string;
  meshType: string;
  animeSuperPowerId?: 'kamehameha' | 'chidori' | 'tsinelas' | 'gear5' | 'pun';
}

export const RARITY_CONFIG: Record<
  ItemRarity,
  { name: string; border: string; bg: string; text: string; glow: string; badge: string; hex: string }
> = {
  common: {
    name: 'COMMON',
    border: 'border-slate-500/50',
    bg: 'from-slate-800/80 to-slate-900/90',
    text: 'text-slate-300',
    glow: 'rgba(148, 163, 184, 0.3)',
    badge: 'bg-slate-700/60 text-slate-200 border-slate-500/40',
    hex: '#94A3B8',
  },
  uncommon: {
    name: 'UNCOMMON',
    border: 'border-emerald-500/60',
    bg: 'from-emerald-950/40 to-slate-900/90',
    text: 'text-emerald-400',
    glow: 'rgba(16, 185, 129, 0.4)',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    hex: '#10B981',
  },
  rare: {
    name: 'RARE',
    border: 'border-cyan-500/60',
    bg: 'from-cyan-950/40 to-slate-900/90',
    text: 'text-cyan-400',
    glow: 'rgba(6, 182, 212, 0.4)',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    hex: '#06B6D4',
  },
  epic: {
    name: 'EPIC',
    border: 'border-purple-500/70',
    bg: 'from-purple-950/40 to-slate-900/90',
    text: 'text-purple-400',
    glow: 'rgba(168, 85, 247, 0.45)',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    hex: '#A855F7',
  },
  legend: {
    name: 'LEGEND',
    border: 'border-amber-400/80',
    bg: 'from-amber-950/40 to-slate-900/90',
    text: 'text-amber-400',
    glow: 'rgba(245, 158, 11, 0.5)',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    hex: '#F59E0B',
  },
  mythical: {
    name: 'MYTHICAL',
    border: 'border-rose-500/90 animate-pulse',
    bg: 'from-rose-950/50 via-purple-950/40 to-slate-900/95',
    text: 'text-rose-400',
    glow: 'rgba(239, 68, 68, 0.65)',
    badge: 'bg-gradient-to-r from-rose-500/30 to-amber-500/30 text-rose-200 border-rose-400/60',
    hex: '#EF4444',
  },
};

export const FILIPINO_ITEMS: FilipinoItem[] = [
  // -------------------------------------------------------------
  // COMMON (Practical Filipino Essentials)
  // -------------------------------------------------------------
  {
    id: 'tsinelas-common',
    name: 'Tsinelas ni Nanay (Rookie Edition)',
    filipinoName: 'Mahiwagang Tsinelas',
    slot: 'weapon',
    rarity: 'common',
    icon: '🩴',
    tagline: 'The Flying Rubber Slipper of Accuracy',
    lore: 'Ang walang-kupas na tsinelas ni Nanay. Ayon sa alamat, may built-in GPS tracking ito kahit nakatago ka sa ilalim ng kama.',
    perk: 'Homing projectile with comedic slap noise on impact',
    stats: [
      { label: 'Accuracy', value: '99.9%', color: 'text-emerald-400' },
      { label: 'Mom Disapproval', value: '+150', color: 'text-rose-400' },
    ],
    colorHex: '#38BDF8',
    meshType: 'tsinelas',
    animeSuperPowerId: 'tsinelas',
  },
  {
    id: 'sando-kuya',
    name: 'Sando ni Kuya (Presko White)',
    filipinoName: 'Sando ng Tambay sa Kanto',
    slot: 'outfit',
    rarity: 'common',
    icon: '🎽',
    tagline: '+50 Heat Resistance & Cool Breeze',
    lore: 'Standard uniform tuwing tanghaling tapat sa kanto habang nanonood ng nagbabaraha o nagbibilyar.',
    perk: 'Maximum aerodynamics and +10% sprint speed',
    stats: [
      { label: 'Ventilation', value: '100%', color: 'text-cyan-400' },
      { label: 'Comfort', value: 'MAX', color: 'text-amber-400' },
    ],
    colorHex: '#E2E8F0',
    meshType: 'sandoKuya',
  },
  {
    id: 'good-morning-towel',
    name: 'Good Morning Towel Scarf',
    filipinoName: 'Panyong Good Morning',
    slot: 'headwear',
    rarity: 'common',
    icon: '🧣',
    tagline: 'Sweat Absorption & Morning Vibe',
    lore: 'Nakasabit sa balikat ng bawat masipag na drayber at kargador sa Divisoria. Nagbibigay ng instant sipag aura.',
    perk: 'Immunity to stamina drain during code compilation',
    stats: [
      { label: 'Sweat Shield', value: '+200', color: 'text-emerald-400' },
      { label: 'Morning Spirit', value: '+50 XP', color: 'text-amber-400' },
    ],
    colorHex: '#F1F5F9',
    meshType: 'goodMorningTowel',
  },
  {
    id: 'taho-straw-staff',
    name: 'Baston ng Taho Master',
    filipinoName: 'Tubo ng Matamis na Arnibal',
    slot: 'weapon',
    rarity: 'common',
    icon: '🥤',
    tagline: 'Sweet Arnibal Plasma Vaporizer',
    lore: 'Hawak ng Taho vendor tuwing alas-siete ng umaga habang sumisigaw ng "TAHOOOOO!" na may 120 decibels.',
    perk: 'Sprays sticky golden sugar beams that slow down bugs',
    stats: [
      { label: 'Glucose Surge', value: '+80%', color: 'text-amber-400' },
      { label: 'Sago Density', value: '+40', color: 'text-yellow-400' },
    ],
    colorHex: '#D97706',
    meshType: 'tahoStaff',
  },

  // -------------------------------------------------------------
  // UNCOMMON (Barangay Tech & Street Smarts)
  // -------------------------------------------------------------
  {
    id: 'walis-tambo-whirlwind',
    name: 'Walis Tambo of Whirlwind',
    filipinoName: 'Baguio Soft Broom of Cyclone',
    slot: 'weapon',
    rarity: 'uncommon',
    icon: '🧹',
    tagline: 'Sweeps Dirt & Reentrancy Vulnerabilities',
    lore: 'Galing pa sa Baguio City. Hindi lang alikabok ang nililinis, pati ang unoptimized storage slots sa smart contracts.',
    perk: 'Whirlwind spin attack clearing clutter and memory leaks',
    stats: [
      { label: 'Sweep Radius', value: '4.5m', color: 'text-emerald-400' },
      { label: 'Rattan Durability', value: '+300', color: 'text-cyan-400' },
    ],
    colorHex: '#10B981',
    meshType: 'walisTambo',
  },
  {
    id: 'tabo-cleansing',
    name: 'Tabo of Holy Cleansing',
    filipinoName: 'Banal na Tabo ng Banyo',
    slot: 'weapon',
    rarity: 'uncommon',
    icon: '🪣',
    tagline: 'Infuses +100 Pure Water Splash Aura',
    lore: 'Ang pinakamatatag na sandata sa bawat banyong Pilipino. Mas maaasahan pa sa mamahaling bidet.',
    perk: 'Splashes refreshing cyber water that cleanses debuffs',
    stats: [
      { label: 'Hydration', value: '+500', color: 'text-blue-400' },
      { label: 'Freshness', value: 'OVER 9000', color: 'text-cyan-400' },
    ],
    colorHex: '#06B6D4',
    meshType: 'tabo',
  },
  {
    id: 'jeepney-route-sign',
    name: 'Jeepney Signboard Shield ("Cubao - Ilalim")',
    filipinoName: 'Tatak Cubao Ilalim',
    slot: 'back',
    rarity: 'uncommon',
    icon: '🪧',
    tagline: 'Deflects Traffic & Failed Transactions',
    lore: 'Acrylic board na nakapaskil sa windshield. Walang trapik ang makapipigil kapag dumaan sa Cubao Ilalim.',
    perk: 'Reflects incoming gas spikes and boosts route speed',
    stats: [
      { label: 'Route Speed', value: '+25%', color: 'text-emerald-400' },
      { label: 'Street Cred', value: '+100', color: 'text-amber-400' },
    ],
    colorHex: '#F59E0B',
    meshType: 'jeepneySign',
  },
  {
    id: 'salakot-solar',
    name: 'Salakot of Solar Energy',
    filipinoName: 'Salakot ng Magsasakang Cyber',
    slot: 'headwear',
    rarity: 'uncommon',
    icon: '👒',
    tagline: 'Harvests Solar Energy from the 8-Ray Sun',
    lore: 'Tradisyonal na habi ng kawayan na pinalakas ng photovoltaic nano-threads para sa non-stop solar farming.',
    perk: 'Recharges energy continuously while standing in sunlight',
    stats: [
      { label: 'Solar Recharge', value: '+15/s', color: 'text-amber-400' },
      { label: 'Shade Coverage', value: '100%', color: 'text-emerald-400' },
    ],
    colorHex: '#D97706',
    meshType: 'salakot',
  },

  // -------------------------------------------------------------
  // RARE (Fiesta Power & Karaoke Royalty)
  // -------------------------------------------------------------
  {
    id: 'golden-balut',
    name: 'Golden Balut of Awakening',
    filipinoName: 'Gintong Balut 18-Day Sisiw',
    slot: 'back',
    rarity: 'rare',
    icon: '🥚',
    tagline: '+500 Stamina & Sisiw Feather Aura',
    lore: 'Pinakuluang perlas ng Pateros na binudburan ng rock salt at sili vinegar. Nagbibigay ng lakas ng 10 baka.',
    perk: 'Triggers stamina surge and golden feather particle aura',
    stats: [
      { label: 'Sisiw Power', value: '+999', color: 'text-amber-400' },
      { label: 'Vinegar Punch', value: '+85', color: 'text-red-400' },
    ],
    colorHex: '#F59E0B',
    meshType: 'goldenBalut',
  },
  {
    id: 'kaldero-lid-aegis',
    name: 'Magic Kaldero Lid Aegis',
    filipinoName: 'Talong Kaldero ni Aling Nena',
    slot: 'weapon',
    rarity: 'rare',
    icon: '🛡️',
    tagline: 'Indestructible Kitchen Aegis Shield',
    lore: 'Hawakan sa gitna na may itim na plastic knob. Kayang salagin ang kahit anong tama ng bala, kidlat, o sermon.',
    perk: 'Blocks 80% incoming projectile damage with a loud "KLANG!"',
    stats: [
      { label: 'Armor Class', value: '+240', color: 'text-cyan-400' },
      { label: 'Sinigang Heat', value: 'BOILING', color: 'text-amber-400' },
    ],
    colorHex: '#94A3B8',
    meshType: 'kalderoLid',
  },
  {
    id: 'karaoke-mic-stun',
    name: "Tito's High-Pitch Karaoke Mic",
    filipinoName: 'Mahiwagang Mikropono ng Videoke',
    slot: 'weapon',
    rarity: 'rare',
    icon: '🎤',
    tagline: 'Plays "My Way" with 100-Score Sonic Blast',
    lore: 'Kapag hinawakan ito ni Tito sa inuman pagkatapos ng alas-diyes, walang makakabawi hangga\'t hindi nakaka-100 score.',
    perk: 'Emits a sonic shockwave that disorients nearby entities',
    stats: [
      { label: 'Decibel Output', value: '140 dB', color: 'text-purple-400' },
      { label: 'Videoke Score', value: '100!', color: 'text-amber-400' },
    ],
    colorHex: '#A855F7',
    meshType: 'microphone',
  },
  {
    id: 'sun-visor-cyber',
    name: 'PISO Chain Sun Visor 2090',
    filipinoName: 'Holographic Visor ng Bayan',
    slot: 'headwear',
    rarity: 'rare',
    icon: '🥽',
    tagline: 'Inspects Block Transactions in Real-Time',
    lore: 'Cyber visor na may heads-up display ng PISO Chain gas price, block number, at validator heartbeat.',
    perk: 'Highlights nearby validators and interactive monuments',
    stats: [
      { label: 'Blockchain HUD', value: 'ACTIVE', color: 'text-cyan-400' },
      { label: 'Night Vision', value: '+100m', color: 'text-emerald-400' },
    ],
    colorHex: '#06B6D4',
    meshType: 'sunVisor',
  },

  // -------------------------------------------------------------
  // EPIC (National Legends & Cyber Tech)
  // -------------------------------------------------------------
  {
    id: 'barong-cyber',
    name: 'Barong Tagalog of Cyber Integrity',
    filipinoName: 'Piña-Fiber Barong na may Neon Circuits',
    slot: 'outfit',
    rarity: 'epic',
    icon: '👔',
    tagline: 'Woven with Lumban Piña & Luminescent Optical Fibers',
    lore: 'Pormal na kasuotan ng mga Web3 diplomat sa New Manila. Marangal tingnan, pero may bulletproof nano-fibers.',
    perk: '+20% All Learning Track XP & Respected by all NPC Mentors',
    stats: [
      { label: 'Dignity', value: '+1,500', color: 'text-purple-400' },
      { label: 'Nano Weave', value: 'Lv. 5', color: 'text-cyan-400' },
    ],
    colorHex: '#E0E7FF',
    meshType: 'barongCyber',
  },
  {
    id: 'kampilan-lapulapu',
    name: 'Kampilan Plasma Blade of Mactan',
    filipinoName: 'Kampilan ni Lapu-Lapu',
    slot: 'weapon',
    rarity: 'epic',
    icon: '⚔️',
    tagline: 'Laser-Edged Legendary Chieftain Cutlass',
    lore: 'Ang espada na nagtanggol sa Mactan noong 1521, muling pinanday gamit ang high-frequency blue plasma cutter.',
    perk: 'Slashing attack unleashes neon arc waves that slice obstacles',
    stats: [
      { label: 'Plasma Heat', value: '10,000 K', color: 'text-cyan-400' },
      { label: 'Defiance', value: 'MAXIMUM', color: 'text-purple-400' },
    ],
    colorHex: '#06B6D4',
    meshType: 'kampilan',
  },
  {
    id: 'bakunawa-wings',
    name: 'Bakunawa Moon-Devourer Dragon Wings',
    filipinoName: 'Pakpak ng Bakunawa',
    slot: 'back',
    rarity: 'epic',
    icon: '🐉',
    tagline: 'Bioluminescent Lunar Serpent Wings',
    lore: 'Pakpak ng higanteng dragong dagat na lumunok sa pitong buwan ayon sa sinaunang mitolohiya ng Kabisayaan.',
    perk: '+30% Mid-Air Double Jump Altitude & Gliding Duration',
    stats: [
      { label: 'Flight Lift', value: '+45%', color: 'text-purple-400' },
      { label: 'Lunar Shadow', value: '7 Moons', color: 'text-blue-400' },
    ],
    colorHex: '#8B5CF6',
    meshType: 'bakunawaWings',
  },
  {
    id: 'power-chidori',
    name: 'Chidori ng Meralco (Super Power)',
    filipinoName: 'Kidlat ng Meralco (Naruto Jutsu)',
    slot: 'superpower',
    rarity: 'epic',
    icon: '⚡',
    tagline: 'High-Voltage Electric Chirp Surge & Ground Tremor',
    lore: 'Pinaghalong Chidori ni Kakashi at monthly electric bill ng Meralco. Kapag tumama, ramdam hanggang kabilang kanto.',
    perk: 'Fires forward lightning beam with electric dome explosion & screen shake',
    stats: [
      { label: 'Voltage', value: '1.21 GW', color: 'text-purple-400' },
      { label: 'Screen Tremor', value: 'MAGNITUDE 7', color: 'text-amber-400' },
    ],
    colorHex: '#A855F7',
    meshType: 'superpower',
    animeSuperPowerId: 'chidori',
  },

  // -------------------------------------------------------------
  // LEGEND (Super Saiyan Datu & Ancient Anting-Anting)
  // -------------------------------------------------------------
  {
    id: 'agimat-nardo',
    name: 'Agimat ni Nardong Dikit',
    filipinoName: 'Gintong Anting-Anting na may Baybayin Runes',
    slot: 'weapon',
    rarity: 'legend',
    icon: '🧿',
    tagline: 'Invulnerability Talisman with Floating Golden Runes',
    lore: 'Sinaunang medalyong tanso na may orasyon sa Baybayin. Sinasabing hindi tinatablan ng kahit anong sumpa at smart contract bugs.',
    perk: 'Floating shield that absorbs heavy blows and counters with light',
    stats: [
      { label: 'Invulnerability', value: '99.9%', color: 'text-amber-400' },
      { label: 'Ancient Orasyon', value: 'ACTIVE', color: 'text-yellow-300' },
    ],
    colorHex: '#F59E0B',
    meshType: 'agimat',
  },
  {
    id: 'datu-sun-crown',
    name: 'Super Datu 8-Ray Golden Crown',
    filipinoName: 'Putong ng Datu Supremo',
    slot: 'headwear',
    rarity: 'legend',
    icon: '👑',
    tagline: 'Radiates the 8 Golden Rays of Philippine Sovereignty',
    lore: 'Iginagawad lamang sa mga Arkitekto ng PISO Chain. Nagpapanatili ng balanse ng PoS consensus sa buong kapuluan.',
    perk: 'Radiates spinning golden rays that illuminate the entire metaverse',
    stats: [
      { label: 'Consensus Power', value: '+2,026,001', color: 'text-amber-400' },
      { label: 'Royal Halo', value: '8 Rays', color: 'text-yellow-300' },
    ],
    colorHex: '#FBBF24',
    meshType: 'datuCrown',
  },
  {
    id: 'power-kamehame-piso',
    name: 'Kamehame-PISO (Super Power)',
    filipinoName: 'Kamehame-PISO (Dragon Ball Ki Blast)',
    slot: 'superpower',
    rarity: 'legend',
    icon: '💥',
    tagline: 'It\'s Over 9,000 PISOS! Massive Laser Beam Blast',
    lore: 'Ang pinakamalakas na energy beam sa New Manila. Pinagsamang lakas ng lahat ng Filipino builders para magpalipad ng higanteng laser!',
    perk: 'Charges up ki sphere, fires massive laser beam, explodes in fiery dome with heavy screen shake!',
    stats: [
      { label: 'Power Level', value: 'OVER 9,000!', color: 'text-amber-400' },
      { label: 'Impact Radius', value: '18 Meters', color: 'text-rose-400' },
    ],
    colorHex: '#F59E0B',
    meshType: 'superpower',
    animeSuperPowerId: 'kamehameha',
  },
  {
    id: 'power-gear5',
    name: 'Gear 5 Loko-Loko Bounce (Super Power)',
    filipinoName: 'Gear 5 Joyboy ng Pilipinas',
    slot: 'superpower',
    rarity: 'legend',
    icon: '🤪',
    tagline: 'Elastic Joyboy Sky Bounce & Comic Earth Shaker',
    lore: 'Inspirasyon mula kay Luffy Gear 5. Ang avatar ay tumatalbog sa ulap at lumalapag nang may cartoon comic earthquake!',
    perk: 'Squish scale bounce, soaring sky leap, giant rubber shockwave and screen shake!',
    stats: [
      { label: 'Rubber Elasticity', value: '∞', color: 'text-amber-400' },
      { label: 'Laughter Power', value: 'MAX JOY', color: 'text-yellow-300' },
    ],
    colorHex: '#FDE047',
    meshType: 'superpower',
    animeSuperPowerId: 'gear5',
  },

  // -------------------------------------------------------------
  // MYTHICAL (Primordial Deities & Cyber Supreme)
  // -------------------------------------------------------------
  {
    id: 'bathala-kilat',
    name: "Bathala's Primordial Cosmic Kilat",
    filipinoName: 'Kidlat ni Bathalang Maykapal',
    slot: 'weapon',
    rarity: 'mythical',
    icon: '🔱',
    tagline: 'The Supreme Creator God\'s Golden Lightning Scepter',
    lore: 'Ang banal na kidlat na ginamit ni Bathala upang likhain ang kalangitan at karagatan. Pinalilibutan ng umiikot na celestial rings.',
    perk: 'Strikes the ground to summon celestial lightning bolts and rainbow shockwaves',
    stats: [
      { label: 'Divine Authority', value: 'GENESIS', color: 'text-rose-400' },
      { label: 'Cosmic Kilat', value: '∞ Terawatts', color: 'text-amber-400' },
    ],
    colorHex: '#EF4444',
    meshType: 'bathalaKilat',
  },
  {
    id: 'god-jeepney-transformer',
    name: 'God Emperor Jeepney Transformer Exosuit',
    filipinoName: 'Hari ng Kalsada 2090 Prime',
    slot: 'outfit',
    rarity: 'mythical',
    icon: '🤖',
    tagline: 'Fully Mechanized Cyberpunk Jeepney Battle Chassis',
    lore: 'Stainless steel chrome armor na may dual dieselpunk exhaust jetpacks, LED headlights, at stainless kabayo sa balikat.',
    perk: 'Turbo flight thrusters, heavy collision deflection, and chrome reflections',
    stats: [
      { label: 'Horsepower', value: '5,000 HP', color: 'text-rose-400' },
      { label: 'Stainless Chrome', value: '100% Mirror', color: 'text-cyan-400' },
    ],
    colorHex: '#EF4444',
    meshType: 'godJeepney',
  },
  {
    id: 'sarimanok-wings',
    name: 'Rainbow Prismatic Wings of Sarimanok',
    filipinoName: 'Makukulay na Pakpak ng Sarimanok',
    slot: 'back',
    rarity: 'mythical',
    icon: '🪶',
    tagline: 'Mythical Rainbow Phoenix of Good Fortune & Prosperity',
    lore: 'Ang maalamat na ibon ng Maranao. Bawat balahibo ay kumikislap sa pitong kulay ng bahaghari at nagdadala ng suwerte sa blockchain.',
    perk: 'Perpetual prismatic particle trail and frictionless hovering',
    stats: [
      { label: 'Prismatic Aura', value: '7 Colors', color: 'text-rose-400' },
      { label: 'Good Fortune', value: '+100% Luck', color: 'text-amber-400' },
    ],
    colorHex: '#EC4899',
    meshType: 'sarimanokWings',
  },
  {
    id: 'power-pun-launcher',
    name: 'Bayanihan Pun & Banat Launcher',
    filipinoName: 'Pabrika ng Banat at Chismis',
    slot: 'superpower',
    rarity: 'mythical',
    icon: '🗣️',
    tagline: 'Summons Hilarious Filipino Puns in 3D Comic Balloons',
    lore: 'Sinasabing mas mabilis pa sa fiber optic ang tsismis sa kanto. Naglalabas ng 3D floating banats na may kasamang confetti at crowd laughter!',
    perk: 'Pops up random witty Filipino builder puns in 3D comic balloons with sound & confetti!',
    stats: [
      { label: 'Wit & Humor', value: '100/100', color: 'text-amber-400' },
      { label: 'Chismis Speed', value: '300,000 km/s', color: 'text-purple-400' },
    ],
    colorHex: '#A855F7',
    meshType: 'superpower',
    animeSuperPowerId: 'pun',
  },
];

// 25+ Hilarious Filipino Builder Puns and Banats
export const FILIPINO_PUNS: string[] = [
  "Barya lang po sa umaga, pero ang lakas ko pang-gabi! ₱⚡",
  "Walang sukli ang pag-ibig, pero may gas fee ang PISO! 💸❤️",
  "Parang smart contract ang puso ko: immutable ang pagtingin sa'yo! 📜💖",
  "Tsinelas ni Nanay never misses a target! 🩴🎯",
  "IT'S OVER 9,000 PISOS! 🔥💥",
  "Sabi nila gas fee daw... eh bakit puso ko ang sumasakit? ⛽💔",
  "Parang zero-knowledge proof ka: alam kong totoo pero di ko maipaliwanag! 🧠✨",
  "Kape muna bago mag-deploy, para hindi mag-revert ang buhay! ☕🚀",
  "Para kang consensus: kailangan kita para umusad ang block ko! ⛓️🤝",
  "Ang taong nagigipit, sa PISO faucet kumakapit! 💧🪙",
  "Huwag kang mag-alala, decentralized ang pag-ibig ko sa'yo! 🌐💘",
  "Kahit gaano kalalim ang reentrancy bug, iaahon kita! 🛡️⚒️",
  "Si Nanay may tsinelas, si Datu may agimat, ako... may PISO lang! 🇵🇭👑",
  "Para kang hard fork: nagbago man ang direksyon, mahal pa rin kita! 🔀❤️",
  "Ang hindi marunong lumingon sa genesis block, hindi makakarating sa ATH! 🚀🌕",
  "Loko-loko mode activated! Joyboy ng New Manila! 🤪🎪",
  "Chidori ng Meralco! Hindi ka na mababayaran sa taas ng kuryente! ⚡💡",
  "Kamehame-PISO! Wasakin ang lahat ng vulnerabilities! 💥🔥",
  "Bawal tumawid, nakamamatay... mag-PISO bridge na lang! 🌉",
  "May nanalo na ba? Syempre mga PISO Builders! 🏆🇵🇭",
  "Walang iwanan sa bear market, sabay-sabay tayong mag-code! 🐻💻",
  "Mainit ang panahon? Presko ang sando ni Kuya! 🎽😎",
  "Katunayan credential verified: 100% Certified Makulit! 📜🎉",
];

export interface AnimeSkillDef {
  id: string;
  name: string;
  filipinoName: string;
  animeOrigin: 'Dragon Ball' | 'Naruto' | 'One Piece' | 'Filipino Street Legend' | 'Baguio Myth' | 'Ancestral Bathala' | 'Filipino Culture';
  hotkey: string;
  icon: string;
  damage: number;
  cooldown: number; // in seconds, proportional to damage
  screenShake: number;
  color: string;
  critText: string;
  description: string;
}

export const ANIME_SKILLS: AnimeSkillDef[] = [
  {
    id: 'kamehameha',
    name: 'Kamehame-PISO',
    filipinoName: 'Wasak ang Vulnerabilities',
    animeOrigin: 'Dragon Ball',
    hotkey: '1',
    icon: '💥',
    damage: 3500,
    cooldown: 12.0,
    screenShake: 2.2,
    color: '#06B6D4',
    critText: '💥 3,500 SUPERNOVA PLASMA!',
    description: '28m colossal cyan Ki beam + expanding supernova fireball + ground shockwave.',
  },
  {
    id: 'chidori',
    name: 'Chidori ng Meralco',
    filipinoName: 'Isang Libong Ibon',
    animeOrigin: 'Naruto',
    hotkey: '2',
    icon: '⚡',
    damage: 1200,
    cooldown: 6.0,
    screenShake: 1.6,
    color: '#A855F7',
    critText: '⚡ 1,200 PIERCING SHOCK!',
    description: '1.21 GW electric thrust surrounded by jagged purple lightning arcs.',
  },
  {
    id: 'tsinelas',
    name: 'Tsinelas ni Nanay',
    filipinoName: 'Homing Pamalo',
    animeOrigin: 'Filipino Street Legend',
    hotkey: '3',
    icon: '🩴',
    damage: 650,
    cooldown: 4.0,
    screenShake: 1.8,
    color: '#0284C7',
    critText: '🩴 650 DISCIPLINE SLAP!',
    description: 'Parabolic homing flying slipper with cartoon pop-art BAM! explosion.',
  },
  {
    id: 'gear5',
    name: 'Gear 5 Loko-Loko',
    filipinoName: 'Sun God Nika Bounce',
    animeOrigin: 'One Piece',
    hotkey: '4',
    icon: '🤪',
    damage: 9999,
    cooldown: 25.0,
    screenShake: 2.4,
    color: '#FACC15',
    critText: '🌟 9,999 MAXIMUM OVERKILL!',
    description: 'Joyboy squash-and-stretch bounce, sky leap, and ground tremor slam.',
  },
  {
    id: 'rasengan',
    name: 'Rasengan ng Baguio',
    filipinoName: 'Umiikot na Hangin',
    animeOrigin: 'Naruto',
    hotkey: '5',
    icon: '🌀',
    damage: 2200,
    cooldown: 8.5,
    screenShake: 1.8,
    color: '#38BDF8',
    critText: '🌀 2,200 SPIRAL VORTEX!',
    description: 'Spinning vortex Ki sphere in right palm rushing forward into a whirlwind blast.',
  },
  {
    id: 'gatling',
    name: 'Sapapok Gatling',
    filipinoName: 'Bayanihan Rapid Fist',
    animeOrigin: 'One Piece',
    hotkey: '6',
    icon: '🥊',
    damage: 1800,
    cooldown: 7.0,
    screenShake: 1.5,
    color: '#F97316',
    critText: '🥊 1,800 RAPID COMBO!',
    description: 'Staccato barrage of rubber punches with comic impact starbursts.',
  },
  {
    id: 'lightning_storm',
    name: "Bathala's Lightning Storm",
    filipinoName: 'Kidlat ng Kalangitan',
    animeOrigin: 'Ancestral Bathala',
    hotkey: '7',
    icon: '⛈️',
    damage: 5000,
    cooldown: 16.0,
    screenShake: 2.2,
    color: '#EAB308',
    critText: '⛈️ 5,000 DIVINE WRATH!',
    description: 'Summons 5 celestial lightning bolts from the clouds striking ground rings.',
  },
  {
    id: 'cyclone_spin',
    name: 'Walis Cyclone Spin',
    filipinoName: 'Ipu-ipo ng Tambo',
    animeOrigin: 'Baguio Myth',
    hotkey: '8',
    icon: '🌪️',
    damage: 1400,
    cooldown: 6.5,
    screenShake: 1.4,
    color: '#10B981',
    critText: '🌪️ 1,400 SWEEP DAMAGE!',
    description: '360° rapid tornado avatar spin sweeping away bad code, spam, and gas fees.',
  },
  {
    id: 'hydro_wave',
    name: 'Tabo Hydro Surge',
    filipinoName: 'Buhos ng Basbas',
    animeOrigin: 'Filipino Street Legend',
    hotkey: '9',
    icon: '🌊',
    damage: 800,
    cooldown: 5.0,
    screenShake: 1.3,
    color: '#06B6D4',
    critText: '🌊 800 PURIFIED DELUGE!',
    description: 'Deluges the battlefield with a high-pressure holy cyber water tidal wave.',
  },
  {
    id: 'pun',
    name: 'Pinoy Banat / Pun',
    filipinoName: 'Kanto Humor & Chismis',
    animeOrigin: 'Filipino Culture',
    hotkey: '0',
    icon: '🗣️',
    damage: 100,
    cooldown: 2.0,
    screenShake: 0.6,
    color: '#EC4899',
    critText: '❤️ 100 EMOTIONAL DAMAGE!',
    description: 'Pops up 3D floating comic speech balloons with hilarious builder humor.',
  },
];

export const EQUIP_ALL_PRESET = {
  weapon: 'kampilan-lapulapu',
  shield: 'kaldero-lid-aegis',
  headwear: 'salakot-solar',
  towel: 'good-morning-towel',
  crown: 'datu-sun-crown',
  back: 'sarimanok-wings',
  signboard: 'jeepney-route-sign',
  amulet: 'agimat-anting',
  tabo: 'tabo-cleansing',
  superpower: 'kamehameha' as const,
};

