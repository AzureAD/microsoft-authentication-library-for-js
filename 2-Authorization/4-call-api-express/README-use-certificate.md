
# How to use certificates instead of secrets in your application(s)

Microsoft identity platform supports two types of authentication for [confidential client applications](https://learn.microsoft.com/azure/active-directory/develop/msal-client-applications): password-based authentication (i.e. client secret) and certificate-based authentication. For a higher level of security, we recommend using a certificate (instead of a client secret) as a credential in your confidential client applications.

In production, you should purchase a certificate signed by a well-known certificate authority, and use [Azure Key Vault](https://azure.microsoft.com/services/key-vault/) to manage certificate access and lifetime for you. For testing purposes, follow the steps below to create a self-signed certificate and configure your apps to authenticate with certificates.

## Using certificates

<details>
<summary>:information_source: Expand this to use automation</summary>

> :warning: Make sure you have OpenSSL installed on your machine. After installation, you may need to start a new command line instance for the `openssl` command to be available on system path.
> 
> ```console
> choco install openssl
> ```

Alternatively, download and build **OpenSSL** for your **OS** following the guide at [github.com/openssl](https://github.com/openssl/openssl#build-and-install). If you like to skip building and get a binary distributable from the community instead, check the [OpenSSL Wiki: Binaries](https://wiki.openssl.org/index.php/Binaries) page.

 
1. While inside *AppCreationScripts* folder, open a terminal.

2. Run the [Cleanup-withCertCertificates.ps1](./Cleanup-withCertCertificates.ps1) script to delete any existing app registrations and certificates for the sample.

```console
    .\Cleanup-withCertCertificates.ps1
```

3. Run the [Configure-withCertCertificates.ps1](./Configure-withCertCertificates.ps1) script to re-create the App Registration. The script will also create `.pfx` file(s) (e.g. ciam-msal-node-webapp.pfx) that you can upload to Key Vault later. When asked about a password, do remember it - you will need the password when uploading the certificate.

```console
    .\Configure-withCertCertificates.ps1
```

4. Proceed to [step 3](#configure-your-apps-to-use-a-certificate) to configure application settings.

</details>

- **Step 1: [Create a self-signed certificate](#create-a-self-signed-certificate)**
  - Option 1: [create self-signed certificate on local machine](#create-self-signed-certificate-on-local-machine)
  - Option 2: [create self-signed certificate on Key Vault](#create-self-signed-certificate-on-key-vault)
- **Step 2: [Configure an Azure AD app registration to use a certificate](#configure-an-azure-ad-app-registration-to-use-a-certificate)**
- **Step 3: [Configure your app(s) to use a certificate](#configure-your-apps-to-use-a-certificate)**
  - Option 1: [using an existing certificate from local machine](#using-an-existing-certificate-from-local-machine)
  - Option 2: [using an existing certificate from Key Vault](#using-an-existing-certificate-from-key-vault)

If you plan to deploy your app(s) to [Azure App Service](https://learn.microsoft.com/azure/app-service/overview) afterwards, we recommend [Azure Managed Identity](https://learn.microsoft.com/azure/active-directory/managed-identities-azure-resources/overview) to completely eliminate secrets, certificates, connection strings and etc. from your source code. See [Using Managed Identity](#using-managed-identity) below for more.

### Create a self-signed certificate

You can skip this step if you already have a valid self-signed certificate at hand.

#### Create self-signed certificate on local machine

If you wish to generate a new self-signed certificate yourself, follow the steps below.
<details>
<summary>Click here to use OpenSSL</summary>

Download and build **OpenSSL** for your **OS** following the guide at [github.com/openssl](https://github.com/openssl/openssl#build-and-install). If you like to skip building and get a binary distributable from the community instead, check the [OpenSSL Wiki: Binaries](https://wiki.openssl.org/index.php/Binaries) page. Afterwards, add the path to **OpenSSL** to your **environment variables** so that you can call it from anywhere.

Type the following in a terminal. The files will be generated in the terminals current directory.

```bash
openssl req -x509 -newkey rsa:2048 -keyout ciam-msal-node-webapp.key -out ciam-msal-node-webapp.cer -subj "/CN=ciam-msal-node-webapp" -nodes

Generating a RSA private key
.........................................................
writing new private key to 'ciam-msal-node-webapp.key'
```

The following files should be generated: *ciam-msal-node-webapp.key*, *ciam-msal-node-webapp.cer*

If you need, you can generate a ciam-msal-node-webapp.pfx (certificate + private key combination) with the command below:

```bash
openssl pkcs12 -export -out CertificateName.pfx -inkey ciam-msal-node-webapp.key -in ciam-msal-node-webapp.cer
```

Enter an export password when prompted and make a note of it. The following file should be generated: *ciam-msal-node-webapp.pfx*.

Proceed to [Step 2](#configure-an-azure-ad-app-registration-to-use-a-certificate).

</details>

> :information_source: If you wish so, you can upload your locally generated self-signed certificate to Azure Key Vault later on. See: [Import a certificate in Azure Key Vault](https://learn.microsoft.com/azure/key-vault/certificates/tutorial-import-certificate)

#### Create self-signed certificate on Key Vault

You can use Azure Key Vault to generate a self-signed certificate for you. Doing so will have the additional benefits of assigning a partner Certificate Authority (CA) and automating certificate rotation.

> :information_source: Azure Key Vault can export certificates and private keys in `pem` format (see: [Export stored certificates](https://docs.microsoft.com/azure/key-vault/certificates/how-to-export-certificate?tabs=azure-cli#export-stored-certificates)), if **Content Type** was chosen as `pem` during certificate generation (see: [Create a certificate in Key Vault](https://docs.microsoft.com/azure/key-vault/certificates/tutorial-rotate-certificates#create-a-certificate-in-key-vault)). If for some reason this is not the case, OpenSSL can be used for conversions.
>
> ```console
> cat ciam-msal-node-webapp.crt ciam-msal-node-webapp.key > ciam-msal-node-webapp.pem ## if powershell: Get-Content ciam-msal-node-webapp.crt, ciam-msal-node-webapp.key | Set-Content ciam-msal-node-webapp.pem
> openssl pkcs12 -in ciam-msal-node-webapp.pfx -out ciam-msal-node-webapp.pem
> ```

<details>
<summary>Click here to use Azure Portal</summary>

Follow the guide: [Set and retrieve a certificate from Azure Key Vault using the Azure portal](https://learn.microsoft.com/azure/key-vault/certificates/quick-create-portal)

Afterwards, proceed to [Step 2](#configure-an-azure-ad-app-registration-to-use-a-certificate).

</details>

<details>
<summary>Click here to use Powershell</summary>

Follow the guide: [Set and retrieve a certificate from Azure Key Vault using Azure PowerShell](https://learn.microsoft.com/azure/key-vault/certificates/quick-create-powershell)

Afterwards, proceed to [Step 2](#configure-an-azure-ad-app-registration-to-use-a-certificate).

</details>

### Configure an Azure AD app registration to use a certificate

Now you must associate your Azure AD app registration with the certificate you will use in your application.

> :information_source: If you have the certificate locally available, you can follow the steps below. If your certificate(s) is on Azure Key Vault, you must first export and download them to your computer, and delete the local copy after following the steps below. See: [Export certificates from Azure Key Vault](https://learn.microsoft.com/azure/key-vault/certificates/how-to-export-certificate)

1. Navigate to [Azure portal](https://portal.azure.com) and select your Azure AD app registration.
1. Select **Certificates & secrets** blade on the left.
1. Click on **Upload** certificate and select the certificate file to upload (e.g. *ciam-msal-node-webapp*).
1. Click **Add**. Once the certificate is uploaded, the *thumbprint*, *start date*, and *expiration* values are displayed. Record the *thumbprint* value as you will make use of it later in your app's configuration file.

> For more information, see: [Register your certificate with the Microsoft identity platform](https://docs.microsoft.com/azure/active-directory/develop/active-directory-certificate-credentials#register-your-certificate-with-microsoft-identity-platform)

Proceed to [Step 3](#configure-your-apps-to-use-a-certificate)

### Configure your app(s) to use a certificate

Finally, you need to modify the app's configuration files.

#### Using an existing certificate from local machine

> Perform the steps below for the client app (ciam-msal-node-webapp)

1. Open the file where MSAL is initialized (e.g. `2-Authorization\4-call-api-express\APP\app.js`).
2. *Comment out* the line for `clientSecret`:

```javaScript
    const msal = require('@azure/msal-node');

    const msalConfig = {
        auth: {
            clientId: "YOUR_CLIENT_ID",
            authority: "https://login.microsoftonline.com/YOUR_TENANT_ID",
            //clientSecret: "YOUR_CLIENT_SECRET"
        }
    };

    const cca = new msal.ConfidentialClientApplication(msalConfig);
```

3. *Un-comment* the lines for `clientCertificate` and replace the default values:

```javaScript
    const msal = require('@azure/msal-node');
    const fs = require('fs'); // import the fs module for reading the key file

    const msalConfig = {
        auth: {
            clientId: "YOUR_CLIENT_ID",
            authority: "https://login.microsoftonline.com/YOUR_TENANT_ID",
            //clientSecret: "YOUR_CLIENT_SECRET"
            clientCertificate: {
                thumbprint: "YOUR_CERT_THUMBPRINT", // replace with thumbprint obtained during step 2 above
                privateKey: fs.readFileSync('PATH_TO_YOUR_PRIVATE_KEY_FILE'), // e.g. c:/Users/diego/Desktop/example.key
            }
        }
    };

    const cca = new msal.ConfidentialClientApplication(msalConfig);
```

> :information_source: For more details, see: [initializing-msal-node-with-certificates](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/certificate-credentials.md#initializing-msal-node-with-certificates)

You can now start the application as instructed in the [README](./README#setup-the-sample).

#### Using an existing certificate from Key Vault

> Perform the steps below for the client app (ciam-msal-node-webapp)

1. Open the file where MSAL is initialized (e.g. `2-Authorization\4-call-api-express\APP\app.js`).
2. *Comment out* the line for `clientSecret`:

```javaScript
    const msal = require('@azure/msal-node');

    const msalConfig = {
        auth: {
            clientId: "YOUR_CLIENT_ID",
            authority: "https://login.microsoftonline.com/YOUR_TENANT_ID",
            //clientSecret: "YOUR_CLIENT_SECRET"
        }
    };

    const cca = new msal.ConfidentialClientApplication(msalConfig);
```

3. Install **[Azure CLI](https://docs.microsoft.com/cli/azure/install-azure-cli)**. Then, type the following to sign-in:

```console
    az login --tenant YOUR_TENANT_ID
```

4. Install the required NPM packages:

```console
    npm install --save @azure/identity @azure/keyvault-certificates @azure/keyvault-secrets
```

5. Update the code as shown below:

```javaScript
    const msal = require('@azure/msal-node');
    const identity = require("@azure/identity");
    const keyvaultCert = require("@azure/keyvault-certificates");
    const keyvaultSecret = require('@azure/keyvault-secrets');

    const KV_URL = process.env["KEY_VAULT_URL"] || "ENTER_YOUR_KEY_VAULT_URL"
    const CERTIFICATE_NAME = process.env["CERTIFICATE_NAME"] || "ENTER_THE_NAME_OF_YOUR_CERTIFICATE_ON_KEY_VAULT";

    // Initialize Azure SDKs
    const credential = new identity.DefaultAzureCredential();
    const certClient = new keyvaultCert.CertificateClient(KV_URL, credential);
    const secretClient = new keyvaultSecret.SecretClient(KV_URL, credential);

    async function main() {

        // Grab the certificate thumbprint
        const certResponse = await certClient.getCertificate(CERTIFICATE_NAME).catch(err => console.log(err));
        const thumbprint = certResponse.properties.x509Thumbprint.toString('hex')

        // When you upload a certificate to Key Vault, a secret containing your private key is automatically created
        const secretResponse = await secretClient.getSecret(CERTIFICATE_NAME).catch(err => console.log(err));;

        // secretResponse contains both public and private key, but we only need the private key
        const privateKey = secretResponse.value.split('-----BEGIN CERTIFICATE-----\n')[0]

        const msalConfig = {
            auth: {
                clientId: "YOUR_CLIENT_ID",
                authority: "https://login.microsoftonline.com/YOUR_TENANT_ID",
                //clientSecret: "YOUR_CLIENT_SECRET",
                clientCertificate: {
                    thumbprint: thumbprint
                    privateKey: privateKey
                }
            }
        };

        const cca = new msal.ConfidentialClientApplication(msalConfig);
    }

    main();
```

> :information_source: For more details, see: [Get certificate from your Key Vault in Node.js](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/key-vault-managed-identity.md#get-certificate-from-your-vault-in-nodejs)

You can now start the application as instructed in the [README](./README#setup-the-sample).

## Using Managed Identity

Once you deploy your app(s) to Azure App Service, you can assign a managed identity to it for accessing Azure Key Vault using its own identity. This allows you to eliminate the all secrets, certificates, connection strings and etc. from your source code.

### Create a system-assigned identity

1. Navigate to [Azure portal](https://portal.azure.com) and select the **Azure App Service**.
1. Find and select the App Service instance you've created previously.
1. On App Service portal, select **Identity**.
1. Within the **System assigned** tab, switch **Status** to **On**. Click **Save**.

For more information, see [Add a system-assigned identity](https://docs.microsoft.com/azure/app-service/overview-managed-identity?tabs=dotnet#add-a-system-assigned-identity)

### Grant access to Key Vault

Now that your app deployed to App Service has a managed identity, in this step you grant it access to your key vault.

1. Go to the [Azure portal](https://portal.azure.com) and search for your Key Vault.
1. Select **Overview** > **Access policies** blade on the left.
1. Click on **Add Access Policy** > **Certificate permissions** > **Get**
1. Click on **Add Access Policy** > **Secret permissions** > **Get**
1. Click on **Select Principal**, add your account and pre-created **system-assigned** identity.
1. Click on **OK** to add the new Access Policy, then click **Save** to save the Access Policy.

For more information, see [Use Key Vault from App Service with Azure Managed Identity](https://docs.microsoft.com/samples/azure-samples/app-service-msi-keyvault-dotnet/keyvault-msi-appservice-sample/)

### Add environment variables

Finally, you need to add environment variables to the App Service where you deployed your app.

> :warning: Make sure your application is able to read environment variables. Alternatively, you can hardcode the key vault URL and certificate name in your applications configuration file.

1. In the [Azure portal](https://portal.azure.com), search for and select **App Service**, and then select your app.
1. Select **Configuration** blade on the left, then select **New Application Settings**.
1. Add the following variables (key-value pairs):
    1. **KEY_VAULT_URL**: the URL of the key vault you've created, e.g. `https://example.vault.azure.net`
    1. **CERTIFICATE_NAME**: the name of the certificate you specified when importing it to key vault, e.g. `ExampleCert`

Wait for a few minutes for your changes on **App Service** to take effect. You should then be able to visit your published website and sign-in accordingly.

## More information

- [Microsoft identity platform application authentication certificate credentials](https://docs.microsoft.com/azure/active-directory/develop/active-directory-certificate-credentials)
- [Create a self-signed public certificate to authenticate your application](https://docs.microsoft.com/azure/active-directory/develop/howto-create-self-signed-certificate)
- [Various SSL/TLS certificate file types/extensions](https://docs.microsoft.com/archive/blogs/kaushal/various-ssltls-certificate-file-typesextensions)
- [Azure Key Vault Developer's Guide](https://docs.microsoft.com/azure/key-vault/general/developers-guide)
- [Managed identities for Azure resources](https://docs.microsoft.com/azure/active-directory/managed-identities-azure-resources/overview)
