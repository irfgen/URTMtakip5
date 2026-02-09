# URTM Takip Restart Script
# Safely stops and restarts development servers

param(
    [switch]$Quick,
    [switch]$Verbose
)

function Write-Status {
    param($Message, $Color = "White")
    if ($Verbose -or -not $Quick) {
        Write-Host $Message -ForegroundColor $Color
    }
}

function Stop-DevServers {
    Write-Status "🛑 Stopping development servers..." "Red"
    
    try {
        $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
        if ($nodeProcesses) {
            Write-Status "Found $($nodeProcesses.Count) Node.js process(es)" "Yellow"
            $nodeProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
            Write-Status "✅ All Node.js processes stopped" "Green"
        } else {
            Write-Status "ℹ️  No Node.js processes were running" "Cyan"
        }
    } catch {
        Write-Status "⚠️  Error stopping processes: $($_.Exception.Message)" "Yellow"
    }
}

function Start-DevServers {
    Write-Status "🚀 Starting development servers..." "Green"
    
    # Wait a moment to ensure ports are freed
    Start-Sleep -Seconds 2
    
    # Start development servers
    try {
        if ($Quick) {
            Start-Process -FilePath "cmd" -ArgumentList "/c", "npm run dev" -WindowStyle Normal
            Write-Status "✅ Development servers started in background!" "Green"
        } else {
            & npm run dev
        }
        Write-Status "🌐 Frontend: http://localhost:5173" "Blue"
        Write-Status "🔧 Backend: http://localhost:5000" "Magenta"
    } catch {
        Write-Status "❌ Error starting servers: $($_.Exception.Message)" "Red"
        exit 1
    }
}

function Main {
    $scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
    Set-Location $scriptPath
    
    if (-not $Quick) {
        Write-Host "==========================================" -ForegroundColor Cyan
        Write-Host "     URTM Takip - Restart Manager       " -ForegroundColor Yellow
        Write-Host "==========================================" -ForegroundColor Cyan
    }
    
    Stop-DevServers
    Start-DevServers
    
    if (-not $Quick) {
        Write-Host ""
        Write-Status "🎉 Restart completed successfully!" "Green"
    }
}

# Run the main function
Main
