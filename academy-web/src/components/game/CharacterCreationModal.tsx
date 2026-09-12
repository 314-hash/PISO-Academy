import React, { useState } from 'react';
import { useAcademy, HumanAvatarConfig } from '../../context/AcademyContext';
import { WalletService } from '../../services/walletService';
import { SoundFX } from '../../services/soundFX';
import {
  User,
  Wallet,
  Sparkles,
  Check,
  X,
  ArrowRight,
  Shield,
  Key,
  Globe,
  RefreshCw,
  Award,
} from 'lucide-react';

interface CharacterCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CharacterCreationModal: React.FC<CharacterCreationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    wallet,
    setHumanAvatar,
    mintOrBindAvatarNft,
    connectExistingWallet,
    connectInjectedWallet,
    setNotification,
    avatarNft,
  } = useAcademy();

  // Multi-step creation workflow: 1: Wallet Setup -> 2: Character Base Design -> 3: NFT Mint Confirmation
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Wallet Setup State
  const [walletChoice, setWalletChoice] = useState<'new' | 'existing' | 'later'>('new');
  const [existingKeyInput, setExistingKeyInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  // Character Base Appearance State (Default No Costume)
  const [name, setName] = useState('Bagong Mandirigma');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [skinTone, setSkinTone] = useState('#8D5524'); // Default Kayumanggi
  const [hairStyle, setHairStyle] = useState<HumanAvatarConfig['hairStyle']>('cyberFade');
  const [hairColor, setHairColor] = useState('#0B0F17');

  if (!isOpen) return null;

  // Step 1: Wallet Confirmation & Proceed
  const handleProceedToDesign = async () => {
    SoundFX.playClick();
    if (walletChoice === 'new') {
      // Generate ephemeral burner keypair
      WalletService.getOrCreateBurnerWallet();
      setStep(2);
    } else if (walletChoice === 'existing') {
      if (!existingKeyInput.trim()) {
        setNotification({
          message: 'Pakilagay ang iyong Private Key o 12-Word Mnemonic Phrase, o pindutin ang MetaMask!',
          type: 'error',
        });
        return;
      }
      try {
        setIsConnecting(true);
        await connectExistingWallet(existingKeyInput.trim());
        setStep(2);
      } catch (err: any) {
        setNotification({
          message: err.message || 'Hindi nakakonekta ang wallet.',
          type: 'error',
        });
      } finally {
        setIsConnecting(false);
      }
    } else {
      // Connect Later (Guest mode)
      setNotification({
        message: 'Nagsimula bilang Guest Explorer! Maaari mong ikonekta ang iyong MetaMask o Web3 wallet anumang oras.',
        type: 'info',
      });
      setStep(2);
    }
  };

  const handleConnectInjected = async () => {
    try {
      setIsConnecting(true);
      SoundFX.playClick();
      await connectInjectedWallet();
      setStep(2);
    } catch (err: any) {
      setNotification({
        message: err.message || 'Nabigo ang koneksyon sa browser wallet.',
        type: 'error',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Step 3: Mint Avatar NFT and Launch into Metaverse
  const handleFinalizeAvatar = () => {
    SoundFX.playLevelUp();

    // 1. Configure default avatar with NO COSTUME (Plain white t-shirt, clean denim, 0 pre-equipped weapons)
    const plainAvatar: HumanAvatarConfig = {
      gender,
      name,
      skinTone,
      hairStyle,
      hairColor,
      outfit: 'plainTshirt',
      accessory: 'none',
      backCrest: 'none',
      cape: 'none',
      hasBeard: false,
      uploadedTextureUrl: '',
      uploadedFileName: '',
      aiPrompt: `PISO Character NFT: ${name} — Clean plain t-shirt, neutral starter explorer without costume`,
      auraColor: '#06B6D4',
      bodyType: 'athletic',
      petDrone: {
        enabled: false,
        skin: 'panday',
        auraColor: '#06B6D4',
      },
      equippedPinoyItems: {
        weapon: '',
        shield: '',
        headwear: '',
        towel: '',
        crown: '',
        back: '',
        signboard: '',
        amulet: '',
        tabo: '',
        allEquipped: false,
        superpower: 'kamehameha',
      },
    };

    setHumanAvatar(plainAvatar);

    // 2. Mint / Bind on-chain Avatar NFT
    const dnaHash = `piso_dna_${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
    const nft = mintOrBindAvatarNft(name, gender, dnaHash, wallet.address || undefined);

    setNotification({
      message: `🎉 Matagumpay na nilikha ang iyong Avatar NFT #${nft.tokenId} ("${name}") sa PISO Chain nang WALANG KOSTUM!`,
      type: 'success',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-mono">
      <div className="relative w-full max-w-2xl bg-[#0F172A] border-2 border-cyan-500/80 rounded-3xl p-6 shadow-[0_0_50px_rgba(6,182,212,0.35)] flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-300">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-wide uppercase">
                PISO Character Creation & Avatar NFT Studio
              </h2>
              <span className="text-[11px] text-cyan-400">
                Hakbang {step} ng 3: {step === 1 ? 'Pumili ng Wallet' : step === 2 ? 'Base Karakter (Walang Kostum)' : 'I-mint ang Avatar NFT'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step 1: Wallet Selection */}
        {step === 1 && (
          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
            <p className="text-xs text-slate-300 font-sans">
              Ang iyong 3D Avatar ay isang on-chain <strong>NFT sa PISO Chain</strong>. Maaari kang magsimula gamit ang isang <strong>bagong wallet</strong>, ikonekta ang iyong <strong>umiiral na wallet</strong>, o magpatuloy muna bilang guest at <strong>magkonekta mamaya</strong>.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Option 1: New Wallet */}
              <button
                type="button"
                onClick={() => setWalletChoice('new')}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  walletChoice === 'new'
                    ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/30 flex items-center justify-center text-cyan-300 mb-2">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-white text-xs">Bagong Wallet</h4>
                  <p className="text-[11px] text-slate-400 font-sans mt-1">
                    Agad na lumikha ng bagong disposable keypair sa PISO Chain.
                  </p>
                </div>
                <span className="text-[10px] text-cyan-300 font-bold mt-3">⚡ 1-Click Instant</span>
              </button>

              {/* Option 2: Existing Wallet */}
              <button
                type="button"
                onClick={() => setWalletChoice('existing')}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  walletChoice === 'existing'
                    ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-amber-500/30 flex items-center justify-center text-amber-300 mb-2">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-white text-xs">Umiiral na Wallet</h4>
                  <p className="text-[11px] text-slate-400 font-sans mt-1">
                    Ikonekta ang MetaMask, Rabby, o i-import ang iyong private key.
                  </p>
                </div>
                <span className="text-[10px] text-amber-300 font-bold mt-3">🔗 Web3 Connect</span>
              </button>

              {/* Option 3: Connect Later */}
              <button
                type="button"
                onClick={() => setWalletChoice('later')}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  walletChoice === 'later'
                    ? 'bg-purple-500/20 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-purple-500/30 flex items-center justify-center text-purple-300 mb-2">
                    <Globe className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-white text-xs">Ikonekta Mamaya</h4>
                  <p className="text-[11px] text-slate-400 font-sans mt-1">
                    Maglaro agad bilang Guest. Maaari mong i-bind ang wallet anumang oras.
                  </p>
                </div>
                <span className="text-[10px] text-purple-300 font-bold mt-3">⏳ Connect Later</span>
              </button>
            </div>

            {/* Existing Wallet Input Details */}
            {walletChoice === 'existing' && (
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">I-konekta gamit ang Browser o Key:</span>
                  <button
                    type="button"
                    onClick={handleConnectInjected}
                    disabled={isConnecting}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-sm active:scale-95"
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span>MetaMask / Rabby</span>
                  </button>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">
                    O ilagay ang iyong Private Key / 12-Word Mnemonic Phrase:
                  </label>
                  <input
                    type="password"
                    value={existingKeyInput}
                    onChange={(e) => setExistingKeyInput(e.target.value)}
                    placeholder="0x... o 12 salita ng mnemonic"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Base Character Customization (No Costume) */}
        {step === 2 && (
          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center space-x-2 text-cyan-300 text-xs">
              <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                <strong>DEFAULT NO COSTUME:</strong> Ang iyong karakter ay magsisimula sa payak na kasuotan (white t-shirt at shorts). Lahat ng armas at relikya ay iyong mapupulot at ikakabit habang naglalaro!
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Name & Gender */}
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Pangalan ng Hero:</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-400 font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Kasarian (Gender):</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setGender('male')}
                      className={`py-2 rounded-xl text-xs font-bold transition border ${
                        gender === 'male'
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-sm'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      Lalaki (Male)
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('female')}
                      className={`py-2 rounded-xl text-xs font-bold transition border ${
                        gender === 'female'
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-sm'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      Babae (Female)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Estilo ng Buhok:</label>
                  <select
                    value={hairStyle}
                    onChange={(e) => setHairStyle(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="cyberFade">Cyber Fade (Clean Street)</option>
                    <option value="modernUndercut">Modern Undercut</option>
                    <option value="datuLongWavy">Datu Wavy Locks</option>
                    <option value="sleekBun">Sleek Top Bun</option>
                    <option value="shavedBuzz">Shaved Buzz</option>
                  </select>
                </div>
              </div>

              {/* Right Column: Skin Tone & Color Palette */}
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Kulay ng Balat (Skin Tone):</label>
                  <div className="flex items-center space-x-2">
                    {[
                      { label: 'Kayumanggi', hex: '#8D5524' },
                      { label: 'Morena', hex: '#C68642' },
                      { label: 'Mestizo', hex: '#E0AC69' },
                      { label: 'Kaligatan', hex: '#633B19' },
                    ].map((tone) => (
                      <button
                        key={tone.hex}
                        type="button"
                        onClick={() => setSkinTone(tone.hex)}
                        className={`w-9 h-9 rounded-xl border-2 transition ${
                          skinTone === tone.hex ? 'border-cyan-400 scale-110 shadow-md' : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: tone.hex }}
                        title={tone.label}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Kulay ng Buhok:</label>
                  <div className="flex items-center space-x-2">
                    {[
                      { label: 'Itim (Black)', hex: '#0B0F17' },
                      { label: 'Kayumanggi (Brown)', hex: '#451A03' },
                      { label: 'Ginto (Bleached)', hex: '#D97706' },
                      { label: 'Cyber Pilak (Silver)', hex: '#94A3B8' },
                    ].map((col) => (
                      <button
                        key={col.hex}
                        type="button"
                        onClick={() => setHairColor(col.hex)}
                        className={`w-9 h-9 rounded-xl border-2 transition ${
                          hairColor === col.hex ? 'border-cyan-400 scale-110 shadow-md' : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: col.hex }}
                        title={col.label}
                      />
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Panimulang Kasuotan:</span>
                  <div className="flex items-center space-x-2 text-xs text-white">
                    <span>👕</span>
                    <span className="font-bold">Payak na Sandô / White T-Shirt & Denim Shorts</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 block mt-1">✓ 0 Items Equipped (Clean Starter Slate)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Avatar NFT Confirmation */}
        {step === 3 && (
          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
            <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-cyan-950/30 to-slate-900 border-2 border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.2)] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Award className="w-5 h-5 text-cyan-400" />
                  <span className="font-bold text-white text-sm">PISO AVATAR NFT CERTIFICATE</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-black border border-cyan-500/40">
                  TOKEN #{(avatarNft?.tokenId || Math.floor(Date.now() / 1000)).toString().slice(-4)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Pangalan ng Hero:</span>
                  <span className="text-white font-bold text-sm">{name}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Kasarian at Antas:</span>
                  <span className="text-cyan-300 font-bold text-sm uppercase">{gender} • Antas 1</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Kasuotan (Costume):</span>
                  <span className="text-amber-400 font-bold">Walang Kostum (Default)</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Owner Wallet:</span>
                  <span className="text-slate-300 font-bold truncate block">
                    {wallet.address ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : 'Guest (To be bound)'}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-300 font-sans">
                Ang iyong Avatar NFT ay magsisilbing iyong permanenteng on-chain pagkakakilanlan sa buong PISO Metaverse. Lahat ng iyong mapupulot na sandata at relikya ay maikakabit dito!
              </p>
            </div>
          </div>
        )}

        {/* Modal Footer Controls */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((prev) => (prev - 1) as any)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 font-bold text-xs transition"
            >
              Bumalik (Back)
            </button>
          ) : (
            <div />
          )}

          {step === 1 && (
            <button
              type="button"
              onClick={handleProceedToDesign}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase flex items-center space-x-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition active:scale-95"
            >
              <span>Magpatuloy sa Base Karakter</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {step === 2 && (
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase flex items-center space-x-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition active:scale-95"
            >
              <span>Suriin ang Avatar NFT</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {step === 3 && (
            <button
              type="button"
              onClick={handleFinalizeAvatar}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase flex items-center space-x-2 shadow-[0_0_25px_rgba(6,182,212,0.5)] transition active:scale-95 animate-pulse"
            >
              <Check className="w-4 h-4" />
              <span>I-mint ang Avatar NFT at Simulan ang Laro!</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
