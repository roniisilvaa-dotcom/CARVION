/* GRUPO CA.RO — main app */

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

/* ===== DASHBOARD PAGE ===== */
const DashboardPage = ({ onAdd, period, showSecondary = true }) => {
  return (
    <>
      <div className="kpi-grid">
        {KPIS.map((k) => (
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
              <div className="card-sub">Últimos 12 meses</div>
            </div>
            <div className="card-actions">
              <div className="chart-legend">
                <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--accent)' }} />Receita</span>
                <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--danger)' }} />Despesa</span>
              </div>
              <button className="icon-btn" style={{ width: 30, height: 30 }}><Icon name="more" size={14} /></button>
            </div>
          </div>
          <RevenueExpenseChart data={REV_EXP} />
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Despesas por Categoria</div>
              <div className="card-sub">Abril/26 · R$ 2,15M</div>
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
          <StackedBars data={REV_BY_PLAN} keys={['enterprise', 'business', 'starter']}
            colors={['var(--accent)', 'var(--info)', 'var(--purple)']} height={200} />
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Movimentação Diária</div>
              <div className="card-sub">Volume de transações · 14 dias</div>
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
            <div className="card-title">Transações Recentes</div>
            <div className="card-sub">Últimas movimentações</div>
          </div>
          <div className="card-actions">
            <button className="btn btn-ghost"><Icon name="filter" size={13} /> Filtrar</button>
            <button className="btn"><Icon name="export" size={13} /> Exportar</button>
          </div>
        </div>
        <TransactionsTable rows={TRANSACTIONS} />
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

      {SECONDARY_KPIS && showSecondary && (
        <div className="row-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {SECONDARY_KPIS.map((k) => (
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
            <th>Categoria</th>
            <th>Método</th>
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

const FiscalDocsPage = () => {
  const [docType, setDocType] = useState('nfe');
  const types = [
    ['nfe', 'NF-e', 'produto'],
    ['nfse', 'NFS-e', 'servico'],
    ['nfce', 'NFC-e', 'consumidor'],
  ];
  const docs = [
    ['000142', 'Construtora Topo', 'R$ 12.480,00', 'paid', 'autorizada'],
    ['000141', 'Padaria Doce ME', 'R$ 2.350,00', 'paid', 'autorizada'],
    ['000140', 'Restaurante Mar', 'R$ 4.890,00', 'pending', 'processando'],
    ['000139', 'Clinica Vida+', 'R$ 8.200,00', 'overdue', 'rejeitada'],
    ['000138', 'VendaShop Ltda', 'R$ 33.300,00', 'paid', 'autorizada'],
  ];

  return (
    <>
      <div className="nfe-banner">
        <Icon name="receipt" size={16} />
        <span><strong>Fiscal integrado ao financeiro.</strong> Emita NF-e, NFS-e e NFC-e a partir de receitas, contas a receber e vendas.</span>
      </div>

      <div className="kpi-grid nfe-kpis">
        <div className="kpi"><div className="kpi-head"><span>Emitidas no mês</span></div><div className="kpi-value">142</div><div className="kpi-foot"><span className="kpi-delta up">+18,0%</span><span className="kpi-period">vs. abril</span></div></div>
        <div className="kpi"><div className="kpi-head"><span>Faturamento fiscal</span></div><div className="kpi-value"><span className="currency">R$</span>487<span className="currency">k</span></div><div className="kpi-foot"><span className="kpi-delta up">R$ 3.430</span><span className="kpi-period">media/nota</span></div></div>
        <div className="kpi"><div className="kpi-head"><span>Aguardando SEFAZ</span></div><div className="kpi-value">3</div><div className="kpi-foot"><span className="kpi-delta down">2,4s</span><span className="kpi-period">tempo medio</span></div></div>
        <div className="kpi"><div className="kpi-head"><span>Rejeitadas</span></div><div className="kpi-value">2</div><div className="kpi-foot"><span className="kpi-delta down">CFOP</span><span className="kpi-period">corrigir dados</span></div></div>
      </div>

      <div className="nfe-layout">
        <div className="card nfe-form-card">
          <div className="card-head">
            <div>
              <div className="card-title">Nova Nota Fiscal</div>
              <div className="card-sub">Documento vinculado ao fluxo financeiro</div>
            </div>
            <div className="segmented">
              {types.map(([key, label, sub]) => (
                <button key={key} className={docType === key ? 'active' : ''} onClick={() => setDocType(key)}>
                  {label} <span className="nfe-seg-sub">{sub}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="nfe-form-grid">
            <div className="field-row nfe-row-3">
              <div className="field"><label>Natureza da operacao</label><input defaultValue={docType === 'nfse' ? 'Prestacao de servico' : 'Venda de mercadoria'} /></div>
              <div className="field"><label>{docType === 'nfse' ? 'Codigo servico' : 'CFOP'}</label><input defaultValue={docType === 'nfse' ? '1.05' : '5102'} /></div>
              <div className="field"><label>Serie / Numero</label><input defaultValue="1 / 000143" /></div>
            </div>

            <div className="field">
              <label>Cliente / Tomador</label>
              <select defaultValue="VendaShop Ltda">
                <option>VendaShop Ltda</option>
                <option>Padaria Doce ME</option>
                <option>Construtora Topo</option>
                <option>+ Cadastrar novo cliente</option>
              </select>
            </div>

            <div className="nfe-items">
              <div className="nfe-items-head"><span>Descricao</span><span>Qtd</span><span>Vlr unit</span><span>Total</span></div>
              {[
                ['Sistema CA.RO PRO · Plano anual', 'NCM 8523.49.10 · CST 00', '1', 'R$ 27.000,00', 'R$ 27.000,00'],
                ['Onboarding personalizado', docType === 'nfse' ? 'Servico 1.05 · ISS 5%' : 'NCM 8523.49.10 · CST 00', '1', 'R$ 4.500,00', 'R$ 4.500,00'],
                ['Treinamento equipe (8h)', docType === 'nfse' ? 'Servico 8.02 · ISS 5%' : 'NCM 8523.49.10 · CST 00', '1', 'R$ 1.800,00', 'R$ 1.800,00'],
              ].map((item) => (
                <div className="nfe-items-row" key={item[0]}>
                  <div><strong>{item[0]}</strong><small>{item[1]}</small></div>
                  <span>{item[2]}</span>
                  <span>{item[3]}</span>
                  <span>{item[4]}</span>
                </div>
              ))}
              <button className="nfe-add-item"><Icon name="plus" size={13} /> Adicionar item</button>
            </div>

            <div className="field-row">
              <div className="field"><label>Forma de pagamento</label><select defaultValue="Boleto bancario"><option>Boleto bancario</option><option>Pix</option><option>Cartao de credito</option><option>Transferencia</option></select></div>
              <div className="field"><label>Vencimento</label><input type="date" defaultValue="2026-06-01" /></div>
            </div>

            <div className="field"><label>Informacoes complementares</label><textarea rows="2" defaultValue="Documento emitido por ME ou EPP optante pelo Simples Nacional." /></div>
          </div>

          <div className="nfe-totals">
            <div><span>Base</span><strong>R$ 33.300,00</strong></div>
            <div><span>ISS 5%</span><strong>R$ 1.665,00</strong></div>
            <div><span>Desconto</span><strong>R$ 0,00</strong></div>
            <div><span>Total da nota</span><strong>R$ 33.300,00</strong></div>
          </div>

          <div className="nfe-actions">
            <button className="btn"><Icon name="check" size={13} /> Salvar rascunho</button>
            <div className="spacer" />
            <button className="btn">Pre-visualizar</button>
            <button className="btn btn-primary"><Icon name="send" size={13} /> Transmitir</button>
          </div>
        </div>

        <div className="nfe-side">
          <div className="card">
            <div className="card-head"><div><div className="card-title">Pre-visualizacao</div><div className="card-sub">DANFE / documento fiscal</div></div><span className="status-pill status-pending">previa</span></div>
            <div className="nfe-preview">
              <div className="nfe-preview-head"><div className="brand-mark">CR</div><div><strong>CA.RO TECNOLOGIA LTDA</strong><span>CNPJ 12.345.678/0001-99</span></div><div><b>No 000143</b><span>Serie 1</span></div></div>
              <div className="nfe-preview-section"><span>Destinatario</span><strong>VendaShop Ltda</strong><small>CNPJ 23.456.789/0001-88 · Sao Paulo/SP</small></div>
              <div className="nfe-preview-section"><span>Produtos / Servicos</span><strong>Sistema CA.RO PRO, onboarding e treinamento</strong><small>Total dos itens: R$ 33.300,00</small></div>
              <div className="nfe-preview-total"><span>Valor total</span><strong>R$ 33.300,00</strong></div>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><div><div className="card-title">Ultimas emitidas</div><div className="card-sub">XML e PDF em um clique</div></div></div>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>No</th><th>Cliente</th><th>Status</th><th className="text-right">Valor</th><th></th></tr></thead>
                <tbody>
                  {docs.map(([num, client, amount, status, label]) => (
                    <tr key={num}>
                      <td className="mono muted">{num}</td>
                      <td>{client}</td>
                      <td><span className={'status-pill status-' + status}>{label}</span></td>
                      <td className="num">{amount}</td>
                      <td><button className="icon-btn" title="Baixar XML/PDF"><Icon name="download" size={13} /></button></td>
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
const AddTxModal = ({ onClose }) => {
  const [type, setType] = useState('in');
  const [amount, setAmount] = useState('');
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">Nova Transação</div>
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
            <label>Valor</label>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="R$ 0,00" />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Data</label>
              <input type="date" defaultValue="2026-04-28" />
            </div>
            <div className="field">
              <label>Vencimento</label>
              <input type="date" defaultValue="2026-05-15" />
            </div>
          </div>
          <div className="field">
            <label>{type === 'in' ? 'Cliente' : 'Fornecedor'}</label>
            <input placeholder={type === 'in' ? 'Selecione um cliente' : 'Selecione um fornecedor'} />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Categoria</label>
              <select>
                <option>Receita recorrente</option>
                <option>Receita única</option>
                <option>Folha & RH</option>
                <option>Marketing</option>
                <option>Infra & Cloud</option>
              </select>
            </div>
            <div className="field">
              <label>Método</label>
              <select>
                <option>Pix</option><option>Boleto</option><option>Cartão</option><option>TED</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label>Descrição</label>
            <textarea rows="2" placeholder="Adicione uma observação (opcional)" />
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={onClose}><Icon name="check" size={13} /> Lançar transação</button>
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

/* ===== APP ROOT ===== */
const App = () => {
  const [active, setActive] = useState('dashboard');
  const [period, setPeriod] = useState('mes');
  const [showModal, setShowModal] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

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
          <div className="user-card">
            <div className="avatar">CR</div>
            <div className="user-meta">
              <div className="user-name">Carolina R.</div>
              <div className="user-role">CFO · Admin</div>
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
            <input placeholder="Buscar transações, clientes..." />
            <span className="kbd">⌘K</span>
          </div>
          <button className="icon-btn" onClick={() => setTweak('theme', tweaks.theme === 'dark' ? 'light' : 'dark')}>
            <Icon name={tweaks.theme === 'dark' ? 'sun' : 'moon'} size={15} />
          </button>
          <button className="icon-btn"><Icon name="bell" size={15} /><span className="dot" /></button>
          <button className="btn" onClick={() => setShowInstallModal(true)} aria-label="Baixar app" title="Baixar app"><Icon name="download" size={13} /><span>Baixar app</span></button>
          <button className="btn"><Icon name="export" size={13} /><span>Exportar</span></button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Icon name="plus" size={13} /><span>Nova Transação</span>
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
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} /> Sincronizado · há 2 min
            </span>
          </div>

          {active === 'dashboard' && <DashboardPage onAdd={() => setShowModal(true)} period={period} showSecondary={tweaks.showSecondaryKpis} />}
          {active === 'nfe' && <FiscalDocsPage />}
          {active !== 'dashboard' && (
            active !== 'nfe' &&
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
              <PlaceholderForSection id={active} />
            </div>
          )}
        </div>

        <MobileTab active={active} onChange={setActive} onAdd={() => setShowModal(true)} />
      </main>

      {showModal && <AddTxModal onClose={() => setShowModal(false)} />}
      {showInstallModal && <InstallAppModal onClose={() => setShowInstallModal(false)} onInstall={handleInstallApp} canPrompt={!!installPrompt} />}

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
const PlaceholderForSection = ({ id }) => {
  if (id === 'cashflow' || id === 'revenue' || id === 'expenses') {
    return (
      <>
        <RevenueExpenseChart data={REV_EXP} height={300} />
        <div style={{ marginTop: 16 }}>
          <TransactionsTable rows={TRANSACTIONS.filter(t => id === 'cashflow' || (id === 'revenue' ? t.type === 'in' : t.type === 'out'))} />
        </div>
      </>
    );
  }
  if (id === 'payables' || id === 'receivables') {
    return <TransactionsTable rows={TRANSACTIONS.filter(t => id === 'receivables' ? t.type === 'in' : t.type === 'out')} />;
  }
  if (id === 'reconcile') {
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
