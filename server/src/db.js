import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '..', 'treasury.db');

export const db = new DatabaseSync(DB_PATH);

export function initDatabase() {
  // 1. Create Tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      bank_name TEXT NOT NULL,
      account_number TEXT NOT NULL,
      currency TEXT NOT NULL,
      balance REAL NOT NULL,
      account_type TEXT NOT NULL,
      interest_rate REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS fx_rates (
      pair TEXT PRIMARY KEY,
      rate REAL NOT NULL,
      change_24h REAL NOT NULL,
      volatility_30d REAL NOT NULL,
      last_updated TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      source_account_id TEXT NOT NULL,
      target_account_id TEXT,
      source_currency TEXT NOT NULL,
      target_currency TEXT,
      amount REAL NOT NULL,
      exchange_rate REAL NOT NULL,
      equivalent_myr REAL NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      initiated_by TEXT NOT NULL,
      approved_by TEXT,
      reference_note TEXT
    );

    CREATE TABLE IF NOT EXISTS hedging_contracts (
      id TEXT PRIMARY KEY,
      instrument TEXT NOT NULL,
      currency_pair TEXT NOT NULL,
      notional_amount REAL NOT NULL,
      strike_rate REAL NOT NULL,
      spot_rate REAL NOT NULL,
      maturity_date TEXT NOT NULL,
      mtm_gain_loss REAL NOT NULL,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      action TEXT NOT NULL,
      user TEXT NOT NULL,
      ip_address TEXT NOT NULL,
      details TEXT NOT NULL
    );
  `);

  // Check if data already seeded
  const checkAccounts = db.prepare('SELECT COUNT(*) as count FROM accounts').get();
  if (checkAccounts.count > 0) {
    return;
  }

  console.log('[DB] Seeding enterprise multi-currency treasury accounts & market data...');

  // 2. Seed FX Rates (Market Baseline: Oct 2026)
  const seedRates = [
    { pair: 'USD/MYR', rate: 4.3850, change: 0.12, vol: 4.8 },
    { pair: 'SGD/MYR', rate: 3.3420, change: -0.05, vol: 3.2 },
    { pair: 'EUR/MYR', rate: 4.7610, change: 0.28, vol: 5.1 },
    { pair: 'GBP/MYR', rate: 5.7120, change: -0.18, vol: 6.4 },
    { pair: 'CNY/MYR', rate: 0.6180, change: 0.04, vol: 2.9 }
  ];

  const insertRate = db.prepare(`
    INSERT INTO fx_rates (pair, rate, change_24h, volatility_30d, last_updated)
    VALUES (?, ?, ?, ?, datetime('now'))
  `);
  for (const r of seedRates) {
    insertRate.run(r.pair, r.rate, r.change, r.vol);
  }

  // 3. Seed Enterprise Multi-Currency Bank Accounts
  const seedAccounts = [
    { id: 'ACC-MYR-01', bank: 'Maybank Islamic Berhad', acc_no: '5140-1299-8801', curr: 'MYR', bal: 18450000.00, type: 'Operating Liquidity Pool', rate: 3.40 },
    { id: 'ACC-MYR-02', bank: 'CIMB Bank Berhad', acc_no: '8008-3411-9022', curr: 'MYR', bal: 9200000.00, type: 'Strategic Treasury Reserve', rate: 3.65 },
    { id: 'ACC-USD-01', bank: 'J.P. Morgan Chase (SG)', acc_no: '002-88192-USD', curr: 'USD', bal: 4250000.00, type: 'Global FX Liquidity', rate: 4.90 },
    { id: 'ACC-USD-02', bank: 'Citibank N.A. (Labuan)', acc_no: '110-44920-USD', curr: 'USD', bal: 1850000.00, type: 'Trade Settlement Account', rate: 4.75 },
    { id: 'ACC-SGD-01', bank: 'DBS Bank (Singapore)', acc_no: '601-22910-SGD', curr: 'SGD', bal: 2600000.00, type: 'Regional Working Capital', rate: 3.85 },
    { id: 'ACC-EUR-01', bank: 'BNP Paribas (Europe)', acc_no: 'FR76-3000-EUR', curr: 'EUR', bal: 1100000.00, type: 'Procurement & CapEx Pool', rate: 3.10 }
  ];

  const insertAccount = db.prepare(`
    INSERT INTO accounts (id, bank_name, account_number, currency, balance, account_type, interest_rate)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  for (const a of seedAccounts) {
    insertAccount.run(a.id, a.bank, a.acc_no, a.curr, a.bal, a.type, a.rate);
  }

  // 4. Seed Active Hedging Contracts
  const seedHedges = [
    { id: 'HDG-2026-01', inst: 'FX Forward Contract', pair: 'USD/MYR', notional: 2000000.00, strike: 4.3600, spot: 4.3850, maturity: '2026-11-30', mtm: 50000.00, status: 'ACTIVE' },
    { id: 'HDG-2026-02', inst: 'Cross-Currency Swap', pair: 'SGD/MYR', notional: 1500000.00, strike: 3.3250, spot: 3.3420, maturity: '2026-12-15', mtm: 25500.00, status: 'ACTIVE' },
    { id: 'HDG-2026-03', inst: 'Zero-Cost Collar', pair: 'EUR/MYR', notional: 800000.00, strike: 4.7200, spot: 4.7610, maturity: '2027-01-20', mtm: 32800.00, status: 'ACTIVE' }
  ];

  const insertHedge = db.prepare(`
    INSERT INTO hedging_contracts (id, instrument, currency_pair, notional_amount, strike_rate, spot_rate, maturity_date, mtm_gain_loss, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const h of seedHedges) {
    insertHedge.run(h.id, h.inst, h.pair, h.notional, h.strike, h.spot, h.maturity, h.mtm, h.status);
  }

  // 5. Seed Real-world Enterprise Treasury Transactions
  const seedTransactions = [
    {
      id: 'TRX-9481',
      date: '2026-10-15 09:30:00',
      src: 'ACC-MYR-01',
      tgt: 'ACC-USD-01',
      src_curr: 'MYR',
      tgt_curr: 'USD',
      amt: 2192500.00,
      fx: 4.3850,
      eq_myr: 2192500.00,
      type: 'FX_CONVERSION',
      status: 'SETTLED',
      init_by: 'Irfan Firdaus (Senior Treasury Analyst)',
      appr_by: 'Zainal Abidin (Group CFO)',
      ref: 'Q4 US Supplier CapEx pre-funding'
    },
    {
      id: 'TRX-9482',
      date: '2026-10-15 14:15:22',
      src: 'ACC-USD-02',
      tgt: 'ACC-SGD-01',
      src_curr: 'USD',
      tgt_curr: 'SGD',
      amt: 500000.00,
      fx: 1.3120,
      eq_myr: 2192500.00,
      type: 'INTERCOMPANY_SWEEP',
      status: 'SETTLED',
      init_by: 'Irfan Firdaus (Senior Treasury Analyst)',
      appr_by: 'Zainal Abidin (Group CFO)',
      ref: 'Singapore regional hub liquidity replenishment'
    },
    {
      id: 'TRX-9483',
      date: '2026-10-16 08:45:10',
      src: 'ACC-MYR-02',
      tgt: 'ACC-MYR-01',
      src_curr: 'MYR',
      tgt_curr: 'MYR',
      amt: 1500000.00,
      fx: 1.0000,
      eq_myr: 1500000.00,
      type: 'INTERCOMPANY_SWEEP',
      status: 'PENDING_APPROVAL',
      init_by: 'Irfan Firdaus (Senior Treasury Analyst)',
      appr_by: null,
      ref: 'Mid-month vendor disbursement liquidity rebalance'
    },
    {
      id: 'TRX-9484',
      date: '2026-10-16 11:20:44',
      src: 'ACC-EUR-01',
      tgt: 'ACC-MYR-01',
      src_curr: 'EUR',
      tgt_curr: 'MYR',
      amt: 350000.00,
      fx: 4.7610,
      eq_myr: 1666350.00,
      type: 'FX_CONVERSION',
      status: 'PENDING_APPROVAL',
      init_by: 'Irfan Firdaus (Senior Treasury Analyst)',
      appr_by: null,
      ref: 'Repatriation of European operating surplus'
    }
  ];

  const insertTrx = db.prepare(`
    INSERT INTO transactions (id, date, source_account_id, target_account_id, source_currency, target_currency, amount, exchange_rate, equivalent_myr, type, status, initiated_by, approved_by, reference_note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const t of seedTransactions) {
    insertTrx.run(t.id, t.date, t.src, t.tgt, t.src_curr, t.tgt_curr, t.amt, t.fx, t.eq_myr, t.type, t.status, t.init_by, t.appr_by, t.ref);
  }

  // 6. Seed Audit Logs (Compliance with Bank Negara Malaysia RMiT & Corporate Treasury Mandate)
  const seedAudit = [
    { ts: '2026-10-15 09:30:12', act: 'TRANSFER_EXECUTED', user: 'Irfan Firdaus', ip: '10.24.18.91', det: 'Initiated FX conversion TRX-9481 MYR to USD 500k.' },
    { ts: '2026-10-15 09:42:05', act: 'DUAL_CONTROL_APPROVAL', user: 'Zainal Abidin (CFO)', ip: '10.24.18.5', det: 'Approved dual-signoff for TRX-9481.' },
    { ts: '2026-10-15 14:15:30', act: 'INTERCOMPANY_SWEEP', user: 'Irfan Firdaus', ip: '10.24.18.91', det: 'Initiated intercompany sweep TRX-9482 from Citibank to DBS.' },
    { ts: '2026-10-16 08:45:15', act: 'TRANSFER_PENDING', user: 'Irfan Firdaus', ip: '10.24.18.91', det: 'Queued domestic sweep TRX-9483 for CFO authorization.' }
  ];

  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (timestamp, action, user, ip_address, details)
    VALUES (?, ?, ?, ?, ?)
  `);
  for (const a of seedAudit) {
    insertAudit.run(a.ts, a.act, a.user, a.ip, a.det);
  }

  console.log('[DB] Enterprise Treasury Database initialized successfully.');
}
