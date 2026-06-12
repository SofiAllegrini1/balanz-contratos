/* =========================================================
   BALANZ Contract Intelligence Platform v2.0 — contratos.js
   ========================================================= */

const Contratos = (() => {
  let _filtered = [];
  let _page = 1;
  const PER_PAGE = 20;

  function formatDate(d) {
    if (!d) return '—';
    try {
      const dt = new Date(d);
      if (isNaN(dt)) return d;
      return dt.toLocaleDateString('es-AR', { day:'2-digit', month:'2-digit', year:'numeric' });
    } catch { return d; }
  }

  function statusBadge(c) {
    if (c.estado === 'Rescindido') return '<span class="badge-status rescindido">Rescindido</span>';
    if ((c.incubadora||'').toLowerCase() === 'si') return '<span class="badge-status incubadora">Incubadora</span>';
    if ((c.crm||'').toLowerCase() === 'ifa') return '<span class="badge-status ifa">IFA</span>';
    return '<span class="badge-status vigente">Vigente</span>';
  }

  function renderTable() {
    const start = (_page - 1) * PER_PAGE;
    const pageData = _filtered.slice(start, start + PER_PAGE);
    const tbody = document.getElementById('contratos-tbody');
    if (!tbody) return;
    if (pageData.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state">${icon('search')}<p>No se encontraron contratos.</p></div></td></tr>`;
      return;
    }
    tbody.innerHTML = pageData.map(c => `
      <tr onclick="App.selectContrato('${c.id}')">
        <td><div style="display:flex;flex-direction:column;gap:2px"><div class="table-name" title="${c.nombre}">${c.nombre}</div><div style="font-size:0.7rem;color:var(--slate-400)">${c.cuit||''}</div></div></td>
        <td><span class="table-id">${c.id}</span></td>
        <td><span class="badge-tipo ${c.tipo}">${c.tipo}</span></td>
        <td>${statusBadge(c)}</td>
        <td style="color:var(--slate-600);font-size:0.8rem">${c.equipo||'—'}</td>
        <td style="color:var(--slate-600);font-size:0.8rem">${c.fa||'—'}</td>
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
    const start = Math.min((_page-1)*PER_PAGE+1, total);
    const end = Math.min(_page*PER_PAGE, total);
    info.textContent = `Mostrando ${start}–${end} de ${total} contratos`;
    let html = `<button class="page-btn" onclick="Contratos.goPage(${_page-1})" ${_page===1?'disabled':''}>${icon('chevron-left')}</button>`;
    getPagesRange(totalPages, _page).forEach(p => {
      html += p==='...' ? `<button class="page-btn" disabled>…</button>` : `<button class="page-btn ${p===_page?'active':''}" onclick="Contratos.goPage(${p})">${p}</button>`;
    });
    html += `<button class="page-btn" onclick="Contratos.goPage(${_page+1})" ${_page===totalPages?'disabled':''}>${icon('chevron-right')}</button>`;
    btns.innerHTML = html;
  }

  function getPagesRange(total, current) {
    if (total <= 7) return Array.from({length:total},(_,i)=>i+1);
    const pages = [1];
    if (current > 3) pages.push('...');
    for (let i=Math.max(2,current-1); i<=Math.min(total-1,current+1); i++) pages.push(i);
    if (current < total-2) pages.push('...');
    pages.push(total);
    return pages;
  }

  function goPage(p) {
    const total = Math.ceil(_filtered.length/PER_PAGE);
    if (p < 1 || p > total) return;
    _page = p;
    renderTable();
  }

  function applyFilters() {
    const search = document.getElementById('contratos-search')?.value?.toLowerCase()||'';
    const tipo   = document.getElementById('filter-tipo')?.value||'';
    const estado = document.getElementById('filter-estado')?.value||'';
    const equipo = document.getElementById('filter-equipo')?.value||'';
    const moneda = document.getElementById('filter-moneda')?.value||'';
    _filtered = App.getContratos().filter(c => {
      const ms = !search||((c.nombre||'').toLowerCase().includes(search)||(c.id||'').toLowerCase().includes(search)||(c.cuit||'').toString().includes(search)||(c.nroRef||'').toLowerCase().includes(search)||(c.equipo||'').toLowerCase().includes(search)||(c.fa||'').toLowerCase().includes(search)||(c.localidad||'').toLowerCase().includes(search)||(c.mail||'').toLowerCase().includes(search));
      const mt = !tipo||c.tipo===tipo;
      const me = !estado||c.estado===estado||(estado==='Incubadora'&&(c.incubadora||'').toLowerCase()==='si');
      const meq = !equipo||c.equipo===equipo;
      const mm = !moneda||(c.moneda||'').toLowerCase().includes(moneda.toLowerCase());
      return ms&&mt&&me&&meq&&mm;
    });
    _filtered.sort((a,b)=>(a.nombre||'').localeCompare(b.nombre||''));
    _page = 1;
    document.getElementById('contratos-count').textContent = _filtered.length;
    renderTable();
  }

  function populateEquipoFilter() {
    const equipos = [...new Set(App.getContratos().map(c=>c.equipo).filter(Boolean))].sort();
    const sel = document.getElementById('filter-equipo');
    if (sel) sel.innerHTML = '<option value="">Todos los equipos</option>'+equipos.map(e=>`<option value="${e}">${e}</option>`).join('');
  }

  function render() {
    populateEquipoFilter();
    _filtered = [...App.getContratos()];
    applyFilters();
    ['contratos-search','filter-tipo','filter-estado','filter-equipo','filter-moneda'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.oninput = applyFilters; el.onchange = applyFilters; }
    });
  }

  document.addEventListener('app:navigate', (e) => { if (e.detail.page==='contratos') render(); });

  document.addEventListener('app:detail', (e) => {
    const c = e.detail.contrato;
    if (!c) return;
    renderDetailPanel(c);
  });

  function renderDetailPanel(c) {
    document.getElementById('detail-title').textContent = c.nombre;
    document.getElementById('detail-meta-content').innerHTML = `
      <span class="badge-tipo ${c.tipo}">${c.tipo}</span>
      ${statusBadge(c)}
      ${c.nroRef?`<span class="table-id">${c.nroRef}</span>`:''}
      <span class="table-id">${c.id}</span>
    `;

    const historial = (c.historial||[]).slice(0,5);
    const historialHTML = historial.length > 0 ? `
      <div class="detail-section">
        <div class="detail-section-title">Historial de cambios</div>
        ${historial.map((h,i)=>`
          <div class="history-item">
            <div class="history-dot-wrap">
              <div class="history-dot"></div>
              ${i<historial.length-1?'<div class="history-line"></div>':''}
            </div>
            <div class="history-content">
              <div class="history-action">${h.accion}</div>
              <div class="history-detail">${h.detalle||''}</div>
              <div class="history-time">${h.usuario||''} · ${h.fecha?new Date(h.fecha).toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit',year:'numeric'}):''}</div>
            </div>
          </div>
        `).join('')}
      </div>` : '';

    const adendasHTML = (c.adendas||[]).length > 0 ? `
      <div class="detail-section">
        <div class="detail-section-title">Adendas (${c.adendas.length})</div>
        ${c.adendas.map(a=>`
          <div class="adenda-item">
            <div class="adenda-mod">${a.modificacion||'—'}</div>
            <div class="adenda-date">${a.fecha||''} ${a.observaciones?'· '+a.observaciones:''}</div>
          </div>
        `).join('')}
      </div>` : '';

    document.getElementById('detail-body-content').innerHTML = `
      <div class="detail-section">
        <div class="detail-section-title">Información General</div>
        <div class="detail-fields">
          <div class="detail-field"><label>Tipo</label><span>${c.subtipo||c.tipo}</span></div>
          <div class="detail-field"><label>Estado</label><span>${c.estado}</span></div>
          <div class="detail-field"><label>CUIT</label><span style="font-family:var(--font-mono);font-size:0.8rem">${c.cuit||'—'}</span></div>
          <div class="detail-field"><label>Persona</label><span>${c.persona||'—'}</span></div>
          <div class="detail-field"><label>Alta en Balanz</label><span>${formatDate(c.fechaAltaBalanz)}</span></div>
          <div class="detail-field"><label>Alta como ${c.tipo}</label><span>${formatDate(c.fechaAltaContrato)}</span></div>
          ${c.fechaRescision?`<div class="detail-field"><label>Fecha Rescisión</label><span style="color:var(--red-500)">${formatDate(c.fechaRescision)}</span></div>`:''}
          <div class="detail-field"><label>Localidad</label><span>${c.localidad||'—'}</span></div>
          <div class="detail-field"><label>Condición IVA</label><span>${c.condicionIVA||'—'}</span></div>
          ${c.matriculaCNV?`<div class="detail-field"><label>Matrícula CNV</label><span style="font-family:var(--font-mono);font-size:0.8rem">${c.matriculaCNV}</span></div>`:''}
          ${c.nroRef?`<div class="detail-field"><label>N° Referencia</label><span style="font-family:var(--font-mono);font-size:0.8rem">${c.nroRef}</span></div>`:''}
        </div>
      </div>
      <div class="detail-section">
        <div class="detail-section-title">Información Comercial</div>
        <div class="detail-fields">
          <div class="detail-field"><label>Porcentaje</label><span style="font-weight:700;color:var(--azure-500)">${c.porcentaje||'—'}</span></div>
          <div class="detail-field"><label>Moneda</label><span>${c.moneda||'—'}</span></div>
          <div class="detail-field"><label>Oficial (FA)</label><span>${c.fa||'—'}</span></div>
          <div class="detail-field"><label>Equipo</label><span>${c.equipo||'—'}</span></div>
          <div class="detail-field"><label>Incubadora</label><span>${(c.incubadora||'').toLowerCase()==='si'?'✓ Sí':'No'}</span></div>
          <div class="detail-field"><label>CRM</label><span>${c.crm||'—'}</span></div>
        </div>
      </div>
      ${c.mail?`<div class="detail-section"><div class="detail-section-title">Contacto</div><div class="detail-fields"><div class="detail-field full"><label>Email</label><span style="word-break:break-all">${c.mail}</span></div></div></div>`:''}
      ${c.observaciones?`<div class="detail-section"><div class="detail-section-title">Observaciones</div><div class="detail-obs">${c.observaciones}</div></div>`:''}
      ${adendasHTML}
      ${historialHTML}
    `;

    const editButtons = App.isLoggedIn() && c.estado !== 'Rescindido' ? `
      <button class="btn btn-primary btn-sm" onclick="FormPanel.openEdit('${c.id}')">${icon('edit-3')} Editar</button>
      <button class="btn btn-ghost btn-sm" onclick="AdendaPanel.open('${c.id}')">${icon('plus')} Nueva adenda</button>
      <button class="btn btn-danger btn-sm" onclick="BajaModal.open('${c.id}')">${icon('x-circle')} Dar de baja</button>
    ` : '';

    document.getElementById('detail-actions-content').innerHTML = `
      ${c.mail?`<a href="mailto:${c.mail.split(';')[0].trim()}" class="btn btn-ghost btn-sm">${icon('mail')} Contactar</a>`:''}
      <button class="btn btn-ghost btn-sm" onclick="copyToClipboard('${c.nombre}')">${icon('clipboard')} Copiar nombre</button>
      ${c.cuit?`<button class="btn btn-ghost btn-sm" onclick="copyToClipboard('${c.cuit}')">${icon('clipboard')} CUIT</button>`:''}
      ${editButtons}
    `;

    document.getElementById('detail-overlay').classList.add('open');
  }

  return { render, goPage, applyFilters };
})();

function copyToClipboard(text) {
  navigator.clipboard?.writeText(text).catch(()=>{});
}
