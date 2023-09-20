# Accounts in MSAL Browser

> This is the platform-specific Accounts documentation for `@azure/msal-browser`. For the general documentation of the `AccountInfo` object structure, please visit the `@azure/msal-common` [Accounts document](../../msal-common/docs/Accounts.md).

## Usage

The `@azure/msal-browser` library provides the following APIs to access cached accounts:

-   `getAllAccounts()`: returns all the accounts currently in the cache. A filter can be passed in to narrow down the returned accounts. An application must choose an account to acquire tokens silently.
-   `getAccountByFilter()`: returns the first cached account that matches the filter passed in. The order in which accounts are read from the cache is arbitrary and there is no guarantee that the first account in the filtered list will be the same for any two calls of `getAccountByFilter`.

### Account Filter Object

The following table presents the properties that can be used in the `AccountFilter` object that can be passed into the APIs listed above.

> Note: A single account filter attribute is usually not guaranteed to uniquely identify a cached account object. Adding a combination of attributes that don't repeat together, such as `homeAccountId` + `localAccountId`, can help refine the search.

| Property Name        | Description                                                                                                                                                                                  | Example                                                                   |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `homeAccountId`      | Home account identifier for this account object in the corresponding authentication scheme. For AAD/MSA, the format is \<uid>.\<utid>, which identifies the account uniquely across tenants. | 00000000-0000-0000-0000-000000000000.72f988bf-86f1-41af-91ab-2d7cd011db47 |
| `environment`        | Entity which issued the token represented by the domain of the issuer.                                                                                                                       | login.microsoftonline.com                                                 |
| `tenantId` / `realm` | Full tenant or organizational id that this account belongs to.                                                                                                                               | 72f988bf-86f1-41af-91ab-2d7cd011db47                                      |
| `username`           | The `preferred_username` claim of the id_token that represents this account                                                                                                                  | test@example.com                                                          |
| `localAccountId`     | Local, tenant-specific account identifer for this account object, usually used in legacy cases                                                                                               | 00000000-0000-0000-0000-000000000000                                      |
| `name`               | Full name for the account, including given name and family name.                                                                                                                             | John Doe                                                                  |
| `nativeAccountId`    | The user's native account ID                                                                                                                                                                 | 00000000-0000-0000-0000-000000000000                                      |

> Note: `realm` is the name that `tenantId` receives in the cache.

The following `getAccountBy` APIs are marked for deprecation and will be removed in a future version of MSAL. Please migrate to `getAccountByFilter()`:

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
    request.account = myMSALObj.getAccountByFilter(accountFilter);
    return await myMSALObj.acquireTokenSilent(request).catch(async (error) => {
        // Handle error
        return await myMSALObj.acquireTokenPopup(request);
    });
}
```

### Filtering by login hint

As of `@azure/msal-browser@3.11.0`, all login hint values can be used to search for and filter accounts. In order to filter by login hint, MSAL will compare the `loginHint` value in the `AccountFilter` object against the following account attributes (in order of precedence) to search for matches:

-   `login_hint` ID token claim
-   `username` account property
-   `upn` ID token claim

> Note: Regardless of which attribute above is picked, they must be passed into the account filter as `loginHint`.

#### Using `login_hint` claim

```javascript
const accountFilter = {
    loginHint: previouslyObtainedIdTokenClaims.login_hint;
};
request.account = myMSALObj.getAccountByFilter(accountFilter);
return await myMSALObj.acquireTokenSilent(request).catch(async (error) => {
    // Handle error
    return await myMSALObj.acquireTokenPopup(request);
});
```

#### Using `username``

```javascript
const accountUsername = userProfile.username;
const accountFilter = {
    loginHint: accountUsername;
};
request.account = myMSALObj.getAccountByFilter(accountFilter);
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
request.account = myMSALObj.getAccountByFilter(accountFilter);
return await myMSALObj.acquireTokenSilent(request).catch(async (error) => {
    // Handle error
    return await myMSALObj.acquireTokenPopup(request);
});
```

## Active Account APIs

The `@azure/msal-browser` library also provides 2 convenient APIs to help you keep track of which account is currently "active" and should be used for token requests.

-   `getActiveAccount()`: Returns the currently active account
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
-   If an application wants to retrieve an account based on the `username`, it needs to save the `username` (from the response of a `loginAPI` for a specific user) prior to using `getAccountByUsername()` API.
-   `getAllAccounts()` will return multiple accounts if you have made several interactive token requests and the user has selected different accounts in two or more of those interactions. You may need to pass `prompt: "select_account"` or `prompt: "login"` to the interactive acquireToken or login API in order for AAD to display the account selection screen after the first interaction.
-   The account APIs return local account state and do not necessarily reflect server state. They return accounts that have previously signed into this app using MSAL.js and the server session may or may not still be active.
-   Two apps hosted on different domains do not share account state due to browser storage being segemented by domain.
-   `getAllAccounts()` is not ordered and is not guaranteed to be in the same order across multiple calls
-   Each successful call to an acquireToken or login API will return exactly one account
