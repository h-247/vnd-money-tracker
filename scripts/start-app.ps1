$ErrorActionPreference = 'SilentlyContinue'

$appPath = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $appPath

# Query all ports currently in LISTEN state to ensure we never collide
$usedPorts = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty LocalPort -Unique

$port = 3000
while ($usedPorts -contains $port) {
    $port++
}

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  VND Money Tracker (Local Development)" -ForegroundColor Green
Write-Host "  Detected unused port: $port" -ForegroundColor Yellow
Write-Host "  Opening http://localhost:$port in your browser..." -ForegroundColor White
Write-Host "=========================================" -ForegroundColor Cyan

# Open browser when server starts listening
Start-Job -ScriptBlock {
    param($p)
    $attempts = 0
    while ($attempts -lt 40) {
        Start-Sleep -Milliseconds 500
        $conn = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
        if ($conn) {
            Start-Process "http://localhost:$p"
            break
        }
        $attempts++
    }
} -ArgumentList $port | Out-Null

# Run vinext on the free port
npx vinext dev -p $port
