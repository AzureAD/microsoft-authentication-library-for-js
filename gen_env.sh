#!/bin/bash

# Remember to make executable

# Variables
dotEnvFileName=".env"
tenantIdInfo="AZURE_TENANT_ID=\"72f988bf-86f1-41af-91ab-2d7cd011db47\""
clientIdName="AZURE_CLIENT_ID="
clientSecretName="AZURE_CLIENT_SECRET="

# Create file if it doesn't exist
touch $dotEnvFileName

# Output Tenant Id to dotEnv file
echo $tenantIdInfo >> $dotEnvFileName

# login - you should have permission already to ready the necessary keyvault
# if not, ask your manager to help with onboarding
az login

# Get the lab app id
clientIdValue=$(az keyvault secret show --name "LabVaultAppId" --vault-name "msidlabs" --query "value")

# get the lab app secret
clientSecretValue=$(az keyvault secret show --name "LabVaultAppSecret" --vault-name "msidlabs" --query "value")

clientIdNameValue=$clientIdName$clientIdValue
clientSecretNameValue=$clientSecretName$clientSecretValue

echo $clientIdNameValue >> $dotEnvFileName
echo $clientSecretNameValue >> $dotEnvFileName
