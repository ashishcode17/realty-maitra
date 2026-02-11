// Test password comparison
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function testPassword() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@realtycollective.com' }
    });
    
    if (!user) {
      console.log('❌ User not found!');
      return;
    }
    
    console.log('Testing password: admin123');
    console.log('Stored hash:', user.passwordHash.substring(0, 30) + '...');
    
    // Test with bcrypt.compareSync (what the app uses)
    const isValid = bcrypt.compareSync('admin123', user.passwordHash);
    console.log('Password match (compareSync):', isValid);
    
    // Test with bcrypt.compare (async)
    const isValidAsync = await bcrypt.compare('admin123', user.passwordHash);
    console.log('Password match (compare async):', isValidAsync);
    
    if (!isValid) {
      console.log('');
      console.log('❌ Password doesn\'t match!');
      console.log('Creating new user with correct password...');
      
      const newHash = bcrypt.hashSync('admin123', 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash }
      });
      
      console.log('✅ Password updated!');
      console.log('Try login again with: admin@realtycollective.com / admin123');
    } else {
      console.log('');
      console.log('✅ Password is correct!');
      console.log('The issue might be in the login API route.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testPassword();
