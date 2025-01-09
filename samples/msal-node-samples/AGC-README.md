The non-AGC E2E tests are not able to be run in the AGCE. In order to run - and ONLY run - the AGC E2E tests while in the AGCE, the following command must be run: npm run test:agc

The following seven environment variables must be set in powershell before running the AGC E2E tests. They can be set via the following commands:

1. $env:GRAPH_URL = "The URL of Microsoft Graph API"
   This can be found in the Microsoft Entra admin center in the application's App Registration
   Important to note: "/v1.0/me" and "/.default" should not be appended to the end of the URL.
   These parts of the URL are already accounted for in the E2E tests.

2. $env:AUTHORITY = "The URL that indicates a directory that MSAL can request tokens from."
   This can be found in the Microsoft Entra admin center in the application's App Registration

3. $env:KEY_VAULT_URL = "The URL to the key vault where the test user's credentials are stored"

4. $env:AZURE_TENANT_ID = "The tenant ID in Microsoft Entra ID"

5. $env:AZURE_CLIENT_ID = "The application (client) ID registered in the Microsoft Entra tenant"

6. $env:AZURE_CLIENT_SECRET = "The client secret for the registered application"
   It is important to note that the AZURE_CLIENT_ID and AZURE_CLIENT_SECRET values will change depending on if the E2E test is utilizing a confidential or public client.

7. $env:NODE_EXTRA_CA_CERTS = "pathToCert"
   Certificate chains in the AGC are re-signed with an AGC Certificate Authority certificate. NodeJS does not interact with Windows to get a list of Certificate Authorities to trust. Therefore, you must use the NODE_EXTRA_CA_CERTS environment variable to pass the chain of certificates that was re-signed by the AGC certificate.
   The following article provides more context and shows how to re-chain the certificates: https://medium.com/zowe/zowe-cli-providing-node-extra-ca-certs-117727d936e5.
