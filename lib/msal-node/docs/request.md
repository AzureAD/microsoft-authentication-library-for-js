# Request

Since MSAL Node supports various authorization code grants, there is support for different public APIs per grant and the corresponding request.

## Authorization Code Flow

## getAuthCodeUrl

[getAuthCodeUrl()](https://azuread.github.io/microsoft-authentication-library-for-js/ref/interfaces/_azure_msal_node.IConfidentialClientApplication.html#getAuthCodeUrl): This API performs the first leg of the authorization code flow. The request is of the type [AuthorizationUrlRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/types/_azure_msal_node.AuthorizationUrlRequest.html).
getAuthCodeUrl returns a url that can be used to generate an `authorization code`. This URL can be opened in a browser of choice, where the user can input their credentials, and will be redirected back to the registered `redirectUri` with an `authorization code`. The `authorization code` can then be redeemed for a token using acquireTokenByCode.

```javascript
import {
    ConfidentialClientApplication,
    CryptoProvider,
} from "@azure/msal-node";

const cryptoProvider = new CryptoProvider();
const authCodeUrlParameters = {
    scopes: ["sample_scope"],
    redirectUri: "your_redirect_uri",
    nonce: cryptoProvider.createNewGuid(),
};

// Store the nonce with the authentication transaction so the same value can
// be provided to acquireTokenByCode after the redirect.
req.session.nonce = authCodeUrlParameters.nonce;

const cca = new ConfidentialClientApplication({
    auth: {
        clientId: "<your clientId here>",
        clientSecret: process.env.CLIENT_SECRET,
    },
});

// get url to sign user in and consent to scopes needed for application
cca.getAuthCodeUrl(authCodeUrlParameters)
    .then((url) => {
        // redirect to url
    })
    .catch((error) => console.log(JSON.stringify(error)));
```

## acquireTokenByCode

[acquireTokenByCode()](https://azuread.github.io/microsoft-authentication-library-for-js/ref/interfaces/_azure_msal_node.IConfidentialClientApplication.html#acquireTokenByCode): This API is the second leg of the authorization code flow. The request is of the type [AuthorizationCodeRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/types/_azure_msal_node.AuthorizationCodeRequest.html). The application should have received an `authorization code` as a part of the above step and can now exchange it for a `token`. If a nonce was sent in the authorization request, the same stored nonce must be provided on `AuthorizationCodeRequest`; do not generate a new nonce for the token exchange. MSAL validates that the ID Token contains a matching nonce claim and rejects an ID Token nonce claim when no expected nonce was supplied.

```javascript
const tokenRequest = {
    code: "authorization_code",
    redirectUri: "your_redirect_uri",
    scopes: ["sample_scope"],
    nonce: req.session.nonce,
};

const cca = new ConfidentialClientApplication({
    auth: {
        clientId: "<your clientId here>",
        clientSecret: process.env.CLIENT_SECRET,
    },
});

// acquire a token by exchanging the code
cca.acquireTokenByCode(tokenRequest)
    .then((response) => {
        // Do something with the token e.g. call an API
        callAPI(response.accessToken);
    })
    .catch((error) => {
        console.log(error);
    });
```

## Refresh Token Flow

### Public API

-   [acquireTokenByRefreshToken](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-node/classes/_src_client_confidentialclientapplication_.confidentialclientapplication.html#acquiretokenbyrefreshtoken): This API acquires a token by exchanging the refresh token provided for a new set of tokens. The request is of the type [RefreshTokenRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-common/modules/_src_request_refreshtokenrequest_.html). It is provided for refresh-token migration scenarios; use `acquireTokenSilent()` for normal silent acquisition.

```javascript
const config = {
    auth: {
        clientId: "your_client_id_here",
        authority: "your_authority_here",
        clientSecret: process.env.CLIENT_SECRET,
    },
};

const cca = new msal.ConfidentialClientApplication(config);

const refreshTokenRequest = {
    refreshToken: "",
    scopes: ["user.read"],
};

cca.acquireTokenByRefreshToken(refreshTokenRequest)
    .then((response) => {
        console.log(JSON.stringify(response));
    })
    .catch((error) => {
        console.log(JSON.stringify(error));
    });
```

## Silent Flow

### Public API

-   [acquireTokenSilent](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-node/classes/_src_client_confidentialclientapplication_.confidentialclientapplication.html#acquiretokensilent): This API acquires a token from the cache or uses a cached refresh token. The request is of the type [SilentFlowRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-common/modules/_src_request_silentflowrequest_.html) and identifies the account whose token is requested.

Concurrent `acquireTokenSilent` calls on the same application instance with equivalent accounts, effective authorities, scopes, and token-request options share one underlying operation. Scope order, surrounding whitespace, and exact duplicates do not affect equivalence, but scope casing is preserved. Each successful caller receives its own correlation ID in the result. If the shared operation fails, every caller receives the original error with the correlation ID of the underlying operation. Requests with different options that can change cache selection, token refresh behavior, or token endpoint parameters are processed independently. Completed or failed operations are removed from the in-flight map so later calls are processed normally.

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

### Client-originated claims (`claimsFromClient`)

All confidential client flows — `acquireTokenByClientCredential`, `acquireTokenOnBehalfOf`, and `acquireTokenByUserFederatedIdentityCredential` — accept an optional `claimsFromClient` parameter. It forwards **client-originated** claims to the token endpoint, sent as the `claims` parameter in the request body. The value is forwarded as-is — MSAL does not restrict which claim keys you send. When both `claims` and `claimsFromClient` are present they are **deep-merged**, with `claimsFromClient` taking precedence on conflicting keys (nested objects are merged recursively rather than replaced).

Unlike `claims` (a server-issued challenge, which **bypasses** the token cache), `claimsFromClient` does **not** bypass the cache. Server `claims` can be an _ephemeral_ challenge (for example, a CAE claims challenge) that must be satisfied by a fresh network call, whereas `claimsFromClient` must be a _stable, client-supplied_ attribute (for example, a network-perimeter id) sent on every request — so instead of bypassing the cache it **partitions** it by value. Because the entry is keyed on the value, send the **same `claimsFromClient` value on every request** for which you want the cached token to be reused — a different value (or omitting it) produces a separate cache entry and a new network call. You must pass stable, non-dynamic values to avoid unbounded cache growth. Empty, whitespace-only, or empty-object (`{}`) values are ignored.

**Cache growth and mitigation.** Every distinct `claimsFromClient` value produces its own cached token, so an application that sends many different values accumulates a correspondingly large number of cache entries. Keep the set of values small and stable, and in production persist the cache to an external store that you can bound or evict rather than relying on the default in-memory cache. See the [token caching guide](./caching.md) for cache serialization and distributed / evictable caching patterns.

> Note: `acquireTokenByUserFederatedIdentityCredential` always calls the network, so `claimsFromClient` is forwarded on every request and does not participate in that flow's cache key (tokens are still cached, just not partitioned by `claimsFromClient`).

```javascript
const clientCredentialRequest = {
    scopes: ["https://graph.microsoft.com/.default"],
    claimsFromClient: '{"example_claim":{"essential":true}}',
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

-   `scopes`: Array of scopes the application is requesting access to
-   `assertion`: The federated identity credential (instance token from Leg 2)
-   Exactly one user identifier:
    -   `userObjectId`: The user's Azure AD Object ID (GUID)
    -   `username`: The user's UPN (e.g., `user@contoso.com`)

**Behavior:**

-   Sends `grant_type=user_fic` in the POST body
-   Sends `user_federated_identity_credential=<assertion>` as the credential
-   Sends `user_id=<objectId>` or `username=<upn>` to identify the target user
-   Augments scopes with `openid`, `offline_access`, `profile`
-   Sends `client_info=1` so the response includes account information
-   Tokens are stored in the user token cache with full account info
-   Always hits the network — use `acquireTokenSilent` with the returned `account` for subsequent cached lookups

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

-   [acquireTokenOnBehalfOf](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-node/classes/_src_client_confidentialclientapplication_.confidentialclientapplication.html#acquiretokenonbehalfof): This API implements the On Behalf Of Flow, which is used when an application invokes a service/web API, which in turn needs to call another service/web API. The access token is acquired by the web API initially, and the web API can then exchange this token for another token via OBO. The request is of the type [OnBehalfOfRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-common/modules/_src_request_onbehalfofrequest_.html#onbehalfofrequest)

Please look at the On Behalf Of flow [sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-node-samples/on-behalf-of) for usage instructions:

-   [WebAPI](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-node-samples/on-behalf-of/web-api/index.js) sample code
-   [WebApp](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-node-samples/on-behalf-of/web-app/index.js) sample code

## Next Steps

See the [`msal-node` API reference](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_node.html) for token acquisition responses.
