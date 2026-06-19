/* =========================================================
   BALANZ Contract Intelligence Platform v2.0 — form.js
   New/Edit contract, Baja modal, Adenda panel
   ========================================================= */

const FormPanel = (() => {
  let _mode = 'new'; // 'new' | 'edit'
  let _editId = null;

  const EQUIPOS = ['Artagaveytia','Botta','Cristancho','Greco','Piccaluga','Waldman','Waigel','Frojan','Romero'];
  const FAS = ['Artagaveytia','Botta','Cristancho','Dory','Erut','Greco','Nigra','Piccaluga','Romero','Waldman','Waigel','Zanino'];
  const TIPOS = [{ v:'AP', l:'AP — Agente Productor' },{ v:'REF', l:'REF — Referenciador' },{ v:'PE', l:'PE — Productor Exclusivo' },{ v:'AAGI', l:'AAGI — Institucional' }];
  const CONDICION_IVA = ['Responsable Inscripto','Monotributista','Exento','Consumidor Final'];
  const MONEDAS = ['Pesos','Dólares','USD'];
  const PORCENTAJES = ['40%','45%','45-50%','50%','50-70%','55%','60%','60-70%','62.50%','65%','70%','40-60%','15%','Otro'];

  function buildForm(c) {
    const today = new Date().toISOString().split('T')[0];
    return `
      <div class="form-section-title">Datos del productor</div>
      <div class="form-grid">
        <div class="form-group">
          <label>Nombre completo <span class="req">*</span></label>
          <input class="form-input" id="f-nombre" value="${c?.nombre||''}" placeholder="Nombre completo o razón social" required>
        </div>
        <div class="form-group">
          <label>CUIT <span class="req">*</span></label>
          <input class="form-input" id="f-cuit" value="${c?.cuit||''}" placeholder="20-12345678-9" required>
        </div>
        <div class="form-group">
          <label>Tipo de contrato <span class="req">*</span></label>
          <select class="form-select" id="f-tipo">
            ${TIPOS.map(t=>`<option value="${t.v}" ${c?.tipo===t.v?'selected':''}>${t.l}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Persona</label>
          <select class="form-select" id="f-persona">
            <option value="">Seleccioná</option>
            <option value="PH" ${c?.persona==='PH'?'selected':''}>Física (PH)</option>
            <option value="PJ" ${c?.persona==='PJ'?'selected':''}>Jurídica (PJ)</option>
          </select>
        </div>
        <div class="form-group">
          <label>Email</label>
          <input class="form-input" id="f-mail" type="email" value="${c?.mail||''}" placeholder="email@ejemplo.com">
        </div>
        <div class="form-group">
          <label>Condición IVA</label>
          <select class="form-select" id="f-iva">
            <option value="">Seleccioná</option>
            ${CONDICION_IVA.map(i=>`<option value="${i}" ${c?.condicionIVA===i?'selected':''}>${i}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Localidad</label>
          <input class="form-input" id="f-localidad" value="${c?.localidad||''}" placeholder="Ej: Buenos Aires">
        </div>
        <div class="form-group">
          <label>Fecha de alta <span class="req">*</span></label>
          <input class="form-input" id="f-fecha" type="date" value="${c?.fechaAltaContrato||today}" required>
        </div>
        <div class="form-group">
          <label>Matrícula CNV</label>
          <input class="form-input" id="f-matricula" value="${c?.matriculaCNV||''}" placeholder="Número de matrícula">
        </div>
        <div class="form-group">
          <label>N° Referencia</label>
          <input class="form-input" id="f-nroref" value="${c?.nroRef||''}" placeholder="Ej: PE 467">
        </div>
      </div>

      <div class="form-section-title">Datos comerciales</div>
      <div class="form-grid">
        <div class="form-group">
          <label>Equipo <span class="req">*</span></label>
          <select class="form-select" id="f-equipo">
            <option value="">Seleccioná</option>
            ${EQUIPOS.map(e=>`<option value="${e}" ${c?.equipo===e?'selected':''}>${e}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>FA asignado</label>
          <select class="form-select" id="f-fa">
            <option value="">Seleccioná</option>
            ${FAS.map(f=>`<option value="${f}" ${c?.fa===f?'selected':''}>${f}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Porcentaje</label>
          <select class="form-select" id="f-pct">
            <option value="">Seleccioná</option>
            ${PORCENTAJES.map(p=>`<option value="${p}" ${c?.porcentaje===p?'selected':''}>${p}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Moneda</label>
          <select class="form-select" id="f-moneda">
            <option value="">Seleccioná</option>
            ${MONEDAS.map(m=>`<option value="${m}" ${c?.moneda===m?'selected':''}>${m}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>CRM</label>
          <select class="form-select" id="f-crm">
            <option value="">Seleccioná</option>
            <option value="si" ${c?.crm==='si'?'selected':''}>Sí</option>
            <option value="IFA" ${c?.crm==='IFA'?'selected':''}>IFA</option>
            <option value="no" ${c?.crm==='no'?'selected':''}>No</option>
          </select>
        </div>
        <div class="form-group">
          <label>Incubadora</label>
          <select class="form-select" id="f-incubadora">
            <option value="" ${!c?.incubadora||c?.incubadora===''?'selected':''}>No</option>
            <option value="SI" ${(c?.incubadora||'').toUpperCase()==='SI'?'selected':''}>Sí</option>
          </select>
        </div>
        <div class="form-group full">
          <label>Observaciones</label>
          <textarea class="form-textarea" id="f-obs" placeholder="Observaciones relevantes...">${c?.observaciones||''}</textarea>
        </div>
      </div>
    `;
  }

  function openNew() {
    if (!App.isLoggedIn()) return;
    _mode = 'new';
    _editId = null;
    document.getElementById('form-panel-title').textContent = 'Nuevo contrato';
    document.getElementById('form-panel-sub').textContent = 'Completá los campos obligatorios (*)';
    document.getElementById('form-body-content').innerHTML = buildForm(null);
    document.getElementById('form-error').classList.remove('show');
    document.getElementById('form-overlay').classList.add('open');
  }

  function openEdit(id) {
    if (!App.isLoggedIn()) return;
    _mode = 'edit';
    _editId = id;
    const c = App.getContratoById(id);
    if (!c) return;
    document.getElementById('form-panel-title').textContent = 'Editar contrato';
    document.getElementById('form-panel-sub').textContent = c.nombre;
    document.getElementById('form-body-content').innerHTML = buildForm(c);
    document.getElementById('form-error').classList.remove('show');
    document.getElementById('form-overlay').classList.add('open');
  }

  function getFormData() {
    return {
      nombre: document.getElementById('f-nombre')?.value.trim() || '',
      cuit: document.getElementById('f-cuit')?.value.trim() || '',
      tipo: document.getElementById('f-tipo')?.value || '',
      subtipo: { AP:'Agente Productor', REF:'Referenciador', PE:'Productor Exclusivo', AAGI:'AAGI / Institucional' }[document.getElementById('f-tipo')?.value] || '',
      persona: document.getElementById('f-persona')?.value || '',
      mail: document.getElementById('f-mail')?.value.trim() || '',
      condicionIVA: document.getElementById('f-iva')?.value || '',
      localidad: document.getElementById('f-localidad')?.value.trim() || '',
      fechaAltaContrato: document.getElementById('f-fecha')?.value || '',
      matriculaCNV: document.getElementById('f-matricula')?.value.trim() || '',
      nroRef: document.getElementById('f-nroref')?.value.trim() || '',
      equipo: document.getElementById('f-equipo')?.value || '',
      fa: document.getElementById('f-fa')?.value || '',
      porcentaje: document.getElementById('f-pct')?.value || '',
      moneda: document.getElementById('f-moneda')?.value || '',
      crm: document.getElementById('f-crm')?.value || '',
      incubadora: document.getElementById('f-incubadora')?.value || '',
      observaciones: document.getElementById('f-obs')?.value.trim() || '',
      estado: 'Vigente',
    };
  }

  async function saveForm() {
    const data = getFormData();
    const errEl = document.getElementById('form-error');
    if (!data.nombre || !data.cuit || !data.tipo || !data.equipo || !data.fechaAltaContrato) {
      errEl.textContent = 'Completá los campos obligatorios: Nombre, CUIT, Tipo, Equipo y Fecha.';
      errEl.classList.add('show');
      return;
    }
    errEl.classList.remove('show');
    const btn = document.getElementById('form-save-btn');
    btn.disabled = true;
    btn.textContent = 'Guardando…';

    let ok;
    if (_mode === 'new') {
      ok = await App.addContrato(data);
    } else {
      ok = await App.updateContrato(_editId, data);
    }

    btn.disabled = false;
    btn.textContent = 'Guardar contrato';

    if (ok) {
      App.closeForm();
      document.dispatchEvent(new CustomEvent('app:navigate', { detail: { page: 'contratos' } }));
      Contratos.render();
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('form-save-btn')?.addEventListener('click', saveForm);
  });

  return { openNew, openEdit };
})();

/* ── Baja Modal ──────────────────────────────────────────── */
const BajaModal = (() => {
  let _bajaId = null;

  function open(id) {
    if (!App.isLoggedIn()) return;
    _bajaId = id;
    const c = App.getContratoById(id);
    if (!c) return;
    document.getElementById('baja-nombre').textContent = c.nombre;
    document.getElementById('baja-fecha').value = new Date().toISOString().split('T')[0];
    document.getElementById('baja-motivo').value = '';
    document.getElementById('baja-modal').classList.add('open');
  }

  async function confirm() {
    if (!_bajaId) return;
    const fecha  = document.getElementById('baja-fecha').value;
    const motivo = document.getElementById('baja-motivo').value.trim();
    if (!fecha) { alert('Ingresá la fecha de rescisión'); return; }
    const btn = document.getElementById('modal-confirm-btn');
    btn.disabled = true;
    btn.textContent = 'Procesando…';
    const ok = await App.bajaContrato(_bajaId, fecha, motivo);
    btn.disabled = false;
    btn.textContent = 'Confirmar baja';
    if (ok) {
      App.closeModal();
      App.closeDetail();
      Contratos.render();
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('modal-confirm-btn')?.addEventListener('click', confirm);
  });

  return { open };
})();

/* ── Adenda Panel ────────────────────────────────────────── */
const AdendaPanel = (() => {
  let _adendaId = null;

  function open(id) {
    if (!App.isLoggedIn()) return;
    _adendaId = id;
    const c = App.getContratoById(id);
    document.getElementById('adenda-nombre').textContent = c?.nombre || '';
    document.getElementById('adenda-modificacion').value = '';
    document.getElementById('adenda-fecha').value = new Date().toISOString().split('T')[0];
    document.getElementById('adenda-obs').value = '';
    document.getElementById('adenda-panel').classList.add('open');
  }

  async function save() {
    const mod   = document.getElementById('adenda-modificacion').value.trim();
    const fecha = document.getElementById('adenda-fecha').value;
    const obs   = document.getElementById('adenda-obs').value.trim();
    if (!mod || !fecha) { alert('Completá la modificación y la fecha'); return; }
    const btn = document.getElementById('adenda-save-btn');
    btn.disabled = true;
    btn.textContent = 'Guardando…';
    const ok = await App.addAdenda(_adendaId, { modificacion: mod, fecha, observaciones: obs });
    btn.disabled = false;
    btn.textContent = 'Guardar adenda';
    if (ok) {
      document.getElementById('adenda-panel').classList.remove('open');
      const c = App.getContratoById(_adendaId);
      if (c) document.dispatchEvent(new CustomEvent('app:detail', { detail: { contrato: c } }));
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('adenda-save-btn')?.addEventListener('click', save);
    document.getElementById('adenda-close')?.addEventListener('click', () => {
      document.getElementById('adenda-panel').classList.remove('open');
    });
  });

  return { open };
})();
