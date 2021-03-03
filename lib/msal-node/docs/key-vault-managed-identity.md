# Securing MSAL Node app credentials with Azure Key Vault and Azure Managed Identity

> :warning: Before you start here, make sure you understand [Using Certificate Credentials with MSAL Node](./certificate-credentials.md).

## Using Azure Key Vault

Sensitive information should not be stored in source code. This section covers creating a key vault and accessing credentials from it with Azure SDKs. For an implementation, see the code sample: [auth-code-key-vault](../../../samples/msal-node-samples/standalone-samples/auth-code-key-vault).

### Create a key vault and import certificates

First, create a key vault. Follow the guide: [Quickstart: Create a key vault using the Azure portal](https://docs.microsoft.com/azure/key-vault/general/quick-create-portal#create-a-vault)

> :information_source: In addition to certificates, **Azure Key Vault** can also be used for storing secrets and other sensitive information such as database connection strings and etc.

Now you can upload your certificate to Key Vault. Key Vault expects either:

* *.pem* file format contains one or more X509 certificate files.
* *.pfx* file format is an archive file format for storing several cryptographic objects in a single file i.e. server certificate (issued for your domain), a matching private key, and may optionally include an intermediate CA.

We will combine our public and private key into a single *.pfx* file, and upload this file to Key Vault. First, type:

```console
openssl pkcs12 -export -out example.pfx -inkey example.key -in example.crt
```

// Upload steps

### Get certificate from your vault in Node.js

Using Azure Key Vault JavaScript SDKs, we can fetch the certificate we've uploaded in the previous step. During development, Azure Key Vault JavaScript SDKs grabs the required access token from the local environment using VS Code's context, via [@azure/identity](https://docs.microsoft.com/javascript/api/overview/azure/identity-readme?view=azure-node-latest) package. To do this, you'll need to be signed in Azure.

First, [download and install](https://docs.microsoft.com/cli/azure/install-azure-cli) **Azure CLI**. This should add **Azure CLI** to system path. Re-launch VS Code and **Azure CLI** should be available in VS Code [integrated terminal](https://code.visualstudio.com/docs/editor/integrated-terminal). Then, type the following to sign-in.

```console
az login --tenant YOUR_TENANT_ID
```

Once authenticated, [@azure/identity](https://docs.microsoft.com/javascript/api/overview/azure/identity-readme?view=azure-node-latest) package can access the Azure Key Vault as shown below:

```JavaScript
async function main() {

    const certResponse = await certClient.getCertificate("NAME_OF_YOUR_CERTIFICATE_ON_KEY_VAULT");
    const thumbprint = certResponse.properties.x509Thumbprint.toString('hex').toUpperCase();
    
    // when you upload a certificate to Key Vault, a secret containing your private key is automatically created
    const secretResponse = await secretClient.getSecret("NAME_OF_YOUR_CERTIFICATE_ON_KEY_VAULT");

    pem.readPkcs12(Buffer.from(secretResponse.value, 'base64'), (err, cert) => {

        // Before running the sample, you will need to replace the values in the config
        const config = {
            auth: {
                clientId: "ENTER_CLIENT_ID",
                authority: "https://login.microsoftonline.com/ENTER_TENANT_ID",
                clientCertificate: {
                    thumbprint: thumbprint,
                    privateKey: cert.key,
                }
            },
            system: {
                loggerOptions: {
                    loggerCallback(loglevel, message, containsPii) {
                        console.log(message);
                    },
                    piiLoggingEnabled: false,
                    logLevel: msal.LogLevel.Verbose,
                }
            }
        };

        // Create msal application object
        const cca = new msal.ConfidentialClientApplication(config);

        // Create Express App and Routes
        const app = express();

        app.get('/', (req, res) => {
            const authCodeUrlParameters = {
                scopes: ["user.read"],
                redirectUri: "http://localhost:3000/redirect",
            };

            // get url to sign user in and consent to scopes needed for application
            cca.getAuthCodeUrl(authCodeUrlParameters).then((response) => {
                res.redirect(response);
            }).catch((error) => console.log(JSON.stringify(error)));
        });

        app.get('/redirect', (req, res) => {
            const tokenRequest = {
                code: req.query.code,
                scopes: ["user.read"],
                redirectUri: "http://localhost:3000/redirect",
            };

            cca.acquireTokenByCode(tokenRequest).then((response) => {
                console.log("\nResponse: \n:", response);
                res.status(200).send('Congratulations! You have signed in successfully');
            }).catch((error) => {
                console.log(error);
                res.status(500).send(error);
            });
        });

        app.listen(SERVER_PORT, () => {
            console.log(`Msal Node Auth Code Sample app listening on port ${SERVER_PORT}!`)
        });
    });
}

main();
```

For an implementation, see the code sample: [auth-code-key-vault](../../../samples/msal-node-samples/standalone-samples/auth-code-key-vault).

## Using Azure Managed Identity

While developing on local environment you can use Azure Key Vault JavaScript SDKs, you would use **Azure Managed Identity** to access your key vault in production and deployment.

> Take a moment to get familiar with Managed Identity: [What are managed identities for Azure resources?](https://docs.microsoft.com/azure/active-directory/managed-identities-azure-resources/overview#how-a-system-assigned-managed-identity-works-with-an-azure-vm)

For more information, visit: [How to use managed identities for App Service](https://docs.microsoft.com/azure/app-service/overview-managed-identity?context=%2Fazure%2Factive-directory%2Fmanaged-identities-azure-resources%2Fcontext%2Fmsi-context&tabs=dotnet)

### Deployment to App Service

#### Step 1: Deploy your files

1. In the **VS Code** activity bar, select the **Azure** logo to show the **Azure App Service** explorer. Select **Sign in to Azure...** and follow the instructions. Once signed in, the explorer should show the name of your **Azure** subscription(s).
2. On the **App Service** explorer section you will see an upward-facing arrow icon. Click on it publish your local files in the `WebApp` folder to **Azure App Services** (use "Browse" option if needed, and locate the right folder).
3. Choose a creation option based on the operating system to which you want to deploy. in this sample, we choose **Linux**.
4. Select a Node.js version when prompted. An **LTS** version is recommended.
5. Type a globally unique name for your web app and press Enter. The name must be unique across all of **Azure**. (e.g. `msal-nodejs-webapp1`)
6. After you respond to all the prompts, **VS Code** shows the **Azure** resources that are being created for your app in its notification popup.
7. Select **Yes** when prompted to update your configuration to run `npm install` on the target Linux server.

### Step 2: Update your authentication configuration

Now we need to obtain authentication parameters. There are 2 things to do:

* Update Azure AD **App Registration**
* Update `index.js`.

First, navigate to the [Azure portal](https://portal.azure.com) and select the **Azure AD** service.

1. Select the **App Registrations** blade on the left, then find and select the web app that you have registered.
1. Navigate to the **Authentication** blade. There, in **Redirect URI** section, enter the following redirect URI: `https://msal-nodejs-webapp1.azurewebsites.net/redirect`.
1. Select **Save** to save your changes.

Now, open the `index.js` that you have deployed to **Azure App Service**.

1. Find the key `redirectUri` and replace the existing value with the Redirect URI for your app. For example, `https://msal-nodejs-webapp1.azurewebsites.net/redirect`.
1. Find the key `postLogoutRedirectUri` and replace the existing value with the base address of your app (by default `https://msal-nodejs-webapp1.azurewebsites.net/`).

### Integrate Managed Identity

// Here 1

#### Create a system-assigned identity

// Here 2

#### Add environment variables

// Here 3

## More Information

* [Microsoft identity platform application authentication certificate credentials](https://docs.microsoft.com/azure/active-directory/develop/active-directory-certificate-credentials)
* [Azure Key Vault Developer's Guide](https://docs.microsoft.com/azure/key-vault/general/developers-guide)
* [Various SSL/TLS Certificate File Types/Extensions](https://docs.microsoft.com/archive/blogs/kaushal/various-ssltls-certificate-file-typesextensions)
