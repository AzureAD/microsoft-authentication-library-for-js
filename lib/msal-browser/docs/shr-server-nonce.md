# SHR Server Nonce

As an enhancement of Access Token Proof-of-Possesion, MSAL Browser provides a way to insert a server-generated signed timestamp (a.k.a **server nonce**) into a `Signed HTTP Request`, also known as a `PoP Token`. This server generated nonce can be added to any token request that uses the `POP` authentication scheme.

Given that [MSAL does not cache](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/access-token-proof-of-possession.md#bound-access-token) `Signed HTTP Requests`, server nonces will **not** be cached either. This means that the server nonce must be passed into every `acquireTokenSilent` call in order for it to be added to the resulting `SignedHttpRequest` object.

Once the `Signed HTTP Request` is sent to the resource server as a `PoP Token`, the resource server is responsible for validating the signed payload as well as extracting and validating the `shrNonce`.

## Usage

Once [acquired](#acquiring-a-server-nonce), server-generated nonces for SHRs can be passed into any token request object as `shrNonce`. It is important to note that the SHR server nonce is an extension of the Access Token Proof-of-Possession scheme, so it will only be used when the token request's `authenticationScheme` is set to `POP`.

### Acquire Token Request Example

```javascript
const popTokenRequest = {
    scopes: ["User.Read"],
    authenticationScheme: msal.AuthenticationScheme.POP,
    resourceRequestMethod: "POST",
    resourceRequestUri: "YOUR_RESOURCE_ENDPOINT",
    shrNonce: "eyJhbGciOiJIUzI1NiIsImtpZCI6IktJRCIsInR5cCI6IkpXVCJ9.eyJ0cyI6IjE2MjU2NzI1MjkifQ.rA5ho63Lbdwo8eqZ_gUtQxY3HaseL0InIVwdgf7L_fc" // Sample Base64URL encoded server nonce value
}
```

Once the request has been configured and `POP` is set as the `authenticationScheme`, it can be passed to any loginXXX or acquireTokenXXX API:

```javascript
const response = await myMSALObj.acquireTokenSilent(popTokenRequest);
```

The response will contain a property called `accessToken`, which will contain the `Signed HTTP Request`. When verified using the public key, the SHR's JWT payload will look something like the following:

```javascript
{
    at: ...,
    ts: ...,
    m: "POST",
    u: "YOUR_RESOURCE_ENDPOINT",
    nonce: "eyJhbGciOiJIUzI1NiIsImtpZCI6IktJRCIsInR5cCI6IkpXVCJ9.eyJ0cyI6IjE2MjU2NzI1MjkifQ.rA5ho63Lbdwo8eqZ_gUtQxY3HaseL0InIVwdgf7L_fc",
    p: ...,
    q: ...,
    client_claims: "{\"nonce\": \"AQAA123456\",\"local_nonce\": \"AQAA7890\"}"
}
```

## SignedHttpRequest Nonce Attribute

The `shrNonce` value that can be configured inside the PoP token request will be assigned to the `nonce` attribute in the `SignedHttpRequest` returned in the `AuthenticationResult`. However, the `nonce` attribute in the SHR will not be empty if it isn't manually configured through the `shrNonce` value. The following list describes the logic (in order of precedence) with which the `nonce` value is set on the `SignedHttpRequest`:
   1.  If `shrNonce` in auth request is not `null` or `undefined`, MSAL assigns that value to the `nonce` property in the SHR
   2.  If `shrNonce` is `null` or `undefined`, MSAL generates a random GUID string and assigns it to the `nonce` property in the SHR

## Acquiring a server nonce

The method through which a client application initially acquires and then renews a server-generated nonce may be different depending on which resource server the client application is interacting with. The following is an overview of the server nonce acquisition and renewal flow for which MSAL Browser is optimized. Keep in mind that even if the nonce acquisition flow is different, the server nonce is still always added manually into the token request by the client application as described in the [Usage](#usage) section below.

### Acquiring initial nonce

1. The first step to acquire a server-generated nonce is to make an authorized request to the resource. In this authorized request, a `PoP Token` will be added to the `Authorization` header, but said `PoP Token` will not include a valid nonce.


```javascript

let shrNonce = null; // Globally scoped variable

// 1. Configure PoP Token Request without a valid SHR Nonce
const popTokenRequest = {
    scopes: ["User.Read"],
    authenticationScheme: msal.AuthenticationScheme.POP,
    resourceRequestMethod: "POST",
    resourceRequestUri: "YOUR_RESOURCE_ENDPOINT"
    shrNonce: shrNonce // SHR Nonce is invalid as null string at this point
};


 // Get PoP token to make authenticated request
const shr = await publicClientApplication.acquireTokenSilent(popTokenRequest);

// Set up PoP Resource request
const reqHeaders = new Headers();
const authorizationHeader = `PoP ${shr}`;

headers.append("Authorization", authorizationHeader);

const options = {
    method: method,
    headers: headers
};
```

2. Once the request has been set up and the `SHR` has been added to the Authorization header, the request is `POST`ed to the resource. At this point, without a valid server nonce in the `PoP Token`/`SHR`, the resource should respond with a `401 Unauthorized` HTTP error, which will have a `WWW-Authenticate` header containing the first valid server nonce as one of it's challenges.

```typescript
// Make call to resource with SHR
return fetch(resourceEndpointData.endpoint, options)
    .then(response => response.json())
    .then(response => {
        // At this point, the response will be a 401 Error, so ignore the success case for now
    })
    .catch(error => {
        // This error will be a `401 Unauthorized` error, containing a WWW-Authenticate header with an error message such as "nonce_missing" or "nonce_malformed"
        // The correct way to handle this scenario is shown in the following step.
});
```

3. In order to extract the server nonce from said `WWW-Authenticate` header, MSAL exposes the `AuthenticationHeaderParser` class, which includes the `getShrNonce` API that will parse the server nonce out of the authentication headers it comes in:

```typescript
import { PublicClientApplication, AuthenticationHeaderParser } from "@azure/msal-browser";

...

// Make call to resource with SHR
return fetch(resourceEndpointData.endpoint, options)
    .then(response => response.json())
    .then(response => {
        if (response.status === 200 && response.headers.get("Authentication-Info")) {
            // At this point, the response will be a 401 Error, so ignore the success case for now
        }
        // Check if error is 401 unauthorized and WWW-Authenticate header is included
        else if (response.status === 401 && response.headers.get("WWW-Authenticate")) {
            lastResponseHeaders = response.headers;
            const authHeaderParser = new AuthenticationHeaderParser(response.headers);
            shrNonce = authHeaderParser.getShrNonce(); // Null is replaced with valid nonce from WWW-Authenticate header
        } else {
            // Deal with other errors as necessary
        }
    }); 
});
```

### Using and renewing a valid nonce

4. Now that the `shrNonce` has been acquired for the first time, the `PoP Token` can be requested again, including a valid nonce, and the authorized resource request can be completed successfully. The `200 OK` successful response will now include a `Authentication-Info` header that will have a `nextnonce` challenge, which can be parsed by MSAL in the same way as the `WWW-Authenticate` nonce:

```typescript
import { PublicClientApplication, AuthenticationHeaderParser } from "@azure/msal-browser";

// 1. Configure PoP Token Request without a valid SHR Nonce
const popTokenRequest = {
    scopes: ["User.Read"],
    authenticationScheme: msal.AuthenticationScheme.POP,
    resourceRequestMethod: "POST",
    resourceRequestUri: "YOUR_RESOURCE_ENDPOINT"
    shrNonce: shrNonce // SHR Nonce is now a valid server-generated nonce
};


 // Get PoP token to make authenticated request
const shr = await publicClientApplication.acquireTokenSilent(popTokenRequest);

// Set up PoP Resource request
const reqHeaders = new Headers();
const authorizationHeader = `PoP ${shr}`;

headers.append("Authorization", authorizationHeader);

const options = {
    method: method,
    headers: headers
};

// Make call to resource with SHR
return fetch(resourceEndpointData.endpoint, options)
    .then(response => response.json())
    .then(response => {
         if (response.status === 200 && response.headers.get("Authentication-Info")) {
             /** NEW **/
            // 200 OK if nonce was valid
            lastResponseHeaders = response.headers;
            const authHeaderParser = new AuthenticationHeaderParser(response.headers);
            shrNonce = authHeaderParser.getShrNonce(); // Previous nonce (possibly expired) is replaced with the nextnonce generated by the server
        }
        // Check if error is 401 unauthorized and WWW-Authenticate header is included
        else if (response.status === 401 && response.headers.get("WWW-Authenticate")) {
           /** SAME AS BEFORE **/
            lastResponseHeaders = response.headers;
            const authHeaderParser = new AuthenticationHeaderParser(response.headers);
            shrNonce = authHeaderParser.getShrNonce(); // Null is replaced with valid nonce from WWW-Authenticate header
        } else {
            // Deal with other errors as necessary
        }
    });
});
```
### Integrated Nonce Acquisition Cycle

The following script proposes the recommended way to handle `PoP Token` Requests that require a server nonce to be acquired and renewed continuously:

```typescript
/**
 * Application script
 */

import { PublicClientApplication, AuthenticationHeaderParser } from "@azure/msal-browser";
const publicClientApplication = new PublicClientApplication(msalConfig);

// Initialize header map to keep track of the "last" response's headers.
let lastResponseHeaders: HttpHeaders = null;
// Call the PoP API endpoint 
const { responseBody, lastResponseHeaders } = await callPopResource(publicClientApplication, resourceEndpointData, lastResponseHeaders);

/**
 * End Application script
 */


/**
 * Source Code: 
 * This method is responsible for getting data from a PoP-protected API. It is called at the bottom of the 
 * demo code in the application script.
 */
const async callPopResource(
    publicClientApplication: PublicClientApplication,
    resourceEndpointData: ResourceEndpointData,
    lastResponseHeaders: HttpHeaders): ResponseBody {
    
    // Get headers from last response's headers
    const headerParser = new AuthenticationHeaderParser(lastResponseHeaders);
    let shrNonce: string | null;
    
    try {
        shrNonce = headerParser.getShrNonce(); // Will return 
    } catch (e) {
        // If the lastResponse headers are null, .getShrNonce will throw (by design)
        shrNonce = null;
    }

    // Build PoP request as usual, adding the server nonce
    const popTokenRequest = {
        account: CURRENT_ACCOUNT,
        scopes: resourceEndpointData.POP_RESOURCE_SCOPES,
        authenticationScheme: AuthenticationScheme.POP,
        resourceRequestUri: resourceEndpointData.RESOURCE_URI,
        resourceRequestMethod: resourceEndpointData.METHOD,
        shrClaims: resourceEndpointData.CUSTOM_CLAIMS_STRING,
        shrNonce: shrNonce || undefined // Will be undefined on the first call, shrNonce should be valid on subsequent calls
    }

    // Get pop token to make authenticated request
    const shr = await publicClientApplication.acquireTokenSilent(popTokenRequest);

    // PoP Resource request
    const reqHeaders = new Headers();
    const authorizationHeader = `PoP ${shr}`; //Create Authorization header

    headers.append("Authorization", authorizationHeader); // Add Authorization header to request headers

    const options = {
        method: method,
        headers: headers
    };

    // Make call to resource with SHR
    return fetch(resourceEndpointData.endpoint, options)
        .then(response => response.json())
        .then(response => {
            if (response.status === 200 && response.headers.get("Authentication-Info")) {
                lastResponseHeaders = response.headers;
                const authHeaderParser = new AuthenticationHeaderParser(response.headers);
                shrNonce = authHeaderParser.getShrNonce(); // Previous nonce (possibly expired) is replaced with the nextnonce generated by the server
            }
            // Check if error is 401 unauthorized and WWW-Authenticate header is included
            else if (response.status === 401 && response.headers.get("WWW-Authenticate")) {
            /** SAME AS BEFORE **/
                lastResponseHeaders = response.headers;
                const authHeaderParser = new AuthenticationHeaderParser(response.headers);
                shrNonce = authHeaderParser.getShrNonce(); // Null is replaced with valid nonce from WWW-Authenticate header
            } else {
                // Deal with other errors as necessary
            }
        });
    });
}
```
