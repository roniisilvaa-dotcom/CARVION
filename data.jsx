/* GRUPO CA.RO — mock data + icons */

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
    id: 'revenue',
    label: 'Receita Total',
    icon: 'trending-up',
    value: 4_823_400,
    delta: 18.4,
    period: 'vs. mês anterior',
    color: 'var(--accent)',
    spark: sparkline(1, 2),
  },
  {
    id: 'expenses',
    label: 'Despesas Totais',
    icon: 'trending-down',
    value: 2_148_900,
    delta: -3.2,
    period: 'vs. mês anterior',
    color: 'var(--danger)',
    spark: sparkline(2, -0.5),
    inverted: true,
  },
  {
    id: 'profit',
    label: 'Lucro Líquido',
    icon: 'banknote',
    value: 2_674_500,
    delta: 24.7,
    period: 'vs. mês anterior',
    color: 'var(--info)',
    spark: sparkline(3, 2.5),
  },
  {
    id: 'margin',
    label: 'Margem de Lucro',
    icon: 'percent',
    value: 55.4,
    isPct: true,
    delta: 4.1,
    period: 'vs. mês anterior',
    color: 'var(--purple)',
    spark: sparkline(4, 1.2),
  },
];

const SECONDARY_KPIS = [
  { id: 'ticket', label: 'Ticket Médio', value: 'R$ 2.847', delta: 6.2, sub: '1.694 transações' },
  { id: 'pay', label: 'Contas a Pagar', value: 'R$ 412.850', delta: -8.1, sub: '23 vencimentos próximos' },
  { id: 'rec', label: 'Contas a Receber', value: 'R$ 1.284.300', delta: 12.4, sub: '47 faturas em aberto' },
  { id: 'cash', label: 'Saldo em Conta', value: 'R$ 3.652.180', delta: 9.8, sub: '4 contas bancárias' },
  { id: 'clients', label: 'Clientes Ativos', value: '1.284', delta: 4.7, sub: '38 novos este mês' },
  { id: 'default', label: 'Inadimplência', value: '2,4%', delta: -1.1, sub: 'R$ 31.200 em atraso', good: true },
];

/* receita vs despesa — 12 meses */
const REV_EXP = [
  { m: 'Mai/25', rev: 2_840_000, exp: 1_650_000 },
  { m: 'Jun/25', rev: 3_120_000, exp: 1_720_000 },
  { m: 'Jul/25', rev: 2_980_000, exp: 1_810_000 },
  { m: 'Ago/25', rev: 3_450_000, exp: 1_780_000 },
  { m: 'Set/25', rev: 3_280_000, exp: 1_920_000 },
  { m: 'Out/25', rev: 3_710_000, exp: 1_890_000 },
  { m: 'Nov/25', rev: 3_920_000, exp: 2_050_000 },
  { m: 'Dez/25', rev: 4_280_000, exp: 2_180_000 },
  { m: 'Jan/26', rev: 3_890_000, exp: 2_010_000 },
  { m: 'Fev/26', rev: 4_120_000, exp: 2_080_000 },
  { m: 'Mar/26', rev: 4_410_000, exp: 2_140_000 },
  { m: 'Abr/26', rev: 4_823_400, exp: 2_148_900 },
];

/* despesas por categoria */
const EXPENSE_CATS = [
  { name: 'Folha & RH', value: 842_000, color: 'var(--accent)' },
  { name: 'Infra & Cloud', value: 412_000, color: 'var(--info)' },
  { name: 'Marketing', value: 386_000, color: 'var(--purple)' },
  { name: 'Operacional', value: 248_000, color: 'var(--warn)' },
  { name: 'Impostos', value: 184_000, color: 'oklch(0.65 0.14 340)' },
  { name: 'Outros', value: 76_900, color: 'oklch(0.55 0.02 240)' },
];

/* receita por produto/plano (área empilhada simulada com barras) */
const REV_BY_PLAN = [
  { m: 'Nov', enterprise: 1_820, business: 1_240, starter: 860 },
  { m: 'Dez', enterprise: 2_080, business: 1_320, starter: 880 },
  { m: 'Jan', enterprise: 1_910, business: 1_240, starter: 740 },
  { m: 'Fev', enterprise: 2_060, business: 1_310, starter: 750 },
  { m: 'Mar', enterprise: 2_220, business: 1_380, starter: 810 },
  { m: 'Abr', enterprise: 2_480, business: 1_490, starter: 853 },
];

const TRANSACTIONS = [
  { id: 'TX-2841', date: '28 Abr', client: 'Aurora Tech Ltda', plan: 'Enterprise', amount: 84_000, type: 'in', status: 'paid', method: 'Pix' },
  { id: 'TX-2840', date: '28 Abr', client: 'Helix Digital', plan: 'Business', amount: 18_400, type: 'in', status: 'paid', method: 'Boleto' },
  { id: 'TX-2839', date: '28 Abr', client: 'AWS Brasil', plan: 'Cloud', amount: 41_280, type: 'out', status: 'paid', method: 'Cartão' },
  { id: 'TX-2838', date: '27 Abr', client: 'Studio Nova', plan: 'Business', amount: 22_100, type: 'in', status: 'pending', method: 'Boleto' },
  { id: 'TX-2837', date: '27 Abr', client: 'Receita Federal', plan: 'IRPJ', amount: 184_000, type: 'out', status: 'pending', method: 'Pix' },
  { id: 'TX-2836', date: '26 Abr', client: 'Vetor Comércio', plan: 'Enterprise', amount: 76_500, type: 'in', status: 'paid', method: 'Pix' },
  { id: 'TX-2835', date: '26 Abr', client: 'Lumen Mídia', plan: 'Starter', amount: 4_900, type: 'in', status: 'overdue', method: 'Boleto' },
  { id: 'TX-2834', date: '25 Abr', client: 'Folha de Pagamento', plan: 'RH', amount: 842_000, type: 'out', status: 'paid', method: 'TED' },
  { id: 'TX-2833', date: '25 Abr', client: 'Pólen Agência', plan: 'Business', amount: 18_400, type: 'in', status: 'paid', method: 'Pix' },
];

const ACCOUNTS = [
  { name: 'Itaú Empresas', branch: 'CC 12.847-3', balance: 1_284_500, color: 'oklch(0.78 0.16 75)', logo: 'IT' },
  { name: 'Bradesco PJ', branch: 'CC 04.291-7', balance: 982_400, color: 'oklch(0.65 0.20 25)', logo: 'BR' },
  { name: 'BTG Pactual', branch: 'CC 88.412-1', balance: 1_120_300, color: 'oklch(0.30 0.02 240)', logo: 'BT' },
  { name: 'Mercado Pago', balance: 264_980, branch: 'CC 03.841-9', color: 'oklch(0.72 0.13 230)', logo: 'MP' },
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
  { group: 'GERAL', items: [
    { id: 'dashboard', label: 'Dashboard', icon: 'home' },
    { id: 'cashflow', label: 'Fluxo de Caixa', icon: 'activity' },
    { id: 'reconcile', label: 'Conciliação Bancária', icon: 'shuffle' },
  ]},
  { group: 'FINANCEIRO', items: [
    { id: 'revenue', label: 'Receitas', icon: 'arrow-down-left' },
    { id: 'expenses', label: 'Despesas', icon: 'arrow-up-right' },
    { id: 'receivables', label: 'Contas a Receber', icon: 'inbox' },
    { id: 'payables', label: 'Contas a Pagar', icon: 'send' },
    { id: 'taxes', label: 'Impostos', icon: 'landmark' },
    { id: 'investments', label: 'Investimentos', icon: 'pie' },
  ]},
  { group: 'VENDAS', items: [
    { id: 'pedidos', label: 'Pedidos de Venda', icon: 'clipboard' },
    { id: 'nfe', label: 'Notas Fiscais', icon: 'receipt' },
  ]},
  { group: 'GESTÃO', items: [
    { id: 'clients', label: 'Clientes', icon: 'users' },
    { id: 'suppliers', label: 'Fornecedores', icon: 'truck' },
    { id: 'products', label: 'Produtos', icon: 'box' },
    { id: 'payroll', label: 'Funcionários & Folha', icon: 'briefcase' },
    { id: 'reports', label: 'Relatórios', icon: 'file' },
  ]},
  { group: 'SISTEMA', items: [
    { id: 'demo', label: 'DEMO', icon: 'play' },
    { id: 'settings', label: 'Configurações', icon: 'settings' },
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
    'receipt': <><path d="M4 3v18l3-2 3 2 3-2 3 2 4-2V3Z" /><path d="M8 7h8" /><path d="M8 11h8" /><path d="M8 15h5" /></>,
    'settings': <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></>,
    'search': <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
    'bell': <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10 21a2 2 0 0 0 4 0" /></>,
    'plus': <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    'menu': <><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></>,
    'download': <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></>,
    'eye': <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
    'trash': <><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 15H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></>,
    'monitor': <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8" /><path d="M12 17v4" /></>,
    'phone': <><rect x="7" y="2" width="10" height="20" rx="2" /><path d="M11 18h2" /></>,
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
    'play': <path d="M8 5v14l11-7Z" />,
    'help': <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 4" /><path d="M12 17v.01" /></>,
    'export': <><path d="M16 16h3a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v3" /><path d="M11 11H3v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8h-4Z" /></>,
    'chevron-down': <path d="m6 9 6 6 6-6" />,
    'chevron-right': <path d="m9 6 6 6-6 6" />,
    'clipboard': <><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /><path d="M9 12h6M9 16h4" /></>,
    'pencil': <><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></>,
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
window.HEATMAP = HEATMAP;
window.NAV = NAV;
