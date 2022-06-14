# Accounts in MSAL Browser

> This is the platform-specific Accounts documentation for `@azure/msal-browser`. For the general documentation of the `AccountInfo` object structure, please visit the `@azure/msal-common` [Accounts document](../../msal-common/docs/Accounts.md).

## Usage

The `@azure/msal-browser` library provides the following APIs to access cached accounts:

* `getAllAccounts()`: returns all the accounts currently in the cache. An application must choose an account to acquire tokens silently.
* `getAccountByHomeId()`: receives a `homeAccountId` string and returns the matching account from the cache.
* `getAccountByLocalId()`: receives a `localAccountId` string and returns the matching account from the cache.
* `getAccountByUsername()`: receives a `username` string and returns the matching account from the cache.

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

Now the `homeAccountId`, `localAccountId`, or `username` can be used to look up the cached account before acquiring a token silently:

```javascript
// This method attempts silent token acquisition and falls back on acquireTokenPopup
async function getTokenPopup(request, account) {
    request.account = myMSALObj.getAccountByHomeId(homeAccountId); // alternatively: myMSALObj.getAccountByLocalId(localAccountId) or myMSALObj.getAccountByUsername(username) 
    return await myMSALObj.acquireTokenSilent(request).catch(async (error) => {
       // Handle error
        return await myMSALObj.acquireTokenPopup(request);
    });
}
```

## Active Account APIs

The `@azure/msal-browser` library also provides 2 convenient APIs to help you keep track of which account is currently "active" and should be used for token requests.

* `getActiveAccount()`: Returns the currently active account
* `setActiveAccount()`: Receives an account object and sets it as the active account

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
    return myMsalObj.acquireTokenSilent({scopes: ["User.Read"]});
}
```

Note: As of version 2.16.0 the active account is stored in the cache location configured on your `PublicClientApplication` instance. If you are using a previous version the active account is stored in-memory and thus must be reset on every page load.

## Notes

* The current msal-browser default [sample](../../../samples/msal-browser-samples/VanillaJSTestApp2.0) has a working single account scenario.
* If you have a multiple accounts scenario, please modify the [sample](../../../samples/msal-browser-samples/VanillaJSTestApp2.0/app/default/auth.js) (in `handleResponse()`) to list all cached accounts and choose a specific account.
* If an application wants to retrieve an account based on the `username`, it needs to save the `username` (from the response of a `loginAPI` for a specific user) prior to using `getAccountByUsername()` API.
* `getAllAccounts()` will return multiple accounts if you have made several interactive token requests and the user has selected different accounts in two or more of those interactions. You may need to pass `prompt: "select_account"` or `prompt: "login"` to the interactive acquireToken or login API in order for AAD to display the account selection screen after the first interaction.
* The account APIs return local account state and do not necessarily reflect server state. They return accounts that have previously signed into this app using MSAL.js and the server session may or may not still be active.
* Two apps hosted on different domains do not share account state due to browser storage being segemented by domain.
* `getAllAccounts()` is not ordered and is not guaranteed to be in the same order across multiple calls
* Each successful call to an acquireToken or login API will return exactly one account
