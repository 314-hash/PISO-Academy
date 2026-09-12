import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { BridgeService, BridgeTx } from '../../services/bridgeService';
import { NetworkSwitcher, NetworkStatus } from '../../services/networkSwitcher';
import { PISO_NETWORK, L1_NETWORK } from '../../pisoConfig';

// ═══════════════════════════════════════════════════════════════════
//  PISO BRIDGE PANEL
//  Animated bridge UI for $PISO cross-chain transfers.
//  L1 (Sepolia) ↔ L2 (PISO Chain) via OP Stack StandardBridge.
// ═══════════════════════════════════════════════════════════════════

type Tab = 'deposit' | 'withdraw' | 'history';

interface PisoBridgePanelProps {
  isOpen: boolean;
  onClose: () => void;
  userAddress?: string;
  signer?: ethers.Signer;
}

export const PisoBridgePanel: React.FC<PisoBridgePanelProps> = ({
  isOpen,
  onClose,
  userAddress,
  signer,
}) => {
  const [activeTab, setActiveTab]       = useState<Tab>('deposit');
  const [amount, setAmount]             = useState('');
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');
  const [network, setNetwork]           = useState<NetworkStatus | null>(null);
  const [history, setHistory]           = useState<BridgeTx[]>([]);
  const [l2Balance, setL2Balance]       = useState('--');
  const [l2EthBalance, setL2EthBalance] = useState('--');
  const [animIn, setAnimIn]             = useState(false);

  // ── Init ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setAnimIn(true), 10);
      refreshAll();
    } else {
      setAnimIn(false);
    }
  }, [isOpen]);

  const refreshAll = useCallback(async () => {
    try {
      const status = await NetworkSwitcher.getNetworkStatus();
      setNetwork(status);
      setHistory(BridgeService.getHistory());
      if (userAddress) {
        const [pisobal, ethbal] = await Promise.all([
          BridgeService.getPisoL2Balance(userAddress).catch(() => '--'),
          BridgeService.getL2EthBalance(userAddress).catch(() => '--'),
        ]);
        setL2Balance(Number(pisobal).toLocaleString(undefined, { maximumFractionDigits: 4 }));
        setL2EthBalance(Number(ethbal).toFixed(6));
      }
    } catch {}
  }, [userAddress]);

  // ── Network listener ──────────────────────────────────────────────

  useEffect(() => {
    const cleanup = NetworkSwitcher.onChainChanged((status) => {
      setNetwork(status);
    });
    return cleanup;
  }, []);

  // ── Actions ───────────────────────────────────────────────────────

  const handleDeposit = async () => {
    if (!signer || !amount) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      const amountWei = ethers.parseEther(amount);
      // For demo, we use a placeholder L1 token address
      const l1PisoToken = (window as any).__PISO_L1_TOKEN__ || ethers.ZeroAddress;
      const tx = await BridgeService.depositToL2(amountWei, l1PisoToken, signer);
      setSuccess(`✅ Deposit submitted! L1 TX: ${tx.l1TxHash.slice(0, 18)}...`);
      setAmount('');
      setHistory(BridgeService.getHistory());
    } catch (e: any) {
      setError(e?.reason || e?.message || 'Deposit failed');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!signer || !amount) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      const amountWei = ethers.parseEther(amount);
      const tx = await BridgeService.initiateWithdrawal(amountWei, signer);
      setSuccess(`🔄 Withdrawal initiated! 7-day window started. L2 TX: ${tx.l2TxHash.slice(0, 18)}...`);
      setAmount('');
      setHistory(BridgeService.getHistory());
    } catch (e: any) {
      setError(e?.reason || e?.message || 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchToL2 = async () => {
    setLoading(true); setError('');
    try { await NetworkSwitcher.switchToPisoL2(); await refreshAll(); }
    catch (e: any) { setError(e?.message || 'Switch failed'); }
    finally { setLoading(false); }
  };

  const handleSwitchToL1 = async () => {
    setLoading(true); setError('');
    try { await NetworkSwitcher.switchToSepolia(); await refreshAll(); }
    catch (e: any) { setError(e?.message || 'Switch failed'); }
    finally { setLoading(false); }
  };

  if (!isOpen) return null;

  const needsL1 = activeTab === 'deposit';
  const needsL2 = activeTab === 'withdraw';
  const wrongNetwork = network && (
    (needsL1 && !network.isOnSepolia) ||
    (needsL2 && !network.isOnPisoL2)
  );

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div
        style={{ ...styles.panel, transform: animIn ? 'translateX(0)' : 'translateX(100%)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <span style={styles.bridgeIcon}>🌉</span>
            <div>
              <div style={styles.title}>PISO Bridge</div>
              <div style={styles.subtitle}>L2 ↔ Sepolia Cross-Chain</div>
            </div>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* ── Network Status Bar ── */}
        <div style={styles.networkBar}>
          <div style={styles.networkChip}>
            <span style={styles.chainDot('sepolia')} />
            <span style={styles.chainText}>Sepolia L1</span>
            {network?.isOnSepolia && <span style={styles.activeBadge}>ACTIVE</span>}
            {!network?.isOnSepolia && (
              <button style={styles.switchBtn} onClick={handleSwitchToL1}>Switch</button>
            )}
          </div>
          <div style={styles.bridgeArrow}>
            <div style={styles.arrowLine} />
            <span style={styles.arrowIcon}>⇄</span>
            <div style={styles.arrowLine} />
          </div>
          <div style={styles.networkChip}>
            <span style={styles.chainDot('piso')} />
            <span style={styles.chainText}>PISO Chain L2</span>
            {network?.isOnPisoL2 && <span style={styles.activeBadge}>ACTIVE</span>}
            {!network?.isOnPisoL2 && (
              <button style={styles.switchBtn} onClick={handleSwitchToL2}>Switch</button>
            )}
          </div>
        </div>

        {/* ── Balance Strip ── */}
        {userAddress && (
          <div style={styles.balanceStrip}>
            <div style={styles.balanceItem}>
              <span style={styles.balLabel}>L2 PISO</span>
              <span style={styles.balValue}>{l2Balance}</span>
            </div>
            <div style={styles.balanceDivider} />
            <div style={styles.balanceItem}>
              <span style={styles.balLabel}>L2 ETH (Gas)</span>
              <span style={styles.balValue}>{l2EthBalance}</span>
            </div>
          </div>
        )}

        {/* ── Tabs ── */}
        <div style={styles.tabs}>
          {(['deposit', 'withdraw', 'history'] as Tab[]).map(tab => (
            <button
              key={tab}
              style={{ ...styles.tab, ...(activeTab === tab ? styles.tabActive : {}) }}
              onClick={() => { setActiveTab(tab); setError(''); setSuccess(''); }}
            >
              {tab === 'deposit' ? '⬇️ Deposit' : tab === 'withdraw' ? '⬆️ Withdraw' : '📜 History'}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        <div style={styles.content}>

          {/* DEPOSIT */}
          {activeTab === 'deposit' && (
            <div style={styles.form}>
              <div style={styles.infoCard}>
                <div style={styles.infoTitle}>Sepolia → PISO Chain L2</div>
                <div style={styles.infoText}>
                  Lock $PISO on Sepolia and receive it on PISO Chain L2 within ~2 minutes.
                  Uses OP Stack L1StandardBridge.
                </div>
                <div style={styles.infoSteps}>
                  {['Approve $PISO on L1', 'Call L1StandardBridge', 'Wait ~2min relay', 'Receive on L2'].map((s, i) => (
                    <div key={i} style={styles.infoStep}>
                      <span style={styles.stepNum}>{i + 1}</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>

              {wrongNetwork && (
                <div style={styles.warnCard}>
                  ⚠️ Switch to <strong>Sepolia</strong> to deposit
                  <button style={styles.warnBtn} onClick={handleSwitchToL1}>Switch Now</button>
                </div>
              )}

              <label style={styles.label}>Amount (PISO)</label>
              <div style={styles.inputRow}>
                <input
                  id="bridge-deposit-amount"
                  style={styles.input}
                  type="number"
                  min="0"
                  placeholder="0.0"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
                <span style={styles.inputSuffix}>PISO</span>
              </div>

              <button
                id="bridge-deposit-btn"
                style={{ ...styles.actionBtn, ...styles.depositBtn, opacity: loading ? 0.6 : 1 }}
                onClick={handleDeposit}
                disabled={loading || !signer || !amount || !!wrongNetwork}
              >
                {loading ? '⏳ Depositing...' : '⬇️ Deposit to PISO L2'}
              </button>
            </div>
          )}

          {/* WITHDRAW */}
          {activeTab === 'withdraw' && (
            <div style={styles.form}>
              <div style={styles.infoCard}>
                <div style={styles.infoTitle}>PISO Chain L2 → Sepolia</div>
                <div style={styles.infoText}>
                  Burn $PISO on L2 and reclaim it on Sepolia after the 7-day fraud-proof window.
                </div>
                <div style={styles.infoSteps}>
                  {[
                    'Approve & burn $PISO on L2',
                    'Sequencer posts state root (~hours)',
                    '7-day challenge window',
                    'Claim on Sepolia L1',
                  ].map((s, i) => (
                    <div key={i} style={styles.infoStep}>
                      <span style={styles.stepNum}>{i + 1}</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>

              {wrongNetwork && (
                <div style={styles.warnCard}>
                  ⚠️ Switch to <strong>PISO Chain L2</strong> to withdraw
                  <button style={styles.warnBtn} onClick={handleSwitchToL2}>Switch Now</button>
                </div>
              )}

              <div style={styles.cautionCard}>
                ⏳ <strong>7-day waiting period.</strong> Optimistic Rollup security requires
                a fraud-proof window before funds reach L1. Plan accordingly.
              </div>

              <label style={styles.label}>Amount (PISO)</label>
              <div style={styles.inputRow}>
                <input
                  id="bridge-withdraw-amount"
                  style={styles.input}
                  type="number"
                  min="0"
                  placeholder="0.0"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
                <span style={styles.inputSuffix}>PISO</span>
              </div>

              <button
                id="bridge-withdraw-btn"
                style={{ ...styles.actionBtn, ...styles.withdrawBtn, opacity: loading ? 0.6 : 1 }}
                onClick={handleWithdraw}
                disabled={loading || !signer || !amount || !!wrongNetwork}
              >
                {loading ? '⏳ Initiating...' : '⬆️ Withdraw to Sepolia'}
              </button>
            </div>
          )}

          {/* HISTORY */}
          {activeTab === 'history' && (
            <div style={styles.historyList}>
              {history.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>🌉</div>
                  <div style={styles.emptyText}>No bridge transactions yet</div>
                  <div style={styles.emptySubtext}>Your deposit and withdrawal history will appear here</div>
                </div>
              ) : (
                history.map(tx => (
                  <div key={tx.id} style={styles.historyItem}>
                    <div style={styles.historyTop}>
                      <span style={styles.historyDir}>
                        {tx.direction === 'l1_to_l2' ? '⬇️ Deposit' : '⬆️ Withdraw'}
                      </span>
                      <span style={styles.historyAmount}>{tx.amount} PISO</span>
                    </div>
                    <div style={styles.historyStatus}>{BridgeService.formatStatus(tx)}</div>
                    <div style={styles.historyTime}>
                      {new Date(tx.initiatedAt * 1000).toLocaleString()}
                    </div>
                    {tx.challengeWindowEnd && tx.status !== 'finalized' && (
                      <div style={styles.historyWindow}>
                        Window ends: {new Date(tx.challengeWindowEnd * 1000).toLocaleDateString()}
                      </div>
                    )}
                    {(tx.l1TxHash || tx.l2TxHash) && (
                      <div style={styles.historyLinks}>
                        {tx.l1TxHash && (
                          <a href={`${L1_NETWORK.explorerUrl}/tx/${tx.l1TxHash}`}
                             target="_blank" rel="noopener noreferrer" style={styles.historyLink}>
                            L1 TX ↗
                          </a>
                        )}
                        {tx.l2TxHash && (
                          <a href={`${PISO_NETWORK.explorerUrl}/tx/${tx.l2TxHash}`}
                             target="_blank" rel="noopener noreferrer" style={styles.historyLink}>
                            L2 TX ↗
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Feedback */}
          {error   && <div style={styles.errorMsg}>{error}</div>}
          {success && <div style={styles.successMsg}>{success}</div>}
        </div>

        {/* ── Footer ── */}
        <div style={styles.footer}>
          <span style={styles.footerText}>
            Powered by OP Stack Optimistic Rollup · Chain ID {PISO_NETWORK.chainId}
          </span>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════════════════════════════════

const styles: any = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'rgba(0,0,10,0.7)', backdropFilter: 'blur(4px)',
    display: 'flex', justifyContent: 'flex-end',
  },
  panel: {
    width: '420px', height: '100vh',
    background: 'linear-gradient(180deg, #0d0f1a 0%, #080b18 100%)',
    borderLeft: '1px solid rgba(99,102,241,0.3)',
    display: 'flex', flexDirection: 'column',
    transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 20px 16px',
    borderBottom: '1px solid rgba(99,102,241,0.15)',
    background: 'rgba(99,102,241,0.05)',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  bridgeIcon: { fontSize: '28px' },
  title: { fontSize: '18px', fontWeight: 700, color: '#e2e8f0', fontFamily: 'Inter, sans-serif' },
  subtitle: { fontSize: '11px', color: 'rgba(148,163,184,0.7)', marginTop: '2px' },
  closeBtn: {
    background: 'none', border: 'none', color: '#94a3b8', fontSize: '18px',
    cursor: 'pointer', padding: '4px 8px', borderRadius: '6px',
    transition: 'all 0.2s',
  },
  networkBar: {
    display: 'flex', alignItems: 'center', padding: '12px 16px', gap: '8px',
    background: 'rgba(15,17,35,0.6)',
    borderBottom: '1px solid rgba(30,30,60,0.5)',
  },
  networkChip: {
    flex: 1, display: 'flex', alignItems: 'center', gap: '6px',
    background: 'rgba(30,32,60,0.8)', borderRadius: '10px',
    padding: '8px 10px', border: '1px solid rgba(99,102,241,0.2)',
  },
  chainText: { fontSize: '10px', color: '#94a3b8', fontFamily: 'mono', flex: 1 },
  activeBadge: {
    fontSize: '9px', background: 'rgba(34,197,94,0.2)', color: '#4ade80',
    border: '1px solid rgba(34,197,94,0.3)', borderRadius: '4px',
    padding: '1px 5px', fontWeight: 700,
  },
  switchBtn: {
    fontSize: '9px', background: 'rgba(99,102,241,0.2)', color: '#818cf8',
    border: '1px solid rgba(99,102,241,0.3)', borderRadius: '4px',
    padding: '2px 6px', cursor: 'pointer', fontWeight: 600,
  },
  chainDot: (chain: 'sepolia' | 'piso') => ({
    width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
    background: chain === 'sepolia' ? '#60a5fa' : '#a78bfa',
    boxShadow: chain === 'sepolia' ? '0 0 6px #60a5fa' : '0 0 6px #a78bfa',
  } as React.CSSProperties),
  bridgeArrow: {
    display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0,
  },
  arrowLine: { width: '10px', height: '1px', background: 'rgba(99,102,241,0.4)' },
  arrowIcon: { fontSize: '14px', color: '#818cf8' },
  balanceStrip: {
    display: 'flex', alignItems: 'center', padding: '10px 16px', gap: '12px',
    background: 'rgba(10,12,28,0.8)', borderBottom: '1px solid rgba(30,30,60,0.5)',
  },
  balanceItem: { display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 },
  balLabel: { fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' },
  balValue: { fontSize: '14px', fontWeight: 700, color: '#a78bfa', fontFamily: 'monospace' },
  balanceDivider: { width: '1px', height: '30px', background: 'rgba(99,102,241,0.2)' },
  tabs: {
    display: 'flex', borderBottom: '1px solid rgba(30,30,60,0.6)',
    background: 'rgba(5,6,20,0.5)',
  },
  tab: {
    flex: 1, padding: '12px 0', background: 'none', border: 'none',
    color: '#64748b', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
    borderBottom: '2px solid transparent', transition: 'all 0.2s',
  },
  tabActive: {
    color: '#818cf8', borderBottomColor: '#818cf8',
    background: 'rgba(99,102,241,0.05)',
  },
  content: {
    flex: 1, overflowY: 'auto', padding: '16px',
    display: 'flex', flexDirection: 'column', gap: '12px',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  infoCard: {
    background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)',
    borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px',
  },
  infoTitle: { fontSize: '13px', fontWeight: 700, color: '#c7d2fe' },
  infoText: { fontSize: '11px', color: '#94a3b8', lineHeight: '1.5' },
  infoSteps: { display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' },
  infoStep: { display: 'flex', alignItems: 'center', gap: '8px' },
  stepNum: {
    width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
    background: 'rgba(99,102,241,0.3)', border: '1px solid rgba(99,102,241,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '10px', fontWeight: 700, color: '#a5b4fc',
  },
  warnCard: {
    background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)',
    borderRadius: '10px', padding: '10px 12px', fontSize: '12px', color: '#fcd34d',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
  },
  warnBtn: {
    background: 'rgba(251,191,36,0.2)', border: '1px solid rgba(251,191,36,0.4)',
    borderRadius: '6px', padding: '4px 10px', fontSize: '11px', color: '#fbbf24',
    cursor: 'pointer', flexShrink: 0, fontWeight: 600,
  },
  cautionCard: {
    background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: '10px', padding: '10px 12px', fontSize: '12px', color: '#fca5a5',
    lineHeight: '1.5',
  },
  label: { fontSize: '12px', color: '#94a3b8', fontWeight: 600 },
  inputRow: { display: 'flex', alignItems: 'center', gap: '0' },
  input: {
    flex: 1, padding: '12px 14px', background: 'rgba(15,17,40,0.9)',
    border: '1px solid rgba(99,102,241,0.3)', borderRight: 'none',
    borderRadius: '10px 0 0 10px', color: '#e2e8f0', fontSize: '15px',
    outline: 'none', fontFamily: 'monospace',
  },
  inputSuffix: {
    padding: '12px 14px', background: 'rgba(99,102,241,0.15)',
    border: '1px solid rgba(99,102,241,0.3)', borderLeft: 'none',
    borderRadius: '0 10px 10px 0', color: '#818cf8', fontWeight: 700,
    fontSize: '13px',
  },
  actionBtn: {
    padding: '14px', borderRadius: '12px', border: 'none',
    fontSize: '14px', fontWeight: 700, cursor: 'pointer',
    transition: 'all 0.2s', letterSpacing: '0.02em',
  },
  depositBtn: {
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    color: '#fff', boxShadow: '0 4px 20px rgba(79,70,229,0.4)',
  },
  withdrawBtn: {
    background: 'linear-gradient(135deg, #0891b2, #0e7490)',
    color: '#fff', boxShadow: '0 4px 20px rgba(8,145,178,0.4)',
  },
  errorMsg: {
    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: '10px', padding: '10px 12px', fontSize: '12px', color: '#fca5a5',
  },
  successMsg: {
    background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
    borderRadius: '10px', padding: '10px 12px', fontSize: '12px', color: '#86efac',
  },
  historyList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  historyItem: {
    background: 'rgba(15,17,40,0.7)', border: '1px solid rgba(99,102,241,0.15)',
    borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px',
  },
  historyTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  historyDir: { fontSize: '12px', fontWeight: 700, color: '#c7d2fe' },
  historyAmount: { fontSize: '14px', fontWeight: 800, color: '#a78bfa', fontFamily: 'monospace' },
  historyStatus: { fontSize: '11px', color: '#94a3b8' },
  historyTime: { fontSize: '10px', color: '#475569' },
  historyWindow: { fontSize: '10px', color: '#fbbf24' },
  historyLinks: { display: 'flex', gap: '8px', marginTop: '4px' },
  historyLink: { fontSize: '10px', color: '#818cf8', textDecoration: 'none', fontWeight: 600 },
  emptyState: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: '8px', padding: '60px 20px',
  },
  emptyIcon: { fontSize: '40px', opacity: 0.3 },
  emptyText: { fontSize: '14px', fontWeight: 600, color: '#94a3b8' },
  emptySubtext: { fontSize: '12px', color: '#475569', textAlign: 'center' },
  footer: {
    padding: '12px 16px', borderTop: '1px solid rgba(30,30,60,0.5)',
    background: 'rgba(5,6,20,0.5)', textAlign: 'center',
  },
  footerText: { fontSize: '10px', color: '#334155' },
};

export default PisoBridgePanel;
