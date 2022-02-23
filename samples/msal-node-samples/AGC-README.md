Environment variables must be set in powershell before running the AGC E2E tests. They can be set via the following commands:

$env:NODE_EXTRA_CA_CERTS = "pathToCert"
Certificate chains in the AGC are re-signed with an AGC Certificate Authority certificate. NodeJS does not interact with Windows to get a list of Certificate Authorities to trust. Therefore, you must use the NODE_EXTRA_CA_CERTS environment variable to pass the chain of certificates that was re-signed by the AGC certificate.
The following article provides more context and shows how to re-chain the certificates: https://medium.com/zowe/zowe-cli-providing-node-extra-ca-certs-117727d936e5

$env:TLD = "The top-level domain used in the environment (example: .com)

The following environment variables are necessary to access the key vault:
$env:AZURE_TENANT_ID = "The tenant ID in Azure Active Directory"
$env:AZURE_CLIENT_ID = "The application (client) ID registered in the AAD tenant"
$env:AZURE_CLIENT_SECRET = "The client secret for the registered application"

It is important to note that the AZURE_CLIENT_ID and AZURE_CLIENT_SECRET values will change depending on if the E2E test is utilizing a confidential or public client.