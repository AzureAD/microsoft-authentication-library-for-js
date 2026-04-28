# Detects which 3P library E2E suites are affected by the current PR.
# Sets isOutput ADO variables: runMsalBrowser, runMsalNode, runMsalReact, runMsalAngular.
# Non-PR builds and shared-infra changes default all flags to true (fail-open).

$runBrowser = $runNode = $runReact = $runAngular = $true

if ($env:SYSTEM_PULLREQUEST_TARGETBRANCH) {
    $target = $env:SYSTEM_PULLREQUEST_TARGETBRANCH -replace '^refs/heads/', ''
    Write-Host "PR build: diffing against origin/$target"
    git fetch origin $target
    if ($LASTEXITCODE -ne 0) { throw "git fetch failed" }

    $changed = git diff --name-only "origin/$target...HEAD"
    Write-Host "Changed files:`n$($changed -join "`n")"

    $sharedChanged = ($changed | Where-Object {
        $_ -match '^samples/e2eTestUtils/' -or $_ -match '^\.pipelines/'
    }).Count -gt 0

    if ($sharedChanged) {
        Write-Host "Shared infra changed — running all test suites"
    } else {
        $changedCommon  = ($changed | Where-Object { $_ -match '^lib/msal-common/' }).Count -gt 0
        $changedBrowser = ($changed | Where-Object { $_ -match '^lib/msal-browser/'  -or $_ -match '^samples/msal-browser-samples/' }).Count -gt 0
        $changedNode    = ($changed | Where-Object { $_ -match '^lib/msal-node/'     -or $_ -match '^samples/msal-node-samples/' }).Count -gt 0
        $changedReact   = ($changed | Where-Object { $_ -match '^lib/msal-react/'    -or $_ -match '^samples/msal-react-samples/' }).Count -gt 0
        $changedAngular = ($changed | Where-Object { $_ -match '^lib/msal-angular/'  -or $_ -match '^samples/msal-angular-samples/' }).Count -gt 0

        $runBrowser = $changedCommon -or $changedBrowser
        $runNode    = $changedCommon -or $changedNode
        $runReact   = $changedCommon -or $changedBrowser -or $changedReact
        $runAngular = $changedCommon -or $changedBrowser -or $changedAngular

        Write-Host "Changed: common=$changedCommon browser=$changedBrowser node=$changedNode react=$changedReact angular=$changedAngular"
    }
} else {
    Write-Host "Non-PR build — running all test suites"
}

Write-Host "Run: browser=$runBrowser node=$runNode react=$runReact angular=$runAngular"
Write-Host "##vso[task.setvariable variable=runMsalBrowser;isOutput=true]$($runBrowser.ToString().ToLower())"
Write-Host "##vso[task.setvariable variable=runMsalNode;isOutput=true]$($runNode.ToString().ToLower())"
Write-Host "##vso[task.setvariable variable=runMsalReact;isOutput=true]$($runReact.ToString().ToLower())"
Write-Host "##vso[task.setvariable variable=runMsalAngular;isOutput=true]$($runAngular.ToString().ToLower())"
