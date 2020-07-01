# Accounts in MSAL JS

MSAL JS libraries (`msal-browser` and `msal-node`) support both single account and multiple accounts scenarios in java script applications. An `account` object is standardized across the libraries:

// TODO replace this with typedocs link when available

```javascript
export type AccountInfo = {
    homeAccountId: string;
    environment: string;
    tenantId: string;
    username: string;
};
```

## Usage

* We provide a public API `getAllAccounts()` which lists all the accounts currently in the cache. An application must choose an account to acquire tokens silently.
* `msal-browser` provides a public API `getAccountByUsername()` for an application to retrieve a specific account based on `username`

Sample usage is as below:

``` javascript

function handleResponse(resp) {
    if (resp !== null) {
        username = resp.account.username;
        showWelcomeMessage(resp.account);
    } else {
        // need to call getAccount here?
        const currentAccounts = myMSALObj.getAllAccounts();
        if (currentAccounts === null) {
            return;
        } else if (currentAccounts.length > 1) {
            // Add choose account code here
        } else if (currentAccounts.length === 1) {
            username = currentAccounts[0].username;
            showWelcomeMessage(currentAccounts[0]);
        }
    }
}

async function getTokenPopup(request, account) {
    request.account = account;
    return await myMSALObj.acquireTokenSilent(request).catch(async (error) => {
        console.log("silent token acquisition fails.");
        if (error instanceof msal.InteractionRequiredAuthError) {
            console.log("acquiring token using popup");
            return myMSALObj.acquireTokenPopup(request).catch(error => {
                console.error(error);
            });
        } else {
            console.error(error);
        }
    });
}
```

## Notes

* The current msal-browser default [sample](../../samples/msal-browser-samples/VanillaJSTestApp2.0) has a working single account scenario.
* If you have a multiple accounts scenario, please modify the sample (in `handleResponse()`) to list all cached accounts and choose a specific account
* If an application wants to retrieve an account based on the `username`, it needs to save the `username` (from the response of a `loginAPI` for a specific user) prior to using `getAccountByUsername()` API
