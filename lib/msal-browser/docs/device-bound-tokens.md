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

### DPoP with the platform broker

> [!WARNING]
> Although MSAL Browser contains the client implementation, end-to-end platform-broker DPoP is not generally available today.
>
> It requires all of the following:
>
> -   A Windows build with broker DPoP support. Such builds are not currently available through public Windows releases.
> -   A Microsoft Entra-joined device configured for platform-broker authentication.
> -   The Windows Accounts extension.
> -   Server-side DPoP support and enablement in the Microsoft Entra token service and target resource.
>
> Unless your environment has been explicitly enabled for a coordinated preview, treat platform-broker DPoP as unavailable and do not depend on it for production use. APIs and behavior may change.

#### Availability and provider selection

Within an explicitly enabled preview environment, DPoP broker support is available only through the Windows Accounts extension. When the Platform Authentication DOM API provider is active, MSAL uses the browser-managed DPoP flow instead. Applications use the same DPoP request and response handling in either case; no broker-specific configuration is required.

#### Broker binding outcomes

Through the Windows Accounts extension, MSAL asks the platform broker to use broker-attested binding as a best-effort security improvement. With an L1 outcome, the token is bound to an MSAL-generated browser key and MSAL creates the resource proof locally. With an L3 outcome, the platform broker supplies the resource proof. Token issuance and Conditional Access determine whether the available binding satisfies tenant policy; applications receive and use the resulting DPoP token in the same way regardless of the binding mechanism.

MSAL rejects invalid or inconsistent broker responses instead of returning an unbound token. Application-managed DPoP keys are not supported through the Windows Accounts extension.

#### Redirect key persistence

When `acquireTokenRedirect()` uses the Windows Accounts extension, broker interaction occurs while the current application page remains loaded. If the broker returns an L1 outcome, MSAL must retain its generated key across the subsequent application-page navigation used to resume the request through `handleRedirectPromise()`. MSAL therefore verifies that the key is available in [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) before performing that navigation and fails the request if it was not persisted. If the broker returns an L3 outcome, the broker supplies the DPoP proof, so MSAL discards the local candidate key and does not require it to survive the application-page navigation.

#### Request requirements and limitations

DPoP requests must include the resource method and URI used to build the proof.

Resource-server DPoP nonce forwarding is not yet supported through the Windows Accounts extension. Applications must not pass `pop_nonce` through `extraParameters`; nonce support will use a dedicated API and internal nonce store.

For the complete request shape and proof usage, see [DPoP for PublicClientApplication](./access-token-proof-of-possession.md#dpop-for-publicclientapplication).

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
