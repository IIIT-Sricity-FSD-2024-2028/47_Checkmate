// Test: Vendor Signup -> Admin Approval -> Login Flow
const { DataService } = require('./back-end/dist/database/data.service');
const { VendorsService } = require('./back-end/dist/modules/vendors/vendors.service');
const { AuthService } = require('./back-end/dist/modules/auth/auth.service');
const fs = require('fs');
const path = require('path');

// Clean database for fresh test
const dbFile = path.join(__dirname, 'back-end', 'data', 'database.json');
if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);

console.log('====================================================');
console.log('Vendor Signup → Approval → Login E2E Test');
console.log('====================================================');

const ds = new DataService();
ds.onModuleInit();
const vs = new VendorsService(ds);
const auth = new AuthService(ds);

// Step 1: Submit Vendor Application (simulates frontend signup-step4)
console.log('\n--- Step 1: Submit Vendor Application ---');
const app = vs.createApplication({
  vendorName: 'Test Vendor',
  businessName: 'Test Events LLC',
  email: 'test@vendor.com',
  phone: '+1 555-9999',
  category: 'General',
  documents: [{ name: 'business-license.pdf', type: 'license' }, { name: 'tax-id.pdf', type: 'tax_id' }],
  passwordHash: 'MyP@ssw0rd'  // Raw password from signup form
});
console.log(`[OK] Application created: ${app.id} (status: ${app.status})`);
console.log(`[OK] Documents: ${app.documents.length} files submitted`);

// Verify documents are stored
if (app.documents.length !== 2) {
  throw new Error(`FAILED: Expected 2 documents, got ${app.documents.length}`);
}
console.log('[PASS] Documents persisted correctly.');

// Step 2: Admin approves the application (simulates admin clicking Approve)
console.log('\n--- Step 2: Admin Approves Application ---');
const approved = vs.decideApplication(app.id, { status: 'approved' });
console.log(`[OK] Application status: ${approved.status}`);

// Verify vendor was auto-created
const vendors = ds.collection('vendors');
const newVendor = vendors.find(v => v.name === 'Test Events LLC' || v.businessName === 'Test Events LLC');
if (!newVendor) throw new Error('FAILED: Vendor not auto-created on approval.');
console.log(`[PASS] Vendor auto-provisioned: ${newVendor.id} - ${newVendor.name}`);

// Verify user was auto-created
const users = ds.collection('users');
const newUser = users.find(u => u.email === 'test@vendor.com');
if (!newUser) throw new Error('FAILED: User not auto-created on approval.');
console.log(`[PASS] User auto-provisioned: ${newUser.id} - ${newUser.name} (role: ${newUser.role})`);

// Step 3: Vendor tries to sign in with the password they chose during signup
console.log('\n--- Step 3: Vendor Login Test ---');
try {
  const session = auth.login({ email: 'test@vendor.com', password: 'MyP@ssw0rd' });
  console.log(`[PASS] LOGIN SUCCESS! Role: ${session.role}, User: ${session.user.name}`);
} catch (e) {
  console.error(`[FAIL] LOGIN FAILED: ${e.message}`);
  throw e;
}

// Step 4: Test Client Registration (direct registration, no approval needed)
console.log('\n--- Step 4: Client Direct Registration ---');
const clientSession = auth.register({
  name: 'Jane Client',
  email: 'jane@client.com',
  phone: '+1 555-8888',
  password: 'Client@2026',
  role: 'Client',
});
console.log(`[PASS] Client registered: ${clientSession.user.name} (role: ${clientSession.role})`);

// Verify client can login
const clientLogin = auth.login({ email: 'jane@client.com', password: 'Client@2026' });
console.log(`[PASS] Client login works: ${clientLogin.user.name}`);

// Step 5: Test wrong password fails
console.log('\n--- Step 5: Wrong Password Test ---');
try {
  auth.login({ email: 'test@vendor.com', password: 'WrongPassword' });
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
