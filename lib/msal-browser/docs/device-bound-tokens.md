# Acquiring Device Bound Tokens using platform brokers

MSAL.js supports acquiring tokens from the platform broker, say Web Account Manager (WAM) on Windows and Mac Broker on Mac. These tokens are bound to the device they were acquired on and are not cached in the browser's localStorage or sessionStorage.

## Supported Environment

This feature is currently only supported in the following environment:

-   A machine running a Windows build that supports the feature (more to come on this) or a Company Portal managed Mac with a specific Mac OS version (more to come on this).
-   Chrome and Edge browsers or Teams
-   [Windows Accounts extension](https://chrome.google.com/webstore/detail/windows-accounts/ppnbnpeolgkicgegkbkbjmhlideopiji) (version 1.0.5 or higher) is installed if using Chrome or Edge
-   App must be hosted on `https`

Additionally, this feature is currently only supported for Work and School Accounts

## Enable the feature in MSAL.js

In order to enable this feature in MSAL.js set the `allowPlatformBroker` flag to true in your configuration object like so:

```javascript
const msalConfig = {
    auth: {
        clientId: "insert-clientId",
    },
    system: {
        allowPlatformBroker: true,
    },
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

## Differences when using Platform Broker to acquire tokens

There are a few things that may behave a little differently when acquiring tokens through the platform broker.

-   All cache related configuration applies only to MSAL's local cache. The platform broker controls its own, more secure, cache which is used instead of browser storage and it does not support configuration of its cache behavior. This means you may receive a cached token regardless of the value of request parameters such as: `forceRefresh`, `cacheLookupPolicy` or `storeInCache`. In addition, tokens received from the platform broker are _not_ stored in local or session storage regardless of what you have configured on PublicClientApplication.
-   If the platform broker needs to prompt the user for interaction a system prompt will be opened. This prompt looks a bit different from the browser popup windows you may be used to.
-   Switching your account in the platform broker prompt is not supported and MSAL.js will throw an error (Error Code: user_switch) if this happens. It is your app's responsibility to catch this error and handle it in a way that makes sense for your scenarios (e.g. Show an error page, retry with the new account, retry with the original account, etc.)

## Acquiring Device Bound Tokens using DOM API

MSAL.js also supports acquiring tokens from the platform broker using DOM APIs in Edge. Instead of using a browser extension to communicate with the platform broker, MSAL.js can directly call a DOM API in the Edge browser, which in turn invokes the platform broker to acquire tokens.

-   This feature is currently only supported in the Edge browser and all other OS requirements mentioned above still apply. (more details to come).
-   This feature is currently only in private-preview and requires special enablement.

To enable this feature, set the `allowPlatformBrokerWithDOM` flag to true in the `experimental` section of your configuration object like so:

```javascript
const msalConfig = {
    auth: {
        clientId: "insert-clientId",
    },
    system: {
        allowPlatformBroker: true,
    },
    experimental: {
        allowPlatformBrokerWithDOM: true,
    },
};
```

Note: The `allowPlatformBroker` flag must also be set to true in order to use this feature. There will be a configuration error - `invalid_platform_broker_configuration` if `allowPlatformBrokerWithDOM` is set to true while `allowPlatformBroker` is false.

Eventually, in a future major version, this flag will be merged with `allowPlatformBroker` and MSAL.js will make the decision to use either the browser extension or DOM APIs based on the environment automatically. The behavior and availability of `experimental` flags is subject to change at any time, without following semver rules.
