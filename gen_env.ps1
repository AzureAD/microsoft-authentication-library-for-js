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

$pemPath = "lab-vault-cert.pem";
Write-Output "Downloading LabVaultAccessCert to $pemPath"
# get the lab app cert
az keyvault certificate download --vault-name "msidlabs" -n "LabVaultAccessCert" -f $pemPath
$fullPemPath = "$(Resolve-Path $pemPath)"

$clientIdNameValue = "$clientIdName$clientIdValue"
$clientCertPathNameValue = "$clientCertPathName" + '"' + $fullPemPath + '"'


$clientIdNameValue | Out-File -File $dotEnvFileName -Append
$clientCertPathNameValue | Out-File -File $dotEnvFileName -Append

