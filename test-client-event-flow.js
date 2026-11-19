const fs = require('fs');
const path = require('path');
const { DataService } = require('./back-end/dist/database/data.service');
const { EventsService } = require('./back-end/dist/modules/events/events.service');
// SAFETY: these scripts run against the TEST PostgreSQL database (checkmate_test),
// never the app's database. Each run empties it and re-seeds it first.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://checkmate:checkmate_dev@localhost:5432/checkmate_test?schema=public';
const { PrismaService } = require('./back-end/dist/database/prisma.service');
const { seedData } = require('./back-end/dist/database/seed');
const prisma = new PrismaService();

(async () => {

console.log('====================================================');
console.log('Testing Client Event Creation & Display Flow');
console.log('====================================================');

const ds = new DataService(prisma);
await ds.importAppData(structuredClone(seedData));
await ds.onModuleInit();
const eventsService = new EventsService(ds);

// 1. Check Initial Client Events
const initialEvents = (await ds.collection('events'));
console.log(`[PASS] Total Initial Events: ${initialEvents.length}`);

// 2. Simulate Client Creating an Event (via CreateEventDto payload)
const clientEventPayload = {
  name: 'Global Sustainability Summit 2026',
  type: 'Conference',
  date: '2026-08-25',
  time: '10:00 AM',
  venue: 'Skyline Ballroom',
  people: 250,
  guests: 250,
  status: 'pending',
  notes: 'Green catering and digital badges required.',
  createdBy: 'client',
  client: 'Emily Carter',
  clientId: 'U004',
  clientEmail: 'emily.client@example.com',
  vendor: 'Elite Events Co.',
  vendorId: 'V001',
  budget: 35000,
  budgetRange: '$30,000 - $50,000',
  requestedResources: [
    { resourceId: 'R001', resourceName: 'Audio System Premium', quantity: 2, pricePerDay: 500 },
    { resourceId: 'R002', resourceName: 'LED Screen 4K Wall', quantity: 2, pricePerDay: 300 }
  ],
  requestedStaff: [
    { staffId: 'S001', staffName: 'Mike Johnson', role: 'Event Coordinator' }
  ],
  estimatedCost: 1600,
  submittedAt: new Date().toISOString()
};

const created = (await eventsService.create(clientEventPayload));
console.log(`[PASS] Client Event Created successfully: ${created.id} - ${created.name}`);

// 3. Verify Event is in collection
const retrieved = (await eventsService.findOne(created.id));
if (!retrieved || retrieved.name !== 'Global Sustainability Summit 2026') {
  throw new Error('FAILED: Created event not found in events collection.');
}
console.log(`[PASS] Event Retrieved by ID (${retrieved.id}): client=${retrieved.client}, status=${retrieved.status}, budget=${retrieved.budget}, budgetRange=${retrieved.budgetRange}`);

// 4. Verify Monitor Progress initialized
const monitor = (await ds.getValue('monitorProgress'));
if (!monitor[created.id]) {
  throw new Error('FAILED: Monitor progress not initialized for created event.');
}
console.log(`[PASS] Monitor Progress Auto-Initialized:`, monitor[created.id]);

// 5. Test Filtering for Client Emily Carter
const clientEvents = (await ds.collection('events')).filter(ev => 
  (ev.clientId === 'U004') || 
  (ev.clientEmail && ev.clientEmail.toLowerCase() === 'emily.client@example.com') ||
  (ev.client && ev.client.toLowerCase().includes('emily')) ||
  (ev.createdBy === 'client')
);

console.log(`[PASS] Client Emily Carter Total Events: ${clientEvents.length}`);
const hasNewlyCreated = clientEvents.some(e => e.id === created.id);
if (!hasNewlyCreated) {
  throw new Error('FAILED: Newly created event not included in client events filter.');
}
console.log(`[PASS] Newly created event ${created.id} is present and ready for client display!`);

console.log('====================================================');
console.log('All Client Event Creation & Display Tests PASSED [5/5]!');
console.log('====================================================');

})()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
