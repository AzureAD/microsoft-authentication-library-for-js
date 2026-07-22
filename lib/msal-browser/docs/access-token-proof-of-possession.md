# Acquiring Access Tokens Protected with Proof-of-Possession

In order to increase the protection of OAuth 2.0 access tokens stored in the browser against "token replay", MSAL provides an `Access Token Proof-of-Posession` authentication scheme. `Access Token Proof-of-Possession`, or `AT PoP`, is an authentication scheme that cryptographically binds the access tokens to the browser and client application from which they are requested, meaning they cannot be used from a different application or device.

It is important to understand that for `AT PoP` to work end-to-end and provide the security upgrade intended, both the **authorization service** that issues the access tokens and the **resource server** that they are provide access to must support `AT PoP`.

## Bearer Access Token vs Bound (PoP) Access Token

### Bearer Access Token

The standard [Authentication Result](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_common.html#authenticationresult) returned by MSAL v2 APIs includes an `accessToken` property. When used with the default `Bearer` authentication scheme, the value under the `accessToken` property is the access token secret provided by the authorization server. This artifact is cached by MSAL and should be added to resource requests as a bearer token in the request's `Authorization` header.

Example Bearer Access Token Usage:

```typescript
// Using the Bearer scheme (default), acquireTokenRedirect returns an AuthenticationResult object containing the Bearer access token secret
const { accessToken } = await myMSALObj.acquireTokenRedirect(popTokenRequest);

// The bearer token secret is appended to the Authorization header
const headers = new Headers();
const authHeader = `Bearer ${accessToken}`; // The Bearer label is used in this header
headers.append("Authorization", authHeader);
```

### Bound Access Token

A.K.A `PoP Token` or `Signed HTTP Request`. When the `POP` authorization scheme is enabled in an MSAL token request, the authorization server will still provide a JSON Web Token access token secret that looks like a `Bearer` access token, which MSAL will also cache. The main difference is that when using the `POP` scheme, that access token secret will be bound to the user's browser through an asymmetric cryptographic keypair.

The access token secret is wrapped in a new JSON Web Token, which will be signed using the `HMAC` (Hash-based Message Authentication Code) hashing algorithm and the private key from the keypair that MSAL generates, stores and manages. The signed JWT is then added to the `AuthorizationResult` object under the `accessToken` property and returned from the MSAL v2 API called.

Once the client application receives the returned authentication result, it can extract the `accessToken` value from the authentication result and add it to the `Authorization` header of a PoP-protected resource request, using the `PoP` label instead of the `Bearer` label.

**Note: The signed JWT (called a Signed HTTP Request or SHR) is never cached by MSAL. Everytime an MSAL v2 API is called, MSAL will either retrieve a valid raw access token secret from the cache or request a new access token from the authorization server. MSAL will then sign said access token and return it in the authentication result.**

Example Bound (PoP) Access Token Usage:

```typescript
// Using the POP scheme (default), acquireTokenRedirect returns an AuthenticationResult object containing the Signed HTTP Request (PoP Token)
const { accessToken } = await myMSALObj.acquireTokenRedirect(popTokenRequest);

// The SHR is appended to the Authorization header
const headers = new Headers();
const authHeader = `PoP ${accessToken}`; // The PoP label is used in this header
headers.append("Authorization", authHeader);
```

## Making a PoP Token Request

Once you have determined the authorization service and resource server support access token binding, you can configure your MSAL authentication and authorization request objects to acquire bound access tokens by building a token request object containing the Access Token PoP-specific attributes. All of the following attributes are optional in the request object, however, **authorizationScheme must be manually set to 'pop' in order to enable proof-of-possession**.

### AT PoP Request Parameters

| Name                    | Description                                                                                                                                                                                                                                                                                                                                                                         | Required     |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| `authenticationScheme`  | Indicates whether MSAL should acquire a `Bearer` or `PoP` token. Default is `Bearer`.                                                                                                                                                                                                                                                                                               | **Required** |
| `resourceRequestMethod` | The all-caps name of the HTTP method of the request that will use the signed token (`GET`, `POST`, `PUT`, etc.)                                                                                                                                                                                                                                                                     | **Required** |
| `resourceRequestUri`    | The URL of the protected resource for which the access token is being issued                                                                                                                                                                                                                                                                                                        | **Required** |
| `shrClaims`             | A stringified JSON object containing custom client claims to be added to the SignedHTTPRequest. Check out the [Custom SHR Claims](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/shr-client-claims.md) documentation for more information.                                                                                       | _Optional_   |
| `shrNonce`              | A server-generated, signed timestamp that is Base64URL encoded as a string. This nonce is used to mitigate clock-skew and time-travel attacks meant to enable PoP token pre-generation. Check out the [SHR Server Nonce](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/shr-server-nonce.md) documentation for more information. | _Optional_   |

_Note: While this document shows how to add an `shrNonce` to the `SignedHttpRequest`, the server nonce acquisition pattern is out of scope. Please review the [SHR Server Nonce dcoumentation](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/shr-server-nonce.md#acquiring-a-server-nonce) for more information on acquiring server-generated nonces._

### Acquire Token Redirect Request Example

```typescript
const popTokenRequest = {
    scopes: ["User.Read"],
    authenticationScheme: msal.AuthenticationScheme.POP,
    resourceRequestMethod: "POST",
    resourceRequestUri: "YOUR_RESOURCE_ENDPOINT",
    shrClaims: '{"shrClaim1": "claimValue"}',
    shrNonce: "NONCE_ACQUIRED_FROM_RESOURCE_SERVER",
};
```

Once the request has been configured and `POP` is set as the `authenticationScheme`, it can be sent into the `acquireTokenRedirect` MSAL v2 API.

```typescript
const response = await myMSALObj.acquireTokenRedirect(popTokenRequest);

// Once a Pop Token has been acquired, it can be added on the authorization header of a resource request
const headers = new Headers();
const authHeader = `${response.tokenType} ${response.accessToken}`;

headers.append("Authorization", authHeader);

const options = {
    method: popTokenRequest.resourceRequestMethod,
    headers: headers
};

// After the request has been built and the POP access token has bee appended, the request can be executed using an API like "fetch"
fetch(endpoint, options)
    .then(response => response.json())
    .then(response => callback(response, endpoint))
    .catch(error => console.log(error));
});
```

### Acquire Token Silent Request Example

Silently acquiring PoP Access Tokens requires the same changes to the token request configuration as with the interactive `acquireToken` APIs:

```typescript
const silentPopTokenRequest = {
    scopes: ["User.Read"],
    authenticationScheme: msal.AuthenticationScheme.POP, // Default is "BEARER"
    resourceRequestMethod: "POST",
    resourceRequestUri: "YOUR_RESOURCE_ENDPOINT",
    shrClaims: "{\"shrClaim1\": \"claimValue\"}",
    shrNonce: "NONCE_ACQUIRED_FROM_RESOURCE_SERVER"
}

// Try to acquire token silently
const { accessToken } = await myMSALObj.acquireTokenSilent(silentPopTokenRequest).catch(async (error) => {
        console.log("Silent token acquisition failed.");
        if (error instanceof msal.InteractionRequiredAuthError) {
            // Fallback to interaction if silent call fails
            console.log("Acquiring token using redirect");
            myMSALObj.acquireTokenRedirect(silentPopTokenRequest);
        } else {
            console.error(error);
        }
    });

// Once a Pop Token has been acquired, it can be added on the authorization header of a resource request
const headers = new Headers();
const authHeader = `PoP ${accessToken}`;

headers.append("Authorization", authHeader);

const options = {
    method: popTokenRequest.resourceRequestMethod,
    headers: headers
};

// After the request has been built and the POP access token has bee appended, the request can be executed using an API like "fetch"
fetch(endpoint, options)
    .then(response => response.json())
    .then(response => callback(response, endpoint))
    .catch(error => console.log(error));
});
```

## PoP Key Management

The Proof-of-Possession authentication scheme relies on an asymmetric cryptographic keypair to bind the access token to the user's browser. MSAL Browser generates this keypair when initially requesting an access token from the authorization service and stores it using [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API). This cryptographic keypair is then used to sign the `SHR` every time the bound access token is requested silently.

In the event of refreshing a bound access token, MSAL will delete the cryptographic keypair that was generated when requesting the expired bound access token, generate a new cryptographic keypair for the new access token, and store the new keypair in the keystore.

## Advanced feature: Application managed cryptographic keypair

> :warning: We do not recommend using this feature unless you are familiar with the [Proof of Possession protocol](https://oauth.net/2/dpop/) and have a specific requirement to generate your own cryptographic keypair. For most cases, we recommend the PoP usage as described in the rest of this document.

If you choose to generate your own cryptographic keypair, then this feature enables the application to provide the `popKid` as a request parameter. MSAL JS ensures the token issuer embeds the `cnf` in the token but returns the issued token _unsigned_. The onus of signing the access token before it is forwarded to the intended resource will be on the application.

Please also note to make sure the remaining [pop parameters](#at-pop-request-parameters) except the `AuthenticationScheme` are not set if you choose to leverage this behavior.

### Why access tokens are saved asynchronously

Most MSAL credentials and cache items, like `ID Tokens` for example, can be stored and removed synchronously. This is because these cache items are stored in either `localStorage` or `sessionStorage` (which can be manipulated synchronously), and they have no dependencies on other stored items that have asynchronous access restrictions.

Unlike other cache items, `Access Tokens` are saved to the cache asynchronously. The reason for this is that in the case of an access token being bound to a cryptographic keypair, which is stored in `IndexedDB`, replacing the access token also involves replacing the cryptographic keypair. Given that removing and writing keys to `IndexedDB` are asynchronous operations, the process for saving an access token inevitably becomes asyncrhonous by extension.

## DPoP (RFC 9449) for browser-native PublicClientApplication

MSAL Browser also supports standards-aligned DPoP for the browser-native PublicClientApplication (`acquireTokenPopup`, `acquireTokenRedirect`, `acquireTokenSilent`, and `ssoSilent`) by setting `authenticationScheme: msal.AuthenticationScheme.DPOP`.

```typescript
const dpopRequest = {
    scopes: ["User.Read"],
    authenticationScheme: msal.AuthenticationScheme.DPOP,
    resourceRequestMethod: "GET",
    resourceRequestUri: "https://graph.microsoft.com/v1.0/me",
};

const result = await myMSALObj.acquireTokenPopup(dpopRequest);

const headers = new Headers();
headers.append("Authorization", `${result.tokenType} ${result.accessToken}`);
headers.append("DPoP", result.dpopProof || "");
```

DPoP requests must include both `resourceRequestMethod` and `resourceRequestUri`. If either value is missing MSAL fails before network calls with `dpop_missing_resource_context`. MSAL provisions an ES256/P-256 DPoP key, sends `dpop_jkt` on authorization requests, and sends the token-endpoint proof in the `DPoP` HTTP header. Browser-native DPoP does not send PoP/SHR `token_type` or `req_cnf` body parameters.

For DPoP results, `accessToken` is the raw DPoP-bound access token and `dpopProof` is a separate fresh proof for the requested resource. Proof JWTs are never cached. Cache hits generate a new proof, and if the local DPoP key is missing MSAL treats the cached DPoP access token as a cache miss.

DPoP resource proofs are generated from the request method, normalized resource URI, and raw access token (`ath` is computed internally). MSAL does not accept caller-supplied `ath` hashes. Nonce challenge/retry APIs, PairwiseBroker DPoP, WAM/L3/NAA brokered DPoP, hardware-bound keys, DPoP-bound refresh tokens, and cross-tab key sharing are follow-up features and are not part of this initial L1 PCA enablement.

For live ESTS smoke validation use an ESTS environment with DPoP enabled, for example `dc=ESTS-PUB-WUS3-FD000-TEST1-100`. Client-side request shaping remains authority-agnostic; real-service DPoP validation should be kept to ESTS-enabled environments until another authorization server is confirmed.
