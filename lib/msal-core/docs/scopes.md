# Scope Configuration and Behavior

## Contents
* [Scopes](#scopes)
    * [Scope Functions](#scope-functions)
    * [Scope Types](#scope-types)
* [Scopes Behavior](#scopes-behavior)
    * [Default Scopes in Authorization Requests](#default-scopes-on-authorization-requests)
    * [Scopes Usage](#scopes-usage)
## Scopes

Microsoft identity platform access tokens, which `msal@1.x` acquires in compliance with the OAuth 2.0 protocol specification, are issued to applications as proof of authorization on behalf of a user for a certain resource. The issuing of these tokens is not only specific to an `audience`, or application, but also specific to a set of `scopes` or permissions.

### Scope Functions

#### Function of scopes in OAuth 2.0

The main function of the `scopes` configuration, per the [OAuth 2.0 Access Token Scope Reference](https://tools.ietf.org/html/rfc6749#section-3.3), is to determine the permissions for which an application requests `authorization` on behalf of the user. Said function is both supported and covered by `msal@1.x` and the Microsoft identity platform in general. For more information on the regular function of authorization scopes, please consult the official [Microsoft identity platform documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-permissions-and-consent).

#### Special use of scopes in msal@1.x

In addition to the global concept and use of `scopes`, it is important to understand that `msal@1.x` gives scopes a special use that adds to the importance of their configuration. In short, `msal@1.x` allows developers to leverage certain scopes in order to determine the `response_type` for the final request. For more information on the way the scopes configuration determines the `response_type` parameter, please refer to the [Response Types Document](../response-types.md).



## Scope Types

As far as `msal@1.x` is concerned, there are two main types of `scopes` that can be configured in a token request.

### Resource scopes for Authorization

`Resource scopes` are the main type of access token `scopes` that `msal@1.x` deals with. These are the `scopes` that represent permissions for specific actions against a particular resource. In other words, these  `scopes` determine what actions and resources the requesting application is `authorized` to access on behalf of the user. The following are some examples of the `resource scopes` that the [Microsoft Graph](https://docs.microsoft.com/en-us/graph/overview) service can authorize an application for given the user's consent:

* `User.Read`: Authorizes the application to read a user's account details.
* `Mail.Read`: Authorizes the application to read a user's e-mails.

Including resource scopes in the configuration for a token request doesn't always mean that the response will include an **access token** for said scopes. In the specific case of `msal@1.x`'s `login` APIs (`loginRedirect`, `loginPopup`), adding resource scopes may allow the user to **constent** to said scopes ahead of time, but successful `login` API calls always result in an **ID Token, not an access token**, being returned.

### OpenID Connect Scopes for Authentication

`OpenID Connect (OIDC) scopes` are a specific set of scopes that can be added to requests when `authenticating` a user. In most cases, `OIDC scopes` are added to configure the claims included in an ID Token ([OIDC Reference](https://openid.net/specs/openid-connect-core-1_0.html#ScopeClaims) / [Microsoft Docs](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-permissions-and-consent#openid-connect-scopes)). Some services, such as the Secure Token Service that `msal@1.x` acquires tokens from, also use OIDC scopes in their internal logic. For this reason, it is important to understand and pay attention to the special behavior `msal@1.x` has around OIDC scopes (described in the [next section](#default-scopes-on-authorization-requests)).

The OIDC scopes that `msal@1.x` pays particular attention to are outlined in the table below.

| OIDC Scope | Required by OIDC Specification | Function | OIDC Reference | Microsoft Docs |
| ---------- | ------------------------------ | -------- | -------------- | -------------- |
| `openid`| Mandatory   |  Main `OIDC scope` that indicates a request for `authentication` [per the OIDC specification](https://openid.net/specs/openid-connect-core-1_0.html#AuthRequest). In AAD requests, this is the scope that prompts the "Sign in" permission that a user can consent to. | [Authentication Request](https://openid.net/specs/openid-connect-core-1_0.html#AuthRequest)| [Permissions and consent in the Microsoft identity platform endpoint](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-protocols-oidc#send-the-sign-in-request)|
|`profile`| Optional | Used for ID Token `claims` configuration. Adds the end-user's default profile information as a claim to the ID token returned | [Requesting Claims using Scopes Values](https://openid.net/specs/openid-connect-core-1_0.html#ScopeClaims) | [OpenID Permissions](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-permissions-and-consent)|


## Scopes Behavior

### Default Scopes on Authorization Requests

Understanding how `OIDC scopes` configure the claims included in an authentication response's ID Token is important when using `msal@1.x` to acquire said ID Tokens. However, there is an important note to be made on how the `openid` and `profile` scopes are added by `msal@1.x` to all server requests by default that does not directly relate to the OpenID Connect specification.

Like previously mentioned, the Secure Token Service that `msal@1.x` requests access and ID tokens from also makes use of the `openid` and `profile` scopes. Specifically, the STS expects these two scopes in order to configure and provide the `client_info` parameter in authorization and authentication responses. The `msal@1.x` library depends on the contents of `client_info` in order to successfuly cache tokens and, therefore, provide silent token acquisition as a feature.

**For this reason, whether or not the developer adds the `openid` or `profile` scopes to their request configuration, `msal@1.x` will make sure they are included before sending the request to the STS.**

### Scopes Usage

Consider the case in which an authorization request is made to obtain a token for use with `Microsoft Graph` using, for example, the `acquireTokenPopup` API that `msal@1.x` provides. In order to prompt the user to consent to the `User.Read` permission, `User.Read` must be added as a scope in the Authorization Request Configuration:

```js
const request = {
    scopes: ['User.Read'],
    .
    .
    .
}

const accessToken = msalApp.acquireTokenPopUp(request).then((response) => {
    return response.accessToken
} catch (e) {
    // Error handling
});
```

Given all the information provided in the sections above, it should be clear that the finalized server request URL will include a `scopes` parameter that looks something like:

```
scope=User.Read%20openid%20profile
```

Remember, while all valid resource scopes provided by the developer in configuration will be included in the scopes parameter, `openid` and `profile` will always be included in the final URL-encoded string before the request is sent.

### Special OIDC Scopes behavior cases

The following table summarizes how `scopes` configured by the developer may be transformed during `msal@1.x`'s token acquisition flows.

#### Login APIs

| Input scopes content | Final scopes included in request URL | Notes |
| -------------------- | ------------------------------------ | ----- |
| ClientId string | [openid, profile] |  When the clientID is sent as the ONLY scope it is removed and replaced with `openid` and `profile` |
| ClientId string with 'openid', 'profile' or both | [clientId, 'openid', 'profile'] | ClientId, not being the only scope, is treated as a resource scope that will be sent to the server, so it is not removed. The `openid` and `profile` scopes are still appended immediately.|
| Empty or Null Scopes | ['openid', 'profile'] | Empty or null scopes are only supported for `login` APIs because there is no need for scopes other than `openid` and `profile`, which are added by default. |
| Resource scope(s) only (ex. ['User.Read']) | ['User.Read', 'openid', 'profile'] | Resource scopes are kept, default scopes OIDC are added.<br/><br/>**Note: Login APIs don't return access tokens. These scopes can be consented to in login requests, but an access token will not be issued for them at this point.** |
| Resource scope(s) and OIDC scopes, ex:<br/> - ['User.Read', 'openid']| ['User.Read', 'openid', 'profile'] | ['User.Read', 'openid', 'profile'] | Same behavior and notes as case above, OIDC scopes are completed. |
| ClientId and Resource scope(s): <br/> - [clientId, 'User.Read']| [clientId, 'User.Read', 'openid', 'profile'] | [clientId, 'User.Read', 'openid', 'profile'] | ClientId is treated as resource scope, `openid` and `profile` are automatically appended as well.|

Table summary for Login APIs:

- The `openid` and `profile` OIDC scopes are automatically appended to the `scopes` array in every `login` API call
- ClientId is only removed when it is the only scope in the configuration, otherwise it is treated as a resource scope and will be sent in the final server request
- Resource scopes can be included in `login` calls in order to **pre-consent** to said scopes, but that will not result in an access token being requested for them.

#### Acquire Token APIs

| Input scopes content | Scopes after validation | Final scopes included in request URL | Notes |
| -------------------- | ----------------------- | ------------------------------------ | ----- |
| [clientId] | [openid, profile] | [openid, profile] | When the clientID is sent as the ONLY scope, it will immediately be replaced by (translated into) `openid` and `profile` |
| Empty or Null Scopes | Error thrown in validation | - | Access tokens are issued for specific scopes. Empty or null scopes are **not supported for `acquireToken` API calls**. |
| Resource scope(s) only, ex: <br/> - ['User.Read'] | ['User.Read'] |  ['User.Read', 'openid', 'profile'] | Resource scopes are kept and sent to the server, `openid` and `profile` are only appended **right before** sending the request to the server. |
| Resource scope(s) and OIDC scopes, ex:<br/> - ['User.Read', 'openid']| ['User.Read', 'openid', 'profile'] | ['User.Read', 'openid', 'profile'] | Same behavior and notes as case above, OIDC scopes are completed. |
| ClientId and Resource scope(s): <br/> - [clientId, 'User.Read']| [clientId, 'User.Read', 'openid', 'profile'] | [clientId, 'User.Read', 'openid', 'profile'] | ClientId is treated as resource scope, `openid` and `profile` are automatically appended as well.|

Table summary for Acquire Token APIs:



[OIDC Scopes Reference](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-permissions-and-consent#openid-connect-scopes)

| - [clientId, 'openid'] or<br/> - [clientId, 'profile'] or<br/> - [clientId, 'openid', profile']| [clientId, 'openid', 'profile']| [clientId, 'openid', 'profile'] | ClientId, not being the only scope, is treated as a resource scope that will be sent to the server, so it is not removed. The `openid` and `profile` scopes are still appended immediately.|