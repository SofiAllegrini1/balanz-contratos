/* =========================================================
   BALANZ Contract Intelligence Platform v2.2 — contratos.js
   Tabs: Vigentes / Rescindidos | Comision column
   ========================================================= */

const Contratos = (() => {
  let _tab = 'vigentes'; // 'vigentes' | 'rescindidos'
  let _filtered = [];
  let _page = 1;
  const PER_PAGE = 20;

  function formatDate(d) {
    if (!d) return '—';
    try {
      const dt = new Date(d);
      if (isNaN(dt)) return d;
      return dt.toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit',year:'numeric'});
    } catch { return d; }
  }

  function statusBadge(c) {
    if (c.estado==='Rescindido') return '<span class="badge-status rescindido">Rescindido</span>';
    if ((c.incubadora||'').toLowerCase()==='si') return '<span class="badge-status incubadora">Incubadora</span>';
    if ((c.crm||'').toLowerCase()==='ifa') return '<span class="badge-status ifa">IFA</span>';
    return '<span class="badge-status vigente">Vigente</span>';
  }

  function legajoBtn(c) {
    if (c.legajoUrl) {
      return `<a class="btn-legajo has-legajo" href="${c.legajoUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration:none" onclick="event.stopPropagation()" title="Ver legajo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
        Ver legajo</a>`;
    }
    if (!App.isLoggedIn()) return '<span style="font-size:0.7rem;color:var(--slate-400)">—</span>';
    return `<button class="btn-legajo no-legajo" onclick="event.stopPropagation();LegajoPanel.openAdd('${c.id}')" title="Cargar legajo">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
      Sin legajo</button>`;
  }

  function switchTab(tab) {
    _tab = tab;
    _page = 1;
    document.querySelectorAll('.main-tab').forEach(t => t.classList.toggle('active', t.dataset.tab===tab));
    // Show/hide columns
    const resCol = document.getElementById('th-fecha-res');
    if (resCol) resCol.style.display = tab==='rescindidos' ? '' : 'none';
    applyFilters();
  }

  function renderTable() {
    const start = (_page-1)*PER_PAGE;
    const pageData = _filtered.slice(start, start+PER_PAGE);
    const tbody = document.getElementById('contratos-tbody');
    if (!tbody) return;

    if (!pageData.length) {
      tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state">${icon('search')}<p>No se encontraron contratos.</p></div></td></tr>`;
      return;
    }

    if (_tab === 'vigentes') {
      tbody.innerHTML = pageData.map(c => `
        <tr onclick="App.selectContrato('${c.id}')">
          <td><div style="display:flex;flex-direction:column;gap:2px"><div class="table-name" title="${c.nombre}">${c.nombre}</div><div style="font-size:0.7rem;color:var(--slate-400)">${c.cuit||''}</div></div></td>
          <td><span class="badge-tipo ${c.tipo}">${c.tipo}</span></td>
          <td>${statusBadge(c)}</td>
          <td style="color:var(--slate-600);font-size:0.8rem">${c.equipo||'—'}</td>
          <td style="font-size:0.78rem;color:var(--slate-500)">${formatDate(c.fechaAltaContrato)}</td>
          <td>${c.porcentaje?`<span class="comision-badge">${c.porcentaje}</span>`:'<span style="color:var(--slate-400);font-size:0.78rem">—</span>'}</td>
          <td>${legajoBtn(c)}</td>
        </tr>
      `).join('');
    } else {
      tbody.innerHTML = pageData.map(c => `
        <tr onclick="App.selectContrato('${c.id}')" style="opacity:.85">
          <td><div style="display:flex;flex-direction:column;gap:2px"><div class="table-name" title="${c.nombre}">${c.nombre}</div><div style="font-size:0.7rem;color:var(--slate-400)">${c.cuit||''}</div></div></td>
          <td><span class="badge-tipo ${c.tipo==='BAJA'?'REF':c.tipo}">${c.tipo==='BAJA'?'REF':c.tipo}</span></td>
          <td style="color:var(--slate-600);font-size:0.8rem">${c.equipo||'—'}</td>
          <td style="font-size:0.78rem;color:var(--slate-500)">${formatDate(c.fechaAltaContrato)}</td>
          <td><span class="fecha-res">${formatDate(c.fechaRescision)||'—'}</span></td>
          <td>${c.porcentaje?`<span class="comision-badge">${c.porcentaje}</span>`:'<span style="color:var(--slate-400);font-size:0.78rem">—</span>'}</td>
          <td>${legajoBtn(c)}</td>
        </tr>
      `).join('');
    }
    renderPagination();
  }

  function renderPagination() {
    const total = _filtered.length;
    const totalPages = Math.ceil(total/PER_PAGE);
    const info = document.getElementById('page-info');
    const btns = document.getElementById('page-btns');
    if (!info||!btns) return;
    const start = Math.min((_page-1)*PER_PAGE+1, total);
    const end = Math.min(_page*PER_PAGE, total);
    info.textContent = `Mostrando ${start}–${end} de ${total} contratos`;
    let html = `<button class="page-btn" onclick="Contratos.goPage(${_page-1})" ${_page===1?'disabled':''}>${icon('chevron-left')}</button>`;
    getPagesRange(totalPages, _page).forEach(p => {
      html += p==='...'?`<button class="page-btn" disabled>…</button>`:`<button class="page-btn ${p===_page?'active':''}" onclick="Contratos.goPage(${p})">${p}</button>`;
    });
    html += `<button class="page-btn" onclick="Contratos.goPage(${_page+1})" ${_page===totalPages?'disabled':''}>${icon('chevron-right')}</button>`;
    btns.innerHTML = html;
  }

  function getPagesRange(total, current) {
    if (total<=7) return Array.from({length:total},(_,i)=>i+1);
    const pages=[1];
    if (current>3) pages.push('...');
    for(let i=Math.max(2,current-1);i<=Math.min(total-1,current+1);i++) pages.push(i);
    if(current<total-2) pages.push('...');
    pages.push(total);
    return pages;
  }

  function goPage(p) {
    const total = Math.ceil(_filtered.length/PER_PAGE);
    if (p<1||p>total) return;
    _page = p;
    renderTable();
  }

  function applyFilters() {
    const search = document.getElementById('contratos-search')?.value?.toLowerCase()||'';
    const tipo   = document.getElementById('filter-tipo')?.value||'';
    const equipo = document.getElementById('filter-equipo')?.value||'';
    const moneda = document.getElementById('filter-moneda')?.value||'';
    const legajo = document.getElementById('filter-legajo')?.value||'';

    const base = _tab==='vigentes'
      ? App.getContratos().filter(c=>c.estado==='Vigente')
      : App.getContratos().filter(c=>c.estado==='Rescindido');

    _filtered = base.filter(c => {
      const ms = !search||((c.nombre||'').toLowerCase().includes(search)||(c.cuit||'').toString().includes(search)||(c.equipo||'').toLowerCase().includes(search)||(c.nroRef||'').toLowerCase().includes(search)||(c.mail||'').toLowerCase().includes(search));
      const mt = !tipo||c.tipo===tipo||(tipo==='REF'&&c.tipo==='BAJA');
      const meq = !equipo||c.equipo===equipo;
      const mm = !moneda||(c.moneda||'').toLowerCase().includes(moneda.toLowerCase());
      const ml = !legajo||(legajo==='con'?!!c.legajoUrl:!c.legajoUrl);
      return ms&&mt&&meq&&mm&&ml;
    });

    _filtered.sort((a,b)=>(a.nombre||'').localeCompare(b.nombre||''));
    _page=1;

    // Update counts
    const all = App.getContratos();
    const vigCount = all.filter(c=>c.estado==='Vigente').length;
    const resCount = all.filter(c=>c.estado==='Rescindido').length;
    document.getElementById('tab-vigentes-count').textContent = vigCount;
    document.getElementById('tab-rescindidos-count').textContent = resCount;
    document.getElementById('contratos-count').textContent = _filtered.length;

    renderTable();
    updateHeaders();
  }

  function updateHeaders() {
    const thead = document.getElementById('contratos-thead');
    if (!thead) return;
    if (_tab==='vigentes') {
      thead.innerHTML = `<tr>
        <th>Nombre / CUIT</th><th>Tipo</th><th>Estado</th><th>Equipo</th><th>Alta</th>
        <th><span style="display:flex;align-items:center;gap:4px">Comisión<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px;opacity:.4" title="Porcentaje de comisión acordado en el contrato"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></span></th>
        <th>Legajo</th>
      </tr>`;
    } else {
      thead.innerHTML = `<tr>
        <th>Nombre / CUIT</th><th>Tipo</th><th>Equipo</th><th>Alta</th>
        <th style="color:#b91c1c">Fecha rescisión</th>
        <th>Comisión</th><th>Legajo</th>
      </tr>`;
    }
  }

  function populateEquipoFilter() {
    const equipos = [...new Set(App.getContratos().map(c=>c.equipo).filter(Boolean))].sort();
    const sel = document.getElementById('filter-equipo');
    if (sel) sel.innerHTML = '<option value="">Todos los equipos</option>'+equipos.map(e=>`<option value="${e}">${e}</option>`).join('');
  }

  function render() {
    populateEquipoFilter();
    applyFilters();
    ['contratos-search','filter-tipo','filter-equipo','filter-moneda','filter-legajo'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.oninput = applyFilters; el.onchange = applyFilters; }
    });
    // Tab clicks
    document.querySelectorAll('.main-tab[data-tab]').forEach(tab => {
      tab.onclick = () => switchTab(tab.dataset.tab);
    });
  }

  document.addEventListener('app:navigate', (e) => { if (e.detail.page==='contratos') render(); });
  document.addEventListener('app:detail', (e) => { if (e.detail.contrato) renderDetailPanel(e.detail.contrato); });

  function renderDetailPanel(c) {
    document.getElementById('detail-title').textContent = c.nombre;
    document.getElementById('detail-meta-content').innerHTML = `
      <span class="badge-tipo ${c.tipo==='BAJA'?'REF':c.tipo}">${c.tipo==='BAJA'?'REF':c.tipo}</span>
      ${statusBadge(c)}
      ${c.nroRef?`<span class="table-id">${c.nroRef}</span>`:''}
      <span class="table-id">${c.id}</span>
    `;

    const legajoHTML = c.legajoUrl ? `
      <div class="detail-section">
        <div class="detail-section-title">Legajo SharePoint</div>
        <div style="background:var(--ice-50);border:1.5px solid var(--azure-100);border-radius:10px;padding:14px 16px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
            <div style="display:flex;align-items:center;gap:7px">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;color:var(--azure-400)"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
              <span style="font-size:0.82rem;font-weight:600;color:var(--azure-500)">Legajo disponible</span>
            </div>
            <a class="btn btn-primary btn-sm" href="${c.legajoUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration:none">
              ${icon('external-link')} Ver legajo
            </a>
          </div>
          <div style="font-size:0.72rem;color:var(--slate-500);word-break:break-all">${c.legajoTexto||'Carpeta en SharePoint'}</div>
          ${App.isLoggedIn()?`<button class="btn btn-ghost btn-sm" style="margin-top:8px;font-size:0.7rem" onclick="LegajoPanel.openEdit('${c.id}')">${icon('edit-3')} Editar link</button>`:''}
        </div>
      </div>` : `
      <div class="detail-section">
        <div class="detail-section-title">Legajo SharePoint</div>
        <div style="background:var(--slate-50);border:1.5px solid var(--slate-200);border-radius:10px;padding:14px 16px">
          <div style="display:flex;align-items:center;gap:7px;margin-bottom:6px">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;color:var(--slate-400)"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="9" y1="1" x2="9" y2="6"/><line x1="3" y1="22" x2="21" y2="2"/></svg>
            <span style="font-size:0.82rem;color:var(--slate-500)">Sin legajo cargado</span>
          </div>
          ${App.isLoggedIn()?`<button class="btn btn-ghost btn-sm" onclick="LegajoPanel.openAdd('${c.id}')">${icon('plus')} Cargar link</button>`:''}
        </div>
      </div>`;

    const historial = (c.historial||[]).slice(0,5);
    const historialHTML = historial.length > 0 ? `
      <div class="detail-section">
        <div class="detail-section-title">Historial de cambios</div>
        ${historial.map((h,i)=>`
          <div class="history-item">
            <div class="history-dot-wrap"><div class="history-dot"></div>${i<historial.length-1?'<div class="history-line"></div>':''}</div>
            <div class="history-content">
              <div class="history-action">${h.accion}</div>
              <div class="history-detail">${h.detalle||''}</div>
              <div class="history-time">${h.usuario||''} · ${h.fecha?new Date(h.fecha).toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit',year:'numeric'}):''}</div>
            </div>
          </div>`).join('')}
      </div>` : '';

    const adendasHTML = (c.adendas||[]).length > 0 ? `
      <div class="detail-section">
        <div class="detail-section-title">Adendas (${c.adendas.length})</div>
        ${c.adendas.map(a=>`<div class="adenda-item"><div class="adenda-mod">${a.modificacion||'—'}</div><div class="adenda-date">${a.fecha||''} ${a.observaciones?'· '+a.observaciones:''}</div></div>`).join('')}
      </div>` : '';

    document.getElementById('detail-body-content').innerHTML = `
      ${legajoHTML}
      <div class="detail-section">
        <div class="detail-section-title">Información General</div>
        <div class="detail-fields">
          <div class="detail-field"><label>Tipo</label><span>${c.subtipo||c.tipo}</span></div>
          <div class="detail-field"><label>Estado</label><span>${c.estado}</span></div>
          <div class="detail-field"><label>CUIT</label><span style="font-family:var(--font-mono);font-size:0.8rem">${c.cuit||'—'}</span></div>
          <div class="detail-field"><label>Persona</label><span>${c.persona||'—'}</span></div>
          <div class="detail-field"><label>Alta</label><span>${formatDate(c.fechaAltaContrato)}</span></div>
          ${c.fechaRescision?`<div class="detail-field"><label>Rescisión</label><span style="color:var(--red-500);font-weight:600">${formatDate(c.fechaRescision)}</span></div>`:''}
          <div class="detail-field"><label>Localidad</label><span>${c.localidad||'—'}</span></div>
          <div class="detail-field"><label>Cond. IVA</label><span>${c.condicionIVA||'—'}</span></div>
          ${c.nroRef?`<div class="detail-field"><label>N° Ref</label><span style="font-family:var(--font-mono);font-size:0.8rem">${c.nroRef}</span></div>`:''}
          ${c.matriculaCNV?`<div class="detail-field"><label>Matrícula CNV</label><span style="font-family:var(--font-mono);font-size:0.8rem">${c.matriculaCNV}</span></div>`:''}
        </div>
      </div>
      <div class="detail-section">
        <div class="detail-section-title">Información Comercial</div>
        <div class="detail-fields">
          <div class="detail-field"><label>Comisión</label><span style="font-weight:700;color:var(--azure-500)">${c.porcentaje||'—'}</span></div>
          <div class="detail-field"><label>Moneda</label><span>${c.moneda||'—'}</span></div>
          <div class="detail-field"><label>FA</label><span>${c.fa||'—'}</span></div>
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

    const editButtons = App.isLoggedIn() && c.estado!=='Rescindido' ? `
      <button class="btn btn-primary btn-sm" onclick="FormPanel.openEdit('${c.id}')">${icon('edit-3')} Editar</button>
      <button class="btn btn-ghost btn-sm" onclick="AdendaPanel.open('${c.id}')">${icon('plus')} Adenda</button>
      <button class="btn btn-danger btn-sm" onclick="BajaModal.open('${c.id}')">${icon('x-circle')} Dar de baja</button>
    ` : '';

    document.getElementById('detail-actions-content').innerHTML = `
      ${c.mail?`<a href="mailto:${c.mail.split(';')[0].trim()}" class="btn btn-ghost btn-sm">${icon('mail')} Contactar</a>`:''}
      <button class="btn btn-ghost btn-sm" onclick="copyToClipboard('${c.nombre}')">${icon('clipboard')} Copiar</button>
      ${editButtons}
    `;
    document.getElementById('detail-overlay').classList.add('open');
  }

  return { render, goPage, applyFilters, switchTab };
})();

function copyToClipboard(text) { navigator.clipboard?.writeText(text).catch(()=>{}); }

/* ── Legajo Panel ────────────────────────────────────────── */
const LegajoPanel = (() => {
  let _id = null;
  function openAdd(id) { if(!App.isLoggedIn())return; _id=id; const c=App.getContratoById(id); document.getElementById('legajo-panel-title').textContent='Cargar link de legajo'; document.getElementById('legajo-nombre').textContent=c?.nombre||''; document.getElementById('legajo-url-input').value=c?.legajoUrl||''; document.getElementById('legajo-texto-input').value=c?.legajoTexto||''; document.getElementById('legajo-add-panel').classList.add('open'); }
  function openEdit(id) { openAdd(id); document.getElementById('legajo-panel-title').textContent='Editar link de legajo'; }
  async function save() {
    const url=document.getElementById('legajo-url-input').value.trim(); const texto=document.getElementById('legajo-texto-input').value.trim();
    if(!url){alert('Ingresá la URL del legajo');return;}
    const btn=document.getElementById('legajo-save-btn'); btn.disabled=true; btn.textContent='Guardando…';
    const ok=await App.updateContrato(_id,{legajoUrl:url,legajoTexto:texto}); btn.disabled=false; btn.textContent='Guardar';
    if(ok){document.getElementById('legajo-add-panel').classList.remove('open');const c=App.getContratoById(_id);if(c)document.dispatchEvent(new CustomEvent('app:detail',{detail:{contrato:c}}));}
  }
  document.addEventListener('DOMContentLoaded',()=>{
    document.getElementById('legajo-save-btn')?.addEventListener('click',save);
    document.getElementById('legajo-close')?.addEventListener('click',()=>document.getElementById('legajo-add-panel').classList.remove('open'));
  });
  return { openAdd, openEdit };
})();
