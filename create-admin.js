// Create admin user script
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('Creating admin user...');
    
    const passwordHash = bcrypt.hashSync('admin123', 10);
    
    const admin = await prisma.user.upsert({
      where: { email: 'admin@realtycollective.com' },
      update: {},
      create: {
        name: 'Super Admin',
        email: 'admin@realtycollective.com',
        passwordHash: passwordHash,
        role: 'SUPER_ADMIN',
        roleRank: 100,
        status: 'ACTIVE',
        emailVerified: true,
        emailVerifiedAt: new Date(),
        sponsorCode: 'ADMIN001',
        path: [],
        lastActive: new Date(),
      },
    });
    
    console.log('');
    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('Login credentials:');
    console.log('Email: admin@realtycollective.com');
    console.log('Password: admin123');
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('❌ Error:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
