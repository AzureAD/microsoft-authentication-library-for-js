# Securing MSAL Node app credentials with Azure Key Vault and Azure Managed Identity

> :warning: Before you start here, make sure you understand [Using Certificate Credentials with MSAL Node](./certificate-credentials.md).

## Using Azure Key Vault

Sensitive information should not be stored in source code. This section covers creating a key vault and accessing credentials from it using Azure SDKs. For an implementation, see the code sample: [auth-code-key-vault](../../../samples/msal-node-samples/standalone-samples/auth-code-key-vault).

### Create a key vault and import certificates

First, create a key vault. To do so, follow the guide: [Quickstart: Create a key vault using the Azure portal](https://docs.microsoft.com/azure/key-vault/general/quick-create-portal#create-a-vault)

> :information_source: In addition to certificates, **Azure Key Vault** can also be used for storing secrets and other sensitive information such as database connection strings and etc.

Now you can upload your certificate to Key Vault. **Azure Key Vault** expects certificates in either:

* *.pem* file format contains one or more X509 certificate files.
* *.pfx* file format is an archive file format for storing several cryptographic objects in a single file i.e. server certificate (issued for your domain), a matching private key, and may optionally include an intermediate CA.

We will combine our public and private key into a single *.pfx* file, and upload this file to Key Vault. For conversion, we will use **OpenSSL**. Type the following in a terminal:

```console
openssl pkcs12 -export -out example.pfx -inkey example.key -in example.crt
```

This should give you `example.pfx`. Next, **upload** this to Key Vault.

1. Navigate to your key vault on [Azure portal](https://portal.azure.com).
1. On the Key Vault properties pages, select **Certificates**.
1. Click on **Generate/Import**.
1. On the **Create a certificate** screen choose the following values:
   * **Method of Certificate Creation**: Import.
   * **Certificate Name**: ExampleCertificate.
   * **Upload Certificate File**: select the certificate file from disk
   * **Password** : If you are uploading a password protected certificate file, provide that password here. Otherwise, leave it blank. Once the certificate file is successfully imported, key vault will remove that password.
1. Click **Create**.

For alternative ways of importing, see: [Tutorial: Import a certificate in Azure Key Vault](https://docs.microsoft.com/azure/key-vault/certificates/tutorial-import-certificate).

> :information_source: When you import a certificate to Azure Key Vault Certificates, a corresponding private key is created automatically under Azure Key Vault Secrets. Later on, you can retrieve your private key from the Secrets blade.

### Get certificate from your vault in Node.js

Using [Azure Key Vault JavaScript SDK](https://docs.microsoft.com/javascript/api/overview/azure/keyvault-certificates-readme?view=azure-node-latest), we can fetch the certificate we've uploaded in the previous step. During development, Azure **Key Vault JavaScript SDK** grabs the required access token from the local environment using VS Code's context, via [@azure/identity](https://docs.microsoft.com/javascript/api/overview/azure/identity-readme?view=azure-node-latest) package. To do this, you'll need to be signed in to Azure.

First, [download and install](https://docs.microsoft.com/cli/azure/install-azure-cli) **Azure CLI**. This should add **Azure CLI** to system path. Re-launch VS Code and **Azure CLI** should be available in VS Code [integrated terminal](https://code.visualstudio.com/docs/editor/integrated-terminal). Then, type the following to sign-in.

```console
az login --tenant YOUR_TENANT_ID
```

Once authenticated, [@azure/identity](https://docs.microsoft.com/javascript/api/overview/azure/identity-readme?view=azure-node-latest) package can access the Azure Key Vault as shown below:

```JavaScript
function msalApp(thumbprint, privateKey) {

    // Before running the sample, you will need to replace the values in the config
    const config = {
        auth: {
            clientId: "ENTER_CLIENT_ID",
            authority: "https://login.microsoftonline.com/ENTER_TENANT_ID",
            clientCertificate: {
                thumbprint: thumbprint,
                privateKey: privateKey,
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
            redirectUri: REDIRECT_URI,
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
            redirectUri: REDIRECT_URI,
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
}

async function main() {

    // Grab the certificate thumbprint
    const certResponse = await certClient.getCertificate(CERTIFICATE_NAME);
    const thumbprint = certResponse.properties.x509Thumbprint.toString('hex').toUpperCase();
    
    // When you upload a certificate to Key Vault, a secret containing your private key is automatically created (in PFX)
    const secretResponse = await secretClient.getSecret(CERTIFICATE_NAME);

    // Convert to PFX to PEM and grab the private key
    const privateKey = convertPFX(secretResponse.value).key;

    // Create initialize msal and start the server 
    msalApp(thumbprint, privateKey);
}

main();
```

For an implementation, see the code sample: [auth-code-key-vault](../../../samples/msal-node-samples/standalone-samples/auth-code-key-vault).

## Using Azure Managed Identity

While developing on local environment you can use **Azure Key Vault JavaScript SDK**, you would use **Azure Managed Identity** service to access your key vault in production and deployment.

> Take a moment to get familiar with Managed Identity: [What are managed identities for Azure resources?](https://docs.microsoft.com/azure/active-directory/managed-identities-azure-resources/overview#how-a-system-assigned-managed-identity-works-with-an-azure-vm)

### Deployment to App Service

For more information, visit: [How to use managed identities for App Service](https://docs.microsoft.com/azure/app-service/overview-managed-identity?context=%2Fazure%2Factive-directory%2Fmanaged-identities-azure-resources%2Fcontext%2Fmsi-context&tabs=dotnet)

#### Step 1: Deploy your files

1. In the **VS Code** activity bar, select the **Azure** logo to show the **Azure App Service** explorer. Select **Sign in to Azure...** and follow the instructions. Once signed in, the explorer should show the name of your **Azure** subscription(s).
2. On the **App Service** explorer section you will see an upward-facing arrow icon. Click on it publish your local files in the sample folder to **Azure App Services** (use "Browse" option if needed, and locate the right folder).
3. Choose a creation option based on the operating system to which you want to deploy. in this sample, we choose **Linux**.
4. Select a Node.js version when prompted. An **LTS** version is recommended.
5. Type a globally unique name for your web app and press Enter. The name must be unique across all of **Azure**. (e.g. `msal-node-webapp1`)
6. After you respond to all the prompts, **VS Code** shows the **Azure** resources that are being created for your app in its notification popup.
7. Select **Yes** when prompted to update your configuration to run `npm install` on the target Linux server.

### Step 2: Update your app's Redirect URI

1. Navigate to [Azure portal](https://portal.azure.com) and select the **Azure AD** service.
1. Select the **App Registrations** blade on the left, then find and select the web app that you have registered.
1. Navigate to the **Authentication** blade. There, in **Redirect URI** section, enter the following redirect URI: `https://msal-node-webapp1.azurewebsites.net/redirect`.
1. Select **Save** to save your changes.

### Integrate Managed Identity

#### Create a system-assigned identity

1. Navigate to [Azure portal](https://portal.azure.com) and select the **Azure App Service**.
1. Find and select the App Service you've created previously.
1. On App Service portal, select **Identity**.
1. Within the **System assigned** tab, switch **Status** to **On**. Click **Save**.

For more information, see [Add a system-assigned identity](https://docs.microsoft.com/azure/app-service/overview-managed-identity?tabs=dotnet#add-a-system-assigned-identity)

#### Grant access to Key Vault

Now that your app deployed to App Service has a managed identity, in this step you grant it access to your key vault.

1. Go to the [Azure portal](https://portal.azure.com) and search for your Key Vault.
1. Select **Overview** > **Access policies** blade on the left.
1. Click on **Add Access Policy** > **Certificate permissions** > **Get**
1. Click on **Add Access Policy** > **Secret permissions** > **Get**
1. Click on **Select Principal**, add your account and pre-created **system-assigned** identity.
1. Click on **OK** to add the new Access Policy, then click **Save** to save the Access Policy.

For more information, see [Use Key Vault from App Service with Azure Managed Identity](https://docs.microsoft.com/samples/azure-samples/app-service-msi-keyvault-dotnet/keyvault-msi-appservice-sample/)

#### Add environment variables

Finally, you need to add environment variables to the App Service where you deployed your web app.

1. In the [Azure portal](https://portal.azure.com) , search for and select **App Service**, and then select your app.
1. Select **Configuration** blade on the left, then select **New Application Settings**.
1. Add the following variables (name-value):
    1. **REDIRECT_URI**: the redirect URI you've registered on Azure AD, e.g. `https://msal-node-webapp1.azurewebsites.net/redirect`
    1. **KEY_VAULT_NAME**: the name of the key vault you've created, e.g. `node-test-vault`
    1. **CERTIFICATE_NAME**: the name of the certificate you specified when importing it to key vault, e.g. `ExampleCert`

Wait for a few minutes for your changes to **App Service** to take effect. You should then be able to visit your published website and sign-in accordingly.

## More Information

* [Microsoft identity platform application authentication certificate credentials](https://docs.microsoft.com/azure/active-directory/develop/active-directory-certificate-credentials)
* [Azure Key Vault Developer's Guide](https://docs.microsoft.com/azure/key-vault/general/developers-guide)
* [Various SSL/TLS Certificate File Types/Extensions](https://docs.microsoft.com/archive/blogs/kaushal/various-ssltls-certificate-file-typesextensions)
