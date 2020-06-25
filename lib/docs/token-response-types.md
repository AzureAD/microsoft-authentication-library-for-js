# Token Response Types

When acquiring tokens, `msal@1.x.x` considers three different response types:

| Response Type | Definition | Reference | Request Example |
| ------- | -------- | -------- | -------- |
| **token** | Indicates a request will be made for an Access Token | [OAuth 2.0 Implicit Flow Specification](https://tools.ietf.org/html/rfc6749#section-4.2.1) | [Request example](https://tools.ietf.org/html/rfc6749#section-4.2.1)
| **id_token** | Indicates a request will be made for an ID Token | [OpenID Connect Specification](https://openid.net/specs/openid-connect-core-1_0.html#Authentication) | [Request Example](https://openid.net/specs/openid-connect-core-1_0.html#id_tokenExample)
| **id_token token** | Indicates that both an ID Token and Access Token will be requested | [OpenID Connect Specification](https://openid.net/specs/openid-connect-core-1_0.h:tml#Authentication) | [Request Example](https://openid.net/specs/openid-connect-core-1_0.html#id_token-tokenExample)

The table below describes the mapping of `msal@1.x.x` APIs in combination with the user-provided `scopes` to the resulting `response_type` set in the server request.

| Scenarios | Client ID as Only Scope | No Scopes | Access Token Scopes with No client ID | Access Token Scopes with client ID
| ------- | ------- | -------- | --------- | -------- |
| **loginRedirect/Popup** | id_token | id_token |id_token token | id_token token
| **acquireTokenInteractive** | id_token | Error | token | id_token token 
| **acquireTokenSilent** | id_token | Error | token | id_token token
| **loginRedirect/Popup with accounts not matching** | id_token | id_token | id_token token | id_token token
| **acquireTokenInteractive with accounts not matching** | id_token | Error | id_token token | id_token token
| **acquireTokenSilent with accounts not matching** | id_token | Error | id_token token | id_token token

As described in the table above, the `response_type` is determined based on specific combinations of the following attributes:

+ `Scenario`: 
    - The `msal@1.x.x` API called and the conditions it is called under.
    - The first three rows assume that either no `account` object was passed in or the `account` object passed in is the same as the one stored in the MSAL Cache.
    - The last three rows describe scenarios in which an `account` object was included in the request, and that `account` object is **different** from the one found in the MSAL Cache.

+ `Client ID as Only Scope`: The result of passing in a scopes array containing only the client ID value.


```js
    const request = { scopes: ['APP_CLIENT_ID_VALUE'] };
```

+ `No Scopes`: The result of passing in an empty scopes array in the request configuration in a specific scenario.

```js
    const request = { scopes: [] };
```

+ `Access Token Scopes with No client ID:` The result of passing in a scopes array that contains resource scopes (i.e. 'user.read') but doesn't contain the value of the client ID.


```js
    const request = { scopes: ['user.read'] };
```

+ `Access Token Scopes with client ID:` The result of passing in a scopes array that contains resource scopes (i.e. 'user.read') and the value of the client ID.


```js
    const request = { scopes: ['user.read', 'APP_CLIENT_ID_VALUE'] };
```

### Login Scopes Considerations

+ Within `msal@1.x.x`, `openid` and `profile` are referred to as "login scopes" or OIDC (OpenID Connect) scopes. From the library's perspective, setting the client ID value as a scope in the request configuration object is functionally equivalent to adding `openid`, `profile`, or both scopes. 

    This is because during request validation, if the client ID value is present in the scopes, it is substituted with `openid` and `profile`.

    Similarly, whenever `openid` or `profile` is present without the other in the scopes array, the missing login scope will be added during request validation and before the request is actually sent to the server.

    This means that:

    + `scopes: ['APP_CLIENT_ID_VALUE']`
    + `scopes: ['openid']`
    + `scopes: ['profile']`

    Are all functionally equivalent to `scopes: ['openid', 'profile']` when set in the request configuration object before passing it in as a parameter to any of UserAgentApplication's public APIs.

+ On a related note, `login` APIs (i.e. `loginPopup` and `loginRedirect`) will append 'openid' and 'profile' (without duplication) to the scopes array in every call, no matter what other scopes are present. This means that `login` APIs may be called with an empty scopes array in the request configuration object.

+ If any scopes other than those shown above are present in the scopes array, they will remain in the array unchanged, and `openid` and `profile` will just be appended as necessary.