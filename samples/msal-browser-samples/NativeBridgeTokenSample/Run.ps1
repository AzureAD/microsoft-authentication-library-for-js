param(
    [ValidateSet('win-arm64', 'win-x64')][string]$Runtime = $(if ([System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture -eq 'Arm64') { 'win-arm64' } else { 'win-x64' }),
    [switch]$Broker,
    [string]$OneAuthAdapterRuntimeDirectory
)
$ErrorActionPreference = 'Stop'
$configurations = if ($Broker) { @('brokersettings.json', 'oneauthsettings.json') } else { @('appsettings.json') }
foreach ($configuration in $configurations) {
    if (-not (Test-Path (Join-Path $PSScriptRoot $configuration))) { throw "Configure $configuration using its example. See README.md." }
}
if (-not (Test-Path (Join-Path $PSScriptRoot 'web\msal-browser.js'))) { throw 'Run Prepare.ps1 before launching.' }
$runArguments = @('run', '--project', (Join-Path $PSScriptRoot 'native\NativeBridgeTokenSample.csproj'), '-r', $Runtime)
if ($Broker) {
    if (-not $OneAuthAdapterRuntimeDirectory -or -not [System.IO.Path]::IsPathFullyQualified($OneAuthAdapterRuntimeDirectory) -or
        -not (Test-Path (Join-Path $OneAuthAdapterRuntimeDirectory 'OneAuthWebView2Poc.dll'))) {
        throw 'Broker mode requires an absolute OneAuthAdapterRuntimeDirectory containing the matching real adapter DLL. See README.md.'
    }
    $runArguments += @("-p:OneAuthAdapterRuntimeDirectory=$OneAuthAdapterRuntimeDirectory", '--', '--broker')
}
& dotnet @runArguments
if ($LASTEXITCODE -ne 0) { throw 'Windows bridge sample failed.' }