# Signed Http Request

MSAL.js provides the `SignedHttpRequest` class as a convenience to assist in creating [signed http requests (SHRs)](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-signed-http-request-03) for payloads (e.g. tokens) that are acquired out-of-band from MSAL.js. This enables applications to leverage the same encryption and caching MSAL.js uses for [access token proof-of-possession](./access-token-proof-of-possession.md) for their own payloads.

Note: The `SignedHttpRequest` class is intended for advanced use cases where the built-in access token proof-of-possession functionality cannot be used. Example of these use cases included AAD/MSA access tokens acquired-out-band from MSAL.js, and workload access tokens.

## Requirements

To use the `SignedHttpRequest` API, an application must:

1. Forward the public key thumbprint returned to the server issuing the payload, and that server must embedded the thumbprint inside the signed payload. This is typically a signed JWT.
2. Provide the payload and the original public key thumbprint back to MSAL.
3. The resource server for which the SHR is intended must understand how to decode and validate the SHR and inner payload.


### AAD Parameters

For tokens issued by AAD/MSA, applications will need to include additional query parameters in their token requests:

- `req_cnf` : Base64 encoded string including the public key thumbprint.
- `token_type`: Set to `pop` to indicate this is a proof-of-possession flow.

## Sample

### Application Usage

#### api.ts

```typescript
import { SignedHttpRequest } from "@azure/msal-browser";

const resourceRequestUri = "https://api.contoso.com/my-api";
const resourceRequestMethod = "GET";

// Instantiate the token binding class. There may be configuration options possible in the future.
const signedHttpRequest = new SignedHttpRequest({
    resourceRequestUri, 
    resourceRequestMethod
});

// Use MSAL to generate and cache the keys, and return the public key thumbprint to the app.
const publicKeyThumbprint = await signedHttpRequest.generatePublicKeyThumbprint();

// Application acquires the payload to the be signed, providing the public key.
// This payload can be cached by the application, if desired.
const payload = await fetchAccessTokenWithoutMsal(publicKeyThumbprint);

// Application invokes custom business logic to acquire nonce (optional)
const nonce = await fetchServerNonce();

// Use MSAL to generate the pop token for the payload.
// This popToken should be used immediately and not be cached by the application.
const popToken = await signedHttpRequest.signRequest(payload, publicKeyThumbprint, { nonce });

// Initiate http request using pop token
const headers = new Headers();
headers.append("Authorization", `PoP ${popToken}`);

const options = {
    method: resourceRequestMethod,
    headers
};

const response = await fetch(resourceRequestUri, options);
const json = await response.json();

// Delete keys from cache
await signedHttpRequest.removeKeys(publicKeyThumbprint);

```

### Server Nonces

The `SignedHttpRequest` API will support the ability to set custom claims in the SHR, including nonce, such as via server nonce. To acquire a server nonce, perform the following steps:

1. Generate the public key thumbprint and acquire the bound payload.
2. Invoke `SignedHttpRequest.signRequest()` without providing a nonce value. This will generate an SHR with a library-generated `nonce` claim (currently a guid).
3. Invoke the network request using the SHR to the resource server.
4. The resource server will respond with an error and a new `nonce` value to use in a header.
5. The application will need to parse this header and reinvoke `SignedHttpRequest.signRequest()`, this time passing the parsed `nonce` value (in the future, MSAL will provide a helper function for parsing the header).
6. Reinvoke the network request using the SHR to the resource server.
