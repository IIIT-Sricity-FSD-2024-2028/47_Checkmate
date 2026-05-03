import { AppData } from '../domain/models';
import { hashPassword } from '../common/security/password';

export const seedData: AppData = {
  users: [
    { id: 'U001', name: 'Aarav Mehta', email: 'aarav.admin@checkmate.com', phone: '+1 555-1001', role: 'Admin', status: 'Active', created: '2026-01-15', passwordHash: hashPassword('Aarav@2026') },
    { id: 'U002', name: 'Sarah Williams', email: 'sarah@eliteevents.com', phone: '+1 555-1002', role: 'Vendor', status: 'Active', created: '2026-02-20', passwordHash: hashPassword('Sarah@2026') },
    { id: 'U003', name: 'Mike Johnson', email: 'mike.staff@eliteevents.com', phone: '+1 555-1003', role: 'Staff', status: 'Active', created: '2026-03-10', passwordHash: hashPassword('Mike@2026') },
    { id: 'U004', name: 'Emily Carter', email: 'emily.client@example.com', phone: '+1 555-1004', role: 'Client', status: 'Active', created: '2026-03-15', passwordHash: hashPassword('Emily@2026') },
    { id: 'U005', name: 'Nina Patel', email: 'nina.ops@checkmate.com', phone: '+1 555-1005', role: 'Superuser', status: 'Active', created: '2026-04-01', passwordHash: hashPassword('Nina@2026') },
  ],
  events: [
    { id: 'EVT001', name: 'Tech Summit 2026', type: 'Conference', date: '2026-05-10', time: '09:00', venue: 'Convention Center', people: 500, guests: 500, status: 'pending', client: 'Tech Corp', vendor: 'Dream Events Ltd.', createdBy: 'client', budget: 45000 },
    { id: 'EVT002', name: 'Sarah and Mike Wedding', type: 'Wedding', date: '2026-05-18', time: '18:00', venue: 'Grand Hotel', people: 150, guests: 150, status: 'confirmed', client: 'Sarah Ahmed', vendor: 'Elite Events Co.', createdBy: 'client', budget: 25000 },
    { id: 'EVT003', name: 'Annual Corporate Gala', type: 'Corporate', date: '2026-05-21', time: '19:30', venue: 'Skyline Ballroom', people: 320, guests: 320, status: 'live', client: 'Business Inc.', vendor: 'Elite Events Co.', createdBy: 'client', budget: 18000 },
    { id: 'EVT004', name: 'Music Festival', type: 'Conference', date: '2026-06-05', time: '12:00', venue: 'City Park', people: 800, guests: 800, status: 'pending', client: 'City Arts Trust', vendor: 'Sound & Lighting Pro', createdBy: 'client', budget: 52000 },
  ],
  resources: [
    { id: 'R001', name: 'Audio System Premium', category: 'Equipment', cat: 'Audio', vendor: 'Dream Events Ltd.', quantity: 12, total: 12, avail: 12, price: 500, unit: 'day', available: true, condition: 'Ready' },
    { id: 'R002', name: 'LED Screen 4K', category: 'Equipment', cat: 'Visual', vendor: 'Elite Events Co.', quantity: 8, total: 8, avail: 8, price: 300, unit: 'day', available: true, condition: 'Ready' },
    { id: 'R003', name: 'Round Banquet Tables', category: 'Furniture', cat: 'Furniture', vendor: 'Elite Events Co.', quantity: 40, total: 40, avail: 40, price: 25, unit: 'day', available: true, condition: 'Ready' },
    { id: 'R004', name: 'Stage Lighting Rig', category: 'Equipment', cat: 'Visual', vendor: 'Sound & Lighting Pro', quantity: 5, total: 5, avail: 0, price: 800, unit: 'day', available: false, condition: 'Maintenance' },
    { id: 'R005', name: 'Floral Centrepieces', category: 'Decor', cat: 'Decoration', vendor: 'Elite Events Co.', quantity: 60, total: 60, avail: 60, price: 15, unit: 'day', available: true, condition: 'Ready' },
  ],
  staff: [],
  packages: [
    { id: 'P001', name: 'Elegant Wedding Package', category: 'Wedding', price: 4500, duration: 8, capacity: '100-300', desc: 'Complete wedding package with premium decorations, catering, and full day event support.', resources: ['Banquet Chairs (250)', 'Round Tables (30)', 'Floral Arrangements', 'Lighting Rig', 'Audio System'], staff: ['Event Coordinator', 'Photographer'] },
    { id: 'P002', name: 'Birthday Celebration Special', category: 'Birthday', price: 1200, duration: 5, capacity: '30-80', desc: 'Vibrant birthday party setup with decorations, catering, and sound support.', resources: ['Banquet Chairs (80)', 'Party Tables (10)', 'Balloon Decorations', 'Sound System'], staff: ['Event Coordinator', 'DJ'] },
    { id: 'P003', name: 'Professional Conference Setup', category: 'Conference', price: 3800, duration: 10, capacity: '100-500', desc: 'Conference package with AV equipment, seating, registration, and catering support.', resources: ['Conference Chairs (500)', 'LED Screens (3)', 'Registration Desk', 'Projectors'], staff: ['Event Manager', 'Audio/Visual Technicians (3)'] },
    { id: 'P004', name: 'Corporate Gala Evening', category: 'Corporate', price: 6200, duration: 12, capacity: '100-300', desc: 'Premium corporate event package with elegant setup, gourmet catering, and entertainment.', resources: ['Premium Seating (300)', 'Ambient Lighting', 'Executive Tables (40)', 'Stage'], staff: ['Event Director', 'Professional MC', 'Security'] },
  ],
  issues: [],
  staffAssignments: [],
  vendorApplications: [
    { id: 'VAPP001', vendorName: 'Priya Nair', businessName: 'Aurora Event Studio', email: 'priya@auroraevents.com', phone: '+1 555-0101', category: 'Event Planning', categoryClass: 'active', documents: [{ name: 'business-license.pdf', type: 'license' }, { name: 'insurance-certificate.pdf', type: 'insurance' }], status: 'pending', submittedAt: '2026-04-25T10:15:00.000Z' },
    { id: 'VAPP002', vendorName: 'Daniel Reyes', businessName: 'Reyes Catering Collective', email: 'daniel@reyescatering.com', phone: '+1 555-0115', category: 'Catering', categoryClass: 'blue', documents: [{ name: 'food-safety-license.pdf', type: 'license' }], status: 'pending', submittedAt: '2026-04-27T14:40:00.000Z' },
  ],
  vendors: [
    { id: 'V001', name: 'Elite Events Co.', status: 'Approved' },
    { id: 'V002', name: 'Dream Events Ltd.', status: 'Approved' },
    { id: 'V003', name: 'Premium Catering', status: 'Pending' },
    { id: 'V004', name: 'Sound & Lighting Pro', status: 'Approved' },
  ],
  bookings: [
    { id: 'BK001', eventName: 'Sarah and Mike Wedding', client: 'Sarah Ahmed', vendor: 'Elite Events Co.', status: 'Confirmed', cost: 25000, created: '2026-03-01' },
    { id: 'BK002', eventName: 'Annual Corporate Gala', client: 'Business Inc.', vendor: 'Elite Events Co.', status: 'In Progress', cost: 18000, created: '2026-03-20' },
    { id: 'BK003', eventName: 'Tech Summit 2026', client: 'Tech Corp', vendor: 'Dream Events Ltd.', status: 'Pending', cost: 45000, created: '2026-04-01' },
  ],
  messages: {
    'vendor-vendor': [
      { id: 'm1', threadId: 'vendor-vendor', sender: 'Alex Johnson', initials: 'AJ', self: false, text: 'Tech Summit setup is confirmed for tomorrow at 7:30 AM.', time: '10:32 AM', avatar: 'pink' },
      { id: 'm2', threadId: 'vendor-vendor', sender: 'Sarah Williams', initials: 'SW', self: true, text: 'Great. I will confirm the resource allocation now.', time: '10:40 AM', avatar: 'teal' },
    ],
    'vendor-client': [
      { id: 'c1', threadId: 'vendor-client', sender: 'Emily Carter', initials: 'EC', self: false, text: 'Can we add two more registration desks?', time: '8:10 AM', avatar: 'blue' },
    ],
    'vendor-staff': [],
  },
  resourceAllocations: {},
  monitorProgress: {
    EVT001: { setup: 85, registration: 65, event: 40, breakdown: 0 },
    EVT003: { setup: 100, registration: 100, event: 90, breakdown: 10 },
  },
  staffRequests: [],
  staffTasks: [],
  vendorDocSubmission: null,
  session: { user: 'Sarah Williams', email: 'sarah@eliteevents.com', role: 'Event Coordinator' },
  liveEvents: [],
  contingencyPlans: {
    '_default': [
      { id: 'CP_DEF_001', problem: 'Weather Emergency', trigger: 'Severe weather alert', solution: 'Move to indoor backup venue', status: 'ready' },
      { id: 'CP_DEF_002', problem: 'Power Outage', trigger: 'Electrical failure', solution: 'Activate backup generators', status: 'ready' },
      { id: 'CP_DEF_003', problem: 'Staff No-Show', trigger: 'Staff absence >30min', solution: 'Deploy backup staff from reserve pool', status: 'ready' },
    ]
  },
};
