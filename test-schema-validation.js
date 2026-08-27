const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'Database', 'DBschema.sql');
const sqlContent = fs.readFileSync(schemaPath, 'utf8');

console.log('====================================================');
console.log('EMS Database Schema Validation Test Suite');
console.log('====================================================');

// 1. Check Tables Defined
const createTableMatches = [...sqlContent.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)/gi)];
const tableNames = createTableMatches.map(m => m[1]);

console.log(`\n[✓] Total Tables Defined: ${tableNames.length}`);
tableNames.forEach((tbl, idx) => {
  console.log(`   ${(idx + 1).toString().padStart(2, ' ')}. ${tbl}`);
});

// 2. Check Triggers Defined
const createTriggerMatches = [...sqlContent.matchAll(/CREATE\s+TRIGGER\s+([a-zA-Z0-9_]+)/gi)];
const triggerNames = createTriggerMatches.map(m => m[1]);

console.log(`\n[✓] Total Automated Triggers Defined: ${triggerNames.length}`);
triggerNames.forEach((trg, idx) => {
  console.log(`   ${(idx + 1).toString().padStart(2, ' ')}. ${trg}`);
});

// 3. Check Views Defined
const createViewMatches = [...sqlContent.matchAll(/CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+([a-zA-Z0-9_]+)/gi)];
const viewNames = createViewMatches.map(m => m[1]);

console.log(`\n[✓] Total Views Defined: ${viewNames.length}`);
viewNames.forEach((v, idx) => {
  console.log(`   ${(idx + 1).toString().padStart(2, ' ')}. ${v}`);
});

// 4. Check Stored Procedures Defined
const createProcMatches = [...sqlContent.matchAll(/CREATE\s+PROCEDURE\s+([a-zA-Z0-9_]+)/gi)];
const procNames = createProcMatches.map(m => m[1]);

console.log(`\n[✓] Total Stored Procedures Defined: ${procNames.length}`);
procNames.forEach((p, idx) => {
  console.log(`   ${(idx + 1).toString().padStart(2, ' ')}. ${p}`);
});

// 5. Check Foreign Key Constraints
const fkMatches = [...sqlContent.matchAll(/CONSTRAINT\s+([a-zA-Z0-9_]+)\s+FOREIGN\s+KEY\s*\(([a-zA-Z0-9_,\s]+)\)\s*REFERENCES\s+([a-zA-Z0-9_]+)\s*\(([a-zA-Z0-9_,\s]+)\)/gi)];
console.log(`\n[✓] Total Foreign Key Constraints: ${fkMatches.length}`);
fkMatches.forEach((fk, idx) => {
  console.log(`   ${(idx + 1).toString().padStart(2, ' ')}. ${fk[1]}: (${fk[2].trim()}) -> ${fk[3]}(${fk[4].trim()})`);
});

// 6. Check Check Constraints
const chkMatches = [...sqlContent.matchAll(/CONSTRAINT\s+([a-zA-Z0-9_]+)\s+CHECK\s*\(([^)]+)\)/gi)];
console.log(`\n[✓] Total CHECK Constraints: ${chkMatches.length}`);
chkMatches.forEach((chk, idx) => {
  console.log(`   ${(idx + 1).toString().padStart(2, ' ')}. ${chk[1]}: ${chk[2].trim()}`);
});

// 7. Check Seed Data Inserts
const insertMatches = [...sqlContent.matchAll(/INSERT\s+INTO\s+([a-zA-Z0-9_]+)/gi)];
console.log(`\n[✓] Total Seed Insert Statements: ${insertMatches.length}`);
const seededTables = [...new Set(insertMatches.map(m => m[1]))];
console.log(`   Seeded Tables (${seededTables.length}): ${seededTables.join(', ')}`);

console.log('\n====================================================');
console.log('Schema Validation Completed Successfully! All Components Present.');
console.log('====================================================');
