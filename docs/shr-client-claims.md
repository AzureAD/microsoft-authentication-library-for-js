# Custom SHR Claims

As an enhancement of Access Token Proof-of-Possesion, MSAL Browser provides a way to insert custom client claims into a `Signed HTTP Request`, also known as a `PoP Token`. These custom SHR claims can be added to any token request that uses the `POP` authentication scheme.

Given that the payload of a `Signed HTTP Request` has a specific format, rather than allowing custom claim names which could collide with any of the [first-order SHR claims](https://tools.ietf.org/html/draft-ietf-oauth-signed-http-request-03#section-3), MSAL Browser allows custom client claims to be passed in as a string, which will be added to the Signed HTTP Request `JWT` as the value of a claim called `client_claims`. This string will usually be a serialized object containing the custom claims, but MSAL will not parse or verify the string in any way.

Given that MSAL does not cache `Signed HTTP Requests` (the access token secret is cached and the SHR payload is built and signed just-in-time whenever `acquireTokenSilent` is called), custom client claims will **not** be cached either. This means that the claims must also be passed into every `acquireTokenSilent` call in order for them to be added to the resulting `SignedHTTPRequest`.

Once the `Signed HTTP Request` is sent to the resource server as a `PoP Token`, the resource server is responsible for validating the signed payload as well as extracting and parsing the `client_claims`.



## Usage

Custom client claims for SHRs can be passed into any token request object as `shrClaims`. It is important to note that custom SHR claims are an extension of the Access Token Proof-of-Possession scheme, so they will only be used when the token request's `authenticationScheme` is set to `POP`.

### Acquire Token Redirect Request Example

```javascript
const popTokenRequest = {
    scopes: ["User.Read"],
    authenticationScheme: msal.AuthenticationScheme.POP,
    resourceRequestMethod: "POST",
    resourceRequestUri: "YOUR_RESOURCE_ENDPOINT",
    shrClaims: "{\"nonce\": \"AQAA123456\",\"local_nonce\": \"AQAA7890\"}"
}
```

Once the request has been configured and `POP` is set as the `authenticationScheme`, it can be sent into the `acquireTokenRedirect` MSAL Browser API.

```javascript
const response = await myMSALObj.acquireTokenRedirect(popTokenRequest);
```

The response will contain a property called `accessToken`, which will contain the `Signed HTTP Request`. When verified using the public key, the SHR's JWT payload will look something like the following:

```javascript
{
    at: ...,
    ts: ...,
    m: "POST",
    u: "YOUR_RESOURCE_ENDPOINT",
    nonce: ...,
    p: ...,
    q: ...,
    client_claims: "{\"nonce\": \"AQAA123456\",\"local_nonce\": \"AQAA7890\"}"
}
```
