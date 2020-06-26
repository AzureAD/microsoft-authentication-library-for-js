# Token Response Types

When acquiring tokens, `msal@1.x.x` considers three different response types:

| Response Type | Definition | Reference | Request Example |
| ------- | -------- | -------- | -------- |
| **token** | Indicates a request will be made for an Access Token | [OAuth 2.0 Implicit Flow Specification](https://tools.ietf.org/html/rfc6749#section-4.2.1) | [Request example](https://tools.ietf.org/html/rfc6749#section-4.2.1)
| **id_token** | Indicates a request will be made for an ID Token | [OpenID Connect Specification](https://openid.net/specs/openid-connect-core-1_0.html#Authentication) | [Request Example](https://openid.net/specs/openid-connect-core-1_0.html#id_tokenExample)
| **id_token token** | Indicates that both an ID Token and Access Token will be requested | [OpenID Connect Specification](https://openid.net/specs/openid-connect-core-1_0.h:tml#Authentication) | [Request Example](https://openid.net/specs/openid-connect-core-1_0.html#id_token-tokenExample)

In the `msal@1.x.x` context, the `response_type` value that is set in the server request determines what kind of token is returned by the API called.

### Login Scopes Considerations

+ Within `msal@1.x.x`, `openid` and `profile` are referred to as "login scopes" or OIDC (OpenID Connect) scopes. From the library's perspective, setting the `client ID`'s value as a scope in the request configuration object is functionally equivalent to adding `openid`, `profile`, or both scopes. 

    This is because during request validation, if the `client ID`'s value is present in the scopes, it is substituted with `openid` and `profile`.

    Similarly, whenever `openid` or `profile` is present without the other in the scopes array, the missing login scope will be added during request validation and before the request is actually sent to the server.

    This means that:

    + `scopes: ['APP_CLIENT_ID_VALUE']`
    + `scopes: ['openid']`
    + `scopes: ['profile']`

    Are all functionally equivalent to `scopes: ['openid', 'profile']` from the library's perspective. From this point on, when this document makes a reference to "login scopes", it refers to any combination or permutation of `openid`, `profile` and the value of `client ID`. The term "access token scopes", on the other hand, refers to any resource-related scope set that an access token is being requested for (i.e. 'user.read', 'mail.read', etc.). 

+ On a related note, `login` APIs (i.e. `loginPopup` and `loginRedirect`) will append `openid` and `profile` (without duplication) to the scopes array every time they are called, no matter what other scopes are present. This means that `login` APIs can be called with an empty, non-null scopes array in the request configuration object (as opposed to acquireToken APIs which will throw an error with an empty or null `scopes` array in the request).

+ If any valid access token scopes are present in the scopes array, they will remain in the array and eventually be included in the `scopes` parameter of the server request.

***Important Note: `msal@1.x.x` will append `openid` and `profile` to the `scopes` parameter of every server request URL, whether or not any of these two specific scopes are passed by the developer into the API call. The presence of login scopes in the configuration object has an effect on which `response_type` value is set in the actual server request `msal1.x.x` makes, but it does not make a difference on the value of the `scopes` parameter in said server request.***

The Scopes-based Response Types table below describes the mapping of `msal@1.x.x` APIs in combination with the user-provided `scopes` to the resulting `response_type` set in the server request.

## Scopes-based Response Types

|| Account Object in Request Configuration | Empty Scopes Array | Login Scopes Only | Access Token Scopes Only | Access Token and Login Scopes
| -------- | ------- | ------- | -------- | --------- | -------- |
| **loginRedirect/Popup** | **None or Matching Account in MSAL Cache** | id_token | id_token |id_token token | id_token token
| **acquireTokenRedirect/Popup** | **None or Matching Account in MSAL Cache** | Error | id_token | token | id_token token 
| **acquireTokenSilent** | **None or Matching Account in MSAL Cache** | Error | id_token | token | id_token token
| **loginRedirect/Popup** | **Doesn't match Account in MSAL Cache**| id_token | id_token | id_token token | id_token token
| **acquireTokenRedirect/Popup** |  **Doesn't match Account in MSAL Cache** |Error | id_token | id_token token | id_token token
| **acquireTokenSilent** |  **Doesn't match Account in MSAL Cache** |Error | id_token | id_token token | id_token token


### Scope-based Response Types Table Disambiguation

As described in the table above, the `response_type` is determined based on specific combinations of:

1. The UserAgentApplication API/method called (first column)
2. The presence of the `account` object in the configuration object and whether it matches the `account` object found in the MSAL Cache (second column)
3. The contents of the `scopes` array in the configuration object (all other columns)

The values in the first two columns together form the scenario, while the labels of the remaining columns represent the scope configuration. The intersection of a scenario with a scope configuration represents a `response_type` result.

The following points provide practical examples and the disamibiguation of what configuration the scopes columns describe. 

+ `Empty Scopes Array`: Passing in an empty scopes array in the request configuration in a specific scenario.

```js
    const request = { scopes: [] };
```

+ `Login Scopes Only`: Passing in a scopes array containing any combination of login scopes, as described in the Login Scopes Considerations section above.


```js
    const request = { scopes: ['APP_CLIENT_ID_VALUE'] }; // or
    const request = { scopes: ['openid'] }; // or
    const request = { scopes: ['profile'] }; // or any combination/permutation of the three
```

+ `Access Token Scopes Only:` Passing in a scopes array that contains resource scopes (i.e. 'user.read') but doesn't contain any of the login scopes.


```js
    const request = { scopes: ['user.read'] }; // or
    const request = { scopes: ['mail.read'] }; // or 
    const request = { scopes: ['user.read', 'mail.read'] }; // or any other set of resource scopes to be consented
```

+ `Access Token and Login Scopes:` Passing in a scopes array that contains resource scopes (i.e. 'user.read') and any combination of the login scopes.


```js
    const request = { scopes: ['user.read', 'APP_CLIENT_ID_VALUE'] }; // or
    const request = { scopes: ['user.read', 'openid', 'profile'] }; // or
    const request = { scopes: ['user.read', 'ANY_RESOURCE_SCOPE_VALUE', 'openid', 'profile'] }; // etc.
```