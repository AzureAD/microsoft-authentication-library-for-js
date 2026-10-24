$ErrorActionPreference = 'Stop'
$sample = Split-Path $PSScriptRoot
$captured = [System.Collections.Generic.List[string]]::new()
function dotnet { $captured.AddRange([string[]]$args); $global:LASTEXITCODE = 0 }
function Test-Path { return $true }

& (Join-Path $sample 'Run.ps1') -Broker -Runtime win-x64 -OneAuthAdapterRuntimeDirectory $sample
if ('--broker' -notin $captured -or '-r' -notin $captured -or 'win-x64' -notin $captured -or
    "-p:OneAuthAdapterRuntimeDirectory=$sample" -notin $captured) { throw 'Broker launch arguments were lost.' }
$captured.Clear()
& (Join-Path $sample 'Run.ps1') -Runtime win-x64
if ('--broker' -in $captured -or ($captured | Where-Object { $_ -like '-p:OneAuthAdapterRuntimeDirectory=*' })) {
    throw 'Legacy launch unexpectedly selected the broker adapter.'
}
$captured.Clear()
try {
    & (Join-Path $sample 'Run.ps1') -Broker -Runtime win-x64 -OneAuthAdapterRuntimeDirectory 'relative-runtime'
    throw 'Relative adapter directory was accepted.'
} catch {
    if ($_.Exception.Message -notlike 'Broker mode requires*') { throw }
}
if ($captured.Count) { throw 'Invalid broker deployment reached dotnet.' }
Write-Output 'PASS: portable broker arguments, unchanged legacy mode, and invalid runtime rejection.'