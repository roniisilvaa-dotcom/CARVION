/* GRUPO CA.RO — main app */

const { useState, useEffect, useMemo, useRef } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "verde",
  "density": "confortavel",
  "showSecondaryKpis": true,
  "theme": "dark"
}/*EDITMODE-END*/;

const ACCENT_MAP = {
  verde: 'oklch(0.74 0.17 155)',
  azul: 'oklch(0.72 0.13 230)',
  roxo: 'oklch(0.70 0.15 295)',
  ambar: 'oklch(0.78 0.16 75)',
};

const APP_VERSION = '2026-05-02-neon-sync-v29';
const DEMO_MODE_KEY = 'carvion_demo_mode';
const LAST_VERSION_KEY = 'carvion_last_seen_version';
const SETTINGS_KEY = 'carvion_admin_settings';
const NFE_STORAGE_KEY = 'carvion_issued_notes';
const CLIENTS_STORAGE_KEY = 'carvion_clients';
const SUPPLIERS_STORAGE_KEY = 'carvion_suppliers';
const PRODUCTS_STORAGE_KEY = 'carvion_products';
const FIXED_EXPENSES_STORAGE_KEY = 'carvion_fixed_expenses';
const TRANSACTIONS_STORAGE_KEY = 'carvion_transactions';
const ORDERS_STORAGE_KEY = 'carvion_orders';
const DATA_BACKUP_KEY = 'carvion_data_backup';
const SYNC_STATUS_KEY = 'carvion_sync_status';
const API_URL_CACHE_KEY = 'carvion_api_url';
const DEFAULT_CLIENTS = [];
const DEFAULT_SUPPLIERS = [];
const readDataBackup = () => {
  try {
    return JSON.parse(localStorage.getItem(DATA_BACKUP_KEY) || '{}');
  } catch (err) {
    return {};
  }
};
const apiBaseCandidates = () => {
  const { origin, hostname } = window.location;
  const candidates = [
    window.CARVION_API_URL,
    localStorage.getItem(API_URL_CACHE_KEY),
  ];
  if (hostname === 'localhost' || hostname === '127.0.0.1') candidates.push('http://localhost:4000');
  if (origin && origin !== 'null') candidates.push(origin);
  if (hostname.includes('carvion-app')) candidates.push(origin.replace('carvion-app', 'carvion-api'));
  if (hostname.endsWith('onrender.com')) candidates.push('https://carvion-api.onrender.com');
  candidates.push('https://carvion-api.onrender.com');
  return [...new Set(candidates.filter(Boolean).map((url) => url.replace(/\/$/, '')))];
};
const fetchSyncEndpoint = async (path, options = {}) => {
  let lastError;
  for (const base of apiBaseCandidates()) {
    try {
      const res = await fetch(`${base}${path}`, options);
      if (res.ok) {
        const type = res.headers.get('content-type') || '';
        if (!type.includes('application/json')) {
          lastError = new Error('sync-invalid-json-endpoint');
          continue;
        }
        localStorage.setItem(API_URL_CACHE_KEY, base);
        return res;
      }
      lastError = new Error(`sync-http-${res.status}`);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('sync-api-unavailable');
};
const itemSyncKey = (item, index) => {
  if (!item || typeof item !== 'object') return `item-${index}`;
  return item.id
    || item.email
    || item.cnpj
    || item.document
    || item.phone
    || item.name
    || item.title
    || item.description
    || item.numero
    || item.number
    || item.createdAt
    || JSON.stringify(item);
};
const mergeById = (remote = [], local = []) => {
  const map = new Map();
  [...remote, ...local].forEach((item, index) => {
    if (item) {
      const key = itemSyncKey(item, index);
      map.set(key, { ...(map.get(key) || {}), ...item });
    }
  });
  return [...map.values()];
};
const hasBusinessData = (payload = {}) => (
  (payload.clients || []).length
  || (payload.suppliers || []).length
  || (payload.products || []).length
  || (payload.fixedExpenses || []).length
  || (payload.transactions || []).length
  || (payload.notes || []).length
  || (payload.orders || []).length
);
const CURRENT_USER = {
  name: 'CARVION Admin',
  email: 'caro@carvion.com',
  role: 'Admin total',
  title: 'Socio-administradora',
  phone: '',
};
const DEFAULT_SETTINGS = {
  profile: CURRENT_USER,
  company: {
    legalName: 'CARVION INDUSTRIA',
    tradeName: 'CARVION',
    cnpj: '',
    stateRegistration: '',
    address: '',
    city: '',
    state: '',
    phone: '',
    email: '',
    logo: '',
  },
  permissions: {
    financeiro: true,
    fiscal: true,
    configuracoes: true,
    equipe: true,
    relatorios: true,
    demo: true,
  },
  notifications: {
    cashflow: true,
    invoices: true,
    updates: true,
  },
};
const zeroSpark = () => Array.from({ length: 12 }, () => 0);
const ZERO_DATA = {
  kpis: KPIS.map((k) => ({ ...k, value: 0, delta: 0, spark: zeroSpark() })),
  secondaryKpis: SECONDARY_KPIS.map((k) => ({ ...k, value: k.id === 'default' ? '0,0%' : 'R$ 0,00', delta: 0, sub: 'Aguardando seus dados' })),
  revExp: REV_EXP.map((d) => ({ ...d, rev: 0, exp: 0 })),
  expenseCats: [],
  revByPlan: REV_BY_PLAN.map((d) => ({ ...d, enterprise: 0, business: 0, starter: 0 })),
  heatmap: Array.from({ length: 7 }, () => Array.from({ length: 14 }, () => 0)),
  transactions: [],
  accounts: [],
};
const DEMO_DATA = {
  kpis: KPIS,
  secondaryKpis: SECONDARY_KPIS,
  revExp: REV_EXP,
  expenseCats: EXPENSE_CATS,
  revByPlan: REV_BY_PLAN,
  heatmap: HEATMAP,
  transactions: TRANSACTIONS,
  accounts: ACCOUNTS,
};

const computeRealData = (transactions) => {
  const now = new Date();

  const parsePtBR = (str) => {
    if (!str) return null;
    const p = str.split('/');
    if (p.length === 3) return new Date(Number(p[2]), Number(p[1]) - 1, Number(p[0]));
    return null;
  };

  const effectivePaid = (tx) => {
    if (tx.status === 'paid') return tx.amount || 0;
    if (tx.status === 'partial') return tx.amountPaid || 0;
    return 0;
  };
  const outstanding = (tx) => {
    if (tx.status === 'partial') return tx.amountRemaining || 0;
    if (tx.status === 'pending' || tx.status === 'overdue') return tx.amount || 0;
    return 0;
  };

  const paidIn  = transactions.filter((t) => t.type === 'in'  && (t.status === 'paid' || t.status === 'partial'));
  const paidOut = transactions.filter((t) => t.type === 'out' && (t.status === 'paid' || t.status === 'partial'));
  const pendIn  = transactions.filter((t) => t.type === 'in'  && (t.status === 'pending' || t.status === 'partial' || t.status === 'overdue'));
  const pendOut = transactions.filter((t) => t.type === 'out' && (t.status === 'pending' || t.status === 'partial' || t.status === 'overdue'));

  const totalRev  = paidIn.reduce((s, t) => s + effectivePaid(t), 0);
  const totalExp  = paidOut.reduce((s, t) => s + effectivePaid(t), 0);
  const profit    = totalRev - totalExp;
  const margin    = totalRev > 0 ? (profit / totalRev) * 100 : 0;
  const totPendIn  = pendIn.reduce((s, t) => s + outstanding(t), 0);
  const totPendOut = pendOut.reduce((s, t) => s + outstanding(t), 0);

  // Last 12 months buckets
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    const key = `${d.getMonth() + 1}/${d.getFullYear()}`;
    const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
      .replace('. de ', '/').replace(' de ', '/').replace(/\.$/, '');
    return { key, label, rev: 0, exp: 0 };
  });
  transactions.forEach((tx) => {
    const d = parsePtBR(tx.date);
    if (!d) return;
    const key = `${d.getMonth() + 1}/${d.getFullYear()}`;
    const m = months.find((mo) => mo.key === key);
    if (!m) return;
    const amt = effectivePaid(tx);
    if (tx.type === 'in') m.rev += amt; else m.exp += amt;
  });

  const revExp    = months.map(({ label: m, rev, exp }) => ({ m, rev, exp }));
  const revSpark  = months.map((m) => m.rev);
  const expSpark  = months.map((m) => m.exp);
  const profSpark = months.map((m) => m.rev - m.exp);

  const pct = (a, b) => b > 0 ? parseFloat(((a - b) / b * 100).toFixed(1)) : 0;
  const cur = months[11]; const prev = months[10];
  const revDelta  = pct(cur.rev, prev.rev);
  const expDelta  = pct(cur.exp, prev.exp);
  const profDelta = pct(cur.rev - cur.exp, prev.rev - prev.exp);

  // Expense categories from real transactions
  const catMap = {};
  paidOut.forEach((tx) => { const c = tx.plan || 'Outros'; catMap[c] = (catMap[c] || 0) + effectivePaid(tx); });
  const catColors = ['var(--accent)', 'var(--info)', 'var(--purple)', 'var(--warn)', 'oklch(0.65 0.14 340)', 'oklch(0.55 0.02 240)'];
  const expenseCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]).map(([name, value], i) => ({ name, value, color: catColors[i % catColors.length] }));

  const fullyPaidIn  = paidIn.filter((t) => t.status === 'paid');
  const avgTicket    = fullyPaidIn.length > 0 ? fullyPaidIn.reduce((s, t) => s + t.amount, 0) / fullyPaidIn.length : 0;
  const uniqueClients = new Set(transactions.map((t) => t.client).filter(Boolean)).size;
  const overdueAmt   = transactions.filter((t) => t.status === 'overdue').reduce((s, t) => s + (t.amount || 0), 0);
  const defaultRate  = totalRev > 0 ? (overdueAmt / totalRev * 100) : 0;

  return {
    kpis: [
      { ...KPIS[0], value: totalRev,  delta: revDelta,  spark: revSpark  },
      { ...KPIS[1], value: totalExp,  delta: expDelta,  spark: expSpark  },
      { ...KPIS[2], value: profit,    delta: profDelta, spark: profSpark },
      { ...KPIS[3], value: margin,    delta: 0,         spark: zeroSpark() },
    ],
    secondaryKpis: [
      { ...SECONDARY_KPIS[0], value: fmtBRL(avgTicket),   delta: 0, sub: `${fullyPaidIn.length} recebimentos confirmados` },
      { ...SECONDARY_KPIS[1], value: fmtBRL(totPendOut),  delta: 0, sub: `${pendOut.length} títulos a pagar` },
      { ...SECONDARY_KPIS[2], value: fmtBRL(totPendIn),   delta: 0, sub: `${pendIn.length} faturas a receber` },
      { ...SECONDARY_KPIS[3], value: fmtBRL(profit),      delta: 0, sub: 'receitas pagas − despesas pagas' },
      { ...SECONDARY_KPIS[4], value: String(uniqueClients), delta: 0, sub: `em ${transactions.length} lançamentos` },
      { ...SECONDARY_KPIS[5], value: defaultRate.toFixed(1).replace('.', ',') + '%', delta: 0, sub: fmtBRL(overdueAmt) + ' em atraso', good: true },
    ],
    revExp,
    expenseCats,
    revByPlan: ZERO_DATA.revByPlan,
    heatmap: ZERO_DATA.heatmap,
    transactions,
    accounts: [],
  };
};

/* ===== DASHBOARD PAGE ===== */
const DashboardPage = ({ onAdd, period, showSecondary = true, data = ZERO_DATA, demoMode = false }) => {
  return (
    <>
      {!demoMode && data.transactions.length === 0 && (
        <div className="empty-system-banner">
          <Icon name="check" size={16} />
          <span><strong>Nenhum lançamento ainda.</strong> Cadastre receitas, despesas, contas a receber e pagar — os KPIs aparecem aqui automaticamente.</span>
        </div>
      )}
      <div className="kpi-grid">
        {data.kpis.map((k) => (
          <div key={k.id} className="kpi">
            <div className="kpi-glow" style={{ background: k.color }} />
            <div className="kpi-head">
              <Icon name={k.icon} size={14} />
              <span>{k.label}</span>
            </div>
            <div className="kpi-value">
              {k.isPct ? (
                <>{k.value.toFixed(1).replace('.', ',')}<span className="currency">%</span></>
              ) : (
                <><span className="currency">R$</span>{(k.value / 1000).toFixed(1).replace('.', ',')}<span className="currency">k</span></>
              )}
            </div>
            <div className="kpi-spark">
              <Sparkline data={k.spark} color={k.color} height={28} />
            </div>
            <div className="kpi-foot">
              <span className={'kpi-delta ' + (k.delta > 0 !== k.inverted ? 'up' : 'down')}>
                <Icon name={k.delta > 0 ? 'arrow-up' : 'arrow-down'} size={11} />
                {fmtPct(k.delta)}
              </span>
              <span className="kpi-period">{k.period}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="row-21">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Receita vs. Despesa</div>
              <div className="card-sub">{data.transactions.length > 0 ? `Últimos 12 meses · ${data.transactions.length} lançamentos` : 'Sem movimentações ainda'}</div>
            </div>
            <div className="card-actions">
              <div className="chart-legend">
                <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--accent)' }} />Receita</span>
                <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--danger)' }} />Despesa</span>
              </div>
              <button className="icon-btn" style={{ width: 30, height: 30 }}><Icon name="more" size={14} /></button>
            </div>
          </div>
          <RevenueExpenseChart data={data.revExp} />
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Despesas por Categoria</div>
              <div className="card-sub">{data.expenseCats.length > 0 ? `${data.expenseCats.length} categorias · ${fmtBRL(data.expenseCats.reduce((s, c) => s + c.value, 0), { compact: true })}` : 'Sem despesas lançadas'}</div>
            </div>
            <div className="card-actions">
              <button className="icon-btn" style={{ width: 30, height: 30 }}><Icon name="more" size={14} /></button>
            </div>
          </div>
          <DonutChart data={data.expenseCats} size={180} />
        </div>
      </div>

      <div className="row-21">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Receita por Plano</div>
              <div className="card-sub">SaaS · MRR em R$ mil</div>
            </div>
            <div className="card-actions">
              <div className="chart-legend">
                <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--accent)' }} />Enterprise</span>
                <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--info)' }} />Business</span>
                <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--purple)' }} />Starter</span>
              </div>
            </div>
          </div>
          <StackedBars data={data.revByPlan} keys={['enterprise', 'business', 'starter']}
            colors={['var(--accent)', 'var(--info)', 'var(--purple)']} height={200} />
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Movimentação Diária</div>
              <div className="card-sub">Volume de transações · 14 dias</div>
            </div>
          </div>
          <Heatmap grid={data.heatmap} color="var(--accent)" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-faint)', marginTop: 4 }}>
            <span>menos</span>
            {[0.15, 0.4, 0.7, 1].map((v, i) => (
              <span key={i} style={{ width: 12, height: 12, borderRadius: 3, background: `color-mix(in oklch, var(--accent) ${v * 100}%, oklch(0.25 0.014 240))` }} />
            ))}
            <span>mais</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">Transações Recentes</div>
            <div className="card-sub">Últimas movimentações</div>
          </div>
          <div className="card-actions">
            <button className="btn btn-ghost"><Icon name="filter" size={13} /> Filtrar</button>
            <button className="btn"><Icon name="export" size={13} /> Exportar</button>
          </div>
        </div>
        <TransactionsTable rows={data.transactions} />
      </div>

      <div className="row-3">
        {data.accounts.length === 0 && (
          <div className="card empty-card">
            <Icon name="wallet" size={24} />
            <strong>Nenhuma conta cadastrada</strong>
            <span>Cadastre contas bancarias para acompanhar saldos e conciliacao.</span>
          </div>
        )}
        {data.accounts.map((a, i) => (
          <div key={i} className="card" style={{ padding: 14, gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: a.color, display: 'grid', placeItems: 'center', color: 'white', fontWeight: 700, fontSize: 12 }}>{a.logo}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>{a.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{a.branch}</div>
              </div>
              <button className="icon-btn" style={{ width: 28, height: 28 }}><Icon name="more" size={13} /></button>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>
              <span style={{ color: 'var(--text-faint)', fontSize: 12, fontWeight: 500 }}>R$ </span>
              {fmtNum(a.balance)}
            </div>
          </div>
        ))}
      </div>

      {data.secondaryKpis && showSecondary && (
        <div className="row-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {data.secondaryKpis.map((k) => (
            <div key={k.id} className="card" style={{ padding: 14, gap: 6 }}>
              <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{k.label}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 19, fontWeight: 600 }}>{k.value}</span>
                <span className={'kpi-delta ' + ((k.delta > 0) !== !!k.good ? 'up' : 'down')}>
                  <Icon name={k.delta > 0 ? 'arrow-up' : 'arrow-down'} size={10} />
                  {fmtPct(k.delta)}
                </span>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{k.sub}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

const PartialPaymentModal = ({ tx, onClose, onSave }) => {
  const [payNow, setPayNow] = useState('');
  const alreadyPaid = tx.amountPaid || 0;
  const total = tx.amount || 0;
  const remaining = total - alreadyPaid;
  const parsed = Number(String(payNow).replace(',', '.').replace(/[^\d.]/g, '')) || 0;
  const afterPayment = remaining - parsed;
  const isIn = tx.type === 'in';
  const handleSave = () => {
    if (parsed <= 0 || parsed > remaining) return;
    const newPaid = alreadyPaid + parsed;
    if (newPaid >= total) {
      onSave(tx.id, { status: 'paid', amountPaid: total, amountRemaining: 0 });
    } else {
      onSave(tx.id, { status: 'partial', amountPaid: newPaid, amountRemaining: total - newPaid });
    }
  };
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">{isIn ? 'Registrar Recebimento' : 'Registrar Pagamento'}</div>
          <div className="spacer" />
          <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={onClose}><Icon name="x" size={14} /></button>
        </div>
        <div className="modal-body">
          <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '12px 14px', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{tx.client}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-faint)' }}>Valor original</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{fmtBRL(total)}</span>
            </div>
            {alreadyPaid > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-faint)' }}>Já {isIn ? 'recebido' : 'pago'}</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{fmtBRL(alreadyPaid)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderTop: '1px solid var(--border-soft)', paddingTop: 8 }}>
              <span style={{ color: 'var(--text-faint)' }}>Saldo em aberto</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'oklch(0.78 0.16 75)', fontWeight: 600 }}>{fmtBRL(remaining)}</span>
            </div>
          </div>
          <div className="field">
            <label>Quanto {isIn ? 'recebeu' : 'pagou'} agora? (R$)</label>
            <input value={payNow} onChange={(e) => setPayNow(e.target.value)} placeholder="0,00" autoFocus />
          </div>
          {parsed > 0 && (
            <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: 'var(--bg-elev)', border: '1px solid var(--border-soft)', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-faint)' }}>{isIn ? 'Recebendo agora' : 'Pagando agora'}</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 600 }}>{fmtBRL(parsed)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                <span style={{ color: 'var(--text-faint)' }}>{afterPayment <= 0 ? 'Situação' : 'Fica pendente'}</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: afterPayment <= 0 ? 'var(--accent)' : 'oklch(0.78 0.16 75)' }}>
                  {afterPayment <= 0 ? 'Quitado ✓' : fmtBRL(afterPayment)}
                </span>
              </div>
            </div>
          )}
          {parsed > remaining && (
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--danger)', padding: '6px 10px', background: 'var(--danger-soft)', borderRadius: 8 }}>
              Valor maior que o saldo em aberto ({fmtBRL(remaining)})
            </div>
          )}
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" disabled={parsed <= 0 || parsed > remaining} onClick={handleSave}>
            <Icon name="check" size={13} /> Registrar
          </button>
        </div>
      </div>
    </div>
  );
};

const EditTxModal = ({ tx, clients = [], suppliers = [], onClose, onSave }) => {
  const [amount, setAmount] = useState(String(tx.amount || ''));
  const [description, setDescription] = useState(tx.description || tx.client || '');
  const [category, setCategory] = useState(tx.plan || 'Receita recorrente');
  const [method, setMethod] = useState(tx.method || 'Pix');
  const [txDate, setTxDate] = useState(() => {
    if (!tx.date) return new Date().toISOString().slice(0, 10);
    const [d, m, y] = tx.date.split('/');
    return `${y}-${m}-${d}`;
  });
  const [txDue, setTxDue] = useState(() => {
    if (!tx.due) return '';
    const [d, m, y] = tx.due.split('/');
    return `${y}-${m}-${d}`;
  });
  const [status, setStatus] = useState(tx.status || 'pending');
  const handleSave = () => {
    const parsedAmount = Number(String(amount).replace(',', '.').replace(/[^\d.]/g, '')) || tx.amount;
    const updates = {
      amount: parsedAmount,
      plan: category,
      method,
      description: description.trim(),
      client: description.trim() || tx.client,
      status,
      date: txDate ? new Date(txDate + 'T12:00').toLocaleDateString('pt-BR') : tx.date,
      due: txDue ? new Date(txDue + 'T12:00').toLocaleDateString('pt-BR') : '',
    };
    if (status !== 'partial') {
      updates.amountPaid = status === 'paid' ? parsedAmount : (tx.amountPaid || 0);
      updates.amountRemaining = status === 'paid' ? 0 : (parsedAmount - (tx.amountPaid || 0));
    }
    onSave(tx.id, updates);
    onClose();
  };
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">Editar Lançamento</div>
          <div className="spacer" />
          <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={onClose}><Icon name="x" size={14} /></button>
        </div>
        <div className="modal-body">
          <div className="field">
            <label>Valor (R$)</label>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Data</label>
              <input type="date" value={txDate} onChange={(e) => setTxDate(e.target.value)} />
            </div>
            <div className="field">
              <label>Vencimento</label>
              <input type="date" value={txDue} onChange={(e) => setTxDue(e.target.value)} />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Categoria</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option>Receita recorrente</option>
                <option>Receita única</option>
                <option>Aluguel</option>
                <option>Energia</option>
                <option>Internet</option>
                <option>Contabilidade</option>
                <option>Folha & RH</option>
                <option>Marketing</option>
                <option>Infra & Cloud</option>
              </select>
            </div>
            <div className="field">
              <label>Método</label>
              <select value={method} onChange={(e) => setMethod(e.target.value)}>
                <option>Pix</option><option>Boleto</option><option>Cartão</option><option>TED</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="pending">Pendente</option>
              <option value="partial">Parcial</option>
              <option value="paid">Pago / Recebido</option>
              <option value="overdue">Atrasado</option>
            </select>
          </div>
          <div className="field">
            <label>Descrição / Cliente</label>
            <textarea rows="2" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Nome do cliente ou descrição..." />
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave}><Icon name="check" size={13} /> Salvar alterações</button>
        </div>
      </div>
    </div>
  );
};

const TX_STATUS_LABELS = { paid: 'Pago', pending: 'Pendente', overdue: 'Atrasado', draft: 'Rascunho', partial: 'Parcial' };

const TransactionsTable = ({ rows, onUpdateTx, clients, suppliers }) => {
  const [partialTx, setPartialTx] = useState(null);
  const [editTx, setEditTx] = useState(null);
  const colors = ['oklch(0.65 0.18 25)', 'oklch(0.70 0.15 295)', 'oklch(0.72 0.13 230)', 'oklch(0.74 0.17 155)', 'oklch(0.78 0.16 75)'];
  const initials = (s) => s.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const hasActions = !!onUpdateTx;
  const colCount = hasActions ? 8 : 7;
  return (
    <>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Cliente / Origem</th>
              <th>Categoria</th>
              <th>Método</th>
              <th>Status</th>
              <th>Data</th>
              <th className="text-right">Valor</th>
              {hasActions && <th style={{ width: 120 }}></th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={colCount} className="muted" style={{ textAlign: 'center', padding: 28 }}>
                  Nenhuma transacao cadastrada. Use Nova Transacao para iniciar ou acesse DEMO para ver dados ficticios.
                </td>
              </tr>
            )}
            {rows.map((r, i) => (
              <tr key={r.id}>
                <td className="muted mono" style={{ fontSize: 11.5 }}>{r.id}</td>
                <td>
                  <div className="client-cell">
                    <div className="client-avatar" style={{ background: colors[i % colors.length] }}>{initials(r.client)}</div>
                    <span>{r.client}</span>
                  </div>
                </td>
                <td><span className="tag">{r.plan}</span></td>
                <td className="muted">{r.method}</td>
                <td>
                  <span className={'status-pill status-' + r.status}>
                    {TX_STATUS_LABELS[r.status] || r.status}
                  </span>
                </td>
                <td className="muted">{r.date}</td>
                <td className={'num ' + (r.type === 'in' ? 'up' : 'down')}>
                  {r.status === 'partial' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-faint)', textDecoration: 'line-through' }}>{fmtBRL(r.amount)}</span>
                      <span style={{ color: 'var(--accent)' }}>+ {fmtBRL(r.amountPaid || 0).replace('R$', '').trim()}</span>
                      <span style={{ fontSize: 11, color: 'oklch(0.78 0.16 75)', fontFamily: 'var(--font-mono)' }}>Restam {fmtBRL(r.amountRemaining || 0).replace('R$', '').trim()}</span>
                    </div>
                  ) : (
                    <>{r.type === 'in' ? '+' : '−'} {fmtBRL(r.amount).replace('R$', '').trim()}</>
                  )}
                </td>
                {hasActions && (
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      {(r.status === 'pending' || r.status === 'partial') && (
                        <button
                          className="btn btn-primary"
                          style={{ fontSize: 11.5, padding: '4px 10px', whiteSpace: 'nowrap' }}
                          onClick={() => setPartialTx(r)}
                        >
                          {r.type === 'in' ? 'Receber' : 'Pagar'}
                        </button>
                      )}
                      <button
                        className="icon-btn"
                        title="Editar"
                        onClick={() => setEditTx(r)}
                      >
                        <Icon name="pencil" size={13} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {partialTx && (
        <PartialPaymentModal
          tx={partialTx}
          onClose={() => setPartialTx(null)}
          onSave={(id, updates) => { onUpdateTx(id, updates); setPartialTx(null); }}
        />
      )}
      {editTx && (
        <EditTxModal
          tx={editTx}
          clients={clients}
          suppliers={suppliers}
          onClose={() => setEditTx(null)}
          onSave={(id, updates) => { onUpdateTx(id, updates); setEditTx(null); }}
        />
      )}
    </>
  );
};

const FixedExpensesPanel = ({ expenses = [], onDelete, onEdit }) => {
  const total = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  return (
    <div className="fixed-expenses-panel">
      <div className="card-head">
        <div>
          <div className="card-title">Despesas fixas da empresa</div>
          <div className="card-sub">Custos recorrentes salvos para todo mes</div>
        </div>
        <span className="status-pill status-pending">{fmtBRL(total)} / mes</span>
      </div>
      {expenses.length === 0 ? (
        <div className="empty-card small">
          <Icon name="calendar" size={22} />
          <strong>Nenhuma despesa fixa cadastrada</strong>
          <span>Use Nova Despesa e marque Despesa fixa da empresa.</span>
        </div>
      ) : (
        <div className="fixed-expense-list">
          {expenses.map((item) => (
            <div className="fixed-expense-row" key={item.id}>
              <div>
                <strong>{item.description}</strong>
                <small>{item.category} · {item.recurrence} · vence dia {item.dueDay}</small>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="num down">{fmtBRL(item.amount)}</span>
                <button className="icon-btn" style={{ width: 26, height: 26 }} title="Editar" onClick={() => onEdit?.(item)}>
                  <Icon name="settings" size={12} />
                </button>
                <button className="icon-btn" style={{ width: 26, height: 26, color: 'var(--danger)' }} title="Excluir" onClick={() => { if (window.confirm('Excluir "' + item.description + '"?')) onDelete?.(item.id); }}>
                  <Icon name="x" size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const RegistryList = ({ title, emptyText, rows = [], icon = 'users', type = 'clients', onEdit }) => (
  <div className="registry-list">
    {rows.length === 0 ? (
      <div className="empty-card">
        <Icon name={icon} size={24} />
        <strong>{emptyText}</strong>
        <span>Use o botao Adicionar para criar o primeiro cadastro.</span>
      </div>
    ) : (
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>{title}</th><th>{type === 'products' ? 'Codigo / NCM' : 'CNPJ / CPF'}</th><th>{type === 'products' ? 'Valor' : 'Contato'}</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td className="muted">{type === 'products' ? (row.code || row.ncm || '-') : (row.cnpj || '-')}</td>
                <td className="muted">{type === 'products' ? fmtBRL(Number(row.price) || 0) : (row.phone || row.email || row.contact || '-')}</td>
                <td><span className="status-pill status-paid">ativo</span></td>
                <td className="text-right">
                  <button className="btn" onClick={() => onEdit?.(type, row)}><Icon name="settings" size={13} /> Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

/* ===== GENERIC PLACEHOLDER PAGE ===== */
const PlaceholderPage = ({ title, desc, kpis, children }) => (
  <>
    {kpis && (
      <div className="kpi-grid">
        {kpis.map((k, i) => (
          <div key={i} className="kpi">
            <div className="kpi-head"><span>{k.label}</span></div>
            <div className="kpi-value">{k.value}</div>
            <div className="kpi-foot">
              <span className={'kpi-delta ' + (k.up ? 'up' : 'down')}>{k.delta}</span>
              <span className="kpi-period">{k.sub}</span>
            </div>
          </div>
        ))}
      </div>
    )}
    {children}
  </>
);

const DemoPage = ({ demoMode, onEnableDemo, onDisableDemo }) => (
  <div className="demo-page">
    <div className="demo-hero">
      <div>
        <div className="card-title">DEMO</div>
        <h2>Dados ficticios para apresentacao</h2>
        <p>Use este modo para demonstrar indicadores, graficos, notas fiscais, contas e relatorios sem misturar com o sistema real.</p>
      </div>
      <span className={'status-pill ' + (demoMode ? 'status-paid' : 'status-draft')}>{demoMode ? 'ativo' : 'desligado'}</span>
    </div>
    <div className="row-3">
      <div className="card"><div className="card-title">Sistema real</div><div className="card-sub">Abre zerado para novos usuarios e operacao real.</div></div>
      <div className="card"><div className="card-title">Amostragem</div><div className="card-sub">Mostra clientes, receitas, despesas e graficos ficticios.</div></div>
      <div className="card"><div className="card-title">Separado</div><div className="card-sub">Ligar/desligar demo nao cria lancamentos reais.</div></div>
    </div>
    <div className="card">
      <div className="card-head">
        <div>
          <div className="card-title">Controle da demonstracao</div>
          <div className="card-sub">Escolha como quer visualizar o sistema agora.</div>
        </div>
        <div className="card-actions">
          <button className="btn btn-primary" onClick={onEnableDemo}><Icon name="play" size={13} /> Ativar DEMO</button>
          <button className="btn" onClick={onDisableDemo}><Icon name="x" size={13} /> Zerar sistema</button>
        </div>
      </div>
      <div className="demo-note">
        O modo padrao do CARVION fica zerado. A DEMO e apenas visual e usa dados ficticios para amostragem comercial.
      </div>
    </div>
  </div>
);

const ProfileModal = ({ user, onClose, onSettings }) => (
  <div className="modal-backdrop" onClick={onClose}>
    <div className="modal profile-modal" onClick={(e) => e.stopPropagation()}>
      <div className="modal-head">
        <div className="profile-head">
          <div className="avatar profile-avatar">CA</div>
          <div>
            <div className="modal-title">{user.name}</div>
            <div className="modal-sub">{user.email}</div>
          </div>
        </div>
        <div className="spacer" />
        <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={onClose} aria-label="Fechar"><Icon name="x" size={14} /></button>
      </div>
      <div className="modal-body">
        <div className="profile-grid">
          <div><span>Perfil</span><strong>{user.role}</strong></div>
          <div><span>Cargo</span><strong>{user.title || 'Administrador'}</strong></div>
          <div><span>Acesso</span><strong>Tudo liberado</strong></div>
          <div><span>Status</span><strong>Ativo</strong></div>
        </div>
        <div className="permission-list">
          {['Financeiro', 'Notas fiscais', 'Configuracoes', 'Equipe', 'Relatorios', 'DEMO'].map((label) => (
            <span key={label}><Icon name="check" size={12} /> {label}</span>
          ))}
        </div>
      </div>
      <div className="modal-foot">
        <button className="btn" onClick={onClose}>Fechar</button>
        <button className="btn btn-primary" onClick={onSettings}><Icon name="settings" size={13} /> Abrir configuracoes</button>
      </div>
    </div>
  </div>
);

const SettingsPage = ({ settings, setSettings }) => {
  const updateProfile = (field, value) => setSettings((current) => ({ ...current, profile: { ...current.profile, [field]: value } }));
  const updateCompany = (field, value) => setSettings((current) => ({ ...current, company: { ...current.company, [field]: value } }));
  const updatePermission = (field) => setSettings((current) => ({ ...current, permissions: { ...current.permissions, [field]: !current.permissions[field] } }));
  const updateNotification = (field) => setSettings((current) => ({ ...current, notifications: { ...current.notifications, [field]: !current.notifications[field] } }));
  const resetSettings = () => setSettings(DEFAULT_SETTINGS);

  const permissionLabels = [
    ['financeiro', 'Financeiro completo'],
    ['fiscal', 'Notas fiscais e certificado'],
    ['configuracoes', 'Configuracoes gerais'],
    ['equipe', 'Equipe e permissoes'],
    ['relatorios', 'Relatorios e exportacoes'],
    ['demo', 'Aba DEMO'],
  ];

  return (
    <div className="settings-page">
      <div className="settings-hero">
        <div>
          <div className="card-title">Administrador</div>
          <h2>{settings.profile.name}</h2>
          <p>{settings.profile.email} tem acesso total ao CARVION.</p>
        </div>
        <span className="status-pill status-paid">tudo liberado</span>
      </div>

      <div className="row-2">
        <div className="card">
          <div className="card-head"><div><div className="card-title">Perfil</div><div className="card-sub">Dados usados no sistema e no painel.</div></div></div>
          <div className="field-row">
            <div className="field"><label>Nome</label><input value={settings.profile.name} onChange={(e) => updateProfile('name', e.target.value)} /></div>
            <div className="field"><label>Cargo</label><input value={settings.profile.title} onChange={(e) => updateProfile('title', e.target.value)} /></div>
          </div>
          <div className="field-row">
            <div className="field"><label>E-mail de login</label><input value={settings.profile.email} onChange={(e) => updateProfile('email', e.target.value)} /></div>
            <div className="field"><label>Telefone</label><input value={settings.profile.phone} onChange={(e) => updateProfile('phone', e.target.value)} placeholder="Opcional" /></div>
          </div>
          <div className="field"><label>Perfil de acesso</label><input value="Admin total - sem bloqueios" readOnly /></div>
        </div>

        <div className="card">
          <div className="card-head"><div><div className="card-title">Empresa</div><div className="card-sub">Informacoes para relatórios e documentos.</div></div></div>
          <div className="field-row">
            <div className="field"><label>Razao social</label><input value={settings.company.legalName} onChange={(e) => updateCompany('legalName', e.target.value)} /></div>
            <div className="field"><label>Nome fantasia</label><input value={settings.company.tradeName} onChange={(e) => updateCompany('tradeName', e.target.value)} /></div>
          </div>
          <div className="field-row">
            <div className="field"><label>CNPJ</label><input value={settings.company.cnpj} onChange={(e) => updateCompany('cnpj', e.target.value)} placeholder="00.000.000/0000-00" /></div>
            <div className="field"><label>Inscricao estadual</label><input value={settings.company.stateRegistration} onChange={(e) => updateCompany('stateRegistration', e.target.value)} /></div>
          </div>
          <div className="field-row">
            <div className="field"><label>Cidade</label><input value={settings.company.city} onChange={(e) => updateCompany('city', e.target.value)} /></div>
            <div className="field"><label>UF</label><input value={settings.company.state} onChange={(e) => updateCompany('state', e.target.value)} /></div>
          </div>
        </div>
      </div>

      <div className="row-2">
        <div className="card">
          <div className="card-head"><div><div className="card-title">Permissoes</div><div className="card-sub">Este login nasce com tudo liberado.</div></div></div>
          <div className="settings-list">
            {permissionLabels.map(([key, label]) => (
              <button key={key} className="settings-row" onClick={() => updatePermission(key)}>
                <span>{label}</span>
                <span className={'toggle' + (settings.permissions[key] ? ' on' : '')}></span>
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div><div className="card-title">Notificacoes e seguranca</div><div className="card-sub">Preferencias salvas neste dispositivo.</div></div></div>
          <div className="settings-list">
            {[
              ['cashflow', 'Alertas de fluxo de caixa'],
              ['invoices', 'Alertas de notas fiscais'],
              ['updates', 'Atualizacoes automaticas'],
            ].map(([key, label]) => (
              <button key={key} className="settings-row" onClick={() => updateNotification(key)}>
                <span>{label}</span>
                <span className={'toggle' + (settings.notifications[key] ? ' on' : '')}></span>
              </button>
            ))}
          </div>
          <div className="settings-actions">
            <button className="btn" onClick={resetSettings}>Restaurar padrao</button>
            <button className="btn btn-primary"><Icon name="check" size={13} /> Salvo automaticamente</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const FiscalDocsPage = ({ clients: registeredClients = DEFAULT_CLIENTS, products: registeredProducts = [], settings, setSettings, onAddClient, onAddProduct }) => {
  const [docType, setDocType] = useState('nfe');
  const [issued, setIssued] = useState(false);
  const clients = registeredClients;
  const company = settings.company;
  const updateCompany = (field, value) => setSettings((current) => ({ ...current, company: { ...current.company, [field]: value } }));
  const handleLogoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateCompany('logo', reader.result);
    reader.readAsDataURL(file);
  };
  const defaultCatalog = [
    { id: 'carvion-pro', type: 'product', name: 'Sistema CARVION PRO - Plano anual', code: 'NCM 8523.49.10 - CST 00', price: 27000 },
    { id: 'plano-business', type: 'product', name: 'Plano Business mensal', code: 'NCM 8523.49.10 - CST 00', price: 1990 },
    { id: 'licenca-extra', type: 'product', name: 'Licenca adicional de usuario', code: 'NCM 8523.49.10 - CST 00', price: 390 },
    { id: 'onboarding', type: 'service', name: 'Onboarding personalizado', code: 'Servico 1.05 - ISS 5%', price: 4500 },
    { id: 'treinamento', type: 'service', name: 'Treinamento equipe (8h)', code: 'Servico 8.02 - ISS 5%', price: 1800 },
    { id: 'consultoria-fiscal', type: 'service', name: 'Consultoria fiscal e implantacao', code: 'Servico 17.01 - ISS 5%', price: 3200 },
  ];
  const [localCatalog, setLocalCatalog] = useState(defaultCatalog);
  const productCatalog = registeredProducts.map((product) => ({
    id: product.id,
    type: product.type || 'product',
    name: product.name,
    code: product.code || product.ncm || 'NCM a classificar - CST',
    price: Number(product.price) || 0,
  }));
  const catalog = [...productCatalog, ...localCatalog.filter((item) => !productCatalog.some((product) => product.id === item.id))];
  const [form, setForm] = useState({
    number: '000143',
    series: '1',
    nature: 'Venda de mercadoria',
    fiscalCode: '5102',
    clientId: 'vendashop',
    payment: 'Boleto bancario',
    due: '2026-06-01',
    notes: 'Documento emitido por ME ou EPP optante pelo Simples Nacional.',
    items: [
      { id: 'item-1', catalogId: 'carvion-pro', qty: 1, unit: 27000 },
      { id: 'item-2', catalogId: 'onboarding', qty: 1, unit: 4500 },
    ],
  });
  const [newClient, setNewClient] = useState({ name: '', cnpj: '', phone: '' });
  const [newCatalog, setNewCatalog] = useState({ name: '', price: '' });
  const [savedNotes, setSavedNotes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(NFE_STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  });

  const types = [
    ['nfe', 'NF-e', 'produto'],
    ['nfse', 'NFS-e', 'servico'],
    ['nfce', 'NFC-e', 'consumidor'],
  ];
  const selectedClient = clients.find((client) => client.id === form.clientId) || clients[0] || { id: '', name: 'Cliente a cadastrar', cnpj: 'CNPJ a cadastrar', city: 'Cidade', state: 'UF', phone: '' };
  const allowedCatalog = catalog.filter((item) => docType === 'nfse' ? item.type === 'service' : true);
  const resolvedItems = form.items.map((row) => {
    const item = catalog.find((entry) => entry.id === row.catalogId) || allowedCatalog[0] || catalog[0];
    const qty = Number(row.qty) || 0;
    const unit = Number(row.unit) || 0;
    return { ...row, item, qty, unit, total: qty * unit };
  });
  const subtotal = resolvedItems.reduce((sum, row) => sum + row.total, 0);
  const iss = docType === 'nfse' ? subtotal * 0.05 : 0;
  const total = subtotal;
  const issuedThisMonth = savedNotes.length;
  const lastNote = savedNotes[0];
  const savedTotal = savedNotes.reduce((sum, note) => sum + note.total, 0);

  useEffect(() => {
    localStorage.setItem(NFE_STORAGE_KEY, JSON.stringify(savedNotes));
  }, [savedNotes]);

  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const updateItem = (id, field, value) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((row) => {
        if (row.id !== id) return row;
        if (field !== 'catalogId') return { ...row, [field]: value };
        const item = catalog.find((entry) => entry.id === value);
        return { ...row, catalogId: value, unit: item ? item.price : row.unit };
      }),
    }));
  };
  const addItem = () => {
    const item = allowedCatalog[0] || catalog[0];
    setForm((current) => ({
      ...current,
      items: [...current.items, { id: `item-${Date.now()}`, catalogId: item.id, qty: 1, unit: item.price }],
    }));
  };
  const removeItem = (id) => {
    setForm((current) => ({ ...current, items: current.items.length > 1 ? current.items.filter((row) => row.id !== id) : current.items }));
  };
  const changeDocType = (key) => {
    const nextCatalog = catalog.filter((item) => key === 'nfse' ? item.type === 'service' : true);
    const first = nextCatalog[0] || catalog[0];
    setDocType(key);
    setForm((current) => ({
      ...current,
      nature: key === 'nfse' ? 'Prestacao de servico' : 'Venda de mercadoria',
      fiscalCode: key === 'nfse' ? '1.05' : '5102',
      items: [{ id: `item-${Date.now()}`, catalogId: first.id, qty: 1, unit: first.price }],
    }));
  };
  const startNewNote = () => {
    const nextNumber = String((Number(form.number) || 143) + 1).padStart(6, '0');
    const first = allowedCatalog[0] || catalog[0];
    setForm({
      number: nextNumber,
      series: '1',
      nature: docType === 'nfse' ? 'Prestacao de servico' : 'Venda de mercadoria',
      fiscalCode: docType === 'nfse' ? '1.05' : '5102',
      clientId: clients[0]?.id || '',
      payment: 'Boleto bancario',
      due: '',
      notes: '',
      items: [{ id: `item-${Date.now()}`, catalogId: first.id, qty: 1, unit: first.price }],
    });
    setIssued(false);
  };
  const addClient = () => {
    if (!newClient.name.trim()) return;
    const id = `cliente-${Date.now()}`;
    const client = {
      id,
      name: newClient.name.trim(),
      cnpj: newClient.cnpj.trim() || 'CNPJ a cadastrar',
      city: 'Cidade',
      state: 'UF',
      phone: newClient.phone.replace(/\D/g, ''),
      email: '',
    };
    onAddClient?.(client);
    setForm((current) => ({ ...current, clientId: id }));
    setNewClient({ name: '', cnpj: '', phone: '' });
  };
  const addCatalogEntry = () => {
    if (!newCatalog.name.trim()) return;
    const entry = {
      id: `catalogo-${Date.now()}`,
      type: docType === 'nfse' ? 'service' : 'product',
      name: newCatalog.name.trim(),
      code: docType === 'nfse' ? 'Servico a classificar - ISS' : 'NCM a classificar - CST',
      price: Number(String(newCatalog.price).replace(',', '.')) || 0,
    };
    onAddProduct?.(entry);
    setLocalCatalog((current) => [...current, entry]);
    setForm((current) => ({
      ...current,
      items: [...current.items, { id: `item-${Date.now()}`, catalogId: entry.id, qty: 1, unit: entry.price }],
    }));
    setNewCatalog({ name: '', price: '' });
  };
  const noteSnapshot = () => ({
    id: `nota-${Date.now()}`,
    type: docType,
    number: form.number,
    series: form.series,
    nature: form.nature,
    fiscalCode: form.fiscalCode,
    client: selectedClient,
    payment: form.payment,
    due: form.due,
    notes: form.notes,
    items: resolvedItems.map(({ item, qty, unit, total }) => ({ name: item.name, code: item.code, qty, unit, total })),
    subtotal,
    iss,
    total,
    status: 'autorizada',
    issuedAt: new Date().toLocaleDateString('pt-BR'),
  });
  const issueNote = () => {
    const note = noteSnapshot();
    setSavedNotes((current) => [note, ...current]);
    setIssued(true);
    setTimeout(() => setIssued(false), 2600);
  };
  const exportPdf = () => {
    document.body.classList.add('nfe-printing');
    setTimeout(() => {
      window.print();
      setTimeout(() => document.body.classList.remove('nfe-printing'), 300);
    }, 50);
  };
  const sendWhatsApp = (note = noteSnapshot()) => {
    const phone = note.client.phone ? note.client.phone.replace(/\D/g, '') : '';
    const text = [
      `Nota fiscal ${note.type.toUpperCase()} No ${note.number}`,
      `Cliente: ${note.client.name}`,
      `Valor: ${fmtBRL(note.total)}`,
      'PDF/XML disponivel no sistema CARVION.',
    ].join('\n');
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener');
  };
  const loadSavedNote = (note) => {
    const clientId = clients.some((client) => client.id === note.client.id) ? note.client.id : note.client.id;
    if (!clients.some((client) => client.id === note.client.id)) onAddClient?.(note.client);
    setDocType(note.type);
    const restoredCatalog = note.items.map((entry, index) => ({ id: `historico-${note.id}-${index}`, type: note.type === 'nfse' ? 'service' : 'product', name: entry.name, code: entry.code, price: entry.unit }));
    setForm({
      number: note.number,
      series: note.series,
      nature: note.nature,
      fiscalCode: note.fiscalCode,
      clientId,
      payment: note.payment,
      due: note.due,
      notes: note.notes,
      items: note.items.map((entry, index) => {
        return { id: `item-${note.id}-${index}`, catalogId: restoredCatalog[index].id, qty: entry.qty, unit: entry.unit };
      }),
    });
    setLocalCatalog((current) => [...current.filter((entry) => !entry.id.startsWith(`historico-${note.id}-`)), ...restoredCatalog]);
  };

  return (
    <>
      <div className="nfe-banner">
        <Icon name="receipt" size={16} />
        <span><strong>Fiscal integrado ao financeiro.</strong> Emita NF-e, NFS-e e NFC-e a partir de receitas, contas a receber e vendas.</span>
      </div>
      {issued && (
        <div className="update-banner">
          <Icon name="check" size={14} />
          <span>Nota emitida e armazenada no historico local. Conecte certificado e SEFAZ para transmissao real.</span>
        </div>
      )}

      <div className="kpi-grid nfe-kpis">
        <div className="kpi"><div className="kpi-head"><span>Emitidas no mes</span></div><div className="kpi-value">{issuedThisMonth}</div><div className="kpi-foot"><span className="kpi-delta up">local</span><span className="kpi-period">historico salvo</span></div></div>
        <div className="kpi"><div className="kpi-head"><span>Faturamento fiscal</span></div><div className="kpi-value">{fmtBRL(savedTotal, { compact: true })}</div><div className="kpi-foot"><span className="kpi-delta up">{lastNote ? lastNote.number : 'sem notas'}</span><span className="kpi-period">ultima nota</span></div></div>
        <div className="kpi"><div className="kpi-head"><span>Aguardando SEFAZ</span></div><div className="kpi-value">0</div><div className="kpi-foot"><span className="kpi-delta up">pronto</span><span className="kpi-period">modo local</span></div></div>
        <div className="kpi"><div className="kpi-head"><span>Rejeitadas</span></div><div className="kpi-value">0</div><div className="kpi-foot"><span className="kpi-delta up">zerado</span><span className="kpi-period">sem pendencias</span></div></div>
      </div>

      <div className="nfe-company-config">
        <div className="nfe-company-title">
          <div>
            <h2>Configuracoes da empresa</h2>
            <p>Identidade fiscal usada em todas as notas emitidas.</p>
          </div>
          <span className="status-pill status-paid">preview ao vivo</span>
        </div>
        <div className="nfe-company-grid">
          <div className="card nfe-company-card">
            <div className="card-head">
              <div><div className="card-title">Identidade da empresa</div><div className="card-sub">Aparece nas notas fiscais</div></div>
              <span className="status-pill status-paid">aparece nas notas</span>
            </div>
            <div className="nfe-logo-row">
              <div className="nfe-logo-preview">
                {company.logo ? <img src={company.logo} alt="Logo da empresa" /> : <div className="brand-mark">CR</div>}
              </div>
              <label className="btn btn-primary">
                <Icon name="download" size={13} /> Trocar logo
                <input type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={handleLogoUpload} hidden />
              </label>
              <small>PNG/SVG, fundo transparente - ate 2MB</small>
            </div>
            <div className="field"><label>Razao social</label><input value={company.legalName} onChange={(e) => updateCompany('legalName', e.target.value)} placeholder="Sua empresa" /></div>
            <div className="field-row">
              <div className="field"><label>CNPJ</label><input value={company.cnpj} onChange={(e) => updateCompany('cnpj', e.target.value)} placeholder="00.000.000/0001-00" /></div>
              <div className="field"><label>Inscricao estadual</label><input value={company.stateRegistration} onChange={(e) => updateCompany('stateRegistration', e.target.value)} placeholder="ISENTO" /></div>
            </div>
            <div className="field"><label>Endereco completo</label><input value={company.address} onChange={(e) => updateCompany('address', e.target.value)} placeholder="Rua, numero, bairro, cidade/UF" /></div>
            <div className="field-row">
              <div className="field"><label>Telefone</label><input value={company.phone} onChange={(e) => updateCompany('phone', e.target.value)} /></div>
              <div className="field"><label>E-mail</label><input value={company.email} onChange={(e) => updateCompany('email', e.target.value)} /></div>
            </div>
            <div className="nfe-company-actions">
              <button className="btn" onClick={() => setSettings((current) => ({ ...current, company: DEFAULT_SETTINGS.company }))}>Cancelar</button>
              <button className="btn btn-primary"><Icon name="check" size={13} /> Salvar alteracoes</button>
            </div>
          </div>

          <div className="card nfe-company-preview-card">
            <div className="card-head">
              <div><div className="card-title">Como aparece na nota</div><div className="card-sub">Preview em tempo real</div></div>
              <span className="status-pill status-paid">preview ao vivo</span>
            </div>
            <div className="nfe-company-paper">
              <div className="nfe-company-paper-head">
                <div className="nfe-company-logo">
                  {company.logo ? <img src={company.logo} alt="Logo da empresa" /> : <span>CR</span>}
                </div>
                <div>
                  <strong>{company.legalName || company.tradeName || 'Sua empresa'}</strong>
                  <span>CNPJ {company.cnpj || '-'}</span>
                  <small>{company.address || 'endereco comercial'}</small>
                </div>
                <div className="nfe-company-number"><b>DANFE</b><strong>No {form.number}</strong><span>Serie {form.series}</span></div>
              </div>
              <div className="nfe-paper-section"><span>Destinatario</span><p>{selectedClient.name || 'Aparece quando voce emitir'}</p></div>
              <div className="nfe-paper-section">
                <span>Produtos / Servicos</span>
                <table className="nfe-paper-table">
                  <thead><tr><th>Descricao</th><th>NCM</th><th>Qtd</th><th>Total</th></tr></thead>
                  <tbody>
                    {resolvedItems.length ? resolvedItems.slice(0, 3).map((row) => (
                      <tr key={row.id}><td>{row.item.name}</td><td>{row.item.code}</td><td>{row.qty}</td><td>{fmtBRL(row.total)}</td></tr>
                    )) : <tr><td colSpan="4">Itens da nota aparecem aqui</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="nfe-paper-totals">
                <div><span>Vlr produtos</span><strong>{fmtBRL(subtotal)}</strong></div>
                <div><span>ICMS</span><strong>R$ 0,00</strong></div>
                <div><span>ISS</span><strong>{fmtBRL(iss)}</strong></div>
                <div><span>Vlr total</span><strong>{fmtBRL(total)}</strong></div>
              </div>
              <div className="nfe-paper-foot">Documento auxiliar emitido por CARVION - SEFAZ</div>
            </div>
            <div className="nfe-logo-note">
              <Icon name="check" size={13} />
              <span>Esta logo sera impressa em</span>
              <strong>todas as notas fiscais</strong>
              <span>que voce emitir.</span>
            </div>
          </div>
        </div>
      </div>

      <div className="nfe-layout">
        <div className="card nfe-form-card">
          <div className="card-head">
            <div>
              <div className="card-title">Nova Nota Fiscal</div>
              <div className="card-sub">Documento vinculado ao fluxo financeiro</div>
            </div>
            <div className="card-actions">
              <button className="btn" onClick={exportPdf}><Icon name="file" size={13} /> Exportar PDF</button>
              <button className="btn btn-primary" onClick={startNewNote}><Icon name="receipt" size={13} /> Emitir nova nota</button>
            </div>
          </div>
          <div className="nfe-typebar">
            <div className="segmented">
              {types.map(([key, label, sub]) => (
                <button key={key} className={docType === key ? 'active' : ''} onClick={() => changeDocType(key)}>
                  {label} <span className="nfe-seg-sub">{sub}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="nfe-form-grid">
            <div className="field-row nfe-row-3">
              <div className="field"><label>Natureza da operacao</label><input value={form.nature} onChange={(e) => updateForm('nature', e.target.value)} /></div>
              <div className="field"><label>{docType === 'nfse' ? 'Codigo servico' : 'CFOP'}</label><input value={form.fiscalCode} onChange={(e) => updateForm('fiscalCode', e.target.value)} /></div>
              <div className="field"><label>Serie / Numero</label><input value={`${form.series} / ${form.number}`} onChange={(e) => {
                const [series, number] = e.target.value.split('/').map((part) => part.trim());
                setForm((current) => ({ ...current, series: series || current.series, number: number || current.number }));
              }} /></div>
            </div>

            <div className="field">
              <label>Cliente / Tomador</label>
              <select value={form.clientId} onChange={(e) => updateForm('clientId', e.target.value)}>
                {clients.length === 0 && <option value="">Cadastre um cliente</option>}
                {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
              </select>
            </div>
            <div className="nfe-inline-add">
              <input value={newClient.name} onChange={(e) => setNewClient((current) => ({ ...current, name: e.target.value }))} placeholder="Adicionar novo cliente" />
              <input value={newClient.cnpj} onChange={(e) => setNewClient((current) => ({ ...current, cnpj: e.target.value }))} placeholder="CNPJ" />
              <input value={newClient.phone} onChange={(e) => setNewClient((current) => ({ ...current, phone: e.target.value }))} placeholder="WhatsApp" />
              <button className="btn" onClick={addClient}><Icon name="plus" size={13} /> Cliente</button>
            </div>

            <div className="nfe-items">
              <div className="nfe-items-head"><span>Descricao</span><span>Qtd</span><span>Vlr unit</span><span>Total</span><span></span></div>
              {resolvedItems.map((row) => (
                <div className="nfe-items-row" key={row.id}>
                  <div>
                    <select value={row.catalogId} onChange={(e) => updateItem(row.id, 'catalogId', e.target.value)}>
                      {allowedCatalog.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                    <small>{row.item.code}</small>
                  </div>
                  <input type="number" min="1" value={row.qty} onChange={(e) => updateItem(row.id, 'qty', e.target.value)} />
                  <input type="number" min="0" step="0.01" value={row.unit} onChange={(e) => updateItem(row.id, 'unit', e.target.value)} />
                  <span>{fmtBRL(row.total)}</span>
                  <button className="icon-btn" title="Remover item" onClick={() => removeItem(row.id)}><Icon name="trash" size={13} /></button>
                </div>
              ))}
              <button className="nfe-add-item" onClick={addItem}><Icon name="plus" size={13} /> Adicionar item</button>
            </div>
            <div className="nfe-catalog-tools">
              <div className="nfe-inline-add">
                <input value={newCatalog.name} onChange={(e) => setNewCatalog((current) => ({ ...current, name: e.target.value }))} placeholder={docType === 'nfse' ? 'Adicionar novo servico' : 'Adicionar novo produto'} />
                <input value={newCatalog.price} onChange={(e) => setNewCatalog((current) => ({ ...current, price: e.target.value }))} placeholder="Valor unitario" />
                <button className="btn" onClick={addCatalogEntry}><Icon name="plus" size={13} /> {docType === 'nfse' ? 'Servico' : 'Produto'}</button>
              </div>
              <button className="btn" onClick={addItem}><Icon name="plus" size={13} /> Item na nota</button>
            </div>

            <div className="field-row">
              <div className="field"><label>Forma de pagamento</label><select value={form.payment} onChange={(e) => updateForm('payment', e.target.value)}><option>Boleto bancario</option><option>Pix</option><option>Cartao de credito</option><option>Transferencia</option></select></div>
              <div className="field"><label>Vencimento</label><input type="date" value={form.due} onChange={(e) => updateForm('due', e.target.value)} /></div>
            </div>

            <div className="field"><label>Informacoes complementares</label><textarea rows="2" value={form.notes} onChange={(e) => updateForm('notes', e.target.value)} /></div>
          </div>

          <div className="nfe-totals">
            <div><span>Base</span><strong>{fmtBRL(subtotal)}</strong></div>
            <div><span>ISS 5%</span><strong>{fmtBRL(iss)}</strong></div>
            <div><span>Desconto</span><strong>R$ 0,00</strong></div>
            <div><span>Total da nota</span><strong>{fmtBRL(total)}</strong></div>
          </div>

          <div className="nfe-actions">
            <button className="btn"><Icon name="check" size={13} /> Salvar rascunho</button>
            <div className="spacer" />
            <button className="btn" onClick={() => sendWhatsApp()}><Icon name="message" size={13} /> WhatsApp</button>
            <button className="btn" onClick={exportPdf}><Icon name="file" size={13} /> Exportar PDF</button>
            <button className="btn btn-primary" onClick={issueNote}><Icon name="send" size={13} /> Emitir e armazenar</button>
          </div>
        </div>

        <div className="nfe-side">
          <div className="card">
            <div className="card-head">
              <div><div className="card-title">Pre-visualizacao</div><div className="card-sub">DANFE / documento fiscal</div></div>
              <div className="card-actions">
                <button className="btn" onClick={() => sendWhatsApp()}><Icon name="message" size={13} /> WhatsApp</button>
                <button className="btn" onClick={exportPdf}><Icon name="file" size={13} /> PDF</button>
                <span className="status-pill status-pending">previa</span>
              </div>
            </div>
            <div className="nfe-preview nfe-print-sheet">
              <div className="nfe-preview-head"><div className="brand-mark">{company.logo ? <img src={company.logo} alt="Logo" /> : 'CR'}</div><div><strong>{company.legalName || company.tradeName || 'Sua empresa'}</strong><span>{company.cnpj || 'CNPJ a configurar'}</span></div><div><b>No {form.number}</b><span>Serie {form.series}</span></div></div>
              <div className="nfe-preview-section"><span>Natureza</span><strong>{form.nature}</strong><small>{docType.toUpperCase()} - {docType === 'nfse' ? 'Codigo servico' : 'CFOP'} {form.fiscalCode}</small></div>
              <div className="nfe-preview-section"><span>Destinatario</span><strong>{selectedClient.name}</strong><small>{selectedClient.cnpj} - {selectedClient.city}/{selectedClient.state}</small></div>
              <div className="nfe-preview-section">
                <span>Produtos / Servicos</span>
                <table className="nfe-print-table">
                  <thead><tr><th>Descricao</th><th>Qtd</th><th>Unit.</th><th>Total</th></tr></thead>
                  <tbody>
                    {resolvedItems.map((row) => (
                      <tr key={row.id}><td>{row.item.name}<small>{row.item.code}</small></td><td>{row.qty}</td><td>{fmtBRL(row.unit)}</td><td>{fmtBRL(row.total)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="nfe-preview-section"><span>Pagamento</span><strong>{form.payment}</strong><small>Vencimento: {form.due || 'a definir'} - {form.notes || 'Sem informacoes complementares'}</small></div>
              <div className="nfe-preview-total"><span>Valor total</span><strong>{fmtBRL(total)}</strong></div>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><div><div className="card-title">Notas armazenadas</div><div className="card-sub">Historico local com PDF e WhatsApp</div></div><button className="btn" onClick={startNewNote}><Icon name="plus" size={13} /> Nova</button></div>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>No</th><th>Cliente</th><th>Status</th><th className="text-right">Valor</th><th></th></tr></thead>
                <tbody>
                  {savedNotes.length === 0 && (
                    <tr><td colSpan="5" className="muted">Nenhuma nota emitida ainda. Use Emitir e armazenar para criar o historico.</td></tr>
                  )}
                  {savedNotes.map((note) => (
                    <tr key={note.id}>
                      <td className="mono muted">{note.number}</td>
                      <td>{note.client.name}</td>
                      <td><span className="status-pill status-paid">{note.status}</span></td>
                      <td className="num">{fmtBRL(note.total)}</td>
                      <td>
                        <div className="row" style={{ justifyContent: 'flex-end' }}>
                          <button className="icon-btn" title="Abrir nota" onClick={() => loadSavedNote(note)}><Icon name="eye" size={13} /></button>
                          <button className="icon-btn" title="Enviar no WhatsApp" onClick={() => sendWhatsApp(note)}><Icon name="message" size={13} /></button>
                          <button className="icon-btn" title="Exportar PDF" onClick={() => { loadSavedNote(note); setTimeout(exportPdf, 80); }}><Icon name="file" size={13} /></button>
                          <button className="icon-btn" title="Baixar XML/PDF"><Icon name="download" size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

/* ===== MOBILE BOTTOM NAV ===== */
const MobileTab = ({ active, onChange, onAdd }) => (
  <nav className="mobile-tab">
    <button className={active === 'dashboard' ? 'active' : ''} onClick={() => onChange('dashboard')}>
      <Icon name="home" size={20} />
      <span>Início</span>
    </button>
    <button className={active === 'cashflow' ? 'active' : ''} onClick={() => onChange('cashflow')}>
      <Icon name="activity" size={20} />
      <span>Fluxo</span>
    </button>
    <button className="fab" onClick={onAdd}><Icon name="plus" size={22} /></button>
    <button className={active === 'receivables' ? 'active' : ''} onClick={() => onChange('receivables')}>
      <Icon name="inbox" size={20} />
      <span>Receber</span>
    </button>
    <button className={active === 'reports' ? 'active' : ''} onClick={() => onChange('reports')}>
      <Icon name="file" size={20} />
      <span>Relatórios</span>
    </button>
  </nav>
);

/* ===== ADD TRANSACTION MODAL ===== */
const AddTxModal = ({ onClose, context = 'dashboard', clients = [], suppliers = [], onSaveFixedExpense, onSaveTx }) => {
  const defaultType = ['expenses', 'payables'].includes(context) ? 'out' : 'in';
  const [type, setType] = useState(defaultType);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Receita recorrente');
  const [dueDay, setDueDay] = useState('5');
  const [isFixed, setIsFixed] = useState(false);
  const [txDate, setTxDate] = useState(new Date().toISOString().slice(0, 10));
  const [txDue, setTxDue] = useState('');
  const [clientId, setClientId] = useState('');
  const [method, setMethod] = useState('Pix');
  const people = type === 'in'
    ? clients
    : [...suppliers, ...clients.map((client) => ({ ...client, name: `${client.name} (cliente)` }))];
  const titleByContext = {
    revenue: 'Nova Receita',
    expenses: 'Nova Despesa',
    cashflow: 'Novo Lancamento',
    payables: 'Nova Conta a Pagar',
    receivables: 'Nova Conta a Receber',
  };
  const isExpenseFlow = type === 'out' && ['expenses', 'payables', 'cashflow', 'dashboard'].includes(context);
  const saveTransaction = () => {
    if (isExpenseFlow && isFixed) {
      onSaveFixedExpense?.({
        id: `fixa-${Date.now()}`,
        description: description.trim() || 'Despesa fixa',
        category,
        amount: Number(String(amount).replace(',', '.').replace(/[^\d.]/g, '')) || 0,
        dueDay,
        recurrence: 'Mensal',
        status: 'ativa',
      });
    } else {
      const person = people.find((p) => p.id === clientId);
      const parsedAmount = Number(String(amount).replace(',', '.').replace(/[^\d.]/g, '')) || 0;
      if (parsedAmount > 0) {
        const statusByContext = { payables: 'pending', receivables: 'pending' };
        onSaveTx?.({
          id: `tx-${Date.now()}`,
          type,
          client: person?.name || description.trim() || (type === 'in' ? 'Receita' : 'Despesa'),
          plan: category,
          method,
          status: statusByContext[context] || 'paid',
          date: txDate ? new Date(txDate + 'T12:00').toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR'),
          due: txDue ? new Date(txDue + 'T12:00').toLocaleDateString('pt-BR') : '',
          amount: parsedAmount,
          description: description.trim(),
        });
      }
    }
    onClose();
  };
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">{titleByContext[context] || 'Nova Transação'}</div>
          <div className="spacer" />
          <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={onClose}><Icon name="x" size={14} /></button>
        </div>
        <div className="modal-body">
          <div className="type-toggle">
            <button className={(type === 'in' ? 'active income' : '')} onClick={() => setType('in')}>
              <Icon name="arrow-down-left" size={14} /> Receita
            </button>
            <button className={(type === 'out' ? 'active expense' : '')} onClick={() => setType('out')}>
              <Icon name="arrow-up-right" size={14} /> Despesa
            </button>
          </div>
          <div className="field">
            <label>Valor (R$)</label>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Data</label>
              <input type="date" value={txDate} onChange={(e) => setTxDate(e.target.value)} />
            </div>
            <div className="field">
              <label>Vencimento</label>
              <input type="date" value={txDue} onChange={(e) => setTxDue(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>{type === 'in' ? 'Cliente cadastrado' : 'Fornecedor / Cliente cadastrado'}</label>
            <select value={clientId} onChange={(e) => setClientId(e.target.value)}>
              <option value="">{people.length ? '— selecionar cadastro —' : 'Nenhum cadastro salvo ainda'}</option>
              {people.map((person) => (
                <option key={`${type}-${person.id}`} value={person.id}>{person.name}</option>
              ))}
            </select>
            {people.length === 0 && <small className="field-help">Cadastre primeiro em Clientes ou Fornecedores para puxar aqui.</small>}
          </div>
          <div className="field-row">
            <div className="field">
              <label>Categoria</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option>Receita recorrente</option>
                <option>Receita única</option>
                <option>Aluguel</option>
                <option>Energia</option>
                <option>Internet</option>
                <option>Contabilidade</option>
                <option>Folha & RH</option>
                <option>Marketing</option>
                <option>Infra & Cloud</option>
              </select>
            </div>
            <div className="field">
              <label>Método</label>
              <select value={method} onChange={(e) => setMethod(e.target.value)}>
                <option>Pix</option><option>Boleto</option><option>Cartão</option><option>TED</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label>Descrição</label>
            <textarea rows="2" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex.: Aluguel da sala, energia, contador, internet..." />
          </div>
          {isExpenseFlow && (
            <div className="fixed-expense-box">
              <label className="check-row">
                <input type="checkbox" checked={isFixed} onChange={(e) => setIsFixed(e.target.checked)} />
                <span>Despesa fixa da empresa</span>
              </label>
              {isFixed && (
                <div className="field-row">
                  <div className="field">
                    <label>Recorrência</label>
                    <select defaultValue="Mensal"><option>Mensal</option><option>Semanal</option><option>Anual</option></select>
                  </div>
                  <div className="field">
                    <label>Vence todo dia</label>
                    <input type="number" min="1" max="31" value={dueDay} onChange={(e) => setDueDay(e.target.value)} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={saveTransaction}><Icon name="check" size={13} /> {isFixed && isExpenseFlow ? 'Salvar despesa fixa' : 'Lançar transação'}</button>
        </div>
      </div>
    </div>
  );
};

const CreateRecordModal = ({ type, onClose, onSave, record }) => {
  const [values, setValues] = useState(() => {
    if (!record) return {};
    if (type === 'clients') {
      return {
        'Nome do cliente': record.name || '',
        'CNPJ / CPF': record.cnpj || '',
        'WhatsApp': record.phone || '',
        'E-mail': record.email || '',
      };
    }
    if (type === 'suppliers') {
      return {
        'Nome do fornecedor': record.name || '',
        'CNPJ / CPF': record.cnpj || '',
        'Contato': record.contact || '',
        'WhatsApp': record.phone || '',
      };
    }
    if (type === 'products') {
      return {
        'Nome do produto': record.name || '',
        'Codigo / SKU': record.code || '',
        'Valor unitario': record.price ? String(record.price).replace('.', ',') : '',
        'NCM / Categoria fiscal': record.ncm || record.fiscalCategory || '',
      };
    }
    return {};
  });
  const config = {
    clients: {
      title: record ? 'Editar Cliente' : 'Novo Cliente',
      sub: 'Cadastro separado do financeiro e das notas',
      icon: 'users',
      fields: [
        ['Nome do cliente', 'Ex.: CARVION Comercio LTDA'],
        ['CNPJ / CPF', '00.000.000/0001-00'],
        ['WhatsApp', '(67) 99999-9999'],
        ['E-mail', 'cliente@empresa.com'],
      ],
      action: 'Salvar cliente',
    },
    suppliers: {
      title: record ? 'Editar Fornecedor' : 'Novo Fornecedor',
      sub: 'Cadastro de fornecedor para compras e contas a pagar',
      icon: 'truck',
      fields: [
        ['Nome do fornecedor', 'Ex.: Distribuidora ABC'],
        ['CNPJ / CPF', '00.000.000/0001-00'],
        ['Contato', 'Nome ou setor'],
        ['WhatsApp', '(67) 99999-9999'],
      ],
      action: 'Salvar fornecedor',
    },
    products: {
      title: record ? 'Editar Produto' : 'Novo Produto',
      sub: 'Catalogo para vendas, estoque e notas fiscais',
      icon: 'box',
      fields: [
        ['Nome do produto', 'Ex.: Plano CARVION PRO'],
        ['Codigo / SKU', 'CARVION-PRO'],
        ['Valor unitario', 'R$ 0,00'],
        ['NCM / Categoria fiscal', 'NCM ou servico'],
      ],
      action: 'Salvar produto',
    },
    payroll: {
      title: 'Novo Funcionario',
      sub: 'Cadastro separado para RH e folha',
      icon: 'briefcase',
      fields: [
        ['Nome completo', 'Nome do funcionario'],
        ['CPF', '000.000.000-00'],
        ['Cargo', 'Funcao'],
        ['Salario', 'R$ 0,00'],
      ],
      action: 'Salvar funcionario',
    },
    nfe: {
      title: 'Nova Nota Fiscal',
      sub: 'Use o formulario fiscal para emitir uma nota',
      icon: 'receipt',
      fields: [
        ['Cliente / Tomador', 'Selecione ou cadastre na tela fiscal'],
        ['Produto ou servico', 'Use a lista da nota'],
        ['Valor', 'R$ 0,00'],
      ],
      action: 'Ir para notas fiscais',
    },
  }[type] || {
    title: 'Novo Registro',
    sub: 'Cadastro separado da transacao financeira',
    icon: 'plus',
    fields: [
      ['Nome', 'Digite o nome'],
      ['Descricao', 'Detalhes do cadastro'],
    ],
    action: 'Salvar registro',
  };
  const updateValue = (label, value) => setValues((current) => ({ ...current, [label]: value }));
  const parseMoney = (value) => {
    const normalized = String(value || '').replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
    return Number(normalized) || 0;
  };
  const saveRecord = () => {
    const firstField = config.fields[0]?.[0];
    const savedRecord = {
      id: record?.id || `${type || 'registro'}-${Date.now()}`,
      name: values[firstField]?.trim() || config.title,
      cnpj: values['CNPJ / CPF'] || '',
      phone: values['WhatsApp'] || '',
      email: values['E-mail'] || '',
      contact: values['Contato'] || '',
      code: values['Codigo / SKU'] || '',
      price: parseMoney(values['Valor unitario']),
      ncm: values['NCM / Categoria fiscal'] || '',
      type: type === 'products' ? 'product' : undefined,
      city: 'Cidade',
      state: 'UF',
    };
    onSave?.(type, savedRecord);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="modal-title"><Icon name={config.icon} size={15} /> {config.title}</div>
            <div className="modal-sub">{config.sub}</div>
          </div>
          <div className="spacer" />
          <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={onClose}><Icon name="x" size={14} /></button>
        </div>
        <div className="modal-body">
          {config.fields.map(([label, placeholder]) => (
            <div className="field" key={label}>
              <label>{label}</label>
              <input value={values[label] || ''} onChange={(e) => updateValue(label, e.target.value)} placeholder={placeholder} />
            </div>
          ))}
          <div className="field">
            <label>Observacoes</label>
            <textarea rows="2" placeholder="Informacoes adicionais" />
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={saveRecord}><Icon name="check" size={13} /> {config.action}</button>
        </div>
      </div>
    </div>
  );
};

const InstallAppModal = ({ onClose, onInstall, canPrompt }) => {
  const platforms = [
    {
      icon: 'monitor',
      title: 'Mac',
      desc: 'Chrome, Edge ou Safari',
      steps: ['Abra pelo link online ou localhost', 'Clique em Instalar neste dispositivo', 'O app fica na pasta Aplicativos ou Dock'],
    },
    {
      icon: 'monitor',
      title: 'Windows',
      desc: 'Chrome ou Edge',
      steps: ['Abra pelo link online ou localhost', 'Clique em Instalar neste dispositivo', 'Fixe na barra de tarefas se quiser'],
    },
    {
      icon: 'phone',
      title: 'iPhone',
      desc: 'Safari no iOS',
      steps: ['Abra o sistema no Safari', 'Toque em Compartilhar', 'Escolha Adicionar a Tela de Inicio'],
    },
    {
      icon: 'phone',
      title: 'Android',
      desc: 'Chrome ou Edge',
      steps: ['Abra pelo link online', 'Toque em Instalar neste dispositivo', 'O app aparece na tela inicial'],
    },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal install-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="modal-title">Baixar app CARVION</div>
            <div className="modal-sub">Instale no Mac, Windows, iPhone ou Android</div>
          </div>
          <div className="spacer" />
          <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={onClose} aria-label="Fechar"><Icon name="x" size={14} /></button>
        </div>
        <div className="modal-body">
          <div className="install-callout">
            <Icon name="download" size={18} />
            <div>
              <strong>{canPrompt ? 'Instalacao pronta neste navegador' : 'Abra por localhost, HTTPS ou pelo dominio publicado'}</strong>
              <span>{canPrompt ? 'Clique abaixo para baixar o app como aplicativo.' : 'Em file:// o navegador bloqueia instalacao PWA; use http://localhost ou o site publicado.'}</span>
            </div>
          </div>
          <button className="btn btn-primary install-main-btn" onClick={onInstall}>
            <Icon name="download" size={15} /> Instalar neste dispositivo
          </button>
          <div className="install-grid">
            {platforms.map((p) => (
              <div className="install-card" key={p.title}>
                <div className="install-card-head">
                  <span className="install-icon"><Icon name={p.icon} size={17} /></span>
                  <div>
                    <strong>{p.title}</strong>
                    <small>{p.desc}</small>
                  </div>
                </div>
                <ol>
                  {p.steps.map((step) => <li key={step}>{step}</li>)}
                </ol>
              </div>
            ))}
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
};

/* ===== ORDER DETAIL VIEW ===== */
const OrderDetailView = ({ order, company, statusConfig, onBack, onEdit }) => {
  const status = statusConfig[order.status] || statusConfig.pendente;
  const printOrder = () => {
    document.body.classList.add('order-printing');
    setTimeout(() => { window.print(); setTimeout(() => document.body.classList.remove('order-printing'), 500); }, 50);
  };
  const sendWhatsApp = () => {
    const phone = (order.client?.phone || '').replace(/\D/g, '');
    const text = [`Pedido #${order.number} — ${order.client?.name}`, `Itens: ${(order.items || []).map((i) => `${i.qty}x ${i.name}`).join(', ')}`, `Total: ${fmtBRL(order.total)}`, `Pagamento: ${order.payment}`, order.due ? `Entrega prevista: ${new Date(order.due + 'T12:00').toLocaleDateString('pt-BR')}` : ''].filter(Boolean).join('\n');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  };
  const fmtD = (d) => d ? new Date(d + 'T12:00').toLocaleDateString('pt-BR') : '—';
  const now = new Date().toLocaleDateString('pt-BR');
  return (
    <div className="order-detail-wrap">
      <div className="order-controls no-print">
        <button className="btn" onClick={onBack}><Icon name="chevron-right" size={13} style={{ transform: 'rotate(180deg)' }} /> Voltar à lista</button>
        <span className={'status-pill ' + status.cls} style={{ marginLeft: 8 }}>{status.label}</span>
        <div style={{ flex: 1 }} />
        <button className="btn" onClick={sendWhatsApp}><Icon name="message" size={13} /> WhatsApp</button>
        <button className="btn" onClick={onEdit}><Icon name="settings" size={13} /> Editar</button>
        <button className="btn btn-primary" onClick={printOrder}><Icon name="file" size={13} /> Exportar PDF</button>
      </div>
      <div className="order-doc" id="order-doc">
        <div className="order-doc-head">
          <div className="order-doc-company-info">
            {company.logo ? <img src={company.logo} className="order-doc-logo-img" alt="Logo" /> : <div className="brand-mark order-doc-logo-mark">CR</div>}
            <div className="order-doc-company-text">
              <strong>{company.legalName || company.tradeName || 'CARVION INDUSTRIA'}</strong>
              {company.cnpj && <span>CNPJ {company.cnpj}{company.stateRegistration ? ` · IE ${company.stateRegistration}` : ''}</span>}
              {company.address && <span>{company.address}</span>}
              {(company.city || company.state) && <span>{[company.city, company.state].filter(Boolean).join(' — ')}</span>}
              {(company.phone || company.email) && <span>{[company.phone, company.email].filter(Boolean).join(' · ')}</span>}
            </div>
          </div>
          <div className="order-doc-id-block">
            <div className="order-doc-type-label">PEDIDO DE VENDA</div>
            <div className="order-doc-number-big">Nº {order.number}</div>
            <div className="order-doc-issued">Emitido em {now}</div>
            <span className={'status-pill ' + status.cls}>{status.label}</span>
          </div>
        </div>
        <div className="order-doc-hr" />
        <div className="order-doc-meta-row">
          <div className="order-doc-meta-item"><span>Data do pedido</span><strong>{fmtD(order.date)}</strong></div>
          <div className="order-doc-meta-item"><span>Prev. de entrega</span><strong>{fmtD(order.due)}</strong></div>
          <div className="order-doc-meta-item"><span>Forma de pagamento</span><strong>{order.payment || '—'}</strong></div>
          <div className="order-doc-meta-item"><span>Total de itens</span><strong>{(order.items || []).length} {(order.items || []).length === 1 ? 'item' : 'itens'}</strong></div>
        </div>
        <div className="order-doc-hr" />
        <div className="order-doc-section">
          <div className="order-doc-section-title">DESTINATÁRIO / CLIENTE</div>
          <div className="order-doc-client-grid">
            <div>
              <div className="order-doc-client-name">{order.client?.name || '—'}</div>
              {order.client?.cnpj && <div className="order-doc-client-detail">CNPJ / CPF: {order.client.cnpj}</div>}
              {order.client?.address && <div className="order-doc-client-detail">{order.client.address}</div>}
              {(order.client?.city || order.client?.state) && <div className="order-doc-client-detail">{[order.client.city, order.client.state].filter(Boolean).join(' — ')}</div>}
            </div>
            <div>
              {order.client?.phone && <div className="order-doc-client-detail">Tel / WhatsApp: {order.client.phone}</div>}
              {order.client?.email && <div className="order-doc-client-detail">E-mail: {order.client.email}</div>}
            </div>
          </div>
        </div>
        <div className="order-doc-hr" />
        <div className="order-doc-section">
          <div className="order-doc-section-title">ITENS DO PEDIDO</div>
          <table className="order-doc-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>#</th>
                <th>Descrição do Produto / Serviço</th>
                <th style={{ width: 100 }}>Código / SKU</th>
                <th style={{ width: 60, textAlign: 'center' }}>Qtd</th>
                <th style={{ width: 110, textAlign: 'right' }}>Vlr. Unit.</th>
                <th style={{ width: 120, textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {(order.items || []).map((item, i) => (
                <tr key={i}>
                  <td className="order-doc-table-num">{String(i + 1).padStart(2, '0')}</td>
                  <td><div className="order-doc-item-name">{item.name}</div></td>
                  <td className="order-doc-table-code">{item.code || '—'}</td>
                  <td className="order-doc-table-center">{item.qty}</td>
                  <td className="order-doc-table-right">{fmtBRL(item.unit)}</td>
                  <td className="order-doc-table-right order-doc-table-bold">{fmtBRL(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="order-doc-bottom">
          <div className="order-doc-obs">
            <div className="order-doc-section-title" style={{ marginBottom: 8 }}>OBSERVAÇÕES / CONDIÇÕES</div>
            <p>{order.obs || 'Nenhuma observação registrada.'}</p>
            <div style={{ marginTop: 14 }}>
              <div className="order-doc-section-title" style={{ marginBottom: 6 }}>CONDIÇÕES DE PAGAMENTO</div>
              <p>{order.payment}{order.due ? ` — entrega prevista para ${fmtD(order.due)}` : ''}.</p>
            </div>
          </div>
          <div className="order-doc-totals-block">
            <div className="order-doc-total-row"><span>Subtotal</span><span>{fmtBRL(order.subtotal)}</span></div>
            {order.discount > 0 && <div className="order-doc-total-row"><span>Desconto</span><span style={{ color: 'var(--danger)' }}>–{fmtBRL(order.discount)}</span></div>}
            <div className="order-doc-total-row order-doc-total-row-big"><span>TOTAL</span><span>{fmtBRL(order.total)}</span></div>
          </div>
        </div>
        <div className="order-doc-hr" />
        <div className="order-doc-signatures">
          <div className="order-doc-sig"><div className="order-doc-sig-line" /><div className="order-doc-sig-name">{company.legalName || 'CARVION INDUSTRIA'}</div><div className="order-doc-sig-role">Emitente / Vendedor</div></div>
          <div className="order-doc-sig"><div className="order-doc-sig-line" /><div className="order-doc-sig-name">{order.client?.name || 'Cliente'}</div><div className="order-doc-sig-role">Comprador / Responsável</div></div>
          <div className="order-doc-sig"><div className="order-doc-sig-line" /><div className="order-doc-sig-name">_____ / _____ / _________</div><div className="order-doc-sig-role">Data de aceite</div></div>
        </div>
        <div className="order-doc-footer">
          <span>Sistema CARVION · Pedido Nº {order.number} · Gerado em {now}</span>
          <span>{(order.items || []).length} {(order.items || []).length === 1 ? 'item' : 'itens'} · {fmtBRL(order.total)}</span>
        </div>
      </div>
    </div>
  );
};

/* ===== PEDIDOS PAGE ===== */
const PedidosPage = ({ clients = [], products = [], settings }) => {
  const [view, setView] = useState('list');
  const [orders, setOrders] = useState(() => { try { return JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) || '[]'); } catch { return []; } });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [editing, setEditing] = useState(null);

  const defaultCatalog = [
    { id: 'folha-transfer-a4', name: 'Folha Transfer A4', code: 'FT-A4', price: 12.50 },
    { id: 'folha-transfer-a3', name: 'Folha Transfer A3', code: 'FT-A3', price: 18.90 },
    { id: 'tinta-sublimacao', name: 'Tinta Sublimação 100ml', code: 'TS-100', price: 45.00 },
    { id: 'camiseta-poliester', name: 'Camiseta Poliéster Branca', code: 'CS-001', price: 22.00 },
  ];
  const regCatalog = products.map((p) => ({ id: p.id, name: p.name, code: p.code || '', price: Number(p.price) || 0 }));
  const fullCatalog = [...regCatalog, ...defaultCatalog.filter((d) => !regCatalog.some((r) => r.id === d.id))];

  const makeEmpty = () => ({
    clientId: '', clientName: '',
    date: new Date().toISOString().slice(0, 10), due: '',
    payment: 'Pix', status: 'pendente', obs: '', discount: '',
    items: [],
  });
  const [form, setForm] = useState(makeEmpty);
  const [pickerCatId, setPickerCatId] = useState(() => fullCatalog[0]?.id || '');
  const [pickerQty, setPickerQty] = useState(1);
  const [pickerPrice, setPickerPrice] = useState(() => Number(fullCatalog[0]?.price) || 0);
  const [pickerName, setPickerName] = useState('');

  useEffect(() => { localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders)); }, [orders]);

  const resolvedItems = form.items.map((row) => {
    const cat = fullCatalog.find((c) => c.id === row.catalogId);
    const qty = Number(row.qty) || 0; const unit = Number(row.unit) || 0;
    return { ...row, name: cat?.name || row.name || '', code: cat?.code || row.code || '', qty, unit, total: qty * unit };
  });
  const subtotal = resolvedItems.reduce((s, r) => s + r.total, 0);
  const discountAmt = Math.max(0, Math.min(subtotal, Number(String(form.discount || '0').replace(',', '.')) || 0));
  const total = subtotal - discountAmt;

  const updateForm = (f, v) => setForm((c) => ({ ...c, [f]: v }));
  const updateItem = (id, field, value) => setForm((c) => ({
    ...c,
    items: c.items.map((row) => {
      if (row.id !== id) return row;
      return { ...row, [field]: value };
    }),
  }));
  const removeItem = (id) => setForm((c) => ({ ...c, items: c.items.filter((r) => r.id !== id) }));

  const addNewItem = () => {
    const cat = fullCatalog.find((c) => c.id === pickerCatId);
    const name = cat?.name || pickerName.trim();
    if (!name) return;
    const qty = Math.max(1, Number(pickerQty) || 1);
    const unit = Number(String(pickerPrice).replace(',', '.').replace(/[^\d.]/g, '')) || 0;
    setForm((c) => ({ ...c, items: [...c.items, { id: `i-${Date.now()}`, catalogId: cat?.id || `custom-${Date.now()}`, name, code: cat?.code || '', qty, unit }] }));
    setPickerQty(1);
  };

  const selectedClient = clients.find((c) => c.id === form.clientId) || null;

  const nextNumber = () => {
    if (!orders.length) return '000001';
    const nums = orders.map((o) => Number((o.number || '0').replace(/\D/g, '')) || 0);
    return String(Math.max(...nums) + 1).padStart(6, '0');
  };

  const saveOrder = () => {
    const clientObj = selectedClient || { name: form.clientName || 'Cliente', cnpj: '', phone: '', city: '', state: '', email: '' };
    const order = {
      id: editing || `ped-${Date.now()}`,
      number: editing ? (orders.find((o) => o.id === editing)?.number || nextNumber()) : nextNumber(),
      date: form.date, due: form.due, payment: form.payment, status: form.status, obs: form.obs,
      discount: discountAmt,
      client: { ...clientObj, id: clientObj.id || `cli-tmp-${Date.now()}` },
      items: resolvedItems.map(({ name, code, qty, unit, total: t }) => ({ name, code, qty, unit, total: t })),
      subtotal, total, issuedAt: new Date().toLocaleDateString('pt-BR'),
    };
    setOrders((c) => editing ? c.map((o) => o.id === editing ? order : o) : [order, ...c]);
    setEditing(null); setSelectedOrder(order); setView('detail');
  };

  const editOrder = (order) => {
    setEditing(order.id);
    setForm({
      clientId: order.client?.id || '', clientName: order.client?.name || '',
      date: order.date || '', due: order.due || '', payment: order.payment || 'Pix',
      status: order.status || 'pendente', obs: order.obs || '',
      discount: order.discount ? String(order.discount) : '',
      items: (order.items || []).map((item, i) => ({ id: `ie-${i}-${Date.now()}`, catalogId: `legacy-${i}`, name: item.name, code: item.code || '', qty: item.qty, unit: item.unit })),
    });
    setView('form');
  };

  const deleteOrder = (id) => { setOrders((c) => c.filter((o) => o.id !== id)); setView('list'); };

  const statusConfig = {
    pendente:    { label: 'Pendente', cls: 'status-draft' },
    processando: { label: 'Processando', cls: 'status-pending' },
    despachado:  { label: 'Despachado', cls: 'status-pending' },
    entregue:    { label: 'Entregue', cls: 'status-paid' },
    cancelado:   { label: 'Cancelado', cls: 'status-overdue' },
  };

  const filteredOrders = filterStatus === 'all' ? orders : orders.filter((o) => o.status === filterStatus);
  const totalValue = orders.reduce((s, o) => s + (o.total || 0), 0);
  const pendingCount = orders.filter((o) => o.status === 'pendente' || o.status === 'processando').length;
  const deliveredCount = orders.filter((o) => o.status === 'entregue').length;

  if (view === 'detail' && selectedOrder) {
    return <OrderDetailView order={selectedOrder} company={settings.company} statusConfig={statusConfig} onBack={() => setView('list')} onEdit={() => editOrder(selectedOrder)} />;
  }

  if (view === 'form') {
    const editNum = editing ? orders.find((o) => o.id === editing)?.number : null;
    return (
      <div className="pedidos-form-wrap">
        <div className="pedidos-form-header">
          <button className="btn" onClick={() => { setView('list'); setEditing(null); }}><Icon name="chevron-right" size={13} style={{ transform: 'rotate(180deg)' }} /> Voltar</button>
          <div><div className="card-title">{editing ? `Editar Pedido #${editNum}` : 'Novo Pedido de Venda'}</div><div className="card-sub">Preencha os dados e itens — o total é calculado automaticamente</div></div>
        </div>
        <div className="pedidos-form-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card">
              <div className="card-head"><div><div className="card-title">Cliente</div><div className="card-sub">Quem realizou o pedido</div></div></div>
              <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {clients.length > 0 && (
                  <div className="field">
                    <label>Selecionar cliente cadastrado</label>
                    <select value={form.clientId} onChange={(e) => updateForm('clientId', e.target.value)}>
                      <option value="">— digitar manualmente abaixo —</option>
                      {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                )}
                {!form.clientId && (
                  <div className="field"><label>Nome do cliente</label><input value={form.clientName} onChange={(e) => updateForm('clientName', e.target.value)} placeholder="Ex.: João da Silva / Empresa LTDA" /></div>
                )}
                {selectedClient && (
                  <div className="pedidos-client-chip"><Icon name="users" size={13} /><span>{selectedClient.name}</span>{selectedClient.phone && <span className="muted">· {selectedClient.phone}</span>}</div>
                )}
              </div>
            </div>
            <div className="card">
              <div className="card-head">
                <div>
                  <div className="card-title">Itens do pedido</div>
                  <div className="card-sub">{resolvedItems.length === 0 ? 'Adicione os produtos abaixo' : `${resolvedItems.length} produto${resolvedItems.length !== 1 ? 's' : ''} · ${fmtBRL(subtotal)}`}</div>
                </div>
              </div>
              <div style={{ padding: '0 20px' }}>
                {resolvedItems.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '24px 0 16px', color: 'var(--text-faint)', fontSize: 13 }}>
                    <Icon name="clipboard" size={22} style={{ marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                    Nenhum produto adicionado ainda
                  </div>
                )}
                {resolvedItems.length > 0 && (
                  <div className="pedidos-items-list">
                    <div className="pedidos-items-list-head">
                      <span style={{ flex: 1 }}>Produto</span>
                      <span style={{ width: 64, textAlign: 'center' }}>Qtd</span>
                      <span style={{ width: 110, textAlign: 'right' }}>Preço unit.</span>
                      <span style={{ width: 100, textAlign: 'right' }}>Total</span>
                      <span style={{ width: 28 }}></span>
                    </div>
                    {resolvedItems.map((row, idx) => (
                      <div className="pedidos-items-list-row" key={row.id}>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                          <span className="pedidos-item-idx">{idx + 1}</span>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 500, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.name}</div>
                            {row.code && <div style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>{row.code}</div>}
                          </div>
                        </div>
                        <input type="number" min="1" value={row.qty} onChange={(e) => updateItem(row.id, 'qty', e.target.value)} style={{ width: 64, textAlign: 'center' }} />
                        <div className="pedidos-unit-input" style={{ width: 110 }}>
                          <span>R$</span>
                          <input type="number" min="0" step="0.01" value={row.unit} onChange={(e) => updateItem(row.id, 'unit', e.target.value)} style={{ textAlign: 'right' }} />
                        </div>
                        <span style={{ width: 100, fontFamily: 'var(--font-mono)', textAlign: 'right', fontWeight: 600, color: 'var(--accent)', fontSize: 13 }}>{fmtBRL(row.total)}</span>
                        <button className="icon-btn" style={{ width: 28, height: 28, color: 'var(--danger)' }} onClick={() => removeItem(row.id)}>
                          <Icon name="trash" size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="pedidos-picker-box">
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--accent)', fontWeight: 600, marginBottom: 10 }}>
                    <Icon name="plus" size={11} /> Adicionar produto ao pedido
                  </div>
                  <div className="pedidos-picker-row">
                    {fullCatalog.length > 0 ? (
                      <div className="field" style={{ flex: 3, marginBottom: 0 }}>
                        <label>Produto do catálogo</label>
                        <select value={pickerCatId} onChange={(e) => {
                          const cat = fullCatalog.find((c) => c.id === e.target.value);
                          setPickerCatId(e.target.value);
                          if (cat) setPickerPrice(cat.price);
                        }}>
                          {fullCatalog.map((c) => <option key={c.id} value={c.id}>{c.name}{c.code ? ` — ${c.code}` : ''}</option>)}
                        </select>
                      </div>
                    ) : (
                      <div className="field" style={{ flex: 3, marginBottom: 0 }}>
                        <label>Nome do produto</label>
                        <input value={pickerName} onChange={(e) => setPickerName(e.target.value)} placeholder="Ex.: Folha Transfer A4" />
                      </div>
                    )}
                    <div className="field" style={{ width: 70, marginBottom: 0 }}>
                      <label>Qtd</label>
                      <input type="number" min="1" value={pickerQty} onChange={(e) => setPickerQty(e.target.value)} style={{ textAlign: 'center' }} />
                    </div>
                    <div className="field" style={{ width: 120, marginBottom: 0 }}>
                      <label>Preço unit. (R$)</label>
                      <input type="number" min="0" step="0.01" value={pickerPrice} onChange={(e) => setPickerPrice(e.target.value)} style={{ textAlign: 'right' }} />
                    </div>
                    <button className="btn btn-primary" style={{ alignSelf: 'flex-end', whiteSpace: 'nowrap', height: 36 }} onClick={addNewItem}>
                      <Icon name="plus" size={13} /> Adicionar
                    </button>
                  </div>
                  {pickerCatId && fullCatalog.find((c) => c.id === pickerCatId) && (
                    <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-faint)' }}>
                      Total: <strong style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{fmtBRL((Number(pickerQty) || 1) * (Number(String(pickerPrice).replace(',', '.')) || 0))}</strong>
                    </div>
                  )}
                </div>
              </div>
              <div className="pedidos-totals-bar">
                <div><span>Subtotal</span><strong style={{ fontFamily: 'var(--font-mono)' }}>{fmtBRL(subtotal)}</strong></div>
                <div><span>Desconto (R$)</span><input type="number" min="0" step="0.01" value={form.discount} onChange={(e) => updateForm('discount', e.target.value)} placeholder="0,00" style={{ width: 90, textAlign: 'right', fontFamily: 'var(--font-mono)' }} /></div>
                <div className="pedidos-total-final"><span>TOTAL</span><strong style={{ fontFamily: 'var(--font-mono)', fontSize: 18, color: 'var(--accent)' }}>{fmtBRL(total)}</strong></div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card">
              <div className="card-head"><div><div className="card-title">Detalhes</div><div className="card-sub">Datas, pagamento e status</div></div></div>
              <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="field-row">
                  <div className="field"><label>Data do pedido</label><input type="date" value={form.date} onChange={(e) => updateForm('date', e.target.value)} /></div>
                  <div className="field"><label>Previsão de entrega</label><input type="date" value={form.due} onChange={(e) => updateForm('due', e.target.value)} /></div>
                </div>
                <div className="field"><label>Forma de pagamento</label><select value={form.payment} onChange={(e) => updateForm('payment', e.target.value)}><option>Pix</option><option>Boleto bancário</option><option>Cartão de crédito</option><option>Cartão de débito</option><option>Dinheiro</option><option>Transferência bancária</option><option>Cheque</option></select></div>
                <div className="field"><label>Status do pedido</label><select value={form.status} onChange={(e) => updateForm('status', e.target.value)}><option value="pendente">Pendente</option><option value="processando">Em processamento</option><option value="despachado">Despachado</option><option value="entregue">Entregue</option><option value="cancelado">Cancelado</option></select></div>
                <div className="field"><label>Observações</label><textarea rows="4" value={form.obs} onChange={(e) => updateForm('obs', e.target.value)} placeholder="Instruções de entrega, referências, condições especiais..." style={{ resize: 'vertical' }} /></div>
              </div>
            </div>
            <div className="card" style={{ padding: 20, background: 'var(--accent-soft)', borderColor: 'oklch(0.74 0.17 155 / 0.25)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>{fmtBRL(total)}</div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>{resolvedItems.length} {resolvedItems.length === 1 ? 'item' : 'itens'} · {form.payment}</div>
              <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                <button className="btn" style={{ flex: 1 }} onClick={() => { setView('list'); setEditing(null); }}>Cancelar</button>
                <button className="btn btn-primary" style={{ flex: 2 }} onClick={saveOrder}><Icon name="check" size={13} /> Salvar pedido</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pedidos-page">
      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        <div className="kpi"><div className="kpi-head"><Icon name="clipboard" size={14} /><span>Total de pedidos</span></div><div className="kpi-value">{orders.length}</div><div className="kpi-foot"><span className="kpi-delta up">cadastrados</span><span className="kpi-period">histórico</span></div></div>
        <div className="kpi"><div className="kpi-head"><Icon name="banknote" size={14} /><span>Valor total</span></div><div className="kpi-value"><span className="currency">R$</span>{(totalValue / 1000).toFixed(1).replace('.', ',')}k</div><div className="kpi-foot"><span className="kpi-delta up">acumulado</span><span className="kpi-period">todos os pedidos</span></div></div>
        <div className="kpi"><div className="kpi-head"><Icon name="activity" size={14} /><span>Em aberto</span></div><div className="kpi-value" style={{ color: 'oklch(0.78 0.16 75)' }}>{pendingCount}</div><div className="kpi-foot"><span className="kpi-period">pendentes + processando</span></div></div>
        <div className="kpi"><div className="kpi-head"><Icon name="check" size={14} /><span>Entregues</span></div><div className="kpi-value" style={{ color: 'var(--accent)' }}>{deliveredCount}</div><div className="kpi-foot"><span className="kpi-delta up">concluídos</span><span className="kpi-period">este período</span></div></div>
      </div>
      <div className="card">
        <div className="card-head">
          <div><div className="card-title">Pedidos de Venda</div><div className="card-sub">Registro completo de saídas e pedidos dos clientes</div></div>
          <div className="card-actions">
            <div className="segmented" style={{ flexWrap: 'wrap' }}>
              {[['all', 'Todos'], ['pendente', 'Pendentes'], ['processando', 'Processando'], ['despachado', 'Despachados'], ['entregue', 'Entregues'], ['cancelado', 'Cancelados']].map(([k, l]) => (
                <button key={k} className={filterStatus === k ? 'active' : ''} onClick={() => setFilterStatus(k)}>{l}</button>
              ))}
            </div>
            <button className="btn btn-primary" onClick={() => { setForm(makeEmpty()); setEditing(null); setView('form'); }}><Icon name="plus" size={13} /> Novo pedido</button>
          </div>
        </div>
        {filteredOrders.length === 0 ? (
          <div style={{ display: 'grid', placeItems: 'center', minHeight: 260, color: 'var(--text-faint)', textAlign: 'center', gap: 8 }}>
            <Icon name="clipboard" size={32} />
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-dim)', marginTop: 4 }}>{orders.length === 0 ? 'Nenhum pedido ainda' : 'Nenhum pedido com este filtro'}</div>
            <div style={{ fontSize: 12.5, maxWidth: 360 }}>{orders.length === 0 ? 'Crie o primeiro pedido — ele ficará registrado aqui com todos os detalhes e poderá ser exportado como PDF.' : 'Mude o filtro de status para ver outros pedidos.'}</div>
            {orders.length === 0 && <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => { setForm(makeEmpty()); setEditing(null); setView('form'); }}><Icon name="plus" size={13} /> Criar primeiro pedido</button>}
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Nº</th><th>Cliente</th><th>Itens</th><th className="text-right">Valor</th><th>Status</th><th>Data</th><th>Pagamento</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const st = statusConfig[order.status] || statusConfig.pendente;
                  return (
                    <tr key={order.id} style={{ cursor: 'pointer' }} onClick={() => { setSelectedOrder(order); setView('detail'); }}>
                      <td className="muted mono" style={{ fontSize: 12 }}>#{order.number}</td>
                      <td><div style={{ fontWeight: 500 }}>{order.client?.name || '—'}</div>{order.client?.cnpj && <div className="muted mono" style={{ fontSize: 11 }}>{order.client.cnpj}</div>}</td>
                      <td className="muted" style={{ fontSize: 12.5 }}>{(order.items || []).slice(0, 2).map((item, i) => <div key={i}>{item.qty}× {item.name}{i === 0 && (order.items || []).length > 2 ? <span> +{(order.items || []).length - 1}</span> : ''}</div>)}</td>
                      <td className="num up text-right">{fmtBRL(order.total)}</td>
                      <td><span className={'status-pill ' + st.cls}>{st.label}</span></td>
                      <td className="muted">{order.date ? new Date(order.date + 'T12:00').toLocaleDateString('pt-BR') : order.issuedAt || '—'}</td>
                      <td className="muted">{order.payment}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          <button className="icon-btn" style={{ width: 28, height: 28 }} title="Ver pedido" onClick={() => { setSelectedOrder(order); setView('detail'); }}><Icon name="file" size={13} /></button>
                          <button className="icon-btn" style={{ width: 28, height: 28 }} title="Editar" onClick={() => editOrder(order)}><Icon name="settings" size={13} /></button>
                          <button className="icon-btn" style={{ width: 28, height: 28, color: 'var(--danger)' }} title="Excluir" onClick={() => { if (window.confirm('Excluir pedido #' + order.number + '?')) deleteOrder(order.id); }}><Icon name="x" size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

/* ===== APP ROOT ===== */
const App = () => {
  const [active, setActive] = useState('dashboard');
  const [period, setPeriod] = useState('mes');
  const [showModal, setShowModal] = useState(false);
  const [createModalType, setCreateModalType] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [demoMode, setDemoMode] = useState(() => localStorage.getItem(DEMO_MODE_KEY) === '1');
  const [updateReady, setUpdateReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState(() => localStorage.getItem(SYNC_STATUS_KEY) || 'Sincronizacao Neon aguardando');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [clients, setClients] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CLIENTS_STORAGE_KEY) || '[]');
      return saved.length ? saved : (readDataBackup().clients || DEFAULT_CLIENTS);
    } catch (err) {
      return readDataBackup().clients || DEFAULT_CLIENTS;
    }
  });
  const [suppliers, setSuppliers] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SUPPLIERS_STORAGE_KEY) || '[]');
      return saved.length ? saved : (readDataBackup().suppliers || DEFAULT_SUPPLIERS);
    } catch (err) {
      return readDataBackup().suppliers || DEFAULT_SUPPLIERS;
    }
  });
  const [products, setProducts] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PRODUCTS_STORAGE_KEY) || '[]');
      return saved.length ? saved : (readDataBackup().products || []);
    } catch (err) {
      return readDataBackup().products || [];
    }
  });
  const [fixedExpenses, setFixedExpenses] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(FIXED_EXPENSES_STORAGE_KEY) || '[]');
      return saved.length ? saved : (readDataBackup().fixedExpenses || []);
    } catch (err) {
      return readDataBackup().fixedExpenses || [];
    }
  });
  const [transactions, setTransactions] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(TRANSACTIONS_STORAGE_KEY) || '[]');
      return saved.length ? saved : (readDataBackup().transactions || []);
    } catch (err) {
      return readDataBackup().transactions || [];
    }
  });
  const [settings, setSettings] = useState(() => {
    try {
      return { ...DEFAULT_SETTINGS, ...(readDataBackup().settings || {}), ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
    } catch (err) {
      return { ...DEFAULT_SETTINGS, ...(readDataBackup().settings || {}) };
    }
  });
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const currentData = useMemo(() => demoMode ? DEMO_DATA : computeRealData(transactions), [demoMode, transactions]);
  const syncDataRef = useRef({ clients, suppliers, products, fixedExpenses, transactions, settings });
  const syncNowRef = useRef(null);

  useEffect(() => {
    window.carvionHideBoot?.();
  }, []);

  useEffect(() => {
    syncDataRef.current = { clients, suppliers, products, fixedExpenses, transactions, settings };
  }, [clients, suppliers, products, fixedExpenses, transactions, settings]);

  useEffect(() => {
    localStorage.setItem(DEMO_MODE_KEY, demoMode ? '1' : '0');
  }, [demoMode]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem(SUPPLIERS_STORAGE_KEY, JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(FIXED_EXPENSES_STORAGE_KEY, JSON.stringify(fixedExpenses));
  }, [fixedExpenses]);

  useEffect(() => {
    localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    const existingNotes = (() => {
      try {
        return JSON.parse(localStorage.getItem(NFE_STORAGE_KEY) || '[]');
      } catch (err) {
        return [];
      }
    })();
    localStorage.setItem(DATA_BACKUP_KEY, JSON.stringify({
      version: APP_VERSION,
      updatedAt: new Date().toISOString(),
      clients,
      suppliers,
      products,
      fixedExpenses,
      transactions,
      settings,
      notes: existingNotes,
      orders: (() => {
        try {
          return JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) || '[]');
        } catch (err) {
          return [];
        }
      })(),
    }));
  }, [clients, suppliers, products, fixedExpenses, transactions, settings]);

  useEffect(() => {
    let cancelled = false;
    const collectLocalData = () => {
      const current = syncDataRef.current;
      return {
        version: APP_VERSION,
        updatedAt: new Date().toISOString(),
        clients: current.clients,
        suppliers: current.suppliers,
        products: current.products,
        fixedExpenses: current.fixedExpenses,
        transactions: current.transactions,
        settings: current.settings,
        notes: (() => {
        try {
          return JSON.parse(localStorage.getItem(NFE_STORAGE_KEY) || '[]');
        } catch (err) {
          return [];
        }
      })(),
        orders: (() => {
          try {
            return JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) || '[]');
          } catch (err) {
            return [];
          }
        })(),
      };
    };
    const saveRemote = async (payload) => {
      const res = await fetchSyncEndpoint('/api/sync/financeiro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
        body: JSON.stringify(payload),
      });
      return res.json();
    };
    const syncNow = async () => {
      try {
        setSyncStatus('Sincronizando com Neon...');
        const local = collectLocalData();
        const res = await fetchSyncEndpoint(`/api/sync/financeiro?t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });
        const remoteJson = await res.json();
        const remote = remoteJson.data || {};
        const merged = {
          version: APP_VERSION,
          updatedAt: new Date().toISOString(),
          clients: mergeById(remote.clients, local.clients),
          suppliers: mergeById(remote.suppliers, local.suppliers),
          products: mergeById(remote.products, local.products),
          fixedExpenses: mergeById(remote.fixedExpenses, local.fixedExpenses),
          transactions: mergeById(remote.transactions, local.transactions),
          notes: mergeById(remote.notes, local.notes),
          orders: mergeById(remote.orders, local.orders),
          settings: { ...DEFAULT_SETTINGS, ...(remote.settings || {}), ...(local.settings || {}) },
        };
        if (cancelled) return;
        const current = syncDataRef.current;
        if (JSON.stringify(current.clients) !== JSON.stringify(merged.clients)) setClients(merged.clients);
        if (JSON.stringify(current.suppliers) !== JSON.stringify(merged.suppliers)) setSuppliers(merged.suppliers);
        if (JSON.stringify(current.products) !== JSON.stringify(merged.products)) setProducts(merged.products);
        if (JSON.stringify(current.fixedExpenses) !== JSON.stringify(merged.fixedExpenses)) setFixedExpenses(merged.fixedExpenses);
        if (JSON.stringify(current.transactions) !== JSON.stringify(merged.transactions)) setTransactions(merged.transactions);
        if (JSON.stringify(current.settings) !== JSON.stringify(merged.settings)) setSettings(merged.settings);
        localStorage.setItem(NFE_STORAGE_KEY, JSON.stringify(merged.notes));
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(merged.orders));
        localStorage.setItem(DATA_BACKUP_KEY, JSON.stringify(merged));
        if (hasBusinessData(merged)) {
          await saveRemote(merged);
        }
        if (!cancelled) {
          const label = hasBusinessData(merged)
            ? `Neon sincronizado ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
            : 'Neon conectado - aguardando dados';
          setSyncStatus(label);
          localStorage.setItem(SYNC_STATUS_KEY, label);
        }
      } catch (err) {
        if (!cancelled) {
          const label = 'Neon offline - dados salvos neste dispositivo';
          setSyncStatus(label);
          localStorage.setItem(SYNC_STATUS_KEY, label);
        }
      }
    };
    syncNowRef.current = syncNow;
    syncNow();
    const timer = setInterval(syncNow, 15000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') syncNow();
    };
    window.addEventListener('online', syncNow);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener('online', syncNow);
      document.removeEventListener('visibilitychange', onVisible);
      syncNowRef.current = null;
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      syncNowRef.current?.();
    }, 900);
    return () => clearTimeout(timer);
  }, [clients, suppliers, products, fixedExpenses, transactions, settings]);

  useEffect(() => {
    document.documentElement.dataset.theme = tweaks.theme;
    document.documentElement.dataset.density = tweaks.density;
    document.documentElement.style.setProperty('--accent', ACCENT_MAP[tweaks.accent] || ACCENT_MAP.verde);
    document.documentElement.style.setProperty('--accent-soft', `color-mix(in oklch, ${ACCENT_MAP[tweaks.accent] || ACCENT_MAP.verde} 14%, transparent)`);
  }, [tweaks.theme, tweaks.accent, tweaks.density]);

  useEffect(() => {
    const onBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    const clearAppCaches = async () => {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.filter((key) => key.startsWith('carvion-')).map((key) => caches.delete(key)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((reg) => reg.update().catch(() => undefined)));
      }
    };
    const reloadFresh = (latest) => {
      const url = new URL(window.location.href);
      url.searchParams.set('carvion_v', latest);
      url.searchParams.set('carvion_t', Date.now().toString());
      window.location.replace(url.toString());
    };
    const checkForUpdate = async ({ reload = false } = {}) => {
      try {
        const res = await fetch(`./version.json?t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });
        const info = await res.json();
        const latest = info.version || APP_VERSION;
        const previous = localStorage.getItem(LAST_VERSION_KEY);
        const appCodeIsOld = latest !== APP_VERSION;
        if (!previous) {
          localStorage.setItem(LAST_VERSION_KEY, latest);
        }
        if (appCodeIsOld || latest !== previous) {
          localStorage.setItem(LAST_VERSION_KEY, latest);
          await clearAppCaches();
          if (reload || appCodeIsOld) {
            const reloadKey = `carvion_reload_${latest}`;
            const attempts = Number(sessionStorage.getItem(reloadKey) || '0');
            if (attempts < 3) {
              sessionStorage.setItem(reloadKey, String(attempts + 1));
            }
            reloadFresh(latest);
          } else {
            setUpdateReady(true);
          }
        }
      } catch (err) {
        // Offline or file:// mode: keep current version running.
      }
    };
    checkForUpdate({ reload: true });
    const timer = setInterval(() => checkForUpdate({ reload: true }), 10000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') checkForUpdate({ reload: true });
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const handleInstallApp = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      await installPrompt.userChoice.catch(() => undefined);
      setInstallPrompt(null);
      return;
    }
    setShowInstallModal(true);
  };

  const pageTitles = {
    dashboard: ['Dashboard', 'Visão geral · Abril 2026'],
    revenue: ['Receitas', 'Entradas e faturamento'],
    expenses: ['Despesas', 'Saídas e custos operacionais'],
    cashflow: ['Fluxo de Caixa', 'Movimentação financeira diária'],
    payables: ['Contas a Pagar', '23 vencimentos próximos'],
    receivables: ['Contas a Receber', '47 faturas em aberto'],
    nfe: ['Notas Fiscais', 'NF-e, NFS-e e NFC-e integradas ao financeiro'],
    pedidos: ['Pedidos de Venda', 'Registro completo de saídas e pedidos dos clientes'],
    demo: ['DEMO', 'Dados ficticios para apresentacao'],
    taxes: ['Impostos', 'DAS, IRPJ, CSLL, ICMS'],
    investments: ['Investimentos', 'Aplicações e rentabilidade'],
    clients: ['Clientes', '1.284 ativos'],
    suppliers: ['Fornecedores', 'Cadastro e contratos'],
    products: ['Produtos & Planos', 'Catálogo SaaS'],
    payroll: ['Funcionários & Folha', 'RH e folha de pagamento'],
    reports: ['Relatórios', 'DRE, balanço e exportações'],
    reconcile: ['Conciliação Bancária', 'Itaú · Bradesco · BTG · Mercado Pago'],
    settings: ['Configurações', 'Empresa, equipe e integrações'],
  };
  const [title, sub] = pageTitles[active] || ['', ''];
  const transactionSections = ['dashboard', 'revenue', 'expenses', 'cashflow', 'payables', 'receivables'];
  const createLabels = {
    dashboard: 'Nova Transacao',
    revenue: 'Nova Receita',
    expenses: 'Nova Despesa',
    cashflow: 'Novo Lancamento',
    payables: 'Conta a Pagar',
    receivables: 'Conta a Receber',
    nfe: 'Nova Nota',
    pedidos: 'Novo Pedido',
    clients: 'Novo Cliente',
    suppliers: 'Novo Fornecedor',
    products: 'Novo Produto',
    payroll: 'Novo Funcionario',
    reports: 'Novo Relatorio',
    taxes: 'Novo Imposto',
    investments: 'Novo Investimento',
    reconcile: 'Nova Conta',
  };
  const openCreateForActive = () => {
    if (transactionSections.includes(active)) {
      setShowModal(true);
      return;
    }
    if (active === 'demo' || active === 'settings' || active === 'pedidos') return;
    if (active === 'nfe') {
      setCreateModalType('nfe');
      return;
    }
    setEditingRecord(null);
    setCreateModalType(active);
  };
  const openEditRecord = (type, record) => {
    setEditingRecord(record);
    setCreateModalType(type);
  };
  const saveRegistryRecord = (type, record) => {
    const upsert = (current) => current.some((item) => item.id === record.id)
      ? current.map((item) => item.id === record.id ? record : item)
      : [...current, record];
    if (type === 'clients') {
      setClients(upsert);
    }
    if (type === 'suppliers') {
      setSuppliers(upsert);
    }
    if (type === 'products') {
      setProducts(upsert);
    }
    setEditingRecord(null);
  };
  const addLabel = createLabels[active] || 'Adicionar';

  return (
    <div className="app">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <aside className={'sidebar' + (sidebarOpen ? ' open' : '')}>
        <div className="brand">
          <div className="brand-mark">CR</div>
          <div>
            <div className="brand-name">GRUPO CA.RO</div>
            <div className="brand-sub">Financeiro</div>
          </div>
        </div>
        {NAV.map((g) => (
          <div key={g.group}>
            <div className="nav-label">{g.group}</div>
            {g.items.map((it) => (
              <button key={it.id}
                className={'nav-item' + (active === it.id ? ' active' : '')}
                onClick={() => { setActive(it.id); setSidebarOpen(false); }}>
                <Icon name={it.icon} />
                <span>{it.label}</span>
                {it.badge && <span className="nav-badge">{it.badge}</span>}
              </button>
            ))}
          </div>
        ))}
        <div className="sidebar-foot">
          <button className="user-card" onClick={() => setShowProfileModal(true)}>
            <div className="avatar">CA</div>
            <div className="user-meta">
              <div className="user-name">{settings.profile.name}</div>
              <div className="user-role">{settings.profile.role}</div>
            </div>
            <Icon name="chevron-down" size={14} />
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setSidebarOpen(true)}><Icon name="menu" size={16} /></button>
          <div>
            <div className="page-title">{title}</div>
            <div className="page-sub">{sub}</div>
          </div>
          <div className="topbar-spacer" />
          <div className="search">
            <Icon name="search" size={14} />
            <input placeholder="Buscar transações, clientes..." />
            <span className="kbd">⌘K</span>
          </div>
          <button className="icon-btn" onClick={() => setTweak('theme', tweaks.theme === 'dark' ? 'light' : 'dark')}>
            <Icon name={tweaks.theme === 'dark' ? 'sun' : 'moon'} size={15} />
          </button>
          <button className="icon-btn"><Icon name="bell" size={15} /><span className="dot" /></button>
          <button className="btn" onClick={() => setShowInstallModal(true)} aria-label="Baixar app" title="Baixar app"><Icon name="download" size={13} /><span>Baixar app</span></button>
          <button className="btn"><Icon name="export" size={13} /><span>Exportar</span></button>
          <button className="btn btn-primary" onClick={openCreateForActive}>
            <Icon name="plus" size={13} /><span>{addLabel}</span>
          </button>
        </header>

        <div className="content">
          <div className="filterbar">
            <div className="segmented">
              {[['hoje','Hoje'],['semana','Semana'],['mes','Mês'],['trimestre','Trimestre'],['ano','Ano']].map(([k, l]) => (
                <button key={k} className={period === k ? 'active' : ''} onClick={() => setPeriod(k)}>{l}</button>
              ))}
            </div>
            <span className="chip"><Icon name="calendar" size={12} /> 1 abr — 28 abr</span>
            <span className="chip">Todas as contas <Icon name="chevron-down" size={12} /></span>
            <div className="spacer" />
            <span className="chip" style={{ color: 'var(--accent)', borderColor: 'oklch(0.74 0.17 155 / 0.4)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} /> {syncStatus}
            </span>
          </div>

          {updateReady && (
            <div className="update-banner">
              <Icon name="download" size={14} />
              <span>Atualizacao aplicada. Recarregando arquivos novos do CARVION.</span>
              <button className="btn btn-primary" onClick={() => window.location.reload()}>Atualizar agora</button>
            </div>
          )}
          {active === 'dashboard' && <DashboardPage onAdd={openCreateForActive} period={period} showSecondary={tweaks.showSecondaryKpis} data={currentData} demoMode={demoMode} />}
          {active === 'demo' && <DemoPage demoMode={demoMode} onEnableDemo={() => { setDemoMode(true); setActive('dashboard'); }} onDisableDemo={() => { setDemoMode(false); setActive('dashboard'); }} />}
          {active === 'nfe' && <FiscalDocsPage clients={clients} products={products} settings={settings} setSettings={setSettings} onAddClient={(client) => setClients((current) => [...current, client])} onAddProduct={(product) => setProducts((current) => [...current, product])} />}
          {active === 'pedidos' && <PedidosPage clients={clients} products={products} settings={settings} />}
          {active === 'settings' && <SettingsPage settings={settings} setSettings={setSettings} />}
          {active !== 'dashboard' && active !== 'nfe' && active !== 'demo' && active !== 'settings' && active !== 'pedidos' && (
            <div className="card" style={{ minHeight: 400, padding: 32 }}>
              <div className="card-head">
                <div>
                  <div className="card-title">{title}</div>
                  <div className="card-sub">{sub}</div>
                </div>
                <div className="card-actions">
                  <button className="btn"><Icon name="filter" size={13} /> Filtrar</button>
                  <button className="btn btn-primary" onClick={openCreateForActive}>
                    <Icon name="plus" size={13} /> {addLabel}
                  </button>
                </div>
              </div>
              <PlaceholderForSection id={active} data={currentData} demoMode={demoMode} fixedExpenses={fixedExpenses} clients={clients} suppliers={suppliers} products={products} onEditRecord={openEditRecord} onDeleteFixedExpense={(id) => setFixedExpenses((c) => c.filter((e) => e.id !== id))} onUpdateTx={(txId, updates) => setTransactions((c) => c.map((t) => t.id === txId ? { ...t, ...updates } : t))} />
            </div>
          )}
        </div>

        <MobileTab active={active} onChange={setActive} onAdd={openCreateForActive} />
      </main>

      {showModal && <AddTxModal context={active} clients={clients} suppliers={suppliers} onSaveFixedExpense={(expense) => setFixedExpenses((current) => [expense, ...current])} onSaveTx={(tx) => setTransactions((current) => [tx, ...current])} onClose={() => setShowModal(false)} />}
      {createModalType && <CreateRecordModal type={createModalType} record={editingRecord} onSave={saveRegistryRecord} onClose={() => { setCreateModalType(null); setEditingRecord(null); }} />}
      {showInstallModal && <InstallAppModal onClose={() => setShowInstallModal(false)} onInstall={handleInstallApp} canPrompt={!!installPrompt} />}
      {showProfileModal && <ProfileModal user={settings.profile} onClose={() => setShowProfileModal(false)} onSettings={() => { setShowProfileModal(false); setActive('settings'); setSidebarOpen(false); }} />}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Tema" />
        <TweakRadio label="Modo" value={tweaks.theme}
          options={['dark', 'light']}
          onChange={(v) => setTweak('theme', v)} />
        <TweakRadio label="Cor de destaque" value={tweaks.accent}
          options={['verde', 'azul', 'roxo', 'ambar']}
          onChange={(v) => setTweak('accent', v)} />
        <TweakSection label="Layout" />
        <TweakRadio label="Densidade" value={tweaks.density}
          options={['compacto', 'confortavel']}
          onChange={(v) => setTweak('density', v)} />
        <TweakToggle label="KPIs secundários" value={tweaks.showSecondaryKpis}
          onChange={(v) => setTweak('showSecondaryKpis', v)} />
      </TweaksPanel>
    </div>
  );
};

/* contextual content for each section */
const PlaceholderForSection = ({ id, data = ZERO_DATA, demoMode = false, fixedExpenses = [], clients = [], suppliers = [], products = [], onEditRecord, onDeleteFixedExpense, onUpdateTx }) => {
  const txUpdater = demoMode ? undefined : onUpdateTx;
  if (id === 'cashflow' || id === 'revenue' || id === 'expenses') {
    return (
      <>
        {id === 'expenses' && <FixedExpensesPanel expenses={fixedExpenses} onDelete={onDeleteFixedExpense} />}
        <RevenueExpenseChart data={data.revExp} height={300} />
        <div style={{ marginTop: 16 }}>
          <TransactionsTable rows={data.transactions.filter((t) => id === 'cashflow' || (id === 'revenue' ? t.type === 'in' : t.type === 'out'))} onUpdateTx={txUpdater} clients={clients} suppliers={suppliers} />
        </div>
      </>
    );
  }
  if (id === 'payables' || id === 'receivables') {
    const rows = data.transactions.filter((t) => id === 'receivables' ? t.type === 'in' : t.type === 'out');
    const today = new Date();
    const outstanding = (r) => r.status === 'partial' ? (r.amountRemaining || 0) : (r.amount || 0);
    const dueSoon = (days) => rows.filter((r) => {
      if (!r.due) return false;
      const parts = r.due.split('/');
      if (parts.length !== 3) return false;
      const d = new Date(parts[2], parts[1] - 1, parts[0]);
      const diff = Math.ceil((d - today) / 86400000);
      return diff >= 0 && diff <= days;
    });
    return (
      <>
        <div className="venc-strip">
          {[[15, 'var(--accent)'], [20, 'oklch(0.72 0.13 230)'], [28, 'oklch(0.78 0.16 75)'], [30, 'var(--danger)']].map(([days, color]) => (
            <div key={days} className="venc-card" style={{ borderTopColor: color }}>
              <div className="venc-label">Vence em {days} dias</div>
              <div className="venc-count" style={{ color }}>{dueSoon(days).length}</div>
              <div className="venc-amt">{fmtBRL(dueSoon(days).reduce((s, r) => s + outstanding(r), 0))}</div>
            </div>
          ))}
        </div>
        <TransactionsTable rows={rows} onUpdateTx={txUpdater} clients={clients} suppliers={suppliers} />
      </>
    );
  }
  if (id === 'clients') {
    return <RegistryList title="Cliente" emptyText="Nenhum cliente cadastrado" rows={clients} icon="users" type="clients" onEdit={onEditRecord} />;
  }
  if (id === 'suppliers') {
    return <RegistryList title="Fornecedor" emptyText="Nenhum fornecedor cadastrado" rows={suppliers} icon="truck" type="suppliers" onEdit={onEditRecord} />;
  }
  if (id === 'products') {
    return <RegistryList title="Produto" emptyText="Nenhum produto cadastrado" rows={products} icon="box" type="products" onEdit={onEditRecord} />;
  }
  if (id === 'reconcile') {
    return (
      <div className="row-3" style={{ marginTop: 12 }}>
        {data.accounts.length === 0 && (
          <div className="card empty-card">
            <Icon name="wallet" size={24} />
            <strong>Nenhuma conta para conciliar</strong>
            <span>O sistema real esta zerado. Ative DEMO para visualizar exemplos ficticios.</span>
          </div>
        )}
        {data.accounts.map((a, i) => (
          <div key={i} style={{ padding: 16, border: '1px solid var(--border-soft)', borderRadius: 12, background: 'var(--bg-elev)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: a.color, display: 'grid', placeItems: 'center', color: 'white', fontWeight: 700, fontSize: 11 }}>{a.logo}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>{a.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{a.branch}</div>
              </div>
              <span className="status-pill status-paid">conciliado</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 600 }}>{fmtBRL(a.balance)}</div>
            <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4 }}>Última sinc.: há 2 min</div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: 280, color: 'var(--text-faint)', textAlign: 'center', gap: 6 }}>
      <Icon name="box" size={28} />
      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-dim)', marginTop: 8 }}>Módulo em construção</div>
      <div style={{ fontSize: 12.5, maxWidth: 360 }}>Esta seção está disponível na navegação. O conteúdo segue o mesmo padrão visual do dashboard.</div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
