Write-Host "🚀 Installing CallNest - Multi-tenant Call Conversion Platform" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion detected" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    Write-Host "   Visit: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check Node.js version
$nodeMajorVersion = (node --version).Split('.')[0].Substring(1)
if ([int]$nodeMajorVersion -lt 18) {
    Write-Host "❌ Node.js version 18+ is required. Current version: $nodeVersion" -ForegroundColor Red
    exit 1
}

# Install root dependencies
Write-Host "📦 Installing root dependencies..." -ForegroundColor Yellow
npm install

# Install backend dependencies
Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
Set-Location backend
npm install
Set-Location ..

# Install frontend dependencies
Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location frontend
npm install
Set-Location ..

# Install widget dependencies
Write-Host "📦 Installing widget dependencies..." -ForegroundColor Yellow
Set-Location widget
npm install
Set-Location ..

Write-Host ""
Write-Host "🎉 Installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Set up your database (PostgreSQL + Redis)" -ForegroundColor White
Write-Host "2. Copy backend/env.example to backend/.env and configure it" -ForegroundColor White
Write-Host "3. Run database setup: npm run db:setup" -ForegroundColor White
Write-Host "4. Start development: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "🌐 The application will be available at:" -ForegroundColor Cyan
Write-Host "   - Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   - Backend: http://localhost:3001" -ForegroundColor White
Write-Host "   - API Docs: http://localhost:3001/api/docs" -ForegroundColor White
Write-Host ""
Write-Host "📚 For more information, see README.md" -ForegroundColor Cyan
