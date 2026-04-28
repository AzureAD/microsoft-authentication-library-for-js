# Detects whether the 1P msal-browser-1p E2E suite is affected by the current PR.
# Checks both the 3P repo (msal-common, msal-browser) and 1P repo (msal-browser-1p).
# Sets isOutput ADO variable: runMsalBrowser1p.
# Non-PR builds and shared-infra changes default to true (fail-open).
#
# Expects the calling job to have checked out:
#   checkout: self  →  path: 3p   (3P repo)
#   checkout: 1P    →  path: 1p   (1P repo)

$repo3p = "$env:PIPELINE_WORKSPACE/3p"
$repo1p = "$env:PIPELINE_WORKSPACE/1p"

$run1p = $true

if ($env:SYSTEM_PULLREQUEST_TARGETBRANCH) {
    $target = $env:SYSTEM_PULLREQUEST_TARGETBRANCH -replace '^refs/heads/', ''
    Write-Host "PR build: diffing against origin/$target"

    Set-Location $repo3p
    git fetch origin $target
    if ($LASTEXITCODE -ne 0) { throw "git fetch failed in 3P repo" }
    $changed3p = git diff --name-only "origin/$target...HEAD"

    Set-Location $repo1p
    git fetch origin $target 2>$null  # branch may not exist in 1P repo; non-fatal
    $changed1p = if ($LASTEXITCODE -eq 0) {
        git diff --name-only "origin/$target...HEAD"
    } else { @() }

    $sharedChanged = (
        ($changed3p | Where-Object { $_ -match '^\.pipelines/' -or $_ -match '^samples/e2eTestUtils/' }).Count -gt 0 -or
        ($changed1p | Where-Object { $_ -match '^\.pipelines/' }).Count -gt 0
    )

    if ($sharedChanged) {
        Write-Host "Shared infra changed — running all test suites"
    } else {
        $changedCommon  = ($changed3p | Where-Object { $_ -match '^lib/msal-common/' }).Count -gt 0
        $changedBrowser = ($changed3p | Where-Object { $_ -match '^lib/msal-browser/' -or $_ -match '^samples/msal-browser-samples/' }).Count -gt 0
        $changed1pPkg   = ($changed1p  | Where-Object { $_ -match '^msal-browser-1p/' -or $_ -match '^samples/' }).Count -gt 0

        $run1p = $changedCommon -or $changedBrowser -or $changed1pPkg
        Write-Host "Changed: common=$changedCommon browser=$changedBrowser 1p=$changed1pPkg"
    }
} else {
    Write-Host "Non-PR build — running all test suites"
}

Write-Host "Run: browser-1p=$run1p"
Write-Host "##vso[task.setvariable variable=runMsalBrowser1p;isOutput=true]$($run1p.ToString().ToLower())"
