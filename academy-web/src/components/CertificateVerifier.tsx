import React, { useState } from 'react';
import { useAcademy } from '../context/AcademyContext';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  ExternalLink,
  Award,
  QrCode,
  Share2,
  Lock,
  Sparkles
} from 'lucide-react';
import { CertificateService, VerifiedCertificate } from '../services/certificateService';
import { PISO_NETWORK, SYSTEM_CONTRACTS } from '../pisoConfig';

export const CertificateVerifier: React.FC = () => {
  const { certificates, wallet } = useAcademy();

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifiedCertificate | null>(
    certificates[0] || null
  );
  const [searched, setSearched] = useState(false);

  const handleSearch = async (targetQuery?: string) => {
    const q = targetQuery !== undefined ? targetQuery : query;
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await CertificateService.verifyCertificate(q);
      setResult(res);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-xs font-bold text-emerald-300">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Katunayan ng Pag-aari • Soulbound Verifier</span>
        </div>
        <h1 className="text-3xl font-black text-white">Cryptographic Certificate Verifier</h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Verify verifiable developer credentials and soulbound course achievements issued on PISO Chain (ERC-5192 / System Precompile 0x...1014).
        </p>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-[#161F30] border border-slate-700/60 shadow-lg mb-8">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Ipasok ang Token ID, Wallet Address, o Certificate Hash..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-white focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-glow flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
          >
            <span>{loading ? 'Sinusuri...' : 'Verify on PISO'}</span>
          </button>
        </div>

        {/* Quick Search Chips */}
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
          <span>Mga Halimbawa:</span>
          <button
            onClick={() => {
              setQuery('1001');
              handleSearch('1001');
            }}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono transition-colors"
          >
            #1001 (Genesis Builder)
          </button>
          {certificates.length > 0 && (
            <button
              onClick={() => {
                setQuery(String(certificates[0].tokenId));
                handleSearch(String(certificates[0].tokenId));
              }}
              className="px-2 py-0.5 rounded bg-blue-950 hover:bg-blue-900 text-blue-300 font-mono transition-colors"
            >
              #{certificates[0].tokenId} (Iyong Sertipiko)
            </button>
          )}
        </div>
      </div>

      {/* Result Display */}
      {result ? (
        <div className="p-6 sm:p-10 rounded-3xl bg-gradient-to-b from-[#161F30] to-[#0D1117] border border-amber-500/40 shadow-glow space-y-8 relative overflow-hidden">
          {/* Subtle Watermark Badge */}
          <div className="absolute right-6 top-6 text-slate-800/20 font-black text-9xl select-none pointer-events-none font-mono">
            ₱
          </div>

          {/* Top Verification Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800 relative z-10">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                    Opisyal na Na-verify sa PISO Chain
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    SOULBOUND (ERC-5192)
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                  Katunayan ng Pag-aari #{result.tokenId}
                </h2>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Non-Transferable</span>
            </div>
          </div>

          {/* Certificate Body Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            <div className="md:col-span-2 space-y-4">
              <div>
                <span className="text-xs text-slate-400 font-medium">Parangal at Pamagat:</span>
                <p className="text-lg font-bold text-white mt-0.5">{result.customTitle}</p>
              </div>

              <div>
                <span className="text-xs text-slate-400 font-medium">Antas (Filipino Cultural Tier):</span>
                <p className="text-sm font-bold text-amber-400 mt-0.5">{result.tierName}</p>
              </div>

              <div>
                <span className="text-xs text-slate-400 font-medium">May-ari ng Sertipiko (Holder Address):</span>
                <p className="text-xs font-mono text-slate-300 break-all bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 mt-1">
                  {result.recipient}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <span className="text-xs text-slate-400 font-medium">System Precompile:</span>
                  <p className="text-[11px] font-mono text-blue-300 truncate mt-0.5">
                    {result.onChainContract}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium">Petsa ng Pagkaloob:</span>
                  <p className="text-xs font-mono text-slate-300 mt-0.5">
                    {new Date(result.issueTimestamp * 1000).toLocaleDateString('fil-PH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-400 font-medium">Cryptographic SHA-256 Proof Hash:</span>
                <p className="text-[10px] font-mono text-slate-500 break-all bg-[#0D1117] p-2 rounded-lg border border-slate-800/80 mt-1">
                  {result.verificationHash}
                </p>
              </div>
            </div>

            {/* Right Card: QR Code & Explorer Verification */}
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-4">
              <div className="w-32 h-32 rounded-xl bg-white p-2.5 flex items-center justify-center shadow-lg">
                <QrCode className="w-full h-full text-slate-950" />
              </div>
              <div>
                <span className="text-xs font-bold text-white">I-scan para I-verify</span>
                <p className="text-[10px] text-slate-400 mt-0.5">W3C Verifiable Credential</p>
              </div>

              <a
                href={PISO_NETWORK.explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
              >
                <span>PISO Explorer Tx</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </div>
          </div>
        </div>
      ) : searched ? (
        <div className="p-12 text-center text-slate-400 rounded-2xl bg-[#161F30] border border-slate-800 space-y-2">
          <p className="text-sm font-bold text-rose-400">Walang nahanap na sertipiko para sa query na ito.</p>
          <p className="text-xs text-slate-500">
            Tiyaking tama ang Token ID, Wallet Address, o SHA-256 hash.
          </p>
        </div>
      ) : null}
    </div>
  );
};
