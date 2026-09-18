const fs = require('fs');
const path = require('path');
const { DataService } = require('./back-end/dist/database/data.service');
const { BookingsService } = require('./back-end/dist/modules/bookings/bookings.service');
const { AnalyticsService } = require('./back-end/dist/modules/analytics/analytics.service');
const { VendorsService } = require('./back-end/dist/modules/vendors/vendors.service');
const { calculateCommissionSplit, DEFAULT_COMMISSION_RATE, VENDOR_SHARE_RATE } = require('./back-end/dist/common/constants/finance.constants');

console.log('================================================================');
console.log('EventPro Commission-Based Revenue Model End-to-End Test Suite');
console.log('Platform Commission: 10% | Vendor Net Payout: 90%');
console.log('================================================================\n');

// Clean test database for fresh cold boot
const dataDir = path.join(__dirname, 'back-end', 'data');
const dbFile = path.join(dataDir, 'database.json');
if (fs.existsSync(dbFile)) {
  fs.unlinkSync(dbFile);
}

// --------------------------------------------------------------------------
// TEST 1: Mathematical Accuracy of Commission Split Helper
// --------------------------------------------------------------------------
console.log('[TEST 1] Testing Mathematical Accuracy of calculateCommissionSplit()...');
const testCases = [
  { cost: 10000, expectedComm: 1000, expectedVendor: 9000 },
  { cost: 25000, expectedComm: 2500, expectedVendor: 22500 },
  { cost: 45000, expectedComm: 4500, expectedVendor: 40500 },
  { cost: 1250.50, expectedComm: 125.05, expectedVendor: 1125.45 },
  { cost: 99.99, expectedComm: 10.00, expectedVendor: 89.99 },
  { cost: 0, expectedComm: 0, expectedVendor: 0 },
];

testCases.forEach((tc) => {
  const result = calculateCommissionSplit(tc.cost, DEFAULT_COMMISSION_RATE);
  if (result.commissionAmount !== tc.expectedComm || result.vendorPayoutAmount !== tc.expectedVendor) {
    throw new Error(`FAILED: For cost $${tc.cost}, expected comm=$${tc.expectedComm}, vendor=$${tc.expectedVendor}, got comm=$${result.commissionAmount}, vendor=$${result.vendorPayoutAmount}`);
  }
  if (Number((result.commissionAmount + result.vendorPayoutAmount).toFixed(2)) !== tc.cost) {
    throw new Error(`FAILED: Sum of split ($${result.commissionAmount} + $${result.vendorPayoutAmount}) != total cost $${tc.cost}`);
  }
});
console.log('[PASS] Test 1: All mathematical split edge cases passed with exact penny precision.');

// --------------------------------------------------------------------------
// TEST 2: Cold Boot & Seed Data Commission Integrity
// --------------------------------------------------------------------------
console.log('\n[TEST 2] Testing Cold Boot & Seed Bookings Commission Normalization...');
const ds = new DataService();
ds.onModuleInit();

const seedBookings = ds.collection('bookings');
if (seedBookings.length === 0) {
  throw new Error('FAILED: No seed bookings loaded.');
}

seedBookings.forEach((b) => {
  if (b.commissionRate !== 0.10) {
    throw new Error(`FAILED: Booking ${b.id} commissionRate is ${b.commissionRate}, expected 0.10`);
  }
  const expectedFee = Number((b.cost * 0.10).toFixed(2));
  const expectedNet = Number((b.cost - expectedFee).toFixed(2));
  if (b.commissionAmount !== expectedFee || b.vendorPayoutAmount !== expectedNet) {
    throw new Error(`FAILED: Booking ${b.id} cost=$${b.cost} has invalid split: fee=$${b.commissionAmount} (expected $${expectedFee}), net=$${b.vendorPayoutAmount} (expected $${expectedNet})`);
  }
  if (!b.payoutStatus || !['pending', 'settled'].includes(b.payoutStatus)) {
    throw new Error(`FAILED: Booking ${b.id} has invalid payoutStatus: ${b.payoutStatus}`);
  }
  console.log(`       Booking ${b.id}: Cost=$${b.cost} -> 10% Platform Fee=$${b.commissionAmount} | 90% Net=$${b.vendorPayoutAmount} | Status=${b.payoutStatus}`);
});
console.log('[PASS] Test 2: Seed bookings verified with 10% platform commission and 90% vendor payout.');

// --------------------------------------------------------------------------
// TEST 3: Trigger 8 Auto-Booking Generation on Event Confirmation
// --------------------------------------------------------------------------
console.log('\n[TEST 3] Testing Trigger 8: Auto-Booking Generation on Event Confirmation...');
const newEvent = ds.create('events', 'EVT', {
  name: 'International Tech Expo 2026',
  type: 'Conference',
  date: '2026-09-15',
  venue: 'Grand Ballroom',
  budget: 60000,
  status: 'pending',
  client: 'Global Tech Inc',
  clientId: 'U004',
  vendor: 'Elite Events Co.',
  vendorId: 'V001',
  createdBy: 'client'
});

const bookingsCountBefore = ds.collection('bookings').length;
// Confirm event to fire trigger
ds.update('events', newEvent.id, { status: 'confirmed' });

const bookingsCountAfter = ds.collection('bookings').length;
if (bookingsCountAfter !== bookingsCountBefore + 1) {
  throw new Error('FAILED: Auto-booking was not generated on event confirmation.');
}

const autoBooking = ds.collection('bookings').find((b) => b.eventId === newEvent.id || b.eventName === newEvent.name);
if (!autoBooking) {
  throw new Error('FAILED: Could not find auto-generated booking.');
}

if (autoBooking.cost !== 60000 || autoBooking.commissionRate !== 0.10 || autoBooking.commissionAmount !== 6000 || autoBooking.vendorPayoutAmount !== 54000) {
  throw new Error(`FAILED: Trigger 8 generated incorrect amounts: cost=$${autoBooking.cost}, comm=$${autoBooking.commissionAmount} (expected 6000), vendor=$${autoBooking.vendorPayoutAmount} (expected 54000)`);
}

if (autoBooking.payoutStatus !== 'pending') {
  throw new Error(`FAILED: Newly auto-generated booking payoutStatus is '${autoBooking.payoutStatus}', expected 'pending'`);
}
console.log(`[PASS] Test 3: Trigger 8 generated Booking ${autoBooking.id}: Total=$${autoBooking.cost}, Platform Fee (10%)=$${autoBooking.commissionAmount}, Vendor Payout (90%)=$${autoBooking.vendorPayoutAmount}, Payout Status=${autoBooking.payoutStatus}`);

// --------------------------------------------------------------------------
// TEST 4: Manual Booking Creation via BookingsService
// --------------------------------------------------------------------------
console.log('\n[TEST 4] Testing Manual Booking Creation via BookingsService...');
const bookingsService = new BookingsService(ds);
const createdBooking = bookingsService.create({
  eventName: 'Summer Charity Gala',
  client: 'Emily Carter',
  clientId: 'U004',
  vendor: 'Aurora Event Studio',
  vendorId: 'V002',
  cost: 35000,
  status: 'Confirmed'
});

if (createdBooking.commissionAmount !== 3500 || createdBooking.vendorPayoutAmount !== 31500 || createdBooking.payoutStatus !== 'pending') {
  throw new Error(`FAILED: Manual booking creation failed commission split: comm=$${createdBooking.commissionAmount}, vendor=$${createdBooking.vendorPayoutAmount}`);
}
console.log(`[PASS] Test 4: BookingsService created Booking ${createdBooking.id}: Cost=$${createdBooking.cost} -> 10% Fee=$${createdBooking.commissionAmount}, 90% Net=$${createdBooking.vendorPayoutAmount}`);

// --------------------------------------------------------------------------
// TEST 5: Commission Ledger Aggregations & Query Filters
// --------------------------------------------------------------------------
console.log('\n[TEST 5] Testing Commission Ledger Aggregations & Query Filters...');
const fullLedger = bookingsService.findCommissions();
console.log('       Ledger Summary:', fullLedger.summary);

if (fullLedger.summary.platformCommissionRate !== 0.10) {
  throw new Error(`FAILED: Ledger platformCommissionRate is ${fullLedger.summary.platformCommissionRate}`);
}

const sumGross = fullLedger.items.reduce((s, b) => s + b.cost, 0);
const sumComm = fullLedger.items.reduce((s, b) => s + b.commissionAmount, 0);
const sumVendor = fullLedger.items.reduce((s, b) => s + b.vendorPayoutAmount, 0);

if (fullLedger.summary.totalGrossVolume !== sumGross || fullLedger.summary.platformCommissionEarned !== sumComm || fullLedger.summary.totalVendorPayoutObligations !== sumVendor) {
  throw new Error('FAILED: Ledger summary totals do not match item sums.');
}

// Test filter by pending payoutStatus
const pendingLedger = bookingsService.findCommissions({ payoutStatus: 'pending' });
if (pendingLedger.items.some((b) => b.payoutStatus !== 'pending')) {
  throw new Error('FAILED: Pending filter returned non-pending bookings.');
}
console.log(`[PASS] Test 5: Commission ledger aggregated ${fullLedger.items.length} bookings ($${fullLedger.summary.totalGrossVolume} gross -> $${fullLedger.summary.platformCommissionEarned} platform revenue, $${fullLedger.summary.totalVendorPayoutObligations} vendor share).`);

// --------------------------------------------------------------------------
// TEST 6: Payout Settlement Flow (Admin Release Funds)
// --------------------------------------------------------------------------
console.log('\n[TEST 6] Testing Admin Payout Settlement Action (Release Funds)...');
const bookingToSettle = createdBooking.id;
const settledResult = bookingsService.settlePayout(bookingToSettle, {
  settledBy: 'U001',
  note: 'Direct ACH payout transfer released by Admin'
});

if (settledResult.payoutStatus !== 'settled' || !settledResult.settledAt || settledResult.settledBy !== 'U001') {
  throw new Error(`FAILED: Payout settlement failed: status=${settledResult.payoutStatus}, settledAt=${settledResult.settledAt}, settledBy=${settledResult.settledBy}`);
}

// Check audit log entry
const snapLogs = ds.snapshot().activityLogs;
const payoutLog = snapLogs.find((l) => l.action === 'PAYOUT_SETTLED' && l.entityId === bookingToSettle);
if (!payoutLog) {
  throw new Error('FAILED: PAYOUT_SETTLED audit log entry was not recorded.');
}
console.log(`[PASS] Test 6: Booking ${bookingToSettle} settled successfully at ${settledResult.settledAt} by ${settledResult.settledBy}. Audit log verified.`);

// --------------------------------------------------------------------------
// TEST 7: Analytics Service Executive Financial Summary
// --------------------------------------------------------------------------
console.log('\n[TEST 7] Testing AnalyticsService Executive Financial Summary...');
const analyticsService = new AnalyticsService(ds);
const analyticsSummary = analyticsService.summary();
const finSummary = analyticsService.financialSummary();

if (analyticsSummary.platformCommissionEarned <= 0 || analyticsSummary.totalVendorPayouts <= 0) {
  throw new Error('FAILED: AnalyticsService did not compute commission and vendor payout metrics.');
}
if (finSummary.pendingVendorPayouts + finSummary.settledVendorPayouts !== finSummary.totalVendorPayoutObligations) {
  throw new Error('FAILED: Pending vendor payouts + settled vendor payouts != total vendor payouts in AnalyticsService.');
}
console.log(`[PASS] Test 7: AnalyticsService Financial Summary:
       Gross Volume: $${finSummary.grossBookingVolume}
       Platform Commission Earned (10%): $${finSummary.platformCommissionEarned}
       Vendor Payouts Pending (90%): $${finSummary.pendingVendorPayouts}
       Vendor Payouts Settled (90%): $${finSummary.settledVendorPayouts}`);

// --------------------------------------------------------------------------
// TEST 8: Vendor-Scoped Payouts (VendorsService)
// --------------------------------------------------------------------------
console.log('\n[TEST 8] Testing Vendor-Scoped Payouts (VendorsService.getVendorPayouts)...');
const vendorsService = new VendorsService(ds);
const v001Payouts = vendorsService.getVendorPayouts('V001');

if (!v001Payouts || v001Payouts.vendorId !== 'V001') {
  throw new Error('FAILED: VendorsService.getVendorPayouts did not return V001 payouts.');
}

if (v001Payouts.totalEarnedGross <= 0 || v001Payouts.netPayoutAmount <= 0 || v001Payouts.platformFeeDeducted <= 0) {
  throw new Error('FAILED: Vendor V001 financial calculations are invalid.');
}
console.log(`[PASS] Test 8: Vendor V001 Financials:
       Vendor: ${v001Payouts.vendorName}
       Gross Earned: $${v001Payouts.totalEarnedGross}
       10% Platform Fee Deducted: -$${v001Payouts.platformFeeDeducted}
       90% Net Payout: $${v001Payouts.netPayoutAmount}
       Pending: $${v001Payouts.pendingPayouts} | Settled: $${v001Payouts.settledPayouts}`);

// --------------------------------------------------------------------------
// TEST 9: Disk Persistence & Hot Restart Verification
// --------------------------------------------------------------------------
console.log('\n[TEST 9] Simulating Server Restart (Reading from database.json)...');
const dsRestarted = new DataService();
dsRestarted.onModuleInit();

const restartedBooking = dsRestarted.find('bookings', bookingToSettle);
if (!restartedBooking || restartedBooking.payoutStatus !== 'settled' || restartedBooking.commissionAmount !== 3500) {
  throw new Error('FAILED: Settled booking commission data did not persist across DataService instances.');
}
console.log(`[PASS] Test 9: Successfully verified persistent commission state for ${restartedBooking.id} after simulated server restart.`);

console.log('\n================================================================');
console.log('ALL COMMISSION REVENUE MODEL TESTS PASSED (9/9)!');
console.log('================================================================');
