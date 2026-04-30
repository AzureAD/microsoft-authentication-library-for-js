# Detects which E2E suites are affected by the current PR.
# Sets isOutput ADO variables for each library. Non-PR builds and shared-infra
# changes default all flags to true (fail-open).
#
# Parameters:
#   -Repo3pPath      Path to the 3P repo root. Defaults to the current directory.
#   -Repo1pPath      Path to the 1P repo root. Optional; provide when the 1P repo
#                    is checked out (i.e. in 1p-e2e.yml) to also gate msal-browser-1p.
#   -EnableBrowser   Whether msal-browser tests are enabled at all (compile-time param).
#   -EnableNode      Whether msal-node tests are enabled at all (compile-time param).
#   -EnableReact     Whether msal-react tests are enabled at all (compile-time param).
#   -EnableAngular   Whether msal-angular tests are enabled at all (compile-time param).
#   -Enable1p        Whether msal-browser-1p tests are enabled at all (compile-time param).

param(
    [string]$Repo3pPath = $PWD,
    [string]$Repo1pPath = "",
    [string]$EnableBrowser = "true",
    [string]$EnableNode    = "true",
    [string]$EnableReact   = "true",
    [string]$EnableAngular = "true",
    [string]$Enable1p      = "true"
)

# Convert string flags passed from YAML compile-time expansion to booleans
$enabledBrowser = $EnableBrowser -ne "false"
$enabledNode    = $EnableNode    -ne "false"
$enabledReact   = $EnableReact   -ne "false"
$enabledAngular = $EnableAngular -ne "false"
$enabled1p      = $Enable1p      -ne "false"

$runBrowser = $runNode = $runReact = $runAngular = $run1p = $true

Write-Host "##[command]🔍 MSAL E2E — Change Detection"

if ($env:SYSTEM_PULLREQUEST_TARGETBRANCH) {
    $target = $env:SYSTEM_PULLREQUEST_TARGETBRANCH -replace '^refs/heads/', ''
    Write-Host "PR build — diffing against origin/$target"

    Set-Location $Repo3pPath
    git fetch origin $target
    if ($LASTEXITCODE -ne 0) { throw "git fetch failed in 3P repo" }
    $changed3p = @(git diff --name-only "origin/$target...HEAD")

    $changed1p = @()
    if ($Repo1pPath) {
        Set-Location $Repo1pPath
        git fetch origin $target 2>$null  # branch may not exist in 1P repo; non-fatal
        $changed1p = if ($LASTEXITCODE -eq 0) {
            @(git diff --name-only "origin/$target...HEAD")
        } else { @() }
    }

    # Bucket files by package
    $files = @{
        common  = @($changed3p | Where-Object { $_ -match '^lib/msal-common/' })
        browser = @($changed3p | Where-Object { $_ -match '^lib/msal-browser/' -or $_ -match '^samples/msal-browser-samples/' })
        node    = @($changed3p | Where-Object { $_ -match '^lib/msal-node/'    -or $_ -match '^samples/msal-node-samples/' })
        react   = @($changed3p | Where-Object { $_ -match '^lib/msal-react/'   -or $_ -match '^samples/msal-react-samples/' })
        angular = @($changed3p | Where-Object { $_ -match '^lib/msal-angular/' -or $_ -match '^samples/msal-angular-samples/' })
        infra   = @($changed3p | Where-Object { $_ -match '^\.pipelines/'      -or $_ -match '^samples/e2eTestUtils/' })
        infra1p = @($changed1p | Where-Object { $_ -match '^\.pipelines/' })
        pkg1p   = @($changed1p | Where-Object { $_ -match '^msal-browser-1p/'  -or $_ -match '^samples/' })
        other3p = @($changed3p | Where-Object { $_ -notmatch '^lib/msal-(common|browser|node|react|angular)/' -and $_ -notmatch '^samples/' -and $_ -notmatch '^\.pipelines/' })
    }

    # Print grouped file lists
    function Write-FileGroup([string]$label, [string[]]$files) {
        if ($files.Count -eq 0) { return }
        Write-Host "##[group]  $label ($($files.Count) file$(if ($files.Count -ne 1) {'s'}))"
        $files | ForEach-Object { Write-Host "    $_" }
        Write-Host "##[endgroup]"
    }

    Write-Host ""
    Write-Host "##[group]📂 Changed files ($($changed3p.Count + $changed1p.Count) total)"
    Write-FileGroup "msal-common"    $files.common
    Write-FileGroup "msal-browser"   $files.browser
    Write-FileGroup "msal-node"      $files.node
    Write-FileGroup "msal-react"     $files.react
    Write-FileGroup "msal-angular"   $files.angular
    Write-FileGroup "msal-browser-1p" $files.pkg1p
    Write-FileGroup "pipeline infra (3P)" $files.infra
    Write-FileGroup "pipeline infra (1P)" $files.infra1p
    Write-FileGroup "other"          $files.other3p
    Write-Host "##[endgroup]"
    Write-Host ""

    # Shared infra changes in either repo → run everything
    $sharedChanged = ($files.infra.Count -gt 0 -or $files.infra1p.Count -gt 0)

    if ($sharedChanged) {
        Write-Host "##[warning]Pipeline infra changed — running all test suites"
    } else {
        $changedCommon  = $files.common.Count  -gt 0
        $changedBrowser = $files.browser.Count -gt 0
        $changedNode    = $files.node.Count    -gt 0
        $changedReact   = $files.react.Count   -gt 0
        $changedAngular = $files.angular.Count -gt 0
        $changed1pPkg   = $files.pkg1p.Count   -gt 0

        $runBrowser = $changedCommon -or $changedBrowser
        $runNode    = $changedCommon -or $changedNode
        $runReact   = $changedCommon -or $changedBrowser -or $changedReact
        $runAngular = $changedCommon -or $changedBrowser -or $changedAngular
        $run1p      = $changedCommon -or $changedBrowser -or $changed1pPkg
    }
} else {
    Write-Host "Non-PR build — running all test suites"
    Write-Host ""
}

# AND detection result with compile-time enabled flags and print summary table
$runBrowser = $runBrowser -and $enabledBrowser
$runNode    = $runNode    -and $enabledNode
$runReact   = $runReact   -and $enabledReact
$runAngular = $runAngular -and $enabledAngular
$run1p      = $run1p      -and $enabled1p

function Suite-Row([string]$name, [bool]$will_run, [bool]$enabled) {
    $icon   = if ($will_run) { "[RUN] " } else { "[SKIP]" }
    $status = if (-not $enabled)   { "skipped  (disabled by parameter)" }
              elseif ($will_run)   { "WILL RUN" }
              else                 { "skipped  (not affected by this change)" }
    Write-Host "  $icon  $($name.PadRight(16)) $status"
}

Write-Host "##[command]📦 Suite decisions"
Write-Host "##[group]Results"
Suite-Row "msal-browser"    $runBrowser $enabledBrowser
Suite-Row "msal-node"       $runNode    $enabledNode
Suite-Row "msal-react"      $runReact   $enabledReact
Suite-Row "msal-angular"    $runAngular $enabledAngular
Suite-Row "msal-browser-1p" $run1p      $enabled1p
Write-Host "##[endgroup]"
Write-Host ""

Write-Host "##vso[task.setvariable variable=runMsalBrowser;isOutput=true]$($runBrowser.ToString().ToLower())"
Write-Host "##vso[task.setvariable variable=runMsalNode;isOutput=true]$($runNode.ToString().ToLower())"
Write-Host "##vso[task.setvariable variable=runMsalReact;isOutput=true]$($runReact.ToString().ToLower())"
Write-Host "##vso[task.setvariable variable=runMsalAngular;isOutput=true]$($runAngular.ToString().ToLower())"
Write-Host "##vso[task.setvariable variable=runMsalBrowser1p;isOutput=true]$($run1p.ToString().ToLower())"
