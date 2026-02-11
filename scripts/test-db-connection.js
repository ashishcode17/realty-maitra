/**
 * Test database connection. Run: node scripts/test-db-connection.js
 * (from project root, with .env present)
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Testing connection to:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@') || '(no DATABASE_URL)');
  try {
    await prisma.$connect();
    console.log('SUCCESS: Connected to database.');
  } catch (e) {
    console.error('FAILED:', e.code || e.name, e.message);
    if (e.code === 'P1001') {
      console.log('\n--- Try this ---');
      console.log('1. In Neon.tech dashboard, copy the "Direct connection" string (not Pooled).');
      console.log('2. Put it in .env as DATABASE_URL (must end with ?sslmode=require).');
      console.log('3. If your password has special chars (@ # % etc), URL-encode them.');
      console.log('4. Turn off VPN / try another network (e.g. phone hotspot).');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}
main();
