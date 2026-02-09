# URTM Takip Development Manager
# PowerShell script for managing development environment

$projectRoot = $PSScriptRoot
$frontendPath = Join-Path $projectRoot "frontend"
$backendPath = Join-Path $projectRoot "backend"

function Show-Menu {
    Clear-Host
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "     URTM Takip - Development Manager    " -ForegroundColor Yellow
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1) 🚀 Start Full Development (Frontend + Backend)" -ForegroundColor Green
    Write-Host "2) 🌐 Start Frontend Only" -ForegroundColor Blue
    Write-Host "3) 🔧 Start Backend Only" -ForegroundColor Magenta
    Write-Host "4) 🛑 Stop All Servers" -ForegroundColor Red
    Write-Host "5) 🔄 Restart All Servers" -ForegroundColor Yellow
    Write-Host "6) 📦 Install Dependencies" -ForegroundColor Cyan
    Write-Host "7) 🏗️  Build Frontend" -ForegroundColor Blue
    Write-Host "8) 📊 Check Running Processes" -ForegroundColor White
    Write-Host "9) 🧪 Run Tests" -ForegroundColor DarkYellow
    Write-Host "0) ❌ Exit" -ForegroundColor Red
    Write-Host ""
}

function Start-FullDevelopment {
    Write-Host "Starting Full Development Environment..." -ForegroundColor Green
    
    # Start Backend
    Start-Process -FilePath "cmd" -ArgumentList "/c", "cd /d `"$backendPath`" && npm run dev" -WindowStyle Normal
    Start-Sleep -Seconds 3
    
    # Start Frontend
    Start-Process -FilePath "cmd" -ArgumentList "/c", "cd /d `"$frontendPath`" && npm run dev" -WindowStyle Normal
    
    Write-Host "✅ Both servers are starting..." -ForegroundColor Green
    Write-Host "🌐 Frontend: http://localhost:5173" -ForegroundColor Blue
    Write-Host "🔧 Backend: http://localhost:5000" -ForegroundColor Magenta
    
    # Wait a bit and check if processes are running
    Start-Sleep -Seconds 5
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        Write-Host "✅ Servers are running successfully!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Warning: No Node processes detected. Check for errors." -ForegroundColor Yellow
    }
}

function Start-Frontend {
    Write-Host "Starting Frontend Development Server..." -ForegroundColor Blue
    Start-Process -FilePath "cmd" -ArgumentList "/c", "cd /d `"$frontendPath`" && npm run dev" -WindowStyle Normal
    Write-Host "🌐 Frontend is starting at http://localhost:5173" -ForegroundColor Blue
}

function Start-Backend {
    Write-Host "Starting Backend Development Server..." -ForegroundColor Magenta
    Start-Process -FilePath "cmd" -ArgumentList "/c", "cd /d `"$backendPath`" && npm run dev" -WindowStyle Normal
    Write-Host "🔧 Backend is starting at http://localhost:5000" -ForegroundColor Magenta
}

function Stop-AllServers {
    Write-Host "Stopping all Node.js processes..." -ForegroundColor Red
    try {
        Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
        Write-Host "✅ All servers stopped successfully!" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  No Node.js processes were running." -ForegroundColor Yellow
    }
}

function Restart-AllServers {
    Write-Host "Restarting all servers..." -ForegroundColor Yellow
    Stop-AllServers
    Start-Sleep -Seconds 2
    Start-FullDevelopment
    Write-Host "✅ Servers restarted successfully!" -ForegroundColor Green
}

function Install-Dependencies {
    Write-Host "Installing dependencies..." -ForegroundColor Cyan
    
    Write-Host "📦 Installing backend dependencies..." -ForegroundColor Cyan
    Set-Location $backendPath
    npm install
    
    Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Cyan
    Set-Location $frontendPath
    npm install
    
    Set-Location $projectRoot
    Write-Host "✅ All dependencies installed!" -ForegroundColor Green
}

function Build-Frontend {
    Write-Host "Building frontend for production..." -ForegroundColor Blue
    Set-Location $frontendPath
    npm run build
    Set-Location $projectRoot
    Write-Host "✅ Build completed!" -ForegroundColor Green
}

function Show-Processes {
    Write-Host "Current Node.js processes:" -ForegroundColor White
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        $nodeProcesses | Format-Table Id, ProcessName, CPU, WorkingSet, StartTime -AutoSize
    } else {
        Write-Host "No Node.js processes are currently running." -ForegroundColor Yellow
    }
}

function Run-Tests {
    Write-Host "Running tests..." -ForegroundColor DarkYellow
    Write-Host "1) Backend Tests"
    Write-Host "2) Frontend Tests"
    Write-Host "3) Both"
    $testChoice = Read-Host "Select test suite (1-3)"
    
    switch ($testChoice) {
        "1" {
            Set-Location $backendPath
            npm test
        }
        "2" {
            Set-Location $frontendPath
            npm test
        }
        "3" {
            Write-Host "Running backend tests..." -ForegroundColor DarkYellow
            Set-Location $backendPath
            npm test
            Write-Host "Running frontend tests..." -ForegroundColor DarkYellow
            Set-Location $frontendPath
            npm test
        }
    }
    Set-Location $projectRoot
}

# Main loop
do {
    Show-Menu
    $choice = Read-Host "Select an option (0-9)"
    
    switch ($choice) {
        "1" { Start-FullDevelopment }
        "2" { Start-Frontend }
        "3" { Start-Backend }
        "4" { Stop-AllServers }
        "5" { Restart-AllServers }
        "6" { Install-Dependencies }
        "7" { Build-Frontend }
        "8" { Show-Processes }
        "9" { Run-Tests }
        "0" { 
            Write-Host "Goodbye! 👋" -ForegroundColor Cyan
            exit 
        }
        default { 
            Write-Host "Invalid option. Please try again." -ForegroundColor Red
            Start-Sleep -Seconds 2
        }
    }
    
    if ($choice -ne "0") {
        Write-Host ""
        Read-Host "Press Enter to continue..."
    }
} while ($choice -ne "0")
