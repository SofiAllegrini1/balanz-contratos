/* =========================================================
   BALANZ Contract Intelligence Platform v2.2 — dashboard.js
   ========================================================= */

const Dashboard = (() => {

  function renderKPIs(stats) {
    const grid = document.getElementById('kpi-grid');
    const total = stats.ap + stats.ref + stats.pe + stats.aagi;

    const kpiData = [
      { label:'Ag. Productores', value:stats.ap,          icon:'users',    color:'blue',   key:'ap'          },
      { label:'Referenciadores', value:stats.ref,         icon:'share-2',  color:'violet', key:'ref'         },
      { label:'Prod. Exclusivos',value:stats.pe,          icon:'star',     color:'green',  key:'pe'          },
      { label:'AAGI',            value:stats.aagi,        icon:'building', color:'amber',  key:'aagi'        },
      { label:'Incubadoras',     value:stats.incubadoras, icon:'zap',      color:'orange', key:'incubadoras' },
      { label:'Con adendas',     value:stats.conAdendas,  icon:'edit-3',   color:'blue',   key:'conAdendas'  },
      { label:'Rescindidos',     value:stats.rescindidos, icon:'x-circle', color:'red',    key:'rescindidos' },
    ];

    grid.innerHTML = `
      <div class="kpi-card-total" onclick="KpiModal.open('vigentes')" title="Ver detalle">
        <div class="kpt-num">${total}</div>
        <div class="kpt-info">
          <div class="kpt-label">Contratos vigentes</div>
          <div class="kpt-chips">
            <span class="kpt-chip ap">${stats.ap} AP</span>
            <span class="kpt-chip ref">${stats.ref} REF</span>
            <span class="kpt-chip pe">${stats.pe} PE</span>
            <span class="kpt-chip aagi">${stats.aagi} AAGI</span>
          </div>
          <div class="kpt-note">No incluye rescindidos</div>
        </div>
      </div>
      ${kpiData.map(k => `
        <div class="kpi-card ${k.color}" onclick="KpiModal.open('${k.key}')" style="cursor:pointer" title="Clic para ver detalle">
          <div class="kpi-icon ${k.color}">${icon(k.icon)}</div>
          <div class="kpi-value">${k.value}</div>
          <div class="kpi-label">${k.label}</div>
        </div>
      `).join('')}
    `;
  }

  function renderAlertBanner(stats, alerts) {
    const pct = ((stats.vigentes / stats.total) * 100).toFixed(1);
    document.getElementById('alert-banner').innerHTML = `
      <div class="ab-icon">${icon('cpu')}</div>
      <div class="ab-text">Diagnóstico automático del portafolio</div>
      <div class="ab-divider"></div>
      <div class="ab-stat ok">
        <div class="ab-stat-num">${pct}%</div>
        <div class="ab-stat-lbl">vigentes</div>
      </div>
      <div class="ab-divider"></div>
      <div class="ab-stat warn">
        <div class="ab-stat-num">${alerts.sinCRM}</div>
        <div class="ab-stat-lbl">sin CRM</div>
      </div>
      <div class="ab-divider"></div>
      <div class="ab-stat info">
        <div class="ab-stat-num">${alerts.incubadoras}</div>
        <div class="ab-stat-lbl">incubación</div>
      </div>
    `;
  }

  function renderAlerts(alerts) {
    const strips = [
      { cls:'critical', count:alerts.incompletos, title:'Datos incompletos',  desc:'Sin mail o equipo asignado',      icon:'alert-triangle', filter:'incompletos' },
      { cls:'warning',  count:alerts.sinCRM,      title:'Sin CRM',            desc:'Contratos fuera del CRM',          icon:'database',       filter:'sinCRM'      },
      { cls:'caution',  count:alerts.incubadoras, title:'En incubadora',      desc:'Productores en incubación activa', icon:'zap',            filter:'incubadoras' },
      { cls:'info',     count:alerts.usd,         title:'En USD',             desc:'Seguimiento cambiario',            icon:'dollar-sign',    filter:'usd'         },
      { cls:'info',     count:alerts.conAdendas,  title:'Con adendas',        desc:'Modificaciones registradas',       icon:'edit-3',         filter:'adendas'     },
      { cls:'muted',    count:alerts.bajas,       title:'Rescindidos',        desc:'Historial de bajas',               icon:'archive',        filter:'bajas'       },
    ];
    document.getElementById('alert-strips').innerHTML = strips.map(s => `
      <div class="alert-strip ${s.cls}" onclick="Alertas.filterBy('${s.filter}');App.navigate('alertas');" style="cursor:pointer">
        <div class="alert-icon">${icon(s.icon)}</div>
        <div class="alert-info"><div class="alert-title">${s.title}</div><div class="alert-desc">${s.desc}</div></div>
        <div class="alert-count">${s.count}</div>
      </div>
    `).join('');
  }

  function renderCharts(stats) {
    // Tendencia altas vs bajas (últimos 6 meses)
    const now = new Date();
    const months = [];
    for (let i=5; i>=0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
      months.push({ label: d.toLocaleString('es-AR',{month:'short'}).replace('.',''), year: d.getFullYear(), month: d.getMonth(), altas:0, bajas:0 });
    }
    const allV = App.getContratos().filter(c=>c.estado==='Vigente'&&c.fechaAltaContrato);
    const allB = App.getContratos().filter(c=>c.estado==='Rescindido'&&c.fechaRescision);
    months.forEach(m => {
      m.altas = allV.filter(c=>{ try{const d=new Date(c.fechaAltaContrato);return d.getFullYear()===m.year&&d.getMonth()===m.month;}catch{return false;} }).length;
      m.bajas = allB.filter(c=>{ try{const d=new Date(c.fechaRescision);return d.getFullYear()===m.year&&d.getMonth()===m.month;}catch{return false;} }).length;
    });
    const maxV = Math.max(...months.map(m=>Math.max(m.altas,m.bajas)),1);
    const W=400, H=90, padL=28, padR=8;
    const stepX=(W-padL-padR)/(months.length-1);
    const ptsAltas = months.map((m,i)=>({x:padL+i*stepX, y:H-10-((m.altas/maxV)*(H-20))}));
    const ptsBajas = months.map((m,i)=>({x:padL+i*stepX, y:H-10-((m.bajas/maxV)*(H-20))}));
    const polyA = ptsAltas.map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const polyB = ptsBajas.map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const areaA = `M${ptsAltas[0].x.toFixed(1)},${ptsAltas[0].y.toFixed(1)} `+ptsAltas.slice(1).map(p=>`L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')+` L${ptsAltas[ptsAltas.length-1].x.toFixed(1)},${H} L${ptsAltas[0].x.toFixed(1)},${H} Z`;

    document.getElementById('chart-tendencia').innerHTML = `
      <svg viewBox="0 0 ${W} ${H+16}" xmlns="http://www.w3.org/2000/svg" style="width:100%;overflow:visible">
        <defs>
          <linearGradient id="ga22" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#22c55e" stop-opacity="0.12"/>
            <stop offset="100%" stop-color="#22c55e" stop-opacity="0.01"/>
          </linearGradient>
        </defs>
        <line x1="${padL}" y1="10" x2="${W-padR}" y2="10" stroke="var(--slate-200)" stroke-width="0.5"/>
        <line x1="${padL}" y1="${H/2}" x2="${W-padR}" y2="${H/2}" stroke="var(--slate-200)" stroke-width="0.5"/>
        <line x1="${padL}" y1="${H-10}" x2="${W-padR}" y2="${H-10}" stroke="var(--slate-200)" stroke-width="0.5"/>
        <path d="${areaA}" fill="url(#ga22)"/>
        <polyline points="${polyA}" fill="none" stroke="#22c55e" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
        <polyline points="${polyB}" fill="none" stroke="#ef4444" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" stroke-dasharray="4,2"/>
        ${ptsAltas.map((p,i)=>`<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${i===ptsAltas.length-1?4:2.5}" fill="${i===ptsAltas.length-1?'#22c55e':'white'}" stroke="#22c55e" stroke-width="1.5"/>`).join('')}
        ${months.map((m,i)=>`<text x="${ptsAltas[i].x.toFixed(1)}" y="${H+14}" text-anchor="middle" font-size="9" fill="${i===months.length-1?'#22c55e':'var(--slate-400)'}" font-weight="${i===months.length-1?'600':'400'}">${m.label}</text>`).join('')}
      </svg>
      <div style="display:flex;gap:14px;margin-top:6px">
        <div style="display:flex;align-items:center;gap:5px;font-size:0.72rem;color:var(--slate-500)"><div style="width:14px;height:2px;background:#22c55e;border-radius:1px"></div>Altas</div>
        <div style="display:flex;align-items:center;gap:5px;font-size:0.72rem;color:var(--slate-500)"><div style="width:14px;height:2px;background:#ef4444;border-radius:1px;opacity:.6"></div>Bajas</div>
      </div>
    `;

    // Equipos
    const equipos = Object.entries(stats.equipos).sort((a,b)=>b[1]-a[1]).slice(0,7);
    const maxEq = equipos[0]?.[1]||1;
    const eqColors = ['#2e78d8','#8b5cf6','#22c55e','#f59e0b','#f97316','#14b8a6','#64748b'];
    document.getElementById('chart-equipos').innerHTML = `<div class="bar-chart">${equipos.map(([name,val],i)=>`
      <div class="bar-item">
        <div class="bar-label" title="${name}">${name}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${(val/maxEq*100).toFixed(1)}%;background:${eqColors[i%eqColors.length]}"></div></div>
        <div class="bar-val">${val}</div>
      </div>`).join('')}</div>`;
  }

  function render() {
    const stats  = App.getStats();
    const alerts = App.getAlerts();
    renderKPIs(stats);
    renderAlertBanner(stats, alerts);
    renderAlerts(alerts);
    renderCharts(stats);
    ChangesPanel.updateBadge();
  }

  document.addEventListener('app:navigate', (e) => { if (e.detail.page==='dashboard') render(); });
  return { render };
})();

/* ── KPI Modal ───────────────────────────────────────────── */
const KpiModal = (() => {
  const CONFIG = {
    vigentes:    { title:'Contratos Vigentes',     icon:'check-circle', color:'var(--azure-400)',  filter: c => c.estado==='Vigente' },
    rescindidos: { title:'Contratos Rescindidos',  icon:'x-circle',     color:'var(--red-500)',    filter: c => c.estado==='Rescindido' },
    ap:          { title:'Agentes Productores',    icon:'users',        color:'var(--azure-400)',  filter: c => c.tipo==='AP'&&c.estado==='Vigente' },
    ref:         { title:'Referenciadores',        icon:'share-2',      color:'var(--violet-500)', filter: c => c.tipo==='REF'&&c.estado==='Vigente' },
    pe:          { title:'Productores Exclusivos', icon:'star',         color:'var(--green-500)',  filter: c => c.tipo==='PE'&&c.estado==='Vigente' },
    aagi:        { title:'AAGI / Institucional',   icon:'building',     color:'var(--amber-500)',  filter: c => c.tipo==='AAGI'&&c.estado==='Vigente' },
    incubadoras: { title:'Incubadoras Activas',    icon:'zap',          color:'var(--orange-500)', filter: c => (c.incubadora||'').toLowerCase()==='si' },
    conAdendas:  { title:'Con Adendas',            icon:'edit-3',       color:'var(--azure-400)',  filter: c => c.adendas&&c.adendas.length>0 },
  };

  function open(key) {
    const cfg = CONFIG[key]; if (!cfg) return;
    const items = App.getContratos().filter(cfg.filter);
    document.getElementById('kpi-modal-icon').style.color = cfg.color;
    document.getElementById('kpi-modal-icon').innerHTML = icon(cfg.icon);
    document.getElementById('kpi-modal-title').textContent = `${items.length} ${cfg.title}`;
    document.getElementById('kpi-modal').classList.add('open');
    document.querySelectorAll('.kpi-tab').forEach((t,i) => t.classList.toggle('active', i===0));
    renderTab('lista', items);
    document.querySelectorAll('.kpi-tab').forEach(tab => {
      tab.onclick = () => {
        document.querySelectorAll('.kpi-tab').forEach(t => t.classList.toggle('active', t.dataset.tab===tab.dataset.tab));
        renderTab(tab.dataset.tab, items);
      };
    });
  }

  function renderTab(tab, items) {
    const body = document.getElementById('kpi-modal-body');
    if (tab==='lista') {
      body.innerHTML = `<div style="font-size:0.72rem;color:var(--slate-500);margin-bottom:10px">${items.length} contratos</div>`+
        items.slice(0,40).map(c=>`<div onclick="App.closeKpiModal();App.selectContrato('${c.id}')" style="display:flex;align-items:center;gap:10px;padding:7px 9px;border-radius:8px;cursor:pointer;border-bottom:1px solid var(--slate-100)" onmouseover="this.style.background='var(--ice-25)'" onmouseout="this.style.background='transparent'">
          <div style="flex:1;min-width:0;font-size:0.83rem;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.nombre}</div>
          <span class="badge-tipo ${c.tipo}">${c.tipo}</span>
          <span style="font-size:0.72rem;color:var(--slate-400);flex-shrink:0">${c.equipo||''}</span>
        </div>`).join('')+
        (items.length>40?`<div style="text-align:center;font-size:0.75rem;color:var(--slate-400);padding:8px">y ${items.length-40} más…</div>`:'');
    } else if (tab==='equipo') {
      const eq={}; items.forEach(c=>{if(c.equipo)eq[c.equipo]=(eq[c.equipo]||0)+1;});
      const sorted=Object.entries(eq).sort((a,b)=>b[1]-a[1]); const max=sorted[0]?.[1]||1;
      const colors=['#2e78d8','#8b5cf6','#22c55e','#f59e0b','#f97316','#14b8a6','#64748b'];
      body.innerHTML=`<div class="bar-chart">${sorted.map(([n,v],i)=>`<div class="bar-item"><div class="bar-label" title="${n}">${n}</div><div class="bar-track"><div class="bar-fill" style="width:${(v/max*100).toFixed(1)}%;background:${colors[i%colors.length]}"></div></div><div class="bar-val">${v}</div><div style="font-size:0.68rem;color:var(--slate-400);width:32px;text-align:right;flex-shrink:0">${((v/items.length)*100).toFixed(0)}%</div></div>`).join('')}</div>`;
    } else if (tab==='tipo') {
      const tipos={AP:0,REF:0,PE:0,AAGI:0,Otro:0}; items.forEach(c=>{if(tipos[c.tipo]!==undefined)tipos[c.tipo]++;else tipos.Otro++;});
      const monedas={Pesos:0,'Dólares':0,Otro:0}; items.forEach(c=>{const m=(c.moneda||'').toLowerCase();if(m.includes('peso'))monedas.Pesos++;else if(m.includes('dol')||m==='usd')monedas['Dólares']++;else monedas.Otro++;});
      const tc={AP:'#2e78d8',REF:'#8b5cf6',PE:'#22c55e',AAGI:'#f59e0b',Otro:'#64748b'};
      body.innerHTML=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px"><div><div style="font-size:0.68rem;font-weight:700;color:var(--slate-400);letter-spacing:.08em;text-transform:uppercase;margin-bottom:10px">Por tipo</div>${Object.entries(tipos).filter(([,v])=>v>0).map(([k,v])=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--slate-100);font-size:0.82rem"><span style="display:flex;align-items:center;gap:7px"><span style="width:8px;height:8px;border-radius:2px;background:${tc[k]||'#64748b'};flex-shrink:0"></span>${k}</span><strong>${v}</strong></div>`).join('')}</div><div><div style="font-size:0.68rem;font-weight:700;color:var(--slate-400);letter-spacing:.08em;text-transform:uppercase;margin-bottom:10px">Por moneda</div>${Object.entries(monedas).filter(([,v])=>v>0).map(([k,v])=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--slate-100);font-size:0.82rem"><span>${k}</span><strong>${v}</strong></div>`).join('')}</div></div>`;
    } else if (tab==='evolucion') {
      const now=new Date(); const months=[];
      for(let i=11;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);months.push({label:d.toLocaleString('es-AR',{month:'short'}).replace('.',''),year:d.getFullYear(),month:d.getMonth(),count:0,bajas:0,cumulative:0});}
      const allV=App.getContratos().filter(c=>c.estado==='Vigente'&&c.fechaAltaContrato);
      let base=allV.filter(c=>{try{return new Date(c.fechaAltaContrato)<new Date(now.getFullYear(),now.getMonth()-11,1);}catch{return false;}}).length;
      months.forEach(m=>{m.count=allV.filter(c=>{try{const d=new Date(c.fechaAltaContrato);return d.getFullYear()===m.year&&d.getMonth()===m.month;}catch{return false;}}).length;base+=m.count;m.cumulative=base;});
      const allB=App.getContratos().filter(c=>c.estado==='Rescindido'&&c.fechaRescision);
      months.forEach(m=>{m.bajas=allB.filter(c=>{try{const d=new Date(c.fechaRescision);return d.getFullYear()===m.year&&d.getMonth()===m.month;}catch{return false;}}).length;});
      const tA=months.reduce((s,m)=>s+m.count,0),tB=months.reduce((s,m)=>s+m.bajas,0);
      const minC=Math.min(...months.map(m=>m.cumulative)),maxC=Math.max(...months.map(m=>m.cumulative)),range=maxC-minC||1;
      const H=100,W=420,pad=30,stepX=(W-pad*2)/(months.length-1);
      const pts=months.map((m,i)=>({x:pad+i*stepX,y:H-10-((m.cumulative-minC)/range)*(H-20),m}));
      const poly=pts.map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
      const area=`M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)} `+pts.slice(1).map(p=>`L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')+` L${pts[pts.length-1].x.toFixed(1)},${H} L${pts[0].x.toFixed(1)},${H} Z`;
      const last=pts[pts.length-1];
      body.innerHTML=`<div style="display:flex;gap:10px;margin-bottom:14px"><div style="background:var(--green-100);border-radius:9px;padding:8px 12px;flex:1;text-align:center"><div style="font-size:1.1rem;font-weight:700;color:#15803d">+${tA}</div><div style="font-size:0.7rem;color:#15803d">Altas 12m</div></div><div style="background:var(--red-100);border-radius:9px;padding:8px 12px;flex:1;text-align:center"><div style="font-size:1.1rem;font-weight:700;color:#b91c1c">-${tB}</div><div style="font-size:0.7rem;color:#b91c1c">Bajas 12m</div></div><div style="background:var(--ice-50);border-radius:9px;padding:8px 12px;flex:1;text-align:center"><div style="font-size:1.1rem;font-weight:700;color:var(--azure-500)">+${tA-tB}</div><div style="font-size:0.7rem;color:var(--azure-500)">Neto</div></div><div style="background:var(--slate-50);border-radius:9px;padding:8px 12px;flex:1;text-align:center"><div style="font-size:1.1rem;font-weight:700;color:var(--slate-800)">${last.m.cumulative}</div><div style="font-size:0.7rem;color:var(--slate-500)">Total actual</div></div></div><svg viewBox="0 0 ${W} ${H+20}" xmlns="http://www.w3.org/2000/svg" style="width:100%;overflow:visible"><defs><linearGradient id="lg22" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2e78d8" stop-opacity="0.15"/><stop offset="100%" stop-color="#2e78d8" stop-opacity="0.01"/></linearGradient></defs><path d="${area}" fill="url(#lg22)"/><polyline points="${poly}" fill="none" stroke="#2e78d8" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>${pts.map((p,i)=>`<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${i===pts.length-1?5:3}" fill="${i===pts.length-1?'#2e78d8':'white'}" stroke="#2e78d8" stroke-width="${i===pts.length-1?0:1.5}"/><text x="${p.x.toFixed(1)}" y="${H+14}" text-anchor="middle" font-size="8" fill="${i===pts.length-1?'#2e78d8':'var(--slate-400)'}" font-weight="${i===pts.length-1?600:400}">${p.m.label}</text>`).join('')}<rect x="${(last.x-18).toFixed(1)}" y="${(last.y-16).toFixed(1)}" width="36" height="13" rx="4" fill="#2e78d8"/><text x="${last.x.toFixed(1)}" y="${(last.y-6).toFixed(1)}" text-anchor="middle" font-size="8" fill="white" font-weight="600">${last.m.cumulative}</text></svg>`;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('kpi-modal')?.addEventListener('click', e=>{if(e.target===e.currentTarget)App.closeKpiModal();});
    document.getElementById('kpi-modal-close')?.addEventListener('click',()=>App.closeKpiModal());
    document.getElementById('kpi-modal-goto')?.addEventListener('click',()=>{App.closeKpiModal();App.navigate('contratos');});
  });
  return { open };
})();

/* ── Changes Panel ───────────────────────────────────────── */
const ChangesPanel = (() => {
  const TABS = ['Todos','Comisión','Equipo','Tipo'];

  function getChanges() {
    const now = new Date();
    const monthAgo = new Date(now.getFullYear(), now.getMonth()-1, now.getDate());
    const changes = [];
    App.getContratos().forEach(c => {
      (c.historial||[]).forEach(h => {
        try {
          const d = new Date(h.fecha);
          if (d >= monthAgo && (h.accion==='Modificación'||h.accion==='Adenda')) {
            const det = (h.detalle||'').toLowerCase();
            let tipo = null;
            if (det.includes('porcentaje')||det.includes('comisi')) tipo='pct';
            else if (det.includes('equipo')) tipo='eq';
            else if (det.includes('tipo')) tipo='tipo';
            else if (h.accion==='Adenda') tipo='pct';
            if (tipo) changes.push({ contrato:c, historial:h, tipo, fecha:d });
          }
        } catch {}
      });
    });
    return changes.sort((a,b)=>b.fecha-a.fecha);
  }

  function updateBadge() {
    const n = getChanges().length;
    const badge = document.getElementById('changes-badge');
    if (badge) badge.textContent = n;
    const btn = document.getElementById('changes-btn');
    if (btn) btn.style.display = n > 0 ? '' : 'none';
  }

  function open() {
    const changes = getChanges();
    document.getElementById('changes-sub').textContent = `${new Date().toLocaleString('es-AR',{month:'long',year:'numeric'})} · ${changes.length} modificaciones`;
    document.getElementById('changes-overlay').classList.add('open');
    renderChanges(changes, 'Todos');
    document.querySelectorAll('.ch-tab').forEach(tab => {
      tab.onclick = () => {
        document.querySelectorAll('.ch-tab').forEach(t=>t.classList.toggle('active',t.dataset.filter===tab.dataset.filter));
        renderChanges(changes, tab.dataset.filter);
      };
    });
  }

  function renderChanges(changes, filter) {
    const filtered = filter==='Todos' ? changes :
      filter==='Comisión' ? changes.filter(c=>c.tipo==='pct') :
      filter==='Equipo'   ? changes.filter(c=>c.tipo==='eq') :
      changes.filter(c=>c.tipo==='tipo');

    const typeLabel = {pct:'Comisión', eq:'Equipo', tipo:'Tipo contrato'};
    const body = document.getElementById('ch-body');

    if (!filtered.length) {
      body.innerHTML = `<div class="empty-state">${icon('edit-3')}<p>No hay cambios de este tipo en el último mes.</p></div>`;
      return;
    }

    body.innerHTML = filtered.map(({contrato:c, historial:h, tipo, fecha}) => `
      <div class="ch-item" onclick="ChangesPanel.close();App.selectContrato('${c.id}')" style="cursor:pointer">
        <div class="ch-dot ${tipo}"></div>
        <div class="ch-info">
          <div class="ch-nombre">${c.nombre}</div>
          <div class="ch-detalle">
            <span class="ch-field">${typeLabel[tipo]}</span>
            <span class="ch-old">${h.detalle?.match(/campos modificados: (.+)/i)?.[1]||h.detalle||'—'}</span>
          </div>
          <div class="ch-date">${fecha.toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit',year:'numeric'})} · ${h.usuario||'Sistema'}</div>
        </div>
      </div>
    `).join('');
  }

  function close() {
    document.getElementById('changes-overlay').classList.remove('open');
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('changes-overlay')?.addEventListener('click', e=>{if(e.target===e.currentTarget)close();});
    document.getElementById('changes-close')?.addEventListener('click', close);
  });

  return { open, close, updateBadge };
})();

/* ── Icon helper ─────────────────────────────────────────── */
function icon(name) {
  const icons = {
    'file-text':`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
    'check-circle':`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>`,
    'x-circle':`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    'users':`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    'share-2':`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`,
    'star':`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"/></svg>`,
    'building':`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22V12h6v10"/><path d="M8 7h.01"/><path d="M16 7h.01"/><path d="M8 11h.01"/><path d="M16 11h.01"/></svg>`,
    'zap':`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/></svg>`,
    'edit-3':`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`,
    'cpu':`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>`,
    'alert-triangle':`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    'database':`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`,
    'dollar-sign':`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
    'archive':`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="21,8 21,21 3,21 3,8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>`,
    'search':`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
    'chevron-left':`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15,18 9,12 15,6"/></svg>`,
    'chevron-right':`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9,18 15,12 9,6"/></svg>`,
    'history':`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1,4 1,10 7,10"/><path d="M3.51 15a9 9 0 1 0 .49-5"/></svg>`,
    'x':`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    'mail':`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
    'clipboard':`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>`,
    'external-link':`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
    'plus':`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    'filter':`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3"/></svg>`,
  };
  return icons[name]||`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>`;
}
