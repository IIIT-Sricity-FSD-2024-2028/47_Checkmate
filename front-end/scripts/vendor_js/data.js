/* ═══════════════════════════════════════════
   data.js  —  EventPro Mock Database
   Initialises localStorage with seed data
   on first load. All pages read/write here.
═══════════════════════════════════════════ */

window.DB = {
  _seeds: {
    events: [
      { id:'EVT001', name:'Tech Summit 2026',       type:'Conference', date:'2026-03-28', time:'09:00', venue:'Convention Center', people:500, status:'pending', createdBy: 'client' },
      { id:'EVT002', name:'Wedding – Sarah & Mike',  type:'Wedding',    date:'2026-03-30', time:'18:00', venue:'Grand Hotel',       people:150, status:'pending', createdBy: 'client' },
      { id:'EVT003', name:'Annual Corporate Gala',   type:'Corporate',  date:'2026-04-05', time:'19:30', venue:'Skyline Ballroom',  people:320, status:'live', createdBy: 'client' },
      { id:'EVT004', name:'Music Festival',          type:'Conference', date:'2026-04-05', time:'12:00', venue:'City Park',         people:800, status:'confirmed' },
    ],
    resources: [
      { id:'R001', name:'Audio System Premium', category:'Equipment', quantity:12, price:500, unit:'day', available:true  },
      { id:'R002', name:'LED Screen 4K',         category:'Equipment', quantity:8,  price:300, unit:'day', available:true  },
      { id:'R003', name:'Round Banquet Tables',  category:'Furniture', quantity:40, price:25,  unit:'day', available:true  },
      { id:'R004', name:'Stage Lighting Rig',    category:'Equipment', quantity:5,  price:800, unit:'day', available:false },
      { id:'R005', name:'Floral Centrepieces',   category:'Decor',     quantity:60, price:15,  unit:'day', available:true  },
    ],
    staff: [
      { id:'S001', name:'Alex Johnson',   initials:'AJ', role:'Event Coordinator', phone:'+1 234-567-8901', email:'alex@eventpro.com',    workload:75, status:'available', avatar:'pink'   },
      { id:'S002', name:'Sarah Williams', initials:'SW', role:'Event Coordinator',     phone:'+1 234-567-8902', email:'sarah@eventpro.com',   workload:60, status:'available', avatar:'teal'   },
      { id:'S003', name:'Michael Brown',  initials:'MB', role:'Security Chief',     phone:'+1 234-567-8903', email:'michael@eventpro.com', workload:90, status:'busy',      avatar:'purple' },
      { id:'S004', name:'Lisa Chen',      initials:'LC', role:'Catering Manager',   phone:'+1 234-567-8904', email:'lisa@eventpro.com',    workload:40, status:'available', avatar:'green'  },
      { id:'S005', name:'James Rivera',   initials:'JR', role:'AV Technician',      phone:'+1 234-567-8905', email:'james@eventpro.com',   workload:85, status:'busy',      avatar:'orange' },
      { id:'S006', name:'Nina Patel',     initials:'NP', role:'Logistics Officer',  phone:'+1 234-567-8906', email:'nina@eventpro.com',    workload:20, status:'off',       avatar:'teal'   },
    ],
    packages: [
      { id:'P001', name:'Elegant Wedding Package',       category:'Wedding',    price:4500, duration:8,  capacity:'100–300', desc:'Complete wedding package with premium decorations, catering and full day event support. Ideal for 100–300 guests.',          resources:['Banquet Chairs (250)','Round Tables (30)','Floral Arrangements','Lighting Rig','Audio System','Catering Setup','Stage'], staff:['Event Coordinator','Photographer'] },
      { id:'P002', name:'Birthday Celebration Special',  category:'Birthday',   price:1200, duration:5,  capacity:'30–80',   desc:'Fun and vibrant birthday party setup with decorations, catering, and amusements. Ideal for 30–80 guests.',                   resources:['Banquet Chairs (80)','Party Tables (10)','Balloon Decorations','Sound System'],                                       staff:['Event Coordinator','DJ','Photographer','Catering Staff'] },
      { id:'P003', name:'Professional Conference Setup', category:'Conference', price:3800, duration:10, capacity:'100–500', desc:'Complete conference package with AV equipment, professional seating, and catering. Perfect for 100–500 delegates.',         resources:['Conference Chairs (500)','LED Screens (3)','Registration Desk','Projectors','Podium'],                                staff:['Event Manager','Audio/Visual Technicians (3)'] },
      { id:'P004', name:'Corporate Gala Evening',        category:'Corporate',  price:6200, duration:12, capacity:'100–300', desc:'Premium corporate event package with elegant setup, gourmet catering, and entertainment. Perfect for 100–300 guests.',      resources:['Premium Seating (300)','Ambient Lighting','Executive Tables (40)','Stage'],                                         staff:['Event Director','Professional MC','Catering Staff','Security'] },
    ],
    issues: [],
    resourceAllocations: {},
    staffAssignments: [],
    messages: {
      'vendor-vendor': [
        { id:'m1', sender:'Alex Johnson',   initials:'AJ', self:false, text:'Hey team! Tech Summit setup confirmed for tomorrow 7:30 AM.', time:'10:32 AM', avatar:'pink'   },
        { id:'m2', sender:'Sarah Williams', initials:'SW', self:false, text:'Audio system tested. All good. ✅',                          time:'10:35 AM', avatar:'teal'   },
        { id:'m3', sender:'You (Sarah)',    initials:'S',  self:true,  text:"Great! I'll confirm resource allocation now.",               time:'10:40 AM', avatar:'pink'   },
        { id:'m4', sender:'Michael Brown',  initials:'MB', self:false, text:"Security team briefed. We'll have 12 on-site.",             time:'10:44 AM', avatar:'purple' },
      ],
      'vendor-staff': [
        { id:'s1', sender:'You (Sarah)',  initials:'S',  self:true,  text:'Alex, can you confirm your availability for Tech Summit?', time:'9:15 AM', avatar:'pink' },
        { id:'s2', sender:'Alex Johnson', initials:'AJ', self:false, text:"Yes, I'll be there by 7 AM for setup.",                    time:'9:18 AM', avatar:'pink' },
        { id:'s3', sender:'You (Sarah)',  initials:'S',  self:true,  text:'Perfect. Please coordinate with the AV team on arrival.',  time:'9:20 AM', avatar:'pink' },
      ],
      'vendor-client': [
        { id:'c1', sender:'John Carter (Client)', initials:'JC', self:false, text:'Hi! Just wanted to confirm the no-alcohol policy is in place.', time:'8:00 AM', avatar:'blue' },
        { id:'c2', sender:'You (Sarah)',           initials:'S',  self:true,  text:'Confirmed! All staff have been briefed on the policy.',         time:'8:05 AM', avatar:'pink' },
        { id:'c3', sender:'John Carter (Client)', initials:'JC', self:false, text:'Thanks! Also, can we add 2 more registration desks?',           time:'8:10 AM', avatar:'blue' },
      ],
    },
    monitorProgress: {
      'EVT001': { setup:85, registration:65, event:40, breakdown:0  },
      'EVT003': { setup:100, registration:100, event:90, breakdown:10 },
    },
    session: { user:'Sarah', email:'sarah@gmail.com', role:'Event Coordinator' },
  },

  _key(name) { return `eventpro_${name}`; },

  init() {
    Object.keys(this._seeds).forEach(k => {
      // Force rewrite 'session' to ensure mock role reflects; all other keys
      // are only seeded once (non-destructive) so live data (assignedEvents, etc.) persists
      if (k === 'session' || !localStorage.getItem(this._key(k))) {
        this.save(k, this._seeds[k]);
      }
    });
    // Ensure resourceAllocations always exists (non-destructive)
    if (!localStorage.getItem(this._key('resourceAllocations'))) {
      this.set('resourceAllocations', {});
    }
  },

  get(name)      { return JSON.parse(localStorage.getItem(this._key(name)) || 'null'); },
  set(name, val) { localStorage.setItem(this._key(name), JSON.stringify(val)); },

  getAll(name)    { return this.get(name) || []; },
  save(name, arr) { this.set(name, arr); },

  add(name, item) {
    const arr = this.getAll(name);
    arr.push(item);
    this.save(name, arr);
    return item;
  },

  update(name, id, patch) {
    const arr = this.getAll(name).map(i => i.id === id ? { ...i, ...patch } : i);
    this.save(name, arr);
  },

  remove(name, id) {
    this.save(name, this.getAll(name).filter(i => i.id !== id));
  },

  find(name, id) {
    return this.getAll(name).find(i => i.id === id) || null;
  },

  getSession()    { return this.get('session') || this._seeds.session; },
  setSession(obj) { this.set('session', obj); },

  reset() {
    Object.keys(this._seeds).forEach(k => localStorage.removeItem(this._key(k)));
    this.init();
  },
};

window.DB.init();