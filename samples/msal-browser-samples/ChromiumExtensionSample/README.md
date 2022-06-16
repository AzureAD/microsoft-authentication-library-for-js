# MSAL Browser - Chromium Extension Sample

This folder contains a sample Chromium extensions demonstrating how to integrate MSAL Browser.

## Setup

1. Create a [new app registration](https://docs.microsoft.com/azure/active-directory/develop/quickstart-register-app) in the Azure Portal.
1. Provide your client ID in the `PublicClientApplication` configuration in `auth.js`.
1. Under the **Authentication** tab, add a new redirect URI under **Single-page application**.
1. The url of this redirect URI should be of the format `https://<extension-id>.chromiumapp.org`, e.g. `https://epfnbngoodhmbeepjlcohfacgnbhbhah.chromiumapp.org/`.
1. You should also set this url as the **Logout URL**.
1. Your extension ID can be found on the Extensions settings page after the extension has been loaded, or by invoking `chrome.identity.getRedirectURL()` in the extension.

## Running the extension

1. On the **Extensions** settings page, click the **Load unpacked** button, and select this folder.
1. The extension will appear in the browser toolbar.
1. **Note:** Because this extension relies on the `chrome.identity` APIs, it will not work in incognito/private browsing.
1. The extension demonstrates how to login, acquire tokens, and logout using MSAL Browser.

## MSAL Usage

Chromium extensions are unable to perform certain types of navigation, so applications should leverage the [`chrome.identity.launchWebAuthFlow`](https://developer.chrome.com/apps/identity#method-launchWebAuthFlow) API to perform interactive auth requests. This API takes a url to navigate to, and a callback that will be invoked once the auth flow is completed (which is signaled by AAD redirecting back to the `chromiumapp.com` url mentioned earlier). Chromium extensions using MSAL Browser can build working auth flows by composing the MSAL `loginRedirect/acquireTokenRedirect` and `handleRedirectPromise` APIs to generate a url and handle the response:

```js
/**
 * Generates a login url
 */
async function getLoginUrl(request) {
    return new Promise((resolve, reject) => {
        msalInstance.loginRedirect({
            ...request,
            onRedirectNavigate: (url) => {
                resolve(url);
                return false;
            }
        }).catch(reject);
    });
}


/**
 * Generates an acquire token url
 */
async function getAcquireTokenUrl(request) {
    return new Promise((resolve, reject) => {
        msalInstance.acquireTokenRedirect({
            ...request,
            onRedirectNavigate: (url) => {
                resolve(url);
                return false;
            }
        }).catch(reject);
    });
}

/**
 * Generates a login url
 */
async function launchWebAuthFlow(url) {
    return new Promise((resolve, reject) => {
        chrome.identity.launchWebAuthFlow({
            interactive: true,
            url
        }, (responseUrl) => {
            // Response urls includes a hash (login, acquire token calls)
            if (responseUrl.includes("#")) {
                msalInstance.handleRedirectPromise(`#${responseUrl.split("#")[1]}`)
                    .then(resolve)
                    .catch(reject)
            } else {
                // Logout calls
                resolve();
            }
        })
    })
}

/**
 * Generates a logout url
 */
async function getLogoutUrl(request) {
    return new Promise((resolve, reject) => {
        msalInstance.logout({
            ...request,
            onRedirectNavigate: (url) => {
                resolve(url);
                return false;
            }
        }).catch(reject);
    });
}

/**
 * Attempts to silent acquire an access token, falling back to interactive.
 */
async function acquireToken(request) {
    return msalInstance.acquireTokenSilent(request)
        .catch(async (error) => {
            console.error(error);
            const acquireTokenUrl = await getAcquireTokenUrl(request);

            return launchWebAuthFlow(acquireTokenUrl);
        })
}

// Login
const loginUrl = await getLoginUrl();
const loginResult = await launchWebAuthFlow(loginUrl);

// Acquire token
const { accessToken } = await acquireToken({
    scopes: [ "user.read" ],
    account: msalInstance.getAllAccounts()[0]
});

// Logout
const logoutUrl = await getLogoutUrl();
await launchWebAuthFlow(logoutUrl);
```


