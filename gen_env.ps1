# Variables
$dotEnvFileName = ".env"
$tenantIdInfo = 'AZURE_TENANT_ID="72f988bf-86f1-41af-91ab-2d7cd011db47"'
$clientIdName = "AZURE_CLIENT_ID="
$clientCertPathName = "AZURE_CLIENT_CERT_PATH="

# Create file if it doesn't exist
if (-Not (Test-Path $dotEnvFileName)) {
    Write-Output "Creating $dotEnvFileName file..."
    New-Item -Path . -Name $dotEnvFileName -ItemType "file"
}
else {
    Write-Output "$dotEnvFileName file already exists..."
}

# Output Tenant Id to dotEnv file
$tenantIdInfo | Out-File -File $dotEnvFileName -Append
# login - you should have permission already to ready the necessary keyvault
# if not, ask your manager to help with onboarding
az login --output none

# Get the lab app id
$clientIdValue = $(az keyvault secret show --name "LabVaultAppId" --vault-name "msidlabs" --query "value")

$pfxPath = "LabCert.pfx";
$pemPath = "LabCert.pem";
# get the lab app cert
az keyvault secret download --vault-name "msidlabs" -n "LabVaultAccessCert" --file $pfxPath --encoding base64
# convert pfx file to pem
openssl pkcs12 -in $pfxPath -out $pemPath -nodes --passin pass:

$fullPemPath = (Get-Location).Path + "\" + $pemPath

$clientIdNameValue = "$clientIdName$clientIdValue"
$clientCertPathNameValue = "$clientCertPathName" + '"' + $fullPemPath + '"'


$clientIdNameValue | Out-File -File $dotEnvFileName -Append
$clientCertPathNameValue | Out-File -File $dotEnvFileName -Append

# Dotenv will not parse CLRF correctly, so we need to replace it with LF
(Get-Content $dotEnvFileName -Raw).Replace("`r`n", "`n") | Set-Content $dotEnvFileName -Force

