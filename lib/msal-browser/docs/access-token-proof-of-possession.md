# Acquiring Access Tokens Protected with Proof-of-Possession

In order to increase the protection of OAuth 2.0 access tokens stored in the browser from being "replayed", MSAL provides an `Access Token Proof-of-Posession` authentication scheme. `Access Token Proof-of-Possession`, or `AT PoP`, is an authentication scheme that cryptographically binds the access tokens to the browser and client application from which they are requested, meaning they cannot be used from a different application or device.

It is important to understand that for `AT PoP` to work end-to-end and provide the security upgrade intended, both the **authorization service** that issues the access tokens and the **resource server** that they are provide access to must support `AT PoP`.

## Setting the POP authentication scheme

Once you have determined the authorization service and resource server support access token binding, you can configure your MSAL authentication and authorization request objects to acquire bound access tokens by enabling the `POP` authenticaiton scheme in the request configuration:

### Login Redirect Request Example

```typescript
const loginRequest = {
    scopes: ["User.Read"],
    authenticationScheme: msal.AuthenticationScheme.POP,
    resourceRequestMethod: "POST",
    resourceRequestUri: "YOUR_RESOURCE_ENDPOINT"
}

return myMSALObj.loginRedirect(loginRequest);
}
```

### Acquire Token Redirect Example

```typescript

// Add here scopes for id token to be used at MS Identity Platform endpoints.
const loginRequest = {
    scopes: ["User.Read"],
    
};

// Add here scopes for access token to be used at MS Graph API endpoints.
const tokenRequest = {
    scopes: ["Mail.Read"],
    authenticationScheme: msal.AuthenticationScheme.POP,
    resourceRequestMethod: "POST",
};
       
const authResponse = myMSALObj.acquireTokenRedirect(request);

```

