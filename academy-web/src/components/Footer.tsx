import React from 'react';
import { ExternalLink, Heart, Shield, Terminal, Github } from 'lucide-react';
import { PISO_NETWORK } from '../pisoConfig';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0B0F17] border-t border-slate-800/80 pt-12 pb-8 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-mono font-bold text-amber-400">
                ₱
              </div>
              <span className="font-bold text-sm text-white">PISO Academy</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Open-source developer academy and builder ecosystem powered by PISO Chain. Learn, code, test, deploy, and earn verifiable soulbound achievements.
            </p>
            <div className="flex items-center space-x-1 text-slate-500">
              <span>Binuo nang may</span>
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>para sa mga Pinoy Builders</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-3">PISO Chain Ecosystem</h4>
            <ul className="space-y-2">
              <li>
                <a href={PISO_NETWORK.explorerUrl} target="_blank" rel="noreferrer" className="hover:text-amber-400 flex items-center space-x-1">
                  <span>PISO Block Explorer</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a href={PISO_NETWORK.faucetUrl} target="_blank" rel="noreferrer" className="hover:text-amber-400 flex items-center space-x-1">
                  <span>PISO Faucet & Portal</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <span className="text-slate-500">Devnet RPC: <code className="text-slate-400">piso-rpc-dev.loca.lt</code></span>
              </li>
              <li>
                <span className="text-slate-500">Chain ID: <code className="text-slate-400">2026001 (0x1EE349)</code></span>
              </li>
            </ul>
          </div>

          {/* Open-Source Foundations */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-3">Open-Source Roots</h4>
            <ul className="space-y-2 text-slate-400">
              <li>Moodle LMS Core</li>
              <li>Scaffold-ETH 2 Interactive Web3 Lab</li>
              <li>Foundry Smart Contract Toolchain</li>
              <li>OpenZeppelin Secure Contracts</li>
              <li>Docusaurus Documentation Engine</li>
            </ul>
          </div>

          {/* Security & System */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-3">Security & Soulbound</h4>
            <div className="space-y-2">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
                <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold mb-1">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Katunayan ng Pag-aari</span>
                </div>
                <p className="text-slate-400 font-mono text-[10px]">
                  Precompile: 0x...1014
                </p>
                <p className="text-slate-500 text-[10px] mt-1">
                  Non-transferable ERC-5192 soulbound credentials.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-slate-500">
          <p>© {new Date().getFullYear()} PISO Academy. Released under the MIT Open Source License.</p>
          <div className="flex items-center space-x-4 mt-3 sm:mt-0">
            <span>Learn</span>
            <span>•</span>
            <span>Code</span>
            <span>•</span>
            <span>Build</span>
            <span>•</span>
            <span>Deploy</span>
            <span>•</span>
            <span>Verify</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
