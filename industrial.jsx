/* CARVION Industrial — produção em tempo real */
const { useEffect, useMemo, useState } = React;

const INDUSTRIAL_KEY = 'carvion.industrial.v6';
const INDUSTRIAL_CHANNEL = 'carvion-industrial-realtime';

const FLOW_STEPS = [
  { id: 'op', name: 'OP', mode: 'sequencial', sector: 'Gestão' },
  { id: 'enrolagem', name: 'Enrolagem', mode: 'sequencial', sector: 'Enrolagem' },
  { id: 'cola-marcacao', name: 'Cola / Marcação', mode: 'sequencial', sector: 'Cola' },
  { id: 'serigrafia', name: 'Serigrafia', mode: 'paralelo', sector: 'Serigrafia' },
  { id: 'cola-dublagem', name: 'Cola / Dublagem', mode: 'sequencial', sector: 'Dublagem' },
  { id: 'selador', name: 'Selador', mode: 'sequencial', sector: 'Selador' },
  { id: 'externa', name: 'Produção externa', mode: 'divisao', sector: 'Terceiros' },
  { id: 'montagem', name: 'Montagem', mode: 'sequencial', sector: 'Montagem' },
  { id: 'formas', name: 'Formas', mode: 'sequencial', sector: 'Formas' },
  { id: 'qualidade', name: 'Qualidade', mode: 'sequencial', sector: 'Qualidade' },
  { id: 'expedicao', name: 'Expedição', mode: 'sequencial', sector: 'Expedição' },
];

const defaultIndustrialState = () => ({
  updatedAt: new Date().toISOString(),
  activeProfile: 'gestor',
  selectedSector: 'Montagem',
  orders: [
    {
      id: 'OP-9101', product: 'SAMBA PRO', customer: 'Rede Campo Forte', totalQty: 1000, internalQty: 700, externalQty: 300,
      current: 'montagem', status: 'Em produção', dueDate: '2026-05-08', priority: 'Alta', lot: 'LT-9101', externalPartner: 'Presídio Industrial MS'
    },
    {
      id: 'OP-9102', product: 'FUTSAL EXTREME', customer: 'Arena Futsal Center', totalQty: 650, internalQty: 650, externalQty: 0,
      current: 'cola-dublagem', status: 'Em produção', dueDate: '2026-05-06', priority: 'Média', lot: 'LT-9102', externalPartner: ''
    },
  ],
  lots: [
    { id: 'LT-9101-A', opId: 'OP-9101', type: 'Interno', qty: 700, location: 'Montagem', step: 'montagem', status: 'Em produção' },
    { id: 'LT-9101-B', opId: 'OP-9101', type: 'Externo', qty: 300, location: 'Presídio Industrial MS', step: 'externa', status: 'Aguardando retorno' },
    { id: 'LT-9102-A', opId: 'OP-9102', type: 'Interno', qty: 650, location: 'Cola / Dublagem', step: 'cola-dublagem', status: 'Em produção' },
  ],
  sectors: [
    { id: 'SET-ENR', name: 'Enrolagem', leader: 'João Pereira', goal: 500, rate: 0.18, bonusCap: 420, status: 'Ativo' },
    { id: 'SET-SER', name: 'Serigrafia', leader: 'Marta Souza', goal: 620, rate: 0.22, bonusCap: 520, status: 'Ativo' },
    { id: 'SET-MON', name: 'Montagem', leader: 'Carlos Lima', goal: 500, rate: 0.25, bonusCap: 650, status: 'Ativo' },
    { id: 'SET-QUA', name: 'Qualidade', leader: 'Bianca Alves', goal: 520, rate: 0.20, bonusCap: 380, status: 'Ativo' },
  ],
  employees: [
    { id: 'COL-01', name: 'João Pereira', role: 'Operador', sector: 'Enrolagem', produced: 720, hours: 7.2, goal: 500, rate: 0.18, baseSalary: 2200, status: 'Ativo' },
    { id: 'COL-02', name: 'Marta Souza', role: 'Líder', sector: 'Serigrafia', produced: 840, hours: 8.0, goal: 620, rate: 0.22, baseSalary: 2600, status: 'Ativo' },
    { id: 'COL-03', name: 'Carlos Lima', role: 'Operador', sector: 'Montagem', produced: 650, hours: 7.5, goal: 500, rate: 0.25, baseSalary: 2300, status: 'Ativo' },
    { id: 'COL-04', name: 'Bianca Alves', role: 'Inspetora', sector: 'Qualidade', produced: 590, hours: 7.8, goal: 520, rate: 0.20, baseSalary: 2400, status: 'Ativo' },
  ],
  records: [
    { id: 'REC-1', opId: 'OP-9101', step: 'enrolagem', sector: 'Enrolagem', employee: 'João Pereira', startedAt: '2026-04-30T07:10:00', endedAt: '2026-04-30T09:25:00', qty: 1000, losses: 18, status: 'Finalizado' },
    { id: 'REC-2', opId: 'OP-9101', step: 'cola-marcacao', sector: 'Cola', employee: 'Equipe Cola A', startedAt: '2026-04-30T09:32:00', endedAt: '2026-04-30T11:10:00', qty: 982, losses: 9, status: 'Finalizado' },
    { id: 'REC-3', opId: 'OP-9101', step: 'serigrafia', sector: 'Serigrafia', employee: 'Marta Souza', startedAt: '2026-04-30T09:40:00', endedAt: '2026-04-30T12:05:00', qty: 982, losses: 11, status: 'Finalizado' },
    { id: 'REC-4', opId: 'OP-9101', step: 'montagem', sector: 'Montagem', employee: 'Carlos Lima', startedAt: '2026-04-30T13:10:00', endedAt: '', qty: 430, losses: 6, status: 'Em produção' },
    { id: 'REC-5', opId: 'OP-9102', step: 'cola-dublagem', sector: 'Dublagem', employee: 'Equipe Dublagem', startedAt: '2026-04-30T10:15:00', endedAt: '', qty: 380, losses: 4, status: 'Em produção' },
  ],
  products: [
    { code: 'TOP-SAMBA-PRO-CAMPO', model: 'SAMBA PRO', name: 'SAMBA PRO', brand: 'Topper', line: 'Pro', modality: 'Campo', cost: 118, dealerPrice: 214, partnerPrice: 188, price: 320, stock: 120, bom: 'PU premium, câmara butílica, linha reforçada, válvula campo' },
    { code: 'KGV-FUTSAL-EXTREME', model: 'FUTSAL EXTREME', name: 'FUTSAL EXTREME', brand: 'Kagiva', line: 'Pro', modality: 'Futsal', cost: 104, dealerPrice: 196, partnerPrice: 174, price: 289, stock: 80, bom: 'PU soft, câmara futsal, camada de amortecimento, válvula futsal' },
  ],
});

const iFmt = (n) => new Intl.NumberFormat('pt-BR').format(Number(n || 0));
const iMoney = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n || 0));
const stamp = () => new Date().toISOString();
const flowIndex = (stepId) => FLOW_STEPS.findIndex((s) => s.id === stepId);
const nextStep = (stepId) => FLOW_STEPS[Math.min(flowIndex(stepId) + 1, FLOW_STEPS.length - 1)]?.id || stepId;
const sectorConfig = (state, sector) => (state.sectors || []).find((s) => s.name === sector) || { goal: 0, rate: 0, bonusCap: 0 };
const rawEmployeeBonus = (employee, config) => Math.max(0, Number(employee.produced || 0) - Number(employee.goal || config.goal || 0)) * Number(employee.rate || config.rate || 0);
const employeeBonusFactor = (state, sector) => {
  const config = sectorConfig(state, sector);
  const rawTotal = (state.employees || []).filter((e) => e.sector === sector).reduce((s, e) => s + rawEmployeeBonus(e, config), 0);
  return rawTotal && config.bonusCap ? Math.min(1, Number(config.bonusCap || 0) / rawTotal) : 1;
};
const enrichEmployees = (state) => [...(state.employees || [])].map((e) => {
  const config = sectorConfig(state, e.sector);
  const rawBonus = rawEmployeeBonus(e, config);
  const factor = employeeBonusFactor(state, e.sector);
  return { ...e, pph: Number(e.hours || 0) ? Number(e.produced || 0) / Number(e.hours || 1) : 0, rawBonus, bonus: rawBonus * factor, capApplied: factor < 1, sectorCap: Number(config.bonusCap || 0), goal: Number(e.goal || config.goal || 0), rate: Number(e.rate || config.rate || 0) };
});
const normalizeIndustrialHeader = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '');
const pickIndustrialValue = (row, aliases) => {
  const keys = Object.keys(row);
  for (const alias of aliases) {
    const found = keys.find((key) => normalizeIndustrialHeader(key) === normalizeIndustrialHeader(alias));
    if (found && row[found] !== undefined && row[found] !== '') return row[found];
  }
  return '';
};
const industrialMoney = (value) => typeof value === 'number' ? value : Number(String(value || '').replace(/[^\d,.-]/g, '').replace('.', '').replace(',', '.')) || 0;
const industrialCsvRows = (text) => {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return [];
  const separator = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(separator).map((h) => h.replace(/^"|"$/g, '').trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(separator).map((c) => c.replace(/^"|"$/g, '').trim());
    return headers.reduce((row, header, index) => ({ ...row, [header]: cells[index] || '' }), {});
  });
};
const industrialProductFromRow = (row, index) => {
  const code = String(pickIndustrialValue(row, ['codigo', 'código', 'cod', 'sku', 'referencia', 'referência']) || '').trim();
  const model = String(pickIndustrialValue(row, ['modelo', 'model', 'arte']) || '').trim();
  const name = String(pickIndustrialValue(row, ['produto', 'nome', 'descricao', 'descrição', 'nome produto']) || model || code || `Produto importado ${index + 1}`).trim();
  const cost = industrialMoney(pickIndustrialValue(row, ['preco custo', 'preço custo', 'custo', 'custo unitario']));
  const price = industrialMoney(pickIndustrialValue(row, ['preco final', 'preço final', 'preco venda', 'preço venda', 'valor venda']));
  const dealerPrice = industrialMoney(pickIndustrialValue(row, ['preco lojista', 'preço lojista', 'lojista', 'atacado']));
  const partnerPrice = industrialMoney(pickIndustrialValue(row, ['preco parceiro', 'preço parceiro', 'parceiro', 'parceiros']));
  const finalPrice = price || partnerPrice || dealerPrice || (cost ? cost * 2.4 : 0);
  return {
    code,
    model,
    name,
    brand: String(pickIndustrialValue(row, ['marca', 'brand']) || 'A definir').trim(),
    line: String(pickIndustrialValue(row, ['linha', 'categoria']) || 'Linha').trim(),
    modality: String(pickIndustrialValue(row, ['modalidade', 'tipo', 'esporte']) || 'A definir').trim(),
    cost,
    dealerPrice: dealerPrice || finalPrice,
    partnerPrice: partnerPrice || finalPrice,
    price: finalPrice,
    stock: industrialMoney(pickIndustrialValue(row, ['estoque', 'saldo', 'quantidade', 'qtd'])),
    bom: String(pickIndustrialValue(row, ['bom', 'materiais', 'ficha tecnica', 'ficha técnica', 'composicao', 'composição']) || 'Ficha técnica importada da planilha').trim(),
  };
};

const loadIndustrial = () => {
  try { return { ...defaultIndustrialState(), ...JSON.parse(localStorage.getItem(INDUSTRIAL_KEY)) }; }
  catch { return defaultIndustrialState(); }
};
const saveIndustrial = (state) => localStorage.setItem(INDUSTRIAL_KEY, JSON.stringify({ ...state, updatedAt: stamp() }));
const broadcast = (state) => {
  saveIndustrial(state);
  if (window.industrialChannel) window.industrialChannel.postMessage({ type: 'industrial:update', state });
  window.dispatchEvent(new StorageEvent('storage', { key: INDUSTRIAL_KEY }));
};

const calcMetrics = (state) => {
  const totalProduced = state.records.reduce((s, r) => s + Number(r.qty || 0), 0);
  const losses = state.records.reduce((s, r) => s + Number(r.losses || 0), 0);
  const activeOps = state.orders.filter((o) => o.status !== 'Finalizado').length;
  const internal = state.lots.filter((l) => l.type === 'Interno').reduce((s, l) => s + l.qty, 0);
  const external = state.lots.filter((l) => l.type === 'Externo').reduce((s, l) => s + l.qty, 0);
  const sectorMap = FLOW_STEPS.map((step) => {
    const rows = state.records.filter((r) => r.step === step.id);
    const produced = rows.reduce((s, r) => s + Number(r.qty || 0), 0);
    const loss = rows.reduce((s, r) => s + Number(r.losses || 0), 0);
    const efficiency = produced ? Math.max(35, Math.min(99, ((produced - loss) / produced) * 100)) : 0;
    const open = rows.some((r) => r.status === 'Em produção');
    return { ...step, produced, loss, efficiency, open, avgTime: rows.length ? (1.4 + rows.length * .35) : 0 };
  });
  const slowest = sectorMap.filter((s) => s.produced).sort((a, b) => a.efficiency - b.efficiency)[0] || sectorMap[0];
  const bonusTotal = enrichEmployees(state).reduce((s, e) => s + Number(e.bonus || 0), 0);
  const activeLots = state.lots.filter((l) => !l.status.includes('Finalizado')).length;
  return { totalProduced, losses, activeOps, activeLots, internal, external, bonusTotal, sectorMap, slowest, efficiency: totalProduced ? ((totalProduced - losses) / totalProduced) * 100 : 0 };
};

const useIndustrialRealtime = () => {
  const [state, setState] = useState(loadIndustrial);
  useEffect(() => {
    window.industrialChannel = new BroadcastChannel(INDUSTRIAL_CHANNEL);
    window.industrialChannel.onmessage = (event) => {
      if (event.data?.type === 'industrial:update') setState(event.data.state);
    };
    const onStorage = () => setState(loadIndustrial());
    window.addEventListener('storage', onStorage);
    const timer = setInterval(onStorage, 5000);
    return () => { window.industrialChannel?.close(); window.removeEventListener('storage', onStorage); clearInterval(timer); };
  }, []);
  const update = (fn) => setState((current) => { const next = fn(JSON.parse(JSON.stringify(current))); broadcast(next); return next; });
  return [state, update];
};

const IndustrialSidebar = ({ current }) => {
  const links = [
    ['/dashboard', 'Dashboard'], ['/producao', 'Produção'], ['/produtos', 'Produtos'], ['/eficiencia', 'Eficiência'], ['/relatorios', 'Relatórios']
  ];
  return <aside className="sidebar">
    <div className="brand"><div className="industrial-logo">CI</div><div><div className="brand-name">CARVION</div><div className="brand-sub">Industrial</div></div></div>
    <div className="nav-label">MÓDULO INDUSTRIAL</div>
    {links.map(([href, label]) => <a key={href} className={'nav-item' + (current === href.replace('/', '') ? ' active' : '')} href={`/industrial${href}`}><Icon name={label === 'Dashboard' ? 'home' : label === 'Produção' ? 'activity' : label === 'Produtos' ? 'box' : label === 'Eficiência' ? 'percent' : 'file'} />{label}</a>)}
    <div className="nav-label">SISTEMA</div>
    <a className="nav-item" href="/dashboard"><Icon name="chevron-down" />Voltar ao ERP</a>
  </aside>;
};

const IndustrialTopbar = ({ title, subtitle, profile, setProfile, sector, setSector }) => <header className="topbar">
  <div><div className="page-title">{title}</div><div className="page-sub">{subtitle}</div></div>
  <div className="topbar-spacer" />
  <select className="btn" value={profile} onChange={(e) => setProfile(e.target.value)}><option value="gestor">Gestor/Admin</option><option value="operador">Operador de setor</option><option value="financeiro">Financeiro</option></select>
  <select className="btn" value={sector} onChange={(e) => setSector(e.target.value)}>{FLOW_STEPS.map((s) => <option key={s.sector}>{s.sector}</option>)}</select>
  <button className="btn" onClick={() => window.print()}><Icon name="file" /> Imprimir / Exportar PDF</button>
</header>;

const IndustrialTabs = ({ current }) => <nav className="industrial-tabs">
  <a className={current === 'dashboard' ? 'active' : ''} href="/industrial/dashboard"><Icon name="home" />Dashboard</a>
  <a className={current === 'producao' ? 'active' : ''} href="/industrial/producao"><Icon name="activity" />Produção</a>
  <a className={current === 'produtos' ? 'active' : ''} href="/industrial/produtos"><Icon name="box" />Produtos</a>
  <a className={current === 'eficiencia' ? 'active' : ''} href="/industrial/eficiencia"><Icon name="percent" />Eficiência</a>
  <a className={current === 'relatorios' ? 'active' : ''} href="/industrial/relatorios"><Icon name="file" />Relatórios</a>
</nav>;

const IndustrialKpis = ({ metrics }) => <div className="kpi-grid">
  {[['Produção em tempo real', `${iFmt(metrics.totalProduced)} un.`, '+18,4%', 'mês atual'], ['Eficiência geral', `${metrics.efficiency.toFixed(1).replace('.', ',')}%`, '+6,2%', 'setores ativos'], ['Gargalo atual', metrics.slowest.name, `${metrics.slowest.efficiency.toFixed(1).replace('.', ',')}%`, 'menor eficiência'], ['Externa vs interna', `${iFmt(metrics.external)} / ${iFmt(metrics.internal)}`, 'lotes', 'terceiros / interno']].map(([label, value, delta, sub], i) => <div className="kpi" key={label}><div className="kpi-head"><Icon name={i === 1 ? 'percent' : i === 2 ? 'trending-down' : 'activity'} /><span>{label}</span></div><div className="kpi-value">{value}</div><div className="kpi-foot"><span className={'kpi-delta ' + (i === 2 ? 'down' : 'up')}>{delta}</span><span className="kpi-period">{sub}</span></div></div>)}
</div>;

const IndustrialOverviewChart = ({ metrics }) => {
  const max = Math.max(...metrics.sectorMap.map((s) => s.produced), 1);
  return <div className="industrial-bars">
    {metrics.sectorMap.map((s) => <div className="industrial-bar-row" key={s.id}>
      <span>{s.name}</span>
      <div className="industrial-bar-track">
        <span className="bar-production" style={{ width: `${Math.max(4, s.produced / max * 100)}%` }} />
        <span className="bar-efficiency" style={{ width: `${Math.max(3, s.efficiency)}%` }} />
      </div>
      <strong>{iFmt(s.produced)}</strong>
    </div>)}
  </div>;
};

const IndustrialMixDonut = ({ metrics }) => {
  const total = Math.max(1, metrics.internal + metrics.external + metrics.losses);
  const internalDeg = metrics.internal / total * 360;
  const externalDeg = metrics.external / total * 360;
  return <div className="industrial-donut-wrap">
    <div className="industrial-donut" style={{ background: `conic-gradient(var(--accent) 0deg ${internalDeg}deg, var(--info) ${internalDeg}deg ${internalDeg + externalDeg}deg, var(--danger) ${internalDeg + externalDeg}deg 360deg)` }}>
      <div><span>TOTAL</span><strong>{iFmt(total)}</strong><small>unidades</small></div>
    </div>
    <div className="industrial-donut-legend">
      <div><span className="legend-dot" style={{ background: 'var(--accent)' }} />Interno <strong>{iFmt(metrics.internal)}</strong></div>
      <div><span className="legend-dot" style={{ background: 'var(--info)' }} />Externo <strong>{iFmt(metrics.external)}</strong></div>
      <div><span className="legend-dot" style={{ background: 'var(--danger)' }} />Perdas <strong>{iFmt(metrics.losses)}</strong></div>
    </div>
  </div>;
};

const ActiveOrdersTable = ({ state }) => <div className="table-wrap">
  <table className="table">
    <thead><tr><th>OP</th><th>Produto</th><th>Lote</th><th>Etapa atual</th><th>Cliente</th><th>Prazo</th><th className="text-right">Qtd.</th></tr></thead>
    <tbody>{state.orders.map((op) => <tr key={op.id}>
      <td className="mono muted">{op.id}</td>
      <td><span className="tag">{op.product}</span></td>
      <td className="mono">{op.lot}</td>
      <td>{FLOW_STEPS.find((s) => s.id === op.current)?.name}</td>
      <td>{op.customer}</td>
      <td className="muted">{new Date(op.dueDate).toLocaleDateString('pt-BR')}</td>
      <td className="num">{iFmt(op.totalQty)}</td>
    </tr>)}</tbody>
  </table>
</div>;

const IndustrialProductsTable = ({ state, update }) => {
  const [message, setMessage] = useState('');
  const importFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const rows = file.name.toLowerCase().endsWith('.csv')
        ? industrialCsvRows(await file.text())
        : (() => {
          if (!window.XLSX) throw new Error('Leitor de Excel não carregou. Recarregue a página ou envie CSV.');
          return null;
        })();
      let parsedRows = rows;
      if (!parsedRows) {
        const workbook = window.XLSX.read(await file.arrayBuffer(), { type: 'array' });
        parsedRows = window.XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });
      }
      const imported = parsedRows.map(industrialProductFromRow).filter((p) => p.name);
      if (!imported.length) throw new Error('Não encontrei produtos nessa planilha.');
      update((next) => {
        next.products = next.products || [];
        let created = 0;
        let updated = 0;
        imported.forEach((product) => {
          const index = next.products.findIndex((p) => (product.code && p.code === product.code) || String(p.name).toLowerCase() === String(product.name).toLowerCase());
          if (index >= 0) {
            next.products[index] = { ...next.products[index], ...product };
            updated += 1;
          } else {
            next.products.unshift(product);
            created += 1;
          }
        });
        next.updatedAt = stamp();
        next.lastProductImport = { fileName: file.name, created, updated, at: stamp() };
        return next;
      });
      setMessage(`${imported.length} produtos lidos: cadastrados/atualizados sem apagar dados existentes.`);
    } catch (error) {
      setMessage(error.message || 'Não foi possível importar a planilha.');
    } finally {
      event.target.value = '';
    }
  };
  return <><div className="card industrial-command-card">
    <div className="card-head">
      <div><div className="card-title">Produtos industriais e importação</div><div className="card-sub">Base própria do módulo Industrial para virar app separado depois</div></div>
      <label className="btn btn-primary"><Icon name="inbox" /> Importar Excel / CSV<input type="file" accept=".xlsx,.xls,.csv" hidden onChange={importFile} /></label>
    </div>
    <div className="industrial-command-kpis report-kpis">
      <div><span>Produtos</span><strong>{iFmt(state.products?.length || 0)}</strong><small>modelos cadastrados</small></div>
      <div><span>Estoque total</span><strong>{iFmt((state.products || []).reduce((s, p) => s + Number(p.stock || 0), 0))}</strong><small>unidades</small></div>
      <div><span>Custo médio</span><strong>{iMoney((state.products || []).reduce((s, p) => s + Number(p.cost || 0), 0) / Math.max(1, state.products?.length || 0))}</strong><small>por produto</small></div>
      <div><span>Última importação</span><strong>{state.lastProductImport?.created || 0}/{state.lastProductImport?.updated || 0}</strong><small>novos/atualizados</small></div>
    </div>
    <div className="industrial-command-note">{message || 'A planilha pode conter código, modelo, produto, marca, linha, modalidade, custo, preço lojista, preço parceiro, preço final, estoque e BOM.'}</div>
  </div>
  <div className="card">
    <div className="card-head"><div><div className="card-title">Catálogo para OP e custo industrial</div><div className="card-sub">Produtos amarrados à produção, lote, estoque e precificação</div></div></div>
    <div className="table-wrap"><table className="table"><thead><tr><th>Código</th><th>Modelo</th><th>Marca</th><th>Linha</th><th>Modalidade</th><th>Estoque</th><th className="text-right">Custo</th><th className="text-right">Final</th></tr></thead><tbody>{(state.products || []).map((p) => <tr key={p.code || p.name}><td className="mono muted">{p.code || '-'}</td><td><span className="tag">{p.name}</span><div className="muted">{p.bom}</div></td><td>{p.brand}</td><td>{p.line}</td><td>{p.modality}</td><td>{iFmt(p.stock)}</td><td className="num">{iMoney(p.cost)}</td><td className="num up">{iMoney(p.price)}</td></tr>)}</tbody></table></div>
  </div></>;
};

const IndustrialHomeDashboard = ({ state, metrics }) => {
  const topEmployees = [...state.employees].map((e) => ({ ...e, pph: e.hours ? e.produced / e.hours : 0 })).sort((a, b) => b.pph - a.pph).slice(0, 4);
  return <><div className="industrial-home-grid">
    <div className="card industrial-command-card">
      <div className="card-head">
        <div><div className="card-title">Painel de controle industrial</div><div className="card-sub">Visão executiva da fábrica em tempo real</div></div>
        <span className="status-pill status-draft">Online</span>
      </div>
      <div className="industrial-command-kpis">
        <div><span>OPs ativas</span><strong>{metrics.activeOps}</strong></div>
        <div><span>Lotes rastreados</span><strong>{metrics.activeLots}</strong></div>
        <div><span>Bônus previsto</span><strong>{iMoney(metrics.bonusTotal)}</strong></div>
      </div>
      <div className="industrial-command-note">Gargalo detectado em {metrics.slowest.name}. Priorize responsável, lote e retorno da produção externa.</div>
    </div>
    <div className="card">
      <div className="card-head"><div><div className="card-title">Mix de produção</div><div className="card-sub">Interna, externa e perdas</div></div></div>
      <IndustrialMixDonut metrics={metrics} />
    </div>
  </div>

  <div className="row-21">
    <div className="card">
      <div className="card-head">
        <div><div className="card-title">Produção por etapa</div><div className="card-sub">Volume produzido e eficiência por setor</div></div>
        <div className="chart-legend"><span className="legend-item"><span className="legend-dot" style={{ background: 'var(--accent)' }} />Produção</span><span className="legend-item"><span className="legend-dot" style={{ background: 'var(--info)' }} />Eficiência</span></div>
      </div>
      <IndustrialOverviewChart metrics={metrics} />
    </div>
    <div className="card">
      <div className="card-head"><div><div className="card-title">Ranking operacional</div><div className="card-sub">Peças por hora e meta do turno</div></div></div>
      <div className="rank-list">{topEmployees.map((e, i) => <div className="rank-row" key={e.id}><div className="rank-pos">#{i + 1}</div><div><strong>{e.name}</strong><div className="muted">{e.sector} · {iFmt(e.produced)} peças · {e.pph.toFixed(1)} p/h</div></div><span className="tag">{Math.round(e.produced / e.goal * 100)}%</span></div>)}</div>
    </div>
  </div>

  <div className="row-21">
    <div className="card">
      <div className="card-head"><div><div className="card-title">Ordens de Produção em andamento</div><div className="card-sub">Pedidos integrados ao módulo industrial</div></div></div>
      <ActiveOrdersTable state={state} />
    </div>
    <div className="card">
      <div className="card-head"><div><div className="card-title">Alertas inteligentes</div><div className="card-sub">Atrasos, perdas e gargalos</div></div></div>
      <div className="rank-list">
        <div className="rank-row"><div className="rank-pos"><Icon name="trending-down" size={13} /></div><div><strong>Gargalo em {metrics.slowest.name}</strong><div className="muted">Eficiência abaixo do restante da linha</div></div><span className="kpi-delta down">{metrics.slowest.efficiency.toFixed(1)}%</span></div>
        <div className="rank-row"><div className="rank-pos"><Icon name="activity" size={13} /></div><div><strong>Produção externa em retorno</strong><div className="muted">{iFmt(metrics.external)} unidades fora da linha interna</div></div><span className="tag">Terceiros</span></div>
        <div className="rank-row"><div className="rank-pos"><Icon name="percent" size={13} /></div><div><strong>Perdas controladas</strong><div className="muted">{iFmt(metrics.losses)} peças registradas no turno</div></div><span className="kpi-delta up">OK</span></div>
      </div>
    </div>
  </div></>;
};

const EfficiencyDashboard = ({ state, metrics, ranked }) => {
  const avgPph = ranked.length ? ranked.reduce((s, e) => s + e.pph, 0) / ranked.length : 0;
  const best = ranked[0] || { name: '-', sector: '-', pph: 0, produced: 0 };
  const belowGoal = ranked.filter((e) => e.produced < e.goal).length;
  return <><div className="industrial-home-grid">
    <div className="card industrial-command-card">
      <div className="card-head">
        <div><div className="card-title">Dashboard de eficiência</div><div className="card-sub">Setores, pessoas, metas, bônus e gargalos no mesmo painel</div></div>
        <span className="status-pill status-draft">{metrics.efficiency.toFixed(1).replace('.', ',')}%</span>
      </div>
      <div className="industrial-command-kpis">
        <div><span>Peças por hora média</span><strong>{avgPph.toFixed(1)}</strong></div>
        <div><span>Melhor produtividade</span><strong>{best.pph.toFixed(1)}</strong></div>
        <div><span>Abaixo da meta</span><strong>{belowGoal}</strong></div>
      </div>
      <div className="industrial-command-note">{best.name} lidera em {best.sector}. Gargalo atual: {metrics.slowest.name}. O bônus calculado respeita meta, valor por peça extra e teto salarial de bonificação por setor.</div>
    </div>
    <div className="card">
      <div className="card-head"><div><div className="card-title">Distribuição produtiva</div><div className="card-sub">Interno, externo e perdas afetam a eficiência</div></div></div>
      <IndustrialMixDonut metrics={metrics} />
    </div>
  </div>

  <div className="row-21">
    <div className="card">
      <div className="card-head"><div><div className="card-title">Eficiência por etapa</div><div className="card-sub">Comparativo visual de volume e aproveitamento</div></div></div>
      <IndustrialOverviewChart metrics={metrics} />
    </div>
    <div className="card">
      <div className="card-head"><div><div className="card-title">Bônus e comissões internas</div><div className="card-sub">Cálculo automático por produção acima da meta</div></div></div>
      <div className="rank-list">{ranked.slice(0, 4).map((e, i) => <div className="rank-row" key={e.id}><div className="rank-pos">#{i + 1}</div><div><strong>{e.name}</strong><div className="muted">{e.sector} · meta {iFmt(e.goal)} · realizado {iFmt(e.produced)}</div><div className="progress-rail"><span style={{ width: `${Math.min(100, e.produced / e.goal * 100)}%` }} /></div></div><div className="num up">{iMoney(e.bonus)}</div></div>)}</div>
    </div>
  </div></>;
};

const PeopleAndSectorsAdmin = ({ state, update }) => {
  const firstSector = state.sectors?.[0] || { name: 'Montagem', goal: 500, rate: 0.2 };
  const [sectorForm, setSectorForm] = useState({ name: '', leader: '', goal: 500, rate: 0.2, bonusCap: 500 });
  const [employeeForm, setEmployeeForm] = useState({ name: '', role: 'Operador', sector: firstSector.name, produced: 0, hours: 8, goal: firstSector.goal, rate: firstSector.rate, baseSalary: 2200 });
  const saveSector = () => {
    const name = String(sectorForm.name || '').trim();
    if (!name) return;
    update((next) => {
      next.sectors = next.sectors || [];
      const existing = next.sectors.find((sector) => sector.name.toLowerCase() === name.toLowerCase());
      const payload = { id: existing?.id || `SET-${Date.now()}`, name, leader: sectorForm.leader || 'A definir', goal: Number(sectorForm.goal || 0), rate: Number(sectorForm.rate || 0), bonusCap: Number(sectorForm.bonusCap || 0), status: 'Ativo' };
      if (existing) Object.assign(existing, payload);
      else next.sectors.unshift(payload);
      return next;
    });
    setSectorForm({ name: '', leader: '', goal: 500, rate: 0.2, bonusCap: 500 });
  };
  const saveEmployee = () => {
    const name = String(employeeForm.name || '').trim();
    if (!name) return;
    update((next) => {
      next.employees = next.employees || [];
      next.employees.unshift({ id: `COL-${Date.now()}`, name, role: employeeForm.role || 'Operador', sector: employeeForm.sector, produced: Number(employeeForm.produced || 0), hours: Number(employeeForm.hours || 0), goal: Number(employeeForm.goal || 0), rate: Number(employeeForm.rate || 0), baseSalary: Number(employeeForm.baseSalary || 0), status: 'Ativo' });
      return next;
    });
    setEmployeeForm({ ...employeeForm, name: '', produced: 0 });
  };
  const chooseSector = (sectorName) => {
    const sector = (state.sectors || []).find((s) => s.name === sectorName) || firstSector;
    setEmployeeForm({ ...employeeForm, sector: sector.name, goal: sector.goal, rate: sector.rate });
  };
  return <div className="row-21">
    <div className="card">
      <div className="card-head"><div><div className="card-title">Cadastro de setores</div><div className="card-sub">Meta, valor por peça e teto salarial de bonificação</div></div><button className="btn btn-primary" onClick={saveSector}><Icon name="plus" /> Salvar setor</button></div>
      <div className="row-3">
        <div className="field"><label>Setor</label><input value={sectorForm.name} onChange={(e) => setSectorForm({ ...sectorForm, name: e.target.value })} placeholder="Ex: Selador" /></div>
        <div className="field"><label>Responsável</label><input value={sectorForm.leader} onChange={(e) => setSectorForm({ ...sectorForm, leader: e.target.value })} placeholder="Líder do setor" /></div>
        <div className="field"><label>Meta padrão</label><input type="number" value={sectorForm.goal} onChange={(e) => setSectorForm({ ...sectorForm, goal: e.target.value })} /></div>
        <div className="field"><label>R$ por peça extra</label><input type="number" step="0.01" value={sectorForm.rate} onChange={(e) => setSectorForm({ ...sectorForm, rate: e.target.value })} /></div>
        <div className="field"><label>Teto bonificação do setor</label><input type="number" value={sectorForm.bonusCap} onChange={(e) => setSectorForm({ ...sectorForm, bonusCap: e.target.value })} /></div>
      </div>
      <div className="rank-list">{(state.sectors || []).map((sector) => <div className="rank-row" key={sector.id}><div className="rank-pos">S</div><div><strong>{sector.name}</strong><div className="muted">{sector.leader} · meta {iFmt(sector.goal)} · {iMoney(sector.rate)} por peça</div></div><span className="tag">Teto {iMoney(sector.bonusCap)}</span></div>)}</div>
    </div>
    <div className="card">
      <div className="card-head"><div><div className="card-title">Cadastro de colaboradores</div><div className="card-sub">Produção individual ligada ao setor e à bonificação</div></div><button className="btn btn-primary" onClick={saveEmployee}><Icon name="plus" /> Salvar colaborador</button></div>
      <div className="row-3">
        <div className="field"><label>Nome</label><input value={employeeForm.name} onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })} placeholder="Nome completo" /></div>
        <div className="field"><label>Cargo</label><input value={employeeForm.role} onChange={(e) => setEmployeeForm({ ...employeeForm, role: e.target.value })} /></div>
        <div className="field"><label>Setor</label><select value={employeeForm.sector} onChange={(e) => chooseSector(e.target.value)}>{(state.sectors || []).map((s) => <option key={s.id}>{s.name}</option>)}</select></div>
        <div className="field"><label>Produzido</label><input type="number" value={employeeForm.produced} onChange={(e) => setEmployeeForm({ ...employeeForm, produced: e.target.value })} /></div>
        <div className="field"><label>Horas</label><input type="number" step="0.1" value={employeeForm.hours} onChange={(e) => setEmployeeForm({ ...employeeForm, hours: e.target.value })} /></div>
        <div className="field"><label>Salário base</label><input type="number" value={employeeForm.baseSalary} onChange={(e) => setEmployeeForm({ ...employeeForm, baseSalary: e.target.value })} /></div>
      </div>
    </div>
  </div>;
};

const ReportsDashboard = ({ state, metrics }) => {
  const completed = state.records.filter((r) => r.status === 'Finalizado').length;
  const running = state.records.filter((r) => r.status === 'Em produção').length;
  const reportCards = [
    ['Produção total', `${iFmt(metrics.totalProduced)} un.`, 'período atual'],
    ['Registros finalizados', String(completed), 'etapas concluídas'],
    ['Em andamento', String(running), 'apontamentos abertos'],
    ['Bônus previsto', iMoney(metrics.bonusTotal), 'produção acima da meta'],
  ];
  return <><div className="card industrial-command-card">
    <div className="card-head">
      <div><div className="card-title">Dashboard de relatórios</div><div className="card-sub">Visão geral antes de imprimir ou exportar PDF</div></div>
      <button className="btn" onClick={() => window.print()}><Icon name="file" /> Imprimir / Exportar PDF</button>
    </div>
    <div className="industrial-command-kpis report-kpis">
      {reportCards.map(([label, value, sub]) => <div key={label}><span>{label}</span><strong>{value}</strong><small>{sub}</small></div>)}
    </div>
    <div className="industrial-command-note">Relatório pronto para apresentar: OPs, lotes, etapas, eficiência, perdas, produção externa e comissões no mesmo pacote.</div>
  </div>

  <div className="row-21">
    <div className="card">
      <div className="card-head"><div><div className="card-title">Resumo por etapa</div><div className="card-sub">Base do relatório de produção por setor</div></div></div>
      <IndustrialOverviewChart metrics={metrics} />
    </div>
    <div className="card">
      <div className="card-head"><div><div className="card-title">Lotes no relatório</div><div className="card-sub">Localização atual e rastreabilidade</div></div></div>
      <div className="rank-list">{state.lots.map((lot) => <div className="rank-row" key={lot.id}><div className="rank-pos">LT</div><div><strong>{lot.id}</strong><div className="muted">OP {lot.opId} · {lot.location}</div></div><span className="tag">{iFmt(lot.qty)} un.</span></div>)}</div>
    </div>
  </div></>;
};

const FlowBoard = ({ state, metrics }) => <div className="card"><div className="card-head"><div><div className="card-title">Fluxo real da fábrica</div><div className="card-sub">OP → Enrolagem → Cola / Marcação → Serigrafia paralelo → Dublagem → Selador → Externa → Montagem → Formas → Qualidade → Expedição</div></div></div><div className="flow-board">
  {metrics.sectorMap.map((step, i) => <div key={step.id} className={'flow-step ' + (step.open ? 'active ' : '') + (step.mode === 'paralelo' ? 'parallel ' : '') + (metrics.slowest.id === step.id && step.produced ? 'bottleneck' : '')}><div className="row"><span className="flow-index">{i + 1}</span><span className="tag">{step.mode}</span></div><div className="flow-title">{step.name}</div><div className="flow-meta">Setor: {step.sector}<br />Produzido: {iFmt(step.produced)} un.<br />Perdas: {iFmt(step.loss)} un.</div><div className="progress-rail"><span style={{ width: `${step.efficiency || 4}%` }} /></div><div className="flow-meta">Eficiência {step.efficiency.toFixed(1).replace('.', ',')}%</div></div>)}
</div></div>;

const LotTracking = ({ state }) => <div className="card"><div className="card-head"><div><div className="card-title">Controle de lote e subdivisão</div><div className="card-sub">Rastreio separado entre produção interna, externa e retorno</div></div></div><div className="lot-split">{state.lots.map((lot) => <div className="lot-card" key={lot.id}><div className="row"><span className="tag">{lot.type}</span><span className="muted mono">{lot.id}</span></div><div className="kpi-value">{iFmt(lot.qty)}<span className="currency">un.</span></div><div className="card-sub">OP {lot.opId} · {lot.location}</div><span className={'status-pill ' + (lot.status.includes('Aguardando') ? 'status-pending' : 'status-draft')}>{lot.status}</span></div>)}</div></div>;

const OperatorPanel = ({ state, update, profile, sector }) => {
  const visibleSteps = profile === 'operador' ? FLOW_STEPS.filter((s) => s.sector === sector) : FLOW_STEPS;
  const [form, setForm] = useState({ opId: state.orders[0]?.id || 'OP-9101', step: visibleSteps[0]?.id || 'montagem', employee: state.employees[0]?.name || '', qty: '100', losses: '0' });
  const start = () => update((next) => { next.records.unshift({ id: 'REC-' + Date.now(), opId: form.opId, step: form.step, sector: FLOW_STEPS.find((s) => s.id === form.step)?.sector, employee: form.employee, startedAt: stamp(), endedAt: '', qty: 0, losses: 0, status: 'Em produção' }); return next; });
  const finish = () => update((next) => { const rec = next.records.find((r) => r.opId === form.opId && r.step === form.step && r.status === 'Em produção'); if (rec) { rec.endedAt = stamp(); rec.qty = Number(form.qty || 0); rec.losses = Number(form.losses || 0); rec.status = 'Finalizado'; } const op = next.orders.find((o) => o.id === form.opId); if (op) { op.current = nextStep(form.step); op.status = op.current === 'expedicao' ? 'Aguardando expedição' : 'Em produção'; } return next; });
  const splitLot = () => update((next) => { const op = next.orders.find((o) => o.id === form.opId); if (!op) return next; op.internalQty = 700; op.externalQty = Math.max(0, op.totalQty - 700); if (!next.lots.some((l) => l.id === `${op.lot}-B`)) next.lots.push({ id: `${op.lot}-B`, opId: op.id, type: 'Externo', qty: op.externalQty, location: 'Presídio Industrial MS', step: 'externa', status: 'Aguardando retorno' }); return next; });
  const receiveExternal = () => update((next) => { next.lots.filter((l) => l.type === 'Externo').forEach((l) => { l.location = 'Montagem'; l.step = 'montagem'; l.status = 'Retornou da produção externa'; }); return next; });
  return <div className="operator-panel"><div className="card"><div className="card-head"><div><div className="card-title">Interface rápida do operador</div><div className="card-sub">Iniciar/finalizar etapa com quantidade e perdas</div></div></div><div className="row-3"><div className="field"><label>OP</label><select value={form.opId} onChange={(e) => setForm({ ...form, opId: e.target.value })}>{state.orders.map((o) => <option key={o.id}>{o.id}</option>)}</select></div><div className="field"><label>Etapa</label><select value={form.step} onChange={(e) => setForm({ ...form, step: e.target.value })}>{visibleSteps.map((s) => <option value={s.id} key={s.id}>{s.name}</option>)}</select></div><div className="field"><label>Responsável</label><select value={form.employee} onChange={(e) => setForm({ ...form, employee: e.target.value })}>{state.employees.map((e) => <option key={e.id}>{e.name}</option>)}</select></div><div className="field"><label>Quantidade</label><input value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} /></div><div className="field"><label>Perdas</label><input value={form.losses} onChange={(e) => setForm({ ...form, losses: e.target.value })} /></div></div><div className="operator-buttons"><button className="btn btn-primary" onClick={start}><Icon name="activity" /> Iniciar etapa</button><button className="btn" onClick={finish}><Icon name="check" /> Finalizar etapa</button><button className="btn" onClick={splitLot}>Dividir lote 700/300</button><button className="btn" onClick={receiveExternal}>Receber externo</button></div></div><div className="card"><div className="card-title">Regras em tempo real</div><div className="card-sub">Ao finalizar, a próxima etapa recebe a OP automaticamente. Outras abas abertas sincronizam via BroadcastChannel/localStorage.</div><div className="rank-list">{state.orders.map((op) => <div className="rank-row" key={op.id}><div className="rank-pos">OP</div><div><strong>{op.id}</strong><div className="muted">{op.product} · {op.customer}</div></div><span className="tag">{FLOW_STEPS.find((s) => s.id === op.current)?.name}</span></div>)}</div></div></div>;
};

const EfficiencyView = ({ state, metrics, update }) => {
  const ranked = enrichEmployees(state).sort((a, b) => b.pph - a.pph);
  return <><IndustrialKpis metrics={metrics} /><EfficiencyDashboard state={state} metrics={metrics} ranked={ranked} /><PeopleAndSectorsAdmin state={state} update={update} /><div className="row-21"><div className="card"><div className="card-title">Eficiência por funcionário</div><div className="rank-list">{ranked.map((e, i) => <div className="rank-row" key={e.id}><div className="rank-pos">#{i + 1}</div><div><strong>{e.name}</strong><div className="muted">{e.role || 'Operador'} · {e.sector} · {iFmt(e.produced)} peças · {e.hours}h · {e.pph.toFixed(1)} p/h</div><div className="progress-rail"><span style={{ width: `${Math.min(100, e.produced / Math.max(e.goal, 1) * 100)}%` }} /></div>{e.capApplied && <div className="muted">Teto do setor aplicado: {iMoney(e.sectorCap)}</div>}</div><div className="num up">{iMoney(e.bonus)}</div></div>)}</div></div><div className="card"><div className="card-title">Eficiência por setor</div><div className="gantt">{metrics.sectorMap.map((s) => <div className="gantt-row" key={s.id}><span>{s.name}</span><div className="gantt-track"><span style={{ width: `${s.efficiency || 3}%` }} /></div><strong>{s.efficiency.toFixed(1)}%</strong></div>)}</div></div></div></>;
};

const ReportsView = ({ state, metrics }) => <><div className="print-only"><h1>CARVION Industrial — Relatório</h1></div><IndustrialKpis metrics={metrics} /><ReportsDashboard state={state} metrics={metrics} /><div className="row-3"><div className="insight-card"><div className="card-title">Produção por período</div><div className="kpi-value">{iFmt(metrics.totalProduced)}</div><div className="card-sub">peças registradas</div></div><div className="insight-card"><div className="card-title">Comissões e bônus</div><div className="kpi-value">{iMoney(metrics.bonusTotal)}</div><div className="card-sub">bônus automático com teto por setor</div></div><div className="insight-card"><div className="card-title">Gargalo</div><div className="kpi-value">{metrics.slowest.name}</div><div className="card-sub">menor eficiência atual</div></div></div><div className="card"><div className="card-head"><div><div className="card-title">Rastreabilidade completa</div><div className="card-sub">Início, fim, responsável, quantidade e perdas por etapa</div></div><button className="btn" onClick={() => window.print()}><Icon name="file" /> Imprimir / Exportar PDF</button></div><div className="table-wrap"><table className="table"><thead><tr><th>OP</th><th>Etapa</th><th>Responsável</th><th>Início</th><th>Fim</th><th>Qtd.</th><th>Perdas</th><th>Status</th></tr></thead><tbody>{state.records.map((r) => <tr key={r.id}><td className="mono">{r.opId}</td><td>{FLOW_STEPS.find((s) => s.id === r.step)?.name}</td><td>{r.employee}</td><td className="muted">{r.startedAt ? new Date(r.startedAt).toLocaleString('pt-BR') : '-'}</td><td className="muted">{r.endedAt ? new Date(r.endedAt).toLocaleString('pt-BR') : '-'}</td><td>{iFmt(r.qty)}</td><td>{iFmt(r.losses)}</td><td><span className="status-pill status-draft">{r.status}</span></td></tr>)}</tbody></table></div></div></>;

const DashboardView = ({ state, update, metrics, profile, sector }) => <><IndustrialKpis metrics={metrics} /><IndustrialHomeDashboard state={state} metrics={metrics} /><FlowBoard state={state} metrics={metrics} /><LotTracking state={state} /><OperatorPanel state={state} update={update} profile={profile} sector={sector} /></>;

const IndustrialApp = () => {
  const [state, update] = useIndustrialRealtime();
  const metrics = useMemo(() => calcMetrics(state), [state]);
  const route = location.pathname.split('/').filter(Boolean)[1] || 'dashboard';
  const titleMap = { dashboard: ['Dashboard Industrial', 'Power BI industrial em tempo real'], producao: ['Produção', 'Fluxo operacional, lote e operador'], produtos: ['Produtos Industriais', 'Importação de Excel, modelos e precificação'], eficiencia: ['Eficiência', 'Setores, funcionários, ranking e bônus'], relatorios: ['Relatórios', 'PDFs de produção, eficiência e comissões'] };
  const setProfile = (profile) => update((next) => { next.activeProfile = profile; return next; });
  const setSector = (sector) => update((next) => { next.selectedSector = sector; return next; });
  return <div className="industrial-shell"><div className="industrial-layout"><IndustrialSidebar current={route} /><main className="main"><IndustrialTopbar title={titleMap[route]?.[0] || 'CARVION Industrial'} subtitle={titleMap[route]?.[1] || 'Controle industrial'} profile={state.activeProfile} setProfile={setProfile} sector={state.selectedSector} setSector={setSector} /><IndustrialTabs current={route} /><div className="content">{route === 'producao' ? <><FlowBoard state={state} metrics={metrics} /><LotTracking state={state} /><OperatorPanel state={state} update={update} profile={state.activeProfile} sector={state.selectedSector} /></> : route === 'produtos' ? <IndustrialProductsTable state={state} update={update} /> : route === 'eficiencia' ? <EfficiencyView state={state} metrics={metrics} update={update} /> : route === 'relatorios' ? <ReportsView state={state} metrics={metrics} /> : <DashboardView state={state} update={update} metrics={metrics} profile={state.activeProfile} sector={state.selectedSector} />}</div></main></div></div>;
};

ReactDOM.createRoot(document.getElementById('root')).render(<IndustrialApp />);
