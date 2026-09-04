# Variables
# To be used with @azure/identity functionality, they must adhere to the same names as described in:
# https://learn.microsoft.com/en-us/dotnet/api/azure.identity.environmentcredential?view=azure-dotnet
$dotEnvFileName = ".env"
$tenantIdInfo = 'AZURE_TENANT_ID="72f988bf-86f1-41af-91ab-2d7cd011db47"'
$clientIdName = "AZURE_CLIENT_ID="
$clientCertPathName = "AZURE_CLIENT_CERTIFICATE_PATH="
$sessionSecretName = "SESSION_SECRET="

# Always start with a fresh .env file to avoid duplicate entries
if (Test-Path $dotEnvFileName) {
    Write-Output "Overwriting existing $dotEnvFileName file..."
    Remove-Item $dotEnvFileName -Force -ErrorAction Stop
}
else {
    Write-Output "Creating $dotEnvFileName file..."
}
New-Item -Path . -Name $dotEnvFileName -ItemType "file" | Out-Null

# Output Tenant Id to dotEnv file
$tenantIdInfo | Out-File -File $dotEnvFileName -Append -Encoding utf8
# login - you should have permission already to ready the necessary keyvault
# if not, ask your manager to help with onboarding
az login --output none

# Get the lab app id
$clientIdValue = $(az keyvault secret show --name "LabVaultAppId" --vault-name "msidlabs" --query "value")

$pfxPath = "LabCert.pfx";
$pemPath = "LabCert.pem";
# Clean up existing cert files to avoid errors on re-run
if (Test-Path $pfxPath) { Remove-Item $pfxPath -Force -ErrorAction Stop }
if (Test-Path $pemPath) { Remove-Item $pemPath -Force -ErrorAction Stop }
# get the lab app cert
az keyvault secret download --vault-name "msidlabs" -n "LabAuth" --file $pfxPath --encoding base64
# convert pfx file to pem
openssl pkcs12 -in $pfxPath -out $pemPath -nodes --passin pass:

$fullPemPath = (Get-Location).Path + "\" + $pemPath
$pemUpdateScriptPath = $PSScriptRoot + "/dev-scripts/updatePemCert.js"
Write-Output "Re-ordering x5c cert chain in pem file..."
node $pemUpdateScriptPath $fullPemPath

# Used to secure sessions for samples that use express-session
$sessionSecret = New-Guid
$sessionSecretNameValue = "$sessionSecretName" + '"' + $sessionSecret + '"'    

$clientIdNameValue = "$clientIdName$clientIdValue"
$clientCertPathNameValue = "$clientCertPathName" + '"' + $fullPemPath + '"'


$clientIdNameValue | Out-File -File $dotEnvFileName -Append -Encoding utf8
$clientCertPathNameValue | Out-File -File $dotEnvFileName -Append -Encoding utf8
$sessionSecretNameValue | Out-File -File $dotEnvFileName -Append -Encoding utf8

# Dotenv will not parse CRLF correctly, so we need to replace it with LF
# ReadAllText auto-strips BOM; WriteAllText with UTF8Encoding($false) writes clean UTF-8 without BOM
$envPath = (Resolve-Path $dotEnvFileName).Path
$content = [System.IO.File]::ReadAllText($envPath).Replace("`r`n", "`n")
[System.IO.File]::WriteAllText($envPath, $content, [System.Text.UTF8Encoding]::new($false))

