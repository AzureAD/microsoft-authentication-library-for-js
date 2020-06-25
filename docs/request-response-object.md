# Request and Response Objects

Before you start here, make sure you understand how to [initialize the `PublicClientApplication` object](./initialization.md), [login](./login-user.md) and [acquire tokens](./acquire-token.md).

The MSAL library has a set of configuration options that can be used to customize the behavior of your authentication flows. These options can be set either in the [constructor of the `PublicClientApplication` object](./configuration.md) or as part of the request APIs. Here we describe the configuration object that can be passed to the login and acquireToken APIs, and the object returned representing the response.

## Request

There are two different request objects - one for interactive calls, and one for silent calls. Except for scopes, all parameters are optional. For loginAPIs, scopes are also optional, but they must be provided for all acquireToken APIs.

### AuthorizationUrlRequest

All interactive token APIs and `ssoSilent()` accept an object with the following signature to make a request for authorization code and trade for a token:
```javascript
{
    /**
     * REQUIRED: Scopes the application is requesting access to.
     */
    scopes: Array<string>;

    /**
     * The redirect URI where authentication responses can be received by your application. It
     * must exactly match one of the redirect URIs registered in the Azure portal.
     */
    redirectUri: string;

    /**
     * Url of the authority which the application acquires tokens from. Defaults to
     * https://login.microsoftonline.com/common. If using the same authority for all request, authority should set
     * on client application object and not request, to avoid resolving authority endpoints multiple times.
     */
    authority?: string;

    /**
     * Scopes for a different resource when the user needs consent upfront
     */
    extraScopesToConsent?: Array<string>;

    /**
     * A value included in the request that is also returned in the token response. A randomly
     * generated unique value is typically used for preventing cross site request forgery attacks.
     * The state is also used to encode information about the user's state in the app before the
     * authentication request occurred.
     */
    state?: string;

    /**
     * Indicates the type of user interaction that is required.
     *
     * login: will force the user to enter their credentials on that request, negating single-sign on
     *
     * none:  will ensure that the user isn't presented with any interactive prompt. if request can't be completed via
     *        single-sign on, the endpoint will return an interaction_required error
     * consent: will the trigger the OAuth consent dialog after the user signs in, asking the user to grant permissions
     *          to the app
     * select_account: will interrupt single sign-=on providing account selection experience listing all the accounts in
     *                 session or any remembered accounts or an option to choose to use a different account
     */
    prompt?: string;

    /**
     * Can be used to pre-fill the username/email address field of the sign-in page for the user,
     * if you know the username/email address ahead of time. Often apps use this parameter during
     * re-authentication, having already extracted the username from a previous sign-in using the
     * preferred_username claim.
     */
    loginHint?: string;

    /**
     * Provides a hint about the tenant or domain that the user should use to sign in. The value
     * of the domain hint is a registered domain for the tenant.
     */
    domainHint?: string;

    /**
     * string to string map of custom query parameters
     */
    extraQueryParameters?: StringDict;

    /**
     * In cases where Azure AD tenant admin has enabled conditional access policies, and the
     * policy has not been met, exceptions will contain claims that need to be consented to.
     */
    claims?: string;

    /**
     *  A value included in the request that is returned in the id token. A randomly
     *  generated unique value is typically used to mitigate replay attacks.
     */
    nonce?: string;

    /**
     * Unique GUID set per request to trace a request end-to-end for telemetry purposes
     */
    correlationId?: string;
};

const interactiveRequest = {
    scopes: [],
    redirectUri: "",
    authority: "",
    extraScopesToConsent: [],
    state: "",
    prompt: "",
    loginHint: "",
    domainHint: "",
    extraQueryParameters: {},
    claims: "",
    nonce: "",
    correlationId: ""
};

msalInstance.loginRedirect(interactiveRequest);
msalInstance.acquireTokenRedirect(interactiveRequest);
const resp = msalInstance.loginPopup(interactiveRequest);
const resp2 = msalInstance.acquireTokenPopup(interactiveRequest);
```

### SilentFlowRequest

The `acquireTokenSilent` API accepts an object with the following signature to retrieve tokens from the cache, or renew a token:
```javascript
{
    // REQUIRED: Account object that tokens were retrieved for 
    account: AccountInfo;
    // REQUIRED: Scopes that the requested access token has consent for
    scopes: Array<string>;
    // Authority to retrieve tokens for
    authority?: string;
    // Boolean value - if true, will perform refresh token request to get new access token
    forceRefresh?: boolean;
    // Correlation id for the request - used for telemetry
    correlationId?: string;
}
```
- TokenRenewParameters - used for `acquireTokenSilent()`

```javascript
const silentRequest = {
    account: msalInstance.getAccountByUsername(username),
    scopes: [],
    authority: "",
    forceRefresh: false,
    correlationId: ""
};

const resp = msalInstance.acquireTokenSilent(silentRequest);
```

### Interactive request options

| Option | Description | Format | 
| ------ | ----------- | ------ |
| `scopes` | See [below](#scopes). | String array |
| `redirectUri` | URI to return to after request is completed. | String |
| `extraQueryParameters` | `key`:`value` object with additional parameters to be sent as part of URI request. For example, `extraQueryParameters: {k1: v1}` is included in the request URI as `?k1=v1`. | String dictionary - `{key: value}`|
| `authority` | URI of the tenant to authenticate and authorize with. Usually takes the form of `https://{uri}/{tenantid}`. Overwrites the authority set in the [`PublicClientApplication` configuration object](./configuration.md). | String in URI format with tenant - `https://{uri}/{tenantid}` |
| `correlationId` | ID included in log messages and requests to trace executions. Usually a UUID/GUID. | String |
| `extraScopesToConsent` | Additional scopes to pre-consent to as part of login call, allowing you to make silent calls for additional resources without interaction. | String array |
| `prompt` | A string value to control the behavior seen by the user. See [below](#prompt-values) for more info | String with one of the following values: `"login"`, `"select_account"`, `"consent"`, `"none"`. |
| `state` | OAuth `state` parameter sent in the authorization code request and returned by the service unchanged in the response. You can use this parameter to restore app state on a response. | String |
| `login_hint` | UPN or `preferred_username` of user account attempting to retrieve a token. Allows for non-interactive sign-in. | String |

### Silent request options
All descriptions of silent request options can be found above except for:

| Option | Description | Format | 
| ------ | ----------- | ------ |
| `forceRefresh` | If true, `acquireTokenSilent` will not returned the cached tokens and will use the refresh token to retrieve a new set of tokens. | boolean |
| `account` | User account object used to perform non-interactive sign-in. Must be an object of type `Account` as defined by MSAL. This account object is returned in the [response object](#response) and by the `getAccount()` API. | [Account.ts](../../msal-common/src/auth/Account.ts) |

### Scopes

When you login a user, you can pass in scopes that the user can pre-consent to on login. However, this is not required. Please note that consenting to scopes on login, does not return an access_token for these scopes, but gives you the opportunity to obtain a token silently with these scopes passed in, with no further interaction from the user.

In our examples, we use the MS Graph scopes `user.read` and `mail.read`, so your scopes may look a little different.
MSAL.js v2 no longer supports translation of `clientId` to `openid` and `profile` when provided in the scope list. If you need an idToken please pass `openid` and `profile`

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

As a result of the promise from `loginPopup`, `acquireTokenPopup`, `acquireTokenSilent` or `handleRedirectPromise`, MSAL will return an `AuthenticationResult.ts` object.
```javascript
{
    uniqueId: string;
    tenantId: string;
    scopes: Array<string>;
    account: AccountInfo;
    idToken: string;
    idTokenClaims: StringDict;
    accessToken: string;
    fromCache: boolean;
    expiresOn: Date;
    extExpiresOn?: Date;
    state?: string;
    familyId?: string;
}
```

| Parameter | Description | Format |
| --------- | ----------- | ------ |
| `uniqueId` | `oid` or `sub` claim from ID token. | string |
| `tenantId` | `tid` claim from ID token. | string |
| `scopes` | Scopes that are validated for the respective token. | string |
| `account` | An account object representation of the currently signed-in user | [AccountInfo.ts](../../msal-common/src/auth/AccountInfo.ts) |
| `idToken` | ID token string | string |
| `idTokenClaims` | MSAL-relevant ID token claims | String dictionary |
| `accessToken` | Access token string | string |
| `fromCache` | Boolean denoting whether token came from cache | boolean |
| `expiresOn` | Javascript Date object representing relative expiration of access token | Javascript Date Object |
| `extExpiresOn` | Javascript Date object representing extended relative expiration of access token in case of server outage | Javascript Date Object |
| `state` | value passed in by user in request | string |
