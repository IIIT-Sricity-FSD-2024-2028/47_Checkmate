import { AppData } from '../domain/models';
import { hashPassword } from '../common/security/password';

export const seedData: AppData = {
  users: [
    { id: 'U001', name: 'Aarav Mehta', email: 'aarav.admin@checkmate.com', phone: '+1 555-1001', role: 'Admin', status: 'Active', created: '2026-01-15', passwordHash: hashPassword('Aarav@2026') },
    { id: 'U002', name: 'Sarah Williams', email: 'sarah@eliteevents.com', phone: '+1 555-1002', role: 'Vendor', status: 'Active', created: '2026-02-20', passwordHash: hashPassword('Sarah@2026') },
    { id: 'U003', name: 'Mike Johnson', email: 'mike.staff@eliteevents.com', phone: '+1 555-1003', role: 'Staff', status: 'Active', created: '2026-03-10', passwordHash: hashPassword('Mike@2026') },
    { id: 'U004', name: 'Emily Carter', email: 'emily.client@example.com', phone: '+1 555-1004', role: 'Client', status: 'Active', created: '2026-03-15', passwordHash: hashPassword('Emily@2026') },
    { id: 'U005', name: 'Nina Patel', email: 'nina.ops@checkmate.com', phone: '+1 555-1005', role: 'Superuser', status: 'Active', created: '2026-04-01', passwordHash: hashPassword('Nina@2026') },
    { id: 'U006', name: 'Priya Nair', email: 'priya@auroraevents.com', phone: '+1 555-0101', role: 'Vendor', status: 'Active', created: '2026-04-10', passwordHash: hashPassword('Priya@2026') },
    { id: 'U007', name: 'Elena Rostova', email: 'elena.staff@eliteevents.com', phone: '+1 555-1007', role: 'Staff', status: 'Active', created: '2026-04-12', passwordHash: hashPassword('Elena@2026') },
    { id: 'U008', name: 'David Miller', email: 'david.client@example.com', phone: '+1 555-1008', role: 'Client', status: 'Active', created: '2026-04-15', passwordHash: hashPassword('David@2026') },
  ],
  events: [
    {
      id: 'EVT001',
      name: 'Tech Summit 2026',
      type: 'Conference',
      date: '2026-05-10',
      time: '09:00',
      venue: 'Convention Center',
      people: 500,
      guests: 500,
      status: 'pending',
      client: 'Emily Carter',
      clientId: 'U004',
      clientEmail: 'emily.client@example.com',
      vendor: 'Elite Events Co.',
      vendorId: 'V001',
      createdBy: 'client',
      budget: 45000,
      budgetRange: '$30,000 - $50,000',
      notes: 'Keynote auditorium seating with dual presentation screens and high-speed AV routing.',
      submittedAt: '2026-04-01T09:30:00.000Z',
      requestedResources: [
        { resourceId: 'R001', resourceName: 'Audio System Premium', category: 'Equipment', quantity: 2, pricePerDay: 500 },
        { resourceId: 'R002', resourceName: 'LED Screen 4K Wall', category: 'Equipment', quantity: 2, pricePerDay: 300 }
      ],
      requestedStaff: [
        { staffId: 'S001', staffName: 'Mike Johnson', role: 'Event Coordinator' }
      ],
      estimatedCost: 1600
    },
    {
      id: 'EVT002',
      name: 'Sarah & Mike Wedding',
      type: 'Wedding',
      date: '2026-05-18',
      time: '18:00',
      venue: 'Grand Hotel Ballroom',
      people: 150,
      guests: 150,
      status: 'confirmed',
      client: 'Emily Carter',
      clientId: 'U004',
      clientEmail: 'emily.client@example.com',
      vendor: 'Elite Events Co.',
      vendorId: 'V001',
      createdBy: 'client',
      budget: 25000,
      budgetRange: '$15,000 - $30,000',
      notes: 'Floral archway at entrance, romantic ambient uplighting, and round banquet setup.',
      submittedAt: '2026-04-05T14:20:00.000Z',
      approvedAt: '2026-04-10T10:00:00.000Z',
      requestedResources: [
        { resourceId: 'R003', resourceName: 'Round Banquet Tables', category: 'Furniture', quantity: 15, pricePerDay: 25 },
        { resourceId: 'R005', resourceName: 'Luxury Floral Centrepieces', category: 'Decor', quantity: 20, pricePerDay: 15 }
      ],
      requestedStaff: [
        { staffId: 'S001', staffName: 'Mike Johnson', role: 'Event Coordinator' },
        { staffId: 'S004', staffName: 'Marcus Sterling', role: 'AV Specialist' }
      ],
      estimatedCost: 675
    },
    {
      id: 'EVT003',
      name: 'Annual Corporate Gala',
      type: 'Corporate',
      date: '2026-05-21',
      time: '19:30',
      venue: 'Skyline Ballroom',
      people: 320,
      guests: 320,
      status: 'live',
      client: 'Emily Carter',
      clientId: 'U004',
      clientEmail: 'emily.client@example.com',
      vendor: 'Elite Events Co.',
      vendorId: 'V001',
      createdBy: 'client',
      budget: 18000,
      budgetRange: '$15,000 - $30,000',
      notes: 'Executive gala dinner with live awards ceremony and cocktail reception.',
      submittedAt: '2026-04-08T11:00:00.000Z',
      approvedAt: '2026-04-12T09:00:00.000Z',
      startedAt: '2026-05-21T09:00:00.000Z',
      requestedResources: [
        { resourceId: 'R001', resourceName: 'Audio System Premium', category: 'Equipment', quantity: 2, pricePerDay: 500 },
        { resourceId: 'R002', resourceName: 'LED Screen 4K Wall', category: 'Equipment', quantity: 2, pricePerDay: 300 },
        { resourceId: 'R004', resourceName: 'Stage Lighting Rig Pro', category: 'Equipment', quantity: 2, pricePerDay: 800 }
      ],
      requestedStaff: [
        { staffId: 'S001', staffName: 'Mike Johnson', role: 'Event Coordinator' },
        { staffId: 'S002', staffName: 'Elena Rostova', role: 'Stage Manager' },
        { staffId: 'S005', staffName: 'Chloe Bennett', role: 'Guest Relations Lead' }
      ],
      estimatedCost: 3200
    },
    {
      id: 'EVT004',
      name: 'Spring Music & Arts Festival',
      type: 'Party',
      date: '2026-06-05',
      time: '12:00',
      venue: 'City Park Amphitheatre',
      people: 800,
      guests: 800,
      status: 'pending',
      client: 'David Miller',
      clientId: 'U008',
      clientEmail: 'david.client@example.com',
      vendor: 'Sound & Lighting Pro',
      vendorId: 'V004',
      createdBy: 'client',
      budget: 52000,
      budgetRange: '$50,000+',
      notes: 'Outdoor festival stage with multi-band line-up and food truck plaza.',
      submittedAt: '2026-04-14T16:45:00.000Z'
    },
    {
      id: 'EVT005',
      name: 'FinTech Global Keynote',
      type: 'Conference',
      date: '2026-06-18',
      time: '10:00',
      venue: 'Convention Center',
      people: 350,
      guests: 350,
      status: 'confirmed',
      client: 'Emily Carter',
      clientId: 'U004',
      clientEmail: 'emily.client@example.com',
      vendor: 'Elite Events Co.',
      vendorId: 'V001',
      createdBy: 'client',
      budget: 32000,
      budgetRange: '$30,000 - $50,000',
      approvedAt: '2026-04-18T15:30:00.000Z',
      submittedAt: '2026-04-15T10:00:00.000Z'
    },
    {
      id: 'EVT006',
      name: '25th Anniversary Banquet',
      type: 'Corporate',
      date: '2026-07-02',
      time: '19:00',
      venue: 'Grand Hotel Ballroom',
      people: 200,
      guests: 200,
      status: 'completed',
      client: 'Emily Carter',
      clientId: 'U004',
      clientEmail: 'emily.client@example.com',
      vendor: 'Elite Events Co.',
      vendorId: 'V001',
      createdBy: 'client',
      budget: 22000,
      budgetRange: '$15,000 - $30,000',
      approvedAt: '2026-05-01T12:00:00.000Z',
      startedAt: '2026-07-02T18:00:00.000Z',
      endedAt: '2026-07-02T23:30:00.000Z'
    },
    {
      id: 'EVT007',
      name: 'Charity Summer Auction',
      type: 'Corporate',
      date: '2026-07-15',
      time: '18:30',
      venue: 'Waterfront Pavilion',
      people: 120,
      guests: 120,
      status: 'rejected',
      client: 'Emily Carter',
      clientId: 'U004',
      clientEmail: 'emily.client@example.com',
      vendor: 'Elite Events Co.',
      vendorId: 'V001',
      createdBy: 'client',
      budget: 15000,
      budgetRange: '$15,000 - $30,000',
      rejectionReason: 'Waterfront Pavilion closed for scheduled city harbor renovation during July.',
      rejectedAt: '2026-04-20T11:00:00.000Z',
      conflicts: [
        { type: 'Venue Conflict', desc: 'Waterfront Pavilion unavailable due to city harbor maintenance.', severity: 'high' }
      ]
    }
  ],
  resources: [
    { id: 'R001', name: 'Audio System Premium', category: 'Equipment', cat: 'Audio', vendor: 'Elite Events Co.', vendorId: 'V001', quantity: 12, total: 12, avail: 10, quantityAvailable: 10, price: 500, unit: 'day', available: true, condition: 'Ready', conditionStatus: 'Ready' },
    { id: 'R002', name: 'LED Screen 4K Wall', category: 'Equipment', cat: 'Visual', vendor: 'Elite Events Co.', vendorId: 'V001', quantity: 8, total: 8, avail: 6, quantityAvailable: 6, price: 300, unit: 'day', available: true, condition: 'Ready', conditionStatus: 'Ready' },
    { id: 'R003', name: 'Round Banquet Tables', category: 'Furniture', cat: 'Furniture', vendor: 'Elite Events Co.', vendorId: 'V001', quantity: 60, total: 60, avail: 45, quantityAvailable: 45, price: 25, unit: 'day', available: true, condition: 'Ready', conditionStatus: 'Ready' },
    { id: 'R004', name: 'Stage Lighting Rig Pro', category: 'Equipment', cat: 'Visual', vendor: 'Sound & Lighting Pro', vendorId: 'V004', quantity: 6, total: 6, avail: 4, quantityAvailable: 4, price: 800, unit: 'day', available: true, condition: 'Ready', conditionStatus: 'Ready' },
    { id: 'R005', name: 'Luxury Floral Centrepieces', category: 'Decor', cat: 'Decoration', vendor: 'Elite Events Co.', vendorId: 'V001', quantity: 80, total: 80, avail: 60, quantityAvailable: 60, price: 15, unit: 'day', available: true, condition: 'Ready', conditionStatus: 'Ready' },
    { id: 'R006', name: 'Ergonomic Banquet Chairs', category: 'Furniture', cat: 'Furniture', vendor: 'Elite Events Co.', vendorId: 'V001', quantity: 400, total: 400, avail: 300, quantityAvailable: 300, price: 8, unit: 'day', available: true, condition: 'Ready', conditionStatus: 'Ready' },
    { id: 'R007', name: 'HD Laser Projector & Screen', category: 'Equipment', cat: 'Visual', vendor: 'Dream Events Ltd.', vendorId: 'V003', quantity: 10, total: 10, avail: 8, quantityAvailable: 8, price: 250, unit: 'day', available: true, condition: 'Ready', conditionStatus: 'Ready' },
    { id: 'R008', name: 'Wireless Microphone Set (4x)', category: 'Equipment', cat: 'Audio', vendor: 'Sound & Lighting Pro', vendorId: 'V004', quantity: 15, total: 15, avail: 12, quantityAvailable: 12, price: 120, unit: 'day', available: true, condition: 'Ready', conditionStatus: 'Ready' },
    { id: 'R009', name: 'Velvet Rope Stanchions (Pair)', category: 'Decor', cat: 'Decoration', vendor: 'Elite Events Co.', vendorId: 'V001', quantity: 30, total: 30, avail: 24, quantityAvailable: 24, price: 35, unit: 'day', available: true, condition: 'Ready', conditionStatus: 'Ready' },
    { id: 'R010', name: 'Modular Wooden Dance Floor', category: 'Furniture', cat: 'Furniture', vendor: 'Elite Events Co.', vendorId: 'V001', quantity: 5, total: 5, avail: 3, quantityAvailable: 3, price: 450, unit: 'day', available: true, condition: 'Ready', conditionStatus: 'Ready' },
    { id: 'R011', name: 'Cocktail High-Top Tables', category: 'Furniture', cat: 'Furniture', vendor: 'Elite Events Co.', vendorId: 'V001', quantity: 35, total: 35, avail: 28, quantityAvailable: 28, price: 20, unit: 'day', available: true, condition: 'Ready', conditionStatus: 'Ready' },
    { id: 'R012', name: 'Ambient Uplighting Kit (8 Pods)', category: 'Equipment', cat: 'Visual', vendor: 'Sound & Lighting Pro', vendorId: 'V004', quantity: 14, total: 14, avail: 10, quantityAvailable: 10, price: 180, unit: 'day', available: true, condition: 'Ready', conditionStatus: 'Ready' },
  ],
  staff: [
    { id: 'S001', userId: 'U003', name: 'Mike Johnson', initials: 'MJ', role: 'Event Coordinator', vendor: 'Elite Events Co.', vendorId: 'V001', phone: '+1 555-1003', email: 'mike.staff@eliteevents.com', workload: 40, status: 'available', avail: 'Available', events: 2, avatar: 'pink', assignedEvents: ['EVT002', 'EVT003'] },
    { id: 'S002', userId: 'U007', name: 'Elena Rostova', initials: 'ER', role: 'Stage Manager', vendor: 'Elite Events Co.', vendorId: 'V001', phone: '+1 555-1007', email: 'elena.staff@eliteevents.com', workload: 60, status: 'busy', avail: 'Busy', events: 1, avatar: 'purple', assignedEvents: ['EVT003'] },
    { id: 'S003', name: 'David Kim', initials: 'DK', role: 'Lead Sound Engineer', vendor: 'Sound & Lighting Pro', vendorId: 'V004', phone: '+1 555-1012', email: 'david.kim@soundpro.com', workload: 30, status: 'available', avail: 'Available', events: 1, avatar: 'teal', assignedEvents: ['EVT003'] },
    { id: 'S004', name: 'Marcus Sterling', initials: 'MS', role: 'AV Specialist', vendor: 'Elite Events Co.', vendorId: 'V001', phone: '+1 555-1014', email: 'marcus@eliteevents.com', workload: 40, status: 'available', avail: 'Available', events: 1, avatar: 'orange', assignedEvents: ['EVT002'] },
    { id: 'S005', name: 'Chloe Bennett', initials: 'CB', role: 'Guest Relations Lead', vendor: 'Elite Events Co.', vendorId: 'V001', phone: '+1 555-1016', email: 'chloe@eliteevents.com', workload: 25, status: 'available', avail: 'Available', events: 1, avatar: 'green', assignedEvents: ['EVT003'] },
    { id: 'S006', name: 'Liam Vance', initials: 'LV', role: 'Logistics Supervisor', vendor: 'Dream Events Ltd.', vendorId: 'V003', phone: '+1 555-1018', email: 'liam@dreamevents.com', workload: 0, status: 'available', avail: 'Available', events: 0, avatar: 'purple', assignedEvents: [] },
  ],
  packages: [
    { id: 'P001', name: 'Elegant Wedding Package', category: 'Wedding', price: 4500, duration: 8, capacity: '100-300', desc: 'Complete wedding package with luxury banquet tables, ambient uplighting, floral arrangements, sound system, and professional event coordinator.', resources: ['Round Banquet Tables (15)', 'Luxury Floral Centrepieces (20)', 'Ergonomic Banquet Chairs (150)', 'Ambient Uplighting Kit'], staff: ['Mike Johnson (Event Coordinator)', 'Marcus Sterling (AV Specialist)'], vendorId: 'V001', vendorName: 'Elite Events Co.', status: 'approved' },
    { id: 'P002', name: 'Birthday Celebration Special', category: 'Birthday', price: 1200, duration: 5, capacity: '30-80', desc: 'Vibrant birthday setup with party tables, sound system, disco lighting, and coordinator.', resources: ['Cocktail High-Top Tables (8)', 'Audio System Premium (1)', 'Ambient Uplighting Kit (1)'], staff: ['Mike Johnson (Event Coordinator)'], vendorId: 'V001', vendorName: 'Elite Events Co.', status: 'approved' },
    { id: 'P003', name: 'Professional Conference Setup', category: 'Conference', price: 3800, duration: 10, capacity: '100-500', desc: 'Turnkey conference package with 4K LED screens, audio system, wireless mics, and AV technical support.', resources: ['LED Screen 4K Wall (2)', 'Audio System Premium (2)', 'Wireless Microphone Set (2)', 'Ergonomic Banquet Chairs (300)'], staff: ['Marcus Sterling (AV Specialist)', 'David Kim (Lead Sound Engineer)'], vendorId: 'V001', vendorName: 'Elite Events Co.', status: 'approved' },
    { id: 'P004', name: 'Corporate Gala Evening', category: 'Corporate', price: 6200, duration: 12, capacity: '100-400', desc: 'Executive gala experience featuring stage lighting rig, modular dance floor, banquet seating, and full stage management.', resources: ['Stage Lighting Rig Pro (2)', 'Modular Wooden Dance Floor (1)', 'Round Banquet Tables (25)', 'Luxury Floral Centrepieces (25)'], staff: ['Elena Rostova (Stage Manager)', 'Mike Johnson (Event Coordinator)', 'Chloe Bennett (Guest Relations Lead)'], vendorId: 'V001', vendorName: 'Elite Events Co.', status: 'approved' },
    { id: 'P005', name: 'VIP Product Launch Showcase', category: 'Corporate', price: 5500, duration: 8, capacity: '80-250', desc: 'High-impact keynote & demo experience with 4K LED video wall, spotlighting, cocktail high-tops, and AV team.', resources: ['LED Screen 4K Wall (2)', 'Stage Lighting Rig Pro (1)', 'Cocktail High-Top Tables (15)', 'Velvet Rope Stanchions (6)'], staff: ['Elena Rostova (Stage Manager)', 'Marcus Sterling (AV Specialist)'], vendorId: 'V001', vendorName: 'Elite Events Co.', status: 'approved' },
  ],
  issues: [
    { id: 'ISS001', eventId: 'EVT003', event: 'Annual Corporate Gala', title: 'Main stage lighting power fluctuation', category: 'Equipment', priority: 'High', severity: 'high', description: 'Main stage ambient lighting dimmed momentarily during opening keynote.', reporter: 'Mike Johnson', reporterRole: 'Staff', email: 'mike.staff@eliteevents.com', target: 'vendor', status: 'in_progress', createdAt: '2026-05-21T10:15:00.000Z' },
    { id: 'ISS002', eventId: 'EVT003', event: 'Annual Corporate Gala', title: 'Additional VIP front-row tables requested', category: 'Furniture', priority: 'Medium', severity: 'medium', description: 'Client requested 2 extra front-row cocktail tables for executive guests.', reporter: 'Emily Carter', reporterRole: 'Client', email: 'emily.client@example.com', target: 'vendor', status: 'open', createdAt: '2026-05-21T11:00:00.000Z' },
  ],
  staffAssignments: [
    { id: 'A001', staffId: 'S001', staffName: 'Mike Johnson', eventId: 'EVT002', eventName: 'Sarah & Mike Wedding', eventDate: '2026-05-18', eventVenue: 'Grand Hotel Ballroom', eventPeople: 150, role: 'Event Coordinator', status: 'accepted' },
    { id: 'A002', staffId: 'S004', staffName: 'Marcus Sterling', eventId: 'EVT002', eventName: 'Sarah & Mike Wedding', eventDate: '2026-05-18', eventVenue: 'Grand Hotel Ballroom', eventPeople: 150, role: 'AV Specialist', status: 'accepted' },
    { id: 'A003', staffId: 'S001', staffName: 'Mike Johnson', eventId: 'EVT003', eventName: 'Annual Corporate Gala', eventDate: '2026-05-21', eventVenue: 'Skyline Ballroom', eventPeople: 320, role: 'Event Coordinator', status: 'accepted' },
    { id: 'A004', staffId: 'S002', staffName: 'Elena Rostova', eventId: 'EVT003', eventName: 'Annual Corporate Gala', eventDate: '2026-05-21', eventVenue: 'Skyline Ballroom', eventPeople: 320, role: 'Stage Manager', status: 'accepted' },
    { id: 'A005', staffId: 'S005', staffName: 'Chloe Bennett', eventId: 'EVT003', eventName: 'Annual Corporate Gala', eventDate: '2026-05-21', eventVenue: 'Skyline Ballroom', eventPeople: 320, role: 'Guest Relations Lead', status: 'accepted' },
  ],
  vendorApplications: [
    { id: 'VAPP001', vendorName: 'Priya Nair', businessName: 'Aurora Event Studio', email: 'priya@auroraevents.com', phone: '+1 555-0101', category: 'Event Planning', categoryClass: 'active', documents: [{ name: 'business-license.pdf', type: 'license' }, { name: 'insurance-certificate.pdf', type: 'insurance' }], status: 'approved', submittedAt: '2026-04-25T10:15:00.000Z' },
    { id: 'VAPP002', vendorName: 'Daniel Reyes', businessName: 'Reyes Catering Collective', email: 'daniel@reyescatering.com', phone: '+1 555-0115', category: 'Catering', categoryClass: 'blue', documents: [{ name: 'food-safety-license.pdf', type: 'license' }], status: 'pending', submittedAt: '2026-04-27T14:40:00.000Z' },
  ],
  vendors: [
    { id: 'V001', userId: 'U002', name: 'Elite Events Co.', businessName: 'Elite Events Co.', category: 'Full-Service Planning', status: 'Approved', rating: 4.9 },
    { id: 'V002', userId: 'U006', name: 'Aurora Event Studio', businessName: 'Aurora Event Studio', category: 'Event Planning & Design', status: 'Approved', rating: 4.8 },
    { id: 'V003', name: 'Dream Events Ltd.', businessName: 'Dream Events Ltd.', category: 'Audio & Staging', status: 'Approved', rating: 4.8 },
    { id: 'V004', name: 'Sound & Lighting Pro', businessName: 'Sound & Lighting Pro', category: 'AV Equipment', status: 'Approved', rating: 4.7 },
    { id: 'V005', name: 'Premium Catering', businessName: 'Premium Catering', category: 'Catering & Hospitality', status: 'Approved', rating: 4.6 },
  ],
  venues: [
    { id: 'VN001', vendorId: 'V001', name: 'Grand Hotel Ballroom', location: 'City Center', capacity: 300, pricePerDay: 3500, status: 'AVAILABLE' },
    { id: 'VN002', vendorId: 'V001', name: 'Skyline Ballroom', location: 'Uptown Tower', capacity: 400, pricePerDay: 4200, status: 'AVAILABLE' },
    { id: 'VN003', vendorId: 'V003', name: 'Convention Center', location: 'Downtown Metro', capacity: 1500, pricePerDay: 5000, status: 'AVAILABLE' },
    { id: 'VN004', vendorId: 'V004', name: 'City Park Amphitheatre', location: 'North Park', capacity: 2000, pricePerDay: 6000, status: 'AVAILABLE' },
    { id: 'VN005', vendorId: 'V001', name: 'Waterfront Pavilion', location: 'Harbor Bay', capacity: 250, pricePerDay: 2800, status: 'AVAILABLE' },
    { id: 'VN006', vendorId: 'V002', name: 'Crystal Glasshouse', location: 'Botanical Gardens', capacity: 180, pricePerDay: 3200, status: 'AVAILABLE' },
  ],
  bookings: [
    { id: 'BK001', eventId: 'EVT002', eventName: 'Sarah & Mike Wedding', client: 'Emily Carter', clientId: 'U004', vendor: 'Elite Events Co.', vendorId: 'V001', status: 'Confirmed', cost: 25000, advancePaid: 12500, paymentStatus: 'partially_paid', commissionRate: 0.10, commissionAmount: 2500, vendorPayoutAmount: 22500, payoutStatus: 'pending', created: '2026-04-10' },
    { id: 'BK002', eventId: 'EVT003', eventName: 'Annual Corporate Gala', client: 'Emily Carter', clientId: 'U004', vendor: 'Elite Events Co.', vendorId: 'V001', status: 'In Progress', cost: 18000, advancePaid: 18000, paymentStatus: 'paid', commissionRate: 0.10, commissionAmount: 1800, vendorPayoutAmount: 16200, payoutStatus: 'pending', created: '2026-04-15' },
    { id: 'BK003', eventId: 'EVT005', eventName: 'FinTech Global Keynote', client: 'Emily Carter', clientId: 'U004', vendor: 'Elite Events Co.', vendorId: 'V001', status: 'Confirmed', cost: 32000, advancePaid: 16000, paymentStatus: 'partially_paid', commissionRate: 0.10, commissionAmount: 3200, vendorPayoutAmount: 28800, payoutStatus: 'pending', created: '2026-04-18' },
    { id: 'BK004', eventId: 'EVT006', eventName: '25th Anniversary Banquet', client: 'Emily Carter', clientId: 'U004', vendor: 'Elite Events Co.', vendorId: 'V001', status: 'Completed', cost: 22000, advancePaid: 22000, paymentStatus: 'paid', commissionRate: 0.10, commissionAmount: 2200, vendorPayoutAmount: 19800, payoutStatus: 'settled', settledAt: '2026-05-02T14:30:00.000Z', settledBy: 'U001', created: '2026-04-20' },
  ],
  messages: {
    'vendor-vendor': [
      { id: 'MSG001', threadId: 'vendor-vendor', sender: 'Alex Johnson', initials: 'AJ', self: false, text: 'Tech Summit setup is confirmed for tomorrow at 7:30 AM.', time: '10:32 AM', avatar: 'pink' },
      { id: 'MSG002', threadId: 'vendor-vendor', sender: 'Sarah Williams', initials: 'SW', self: true, text: 'Great. I will confirm the resource allocation now.', time: '10:40 AM', avatar: 'teal' },
    ],
    'vendor-client': [
      { id: 'MSG003', threadId: 'vendor-client', sender: 'Emily Carter', initials: 'EC', self: false, text: 'Can we add two more cocktail tables near the front entrance?', time: '8:10 AM', avatar: 'blue' },
      { id: 'MSG004', threadId: 'vendor-client', sender: 'Sarah Williams', initials: 'SW', self: true, text: 'Absolutely Emily, our logistics team has added them to the floor plan.', time: '8:25 AM', avatar: 'teal' },
    ],
    'vendor-staff': [
      { id: 'MSG005', threadId: 'vendor-staff', sender: 'Mike Johnson', initials: 'MJ', self: false, text: 'All AV sound checks for Annual Corporate Gala are complete.', time: '9:15 AM', avatar: 'pink' }
    ],
  },
  resourceAllocations: {
    EVT002: [
      { resourceId: 'R003', resourceName: 'Round Banquet Tables', quantity: 15, status: 'allocated', allocatedAt: '2026-04-10T12:00:00.000Z' },
      { resourceId: 'R005', resourceName: 'Luxury Floral Centrepieces', quantity: 20, status: 'allocated', allocatedAt: '2026-04-10T12:00:00.000Z' }
    ],
    EVT003: [
      { resourceId: 'R001', resourceName: 'Audio System Premium', quantity: 2, status: 'allocated', allocatedAt: '2026-04-15T10:00:00.000Z' },
      { resourceId: 'R002', resourceName: 'LED Screen 4K Wall', quantity: 2, status: 'allocated', allocatedAt: '2026-04-15T10:00:00.000Z' },
      { resourceId: 'R004', resourceName: 'Stage Lighting Rig Pro', quantity: 2, status: 'allocated', allocatedAt: '2026-04-15T10:00:00.000Z' }
    ]
  },
  monitorProgress: {
    EVT001: { setup: 0, registration: 0, event: 0, breakdown: 0 },
    EVT002: { setup: 30, registration: 0, event: 0, breakdown: 0 },
    EVT003: { setup: 100, registration: 100, event: 75, breakdown: 0 },
    EVT004: { setup: 0, registration: 0, event: 0, breakdown: 0 },
    EVT005: { setup: 0, registration: 0, event: 0, breakdown: 0 },
    EVT006: { setup: 100, registration: 100, event: 100, breakdown: 100 },
  },
  staffRequests: [],
  staffTasks: [],
  vendorDocSubmission: null,
  session: { id: 'U004', user: 'Emily Carter', name: 'Emily Carter', email: 'emily.client@example.com', role: 'Client' },
  liveEvents: [],
  contingencyPlans: {
    '_default': [
      { id: 'CP_DEF_001', problem: 'Weather Emergency', trigger: 'Severe weather alert', solution: 'Move to indoor backup ballroom', status: 'ready' },
      { id: 'CP_DEF_002', problem: 'Power Outage', trigger: 'Electrical failure', solution: 'Activate backup generators and battery AV pack', status: 'ready' },
      { id: 'CP_DEF_003', problem: 'Staff No-Show', trigger: 'Staff absence >30min', solution: 'Deploy backup staff from reserve pool', status: 'ready' },
    ]
  },
  adminChatMessages: [],
  coordinationMessages: [
    { id: 'CM001', eventId: 'EVT003', channel: 'all', sender: 'Emily Carter', senderRole: 'Client', senderInitials: 'EC', text: 'Hi Sarah, are the keynote microphones ready for the opening remarks?', createdAt: '2026-05-21T09:10:00.000Z' },
    { id: 'CM002', eventId: 'EVT003', channel: 'all', sender: 'Sarah Williams', senderRole: 'Vendor', senderInitials: 'SW', text: 'Yes Emily! Mike and David just finalized audio checks on stage.', createdAt: '2026-05-21T09:12:00.000Z' }
  ],
  notifications: [
    { id: 'NOTIF001', userId: 'U004', title: 'Annual Corporate Gala Live', message: 'Annual Corporate Gala is now in live execution mode.', type: 'info', isRead: false, createdAt: '2026-05-21T09:00:00.000Z' },
    { id: 'NOTIF002', userId: 'U004', title: 'Wedding Booking Approved', message: 'Sarah & Mike Wedding request was approved by Elite Events Co.', type: 'success', isRead: false, createdAt: '2026-04-10T10:00:00.000Z' },
    { id: 'NOTIF003', userId: 'U004', title: 'Invoice INV-2026-081 Ready', message: 'New invoice generated for FinTech Global Keynote.', type: 'info', isRead: false, createdAt: '2026-04-18T16:00:00.000Z' }
  ],
  activityLogs: [
    { id: 'LOG001', userId: 'U001', userRole: 'Admin', action: 'SYSTEM_INITIALIZED', entityType: 'SYSTEM', entityId: 'SYS_INIT', details: { version: '2.0.0', status: 'SUCCESS' }, createdAt: '2026-05-01T00:00:00.000Z' }
  ]
};
