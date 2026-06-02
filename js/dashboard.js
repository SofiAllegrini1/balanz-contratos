/* =========================================================
   BALANZ Contract Intelligence Platform — dashboard.js
   ========================================================= */

const Dashboard = (() => {

  function renderKPIs(stats) {
    const kpiData = [
      { label: 'Contratos Totales', value: stats.total, icon: 'file-text', color: 'blue' },
      { label: 'Vigentes', value: stats.vigentes, icon: 'check-circle', color: 'green' },
      { label: 'Rescindidos', value: stats.rescindidos, icon: 'x-circle', color: 'red' },
      { label: 'Agentes Productores', value: stats.ap, icon: 'users', color: 'blue' },
      { label: 'Referenciadores', value: stats.ref, icon: 'share-2', color: 'violet' },
      { label: 'Prod. Exclusivos', value: stats.pe, icon: 'star', color: 'green' },
      { label: 'AAGI / Institucional', value: stats.aagi, icon: 'building', color: 'amber' },
      { label: 'Incubadoras Activas', value: stats.incubadoras, icon: 'zap', color: 'orange' },
    ];

    const grid = document.getElementById('kpi-grid');
    grid.innerHTML = kpiData.map(k => `
      <div class="kpi-card ${k.color}">
        <div class="kpi-icon ${k.color}">
          ${icon(k.icon)}
        </div>
        <div class="kpi-value">${k.value.toLocaleString()}</div>
        <div class="kpi-label">${k.label}</div>
      </div>
    `).join('');
  }

  function renderInsights(stats, alerts) {
    const issues = [];
    if (alerts.sinCRM > 0) issues.push(`<span class="insight-tag amber">${alerts.sinCRM} sin CRM</span>`);
    if (alerts.incompletos > 0) issues.push(`<span class="insight-tag red">${alerts.incompletos} datos incompletos</span>`);
    if (alerts.cuitErrors > 0) issues.push(`<span class="insight-tag amber">${alerts.cuitErrors} CUIT con errores</span>`);
    if (stats.incubadoras > 0) issues.push(`<span class="insight-tag blue">${stats.incubadoras} en incubación</span>`);
    if (stats.conAdendas > 0) issues.push(`<span class="insight-tag green">${stats.conAdendas} con adendas</span>`);

    const pct = ((stats.vigentes / stats.total) * 100).toFixed(1);

    document.getElementById('insights-banner').innerHTML = `
      <div class="insights-icon">${icon('cpu')}</div>
      <div class="insights-content">
        <div class="insights-title">Inteligencia Automática — Estado actual de la cartera</div>
        <div class="insights-text">
          El ${pct}% del portafolio (${stats.vigentes} contratos) se encuentra vigente. 
          Distribución: ${stats.ap} APs · ${stats.ref} REFs · ${stats.pe} Productores Exclusivos · ${stats.aagi} AAGIs.
          Contratos en pesos: ${stats.pesos} · En dólares: ${stats.dolares}.
        </div>
        <div class="insights-tags">${issues.join('')}</div>
      </div>
    `;
  }

  function renderAlerts(alerts) {
    const strips = [
      {
        cls: 'critical', count: alerts.incompletos,
        title: 'Datos incompletos',
        desc: 'Contratos sin mail o equipo asignado',
        icon: 'alert-triangle', filter: 'incompletos'
      },
      {
        cls: 'warning', count: alerts.sinCRM,
        title: 'Sin CRM configurado',
        desc: 'Contratos fuera del sistema CRM',
        icon: 'database', filter: 'sinCRM'
      },
      {
        cls: 'caution', count: alerts.incubadoras,
        title: 'Contratos en incubación',
        desc: 'Productores en etapa de incubadora',
        icon: 'zap', filter: 'incubadoras'
      },
      {
        cls: 'info', count: alerts.usd,
        title: 'Contratos en USD',
        desc: 'Requieren seguimiento cambiario',
        icon: 'dollar-sign', filter: 'usd'
      },
      {
        cls: 'info', count: alerts.conAdendas,
        title: 'Con adendas registradas',
        desc: 'Contratos con modificaciones',
        icon: 'edit-3', filter: 'adendas'
      },
      {
        cls: 'muted', count: alerts.bajas,
        title: 'Contratos rescindidos',
        desc: 'Historial de bajas del sistema',
        icon: 'archive', filter: 'bajas'
      },
    ];

    document.getElementById('alert-strips').innerHTML = strips.map(s => `
      <div class="alert-strip ${s.cls}" onclick="Alertas.filterBy('${s.filter}'); App.navigate('alertas');" style="cursor:pointer">
        <div class="alert-icon">${icon(s.icon)}</div>
        <div class="alert-info">
          <div class="alert-title">${s.title}</div>
          <div class="alert-desc">${s.desc}</div>
        </div>
        <div class="alert-count">${s.count}</div>
      </div>
    `).join('');
  }

  function renderCharts(stats) {
    // Equipos bar chart
    const equipos = Object.entries(stats.equipos)
      .sort((a,b) => b[1]-a[1])
      .slice(0, 8);
    const maxEq = equipos[0]?.[1] || 1;
    const equipoColors = ['#2e78d8','#4d9df5','#1a407e','#3b82f6','#60a5fa','#93c5fd','#1d5fbd','#0e2045'];

    document.getElementById('chart-equipos').innerHTML = `
      <div class="bar-chart">
        ${equipos.map(([name, val], i) => `
          <div class="bar-item">
            <div class="bar-label" title="${name}">${name}</div>
            <div class="bar-track">
              <div class="bar-fill" style="width:${(val/maxEq*100).toFixed(1)}%;background:${equipoColors[i%equipoColors.length]}"></div>
            </div>
            <div class="bar-val">${val}</div>
          </div>
        `).join('')}
      </div>
    `;

    // Localidades bar chart
    const locs = Object.entries(stats.localidades)
      .sort((a,b) => b[1]-a[1])
      .slice(0, 7);
    const maxLoc = locs[0]?.[1] || 1;

    document.getElementById('chart-localidades').innerHTML = `
      <div class="bar-chart">
        ${locs.map(([name, val]) => `
          <div class="bar-item">
            <div class="bar-label" title="${name}">${name}</div>
            <div class="bar-track">
              <div class="bar-fill" style="width:${(val/maxLoc*100).toFixed(1)}%;background:var(--azure-300)"></div>
            </div>
            <div class="bar-val">${val}</div>
          </div>
        `).join('')}
      </div>
    `;

    // Tipo donut
    const tipos = [
      { name: 'Agentes Productores', val: stats.ap, color: '#2e78d8' },
      { name: 'Referenciadores',     val: stats.ref, color: '#8b5cf6' },
      { name: 'Prod. Exclusivos',    val: stats.pe,  color: '#22c55e' },
      { name: 'AAGI',               val: stats.aagi, color: '#f59e0b' },
    ];
    const total = tipos.reduce((s, t) => s + t.val, 0) || 1;
    let acc = 0;
    const segments = tipos.map(t => {
      const pct = (t.val / total) * 100;
      const seg = { ...t, pct, start: acc };
      acc += pct;
      return seg;
    });

    const gradient = segments.map(s =>
      `${s.color} ${s.start.toFixed(1)}% ${(s.start + s.pct).toFixed(1)}%`
    ).join(', ');

    document.getElementById('chart-tipos').innerHTML = `
      <div class="donut-wrap">
        <div class="donut-chart" style="background:conic-gradient(${gradient});position:relative;">
          <div style="position:absolute;inset:20px;border-radius:50%;background:white;display:flex;align-items:center;justify-content:center;">
            <span style="font-size:1.1rem;font-weight:800;color:var(--slate-800)">${total}</span>
          </div>
        </div>
        <div class="donut-legend">
          ${tipos.map(t => `
            <div class="legend-item">
              <div class="legend-dot" style="background:${t.color}"></div>
              <div class="legend-name">${t.name}</div>
              <div class="legend-val">${t.val}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Moneda donut
    const monedas = [
      { name: 'Pesos', val: stats.pesos, color: '#22c55e' },
      { name: 'Dólares', val: stats.dolares, color: '#f59e0b' },
      { name: 'Sin definir', val: stats.vigentes - stats.pesos - stats.dolares, color: '#cbd5e1' },
    ].filter(m => m.val > 0);

    const totalM = monedas.reduce((s, m) => s + m.val, 0) || 1;
    let accM = 0;
    const segsM = monedas.map(m => {
      const pct = (m.val / totalM) * 100;
      const seg = { ...m, pct, start: accM };
      accM += pct;
      return seg;
    });
    const gradM = segsM.map(s => `${s.color} ${s.start.toFixed(1)}% ${(s.start + s.pct).toFixed(1)}%`).join(', ');

    document.getElementById('chart-monedas').innerHTML = `
      <div class="donut-wrap">
        <div class="donut-chart" style="background:conic-gradient(${gradM});position:relative;">
          <div style="position:absolute;inset:20px;border-radius:50%;background:white;display:flex;align-items:center;justify-content:center;">
            <span style="font-size:0.75rem;font-weight:700;color:var(--slate-500)">moneda</span>
          </div>
        </div>
        <div class="donut-legend">
          ${monedas.map(m => `
            <div class="legend-item">
              <div class="legend-dot" style="background:${m.color}"></div>
              <div class="legend-name">${m.name}</div>
              <div class="legend-val">${m.val}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function render() {
    const stats = App.getStats();
    const alerts = App.getAlerts();
    renderKPIs(stats);
    renderInsights(stats, alerts);
    renderAlerts(alerts);
    renderCharts(stats);
  }

  document.addEventListener('app:navigate', (e) => {
    if (e.detail.page === 'dashboard') render();
  });

  return { render };
})();

/* ── Icon helper (Lucide-like SVG inline) ──────────────── */
function icon(name) {
  const icons = {
    'file-text': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/></svg>`,
    'check-circle': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>`,
    'x-circle': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    'users': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    'share-2': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`,
    'star': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"/></svg>`,
    'building': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22V12h6v10"/><path d="M8 7h.01"/><path d="M16 7h.01"/><path d="M8 11h.01"/><path d="M16 11h.01"/></svg>`,
    'zap': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/></svg>`,
    'cpu': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>`,
    'alert-triangle': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    'database': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`,
    'dollar-sign': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
    'edit-3': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`,
    'archive': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="21,8 21,21 3,21 3,8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>`,
    'search': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
    'bell': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
    'refresh-cw': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23,4 23,10 17,10"/><polyline points="1,20 1,14 7,14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`,
    'settings': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
    'layout-dashboard': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>`,
    'file-list': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
    'map-pin': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
    'calendar': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    'x': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    'mail': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
    'phone': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 10.55a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 0h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9a16 16 0 0 0 6.29 6.29l1.36-1.36a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
    'external-link': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
    'clipboard': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>`,
    'trending-up': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/><polyline points="17,6 23,6 23,12"/></svg>`,
    'filter': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3"/></svg>`,
    'chevron-left': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15,18 9,12 15,6"/></svg>`,
    'chevron-right': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9,18 15,12 9,6"/></svg>`,
    'download': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
    'plus': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  };
  return icons[name] || `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>`;
}
