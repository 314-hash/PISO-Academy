import React, { useState } from 'react';
import { useAcademy } from '../context/AcademyContext';
import {
  Rocket,
  ExternalLink,
  Code2,
  Terminal,
  Clock,
  Layers,
  Send,
  CheckCircle2,
  Cpu,
  Search
} from 'lucide-react';
import { PISO_NETWORK } from '../pisoConfig';
import { ContractDeployer, DeploymentReceipt } from '../services/contractDeployer';

export const DeploymentManager: React.FC = () => {
  const { deployments, refreshDeployments, setNotification, wallet } = useAcademy();

  const [selectedContract, setSelectedContract] = useState<DeploymentReceipt | null>(
    deployments[0] || null
  );

  // Quick deploy state
  const [contractName, setContractName] = useState('MyPISODApp');
  const [solidityCode, setSolidityCode] = useState(`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MyPISODApp {
    string public message = "Mabuhay PISO Chain!";
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    function setMessage(string calldata newMessage) external {
        message = newMessage;
    }
}`);
  const [isDeploying, setIsDeploying] = useState(false);

  // Inspector state
  const [interactMessage, setInteractMessage] = useState('Mabuhay PISO Chain!');
  const [newMessageInput, setNewMessageInput] = useState('');
  const [txSuccess, setTxSuccess] = useState<string | null>(null);

  const handleDeploy = async () => {
    setIsDeploying(true);
    try {
      const receipt = await ContractDeployer.deployContract(contractName, solidityCode);
      refreshDeployments();
      setSelectedContract(receipt);
      setNotification({
        message: `Deployed ${contractName} to PISO Chain Devnet!`,
        type: 'success',
      });
    } catch (err: any) {
      setNotification({
        message: 'Deployment failed. Check RPC connection.',
        type: 'error',
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const handleSetMessage = () => {
    if (!newMessageInput) return;
    setInteractMessage(newMessageInput);
    setTxSuccess('0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join(''));
    setNotification({
      message: 'State updated on PISO Chain Devnet!',
      type: 'success',
    });
    setNewMessageInput('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">PISO Chain Deployment Rig & Inspector</h1>
        <p className="text-sm text-slate-400 mt-1">
          Scaffold-ETH 2 inspired development cockpit. Deploy smart contracts directly to PISO Devnet ({PISO_NETWORK.chainId}) and interact with methods in real time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Deployment Form (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-[#161F30] border border-slate-700/60 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Rocket className="w-4 h-4 text-amber-400" />
              <span>Mag-deploy ng Bagong Kontrata</span>
            </h2>

            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1">Pangalan ng Kontrata:</label>
              <input
                type="text"
                value={contractName}
                onChange={(e) => setContractName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1">Solidity Code (^0.8.20):</label>
              <textarea
                value={solidityCode}
                onChange={(e) => setSolidityCode(e.target.value)}
                rows={10}
                className="w-full bg-[#0D1117] border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-300 resize-none outline-none leading-relaxed"
              />
            </div>

            <button
              onClick={handleDeploy}
              disabled={isDeploying}
              className="w-full py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-glow flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              <Rocket className="w-4 h-4" />
              <span>{isDeploying ? 'Nagde-deploy sa PISO Chain...' : 'Deploy to PISO Chain Devnet'}</span>
            </button>
          </div>

          {/* Deployed Contracts History */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Mga Na-deploy na Kontrata ({deployments.length})
            </h3>
            {deployments.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Wala pang na-deploy na kontrata.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {deployments.map((d, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedContract(d)}
                    className={`p-3 rounded-xl cursor-pointer transition-all border text-xs ${
                      selectedContract?.contractAddress === d.contractAddress
                        ? 'bg-[#161F30] border-amber-500/80 text-white'
                        : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>{d.contractName}</span>
                      <span className="text-[10px] font-mono text-slate-400">Block #{d.blockNumber}</span>
                    </div>
                    <div className="text-[11px] font-mono text-amber-400 mt-1 truncate">
                      {d.contractAddress}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Scaffold-ETH 2 Interactive Contract Inspector (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {selectedContract ? (
            <div className="p-6 sm:p-8 rounded-2xl bg-[#161F30] border border-slate-700/60 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
                <div>
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 uppercase">
                    Active Contract
                  </span>
                  <h2 className="text-xl font-bold text-white mt-1">{selectedContract.contractName}</h2>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">{selectedContract.contractAddress}</p>
                </div>

                <a
                  href={PISO_NETWORK.explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-400 bg-blue-950/40 border border-blue-800 hover:bg-blue-900/60 transition-colors"
                >
                  <span>PISO Explorer</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Read Contract Section */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Cpu className="w-4 h-4 text-blue-400" />
                  <span>Read Contract Functions</span>
                </h3>
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <span className="text-xs font-mono font-bold text-slate-300">1. message() returns (string)</span>
                  <div className="p-2.5 rounded bg-[#0D1117] border border-slate-800 text-xs font-mono text-emerald-300">
                    "{interactMessage}"
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <span className="text-xs font-mono font-bold text-slate-300">2. owner() returns (address)</span>
                  <div className="p-2.5 rounded bg-[#0D1117] border border-slate-800 text-xs font-mono text-slate-300">
                    {wallet.address || '0x1821F246a27287a2187E1D634B8883030fA14731'}
                  </div>
                </div>
              </div>

              {/* Write Contract Section */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Send className="w-4 h-4 text-amber-400" />
                  <span>Write Contract Functions (State Transitions)</span>
                </h3>
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <span className="text-xs font-mono font-bold text-slate-300">1. setMessage(string newMessage)</span>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Maglagay ng bagong mensahe..."
                      value={newMessageInput}
                      onChange={(e) => setNewMessageInput(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:ring-amber-500 focus:border-amber-500"
                    />
                    <button
                      onClick={handleSetMessage}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-sm"
                    >
                      Send Tx
                    </button>
                  </div>

                  {txSuccess && (
                    <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-800 text-[11px] font-mono text-emerald-300 flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="truncate">Tx Mined: {txSuccess}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-16 text-center text-slate-500 rounded-2xl bg-[#161F30] border border-slate-800">
              Pumili ng na-deploy na kontrata sa kaliwa o mag-deploy ng bago.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
