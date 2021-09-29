# Errors

***

**[ClientAuthErrors](#Clientautherrors)**

1.[endpoints_resolution_error](#endpoints_resolution_error)

2.[openid_config_error](#openid_config_error)

3.[invalid_assertion](#invalid_assertion)

4.[request_cannot_be_made](#request_cannot_be_made)

5.[invalid_client_credential](#invalid_client_credential)

**[ClientConfigurationErrors](#ClientConfigurationErrors)**

1.[empty_url_error](#empty_url_error)

2.[url_parse_error](#url_parse_error)

**[Other](#other)**

## ClientAuthErrors

### Endpoints_resolution_error

**Error Message**: Error: could not resolve endpoints. Please check network and try again.

This error is thrown under the following scenarios:

1. When a wrong authority endpoint is provided. Details: ClientAuthError: `openid_config_error`: Could not retrieve endpoints. Check your authority and verify the .well-known/openid-configuration endpoint returns the required endpoints. 

Ensure that the authority provided matches the authority in your azure app registration or the `common`, `consumers` or `organizations` endpoints.
```javascript
const config = {
    auth: {
        authority: "https://login.microsoftonline.com/<provide-authority-that-matches-your-app-registration>"
        // ...   
    }
}
```

2. When there is no internet connectivity. Details: ClientConfigurationError: `untrusted_authority`: The provided authority is not a trusted authority. Please include this authority in the knownAuthorities config parameter. It is also thrown when no authority is appended to the authority endpoint.
    

### Invalid_assertion

**Error Message**: Client assertion must meet requirements described in https://tools.ietf.org/html/rfc7515. 

This error is thrown when either the certificate thumbprint or public key is not provided or commented out.

❌ The following example will throw this error because `thumbprint` is not provided:

```javascript
auth: {
        //...
        clientCertificate: {
            thumbprint: "", // can be obtained when uploading certificate to Azure AD
            privateKey: privateKey,
        }
    }
```

❌ The following example will throw this error because `publicKey` is not provided:

```javascript
auth: {
        //...
        clientCertificate: {
            thumbprint: "YOUR_THUMBPRINT", // can be obtained when uploading certificate to Azure AD
            privateKey: "",
        }
    }
```


### Request_cannot_be_made

**Error message**: Token request cannot be made without authorization code or refresh token.

This error is thrown when no authority is provided for auth flows such as auth-code-with-certs. 

❌ The following example will throw this error because `authority` is commented out:

```javascript
auth: {
        clientId: "CLIENT_ID",
        // authority: "https://login.microsoftonline.com/YOUR-AUTHORITY",
        clientCertificate: {
            thumbprint: "YOUR_THUMBPRINT", 
            privateKey: privateKey,
        }
    }
```


### Invalid_client_credential

**Error message**: Client credential (secret, certificate, or assertion) must not be empty when creating a confidential client. An application should at most have one credential

This error is thrown when the client's certificate is not provided.

❌ The following example will throw this error because `clientCertificate` is commented out:

```javascript
auth: {
        clientId: "CLIENT_ID",
        authority: "https://login.microsoftonline.com/YOUR-AUTHORITY",
        // clientCertificate: {
        //     thumbprint: "YOUR_THUMBPRINT", 
        //     privateKey: privateKey,
        // }
    }
```


## ClientConfigurationErrors

### Empty_url_error

**Error message**: URL was empty or null.

This Error is thrown when no authority endpoint is provided in flows such as auth-code-with-certs.

❌ The following example will throw this error because `authority` is not provided:

```javascript
auth: {
        clientId: "CLIENT_ID",
        authority: "",
        clientCertificate: {
            thumbprint: "YOUR_THUMBPRINT", 
            privateKey: privateKey,
        }
    }
```


### Url_parse_error

**Error message**: URL could not be parsed into appropriate segments. 

This error is thrown when an invalid URL is provided as the authority value.

❌ The following example will throw this error because `authority` endpoint provided is not a valid URL string:

```javascript
auth: {
        clientId: "CLIENT_ID",
        authority: "login.microsoftonline.com/common",
        clientCertificate: {
            thumbprint: "YOUR_THUMBPRINT", 
            privateKey: privateKey,
        }
    }
```

✔️ To resolve, ensure that the authority endpoint provided is a valid URL.

```javascript
auth: {
        clientId: "CLIENT_ID",
        authority: "https://login.microsoftonline.com/YOUR-AUTHORITY",
        clientCertificate: {
            thumbprint: "YOUR_THUMBPRINT", 
            privateKey: privateKey,
        }
    }
```
