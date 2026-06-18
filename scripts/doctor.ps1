$ErrorActionPreference = "Stop"

function Step($name) {
  Write-Host ""
  Write-Host "== $name ==" -ForegroundColor Cyan
}

function Require-Command($name) {
  $cmd = Get-Command $name -ErrorAction SilentlyContinue
  if (-not $cmd) {
    throw "Required command not found: $name"
  }
  Write-Host "$name -> $($cmd.Source)"
}

function Require-Path($path) {
  if (-not (Test-Path -LiteralPath $path)) {
    throw "Required path not found: $path"
  }
  Write-Host "found $path"
}

Step "runtime"
Require-Command node
Require-Command npm
Require-Command npx
node --version
npm --version

Step "workspace files"
Require-Path "package.json"
Require-Path "package-lock.json"
Require-Path "apps\web\package.json"
Require-Path "apps\api\package.json"
Require-Path "packages\shared\package.json"
Require-Path "apps\api\prisma\schema.prisma"

Step "npm scripts"
$pkg = Get-Content -LiteralPath "package.json" -Raw | ConvertFrom-Json
$requiredScripts = @("dev", "build", "test", "lint", "db:validate", "db:generate", "db:seed")
foreach ($script in $requiredScripts) {
  if (-not $pkg.scripts.PSObject.Properties.Name.Contains($script)) {
    throw "Missing npm script: $script"
  }
  Write-Host "script $script -> $($pkg.scripts.$script)"
}

Step "environment hints"
if (Test-Path -LiteralPath ".env") {
  Write-Host "found .env"
} elseif (Test-Path -LiteralPath ".env.example") {
  Write-Host "found .env.example, but .env is missing"
} else {
  Write-Host "no .env or .env.example found"
}

Write-Host ""
Write-Host "doctor passed for D:\mianshi" -ForegroundColor Green
