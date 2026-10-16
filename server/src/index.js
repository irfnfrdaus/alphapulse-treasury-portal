import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, initDatabase } from './db.js';

// Initialize Database
initDatabase();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLIENT_DIST = path.join(__dirname, '..', '..', 'client', 'dist');

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());
app.use(express.static(CLIENT_DIST));

// 1. Health Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'AlphaPulse Enterprise Treasury & Liquidity API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Helper function to get latest FX rates lookup map
function getRatesMap() {
  const rates = db.prepare('SELECT * FROM fx_rates').all();
  const map = { MYR: 1.0 };
  for (const r of rates) {
    const [base, quote] = r.pair.split('/');
    if (quote === 'MYR') {
      map[base] = r.rate;
    }
  }
  return map;
}

// 2. Executive Overview & Liquidity Metrics
app.get('/api/overview', (req, res) => {
  const ratesMap = getRatesMap();
  const accounts = db.prepare('SELECT * FROM accounts').all();
  
  let totalLiquidityMYR = 0;
  const currencyBreakdown = {};

  for (const acc of accounts) {
    const rateToMYR = ratesMap[acc.currency] || 1.0;
    const myrValue = acc.balance * rateToMYR;
    totalLiquidityMYR += myrValue;

    if (!currencyBreakdown[acc.currency]) {
      currencyBreakdown[acc.currency] = { original: 0, myrEquivalent: 0 };
    }
    currencyBreakdown[acc.currency].original += acc.balance;
    currencyBreakdown[acc.currency].myrEquivalent += myrValue;
  }

  // Calculate allocation percentages
  const allocation = Object.keys(currencyBreakdown).map(curr => ({
    currency: curr,
    amount: currencyBreakdown[curr].original,
    myrValue: currencyBreakdown[curr].myrEquivalent,
    percentage: parseFloat(((currencyBreakdown[curr].myrEquivalent / totalLiquidityMYR) * 100).toFixed(1))
  }));

  // Hedging stats
  const hedges = db.prepare("SELECT * FROM hedging_contracts WHERE status = 'ACTIVE'").all();
  const totalHedgedNotionalMYR = hedges.reduce((sum, h) => {
    const [base] = h.currency_pair.split('/');
    return sum + (h.notional_amount * (ratesMap[base] || 1.0));
  }, 0);
  const totalMtmGainLoss = hedges.reduce((sum, h) => sum + h.mtm_gain_loss, 0);

  // Pending Approvals count
  const pendingCount = db.prepare("SELECT COUNT(*) as count FROM transactions WHERE status = 'PENDING_APPROVAL'").get().count;

  // Working Capital & Treasury KPIs
  const currentLiabilitiesMYR = 14200000.00;
  const cashRatio = parseFloat((totalLiquidityMYR / currentLiabilitiesMYR).toFixed(2));
  const quickRatio = parseFloat(((totalLiquidityMYR + 6800000.00) / currentLiabilitiesMYR).toFixed(2));
  const weightedYield = 3.82; // 3.82% weighted portfolio interest yield

  res.json({
    totalLiquidityMYR,
    totalLiquidityFormatted: `RM ${(totalLiquidityMYR / 1e6).toFixed(2)}M`,
    currentLiabilitiesMYR,
    cashRatio,
    quickRatio,
    weightedYield,
    totalHedgedNotionalMYR,
    totalMtmGainLoss,
    pendingApprovalsCount: pendingCount,
    currencyAllocation: allocation,
    activeHedgesCount: hedges.length,
    activeAccountsCount: accounts.length
  });
});

// 3. Multi-Currency Accounts List
app.get('/api/accounts', (req, res) => {
  const ratesMap = getRatesMap();
  const accounts = db.prepare('SELECT * FROM accounts ORDER BY balance DESC').all();

  const enriched = accounts.map(acc => {
    const fxRate = ratesMap[acc.currency] || 1.0;
    const myrVal = acc.balance * fxRate;
    return {
      ...acc,
      fxRateToMYR: fxRate,
      myrEquivalent: myrVal,
      formattedBalance: `${acc.currency} ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      formattedMYR: `RM ${myrVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    };
  });

  res.json(enriched);
});

// 4. Live FX Rates & Volatility
app.get('/api/fx-rates', (req, res) => {
  const rates = db.prepare('SELECT * FROM fx_rates ORDER BY pair ASC').all();
  res.json(rates);
});

// 5. Hedging Contracts
app.get('/api/hedges', (req, res) => {
  const hedges = db.prepare('SELECT * FROM hedging_contracts ORDER BY maturity_date ASC').all();
  res.json(hedges);
});

// 6. Transactions List
app.get('/api/transactions', (req, res) => {
  const { status } = req.query;
  let query = 'SELECT * FROM transactions';
  const params = [];

  if (status && status !== 'ALL') {
    query += ' WHERE status = ?';
    params.push(status);
  }

  query += ' ORDER BY date DESC LIMIT 50';
  const transactions = db.prepare(query).all(...params);
  res.json(transactions);
});

// 7. Initiate New Treasury Transfer / FX Conversion
app.post('/api/transactions', (req, res) => {
  const { source_account_id, target_account_id, amount, type, reference_note } = req.body;

  if (!source_account_id || !target_account_id || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Source, destination, and positive amount are required.' });
  }

  const srcAcc = db.prepare('SELECT * FROM accounts WHERE id = ?').get(source_account_id);
  const tgtAcc = db.prepare('SELECT * FROM accounts WHERE id = ?').get(target_account_id);

  if (!srcAcc || !tgtAcc) {
    return res.status(404).json({ error: 'Source or target account not found.' });
  }

  if (srcAcc.balance < amount) {
    return res.status(400).json({ error: `Insufficient balance in ${srcAcc.bank_name} (${srcAcc.currency} ${srcAcc.balance.toLocaleString()}).` });
  }

  const ratesMap = getRatesMap();
  const srcRateToMYR = ratesMap[srcAcc.currency] || 1.0;
  const tgtRateToMYR = ratesMap[tgtAcc.currency] || 1.0;
  
  // Cross-rate calculation
  const exchangeRate = srcRateToMYR / tgtRateToMYR;
  const equivalentMYR = amount * srcRateToMYR;

  const nextId = `TRX-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  const insertTrx = db.prepare(`
    INSERT INTO transactions (id, date, source_account_id, target_account_id, source_currency, target_currency, amount, exchange_rate, equivalent_myr, type, status, initiated_by, approved_by, reference_note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertTrx.run(
    nextId,
    now,
    srcAcc.id,
    tgtAcc.id,
    srcAcc.currency,
    tgtAcc.currency,
    parseFloat(amount),
    parseFloat(exchangeRate.toFixed(4)),
    parseFloat(equivalentMYR.toFixed(2)),
    type || 'INTERCOMPANY_SWEEP',
    'PENDING_APPROVAL',
    'Irfan Firdaus (Senior Treasury Analyst)',
    null,
    reference_note || 'Standard liquidity rebalancing'
  );

  // Add audit log
  db.prepare(`
    INSERT INTO audit_logs (timestamp, action, user, ip_address, details)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    now,
    'TRANSFER_INITIATED',
    'Irfan Firdaus',
    '10.24.18.91',
    `Initiated ${srcAcc.currency} ${amount.toLocaleString()} transfer (${nextId}) from ${srcAcc.id} to ${tgtAcc.id}. Awaiting CFO dual-signoff.`
  );

  res.status(201).json({
    success: true,
    transaction_id: nextId,
    status: 'PENDING_APPROVAL',
    message: `Transfer ${nextId} submitted for dual-control approval.`
  });
});

// 8. CFO Dual-Control Approval
app.post('/api/transactions/:id/approve', (req, res) => {
  const { id } = req.params;
  const trx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);

  if (!trx) {
    return res.status(404).json({ error: 'Transaction not found.' });
  }

  if (trx.status !== 'PENDING_APPROVAL') {
    return res.status(400).json({ error: `Transaction is already in status: ${trx.status}` });
  }

  const srcAcc = db.prepare('SELECT * FROM accounts WHERE id = ?').get(trx.source_account_id);
  const tgtAcc = db.prepare('SELECT * FROM accounts WHERE id = ?').get(trx.target_account_id);

  if (srcAcc.balance < trx.amount) {
    return res.status(400).json({ error: 'Source account has insufficient balance at execution.' });
  }

  const targetCredit = trx.amount * trx.exchange_rate;

  // Execute ACID Transaction
  db.exec('BEGIN TRANSACTION;');
  try {
    // 1. Deduct source
    db.prepare('UPDATE accounts SET balance = balance - ? WHERE id = ?').run(trx.amount, srcAcc.id);
    // 2. Credit target
    db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ?').run(targetCredit, tgtAcc.id);
    // 3. Mark settled
    db.prepare("UPDATE transactions SET status = 'SETTLED', approved_by = 'Zainal Abidin (Group CFO)' WHERE id = ?").run(id);

    // 4. Log audit
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    db.prepare(`
      INSERT INTO audit_logs (timestamp, action, user, ip_address, details)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      now,
      'DUAL_CONTROL_APPROVAL',
      'Zainal Abidin (Group CFO)',
      '10.24.18.5',
      `Dual-control signoff granted for ${id}. Debited ${srcAcc.id} (${srcAcc.currency} ${trx.amount.toLocaleString()}), Credited ${tgtAcc.id} (${tgtAcc.currency} ${targetCredit.toLocaleString()}).`
    );

    db.exec('COMMIT;');
    res.json({
      success: true,
      message: `Transaction ${id} settled successfully after dual-control signoff.`,
      source_balance: srcAcc.balance - trx.amount,
      target_balance: tgtAcc.balance + targetCredit
    });
  } catch (err) {
    db.exec('ROLLBACK;');
    res.status(500).json({ error: 'Transaction execution failed: ' + err.message });
  }
});

// 9. 12-Month Rolling Cash Flow Forecast
app.get('/api/forecasting', (req, res) => {
  const months = ['Nov 2026', 'Dec 2026', 'Jan 2027', 'Feb 2027', 'Mar 2027', 'Apr 2027', 'May 2027', 'Jun 2027', 'Jul 2027', 'Aug 2027', 'Sep 2027', 'Oct 2027'];
  
  let runningCash = 58.4; // Starting at RM 58.4M Net Liquidity
  const data = months.map((month, idx) => {
    const baseInflow = 14.5 + Math.sin(idx) * 2.2 + (idx * 0.3);
    const baseOutflow = 12.8 + Math.cos(idx) * 1.5 + (idx * 0.2);
    const netFlow = baseInflow - baseOutflow;
    runningCash += netFlow;

    return {
      month,
      inflowMYR: parseFloat(baseInflow.toFixed(2)),
      outflowMYR: parseFloat(baseOutflow.toFixed(2)),
      netCashFlow: parseFloat(netFlow.toFixed(2)),
      cumulativeLiquidity: parseFloat(runningCash.toFixed(2)),
      operatingBufferThreshold: 25.0 // Safe buffer threshold RM 25M
    };
  });

  res.json(data);
});

// 10. FX Volatility & Macroeconomic Stress-Testing Engine
app.post('/api/stress-test', (req, res) => {
  const { usdShockPct = 0, interestRateShockBps = 0 } = req.body;
  const ratesMap = getRatesMap();
  const accounts = db.prepare('SELECT * FROM accounts').all();

  const baseUSD = ratesMap['USD'] || 4.3850;
  const stressedUSD = baseUSD * (1 + (usdShockPct / 100));

  let baselineMYR = 0;
  let stressedMYR = 0;

  for (const acc of accounts) {
    const baseRate = ratesMap[acc.currency] || 1.0;
    baselineMYR += acc.balance * baseRate;

    let stressedRate = baseRate;
    if (acc.currency === 'USD') {
      stressedRate = stressedUSD;
    }
    stressedMYR += acc.balance * stressedRate;
  }

  const fxDeltaMYR = stressedMYR - baselineMYR;
  const annualInterestImpactMYR = (stressedMYR * (interestRateShockBps / 10000));

  res.json({
    baseUsdRate: baseUSD,
    stressedUsdRate: parseFloat(stressedUSD.toFixed(4)),
    baselineLiquidityMYR: baselineMYR,
    stressedLiquidityMYR: stressedMYR,
    fxValuationDeltaMYR: parseFloat(fxDeltaMYR.toFixed(2)),
    annualInterestImpactMYR: parseFloat(annualInterestImpactMYR.toFixed(2)),
    percentageImpact: parseFloat(((fxDeltaMYR / baselineMYR) * 100).toFixed(2)),
    stressScenario: `${usdShockPct > 0 ? '+' : ''}${usdShockPct}% USD Shift, ${interestRateShockBps > 0 ? '+' : ''}${interestRateShockBps} bps Rate Shift`
  });
});

// 11. Regulatory & BNM RMiT Audit Trail
app.get('/api/audit-trail', (req, res) => {
  const logs = db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100').all();
  res.json(logs);
});

// SPA Client Fallback
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(CLIENT_DIST, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`   ALPHAPULSE ENTERPRISE TREASURY REST API`);
  console.log(`   Listening on: http://127.0.0.1:${PORT}`);
  console.log(`   Health Check: http://127.0.0.1:${PORT}/api/health`);
  console.log(`=======================================================`);
});
