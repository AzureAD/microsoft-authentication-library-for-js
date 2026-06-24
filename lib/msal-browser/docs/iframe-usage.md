# Using MSAL in iframed apps

> [!IMPORTANT]
> **Cross-origin iframes and popup flows:** Starting with Chromium 115+
> (Chrome, Edge, and other Chromium-based browsers), `BroadcastChannel` (and
> other storage APIs) are partitioned by top-level site. This means that
> `loginPopup()` and `acquireTokenPopup()` **will not work** when your
> application runs in a cross-origin iframe, because the popup opens as its own
> top-level context with a different storage partition than the iframe — the
> redirect bridge's `BroadcastChannel` message never arrives. Other browsers
> are expected to adopt similar partitioning in the future.
>
> See the [Redirect Bridge — Cross-Origin Iframe
> Limitation](./redirect-bridge.md#cross-origin-iframe-limitation) section for
> full details and recommended alternatives.
>
> **Recommended approach:** If the host platform supports it, use
> [Nested App Authentication (NAA)](./initialization.md#nested-app-configuration)
> via `createNestablePublicClientApplication`. NAA delegates authentication to
> the host application at the top level, avoiding cross-window communication
> entirely. NAA is supported by Microsoft hosts such as **Teams**, **Outlook**,
> and **Microsoft 365**. For **Azure AD B2C** apps using the
> [embedded sign-in experience](https://learn.microsoft.com/azure/active-directory-b2c/embedded-login),
> you can use `loginRedirect()` with `system.allowRedirectInIframe` set to
> `true` as a fallback. Note that **Azure AD / Microsoft Entra ID** does **not**
> allow interactive prompts in iframes (`X-FRAME-OPTIONS: DENY`), so this
> fallback is **not available** for Entra ID tenants.

By default, MSAL prevents full-frame redirects to the **Microsoft Entra ID (Azure AD)** authentication endpoint when an app is rendered inside an iframe, which means you cannot use [redirect APIs](./initialization.md#redirect-apis) for user interaction with the IdP:

- This restriction is imposed since **Azure AD** will refuse to render any prompt requiring user interaction (e.g. **credential entry**, **consent**, **logout** etc.) in an iframe by throwing the `X-FRAME OPTIONS SET TO DENY` [error](https://html.spec.whatwg.org/multipage/browsing-the-web.html#the-x-frame-options-header), a measure taken to prevent [clickjacking attacks](https://owasp.org/www-community/attacks/Clickjacking).
- Instead, you'll have to rely on MSAL's [popup APIs](./initialization.md#popup-apis) if user interaction is required, and/or silent APIs (`ssoSilent()`, `acquireTokenSilent()`) if user interaction can be avoided.
- Similarly, you'll have to use the [logoutPopup()](./logout.md#logoutpopup) API for sign-outs (:warning: if your app is using a version of msal-browser older than v2.13, make sure to upgrade and replace the `logout()` API, as it will attempt a full-frame redirect to Azure AD).
- When using [popup APIs](./initialization.md#popup-apis), you need to take into account any [sandboxing](https://html.spec.whatwg.org/multipage/origin.html#sandboxing) restrictions imposed by the parent app. In particular, the parent app needs to set the `allow-popups` flag when the iframe is sandboxed.

> [!WARNING]
> Popup APIs from a **cross-origin** iframe are affected by
> [third-party storage partitioning](#third-party-storage-partitioning-and-the-redirect-bridge),
> which breaks the redirect bridge's `BroadcastChannel` communication.
> Silent APIs may also be affected by third-party cookie restrictions.
> If your app is embedded in a cross-origin iframe, see the callout above for
> recommended alternatives.

**Azure AD B2C** offers an [embedded sign-in experience](https://learn.microsoft.com/azure/active-directory-b2c/embedded-login), which allows rendering a custom login UI in an iframe. Since MSAL prevents redirect in iframes by default, you'll need to set the [system.allowRedirectInIframe](./configuration.md#system-config-options) configuration option to **true** in order to make use of this feature. Note that enabling this option for apps on **Azure AD** is not recommended, due to the above restriction.

## Browser restrictions

Because Azure AD session cookies within an iframe are considered [3rd party cookies](https://developer.mozilla.org/docs/Web/HTTP/Cookies#third-party_cookies), certain browsers (for example **Safari** or **Chrome** in *incognito* mode) either block or clear these cookies by default. This will affect the **single sign-on** experience for iframed apps as they will not have access to IdP's session cookies (see: [Single sign-on](#single-sign-on)).

Additionally, when 3rd party cookies are disabled in **Chrome**, iframed MSAL apps will not have access to local or session storage. MSAL will fallback to in-memory storage in this case.

## Single sign-on

You **can** achieve [single sign-on](https://docs.microsoft.com/azure/active-directory/develop/msal-js-sso) between iframed and parent apps with the [same-origin](https://developer.mozilla.org/docs/Web/Security/Same-origin_policy) **and** with [cross-origin](https://developer.mozilla.org/docs/Web/Security/Same-origin_policy#cross-origin_script_api_access) **if** you pass an [account hint](./login-user.md#silent-login-with-ssosilent) from the parent app to the iframed app.

### Apps with same-origin

Iframed and parent apps with the same-origin may have access to the same MSAL.js cache instance and be able to sign-in without prompts, provided that both apps configure MSAL to use the [local storage](./caching.md#cache-storage) for caching. See for more: [Single sign-on with MSAL.js](https://docs.microsoft.com/azure/active-directory/develop/msal-js-sso)

### Apps with cross-origin

Iframed and parent apps with cross-origin can make use of the [ssoSilent()](./login-user.md#silent-login-with-ssosilent) API to achieve single sign-on. To do so, the parent app should pass down either an **account**, a **loginHint** (username) or a **session id** (sid) to the iframed app.

Apps can attempt to use `ssoSilent` without any of the above parameters. However be aware that there are [additional considerations](./login-user.md#silent-login-with-ssosilent) when using `ssoSilent` without providing any information about the user's session.

For cross-origin communication between iframed and parent apps, there are a few alternatives you can consider:

- You can add query strings to iframe's source in the parent app and retrieve them later in the child:

```javascript
// Create the main myMSALObj instance
// configuration parameters are located at authConfig.js
const myMSALObj = new msal.PublicClientApplication({
    auth: {
        clientId: "ENTER_CLIENT_ID",
        authority: "https://login.microsoftonline.com/ENTER_TENANT_ID",
        redirectUri: "/redirect", // must point to a page that implements the redirect bridge
    },
    cache: {
        cacheLocation: "localStorage", // set your cache location to local storage
    },
});

window.onload = () => {

    const urlParams = new URLSearchParams(window.location.search);
    const sid = urlParams.get("sid");

    // attempt SSO
    myMSALObj.ssoSilent({
        sid: sid
    }).then((response) => {
        // do something with response
    }).catch(error => {
        // handle errors
    });
}
```

- You can use the [postMessage()](https://html.spec.whatwg.org/multipage/web-messaging.html#dom-window-postmessage-options-dev) API in the parent app and listen for message events in the child:

```javascript
// Create the main myMSALObj instance
// configuration parameters are located at authConfig.js
const myMSALObj = new msal.PublicClientApplication({
    auth: {
        clientId: "ENTER_CLIENT_ID",
        authority: "https://login.microsoftonline.com/ENTER_TENANT_ID",
        redirectUri: "/redirect", // must point to a page that implements the redirect bridge
    },
    cache: {
        cacheLocation: "localStorage", // set your cache location to local storage
    },
});

const parentDomain = "http://localhost:3001";

window.addEventListener("message", (event) => {
    // check the origin of the data
    if (event.origin === parentDomain) {
        const sid = event.data;

        // attempt SSO
        myMSALObj.ssoSilent({
            sid: sid
        }).then((response) => {
            // do something with response
        }).catch(error => {
            // handle errors
        });
    }
});
```

## Error handling

You should catch and handle any errors if `ssoSilent()` fails. In particular:

- [InteractionRequiredError](https://azuread.github.io/microsoft-authentication-library-for-js/ref/classes/_azure_msal_common.interactionrequiredautherror.html): will be thrown if consent is required, user needs to perform MFA and etc. This error can often be handled by simply initiating an interactive API.
- [BrowserAuthError](https://azuread.github.io/microsoft-authentication-library-for-js/ref/classes/_azure_msal_browser.browserautherror.html): will be thrown if no or invalid *account hint* is provided, popups are blocked and etc. You'll need to inspect the `errorCode` and handle these appropriately.

```javascript
    myMSALObj.ssoSilent({
        sid: sid
    }).then((response) => {
            // do something with response
        }).catch(error => {
            if (error instanceof msal.InteractionRequiredAuthError) {
                myMSALObj.loginPopup()
                    .then((response) => {
                        // do something with response
                    });
            } else if (error instanceof msal.BrowserAuthError) {
                if (error.errorCode === "silent_sso_error") {
                    // e.g. username is null
                }
                if (error.errorCode === "popup_window_error") {
                    // e.g. popups are blocked
                }
            } else {
                console.log(error);
            }
        });
```

## User interaction

If you would like to minimize communication with IdP that requires user interaction, or if you are having issues with popups for any reason, there are some options you can consider:

- [Grant admin consent](https://docs.microsoft.com/azure/active-directory/develop/v2-admin-consent). This ensures that there are no consent prompts for permissions required by your app when users sign-in for the first time.

- [Pre-authorize client apps](https://docs.microsoft.com/azure/active-directory/develop/reference-app-manifest#preauthorizedapplications-attribute). This ensures that there are no consent prompts for permissions required by your web API when it's called by your client apps.

## Single sign-out

You can use MSAL.js with a [front-channel logout URI](https://openid.net/specs/openid-connect-backchannel-1_0.html) to achieve *single sign-out* effect between iframed and parent apps. For instance, if you would like users to automatically logout from iframed apps when they logout from the parent app, you should enable front-channel logout for the iframed apps. To do so, please refer to: [How to configure a front-channel logout URI](./logout.md#front-channel-logout).

## Third-Party Storage Partitioning and the Redirect Bridge

Starting with **Chromium 115+** (Chrome, Edge, and other Chromium-based browsers), [third-party storage partitioning](https://developers.google.com/privacy-sandbox/cookies/storage-partitioning) is enforced. Storage APIs — including `BroadcastChannel`, `localStorage`, `sessionStorage`, `IndexedDB`, `ServiceWorker`, and `SharedWorker` — are partitioned by the **top-level site**, not just by origin. Other browsers are expected to adopt similar partitioning in the future.

The MSAL [redirect bridge](./redirect-bridge.md) uses `BroadcastChannel` to send the authentication response from the popup back to the main application. When your app runs in a cross-origin iframe and opens a popup, the popup becomes its own top-level browsing context — placing it in a **different storage partition** than the iframe. The `BroadcastChannel` message from the redirect bridge never reaches your app, causing the authentication flow to time out with a `timed_out` (`redirect_bridge_timeout`) error.

**Affected flows (BroadcastChannel partition mismatch):**
- `loginPopup()` / `acquireTokenPopup()` — the popup opens as a new top-level context with a different partition than the iframe

### Recommended solutions

1. **Nested App Authentication (NAA)** — The preferred approach for apps embedded in a host platform that supports the NAA bridge (e.g., Teams, Outlook, Microsoft 365). See [Nested App Configuration](./initialization.md#nested-app-configuration).
2. **Redirect flow (Azure AD B2C only)** — Use `loginRedirect()` with `system.allowRedirectInIframe: true`. This option is only viable when the identity provider allows rendering in an iframe. Currently, only **Azure AD B2C** supports this via the [embedded sign-in experience](https://learn.microsoft.com/azure/active-directory-b2c/embedded-login). **Azure AD / Microsoft Entra ID** will refuse to render interactive prompts in an iframe (`X-FRAME-OPTIONS: DENY`), so this option is **not available** for Entra ID tenants.

For the full technical explanation and code examples, see the [Redirect Bridge — Cross-Origin Iframe Limitation](./redirect-bridge.md#cross-origin-iframe-limitation).
