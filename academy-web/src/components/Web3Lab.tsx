import React, { useState } from 'react';
import { useAcademy } from '../context/AcademyContext';
import {
  Play,
  RotateCcw,
  Copy,
  Check,
  Terminal,
  Rocket,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { evaluateChallengeCode } from '../data/challengeRunner';
import { EvaluationReport, TestCase, TestResult, Challenge } from '../data/challenges';
import { ContractDeployer } from '../services/contractDeployer';
import { PISO_NETWORK } from '../pisoConfig';

export const Web3Lab: React.FC = () => {
  const {
    challenges,
    activeChallenge,
    setActiveChallenge,
    recordChallengePass,
    refreshDeployments,
    setNotification,
  } = useAcademy();

  const [code, setCode] = useState<string>(activeChallenge.startingCode);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [copied, setCopied] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [deploymentResult, setDeploymentResult] = useState<{
    address: string;
    txHash: string;
  } | null>(null);

  const handleSelectChallenge = (c: Challenge) => {
    setActiveChallenge(c);
    setCode(c.startingCode);
    setReport(null);
    setDeploymentResult(null);
  };

  const handleResetCode = () => {
    setCode(activeChallenge.startingCode);
    setReport(null);
    setDeploymentResult(null);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunTests = () => {
    setIsRunningTests(true);
    setTimeout(() => {
      const result = evaluateChallengeCode(activeChallenge, code);
      setReport(result);
      setIsRunningTests(false);

      if (result.passed) {
        recordChallengePass(activeChallenge.id, activeChallenge.xpReward);
      }
    }, 450);
  };

  const handleDeployToPiso = async () => {
    setIsDeploying(true);
    try {
      const receipt = await ContractDeployer.deployContract(
        activeChallenge.title,
        code
      );
      setDeploymentResult({
        address: receipt.contractAddress,
        txHash: receipt.transactionHash,
      });
      refreshDeployments();
      setNotification({
        message: `Contract successfully deployed to PISO Chain Devnet! Address: ${receipt.contractAddress.slice(0, 8)}...`,
        type: 'success',
      });
    } catch {
      setNotification({
        message: 'Deployment failed. Check network connection.',
        type: 'error',
      });
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Header with Challenge Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 uppercase">
              Web3 Coding Lab
            </span>
            <span className="text-xs font-mono text-slate-400">solc ^0.8.20 • EVM Shanghai</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">{activeChallenge.title}</h1>
        </div>

        {/* Challenge Dropdown */}
        <div className="flex items-center space-x-3">
          <label className="text-xs text-slate-400 font-medium">Pumili ng Hamon:</label>
          <select
            value={activeChallenge.id}
            onChange={(e) => {
              const selected = challenges.find((c) => c.id === e.target.value);
              if (selected) handleSelectChallenge(selected);
            }}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl px-3 py-2 focus:ring-amber-500 focus:border-amber-500"
          >
            {challenges.map((c) => (
              <option key={c.id} value={c.id}>
                {c.difficulty} - {c.title} (+{c.xpReward} XP)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Split-Screen Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Instructions, Objectives & Test Requirements (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Challenge Meta Card */}
          <div className="p-4 rounded-xl bg-[#161F30] border border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Gantimpala (Reward)</span>
              <span className="text-xs font-mono font-bold text-amber-400">+{activeChallenge.xpReward} XP</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{activeChallenge.shortDescription}</p>

            <div className="flex items-center space-x-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400 font-mono">
              <span>Category: <strong className="text-white">{activeChallenge.category}</strong></span>
              <span>•</span>
              <span>Difficulty: <strong className="text-amber-400">{activeChallenge.difficulty}</strong></span>
            </div>
          </div>

          {/* Detailed Instructions */}
          <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
              <Terminal className="w-4 h-4 text-blue-400" />
              <span>Mga Panuntunan (Instructions)</span>
            </h3>
            <div className="prose prose-invert prose-xs text-slate-300 text-xs leading-relaxed whitespace-pre-line">
              {activeChallenge.instructionsMarkdown}
            </div>

            {/* Test Requirements Checklist */}
            <div className="pt-3 border-t border-slate-800">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Test Assertions:</h4>
              <div className="space-y-1.5">
                {activeChallenge.testCases.map((tc: TestCase) => (
                  <div key={tc.id} className="p-2 rounded bg-slate-800/60 flex items-center justify-between text-xs">
                    <span className="text-slate-300">{tc.name}</span>
                    <span className="text-slate-500 font-mono text-[10px]">{tc.points} pts</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Hints Accordion */}
          {activeChallenge.hints && activeChallenge.hints.length > 0 && (
            <div className="rounded-xl bg-slate-900/60 border border-slate-800 overflow-hidden">
              <button
                onClick={() => setShowHints(!showHints)}
                className="w-full p-3 flex items-center justify-between text-xs font-semibold text-amber-300 hover:bg-slate-800/40"
              >
                <div className="flex items-center space-x-1.5">
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>Kailangan mo ba ng Gabay? (Hints)</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${showHints ? 'rotate-180' : ''}`} />
              </button>
              {showHints && (
                <div className="p-3.5 bg-slate-950/40 border-t border-slate-800 space-y-2 text-xs text-slate-300">
                  {activeChallenge.hints.map((hint: string, idx: number) => (
                    <div key={idx} className="flex items-start space-x-2">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{hint}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Code Editor & Console (7 Cols) */}
        <div className="lg:col-span-7 space-y-4 flex flex-col">
          {/* Editor Window Header */}
          <div className="rounded-2xl bg-[#161F30] border border-slate-700/60 overflow-hidden shadow-lg flex-1 flex flex-col">
            <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
                <span className="ml-2 text-xs font-mono text-slate-300 font-bold">
                  {activeChallenge.slug}.sol
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleResetCode}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Reset code to starting template"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleCopyCode}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Copy code"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Editor Textarea */}
            <div className="relative flex-1 min-h-[360px] bg-[#0D1117] p-4 font-mono text-xs">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
                className="w-full h-full min-h-[340px] bg-transparent text-emerald-300 resize-none outline-none leading-relaxed font-mono selection:bg-amber-500/30 selection:text-white"
              />
            </div>

            {/* Action Bar (Run Tests & Deploy) */}
            <div className="px-4 py-3 bg-slate-900/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleRunTests}
                  disabled={isRunningTests}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-sm flex items-center space-x-2 transition-all disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>{isRunningTests ? 'Sinusuri ang Code...' : 'Run Tests'}</span>
                </button>

                <button
                  onClick={handleDeployToPiso}
                  disabled={isDeploying}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-glow flex items-center space-x-2 transition-all disabled:opacity-50"
                >
                  <Rocket className="w-3.5 h-3.5" />
                  <span>{isDeploying ? 'Deploying...' : 'Deploy to PISO Chain'}</span>
                </button>
              </div>

              {report && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono text-slate-400">Puntos:</span>
                  <span
                    className={`text-xs font-mono font-black px-2 py-0.5 rounded ${
                      report.passed
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}
                  >
                    {report.totalScore} / {report.maxScore}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Test Report & Console Output */}
          {report && (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-bold text-white flex items-center space-x-1.5">
                  <Terminal className="w-3.5 h-3.5 text-slate-400" />
                  <span>Test Results</span>
                </span>
                <span className="text-[11px] text-slate-500">{report.executionTimeMs}ms execution</span>
              </div>

              <div className="space-y-1.5">
                {report.results.map((r: TestResult) => (
                  <div
                    key={r.testId}
                    className={`p-2 rounded flex items-start space-x-2 ${
                      r.passed ? 'bg-emerald-950/30 text-emerald-300' : 'bg-rose-950/30 text-rose-300'
                    }`}
                  >
                    {r.passed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-rose-400 mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1">
                      <div className="flex justify-between font-bold">
                        <span>{r.name}</span>
                        <span>+{r.pointsEarned} pts</span>
                      </div>
                      <p className="text-[11px] opacity-80 mt-0.5">{r.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deployment Receipt Card */}
          {deploymentResult && (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Live on PISO Chain Devnet!</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-300">Chain ID 2026001</span>
              </div>
              <div className="space-y-1 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Contract:</span>
                  <span className="text-amber-300">{deploymentResult.address}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Tx Hash:</span>
                  <span className="truncate max-w-[200px]">{deploymentResult.txHash}</span>
                </div>
              </div>
              <div className="pt-2 flex justify-end space-x-2">
                <a
                  href={PISO_NETWORK.explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1 font-bold"
                >
                  <span>Buksan sa PISO Explorer</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
