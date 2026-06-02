/* =========================================================
   BALANZ Contract Intelligence Platform — app.js
   Core: data loading, navigation, global state
   ========================================================= */

const App = (() => {
  let _contratos = [];
  let _currentPage = 'dashboard';
  let _selectedContrato = null;

  /* ── Data ─────────────────────────────────────────────── */
  async function loadData() {
    try {
      const res = await fetch('data/contratos.json');
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
    const all       = _contratos;
    const vigentes  = all.filter(c => c.estado === 'Vigente');
    const rescindidos = all.filter(c => c.estado === 'Rescindido');
    const ap        = vigentes.filter(c => c.tipo === 'AP');
    const ref       = vigentes.filter(c => c.tipo === 'REF');
    const pe        = vigentes.filter(c => c.tipo === 'PE');
    const aagi      = vigentes.filter(c => c.tipo === 'AAGI');
    const incubadoras = vigentes.filter(c =>
      (c.incubadora || '').toString().toUpperCase() === 'SI' ||
      (c.incubadora || '').toString().toLowerCase() === 'si'
    );
    const sinCRM = vigentes.filter(c =>
      !c.crm || c.crm.trim() === '' || c.crm.toLowerCase() === 'no'
    );
    const conAdendas = vigentes.filter(c => c.adendas && c.adendas.length > 0);

    // Equipos
    const equipos = {};
    vigentes.forEach(c => {
      if (c.equipo) {
        equipos[c.equipo] = (equipos[c.equipo] || 0) + 1;
      }
    });

    // Localidades
    const localidades = {};
    vigentes.forEach(c => {
      if (c.localidad) {
        const loc = c.localidad.trim();
        localidades[loc] = (localidades[loc] || 0) + 1;
      }
    });

    // Monedas
    const pesos = vigentes.filter(c => (c.moneda||'').toLowerCase().includes('peso') || (c.moneda||'').toLowerCase().includes('peso'));
    const dolares = vigentes.filter(c => (c.moneda||'').toLowerCase().includes('dol') || (c.moneda||'').toLowerCase().includes('dól') || (c.moneda||'').toLowerCase() === 'usd');

    return {
      total: all.length,
      vigentes: vigentes.length,
      rescindidos: rescindidos.length,
      ap: ap.length,
      ref: ref.length,
      pe: pe.length,
      aagi: aagi.length,
      incubadoras: incubadoras.length,
      sinCRM: sinCRM.length,
      conAdendas: conAdendas.length,
      equipos,
      localidades,
      pesos: pesos.length,
      dolares: dolares.length,
    };
  }

  function getAlerts() {
    const vigentes = _contratos.filter(c => c.estado === 'Vigente');
    const today = new Date();

    // Bajas recientes (rescindidos en los últimos 12 meses)
    const bajas = _contratos.filter(c => c.estado === 'Rescindido');

    // Incubadoras activas
    const incubadoras = vigentes.filter(c =>
      (c.incubadora||'').toString().toLowerCase() === 'si'
    );

    // Sin CRM configurado
    const sinCRM = vigentes.filter(c =>
      !c.crm || c.crm.trim() === '' || c.crm.toLowerCase() === 'no tiene equipo'
    );

    // Con adendas recientes
    const conAdendas = vigentes.filter(c => c.adendas && c.adendas.length > 0);

    // Moneda USD (requieren atención cambiaria)
    const usd = vigentes.filter(c =>
      (c.moneda||'').toLowerCase().includes('dol') ||
      (c.moneda||'').toLowerCase().includes('dól') ||
      (c.moneda||'').toLowerCase() === 'usd'
    );

    // Datos incompletos (sin mail o sin equipo)
    const incompletos = vigentes.filter(c => !c.mail || !c.equipo);

    // CUIT con posibles errores (espacios)
    const cuitErrors = vigentes.filter(c =>
      c.cuit && c.cuit.toString().includes(' ')
    );

    // AP con porcentaje no normalizado
    const pctAnomaly = vigentes.filter(c =>
      c.tipo === 'AP' && c.porcentaje && c.porcentaje.toString().includes('%%')
    );

    return {
      bajas: bajas.length,
      incubadoras: incubadoras.length,
      sinCRM: sinCRM.length,
      conAdendas: conAdendas.length,
      usd: usd.length,
      incompletos: incompletos.length,
      cuitErrors: cuitErrors.length,
      items: { bajas, incubadoras, sinCRM, conAdendas, usd, incompletos }
    };
  }

  /* ── Navigation ───────────────────────────────────────── */
  function navigate(page) {
    _currentPage = page;
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
    });
    document.querySelectorAll('.page').forEach(el => {
      el.classList.toggle('active', el.id === `page-${page}`);
    });
    // Update topbar title
    const titles = {
      dashboard:    { t: 'Dashboard Ejecutivo', s: 'Visión general de todos los contratos' },
      contratos:    { t: 'Contratos', s: 'Base de datos completa' },
      alertas:      { t: 'Centro de Alertas', s: 'Contratos que requieren atención' },
      renovaciones: { t: 'Centro de Renovaciones', s: 'Seguimiento de renovaciones y adendas' },
      equipos:      { t: 'Equipos & Distribución', s: 'Análisis por equipo y región' },
      busqueda:     { t: 'Búsqueda Global', s: 'Búsqueda avanzada en todos los registros' },
    };
    const info = titles[page] || { t: page, s: '' };
    document.getElementById('topbar-title').textContent = info.t;
    document.getElementById('topbar-subtitle').textContent = info.s;

    // Render page
    const event = new CustomEvent('app:navigate', { detail: { page } });
    document.dispatchEvent(event);
  }

  /* ── Selected Contrato ────────────────────────────────── */
  function selectContrato(id) {
    _selectedContrato = getContratoById(id);
    document.dispatchEvent(new CustomEvent('app:detail', { detail: { contrato: _selectedContrato } }));
  }

  /* ── Search ───────────────────────────────────────────── */
  function search(query) {
    if (!query || query.trim() === '') return [];
    const q = query.toLowerCase().trim();
    return _contratos.filter(c => {
      return (
        (c.nombre||'').toLowerCase().includes(q) ||
        (c.id||'').toLowerCase().includes(q) ||
        (c.cuit||'').toString().includes(q) ||
        (c.nroRef||'').toLowerCase().includes(q) ||
        (c.equipo||'').toLowerCase().includes(q) ||
        (c.fa||'').toLowerCase().includes(q) ||
        (c.localidad||'').toLowerCase().includes(q) ||
        (c.tipo||'').toLowerCase().includes(q) ||
        (c.mail||'').toLowerCase().includes(q) ||
        (c.observaciones||'').toLowerCase().includes(q)
      );
    }).slice(0, 50);
  }

  /* ── Init ─────────────────────────────────────────────── */
  async function init() {
    await loadData();

    // Setup nav clicks
    document.querySelectorAll('.nav-item[data-page]').forEach(el => {
      el.addEventListener('click', () => navigate(el.dataset.page));
    });

    // Global search in topbar
    const globalInput = document.getElementById('global-search-input');
    if (globalInput) {
      globalInput.addEventListener('input', (e) => {
        const q = e.target.value;
        if (q.length >= 2) {
          navigate('busqueda');
          document.dispatchEvent(new CustomEvent('app:search', { detail: { query: q } }));
        }
      });
    }

    // Detail overlay close
    document.getElementById('detail-overlay')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeDetail();
    });
    document.getElementById('detail-close')?.addEventListener('click', closeDetail);

    // Initial page
    navigate('dashboard');

    // Hide loading
    setTimeout(() => {
      const loader = document.getElementById('loading-overlay');
      if (loader) {
        loader.classList.add('fade-out');
        setTimeout(() => loader.remove(), 500);
      }
    }, 1400);
  }

  function closeDetail() {
    document.getElementById('detail-overlay').classList.remove('open');
  }

  return { init, getContratos, getContratoById, getStats, getAlerts, navigate, selectContrato, search, closeDetail };
})();
