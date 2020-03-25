# Request and Response Objects

Before you start here, make sure you understand how to [initialize the `PublicClientApplication` object](./initialization.md), [login](./loginuser.md) and [acquire tokens](./acquiretoken.md).

The MSAL library has a set of configuration options that can be used to customize the behavior of your authentication flows. These options can be set either in the [constructor of the `PublicClientApplication` object](./configuration.md) or as part of the request APIs. Here we describe the configuration object that can be passed to the login and acquireToken APIs, and the object returned representing the response.

## Request

There are two different request objects - one for interactive calls, and one for silent calls. Except for scopes, all parameters are optional. For loginAPIs, scopes are also optional, but they must be provided for all acquireToken APIs.

- AuthenticationParameters - used for all interactive token APIs

```javascript
const interactiveRequest = {
    scopes: [],
    resource: "",
    extraQueryParameters: {},
    authority: "",
    correlationId: "",
    extraScopesToConsent: [],
    prompt: "",
    claimsRequest: "",
    userRequestState: "",
    account: null,
    sid: "",
    loginHint: ""
};

msalInstance.loginRedirect(interactiveRequest);
msalInstance.acquireTokenRedirect(interactiveRequest);
const resp = msalInstance.loginPopup(interactiveRequest);
const resp2 = msalInstance.acquireTokenPopup(interactiveRequest);
```

- TokenRenewParameters - used for `acquireTokenSilent()`

```javascript
const silentRequest = {
    scopes: [],
    resource: "",
    extraQueryParameters: {},
    authority: "",
    correlationId: "",
    account: null,
    forceRefresh: false
};

const resp = msalInstance.acquireTokenSilent(silentRequest);
```

### Interactive request options

| Option | Description | Format | 
| ------ | ----------- | ------ |
| `scopes` | See [below](#scopes). | String array |
| `resource` | URI of the resource to acquire access for. | String |
| `extraQueryParameters` | `key`:`value` object with additional parameters to be sent as part of URI request. For example, `extraQueryParameters: {k1: v1}` is included in the request URI as `?k1=v1`. | String dictionary - `{key: value}`|
| `authority` | URI of the tenant to authenticate and authorize with. Usually takes the form of `https://{uri}/{tenantid}`. Overwrites the authority set in the [`PublicClientApplication` configuration object](./configuration.md). | String in URI format with tenant - `https://{uri}/{tenantid}` |
| `correlationId` | ID included in log messages and requests to trace executions. Usually a UUID/GUID. | String |
| `extraScopesToConsent` | Additional scopes to pre-consent to as part of login call, allowing you to make silent calls for additional resources without interaction. | String array |
| `prompt` | A string value to control the behavior seen by the user. See [below](#prompt-values) for more info | String with one of the following values: `"login"`, `"select_account"`, `"consent"`, `"none"`. |
| `claimsRequest` | A stringified JSON object containing requested claims for a token. | Stringified JSON object |
| `userRequestState` | OAuth `state` parameter sent in the authorization code request and returned by the service unchanged in the response. You can use this parameter to restore app state on a response. | String |
| `account` | User account object used to perform non-interactive sign-in. Must be an object of type `Account` as defined by MSAL. This account object is returned in the [response object](#response) and by the `getAccount()` API. | [Account.ts](../../msal-common/src/auth/Account.ts) |
| `sid` | Session id of the user to identify an active session and perform non-interactive sign-in. Usually part of id token claims. | String |
| `login_hint` | UPN or `preferred_username` of user account attempting to retrieve a token. Allows for non-interactive sign-in. | String |

### Silent request options
All descriptions of silent request options can be found above except for:

| Option | Description | Format | 
| ------ | ----------- | ------ |
| `forceRefresh` | If true, `acquireTokenSilent` will not returned the cached tokens and will use the refresh token to retrieve a new set of tokens. | boolean |

### Scopes

When you login a user, you can pass in scopes that the user can pre-consent to on login. However, this is not required. Please note that consenting to scopes on login, does not return an access_token for these scopes, but gives you the opportunity to obtain a token silently with these scopes passed in, with no further interaction from the user.

In our examples, we use the MS Graph scopes `user.read` and `mail.read`, so your scopes may look a little different.

It is best practice to only request scopes you need when you need them, a concept called dynamic consent. While this can create more interactive consent for users in your application, it also reduces drop-off from users that may be uneasy granting a large list of permissions for features they are not yet using.

AAD will only allow you to get consent for 3 resources at a time, although you can request many scopes within a resource.
When the user makes a login request, you can pass in multiple resources and their corresponding scopes because AAD issues an idToken pre consenting those scopes. However acquireToken calls are valid only for one resource / multiple scopes. If you need to access multiple resources, please make separate acquireToken calls per resource.

You can read more about scopes and permissions [here](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-permissions-and-consent).

### Prompt Values

When setting the prompt value, you must provide one of the following:

| Prompt Value | Description |
| ------------ | ----------- |
| `"login"` | Presents a login prompt. |
| `"select_account"` | Present a select account prompt on the login screen - used for multiple account scenarios |
| `"consent"` | Present a consent screen. |
| `"none"` | No prompt - exclusively used for silent flows. |

## Response

Either in `handleRedirectCallback` or as a result of the promise from `loginPopup`, `acquireTokenPopup` or `acquireTokenSilent`, MSAL will return a `TokenResponse.ts` object.
```javascript
const response = {
    uniqueId: "",
    tenantId: "",
    scopes: [],
    tokenType: "",
    idToken: "",
    idTokenClaims: {},
    accessToken: "",
    refreshToken: "",
    expiresOn: new Date(),
    account: new Account()
};
```

| Parameter | Description | Format |
| --------- | ----------- | ------ |
| `uniqueId` | `oid` or `sub` claim from ID token. | string |
| `tenantId` | `tid` claim from ID token. | string |
| `scopes` | Scopes that are validated for the respective token. | string |
| `tokenType` | Type of tokens returned. Usually will be `"Bearer"`. | string |
| `idToken` | ID token string | string |
| `idTokenClaims` | MSAL-relevant ID token claims | String dictionary |
| `accessToken` | Access token string | string |
| `refreshToken` | Refresh token string | string |
| `expiresOn` | Javascript Date object representing relative expiration of access token | Javascript Date Object |
| `account` | An account object representation of the currently signed-in user (combination of ID token and client info) | [Account.ts](../../msal-common/src/auth/Account.ts) |
