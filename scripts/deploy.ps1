# Build and deploy Jupiter AI UI to Google App Engine.
# Usage: .\scripts\deploy.ps1 [-ProjectId jupiter-ai-498513]

param(
    [string]$ProjectId = "jupiter-ai-498513"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Push-Location $root

try {
    Write-Host "Building production bundle (VITE_API_URL from .env.production)..."
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "npm run build failed" }

    Write-Host "Deploying to App Engine service 'ui' (project: $ProjectId)..."
    gcloud app deploy app.yaml --project=$ProjectId --quiet
    if ($LASTEXITCODE -ne 0) { throw "gcloud app deploy failed" }

    Write-Host ""
    Write-Host "UI:  https://ui-dot-$ProjectId.uc.r.appspot.com"
    Write-Host "API: https://$ProjectId.uc.r.appspot.com"
}
finally {
    Pop-Location
}
