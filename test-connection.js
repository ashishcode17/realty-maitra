// Quick database connection test
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set ✅' : 'Missing ❌');
    console.log('');
    
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Try a simple query
    try {
      const userCount = await prisma.user.count();
      console.log(`✅ Database has ${userCount} users`);
      
      if (userCount === 0) {
        console.log('');
        console.log('⚠️  No users found - you need to run: npm run db:seed');
        console.log('   This will create admin user and sample data');
      }
    } catch (queryError) {
      if (queryError.code === 'P2021' || queryError.code === '42P01') {
        console.log('');
        console.log('⚠️  Database tables do not exist yet!');
        console.log('   You need to run: npm run db:migrate');
        console.log('   This will create all the tables');
      } else {
        throw queryError;
      }
    }
    
    await prisma.$disconnect();
    console.log('');
    console.log('✅ Test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ Database connection failed:');
    console.error('Error code:', error.code || 'N/A');
    console.error('Error message:', error.message);
    console.error('');
    
    if (error.code === 'P1001') {
      console.error('This means: Cannot reach database server');
      console.error('');
      console.error('Check:');
      console.error('1. Your DATABASE_URL in .env file');
      console.error('2. Database server is accessible');
      console.error('3. Network/firewall is not blocking');
      console.error('4. Get a new connection string from neon.tech');
    } else if (error.code === 'P1000') {
      console.error('This means: Authentication failed');
      console.error('Check: Your database password in DATABASE_URL');
      console.error('Get a new connection string from neon.tech');
    } else if (error.code === 'P1003') {
      console.error('This means: Database does not exist');
      console.error('Check: Database name in your connection string');
    } else if (error.message.includes('MODULE_NOT_FOUND')) {
      console.error('This means: Prisma client not found');
      console.error('Run: npm run db:generate');
    }
    
    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  }
}

testConnection();
