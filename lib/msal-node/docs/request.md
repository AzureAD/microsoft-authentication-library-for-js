# Request

Since MSAL Node supports various authorization code grants, there is support for different public APIs per grant and the corresponding request.

## Authorization Code Flow

### acquireTokenInteractive

[acquireTokenInteractive()](https://azuread.github.io/microsoft-authentication-library-for-js/ref/classes/_azure_msal_node.PublicClientApplication.html#acquireTokenInteractive): This API handles both legs of the authorization code flow. It is available for PublicClientApplication only. The request type is documented here: [InteractiveRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/types/_azure_msal_node.InteractiveRequest.html). The only required parameter is a `openBrowser` callback which should accept a `url` parameter and open the browser of choice to complete the sign-in. A sample demonstrating its usage can be found [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-node-samples/auth-code-cli-app)

```javascript
import { PublicClientApplication }  from "@azure/msal-node";
import open from "open";

// Open browser to sign user in and consent to scopes needed for application
const openBrowser = async (url) => {
    // You can open a browser window with any library or method you wish to use - the 'open' npm package is used here for demonstration purposes.
    open(url);
};

const loginRequest = {
    scopes: ["User.Read"],
    openBrowser,
    successTemplate: "Successfully signed in! You can close this window now." // Will be shown in the browser window after authentication is complete
};

// Create msal application object
const pca = new PublicClientApplication({
    auth: { 
        clientId: "<your clientId here>"
        }
});
pca.acquireTokenInteractive(loginRequest).then((response) => {
        // Do something with the token e.g. call an API
        callAPI(response.accessToken)
    })
    .catch((error) => {
        console.log(error);
    });

```

## getAuthCodeUrl

[getAuthCodeUrl()](https://azuread.github.io/microsoft-authentication-library-for-js/ref/interfaces/_azure_msal_node.IConfidentialClientApplication.html#getAuthCodeUrl): This API performs the first leg of the authorization code flow. The request is of the type [AuthorizationUrlRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/types/_azure_msal_node.AuthorizationUrlRequest.html).
getAuthCodeUrl returns a url that can be used to generate an `authorization code`. This URL can be opened in a browser of choice, where the user can input their credentials, and will be redirected back to the `redirectUri` (registered during the [app registration](https://docs.microsoft.com/en-us/azure/active-directory/develop/scenario-desktop-app-registration)) with an `authorization code`. The `authorization code` can now be redeemed for a `token` using acquireTokenByCode, documented below. Note that if authorization code flow is being done for a public client application, we recommend using `acquireTokenInteractive` documented above, otherwise the use of [PKCE](https://tools.ietf.org/html/rfc7636) is recommended.

```javascript
const authCodeUrlParameters = {
    scopes: ["sample_scope"],
    redirectUri: "your_redirect_uri",
};

const cca = new ConfidentialClientApplication({
    auth: { 
        clientId: "<your clientId here>"
        }
});

// get url to sign user in and consent to scopes needed for application
cca.getAuthCodeUrl(authCodeUrlParameters)
    .then((url) => {
        // redirect to url
    })
    .catch((error) => console.log(JSON.stringify(error)));
```

## acquireTokenByCode

[acquireTokenByCode()](https://azuread.github.io/microsoft-authentication-library-for-js/ref/interfaces/_azure_msal_node.IConfidentialClientApplication.html#acquireTokenByCode): This API is the second leg of the authorization code flow. The request is of the type [AuthorizationCodeRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/types/_azure_msal_node.AuthorizationCodeRequest.html). The application should have received an `authorization code` as a part of the above step and can now exchange it for a `token`. Note that if authorization code flow is being done for a public client application, we recommend using `acquireTokenInteractive` documented above, otherwise the use of [PKCE](https://tools.ietf.org/html/rfc7636) is recommended.


```javascript
const tokenRequest = {
    code: "authorization_code",
    redirectUri: "your_redirect_uri",
    scopes: ["sample_scope"],
};

const cca = new ConfidentialClientApplication({
    auth: { 
        clientId: "<your clientId here>"
        }
});

// acquire a token by exchanging the code
cca.acquireTokenByCode(tokenRequest)
    .then((response) => {
        // Do something with the token e.g. call an API
        callAPI(response.accessToken)
    })
    .catch((error) => {
        console.log(error);
    });
```

## Device Code Flow

### Public APIs

-   [acquireTokenByDeviceCode()](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-node/classes/_src_client_publicclientapplication_.publicclientapplication.html#acquiretokenbydevicecode): This API lets the application acquire a token with Device Code grant. The request is of the type [DeviceCodeRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-common/modules/_src_request_devicecoderequest_.html). This API acquires a `token` from the authority using OAuth2.0 device code flow. This flow is designed for devices that do not have access to a browser or have input constraints. The authorization server issues a DeviceCode object with a verification code, an end-user code, and the end-user verification URI. The DeviceCode object is provided through a callback, and the end-user should be instructed to use another device to navigate to the verification URI to input credentials. Since the client cannot receive incoming requests, it polls the authorization server repeatedly until the end-user completes input of credentials.

```javascript
const msalConfig = {
    auth: {
        clientId: "your_client_id_here",
        authority: "your_authority_here",
    },
};

const pca = new msal.PublicClientApplication(msalConfig);

const deviceCodeRequest = {
    deviceCodeCallback: (response) => console.log(response.message),
    scopes: ["user.read"],
};

pca.acquireTokenByDeviceCode(deviceCodeRequest)
    .then((response) => {
        console.log(JSON.stringify(response));
    })
    .catch((error) => {
        console.log(JSON.stringify(error));
    });
```

## Refresh Token Flow

### Public APIs

-   [acquireTokenByRefreshToken](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-node/classes/_src_client_publicclientapplication_.publicclientapplication.html#acquiretokenbyrefreshtoken): This API acquires a token by exchanging the refresh token provided for a new set of tokens. The request is of the type [RefreshTokenRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-common/modules/_src_request_refreshtokenrequest_.html). The `refresh token` is never returned to the user in a response, but can be accessed from the user cache. It is recommended that you use `acquireTokenSilent()` for non-interactive scenarios. When using `acquireTokenSilent()`, MSAL will handle the caching and refreshing of tokens automatically.

```javascript
const config = {
    auth: {
        clientId: "your_client_id_here",
        authority: "your_authority_here",
    },
};

const pca = new msal.PublicClientApplication(config);

const refreshTokenRequest = {
    refreshToken: "",
    scopes: ["user.read"],
};

pca.acquireTokenByRefreshToken(refreshTokenRequest)
    .then((response) => {
        console.log(JSON.stringify(response));
    })
    .catch((error) => {
        console.log(JSON.stringify(error));
    });
```

## Silent Flow

### Public APIs

-   [acquireTokenSilent](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-node/classes/_src_client_publicclientapplication_.publicclientapplication.html#acquiretokensilent): This API acquires a token silently, in case cache is provided by the user, or when cache is created by preceding this call with any other interactive flow (eg: authorization code flow). The request is of the type [SilentFlowRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-common/modules/_src_request_silentflowrequest_.html). The `token` is acquired silently when a user specifies the account the token is requested for.

```javascript
/**
 * Cache Plugin configuration
 */
const cachePath = "path_to_your_cache_file/msal_cache.json"; // Replace this string with the path to your valid cache file.

const readFromStorage = () => {
    return fs.readFile(cachePath, "utf-8");
};

const writeToStorage = (getMergedState) => {
    return readFromStorage().then((oldFile) => {
        const mergedState = getMergedState(oldFile);
        return fs.writeFile(cachePath, mergedState);
    });
};

const cachePlugin = {
    readFromStorage,
    writeToStorage,
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
        cachePlugin,
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
    })
    .catch((error) => console.log(JSON.stringify(error)));

const tokenRequest = {
    code: req.query.code,
    redirectUri: "http://localhost:3000/redirect",
    scopes: scopes,
};

pca.acquireTokenByCode(tokenRequest)
    .then((response) => {
        console.log("\nResponse: \n:", response);
        return msalCacheManager.writeToPersistence();
    })
    .catch((error) => {
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
pca.acquireTokenSilent(silentRequest)
    .then((response) => {
        console.log(
            "\nSuccessful silent token acquisition:\nResponse: \n:",
            response
        );
        return msalCacheManager.writeToPersistence();
    })
    .catch((error) => {
        console.log(error);
    });
```

## Client Credentials Flow

### Public APIs

-   [acquireTokenByClientCredential](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-node/classes/_src_client_confidentialclientapplication_.confidentialclientapplication.html#acquiretokenbyclientcredential): This API acquires a token using the confidential client application's credentials to authenticate (instead of impersonating a user) when calling another web service. In this scenario, the client is typically a middle-tier web service, a daemon service, or a back-end web application. For a higher level of assurance, the Microsoft identity platform also allows the calling service to use a certificate (instead of a shared secret) as a credential. The request is of the type [ClientCredentialRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-common/modules/_src_request_clientcredentialrequest_.html#clientcredentialrequest).

### Using secrets securely

Secrets should never be hardcoded. The dotenv npm package can be used to store secrets in a .env file (located in project's root directory) that should be included in .gitignore to prevent accidental uploads of the secrets.

```javascript
import "dotenv/config"; // process.env now has the values defined in a .env file

const config = {
    auth: {
        clientId: "your_client_id_here",
        authority: "your_authority_here",
        clientSecret: process.env.clientSecret,
    },
};

// Create msal application object
const cca = new msal.ConfidentialClientApplication(config);

// With client credentials flows permissions need to be granted in the portal by a tenant administrator.
// The scope is always in the format "<resource>/.default"
const clientCredentialRequest = {
    scopes: ["https://graph.microsoft.com/.default"], // replace with your resource
};

cca.acquireTokenByClientCredential(clientCredentialRequest)
    .then((response) => {
        console.log("Response: ", response);
    })
    .catch((error) => {
        console.log(JSON.stringify(error));
    });
```

### Federated Managed Identity (FMI)

The client credentials flow supports Federated Managed Identity (FMI) through the optional `fmiPath` parameter. When `fmiPath` is set, the `fmi_path` value is sent in the token request body, enabling a blueprint application to acquire tokens scoped to a specific agent identity.

Tokens acquired with different `fmiPath` values are isolated in the cache using an extended cache key hash, preventing collisions between different FMI paths.

```javascript
const clientCredentialRequest = {
    scopes: ["api://AzureADTokenExchange/.default"],
    fmiPath: "agentAppId", // Scopes the token to a specific agent identity
};

cca.acquireTokenByClientCredential(clientCredentialRequest)
    .then((response) => {
        console.log("FMI token: ", response);
    })
    .catch((error) => {
        console.log(JSON.stringify(error));
    });
```

The assertion callback context (`ClientAssertionConfig`) includes `fmiPath` so that context-aware assertion callbacks can use it to acquire the correct credential for multi-leg agent flows.

### Client-originated claims (`clientClaims`)

All confidential client flows — `acquireTokenByClientCredential`, `acquireTokenOnBehalfOf`, and `acquireTokenByUserFederatedIdentityCredential` — accept an optional `clientClaims` parameter. It forwards **client-originated** claims to the token endpoint, sent as the `claims` parameter in the request body. The value is forwarded as-is — MSAL does not restrict which claim keys you send. When both `claims` and `clientClaims` are present they are **deep-merged**, with `clientClaims` taking precedence on conflicting keys (nested objects are merged recursively rather than replaced).

Unlike `claims` (a server-issued challenge, which **bypasses** the token cache), `clientClaims` does **not** bypass the cache. This difference is intentional: server `claims` is an _ephemeral_ challenge (for example, a CAE claims challenge) that must be satisfied by a fresh network call, whereas `clientClaims` is a _stable, client-supplied_ attribute (for example, a network-perimeter id) sent on every request — so instead of bypassing the cache it **partitions** it by value. Partitioning addresses the same cross-request contamination concern that motivates the `claims` bypass: a token minted with a given `clientClaims` value is only ever served to a request presenting that same value. Tokens are cached and the cache entry is **keyed on the `clientClaims` value** (using the same extended cache-key hash as `fmiPath`): identical values are served from cache, while different values produce separate cache entries. Because the entry is keyed on the value, send the **same `clientClaims` value on every request** for which you want the cached token to be reused — a different value (or omitting it) produces a separate cache entry and a new network call. Use stable, non-dynamic values to avoid unbounded cache growth. Empty, whitespace-only, or empty-object (`{}`) values are ignored.

> Note: `acquireTokenByUserFederatedIdentityCredential` always calls the network, so `clientClaims` is forwarded on every request and does not participate in that flow's cache key (tokens are still cached, just not partitioned by `clientClaims`).

```javascript
const clientCredentialRequest = {
    scopes: ["https://graph.microsoft.com/.default"],
    clientClaims: '{"example_claim":{"essential":true}}',
};

cca.acquireTokenByClientCredential(clientCredentialRequest)
    .then((response) => {
        console.log("Response: ", response);
    })
    .catch((error) => {
        console.log(JSON.stringify(error));
    });
```

## User Federated Identity Credential (user_fic)

A User Federated Identity Credential (FIC) enables an agent application to acquire a user-scoped token without direct user interaction. This is the final step (Leg 3) in the agent identity protocol:

1. **Leg 1 (FMI):** A blueprint application acquires an FMI-scoped token using `acquireTokenByClientCredential` with `fmiPath` set to the agent's app ID.
2. **Leg 2 (Instance token):** The agent application uses the Leg 1 token as its client assertion to acquire an instance token via `acquireTokenByClientCredential`.
3. **Leg 3 (FIC):** The agent exchanges the instance token for a user-scoped token using `acquireTokenByUserFederatedIdentityCredential`.

-   [acquireTokenByUserFederatedIdentityCredential](https://azuread.github.io/microsoft-authentication-library-for-js/ref/classes/_azure_msal_node.ConfidentialClientApplication.html#acquireTokenByUserFederatedIdentityCredential): This API acquires a user-scoped token using the `user_fic` grant type. It exchanges a federated identity credential (an instance token obtained from Leg 2) for a token that allows the agent to act on behalf of a specific user. The request is of the type [UserFederatedIdentityCredentialRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/types/_azure_msal_node.UserFederatedIdentityCredentialRequest.html).

**Required parameters:**
- `scopes`: Array of scopes the application is requesting access to
- `assertion`: The federated identity credential (instance token from Leg 2)
- Exactly one user identifier:
  - `userObjectId`: The user's Azure AD Object ID (GUID)
  - `username`: The user's UPN (e.g., `user@contoso.com`)

**Behavior:**
- Sends `grant_type=user_fic` in the POST body
- Sends `user_federated_identity_credential=<assertion>` as the credential
- Sends `user_id=<objectId>` or `username=<upn>` to identify the target user
- Augments scopes with `openid`, `offline_access`, `profile`
- Sends `client_info=1` so the response includes account information
- Tokens are stored in the user token cache with full account info
- Always hits the network — use `acquireTokenSilent` with the returned `account` for subsequent cached lookups

```javascript
// Leg 3: Exchange instance token for a user-scoped token
const ficRequest = {
    scopes: ["https://graph.microsoft.com/.default"],
    assertion: instanceToken, // Instance token from Leg 2
    username: "user@contoso.com", // OR userObjectId: "00000000-0000-0000-0000-000000000001"
};

cca.acquireTokenByUserFederatedIdentityCredential(ficRequest)
    .then((response) => {
        // response.accessToken is a user-scoped token
        // response.account can be used with acquireTokenSilent for caching
        console.log("User token: ", response);
    })
    .catch((error) => {
        console.log(JSON.stringify(error));
    });
```

## On Behalf of Flow

-   [acquireTokenOnBehalfOf](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-node/classes/_src_client_confidentialclientapplication_.confidentialclientapplication.html#acquiretokenonbehalfof): This API implements the On Behalf Of Flow, which is used when an application invokes a service/web API, which in turn needs to call another service/web API that uses any other authentication flow (device code, username/password, etc). The access token is acquired by the web API initially (by any of the web API flows), and the web API can then exchange this token for another token via OBO. The request is of the type [OnBehalfOfRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-common/modules/_src_request_onbehalfofrequest_.html#onbehalfofrequest)

Please look at the On Behalf Of flow [sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-node-samples/standalone-samples/on-behalf-of) for usage instructions:

-   [WebAPI](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-node-samples/on-behalf-of/web-api/index.js) sample code
-   [WebApp](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-node-samples/on-behalf-of/web-app/index.js) sample code

## Next Steps

Proceed to understand the public APIs provided by `msal-node` for acquiring tokens [here](response.md)
