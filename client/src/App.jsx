import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  TrendingUp, 
  ShieldCheck, 
  ArrowRightLeft, 
  Wallet, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Sliders, 
  Layers, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  UserCheck,
  Lock,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';

const API_BASE = '/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [currentRole, setCurrentRole] = useState('ANALYST'); // 'ANALYST', 'CFO', 'AUDITOR'
  
  // Data States
  const [overview, setOverview] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [fxRates, setFxRates] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [hedges, setHedges] = useState([]);
  const [forecasts, setForecasts] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Transfer Modal State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferForm, setTransferForm] = useState({
    source_account_id: '',
    target_account_id: '',
    amount: '',
    type: 'INTERCOMPANY_SWEEP',
    reference_note: ''
  });

  // Stress Test State
  const [stressUSD, setStressUSD] = useState(0);
  const [stressRate, setStressRate] = useState(0);
  const [stressResult, setStressResult] = useState(null);

  // Initial Data Fetch
  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [ovRes, accRes, fxRes, trxRes, hdgRes, fcRes, logRes] = await Promise.all([
        fetch(`${API_BASE}/overview`).then(r => r.json()),
        fetch(`${API_BASE}/accounts`).then(r => r.json()),
        fetch(`${API_BASE}/fx-rates`).then(r => r.json()),
        fetch(`${API_BASE}/transactions`).then(r => r.json()),
        fetch(`${API_BASE}/hedges`).then(r => r.json()),
        fetch(`${API_BASE}/forecasting`).then(r => r.json()),
        fetch(`${API_BASE}/audit-trail`).then(r => r.json())
      ]);

      setOverview(ovRes);
      setAccounts(accRes);
      setFxRates(fxRes);
      setTransactions(trxRes);
      setHedges(hdgRes);
      setForecasts(fcRes);
      setAuditLogs(logRes);

      if (accRes.length >= 2 && !transferForm.source_account_id) {
        setTransferForm(prev => ({
          ...prev,
          source_account_id: accRes[0].id,
          target_account_id: accRes[1].id
        }));
      }

      // Initial stress test baseline
      runStressTest(0, 0);
    } catch (err) {
      console.error('Error fetching data:', err);
      showToast('Failed to connect to AlphaPulse API backend', 'error');
    } finally {
      setLoading(false);
    }
  }

  function showToast(msg, type = 'success') {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  }

  // Handle Transfer Submission
  async function handleTransferSubmit(e) {
    e.preventDefault();
    if (!transferForm.amount || parseFloat(transferForm.amount) <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transferForm)
      });
      const data = await res.json();

      if (res.ok) {
        showToast(`Transaction ${data.transaction_id} queued for CFO signoff!`, 'success');
        setShowTransferModal(false);
        setTransferForm(prev => ({ ...prev, amount: '', reference_note: '' }));
        fetchData();
      } else {
        showToast(data.error || 'Transfer submission failed', 'error');
      }
    } catch (err) {
      showToast('Network error submitting transfer', 'error');
    }
  }

  // Handle CFO Approval
  async function handleApprove(trxId) {
    try {
      const res = await fetch(`${API_BASE}/transactions/${trxId}/approve`, {
        method: 'POST'
      });
      const data = await res.json();

      if (res.ok) {
        showToast(data.message, 'success');
        fetchData();
      } else {
        showToast(data.error || 'Approval failed', 'error');
      }
    } catch (err) {
      showToast('Network error during approval', 'error');
    }
  }

  // Run Stress Test
  async function runStressTest(usdShift, rateShift) {
    try {
      const res = await fetch(`${API_BASE}/stress-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usdShockPct: usdShift, interestRateShockBps: rateShift })
      });
      const data = await res.json();
      setStressResult(data);
    } catch (err) {
      console.error('Stress test error:', err);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* 1. TOP GLOBAL EXECUTIVE HEADER & TICKER */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Brand Logo */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                    ALPHAPULSE
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                    TREASURY SUITE
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">Enterprise Multi-Currency Liquidity & Risk Management</p>
              </div>
            </div>

            {/* Live Ticker Ribbon */}
            <div className="hidden lg:flex items-center gap-4 bg-slate-950/70 border border-slate-800/80 rounded-lg px-3 py-1.5 text-xs font-mono">
              <span className="text-slate-400 font-sans font-semibold text-[11px] flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span> LIVE FX:
              </span>
              {fxRates.map(fx => (
                <div key={fx.pair} className="flex items-center gap-1.5 border-r border-slate-800 pr-3 last:border-0 last:pr-0">
                  <span className="text-slate-300 font-semibold">{fx.pair}</span>
                  <span className="text-white font-medium">{fx.rate.toFixed(4)}</span>
                  <span className={`text-[10px] flex items-center ${fx.change_24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {fx.change_24h >= 0 ? <ArrowUpRight className="h-3 w-3 inline" /> : <ArrowDownRight className="h-3 w-3 inline" />}
                    {Math.abs(fx.change_24h)}%
                  </span>
                </div>
              ))}
            </div>

            {/* Role Switcher & User Profile */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-white">
                  {currentRole === 'ANALYST' && 'Muhammad Irfan Firdaus'}
                  {currentRole === 'CFO' && 'Zainal Abidin (Group CFO)'}
                  {currentRole === 'AUDITOR' && 'PwC Malaysia / BNM Auditor'}
                </div>
                <div className="text-[11px] text-slate-400">
                  {currentRole === 'ANALYST' && 'Lead Treasury Analyst'}
                  {currentRole === 'CFO' && 'Dual-Control Signoff Authority'}
                  {currentRole === 'AUDITOR' && 'Compliance & Audit View'}
                </div>
              </div>

              {/* Role Toggle Selector */}
              <div className="bg-slate-800 p-1 rounded-lg border border-slate-700 flex text-xs">
                <button
                  onClick={() => setCurrentRole('ANALYST')}
                  className={`px-2.5 py-1 rounded font-medium transition ${currentRole === 'ANALYST' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                  title="Initiate transfers & stress test"
                >
                  Analyst
                </button>
                <button
                  onClick={() => setCurrentRole('CFO')}
                  className={`px-2.5 py-1 rounded font-medium transition ${currentRole === 'CFO' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                  title="Dual-Control Authorization"
                >
                  CFO Signoff
                </button>
                <button
                  onClick={() => setCurrentRole('AUDITOR')}
                  className={`px-2.5 py-1 rounded font-medium transition ${currentRole === 'AUDITOR' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                  title="Audit Trail View"
                >
                  Auditor
                </button>
              </div>

              <button 
                onClick={fetchData}
                disabled={loading}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title="Refresh market data"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
              </button>
            </div>

          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 overflow-x-auto">
          {[
            { id: 'overview', label: 'Liquidity Cockpit', icon: Layers },
            { id: 'accounts', label: 'Multi-Currency Accounts', icon: Wallet },
            { id: 'forecasting', label: '12M Cash Forecasting', icon: TrendingUp },
            { id: 'stresstest', label: 'FX Stress Testing Engine', icon: Sliders },
            { id: 'transfers', label: `Transactions & Dual-Control (${overview?.pendingApprovalsCount || 0})`, icon: ArrowRightLeft },
            { id: 'hedging', label: 'Hedging & Derivatives', icon: ShieldCheck },
            { id: 'audit', label: 'BNM RMiT Audit Trail', icon: FileText }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-3.5 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
                  isActive 
                    ? 'border-blue-500 text-blue-400 bg-blue-500/5' 
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className={`px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border ${
            notification.type === 'error' ? 'bg-rose-950/90 text-rose-200 border-rose-800' : 'bg-emerald-950/90 text-emerald-200 border-emerald-800'
          }`}>
            {notification.type === 'error' ? <XCircle className="h-5 w-5 text-rose-400" /> : <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
            <span className="text-sm font-semibold">{notification.msg}</span>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ============================================================ */}
        {/* TAB 1: EXECUTIVE LIQUIDITY COCKPIT */}
        {/* ============================================================ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* Top 4 Stat Widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1 */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Net Global Liquidity</p>
                    <h3 className="text-2xl font-extrabold text-white mt-1">
                      {overview ? overview.totalLiquidityFormatted : 'RM --'}
                    </h3>
                  </div>
                  <span className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
                    <Wallet className="h-5 w-5" />
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                  <ArrowUpRight className="h-4 w-4" />
                  <span>+4.2% MoM vs. Sep 2026</span>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"></div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Cash & Quick Ratio</p>
                    <h3 className="text-2xl font-extrabold text-white mt-1">
                      {overview ? `${overview.cashRatio}x` : '--'}
                    </h3>
                  </div>
                  <span className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
                    <ShieldCheck className="h-5 w-5" />
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                  <span className="text-emerald-400 font-semibold">Well Above</span> 1.50x covenant floor
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl"></div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Hedged FX Notional</p>
                    <h3 className="text-2xl font-extrabold text-white mt-1">
                      {overview ? `RM ${(overview.totalHedgedNotionalMYR / 1e6).toFixed(2)}M` : '--'}
                    </h3>
                  </div>
                  <span className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
                    <TrendingUp className="h-5 w-5" />
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                  <span>MTM Gain: +RM {overview ? (overview.totalMtmGainLoss / 1e3).toFixed(1) : 0}k</span>
                </div>
              </div>

              {/* Card 4 */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl"></div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending CFO Approvals</p>
                    <h3 className="text-2xl font-extrabold text-amber-400 mt-1">
                      {overview ? overview.pendingApprovalsCount : '0'}
                    </h3>
                  </div>
                  <span className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400">
                    <UserCheck className="h-5 w-5" />
                  </span>
                </div>
                <div className="mt-3 text-xs text-slate-400 font-medium">
                  Dual-signoff required before cut-off
                </div>
              </div>

            </div>

            {/* Currency Allocation Bar & Breakdown */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-sm text-white">Global Currency Allocation & FX Exposure</h4>
                  <p className="text-xs text-slate-400">Group consolidated balance converted at real-time market rates</p>
                </div>
                <button
                  onClick={() => setShowTransferModal(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition self-start sm:self-auto"
                >
                  <ArrowRightLeft className="h-4 w-4" />
                  New Transfer / FX Conversion
                </button>
              </div>

              {/* Stacked Progress Bar */}
              <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
                <div style={{ width: '40.5%' }} className="bg-blue-500" title="MYR 40.5%"></div>
                <div style={{ width: '39.1%' }} className="bg-emerald-500" title="USD 39.1%"></div>
                <div style={{ width: '12.7%' }} className="bg-amber-500" title="SGD 12.7%"></div>
                <div style={{ width: '7.7%' }} className="bg-indigo-500" title="EUR 7.7%"></div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                {overview?.currencyAllocation?.map((curr, idx) => {
                  const colors = ['border-blue-500 text-blue-400', 'border-emerald-500 text-emerald-400', 'border-amber-500 text-amber-400', 'border-indigo-500 text-indigo-400'];
                  return (
                    <div key={curr.currency} className={`border-l-2 pl-3 py-1 ${colors[idx % colors.length]}`}>
                      <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                        <span>{curr.currency} Pool</span>
                        <span>{curr.percentage}%</span>
                      </div>
                      <div className="text-sm font-extrabold text-white mt-0.5">
                        {curr.currency} {(curr.amount / 1e6).toFixed(2)}M
                      </div>
                      <div className="text-[11px] text-slate-400">
                        ≈ RM {(curr.myrValue / 1e6).toFixed(2)}M
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Multi-Currency Accounts Cards */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-white">Active Multi-Currency Accounts & Banks</h4>
                <button onClick={() => setActiveTab('accounts')} className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1">
                  View All ({accounts.length}) <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {accounts.slice(0, 6).map(acc => (
                  <div key={acc.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {acc.id}
                        </span>
                        <h5 className="font-bold text-sm text-white mt-1.5">{acc.bank_name}</h5>
                        <p className="text-[11px] text-slate-400">{acc.account_type}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                        {acc.currency}
                      </span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-baseline">
                      <div>
                        <div className="text-base font-extrabold text-white">{acc.formattedBalance}</div>
                        <div className="text-[11px] text-slate-400">≈ {acc.formattedMYR}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Yield</span>
                        <span className="text-xs font-semibold text-emerald-400">{acc.interest_rate}% p.a.</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: MULTI-CURRENCY ACCOUNTS & CASH POOLS */}
        {/* ============================================================ */}
        {activeTab === 'accounts' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white">Global Bank Accounts & Treasury Pools</h3>
                <p className="text-xs text-slate-400">Institutional accounts maintained across Malaysia, Singapore, and Europe</p>
              </div>
              <button 
                onClick={() => setShowTransferModal(true)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-2"
              >
                <ArrowRightLeft className="h-4 w-4" /> Initiate Account Transfer
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Account ID</th>
                      <th className="py-3 px-4">Financial Institution</th>
                      <th className="py-3 px-4">Account Number</th>
                      <th className="py-3 px-4">Pool Purpose</th>
                      <th className="py-3 px-4 text-center">Currency</th>
                      <th className="py-3 px-4 text-right">Account Balance</th>
                      <th className="py-3 px-4 text-right">MYR Equivalent</th>
                      <th className="py-3 px-4 text-right">Yield (p.a.)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {accounts.map(acc => (
                      <tr key={acc.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-4 font-mono font-bold text-blue-400">{acc.id}</td>
                        <td className="py-3 px-4 font-semibold text-white">{acc.bank_name}</td>
                        <td className="py-3 px-4 font-mono text-slate-400">{acc.account_number}</td>
                        <td className="py-3 px-4 text-slate-300">{acc.account_type}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-200 border border-slate-700">
                            {acc.currency}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-white font-mono">{acc.formattedBalance}</td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-400 font-mono">{acc.formattedMYR}</td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-300">{acc.interest_rate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: 12-MONTH CASH FLOW FORECASTING */}
        {/* ============================================================ */}
        {activeTab === 'forecasting' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white">12-Month Rolling Cash Flow Projection</h3>
              <p className="text-xs text-slate-400">Simulating operating inflows, vendor CapEx disbursements, and minimum buffer solvency</p>
            </div>

            {/* Visual Projection Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-300">Net Liquidity Trajectory (RM Millions)</span>
                <div className="flex items-center gap-4 text-[11px]">
                  <span className="flex items-center gap-1.5"><span className="h-3 w-3 bg-blue-500 rounded"></span> Inflows</span>
                  <span className="flex items-center gap-1.5"><span className="h-3 w-3 bg-rose-500 rounded"></span> Outflows</span>
                  <span className="flex items-center gap-1.5"><span className="h-3 w-3 bg-emerald-500 rounded-full"></span> Cumulative Cash</span>
                  <span className="flex items-center gap-1.5"><span className="h-1 w-4 bg-amber-500"></span> Safety Buffer (RM 25M)</span>
                </div>
              </div>

              {/* Chart Grid */}
              <div className="h-64 flex items-end gap-2 pt-6 pb-2 border-b border-slate-800">
                {forecasts.map(fc => {
                  const maxVal = 100; // RM 100M ceiling
                  const cumHeight = Math.min(100, (fc.cumulativeLiquidity / maxVal) * 100);
                  const inHeight = (fc.inflowMYR / 30) * 100;
                  const outHeight = (fc.outflowMYR / 30) * 100;

                  return (
                    <div key={fc.month} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                      {/* Tooltip */}
                      <div className="opacity-0 group-hover:opacity-100 transition absolute -top-16 bg-slate-800 text-[10px] p-2 rounded shadow-xl border border-slate-700 whitespace-nowrap z-20 pointer-events-none">
                        <div className="font-bold text-white">{fc.month}</div>
                        <div className="text-emerald-400">In: RM {fc.inflowMYR}M | Out: RM {fc.outflowMYR}M</div>
                        <div className="text-blue-400 font-bold">Total Liquidity: RM {fc.cumulativeLiquidity}M</div>
                      </div>

                      {/* Cumulative Cash Point Line */}
                      <div 
                        style={{ bottom: `${cumHeight}%` }} 
                        className="absolute h-2 w-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50"
                      ></div>

                      {/* Bar Pair: Inflow vs Outflow */}
                      <div className="w-full flex items-end justify-center gap-1 h-4/5">
                        <div 
                          style={{ height: `${inHeight}%` }} 
                          className="w-1/2 bg-blue-600/80 hover:bg-blue-500 rounded-t transition" 
                        ></div>
                        <div 
                          style={{ height: `${outHeight}%` }} 
                          className="w-1/2 bg-rose-600/80 hover:bg-rose-500 rounded-t transition" 
                        ></div>
                      </div>

                      <span className="text-[10px] text-slate-400 mt-2 font-mono rotate-45 origin-left">
                        {fc.month.split(' ')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="text-[11px] text-slate-400 flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-400" />
                <span>Operating Buffer remains intact across all 12 projected cycles. Maximum cash reserve peaks at <b>RM 84.7M in Oct 2027</b>.</span>
              </div>
            </div>

            {/* Monthly Forecast Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4">Cycle Month</th>
                    <th className="py-2.5 px-4 text-right">Projected Inflow (RM)</th>
                    <th className="py-2.5 px-4 text-right">Projected Outflow (RM)</th>
                    <th className="py-2.5 px-4 text-right">Net Flow (RM)</th>
                    <th className="py-2.5 px-4 text-right">Cumulative Liquidity</th>
                    <th className="py-2.5 px-4 text-center">Solvency Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {forecasts.map(fc => (
                    <tr key={fc.month} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-4 font-bold text-white">{fc.month}</td>
                      <td className="py-2.5 px-4 text-right font-mono text-blue-400 font-semibold">RM {fc.inflowMYR}M</td>
                      <td className="py-2.5 px-4 text-right font-mono text-rose-400 font-semibold">RM {fc.outflowMYR}M</td>
                      <td className={`py-2.5 px-4 text-right font-mono font-bold ${fc.netCashFlow >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {fc.netCashFlow >= 0 ? '+' : ''}RM {fc.netCashFlow}M
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-white">RM {fc.cumulativeLiquidity}M</td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          SOLVENT
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 4: FX VOLATILITY & STRESS-TESTING ENGINE */}
        {/* ============================================================ */}
        {activeTab === 'stresstest' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white">Macroeconomic Volatility & FX Stress-Testing</h3>
              <p className="text-xs text-slate-400">Simulate currency depreciations and interest rate shocks on consolidated liquidity</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Sliders Controller */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-6">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-blue-400" /> Shock Parameters
                </h4>

                {/* Slider 1: USD Shock */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">USD/MYR Currency Shock</span>
                    <span className={`font-mono font-bold ${stressUSD >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {stressUSD > 0 ? `+${stressUSD}%` : `${stressUSD}%`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-15"
                    max="15"
                    step="1"
                    value={stressUSD}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      setStressUSD(v);
                      runStressTest(v, stressRate);
                    }}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>-15% (MYR Surges)</span>
                    <span>0% (Base: 4.3850)</span>
                    <span>+15% (USD Surges)</span>
                  </div>
                </div>

                {/* Slider 2: Interest Rate Shift */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">Benchmark OPR Rate Shock</span>
                    <span className={`font-mono font-bold ${stressRate >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {stressRate > 0 ? `+${stressRate} bps` : `${stressRate} bps`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="200"
                    step="25"
                    value={stressRate}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      setStressRate(v);
                      runStressTest(stressUSD, v);
                    }}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>-100 bps (-1.0%)</span>
                    <span>Baseline OPR</span>
                    <span>+200 bps (+2.0%)</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setStressUSD(0);
                      setStressRate(0);
                      runStressTest(0, 0);
                    }}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 rounded-lg transition"
                  >
                    Reset to Baseline
                  </button>
                </div>
              </div>

              {/* Stress Results Display */}
              <div className="lg:col-span-2 space-y-4">
                {stressResult && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                      <div>
                        <h4 className="font-bold text-sm text-white">Scenario Valuation Impact</h4>
                        <span className="text-xs font-mono text-blue-400">{stressResult.stressScenario}</span>
                      </div>
                      <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                        stressResult.fxValuationDeltaMYR >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}>
                        {stressResult.percentageImpact >= 0 ? `+${stressResult.percentageImpact}%` : `${stressResult.percentageImpact}%`} Net Delta
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                        <span className="text-xs text-slate-400 block">Stressed USD/MYR Rate</span>
                        <div className="text-xl font-extrabold text-white mt-1 font-mono">
                          {stressResult.stressedUsdRate}
                        </div>
                        <span className="text-[11px] text-slate-500">Baseline Rate: {stressResult.baseUsdRate}</span>
                      </div>

                      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                        <span className="text-xs text-slate-400 block">Consolidated Liquidity Post-Shock</span>
                        <div className="text-xl font-extrabold text-white mt-1 font-mono">
                          RM {(stressResult.stressedLiquidityMYR / 1e6).toFixed(2)}M
                        </div>
                        <span className="text-[11px] text-slate-500">Baseline: RM {(stressResult.baselineLiquidityMYR / 1e6).toFixed(2)}M</span>
                      </div>

                      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                        <span className="text-xs text-slate-400 block">FX Valuation Shift (Unrealized)</span>
                        <div className={`text-xl font-extrabold mt-1 font-mono ${
                          stressResult.fxValuationDeltaMYR >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {stressResult.fxValuationDeltaMYR >= 0 ? '+' : ''}RM {(stressResult.fxValuationDeltaMYR / 1e3).toFixed(1)}k
                        </div>
                        <span className="text-[11px] text-slate-500">Impact on overseas cash holdings</span>
                      </div>

                      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                        <span className="text-xs text-slate-400 block">Annual Interest Income Shift</span>
                        <div className={`text-xl font-extrabold mt-1 font-mono ${
                          stressResult.annualInterestImpactMYR >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {stressResult.annualInterestImpactMYR >= 0 ? '+' : ''}RM {(stressResult.annualInterestImpactMYR / 1e3).toFixed(1)}k
                        </div>
                        <span className="text-[11px] text-slate-500">From interest rate shock</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
                      <b>Treasury Hedging Recommendation:</b> {stressUSD > 5 ? 'Elevated USD exposure creates positive translation gain; recommend locking in forward contracts at 4.45+ to capture premium.' : 'USD decline compresses translation balances; existing FX Forward contracts (HDG-2026-01) effectively mitigate downside.'}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 5: TRANSACTIONS & DUAL-APPROVAL WORKFLOW */}
        {/* ============================================================ */}
        {activeTab === 'transfers' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-white">Treasury Transfers & Dual-Control Ledger</h3>
                <p className="text-xs text-slate-400">Dual-signoff workflow enforcing Bank Negara Malaysia RMiT segregation of duties</p>
              </div>

              <button
                onClick={() => setShowTransferModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 self-start sm:self-auto"
              >
                <ArrowRightLeft className="h-4 w-4" />
                Initiate New Transfer
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">TRX ID</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Source / Destination</th>
                    <th className="py-3 px-4 text-right">Transfer Amount</th>
                    <th className="py-3 px-4 text-right">Equivalent (MYR)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Initiated / Approved By</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {transactions.map(trx => (
                    <tr key={trx.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-mono font-bold text-blue-400">{trx.id}</td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{trx.date}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{trx.source_account_id} <span className="text-slate-500">→</span> {trx.target_account_id}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">{trx.reference_note}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-white">
                        {trx.source_currency} {trx.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                        RM {trx.equivalent_myr.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          trx.status === 'SETTLED' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                        }`}>
                          {trx.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[11px]">
                        <div className="text-slate-300">By: {trx.initiated_by.split('(')[0]}</div>
                        <div className="text-slate-500">
                          {trx.approved_by ? `Approved: ${trx.approved_by}` : 'Pending Dual Signoff'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {trx.status === 'PENDING_APPROVAL' && (
                          currentRole === 'CFO' ? (
                            <button
                              onClick={() => handleApprove(trx.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold shadow transition"
                            >
                              Approve Signoff
                            </button>
                          ) : (
                            <span className="text-[10px] text-amber-400/80 font-mono">
                              Requires CFO
                            </span>
                          )
                        )}
                        {trx.status === 'SETTLED' && (
                          <span className="text-[11px] text-slate-500 font-mono">Settled</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 6: HEDGING & DERIVATIVES */}
        {/* ============================================================ */}
        {activeTab === 'hedging' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-white">Active FX Hedging & Derivative Portfolio</h3>
              <p className="text-xs text-slate-400">Forward contracts and swaps executed to hedge operational currency commitments</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {hedges.map(h => (
                <div key={h.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-xs text-blue-400 font-bold">{h.id}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {h.status}
                    </span>
                  </div>

                  <h4 className="font-bold text-white text-sm">{h.instrument}</h4>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-800 font-mono">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Currency Pair</span>
                      <span className="font-bold text-white">{h.currency_pair}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Notional</span>
                      <span className="font-bold text-white">{h.notional_amount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Strike Rate</span>
                      <span className="font-bold text-white">{h.strike_rate}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Current Spot</span>
                      <span className="font-bold text-slate-300">{h.spot_rate}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                    <span className="text-slate-400">MTM Gain/Loss:</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      +RM {h.mtm_gain_loss.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 7: BNM RMIT AUDIT TRAIL */}
        {/* ============================================================ */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-white">Bank Negara Malaysia (RMiT) Audit Trail</h3>
              <p className="text-xs text-slate-400">Tamper-evident system activity and dual-authorization records</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden font-mono text-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4">Timestamp</th>
                      <th className="py-2.5 px-4">Action Code</th>
                      <th className="py-2.5 px-4">Authorized User</th>
                      <th className="py-2.5 px-4">IP Address</th>
                      <th className="py-2.5 px-4">Event Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {auditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-800/30">
                        <td className="py-2.5 px-4 text-slate-400 text-[11px] whitespace-nowrap">{log.timestamp}</td>
                        <td className="py-2.5 px-4 font-bold text-blue-400">{log.action}</td>
                        <td className="py-2.5 px-4 text-white font-sans font-medium">{log.user}</td>
                        <td className="py-2.5 px-4 text-slate-500 text-[11px]">{log.ip_address}</td>
                        <td className="py-2.5 px-4 text-slate-300 font-sans">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ============================================================ */}
      {/* MODAL: INITIATE NEW TRANSFER */}
      {/* ============================================================ */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5 text-blue-400" />
                Initiate Treasury Transfer / FX Conversion
              </h3>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-white">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 uppercase tracking-wider font-bold text-[10px] mb-1">Source Account</label>
                <select
                  value={transferForm.source_account_id}
                  onChange={(e) => setTransferForm({ ...transferForm, source_account_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.id} - {a.bank_name} ({a.currency} {a.balance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 uppercase tracking-wider font-bold text-[10px] mb-1">Target Account</label>
                <select
                  value={transferForm.target_account_id}
                  onChange={(e) => setTransferForm({ ...transferForm, target_account_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.id} - {a.bank_name} ({a.currency})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 uppercase tracking-wider font-bold text-[10px] mb-1">Transfer Amount</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 500000"
                    value={transferForm.amount}
                    onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 uppercase tracking-wider font-bold text-[10px] mb-1">Transfer Type</label>
                  <select
                    value={transferForm.type}
                    onChange={(e) => setTransferForm({ ...transferForm, type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                  >
                    <option value="INTERCOMPANY_SWEEP">Intercompany Sweep</option>
                    <option value="FX_CONVERSION">FX Conversion</option>
                    <option value="SUPPLIER_DISBURSEMENT">Supplier Disbursement</option>
                    <option value="TREASURY_INVESTMENT">Treasury Investment</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 uppercase tracking-wider font-bold text-[10px] mb-1">Purpose / Reference Note</label>
                <input
                  type="text"
                  placeholder="e.g. Regional Working Capital replenishment"
                  value={transferForm.reference_note}
                  onChange={(e) => setTransferForm({ ...transferForm, reference_note: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-300 text-[11px] flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Notice: Transactions exceeding RM 100k require CFO dual-signoff before settlement.</span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg shadow-blue-600/30 transition"
                >
                  Queue for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
        AlphaPulse Enterprise Treasury Portal • Built with React 18, TypeScript, Tailwind CSS & Node.js REST API • Engineered by Muhammad Irfan Firdaus
      </footer>

    </div>
  );
}
