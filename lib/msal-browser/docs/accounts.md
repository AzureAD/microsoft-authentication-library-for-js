# Accounts in MSAL Browser

> This is the platform-specific Accounts documentation for `msal-browser`. For the general documentation of the `AccountInfo` object structure, please visit the `msal-common` [Accounts document](../../msal-common/docs/Accounts.md).

## Usage

The `msal-browser` library provides the following APIs to access cached accounts:

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
        homeAccountId = resp.account.homehomeAccountId; // alternatively: resp.account.homehomeAccountId or resp.account.username
    } else {
        const currentAccounts = myMSALObj.getAllAccounts();
        if (!currentAccounts || currentAccounts.length < 1) { // No cached accounts
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
    });
}
```


## Notes

* The current msal-browser default [sample](../../../samples/msal-browser-samples/VanillaJSTestApp2.0) has a working single account scenario.
* If you have a multiple accounts scenario, please modify the [sample](../../../samples/msal-browser-samples/VanillaJSTestApp2.0/app/default/auth.js) (in `handleResponse()`) to list all cached accounts and choose a specific account.
* If an application wants to retrieve an account based on the `username`, it needs to save the `username` (from the response of a `loginAPI` for a specific user) prior to using `getAccountByUsername()` API.
