# Migrating from MSAL 1.x to MSAL 2.x

If you are new to MSAL, you should start [here](./initialization.md).

If you are coming from [MSAL v1.x](../../msal-common/), you can follow this guide to update your code to use [MSAL v2.x](../../msal-browser/).

## 1. Update application registration

Go to the Azure AD portal for your tenant and review the App Registrations. You can create a [new registration]() for MSAL 2.x or you can [update your existing registration]() for the registration that you are using for MSAL 1.x.

## 2. Add the msal-browser package to your project

See the [installation section of the README](../README.md#installation).

## 3. Update your code

In MSAL 1.x, you created an application instance as below:

```javascript
import * as msal from "msal";

const msalInstance = new msal.UserAgentApplication(config);
```

In MSAL 2.x, you can update this to use the new `PublicClientApplication` object.

```javascript
import * as msal from "@azure/msal-browser";

const msalInstance = new msal.PublicClientApplication(config);
```

There may be some small differences in the configuration object that is passed in. If you are passing a more advanced configuration to the `UserAgentApplication` object, see [here](./configuration.md) for more information on new app object configuration options.

Request and response object signatures have changed - `acquireTokenSilent` now has a separate object signature from the interactive APIs. Please see [here](./request-response-object.md) for more information on configuring the request APIs. 

Most APIs from MSAL 1.x have been carried forward to MSAL 2.x without change. Some functions have been removed:
- `handleRedirectCallback`
- `urlContainsHash`
- `getCurrentConfiguration`
- `getLoginInProgress`
- `getAccount`
- `getAccountState`
- `isCallback`

In MSAL 2.x, handling the response from the hash is an asynchronous operation, as MSAL will perform a token exchange as soon as it parses the authorization code from the response. Because of this, when performing redirect calls, MSAL provides the `handleRedirectPromise` function which will return a promise that resolves when the redirect has been fully handled by MSAL.

```javascript
const myMSALObj = new msal.PublicClientApplication(msalConfig); 

// Register Callbacks for Redirect flow
myMSALObj.handleRedirectPromise().then((tokenResponse) => {
    let accountObj = null;
    if (tokenResponse !== null) {
        accountObj = tokenResponse.account;
        const id_token = tokenResponse.idToken;
        const access_token = tokenResponse.accessToken;
    } else {
        const currentAccounts = myMSALObj.getAllAccounts();
        if (currentAccounts === null) {
            // No user signed in
            return;
        } else if (currentAccounts.length > 1) {
            // More than one user signed in, find desired user with getAccountByUsername(username)
        } else {
            accountObj = currentAccounts[0];
        }
    }
    
    const username = accountObj.username;
   
}).catch((error) => {
    console.log(error);
});

function signIn() {
    myMSALObj.loginRedirect(loginRequest);
}

async function getTokenRedirect(request) {
    return await myMSALObj.acquireTokenSilent(request).catch(error => {
        console.log("silent token acquisition fails. acquiring token using redirect");
        // fallback to interaction when silent call fails
        return myMSALObj.acquireTokenRedirect(request)
    });
}
```

During `loginPopup`, `acquireTokenPopup`, or `acquireTokenSilent` calls, you can wait for the promise to resolve.

```javascript
const myMSALObj = new msal.PublicClientApplication(msalConfig); 

async function signIn(method) {
    try {
        const loginResponse = await myMSALObj.loginPopup(loginRequest);
    } catch (err) {
        console.log(error);
    }

    const currentAccounts = myMSALObj.getAllAccounts();
    if (currentAccounts === null) {
        // No user signed in
        return;
    } else if (currentAccounts.length > 1) {
        // More than one user signed in, find desired user with getAccountByUsername(username)
    } else {
        accountObj = currentAccounts[0];
    }
}

async function getTokenPopup(request) {
    return await myMSALObj.acquireTokenSilent(request).catch(async (error) => {
        console.log("silent token acquisition fails. acquiring token using popup");
        // fallback to interaction when silent call fails
        return await myMSALObj.acquireTokenPopup(request).catch(error => {
            console.log(error);
        });
    });
}
```

Please see the [login](./login-user.md) and [acquire token](./acquire-token.md) docs for more detailed information on usage.

Refresh tokens are now returned as part of the token responses, and are used by the library to renew access tokens without interaction or the use of iframes. See the [token lifetimes docs](./token-lifetimes.md) for more information on renewing tokens.

All other APIs should work as before. It is recommended to take a look at the [default sample](../../../samples/VanillaJSTestApp2.0/default) to see a working example of MSAL 2.0.
