/**
 * Run prisma seed during Vercel build if ALLOW_SEED_ON_DEPLOY=true and ALLOW_SEED_IN_PRODUCTION=true.
 * Add both in Vercel env, deploy once to create DEMO1234 etc. Then you can set ALLOW_SEED_ON_DEPLOY=false.
 */
const { execSync } = require('child_process')
if (process.env.ALLOW_SEED_ON_DEPLOY === 'true' && process.env.ALLOW_SEED_IN_PRODUCTION === 'true') {
  console.log('Running seed (ALLOW_SEED_ON_DEPLOY)...')
  try {
    execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' })
    console.log('Seed done.')
  } catch (e) {
    console.error('Seed failed:', e.message)
    process.exit(1)
  }
}
