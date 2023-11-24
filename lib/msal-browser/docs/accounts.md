# Accounts in MSAL Browser

> This is the platform-specific Accounts documentation for `@azure/msal-browser`. For the general documentation of the `AccountInfo` object structure, please visit the `@azure/msal-common` [Accounts document](../../msal-common/docs/Accounts.md).

## Usage

The `@azure/msal-browser` library provides the following APIs to access cached accounts:

-   `getAllAccounts()`: returns all the accounts currently in the cache. Supports an optional filter to return a specific set of accounts. An application must choose an account to acquire tokens silently.
-   `getAccount()`: returns the first cached account that matches the filter passed in. The order in which accounts are read from the cache is arbitrary and there is no guarantee that the first account in the filtered list will be the same for any two calls of `getAccount`. As explained below, increasing the number of filter attributes will provide more exact matches.

### Account Filter Object

The [AccountFilter](https://azuread.github.io/microsoft-authentication-library-for-js/ref/types/_azure_msal_common.AccountFilter.html) type documentation lists the properties that can be used and combined to filter accounts.

> Note: A single account filter attribute is usually not guaranteed to uniquely identify a cached account object. Adding a combination of attributes that don't repeat together, such as `homeAccountId` + `localAccountId`, can help refine the search.

> Note: `realm` is `tenantId` in the cache.

The following `getAccountBy` APIs are marked for deprecation and will be removed in a future version of MSAL. Please migrate to `getAccount()`:

-   `getAccountByHomeId()`: receives a `homeAccountId` string and returns the matching account from the cache.
-   `getAccountByLocalId()`: receives a `localAccountId` string and returns the matching account from the cache.
-   `getAccountByUsername()`: receives a `username` string and returns the matching account from the cache.

The following is a usage examples that covers these APIs:

```javascript

let homeAccountId = null; // Initialize global accountId (can also be localAccountId or username) used for account lookup later, ideally stored in app state

// This callback is passed into `acquireTokenPopup` and `acquireTokenRedirect` to handle the interactive auth response
function handleResponse(resp) {
    if (resp !== null) {
        homeAccountId = resp.account.homeAccountId; // alternatively: resp.account.homeAccountId or resp.account.username
    } else {
        const currentAccounts = myMSALObj.getAllAccounts();
        if (currentAccounts.length < 1) { // No cached accounts
            return;
        } else if (currentAccounts.length > 1) { // Multiple account scenario
            // Add account selection code here
            homeAccountId = ...
        } else if (currentAccounts.length === 1) {
            homeAccountId = currentAccounts[0].homeAccountId; // Single account scenario
        }
    }
}
```

Now, account properties such as: `homeAccountId`, `localAccountId`, and `username` can be used to look up the cached account before acquiring a token silently:

```javascript
// This method attempts silent token acquisition and falls back on acquireTokenPopup
async function getTokenPopup(request, homeAccountId) {
    // In this case, accounts are filtered by homeAccountId, but more attributes can be added to refine the search and increase the precision of the account filter
    const accountFilter = {
        homeAccountId: homeAccountId,
    };
    request.account = myMSALObj.getAccount(accountFilter);
    return await myMSALObj.acquireTokenSilent(request).catch(async (error) => {
        // Handle error
        return await myMSALObj.acquireTokenPopup(request);
    });
}
```

### Filtering by login hint

As of `@azure/msal-browser@3.2.0`, all login hint values can be used to search for and filter accounts. In order to filter by login hint, MSAL will compare the `loginHint` value in the `AccountFilter` object against the following account attributes (in order of precedence) to search for matches:

-   `login_hint` ID token claim
-   `username` account property
-   `upn` ID token claim

> Note: All attributes above can be passed into the account filter as the `loginHint` property. The account filter will also accept the `username` attribute as `username`, and will yield a more performant search.

#### Using `login_hint` claim

```javascript
const accountFilter = {
    loginHint: previouslyObtainedIdTokenClaims.login_hint;
};
request.account = myMSALObj.getAccount(accountFilter);
return await myMSALObj.acquireTokenSilent(request).catch(async (error) => {
    // Handle error
    return await myMSALObj.acquireTokenPopup(request);
});
```

#### Using `username``

> Note: The `username` value can included in the `AccountFilter` object as either `username` or `loginHint`. This is because the `username` claim is one of the 3 values (along with the `login_hint` and `upn` ID token claims) that the token service accepts as login hint. If your application is certain that the value in question is a `username`, setting it as the `AccountFilter.username` property will yield better search performance. Being able to set a `username` value as `loginHint` is useful if your application utilizes a login hint and does not keep context on whether that value came from a `username`, `login_hint`, or `upn` claim.

Passing `username` as `loginHint`

```javascript
const accountUsername = userProfile.username;
const accountFilter = {
    loginHint: accountUsername;
};
request.account = myMSALObj.getAccount(accountFilter);
return await myMSALObj.acquireTokenSilent(request).catch(async (error) => {
    // Handle error
    return await myMSALObj.acquireTokenPopup(request);
});
```

Passing `username` as `username`

```javascript
const accountUsername = userProfile.username;
const accountFilter = {
    username: accountUsername;
};
request.account = myMSALObj.getAccount(accountFilter);
return await myMSALObj.acquireTokenSilent(request).catch(async (error) => {
    // Handle error
    return await myMSALObj.acquireTokenPopup(request);
});
```

#### Using `upn` claim

```javascript
const accountFilter = {
    loginHint: previouslyObtainedIdTokenClaims.upn;
};
request.account = myMSALObj.getAccount(accountFilter);
return await myMSALObj.acquireTokenSilent(request).catch(async (error) => {
    // Handle error
    return await myMSALObj.acquireTokenPopup(request);
});
```

## Active Account APIs

The `@azure/msal-browser` library also provides 2 convenient APIs to help you keep track of which account is currently "active" and should be used for token requests.

-   `getActiveAccount()`: Returns the current active account
-   `setActiveAccount()`: Receives an account object and sets it as the active account

Deciding which account to use to acquire tokens is app dependent, however, once you've determined which account you wish to use, simply call the `setActiveAccount()` API with the chosen account object. Any `acquireToken`, `login` or `ssoSilent` calls will now use the active account by default if a different account is not specified in the individual request. To clear the currently active account you can call `setActiveAccount(null)`.

```javascript
function login() {
    return myMsalObj.loginPopup().then((response) => {
        // After a successful login set the active account to be the user that just logged in
        myMsalObj.setActiveAccount(response.account);
    });
}

function getAccessToken() {
    // Providing an account in the token request is not required if there is an active account set
    return myMsalObj.acquireTokenSilent({ scopes: ["User.Read"] });
}
```

Note: As of version 2.16.0 the active account is stored in the cache location configured on your `PublicClientApplication` instance. If you are using a previous version the active account is stored in-memory and thus must be reset on every page load.

## Notes

-   The current msal-browser default [sample](../../../samples/msal-browser-samples/VanillaJSTestApp2.0) has a working single account scenario.
-   If you have a multiple accounts scenario, please modify the [sample](../../../samples/msal-browser-samples/VanillaJSTestApp2.0/app/default/auth.js) (in `handleResponse()`) to list all cached accounts and choose a specific account.
-   If an application wants to retrieve an account based on the `username`, it needs to save the `username` (from the response of a `login` API for a specific user) prior to using `getAccountByUsername()` API.
-   `getAllAccounts()` will return multiple accounts if you have made several interactive token requests and the user has selected different accounts in two or more of those interactions. You may need to pass `prompt: "select_account"` or `prompt: "login"` to the interactive acquireToken or login API in order for AAD to display the account selection screen after the first interaction.
-   The account APIs return local account state and do not necessarily reflect server state. They return accounts that have previously signed into this app using MSAL.js and the server session may or may not still be active.
-   Two apps hosted on different domains do not share account state due to browser storage being segemented by domain.
-   `getAllAccounts()` is not ordered and is not guaranteed to be in the same order across multiple calls
-   Each successful call to an acquireToken or login API will return exactly one account
