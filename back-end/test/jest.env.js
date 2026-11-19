// Jest runs against its own PostgreSQL database (checkmate_test), never the
// app's database. Override with TEST_DATABASE_URL if yours lives elsewhere.
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL || 'postgresql://checkmate:checkmate_dev@localhost:5432/checkmate_test?schema=public';
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
