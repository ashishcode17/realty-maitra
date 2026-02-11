// Fix admin user completely
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function fixAdmin() {
  try {
    console.log('Fixing admin user...');
    
    const passwordHash = bcrypt.hashSync('admin123', 10);
    
    const admin = await prisma.user.upsert({
      where: { email: 'admin@realtycollective.com' },
      update: {
        name: 'Super Admin',
        passwordHash: passwordHash,
        role: 'SUPER_ADMIN',
        roleRank: 100,
        status: 'ACTIVE',
        emailVerified: true,
        emailVerifiedAt: new Date(),
        sponsorCode: 'ADMIN001',
        path: [],
      },
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
    
    // Verify password works
    const testPassword = bcrypt.compareSync('admin123', admin.passwordHash);
    
    console.log('');
    console.log('✅ Admin user fixed!');
    console.log('Name:', admin.name);
    console.log('Email:', admin.email);
    console.log('Status:', admin.status);
    console.log('Password test:', testPassword ? '✅ CORRECT' : '❌ WRONG');
    console.log('');
    console.log('Login with:');
    console.log('Email: admin@realtycollective.com');
    console.log('Password: admin123');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) console.error('Code:', error.code);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdmin();
