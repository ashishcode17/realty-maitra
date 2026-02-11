# Simple Setup Script for Realty Maitra
# Just run this: .\setup.ps1

Write-Host "`n=== REALTY MAITRA SETUP ===" -ForegroundColor Cyan
Write-Host "`nThis script will help you set up the app.`n" -ForegroundColor Yellow

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    
    $databaseUrl = Read-Host "Enter your DATABASE_URL (from neon.tech or your PostgreSQL connection string)"
    $jwtSecret = Read-Host "Enter a secret key for JWT (or press Enter for default)"
    
    if ([string]::IsNullOrWhiteSpace($jwtSecret)) {
        $jwtSecret = "your-secret-key-change-in-production-12345"
    }
    
    @"
DATABASE_URL="$databaseUrl"
JWT_SECRET="$jwtSecret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
"@ | Out-File -FilePath ".env" -Encoding UTF8
    
    Write-Host "✅ .env file created!" -ForegroundColor Green
} else {
    Write-Host "✅ .env file exists" -ForegroundColor Green
}

# Check DATABASE_URL
$envContent = Get-Content .env -Raw
if ($envContent -notmatch "DATABASE_URL\s*=") {
    Write-Host "❌ DATABASE_URL not found in .env" -ForegroundColor Red
    Write-Host "Please add DATABASE_URL to your .env file" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n📦 Step 1: Generating Prisma client..." -ForegroundColor Cyan
npm run db:generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to generate Prisma client" -ForegroundColor Red
    exit 1
}

Write-Host "`n📦 Step 2: Creating database tables..." -ForegroundColor Cyan
npm run db:migrate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to run migrations" -ForegroundColor Red
    Write-Host "This usually means your DATABASE_URL is incorrect" -ForegroundColor Yellow
    Write-Host "Please check your .env file and try again" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n📦 Step 3: Adding sample data..." -ForegroundColor Cyan
npm run db:seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Seeding failed, but you can continue" -ForegroundColor Yellow
}

Write-Host "`n✅ Setup complete!" -ForegroundColor Green
Write-Host "`n🚀 Starting development server..." -ForegroundColor Cyan
Write-Host "`nThe app will open at: http://localhost:3000" -ForegroundColor Yellow
Write-Host "Login with: admin@realtycollective.com / admin123`n" -ForegroundColor Yellow

npm run dev
