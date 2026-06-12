/* =========================================================
   BALANZ Contract Intelligence Platform v2.0 — app.js
   Core: data, navigation, GitHub sync, auth
   ========================================================= */

const GITHUB_CONFIG = {
  owner: 'SofiAllegrini1',
  repo: 'balanz-contratos',
  file: 'data/contratos.json',
  token: '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'
};

const AUTH_CONFIG = {
  users: [
    { user: 'sofi@balanz.com',    pass: 'Balanz2024!',  name: 'Sofía Allegrini' },
    { user: 'contratos@balanz.com', pass: 'Contratos2024!', name: 'Equipo Contratos' },
    { user: 'admin@balanz.com',   pass: 'Admin2024!',   name: 'Administrador' }
  ]
};

const App = (() => {
  let _contratos = [];
  let _currentPage = 'dashboard';
  let _currentUser = null;
  let _githubSHA = null;

  /* ── Auth ─────────────────────────────────────────────── */
  function login(user, pass) {
    const found = AUTH_CONFIG.users.find(u => u.user === user.trim().toLowerCase() && u.pass === pass);
    if (!found) return false;
    _currentUser = found;
    sessionStorage.setItem('balanz_user', JSON.stringify(found));
    return true;
  }

  function logout() {
    _currentUser = null;
    sessionStorage.removeItem('balanz_user');
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('edit-mode-badge').classList.remove('show');
    document.getElementById('edit-mode-indicator').classList.remove('show');
    document.getElementById('emi-username').textContent = '';
    document.querySelectorAll('.edit-only').forEach(el => el.style.display = 'none');
  }

  function checkSession() {
    const saved = sessionStorage.getItem('balanz_user');
    if (saved) {
      _currentUser = JSON.parse(saved);
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
    try {
      const res = await fetch('data/contratos.json?t=' + Date.now());
      _contratos = await res.json();
    } catch (e) {
      console.error('Error loading data:', e);
      _contratos = [];
    }
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

  /* ── GitHub Sync ──────────────────────────────────────── */
  async function getFileSHA() {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.file}`,
        { headers: { Authorization: `token ${GITHUB_CONFIG.token}`, Accept: 'application/vnd.github.v3+json' } }
      );
      const data = await res.json();
      _githubSHA = data.sha;
      return data.sha;
    } catch (e) { console.error('Error getting SHA:', e); return null; }
  }

  async function saveToGitHub() {
    showToast('Guardando en GitHub…', 'loading');
    try {
      const sha = _githubSHA || await getFileSHA();
      const content = btoa(unescape(encodeURIComponent(JSON.stringify(_contratos, null, 2))));
      const res = await fetch(
        `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.file}`,
        {
          method: 'PUT',
          headers: { Authorization: `token ${GITHUB_CONFIG.token}`, Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: `update: contratos via platform - ${new Date().toISOString()}`, content, sha })
        }
      );
      if (res.ok) {
        const data = await res.json();
        _githubSHA = data.content.sha;
        showToast('✓ Guardado correctamente', 'success');
        return true;
      } else {
        const err = await res.json();
        showToast('Error al guardar: ' + (err.message||''), 'error');
        return false;
      }
    } catch (e) {
      showToast('Error de conexión', 'error');
      return false;
    }
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
    const ok = await saveToGitHub();
    return ok ? newC : null;
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
    return await saveToGitHub();
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
    return await saveToGitHub();
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
    return await saveToGitHub();
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
    await loadData();
    await getFileSHA();

    // Check session
    const hasSession = checkSession();

    // Login form
    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const user = document.getElementById('login-user').value;
      const pass = document.getElementById('login-pass').value;
      const err  = document.getElementById('login-error');
      if (login(user, pass)) {
        document.getElementById('login-screen').style.display = 'none';
        enableEditMode();
        err.classList.remove('show');
      } else {
        err.classList.add('show');
        err.textContent = 'Usuario o contraseña incorrectos.';
      }
    });

    // Logout
    document.getElementById('emi-logout').addEventListener('click', logout);

    if (hasSession) {
      document.getElementById('login-screen').style.display = 'none';
      enableEditMode();
    }

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

    navigate('dashboard');

    setTimeout(() => {
      const loader = document.getElementById('loading-overlay');
      if (loader) { loader.classList.add('fade-out'); setTimeout(() => loader.remove(), 500); }
    }, 1400);
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
