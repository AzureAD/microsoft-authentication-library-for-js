# Subject Name/Issuer Authentication
SNI (Subject Name/Issuer) auth allows an app to authenticate using a public certificate from a predetermined trusted CA to support complex cert rollover scenarios. It uses the [X5C header parameter](https://tools.ietf.org/html/rfc7515#section-4.1.6) to provide the cert to the server.

First party users should follow the instructions on the [internal AAD wiki](https://aadwiki.windows-int.net/index.php?title=Subject_Name_and_Issuer_Authentication) to set up their AAD environment to support SNI.

### App Configuration
You will need to supply the string from your `.pfx` file to the `msal` config in the `clientCertificate.x5c` field in addition to providing both `clientCertificate.thumbprint` and `clientCertificate.privateKey`. `msal` will parse the string to extract the actual certificate chain.

```js
const msalConfig = {
    auth: {
        clientId: "enter_client_id_here",
        clientCertificate: {
            thumbprint: "enter_thumbprint_here",
            privateKey: "enter_privatekey_here",
            x5c: "enter_x5c_here"
        },
    }
}
```

Example `x5c` string from a `.pfx` file:
```
-----BEGIN CERTIFICATE-----
<cert1>
-----END CERTIFICATE-----

-----BEGIN CERTIFICATE-----
<cert2>
-----END CERTIFICATE-----
```
