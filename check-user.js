// Check if admin user exists
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@realtycollective.com' }
    });
    
    if (user) {
      console.log('✅ User found!');
      console.log('Email:', user.email);
      console.log('Name:', user.name);
      console.log('Role:', user.role);
      console.log('Status:', user.status);
      console.log('Email Verified:', user.emailVerified);
      console.log('Password Hash:', user.passwordHash.substring(0, 20) + '...');
    } else {
      console.log('❌ User NOT found!');
      console.log('Creating user now...');
      
      const bcrypt = require('bcryptjs');
      const passwordHash = bcrypt.hashSync('admin123', 10);
      
      const newUser = await prisma.user.create({
        data: {
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
      
      console.log('✅ User created!');
      console.log('Email:', newUser.email);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
