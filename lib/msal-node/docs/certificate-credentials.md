# Using Certificate Credentials with MSAL Node

> :warning: Before you start here, make sure you understand [Initialize confidential client applications](./initialize-confidential-client-application).

You can build confidential client applications with MSAL Node (web apps, daemon apps etc). A **client credential** is mandatory for confidential clients. Client credential can be a:

* `clientSecret`: a secret string generated set on the app registration.
* `clientCertificate`: a certificate set on the app registration. The `thumbprint` is a *X.509 SHA-1* thumbprint of the certificate, and the `privateKey` is the PEM encoded private key. `x5c` is the optional *X.509* certificate chain used in [subject name/issuer auth scenarios](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/sni.md).
* `clientAssertion`: a string that the application uses when requesting a token. The certificate used to sign the assertion should be set on the app registration. Assertion should be of type `urn:ietf:params:oauth:client-assertion-type:jwt-bearer`.

## Using Certificates

This section covers creating a self-signed certificate and initializing a confidential client. For an implementation, eee the code sample: [auth-code-with-certs](../../../samples/msal-node-samples/standalone-samples/auth-code-with-certs);

### Generating self-signed certificates

Build and install **OpenSSL** for your **OS** following the guide at [github.com/openssl](https://github.com/openssl/openssl#build-and-install). If you like to skip building and get a binary distributable from the community instead, check the [OpenSSL Wiki: Binaries](https://wiki.openssl.org/index.php/Binaries) page.

Afterwards, add the path to `OpenSSL` to your **environment variables** so that you can call it from anywhere.

Type the following in a terminal. You will be prompted to enter some identifying information and a *passphrase*:

```console
    openssl req -x509 -newkey rsa:4096 -sha256 -days 365 -keyout example.key -out example.crt -subj "/CN=example.com" -addext "subjectAltName=DNS:example.com"

    Generating a RSA private key
    ...........................................................................................................................................................................................................................................................++++
    writing new private key to 'example.key'
    Enter PEM pass phrase:
    Verifying - Enter PEM pass phrase:
    ----- 
```

After that, the following files should be generated: `example.key`, `example.crt`.

> Powershell users can run the [New-SelfSignedCertificate](https://docs.microsoft.com/powershell/module/pkiclient/new-selfsignedcertificate?view=win10-ps) command:
>
> ```powershell
>$cert=New-SelfSignedCertificate -Subject "CN=DaemonConsoleCert" -CertStoreLocation "Cert:\CurrentUser\My"  -KeyExportPolicy Exportable -KeySpec Signature
>```
>
> Extensions: Certificate files come in various file extensions, such as *.crt*, *.csr*, *.cer*, *.pem*, *.pfx*, *.key*. For file type conversions, see [SSL/TLS Certificate File Types/Extensions](https://docs.microsoft.com/archive/blogs/kaushal/various-ssltls-certificate-file-typesextensions).

### Trusting self-signed certificates

You'll need to add your self-signed certificates to the key chain of your **OS**. You will still see a warning in your browser afterwards.

* For Windows users, follow the guide here: [Installing the trusted root certificate](https://docs.microsoft.com/skype-sdk/sdn/articles/installing-the-trusted-root-certificate).

> Alternatively, see: [How to: View certificates with the MMC snap-in](https://docs.microsoft.com/dotnet/framework/wcf/feature-details/how-to-view-certificates-with-the-mmc-snap-in)

* For MacOS users, follow the guide here: [ENTER_NAME_HERE](ENTER_LINK_HERE).

> :warning: You might need **administrator** privileges for running the commands above.

### Registering self-signed certificates

You need to upload your certificate to **Azure AD**. In the Azure AD app registration:

1. Navigate to [Azure portal](https://portal.azure.com) and select your Azure AD app registration.
2. Select **Certificates & secrets** blade on the left.
3. Click on **Upload** certificate and select the certificate file to upload.
4. Click **Add**. Once the certificate is uploaded, the *thumbprint*, *start date*, and *expiration* values are displayed.

For more information, see: [Register your certificate with Microsoft identity platform](https://docs.microsoft.com/azure/active-directory/develop/active-directory-certificate-credentials#register-your-certificate-with-microsoft-identity-platform)

### Initializing MSAL Node with certificates

```javascript
const msal = require('@azure/msal-node');

const config = {
    auth: {
        clientId: "YOUR_CLIENT_ID",
        authority: "https://login.microsoftonline.com/YOUR_TENANT_ID",
        clientCertificate: {
            thumbprint: "CERT_THUMBPRINT",
            privateKey: "CERT_PRIVATE_KEY",
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
```

You may need to extract private key from a **PEM** file. This can be done using Express crypto module:

```javascript
const fs = require('fs');
const crypto = require('crypto');

const privateKeySource = fs.readFileSync('./NodeWebCert.pem')

const privateKeyObject = crypto.createPrivateKey({
    key: privateKeySource,
    passphrase: "YOUR_PASSPHRASE",
    format: 'pem'
});

const privateKey = privateKeyObject.export({
    format: 'pem',
    type: 'pkcs8'
});
```

### Creating an HTTPS server in Node.js

Setup a **HTTPS** server by importing the generated **certificate** and **public key** files and passing them as `options` to `https.createServer()` method. This is shown below:

```javascript
    const express = require('express');
    const https = require('https');
    const fs = require('fs');

    const DEFAULT_PORT = process.env.PORT || 5000;
    
    // initialize express.
    const app = express();
    
    const options = {
        key: fs.readFileSync(path.join(__dirname + "/example.com.key")),
        cert: fs.readFileSync(path.join(__dirname + "/example.com.crt"))
    };
    
    const server = https.createServer(options, app);
    
    server.listen(port, () => {
        console.log("server started on port : " + DEFAULT_PORT)
    });
```

For an implementation, see the code sample: [auth-code-with-certs](../../../samples/msal-node-samples/standalone-samples/auth-code-with-certs)

## More Information

* [Microsoft identity platform application authentication certificate credentials](https://docs.microsoft.com/azure/active-directory/develop/active-directory-certificate-credentials)