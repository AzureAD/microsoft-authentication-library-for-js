# Response Types and Scopes


## Contents

- [Response Types](#response-types)
- [Server Request Configuration vs Server Request URL](#server-request-configuration-vs-server-request-url)
- [Login Scopes Considerations](#login-scopes-considerations)
- [Scopes-based Response Types Reference Tables](#scopes-based-response-types-reference)


## Response Types

When acquiring tokens, `msal@1.x.x` considers three different response types:

| Response Type | Definition | Reference | Request Example |
| ------- | -------- | -------- | -------- |
| **token** | Indicates a request will be made for an Access Token | [OAuth 2.0 Implicit Flow Specification](https://tools.ietf.org/html/rfc6749#section-4.2.1) | [Request example](https://tools.ietf.org/html/rfc6749#section-4.2.1)
| **id_token** | Indicates a request will be made for an ID Token | [OpenID Connect Specification](https://openid.net/specs/openid-connect-core-1_0.html#Authentication) | [Request Example](https://openid.net/specs/openid-connect-core-1_0.html#id_tokenExample)
| **id_token token** | Indicates that both an ID Token and Access Token will be requested | [OpenID Connect Specification](https://openid.net/specs/openid-connect-core-1_0.h:tml#Authentication) | [Request Example](https://openid.net/specs/openid-connect-core-1_0.html#id_token-tokenExample)

In the `msal@1.x.x` context, the `response_type` value that is set in the server request URL determines what kind of token is returned by the API called.

## Server Request Configuration v.s. Server Request URL

For proper understanding of this document, a very important distinction must be made between the server request **configuration object**, built by the developer before calling an `msal@1.x.x` API and validated/completed by `msal@1.x.x`, and the server request **URL**, which is built by `msal@1.x.x` *based on* the server request *configuration object*.

### Server Request Object

A Javascript object built by the developer and passed into an `msal@1.x.x` API, containing the configuration for a token request.

Example:

```js
// Server Request Object
const tokenRequestConfig = {
    scopes: ['user.read', 'custom.scope'],
    account: exampleAccountObject
}

// msal@1.x.x API call for a token request
const token = msal.acquireTokenSilent(tokenRequestConfig);
```

### Server Request URL

A URL encoded string that `msal@1.x.x` generates based on the server request **configuration object** and uses to obtain your access or ID token from the server:

Example: 

`https://login.microsoftonline.com/common/oauth2/v2.0/authorize?response_type=token&scope=s1%20openid%20profile&client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&state=1234&nonce=NONCE_VALUE&client_info=1&x-client-SKU=MSAL.JS&x-client-Ver=1.3.2&client-request-id=CLIENT_REQUEST_ID_VALUE`

### Implications

In summary, the server request **configuration object** is what `msal@1.x.x` uses (in the Implicit Flow) to determine the contents of the actual server request **URL** string that makes up the `GET` request sent to the server. In relation to scopes and response types, this has the following implications:

1. The `scopes` attribute in the server request **configuration object** is used to determine the `response_type` that will be set in the server request **URL**.
2. All **valid** contents of the `scopes` attribute in the server request **configuration object** will be added to the `scopes` parameter of the final server request **URL**, but the final server request **URL** scopes will have an **extended** version of the configuration scopes by adding login scopes (defined in the following section) if they are not already present in the **configuration object**. 

## Login Scopes Considerations

+ Within `msal@1.x.x`, `openid` and `profile` are referred to as "login scopes" or OIDC (OpenID Connect) scopes.
+ Passing the value of `clientId` into the request **configuration object**'s `scopes` array will cause `msal@1.x.x` to add `openid` and `profile` to the same **configuration object**'s `scopes` array in the request validation stage, **before** setting the server request's `response_type`.
+ Similarly, whenever `openid` or `profile` is present without the other in the scopes array, the missing login scope will be added during request validation and before the request is actually sent to the server.

    This means that, after the request is validated and before `response_type` is determined:

    + `scopes: ['APP_CLIENT_ID_VALUE']` becomes `scopes: ['APP_CLIENT_ID_VALUE', 'openid', 'profile']`
    + `scopes: ['openid']` becomes `scopes: ['openid', 'profile']`
    + `scopes: ['profile']` becomes `scopes: ['profile', 'openid']`

    Any of the previous three scopes configurations (or any combination between them) will be referred to as "login scopes" from this point on. This is because they all result in the server request **configuration object**'s `scopes` array containing `openid` and `profile` before the `response_type` is determined.
    
    The term "resource scopes", on the other hand, refers to any resource-related set of scopes that an access token is being requested for (i.e. 'user.read', 'mail.read', etc.). 

+ In any case where login scopes are appended, any valid resource scopes present in the array are kept and will eventually be added to the `scopes` parameter in the server request.

+ **Important Note:** `msal@1.x.x` will append `openid` and `profile` to the `scopes` parameter of every server request URL, regardless of which API is called and whether or not any of these two specific scopes are included in the server request **configuration object**. This implication is the main reason why this document makes the distinction between the server request **configuration object** and **URL**.

## Scopes-based Response Types Reference

The tables below describe the mapping of `msal@1.x.x` APIs in combination with the user-provided `scopes` to the resulting `response_type` set in the server request **URL**.

### Login APIs

The following table applies to: `loginPopup`, `loginRedirect` and `ssoSilent`.

| Scopes | Account in MSAL Cache| Account Passed In | Response Type/Result | 
| -------- | ------- | ------- | -------- |
| Empty Scopes Array | - | - | id_token |
| Login Scopes Only | - | - | id_token |
| Resource Scopes Only | - |  - | id_token |
| Login and Resource Scopes | - | - | id_token

 In other words, `login` APIs (including `ssoSilent`) wil always set `response_type=id_token` for the server request and, therefore, include an ID Token in the response, regardless of the `scopes` and `account` configuration.

 ### AcquireToken APIs

The following table applies to: `acquireTokenSilent`, `acquireTokenPopup` and `acquireTokenRedirect`.

| Scopes | Account in MSAL Cache| Account Passed In | Response Type/Result | 
| -------- | ------- | ------- | -------- |
| Empty Scopes Array | - | - | Empty Scopes Array Error |
| Login Scopes Only | - | - | id_token |
| Resource Scopes Only | Yes | Matches account in MSAL Cache | token |
| Resource Scopes Only | Yes |  Doesn't match account in MSAL Cache | id_token_token |
| Login and Resource Scopes | - | - | id_token token |



### Scopes-based Response Types Tables Disambiguation

As described in the tables above, the `response_type` is determined based on specific combinations of:

1. The UserAgentApplication API/method called (`login` vs `acquireToken` APIs)
2. The presence of the `account` object in the configuration object and whether it matches the `account` object found in the MSAL Cache
3. The contents of the `scopes` array in the server **configuration object** after it has been validated

The following points provide practical examples and the disamibiguation of what configuration the scopes labels describe. 

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

+ `Resource Scopes Only:` Passing in a scopes array that contains resource scopes (i.e. 'user.read') but doesn't contain any of the login scopes.


```js
    const request = { scopes: ['user.read'] }; // or
    const request = { scopes: ['mail.read'] }; // or 
    const request = { scopes: ['user.read', 'mail.read'] }; // or any other set of resource scopes to be consented
```

+ `Resource and Login Scopes:` Passing in a scopes array that contains resource scopes (i.e. 'user.read') and any combination of the login scopes.


```js
    const request = { scopes: ['user.read', 'APP_CLIENT_ID_VALUE'] }; // or
    const request = { scopes: ['user.read', 'openid', 'profile'] }; // or
    const request = { scopes: ['user.read', 'ANY_RESOURCE_SCOPE_VALUE', 'openid', 'profile'] }; // etc.
```