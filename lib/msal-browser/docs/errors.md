# Errors

***

**[BrowserConfigurationAuthErrors](#Browserconfigurationautherrors)**

1. [stubbed_public_client_application_called](#stubbed_public_client_application_called)

**[BrowserAuthErrors](#browserautherrors)**

1. [interaction_in_progress](#interaction_in_progress)
1. [block_iframe_reload](#block_iframe_reload)
1. [monitor_window_timeout](#monitor_window_timeout)
1. [hash_empty_error](#hash_empty_error)
1. [hash_does_not_contain_known_properties](#hash_does_not_contain_known_properties)
1. [unable_to_acquire_token_from_native_platform](#unable_to_acquire_token_from_native_platform)
1. [native_connection_not_established](#native_connection_not_established)
1. [native_broker_called_before_initialize](#native_broker_called_before_initialize)

**[Other](#other)**

1. [Access to fetch at [url] has been blocked by CORS policy](#Access-to-fetch-at-[url]-has-been-blocked-by-CORS-policy)

***

## BrowserConfigurationAuthErrors

### stubbed_public_client_application_called

**Error Message**: Stub instance of Public Client Application was called. If using msal-react, please ensure context is not used without a provider.

See [msal-react errors](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-react/docs/errors.md)

## BrowserAuthErrors

### Interaction_in_progress

**Error Message**: Interaction is currently in progress. Please ensure that this interaction has been completed before calling an interactive API.

This error is thrown when an interactive API (`loginPopup`, `loginRedirect`, `acquireTokenPopup`, `acquireTokenRedirect`) is invoked while another interactive API is still in progress. The login and acquireToken APIs are async so you will need to ensure that the resulting promises have resolved before invoking another one.

#### Using `loginPopup` or `acquireTokenPopup`

Ensure that the promise returned from these APIs has resolved before invoking another one.

❌ The following example will throw this error because `loginPopup` will still be in progress when `acquireTokenPopup` is called:

```javascript
const request = {scopes: ["openid", "profile"]}
loginPopup();
acquireTokenPopup(request);
```

✔️ To resolve this you should ensure all interactive APIs have resolved before invoking another one:

```javascript
const request = {scopes: ["openid", "profile"]}
await msalInstance.loginPopup();
await msalInstance.acquireTokenPopup(request);
```

#### Using `loginRedirect` or `acquireTokenRedirect`

When using redirect APIs, `handleRedirectPromise` must be invoked when returning from the redirect. This ensures that the token response from the server is properly handled and temporary cache entries are cleaned up. This error is thrown when `handleRedirectPromise` has not had a chance to complete before the application invokes `loginRedirect` or `acquireTokenRedirect`.

❌ The following example will throw this error because `handleRedirectPromise` will still be processing the response from a previous `loginRedirect` call when `loginRedirect` is called a 2nd time:

```javascript
msalInstance.handleRedirectPromise();

const accounts = msalInstance.getAllAccounts();
if (accounts.length === 0) {
    // No user signed in
    msalInstance.loginRedirect();
}
```

✔️ To resolve, you should wait for `handleRedirectPromise` to resolve before calling any interactive API:

```javascript
await msalInstance.handleRedirectPromise();

const accounts = msalInstance.getAllAccounts();
if (accounts.length === 0) {
    // No user signed in
    msalInstance.loginRedirect();
}
```

Or alternatively:

```javascript
msalInstance.handleRedirectPromise()
    .then((tokenResponse) => {
        if (!tokenResponse) {
            const accounts = msalInstance.getAllAccounts();
            if (accounts.length === 0) {
                // No user signed in
                msalInstance.loginRedirect();
            }
        } else {
            // Do something with the tokenResponse
        }
    })
    .catch(err => {
        // Handle error
        console.error(err);
    });
```

**Note:** If you are calling `loginRedirect` or `acquireTokenRedirect` from a page that is not your `redirectUri` you will need to ensure `handleRedirectPromise` is called and awaited on both the `redirectUri` page as well as the page that you initiated the redirect from. This is because the `redirectUri` page will initiate a redirect back to the page that originally invoked `loginRedirect` and that page will process the token response.

#### Wrapper Libraries

If you are using one of our wrapper libraries (React or Angular), please see the error docs in those specific libraries for additional reasons you may be receiving this error:

- [msal-react errors](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-react/docs/errors.md)
- [msal-angular errors](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/errors.md)

#### Troubleshooting Steps

- [Enable verbose logging](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/configuration.md#using-the-config-object) and trace the order of events. Verify that `handleRedirectPromise` is called and returns before any `login` or `acquireToken` API is called.

If you are unable to figure out why this error is being thrown please [open an issue](https://github.com/AzureAD/microsoft-authentication-library-for-js/issues/new/choose) and be prepared to share the following information:

- Verbose logs
- A sample app and/or code snippets that we can use to reproduce the issue
- Refresh the page. Does the error go away?
- Open your application in a new tab. Does the error go away?

### block_iframe_reload

**Error Message**: Request was blocked inside an iframe because MSAL detected an authentication response.

This error is thrown when calling `ssoSilent` or `acquireTokenSilent` and the page used as your `redirectUri` is attempting to invoke a login or acquireToken function.
Our recommended mitigation for this is to set your `redirectUri` to a blank page that does not implement MSAL when invoking silent APIs. This will also have the added benefit of improving performance as the hidden iframe doesn't need to render your page.

✔️ You can do this on a per request basis, for example:

```javascript
msalInstance.acquireTokenSilent({
    scopes: ["User.Read"],
    redirectUri: "http://localhost:3000/blank.html"
});
```

Remember that you will need to register this new `redirectUri` on your App Registration.

If you do not want to use a dedicated `redirectUri` for this purpose, you should instead ensure that your `redirectUri` is not attempting to call MSAL APIs when rendered inside the hidden iframe used by the silent APIs.

### monitor_window_timeout

**Error Messages**:

- Token acquisition in iframe failed due to timeout.

This error can be thrown when calling `ssoSilent`, `acquireTokenSilent`, `acquireTokenPopup` or `loginPopup` and there are several reasons this could happen. These are a few of the most common:

1. The page you use as your `redirectUri` is removing or manipulating the hash
1. The page you use as your `redirectUri` is automatically navigating to a different page
1. You are being throttled by your identity provider
1. Your identity provider did not redirect back to your `redirectUri`.

**Important**: If your application uses a router library (e.g. React Router, Angular Router), please make sure it does not strip the hash or auto-redirect while MSAL token acquisition is in progress. If possible, it is best if your `redirectUri` page does not invoke the router at all.

#### Issues caused by the redirectUri page

When you make a silent call, in some cases, an iframe will be opened and will navigate to your identity provider's authorization page. After the identity provider has authorized the user it will redirect the iframe back to the `redirectUri` with the authorization code or error information in the hash fragment. The MSAL instance running in the frame or window that originally made the request will extract this response hash and process it. If your `redirectUri` is removing or manipulating this hash or navigating to a different page before MSAL has extracted it you will receive this timeout error.

✔️ To solve this problem you should ensure that the page you use as your `redirectUri` is not doing any of these things, at the very least, when loaded in a popup or iframe. We recommend using a blank page as your `redirectUri` for silent and popup flows to ensure none of these things can occur.

You can do this on a per request basis, for example:

```javascript
msalInstance.acquireTokenSilent({
    scopes: ["User.Read"],
    redirectUri: "http://localhost:3000/blank.html"
});
```

Remember that you will need to register this new `redirectUri` on your App Registration.

**Notes regarding Angular and React:**

- If you are using `@azure/msal-angular` your `redirectUri` page should not be protected by the `MsalGuard`.
- If you are using `@azure/msal-react` your `redirectUri` page should not render the `MsalAuthenticationComponent` or use the `useMsalAuthentication` hook.

#### Issues caused by the Identity Provider

#### Throttling

One of the most common reasons this error can be thrown is that your application has gotten stuck in a loop or made too many token requests in a short amount of time. When this happens the identity provider may throttle subsequent requests for a short time which will result in not being redirected back to your `redirectUri` and ultimately this error.

✔️ To resolve throttling based issues you have 2 options:

1. Stop making requests for a short time before trying again.
1. Invoke an interactive API, such as `acquireTokenPopup` or `acquireTokenRedirect`.

##### X-Frame-Options Deny

You can also get this error if the Identity Provider fails to redirect back to your application. In silent scenarios this error is sometimes accompanied by an X-Frame-Options: Deny error indicating that your identity provider is attempting to either show you an error message or is expecting interaction. 

✔️ The X-Frame-Options error will usually have a url in it and opening this url in a new tab may help you discern what is happening. If interaction is required consider using an interactive API instead. If an error is being displayed, address the error.

Some B2C flows are expected to throw this error due to their need for user interaction. These flows include:

- Password reset
- Profile edit
- Sign up
- Some custom policies depending on how they are configured

##### Network Latency

Another potential reason the identity provider may not redirect back to your application in time may be that there is some extra network latency. 

✔️ The default timeout is about 10 seconds and should be sufficient in most cases, however, if your identity provider is taking longer than that to redirect you can increase this timeout in the MSAL config with either the `iframeHashTimeout`, `windowHashTimeout` or `loadFrameTimeout` configuration parameters.

```javascript
const msalConfig = {
    auth: {
        clientId: "your-client-id"
    },
    system: {
        windowHashTimeout: 9000, // Applies just to popup calls - In milliseconds
        iframeHashTimeout: 9000, // Applies just to silent calls - In milliseconds
        loadFrameTimeout: 9000 // Applies to both silent and popup calls - In milliseconds
    }
};
```

### hash_empty_error

**Error Messages**:

> Hash value cannot be processed because it is empty. Please verify that your redirectUri is not clearing the hash.

This error occurs when the page you use as your redirectUri is removing the hash, or auto-redirecting to another page. This most commonly happens when the application implements a router which navigates to another route, dropping the hash.

To resolve this error we recommend using a dedicated redirectUri page which is not subject to the router. For silent and popup calls it's best to use a blank page. If this is not possible please make sure the router does not navigate while MSAL token acquisition is in progress. You can do this by detecting if your application is loaded in an iframe for silent calls, in a popup for popup calls or by awaiting `handleRedirectPromise` for redirect calls.

### hash_does_not_contain_known_properties

**Error Messages**:

> Hash does not contain known properites. Please verify that your redirectUri is not changing the hash.

Please see explanation for [hash_empty_error](#hash_empty_error) above. The root cause for this error is similar, the difference being the hash has been changed, rather than dropped.


### unable_to_acquire_token_from_native_platform

**Error Messages**:

- Unable to acquire token from native platform.

This error is thrown when calling the `acquireTokenByCode` API with the `nativeAccountId` instead of `code` and the app is running in an environment which does not acquire tokens from the native broker. For a list of pre-requisites please review the doc on [device bound tokens](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/device-bound-tokens.md).

### native_connection_not_established

**Error Messages**:

- Connection to native platform has not been established. Please install a compatible browser extension and run initialize().

This error is thrown when the user signed in with the native broker but no connection to the native broker currently exists. This can happen for the following reasons:

- The Windows Accounts extension was uninstalled or disabled
- The `initialize` API has not been called or was not awaited before invoking another MSAL API

### native_broker_called_before_initialize

**Error Messages**:

- You must call and await the initialize function before attempting to call any other MSAL API when native brokering is enabled.

This error is thrown when the `allowNativeBroker` flag is set to `true` in the `PublicClientApplication` config and a `login`, `acquireToken` or `handleRedirectPromise` API is invoked before the `initialize` API has been called. The `initialize` API must be called and awaited before attempting to acquire tokens.

❌ The following example will throw this error because `handleRedirectPromise` is called before initialize has completed:

```javascript
const msalInstance = new PublicClientApplication({
    auth: {
        clientId: "your-client-id"
    },
    system: {
        allowNativeBroker: true
    }
});

await msalInstance.handleRedirectPromise(); // This will throw
msalInstance.acquireTokenSilent(); // This will also throw
```

✔️ To resolve, you should wait for `initialize` to resolve before calling any other MSAL API:

```javascript
const msalInstance = new PublicClientApplication({
    auth: {
        clientId: "your-client-id"
    },
    system: {
        allowNativeBroker: true
    }
});

await msalInstance.initialize();
await msalInstance.handleRedirectPromise(); // This will no longer throw this error since initialize completed before this was invoked
msalInstance.acquireTokenSilent(); // This will also no longer throw this error
```

## Other

Errors not thrown by msal, such as server errors

### Access to fetch at [url] has been blocked by CORS policy

This error occurs with MSAL.js v2.x and is due to improper configuration during **App Registration** on **Azure Portal**. In particular, you should ensure your `redirectUri` is registered as type: `Single-page application` under the **Authentication** blade in your App Registration. If done successfully, you will see a green checkmark that says: 

> Your Redirect URI is eligible for the Authorization Code Flow with PKCE.

![image](https://user-images.githubusercontent.com/5307810/110390912-922fa380-801b-11eb-9e2b-d7aa88ca0687.png)
