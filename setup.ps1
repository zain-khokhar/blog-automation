# Quick Setup Script for Blog Automation

Write-Host "🚀 Setting up Blog Automation - Phase 1..." -ForegroundColor Cyan

# Create uploads directory
Write-Host "`n📁 Creating uploads directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "public\uploads\media" | Out-Null
Write-Host "✓ Uploads directory created" -ForegroundColor Green

# Check for .env.local
Write-Host "`n🔧 Checking environment configuration..." -ForegroundColor Yellow
if (-Not (Test-Path ".env.local")) {
    Write-Host "⚠ .env.local not found!" -ForegroundColor Red
    Write-Host "Creating .env.local template..." -ForegroundColor Yellow
    
    $envContent = @"
# MongoDB Atlas Connection String
# Replace with your actual MongoDB Atlas URI
# Get it from: https://cloud.mongodb.com
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/blogautomation?retryWrites=true&w=majority
"@
    
    Set-Content -Path ".env.local" -Value $envContent
    Write-Host "✓ Created .env.local template" -ForegroundColor Green
    Write-Host "⚠ IMPORTANT: Edit .env.local and add your MongoDB Atlas URI!" -ForegroundColor Red
} else {
    Write-Host "✓ .env.local found" -ForegroundColor Green
}

# Check MongoDB URI
$envContent = Get-Content ".env.local" -Raw
if ($envContent -match "mongodb\+srv://username:password") {
    Write-Host "⚠ WARNING: MongoDB URI not configured! Please update .env.local" -ForegroundColor Red
} else {
    Write-Host "✓ MongoDB URI configured" -ForegroundColor Green
}

Write-Host "`n✨ Setup complete!" -ForegroundColor Cyan
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Configure MongoDB URI in .env.local (if not done)"
Write-Host "2. Run: npm run dev"
Write-Host "3. Open: http://localhost:3000"
Write-Host "`nFor detailed instructions, see PHASE1_SETUP.md" -ForegroundColor Cyan
