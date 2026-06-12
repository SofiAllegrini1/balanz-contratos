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
      <div class="kpi-card ${k.color}" onclick="KpiModal.open(\'${k.key}\')" style="cursor:pointer" title="Clic para ver detalle">
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
      <div class="alert-strip ${s.cls}" onclick="Alertas.filterBy(\'${s.filter}\'); App.navigate(\'alertas\');" style="cursor:pointer">
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
        items.slice(0,40).map(c => `<div onclick="App.closeKpiModal();App.selectContrato(\'${c.id}\')" style="display:flex;align-items:center;gap:10px;padding:7px 9px;border-radius:8px;cursor:pointer;border-bottom:1px solid var(--slate-100)" onmouseover="this.style.background=\'var(--ice-25)\'" onmouseout="this.style.background=\'transparent\'"><div style="flex:1;min-width:0;font-size:0.83rem;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.nombre}</div><span class="badge-tipo ${c.tipo}">${c.tipo}</span><span style="font-size:0.72rem;color:var(--slate-400);flex-shrink:0">${c.equipo||""}</span></div>`).join("") +
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
