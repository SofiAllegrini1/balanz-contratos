/* =========================================================
   BALANZ Contract Intelligence Platform v2.0 — app.js
   Core: data, navigation, GitHub sync, auth
   ========================================================= */

/* Supabase: datos privados + login real. La anon/publishable key es segura
   en el navegador; el acceso lo controla Row Level Security (solo logueados). */
const SUPABASE_URL = 'https://ilyggrkdhflnlrsmyttx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_1NKQD8q40atYxGih7-Fq5Q_hZyQXwD1';
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const App = (() => {
  let _contratos = [];
  let _currentPage = 'dashboard';
  let _currentUser = null;
  let _githubSHA = null;

  /* ── Auth ─────────────────────────────────────────────── */
  async function login(email, pass) {
    const { data, error } = await sb.auth.signInWithPassword({
      email: (email || '').trim().toLowerCase(),
      password: pass
    });
    if (error || !data?.user) return false;
    _currentUser = { name: data.user.email, email: data.user.email };
    return true;
  }

  async function logout() {
    await sb.auth.signOut();
    _currentUser = null;
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('edit-mode-badge').classList.remove('show');
    document.getElementById('edit-mode-indicator').classList.remove('show');
    document.getElementById('emi-username').textContent = '';
    document.querySelectorAll('.edit-only').forEach(el => el.style.display = 'none');
  }

  async function checkSession() {
    const { data } = await sb.auth.getSession();
    if (data?.session?.user) {
      _currentUser = { name: data.session.user.email, email: data.session.user.email };
      return true;
    }
    return false;
  }

  function isLoggedIn() { return !!_currentUser; }
  function getCurrentUser() { return _currentUser; }

  function enableEditMode() {
    document.getElementById('edit-mode-badge').classList.add('show');
    document.getElementById('edit-mode-indicator').classList.add('show');
    document.getElementById('emi-username').textContent = _currentUser.name;
    document.querySelectorAll('.edit-only').forEach(el => el.style.display = '');
  }

  /* ── Data ─────────────────────────────────────────────── */
  async function loadData() {
    const { data, error } = await sb.from('contratos').select('data').order('id');
    if (error) {
      console.error('Error loading data:', error);
      _contratos = [];
      return;
    }
    _contratos = (data || []).map(r => r.data);
  }

  function getContratos() { return _contratos; }

  function getContratoById(id) {
    return _contratos.find(c => c.id === id);
  }

  function getStats() {
    const all = _contratos;
    const vigentes = all.filter(c => c.estado === 'Vigente');
    const rescindidos = all.filter(c => c.estado === 'Rescindido');
    const ap   = vigentes.filter(c => c.tipo === 'AP');
    const ref  = vigentes.filter(c => c.tipo === 'REF');
    const pe   = vigentes.filter(c => c.tipo === 'PE');
    const aagi = vigentes.filter(c => c.tipo === 'AAGI');
    const incubadoras = vigentes.filter(c => (c.incubadora||'').toLowerCase() === 'si');
    const equipos = {}, localidades = {};
    vigentes.forEach(c => {
      if (c.equipo) equipos[c.equipo] = (equipos[c.equipo]||0) + 1;
      if (c.localidad) localidades[c.localidad.trim()] = (localidades[c.localidad.trim()]||0) + 1;
    });
    const pesos = vigentes.filter(c => (c.moneda||'').toLowerCase().includes('peso'));
    const dolares = vigentes.filter(c => (c.moneda||'').toLowerCase().includes('dol') || (c.moneda||'').toLowerCase().includes('dól') || (c.moneda||'').toLowerCase() === 'usd');
    return { total:all.length, vigentes:vigentes.length, rescindidos:rescindidos.length, ap:ap.length, ref:ref.length, pe:pe.length, aagi:aagi.length, incubadoras:incubadoras.length, equipos, localidades, pesos:pesos.length, dolares:dolares.length, conAdendas: vigentes.filter(c => c.adendas&&c.adendas.length>0).length };
  }

  function getAlerts() {
    const vigentes = _contratos.filter(c => c.estado === 'Vigente');
    return {
      incompletos: vigentes.filter(c => !c.mail || !c.equipo).length,
      sinCRM: vigentes.filter(c => !c.crm || c.crm.trim()==='' || c.crm.toLowerCase()==='no tiene equipo').length,
      cuitErrors: vigentes.filter(c => c.cuit && c.cuit.toString().includes(' ')).length,
      incubadoras: vigentes.filter(c => (c.incubadora||'').toLowerCase()==='si').length,
      usd: vigentes.filter(c => (c.moneda||'').toLowerCase().includes('dol')||(c.moneda||'').toLowerCase().includes('dól')||(c.moneda||'').toLowerCase()==='usd').length,
      conAdendas: vigentes.filter(c => c.adendas&&c.adendas.length>0).length,
      bajas: _contratos.filter(c => c.estado==='Rescindido').length,
      items: {
        incompletos: vigentes.filter(c => !c.mail || !c.equipo),
        sinCRM: vigentes.filter(c => !c.crm || c.crm.trim()===''),
        incubadoras: vigentes.filter(c => (c.incubadora||'').toLowerCase()==='si'),
        usd: vigentes.filter(c => (c.moneda||'').toLowerCase().includes('dol')),
        conAdendas: vigentes.filter(c => c.adendas&&c.adendas.length>0),
        bajas: _contratos.filter(c => c.estado==='Rescindido'),
      }
    };
  }

  /* ── Supabase Sync ────────────────────────────────────── */
  async function saveContrato(c) {
    showToast('Guardando…', 'loading');
    const { error } = await sb.from('contratos').upsert({
      id: c.id,
      data: c,
      updated_at: new Date().toISOString()
    });
    if (error) {
      showToast('Error al guardar: ' + (error.message || ''), 'error');
      return false;
    }
    showToast('✓ Guardado correctamente', 'success');
    return true;
  }

  /* ── CRUD ─────────────────────────────────────────────── */
  function generateId(tipo) {
    const prefix = tipo.toUpperCase();
    const existing = _contratos.filter(c => c.tipo === tipo).length;
    return `${prefix}-${String(existing + 100).padStart(4, '0')}`;
  }

  async function addContrato(data) {
    const now = new Date().toISOString();
    const newC = {
      id: generateId(data.tipo),
      ...data,
      adendas: [],
      historial: [{ accion: 'Alta', fecha: now, usuario: _currentUser.name, detalle: 'Contrato creado desde la plataforma' }]
    };
    _contratos.unshift(newC);
    const ok = await saveContrato(newC);
    if (!ok) { _contratos.shift(); return null; }
    return newC;
  }

  async function updateContrato(id, changes) {
    const idx = _contratos.findIndex(c => c.id === id);
    if (idx === -1) return false;
    const now = new Date().toISOString();
    const campos = Object.keys(changes).filter(k => _contratos[idx][k] !== changes[k]);
    if (!_contratos[idx].historial) _contratos[idx].historial = [];
    _contratos[idx].historial.unshift({
      accion: 'Modificación',
      fecha: now,
      usuario: _currentUser.name,
      detalle: `Campos modificados: ${campos.join(', ')}`
    });
    _contratos[idx] = { ..._contratos[idx], ...changes };
    return await saveContrato(_contratos[idx]);
  }

  async function bajaContrato(id, fechaRescision, motivo) {
    const idx = _contratos.findIndex(c => c.id === id);
    if (idx === -1) return false;
    const now = new Date().toISOString();
    if (!_contratos[idx].historial) _contratos[idx].historial = [];
    _contratos[idx].historial.unshift({
      accion: 'Rescisión',
      fecha: now,
      usuario: _currentUser.name,
      detalle: `Motivo: ${motivo || 'No especificado'}`
    });
    _contratos[idx].estado = 'Rescindido';
    _contratos[idx].fechaRescision = fechaRescision;
    _contratos[idx].motivoBaja = motivo;
    return await saveContrato(_contratos[idx]);
  }

  async function addAdenda(id, adendaData) {
    const idx = _contratos.findIndex(c => c.id === id);
    if (idx === -1) return false;
    if (!_contratos[idx].adendas) _contratos[idx].adendas = [];
    if (!_contratos[idx].historial) _contratos[idx].historial = [];
    const now = new Date().toISOString();
    _contratos[idx].adendas.unshift({ ...adendaData, fechaCarga: now });
    _contratos[idx].historial.unshift({
      accion: 'Adenda',
      fecha: now,
      usuario: _currentUser.name,
      detalle: `Nueva adenda: ${adendaData.modificacion}`
    });
    return await saveContrato(_contratos[idx]);
  }

  /* ── Toast ────────────────────────────────────────────── */
  function showToast(msg, type = 'loading') {
    const toast = document.getElementById('saving-toast');
    toast.className = 'saving-toast show' + (type !== 'loading' ? ' ' + type : '');
    toast.innerHTML = type === 'loading'
      ? `<div class="saving-spinner"></div><span>${msg}</span>`
      : `<span>${msg}</span>`;
    if (type !== 'loading') setTimeout(() => toast.classList.remove('show'), 3000);
  }

  /* ── Navigation ───────────────────────────────────────── */
  function navigate(page) {
    _currentPage = page;
    document.querySelectorAll('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.page === page));
    document.querySelectorAll('.page').forEach(el => el.classList.toggle('active', el.id === `page-${page}`));
    const titles = {
      dashboard:    { t: 'Dashboard Ejecutivo', s: 'Visión general de todos los contratos' },
      contratos:    { t: 'Contratos', s: 'Base de datos completa' },
      alertas:      { t: 'Centro de Alertas', s: 'Contratos que requieren atención' },
      renovaciones: { t: 'Adendas y Renovaciones', s: 'Historial de modificaciones' },
      equipos:      { t: 'Equipos & Distribución', s: 'Análisis por equipo y región' },
      busqueda:     { t: 'Búsqueda Global', s: 'Buscar en todos los registros' },
    };
    const info = titles[page] || { t: page, s: '' };
    document.getElementById('topbar-title').textContent = info.t;
    document.getElementById('topbar-subtitle').textContent = info.s;
    document.dispatchEvent(new CustomEvent('app:navigate', { detail: { page } }));
  }

  function selectContrato(id) {
    const c = getContratoById(id);
    if (c) document.dispatchEvent(new CustomEvent('app:detail', { detail: { contrato: c } }));
  }

  function search(query) {
    if (!query || query.trim() === '') return [];
    const q = query.toLowerCase().trim();
    return _contratos.filter(c =>
      (c.nombre||'').toLowerCase().includes(q) ||
      (c.id||'').toLowerCase().includes(q) ||
      (c.cuit||'').toString().includes(q) ||
      (c.nroRef||'').toLowerCase().includes(q) ||
      (c.equipo||'').toLowerCase().includes(q) ||
      (c.fa||'').toLowerCase().includes(q) ||
      (c.localidad||'').toLowerCase().includes(q) ||
      (c.mail||'').toLowerCase().includes(q)
    ).slice(0, 50);
  }

  function closeDetail() { document.getElementById('detail-overlay').classList.remove('open'); }
  function closeForm()   { document.getElementById('form-overlay').classList.remove('open'); }
  function closeModal()  { document.getElementById('baja-modal').classList.remove('open'); }

  /* ── Init ─────────────────────────────────────────────── */
  async function init() {
    // Login form (única forma de acceder: la app requiere estar logueado)
    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const user = document.getElementById('login-user').value;
      const pass = document.getElementById('login-pass').value;
      const err  = document.getElementById('login-error');
      const btn  = e.target.querySelector('button[type=submit]');
      if (btn) btn.disabled = true;
      const ok = await login(user, pass);
      if (btn) btn.disabled = false;
      if (ok) {
        err.classList.remove('show');
        await startApp();
      } else {
        err.classList.add('show');
        err.textContent = 'Usuario o contraseña incorrectos.';
      }
    });

    // Logout
    document.getElementById('emi-logout').addEventListener('click', logout);

    // Nav
    document.querySelectorAll('.nav-item[data-page]').forEach(el => {
      el.addEventListener('click', () => navigate(el.dataset.page));
    });

    // Global search
    document.getElementById('global-search-input')?.addEventListener('input', (e) => {
      if (e.target.value.length >= 2) {
        navigate('busqueda');
        document.dispatchEvent(new CustomEvent('app:search', { detail: { query: e.target.value } }));
      }
    });

    // Close panels
    document.getElementById('detail-overlay')?.addEventListener('click', (e) => { if (e.target===e.currentTarget) closeDetail(); });
    document.getElementById('detail-close')?.addEventListener('click', closeDetail);
    document.getElementById('form-overlay')?.addEventListener('click', (e) => { if (e.target===e.currentTarget) closeForm(); });
    document.getElementById('form-close')?.addEventListener('click', closeForm);
    document.getElementById('baja-modal')?.addEventListener('click', (e) => { if (e.target===e.currentTarget) closeModal(); });
    document.getElementById('modal-cancel')?.addEventListener('click', closeModal);

    // New contract button
    document.getElementById('btn-new-contrato')?.addEventListener('click', () => FormPanel.openNew());

    // Topbar date
    document.getElementById('topbar-date').textContent = new Date().toLocaleDateString('es-AR', {weekday:'short',day:'2-digit',month:'short',year:'numeric'});

    // Si ya hay sesión activa entra directo; si no, muestra el login.
    if (await checkSession()) {
      await startApp();
    } else {
      document.getElementById('login-screen').style.display = 'flex';
      hideLoader();
    }
  }

  // Carga datos y muestra la app (solo tras autenticarse)
  async function startApp() {
    document.getElementById('login-screen').style.display = 'none';
    await loadData();
    enableEditMode();
    navigate('dashboard');
    hideLoader();
  }

  function hideLoader() {
    setTimeout(() => {
      const loader = document.getElementById('loading-overlay');
      if (loader) { loader.classList.add('fade-out'); setTimeout(() => loader.remove(), 500); }
    }, 600);
  }

  return {
    init, getContratos, getContratoById, getStats, getAlerts,
    navigate, selectContrato, search,
    closeDetail, closeForm, closeModal,
    addContrato, updateContrato, bajaContrato, addAdenda,
    isLoggedIn, getCurrentUser, showToast
  };
})();

// Additional v2.1 methods added to App
const _AppExt = {
  closeKpiModal() {
    document.getElementById('kpi-modal')?.classList.remove('open');
  }
};
Object.assign(App, _AppExt);
