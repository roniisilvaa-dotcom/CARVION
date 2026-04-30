/* CARVION — main app */

const { useState, useEffect, useMemo } = React;

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

const STORAGE_KEY = 'carvion.factory.v1';
const APP_RESET_KEY = 'carvion.app.reset.version';
const APP_RESET_VERSION = '2026-04-30-demo-values-v1';
const clone = (value) => JSON.parse(JSON.stringify(value));
const defaultState = () => ({
  transactions: clone(TRANSACTIONS),
  productionOrders: clone(PRODUCTION_ORDERS),
  materials: clone(MATERIALS),
  representatives: clone(REPRESENTATIVES),
  products: clone(PRODUCTS),
  clients: clone(CLIENTS),
  suppliers: [],
  invoices: [],
});
const loadAppState = () => {
  if (localStorage.getItem(APP_RESET_KEY) !== APP_RESET_VERSION) {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(APP_RESET_KEY, APP_RESET_VERSION);
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...defaultState(), ...JSON.parse(saved) } : defaultState();
  } catch {
    return defaultState();
  }
};
const parseMoney = (value) => Number(String(value).replace(/[^\d,.-]/g, '').replace('.', '').replace(',', '.')) || 0;
const parseNfeXml = (xmlText) => {
  const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('XML inválido.');
  const pick = (...selectors) => {
    for (const selector of selectors) {
      const value = doc.querySelector(selector)?.textContent?.trim();
      if (value) return value;
    }
    return '';
  };
  const emitName = pick('emit xNome', 'NFe emit xNome');
  const destName = pick('dest xNome', 'NFe dest xNome');
  const number = pick('ide nNF', 'NFe ide nNF');
  const series = pick('ide serie', 'NFe ide serie');
  const issueDate = pick('ide dhEmi', 'ide dEmi');
  const total = Number(pick('ICMSTot vNF', 'total ICMSTot vNF') || 0);
  const items = Array.from(doc.querySelectorAll('det')).map((det) => ({
    product: det.querySelector('prod xProd')?.textContent?.trim() || 'Item da NF-e',
    quantity: Number(det.querySelector('prod qCom')?.textContent || 0),
    unitValue: Number(det.querySelector('prod vUnCom')?.textContent || 0),
    total: Number(det.querySelector('prod vProd')?.textContent || 0),
    ncm: det.querySelector('prod NCM')?.textContent?.trim() || '',
    cfop: det.querySelector('prod CFOP')?.textContent?.trim() || '',
  }));
  if (!number && !total && !items.length) throw new Error('Não encontrei dados de NF-e nesse XML.');
  return {
    number,
    series,
    issueDate: issueDate ? issueDate.slice(0, 10) : '',
    emitName,
    destName,
    total,
    items,
  };
};
const todayLabel = () => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date()).replace('.', '');
const productByName = (products, name) => products.find((p) => p.name === name) || products[0];
const nfeItemKey = (item, index) => (item.ncm || item.product || `item-${index + 1}`).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 28) || `item-${index + 1}`;
const buildKpis = (state) => {
  const produced = state.productionOrders.reduce((sum, order) => sum + Number(order.qty || 0), 0);
  const realCost = state.productionOrders.reduce((sum, order) => sum + Number(order.real || order.estimated || 0), 0);
  const salesRevenue = state.transactions.filter((t) => t.type === 'in').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const costOut = state.transactions.filter((t) => t.type === 'out').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  return KPIS.map((k) => {
    if (k.id === 'daily-production') return { ...k, value: produced };
    if (k.id === 'unit-cost') return { ...k, value: produced ? realCost / produced : 0 };
    if (k.id === 'lot-profit') return { ...k, value: salesRevenue - costOut };
    if (k.id === 'efficiency') return { ...k, value: state.productionOrders.length ? Math.min(98, 78 + state.productionOrders.filter((o) => o.status === 'Finalizado').length * 2.4) : 0 };
    return k;
  });
};
const buildSecondaryKpis = (state) => {
  const openOrders = state.transactions.filter((t) => t.type === 'in').length;
  const reps = state.representatives.length;
  const commission = state.representatives.reduce((sum, r) => sum + Number(r.commission || 0), 0);
  const finishedStock = state.products.reduce((sum, p) => sum + Number(p.stock || 0), 0);
  const lowMaterials = state.materials.filter((m) => Number(m.stock || 0) <= Number(m.min || 0)).length;
  return [
    { id: 'waste', label: 'Perda de Matéria-prima', value: '0%', delta: 0, sub: 'sem perdas registradas', good: true },
    { id: 'orders', label: 'Pedidos em Aberto', value: String(openOrders), delta: 0, sub: openOrders ? 'pedidos lançados' : 'nenhum pedido cadastrado' },
    { id: 'reps', label: 'Representantes Ativos', value: String(reps), delta: 0, sub: reps ? 'representantes cadastrados' : 'nenhum representante cadastrado' },
    { id: 'commission', label: 'Comissões do Mês', value: fmtBRL(commission), delta: 0, sub: 'comissões calculadas' },
    { id: 'stock', label: 'Produto Final', value: `${fmtNum(finishedStock)} un.`, delta: 0, sub: finishedStock ? 'estoque de bolas cadastrado' : 'sem estoque final' },
    { id: 'materials', label: 'Alertas de Insumo', value: String(lowMaterials), delta: 0, sub: lowMaterials ? 'itens abaixo do mínimo' : 'sem alertas', good: true },
  ];
};

/* ===== DASHBOARD PAGE ===== */
const DashboardPage = ({ state, kpis, secondaryKpis, onAdd, period, showSecondary = true }) => {
  return (
    <>
      <div className="kpi-grid">
        {kpis.map((k) => (
          <div key={k.id} className="kpi">
            <div className="kpi-glow" style={{ background: k.color }} />
            <div className="kpi-head">
              <Icon name={k.icon} size={14} />
              <span>{k.label}</span>
            </div>
            <div className="kpi-value">
              {k.isPct ? (
                <>{k.value.toFixed(1).replace('.', ',')}<span className="currency">%</span></>
              ) : k.moneyPlain ? (
                <><span className="currency">R$</span>{k.value.toFixed(2).replace('.', ',')}</>
              ) : k.id === 'daily-production' ? (
                <>{fmtNum(k.value)}<span className="currency">un.</span></>
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
              <div className="card-title">Produção vs. Custo Industrial</div>
              <div className="card-sub">Bolas produzidas e custo real dos últimos 12 meses</div>
            </div>
            <div className="card-actions">
              <div className="chart-legend">
                <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--accent)' }} />Produção</span>
                <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--danger)' }} />Custo</span>
              </div>
              <button className="icon-btn" style={{ width: 30, height: 30 }}><Icon name="more" size={14} /></button>
            </div>
          </div>
          <RevenueExpenseChart data={REV_EXP} />
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Consumo de Matéria-prima</div>
              <div className="card-sub">Abril/26 · insumos e perdas</div>
            </div>
            <div className="card-actions">
              <button className="icon-btn" style={{ width: 30, height: 30 }}><Icon name="more" size={14} /></button>
            </div>
          </div>
          <DonutChart data={EXPENSE_CATS} size={180} />
        </div>
      </div>

      <div className="row-21">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Produção por Tipo de Bola</div>
              <div className="card-sub">Futebol · vôlei · basquete</div>
            </div>
            <div className="card-actions">
              <div className="chart-legend">
                <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--accent)' }} />Futebol</span>
                <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--info)' }} />Vôlei</span>
                <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--purple)' }} />Basquete</span>
              </div>
            </div>
          </div>
          <StackedBars data={REV_BY_PLAN} keys={['enterprise', 'business', 'starter']}
            colors={['var(--accent)', 'var(--info)', 'var(--purple)']} height={200} />
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Eficiência por Turno</div>
              <div className="card-sub">Corte · costura · montagem · acabamento</div>
            </div>
          </div>
          <Heatmap grid={HEATMAP} color="var(--accent)" />
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
            <div className="card-title">Pedidos, Custos e Comissões</div>
            <div className="card-sub">Vendas vinculadas a representantes, OPs e financeiro</div>
          </div>
          <div className="card-actions">
            <button className="btn btn-ghost"><Icon name="filter" size={13} /> Filtrar</button>
            <button className="btn"><Icon name="export" size={13} /> Exportar</button>
          </div>
        </div>
        <TransactionsTable rows={state.transactions} />
      </div>

      <div className="row-3">
        {ACCOUNTS.map((a, i) => (
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

      <div className="row-21">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Ordens de Produção Ativas</div>
              <div className="card-sub">Status por etapa, custo estimado e custo real</div>
            </div>
            <div className="card-actions">
              <button className="btn btn-primary" onClick={onAdd}><Icon name="plus" size={13} /> Nova OP</button>
            </div>
          </div>
          <ProductionTable rows={state.productionOrders} />
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Representantes</div>
              <div className="card-sub">Metas, pedidos e comissões</div>
            </div>
          </div>
          <RepresentativesList rows={state.representatives.slice(0, 4)} />
        </div>
      </div>

      {secondaryKpis && showSecondary && (
        <div className="row-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {secondaryKpis.map((k) => (
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

const TransactionsTable = ({ rows }) => {
  const colors = ['oklch(0.65 0.18 25)', 'oklch(0.70 0.15 295)', 'oklch(0.72 0.13 230)', 'oklch(0.74 0.17 155)', 'oklch(0.78 0.16 75)'];
  const initials = (s) => s.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Cliente / Origem</th>
            <th>Produto / Conta</th>
            <th>Representante / Método</th>
            <th>Status</th>
            <th>Data</th>
            <th className="text-right">Valor</th>
          </tr>
        </thead>
        <tbody>
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
                  {{ paid: 'Pago', pending: 'Pendente', overdue: 'Atrasado', draft: 'Rascunho' }[r.status]}
                </span>
              </td>
              <td className="muted">{r.date}</td>
              <td className={'num ' + (r.type === 'in' ? 'up' : 'down')}>
                {r.type === 'in' ? '+' : '−'} {fmtBRL(r.amount).replace('R$', '').trim()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ProductionTable = ({ rows }) => (
  <div className="table-wrap">
    <table className="table">
      <thead>
        <tr>
          <th>OP</th>
          <th>Produto</th>
          <th>Qtd.</th>
          <th>Etapa</th>
          <th>Status</th>
          <th className="text-right">Real x Estimado</th>
          <th className="text-right">Margem</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id}>
            <td className="muted mono">{r.id}</td>
            <td>{r.product}</td>
            <td className="mono">{fmtNum(r.qty)}</td>
            <td><span className="tag">{r.stage}</span></td>
            <td><span className={'status-pill ' + (r.status === 'Finalizado' ? 'status-paid' : r.status === 'Planejado' ? 'status-pending' : 'status-draft')}>{r.status}</span></td>
            <td className="num">{r.real ? fmtBRL(r.real) : fmtBRL(r.estimated)}</td>
            <td className="num up">{r.margin.toFixed(1).replace('.', ',')}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const MaterialsTable = ({ rows }) => (
  <div className="table-wrap">
    <table className="table">
      <thead>
        <tr>
          <th>SKU</th>
          <th>Material</th>
          <th>Unidade</th>
          <th>Estoque</th>
          <th>Mínimo</th>
          <th className="text-right">Custo/un.</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.sku}>
            <td className="muted mono">{r.sku}</td>
            <td>{r.name}</td>
            <td className="muted">{r.unit}</td>
            <td><span className={'status-pill status-' + r.status}>{fmtNum(r.stock)}</span></td>
            <td className="muted">{fmtNum(r.min)}</td>
            <td className="num">{fmtBRL(r.cost)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const InvoicesTable = ({ rows }) => (
  <div className="table-wrap">
    <table className="table">
      <thead>
        <tr>
          <th>Nota</th>
          <th>Fornecedor / Cliente</th>
          <th>Emissão</th>
          <th>Itens</th>
          <th>Status</th>
          <th className="text-right">Valor</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((nfe) => (
          <tr key={nfe.id}>
            <td className="muted mono">NF-e {nfe.number || 's/n'}<div className="muted">Série {nfe.series || '-'}</div></td>
            <td>{nfe.party}<div className="muted">{nfe.type === 'in' ? 'Receita / cliente' : 'Compra / fornecedor'}</div></td>
            <td className="muted">{nfe.issueDate || '-'}</td>
            <td>{nfe.items?.length || 0} itens</td>
            <td><span className={'status-pill status-' + (nfe.type === 'in' ? 'pending' : 'overdue')}>{nfe.type === 'in' ? 'A receber' : 'A pagar'}</span></td>
            <td className="num">{fmtBRL(nfe.total || 0)}</td>
          </tr>
        ))}
      </tbody>
    </table>
    {!rows.length && <EmptyState text="Nenhuma NF-e XML importada." />}
  </div>
);

const RepresentativesList = ({ rows }) => (
  <div className="rep-list">
    {rows.map((r) => {
      const progress = Math.min(100, Math.round((r.sales / r.goal) * 100));
      return (
        <div className="rep-row" key={r.id}>
          <div className="client-avatar">{r.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}</div>
          <div className="rep-meta">
            <div className="rep-title">{r.name}<span>{r.region}</span></div>
            <div className="rep-progress"><span style={{ width: progress + '%' }} /></div>
            <div className="rep-foot">{fmtBRL(r.sales)} de {fmtBRL(r.goal)} · {r.orders} pedidos</div>
          </div>
          <div className="num up">{fmtBRL(r.commission)}</div>
        </div>
      );
    })}
  </div>
);

const ProductsGrid = ({ rows }) => (
  <div className="product-grid">
    {rows.map((p) => (
      <div className="product-card" key={p.name}>
        {p.image ? <img src={p.image} alt={p.name} /> : <div className="product-empty-img">{(p.name || 'PR').slice(0, 2)}</div>}
        <div className="product-meta">
          <div className="product-title">{p.name}<span>{p.brand || p.type} · {p.line || 'Linha'} · {p.modality || p.type}</span></div>
          <div className="product-bom">{p.bom}</div>
          <div className="product-stats">
            <span>Custo {fmtBRL(p.cost)}</span>
            <span>Lojista {fmtBRL(p.dealerPrice || p.price)}</span>
            <span>Parceiro {fmtBRL(p.partnerPrice || p.price)}</span>
            <span>Final {fmtBRL(p.price)}</span>
            <span>Margem {p.margin.toFixed(1).replace('.', ',')}%</span>
            <span>Estoque {fmtNum(p.stock)}</span>
          </div>
        </div>
      </div>
    ))}
  </div>
);

const EmptyState = ({ text }) => (
  <div style={{ display: 'grid', placeItems: 'center', minHeight: 180, color: 'var(--text-faint)', textAlign: 'center' }}>
    <div>
      <Icon name="file" size={26} />
      <div style={{ marginTop: 8, fontSize: 13 }}>{text}</div>
    </div>
  </div>
);

const AccessDenied = () => (
  <div style={{ display: 'grid', placeItems: 'center', minHeight: 260, color: 'var(--text-faint)', textAlign: 'center' }}>
    <div>
      <Icon name="x" size={28} />
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-dim)', marginTop: 8 }}>Acesso negado</div>
      <div style={{ fontSize: 12.5, maxWidth: 360 }}>Seu perfil não possui permissão para acessar este módulo.</div>
    </div>
  </div>
);

const UsersAdmin = ({ data, onAction }) => {
  const [form, setForm] = useState({ name: '', email: '', login: '', phone: '', position: '', role: 'operador', status: 'ativo', password: 'Usuario@123', notes: '' });
  const submit = () => {
    const result = Carvion.createUser(form);
    onAction(result, result.ok ? 'Usuário criado.' : result.message);
    if (result.ok) setForm({ ...form, name: '', email: '', login: '' });
  };
  return (
    <>
      <div className="row-3">
        <div className="field"><label>Nome</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome completo" /></div>
        <div className="field"><label>E-mail</label><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="usuario@empresa.com" /></div>
        <div className="field"><label>Login</label><input value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} placeholder="usuario" /></div>
        <div className="field"><label>Telefone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(00) 00000-0000" /></div>
        <div className="field"><label>Cargo</label><input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="Cargo" /></div>
        <div className="field"><label>Perfil</label><select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>{Object.keys(Carvion.permissionsByRole).map((r) => <option key={r}>{r}</option>)}</select></div>
      </div>
      <button className="btn btn-primary" onClick={submit}><Icon name="plus" size={13} /> Criar usuário</button>
      <div style={{ marginTop: 16 }} className="table-wrap">
        <table className="table">
          <thead><tr><th>Usuário</th><th>Login</th><th>Perfil</th><th>Status</th><th>Último acesso</th><th>Ações</th></tr></thead>
          <tbody>{data.users.filter((u) => !u.deletedAt).map((u) => (
            <tr key={u.id}>
              <td>{u.name}<div className="muted" style={{ fontSize: 11 }}>{u.email}</div></td>
              <td className="mono">{u.login}</td>
              <td><span className="tag">{u.role}</span></td>
              <td><span className={'status-pill ' + (u.status === 'ativo' ? 'status-paid' : u.status === 'bloqueado' ? 'status-overdue' : 'status-pending')}>{u.status}</span></td>
              <td className="muted">{u.lastAccess ? new Date(u.lastAccess).toLocaleString('pt-BR') : 'Nunca'}</td>
              <td>
                <button className="btn btn-ghost" onClick={() => {
                  const result = Carvion.updateUser(u.id, { status: u.status === 'bloqueado' ? 'ativo' : 'bloqueado' });
                  if (result.ok && u.status !== 'bloqueado') Carvion.blockUserSessions(u.id, 'Usuário bloqueado pelo administrador');
                  onAction(result, 'Status atualizado.');
                }}>{u.status === 'bloqueado' ? 'Desbloquear' : 'Bloquear'}</button>
                <button className="btn btn-ghost" onClick={() => onAction(Carvion.updateUser(u.id, { status: u.status === 'ativo' ? 'inativo' : 'ativo' }), 'Ativação atualizada.')}>{u.status === 'ativo' ? 'Inativar' : 'Ativar'}</button>
                <button className="btn btn-ghost" onClick={() => onAction(Carvion.resetPassword(u.id, prompt('Nova senha forte', 'Reset@123') || ''), 'Senha redefinida.')}>Senha</button>
                <button className="btn btn-ghost" onClick={() => confirm('Excluir logicamente este usuário?') && onAction(Carvion.deleteUser(u.id), 'Usuário removido.')}>Excluir</button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </>
  );
};

const SessionsAdmin = ({ data, onAction }) => {
  const current = Carvion.currentSessionId();
  const visible = Carvion.hasPermission('sessions:manage') ? data.sessions : data.sessions.filter((s) => s.id === current);
  return (
    <>
      <div className="card-actions" style={{ marginBottom: 12 }}>
        <button className="btn" onClick={() => onAction(Carvion.endOtherSessions(), 'Outras sessões encerradas.')}>Encerrar outras sessões</button>
      </div>
      <div className="table-wrap">
      <table className="table">
        <thead><tr><th>Sessão</th><th>Usuário</th><th>Login</th><th>Última atividade</th><th>Dispositivo</th><th>Status</th><th>Ações</th></tr></thead>
        <tbody>{visible.map((s) => (
          <tr key={s.id}>
            <td className="mono">{s.id}{s.id === current && <div className="muted">sessão atual</div>}</td>
            <td>{s.userName}</td>
            <td>{new Date(s.loginAt).toLocaleString('pt-BR')}</td>
            <td>{new Date(s.lastActivity).toLocaleString('pt-BR')}</td>
            <td className="muted">{s.ip}<div>{s.device}</div></td>
            <td><span className={'status-pill ' + (s.status === 'ativa' ? 'status-paid' : s.status === 'bloqueada' ? 'status-overdue' : 'status-pending')}>{s.status}</span></td>
            <td>
              <button className="btn btn-ghost" onClick={() => onAction(Carvion.blockSession(s.id, 'Bloqueio manual'), 'Sessão bloqueada.')}>Bloquear</button>
              <button className="btn btn-ghost" onClick={() => onAction(Carvion.revokeSession(s.id), 'Sessão revogada.')}>Revogar</button>
              {s.id === current && <button className="btn btn-ghost" onClick={() => { Carvion.endCurrentSession(); location.href = 'auth/login.html'; }}>Encerrar atual</button>}
            </td>
          </tr>
        ))}</tbody>
      </table>
      {!visible.length && <EmptyState text="Nenhuma sessão registrada." />}
    </div>
    </>
  );
};

const AuditAdmin = ({ data, onAction }) => (
  <>
  <div className="card-actions" style={{ marginBottom: 12 }}>
    <button className="btn" onClick={() => onAction(Carvion.exportData('logs'), 'Auditoria exportada.')}>Exportar logs</button>
  </div>
  <div className="table-wrap">
    <table className="table">
      <thead><tr><th>Data</th><th>Usuário</th><th>Ação</th><th>Módulo</th><th>Descrição</th><th>Status</th></tr></thead>
      <tbody>{data.logs.map((log) => (
        <tr key={log.id}>
          <td className="muted">{new Date(log.at).toLocaleString('pt-BR')}</td>
          <td>{log.actor}</td>
          <td><span className="tag">{log.action}</span></td>
          <td>{log.module}</td>
          <td>{log.description}</td>
          <td><span className="status-pill status-paid">{log.status}</span></td>
        </tr>
      ))}</tbody>
    </table>
    {!data.logs.length && <EmptyState text="Nenhum evento de auditoria registrado." />}
  </div>
  </>
);

const OrdersAdmin = ({ data, onAction }) => {
  const [draft, setDraft] = useState({ customer: '', deliveryDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10), product: '', quantity: 0, unitValue: 0, observation: '' });
  const create = () => onAction(Carvion.createOrder({ customer: draft.customer, deliveryDate: draft.deliveryDate, notes: draft.observation, items: [{ id: 'tmp', product: draft.product, description: draft.product, quantity: Number(draft.quantity), observation: draft.observation, unitValue: Number(draft.unitValue), stickers: 0, perSheet: 1 }] }), 'Pedido criado.');
  return (
  <>
  <div className="row-3" style={{ marginBottom: 14 }}>
    <div className="field"><label>Cliente</label><input value={draft.customer} onChange={(e) => setDraft({ ...draft, customer: e.target.value })} placeholder="Cliente" /></div>
    <div className="field"><label>Entrega</label><input type="date" value={draft.deliveryDate} onChange={(e) => setDraft({ ...draft, deliveryDate: e.target.value })} /></div>
    <div className="field"><label>Produto</label><input value={draft.product} onChange={(e) => setDraft({ ...draft, product: e.target.value })} /></div>
    <div className="field"><label>Quantidade</label><input value={draft.quantity} onChange={(e) => setDraft({ ...draft, quantity: e.target.value })} /></div>
    <div className="field"><label>Valor unitário</label><input value={draft.unitValue} onChange={(e) => setDraft({ ...draft, unitValue: e.target.value })} /></div>
    <div className="field"><label>Observação</label><input value={draft.observation} onChange={(e) => setDraft({ ...draft, observation: e.target.value })} /></div>
  </div>
  <div className="card-actions" style={{ marginBottom: 12 }}><button className="btn btn-primary" onClick={create}><Icon name="plus" size={13} /> Criar pedido completo</button><button className="btn" onClick={() => onAction(Carvion.exportData('orders'), 'Pedidos exportados.')}>Exportar pedidos</button></div>
  <div className="table-wrap">
    <table className="table">
      <thead><tr><th>Pedido</th><th>Cliente</th><th>Entrega</th><th>Status</th><th>Itens</th><th className="text-right">Total</th><th>Ações</th></tr></thead>
      <tbody>{data.orders.filter((o) => !o.deletedAt).map((o) => {
        const totals = Carvion.calculateTotals(o.items);
        return (
          <tr key={o.id}>
            <td className="mono">{o.number}<div className="muted">{o.requestDate}</div></td>
            <td>{o.customer}<div className="muted">{o.company}</div></td>
            <td>{o.deliveryDate}</td>
            <td><span className={'status-pill ' + (o.status === 'emitido' ? 'status-paid' : o.status === 'cancelado' ? 'status-overdue' : 'status-pending')}>{o.status}</span></td>
            <td>{totals.totalItems} un.<div className="muted">{totals.totalSheets} folhas</div></td>
            <td className="num">{fmtBRL(totals.total)}</td>
            <td>
              <button className="btn btn-ghost" onClick={() => onAction(Carvion.emitOrder(o.id), 'Pedido emitido.')}>Emitir</button>
              <button className="btn btn-ghost" onClick={() => onAction(Carvion.updateOrder(o.id, { status: 'em análise' }), 'Pedido enviado para análise.')}>Analisar</button>
              <button className="btn btn-ghost" onClick={() => onAction(Carvion.updateOrder(o.id, { customer: prompt('Cliente', o.customer) || o.customer, deliveryDate: prompt('Prazo de entrega', o.deliveryDate) || o.deliveryDate }), 'Pedido editado.')}>Editar</button>
              <button className="btn btn-ghost" onClick={() => onAction(Carvion.duplicateOrder(o.id), 'Pedido duplicado.')}>Duplicar</button>
              <button className="btn btn-ghost" onClick={() => onAction(Carvion.cancelOrder(o.id, prompt('Motivo do cancelamento') || ''), 'Pedido cancelado.')}>Cancelar</button>
              <button className="btn btn-ghost" onClick={() => confirm('Excluir logicamente este pedido?') && onAction(Carvion.deleteOrder(o.id), 'Pedido removido.')}>Excluir</button>
              <button className="btn btn-ghost" onClick={() => { const product = prompt('Produto do novo item', '') || ''; const quantity = Number(prompt('Quantidade', '0') || 0); const unitValue = Number(prompt('Valor unitário', '0') || 0); onAction(Carvion.addOrderItem(o.id, { product, description: product, quantity, unitValue, observation: '', stickers: 0, perSheet: 1 }), 'Item adicionado.'); }}>+ Item</button>
              {o.items?.[0] && <button className="btn btn-ghost" onClick={() => onAction(Carvion.removeOrderItem(o.id, o.items[0].id), 'Item removido.')}>- Item</button>}
              <button className="btn btn-ghost" onClick={() => window.print()}>PDF</button>
            </td>
          </tr>
        );
      })}</tbody>
    </table>
  </div>
  </>
  );
};

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

/* ===== ADD ORDER / COST MODAL ===== */
const AddTxModal = ({ onClose, onSave, state }) => {
  const [type, setType] = useState('in');
  const [amount, setAmount] = useState('0');
  const [client, setClient] = useState(state.clients[0]?.name || '');
  const [product, setProduct] = useState(state.products[0]?.name || state.materials[0]?.name || '');
  const [owner, setOwner] = useState(state.representatives[0]?.name || 'Corte');
  const [qty, setQty] = useState('0');
  const [notes, setNotes] = useState('');
  const [nfe, setNfe] = useState(null);
  const [xmlError, setXmlError] = useState('');
  const handleXmlUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setXmlError('');
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseNfeXml(String(reader.result || ''));
        const totalQty = parsed.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
        const firstItem = parsed.items[0];
        setType('out');
        setAmount(String(parsed.total || parsed.items.reduce((sum, item) => sum + Number(item.total || 0), 0)));
        setQty(String(totalQty || 0));
        setClient(parsed.emitName || 'Fornecedor da NF-e');
        setProduct(firstItem?.product || 'Itens da NF-e');
        setOwner('NF-e XML');
        setNotes(`NF-e ${parsed.number || 's/n'}${parsed.series ? ` série ${parsed.series}` : ''} importada via XML. ${parsed.items.length} item(ns).`);
        setNfe({ ...parsed, fileName: file.name });
      } catch (error) {
        setXmlError(error.message || 'Não foi possível ler a NF-e XML.');
        setNfe(null);
      }
    };
    reader.readAsText(file);
  };
  const handleSave = () => {
    onSave({
      type,
      amount: parseMoney(amount),
      client,
      product,
      owner,
      qty: Number(qty) || 0,
      notes,
      nfe,
    });
    onClose();
  };
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">Novo Pedido / Ordem de Produção</div>
          <div className="spacer" />
          <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={onClose}><Icon name="x" size={14} /></button>
        </div>
        <div className="modal-body">
          <div className="type-toggle">
            <button className={(type === 'in' ? 'active income' : '')} onClick={() => setType('in')}>
              <Icon name="arrow-down-left" size={14} /> Pedido
            </button>
            <button className={(type === 'out' ? 'active expense' : '')} onClick={() => setType('out')}>
              <Icon name="arrow-up-right" size={14} /> Custo
            </button>
          </div>
          <div className="xml-import">
            <div>
              <div className="xml-title"><Icon name="file" size={14} /> Importar NF-e XML</div>
              <div className="xml-sub">Lê a nota, abastece estoque, cria lançamento financeiro e registra a conta a pagar.</div>
            </div>
            <label className="btn">
              <Icon name="download" size={13} /> Selecionar XML
              <input type="file" accept=".xml,text/xml,application/xml" onChange={handleXmlUpload} hidden />
            </label>
          </div>
          {nfe && (
            <div className="xml-summary">
              <strong>NF-e {nfe.number || 's/n'}</strong>
              <span>{nfe.emitName || 'Fornecedor'} · {nfe.items.length} item(ns) · {fmtBRL(nfe.total || 0)}</span>
            </div>
          )}
          {xmlError && <div className="xml-error">{xmlError}</div>}
          <div className="field">
            <label>{type === 'in' ? 'Valor do pedido' : 'Custo real apontado'}</label>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="R$ 0,00" />
          </div>
          <div className="field">
            <label>Quantidade</label>
            <input value={qty} onChange={(e) => setQty(e.target.value)} placeholder="0" />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Data</label>
              <input type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
            </div>
            <div className="field">
              <label>Entrega prevista</label>
              <input type="date" defaultValue={new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)} />
            </div>
          </div>
          <div className="field">
            <label>{type === 'in' ? 'Cliente' : 'Centro de custo'}</label>
            <input value={client} onChange={(e) => setClient(e.target.value)} placeholder={type === 'in' ? 'Selecione cliente e representante' : 'Matéria-prima, mão de obra ou custo fixo'} />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Produto / Material</label>
              <select value={product} onChange={(e) => setProduct(e.target.value)}>
                {state.products.map((p) => <option key={p.name}>{p.name}</option>)}
                {state.materials.map((m) => <option key={m.sku}>{m.name}</option>)}
                {!state.products.length && !state.materials.length && <option value="">Nenhum produto/material cadastrado</option>}
              </select>
            </div>
            <div className="field">
              <label>Representante / Etapa</label>
              <select value={owner} onChange={(e) => setOwner(e.target.value)}>
                {state.representatives.map((r) => <option key={r.id}>{r.name}</option>)}
                <option>Corte</option><option>Costura</option><option>Montagem</option><option>Acabamento</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label>Descrição</label>
            <textarea rows="2" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Quantidade, lote, observações comerciais ou apontamento da produção" />
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave}><Icon name="check" size={13} /> Salvar lançamento</button>
        </div>
      </div>
    </div>
  );
};

/* ===== APP ROOT ===== */
const App = () => {
  const [active, setActive] = useState('dashboard');
  const [period, setPeriod] = useState('mes');
  const [showModal, setShowModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [appState, setAppState] = useState(loadAppState);
  const [adminData, setAdminData] = useState(() => Carvion.load());
  const [toast, setToast] = useState('');
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const kpis = useMemo(() => buildKpis(appState), [appState]);
  const secondaryKpis = useMemo(() => buildSecondaryKpis(appState), [appState]);
  const sessionInfo = Carvion.validateSession();
  const currentUser = sessionInfo.user;
  const moduleTabs = NAV.flatMap((group) => group.items.map((item) => ({ ...item, group: group.group })))
    .filter((item) => Carvion.canAccessModule(item.id, currentUser));

  useEffect(() => {
    Carvion.requireAuth();
    const timer = setInterval(() => {
      const result = Carvion.validateSession();
      if (!result.ok) {
        alert(`Sessão ${result.reason}. Faça login novamente.`);
        Carvion.logout();
        location.href = 'auth/login.html';
      }
      setAdminData(Carvion.load());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  }, [appState]);

  const saveEntry = (entry) => {
    setAppState((current) => {
      const next = clone(current);
      const product = productByName(next.products, entry.product);
      const unitCost = Number(product?.cost || 22.8);
      const estimated = entry.qty * unitCost;
      const isSale = entry.type === 'in';
      const date = todayLabel();
      const idSuffix = String(Date.now()).slice(-4);
      const hasNfe = !!entry.nfe;
      const nfeNumber = entry.nfe?.number || idSuffix;
      const partyName = entry.client || (isSale ? 'Cliente não informado' : 'Fornecedor não informado');

      next.transactions.unshift({
        id: hasNfe ? `NFE-${nfeNumber}` : (isSale ? 'PED-' : 'CST-') + idSuffix,
        date: entry.nfe?.issueDate ? new Date(entry.nfe.issueDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '') : date,
        client: partyName,
        plan: hasNfe ? `NF-e XML ${nfeNumber}` : entry.product,
        amount: entry.amount,
        type: isSale ? 'in' : 'out',
        status: isSale ? 'pending' : (hasNfe ? 'pending' : 'paid'),
        method: hasNfe ? `XML · ${entry.nfe?.fileName || 'NF-e'}` : (isSale ? `Rep. ${entry.owner}` : entry.owner),
      });

      if (hasNfe) {
        next.invoices.unshift({
          id: `nfe-${nfeNumber}-${idSuffix}`,
          number: entry.nfe.number,
          series: entry.nfe.series,
          issueDate: entry.nfe.issueDate,
          party: partyName,
          type: isSale ? 'in' : 'out',
          total: entry.amount,
          fileName: entry.nfe.fileName,
          items: entry.nfe.items,
        });
      }

      if (hasNfe && !isSale) {
        if (partyName && !next.suppliers.some((supplier) => supplier.name.toLowerCase() === partyName.toLowerCase())) {
          next.suppliers.unshift({
            name: partyName,
            document: '',
            segment: 'Fornecedor via NF-e',
            total: entry.amount,
            lastInvoice: entry.nfe.number || '',
          });
        } else {
          next.suppliers = next.suppliers.map((supplier) => supplier.name.toLowerCase() === partyName.toLowerCase()
            ? { ...supplier, total: Number(supplier.total || 0) + entry.amount, lastInvoice: entry.nfe.number || supplier.lastInvoice }
            : supplier);
        }
        entry.nfe.items.forEach((item, index) => {
          const key = nfeItemKey(item, index);
          const existing = next.materials.find((material) => material.sku === `XML-${key}` || material.name.toLowerCase() === item.product.toLowerCase());
          if (existing) {
            existing.stock = Number(existing.stock || 0) + Number(item.quantity || 0);
            existing.cost = Number(item.unitValue || existing.cost || 0);
            existing.status = existing.stock <= existing.min ? 'pending' : 'paid';
          } else {
            next.materials.unshift({
              sku: `XML-${key}`,
              name: item.product,
              unit: 'un.',
              stock: Number(item.quantity || 0),
              min: 0,
              cost: Number(item.unitValue || 0),
              status: 'paid',
              ncm: item.ncm,
              cfop: item.cfop,
            });
          }
        });
      }

      if (hasNfe && isSale) {
        if (partyName && !next.clients.some((c) => c.name.toLowerCase() === partyName.toLowerCase())) {
          next.clients.unshift({ name: partyName, city: 'A definir', segment: 'Cliente via NF-e', revenue: entry.amount, rep: entry.owner });
        }
        entry.nfe.items.forEach((item, index) => {
          const existing = next.products.find((p) => p.name.toLowerCase() === item.product.toLowerCase());
          if (existing) {
            existing.stock = Math.max(0, Number(existing.stock || 0) - Number(item.quantity || 0));
            existing.price = Number(item.unitValue || existing.price || 0);
          } else {
            next.products.unshift({
              name: item.product,
              type: 'Produto NF-e',
              image: '',
              price: Number(item.unitValue || 0),
              cost: 0,
              stock: 0,
              margin: 0,
              bom: `NCM ${item.ncm || '-'}`,
            });
          }
        });
      }

      if (hasNfe) {
        return next;
      }

      if (isSale) {
        const repIndex = next.representatives.findIndex((r) => r.name === entry.owner);
        if (repIndex >= 0) {
          next.representatives[repIndex].sales += entry.amount;
          next.representatives[repIndex].orders += 1;
          next.representatives[repIndex].commission += entry.amount * 0.04;
        }
        if (entry.client && !next.clients.some((c) => c.name.toLowerCase() === entry.client.toLowerCase())) {
          next.clients.unshift({
            name: entry.client,
            city: 'A definir',
            segment: 'Novo cliente',
            revenue: entry.amount,
            rep: entry.owner,
          });
        }
        next.productionOrders.unshift({
          id: 'OP-' + idSuffix,
          product: entry.product,
          qty: entry.qty,
          status: 'Planejado',
          stage: 'Corte',
          estimated,
          real: 0,
          margin: entry.amount ? ((entry.amount - estimated) / entry.amount) * 100 : 0,
        });
        Carvion.createOrder({
          customer: entry.client,
          deliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          notes: entry.notes,
          items: [{
            id: 'item-' + Date.now(),
            product: entry.product,
            description: entry.product,
            quantity: entry.qty,
            observation: entry.notes,
            unitValue: entry.qty ? entry.amount / entry.qty : entry.amount,
            stickers: 0,
            perSheet: 1,
          }],
        });
      }

      if (!isSale) {
        const order = next.productionOrders[0];
        if (order) {
          order.real = Number(order.real || order.estimated || 0) + entry.amount;
          order.status = 'Em produção';
          order.stage = entry.owner;
          order.margin = order.real ? Math.max(0, 100 - (order.real / Math.max(order.estimated * 1.55, 1)) * 100) : order.margin;
        }
      }

      return next;
    });
    setAdminData(Carvion.load());
    setToast('Lançamento salvo com sucesso.');
    setTimeout(() => setToast(''), 3500);
  };

  const resetDemo = () => {
    if (!confirm('Resetar todos os dados e recarregar a apresentação DEMO?')) return;
    const result = Carvion.resetDemoData({ loginAdmin: true });
    if (!result.ok) {
      setToast(result.message || 'Não foi possível resetar a demo.');
      setTimeout(() => setToast(''), 3500);
      return;
    }
    setAppState(defaultState());
    setAdminData(Carvion.load());
    setActive('dashboard');
    setToast('DEMO resetada e pronta para apresentação.');
    setTimeout(() => setToast(''), 3500);
  };

  const handleAdminAction = (result, successMessage) => {
    setToast(result?.ok ? successMessage : (result?.message || 'Ação não concluída.'));
    setAdminData(Carvion.load());
    setTimeout(() => setToast(''), 3500);
  };

  const logout = () => {
    Carvion.logout();
    location.href = 'auth/login.html';
  };

  useEffect(() => {
    document.documentElement.dataset.theme = tweaks.theme;
    document.documentElement.dataset.density = tweaks.density;
    document.documentElement.style.setProperty('--accent', ACCENT_MAP[tweaks.accent] || ACCENT_MAP.verde);
    document.documentElement.style.setProperty('--accent-soft', `color-mix(in oklch, ${ACCENT_MAP[tweaks.accent] || ACCENT_MAP.verde} 14%, transparent)`);
  }, [tweaks.theme, tweaks.accent, tweaks.density]);

  const pageTitles = {
    dashboard: ['Dashboard Industrial', 'CARVION · Abril 2026'],
    production: ['Ordens de Produção', 'Corte, costura, montagem e acabamento'],
    materials: ['Matéria-prima', 'Estoque, consumo e custo por unidade'],
    costing: ['Custo por Bola', 'Material + mão de obra + fixo rateado'],
    sales: ['Vendas & Pedidos', 'Clientes, representantes, faturamento e margem'],
    representatives: ['Representantes', 'Metas, regiões, pedidos e comissões'],
    clients: ['Clientes', 'Atacado, distribuidores, escolas e varejo'],
    commissions: ['Comissões', 'Cálculo por pedido, região e recebimento'],
    products: ['Produtos com Imagem', 'BOM, ficha técnica e estoque final'],
    'finished-stock': ['Produto Final', 'Entrada por OP, saída por venda e lote'],
    suppliers: ['Fornecedores', 'Insumos, prazos e contratos'],
    cashflow: ['Fluxo de Caixa', 'Entradas, saídas e custos fixos da fábrica'],
    payables: ['Contas a Pagar', 'Matéria-prima, folha, energia e máquinas'],
    receivables: ['Contas a Receber', 'Pedidos faturados e vencimentos'],
    analytics: ['Analytics Industrial', 'Eficiência, desperdício, previsão e lucro'],
    reports: ['Relatórios', 'DRE industrial, produção e vendas exportáveis'],
    settings: ['Multiempresa', 'Fábricas, usuários, permissões e integrações'],
  };
  const [title, sub] = pageTitles[active] || ['', ''];

  return (
    <div className="app">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <aside className={'sidebar' + (sidebarOpen ? ' open' : '')}>
        <div className="brand">
          <div className="brand-mark">CV</div>
          <div>
            <div className="brand-name">CARVION</div>
            <div className="brand-sub">Gestão empresarial inteligente</div>
          </div>
        </div>
        {NAV.map((g) => (
          <div key={g.group}>
            <div className="nav-label">{g.group}</div>
            {g.items.map((it) => (
              <button key={it.id}
                className={'nav-item' + (active === it.id ? ' active' : '')}
                onClick={() => {
                  if (!Carvion.canAccessModule(it.id, currentUser)) {
                    setToast('Acesso negado para este módulo.');
                    setActive(it.id);
                    setSidebarOpen(false);
                    return;
                  }
                  setActive(it.id); setSidebarOpen(false);
                }}>
                <Icon name={it.icon} />
                <span>{it.label}</span>
                {it.badge && <span className="nav-badge">{it.badge}</span>}
              </button>
            ))}
          </div>
        ))}
        <div className="sidebar-foot">
          <div className="user-card" onClick={logout} title="Sair com segurança">
            <div className="avatar">CV</div>
            <div className="user-meta">
              <div className="user-name">{currentUser?.name || 'Usuário'}</div>
              <div className="user-role">{currentUser?.role || 'sessão'}</div>
            </div>
            <Icon name="chevron-down" size={14} />
          </div>
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
            <input placeholder="Buscar pedidos, OPs, clientes..." />
            <span className="kbd">⌘K</span>
          </div>
          <button className="icon-btn" onClick={() => setTweak('theme', tweaks.theme === 'dark' ? 'light' : 'dark')}>
            <Icon name={tweaks.theme === 'dark' ? 'sun' : 'moon'} size={15} />
          </button>
          <button className="icon-btn"><Icon name="bell" size={15} /><span className="dot" /></button>
          <button className="btn demo-action" onClick={resetDemo}><Icon name="shuffle" size={13} /><span className="always">DEMO</span></button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Icon name="plus" size={13} /><span>Novo Pedido</span>
          </button>
        </header>

        <nav className="module-tabs" aria-label="Áreas do sistema">
          {moduleTabs.map((item) => (
            <button
              key={item.id}
              className={active === item.id ? 'active' : ''}
              onClick={() => setActive(item.id)}
              title={item.group}
            >
              <Icon name={item.icon} size={14} />
              <span>{item.label}</span>
              {item.badge && <small>{item.badge}</small>}
            </button>
          ))}
        </nav>

        <div className="content">
          <div className="filterbar">
            <div className="segmented">
              {[['hoje','Hoje'],['semana','Semana'],['mes','Mês'],['trimestre','Trimestre'],['ano','Ano']].map(([k, l]) => (
                <button key={k} className={period === k ? 'active' : ''} onClick={() => setPeriod(k)}>{l}</button>
              ))}
            </div>
            <span className="chip"><Icon name="calendar" size={12} /> 1 abr — 28 abr</span>
            <span className="chip">Todas as fábricas <Icon name="chevron-down" size={12} /></span>
            <div className="spacer" />
            <span className="chip" style={{ color: 'var(--accent)', borderColor: 'oklch(0.74 0.17 155 / 0.4)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} /> Sessão {sessionInfo.session?.status || 'ativa'}
            </span>
          </div>
          {toast && <div className="chip" style={{ color: toast.includes('negado') || toast.includes('não') ? 'var(--danger)' : 'var(--accent)', borderColor: 'var(--border)' }}>{toast}</div>}

          {active === 'dashboard' && <DashboardPage state={appState} kpis={kpis} secondaryKpis={secondaryKpis} onAdd={() => setShowModal(true)} period={period} showSecondary={tweaks.showSecondaryKpis} />}
          {active !== 'dashboard' && (
            <div className="card" style={{ minHeight: 400, padding: 32 }}>
              <div className="card-head">
                <div>
                  <div className="card-title">{title}</div>
                  <div className="card-sub">{sub}</div>
                </div>
                <div className="card-actions">
                  <button className="btn"><Icon name="filter" size={13} /> Filtrar</button>
                  <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Icon name="plus" size={13} /> Adicionar
                  </button>
                </div>
              </div>
              {Carvion.canAccessModule(active, currentUser)
                ? <PlaceholderForSection id={active} state={appState} adminData={adminData} onAction={handleAdminAction} />
                : <AccessDenied />}
            </div>
          )}
        </div>

        <MobileTab active={active} onChange={setActive} onAdd={() => setShowModal(true)} />
      </main>

      {showModal && <AddTxModal state={appState} onSave={saveEntry} onClose={() => setShowModal(false)} />}

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
const PlaceholderForSection = ({ id, state, adminData, onAction }) => {
  if (id === 'users-admin') {
    return <UsersAdmin data={adminData} onAction={onAction} />;
  }
  if (id === 'sessions-admin') {
    return <SessionsAdmin data={adminData} onAction={onAction} />;
  }
  if (id === 'audit-admin') {
    return <AuditAdmin data={adminData} onAction={onAction} />;
  }
  if (id === 'orders-admin') {
    return <OrdersAdmin data={adminData} onAction={onAction} />;
  }
  if (id === 'production') {
    return <ProductionTable rows={state.productionOrders} />;
  }
  if (id === 'materials') {
    return <MaterialsTable rows={state.materials} />;
  }
  if (id === 'products') {
    return <ProductsGrid rows={state.products} />;
  }
  if (id === 'representatives' || id === 'commissions') {
    return <RepresentativesList rows={state.representatives} />;
  }
  if (id === 'clients') {
    return (
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Cliente</th><th>Cidade</th><th>Segmento</th><th>Representante</th><th className="text-right">Receita</th></tr></thead>
          <tbody>{state.clients.map((c) => (
            <tr key={c.name}><td>{c.name}</td><td className="muted">{c.city}</td><td><span className="tag">{c.segment}</span></td><td>{c.rep}</td><td className="num up">{fmtBRL(c.revenue)}</td></tr>
          ))}</tbody>
        </table>
      </div>
    );
  }
  if (id === 'sales' || id === 'cashflow' || id === 'payables' || id === 'receivables' || id === 'finished-stock') {
    return (
      <>
        {(id === 'payables' || id === 'receivables') && <InvoicesTable rows={state.invoices.filter((nfe) => id === 'receivables' ? nfe.type === 'in' : nfe.type === 'out')} />}
        <RevenueExpenseChart data={REV_EXP} height={300} />
        <div style={{ marginTop: 16 }}>
          <TransactionsTable rows={state.transactions.filter(t => id === 'cashflow' || id === 'sales' || id === 'finished-stock' || (id === 'receivables' ? t.type === 'in' : t.type === 'out'))} />
        </div>
      </>
    );
  }
  if (id === 'costing' || id === 'analytics' || id === 'reports') {
    return (
      <div className="row-3" style={{ marginTop: 12 }}>
        {[
          ['Custo total', 'matéria-prima + mão de obra + fixo rateado', 'R$ 0'],
          ['Lucro projetado', 'pedidos fechados contra custo real', 'R$ 0'],
          ['Previsão IA', 'capacidade restante para 7 dias', '0 bolas'],
        ].map(([title, sub, value]) => (
          <div key={title} className="insight-card">
            <div className="card-title">{title}</div>
            <div className="kpi-value" style={{ marginTop: 10 }}>{value}</div>
            <div className="card-sub">{sub}</div>
          </div>
        ))}
      </div>
    );
  }
  if (id === 'suppliers') {
    return (
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Fornecedor</th><th>Origem</th><th>Última NF-e</th><th className="text-right">Total importado</th></tr></thead>
          <tbody>{state.suppliers.map((supplier) => (
            <tr key={supplier.name}><td>{supplier.name}</td><td><span className="tag">{supplier.segment}</span></td><td className="muted mono">{supplier.lastInvoice || '-'}</td><td className="num">{fmtBRL(supplier.total || 0)}</td></tr>
          ))}</tbody>
        </table>
        {!state.suppliers.length && <EmptyState text="Nenhum fornecedor cadastrado por NF-e XML." />}
      </div>
    );
  }
  if (id === 'settings') {
    return (
      <div className="row-3" style={{ marginTop: 12 }}>
        {ACCOUNTS.map((a, i) => (
          <div key={i} style={{ padding: 16, border: '1px solid var(--border-soft)', borderRadius: 12, background: 'var(--bg-elev)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: a.color, display: 'grid', placeItems: 'center', color: 'white', fontWeight: 700, fontSize: 11 }}>{a.logo}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>{a.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{a.branch}</div>
              </div>
              <span className="status-pill status-paid">ativo</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 600 }}>{fmtBRL(a.balance)}</div>
            <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4 }}>Tenant isolado · dados por fábrica</div>
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
