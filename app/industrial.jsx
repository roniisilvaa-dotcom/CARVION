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

const DEFAULT_SECTOR_CONFIGS = [
  { id: 'SET-GES', name: 'Gestão', leader: 'PCP Industrial', goal: 18, rate: 1.5, bonusCap: 300, status: 'Ativo' },
  { id: 'SET-ENR', name: 'Enrolagem', leader: 'João Pereira', goal: 500, rate: 0.18, bonusCap: 420, status: 'Ativo' },
  { id: 'SET-COL', name: 'Cola', leader: 'Equipe Cola A', goal: 520, rate: 0.17, bonusCap: 410, status: 'Ativo' },
  { id: 'SET-SER', name: 'Serigrafia', leader: 'Marta Souza', goal: 620, rate: 0.22, bonusCap: 520, status: 'Ativo' },
  { id: 'SET-DUB', name: 'Dublagem', leader: 'Equipe Dublagem', goal: 540, rate: 0.2, bonusCap: 470, status: 'Ativo' },
  { id: 'SET-SEL', name: 'Selador', leader: 'Rafael Costa', goal: 500, rate: 0.21, bonusCap: 500, status: 'Ativo' },
  { id: 'SET-TER', name: 'Terceiros', leader: 'Controle Externo', goal: 350, rate: 0.12, bonusCap: 300, status: 'Ativo' },
  { id: 'SET-MON', name: 'Montagem', leader: 'Carlos Lima', goal: 500, rate: 0.25, bonusCap: 650, status: 'Ativo' },
  { id: 'SET-FOR', name: 'Formas', leader: 'Ana Paula', goal: 480, rate: 0.19, bonusCap: 420, status: 'Ativo' },
  { id: 'SET-QUA', name: 'Qualidade', leader: 'Bianca Alves', goal: 520, rate: 0.2, bonusCap: 380, status: 'Ativo' },
  { id: 'SET-EXP', name: 'Expedição', leader: 'Lucas Rocha', goal: 450, rate: 0.16, bonusCap: 360, status: 'Ativo' },
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
    { id: 'LT-9101-B', opId: 'OP-9101', type: 'Externo', qty: 300, sentQty: 300, returnedQty: 0, location: 'Presídio Industrial MS', step: 'externa', status: 'Aguardando retorno', materials: '300 kits de montagem; 300 carcaças; 300 válvulas; linha reforçada; romaneio de envio' },
    { id: 'LT-9102-A', opId: 'OP-9102', type: 'Interno', qty: 650, location: 'Cola / Dublagem', step: 'cola-dublagem', status: 'Em produção' },
  ],
  sectors: DEFAULT_SECTOR_CONFIGS,
  employees: [
    { id: 'COL-00', name: 'PCP Industrial', role: 'Planejamento', sector: 'Gestão', produced: 16, hours: 7.5, goal: 18, rate: 1.5, baseSalary: 3200, status: 'Ativo' },
    { id: 'COL-01', name: 'João Pereira', role: 'Operador', sector: 'Enrolagem', produced: 720, hours: 7.2, goal: 500, rate: 0.18, baseSalary: 2200, status: 'Ativo' },
    { id: 'COL-05', name: 'Equipe Cola A', role: 'Operador', sector: 'Cola', produced: 690, hours: 7.6, goal: 520, rate: 0.17, baseSalary: 2180, status: 'Ativo' },
    { id: 'COL-02', name: 'Marta Souza', role: 'Líder', sector: 'Serigrafia', produced: 840, hours: 8.0, goal: 620, rate: 0.22, baseSalary: 2600, status: 'Ativo' },
    { id: 'COL-06', name: 'Equipe Dublagem', role: 'Operador', sector: 'Dublagem', produced: 610, hours: 7.9, goal: 540, rate: 0.2, baseSalary: 2250, status: 'Ativo' },
    { id: 'COL-07', name: 'Rafael Costa', role: 'Operador', sector: 'Selador', produced: 430, hours: 7.4, goal: 500, rate: 0.21, baseSalary: 2320, status: 'Ativo' },
    { id: 'COL-08', name: 'Controle Externo', role: 'Terceiro', sector: 'Terceiros', produced: 300, hours: 8.0, goal: 350, rate: 0.12, baseSalary: 0, status: 'Ativo' },
    { id: 'COL-03', name: 'Carlos Lima', role: 'Operador', sector: 'Montagem', produced: 650, hours: 7.5, goal: 500, rate: 0.25, baseSalary: 2300, status: 'Ativo' },
    { id: 'COL-09', name: 'Ana Paula', role: 'Operadora', sector: 'Formas', produced: 520, hours: 7.7, goal: 480, rate: 0.19, baseSalary: 2240, status: 'Ativo' },
    { id: 'COL-04', name: 'Bianca Alves', role: 'Inspetora', sector: 'Qualidade', produced: 590, hours: 7.8, goal: 520, rate: 0.20, baseSalary: 2400, status: 'Ativo' },
    { id: 'COL-10', name: 'Lucas Rocha', role: 'Expedição', sector: 'Expedição', produced: 470, hours: 7.3, goal: 450, rate: 0.16, baseSalary: 2150, status: 'Ativo' },
  ],
  records: [
    { id: 'REC-1', opId: 'OP-9101', step: 'enrolagem', sector: 'Enrolagem', employee: 'João Pereira', startedAt: '2026-04-30T07:10:00', endedAt: '2026-04-30T09:25:00', qty: 1000, losses: 18, status: 'Finalizado' },
    { id: 'REC-2', opId: 'OP-9101', step: 'cola-marcacao', sector: 'Cola', employee: 'Equipe Cola A', startedAt: '2026-04-30T09:32:00', endedAt: '2026-04-30T11:10:00', qty: 982, losses: 9, status: 'Finalizado' },
    { id: 'REC-3', opId: 'OP-9101', step: 'serigrafia', sector: 'Serigrafia', employee: 'Marta Souza', startedAt: '2026-04-30T09:40:00', endedAt: '2026-04-30T12:05:00', qty: 982, losses: 11, status: 'Finalizado' },
    { id: 'REC-4', opId: 'OP-9101', step: 'montagem', sector: 'Montagem', employee: 'Carlos Lima', startedAt: '2026-04-30T13:10:00', endedAt: '', qty: 430, losses: 6, status: 'Em produção' },
    { id: 'REC-5', opId: 'OP-9102', step: 'cola-dublagem', sector: 'Dublagem', employee: 'Equipe Dublagem', startedAt: '2026-04-30T10:15:00', endedAt: '', qty: 380, losses: 4, status: 'Em produção' },
  ],
  products: [
    { code: '10001', model: 'SAMBA PRO', name: 'SAMBA PRO', brand: 'Topper', line: 'Pro', modality: 'Campo', cost: 118, dealerPrice: 214, partnerPrice: 188, price: 320, stock: 120, bom: 'PU premium, câmara butílica, linha reforçada, válvula campo' },
    { code: '10002', model: 'FUTSAL EXTREME', name: 'FUTSAL EXTREME', brand: 'Kagiva', line: 'Pro', modality: 'Futsal', cost: 104, dealerPrice: 196, partnerPrice: 174, price: 289, stock: 80, bom: 'PU soft, câmara futsal, camada de amortecimento, válvula futsal' },
  ],
});

const iFmt = (n) => new Intl.NumberFormat('pt-BR').format(Number(n || 0));
const iMoney = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n || 0));
const stamp = () => new Date().toISOString();
const flowIndex = (stepId) => FLOW_STEPS.findIndex((s) => s.id === stepId);
const nextStep = (stepId) => FLOW_STEPS[Math.min(flowIndex(stepId) + 1, FLOW_STEPS.length - 1)]?.id || stepId;
const numericProductCode = (value, fallback = '') => String(value || fallback || '').replace(/\D/g, '');
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
const csvEscape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
const rowsToCsv = (rows) => {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  return [headers.join(';'), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(';'))].join('\n');
};
const downloadIndustrialFile = (fileName, content, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};
const industrialDatasets = (state, metrics) => {
  const employees = enrichEmployees(state);
  const orders = (state.orders || []).map((op) => ({
    opId: op.id,
    nomeOp: op.name || op.id,
    tipo: op.type || 'Catálogo',
    produto: op.product,
    codigoProduto: op.productCode || '',
    modelo: op.model || '',
    observacao: op.notes || '',
    status: op.status,
    etapaAtual: FLOW_STEPS.find((step) => step.id === op.current)?.name || op.current,
    setorAtual: FLOW_STEPS.find((step) => step.id === op.current)?.sector || '',
    progressoPercentual: opProgress(op),
    quantidadeTotal: Number(op.totalQty || 0),
    quantidadeInterna: Number(op.internalQty || 0),
    quantidadeExterna: Number(op.externalQty || 0),
    prazo: op.dueAt || op.dueDate || '',
    atrasada: isOpLate(op) ? 'Sim' : 'Não',
    prioridade: op.priority || '',
    lote: op.lot || '',
    terceiro: op.externalPartner || '',
  }));
  const lots = (state.lots || []).map((lot) => ({
    loteId: lot.id,
    opId: lot.opId,
    tipo: lot.type,
    quantidade: Number(lot.qty || 0),
    enviado: Number(lot.sentQty || lot.qty || 0),
    retornou: Number(lot.returnedQty || 0),
    saldoPendente: Math.max(0, Number(lot.sentQty || lot.qty || 0) - Number(lot.returnedQty || 0)),
    localizacao: lot.location,
    etapa: FLOW_STEPS.find((step) => step.id === lot.step)?.name || lot.step,
    status: lot.status,
    materiais: lot.materials || '',
  }));
  const records = (state.records || []).map((record) => ({
    apontamentoId: record.id,
    opId: record.opId,
    etapa: FLOW_STEPS.find((step) => step.id === record.step)?.name || record.step,
    setor: record.sector,
    responsavel: record.employee,
    inicio: record.startedAt,
    fim: record.endedAt,
    quantidade: Number(record.qty || 0),
    perdas: Number(record.losses || 0),
    status: record.status,
  }));
  const sectors = (state.sectors || []).map((sector) => {
    const people = employees.filter((employee) => employee.sector === sector.name);
    const produced = people.reduce((sum, employee) => sum + Number(employee.produced || 0), 0);
    const hours = people.reduce((sum, employee) => sum + Number(employee.hours || 0), 0);
    const bonus = people.reduce((sum, employee) => sum + Number(employee.bonus || 0), 0);
    const step = metrics.sectorMap.find((item) => item.sector === sector.name || item.name === sector.name);
    return {
      setorId: sector.id,
      setor: sector.name,
      lider: sector.leader,
      meta: Number(sector.goal || 0),
      produzido: produced,
      horas: hours,
      pecasPorHora: hours ? produced / hours : 0,
      eficiencia: step?.efficiency || (produced ? Math.min(100, produced / Math.max(Number(sector.goal || 1), 1) * 100) : 0),
      bonusCalculado: bonus,
      tetoBonificacao: Number(sector.bonusCap || 0),
      colaboradores: people.length,
      status: sector.status || 'Ativo',
    };
  });
  const products = (state.products || []).map((product) => ({
    codigo: product.code,
    produto: product.name,
    modelo: product.model,
    marca: product.brand,
    linha: product.line,
    modalidade: product.modality,
    custo: Number(product.cost || 0),
    precoLojista: Number(product.dealerPrice || 0),
    precoParceiro: Number(product.partnerPrice || 0),
    precoFinal: Number(product.price || 0),
    estoque: Number(product.stock || 0),
    fichaTecnica: product.bom,
  }));
  const employeeRows = employees.map((employee) => ({
    colaboradorId: employee.id,
    nome: employee.name,
    cargo: employee.role,
    setor: employee.sector,
    produzido: Number(employee.produced || 0),
    horas: Number(employee.hours || 0),
    pecasPorHora: employee.pph,
    meta: employee.goal,
    valorPecaExtra: employee.rate,
    bonusBruto: employee.rawBonus,
    bonusPago: employee.bonus,
    tetoAplicado: employee.capApplied ? 'Sim' : 'Não',
    salarioBase: Number(employee.baseSalary || 0),
    status: employee.status,
  }));
  const kpis = [{
    atualizadoEm: state.updatedAt || stamp(),
    producaoTotal: metrics.totalProduced,
    perdas: metrics.losses,
    eficienciaGeral: metrics.efficiency,
    opsAtivas: metrics.activeOps,
    lotesAtivos: metrics.activeLots,
    producaoInterna: metrics.internal,
    producaoExterna: metrics.external,
    bonusPrevisto: metrics.bonusTotal,
    gargaloAtual: metrics.slowest.name,
    eficienciaGargalo: metrics.slowest.efficiency,
  }];
  return { kpis, orders, lots, records, sectors, employees: employeeRows, products };
};
const industrialProductFromRow = (row, index) => {
  const code = numericProductCode(pickIndustrialValue(row, ['codigo', 'código', 'cod', 'sku', 'referencia', 'referência']));
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

const normalizeIndustrialState = (state) => {
  const base = defaultIndustrialState();
  const next = { ...base, ...(state || {}) };
  next.orders = next.orders || [];
  next.lots = next.lots || [];
  next.records = next.records || [];
  next.products = (next.products || []).map((product, index) => {
    const knownCode = String(product.name || product.model || '').toUpperCase().includes('SAMBA PRO') ? '10001'
      : String(product.name || product.model || '').toUpperCase().includes('FUTSAL EXTREME') ? '10002'
      : String(90000 + index);
    return { ...product, code: numericProductCode(product.code, knownCode) || knownCode };
  });
  next.lots = next.lots.map((lot) => lot.type === 'Externo' ? {
    ...lot,
    sentQty: Number(lot.sentQty || lot.qty || 0),
    returnedQty: Number(lot.returnedQty || 0),
    materials: lot.materials || `${iFmt(lot.qty)} kits; ${iFmt(lot.qty)} carcaças; válvulas; linha; materiais de acabamento`,
  } : lot);
  next.sectors = [...DEFAULT_SECTOR_CONFIGS.map((sector) => ({ ...sector }))];
  (state?.sectors || []).forEach((sector) => {
    const index = next.sectors.findIndex((item) => item.name === sector.name);
    if (index >= 0) next.sectors[index] = { ...next.sectors[index], ...sector };
    else next.sectors.push(sector);
  });
  const employeeMap = new Map((base.employees || []).map((employee) => [employee.id, employee]));
  (state?.employees || []).forEach((employee) => employeeMap.set(employee.id || `${employee.name}-${employee.sector}`, employee));
  next.employees = Array.from(employeeMap.values());
  next.selectedSector = next.sectors.some((sector) => sector.name === next.selectedSector) ? next.selectedSector : 'Montagem';
  return next;
};
const loadIndustrial = () => {
  try { return normalizeIndustrialState(JSON.parse(localStorage.getItem(INDUSTRIAL_KEY))); }
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
    ['/dashboard', 'Dashboard'], ['/producao', 'Produção'], ['/produtos', 'Produtos'], ['/eficiencia', 'Eficiência'], ['/relatorios', 'Relatórios'], ['/integracoes', 'Integrações']
  ];
  return <aside className="sidebar">
    <div className="brand"><div className="industrial-logo">CI</div><div><div className="brand-name">CARVION</div><div className="brand-sub">Industrial</div></div></div>
    <div className="nav-label">MÓDULO INDUSTRIAL</div>
    {links.map(([href, label]) => <a key={href} className={'nav-item' + (current === href.replace('/', '') ? ' active' : '')} href={`/industrial${href}`}><Icon name={label === 'Dashboard' ? 'home' : label === 'Produção' ? 'activity' : label === 'Produtos' ? 'box' : label === 'Eficiência' ? 'percent' : label === 'Integrações' ? 'inbox' : 'file'} />{label}</a>)}
    <div className="nav-label">SISTEMA</div>
    <a className="nav-item" href="/dashboard"><Icon name="chevron-down" />Voltar ao ERP</a>
  </aside>;
};

const IndustrialTopbar = ({ title, subtitle, profile, setProfile, sector, setSector, sectors }) => <header className="topbar">
  <div><div className="page-title">{title}</div><div className="page-sub">{subtitle}</div></div>
  <div className="topbar-spacer" />
  <select className="btn" value={profile} onChange={(e) => setProfile(e.target.value)}><option value="gestor">Gestor/Admin</option><option value="operador">Operador de setor</option><option value="financeiro">Financeiro</option></select>
  <select className="btn" value={sector} onChange={(e) => setSector(e.target.value)}>{(sectors || DEFAULT_SECTOR_CONFIGS).map((s) => <option key={s.id || s.name}>{s.name}</option>)}</select>
  <button className="btn" onClick={() => window.print()}><Icon name="file" /> Imprimir / Exportar PDF</button>
</header>;

const IndustrialTabs = ({ current }) => <nav className="industrial-tabs">
  <a className={current === 'dashboard' ? 'active' : ''} href="/industrial/dashboard"><Icon name="home" />Dashboard</a>
  <a className={current === 'producao' ? 'active' : ''} href="/industrial/producao"><Icon name="activity" />Produção</a>
  <a className={current === 'produtos' ? 'active' : ''} href="/industrial/produtos"><Icon name="box" />Produtos</a>
  <a className={current === 'eficiencia' ? 'active' : ''} href="/industrial/eficiencia"><Icon name="percent" />Eficiência</a>
  <a className={current === 'relatorios' ? 'active' : ''} href="/industrial/relatorios"><Icon name="file" />Relatórios</a>
  <a className={current === 'integracoes' ? 'active' : ''} href="/industrial/integracoes"><Icon name="inbox" />Integrações</a>
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

const opProgress = (op) => {
  const index = Math.max(0, flowIndex(op.current));
  return Math.round(index / Math.max(1, FLOW_STEPS.length - 1) * 100);
};

const isOpLate = (op) => {
  const due = new Date(op.dueAt || op.dueDate || Date.now()).getTime();
  return due < Date.now() && !['Finalizado', 'Concluída', 'Expedido'].includes(op.status);
};

const insertOrderIntoProduction = (next, opId) => {
  const op = next.orders.find((item) => item.id === opId);
  if (!op) return;
  op.current = 'enrolagem';
  op.status = 'Em produção';
  op.startedAt = op.startedAt || stamp();
  next.lots.filter((lot) => lot.opId === op.id && lot.type === 'Interno').forEach((lot) => {
    lot.step = 'enrolagem';
    lot.location = 'Enrolagem';
    lot.status = 'Liberado para produção';
  });
  if (!next.records.some((record) => record.opId === op.id && record.step === 'enrolagem' && record.status === 'Em produção')) {
    next.records.unshift({ id: `REC-${Date.now()}`, opId: op.id, step: 'enrolagem', sector: 'Enrolagem', employee: 'Aguardando operador', startedAt: stamp(), endedAt: '', qty: 0, losses: 0, status: 'Em produção' });
  }
};

const ProcessControlDashboard = ({ state, metrics, sector, update }) => {
  const selectedStepIds = FLOW_STEPS.filter((step) => step.sector === sector).map((step) => step.id);
  const sectorOps = state.orders.filter((op) => selectedStepIds.includes(op.current));
  const plannedOps = state.orders.filter((op) => op.status === 'Planejada');
  const lateOps = state.orders.filter(isOpLate);
  const nextDue = [...state.orders].filter((op) => !['Finalizado', 'Expedido'].includes(op.status)).sort((a, b) => new Date(a.dueAt || a.dueDate) - new Date(b.dueAt || b.dueDate))[0];
  const inExternal = state.lots.filter((lot) => lot.type === 'Externo' && !lot.status.includes('Retornou'));
  return <div className="card">
    <div className="card-head">
      <div><div className="card-title">Controle interno da produção</div><div className="card-sub">Onde cada OP está agora, próxima ação, atrasos e divisão de lote</div></div>
      <span className="status-pill status-draft">Tempo real</span>
    </div>
    <div className="industrial-command-kpis report-kpis">
      <div><span>No setor selecionado</span><strong>{sectorOps.length}</strong><small>{sector}</small></div>
      <div><span>Planejadas</span><strong>{plannedOps.length}</strong><small>aguardando liberação</small></div>
      <div><span>OPs atrasadas</span><strong>{lateOps.length}</strong><small>prazo vencido</small></div>
      <div><span>Produção externa</span><strong>{iFmt(inExternal.reduce((s, lot) => s + Number(lot.qty || 0), 0))}</strong><small>unidades fora</small></div>
    </div>
    {plannedOps.length > 0 && <div className="release-list">
      {plannedOps.map((op) => <div className="release-row" key={op.id}>
        <div><strong>{op.id}</strong><span>{op.name || op.product} · prazo {new Date(op.dueAt || op.dueDate).toLocaleString('pt-BR')}</span></div>
        <button className="btn btn-primary" onClick={() => update?.((next) => { insertOrderIntoProduction(next, op.id); return next; })}>Inserir na produção</button>
      </div>)}
    </div>}
    <div className="process-map">
      {state.orders.map((op) => {
        const step = FLOW_STEPS.find((item) => item.id === op.current) || FLOW_STEPS[0];
        const lots = state.lots.filter((lot) => lot.opId === op.id);
        return <div className="process-card" key={op.id}>
          <div className="process-card-head">
            <div><strong>{op.id}</strong><span>{op.name || op.product} · {op.notes || 'sem observação'}</span></div>
            <span className={'status-pill ' + (isOpLate(op) ? 'status-pending' : 'status-draft')}>{isOpLate(op) ? 'Atrasada' : op.status}</span>
          </div>
          <div className="process-current"><span>{step.name}</span><strong>{opProgress(op)}%</strong></div>
          <div className="progress-rail"><span style={{ width: `${opProgress(op)}%` }} /></div>
          <div className="process-timeline">
            {FLOW_STEPS.map((item) => <span key={item.id} className={flowIndex(item.id) <= flowIndex(op.current) ? 'done' : ''} title={item.name} />)}
          </div>
          <div className="process-lots">
            {lots.map((lot) => <div key={lot.id}><span className="mono">{lot.id}</span><strong>{lot.location}</strong><small>{lot.type} · {iFmt(lot.qty)} un.</small></div>)}
          </div>
          {op.status === 'Planejada' && <button className="btn btn-primary" onClick={() => update?.((next) => { insertOrderIntoProduction(next, op.id); return next; })}>Inserir na produção</button>}
        </div>;
      })}
    </div>
  </div>;
};

const ActiveOrdersTable = ({ state }) => <div className="table-wrap">
  <table className="table">
    <thead><tr><th>OP</th><th>Produto</th><th>Lote</th><th>Etapa atual</th><th>OBS</th><th>Prazo</th><th className="text-right">Qtd.</th></tr></thead>
    <tbody>{state.orders.map((op) => <tr key={op.id}>
      <td className="mono muted">{op.id}<div className="muted">{op.name || ''}</div></td>
      <td><span className="tag">{op.product}</span><div className="muted">{op.productCode || op.model || op.type}</div></td>
      <td className="mono">{op.lot}</td>
      <td>{FLOW_STEPS.find((s) => s.id === op.current)?.name}</td>
      <td className="muted">{op.notes || '-'}</td>
      <td className="muted">{new Date(op.dueAt || op.dueDate).toLocaleString('pt-BR')}</td>
      <td className="num">{iFmt(op.totalQty)}</td>
    </tr>)}</tbody>
  </table>
</div>;

const IndustrialProductsTable = ({ state, update }) => {
  const [message, setMessage] = useState('');
  const [productForm, setProductForm] = useState({ code: '', name: '', model: '', brand: '', line: 'Pro', modality: 'Campo', cost: 0, dealerPrice: 0, partnerPrice: 0, price: 0, stock: 0, bom: '' });
  const editProduct = (product) => {
    setProductForm({
      code: numericProductCode(product.code),
      name: product.name || '',
      model: product.model || '',
      brand: product.brand || '',
      line: product.line || '',
      modality: product.modality || 'Campo',
      cost: Number(product.cost || 0),
      dealerPrice: Number(product.dealerPrice || 0),
      partnerPrice: Number(product.partnerPrice || 0),
      price: Number(product.price || 0),
      stock: Number(product.stock || 0),
      bom: product.bom || '',
    });
    setMessage(`${product.name || product.model} carregado para edição.`);
  };
  const saveProduct = () => {
    const name = String(productForm.name || productForm.model || '').trim();
    if (!name) { setMessage('Informe ao menos nome ou modelo do produto.'); return; }
    const product = {
      ...productForm,
      code: numericProductCode(productForm.code, Date.now()),
      name,
      model: String(productForm.model || name).trim(),
      brand: String(productForm.brand || 'A definir').trim(),
      line: String(productForm.line || 'Linha').trim(),
      modality: String(productForm.modality || 'A definir').trim(),
      cost: Number(productForm.cost || 0),
      dealerPrice: Number(productForm.dealerPrice || 0),
      partnerPrice: Number(productForm.partnerPrice || 0),
      price: Number(productForm.price || 0),
      stock: Number(productForm.stock || 0),
      bom: String(productForm.bom || 'Ficha técnica a completar').trim(),
    };
    update((next) => {
      next.products = next.products || [];
      const index = next.products.findIndex((item) => item.code === product.code);
      if (index >= 0) next.products[index] = { ...next.products[index], ...product };
      else next.products.unshift(product);
      return next;
    });
    setProductForm({ code: '', name: '', model: '', brand: '', line: 'Pro', modality: 'Campo', cost: 0, dealerPrice: 0, partnerPrice: 0, price: 0, stock: 0, bom: '' });
    setMessage(`${product.name} cadastrado/atualizado manualmente.`);
  };
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
    <div className="card-head"><div><div className="card-title">Cadastro manual de produto</div><div className="card-sub">Crie ou edite modelos importados para usar em OP, custo, estoque e precificação</div></div><button className="btn btn-primary" onClick={saveProduct}><Icon name="plus" /> Salvar produto</button></div>
    <div className="op-form-grid">
      <div className="field"><label>Código do produto</label><input type="number" inputMode="numeric" value={productForm.code} onChange={(e) => setProductForm({ ...productForm, code: numericProductCode(e.target.value) })} placeholder="10001" /></div>
      <div className="field"><label>Produto</label><input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} placeholder="SAMBA PRO" /></div>
      <div className="field"><label>Modelo</label><input value={productForm.model} onChange={(e) => setProductForm({ ...productForm, model: e.target.value })} placeholder="Campo oficial" /></div>
      <div className="field"><label>Marca</label><input value={productForm.brand} onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })} placeholder="Topper, Kagiva..." /></div>
      <div className="field"><label>Linha</label><input value={productForm.line} onChange={(e) => setProductForm({ ...productForm, line: e.target.value })} /></div>
      <div className="field"><label>Modalidade</label><select value={productForm.modality} onChange={(e) => setProductForm({ ...productForm, modality: e.target.value })}><option>Campo</option><option>Futsal</option><option>Vôlei</option><option>Basquete</option><option>Society</option><option>Personalizada</option></select></div>
      <div className="field"><label>Preço custo</label><input type="number" step="0.01" value={productForm.cost} onChange={(e) => setProductForm({ ...productForm, cost: e.target.value })} /></div>
      <div className="field"><label>Preço final</label><input type="number" step="0.01" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} /></div>
      <div className="field"><label>Preço lojista</label><input type="number" step="0.01" value={productForm.dealerPrice} onChange={(e) => setProductForm({ ...productForm, dealerPrice: e.target.value })} /></div>
      <div className="field"><label>Preço parceiro</label><input type="number" step="0.01" value={productForm.partnerPrice} onChange={(e) => setProductForm({ ...productForm, partnerPrice: e.target.value })} /></div>
      <div className="field"><label>Estoque</label><input type="number" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} /></div>
      <div className="field wide"><label>Ficha técnica / BOM</label><textarea value={productForm.bom} onChange={(e) => setProductForm({ ...productForm, bom: e.target.value })} placeholder="PU, borracha, câmara, válvula, linha, acabamento..." /></div>
    </div>
  </div>
  <div className="card">
    <div className="card-head"><div><div className="card-title">Catálogo para OP e custo industrial</div><div className="card-sub">Produtos amarrados à produção, lote, estoque e precificação</div></div></div>
    <div className="table-wrap"><table className="table"><thead><tr><th>Código</th><th>Modelo</th><th>Marca</th><th>Linha</th><th>Modalidade</th><th>Estoque</th><th className="text-right">Custo</th><th className="text-right">Final</th><th>Ações</th></tr></thead><tbody>{(state.products || []).map((p) => <tr key={p.code || p.name}><td className="mono muted">{p.code || '-'}</td><td><span className="tag">{p.name}</span><div className="muted">{p.bom}</div></td><td>{p.brand}</td><td>{p.line}</td><td>{p.modality}</td><td>{iFmt(p.stock)}</td><td className="num">{iMoney(p.cost)}</td><td className="num up">{iMoney(p.price)}</td><td><button className="btn" onClick={() => editProduct(p)}>Editar</button></td></tr>)}</tbody></table></div>
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

const SectorDashboards = ({ state, metrics, ranked }) => {
  const dashboards = (state.sectors || []).map((sector) => {
    const people = ranked.filter((employee) => employee.sector === sector.name);
    const produced = people.reduce((sum, employee) => sum + Number(employee.produced || 0), 0);
    const hours = people.reduce((sum, employee) => sum + Number(employee.hours || 0), 0);
    const bonus = people.reduce((sum, employee) => sum + Number(employee.bonus || 0), 0);
    const rawBonus = people.reduce((sum, employee) => sum + Number(employee.rawBonus || 0), 0);
    const step = metrics.sectorMap.find((item) => item.sector === sector.name || item.name === sector.name);
    const efficiency = step?.efficiency || (produced ? Math.min(100, produced / Math.max(Number(sector.goal || 1), 1) * 100) : 0);
    return { sector, people, produced, hours, bonus, rawBonus, efficiency, pph: hours ? produced / hours : 0 };
  });
  return <div className="card">
    <div className="card-head"><div><div className="card-title">Dashboard de cada setor</div><div className="card-sub">Meta, produção, equipe, bonificação e teto por setor</div></div></div>
    <div className="sector-dashboard-grid">
      {dashboards.map(({ sector, people, produced, hours, bonus, rawBonus, efficiency, pph }) => {
        const capUsage = sector.bonusCap ? Math.min(100, bonus / sector.bonusCap * 100) : 0;
        const goalUsage = Math.min(100, produced / Math.max(Number(sector.goal || 1), 1) * 100);
        const status = efficiency >= 90 ? 'Alta eficiência' : efficiency >= 70 ? 'Monitorar' : 'Gargalo';
        return <div className="sector-card" key={sector.id || sector.name}>
          <div className="sector-card-head">
            <div><strong>{sector.name}</strong><span>{sector.leader || 'Sem líder'} · {people.length} colaborador(es)</span></div>
            <span className={'status-pill ' + (status === 'Gargalo' ? 'status-pending' : 'status-draft')}>{status}</span>
          </div>
          <div className="sector-ring-row">
            <div className="sector-ring" style={{ background: `conic-gradient(var(--accent) 0% ${efficiency}%, var(--surface-2) ${efficiency}% 100%)` }}><div>{efficiency.toFixed(0)}%</div></div>
            <div className="sector-mini-kpis">
              <div><span>Produzido</span><strong>{iFmt(produced)}</strong></div>
              <div><span>Meta</span><strong>{iFmt(sector.goal)}</strong></div>
              <div><span>p/h</span><strong>{pph.toFixed(1)}</strong></div>
              <div><span>Horas</span><strong>{hours.toFixed(1)}</strong></div>
            </div>
          </div>
          <div className="sector-progress">
            <div><span>Meta do setor</span><strong>{goalUsage.toFixed(0)}%</strong></div>
            <div className="progress-rail"><span style={{ width: `${goalUsage}%` }} /></div>
          </div>
          <div className="sector-progress">
            <div><span>Bônus usado</span><strong>{iMoney(bonus)} / {iMoney(sector.bonusCap)}</strong></div>
            <div className="progress-rail"><span style={{ width: `${capUsage}%` }} /></div>
            {rawBonus > bonus && <small>Teto aplicado: bruto {iMoney(rawBonus)}</small>}
          </div>
          <div className="rank-list">
            {people.slice(0, 3).map((employee) => <div className="sector-person" key={employee.id}><span>{employee.name}</span><strong>{iMoney(employee.bonus)}</strong></div>)}
            {!people.length && <div className="muted">Nenhum colaborador cadastrado neste setor.</div>}
          </div>
        </div>;
      })}
    </div>
  </div>;
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

const opSlug = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 18);

const ProductionOrderCreator = ({ state, update }) => {
  const firstProduct = state.products?.[0] || {};
  const nowLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  const dueLocal = new Date(Date.now() + 7 * 86400000 - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  const [kind, setKind] = useState('catalog');
  const [form, setForm] = useState({
    name: 'OP Bola Profissional',
    createdAt: nowLocal,
    dueAt: dueLocal,
    productCode: firstProduct.code || '',
    model: firstProduct.model || firstProduct.name || '',
    qty: 1000,
    internalQty: 700,
    externalQty: 300,
    externalPartner: 'Presídio Industrial MS',
    externalMaterials: '300 kits de montagem; 300 carcaças; 300 válvulas; linha reforçada; romaneio de envio',
    color: '',
    customLayout: '',
    notes: '',
    priority: 'Alta',
  });
  const selectedProduct = (state.products || []).find((product) => product.code === form.productCode || product.model === form.model || product.name === form.model) || firstProduct;
  const changeProduct = (code) => {
    const product = (state.products || []).find((item) => item.code === code) || {};
    setForm({ ...form, productCode: code, model: product.model || product.name || form.model });
  };
  const createOp = () => {
    const qty = Math.max(1, Number(form.qty || 0));
    const internalQty = Math.max(0, Math.min(qty, Number(form.internalQty || qty)));
    const externalQty = Math.max(0, Math.min(qty - internalQty, Number(form.externalQty || 0)));
    const opNumber = `OP-${new Date().getFullYear()}-${String((state.orders || []).length + 1).padStart(4, '0')}`;
    const lot = `LT-${opSlug(form.name || opNumber) || Date.now()}`;
    const productName = kind === 'custom'
      ? `Bola personalizada ${form.color ? `· ${form.color}` : ''}`.trim()
      : (selectedProduct.name || selectedProduct.model || form.model || 'Produto sem modelo');
    update((next) => {
      next.orders = next.orders || [];
      next.lots = next.lots || [];
      next.records = next.records || [];
      next.orders.unshift({
        id: opNumber,
        name: form.name || opNumber,
        type: kind === 'custom' ? 'Personalizada' : 'Catálogo',
        product: productName,
        productCode: kind === 'custom' ? '' : numericProductCode(selectedProduct.code || form.productCode),
        model: kind === 'custom' ? form.customLayout || 'Layout personalizado' : (selectedProduct.model || form.model),
        customer: '',
        totalQty: qty,
        internalQty,
        externalQty,
        current: 'op',
        status: 'Planejada',
        createdAt: form.createdAt,
        dueAt: form.dueAt,
        dueDate: String(form.dueAt || '').slice(0, 10),
        priority: form.priority,
        lot,
        externalPartner: form.externalPartner,
        externalMaterials: form.externalMaterials,
        color: form.color,
        customLayout: form.customLayout,
        notes: form.notes,
      });
      next.lots.unshift({ id: `${lot}-A`, opId: opNumber, type: 'Interno', qty: internalQty || qty, location: 'OP / PCP', step: 'op', status: 'Planejado' });
      if (externalQty) next.lots.unshift({ id: `${lot}-B`, opId: opNumber, type: 'Externo', qty: externalQty, sentQty: externalQty, returnedQty: 0, location: form.externalPartner || 'Produção externa', step: 'externa', status: 'Separado para terceiro', materials: form.externalMaterials || `${iFmt(externalQty)} kits; ${iFmt(externalQty)} carcaças; válvulas; linha` });
      return next;
    });
    setForm({ ...form, name: '', notes: '', customLayout: '', color: '' });
  };
  return <div className="card">
    <div className="card-head">
      <div><div className="card-title">Abrir nova OP</div><div className="card-sub">Produto de catálogo ou bola personalizada com prazo final, lote e divisão interna/externa</div></div>
      <button className="btn btn-primary" onClick={createOp}><Icon name="plus" /> Planejar OP</button>
    </div>
    <div className="op-mode">
      <button className={'btn ' + (kind === 'catalog' ? 'btn-primary' : '')} onClick={() => setKind('catalog')}>Produto cadastrado</button>
      <button className={'btn ' + (kind === 'custom' ? 'btn-primary' : '')} onClick={() => setKind('custom')}>Bola personalizada</button>
    </div>
    <div className="op-form-grid">
      <div className="field wide"><label>Nome da OP</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: OP Samba Pro Loja Centro" /></div>
      <div className="field"><label>Data/hora abertura</label><input type="datetime-local" value={form.createdAt} onChange={(e) => setForm({ ...form, createdAt: e.target.value })} /></div>
      <div className="field"><label>Precisa estar pronta em</label><input type="datetime-local" value={form.dueAt} onChange={(e) => setForm({ ...form, dueAt: e.target.value })} /></div>
      <div className="field"><label>Quantidade total</label><input type="number" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} /></div>
      <div className="field"><label>Interno</label><input type="number" value={form.internalQty} onChange={(e) => setForm({ ...form, internalQty: e.target.value, externalQty: Math.max(0, Number(form.qty || 0) - Number(e.target.value || 0)) })} /></div>
      <div className="field"><label>Externo / terceiro</label><input type="number" value={form.externalQty} onChange={(e) => setForm({ ...form, externalQty: e.target.value })} /></div>
      {kind === 'catalog' ? <>
        <div className="field"><label>Código do produto</label><select value={form.productCode} onChange={(e) => changeProduct(e.target.value)}>{(state.products || []).map((product) => <option value={product.code} key={product.code || product.name}>{product.code || product.name}</option>)}</select></div>
        <div className="field"><label>Modelo</label><input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="Modelo da bola" /></div>
        <div className="field"><label>Linha / modalidade</label><input value={`${selectedProduct.line || '-'} · ${selectedProduct.modality || '-'}`} readOnly /></div>
      </> : <>
        <div className="field"><label>Cor</label><input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="Ex: Branco, preto e dourado" /></div>
        <div className="field"><label>Layout personalizado</label><input value={form.customLayout} onChange={(e) => setForm({ ...form, customLayout: e.target.value })} placeholder="Ex: Escudo, patrocinador, arte do cliente" /></div>
        <div className="field"><label>Modelo base</label><input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="Campo, futsal, vôlei..." /></div>
      </>}
      <div className="field"><label>Produção externa</label><input value={form.externalPartner} onChange={(e) => setForm({ ...form, externalPartner: e.target.value })} placeholder="Terceiro, presídio, oficina externa" /></div>
      <div className="field"><label>Prioridade</label><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}><option>Alta</option><option>Média</option><option>Baixa</option></select></div>
      <div className="field wide"><label>Materiais enviados ao presídio/terceiro</label><textarea value={form.externalMaterials} onChange={(e) => setForm({ ...form, externalMaterials: e.target.value })} placeholder="Kits, carcaças, válvulas, linhas, etiquetas, romaneio..." /></div>
      <div className="field wide"><label>Observações da OP</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Costura especial, embalagem, validação de arte, aprovação do cliente, restrição de matéria-prima..." /></div>
    </div>
  </div>;
};

const FlowBoard = ({ state, metrics }) => <div className="card"><div className="card-head"><div><div className="card-title">Fluxo real da fábrica</div><div className="card-sub">OP → Enrolagem → Cola / Marcação → Serigrafia paralelo → Dublagem → Selador → Externa → Montagem → Formas → Qualidade → Expedição</div></div></div><div className="flow-board">
  {metrics.sectorMap.map((step, i) => <div key={step.id} className={'flow-step ' + (step.open ? 'active ' : '') + (step.mode === 'paralelo' ? 'parallel ' : '') + (metrics.slowest.id === step.id && step.produced ? 'bottleneck' : '')}><div className="row"><span className="flow-index">{i + 1}</span><span className="tag">{step.mode}</span></div><div className="flow-title">{step.name}</div><div className="flow-meta">Setor: {step.sector}<br />Produzido: {iFmt(step.produced)} un.<br />Perdas: {iFmt(step.loss)} un.</div><div className="progress-rail"><span style={{ width: `${step.efficiency || 4}%` }} /></div><div className="flow-meta">Eficiência {step.efficiency.toFixed(1).replace('.', ',')}%</div></div>)}
</div></div>;

const LotTracking = ({ state }) => <div className="card"><div className="card-head"><div><div className="card-title">Controle de lote e subdivisão</div><div className="card-sub">Rastreio separado entre produção interna, externa e retorno</div></div></div><div className="lot-split">{state.lots.map((lot) => <div className="lot-card" key={lot.id}><div className="row"><span className="tag">{lot.type}</span><span className="muted mono">{lot.id}</span></div><div className="kpi-value">{iFmt(lot.qty)}<span className="currency">un.</span></div><div className="card-sub">OP {lot.opId} · {lot.location}</div><span className={'status-pill ' + (lot.status.includes('Aguardando') || lot.status.includes('pendente') ? 'status-pending' : 'status-draft')}>{lot.status}</span></div>)}</div></div>;

const ExternalProductionControl = ({ state, update }) => {
  const externalLots = state.lots.filter((lot) => lot.type === 'Externo');
  const [returns, setReturns] = useState({});
  const registerReturn = (lotId) => {
    const qty = Number(returns[lotId] || 0);
    if (!qty) return;
    update((next) => {
      const lot = next.lots.find((item) => item.id === lotId);
      if (!lot) return next;
      lot.sentQty = Number(lot.sentQty || lot.qty || 0);
      lot.returnedQty = Math.min(lot.sentQty, Number(lot.returnedQty || 0) + qty);
      const pending = Math.max(0, lot.sentQty - lot.returnedQty);
      lot.status = pending ? `Retorno parcial · ${iFmt(pending)} pendente` : 'Retornou completo';
      lot.location = pending ? lot.location : 'Montagem';
      lot.step = pending ? 'externa' : 'montagem';
      return next;
    });
    setReturns({ ...returns, [lotId]: '' });
  };
  return <div className="card">
    <div className="card-head"><div><div className="card-title">Controle do presídio / terceiros</div><div className="card-sub">Entrada e retorno batendo por lote, kits, carcaças e materiais enviados</div></div></div>
    <div className="external-grid">
      {externalLots.map((lot) => {
        const sent = Number(lot.sentQty || lot.qty || 0);
        const returned = Number(lot.returnedQty || 0);
        const pending = Math.max(0, sent - returned);
        return <div className="external-card" key={lot.id}>
          <div className="sector-card-head"><div><strong>{lot.id}</strong><span>OP {lot.opId} · {lot.location}</span></div><span className={'status-pill ' + (pending ? 'status-pending' : 'status-draft')}>{pending ? 'Pendente' : 'Batido'}</span></div>
          <div className="sector-mini-kpis">
            <div><span>Enviado</span><strong>{iFmt(sent)}</strong></div>
            <div><span>Retornou</span><strong>{iFmt(returned)}</strong></div>
            <div><span>Saldo</span><strong>{iFmt(pending)}</strong></div>
            <div><span>Conferência</span><strong>{pending ? 'Aberta' : 'OK'}</strong></div>
          </div>
          <div className="progress-rail"><span style={{ width: `${sent ? Math.min(100, returned / sent * 100) : 0}%` }} /></div>
          <div className="external-materials"><strong>Materiais</strong><span>{lot.materials || 'Kits, carcaças e materiais não informados.'}</span></div>
          <div className="external-return">
            <input type="number" inputMode="numeric" value={returns[lot.id] || ''} onChange={(e) => setReturns({ ...returns, [lot.id]: e.target.value })} placeholder="Qtd. retornou" />
            <button className="btn btn-primary" onClick={() => registerReturn(lot.id)}>Registrar retorno</button>
          </div>
        </div>;
      })}
      {!externalLots.length && <div className="muted">Nenhum lote externo cadastrado.</div>}
    </div>
  </div>;
};

const OperatorPanel = ({ state, update, profile, sector }) => {
  const visibleSteps = profile === 'operador' ? FLOW_STEPS.filter((s) => s.sector === sector) : FLOW_STEPS;
  const availableEmployees = state.employees.filter((employee) => profile !== 'operador' || employee.sector === sector);
  const [form, setForm] = useState({ opId: state.orders[0]?.id || 'OP-9101', step: visibleSteps[0]?.id || 'montagem', employee: availableEmployees[0]?.name || state.employees[0]?.name || '', qty: '100', losses: '0' });
  const start = () => update((next) => {
    const step = FLOW_STEPS.find((s) => s.id === form.step);
    if (!next.records.some((r) => r.opId === form.opId && r.step === form.step && r.status === 'Em produção')) next.records.unshift({ id: 'REC-' + Date.now(), opId: form.opId, step: form.step, sector: step?.sector, employee: form.employee, startedAt: stamp(), endedAt: '', qty: 0, losses: 0, status: 'Em produção' });
    const op = next.orders.find((o) => o.id === form.opId);
    if (op) { op.current = form.step; op.status = 'Em produção'; }
    next.lots.filter((lot) => lot.opId === form.opId && lot.type === 'Interno').forEach((lot) => { lot.step = form.step; lot.location = step?.name || step?.sector || lot.location; lot.status = 'Em produção'; });
    return next;
  });
  const finish = () => update((next) => {
    const step = FLOW_STEPS.find((s) => s.id === form.step);
    const rec = next.records.find((r) => r.opId === form.opId && r.step === form.step && r.status === 'Em produção');
    const qty = Number(form.qty || 0);
    const losses = Number(form.losses || 0);
    if (rec) { rec.endedAt = stamp(); rec.qty = qty; rec.losses = losses; rec.status = 'Finalizado'; }
    const employee = next.employees.find((item) => item.name === form.employee);
    if (employee) employee.produced = Number(employee.produced || 0) + Math.max(0, qty - losses);
    const op = next.orders.find((o) => o.id === form.opId);
    if (op) {
      const nextId = nextStep(form.step);
      op.current = nextId;
      op.status = nextId === 'expedicao' && form.step === 'expedicao' ? 'Finalizado' : 'Em produção';
      next.lots.filter((lot) => lot.opId === op.id && lot.type === 'Interno').forEach((lot) => { lot.step = nextId; lot.location = FLOW_STEPS.find((s) => s.id === nextId)?.name || step?.name; lot.status = op.status; });
    }
    return next;
  });
  const splitLot = () => update((next) => {
    const op = next.orders.find((o) => o.id === form.opId);
    if (!op) return next;
    op.externalQty = Number(op.externalQty || Math.round(Number(op.totalQty || 0) * 0.3));
    op.internalQty = Math.max(0, Number(op.totalQty || 0) - op.externalQty);
    if (!next.lots.some((l) => l.id === `${op.lot}-B`)) next.lots.push({ id: `${op.lot}-B`, opId: op.id, type: 'Externo', qty: op.externalQty, location: op.externalPartner || 'Produção externa', step: 'externa', status: 'Aguardando retorno' });
    return next;
  });
  const receiveExternal = () => update((next) => { next.lots.filter((l) => l.type === 'Externo' && l.opId === form.opId).forEach((l) => { l.location = 'Montagem'; l.step = 'montagem'; l.status = 'Retornou da produção externa'; }); return next; });
  return <div className="operator-panel"><div className="card"><div className="card-head"><div><div className="card-title">Tela rápida do setor</div><div className="card-sub">Uso no celular: escolher OP, iniciar/finalizar, apontar quantidade e perdas</div></div></div><div className="row-3"><div className="field"><label>OP</label><select value={form.opId} onChange={(e) => setForm({ ...form, opId: e.target.value })}>{state.orders.map((o) => <option value={o.id} key={o.id}>{o.id} · {o.product}</option>)}</select></div><div className="field"><label>Etapa</label><select value={form.step} onChange={(e) => setForm({ ...form, step: e.target.value })}>{visibleSteps.map((s) => <option value={s.id} key={s.id}>{s.name}</option>)}</select></div><div className="field"><label>Responsável</label><select value={form.employee} onChange={(e) => setForm({ ...form, employee: e.target.value })}>{(availableEmployees.length ? availableEmployees : state.employees).map((e) => <option key={e.id}>{e.name}</option>)}</select></div><div className="field"><label>Quantidade boa</label><input type="number" inputMode="numeric" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} /></div><div className="field"><label>Perdas</label><input type="number" inputMode="numeric" value={form.losses} onChange={(e) => setForm({ ...form, losses: e.target.value })} /></div></div><div className="operator-buttons"><button className="btn btn-primary" onClick={start}><Icon name="activity" /> Iniciar etapa</button><button className="btn" onClick={finish}><Icon name="check" /> Finalizar e enviar próxima</button><button className="btn" onClick={splitLot}>Separar produção externa</button><button className="btn" onClick={receiveExternal}>Receber externo</button></div></div><div className="card"><div className="card-title">Fila do setor</div><div className="card-sub">O operador vê somente o que precisa agir agora quando estiver no perfil operador.</div><div className="rank-list">{state.orders.filter((op) => profile !== 'operador' || visibleSteps.some((step) => step.id === op.current)).map((op) => <div className="rank-row" key={op.id}><div className="rank-pos">OP</div><div><strong>{op.id}</strong><div className="muted">{op.product} · {op.customer} · prazo {new Date(op.dueAt || op.dueDate).toLocaleDateString('pt-BR')}</div><div className="progress-rail"><span style={{ width: `${opProgress(op)}%` }} /></div></div><span className="tag">{FLOW_STEPS.find((s) => s.id === op.current)?.name}</span></div>)}</div></div></div>;
};

const EfficiencyView = ({ state, metrics, update }) => {
  const ranked = enrichEmployees(state).sort((a, b) => b.pph - a.pph);
  return <><IndustrialKpis metrics={metrics} /><EfficiencyDashboard state={state} metrics={metrics} ranked={ranked} /><ProcessControlDashboard state={state} metrics={metrics} sector={state.selectedSector} update={update} /><SectorDashboards state={state} metrics={metrics} ranked={ranked} /><PeopleAndSectorsAdmin state={state} update={update} /><div className="row-21"><div className="card"><div className="card-title">Eficiência por funcionário</div><div className="rank-list">{ranked.map((e, i) => <div className="rank-row" key={e.id}><div className="rank-pos">#{i + 1}</div><div><strong>{e.name}</strong><div className="muted">{e.role || 'Operador'} · {e.sector} · {iFmt(e.produced)} peças · {e.hours}h · {e.pph.toFixed(1)} p/h</div><div className="progress-rail"><span style={{ width: `${Math.min(100, e.produced / Math.max(e.goal, 1) * 100)}%` }} /></div>{e.capApplied && <div className="muted">Teto do setor aplicado: {iMoney(e.sectorCap)}</div>}</div><div className="num up">{iMoney(e.bonus)}</div></div>)}</div></div><div className="card"><div className="card-title">Eficiência por setor</div><div className="gantt">{metrics.sectorMap.map((s) => <div className="gantt-row" key={s.id}><span>{s.name}</span><div className="gantt-track"><span style={{ width: `${s.efficiency || 3}%` }} /></div><strong>{s.efficiency.toFixed(1)}%</strong></div>)}</div></div></div></>;
};

const ReportsView = ({ state, metrics }) => <><div className="print-only"><h1>CARVION Industrial — Relatório</h1></div><IndustrialKpis metrics={metrics} /><ReportsDashboard state={state} metrics={metrics} /><div className="row-3"><div className="insight-card"><div className="card-title">Produção por período</div><div className="kpi-value">{iFmt(metrics.totalProduced)}</div><div className="card-sub">peças registradas</div></div><div className="insight-card"><div className="card-title">Comissões e bônus</div><div className="kpi-value">{iMoney(metrics.bonusTotal)}</div><div className="card-sub">bônus automático com teto por setor</div></div><div className="insight-card"><div className="card-title">Gargalo</div><div className="kpi-value">{metrics.slowest.name}</div><div className="card-sub">menor eficiência atual</div></div></div><div className="card"><div className="card-head"><div><div className="card-title">Rastreabilidade completa</div><div className="card-sub">Início, fim, responsável, quantidade e perdas por etapa</div></div><button className="btn" onClick={() => window.print()}><Icon name="file" /> Imprimir / Exportar PDF</button></div><div className="table-wrap"><table className="table"><thead><tr><th>OP</th><th>Etapa</th><th>Responsável</th><th>Início</th><th>Fim</th><th>Qtd.</th><th>Perdas</th><th>Status</th></tr></thead><tbody>{state.records.map((r) => <tr key={r.id}><td className="mono">{r.opId}</td><td>{FLOW_STEPS.find((s) => s.id === r.step)?.name}</td><td>{r.employee}</td><td className="muted">{r.startedAt ? new Date(r.startedAt).toLocaleString('pt-BR') : '-'}</td><td className="muted">{r.endedAt ? new Date(r.endedAt).toLocaleString('pt-BR') : '-'}</td><td>{iFmt(r.qty)}</td><td>{iFmt(r.losses)}</td><td><span className="status-pill status-draft">{r.status}</span></td></tr>)}</tbody></table></div></div></>;

const IntegrationsView = ({ state, metrics }) => {
  const datasets = industrialDatasets(state, metrics);
  const [config, setConfig] = useState(() => {
    try { return JSON.parse(localStorage.getItem('carvion.industrial.integrations')) || { endpoint: '', apiKey: '', format: 'json' }; }
    catch { return { endpoint: '', apiKey: '', format: 'json' }; }
  });
  const [message, setMessage] = useState('');
  const saveConfig = (nextConfig) => {
    setConfig(nextConfig);
    localStorage.setItem('carvion.industrial.integrations', JSON.stringify(nextConfig));
  };
  const exportJson = () => downloadIndustrialFile('carvion-industrial-powerbi.json', JSON.stringify({ generatedAt: stamp(), datasets }, null, 2), 'application/json;charset=utf-8');
  const exportCsv = (name) => downloadIndustrialFile(`carvion-${name}.csv`, rowsToCsv(datasets[name] || []), 'text/csv;charset=utf-8');
  const sendWebhook = async () => {
    if (!config.endpoint) { setMessage('Informe a URL do webhook/API antes de enviar.'); return; }
    try {
      setMessage('Enviando dados para integração...');
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}) },
        body: JSON.stringify({ source: 'CARVION Industrial', generatedAt: stamp(), datasets }),
      });
      setMessage(response.ok ? 'Dados enviados com sucesso.' : `Integração respondeu com status ${response.status}.`);
    } catch (error) {
      setMessage(error.message || 'Não foi possível enviar para a integração.');
    }
  };
  const connectorCards = [
    ['Power BI', 'CSV/JSON normalizado para dashboards, refresh manual e futuro endpoint REST.'],
    ['Excel / Google Sheets', 'Arquivos CSV por tabela para análise, conciliação e importação.'],
    ['ERP / PCP / MRP', 'Webhook JSON com OPs, lotes, etapas, produtos, colaboradores e custos.'],
    ['Make / Zapier / n8n', 'POST único para automações, alertas, WhatsApp, e-mail e tarefas.'],
    ['Banco de dados / API', 'Formato pronto para PostgreSQL, BI, data lake ou backend NestJS.'],
    ['Power Automate', 'Payload JSON compatível com fluxos corporativos Microsoft.'],
  ];
  return <><div className="card industrial-command-card">
    <div className="card-head">
      <div><div className="card-title">Integrações e Power BI</div><div className="card-sub">CARVION Industrial conversando com BI, ERP, automações e qualquer sistema via CSV, JSON ou webhook</div></div>
      <button className="btn btn-primary" onClick={exportJson}><Icon name="inbox" /> Exportar pacote Power BI</button>
    </div>
    <div className="industrial-command-kpis report-kpis">
      <div><span>Datasets</span><strong>{Object.keys(datasets).length}</strong><small>tabelas prontas</small></div>
      <div><span>OPs</span><strong>{datasets.orders.length}</strong><small>ordens exportáveis</small></div>
      <div><span>Apontamentos</span><strong>{datasets.records.length}</strong><small>produção e perdas</small></div>
      <div><span>Produtos</span><strong>{datasets.products.length}</strong><small>catálogo e custos</small></div>
    </div>
    <div className="industrial-command-note">{message || 'Para Power BI: exporte o pacote JSON ou os CSVs abaixo. Quando o backend estiver publicado, este mesmo formato vira endpoint REST para atualização automática.'}</div>
  </div>

  <div className="integration-grid">
    {connectorCards.map(([name, description]) => <div className="integration-card" key={name}><strong>{name}</strong><span>{description}</span></div>)}
  </div>

  <div className="row-21">
    <div className="card">
      <div className="card-head"><div><div className="card-title">Datasets para BI</div><div className="card-sub">Baixe por tabela para Power BI, Excel ou importação em outro sistema</div></div></div>
      <div className="dataset-actions">
        {Object.keys(datasets).map((name) => <button className="btn" key={name} onClick={() => exportCsv(name)}>{name}.csv</button>)}
        <button className="btn btn-primary" onClick={exportJson}>pacote completo .json</button>
      </div>
    </div>
    <div className="card">
      <div className="card-head"><div><div className="card-title">Webhook / API externa</div><div className="card-sub">Envie o pacote completo para ERP, n8n, Make, Zapier, Power Automate ou backend próprio</div></div><button className="btn btn-primary" onClick={sendWebhook}>Enviar agora</button></div>
      <div className="row-3">
        <div className="field wide"><label>URL do webhook/API</label><input value={config.endpoint} onChange={(e) => saveConfig({ ...config, endpoint: e.target.value })} placeholder="https://sua-api.com/webhooks/carvion" /></div>
        <div className="field"><label>Token/API key</label><input value={config.apiKey} onChange={(e) => saveConfig({ ...config, apiKey: e.target.value })} placeholder="opcional" /></div>
        <div className="field"><label>Formato</label><select value={config.format} onChange={(e) => saveConfig({ ...config, format: e.target.value })}><option value="json">JSON</option><option value="csv">CSV por dataset</option></select></div>
      </div>
    </div>
  </div>

  <div className="card">
    <div className="card-head"><div><div className="card-title">Mapa de dados exportado</div><div className="card-sub">Tabelas que alimentam relatórios e integrações corporativas</div></div></div>
    <div className="table-wrap"><table className="table"><thead><tr><th>Dataset</th><th>Uso</th><th className="text-right">Registros</th></tr></thead><tbody>
      <tr><td className="mono">kpis</td><td>Indicadores executivos do painel industrial</td><td className="num">{datasets.kpis.length}</td></tr>
      <tr><td className="mono">orders</td><td>OPs, prazos, etapa atual, progresso e atraso</td><td className="num">{datasets.orders.length}</td></tr>
      <tr><td className="mono">lots</td><td>Rastreio de lote interno, externo e localização</td><td className="num">{datasets.lots.length}</td></tr>
      <tr><td className="mono">records</td><td>Apontamentos por etapa, responsável, perdas e horários</td><td className="num">{datasets.records.length}</td></tr>
      <tr><td className="mono">sectors</td><td>Eficiência, metas, bônus e teto por setor</td><td className="num">{datasets.sectors.length}</td></tr>
      <tr><td className="mono">employees</td><td>Produtividade, bônus, salário base e performance</td><td className="num">{datasets.employees.length}</td></tr>
      <tr><td className="mono">products</td><td>Produtos, modelos, custos, preços, estoque e BOM</td><td className="num">{datasets.products.length}</td></tr>
    </tbody></table></div>
  </div></>;
};

const DashboardView = ({ state, update, metrics, profile, sector }) => <><IndustrialKpis metrics={metrics} /><IndustrialHomeDashboard state={state} metrics={metrics} /><ProcessControlDashboard state={state} metrics={metrics} sector={sector} update={update} /><FlowBoard state={state} metrics={metrics} /><LotTracking state={state} /><ExternalProductionControl state={state} update={update} /><OperatorPanel state={state} update={update} profile={profile} sector={sector} /></>;

const IndustrialApp = () => {
  const [state, update] = useIndustrialRealtime();
  const metrics = useMemo(() => calcMetrics(state), [state]);
  const route = (location.pathname.split('/').filter(Boolean)[1] || 'dashboard').replace('.html', '');
  const titleMap = { dashboard: ['Dashboard Industrial', 'Power BI industrial em tempo real'], producao: ['Produção', 'Fluxo operacional, lote e operador'], produtos: ['Produtos Industriais', 'Importação de Excel, modelos e precificação'], eficiencia: ['Eficiência', 'Setores, funcionários, ranking e bônus'], relatorios: ['Relatórios', 'PDFs de produção, eficiência e comissões'], integracoes: ['Integrações', 'Power BI, APIs, webhooks e exportações corporativas'] };
  const setProfile = (profile) => update((next) => { next.activeProfile = profile; return next; });
  const setSector = (sector) => update((next) => { next.selectedSector = sector; return next; });
  return <div className="industrial-shell"><div className="industrial-layout"><IndustrialSidebar current={route} /><main className="main"><IndustrialTopbar title={titleMap[route]?.[0] || 'CARVION Industrial'} subtitle={titleMap[route]?.[1] || 'Controle industrial'} profile={state.activeProfile} setProfile={setProfile} sector={state.selectedSector} setSector={setSector} sectors={state.sectors} /><IndustrialTabs current={route} /><div className="content">{route === 'producao' ? <><ProcessControlDashboard state={state} metrics={metrics} sector={state.selectedSector} update={update} /><FlowBoard state={state} metrics={metrics} /><ProductionOrderCreator state={state} update={update} /><LotTracking state={state} /><ExternalProductionControl state={state} update={update} /><OperatorPanel state={state} update={update} profile={state.activeProfile} sector={state.selectedSector} /></> : route === 'produtos' ? <IndustrialProductsTable state={state} update={update} /> : route === 'eficiencia' ? <EfficiencyView state={state} metrics={metrics} update={update} /> : route === 'relatorios' ? <ReportsView state={state} metrics={metrics} /> : route === 'integracoes' ? <IntegrationsView state={state} metrics={metrics} /> : <DashboardView state={state} update={update} metrics={metrics} profile={state.activeProfile} sector={state.selectedSector} />}</div></main></div></div>;
};

ReactDOM.createRoot(document.getElementById('root')).render(<IndustrialApp />);
