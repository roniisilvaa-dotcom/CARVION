/* CARVION — mock data + icons */

const fmtBRL = (n, opts = {}) => {
  const { compact = false, sign = false } = opts;
  if (compact && Math.abs(n) >= 1000) {
    if (Math.abs(n) >= 1_000_000) return (sign && n > 0 ? '+' : '') + 'R$ ' + (n / 1_000_000).toFixed(2).replace('.', ',') + 'M';
    return (sign && n > 0 ? '+' : '') + 'R$ ' + (n / 1000).toFixed(1).replace('.', ',') + 'k';
  }
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
};
const fmtNum = (n) => new Intl.NumberFormat('pt-BR').format(n);
const fmtPct = (n) => (n > 0 ? '+' : '') + n.toFixed(1).replace('.', ',') + '%';

/* sparkline data — 12 points each */
const sparkline = (seed, trend = 1) => {
  let v = 50;
  const out = [];
  for (let i = 0; i < 12; i++) {
    v += (Math.sin(seed + i * 0.7) * 6) + trend * (i / 4);
    out.push(Math.max(10, v));
  }
  return out;
};

const KPIS = [
  {
    id: 'daily-production',
    label: 'Bolas Produzidas',
    icon: 'box',
    value: 0,
    delta: 0,
    period: 'mês atual',
    color: 'var(--accent)',
    spark: Array(12).fill(0),
  },
  {
    id: 'unit-cost',
    label: 'Custo Médio / Bola',
    icon: 'banknote',
    value: 0,
    delta: 0,
    period: 'vs. mês anterior',
    color: 'var(--info)',
    spark: Array(12).fill(0),
    moneyPlain: true,
    inverted: true,
  },
  {
    id: 'lot-profit',
    label: 'Lucro por Lote',
    icon: 'trending-up',
    value: 0,
    delta: 0,
    period: 'lotes finalizados',
    color: 'var(--purple)',
    spark: Array(12).fill(0),
  },
  {
    id: 'efficiency',
    label: 'Eficiência da Fábrica',
    icon: 'percent',
    value: 0,
    isPct: true,
    delta: 0,
    period: 'corte · costura · montagem',
    color: 'var(--warn)',
    spark: Array(12).fill(0),
  },
];

const SECONDARY_KPIS = [
  { id: 'waste', label: 'Perda de Matéria-prima', value: '0%', delta: 0, sub: 'sem perdas registradas', good: true },
  { id: 'orders', label: 'Pedidos em Aberto', value: '0', delta: 0, sub: 'nenhum pedido cadastrado' },
  { id: 'reps', label: 'Representantes Ativos', value: '0', delta: 0, sub: 'nenhum representante cadastrado' },
  { id: 'commission', label: 'Comissões do Mês', value: 'R$ 0', delta: 0, sub: 'sem comissões' },
  { id: 'stock', label: 'Produto Final', value: '0 un.', delta: 0, sub: 'sem estoque final' },
  { id: 'materials', label: 'Alertas de Insumo', value: '0', delta: 0, sub: 'sem alertas', good: true },
];

/* produção vs custo — 12 meses */
const REV_EXP = [
  { m: 'Mai/25', rev: 0, exp: 0 },
  { m: 'Jun/25', rev: 0, exp: 0 },
  { m: 'Jul/25', rev: 0, exp: 0 },
  { m: 'Ago/25', rev: 0, exp: 0 },
  { m: 'Set/25', rev: 0, exp: 0 },
  { m: 'Out/25', rev: 0, exp: 0 },
  { m: 'Nov/25', rev: 0, exp: 0 },
  { m: 'Dez/25', rev: 0, exp: 0 },
  { m: 'Jan/26', rev: 0, exp: 0 },
  { m: 'Fev/26', rev: 0, exp: 0 },
  { m: 'Mar/26', rev: 0, exp: 0 },
  { m: 'Abr/26', rev: 0, exp: 0 }
];

/* consumo de matéria-prima */
const EXPENSE_CATS = [
  { name: 'Couro sintético', value: 0, color: 'var(--accent)' },
  { name: 'Borracha', value: 0, color: 'var(--info)' },
  { name: 'Linha', value: 0, color: 'var(--purple)' },
  { name: 'Válvulas', value: 0, color: 'var(--warn)' },
  { name: 'Cola & acabamento', value: 0, color: 'oklch(0.65 0.14 340)' },
  { name: 'Perdas', value: 0, color: 'oklch(0.55 0.02 240)' },
];

/* produção por tipo de bola */
const REV_BY_PLAN = [
  { m: 'Nov', enterprise: 0, business: 0, starter: 0 },
  { m: 'Dez', enterprise: 0, business: 0, starter: 0 },
  { m: 'Jan', enterprise: 0, business: 0, starter: 0 },
  { m: 'Fev', enterprise: 0, business: 0, starter: 0 },
  { m: 'Mar', enterprise: 0, business: 0, starter: 0 },
  { m: 'Abr', enterprise: 0, business: 0, starter: 0 }
];

const TRANSACTIONS = [];

const ACCOUNTS = [];

const MATERIALS = [];

const PRODUCTION_ORDERS = [];

const REPRESENTATIVES = [];

const PRODUCTS = [
  {
    name: 'SAMBA PRO',
    brand: 'Topper',
    line: 'Pro',
    modality: 'Campo',
    type: 'Campo',
    image: 'uploads/WhatsApp Image 2026-04-28 at 17.18.38.jpeg',
    cost: 118.00,
    dealerPrice: 214.00,
    partnerPrice: 188.00,
    price: 320.00,
    stock: 120,
    margin: 63.13,
    bom: 'PU premium, câmara butílica, linha reforçada, válvula campo',
  },
  {
    name: 'FUTSAL EXTREME',
    brand: 'Kagiva',
    line: 'Pro',
    modality: 'Futsal',
    type: 'Futsal',
    image: 'uploads/WhatsApp Image 2026-04-28 at 17.18.39.jpeg',
    cost: 104.00,
    dealerPrice: 196.00,
    partnerPrice: 174.00,
    price: 289.00,
    stock: 80,
    margin: 64.01,
    bom: 'PU soft, câmara futsal, camada de amortecimento, válvula futsal',
  },
];

const CLIENTS = [];

/* heatmap fluxo de caixa — 7 colunas (semanas), 7 linhas (dias) */
const HEATMAP = Array.from({ length: 7 }, () => Array(14).fill(0));

const NAV = [
  { group: 'INDÚSTRIA', items: [
    { id: 'dashboard', label: 'Dashboard Industrial', icon: 'home' },
    { id: 'production', label: 'Ordens de Produção', icon: 'activity', badge: '0' },
    { id: 'materials', label: 'Matéria-prima', icon: 'box', badge: '0' },
    { id: 'costing', label: 'Custo por Bola', icon: 'percent' },
  ]},
  { group: 'COMERCIAL', items: [
    { id: 'sales', label: 'Vendas & Pedidos', icon: 'arrow-down-left', badge: '0' },
    { id: 'representatives', label: 'Representantes', icon: 'users', badge: '0' },
    { id: 'clients', label: 'Clientes', icon: 'briefcase' },
    { id: 'commissions', label: 'Comissões', icon: 'banknote' },
  ]},
  { group: 'ESTOQUE & PRODUTO', items: [
    { id: 'products', label: 'Produtos com Imagem', icon: 'box' },
    { id: 'finished-stock', label: 'Produto Final', icon: 'inbox' },
    { id: 'suppliers', label: 'Fornecedores', icon: 'truck' },
  ]},
  { group: 'FINANCEIRO & IA', items: [
    { id: 'cashflow', label: 'Fluxo de Caixa', icon: 'activity' },
    { id: 'payables', label: 'Contas a Pagar', icon: 'send', badge: '0' },
    { id: 'receivables', label: 'Contas a Receber', icon: 'inbox', badge: '0' },
    { id: 'analytics', label: 'Analytics Industrial', icon: 'pie' },
    { id: 'reports', label: 'Relatórios', icon: 'file' },
    { id: 'settings', label: 'Multiempresa', icon: 'settings' },
    { id: 'users-admin', label: 'Usuários', icon: 'users' },
    { id: 'sessions-admin', label: 'Sessões', icon: 'shuffle' },
    { id: 'orders-admin', label: 'Pedidos Admin', icon: 'file' },
    { id: 'audit-admin', label: 'Auditoria', icon: 'landmark' },
  ]},
];

const Icon = ({ name, size = 16 }) => {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    'home': <><path d="M3 12 12 4l9 8" /><path d="M5 10v10h14V10" /></>,
    'activity': <path d="M3 12h4l3-9 4 18 3-9h4" />,
    'shuffle': <><path d="M16 3h5v5" /><path d="M4 20 21 3" /><path d="M21 16v5h-5" /><path d="M15 15l6 6" /><path d="M4 4l5 5" /></>,
    'arrow-down-left': <><path d="M17 7 7 17" /><path d="M17 17H7V7" /></>,
    'arrow-up-right': <><path d="M7 17 17 7" /><path d="M7 7h10v10" /></>,
    'inbox': <><path d="M3 12h6l1 3h4l1-3h6" /><path d="M3 12V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6" /><path d="M3 12v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6" /></>,
    'send': <><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4 20-7Z" /></>,
    'landmark': <><path d="M3 21h18" /><path d="M3 10h18" /><path d="M5 6 12 3l7 3" /><path d="M4 10v11" /><path d="M20 10v11" /><path d="M8 14v4" /><path d="M12 14v4" /><path d="M16 14v4" /></>,
    'pie': <><path d="M21 12a9 9 0 1 1-9-9v9h9Z" /></>,
    'users': <><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3 3-5 6-5s6 2 6 5" /><circle cx="17" cy="9" r="2.5" /><path d="M21 19c0-2-2-3.5-4-3.5" /></>,
    'truck': <><path d="M3 6h12v10H3z" /><path d="M15 9h4l2 3v4h-6" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></>,
    'box': <><path d="M21 8v8l-9 5-9-5V8l9-5 9 5Z" /><path d="m3.5 7.5 8.5 5 8.5-5" /><path d="M12 12.5V21" /></>,
    'briefcase': <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" /><path d="M3 13h18" /></>,
    'file': <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" /><path d="M14 3v6h6" /></>,
    'settings': <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></>,
    'search': <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
    'bell': <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10 21a2 2 0 0 0 4 0" /></>,
    'plus': <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    'menu': <><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></>,
    'download': <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></>,
    'filter': <><path d="M3 5h18l-7 9v6l-4-2v-4Z" /></>,
    'calendar': <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4" /><path d="M16 3v4" /><path d="M3 11h18" /></>,
    'trending-up': <><path d="m3 17 6-6 4 4 7-7" /><path d="M14 8h6v6" /></>,
    'trending-down': <><path d="m3 7 6 6 4-4 7 7" /><path d="M14 16h6v-6" /></>,
    'banknote': <><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="3" /><path d="M6 10v.01" /><path d="M18 14v.01" /></>,
    'percent': <><path d="m19 5-14 14" /><circle cx="6.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /></>,
    'arrow-up': <path d="m5 12 7-7 7 7M12 19V5" />,
    'arrow-down': <path d="m19 12-7 7-7-7M12 5v14" />,
    'more': <><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></>,
    'x': <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>,
    'sun': <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
    'moon': <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />,
    'message': <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4l-5 1 1.5-4.4A8.5 8.5 0 1 1 21 11.5Z" />,
    'wallet': <><path d="M19 7H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2Z" /><path d="M16 14h2" /><path d="M19 7V5a2 2 0 0 0-2-2H6a3 3 0 0 0-3 3" /></>,
    'check': <path d="m5 12 5 5L20 7" />,
    'help': <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 4" /><path d="M12 17v.01" /></>,
    'export': <><path d="M16 16h3a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v3" /><path d="M11 11H3v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8h-4Z" /></>,
    'chevron-down': <path d="m6 9 6 6 6-6" />,
    'chevron-right': <path d="m9 6 6 6-6 6" />,
  };
  return <svg {...props}>{paths[name] || null}</svg>;
};

window.Icon = Icon;
window.fmtBRL = fmtBRL;
window.fmtNum = fmtNum;
window.fmtPct = fmtPct;
window.KPIS = KPIS;
window.SECONDARY_KPIS = SECONDARY_KPIS;
window.REV_EXP = REV_EXP;
window.EXPENSE_CATS = EXPENSE_CATS;
window.REV_BY_PLAN = REV_BY_PLAN;
window.TRANSACTIONS = TRANSACTIONS;
window.ACCOUNTS = ACCOUNTS;
window.MATERIALS = MATERIALS;
window.PRODUCTION_ORDERS = PRODUCTION_ORDERS;
window.REPRESENTATIVES = REPRESENTATIVES;
window.PRODUCTS = PRODUCTS;
window.CLIENTS = CLIENTS;
window.HEATMAP = HEATMAP;
window.NAV = NAV;
