# Request

Since MSAL Node supports various authorization code grants, there is support for different public APIs per grant and the corresponding request.

## Authorization Code Flow

### Public APIs
- [getAuthCodeUrl()](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-node/classes/_src_client_publicclientapplication_.publicclientapplication.html#getauthcodeurl): This API is the first leg of the `authorization code grant` for MSAL Node. The request is of the type [AuthorizationUrlRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-common/modules/_src_request_authorizationurlrequest_.html).
The application is sent a URL that can be used to generate an `authorization code`. This URL can be opened in a browser of choice, where the user can input their credentials, and will be redirected back to the `redirectUri` (registered during the [app registration](https://docs.microsoft.com/en-us/azure/active-directory/develop/scenario-desktop-app-registration)) with an `authorization code`. The `authorization code` can now be redeemed for a `token` with the following step. Note that if authorization code flow is being done for a public client application, [PKCE](https://tools.ietf.org/html/rfc7636) is recommended.

- [acquireTokenByCode()](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-node/classes/_src_client_publicclientapplication_.publicclientapplication.html#acquiretokenbycode): This API is the second leg of the `authorization code grant` for MSAL Node. The request constructed here should be of the type [AuthorizationCodeRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-common/modules/_src_request_authorizationcoderequest_.html). The application passed the `authorization code` received as a part of the above step and exchanges it for a `token`. Not that if authorization code flow is being done for a public client application, [PKCE](https://tools.ietf.org/html/rfc7636) is recommended.

``` javascript

    const authCodeUrlParameters = {
        scopes: ["sample_scope"],
        redirectUri: "your_redirect_uri",
    };

    // get url to sign user in and consent to scopes needed for application
    cca.getAuthCodeUrl(authCodeUrlParameters).then((response) => {
        console.log(response);
    }).catch((error) => console.log(JSON.stringify(error)));

    const tokenRequest = {
        code: "authorization_code",
        redirectUri: "your_redirect_uri",
        scopes: ["sample_scope"],
    };

    // acquire a token by exchanging the code
    cca.acquireTokenByCode(tokenRequest).then((response) => {
        console.log("\nResponse: \n:", response);
    }).catch((error) => {
        console.log(error);
    });
```

## Device Code Flow

### Public APIs
- [acquireTokenByDeviceCode()](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-node/classes/_src_client_publicclientapplication_.publicclientapplication.html#acquiretokenbydevicecode): This API lets the application acquire a token with Device Code grant. The request is of the type [DeviceCodeRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-common/modules/_src_request_devicecoderequest_.html). This API acquires a `token` from the authority using OAuth2.0 device code flow. This flow is designed for devices that do not have access to a browser or have input constraints. The authorization server issues a DeviceCode object with a verification code, an end-user code, and the end-user verification URI. The DeviceCode object is provided through a callback, and the end-user should be instructed to use another device to navigate to the verification URI to input credentials. Since the client cannot receive incoming requests, it polls the authorization server repeatedly until the end-user completes input of credentials.

``` javascript
const msalConfig = {
    auth: {
        clientId: "your_client_id_here",
        authority: "your_authority_here",
    }
};

const pca = new msal.PublicClientApplication(msalConfig);

const deviceCodeRequest = {
    deviceCodeCallback: (response) => (console.log(response.message)),
    scopes: ["user.read"],
};

pca.acquireTokenByDeviceCode(deviceCodeRequest).then((response) => {
    console.log(JSON.stringify(response));
}).catch((error) => {
    console.log(JSON.stringify(error));
});

```

## Refresh Token Flow

### Public APIs
- [acquireTokenByRefreshToken](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-node/classes/_src_client_publicclientapplication_.publicclientapplication.html#acquiretokenbyrefreshtoken): This API acquires a token by exchanging the refresh token provided for a new set of tokens. The request is of the type [RefreshTokenRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-common/modules/_src_request_refreshtokenrequest_.html). The `refresh token` is never returned to the user in a response, but can be accessed from the user cache. It is recommended that you use `acquireTokenSilent()` for non-interactive scenarios. When using `acquireTokenSilent()`, MSAL will handle the caching and refreshing of tokens automatically.

``` javascript
const config = {
    auth: {
        clientId: "your_client_id_here",
        authority: "your_authority_here",
    }
};

const pca = new msal.PublicClientApplication(config);

const refreshTokenRequest = {
    refreshToken: "",
    scopes: ["user.read"],
};

pca.acquireTokenByRefreshToken(refreshTokenRequest).then((response) => {
    console.log(JSON.stringify(response));
}).catch((error) => {
    console.log(JSON.stringify(error));
});
```

## Silent Flow

### Public APIs
- [acquireTokenSilent](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-node/classes/_src_client_publicclientapplication_.publicclientapplication.html#acquiretokensilent): This API acquires a token silently, in case cache is provided by the user, or when cache is created by preceding this call with any other interactive flow (eg: authorization code flow). The request is of the type [SilentFlowRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-common/modules/_src_request_silentflowrequest_.html). The `token` is acquired silently when a user specifies the account the token is requested for.

``` javascript
/**
 * Cache Plugin configuration
 */
const cachePath = "path_to_your_cache_file/msal_cache.json"; // Replace this string with the path to your valid cache file.

const readFromStorage = () => {
    return fs.readFile(cachePath, "utf-8");
};

const writeToStorage = (getMergedState) => {
    return readFromStorage().then(oldFile =>{
        const mergedState = getMergedState(oldFile);
        return fs.writeFile(cachePath, mergedState);
    })
};

const cachePlugin = {
    readFromStorage,
    writeToStorage
};

/**
 * Public Client Application Configuration
 */
const publicClientConfig = {
    auth: {
        clientId: "your_client_id_here",
        authority: "your_authority_here",
        redirectUri: "your_redirectUri_here",
    },
    cache: {
        cachePlugin
    },
};

/** Request Configuration */

const scopes = ["your_scopes"];

const authCodeUrlParameters = {
    scopes: scopes,
    redirectUri: "your_redirectUri_here",
};

const pca = new msal.PublicClientApplication(publicClientConfig);
const msalCacheManager = pca.getCacheManager();
let accounts;

pca.getAuthCodeUrl(authCodeUrlParameters)
    .then((response) => {
        console.log(response);
    }).catch((error) => console.log(JSON.stringify(error)));

const tokenRequest = {
    code: req.query.code,
    redirectUri: "http://localhost:3000/redirect",
    scopes: scopes,
};

pca.acquireTokenByCode(tokenRequest).then((response) => {
    console.log("\nResponse: \n:", response);
    return msalCacheManager.writeToPersistence();
}).catch((error) => {
    console.log(error);
});

// get Accounts
accounts = msalCacheManager.getAllAccounts();

// Build silent request
const silentRequest = {
    account: accounts[0], // You would filter accounts to get the account you want to get tokens for
    scopes: scopes,
};

// Acquire Token Silently to be used in MS Graph call
pca.acquireTokenSilent(silentRequest).then((response) => {
    console.log("\nSuccessful silent token acquisition:\nResponse: \n:", response);
    return msalCacheManager.writeToPersistence();
}).catch((error) => {
        console.log(error);
});
```

## Client Credentials Flow

### Public APIs
- [acquireTokenByClientCredential](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-node/classes/_src_client_confidentialclientapplication_.confidentialclientapplication.html#acquiretokenbyclientcredential): This API acquires a token using the confidential client application's credentials to authenticate (instead of impersonating a user) when calling another web service. In this scenario, the client is typically a middle-tier web service, a daemon service, or a back-end web application. For a higher level of assurance, the Microsoft identity platform also allows the calling service to use a certificate (instead of a shared secret) as a credential. The request is of the type [ClientCredentialRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-common/modules/_src_request_clientcredentialrequest_.html#clientcredentialrequest).

``` javascript
const config = {
    auth: {
        clientId: "your_client_id_here",
        authority: "your_authority_here",
        clientSecret: "you_client_secret_here"
    }
};

// Create msal application object
const cca = new msal.ConfidentialClientApplication(config);

// With client credentials flows permissions need to be granted in the portal by a tenant administrator.
// The scope is always in the format "<resource>/.default"
const clientCredentialRequest = {
    scopes: ["https://graph.microsoft.com/.default"], // replace with your resource
};

cca.acquireTokenByClientCredential(clientCredentialRequest).then((response) => {
    console.log("Response: ", response);
}).catch((error) => {
    console.log(JSON.stringify(error));
});
```

## On Behalf of Flow
- [acquireTokenOnBehalfOf](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-node/classes/_src_client_confidentialclientapplication_.confidentialclientapplication.html#acquiretokenonbehalfof): This API implements the On Behalf Of Flow, which is used when an application invokes a service/web API, which in turn needs to call another service/web API that uses any other authentication flow (device code, username/password, etc). The access token is acquired by the web API initially (by any of the web API flows), and the web API can then exchange this token for another token via OBO. The request is of the type [OnBehalfOfRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-common/modules/_src_request_onbehalfofrequest_.html#onbehalfofrequest)

Please look at the On Behalf Of flow [sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-node-samples/standalone-samples/on-behalf-of) for usage instructions:

* [WebAPI](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-node-samples/on-behalf-of/web-api/index.js) sample code
* [WebApp](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-node-samples/on-behalf-of/web-app/index.js) sample code

## Next Steps
Proceed to understand the public APIs provided by `msal-node` for acquiring tokens [here](./Response.md)
