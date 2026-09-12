import React, { useState, useEffect } from 'react';
import { useAcademy } from '../context/AcademyContext';
import { WalletService } from '../services/walletService';
import { SoundFX } from '../services/soundFX';
import { PISO_NETWORK } from '../pisoConfig';
import {
  Key,
  Shield,
  Upload,
  Check,
  Copy,
  ExternalLink,
  Flame,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  RefreshCw,
  History,
} from 'lucide-react';
import { ethers } from 'ethers';

export const ConnectWalletModal: React.FC = () => {
  const {
    wallet,
    isConnectWalletModalOpen,
    closeConnectWalletModal,
    connectInjectedWallet,
    connectExistingWallet,
    createBurnerWallet,
    disconnectWallet,
  } = useAcademy();

  type ConnectTab = 'existing' | 'injected' | 'burner' | 'saved';
  const [activeTab, setActiveTab] = useState<ConnectTab>('existing');

  // Existing wallet input state
  const [inputKey, setInputKey] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [derivedPreview, setDerivedPreview] = useState<{ address: string; type: string } | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Saved wallets list
  const [savedWallets, setSavedWallets] = useState<{ address: string; label: string; lastUsed: number }[]>([]);

  // Check if window.ethereum exists
  const hasInjected = typeof window !== 'undefined' && Boolean((window as any).ethereum);

  useEffect(() => {
    if (isConnectWalletModalOpen) {
      setSavedWallets(WalletService.getSavedWallets());
      setInputError(null);
      // If already connected, default tab to saved / details
      if (wallet.isConnected && wallet.address) {
        setActiveTab('saved');
      }
    }
  }, [isConnectWalletModalOpen, wallet.isConnected, wallet.address]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isConnectWalletModalOpen) {
        closeConnectWalletModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isConnectWalletModalOpen, closeConnectWalletModal]);

  // Live address preview as user types/pastes phrase or private key
  useEffect(() => {
    const trimmed = inputKey.trim();
    if (!trimmed) {
      setDerivedPreview(null);
      setInputError(null);
      return;
    }

    const words = trimmed.split(/\s+/);
    if (words.length >= 12) {
      try {
        const mnemonic = ethers.Mnemonic.fromPhrase(trimmed.replace(/\s+/g, ' '));
        const hdNode = ethers.HDNodeWallet.fromMnemonic(mnemonic, "m/44'/60'/0'/0/0");
        setDerivedPreview({ address: hdNode.address, type: `${words.length}-word Seed Phrase` });
        setInputError(null);
        return;
      } catch {
        setDerivedPreview(null);
        if (words.length === 12 || words.length === 24) {
          setInputError('Invalid mnemonic checksum or word.');
        }
        return;
      }
    }

    // Try parsing as private key
    try {
      const clean = trimmed.startsWith('0x') ? trimmed : `0x${trimmed}`;
      if (/^0x[0-9a-fA-F]{64}$/.test(clean)) {
        const w = new ethers.Wallet(clean);
        setDerivedPreview({ address: w.address, type: 'Private Key (0x Hex)' });
        setInputError(null);
        return;
      }
    } catch {}

    setDerivedPreview(null);
  }, [inputKey]);

  if (!isConnectWalletModalOpen) return null;

  const handleConnectExisting = async () => {
    if (!inputKey.trim()) {
      setInputError('Please enter a recovery phrase or private key.');
      return;
    }

    setIsLoading(true);
    setInputError(null);
    try {
      SoundFX.playClick();
      await connectExistingWallet(inputKey.trim());
      setInputKey('');
      setDerivedPreview(null);
      SoundFX.playSuccess?.();
    } catch (err: any) {
      setInputError(err.message || 'Failed to connect existing wallet.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectInjected = async () => {
    setIsLoading(true);
    try {
      SoundFX.playClick();
      await connectInjectedWallet();
      SoundFX.playSuccess?.();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBurner = () => {
    SoundFX.playLaser?.();
    createBurnerWallet();
    closeConnectWalletModal();
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    SoundFX.playBlip?.();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-gradient-to-r from-slate-900/90 via-slate-950 to-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-cyan-500 p-0.5 shadow-lg shadow-amber-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-lg font-black text-amber-400">
                ₱
              </div>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white font-display uppercase tracking-wider flex items-center gap-2">
                Connect PISO Wallet
              </h2>
              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>PISO Chain L2 ({PISO_NETWORK.chainId})</span>
              </div>
            </div>
          </div>
          <button
            onClick={closeConnectWalletModal}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-colors font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* Current Wallet Status Banner (if connected) */}
        {wallet.isConnected && wallet.address && (
          <div className="px-4 py-3 bg-emerald-950/30 border-b border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-bold text-emerald-300 truncate font-mono">
                  {wallet.address}
                </div>
                <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
                  <span>Balance: <strong className="text-amber-400">{parseFloat(wallet.balance).toFixed(2)} ₱PISO</strong></span>
                  <span>•</span>
                  <span className="uppercase text-slate-500">{wallet.type}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => handleCopy(wallet.address || '')}
              className="text-xs p-1.5 rounded bg-black/40 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 transition-colors"
              title="Copy Address"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="grid grid-cols-4 bg-slate-900/60 p-1.5 border-b border-slate-800/80 gap-1 text-xs font-mono font-bold">
          <button
            onClick={() => setActiveTab('existing')}
            className={`py-2 px-1 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'existing'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Existing</span>
          </button>
          <button
            onClick={() => setActiveTab('injected')}
            className={`py-2 px-1 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'injected'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-black shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <span>🦊 Browser</span>
          </button>
          <button
            onClick={() => setActiveTab('burner')}
            className={`py-2 px-1 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'burner'
                ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white font-black shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Burner</span>
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`py-2 px-1 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'saved'
                ? 'bg-slate-800 text-cyan-300 font-black shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Saved</span>
          </button>
        </div>

        {/* Tab 1: Connect Existing Wallet (Mnemonic / Private Key) */}
        {activeTab === 'existing' && (
          <div className="p-4 sm:p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Secret Recovery Phrase or 0x Private Key</span>
                <button
                  type="button"
                  onClick={() => setShowInput(!showInput)}
                  className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1"
                >
                  {showInput ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showInput ? 'Hide' : 'Show'}</span>
                </button>
              </label>
              <textarea
                rows={3}
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="Paste your 12/24-word recovery phrase or 64-character private key..."
                className={`w-full p-3 rounded-xl bg-slate-900 border font-mono text-xs text-amber-300 placeholder-slate-600 focus:outline-none transition-colors ${
                  showInput ? '' : 'font-security-disc'
                } ${
                  inputError
                    ? 'border-rose-500/50 focus:border-rose-500'
                    : derivedPreview
                    ? 'border-emerald-500/50 focus:border-emerald-500'
                    : 'border-slate-800 focus:border-amber-500/60'
                }`}
              />
            </div>

            {/* Live Address Preview Card */}
            {derivedPreview && (
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 animate-in fade-in duration-150">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1 font-mono">
                    <Check className="w-3 h-3" /> Verified Address ({derivedPreview.type})
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Ready to Connect</span>
                </div>
                <div className="text-xs font-mono font-bold text-white truncate select-all">
                  {derivedPreview.address}
                </div>
              </div>
            )}

            {inputError && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{inputError}</span>
              </div>
            )}

            <button
              onClick={handleConnectExisting}
              disabled={isLoading || !inputKey.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Connecting Wallet...</span>
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  <span>Connect Existing Wallet</span>
                </>
              )}
            </button>

            {/* Privacy Guarantee */}
            <div className="p-2.5 rounded-lg bg-slate-900/50 border border-white/5 flex items-start gap-2 text-[11px] text-slate-400">
              <Shield className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>100% Non-Custodial:</strong> Private keys and recovery phrases are processed locally within your browser sandbox. Keys are never transmitted to any external server.
              </span>
            </div>
          </div>
        )}

        {/* Tab 2: Browser Injected (MetaMask / Rabby / Brave) */}
        {activeTab === 'injected' && (
          <div className="p-4 sm:p-5 space-y-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-2xl shadow-lg">
                🦊
              </div>
              <h3 className="text-sm font-bold text-white">Browser Web3 Extension</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Connect using MetaMask, Rabby, Coinbase Wallet, or any EIP-1193 compatible browser extension.
              </p>
              <div className="pt-2">
                {hasInjected ? (
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-bold inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Web3 Extension Detected
                  </span>
                ) : (
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold inline-flex items-center gap-1.5">
                    No Web3 Extension Found
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={handleConnectInjected}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-40 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Connecting to Extension...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Connect MetaMask / Extension</span>
                </>
              )}
            </button>

            <div className="text-[11px] text-slate-400 text-center font-mono">
              Auto-prompts network addition for PISO Chain Devnet (<code className="text-slate-300">{PISO_NETWORK.chainId}</code>).
            </div>
          </div>
        )}

        {/* Tab 3: Instant Disposable Burner */}
        {activeTab === 'burner' && (
          <div className="p-4 sm:p-5 space-y-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center text-2xl shadow-lg">
                🔥
              </div>
              <h3 className="text-sm font-bold text-white">Instant Disposable Burner</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Generate an instant ephemeral keypair directly in your browser. Perfect for testing, building, and gaming without installing extensions.
              </p>
            </div>

            <button
              onClick={handleCreateBurner}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Flame className="w-4 h-4 text-amber-200" />
              <span>Generate & Activate Burner Wallet</span>
            </button>
          </div>
        )}

        {/* Tab 4: Previously Saved / Connected Wallets */}
        {activeTab === 'saved' && (
          <div className="p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase font-mono">Recent Wallets</span>
              {wallet.isConnected && (
                <button
                  onClick={() => {
                    disconnectWallet();
                    SoundFX.playClick();
                  }}
                  className="text-xs text-rose-400 hover:text-rose-300 font-mono font-bold"
                >
                  Disconnect Active
                </button>
              )}
            </div>

            {savedWallets.length === 0 ? (
              <div className="p-6 rounded-xl bg-slate-900/40 border border-white/5 text-center text-xs text-slate-500">
                No saved wallets yet. Connect or import a wallet to save it here for quick switching.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {savedWallets.map((sw, idx) => {
                  const isActive = wallet.address?.toLowerCase() === sw.address.toLowerCase();
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                        isActive
                          ? 'bg-cyan-950/30 border-cyan-500/40'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-mono font-bold text-white flex items-center gap-2">
                          <span className="truncate">{sw.address.slice(0, 10)}...{sw.address.slice(-6)}</span>
                          {isActive && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded font-bold">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {sw.label} • {new Date(sw.lastUsed).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        onClick={() => handleCopy(sw.address)}
                        className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-white/5 transition-colors"
                        title="Copy Address"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quick Explorer Link */}
            {wallet.address && (
              <a
                href={`${PISO_NETWORK.explorerUrl}/address/${wallet.address}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-mono flex items-center justify-center gap-2 transition-colors"
              >
                <span>View on PISO Explorer</span>
                <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
