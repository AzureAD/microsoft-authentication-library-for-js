# Securing MSAL Node app credentials with Azure Key Vault and Azure Managed Identity

> :warning: Before you start here, make sure you understand [Using certificate credentials with MSAL Node](./certificate-credentials.md).

## Using Azure Key Vault

Sensitive information should not be stored in source code. This section covers creating a key vault and accessing credentials from it using Azure SDKs. For an implementation, see the code sample: [auth-code-key-vault](../../../samples/msal-node-samples/auth-code-key-vault).

### Create a key vault and import certificates

First, create a key vault. To do so, follow the guide: [Quickstart: Create a key vault using the Azure portal](https://docs.microsoft.com/azure/key-vault/general/quick-create-portal#create-a-vault)

> :information_source: In addition to certificates, **Azure Key Vault** can also be used for storing secrets and other sensitive information such as database connection strings and etc.

Now you can import your certificate to Key Vault. **Azure Key Vault** expects certificates in either:

* *.pem* file format contains one or more X509 certificate files.
* *.pfx* file format is an archive file format for storing several cryptographic objects in a single file i.e. server certificate (issued for your domain), a matching private key, and may optionally include an intermediate CA.

> :bulb: If you don't have any certificates at hand, you can use Azure Key Vault to generate it for you. It will have the additional benefits of assigning partner Certificate Authority and automating certificate rotation. For more information, see [Quickstart: Generate a certificate with Azure Key Vault using the Azure portal](https://docs.microsoft.com/azure/key-vault/certificates/quick-create-portal)

We will combine our public and private key into a single *.pem* file, and upload this file to Key Vault. For conversion, we will use **OpenSSL**. Type the following in a terminal:

If your private key is encrypted, you'll have to decrypt it first:

```bash
openssl pkcs8 -in example.key -out example.key
```

Then combine the public key with the decrypted private key to get a single `.pem` file:

```bash
cat example.crt example.key > example.pem
```

> Powershell users can use **cat** equivalent below:
>
>```powershell
>    Get-Content example.crt, exampleDecrypted.key | Set-Content example.pem
>```

This should give you `example.pem`. Next, **upload** this to Key Vault.

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

> :information_source: When you generate/import a certificate to Azure Key Vault Certificates, a corresponding private key is created automatically under Azure Key Vault Secrets. Later on, you can retrieve your private key from the **Secrets** blade.

### Get certificate from your vault in Node.js

Using [Azure Key Vault JavaScript SDK](https://docs.microsoft.com/javascript/api/overview/azure/keyvault-certificates-readme?view=azure-node-latest), we can fetch the certificate we've uploaded in the previous step. During development, Azure **Key Vault JavaScript SDK** grabs the required access token from the local environment using VS Code's context, via [@azure/identity](https://docs.microsoft.com/javascript/api/overview/azure/identity-readme?view=azure-node-latest) package. To do this, you'll need to be signed in to Azure.

First, [download and install](https://docs.microsoft.com/cli/azure/install-azure-cli) **Azure CLI**. This should add **Azure CLI** to system path. Re-launch VS Code and **Azure CLI** should be available in VS Code [integrated terminal](https://code.visualstudio.com/docs/editor/integrated-terminal). Then, type the following to sign-in:

```console
az login --tenant YOUR_TENANT_ID
```

Once authenticated, [@azure/identity](https://docs.microsoft.com/javascript/api/overview/azure/identity-readme?view=azure-node-latest) package can access the Azure Key Vault as shown below:

```JavaScript

// Initialize Azure SDKs
const credential = new identity.DefaultAzureCredential();
const certClient = new keyvaultCert.CertificateClient(KVUri, credential);
const secretClient = new keyvaultSecret.SecretClient(KVUri, credential);

async function main() {

    // Grab the certificate thumbprint
    const certResponse = await certClient.getCertificate(CERTIFICATE_NAME);
    const thumbprint = certResponse.properties.x509Thumbprint.toString('hex').toUpperCase();
    
    // When you upload a certificate to Key Vault, a "secret" containing your private key is automatically created
    const secretResponse = await secretClient.getSecret(CERTIFICATE_NAME);

    // secretResponse contains both public and private key, but we only need the private key
    const privateKey = secretResponse.value.split('-----BEGIN CERTIFICATE-----\n')[0]

    // Initialize msal and start the server 
    msalApp(thumbprint, privateKey);
}

main();
```

For an implementation, see the code sample: [auth-code-key-vault](../../../samples/msal-node-samples/auth-code-key-vault).

> :information_source: Converting `PKCS12/PFX` to `PEM`
>
> In most circumstances, Azure Key Vault can export certificates and private keys in `pem` format (see: [Export stored certificates](https://docs.microsoft.com/azure/key-vault/certificates/how-to-export-certificate?tabs=azure-cli#export-stored-certificates)), if **Content Type** was chosen as `pem` during certificate generation (see: [Create a certificate in Key Vault](https://docs.microsoft.com/azure/key-vault/certificates/tutorial-rotate-certificates#create-a-certificate-in-key-vault)). If for some reason this is not the case, OpenSSL can be used for conversions:
>
> ```bash
> openssl pkcs12 -in certificate.pfx -out certificate.pem
> ```
>
> If the conversion needs to happen programmatically, then you may have to rely on a 3rd party package, as Node.js offers no native method for this. For instance, using a popular TLS implementation like [node-forge](https://www.npmjs.com/package/node-forge), you can do:
>
> ```javascript
>
> const secretClient = new keyvaultSecret.SecretClient(KVUri, credential);
> const secretResponse = await secretClient.getSecret(CERTIFICATE_NAME).catch(err => console.log(err));
> convertPFX(secretResponse.value) // pkcs12/pfx formatted certificate + private key combination
>
> /**
> * @param {string} pfx: a certificate in pkcs12 format
> * @param {string} passphrase: passphrase used to encrypt pfx file
> * @returns {Object}
> */
> function convertPFX(pfx, passphrase = null) {
>
>    const asn = forge.asn1.fromDer(forge.util.decode64(pfx));   
>    const p12 = forge.pkcs12.pkcs12FromAsn1(asn, true, passphrase);
>
>    // Retrieve key data
>    const keyData = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[forge.pki.oids.pkcs8ShroudedKeyBag]
>        .concat(p12.getBags({ bagType: forge.pki.oids.keyBag })[forge.pki.oids.keyBag]);
>
>    // Retrieve certificate data
>    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag];
>    const certificate = forge.pki.certificateToPem(certBags[0].cert)
>
>    // Convert a Forge private key to an ASN.1 RSAPrivateKey
>    const rsaPrivateKey = forge.pki.privateKeyToAsn1(keyData[0].key);
>
>    // Wrap an RSAPrivateKey ASN.1 object in a PKCS#8 ASN.1 PrivateKeyInfo
>    const privateKeyInfo = forge.pki.wrapRsaPrivateKey(rsaPrivateKey);
>
>    // Convert a PKCS#8 ASN.1 PrivateKeyInfo to PEM
>    const privateKey = forge.pki.privateKeyInfoToPem(privateKeyInfo);
>
>    console.log("Converted certificate: \n", certificate);
>    console.log("Converted key: \n", privateKey);
>
>    return {
>        certificate: certificate,
>        key: privateKey
>    };
> }
> ```

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

Wait for a few minutes for your changes on **App Service** to take effect. You should then be able to visit your published website and sign-in accordingly.

## More Information

* [Microsoft identity platform application authentication certificate credentials](https://docs.microsoft.com/azure/active-directory/develop/active-directory-certificate-credentials)
* [Azure Key Vault Developer's Guide](https://docs.microsoft.com/azure/key-vault/general/developers-guide)
* [Various SSL/TLS Certificate File Types/Extensions](https://docs.microsoft.com/archive/blogs/kaushal/various-ssltls-certificate-file-typesextensions)
