/* CARVION Industrial — produção em tempo real */
const { useEffect, useMemo, useState } = React;

const INDUSTRIAL_KEY = 'carvion.industrial.v2';
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
  employees: [
    { id: 'COL-01', name: 'João Pereira', sector: 'Enrolagem', produced: 720, hours: 7.2, goal: 500, rate: 0.18 },
    { id: 'COL-02', name: 'Marta Souza', sector: 'Serigrafia', produced: 840, hours: 8.0, goal: 620, rate: 0.22 },
    { id: 'COL-03', name: 'Carlos Lima', sector: 'Montagem', produced: 650, hours: 7.5, goal: 500, rate: 0.25 },
    { id: 'COL-04', name: 'Bianca Alves', sector: 'Qualidade', produced: 590, hours: 7.8, goal: 520, rate: 0.20 },
  ],
  records: [
    { id: 'REC-1', opId: 'OP-9101', step: 'enrolagem', sector: 'Enrolagem', employee: 'João Pereira', startedAt: '2026-04-30T07:10:00', endedAt: '2026-04-30T09:25:00', qty: 1000, losses: 18, status: 'Finalizado' },
    { id: 'REC-2', opId: 'OP-9101', step: 'cola-marcacao', sector: 'Cola', employee: 'Equipe Cola A', startedAt: '2026-04-30T09:32:00', endedAt: '2026-04-30T11:10:00', qty: 982, losses: 9, status: 'Finalizado' },
    { id: 'REC-3', opId: 'OP-9101', step: 'serigrafia', sector: 'Serigrafia', employee: 'Marta Souza', startedAt: '2026-04-30T09:40:00', endedAt: '2026-04-30T12:05:00', qty: 982, losses: 11, status: 'Finalizado' },
    { id: 'REC-4', opId: 'OP-9101', step: 'montagem', sector: 'Montagem', employee: 'Carlos Lima', startedAt: '2026-04-30T13:10:00', endedAt: '', qty: 430, losses: 6, status: 'Em produção' },
    { id: 'REC-5', opId: 'OP-9102', step: 'cola-dublagem', sector: 'Dublagem', employee: 'Equipe Dublagem', startedAt: '2026-04-30T10:15:00', endedAt: '', qty: 380, losses: 4, status: 'Em produção' },
  ],
});

const iFmt = (n) => new Intl.NumberFormat('pt-BR').format(Number(n || 0));
const iMoney = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n || 0));
const stamp = () => new Date().toISOString();
const flowIndex = (stepId) => FLOW_STEPS.findIndex((s) => s.id === stepId);
const nextStep = (stepId) => FLOW_STEPS[Math.min(flowIndex(stepId) + 1, FLOW_STEPS.length - 1)]?.id || stepId;

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
  return { totalProduced, losses, activeOps, internal, external, sectorMap, slowest, efficiency: totalProduced ? ((totalProduced - losses) / totalProduced) * 100 : 0 };
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
    ['/dashboard', 'Dashboard'], ['/producao', 'Produção'], ['/eficiencia', 'Eficiência'], ['/relatorios', 'Relatórios']
  ];
  return <aside className="sidebar">
    <div className="brand"><div className="industrial-logo">CI</div><div><div className="brand-name">CARVION</div><div className="brand-sub">Industrial</div></div></div>
    <div className="nav-label">MÓDULO INDUSTRIAL</div>
    {links.map(([href, label]) => <a key={href} className={'nav-item' + (current === href.replace('/', '') ? ' active' : '')} href={`/industrial${href}`}><Icon name={label === 'Dashboard' ? 'home' : label === 'Produção' ? 'activity' : label === 'Eficiência' ? 'percent' : 'file'} />{label}</a>)}
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
  <a className={current === 'eficiencia' ? 'active' : ''} href="/industrial/eficiencia"><Icon name="percent" />Eficiência</a>
  <a className={current === 'relatorios' ? 'active' : ''} href="/industrial/relatorios"><Icon name="file" />Relatórios</a>
</nav>;

const IndustrialKpis = ({ metrics }) => <div className="kpi-grid">
  {[['Produção em tempo real', `${iFmt(metrics.totalProduced)} un.`, '+18,4%', 'mês atual'], ['Eficiência geral', `${metrics.efficiency.toFixed(1).replace('.', ',')}%`, '+6,2%', 'setores ativos'], ['Gargalo atual', metrics.slowest.name, `${metrics.slowest.efficiency.toFixed(1).replace('.', ',')}%`, 'menor eficiência'], ['Externa vs interna', `${iFmt(metrics.external)} / ${iFmt(metrics.internal)}`, 'lotes', 'terceiros / interno']].map(([label, value, delta, sub], i) => <div className="kpi" key={label}><div className="kpi-head"><Icon name={i === 1 ? 'percent' : i === 2 ? 'trending-down' : 'activity'} /><span>{label}</span></div><div className="kpi-value">{value}</div><div className="kpi-foot"><span className={'kpi-delta ' + (i === 2 ? 'down' : 'up')}>{delta}</span><span className="kpi-period">{sub}</span></div></div>)}
</div>;

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

const EfficiencyView = ({ state, metrics }) => {
  const ranked = [...state.employees].map((e) => ({ ...e, pph: e.hours ? e.produced / e.hours : 0, bonus: Math.max(0, e.produced - e.goal) * e.rate })).sort((a, b) => b.pph - a.pph);
  return <><IndustrialKpis metrics={metrics} /><div className="row-21"><div className="card"><div className="card-title">Eficiência por funcionário</div><div className="rank-list">{ranked.map((e, i) => <div className="rank-row" key={e.id}><div className="rank-pos">#{i + 1}</div><div><strong>{e.name}</strong><div className="muted">{e.sector} · {iFmt(e.produced)} peças · {e.hours}h · {e.pph.toFixed(1)} p/h</div><div className="progress-rail"><span style={{ width: `${Math.min(100, e.produced / e.goal * 100)}%` }} /></div></div><div className="num up">{iMoney(e.bonus)}</div></div>)}</div></div><div className="card"><div className="card-title">Eficiência por setor</div><div className="gantt">{metrics.sectorMap.map((s) => <div className="gantt-row" key={s.id}><span>{s.name}</span><div className="gantt-track"><span style={{ width: `${s.efficiency || 3}%` }} /></div><strong>{s.efficiency.toFixed(1)}%</strong></div>)}</div></div></div></>;
};

const ReportsView = ({ state, metrics }) => <><div className="print-only"><h1>CARVION Industrial — Relatório</h1></div><div className="row-3"><div className="insight-card"><div className="card-title">Produção por período</div><div className="kpi-value">{iFmt(metrics.totalProduced)}</div><div className="card-sub">peças registradas</div></div><div className="insight-card"><div className="card-title">Comissões e bônus</div><div className="kpi-value">{iMoney(state.employees.reduce((s, e) => s + Math.max(0, e.produced - e.goal) * e.rate, 0))}</div><div className="card-sub">bônus automático por desempenho</div></div><div className="insight-card"><div className="card-title">Gargalo</div><div className="kpi-value">{metrics.slowest.name}</div><div className="card-sub">menor eficiência atual</div></div></div><div className="card"><div className="card-head"><div><div className="card-title">Rastreabilidade completa</div><div className="card-sub">Início, fim, responsável, quantidade e perdas por etapa</div></div><button className="btn" onClick={() => window.print()}><Icon name="file" /> Imprimir / Exportar PDF</button></div><div className="table-wrap"><table className="table"><thead><tr><th>OP</th><th>Etapa</th><th>Responsável</th><th>Início</th><th>Fim</th><th>Qtd.</th><th>Perdas</th><th>Status</th></tr></thead><tbody>{state.records.map((r) => <tr key={r.id}><td className="mono">{r.opId}</td><td>{FLOW_STEPS.find((s) => s.id === r.step)?.name}</td><td>{r.employee}</td><td className="muted">{r.startedAt ? new Date(r.startedAt).toLocaleString('pt-BR') : '-'}</td><td className="muted">{r.endedAt ? new Date(r.endedAt).toLocaleString('pt-BR') : '-'}</td><td>{iFmt(r.qty)}</td><td>{iFmt(r.losses)}</td><td><span className="status-pill status-draft">{r.status}</span></td></tr>)}</tbody></table></div></div></>;

const DashboardView = ({ state, update, metrics, profile, sector }) => <><IndustrialKpis metrics={metrics} /><div className="card industrial-hero-card"><div className="card-head"><div><div className="card-title">CARVION Industrial</div><div className="card-sub">Controle completo da produção e eficiência em tempo real</div></div><div className="card-actions"><button className="btn" onClick={() => window.print()}><Icon name="file" /> Imprimir / Exportar PDF</button></div></div></div><FlowBoard state={state} metrics={metrics} /><LotTracking state={state} /><OperatorPanel state={state} update={update} profile={profile} sector={sector} /></>;

const IndustrialApp = () => {
  const [state, update] = useIndustrialRealtime();
  const metrics = useMemo(() => calcMetrics(state), [state]);
  const route = location.pathname.split('/').filter(Boolean)[1] || 'dashboard';
  const titleMap = { dashboard: ['Dashboard Industrial', 'Power BI industrial em tempo real'], producao: ['Produção', 'Fluxo operacional, lote e operador'], eficiencia: ['Eficiência', 'Setores, funcionários, ranking e bônus'], relatorios: ['Relatórios', 'PDFs de produção, eficiência e comissões'] };
  const setProfile = (profile) => update((next) => { next.activeProfile = profile; return next; });
  const setSector = (sector) => update((next) => { next.selectedSector = sector; return next; });
  return <div className="industrial-shell"><div className="industrial-layout"><IndustrialSidebar current={route} /><main className="main"><IndustrialTopbar title={titleMap[route]?.[0] || 'CARVION Industrial'} subtitle={titleMap[route]?.[1] || 'Controle industrial'} profile={state.activeProfile} setProfile={setProfile} sector={state.selectedSector} setSector={setSector} /><IndustrialTabs current={route} /><div className="content">{route === 'producao' ? <><FlowBoard state={state} metrics={metrics} /><LotTracking state={state} /><OperatorPanel state={state} update={update} profile={state.activeProfile} sector={state.selectedSector} /></> : route === 'eficiencia' ? <EfficiencyView state={state} metrics={metrics} /> : route === 'relatorios' ? <ReportsView state={state} metrics={metrics} /> : <DashboardView state={state} update={update} metrics={metrics} profile={state.activeProfile} sector={state.selectedSector} />}</div></main></div></div>;
};

ReactDOM.createRoot(document.getElementById('root')).render(<IndustrialApp />);
