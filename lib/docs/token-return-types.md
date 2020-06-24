# Token Return Types

When acquiring tokens, MSAL JS v1 considers three different Token Request types:

|Token Type | Definition |
| ------- | -------- | ------- |
| **token** | Indicates a request will be made for an Access Token |
| **id_token** | Indicates a request will be made for an ID Token |
| **id_token token** | Indicates that both an ID Token and Access Token will be requested |

The following table describes how MSAL JS v1 determines which token request type is set and therefore what kind of token is returned by the API in question. 

| Scenarios | ClientId as Only Scope | No Scopes | Access Token Scopes with No ClientId | Access Token Scopes with ClientId
| ------- | ------- | -------- | --------- | -------- |
| **loginRedirect/Popup** | id_token | id_token |id_token token | id_token token
| **acquireTokenInteractive** | id_token | Error | token | id_token token 
| **acquireTokenSilent** | id_token | Error | token | id_token token
| **loginRedirect/Popup with accounts not matching** | id_token | id_token | id_token token | id_token token
| **acquireTokenInteractive with accounts not matching** | id_token | Error | id_token token | id_token token
| **acquireTokenSilent with accounts not matching** | id_token | Error | id_token token | id_token token

As described in the table above, the Token Request Type is determined based on specific combinations of the following attributes:

+ `Scenario`: Each row is a combination of the public API that is called in the client application and whether or not the account passed in matches the account in the MSAL cache.

+ `ClientId as Only Scope`: The result of passing in a scopes array containing only the client ID value.


```js
    const request = { scopes: ['APP_CLIENT_ID_VALUE'] };
```

+ `No Scopes`: The result of passing in an empty scopes array in the request configuration in a specific scenario.

```js
    const request = { scopes: [] };
```

+ `Access Token Scopes with No ClientId:` The result of passing in a scopes array that contains resource scopes (i.e. 'user.read') but doesn't contain the value of the ClientId.


```js
    const request = { scopes: ['user.read'] };
```

+ `Access Token Scopes with ClientId:` The result of passing in a scopes array that contains resource scopes (i.e. 'user.read') and the value of the ClientId.


```js
    const request = { scopes: ['user.read', 'APP_CLIENT_ID_VALUE'] };
```

### Login Scopes Considerations

Within MSAL JS v1, `openid` and `profile` are referred to as "login scopes" or OIDC (OpenID Connect) scopes. From the library's perspective, setting the client ID value as a scope in the request configuration object is functionally equivalent to adding 'openid', 'profile', or both scopes. 

This is because during request validation, if the client ID value is present in the scopes, it is removed from the array and replaced with both 'openid' and 'profile'.

Similarly, whenever 'openid' or 'profile' is present without the other in the scopes array, the missing login scope will be added during request validation and before the request is actually sent to the server.

This means that:

+ `scopes: ['APP_CLIENT_ID_VALUE']`
+ `scopes: ['openid']`
+ `scopes: ['profile']`

Are all functionaly equivalent to `scopes: ['openid', 'profile']` when set in the request configuration object before passing it in as a parameter to any of UserAgentApplication's public APIs.

On a related note, `login` APIs (i.e. `loginPopup` and `loginRedirect`) will append 'openid' and 'profile' (without duplication) to the scopes array in every call, no matter what other scopes are present. This means that `login` APIs may be called with an empty scopes array in the request configuration object.

If any scopes other than those shown above are present in the scopes array, they will remain in the array unchanged, and 'openid' and 'profile' will just be appended as necessary.