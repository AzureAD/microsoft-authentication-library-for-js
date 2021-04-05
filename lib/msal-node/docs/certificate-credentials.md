# Using certificate credentials with MSAL Node

> :warning: Before you start here, make sure you understand [Initialize confidential client applications](./initialize-confidential-client-application.md).

You can build confidential client applications with MSAL Node (web apps, daemon apps etc). A **client credential** is mandatory for confidential clients. Client credential can be a:

* `clientSecret`: a secret string generated set on the app registration.
* `clientCertificate`: a certificate set on the app registration. The `thumbprint` is a *X.509 SHA-1* thumbprint of the certificate, and the `privateKey` is the PEM encoded private key. `x5c` is the optional *X.509* certificate chain used in [subject name/issuer auth scenarios](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/sni.md).
* `clientAssertion`: a string that the application uses when requesting a token. The certificate used to sign the assertion should be set on the app registration. Assertion should be of type `urn:ietf:params:oauth:client-assertion-type:jwt-bearer`.

## Using certificates

This section covers creating a self-signed certificate and initializing a confidential client. For an implementation, see the code sample: [auth-code-with-certs](../../../samples/msal-node-samples/auth-code-with-certs)

### Generating self-signed certificates

Build and install **OpenSSL** for your **OS** following the guide at [github.com/openssl](https://github.com/openssl/openssl#build-and-install). If you like to skip building and get a binary distributable from the community instead, check the [OpenSSL Wiki: Binaries](https://wiki.openssl.org/index.php/Binaries) page.

Afterwards, add the path to `OpenSSL` to your **environment variables** so that you can call it from anywhere.

Type the following in a terminal. You will be prompted to enter a *pass phrase* (this is optional, but recommended):

```bash
    openssl req -x509 -newkey rsa:2048 -sha256 -days 365 -keyout example.key -out example.crt -subj "/CN=example.com"
```

> :lightbulb: add *-nodes* if you don't want to encrypt your private key with a *pass phrase*.

In your terminal, you should see:

```bash
    Generating a RSA private key
    ..............................................
    ..............................................
    writing new private key to 'example.key'
    Enter PEM pass phrase:
    Verifying - Enter PEM pass phrase:
    ----- 
```

After that, the following files should be generated:

* `example.crt`: your public key. This is the actual certificate file that you'll mainly work with.
* `example.key`: your private key

> Powershell users can run the [New-SelfSignedCertificate](https://docs.microsoft.com/powershell/module/pkiclient/new-selfsignedcertificate?view=win10-ps) command:
>
> ```powershell
>$cert=New-SelfSignedCertificate -Subject "CN=example.com" -CertStoreLocation "Cert:\CurrentUser\My"  -KeyExportPolicy Exportable -KeySpec Signature
>```
>
> This command will generate two files: *example.cer* (public key) and *example.pfx* (public key + encrypted private key).

> :information_source: Certificate files come in various file extensions, such as *.crt*, *.csr*, *.cer*, *.pem*, *.pfx*, *.key*. For file type conversions, you can use *OpenSSL*. For more information, see [SSL/TLS Certificate File Types/Extensions](https://docs.microsoft.com/archive/blogs/kaushal/various-ssltls-certificate-file-typesextensions).

### Trusting self-signed certificates

You'll need to add your self-signed certificates to the *credential manager* / *key chain* of your **OS**. You may still see a warning in your browser afterwards (e.g. Chrome).

* For Windows users, follow the guide here: [Installing the trusted root certificate](https://docs.microsoft.com/skype-sdk/sdn/articles/installing-the-trusted-root-certificate) and here [How to: View certificates with the MMC snap-in](https://docs.microsoft.com/dotnet/framework/wcf/feature-details/how-to-view-certificates-with-the-mmc-snap-in).

* For Linux and MacOS users, use community guides -with judgment- to learn about how to install certificates.

> :warning: You might need **administrator** privileges for running the commands above.

### Registering self-signed certificates

You need to upload your certificate to **Azure AD**.

1. Navigate to [Azure portal](https://portal.azure.com) and select your Azure AD app registration.
2. Select **Certificates & secrets** blade on the left.
3. Click on **Upload** certificate and select the certificate file to upload (e.g. *example.crt*).
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

Both `thumbprint` and `privateKey` are expected to be strings. `privateKey` is further expected to be in the following form:

```text
-----BEGIN ENCRYPTED PRIVATE KEY-----
MIIJQwIBADANBgkqhkiG9w0BAQEFAASCCS0wggkpAgEAAoICAQDkpKPrsfpIijS3
z2HCpDsa7dxOsKIrm7F1AtGBjyB0yVDjlh/FA7jT5sd2ypBh3FVsZGJudQsLRKfE
// more lines...
-----END ENCRYPTED PRIVATE KEY-----
```

If you have encrypted your private key with a *pass phrase* as recommended, you'll need to decrypt it before passing to **MSAL Node**. This can be done using Node's [crypto module](https://nodejs.org/docs/latest-v12.x/api/crypto.html):

First, ensure that your private key is of type `pkcs8`:

```bash
openssl pkcs8 -topk8 -inform PEM -outform PEM -in example.key -out example.key
```

You'll be prompted for the pass phrase you specified earlier and a new encryption password:

```console
Enter pass phrase for example.key.pem:
Enter Encryption Password:
Verifying - Enter Encryption Password:
```

Then use the `createPrivateKey()` method to parse and export your key:

```javascript
const fs = require('fs');
const crypto = require('crypto');

const privateKeySource = fs.readFileSync('./example.key')

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

### Creating an HTTPS server

Setup a **HTTPS** server by importing the generated **certificate** and **public key** files and passing them as `options` to `https.createServer()` method. This is shown below:

```javascript
    const express = require('express');
    const https = require('https');
    const fs = require('fs');

    const DEFAULT_PORT = process.env.PORT || 3000;
    
    // initialize express.
    const app = express();
    
    const options = {
        key: fs.readFileSync(path.join(__dirname + "/example.com.key")),
        cert: fs.readFileSync(path.join(__dirname + "/example.com.crt")),
        passphrase: "YOUR_PASSPHRASE" // omit if passphrase is not used
    };
    
    const server = https.createServer(options, app);
    
    server.listen(port, () => {
        console.log("server started on port : " + DEFAULT_PORT)
    });
```

For an implementation, see the code sample: [auth-code-with-certs](../../../samples/msal-node-samples/auth-code-with-certs)

## More Information

* [Microsoft identity platform application authentication certificate credentials](https://docs.microsoft.com/azure/active-directory/develop/active-directory-certificate-credentials)