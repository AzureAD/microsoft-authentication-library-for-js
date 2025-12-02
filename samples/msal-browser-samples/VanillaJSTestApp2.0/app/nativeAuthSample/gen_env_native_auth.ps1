# This is for local test use to get the necessary config file from keyvault
# To be used with @azure/identity functionality, they must adhere to the same names as described in:
# https://learn.microsoft.com/en-us/dotnet/api/azure.identity.environmentcredential?view=azure-dotnet

# login - uncomment this when test locally, you should have permission already to ready the necessary keyvault
az login --tenant "72f988bf-86f1-41af-91ab-2d7cd011db47" --output none

# get the config file
$base64Config = az keyvault secret show --vault-name "buildautomation" -n "js-native-auth-config" --query "value" --output tsv

$outputFile = (Get-Location).Path + "\nativeAuthConfig.json"

$decodedConfig = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($base64Config))

# Use UTF-8 encoding without BOM to prevent syntax errors when reading the JSON file
$utf8NoBomEncoding = New-Object System.Text.UTF8Encoding $False
$cleanedConfig = $decodedConfig.replace("`r`n", [System.Environment]::NewLine)
[System.IO.File]::WriteAllText($outputFile, $cleanedConfig, $utf8NoBomEncoding)
