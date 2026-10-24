param(
    [string]$ThreePRepo = (Join-Path $PSScriptRoot '..\..\..'),
    [ValidateSet('win-arm64', 'win-x64')][string]$Runtime = $(if ([System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture -eq 'Arm64') { 'win-arm64' } else { 'win-x64' }),
    [switch]$SkipInstall
)
$ErrorActionPreference = 'Stop'
$ThreePRepo = (Resolve-Path $ThreePRepo).Path
if (-not (Test-Path (Join-Path $ThreePRepo 'lib\msal-browser\package.json'))) { throw 'ThreePRepo must point to an MSAL.js 3P checkout.' }
Push-Location $ThreePRepo
try {
    if (-not $SkipInstall) {
        & npm.cmd install --ignore-scripts --package-lock=false --no-audit --no-fund
        if ($LASTEXITCODE -ne 0) { throw '3P dependency installation failed.' }
    }
    & npm.cmd run build --workspace=@azure/msal-common
    if ($LASTEXITCODE -ne 0) { throw 'msal-common build failed.' }
    & npm.cmd run build:debug --workspace=@azure/msal-browser
    if ($LASTEXITCODE -ne 0) { throw 'msal-browser build failed.' }
    & npm.cmd run build --workspace=@azure/msal-bridge
    if ($LASTEXITCODE -ne 0) { throw 'msal-bridge build failed.' }
    Copy-Item (Join-Path $ThreePRepo 'lib\msal-browser\lib\msal-browser.js') (Join-Path $PSScriptRoot 'web\msal-browser.js') -Force
} finally { Pop-Location }
& dotnet run --project (Join-Path $PSScriptRoot 'bridge\test\NativeBridgeTests\NativeBridgeTests.csproj')
if ($LASTEXITCODE -ne 0) { throw 'Native bridge checks failed.' }
& dotnet run --project (Join-Path $PSScriptRoot 'bridge\test\WebView2Checks\WebView2Checks.csproj')
if ($LASTEXITCODE -ne 0) { throw 'WebView2 binding checks failed.' }
& node --test (Join-Path $PSScriptRoot 'test\bridge.spec.cjs')
if ($LASTEXITCODE -ne 0) { throw 'JavaScript bridge tests failed.' }
& dotnet run --project (Join-Path $PSScriptRoot 'test\NativeBridgeTests.csproj')
if ($LASTEXITCODE -ne 0) { throw 'Native protocol checks failed.' }
& dotnet run --project (Join-Path $PSScriptRoot 'test\WamChecks\WamChecks.csproj')
if ($LASTEXITCODE -ne 0) { throw 'Legacy account-selection checks failed.' }
& (Join-Path $PSScriptRoot 'test\RunChecks.ps1')
& dotnet build (Join-Path $PSScriptRoot 'native\NativeBridgeTokenSample.csproj') -r $Runtime
if ($LASTEXITCODE -ne 0) { throw 'Windows host build failed.' }
Write-Output "Prepared Windows bridge POC for $Runtime. See README.md for broker configuration and native adapter deployment; Run.ps1 without -Broker selects the legacy harness."