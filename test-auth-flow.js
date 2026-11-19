// Test: Vendor Signup -> Admin Approval -> Login Flow
const { DataService } = require('./back-end/dist/database/data.service');
const { VendorsService } = require('./back-end/dist/modules/vendors/vendors.service');
const { AuthService } = require('./back-end/dist/modules/auth/auth.service');
const fs = require('fs');
const path = require('path');
// AuthService signs real JWTs, so it needs a JwtService (test-only secret)
const { JwtService } = require('./back-end/node_modules/@nestjs/jwt');


// SAFETY: these scripts run against the TEST PostgreSQL database (checkmate_test),
// never the app's database. Each run empties it and re-seeds it first.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://checkmate:checkmate_dev@localhost:5432/checkmate_test?schema=public';
const { PrismaService } = require('./back-end/dist/database/prisma.service');
const { seedData } = require('./back-end/dist/database/seed');
const prisma = new PrismaService();

(async () => {
console.log('====================================================');
console.log('Vendor Signup → Approval → Login E2E Test');
console.log('====================================================');

const ds = new DataService(prisma);
await ds.importAppData(structuredClone(seedData));
await ds.onModuleInit();
const vs = new VendorsService(ds);
const auth = new AuthService(ds, new JwtService({ secret: 'test-only-secret-for-root-scripts-0123456789' }));

// Step 1: Submit Vendor Application (simulates frontend signup-step4)
console.log('\n--- Step 1: Submit Vendor Application ---');
const app = (await vs.createApplication({
  vendorName: 'Test Vendor',
  businessName: 'Test Events LLC',
  email: 'test@vendor.com',
  phone: '+1 555-9999',
  category: 'General',
  documents: [{ name: 'business-license.pdf', type: 'license' }, { name: 'tax-id.pdf', type: 'tax_id' }],
  passwordHash: 'MyP@ssw0rd'  // Raw password from signup form
}));
console.log(`[OK] Application created: ${app.id} (status: ${app.status})`);
console.log(`[OK] Documents: ${app.documents.length} files submitted`);

// Verify documents are stored
if (app.documents.length !== 2) {
  throw new Error(`FAILED: Expected 2 documents, got ${app.documents.length}`);
}
console.log('[PASS] Documents persisted correctly.');

// Step 2: Admin approves the application (simulates admin clicking Approve)
console.log('\n--- Step 2: Admin Approves Application ---');
const approved = (await vs.decideApplication(app.id, { status: 'approved' }));
console.log(`[OK] Application status: ${approved.status}`);

// Verify vendor was auto-created
const vendors = (await ds.collection('vendors'));
const newVendor = vendors.find(v => v.name === 'Test Events LLC' || v.businessName === 'Test Events LLC');
if (!newVendor) throw new Error('FAILED: Vendor not auto-created on approval.');
console.log(`[PASS] Vendor auto-provisioned: ${newVendor.id} - ${newVendor.name}`);

// Verify user was auto-created
const users = (await ds.collection('users'));
const newUser = users.find(u => u.email === 'test@vendor.com');
if (!newUser) throw new Error('FAILED: User not auto-created on approval.');
console.log(`[PASS] User auto-provisioned: ${newUser.id} - ${newUser.name} (role: ${newUser.role})`);

// Step 3: Vendor tries to sign in with the password they chose during signup
console.log('\n--- Step 3: Vendor Login Test ---');
try {
  const session = (await auth.login({ email: 'test@vendor.com', password: 'MyP@ssw0rd' }));
  console.log(`[PASS] LOGIN SUCCESS! Role: ${session.role}, User: ${session.user.name}`);
} catch (e) {
  console.error(`[FAIL] LOGIN FAILED: ${e.message}`);
  throw e;
}

// Step 4: Test Client Registration (direct registration, no approval needed)
console.log('\n--- Step 4: Client Direct Registration ---');
const clientSession = (await auth.register({
  name: 'Jane Client',
  email: 'jane@client.com',
  phone: '+1 555-8888',
  password: 'Client@2026',
  role: 'Client',
}));
console.log(`[PASS] Client registered: ${clientSession.user.name} (role: ${clientSession.role})`);

// Verify client can login
const clientLogin = (await auth.login({ email: 'jane@client.com', password: 'Client@2026' }));
console.log(`[PASS] Client login works: ${clientLogin.user.name}`);

// Step 5: Test wrong password fails
console.log('\n--- Step 5: Wrong Password Test ---');
try {
  (await auth.login({ email: 'test@vendor.com', password: 'WrongPassword' }));
  throw new Error('FAILED: Should have thrown for wrong password.');
} catch (e) {
  if (e.message.includes('Invalid email or password')) {
    console.log('[PASS] Wrong password correctly rejected.');
  } else {
    throw e;
  }
}

console.log('\n====================================================');
console.log('All E2E Auth Tests PASSED [5/5]!');
console.log('====================================================');

})()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
