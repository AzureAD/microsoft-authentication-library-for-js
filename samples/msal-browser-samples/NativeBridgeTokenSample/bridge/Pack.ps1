$ErrorActionPreference = 'Stop'
$output = Join-Path $PSScriptRoot 'artifacts'
foreach ($project in @('Identity.NativeBridge', 'Identity.NativeBridge.WebView2')) {
    & dotnet pack (Join-Path $PSScriptRoot "src\$project\$project.csproj") -c Release -o $output
    if ($LASTEXITCODE -ne 0) { throw "Packaging failed: $project" }
    $packagePath = Join-Path $output "$project.Prototype.0.1.0.nupkg"
    $archive = [System.IO.Compression.ZipFile]::OpenRead($packagePath)
    try {
        $unexpectedFiles = @($archive.Entries | Where-Object {
            $_.FullName -match '(?i)oneauth|adapter|(^|/)runtimes/|\.(lib|cpp|hpp|h)$' -or
            ($_.FullName -match '(?i)\.dll$' -and [System.IO.Path]::GetFileName($_.FullName) -ne "$project.dll")
        })
        if ($unexpectedFiles.Count -ne 0) { throw "Unexpected native/adapter payload in ${project}: $($unexpectedFiles.FullName -join ', ')" }
        $manifest = $archive.Entries | Where-Object { $_.FullName -like '*.nuspec' } | Select-Object -First 1
        $reader = [System.IO.StreamReader]::new($manifest.Open())
        try { [xml]$metadata = $reader.ReadToEnd() }
        finally { $reader.Dispose() }
        $actualDependencies = @($metadata.SelectNodes('//*[local-name()="dependency"]') | ForEach-Object { $_.GetAttribute('id') } | Sort-Object -Unique)
        $expectedDependencies = if ($project -eq 'Identity.NativeBridge') { @() } else { @('Identity.NativeBridge.Prototype', 'Microsoft.Web.WebView2') }
        if (@(Compare-Object -ReferenceObject @($expectedDependencies) -DifferenceObject @($actualDependencies)).Count -ne 0) {
            throw "Unexpected package dependencies in ${project}: $($actualDependencies -join ', ')"
        }
        if ($project -eq 'Identity.NativeBridge') {
            $scripts = @($archive.Entries | Where-Object { $_.FullName -match '(?i)\.js$' })
            if ($scripts.Count -ne 1) { throw 'Core package must contain exactly one compiled browser JavaScript asset.' }
            $facade = $archive.GetEntry('bridge/msal-bridge.js')
            if ($null -eq $facade) { throw 'Compiled browser transport is missing.' }
            $reader = [System.IO.StreamReader]::new($facade.Open())
            try { $packagedFacade = $reader.ReadToEnd() }
            finally { $reader.Dispose() }
            $canonicalFacade = [System.IO.File]::ReadAllText((Join-Path $PSScriptRoot '../../../../lib/msal-bridge/dist/msal-bridge.js'))
            if ($packagedFacade -cne $canonicalFacade) { throw 'Packaged transport differs from the canonical browser build.' }
        }
        Write-Host "PASS: $project package excludes adapter/SDK payloads and has only expected dependencies."
    }
    finally { $archive.Dispose() }
}
$consumerCache = Join-Path $output "consumer-packages\$([Guid]::NewGuid().ToString('N'))"
& dotnet restore (Join-Path $PSScriptRoot 'test\PackageConsumer\PackageConsumer.csproj') --force --no-cache --packages $consumerCache
if ($LASTEXITCODE -ne 0) { throw 'Package consumer restore failed.' }
& dotnet run --project (Join-Path $PSScriptRoot 'test\PackageConsumer\PackageConsumer.csproj') -c Release --no-restore
if ($LASTEXITCODE -ne 0) { throw 'Package consumer validation failed.' }