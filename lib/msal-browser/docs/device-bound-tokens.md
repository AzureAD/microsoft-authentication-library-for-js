# Acquiring Device Bound Tokens using Web Account Manager (WAM) on Windows

MSAL.js supports acquiring tokens from the Web Account Manager (WAM) on Windows. These tokens are bound to the device they were acquired on and are not cached in the browser's localStorage or sessionStorage.

## Supported Environment

This feature is currently only supported in the following environment:

- A machine running a Windows build that supports the feature (more to come on this)
- Chrome and Edge browsers or Teams
- [Windows Accounts extension](https://chrome.google.com/webstore/detail/windows-accounts/ppnbnpeolgkicgegkbkbjmhlideopiji) (version 1.0.5 or higher) is installed if using Chrome or Edge
- App must be hosted on `https`

Additionally, this feature is currently only supported for Work and School Accounts

## Enable the feature in MSAL.js

In order to enable this feature in MSAL.js set the `allowNativeBroker` flag to true in your configuration object like so:

```javascript
const msalConfig = {
    auth: {
        clientId: "insert-clientId"
    },
    system: {
        allowNativeBroker: true
    }
};
```

Additionally, you will need to call and await the new `initialize` API before invoking any other MSAL.js API.

```javascript
const pca = new PublicClientApplication(msalConfig);

// Initialize will establish a connection with the browser extension, if present
await pca.initialize();

// Call handleRedirectPromise, after initialization is complete
await pca.handleRedirectPromise();

// After initialize and handleRedirectPromise have completed, you may call any of the other APIs as you would without this feature
pca.acquireTokenSilent();
```

No other changes are needed to support this new feature. Any user accessing your app from a supported environment will now be able to acquire device bound tokens. Users in non-supported environments will continue to acquire tokens through the traditional web-based flows.

A working sample can be found [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-browser-samples/VanillaJSTestApp2.0/app/wamBroker)

## Differences when using WAM to acquire tokens

There are a few things that may behave a little differently when acquiring tokens through WAM.

- The `forceRefresh` parameter for `acquireTokenSilent` calls is not supported by WAM. You may receive a cached token from WAM regardless of what this flag is set to.
- If WAM needs to prompt the user for interaction a system prompt will be opened. This prompt looks a bit different from the browser popup windows you may be used to.
- Switching your account in the WAM prompt is not supported and MSAL.js will throw an error (Error Code: user_switch) if this happens. It is your app's responsibility to catch this error and handle it in a way that makes sense for your scenarios (e.g. Show an error page, retry with the new account, retry with the original account, etc.)
