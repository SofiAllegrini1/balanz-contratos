/* =========================================================
   BALANZ Contract Intelligence Platform — alertas.js
   ========================================================= */

const Alertas = (() => {
  let _activeFilter = 'all';

  function filterBy(f) {
    _activeFilter = f;
  }

  function getAlertItems() {
    const all = App.getContratos();
    const vigentes = all.filter(c => c.estado === 'Vigente');

    return {
      incompletos: vigentes.filter(c => !c.mail || !c.equipo),
      sinCRM: vigentes.filter(c => !c.crm || c.crm.trim() === '' || c.crm.toLowerCase() === 'no tiene equipo'),
      incubadoras: vigentes.filter(c => (c.incubadora||'').toString().toLowerCase() === 'si'),
      conAdendas: vigentes.filter(c => c.adendas && c.adendas.length > 0),
      usd: vigentes.filter(c =>
        (c.moneda||'').toLowerCase().includes('dol') ||
        (c.moneda||'').toLowerCase().includes('dól') ||
        (c.moneda||'').toLowerCase() === 'usd'
      ),
      bajas: all.filter(c => c.estado === 'Rescindido'),
      cuitErrors: vigentes.filter(c => c.cuit && c.cuit.toString().includes(' ')),
    };
  }

  function renderAlertList(items, title) {
    if (!items.length) return `<div class="empty-state">${icon('check-circle')}<p>No hay contratos en esta categoría.</p></div>`;
    return items.map(c => `
      <div class="timeline-item" onclick="App.selectContrato('${c.id}')">
        <div class="timeline-date-box" style="background:var(--ice-50)">
          <span style="font-size:0.6rem;color:var(--azure-500);font-weight:700;text-align:center;line-height:1.3">${c.tipo}</span>
        </div>
        <div class="timeline-info">
          <div class="tname">${c.nombre}</div>
          <div class="tmeta">${c.equipo ? c.equipo + ' · ' : ''}${c.fa || ''} ${c.localidad ? '· ' + c.localidad : ''}</div>
        </div>
        <span class="badge-tipo ${c.tipo}">${c.tipo}</span>
      </div>
    `).join('');
  }

  function render() {
    const items = getAlertItems();
    const groups = [
      { key: 'incompletos', label: 'Datos Incompletos', cls: 'critical', icon: 'alert-triangle', items: items.incompletos, desc: 'Contratos sin mail o equipo asignado' },
      { key: 'sinCRM', label: 'Sin CRM Configurado', cls: 'warning', icon: 'database', items: items.sinCRM, desc: 'Contratos fuera del sistema CRM de Balanz' },
      { key: 'cuitErrors', label: 'CUIT con Formato Irregular', cls: 'warning', icon: 'alert-triangle', items: items.cuitErrors, desc: 'CUITs que pueden requerir corrección' },
      { key: 'incubadoras', label: 'En Incubadora', cls: 'caution', icon: 'zap', items: items.incubadoras, desc: 'Productores en proceso de incubación activa' },
      { key: 'usd', label: 'Contratos en USD', cls: 'info', icon: 'dollar-sign', items: items.usd, desc: 'Contratos dolarizados – seguimiento cambiario' },
      { key: 'adendas', label: 'Con Adendas', cls: 'info', icon: 'edit-3', items: items.conAdendas, desc: 'Contratos con modificaciones registradas' },
      { key: 'bajas', label: 'Rescindidos', cls: 'muted', icon: 'archive', items: items.bajas, desc: 'Historial completo de bajas del sistema' },
    ];

    // Summary strips
    document.getElementById('alertas-summary').innerHTML = groups.map(g => `
      <div class="alert-strip ${g.cls}" onclick="showAlertGroup('${g.key}')" style="cursor:pointer">
        <div class="alert-icon">${icon(g.icon)}</div>
        <div class="alert-info">
          <div class="alert-title">${g.label}</div>
          <div class="alert-desc">${g.desc}</div>
        </div>
        <div class="alert-count">${g.items.length}</div>
      </div>
    `).join('');

    // Detail sections
    const container = document.getElementById('alertas-detail');
    container.innerHTML = groups.map(g => `
      <div id="alertgroup-${g.key}" class="detail-section-wrap" style="margin-bottom:24px">
        <div class="section-header">
          <div class="section-title">
            ${icon(g.icon)} ${g.label}
            <span class="section-count">${g.items.length}</span>
          </div>
        </div>
        <div class="table-container">
          <div style="padding:16px">
            ${renderAlertList(g.items, g.label)}
          </div>
        </div>
      </div>
    `).join('');

    // Auto-scroll to active filter
    if (_activeFilter && _activeFilter !== 'all') {
      setTimeout(() => {
        const el = document.getElementById(`alertgroup-${_activeFilter}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        _activeFilter = 'all';
      }, 100);
    }
  }

  document.addEventListener('app:navigate', (e) => {
    if (e.detail.page === 'alertas') render();
  });

  return { render, filterBy };
})();

function showAlertGroup(key) {
  const el = document.getElementById(`alertgroup-${key}`);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* =========================================================
   Renovaciones
   ========================================================= */
const Renovaciones = (() => {
  function render() {
    const all = App.getContratos();
    const adendas = all.filter(c => c.adendas && c.adendas.length > 0);

    // Build adenda timeline
    const allAdendas = [];
    adendas.forEach(c => {
      c.adendas.forEach(a => {
        allAdendas.push({ contrato: c, adenda: a });
      });
    });

    // Sort by date (most recent first)
    allAdendas.sort((a, b) => {
      const da = new Date(a.adenda.fecha || '2000-01-01');
      const db = new Date(b.adenda.fecha || '2000-01-01');
      return db - da;
    });

    document.getElementById('renov-total').textContent = adendas.length;
    document.getElementById('renov-adendas').textContent = allAdendas.length;

    const byTipo = {};
    adendas.forEach(c => { byTipo[c.tipo] = (byTipo[c.tipo] || 0) + 1; });

    document.getElementById('renov-breakdown').innerHTML = Object.entries(byTipo)
      .map(([t, v]) => `
        <div class="kpi-card blue" style="padding:14px 18px">
          <div class="kpi-value" style="font-size:1.5rem">${v}</div>
          <div class="kpi-label"><span class="badge-tipo ${t}">${t}</span></div>
        </div>
      `).join('');

    // Timeline
    if (allAdendas.length === 0) {
      document.getElementById('renov-timeline').innerHTML = `
        <div class="empty-state">${icon('calendar')}<p>No hay adendas registradas.</p></div>
      `;
      return;
    }

    document.getElementById('renov-timeline').innerHTML = allAdendas.map(({ contrato: c, adenda: a }) => {
      let day = '—', mon = '—';
      try {
        const dt = new Date(a.fecha);
        if (!isNaN(dt)) {
          day = dt.getDate().toString().padStart(2, '0');
          mon = dt.toLocaleString('es-AR', { month: 'short' }).toUpperCase();
        }
      } catch {}

      return `
        <div class="timeline-item" onclick="App.selectContrato('${c.id}')">
          <div class="timeline-date-box">
            <span class="tday">${day}</span>
            <span class="tmon">${mon}</span>
          </div>
          <div class="timeline-info">
            <div class="tname">${c.nombre}</div>
            <div class="tmeta">${a.modificacion || '—'} ${a.observaciones ? '· ' + a.observaciones : ''}</div>
          </div>
          <span class="badge-tipo ${c.tipo}">${c.tipo}</span>
        </div>
      `;
    }).join('');
  }

  document.addEventListener('app:navigate', (e) => {
    if (e.detail.page === 'renovaciones') render();
  });

  return { render };
})();

/* =========================================================
   Equipos
   ========================================================= */
const Equipos = (() => {
  function render() {
    const vigentes = App.getContratos().filter(c => c.estado === 'Vigente');

    // By equipo
    const equipos = {};
    vigentes.forEach(c => {
      if (c.equipo) {
        if (!equipos[c.equipo]) equipos[c.equipo] = { total: 0, ap: 0, ref: 0, pe: 0, aagi: 0 };
        equipos[c.equipo].total++;
        if (c.tipo === 'AP')   equipos[c.equipo].ap++;
        if (c.tipo === 'REF')  equipos[c.equipo].ref++;
        if (c.tipo === 'PE')   equipos[c.equipo].pe++;
        if (c.tipo === 'AAGI') equipos[c.equipo].aagi++;
      }
    });

    const sorted = Object.entries(equipos).sort((a,b) => b[1].total - a[1].total);

    document.getElementById('equipos-grid').innerHTML = sorted.map(([name, stats]) => `
      <div class="team-card" onclick="filterEquipo('${name}')">
        <div class="team-avatar">${name.charAt(0).toUpperCase()}</div>
        <div class="team-name">${name}</div>
        <div class="team-count">${stats.total}</div>
        <div class="team-label">contratos vigentes</div>
        <div style="display:flex;gap:4px;margin-top:8px;justify-content:center;flex-wrap:wrap">
          ${stats.ap   ? `<span class="badge-tipo AP">AP:${stats.ap}</span>` : ''}
          ${stats.ref  ? `<span class="badge-tipo REF">REF:${stats.ref}</span>` : ''}
          ${stats.pe   ? `<span class="badge-tipo PE">PE:${stats.pe}</span>` : ''}
          ${stats.aagi ? `<span class="badge-tipo AAGI">AAGI:${stats.aagi}</span>` : ''}
        </div>
      </div>
    `).join('');

    // By FA
    const fas = {};
    vigentes.forEach(c => {
      if (c.fa) fas[c.fa] = (fas[c.fa] || 0) + 1;
    });

    const fasSorted = Object.entries(fas).sort((a,b) => b[1]-a[1]).slice(0, 10);
    const maxFa = fasSorted[0]?.[1] || 1;
    const faColors = ['#2e78d8','#4d9df5','#8b5cf6','#22c55e','#f59e0b','#ef4444','#f97316','#14b8a6','#ec4899','#64748b'];

    document.getElementById('fa-chart').innerHTML = `
      <div class="bar-chart">
        ${fasSorted.map(([fa, val], i) => `
          <div class="bar-item">
            <div class="bar-label" title="${fa}">${fa}</div>
            <div class="bar-track">
              <div class="bar-fill" style="width:${(val/maxFa*100).toFixed(1)}%;background:${faColors[i%faColors.length]}"></div>
            </div>
            <div class="bar-val">${val}</div>
          </div>
        `).join('')}
      </div>
    `;

    // By localidad
    const locs = {};
    vigentes.forEach(c => { if (c.localidad) locs[c.localidad.trim()] = (locs[c.localidad.trim()] || 0) + 1; });
    const locsSorted = Object.entries(locs).sort((a,b) => b[1]-a[1]).slice(0, 10);
    const maxLoc = locsSorted[0]?.[1] || 1;

    document.getElementById('loc-chart').innerHTML = `
      <div class="bar-chart">
        ${locsSorted.map(([loc, val]) => `
          <div class="bar-item">
            <div class="bar-label" title="${loc}">${loc}</div>
            <div class="bar-track">
              <div class="bar-fill" style="width:${(val/maxLoc*100).toFixed(1)}%;background:var(--azure-300)"></div>
            </div>
            <div class="bar-val">${val}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  document.addEventListener('app:navigate', (e) => {
    if (e.detail.page === 'equipos') render();
  });

  return { render };
})();

function filterEquipo(name) {
  App.navigate('contratos');
  setTimeout(() => {
    const sel = document.getElementById('filter-equipo');
    if (sel) { sel.value = name; Contratos.applyFilters(); }
  }, 100);
}

/* =========================================================
   Búsqueda Global
   ========================================================= */
const Busqueda = (() => {
  let _lastQuery = '';

  function render(query) {
    const q = query || _lastQuery;
    _lastQuery = q;
    const input = document.getElementById('busqueda-input');
    if (input && q) input.value = q;

    if (!q || q.length < 2) {
      document.getElementById('busqueda-results').innerHTML = `
        <div class="empty-state">
          ${icon('search')}
          <p>Escribí al menos 2 caracteres para buscar.</p>
        </div>
      `;
      return;
    }

    const results = App.search(q);
    document.getElementById('busqueda-count').textContent = `${results.length} resultado${results.length !== 1 ? 's' : ''}`;

    if (results.length === 0) {
      document.getElementById('busqueda-results').innerHTML = `
        <div class="empty-state">
          ${icon('search')}
          <p>No se encontraron contratos para "<strong>${q}</strong>".</p>
        </div>
      `;
      return;
    }

    document.getElementById('busqueda-results').innerHTML = results.map(c => `
      <div class="search-result-item" onclick="App.selectContrato('${c.id}')">
        <div class="sri-icon">${icon('file-text')}</div>
        <div class="sri-info">
          <div class="sri-name">${highlight(c.nombre, q)}</div>
          <div class="sri-meta">
            ${c.id} · ${c.equipo || ''} ${c.fa ? '· ' + c.fa : ''} ${c.localidad ? '· ' + c.localidad : ''}
            ${c.mail ? ' · ' + c.mail.substring(0, 30) + (c.mail.length > 30 ? '…' : '') : ''}
          </div>
        </div>
        <div style="display:flex;gap:6px;align-items:center">
          <span class="badge-tipo ${c.tipo}">${c.tipo}</span>
          <span class="badge-status ${c.estado.toLowerCase()}">${c.estado}</span>
        </div>
      </div>
    `).join('');
  }

  function highlight(text, q) {
    if (!q || !text) return text;
    const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(re, '<mark style="background:var(--amber-100);color:var(--slate-900);border-radius:2px;padding:0 1px">$1</mark>');
  }

  function initSearch() {
    const input = document.getElementById('busqueda-input');
    if (input) {
      input.addEventListener('input', (e) => render(e.target.value));
    }
  }

  document.addEventListener('app:navigate', (e) => {
    if (e.detail.page === 'busqueda') {
      initSearch();
      if (_lastQuery) render(_lastQuery);
    }
  });

  document.addEventListener('app:search', (e) => {
    render(e.detail.query);
  });

  return { render };
})();
