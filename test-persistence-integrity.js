const { DataService } = require('./back-end/dist/database/data.service');
const fs = require('fs');
const path = require('path');
// SAFETY: these scripts run against the TEST PostgreSQL database (checkmate_test),
// never the app's database. Each run empties it and re-seeds it first.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://checkmate:checkmate_dev@localhost:5432/checkmate_test?schema=public';
const { PrismaService } = require('./back-end/dist/database/prisma.service');
const { seedData } = require('./back-end/dist/database/seed');
const prisma = new PrismaService();

(async () => {

console.log('====================================================');
console.log('EMS Backend Persistence & Integrity Test Suite');
console.log('====================================================');


// 1. Test Startup & Initialization Persistence
console.log('\n[TEST 1] Initializing DataService (Cold Boot)...');
const ds1 = new DataService(prisma);
await ds1.importAppData(structuredClone(seedData));
await ds1.onModuleInit();

// PostgreSQL: the "cold boot" check is that the seeded tables are really there
if ((await prisma.user.count()) === 0) {
  throw new Error('FAILED: the database was not seeded on startup.');
}
console.log('[PASS] PostgreSQL seeded successfully on cold boot.');

const snap1 = (await ds1.snapshot());
console.log(`       Initial Users: ${snap1.users.length}, Events: ${snap1.events.length}, Resources: ${snap1.resources.length}`);

// 2. Test Record Creation & Disk Persistence
console.log('\n[TEST 2] Testing Entity Creation & Persistence...');
const newEvent = (await ds1.create('events', 'EVT', {
  name: 'Global AI Summit 2026',
  type: 'Conference',
  date: '2026-07-20',
  venue: 'Convention Center',
  budget: 60000,
  status: 'pending',
  client: 'AI Corp',
  createdBy: 'client'
}));
console.log(`[PASS] Created event: ${newEvent.id} - ${newEvent.name}`);

// Check progress monitor auto-init trigger
const monitorProgress = (await ds1.getValue('monitorProgress'));
if (!monitorProgress[newEvent.id]) {
  throw new Error('FAILED: Trigger 7 (Auto-init progress monitor) did not fire.');
}
console.log(`[PASS] Trigger 7 Verified: Progress monitor initialized for ${newEvent.id}:`, monitorProgress[newEvent.id]);

// Check activity log auto-entry
const snap2 = (await ds1.snapshot());
const lastLog = snap2.activityLogs[snap2.activityLogs.length - 1];
if (!lastLog || lastLog.action !== 'EVENT_CREATED' || lastLog.entityId !== newEvent.id) {
  throw new Error('FAILED: Activity audit log was not created.');
}
console.log(`[PASS] Activity Audit Log Verified: ${lastLog.action} for ${lastLog.entityId}`);

// 3. Test Simulated Server Restart (Hot Boot from Disk)
console.log('\n[TEST 3] Simulating Server Restart (a new DataService reading PostgreSQL)...');
const ds2 = new DataService(prisma);
await ds2.onModuleInit();
const fetchedEvent = (await ds2.find('events', newEvent.id));
if (!fetchedEvent || fetchedEvent.name !== 'Global AI Summit 2026') {
  throw new Error('FAILED: Created event did not persist across DataService instances.');
}
console.log(`[PASS] Persistence Verified: Successfully loaded ${fetchedEvent.id} from disk after restart.`);

// 4. Test Automated Trigger: Resource Allocation & Inventory Sync
console.log('\n[TEST 4] Testing Resource Allocation & Inventory Sync Trigger...');
const initialR001 = (await ds2.find('resources', 'R001'));
const initialAvail = initialR001.avail;
console.log(`       Resource R001 initial available: ${initialAvail}`);

// Allocate 4 units of R001 to EVT001
const allocs = (await ds2.getValue('resourceAllocations'));
allocs[newEvent.id] = [
  { resourceId: 'R001', resourceName: 'Audio System Premium', quantity: 4, status: 'allocated', allocatedAt: new Date().toISOString() }
];
(await ds2.setValue('resourceAllocations', allocs));

const updatedR001 = (await ds2.find('resources', 'R001'));
console.log(`       Resource R001 updated available: ${updatedR001.avail}`);
if (updatedR001.avail !== initialAvail - 4) {
  throw new Error(`FAILED: Expected R001 avail to be ${initialAvail - 4}, got ${updatedR001.avail}`);
}
console.log('[PASS] Trigger 2 Verified: Resource quantity automatically decremented on allocation.');

// 5. Test Automated Trigger: Staff Assignment & Workload Recalculation
console.log('\n[TEST 5] Testing Staff Assignment & Workload Trigger...');
const staffS001 = (await ds2.find('staff', 'S001'));
console.log(`       Staff S001 initial workload: ${staffS001.workload}%, status: ${staffS001.status}`);

const newAssignment = (await ds2.create('staffAssignments', 'A', {
  staffId: 'S001',
  staffName: 'Mike Johnson',
  eventId: newEvent.id,
  eventName: newEvent.name,
  role: 'Event Coordinator',
  status: 'assigned',
  priority: 'High',
  assignedAt: new Date().toISOString()
}));

const updatedStaff = (await ds2.find('staff', 'S001'));
console.log(`       Staff S001 updated workload: ${updatedStaff.workload}%, status: ${updatedStaff.status}`);
if (updatedStaff.status !== 'assigned' || updatedStaff.workload <= 0) {
  throw new Error('FAILED: Staff workload and status trigger did not update.');
}
console.log('[PASS] Trigger 5 Verified: Staff workload and status automatically calculated.');

// 6. Test Automated Trigger: Event Confirmation & Auto-Booking Provisioning
console.log('\n[TEST 6] Testing Event Status Confirmation & Auto-Booking Trigger...');
const bookingsCountBefore = (await ds2.collection('bookings')).length;
(await ds2.update('events', newEvent.id, { status: 'confirmed' }));

const bookingsCountAfter = (await ds2.collection('bookings')).length;
const createdBooking = (await ds2.collection('bookings')).find(b => b.eventName === newEvent.name || b.eventId === newEvent.id);

if (!createdBooking || bookingsCountAfter !== bookingsCountBefore + 1) {
  throw new Error('FAILED: Auto-booking creation trigger did not fire on event confirmation.');
}
console.log(`[PASS] Trigger 8 Verified: Auto-booking generated: ${createdBooking.id} with cost $${createdBooking.cost}`);

// 7. Test Automated Trigger: Vendor Application Approval
console.log('\n[TEST 7] Testing Vendor Application Approval Auto-Provisioning Trigger...');
const app = (await ds2.find('vendorApplications', 'VAPP001'));
(await ds2.update('vendorApplications', app.id, { status: 'approved' }));

const provisionedVendor = (await ds2.collection('vendors')).find(v => v.businessName === app.businessName || v.name === app.businessName);
const provisionedUser = (await ds2.collection('users')).find(u => u.email === app.email);

if (!provisionedVendor || !provisionedUser || provisionedUser.role !== 'Vendor') {
  throw new Error('FAILED: Vendor and User account auto-provisioning trigger did not fire.');
}
console.log(`[PASS] Trigger 1 Verified: Auto-provisioned Vendor ${provisionedVendor.id} and User ${provisionedUser.id} (${provisionedUser.role})`);

// 8. Test Referential Integrity & Cascade Delete
console.log('\n[TEST 8] Testing Referential Integrity & Cascade Delete...');
(await ds2.remove('events', newEvent.id));

const allocationsAfterDelete = (await ds2.getValue('resourceAllocations'));
if (allocationsAfterDelete[newEvent.id]) {
  throw new Error('FAILED: Event resource allocation was not cascade-deleted.');
}

const staffR001AfterDelete = (await ds2.find('resources', 'R001'));
if (staffR001AfterDelete.avail !== initialAvail) {
  throw new Error(`FAILED: Resource inventory was not restored on event deletion. Expected ${initialAvail}, got ${staffR001AfterDelete.avail}`);
}
console.log('[PASS] Cascade Delete & Stock Restoration Verified: Allocated inventory fully restored on event delete.');

console.log('\n====================================================');
console.log('All Persistence, Integrity & Trigger Tests PASSED [8/8]!');
console.log('====================================================');

})()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
