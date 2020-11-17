# Accounts in MSAL Node

> This is the platform-specific Accounts documentation for `msal-node`. For the general documentation of the `AccountInfo` object structure, please visit the `msal-common` [Accounts document](../../msal-common/docs/Accounts.md).

## Usage

The `msal-node` library provides the following different APIs to access cached accounts:

* `getAllAccounts()`: returns all the accounts currently in the cache. An application must choose an account to acquire tokens silently.
* `getAccountByHomeId()`: receives a `homeAccountId` string and returns the matching account from the cache.
* `getAccountByLocalId()`: receives a `localAccountId` string and returns the matching account from the cache.

The following are usage examples for each API:

### getAllAccounts

For a multiple accounts scenario:

```javascript
// Initiates Acquire Token Silent flow
function callAcquireTokenSilent()
    // Find all accounts
    const msalTokenCache = myMSALObj.getTokenCache();
    const cachedAccounts = await msalTokenCache.getAllAccounts();

    // Account selection logic would go here

    const account = .... // Select Account code

    // Build silent request after account is selected
    const silentRequest = {
        account: account,
        scopes: scopes,
    };

    // Acquire Token Silently to be used in MS Graph call
    myMSALObj.acquireTokenSilent(silentRequest)
        .then((response) => {
            // Successful response handling
        })
        .catch((error) => {
            // Error handling
        });
});
```

### getAccountByHomeId and getAccountByLocalId

For a single account scenario, the `homeAccountId` or `localAccountId` must be obtained from the initial `AuthResponse` object received from a non-silent authorization flow, such as the `Auth Code` flow.

```javascript

// Initialize global homeAccountId variable, ideally stored in application state
let homeAccountId = null; // Same for localAccountId

// Get MSAL Token Cache from MSAL Client Applicaiton object
const msalTokenCache = myMSALObj.getTokenCache();

// Initial token acquisition, second leg of Auth Code flow
function getTokenAuthCode() {
    const tokenRequest = {
        code: req.query.code,
        redirectUri: "http://localhost:3000/redirect",
        scopes: scopes,
    };

    myMSALObj.acquireTokenByCode(tokenRequest).then((response) => {
        // Home account ID or local account ID to be used to find the right account before acquireTokenSilent
        homeAccountId = response.account.homeAccountId; // Same for localAccountId
        .
        .
        .
        // Handle successful token response
    }).catch((error) => {
        // Handle token request error
    });
}
```

Once the account and tokens are cached and the application state holds the `homeAccountId` or `localAccountId` string, `getAccountByHomeId` and `getAccountByLocalId` can be used before an `acquireTokenSilent` call:

```javascript
async function getResource() {
    // Find account using homeAccountId or localAccountId built after receiving auth code token response
    const account = await msalTokenCache.getAccountByHomeId(app.locals.homeAccountId); // alternativley: await msalTokenCache.getAccountByLocalId(localAccountId) if using localAccountId

    // Build silent request
    const silentRequest = {
        account: account,
        scopes: scopes,
    };
    // Acquire Token Silently to be used in Resource API calll
    pca.acquireTokenSilent(silentRequest)
        .then((response) => {
            // Handle successful resource API response
        })
        .catch((error) => {
            // Handle resource API request error
        });
}
```

## Notes

* The current msal-node silent-flow [sample](../../../samples/msal-node-samples/standalone-samples/silent-flow) has a working single account scenario that uses `getAccountByHomeId()`.
* If you have a multiple accounts scenario, please modify the [sample](../../../samples/msal-node-samples/standalone-samples/silent-flow/index.js) (in `/graphCall` route) to list all cached accounts and choose a specific account. You may also need to customize the related view templates and `handlebars` template params.
