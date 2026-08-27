# Configuration Options

Before you start here, make sure you understand how to [initialize an app object](./initialization.md).

The MSAL library has a set of configuration options that can be used to customize the behavior of your authentication flows. These options can be set either in the constructor of the `PublicClientApplication` object or as part of the [request APIs](./request-response-object.md). Here we describe the configuration object that can be passed into the `PublicClientApplication` constructor.

## Using the config object

The configuration object has the following structure, and can be passed into the `PublicClientApplication` constructor. The only required config parameter is the client ID of the application. Everything else is optional, but may be required depending on your tenant and application model.

```javascript
const msalConfig = {
    auth: {
        clientId: "enter_client_id_here",
        authority: "https://login.microsoftonline.com/common",
        knownAuthorities: [],
        cloudDiscoveryMetadata: "",
        redirectUri: "enter_redirect_uri_here",
        postLogoutRedirectUri: "enter_postlogout_uri_here",
        navigateToLoginRequestUrl: true,
        clientCapabilities: ["CP1"],
    },
    cache: {
        cacheLocation: "sessionStorage",
    },
    system: {
        loggerOptions: {
            loggerCallback: (
                level: LogLevel,
                message: string,
                containsPii: boolean
            ): void => {
                if (containsPii) {
                    return;
                }
                switch (level) {
                    case LogLevel.Error:
                        console.error(message);
                        return;
                    case LogLevel.Info:
                        console.info(message);
                        return;
                    case LogLevel.Verbose:
                        console.debug(message);
                        return;
                    case LogLevel.Warning:
                        console.warn(message);
                        return;
                }
            },
            piiLoggingEnabled: false,
        },
        windowHashTimeout: 60000,
        iframeHashTimeout: 6000,
        loadFrameTimeout: 0,
        protocolMode: "AAD",
        serverTelemetryEnabled: false,
    },
    telemetry: {
        application: {
            appName: "My Application",
            appVersion: "1.0.0",
        },
    },
};

const msalInstance = new PublicClientApplication(msalConfig);
```

## Configuration Options

### Auth Config Options

| Option                      | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Format                                                                                                                                       | Default Value                                                               |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ----------- |
| `clientId`                  | App ID of your application. Can be found in your [portal registration](../README#prerequisites).                                                                                                                                                                                                                                                                                                                                                                                                                           | UUID/GUID                                                                                                                                    | None. This parameter is required in order for MSAL to perform any actions.  |
| `authority`                 | URI of the tenant to authenticate and authorize with. Usually takes the form of `https://{uri}/{tenantid}` (see [Authority](../../msal-common/docs/authority.md))                                                                                                                                                                                                                                                                                                                                                          | String in URI format with tenant - `https://{uri}/{tenantid}`                                                                                | `https://login.microsoftonline.com/common`                                  |
| `knownAuthorities`          | An array of known authority URIs. Used in B2C and CIAM scenarios. For CIAM with Entra External ID, include the GUID-based issuer host if it differs from the authority host (see [Authority - CIAM](../../msal-common/docs/authority.md#ciam-issuer-validation-and-knownauthorities)).                                                                                                                                                                                                                                     | Array of strings in URI format                                                                                                               | Empty array `[]`                                                            |
| `cloudDiscoveryMetadata`    | A string containing the cloud discovery response. Used in AAD scenarios. See [Performance](../../msal-common/docs/performance.md) for more info                                                                                                                                                                                                                                                                                                                                                                            | string                                                                                                                                       | Empty string `""`                                                           |
| `authorityMetadata`         | A string containing the .well-known/openid-configuration endpoint response. See [Performance](../../msal-common/docs/performance.md) for more info                                                                                                                                                                                                                                                                                                                                                                         | string                                                                                                                                       | Empty string `""`                                                           |
| `redirectUri`               | URI where the authorization code response is sent back to. Whatever location is specified here must have the MSAL library available to handle the response.                                                                                                                                                                                                                                                                                                                                                                | String in absolute or relative URI format                                                                                                    | Login request page (`window.location.href` of page which made auth request) |
| `postLogoutRedirectUri`     | URI that is redirected to after a logout() call is made.                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | String in absolute or relative URI format. Pass `null` to disable post logout redirect.                                                      | Login request page (`window.location.href` of page which made auth request) |
| `popupRelayUri`             | URI of a first-party, top-level "popup-relay" page used to acquire tokens (and log out) interactively from inside a cross-origin iframe, where third-party storage partitioning and COOP would otherwise break the popup flow. When set, `acquireTokenPopup`/`logoutPopup` open this page top-level and relay the flow through it. Must be same-origin as the app. See [Popup relay for cross-origin iframes](#popup-relay-for-cross-origin-iframes).                                                                      | String in absolute or relative (same-origin) URI format.                                                                                     | Empty string `""` (disabled)                                                |
| `navigateToLoginRequestUrl` | If `true`, will navigate back to the original request location before processing the authorization code response. If the `redirectUri` is the same as the original request location, this flag should be set to false.                                                                                                                                                                                                                                                                                                     | boolean                                                                                                                                      | `true`                                                                      |
| `clientCapabilities`        | Array of capabilities to be added to all network requests as part of the `xms_cc` claims request (see: [Client capability in MSAL](../../msal-common/docs/client-capability.md))                                                                                                                                                                                                                                                                                                                                           | Array of strings                                                                                                                             | `[]`                                                                        |
| `azureCloudOptions`         | A defined set of azure cloud options for developers to default to their specific cloud authorities, for specific clouds supported please refer to the [AzureCloudInstance](https://aka.ms/msaljs/azure_cloud_instance)                                                                                                                                                                                                                                                                                                     | [AzureCloudOptions](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_common.html#azurecloudoptions) | [AzureCloudInstance.None](msaljs/azure_cloud_instance)                      |
| `onRedirectNavigate`        | A callback that will be passed the url that MSAL will navigate to in redirect flows. Returning false in the callback will stop navigation.                                                                                                                                                                                                                                                                                                                                                                                 | `(url: string) => boolean                                                                                                                    | void`                                                                       | `undefined` |
| `instanceAware`             | A flag of whether the STS will send back additional parameters to specify where the tokens should be retrieved from.                                                                                                                                                                                                                                                                                                                                                                                                       | boolean                                                                                                                                      | `false`                                                                     |
| `isMcp`                     | If true, a `resource` parameter is required on all token requests. Used for MCP flows. See [MCP documentation](mcp.md) for more details.                                                                                                                                                                                                                                                                                                                                                                                   | boolean                                                                                                                                      | `false`                                                                     |
| `originCheck`               | Whether MSAL computes the origin check behind the `pocd` authorize parameter, which tells Entra it may omit the `Cross-Origin-Opener-Policy` response header. Applies to every authorize and end-session request — popup, redirect and silent, in GET, POST and EAR form. Set to `false` to skip the check and always send `pocd=1`, taking responsibility for the framing threat model. Implied `false` by `system.enableLegacyPolling`. See [COOP and popup responses](#cross-origin-opener-policy-and-popup-responses). | boolean                                                                                                                                      | `true`                                                                      |

#### Popup relay for cross-origin iframes

`popupRelayUri` lets `acquireTokenPopup` (and `logoutPopup`) work when your app runs inside an untrusted, cross-origin iframe — a context where third-party storage partitioning and COOP normally break the popup flow. When set, MSAL opens the relay page top-level (on your own origin) instead of navigating the popup straight to the identity provider, and that page relays the response back to the embedded frame. No tokens, PKCE verifier, or EAR key cross the window boundary.

Setup:

-   Host a same-origin page at `popupRelayUri` that calls `runPopupRelay()` from the `@azure/msal-browser/popup-relay` sub-export. It opens the IdP child popup, so call it from a user gesture (e.g. a "Continue" button click) so popup blockers don't block it.
-   Pass your authority's origin to `runPopupRelay({ allowedAuthorityOrigins: ["https://login.microsoftonline.com"] })`. The relay page is a publicly reachable page on your origin, so pinning the origins it may navigate to means a crafted link can only ever reach your identity provider. See [Securing the relay page](#securing-the-relay-page).
-   Point your `redirectUri` (and, for logout, `postLogoutRedirectUri`) at a page that calls `broadcastResponseToMainFrame()` from the `@azure/msal-browser/redirect-bridge` sub-export.

Caveats:

-   The relay is a browser **SPA-only** mechanism (`PublicClientApplication` in `@azure/msal-browser`). It brokers the standard interactive popup auth-code flow through a same-origin page and is **not** intended for native app, platform broker (WAM), Nested App Auth, or confidential-client / server-side scenarios.
-   `popupRelayUri` must resolve to the **same origin** as the app; a cross-origin value throws `popup_relay_unsupported_flow` with sub-error `popup_relay_cross_origin` (see [errors](../../../docs/errors.md#popup_relay_unsupported_flow)).
-   The relay page opens the IdP popup, so it must be triggered by a user gesture.
-   The auth-code (GET), `form_post`, and EAR response modes are all supported.

##### Securing the relay page

The relay page is deployed on your own origin and anyone can navigate to it directly, so `runPopupRelay()` treats the request carried in its hash as untrusted input rather than as authority:

-   The request shape is validated exactly. A request with a missing or unrecognized `method` is rejected instead of being treated as a `GET`.
-   Navigation targets — both the `GET` url and the `POST` form action — must be absolute `https:` URLs with no embedded credentials. Active and local schemes (`javascript:`, `data:`, `blob:`, `file:`) are rejected with sub-error `popup_relay_unsafe_url`, so a crafted link cannot run script in your app's origin.
-   Setting `allowedAuthorityOrigins` additionally pins **which** https origins are acceptable; anything else is rejected with sub-error `popup_relay_untrusted_authority`. This is strongly recommended — it reduces the relay page from "can open any https URL" to "can only reach my identity provider". The option is optional and additive: omitting it does not disable the relay, it just skips the origin pin. Entries are compared by origin, so passing your full configured authority (`https://login.microsoftonline.com/common`) works as well as the bare origin.

As defense in depth, serve the relay page with a Content Security Policy that blocks `javascript:` URLs (for example a `script-src` directive without `unsafe-inline`, and a restrictive `default-src`).

#### Cross-Origin-Opener-Policy and popup responses

Entra sends a `Cross-Origin-Opener-Policy` (COOP) response header on `/authorize`. COOP severs the link between a popup and its opener, which stops a malicious opener from reading the popup's `location` — and also stops the opener from observing `popupWindow.closed`. The severance is irreversible: it persists even after the popup navigates back to your origin.

MSAL therefore delivers popup responses over a `BroadcastChannel` "redirect bridge" rather than by reading the popup's URL. This is the default and needs no configuration.

##### Choosing a response mechanism

| Your app runs...                                     | Use                                                           |
| ---------------------------------------------------- | ------------------------------------------------------------- |
| Top-level, or framed by same-origin ancestors        | Default redirect bridge — nothing to configure                |
| Inside a cross-origin iframe                         | [`auth.popupRelayUri`](#popup-relay-for-cross-origin-iframes) |
| Inside a cross-origin iframe, no relay page possible | `system.enableLegacyPolling` (see caveats below)              |

The bridge fails in a cross-origin iframe because third-party storage partitioning gives the frame a different `BroadcastChannel` partition than the popup, so the response never arrives. `popupRelayUri` solves this by routing the flow through a top-level page on your own origin; legacy polling solves it by not using the channel at all.

##### The `pocd` parameter

When MSAL can show that no untrusted window is able to reach the window driving the request, it sends `pocd=1` ("popup origin check done") on the request, and Entra may then omit the COOP header. MSAL sends the parameter only when it computes `1`; it is never sent as `0`.

The check is evaluated once per request and covers **every** flow — `acquireTokenPopup`, `acquireTokenRedirect`, `ssoSilent`, `acquireTokenSilent`, `logoutPopup` and `logoutRedirect` — in the auth-code (GET), form-post and EAR response modes alike. It describes the app's own window topology, which does not vary by flow.

The check passes when **both** hold:

-   every ancestor frame is same-origin with the app, and
-   the top-level window has no opener, or a same-origin one.

Reading the opener from the top-level window matters: a framed document always reports `window.opener === null`, so checking only the current frame would pass while an untrusted opener still held a handle on the top window.

Two cases are decided by topology rather than measurement:

-   **Popup relay** — the identity provider's window is a grandchild popup opened by the relay page. An untrusted ancestor cannot reach a grandchild by name, so `pocd=1` is asserted.
-   **Legacy polling** — polling cannot work while COOP is enforced, so enabling it implies `auth.originCheck: false` and always asserts `pocd=1`.

##### Opting out

Set `auth.originCheck: false` when your app cannot use the bridge or the relay and you accept the risk. MSAL then sends `pocd=1` without verifying anything, so COOP is omitted and an untrusted opener of the top-level window can reach the auth popup. MSAL logs a warning when this option is disabled **and** the risky topology is actually present.

Protection against auth-code theft in this mode rests on PKCE, the `redirect_uri` allow-list on the app registration, and single-use short-lived auth codes. Only opt out where the threat model excludes arbitrary cross-origin top-level openers — for example Office Add-ins or trusted WebView hosts.

### Cache Config Options

| Option          | Description                         | Format                                                                                                  | Default Value    |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------- |
| `cacheLocation` | Location of token cache in browser. | String value that must be one of the following: `"sessionStorage"`, `"localStorage"`, `"memoryStorage"` | `sessionStorage` |

See [Caching in MSAL](./caching.md) for more.

### System Config Options

| Option                   | Description                                                                                                                                                                                                                                                                                                                                                                                                 | Format                               | Default Value                        |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ------------------------------------ |
| `loggerOptions`          | Config object for logger.                                                                                                                                                                                                                                                                                                                                                                                   | See [below](#logger-config-options). | See [below](#logger-config-options). |
| `navigatePopups`         | Sets whether popups are opened and navigated to later. By default, this flag is set to true. When set to true, blank popups are opened and navigates to login domain. When set to false, popups are opened directly to the login domain. This can be set to false for scenarios where `about:blank` is not supported, e.g. desktop apps or progressive web apps.                                            | boolean                              | `true`                               |
| `allowRedirectInIframe`  | By default, MSAL will not allow redirect operations to be initiated when the application is inside an iframe. Set this flag to `true` to remove this check.                                                                                                                                                                                                                                                 | boolean                              | `false`                              |
| `cryptoOptions`          | Config object for crypto operations in the browser.                                                                                                                                                                                                                                                                                                                                                         | See [below](#crypto-config-options.) | See [below](#crypto-config-options.) |
| `popupBridgeTimeout`     | Timeout in milliseconds to wait for the popup to send its response via BroadcastChannel. If the user closes the popup without completing authentication, `loginPopup` or `acquireTokenPopup` will reject with a `timed_out` error after this timeout. See [Popup closure detection](./login-user.md#popup-closure-detection-and-interactionstatus).                                                         | integer (milliseconds)               | `60000`                              |
| `iframeBridgeTimeout`    | Timeout in milliseconds to wait for a hidden iframe to send its response via BroadcastChannel during silent token acquisition (`ssoSilent`, `acquireTokenSilent`). If the iframe does not respond within this time, the call will reject with a `timed_out` error.                                                                                                                                          | integer (milliseconds)               | `10000`                              |
| `protocolMode`           | Enum representing the protocol mode to use. If `"AAD"`, will function on the OIDC-compliant AAD v2 endpoints; if `"OIDC"`, will function on other OIDC-compliant endpoints.                                                                                                                                                                                                                                 | string                               | `"AAD"`                              |
| `serverTelemetryEnabled` | Enables MSER server telemetry headers and browser cache writes for failed requests. When `false`, MSAL does not send MSER headers and does not persist server telemetry data to browser storage. This option is deprecated and will be removed in a future release.                                                                                                                                         | boolean                              | `false`                              |
| `enableLegacyPolling`    | Opt in to the legacy (non-COOP) hash-polling flow for `acquireTokenPopup`, `logoutPopup` and `ssoSilent`, polling the popup/iframe `location` instead of using the `BroadcastChannel` redirect bridge. Requires COOP to be absent on both the app origin and the STS response. Prefer `auth.popupRelayUri` where possible. See [COOP and popup responses](#cross-origin-opener-policy-and-popup-responses). | boolean                              | `false`                              |

#### Logger Config Options

| Option              | Description                                                             | Format                                                                                      | Default Value                          |
| ------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------- |
| `loggerCallback`    | Callback function which handles the logging of MSAL statements.         | Function - `loggerCallback: (level: LogLevel, message: string, containsPii: boolean): void` | See [above](#using-the-config-object). |
| `piiLoggingEnabled` | If true, personally identifiable information (PII) is included in logs. | boolean                                                                                     | `false`                                |

#### Crypto Config Options

| Option         | Description                                                                                                                                                                         | Format       | Default Value |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------------- |
| `useMsrCrypto` | Whether to use [MSR Crypto](https://github.com/microsoft/MSR-JavaScript-Crypto) if available in the browser (and other crypto interfaces are not available).                        | boolean      | `false`       |
| `entropy`      | Cryptographically strong random values used to seed MSR Crypto (e.g. `crypto.randomBytes(48)` from Node). 48 bits of entropy is recommended. Required if `useMsrCrypto` is enabled. | `Uint8Array` | `undefined`   |

### Telemetry Config Options

| Option        | Description                                      | Format                                                                                  | Default Value                                                                                 |
| ------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `application` | Telemetry options for applications using MSAL.js | See [below](#application-telemetry)                                                     | See [below](#application-telemetry)                                                           |
| `client`      | Telemetry performance client instance            | [IPerformanceClient](../../msal-common/src/telemetry/performance/IPerformanceClient.ts) | [StubPerformanceClient](../../msal-common/src/telemetry/performance/StubPerformanceClient.ts) |

#### Application Telemetry

| Option       | Description                           | Format | Default Value   |
| ------------ | ------------------------------------- | ------ | --------------- |
| `appName`    | Unique string name of an application  | string | Empty string "" |
| `appVersion` | Version of the application using MSAL | string | Empty string "" |
