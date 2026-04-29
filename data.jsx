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
    value: 18_740,
    delta: 14.8,
    period: 'mês atual',
    color: 'var(--accent)',
    spark: sparkline(1, 2),
  },
  {
    id: 'unit-cost',
    label: 'Custo Médio / Bola',
    icon: 'banknote',
    value: 22.84,
    delta: -6.3,
    period: 'vs. mês anterior',
    color: 'var(--info)',
    spark: sparkline(2, -0.5),
    moneyPlain: true,
    inverted: true,
  },
  {
    id: 'lot-profit',
    label: 'Lucro por Lote',
    icon: 'trending-up',
    value: 384_900,
    delta: 21.7,
    period: 'lotes finalizados',
    color: 'var(--purple)',
    spark: sparkline(3, 2.5),
  },
  {
    id: 'efficiency',
    label: 'Eficiência da Fábrica',
    icon: 'percent',
    value: 87.6,
    isPct: true,
    delta: 5.4,
    period: 'corte · costura · montagem',
    color: 'var(--warn)',
    spark: sparkline(4, 1.2),
  },
];

const SECONDARY_KPIS = [
  { id: 'waste', label: 'Perda de Matéria-prima', value: '3,8%', delta: -1.6, sub: 'meta máxima 5%', good: true },
  { id: 'orders', label: 'Pedidos em Aberto', value: '42', delta: 9.3, sub: '18 com OP vinculada' },
  { id: 'reps', label: 'Representantes Ativos', value: '16', delta: 12.5, sub: '4 regiões comerciais' },
  { id: 'commission', label: 'Comissões do Mês', value: 'R$ 74.280', delta: 8.4, sub: 'média 4,2% por pedido' },
  { id: 'stock', label: 'Produto Final', value: '8.420 un.', delta: 6.8, sub: 'por lote e modelo' },
  { id: 'materials', label: 'Alertas de Insumo', value: '7', delta: -2.1, sub: 'couro, válvula e linha', good: true },
];

/* produção vs custo — 12 meses */
const REV_EXP = [
  { m: 'Mai/25', rev: 9_800, exp: 238_000 },
  { m: 'Jun/25', rev: 10_600, exp: 246_000 },
  { m: 'Jul/25', rev: 9_920, exp: 232_000 },
  { m: 'Ago/25', rev: 12_400, exp: 274_000 },
  { m: 'Set/25', rev: 13_200, exp: 288_000 },
  { m: 'Out/25', rev: 14_800, exp: 321_000 },
  { m: 'Nov/25', rev: 16_100, exp: 346_000 },
  { m: 'Dez/25', rev: 15_400, exp: 338_000 },
  { m: 'Jan/26', rev: 13_900, exp: 302_000 },
  { m: 'Fev/26', rev: 15_700, exp: 334_000 },
  { m: 'Mar/26', rev: 17_850, exp: 392_000 },
  { m: 'Abr/26', rev: 18_740, exp: 428_000 },
];

/* consumo de matéria-prima */
const EXPENSE_CATS = [
  { name: 'Couro sintético', value: 184_000, color: 'var(--accent)' },
  { name: 'Borracha', value: 96_000, color: 'var(--info)' },
  { name: 'Linha', value: 38_000, color: 'var(--purple)' },
  { name: 'Válvulas', value: 52_000, color: 'var(--warn)' },
  { name: 'Cola & acabamento', value: 34_000, color: 'oklch(0.65 0.14 340)' },
  { name: 'Perdas', value: 24_000, color: 'oklch(0.55 0.02 240)' },
];

/* produção por tipo de bola */
const REV_BY_PLAN = [
  { m: 'Nov', enterprise: 6_200, business: 3_850, starter: 2_400 },
  { m: 'Dez', enterprise: 5_900, business: 4_100, starter: 2_650 },
  { m: 'Jan', enterprise: 5_100, business: 3_600, starter: 2_200 },
  { m: 'Fev', enterprise: 6_450, business: 4_200, starter: 2_880 },
  { m: 'Mar', enterprise: 7_300, business: 4_950, starter: 3_100 },
  { m: 'Abr', enterprise: 7_850, business: 5_240, starter: 3_420 },
];

const TRANSACTIONS = [
  { id: 'PED-8421', date: '28 Abr', client: 'Esporte Mania Atacado', plan: 'Futebol Pró 5', amount: 184_000, type: 'in', status: 'paid', method: 'Rep. Marcos · SP' },
  { id: 'PED-8420', date: '28 Abr', client: 'Arena Sul Distribuidora', plan: 'Vôlei Indoor', amount: 92_400, type: 'in', status: 'pending', method: 'Rep. Camila · Sul' },
  { id: 'MP-2839', date: '28 Abr', client: 'Couro sintético premium', plan: 'Matéria-prima', amount: 41_280, type: 'out', status: 'paid', method: 'Fornecedor TexBall' },
  { id: 'PED-8418', date: '27 Abr', client: 'Rede Gol de Placa', plan: 'Futebol Society', amount: 126_100, type: 'in', status: 'pending', method: 'Rep. Diego · NE' },
  { id: 'OP-7712', date: '27 Abr', client: 'Folha produção costura', plan: 'Mão de obra', amount: 58_000, type: 'out', status: 'paid', method: 'Peça produzida' },
  { id: 'PED-8416', date: '26 Abr', client: 'Quadra Livre Ltda', plan: 'Basquete Street', amount: 76_500, type: 'in', status: 'paid', method: 'Rep. Renata · CO' },
  { id: 'COM-0931', date: '26 Abr', client: 'Comissões comerciais', plan: 'Representantes', amount: 19_740, type: 'out', status: 'pending', method: 'Fechamento mensal' },
  { id: 'FIX-0412', date: '25 Abr', client: 'Energia + manutenção', plan: 'Custo fixo', amount: 37_820, type: 'out', status: 'paid', method: 'Rateio industrial' },
  { id: 'PED-8412', date: '25 Abr', client: 'Viva Sport Center', plan: 'Futsal Pro', amount: 48_900, type: 'in', status: 'paid', method: 'Rep. Luana · MG' },
];

const ACCOUNTS = [
  { name: 'Linha Futebol Pró 5', branch: 'OPs 7701-7718 · 7.850 un.', balance: 384_900, color: 'oklch(0.78 0.16 75)', logo: 'FP' },
  { name: 'Linha Vôlei Indoor', branch: 'OPs 7682-7700 · 5.240 un.', balance: 186_400, color: 'oklch(0.65 0.20 25)', logo: 'VI' },
  { name: 'Linha Basquete Street', branch: 'OPs 7650-7681 · 3.420 un.', balance: 148_300, color: 'oklch(0.30 0.02 240)', logo: 'BS' },
  { name: 'Linha Futsal Pro', balance: 92_980, branch: 'OPs 7620-7649 · 2.230 un.', color: 'oklch(0.72 0.13 230)', logo: 'FS' },
];

const MATERIALS = [
  { sku: 'MAT-001', name: 'Couro sintético PU 1.4mm', unit: 'm²', stock: 1280, min: 1500, cost: 28.4, status: 'overdue' },
  { sku: 'MAT-002', name: 'Borracha butílica câmara', unit: 'kg', stock: 840, min: 600, cost: 16.9, status: 'paid' },
  { sku: 'MAT-003', name: 'Linha poliéster alta resistência', unit: 'rolo', stock: 74, min: 90, cost: 42.5, status: 'pending' },
  { sku: 'MAT-004', name: 'Válvula esportiva universal', unit: 'un.', stock: 4200, min: 5000, cost: 0.82, status: 'overdue' },
  { sku: 'MAT-005', name: 'Cola PU acabamento', unit: 'kg', stock: 210, min: 120, cost: 31.7, status: 'paid' },
];

const PRODUCTION_ORDERS = [
  { id: 'OP-7718', product: 'Futebol Pró 5', qty: 1200, status: 'Em produção', stage: 'Costura', estimated: 27_800, real: 28_460, margin: 38.4 },
  { id: 'OP-7717', product: 'Vôlei Indoor', qty: 800, status: 'Planejado', stage: 'Corte', estimated: 18_900, real: 0, margin: 34.2 },
  { id: 'OP-7716', product: 'Basquete Street', qty: 650, status: 'Finalizado', stage: 'Acabamento', estimated: 21_100, real: 20_780, margin: 41.8 },
  { id: 'OP-7715', product: 'Futsal Pro', qty: 500, status: 'Em produção', stage: 'Montagem', estimated: 11_400, real: 12_020, margin: 29.6 },
];

const REPRESENTATIVES = [
  { id: 'REP-01', name: 'Marcos Almeida', region: 'São Paulo', sales: 428_000, goal: 500_000, commission: 17_120, orders: 14, status: 'paid' },
  { id: 'REP-02', name: 'Camila Torres', region: 'Sul', sales: 312_400, goal: 360_000, commission: 12_496, orders: 11, status: 'pending' },
  { id: 'REP-03', name: 'Diego Barros', region: 'Nordeste', sales: 286_100, goal: 300_000, commission: 11_444, orders: 9, status: 'paid' },
  { id: 'REP-04', name: 'Renata Nunes', region: 'Centro-Oeste', sales: 176_500, goal: 240_000, commission: 7_060, orders: 6, status: 'overdue' },
  { id: 'REP-05', name: 'Luana Prado', region: 'Minas Gerais', sales: 148_900, goal: 180_000, commission: 5_956, orders: 5, status: 'pending' },
];

const PRODUCTS = [
  { name: 'Futebol Pró 5', type: 'Futebol', image: 'uploads/WhatsApp Image 2026-04-28 at 17.18.38.jpeg', price: 74.9, cost: 22.6, stock: 3420, margin: 69.8, bom: 'PU, câmara, linha, válvula' },
  { name: 'Vôlei Indoor', type: 'Vôlei', image: 'uploads/WhatsApp Image 2026-04-28 at 17.18.39.jpeg', price: 69.9, cost: 24.1, stock: 2180, margin: 65.5, bom: 'PU soft, câmara leve, cola, válvula' },
  { name: 'Basquete Street', type: 'Basquete', image: 'uploads/WhatsApp Image 2026-04-28 at 17.18.39 (1).jpeg', price: 89.9, cost: 31.4, stock: 1640, margin: 65.1, bom: 'Borracha texturizada, câmara, válvula' },
];

const CLIENTS = [
  { name: 'Esporte Mania Atacado', city: 'São Paulo/SP', segment: 'Atacado', revenue: 684_000, rep: 'Marcos Almeida' },
  { name: 'Arena Sul Distribuidora', city: 'Curitiba/PR', segment: 'Distribuidor', revenue: 392_400, rep: 'Camila Torres' },
  { name: 'Rede Gol de Placa', city: 'Recife/PE', segment: 'Varejo regional', revenue: 326_100, rep: 'Diego Barros' },
  { name: 'Quadra Livre Ltda', city: 'Campo Grande/MS', segment: 'Escolas', revenue: 176_500, rep: 'Renata Nunes' },
];

/* heatmap fluxo de caixa — 7 colunas (semanas), 7 linhas (dias) */
const HEATMAP = (() => {
  const grid = [];
  for (let r = 0; r < 7; r++) {
    const row = [];
    for (let c = 0; c < 14; c++) {
      const v = Math.sin(r * 0.6 + c * 0.4) * 0.5 + 0.5 + (Math.random() * 0.3);
      row.push(Math.max(0, Math.min(1, v)));
    }
    grid.push(row);
  }
  return grid;
})();

const NAV = [
  { group: 'INDÚSTRIA', items: [
    { id: 'dashboard', label: 'Dashboard Industrial', icon: 'home' },
    { id: 'production', label: 'Ordens de Produção', icon: 'activity', badge: '18' },
    { id: 'materials', label: 'Matéria-prima', icon: 'box', badge: '7' },
    { id: 'costing', label: 'Custo por Bola', icon: 'percent' },
  ]},
  { group: 'COMERCIAL', items: [
    { id: 'sales', label: 'Vendas & Pedidos', icon: 'arrow-down-left', badge: '42' },
    { id: 'representatives', label: 'Representantes', icon: 'users', badge: '16' },
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
    { id: 'payables', label: 'Contas a Pagar', icon: 'send', badge: '23' },
    { id: 'receivables', label: 'Contas a Receber', icon: 'inbox', badge: '47' },
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
