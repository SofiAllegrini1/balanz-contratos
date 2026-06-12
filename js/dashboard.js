/* =========================================================
   BALANZ Contract Intelligence Platform v2.1 — dashboard.js
   Interactive KPIs with modal, tabs, line chart
   ========================================================= */

const Dashboard = (() => {

  function renderKPIs(stats) {
    const kpiData = [
      { label:"Contratos Totales",   value:stats.total,       icon:"file-text",   color:"blue",   key:"total"       },
      { label:"Vigentes",            value:stats.vigentes,    icon:"check-circle",color:"green",  key:"vigentes"    },
      { label:"Rescindidos",         value:stats.rescindidos, icon:"x-circle",    color:"red",    key:"rescindidos" },
      { label:"Ag. Productores",     value:stats.ap,          icon:"users",       color:"blue",   key:"ap"          },
      { label:"Referenciadores",     value:stats.ref,         icon:"share-2",     color:"violet", key:"ref"         },
      { label:"Prod. Exclusivos",    value:stats.pe,          icon:"star",        color:"green",  key:"pe"          },
      { label:"AAGI / Institucional",value:stats.aagi,        icon:"building",    color:"amber",  key:"aagi"        },
      { label:"Incubadoras Activas", value:stats.incubadoras, icon:"zap",         color:"orange", key:"incubadoras" },
    ];
    const grid = document.getElementById("kpi-grid");
    grid.innerHTML = kpiData.map(k => `
      <div class="kpi-card ${k.color}" onclick="KpiModal.open('${k.key}')" style="cursor:pointer" title="Clic para ver detalle">
        <div class="kpi-icon ${k.color}">${icon(k.icon)}</div>
        <div class="kpi-value">${k.value.toLocaleString()}</div>
        <div class="kpi-label">${k.label}</div>
        <div style="position:absolute;bottom:10px;right:10px;opacity:0.35;transition:opacity 200ms" class="kpi-exp">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px;color:var(--azure-400)"><polyline points="15,3 21,3 21,9"/><polyline points="9,21 3,21 3,15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
        </div>
      </div>
    `).join("");
    grid.querySelectorAll(".kpi-card").forEach(card => {
      card.addEventListener("mouseenter", () => { card.querySelector(".kpi-exp").style.opacity = "1"; });
      card.addEventListener("mouseleave", () => { card.querySelector(".kpi-exp").style.opacity = "0.35"; });
    });
  }

  function renderInsights(stats, alerts) {
    const issues = [];
    if (alerts.incompletos > 0) issues.push(`<span class="insight-tag red">${alerts.incompletos} datos incompletos</span>`);
    if (alerts.sinCRM > 0) issues.push(`<span class="insight-tag amber">${alerts.sinCRM} sin CRM</span>`);
    if (stats.incubadoras > 0) issues.push(`<span class="insight-tag blue">${stats.incubadoras} en incubación</span>`);
    if (stats.conAdendas > 0) issues.push(`<span class="insight-tag green">${stats.conAdendas} con adendas</span>`);
    const pct = ((stats.vigentes / stats.total) * 100).toFixed(1);
    document.getElementById("insights-banner").innerHTML = `
      <div class="insights-icon">${icon("cpu")}</div>
      <div class="insights-content">
        <div class="insights-title">Inteligencia Automática — Estado actual de la cartera</div>
        <div class="insights-text">El ${pct}% del portafolio (${stats.vigentes} contratos) se encuentra vigente. Distribución: ${stats.ap} APs · ${stats.ref} REFs · ${stats.pe} Productores Exclusivos · ${stats.aagi} AAGIs. Contratos en pesos: ${stats.pesos} · En dólares: ${stats.dolares}.</div>
        <div class="insights-tags">${issues.join("")}</div>
      </div>
    `;
  }

  function renderAlerts(alerts) {
    const strips = [
      { cls:"critical", count:alerts.incompletos, title:"Datos incompletos",    desc:"Sin mail o equipo asignado",         icon:"alert-triangle", filter:"incompletos" },
      { cls:"warning",  count:alerts.sinCRM,      title:"Sin CRM configurado", desc:"Contratos fuera del CRM",             icon:"database",       filter:"sinCRM"      },
      { cls:"caution",  count:alerts.incubadoras, title:"En incubadora",       desc:"Productores en incubación activa",    icon:"zap",            filter:"incubadoras" },
      { cls:"info",     count:alerts.usd,         title:"Contratos en USD",    desc:"Requieren seguimiento cambiario",     icon:"dollar-sign",    filter:"usd"         },
      { cls:"info",     count:alerts.conAdendas,  title:"Con adendas",         desc:"Modificaciones registradas",          icon:"edit-3",         filter:"adendas"     },
      { cls:"muted",    count:alerts.bajas,       title:"Rescindidos",         desc:"Historial de bajas",                  icon:"archive",        filter:"bajas"       },
    ];
    document.getElementById("alert-strips").innerHTML = strips.map(s => `
      <div class="alert-strip ${s.cls}" onclick="Alertas.filterBy('${s.filter}'); App.navigate('alertas');" style="cursor:pointer">
        <div class="alert-icon">${icon(s.icon)}</div>
        <div class="alert-info"><div class="alert-title">${s.title}</div><div class="alert-desc">${s.desc}</div></div>
        <div class="alert-count">${s.count}</div>
      </div>
    `).join("");
  }

  function renderCharts(stats) {
    const equipos = Object.entries(stats.equipos).sort((a,b)=>b[1]-a[1]).slice(0,8);
    const maxEq = equipos[0]?.[1] || 1;
    const eqColors = ["#2e78d8","#4d9df5","#1a407e","#3b82f6","#60a5fa","#93c5fd","#1d5fbd","#0e2045"];
    document.getElementById("chart-equipos").innerHTML = `<div class="bar-chart">${equipos.map(([name,val],i)=>`<div class="bar-item"><div class="bar-label" title="${name}">${name}</div><div class="bar-track"><div class="bar-fill" style="width:${(val/maxEq*100).toFixed(1)}%;background:${eqColors[i%eqColors.length]}"></div></div><div class="bar-val">${val}</div></div>`).join("")}</div>`;
    const locs = Object.entries(stats.localidades).sort((a,b)=>b[1]-a[1]).slice(0,7);
    const maxLoc = locs[0]?.[1] || 1;
    document.getElementById("chart-localidades").innerHTML = `<div class="bar-chart">${locs.map(([name,val])=>`<div class="bar-item"><div class="bar-label" title="${name}">${name}</div><div class="bar-track"><div class="bar-fill" style="width:${(val/maxLoc*100).toFixed(1)}%;background:var(--azure-300)"></div></div><div class="bar-val">${val}</div></div>`).join("")}</div>`;
    const tipos=[{name:"Ag. Productores",val:stats.ap,color:"#2e78d8"},{name:"Referenciadores",val:stats.ref,color:"#8b5cf6"},{name:"Prod. Exclusivos",val:stats.pe,color:"#22c55e"},{name:"AAGI",val:stats.aagi,color:"#f59e0b"}];
    const total=tipos.reduce((s,t)=>s+t.val,0)||1; let acc=0;
    const segs=tipos.map(t=>{const pct=(t.val/total)*100;const s={...t,pct,start:acc};acc+=pct;return s;});
    const grad=segs.map(s=>`${s.color} ${s.start.toFixed(1)}% ${(s.start+s.pct).toFixed(1)}%`).join(",");
    document.getElementById("chart-tipos").innerHTML=`<div class="donut-wrap"><div class="donut-chart" style="background:conic-gradient(${grad});position:relative"><div style="position:absolute;inset:20px;border-radius:50%;background:white;display:flex;align-items:center;justify-content:center"><span style="font-size:1.1rem;font-weight:800;color:var(--slate-800)">${total}</span></div></div><div class="donut-legend">${tipos.map(t=>`<div class="legend-item"><div class="legend-dot" style="background:${t.color}"></div><div class="legend-name">${t.name}</div><div class="legend-val">${t.val}</div></div>`).join("")}</div></div>`;
    const monedas=[{name:"Pesos",val:stats.pesos,color:"#22c55e"},{name:"Dólares",val:stats.dolares,color:"#f59e0b"},{name:"Sin definir",val:stats.vigentes-stats.pesos-stats.dolares,color:"#cbd5e1"}].filter(m=>m.val>0);
    const totalM=monedas.reduce((s,m)=>s+m.val,0)||1; let accM=0;
    const segsM=monedas.map(m=>{const pct=(m.val/totalM)*100;const s={...m,pct,start:accM};accM+=pct;return s;});
    const gradM=segsM.map(s=>`${s.color} ${s.start.toFixed(1)}% ${(s.start+s.pct).toFixed(1)}%`).join(",");
    document.getElementById("chart-monedas").innerHTML=`<div class="donut-wrap"><div class="donut-chart" style="background:conic-gradient(${gradM});position:relative"><div style="position:absolute;inset:20px;border-radius:50%;background:white;display:flex;align-items:center;justify-content:center"><span style="font-size:0.75rem;font-weight:700;color:var(--slate-500)">moneda</span></div></div><div class="donut-legend">${monedas.map(m=>`<div class="legend-item"><div class="legend-dot" style="background:${m.color}"></div><div class="legend-name">${m.name}</div><div class="legend-val">${m.val}</div></div>`).join("")}</div></div>`;
  }

  function render() {
    const stats = App.getStats();
    const alerts = App.getAlerts();
    renderKPIs(stats);
    renderInsights(stats, alerts);
    renderAlerts(alerts);
    renderCharts(stats);
  }

  document.addEventListener("app:navigate", (e) => { if (e.detail.page === "dashboard") render(); });
  return { render };
})();

/* ── KPI Modal ─────────────────────────────────────────── */
const KpiModal = (() => {
  let _key = null;
  const CONFIG = {
    total:       { title:"Contratos Totales",      icon:"file-text",    color:"var(--azure-400)",  filter: c => true },
    vigentes:    { title:"Contratos Vigentes",     icon:"check-circle", color:"var(--green-500)",  filter: c => c.estado === "Vigente" },
    rescindidos: { title:"Contratos Rescindidos",  icon:"x-circle",     color:"var(--red-500)",    filter: c => c.estado === "Rescindido" },
    ap:          { title:"Agentes Productores",    icon:"users",        color:"var(--azure-400)",  filter: c => c.tipo === "AP" && c.estado === "Vigente" },
    ref:         { title:"Referenciadores",        icon:"share-2",      color:"var(--violet-500)", filter: c => c.tipo === "REF" && c.estado === "Vigente" },
    pe:          { title:"Productores Exclusivos", icon:"star",         color:"var(--green-500)",  filter: c => c.tipo === "PE" && c.estado === "Vigente" },
    aagi:        { title:"AAGI / Institucional",   icon:"building",     color:"var(--amber-500)",  filter: c => c.tipo === "AAGI" && c.estado === "Vigente" },
    incubadoras: { title:"Incubadoras Activas",    icon:"zap",          color:"var(--orange-500)", filter: c => (c.incubadora||"").toLowerCase() === "si" },
  };

  function open(key) {
    _key = key;
    const cfg = CONFIG[key]; if (!cfg) return;
    const items = App.getContratos().filter(cfg.filter);
    document.getElementById("kpi-modal-icon").style.color = cfg.color;
    document.getElementById("kpi-modal-icon").innerHTML = icon(cfg.icon);
    document.getElementById("kpi-modal-title").textContent = `${items.length} ${cfg.title}`;
    document.getElementById("kpi-modal").classList.add("open");
    document.querySelectorAll(".kpi-tab").forEach((t,i) => { t.classList.toggle("active", i===0); });
    renderTab("lista", items);
    document.querySelectorAll(".kpi-tab").forEach(tab => {
      tab.onclick = () => {
        document.querySelectorAll(".kpi-tab").forEach(t => t.classList.toggle("active", t.dataset.tab === tab.dataset.tab));
        renderTab(tab.dataset.tab, items);
      };
    });
  }

  function renderTab(tab, items) {
    const body = document.getElementById("kpi-modal-body");
    if (tab === "lista") {
      if (!items.length) { body.innerHTML = `<div class="empty-state">${icon("file-text")}<p>No hay contratos.</p></div>`; return; }
      body.innerHTML = `<div style="font-size:0.72rem;color:var(--slate-500);margin-bottom:10px">${items.length} contratos</div>` +
        items.slice(0,40).map(c => `<div onclick="App.closeKpiModal();App.selectContrato('${c.id}')" style="display:flex;align-items:center;gap:10px;padding:7px 9px;border-radius:8px;cursor:pointer;border-bottom:1px solid var(--slate-100)" onmouseover="this.style.background='var(--ice-25)'" onmouseout="this.style.background='transparent'"><div style="flex:1;min-width:0;font-size:0.83rem;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.nombre}</div><span class="badge-tipo ${c.tipo}">${c.tipo}</span><span style="font-size:0.72rem;color:var(--slate-400);flex-shrink:0">${c.equipo||""}</span></div>`).join("") +
        (items.length > 40 ? `<div style="text-align:center;font-size:0.75rem;color:var(--slate-400);padding:8px">y ${items.length-40} más…</div>` : "");
    } else if (tab === "equipo") {
      const eq = {}; items.forEach(c => { if (c.equipo) eq[c.equipo]=(eq[c.equipo]||0)+1; });
      const sorted = Object.entries(eq).sort((a,b)=>b[1]-a[1]); const max=sorted[0]?.[1]||1;
      const colors=["#2e78d8","#8b5cf6","#22c55e","#f59e0b","#f97316","#14b8a6","#64748b","#ec4899"];
      body.innerHTML = `<div class="bar-chart">${sorted.map(([n,v],i)=>`<div class="bar-item"><div class="bar-label" title="${n}">${n}</div><div class="bar-track"><div class="bar-fill" style="width:${(v/max*100).toFixed(1)}%;background:${colors[i%colors.length]}"></div></div><div class="bar-val">${v}</div><div style="font-size:0.68rem;color:var(--slate-400);width:32px;text-align:right;flex-shrink:0">${((v/items.length)*100).toFixed(0)}%</div></div>`).join("")}</div>`;
    } else if (tab === "tipo") {
      const tipos={AP:0,REF:0,PE:0,AAGI:0,Otro:0}; items.forEach(c=>{ if(tipos[c.tipo]!==undefined)tipos[c.tipo]++; else tipos.Otro++; });
      const monedas={Pesos:0,Dólares:0,Otro:0}; items.forEach(c=>{const m=(c.moneda||"").toLowerCase(); if(m.includes("peso"))monedas.Pesos++; else if(m.includes("dol")||m.includes("dól")||m==="usd")monedas["Dólares"]++; else monedas.Otro++;});
      const tc={"AP":"#2e78d8","REF":"#8b5cf6","PE":"#22c55e","AAGI":"#f59e0b","Otro":"#64748b"};
      body.innerHTML = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px"><div><div style="font-size:0.68rem;font-weight:700;color:var(--slate-400);letter-spacing:.08em;text-transform:uppercase;margin-bottom:10px">Por tipo</div>${Object.entries(tipos).filter(([,v])=>v>0).map(([k,v])=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--slate-100);font-size:0.82rem"><span style="display:flex;align-items:center;gap:7px"><span style="width:8px;height:8px;border-radius:2px;background:${tc[k]||"#64748b"};flex-shrink:0"></span>${k}</span><strong>${v}</strong></div>`).join("")}</div><div><div style="font-size:0.68rem;font-weight:700;color:var(--slate-400);letter-spacing:.08em;text-transform:uppercase;margin-bottom:10px">Por moneda</div>${Object.entries(monedas).filter(([,v])=>v>0).map(([k,v])=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--slate-100);font-size:0.82rem"><span>${k}</span><strong>${v}</strong></div>`).join("")}</div></div>`;
    } else if (tab === "evolucion") {
      const now = new Date();
      const months = [];
      for (let i=11;i>=0;i--) { const d=new Date(now.getFullYear(),now.getMonth()-i,1); months.push({label:d.toLocaleString("es-AR",{month:"short"}).replace(".",""),year:d.getFullYear(),month:d.getMonth(),count:0,bajas:0,cumulative:0}); }
      const allV = App.getContratos().filter(c=>c.estado==="Vigente"&&c.fechaAltaContrato);
      let base = allV.filter(c=>{ try{return new Date(c.fechaAltaContrato)<new Date(now.getFullYear(),now.getMonth()-11,1);}catch{return false;} }).length;
      months.forEach(m=>{ m.count=allV.filter(c=>{try{const d=new Date(c.fechaAltaContrato);return d.getFullYear()===m.year&&d.getMonth()===m.month;}catch{return false;}}).length; base+=m.count; m.cumulative=base; });
      const allB=App.getContratos().filter(c=>c.estado==="Rescindido"&&c.fechaRescision);
      months.forEach(m=>{ m.bajas=allB.filter(c=>{try{const d=new Date(c.fechaRescision);return d.getFullYear()===m.year&&d.getMonth()===m.month;}catch{return false;}}).length; });
      const tA=months.reduce((s,m)=>s+m.count,0), tB=months.reduce((s,m)=>s+m.bajas,0);
      const minC=Math.min(...months.map(m=>m.cumulative)), maxC=Math.max(...months.map(m=>m.cumulative)), range=maxC-minC||1;
      const H=100,W=420,pad=30,stepX=(W-pad*2)/(months.length-1);
      const pts=months.map((m,i)=>({x:pad+i*stepX, y:H-10-((m.cumulative-minC)/range)*(H-20), m}));
      const poly=pts.map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
      const area=`M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)} `+pts.slice(1).map(p=>`L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")+` L${pts[pts.length-1].x.toFixed(1)},${H} L${pts[0].x.toFixed(1)},${H} Z`;
      const last=pts[pts.length-1];
      body.innerHTML = `<div style="display:flex;gap:10px;margin-bottom:14px"><div style="background:var(--green-100);border-radius:9px;padding:8px 12px;flex:1;text-align:center"><div style="font-size:1.1rem;font-weight:700;color:#15803d">+${tA}</div><div style="font-size:0.7rem;color:#15803d">Altas 12m</div></div><div style="background:var(--red-100);border-radius:9px;padding:8px 12px;flex:1;text-align:center"><div style="font-size:1.1rem;font-weight:700;color:#b91c1c">-${tB}</div><div style="font-size:0.7rem;color:#b91c1c">Bajas 12m</div></div><div style="background:var(--ice-50);border-radius:9px;padding:8px 12px;flex:1;text-align:center"><div style="font-size:1.1rem;font-weight:700;color:var(--azure-500)">+${tA-tB}</div><div style="font-size:0.7rem;color:var(--azure-500)">Neto</div></div><div style="background:var(--slate-50);border-radius:9px;padding:8px 12px;flex:1;text-align:center"><div style="font-size:1.1rem;font-weight:700;color:var(--slate-800)">${last.m.cumulative}</div><div style="font-size:0.7rem;color:var(--slate-500)">Total actual</div></div></div><svg viewBox="0 0 ${W} ${H+20}" xmlns="http://www.w3.org/2000/svg" style="width:100%;overflow:visible"><defs><linearGradient id="lg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2e78d8" stop-opacity="0.15"/><stop offset="100%" stop-color="#2e78d8" stop-opacity="0.01"/></linearGradient></defs><path d="${area}" fill="url(#lg2)"/><polyline points="${poly}" fill="none" stroke="#2e78d8" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>${pts.map((p,i)=>`<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${i===pts.length-1?"5":"3"}" fill="${i===pts.length-1?"#2e78d8":"white"}" stroke="#2e78d8" stroke-width="${i===pts.length-1?"0":"1.5"}"/><text x="${p.x.toFixed(1)}" y="${H+14}" text-anchor="middle" font-size="8" fill="${i===pts.length-1?"#2e78d8":"var(--sl-400)"}" font-weight="${i===pts.length-1?"600":"400"}">${p.m.label}</text>`).join("")}<rect x="${(last.x-18).toFixed(1)}" y="${(last.y-16).toFixed(1)}" width="36" height="13" rx="4" fill="#2e78d8"/><text x="${last.x.toFixed(1)}" y="${(last.y-6).toFixed(1)}" text-anchor="middle" font-size="8" fill="white" font-weight="600">${last.m.cumulative}</text></svg>`;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("kpi-modal")?.addEventListener("click", e => { if(e.target===e.currentTarget) App.closeKpiModal(); });
    document.getElementById("kpi-modal-close")?.addEventListener("click", () => App.closeKpiModal());
    document.getElementById("kpi-modal-goto")?.addEventListener("click", () => { App.closeKpiModal(); App.navigate("contratos"); });
  });

  return { open };
})();


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
