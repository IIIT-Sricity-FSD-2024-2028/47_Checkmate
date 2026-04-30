/* ── EventPro Shared Data Store ── */
window.EP = (() => {
  const KEY = 'ep3_data';
  const load = () => { try { return JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch { return null; } };
  const SEED = {
    users: [
      { id:'U001', name:'John Admin',   email:'john@eventpro.com',  role:'Admin',  status:'Active',   created:'1/15/2024' },
      { id:'U002', name:'Sarah Vendor', email:'sarah@vendor.com',   role:'Vendor', status:'Active',   created:'2/20/2024' },
      { id:'U003', name:'Mike Johnson', email:'mike@staff.com',     role:'Staff',  status:'Active',   created:'3/10/2024' },
      { id:'U004', name:'Emily Client', email:'emily@client.com',   role:'Client', status:'Active',   created:'3/15/2024' },
      { id:'U005', name:'Tom Vendor',   email:'tom@vendor.com',     role:'Vendor', status:'Inactive', created:'1/5/2024'  },
    ],
    events: [
      { id:'EVT001', name:'Johnson Wedding',  venue:'Grand Ballroom',        client:'John Client',   vendor:'Elite Events Co.',  date:'4/15/2026', type:'Wedding',    guests:200, status:'Confirmed'   },
      { id:'EVT002', name:'Smith Birthday',   venue:'Beach Resort',           client:'Emily Smith',   vendor:'Elite Events Co.',  date:'3/20/2026', type:'Birthday',   guests:50,  status:'Completed'   },
      { id:'EVT003', name:'Tech Summit 2026', venue:'Convention Center Hall', client:'Tech Corp',     vendor:'Dream Events Ltd.', date:'5/10/2026', type:'Conference', guests:500, status:'Pending'     },
      { id:'EVT004', name:'Corporate Gala',   venue:'Convention Center',      client:'Business Inc.', vendor:'Elite Events Co.',  date:'3/25/2026', type:'Corporate',  guests:300, status:'In Progress' },
      { id:'EVT005', name:'Product Launch',   venue:'Innovation Hub',         client:'StartUp Co.',   vendor:'Dream Events Ltd.', date:'4/5/2026',  type:'Corporate',  guests:150, status:'Confirmed'   },
    ],
    bookings: [
      { id:'BK001', eventName:'Johnson Wedding',  client:'John Client',   vendor:'Elite Events Co.',  status:'Confirmed',   cost:25000, created:'2/1/2026'  },
      { id:'BK002', eventName:'Smith Birthday',   client:'Emily Smith',   vendor:'Elite Events Co.',  status:'Completed',   cost:5500,  created:'1/15/2026' },
      { id:'BK003', eventName:'Tech Summit 2026', client:'Tech Corp',     vendor:'Dream Events Ltd.', status:'Pending',     cost:45000, created:'3/1/2026'  },
      { id:'BK004', eventName:'Corporate Gala',   client:'Business Inc.', vendor:'Elite Events Co.',  status:'In Progress', cost:18000, created:'2/20/2026' },
      { id:'BK005', eventName:'Product Launch',   client:'StartUp Co.',   vendor:'Dream Events Ltd.', status:'Confirmed',   cost:12000, created:'2/28/2026' },
    ],
    resources: [
      { id:'R001', name:'Banquet Chairs',       cat:'Furniture',       vendor:'Elite Events Co.',  avail:450,  total:500,  price:5   },
      { id:'R002', name:'Round Tables',          cat:'Furniture',       vendor:'Elite Events Co.',  avail:85,   total:100,  price:15  },
      { id:'R003', name:'Sound System',          cat:'Audio',           vendor:'Dream Events Ltd.', avail:8,    total:10,   price:200 },
      { id:'R004', name:'LED Screen',            cat:'Visual',          vendor:'Elite Events Co.',  avail:3,    total:5,    price:500 },
      { id:'R005', name:'Stage Platform',        cat:'Infrastructure',  vendor:'Dream Events Ltd.', avail:2,    total:3,    price:800 },
      { id:'R006', name:'Floral Arrangements',   cat:'Decoration',      vendor:'Elite Events Co.',  avail:42,   total:50,   price:100 },
      { id:'R007', name:'Catering Service',      cat:'Food & Beverage', vendor:'Elite Events Co.',  avail:1000, total:1000, price:35  },
      { id:'R008', name:'Photography Equipment', cat:'Media',           vendor:'Dream Events Ltd.', avail:5,    total:8,    price:300 },
    ],
    staff: [
      { id:'S001', name:'Mike Johnson',  role:'Event Coordinator',  vendor:'Elite Events Co.',  phone:'555-0103', avail:'Available', events:3, status:'Active'   },
      { id:'S002', name:'Emily Davis',   role:'Photographer',        vendor:'Elite Events Co.',  phone:'555-0201', avail:'Available', events:2, status:'Active'   },
      { id:'S003', name:'David Lee',     role:'Catering Manager',    vendor:'Dream Events Ltd.', phone:'555-0202', avail:'Busy',      events:4, status:'Active'   },
      { id:'S004', name:'Lisa Chen',     role:'Decorator',           vendor:'Elite Events Co.',  phone:'555-0203', avail:'Available', events:1, status:'Active'   },
      { id:'S005', name:'Tom Wilson',    role:'Audio Technician',    vendor:'Dream Events Ltd.', phone:'555-0204', avail:'On Leave',  events:0, status:'Inactive' },
      { id:'S006', name:'Anna Martinez', role:'Event Assistant',     vendor:'Elite Events Co.',  phone:'555-0205', avail:'Available', events:2, status:'Active'   },
      { id:'S007', name:'James Brown',   role:'Stage Manager',       vendor:'Dream Events Ltd.', phone:'555-0206', avail:'Available', events:1, status:'Active'   },
      { id:'S008', name:'Sarah White',   role:'Lighting Specialist', vendor:'Elite Events Co.',  phone:'555-0207', avail:'Busy',      events:3, status:'Active'   },
    ],
    vendors: [
      { id:'V001', name:'Elite Events Co.',     status:'Approved' },
      { id:'V002', name:'Dream Events Ltd.',    status:'Approved' },
      { id:'V003', name:'Premium Catering',     status:'Pending'  },
      { id:'V004', name:'Sound & Lighting Pro', status:'Approved' },
    ],
  };

  let d = load() || SEED;
  const save = () => sessionStorage.setItem(KEY, JSON.stringify(d));

  const nid = (list, pfx) => pfx + String(list.length + 1).padStart(3,'0');

  return {
    get users()     { return d.users; },
    get events()    { return d.events; },
    get bookings()  { return d.bookings; },
    get resources() { return d.resources; },
    get staff()     { return d.staff; },
    get vendors()   { return d.vendors; },

    totalRev()     { return d.bookings.reduce((a,b)=>a+b.cost,0); },
    confirmedRev() { return d.bookings.filter(b=>['Confirmed','Completed'].includes(b.status)).reduce((a,b)=>a+b.cost,0); },

    addUser(u)         { u.id=nid(d.users,'U');    d.users.push(u);    save(); return u; },
    updateUser(id,u)   { const i=d.users.findIndex(x=>x.id===id);    if(i>-1){d.users[i]={...d.users[i],...u};    save();} },
    deleteUser(id)     { d.users=d.users.filter(x=>x.id!==id);       save(); },

    addEvent(e)        { e.id=nid(d.events,'EVT'); d.events.push(e);  save(); return e; },
    updateEvent(id,e)  { const i=d.events.findIndex(x=>x.id===id);   if(i>-1){d.events[i]={...d.events[i],...e};  save();} },
    deleteEvent(id)    { d.events=d.events.filter(x=>x.id!==id);     save(); },

    addBooking(b)      { b.id=nid(d.bookings,'BK');d.bookings.push(b);save(); return b; },
    updateBooking(id,b){ const i=d.bookings.findIndex(x=>x.id===id); if(i>-1){d.bookings[i]={...d.bookings[i],...b};save();} },
    deleteBooking(id)  { d.bookings=d.bookings.filter(x=>x.id!==id); save(); },

    addResource(r)     { r.id=nid(d.resources,'R');d.resources.push(r);save(); return r; },
    updateResource(id,r){const i=d.resources.findIndex(x=>x.id===id);if(i>-1){d.resources[i]={...d.resources[i],...r};save();} },
    deleteResource(id) { d.resources=d.resources.filter(x=>x.id!==id);save(); },

    addStaff(s)        { s.id=nid(d.staff,'S');   d.staff.push(s);   save(); return s; },
    updateStaff(id,s)  { const i=d.staff.findIndex(x=>x.id===id);    if(i>-1){d.staff[i]={...d.staff[i],...s};    save();} },
    deleteStaff(id)    { d.staff=d.staff.filter(x=>x.id!==id);       save(); },
  };
})();

/* ── Shared UI helpers ── */
window.UI = {
  cur(n){ if(n>=1e6) return '$'+(n/1e6).toFixed(1)+'M'; if(n>=1000) return '$'+n.toLocaleString(); return '$'+n; },

  badge(text, cls){ return `<span class="badge ${cls}">${text}</span>`; },

  sb(s){
    const m={
      'Confirmed':'b-confirmed','Completed':'b-completed','Pending':'b-pending',
      'In Progress':'b-inprogress','Cancelled':'b-cancelled',
      'Active':'b-active','Inactive':'b-inactive',
      'Available':'b-avail','Busy':'b-busy','On Leave':'b-leave',
      'Admin':'b-admin','Vendor':'b-vendor','Staff':'b-staff','Client':'b-client',
      'Wedding':'b-wedding','Birthday':'b-birthday','Conference':'b-conf','Corporate':'b-corp',
      'Furniture':'b-furn','Audio':'b-audio','Visual':'b-visual',
      'Infrastructure':'b-infra','Decoration':'b-deco',
      'Food & Beverage':'b-food','Media':'b-media',
    };
    return this.badge(s, m[s]||'b-pending');
  },

  prog(a,t){
    const p=t>0?(a/t)*100:0;
    const col=p<30?'#ef4444':p<65?'#f59e0b':'#10b981';
    const cls=p<30?'pf-lo':p<65?'pf-mi':'pf-hi';
    return `<div style="min-width:80px"><div style="font-size:11.5px;font-weight:700;color:${col};margin-bottom:3px">${a} / ${t}</div><div style="height:5px;background:rgba(255,255,255,.07);border-radius:5px;overflow:hidden"><div class="${cls}" style="height:100%;width:${p}%;border-radius:5px;transition:width .5s"></div></div></div>`;
  },

  toast(msg, type='ok'){
    let c=document.getElementById('_tc');
    if(!c){c=document.createElement('div');c.id='_tc';c.style.cssText='position:fixed;bottom:22px;right:22px;z-index:9999;display:flex;flex-direction:column;gap:7px';document.body.appendChild(c);}
    const icons={ok:'✓',err:'✕',info:'●'};
    const col={ok:'rgba(16,185,129,.4)',err:'rgba(239,68,68,.4)',info:'rgba(236,72,153,.4)'};
    const t=document.createElement('div');
    t.style.cssText=`display:flex;align-items:center;gap:8px;padding:10px 16px;background:#1a1a2e;border:1px solid ${col[type]};border-radius:8px;font-size:12.5px;font-weight:500;color:#f1f5f9;box-shadow:0 8px 24px rgba(0,0,0,.4);animation:_tIn .25s ease;min-width:230px;font-family:'Plus Jakarta Sans',sans-serif`;
    const tcol={ok:'#10b981',err:'#ef4444',info:'#ec4899'};
    t.innerHTML=`<span style="color:${tcol[type]};font-weight:700">${icons[type]}</span>${msg}`;
    c.appendChild(t);
    setTimeout(()=>{t.style.cssText+=';opacity:0;transform:translateX(100%);transition:all .25s';setTimeout(()=>t.remove(),260);},2800);
  },

  confirm(title, msg, cb){
    let o=document.getElementById('_co');
    if(!o){
      o=document.createElement('div');o.id='_co';
      o.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(4px);z-index:2000;display:flex;align-items:center;justify-content:center;opacity:0;visibility:hidden;transition:all .2s';
      o.innerHTML=`<div style="background:#1a1a2e;border:1px solid rgba(239,68,68,.3);border-radius:16px;padding:26px;max-width:360px;width:90%;text-align:center;box-shadow:0 24px 60px rgba(0,0,0,.5)"><div style="font-size:36px;margin-bottom:10px">⚠️</div><div id="_ct" style="font-family:'Syne',sans-serif;font-size:17px;font-weight:800;margin-bottom:7px;color:#f1f5f9"></div><div id="_cm" style="font-size:12.5px;color:#94a3b8;margin-bottom:22px;line-height:1.6"></div><div style="display:flex;gap:8px;justify-content:center"><button id="_cc" style="padding:8px 18px;border-radius:8px;background:#22223a;border:1px solid rgba(255,255,255,.08);color:#94a3b8;font-size:12.5px;font-weight:600;cursor:pointer;font-family:inherit">Cancel</button><button id="_cok" style="padding:8px 18px;border-radius:8px;background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.25);color:#ef4444;font-size:12.5px;font-weight:600;cursor:pointer;font-family:inherit">Delete</button></div></div>`;
      document.body.appendChild(o);
    }
    document.getElementById('_ct').textContent=title;
    document.getElementById('_cm').textContent=msg;
    o.style.opacity='1';o.style.visibility='visible';
    const close=()=>{o.style.opacity='0';o.style.visibility='hidden';};
    document.getElementById('_cc').onclick=close;
    o.onclick=e=>{if(e.target===o)close();};
    document.getElementById('_cok').onclick=()=>{close();cb();};
  },

  validate(rules){
    let ok=true;
    for(const [id,checks] of Object.entries(rules)){
      const el=document.getElementById(id);
      const er=document.getElementById(id+'_e');
      if(!el) continue;
      const v=el.value.trim();
      let msg='';
      for(const c of checks){
        if(c.req&&!v){msg=c.req;break;}
        if(c.email&&v&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)){msg=c.email;break;}
        if(c.num&&v&&isNaN(+v)){msg=c.num;break;}
        if(c.min!==undefined&&+v<c.min){msg='Minimum '+c.min;break;}
        if(c.maxv!==undefined&&+v>c.maxv){msg='Maximum '+c.maxv;break;}
        if(c.ml&&v.length<c.ml){msg=c.ml;break;}
      }
      el.classList.toggle('fc-err',!!msg);
      if(er){er.textContent=msg;er.style.display=msg?'block':'none';}
      if(msg) ok=false;
    }
    return ok;
  },

  clearV(fid){
    const f=document.getElementById(fid);
    if(!f) return;
    f.querySelectorAll('.fc-err').forEach(e=>e.classList.remove('fc-err'));
    f.querySelectorAll('.ferr').forEach(e=>{e.style.display='none';e.textContent='';});
  },

  vopts(){ return EP.vendors.map(v=>`<option value="${v.name}">${v.name}</option>`).join(''); },

  viewDetail(fields){
    return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${fields.map(([k,v])=>`<div style="background:#22223a;border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:11px"><div style="font-size:10.5px;text-transform:uppercase;letter-spacing:.07em;color:#64748b;margin-bottom:3px">${k}</div><div style="font-size:13px;font-weight:600;color:#f1f5f9">${v}</div></div>`).join('')}</div>`;
  }
};
