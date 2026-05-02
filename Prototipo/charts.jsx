/* GRUPO CA.RO — chart primitives */

const Sparkline = ({ data, color = 'var(--accent)', height = 32, fill = true }) => {
  const w = 100, h = height;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return [x, y];
  });
  const path = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const area = path + ` L${w},${h} L0,${h} Z`;
  const id = React.useId();
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" width="100%" height={height} style={{ display: 'block' }}>
      {fill && (
        <>
          <defs>
            <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.32" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${id})`} />
        </>
      )}
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
};

/* Linha — Receita vs Despesa */
const RevenueExpenseChart = ({ data, height = 260 }) => {
  const W = 800, H = height, P = { l: 50, r: 16, t: 16, b: 28 };
  const iw = W - P.l - P.r;
  const ih = H - P.t - P.b;
  const max = Math.max(...data.map(d => Math.max(d.rev, d.exp))) * 1.1;
  const min = 0;

  const x = (i) => P.l + (i / (data.length - 1)) * iw;
  const y = (v) => P.t + ih - ((v - min) / (max - min)) * ih;

  const path = (key) => data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(d[key])}`).join(' ');
  const area = (key) => path(key) + ` L${x(data.length - 1)},${P.t + ih} L${P.l},${P.t + ih} Z`;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => min + t * (max - min));

  const [hover, setHover] = React.useState(null);
  const ref = React.useRef(null);

  const onMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((px - P.l) / iw) * (data.length - 1));
    if (i >= 0 && i < data.length) setHover({ i, x: x(i), clientX: e.clientX - rect.left });
  };

  return (
    <div style={{ position: 'relative' }} onMouseLeave={() => setHover(null)}>
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} width="100%" height={H} onMouseMove={onMove} style={{ display: 'block' }}>
        <defs>
          <linearGradient id="revGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.30" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="expGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--danger)" stopOpacity="0.20" />
            <stop offset="100%" stopColor="var(--danger)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={P.l} y1={y(t)} x2={W - P.r} y2={y(t)} stroke="var(--border-soft)" strokeDasharray="2 4" />
            <text x={P.l - 8} y={y(t) + 3} fill="var(--text-faint)" fontSize="10" textAnchor="end" fontFamily="var(--font-mono)">
              {(t / 1_000_000).toFixed(1)}M
            </text>
          </g>
        ))}
        {data.map((d, i) => (
          <text key={i} x={x(i)} y={H - 8} fill="var(--text-faint)" fontSize="10" textAnchor="middle">{d.m}</text>
        ))}
        <path d={area('rev')} fill="url(#revGrad)" />
        <path d={area('exp')} fill="url(#expGrad)" />
        <path d={path('exp')} fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d={path('rev')} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {hover && (
          <g>
            <line x1={hover.x} y1={P.t} x2={hover.x} y2={P.t + ih} stroke="var(--border)" strokeDasharray="3 3" />
            <circle cx={hover.x} cy={y(data[hover.i].rev)} r="4" fill="var(--accent)" stroke="var(--bg)" strokeWidth="2" />
            <circle cx={hover.x} cy={y(data[hover.i].exp)} r="4" fill="var(--danger)" stroke="var(--bg)" strokeWidth="2" />
          </g>
        )}
      </svg>
      {hover && (
        <div className="tooltip" style={{ left: Math.min(hover.clientX + 10, ref.current?.clientWidth - 180), top: 8 }}>
          <div className="tooltip-date">{data[hover.i].m}</div>
          <div className="tooltip-row">
            <span className="legend-dot" style={{ background: 'var(--accent)' }} />
            <span>Receita</span>
            <span className="v">{fmtBRL(data[hover.i].rev, { compact: true })}</span>
          </div>
          <div className="tooltip-row" style={{ marginTop: 3 }}>
            <span className="legend-dot" style={{ background: 'var(--danger)' }} />
            <span>Despesa</span>
            <span className="v">{fmtBRL(data[hover.i].exp, { compact: true })}</span>
          </div>
          <div className="tooltip-row" style={{ marginTop: 5, paddingTop: 5, borderTop: '1px solid var(--border-soft)' }}>
            <span style={{ color: 'var(--text-dim)' }}>Lucro</span>
            <span className="v up">{fmtBRL(data[hover.i].rev - data[hover.i].exp, { compact: true })}</span>
          </div>
        </div>
      )}
    </div>
  );
};

/* Donut */
const DonutChart = ({ data, size = 180 }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = size / 2 - 12;
  const cx = size / 2, cy = size / 2;
  const stroke = 18;
  let acc = 0;
  const [hover, setHover] = React.useState(null);
  const segs = data.map((d, i) => {
    const start = acc / total;
    acc += d.value;
    const end = acc / total;
    const a0 = start * Math.PI * 2 - Math.PI / 2;
    const a1 = end * Math.PI * 2 - Math.PI / 2;
    const large = end - start > 0.5 ? 1 : 0;
    const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    return { d: `M${x0} ${y0} A${r} ${r} 0 ${large} 1 ${x1} ${y1}`, color: d.color, value: d.value, name: d.name, pct: ((d.value / total) * 100), i };
  });
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ flexShrink: 0 }}>
        {segs.map((s) => (
          <path key={s.i} d={s.d} fill="none" stroke={s.color} strokeWidth={stroke} strokeLinecap="butt"
            opacity={hover === null || hover === s.i ? 1 : 0.35}
            onMouseEnter={() => setHover(s.i)} onMouseLeave={() => setHover(null)}
            style={{ transition: 'opacity 0.15s', cursor: 'pointer' }} />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" fill="var(--text-faint)" fontSize="10.5" letterSpacing="0.06em">TOTAL</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="var(--text)" fontSize="15" fontFamily="var(--font-mono)" fontWeight="600">
          {hover !== null ? fmtBRL(segs[hover].value, { compact: true }) : fmtBRL(total, { compact: true })}
        </text>
        <text x={cx} y={cy + 28} textAnchor="middle" fill="var(--text-dim)" fontSize="10">
          {hover !== null ? segs[hover].pct.toFixed(1) + '%' : 'mês'}
        </text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flex: 1, minWidth: 0 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, opacity: hover === null || hover === i ? 1 : 0.5, transition: 'opacity 0.15s' }}
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <span className="legend-dot" style={{ background: d.color, width: 9, height: 9, borderRadius: 3 }} />
            <span style={{ color: 'var(--text-dim)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{((d.value / total) * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* Barras empilhadas — Receita por plano */
const StackedBars = ({ data, keys, colors, height = 200 }) => {
  const W = 460, H = height, P = { l: 36, r: 8, t: 12, b: 24 };
  const iw = W - P.l - P.r;
  const ih = H - P.t - P.b;
  const max = Math.max(...data.map(d => keys.reduce((s, k) => s + d[k], 0))) * 1.1;
  const bw = iw / data.length * 0.5;
  const [hover, setHover] = React.useState(null);
  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: 'block' }}>
        {[0, 0.5, 1].map((t, i) => (
          <g key={i}>
            <line x1={P.l} y1={P.t + ih * (1 - t)} x2={W - P.r} y2={P.t + ih * (1 - t)} stroke="var(--border-soft)" strokeDasharray="2 4" />
            <text x={P.l - 8} y={P.t + ih * (1 - t) + 3} fill="var(--text-faint)" fontSize="10" textAnchor="end" fontFamily="var(--font-mono)">
              {(max * t / 1000).toFixed(1)}M
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const cx = P.l + (i + 0.5) * (iw / data.length);
          let acc = 0;
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ cursor: 'pointer' }}>
              {keys.map((k, ki) => {
                const v = d[k];
                const h = (v / max) * ih;
                const yTop = P.t + ih - acc - h;
                acc += h;
                return (
                  <rect key={k} x={cx - bw / 2} y={yTop} width={bw} height={h - 1} fill={colors[ki]}
                    opacity={hover === null || hover === i ? 1 : 0.4}
                    rx={ki === keys.length - 1 ? 3 : 0}
                    style={{ transition: 'opacity 0.15s' }} />
                );
              })}
              <text x={cx} y={H - 8} fill="var(--text-faint)" fontSize="10" textAnchor="middle">{d.m}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

/* Heatmap — fluxo diário */
const Heatmap = ({ grid, color = 'var(--accent)' }) => {
  const cols = grid[0].length, rows = grid.length;
  const cell = 16, gap = 3;
  const days = ['S','T','Q','Q','S','S','D'];
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap, paddingTop: 0 }}>
        {days.slice(0, rows).map((d, i) => (
          <div key={i} style={{ height: cell, fontSize: 10, color: 'var(--text-faint)', display: 'grid', placeItems: 'center', width: 12 }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${cell}px)`, gap, gridAutoFlow: 'column', gridTemplateRows: `repeat(${rows}, ${cell}px)` }}>
        {grid.flatMap((row, r) => row.map((v, c) => (
          <div key={`${r}-${c}`} title={`${(v * 100).toFixed(0)}%`}
            style={{
              width: cell, height: cell, borderRadius: 3,
              background: `color-mix(in oklch, ${color} ${v * 100}%, oklch(0.25 0.014 240))`,
              transition: 'transform 0.15s',
              cursor: 'pointer',
            }} />
        )))}
      </div>
    </div>
  );
};

window.Sparkline = Sparkline;
window.RevenueExpenseChart = RevenueExpenseChart;
window.DonutChart = DonutChart;
window.StackedBars = StackedBars;
window.Heatmap = Heatmap;
