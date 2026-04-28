# Detects which E2E suites are affected by the current PR.
# Sets isOutput ADO variables for each library. Non-PR builds and shared-infra
# changes default all flags to true (fail-open).
#
# Parameters:
#   -Repo3pPath  Path to the 3P repo root. Defaults to the current directory.
#   -Repo1pPath  Path to the 1P repo root. Optional; provide when the 1P repo
#                is checked out (i.e. in 1p-e2e.yml) to also gate msal-browser-1p.

param(
    [string]$Repo3pPath = $PWD,
    [string]$Repo1pPath = ""
)

$runBrowser = $runNode = $runReact = $runAngular = $run1p = $true

if ($env:SYSTEM_PULLREQUEST_TARGETBRANCH) {
    $target = $env:SYSTEM_PULLREQUEST_TARGETBRANCH -replace '^refs/heads/', ''
    Write-Host "PR build: diffing against origin/$target"

    Set-Location $Repo3pPath
    git fetch origin $target
    if ($LASTEXITCODE -ne 0) { throw "git fetch failed in 3P repo" }
    $changed3p = git diff --name-only "origin/$target...HEAD"

    $changed1p = @()
    if ($Repo1pPath) {
        Set-Location $Repo1pPath
        git fetch origin $target 2>$null  # branch may not exist in 1P repo; non-fatal
        $changed1p = if ($LASTEXITCODE -eq 0) {
            git diff --name-only "origin/$target...HEAD"
        } else { @() }
    }

    Write-Host "Changed 3P files:`n$($changed3p -join "`n")"
    if ($changed1p) { Write-Host "Changed 1P files:`n$($changed1p -join "`n")" }

    # Shared infra changes in either repo → run everything
    $sharedChanged = (
        ($changed3p | Where-Object { $_ -match '^\.pipelines/' -or $_ -match '^samples/e2eTestUtils/' }).Count -gt 0 -or
        ($changed1p | Where-Object { $_ -match '^\.pipelines/' }).Count -gt 0
    )

    if ($sharedChanged) {
        Write-Host "Shared infra changed — running all test suites"
    } else {
        $changedCommon  = ($changed3p | Where-Object { $_ -match '^lib/msal-common/' }).Count -gt 0
        $changedBrowser = ($changed3p | Where-Object { $_ -match '^lib/msal-browser/'  -or $_ -match '^samples/msal-browser-samples/' }).Count -gt 0
        $changedNode    = ($changed3p | Where-Object { $_ -match '^lib/msal-node/'     -or $_ -match '^samples/msal-node-samples/' }).Count -gt 0
        $changedReact   = ($changed3p | Where-Object { $_ -match '^lib/msal-react/'    -or $_ -match '^samples/msal-react-samples/' }).Count -gt 0
        $changedAngular = ($changed3p | Where-Object { $_ -match '^lib/msal-angular/'  -or $_ -match '^samples/msal-angular-samples/' }).Count -gt 0
        $changed1pPkg   = ($changed1p  | Where-Object { $_ -match '^msal-browser-1p/'  -or $_ -match '^samples/' }).Count -gt 0

        $runBrowser = $changedCommon -or $changedBrowser
        $runNode    = $changedCommon -or $changedNode
        $runReact   = $changedCommon -or $changedBrowser -or $changedReact
        $runAngular = $changedCommon -or $changedBrowser -or $changedAngular
        $run1p      = $changedCommon -or $changedBrowser -or $changed1pPkg

        Write-Host "Changed: common=$changedCommon browser=$changedBrowser node=$changedNode react=$changedReact angular=$changedAngular 1p=$changed1pPkg"
    }
} else {
    Write-Host "Non-PR build — running all test suites"
}

Write-Host "Run: browser=$runBrowser node=$runNode react=$runReact angular=$runAngular browser-1p=$run1p"
Write-Host "##vso[task.setvariable variable=runMsalBrowser;isOutput=true]$($runBrowser.ToString().ToLower())"
Write-Host "##vso[task.setvariable variable=runMsalNode;isOutput=true]$($runNode.ToString().ToLower())"
Write-Host "##vso[task.setvariable variable=runMsalReact;isOutput=true]$($runReact.ToString().ToLower())"
Write-Host "##vso[task.setvariable variable=runMsalAngular;isOutput=true]$($runAngular.ToString().ToLower())"
Write-Host "##vso[task.setvariable variable=runMsalBrowser1p;isOutput=true]$($run1p.ToString().ToLower())"
