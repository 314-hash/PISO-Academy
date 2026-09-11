import React, { useState, useEffect, useId } from 'react';
import { useAcademy } from '../../context/AcademyContext';
import {
  WalletService,
  MnemonicKeypair,
  RpcDiagnostics,
  TokenBalanceItem,
} from '../../services/walletService';
import { SoundFX } from '../../services/soundFX';
import {
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  ExternalLink,
  Shield,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Download,
  Upload,
  Cpu,
  Activity,
  AlertCircle,
  CheckCircle2,
  X,
  Coins,
  Globe,
  Terminal,
  Zap,
} from 'lucide-react';
import { PISO_NETWORK } from '../../pisoConfig';

interface WalletStudioTerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletStudioTerminalModal: React.FC<WalletStudioTerminalModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    wallet,
    refreshWalletBalance,
    setCustomBurnerKey,
    requestFaucet,
    claimEcosystemReward,
    setNotification,
  } = useAcademy();

  const [activeTab, setActiveTab] = useState<'forge' | 'bridge' | 'listener'>('forge');

  // Tab 1: Forge
  const [wordCount, setWordCount] = useState<12 | 24>(12);
  const [generatedKeypair, setGeneratedKeypair] = useState<MnemonicKeypair | null>(null);
  const [showMnemonic, setShowMnemonic] = useState(true);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Tab 2: Bridge
  const [importInput, setImportInput] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  // Tab 3: Listener
  const [diagnostics, setDiagnostics] = useState<RpcDiagnostics | null>(null);
  const [tokens, setTokens] = useState<TokenBalanceItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDripping, setIsDripping] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // ESC hotkey listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Initial keypair generation on first open if empty
  useEffect(() => {
    if (isOpen && !generatedKeypair) {
      handleGenerateKeypair(12);
    }
    if (isOpen) {
      fetchDiagnosticsAndBalances();
    }
  }, [isOpen]);

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    try {
      SoundFX.playBlip();
    } catch {}
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleGenerateKeypair = (count: 12 | 24 = wordCount) => {
    try {
      const kp = WalletService.generateMnemonicKeypair(count);
      setGeneratedKeypair(kp);
      setWordCount(count);
      try {
        SoundFX.playQuestComplete();
      } catch {}
    } catch (err: any) {
      console.error('Keypair gen error:', err);
    }
  };

  const handleApplyAsActiveBurner = async (privateKey: string) => {
    try {
      await setCustomBurnerKey(privateKey);
      claimEcosystemReward('wallet-studio', 500, '👑 Sovereign Wallet Pioneer');
      try {
        SoundFX.playLevelUp();
      } catch {}
      fetchDiagnosticsAndBalances();
    } catch (err: any) {
      setNotification({
        message: err.message || 'Failed to activate keypair.',
        type: 'error',
      });
    }
  };

  const handleImportKeypair = async () => {
    setImportError(null);
    setImportSuccess(null);
    const cleaned = importInput.trim();

    if (!cleaned) {
      setImportError('Mangyaring maglagay ng 12/24-word seed phrase o 64-char private key.');
      return;
    }

    try {
      let activePrivKey = '';
      let derivedAddr = '';

      if (cleaned.includes(' ')) {
        // Mnemonic
        const kp = WalletService.importFromMnemonic(cleaned);
        activePrivKey = kp.privateKey;
        derivedAddr = kp.address;
      } else {
        // Raw private key
        const kp = WalletService.importFromPrivateKey(cleaned);
        activePrivKey = kp.privateKey;
        derivedAddr = kp.address;
      }

      await setCustomBurnerKey(activePrivKey);
      claimEcosystemReward('wallet-studio', 500, '👑 Sovereign Wallet Pioneer');
      setImportSuccess(`Matagumpay na na-sync ang wallet: ${derivedAddr.slice(0, 8)}...${derivedAddr.slice(-6)}`);
      setImportInput('');
      try {
        SoundFX.playLevelUp();
      } catch {}
      fetchDiagnosticsAndBalances();
    } catch (err: any) {
      setImportError(err.message || 'Hindi wastong format ng keypair o phrase.');
    }
  };

  const fetchDiagnosticsAndBalances = async () => {
    setIsRefreshing(true);
    try {
      const [diag, tokenList] = await Promise.all([
        WalletService.getRpcDiagnostics(),
        wallet.address ? WalletService.getEcosystemTokenBalances(wallet.address) : Promise.resolve([]),
      ]);
      setDiagnostics(diag);
      setTokens(tokenList);
      setLastRefreshed(new Date());
      await refreshWalletBalance();
    } catch (e) {
      console.warn('Diagnostics error:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleFaucetDrip = async () => {
    if (!wallet.address) return;
    setIsDripping(true);
    try {
      await requestFaucet();
      await fetchDiagnosticsAndBalances();
      try {
        SoundFX.playSuccess();
      } catch {}
    } catch {
    } finally {
      setIsDripping(false);
    }
  };

  if (!isOpen) return null;

  const currentPrivateKey = WalletService.getStoredBurnerKey();
  const exportPayloadJson = JSON.stringify(
    {
      network: 'PISO Chain Devnet / Mainnet',
      chainId: PISO_NETWORK.chainId,
      rpc: PISO_NETWORK.rpcUrl,
      address: wallet.address || '',
      privateKey: currentPrivateKey || '',
      exportedAt: new Date().toISOString(),
      officialStudioUrl: 'https://piso-blockchain.vercel.app/wallet',
    },
    null,
    2
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#0A101D] border border-slate-700/80 rounded-2xl shadow-2xl shadow-blue-950/40 text-slate-100 overflow-hidden font-sans">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0E1626]/90 backdrop-blur">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 via-blue-500/20 to-cyan-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-glow">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold tracking-wide text-white flex items-center gap-2">
                  PISO Wallet Studio Sandbox
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    Live RPC v2.6
                  </span>
                </h2>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                BIP-39 Mnemonic Generator • 1-Click Bridge • Live Devnet RPC Sync
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="hidden sm:inline text-xs font-mono text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-700/60">
              Hotkey: <kbd className="text-amber-400 font-bold">[W]</kbd> or <kbd className="text-slate-300">[ESC]</kbd>
            </span>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700/80"
              title="Close Terminal (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-[#0B1220]/70 px-6 gap-2 pt-2">
          <button
            onClick={() => {
              setActiveTab('forge');
              try {
                SoundFX.playBlip();
              } catch {}
            }}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-mono font-semibold rounded-t-xl transition-all border-t border-x ${
              activeTab === 'forge'
                ? 'bg-[#0E172A] text-amber-400 border-slate-700 border-b-transparent shadow-[0_-2px_10px_rgba(245,158,11,0.15)]'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800/30'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Mnemonic Forge (BIP-39)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('bridge');
              try {
                SoundFX.playBlip();
              } catch {}
            }}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-mono font-semibold rounded-t-xl transition-all border-t border-x ${
              activeTab === 'bridge'
                ? 'bg-[#0E172A] text-cyan-400 border-slate-700 border-b-transparent shadow-[0_-2px_10px_rgba(6,182,212,0.15)]'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800/30'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>PISO Studio Bridge</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('listener');
              try {
                SoundFX.playBlip();
              } catch {}
              fetchDiagnosticsAndBalances();
            }}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-mono font-semibold rounded-t-xl transition-all border-t border-x ${
              activeTab === 'listener'
                ? 'bg-[#0E172A] text-emerald-400 border-slate-700 border-b-transparent shadow-[0_-2px_10px_rgba(16,185,129,0.15)]'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800/30'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Live RPC Listener</span>
            {diagnostics?.isOnline && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#0E172A]/90">
          {/* TAB 1: MNEMONIC KEYPAIR FORGE */}
          {activeTab === 'forge' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Controls bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-slate-400 font-mono uppercase tracking-wider">Entropy Length:</span>
                  <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800">
                    <button
                      onClick={() => handleGenerateKeypair(12)}
                      className={`px-3 py-1 text-xs font-mono rounded-md transition-all ${
                        wordCount === 12
                          ? 'bg-amber-500 text-black font-bold shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      12 Words (128-bit)
                    </button>
                    <button
                      onClick={() => handleGenerateKeypair(24)}
                      className={`px-3 py-1 text-xs font-mono rounded-md transition-all ${
                        wordCount === 24
                          ? 'bg-amber-500 text-black font-bold shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      24 Words (256-bit)
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowMnemonic(!showMnemonic)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-mono rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                  >
                    {showMnemonic ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showMnemonic ? 'Hide Words' : 'Reveal Words'}</span>
                  </button>

                  <button
                    onClick={() => handleGenerateKeypair(wordCount)}
                    className="flex items-center space-x-1.5 px-4 py-1.5 text-xs font-mono font-bold rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-black" />
                    <span>Roll New Seed</span>
                  </button>
                </div>
              </div>

              {/* Seed Phrase Grid */}
              {generatedKeypair && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5" />
                      Deterministic BIP-39 Seed Phrase ({wordCount} words)
                    </label>
                    <button
                      onClick={() => copyToClipboard(generatedKeypair.mnemonic, 'mnemonic')}
                      className="flex items-center space-x-1 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      {copiedField === 'mnemonic' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied to Clipboard!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Entire Phrase</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 p-4 rounded-xl bg-slate-950/80 border border-slate-800/90 shadow-inner">
                    {generatedKeypair.mnemonic.split(' ').map((word: string, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center space-x-2 bg-slate-900/90 border border-slate-800 px-3 py-2 rounded-lg group hover:border-amber-500/40 transition-colors"
                      >
                        <span className="text-[10px] font-mono text-slate-500 w-4 text-right">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span className="text-xs font-mono font-medium text-slate-200">
                          {showMnemonic ? word : '••••••'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Derived EVM Account Card */}
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                      <span className="text-slate-300 font-bold flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        Standard EVM Account (Path: <code className="text-cyan-400 font-bold">{generatedKeypair.path}</code>)
                      </span>
                      <span className="text-[11px] text-slate-500">PISO Chain / MetaMask Compatible</span>
                    </div>

                    {/* Derived Address */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span>Derived Public Address:</span>
                        <button
                          onClick={() => copyToClipboard(generatedKeypair.address, 'addr')}
                          className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                        >
                          {copiedField === 'addr' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          {copiedField === 'addr' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-amber-300 break-all select-all flex items-center justify-between">
                        <span>{generatedKeypair.address}</span>
                      </div>
                    </div>

                    {/* Derived Private Key */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <div className="flex items-center space-x-2">
                          <span>Raw Private Key:</span>
                          <button
                            onClick={() => setShowPrivateKey(!showPrivateKey)}
                            className="text-slate-400 hover:text-slate-200"
                          >
                            {showPrivateKey ? 'Hide' : 'Reveal'}
                          </button>
                        </div>
                        <button
                          onClick={() => copyToClipboard(generatedKeypair.privateKey, 'priv')}
                          className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                        >
                          {copiedField === 'priv' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          {copiedField === 'priv' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 break-all select-all">
                        {showPrivateKey
                          ? generatedKeypair.privateKey
                          : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
                      </div>
                    </div>

                    {/* Action button: Set as Active Burner */}
                    <div className="pt-2 flex items-center justify-between gap-4">
                      <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                        💡 Gamitin ang keypair na ito bilang aktibong sesyon sa laro para sa instant smart contract executions.
                      </p>
                      <button
                        onClick={() => handleApplyAsActiveBurner(generatedKeypair.privateKey)}
                        className="flex-shrink-0 flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-mono text-xs font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-300" />
                        <span>Set as Active Session Wallet</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: 1-CLICK BRIDGE TO OFFICIAL PISO WALLET STUDIO */}
          {activeTab === 'bridge' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Official Studio Launch Card */}
              <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-[#0D182E] via-[#0F1E3D] to-[#0A1224] border border-blue-500/40 shadow-xl space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-amber-400 text-black">
                        OFFICIAL DAPP
                      </span>
                      <h3 className="text-base font-bold text-white">
                        PISO Wallet Studio (Mainnet / Devnet)
                      </h3>
                    </div>
                    <p className="text-xs text-slate-300 font-mono max-w-xl">
                      Ganap na decentralized Web3 wallet na may QR Ph POS integration, ERC-20 management, gas sponsor abstraction, at cross-chain bridge.
                    </p>
                  </div>

                  <a
                    href="https://piso-blockchain.vercel.app/wallet"
                    target="_blank"
                    rel="noreferrer"
                    className="flex-shrink-0 inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold font-mono text-xs shadow-lg shadow-cyan-500/25 transition-all active:scale-95"
                  >
                    <span>Buksan ang Wallet Studio ↗</span>
                    <ExternalLink className="w-4 h-4 text-black" />
                  </a>
                </div>
              </div>

              {/* Two Column Grid: Export vs Import */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Export Column */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
                        <Download className="w-3.5 h-3.5" />
                        1-Click Export Active Session Key
                      </span>
                      <button
                        onClick={() => copyToClipboard(exportPayloadJson, 'exportJson')}
                        className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                      >
                        {copiedField === 'exportJson' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Payload</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono">
                      I-export ang iyong kasalukuyang in-game burner wallet para i-import sa official PISO Wallet Studio o MetaMask.
                    </p>
                    <textarea
                      readOnly
                      value={exportPayloadJson}
                      className="w-full h-36 p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 resize-none select-all focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={() => copyToClipboard(currentPrivateKey || '', 'rawPriv')}
                    className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center justify-center gap-2 border border-slate-700 transition-colors"
                  >
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    <span>Kopyahin ang Raw 0x Private Key Lamang</span>
                  </button>
                </div>

                {/* Import Column */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5" />
                        I-import mula sa External Studio
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">Mnemonic / 0x Hex Key</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono">
                      I-paste ang 12/24-word seed phrase o 64-character private key mula sa PISO Wallet Studio para gamitin sa game session.
                    </p>
                    <textarea
                      placeholder="Halimbawa: 12-word seed phrase o 0xabcdef123..."
                      value={importInput}
                      onChange={(e) => {
                        setImportInput(e.target.value);
                        setImportError(null);
                        setImportSuccess(null);
                      }}
                      className="w-full h-36 p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-amber-300 resize-none focus:outline-none focus:border-cyan-500/60"
                    />
                  </div>

                  {importError && (
                    <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{importError}</span>
                    </div>
                  )}

                  {importSuccess && (
                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{importSuccess}</span>
                    </div>
                  )}

                  <button
                    onClick={handleImportKeypair}
                    disabled={!importInput.trim()}
                    className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-mono font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>I-sync at I-activate sa Laro (+500 XP)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: REAL-TIME LIVE RPC BALANCE LISTENER */}
          {activeTab === 'listener' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* RPC Diagnostics Header */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="text-[10px] uppercase font-mono text-slate-400">Node Status</div>
                  <div className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    {diagnostics?.isOnline ? 'ONLINE' : 'CONNECTING...'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="text-[10px] uppercase font-mono text-slate-400">Ping Latency</div>
                  <div className="text-xs font-mono font-bold text-cyan-400 mt-1">
                    {diagnostics?.latencyMs ? `${diagnostics.latencyMs} ms` : 'Testing...'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="text-[10px] uppercase font-mono text-slate-400">Current Block</div>
                  <div className="text-xs font-mono font-bold text-amber-400 mt-1">
                    #{diagnostics?.blockNumber ? diagnostics.blockNumber.toLocaleString() : '125,490'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="text-[10px] uppercase font-mono text-slate-400">Chain ID</div>
                  <div className="text-xs font-mono font-bold text-purple-400 mt-1">
                    {PISO_NETWORK.chainId} (PISO Devnet)
                  </div>
                </div>
              </div>

              {/* Active Wallet Banner */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-mono text-slate-400">Kasasalaminang Wallet Address:</span>
                  <div className="text-xs font-mono font-bold text-amber-400 select-all">
                    {wallet.address || 'Walang nakakonektang wallet'}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={fetchDiagnosticsAndBalances}
                    disabled={isRefreshing}
                    className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-mono rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span>{isRefreshing ? 'Syncing...' : 'Sync Balances'}</span>
                  </button>

                  <button
                    onClick={handleFaucetDrip}
                    disabled={isDripping || !wallet.address}
                    className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-mono font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-black shadow-md shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Coins className="w-3.5 h-3.5 text-black" />
                    <span>{isDripping ? 'Dripping...' : '+1.0 ₱PISO Faucet'}</span>
                  </button>
                </div>
              </div>

              {/* Multi-Token Live Balance Breakdown Table */}
              <div className="rounded-xl bg-slate-950/90 border border-slate-800 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-900/50 flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Coins className="w-4 h-4 text-amber-400" />
                    On-Chain Portfolio (Devnet RPC)
                  </span>
                  {lastRefreshed && (
                    <span className="text-[10px] font-mono text-slate-500">
                      Huling update: {lastRefreshed.toLocaleTimeString()}
                    </span>
                  )}
                </div>

                <div className="divide-y divide-slate-800/60">
                  {tokens.map((token, idx) => (
                    <div
                      key={idx}
                      className="px-4 py-3 flex items-center justify-between hover:bg-slate-900/40 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-base">
                          {token.icon}
                        </div>
                        <div>
                          <div className="text-xs font-bold font-mono text-white flex items-center gap-2">
                            <span>{token.symbol}</span>
                            <span className="text-[10px] font-normal text-slate-400">({token.name})</span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-500">
                            Contract: {token.contractAddress.startsWith('0x') ? `${token.contractAddress.slice(0, 8)}...${token.contractAddress.slice(-6)}` : token.contractAddress}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-mono font-bold text-amber-400">
                          {parseFloat(token.balance).toFixed(token.symbol === '₱PISO' ? 4 : 2)}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">
                          {token.symbol} On-Chain
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RPC Endpoint Info Bar */}
              <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <div className="flex items-center space-x-2">
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  <span>RPC Node: <code className="text-slate-300">{PISO_NETWORK.rpcUrl}</code></span>
                </div>
                <a
                  href="https://piso-blockchain.vercel.app/explorer"
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  <span>PISO Explorer ↗</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-[#0A101D] flex flex-wrap items-center justify-between text-xs text-slate-400 font-mono">
          <div className="flex items-center space-x-2">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>PISO Cyber-Bayanihan Client Sandbox • 100% Non-Custodial & Client-Side</span>
          </div>
          <div className="flex items-center space-x-3">
            <a
              href="https://piso-blockchain.vercel.app/wallet"
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 hover:underline flex items-center gap-1"
            >
              Mainnet Studio ↗
            </a>
            <button
              onClick={onClose}
              className="px-4 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              Isara [ESC]
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
