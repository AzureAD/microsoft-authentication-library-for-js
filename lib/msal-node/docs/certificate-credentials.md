# Using certificate credentials with MSAL Node

> :warning: Before you start here, make sure you understand [Initialize confidential client applications](./initialize-confidential-client-application.md).

You can build confidential client applications with MSAL Node (web apps, daemon apps etc). A **client credential** is mandatory for confidential clients. Client credential can be a:

* `clientSecret`: a secret string generated during the app registration, or updated post registration for an existing application.
* `clientCertificate`: a certificate set during the app registration, or updated post registration for an existing application. The `thumbprint` is a *X.509 SHA-1* thumbprint of the certificate, and the `privateKey` is the PEM encoded private key. `x5c` is the optional *X.509* certificate chain used in [subject name/issuer auth scenarios](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/sni.md).
* `clientAssertion`: a string that the application uses when requesting a token. The certificate used to sign the assertion should be set on the app registration. Assertion should be of type `urn:ietf:params:oauth:client-assertion-type:jwt-bearer`.

## Using certificates

This section covers creating a self-signed certificate and initializing a confidential client. For an implementation, see the code sample: [auth-code-with-certs](../../../samples/msal-node-samples/auth-code-with-certs)

### Generating self-signed certificates

Download and build **OpenSSL** for your **OS** following the guide at [github.com/openssl](https://github.com/openssl/openssl#build-and-install). If you like to skip building and get a binary distributable from the community instead, check the [OpenSSL Wiki: Binaries](https://wiki.openssl.org/index.php/Binaries) page.

Afterwards, add the path to **OpenSSL** to your **environment variables** so that you can call it from anywhere.

Type the following in a terminal. You will be prompted to enter a *pass phrase* (this is optional, but recommended):

```bash
    openssl req -x509 -newkey rsa:2048 -keyout example.key -out example.crt -subj "/CN=example.com"
```

> :bulb: Add the `-nodes` parameter above if you don't want to encrypt your private key with a *pass phrase*.
> :bulb: The default lifetime of a self-signed certificate is 32 days. The `-days` parameter can be used to change this.

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

* *example.crt*: your public key. This is the actual certificate file that you'll upload to Azure AD.
* *example.key*: your private key.

> Powershell users can run the [New-SelfSignedCertificate](https://docs.microsoft.com/powershell/module/pkiclient/new-selfsignedcertificate?view=win10-ps) command:
>
> ```powershell
>$cert=New-SelfSignedCertificate -Subject "CN=example.com" -CertStoreLocation "Cert:\CurrentUser\My"  -KeyExportPolicy Exportable -KeySpec Signature
>```
>
> This command will generate two files: *example.cer* (public key) and *example.pfx* (public key + encrypted private key, usually formatted in *PKCS#12*). For more information, see: [Create a self-signed public certificate to authenticate your application](https://docs.microsoft.com/azure/active-directory/develop/howto-create-self-signed-certificate)

> :information_source: Certificate files come in various file extensions, such as *.crt*, *.csr*, *.cer*, *.pem*, *.pfx*, *.key*. For file type conversions, you can use *OpenSSL*. See below for [pfx to pem conversion](#optional-converting-pfx-to-pem). For other type of conversions, please refer to: [SSL/TLS Certificate File Types/Extensions](https://docs.microsoft.com/archive/blogs/kaushal/various-ssltls-certificate-file-typesextensions).

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
            thumbprint: "CERT_THUMBPRINT", // a 40-digit hexadecimal string
            privateKey: "CERT_PRIVATE_KEY",
        }
    }
};

// Create msal application object
const cca = new msal.ConfidentialClientApplication(config);
```

Both `thumbprint` and `privateKey` are expected to be strings. `privateKey` is further expected to be in the following form (*PKCS#8*):

```text
-----BEGIN ENCRYPTED PRIVATE KEY-----
MIIJQwIBADANBgkqhkiG9w0BAQEFAASCCS0wggkpAgEAAoICAQDkpKPrsfpIijS3
z2HCpDsa7dxOsKIrm7F1AtGBjyB0yVDjlh/FA7jT5sd2ypBh3FVsZGJudQsLRKfE
// ...
-----END ENCRYPTED PRIVATE KEY-----
```

> :information_source: Alternatively, your private key may begin with `-----BEGIN PRIVATE KEY-----` (unencrypted *PKCS#8*) or `-----BEGIN RSA PRIVATE KEY-----` (*PKCS#1*). These formats are also permissible. The following can be used to convert any compatible key to the PKCS#8 key type:
>
> ```bash
> openssl pkcs8 -topk8 -inform PEM -outform PEM -in example.key -out example.key
> ```

If you have encrypted your private key (or if your private key is already encrypted) with a *pass phrase* as recommended, you'll need to decrypt it before passing it to **MSAL Node**. This can be done using Node's [crypto module](https://nodejs.org/docs/latest-v14.x/api/crypto.html). Use the `createPrivateKey()` method to parse and export your key:

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

### (Optional) Converting pfx to pem

OpenSSL can be used for converting *pfx* encoded certificate files to *pem*:

```bash
    openssl pkcs12 -in certificate.pfx -out certificate.pem
```

If the conversion needs to happen programmatically, then you may have to rely on a 3rd party package, as Node.js offers no native method for this. For instance, using a popular TLS implementation like [node-forge](https://www.npmjs.com/package/node-forge), you can do:

```javascript
const forge = require('node-forge');

/**
 * @param {string} pfx: certificate + private key combination in pfx format
 * @param {string} passphrase: passphrase used to encrypt pfx file
 * @returns {Object}
 */
function convertPFX(pfx, passphrase = null) {

    const asn = forge.asn1.fromDer(forge.util.decode64(pfx));
    const p12 = forge.pkcs12.pkcs12FromAsn1(asn, true, passphrase);

    // Retrieve key data
    const keyData = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[forge.pki.oids.pkcs8ShroudedKeyBag]
        .concat(p12.getBags({ bagType: forge.pki.oids.keyBag })[forge.pki.oids.keyBag]);

    // Retrieve certificate data
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag];
    const certificate = forge.pki.certificateToPem(certBags[0].cert)

    // Convert a Forge private key to an ASN.1 RSAPrivateKey
    const rsaPrivateKey = forge.pki.privateKeyToAsn1(keyData[0].key);

    // Wrap an RSAPrivateKey ASN.1 object in a PKCS#8 ASN.1 PrivateKeyInfo
    const privateKeyInfo = forge.pki.wrapRsaPrivateKey(rsaPrivateKey);

    // Convert a PKCS#8 ASN.1 PrivateKeyInfo to PEM
    const privateKey = forge.pki.privateKeyInfoToPem(privateKeyInfo);

    console.log("Converted certificate: \n", certificate);
    console.log("Converted key: \n", privateKey);

    return {
        certificate: certificate,
        key: privateKey
    };
}
```

### (Optional) Creating an HTTPS server

The OAuth 2.0 protocol recommends using an HTTPS connection whenever possible. Most cloud services like Azure App Service will provide HTTPS connection by default via proxy. If for testing purposes you would like to setup your own HTTPS server, see the [Node.js HTTPS guide](https://nodejs.org/knowledge/HTTP/servers/how-to-create-a-HTTPS-server/).

You'll also need to add your self-signed certificates to the *credential manager* / *key chain* of your **OS** to bypass the browser's security policy. You may still see a warning in your browser afterwards (e.g. Chrome).

* For Windows users, follow the guide here: [How to: View certificates with the MMC snap-in](https://docs.microsoft.com/dotnet/framework/wcf/feature-details/how-to-view-certificates-with-the-mmc-snap-in).

* For Linux and MacOS users, please consult your operating system documentation on how to install certificates.

> :warning: You might need **administrator** privileges for running the commands above.

### Common issues

In some cases, you may receive an error from Azure AD when trying to authenticate using certificates, such as the `AADSTS700027: Client assertion contains an invalid signature` error, indicating that the certificates and/or private keys that you use to initialize MSAL Node are malformed. A common reason for this is that the certificate / private key string that you are supplying to MSAL Node contains unexpected characters, such as *return carriages* (`\r`) or *newlines* (`\n`):

```text
-----BEGIN CERTIFICATE-----\nMIIDDzCCAfegAwIBAgIJAMkyzQVK88NHMA0GCSqGSIb3DQEBBQUAMIGCMQswCQYDVQQGEwJTRTESMBAGA1UECBMJU3RvY2tob2xtMQ4wDAYDVQQHEwVLaXN0YTEQMA4G0fbkqbKulrchGbNgkankZtEVg4PGjobZq7B+njvcVa7SsWF/WLq5AUbw==\r\n-----END CERTIFICATE-----
```

Alternatively, your certificate / key file may contain *bag attributes*:

```text
Bag Attributes
    localKeyID: 28 B5 8E 16 11 88 E9 00 58 D5 76 30 12 B9 59 B8 E4 CE 7C AA
subject=/C=UK/ST=Suffolk/L=Ipswich/O=Example plc/CN=alice
issuer=/C=UK/ST=Suffolk/L=Ipswich/O=Example plc/CN=Certificate Authority/emailAddress=ca@example.com\n
-----BEGIN CERTIFICATE-----
MIIDDzCCAfegAwIBAgIJAMkyzQVK88NHMA0GCSqGSIb3DQEBBQUAMIGCMQswCQYD
VQQGEwJTRTESMBAGA1UECBMJU3RvY2tob2xtMQ4wDAYDVQQHEwVLaXN0YTEQMA4G
0fbkqbKulrchGbNgkankZtEVg4PGjo+Y8MdMjtfSZB29hwYvfMX09jzJ68ZqmpYQ
njvcVtLbEZN5OGCkaslb/f2OxLbsUNgIbws538WnaaufDvKmQe2kUdWmpl9Wn9Bf
bZq7B+njvcVa7SsWF/WLq5AUbw==
-----END CERTIFICATE-----
```

In such cases, you are responsible for cleaning the string before you pass them to MSAL Node configuration. For instance:

```javascript
const msal = require('@azure/msal-node');
const fs = require('fs');

const privateKeySource = fs.readFileSync('./certs/example.key');
const privateKey = Buffer.from(privateKeySource, 'base64').toString().replace(/\r/g, "").replace(/\n/g, "");

const config = {
    auth: {
        clientId: "YOUR_CLIENT_ID",
        authority: "https://login.microsoftonline.com/YOUR_TENANT_ID",
        clientCertificate: {
            thumbprint: "CERT_THUMBPRINT", // a 40-digit hexadecimal string
            privateKey: privateKey,
        }
    }
};

// Create msal application object
const cca = new msal.ConfidentialClientApplication(config);
```

## More Information

* [Microsoft identity platform application authentication certificate credentials](https://docs.microsoft.com/azure/active-directory/develop/active-directory-certificate-credentials)
* [Create a self-signed public certificate to authenticate your application](https://docs.microsoft.com/azure/active-directory/develop/howto-create-self-signed-certificate)
* [Various SSL/TLS Certificate File Types/Extensions](https://docs.microsoft.com/archive/blogs/kaushal/various-ssltls-certificate-file-typesextensions)
