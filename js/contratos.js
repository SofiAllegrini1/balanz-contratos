/* =========================================================
   BALANZ Contract Intelligence Platform — contratos.js
   ========================================================= */

const Contratos = (() => {
  let _filtered = [];
  let _page = 1;
  const PER_PAGE = 20;
  let _sortKey = 'nombre';
  let _sortAsc = true;

  function formatDate(d) {
    if (!d) return '—';
    try {
      const dt = new Date(d);
      if (isNaN(dt)) return d;
      return dt.toLocaleDateString('es-AR', { day:'2-digit', month:'2-digit', year:'numeric' });
    } catch { return d; }
  }

  function tipoLabel(tipo) {
    const map = {
      AP: 'AP', REF: 'REF', PE: 'PE', AAGI: 'AAGI', BAJA: 'BAJA'
    };
    return map[tipo] || tipo;
  }

  function statusBadge(c) {
    if (c.estado === 'Rescindido') return '<span class="badge-status rescindido">Rescindido</span>';
    const inc = (c.incubadora||'').toString().toLowerCase();
    if (inc === 'si') return '<span class="badge-status incubadora">Incubadora</span>';
    const crm = (c.crm||'').toString().toLowerCase();
    if (crm === 'ifa') return '<span class="badge-status ifa">IFA</span>';
    return '<span class="badge-status vigente">Vigente</span>';
  }

  function renderTable() {
    const start = (_page - 1) * PER_PAGE;
    const pageData = _filtered.slice(start, start + PER_PAGE);
    const tbody = document.getElementById('contratos-tbody');
    if (!tbody) return;

    if (pageData.length === 0) {
      tbody.innerHTML = `
        <tr><td colspan="7">
          <div class="empty-state">
            ${icon('search')}
            <p>No se encontraron contratos con los filtros actuales.</p>
          </div>
        </td></tr>
      `;
      return;
    }

    tbody.innerHTML = pageData.map(c => `
      <tr onclick="App.selectContrato('${c.id}')">
        <td>
          <div style="display:flex;flex-direction:column;gap:2px">
            <div class="table-name" title="${c.nombre}">${c.nombre}</div>
            <div style="font-size:0.7rem;color:var(--slate-400)">${c.cuit || ''}</div>
          </div>
        </td>
        <td><span class="table-id">${c.id}</span></td>
        <td><span class="badge-tipo ${c.tipo}">${tipoLabel(c.tipo)}</span></td>
        <td>${statusBadge(c)}</td>
        <td style="color:var(--slate-600);font-size:0.8rem">${c.equipo || '—'}</td>
        <td style="color:var(--slate-600);font-size:0.8rem">${c.fa || '—'}</td>
        <td style="font-size:0.78rem;color:var(--slate-500)">${formatDate(c.fechaAltaContrato)}</td>
      </tr>
    `).join('');
    renderPagination();
  }

  function renderPagination() {
    const total = _filtered.length;
    const totalPages = Math.ceil(total / PER_PAGE);
    const info = document.getElementById('page-info');
    const btns = document.getElementById('page-btns');
    if (!info || !btns) return;

    const start = Math.min((_page - 1) * PER_PAGE + 1, total);
    const end = Math.min(_page * PER_PAGE, total);
    info.textContent = `Mostrando ${start}–${end} de ${total} contratos`;

    let html = `
      <button class="page-btn" onclick="Contratos.goPage(${_page - 1})" ${_page === 1 ? 'disabled' : ''}>
        ${icon('chevron-left')}
      </button>
    `;

    const range = getPagesRange(totalPages, _page);
    range.forEach(p => {
      if (p === '...') {
        html += `<button class="page-btn" disabled>…</button>`;
      } else {
        html += `<button class="page-btn ${p === _page ? 'active' : ''}" onclick="Contratos.goPage(${p})">${p}</button>`;
      }
    });

    html += `
      <button class="page-btn" onclick="Contratos.goPage(${_page + 1})" ${_page === totalPages ? 'disabled' : ''}>
        ${icon('chevron-right')}
      </button>
    `;
    btns.innerHTML = html;
  }

  function getPagesRange(total, current) {
    if (total <= 7) return Array.from({length: total}, (_, i) => i + 1);
    const pages = [];
    pages.push(1);
    if (current > 3) pages.push('...');
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i);
    }
    if (current < total - 2) pages.push('...');
    pages.push(total);
    return pages;
  }

  function goPage(p) {
    const total = Math.ceil(_filtered.length / PER_PAGE);
    if (p < 1 || p > total) return;
    _page = p;
    renderTable();
  }

  function applyFilters() {
    const search = document.getElementById('contratos-search')?.value?.toLowerCase() || '';
    const tipo   = document.getElementById('filter-tipo')?.value || '';
    const estado = document.getElementById('filter-estado')?.value || '';
    const equipo = document.getElementById('filter-equipo')?.value || '';
    const moneda = document.getElementById('filter-moneda')?.value || '';

    _filtered = App.getContratos().filter(c => {
      const matchSearch = !search || (
        (c.nombre||'').toLowerCase().includes(search) ||
        (c.id||'').toLowerCase().includes(search) ||
        (c.cuit||'').toString().includes(search) ||
        (c.nroRef||'').toLowerCase().includes(search) ||
        (c.equipo||'').toLowerCase().includes(search) ||
        (c.fa||'').toLowerCase().includes(search) ||
        (c.localidad||'').toLowerCase().includes(search) ||
        (c.mail||'').toLowerCase().includes(search) ||
        (c.observaciones||'').toLowerCase().includes(search)
      );
      const matchTipo   = !tipo   || c.tipo === tipo;
      const matchEstado = !estado || c.estado === estado || 
        (estado === 'Incubadora' && (c.incubadora||'').toString().toLowerCase() === 'si');
      const matchEquipo = !equipo || c.equipo === equipo;
      const matchMoneda = !moneda || (c.moneda||'').toLowerCase().includes(moneda.toLowerCase());
      return matchSearch && matchTipo && matchEstado && matchEquipo && matchMoneda;
    });

    // Sort
    _filtered.sort((a, b) => {
      let av = (a[_sortKey] || '').toString().toLowerCase();
      let bv = (b[_sortKey] || '').toString().toLowerCase();
      return _sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
    });

    _page = 1;
    document.getElementById('contratos-count').textContent = _filtered.length;
    renderTable();
  }

  function populateEquipoFilter() {
    const equipos = [...new Set(App.getContratos().map(c => c.equipo).filter(Boolean))].sort();
    const sel = document.getElementById('filter-equipo');
    if (sel) {
      sel.innerHTML = '<option value="">Todos los equipos</option>' +
        equipos.map(e => `<option value="${e}">${e}</option>`).join('');
    }
  }

  function render() {
    populateEquipoFilter();
    _filtered = [...App.getContratos()];
    applyFilters();

    // Wire up filters
    ['contratos-search', 'filter-tipo', 'filter-estado', 'filter-equipo', 'filter-moneda'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', applyFilters);
      document.getElementById(id)?.addEventListener('change', applyFilters);
    });
  }

  document.addEventListener('app:navigate', (e) => {
    if (e.detail.page === 'contratos') render();
  });

  // Detail panel
  document.addEventListener('app:detail', (e) => {
    const c = e.detail.contrato;
    if (!c) return;
    renderDetailPanel(c);
  });

  function renderDetailPanel(c) {
    function formatDate(d) {
      if (!d) return '—';
      try {
        const dt = new Date(d);
        if (isNaN(dt)) return d;
        return dt.toLocaleDateString('es-AR', { day:'2-digit', month:'2-digit', year:'numeric' });
      } catch { return d; }
    }

    document.getElementById('detail-title').textContent = c.nombre;
    document.getElementById('detail-meta-content').innerHTML = `
      <span class="badge-tipo ${c.tipo}">${c.tipo}</span>
      ${statusBadge(c)}
      ${c.nroRef ? `<span class="table-id">${c.nroRef}</span>` : ''}
      <span class="table-id">${c.id}</span>
    `;

    const adEnda = (c.adendas || []).length > 0 ? `
      <div class="detail-section">
        <div class="detail-section-title">Adendas Registradas (${c.adendas.length})</div>
        ${c.adendas.map(a => `
          <div class="adenda-item">
            <div class="adenda-mod">${a.modificacion || '—'}</div>
            <div class="adenda-date">${a.fecha || ''} ${a.observaciones ? '· ' + a.observaciones : ''}</div>
          </div>
        `).join('')}
      </div>
    ` : '';

    document.getElementById('detail-body-content').innerHTML = `
      <div class="detail-section">
        <div class="detail-section-title">Información General</div>
        <div class="detail-fields">
          <div class="detail-field">
            <label>Tipo</label>
            <span>${c.subtipo || c.tipo}</span>
          </div>
          <div class="detail-field">
            <label>Estado</label>
            <span>${c.estado}</span>
          </div>
          <div class="detail-field">
            <label>CUIT</label>
            <span style="font-family:var(--font-mono);font-size:0.8rem">${c.cuit || '—'}</span>
          </div>
          <div class="detail-field">
            <label>Persona</label>
            <span>${c.persona || '—'}</span>
          </div>
          <div class="detail-field">
            <label>Alta en Balanz</label>
            <span>${formatDate(c.fechaAltaBalanz)}</span>
          </div>
          <div class="detail-field">
            <label>Alta como ${c.tipo}</label>
            <span>${formatDate(c.fechaAltaContrato)}</span>
          </div>
          ${c.fechaRescision ? `<div class="detail-field"><label>Fecha Rescisión</label><span style="color:var(--red-500)">${formatDate(c.fechaRescision)}</span></div>` : ''}
          <div class="detail-field">
            <label>Localidad</label>
            <span>${c.localidad || '—'}</span>
          </div>
          <div class="detail-field">
            <label>Condición IVA</label>
            <span>${c.condicionIVA || '—'}</span>
          </div>
          ${c.matriculaCNV ? `<div class="detail-field"><label>Matrícula CNV</label><span style="font-family:var(--font-mono);font-size:0.8rem">${c.matriculaCNV}</span></div>` : ''}
          ${c.nroRef ? `<div class="detail-field"><label>Nº Referencia</label><span style="font-family:var(--font-mono);font-size:0.8rem">${c.nroRef}</span></div>` : ''}
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">Información Comercial</div>
        <div class="detail-fields">
          <div class="detail-field">
            <label>Porcentaje</label>
            <span style="font-weight:700;color:var(--azure-500)">${c.porcentaje || '—'}</span>
          </div>
          <div class="detail-field">
            <label>Moneda</label>
            <span>${c.moneda || '—'}</span>
          </div>
          <div class="detail-field">
            <label>Oficial (FA)</label>
            <span>${c.fa || '—'}</span>
          </div>
          <div class="detail-field">
            <label>Equipo</label>
            <span>${c.equipo || '—'}</span>
          </div>
          <div class="detail-field">
            <label>Incubadora</label>
            <span>${(c.incubadora||'').toString().toLowerCase() === 'si' ? '✓ Sí' : 'No'}</span>
          </div>
          <div class="detail-field">
            <label>CRM</label>
            <span>${c.crm || '—'}</span>
          </div>
        </div>
      </div>

      ${c.mail ? `
      <div class="detail-section">
        <div class="detail-section-title">Contacto</div>
        <div class="detail-fields">
          <div class="detail-field full">
            <label>Email</label>
            <span style="word-break:break-all">${c.mail}</span>
          </div>
        </div>
      </div>
      ` : ''}

      ${c.observaciones ? `
      <div class="detail-section">
        <div class="detail-section-title">Observaciones</div>
        <div class="detail-obs">${c.observaciones}</div>
      </div>
      ` : ''}

      ${adEnda}
    `;

    // Actions
    document.getElementById('detail-actions-content').innerHTML = `
      ${c.mail ? `<a href="mailto:${c.mail.split(';')[0].trim()}" class="btn btn-primary btn-sm">${icon('mail')} Contactar</a>` : ''}
      <button class="btn btn-ghost btn-sm" onclick="copyToClipboard('${c.nombre}')">${icon('clipboard')} Copiar nombre</button>
      ${c.cuit ? `<button class="btn btn-ghost btn-sm" onclick="copyToClipboard('${c.cuit}')">${icon('clipboard')} Copiar CUIT</button>` : ''}
    `;

    document.getElementById('detail-overlay').classList.add('open');
  }

  return { render, goPage, applyFilters };
})();

function copyToClipboard(text) {
  navigator.clipboard?.writeText(text).catch(() => {});
}
