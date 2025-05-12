# MSAL.js errors

### `pkce_not_created`
- The PKCE code challenge and verifier could not be generated.

### `ear_jwk_empty`
- No EAR encryption key provided. This is unexpected.

### `ear_jwe_empty`
- Server response does not contain ear_jwe property. This is unexpected.

### `crypto_nonexistent`
- The crypto object or function is not available.

### `empty_navigate_uri`
- Navigation URI is empty. Please check stack trace for more info.

### `hash_empty_error`
- Hash value cannot be processed because it is empty. Please verify that your redirectUri is not clearing the hash.

This error occurs when the page you use as your redirectUri is removing the hash, or auto-redirecting to another page. This most commonly happens when the application implements a router which navigates to another route, dropping the hash.

To resolve this error we recommend using a dedicated redirectUri page which is not subject to the router. For silent and popup calls it's best to use a blank page. If this is not possible please make sure the router does not navigate while MSAL token acquisition is in progress. You can do this by detecting if your application is loaded in an iframe for silent calls, in a popup for popup calls or by awaiting `handleRedirectPromise` for redirect calls.

### `no_state_in_hash`
- Hash does not contain state. Please verify that the request originated from msal

### `hash_does_not_contain_known_properties`
- Hash does not contain known properties. Please verify that your redirectUri is not changing the hash.

Please see explanation for [hash_empty_error](#hash_empty_error) above. The root cause for this error is similar, the difference being the hash has been changed, rather than dropped.

### `unable_to_parse_state`
- Unable to parse state. Please verify that the request originated from msal.

### `state_interaction_type_mismatch`
- Hash contains state but the interaction type does not match the caller.

### `interaction_in_progress`
- Interaction is currently in progress. Please ensure that this interaction has been completed before calling an interactive API.

This error is thrown when an interactive API (`loginPopup`, `loginRedirect`, `acquireTokenPopup`, `acquireTokenRedirect`) is invoked while another interactive API is still in progress. The login and acquireToken APIs are async so you will need to ensure that the resulting promises have resolved before invoking another one.

#### Using `loginPopup` or `acquireTokenPopup`

Ensure that the promise returned from these APIs has resolved before invoking another one.

❌ The following example will throw this error because `loginPopup` will still be in progress when `acquireTokenPopup` is called:

```javascript
const request = { scopes: ["openid", "profile"] };
loginPopup();
acquireTokenPopup(request);
```

✔️ To resolve this you should ensure all interactive APIs have resolved before invoking another one:

```javascript
const request = { scopes: ["openid", "profile"] };
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
msalInstance
    .handleRedirectPromise()
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
    .catch((err) => {
        // Handle error
        console.error(err);
    });
```

**Note:** If you are calling `loginRedirect` or `acquireTokenRedirect` from a page that is not your `redirectUri` you will need to ensure `handleRedirectPromise` is called and awaited on both the `redirectUri` page as well as the page that you initiated the redirect from. This is because the `redirectUri` page will initiate a redirect back to the page that originally invoked `loginRedirect` and that page will process the token response.

#### Wrapper Libraries

If you are using one of our wrapper libraries (React or Angular), please see the error docs in those specific libraries for additional reasons you may be receiving this error:

-   [msal-react errors](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-react/docs/errors.md#interaction_in_progress)
-   [msal-angular errors](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/errors.md#interaction_in_progress)

If you are not using any of the wrapper libraries but concerned that your application might trigger concurrent interactive requests, you should check if any other interaction is in progress prior to invoking an interaction in your token acquisition method. You can achieve this by implementing a global application state or a broadcast service etc. that emits the current MSAL interaction status via [MSAL Events API](./events.md).

❌ The following example will throw this error because the `acquireTokenPopup` in the **catch** block does not check if there is another interaction taking place at the moment:

```javascript
async function myAcquireToken(request) {
    const msalInstance = getMsalInstance(); // get the msal application instance

    const tokenRequest = {
        account: msalInstance.getActiveAccount() || null,
        ...request,
    };

    let tokenResponse;

    try {
        // attempt silent acquisition first
        tokenResponse = await msalInstance.acquireTokenSilent(tokenRequest);
    } catch (error) {
        if (error instanceof InteractionRequiredAuthError) {
            try {
                tokenResponse = await msalInstance.acquireTokenPopup(
                    tokenRequest
                );
            } catch (err) {
                console.log(err);
                // handle other errors
            }
        }

        console.log(error);
        // handle other errors
    }

    return tokenResponse;
}

const request = {
    scopes: ["User.Read"],
};

myAcquireToken(request);
myAcquireToken(request);
```

✔️ To resolve, you should wait for the interaction status to be `None` before calling any other interactive API:

```javascript
async function myAcquireToken(request) {
    const msalInstance = getMsalInstance(); // get the msal application instance

    const tokenRequest = {
        account: msalInstance.getActiveAccount() || null,
        ...request,
    };

    let tokenResponse;

    try {
        // attempt silent acquisition first
        tokenResponse = await msalInstance.acquireTokenSilent(tokenRequest);
    } catch (error) {
        if (error instanceof InteractionRequiredAuthError) {
            // check for any interactions
            if (
                myGlobalState.getInteractionStatus() !== InteractionStatus.None
            ) {
                // throw a new error to be handled in the caller below
                throw new Error("interaction_in_progress");
            } else {
                // no interaction, invoke popup flow
                tokenResponse = await msalInstance.acquireTokenPopup(
                    tokenRequest
                );
            }
        }

        console.log(error);
        // handle other errors
    }

    return tokenResponse;
}

async function myInteractionInProgressHandler() {
    /**
     * "myWaitFor" method polls the interaction status via getInteractionStatus() from
     * the application state and resolves when it's equal to "None".
     */
    await myWaitFor(
        () => myGlobalState.getInteractionStatus() === InteractionStatus.None
    );

    // wait is over, call myAcquireToken again to re-try acquireTokenSilent
    return await myAcquireToken(tokenRequest);
}

const request = {
    scopes: ["User.Read"],
};

myAcquireToken(request).catch((e) => myInteractionInProgressHandler());
myAcquireToken(request).catch((e) => myInteractionInProgressHandler());
```

#### Troubleshooting Steps

-   [Enable verbose logging](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/configuration.md#using-the-config-object) and trace the order of events. Verify that `handleRedirectPromise` is called and returns before any `login` or `acquireToken` API is called.

If you are unable to figure out why this error is being thrown please [open an issue](https://github.com/AzureAD/microsoft-authentication-library-for-js/issues/new/choose) and be prepared to share the following information:

-   Verbose logs
-   A sample app and/or code snippets that we can use to reproduce the issue
-   Refresh the page. Does the error go away?
-   Open your application in a new tab. Does the error go away?

### `popup_window_error`
- Error opening popup window. This can happen if you are using IE or if popups are blocked in the browser.

### `empty_window_error`
- window.open returned null or undefined window object.

### `user_cancelled`
- User cancelled the flow.

### `monitor_popup_timeout`
- Token acquisition in popup failed due to timeout. For more visit: https://aka.ms/msaljs/browser-errors#monitor_popup_timeout

### `monitor_window_timeout`
- Token acquisition in iframe failed due to timeout. For more visit: https://aka.ms/msaljs/browser-errors#monitor_window_timeout

**Error Messages**:

-   Token acquisition in iframe failed due to timeout.

This error can be thrown when calling `ssoSilent`, `acquireTokenSilent`, `acquireTokenPopup` or `loginPopup` and there are several reasons this could happen. These are a few of the most common:

1. The page you use as your `redirectUri` is removing or manipulating the hash
1. The page you use as your `redirectUri` is automatically navigating to a different page
1. You are being throttled by your identity provider. The identity provider may throttle clients that make too many similar requests in a short period of time. Never implement an endless retry mechanism or retry more than once. Attempts to retry non-network errors typically yield the same result. See [throttling guide](#Throttling) for more details.
1. Your identity provider did not redirect back to your `redirectUri`.

**Important**: If your application uses a router library (e.g. React Router, Angular Router), please make sure it does not strip the hash or auto-redirect while MSAL token acquisition is in progress. If possible, it is best if your `redirectUri` page does not invoke the router at all.

#### Issues caused by the redirectUri page

When you make a silent call, in some cases, an iframe will be opened and will navigate to your identity provider's authorization page. After the identity provider has authorized the user it will redirect the iframe back to the `redirectUri` with the authorization code or error information in the hash fragment. The MSAL instance running in the frame or window that originally made the request will extract this response hash and process it. If your `redirectUri` is removing or manipulating this hash or navigating to a different page before MSAL has extracted it you will receive this timeout error.

✔️ To solve this problem you should ensure that the page you use as your `redirectUri` is not doing any of these things, at the very least, when loaded in a popup or iframe. We recommend using a blank page as your `redirectUri` for silent and popup flows to ensure none of these things can occur.

You can do this on a per request basis, for example:

```javascript
msalInstance.acquireTokenSilent({
    scopes: ["User.Read"],
    redirectUri: "http://localhost:3000/blank.html",
});
```

Remember that you will need to register this new `redirectUri` on your App Registration.

**Notes regarding Angular and React:**

-   If you are using `@azure/msal-angular` your `redirectUri` page should not be protected by the `MsalGuard`.
-   If you are using `@azure/msal-react` your `redirectUri` page should not render the `MsalAuthenticationComponent` or use the `useMsalAuthentication` hook.

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

-   Password reset
-   Profile edit
-   Sign up
-   Some custom policies depending on how they are configured

##### Network Latency

Another potential reason the identity provider may not redirect back to your application in time may be that there is some extra network latency.

✔️ The default timeout is about 10 seconds and should be sufficient in most cases, however, if your identity provider is taking longer than that to redirect you can increase this timeout in the MSAL config with either the `iframeHashTimeout`, `windowHashTimeout` or `loadFrameTimeout` configuration parameters.

```javascript
const msalConfig = {
    auth: {
        clientId: "your-client-id",
    },
    system: {
        windowHashTimeout: 9000, // Applies just to popup calls - In milliseconds
        iframeHashTimeout: 9000, // Applies just to silent calls - In milliseconds
        loadFrameTimeout: 9000, // Applies to both silent and popup calls - In milliseconds
    },
};
```

> [!IMPORTANT]
> Please consult the [Troubleshooting Single-Sign On](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/FAQ.md#troubleshooting-single-sign-on) section of the MSAL Browser FAQ if you are having trouble with the `ssoSilent` API.

### `redirect_in_iframe`
- Redirects are not supported for iframed or brokered applications. Please ensure you are using MSAL.js in a top frame of the window if using the redirect APIs, or use the popup APIs.

### `block_iframe_reload`
- Request was blocked inside an iframe because MSAL detected an authentication response. For more visit: https://aka.ms/msaljs/browser-errors#block_iframe_reload

This error is thrown when calling `ssoSilent` or `acquireTokenSilent` and the page used as your `redirectUri` is attempting to invoke a login or acquireToken function.
Our recommended mitigation for this is to set your `redirectUri` to a blank page that does not implement MSAL when invoking silent APIs. This will also have the added benefit of improving performance as the hidden iframe doesn't need to render your page.

✔️ You can do this on a per request basis, for example:

```javascript
msalInstance.acquireTokenSilent({
    scopes: ["User.Read"],
    redirectUri: "http://localhost:3000/blank.html",
});
```

Remember that you will need to register this new `redirectUri` on your App Registration.

If you do not want to use a dedicated `redirectUri` for this purpose, you should instead ensure that your `redirectUri` is not attempting to call MSAL APIs when rendered inside the hidden iframe used by the silent APIs.

### `block_nested_popups`
- Request was blocked inside a popup because MSAL detected it was running in a popup.

### `iframe_closed_prematurely`
- The iframe being monitored was closed prematurely.

### `silent_logout_unsupported`
- Silent logout not supported. Please call logoutRedirect or logoutPopup instead.

### `no_account_error`
- No account object provided to acquireTokenSilent and no active account has been set. Please call setActiveAccount or provide an account on the request.

### `silent_prompt_value_error`
- The value given for the prompt value is not valid for silent requests - must be set to 'none' or 'no_session'.

### `no_token_request_cache_error`
- No token request found in cache.

### `unable_to_parse_token_request_cache_error`
- The cached token request could not be parsed.

### `auth_request_not_set_error`
- Auth Request not set. Please ensure initiateAuthRequest was called from the InteractionHandler.

### `invalid_cache_type`
- Invalid cache type.

### `non_browser_environment`
- Login and token requests are not supported in non-browser environments.

### `database_not_open`
- Database is not open.

### `no_network_connectivity`
- No network connectivity. Check your internet connection.

### `post_request_failed`
- Network request failed: If the browser threw a CORS error, check that the redirectUri is registered in the Azure App Portal as type 'SPA'.

### `get_request_failed`
- Network request failed. Please check the network trace to determine root cause.

### `failed_to_parse_response`
- Failed to parse network response. Check network trace.

### `unable_to_load_token`
- Error loading token to cache.

### `crypto_key_not_found`
- Cryptographic Key or Keypair not found in browser storage.

### `auth_code_required`
- An authorization code must be provided (as the `code` property on the request) to this flow.

### `auth_code_or_nativeAccountId_required`
- An authorization code or nativeAccountId must be provided to this flow.

### `spa_code_and_nativeAccountId_present`
- Request cannot contain both spa code and native account id.

### `database_unavailable`
- IndexedDB, which is required for persistent cryptographic key storage, is unavailable. This may be caused by browser privacy features which block persistent storage in third-party contexts.

### `unable_to_acquire_token_from_native_platform`
- Unable to acquire token from native platform.

This error is thrown when calling the `acquireTokenByCode` API with the `nativeAccountId` instead of `code` and the app is running in an environment which does not acquire tokens from the native broker. For a list of pre-requisites please review the doc on [device bound tokens](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/device-bound-tokens.md).

### `native_handshake_timeout`
- Timed out while attempting to establish connection to browser extension.

### `native_extension_not_installed`
- Native extension is not installed. If you think this is a mistake call the initialize function.

### `native_connection_not_established`
- Connection to native platform has not been established. Please install a compatible browser extension and run initialize().

This error is thrown when the user signed in with the native broker but no connection to the native broker currently exists. This can happen for the following reasons:

-   The Windows Accounts extension was uninstalled or disabled
-   The `initialize` API has not been called or was not awaited before invoking another MSAL API

### `uninitialized_public_client_application`
- You must call and await the initialize function before attempting to call any other MSAL API.

This error is thrown when a `login`, `acquireToken` or `handleRedirectPromise` API is invoked before the `initialize` API has been called. The `initialize` API must be called and awaited before attempting to acquire tokens.

❌ The following example will throw this error because `handleRedirectPromise` is called before initialize has completed:

```javascript
const msalInstance = new PublicClientApplication({
    auth: {
        clientId: "your-client-id",
    },
    system: {
        allowPlatformBroker: true,
    },
});

await msalInstance.handleRedirectPromise(); // This will throw
msalInstance.acquireTokenSilent(); // This will also throw
```

✔️ To resolve, you should wait for `initialize` to resolve before calling any other MSAL API:

```javascript
const msalInstance = new PublicClientApplication({
    auth: {
        clientId: "your-client-id",
    },
    system: {
        allowPlatformBroker: true,
    },
});

await msalInstance.initialize();
await msalInstance.handleRedirectPromise(); // This will no longer throw this error since initialize completed before this was invoked
msalInstance.acquireTokenSilent(); // This will also no longer throw this error
```

### `native_prompt_not_supported`
- The provided prompt is not supported by the native platform. This request should be routed to the web based flow.

### `invalid_base64_string`
- Invalid base64 encoded string.

### `invalid_pop_token_request`
- Invalid PoP token request. The request should not have both a popKid value and signPopToken set to true.

### `failed_to_build_headers`
- Failed to build request headers object.

### `failed_to_parse_headers`
- Failed to parse response headers.

### `failed_to_decrypt_ear_response`
- Failed to decrypt ear response.

### `storage_not_supported`
- Given storage configuration option was not supported.

### `stubbed_public_client_application_called`
- Stub instance of Public Client Application was called. If using msal-react, please ensure context is not used without a provider.
- See [msal-react errors](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-react/docs/errors.md).

### `in_mem_redirect_unavailable`
- Redirect cannot be supported. In-memory storage was selected and storeAuthStateInCookie=false, which would cause the library to be unable to handle the incoming hash. If you would like to use the redirect API, please use session/localStorage or set storeAuthStateInCookie=true.

### `ContentError`
- Native broker content error.

### `user_switch`
- User attempted to switch accounts in the native broker, which is not allowed. All new accounts must sign-in through the standard web flow first, please try again.

### `unsupported_method`
- This method is not supported in nested app environment.

### Other

Errors not thrown by MSAL, such as server or cache errors.

#### Access to fetch at [url] has been blocked by CORS policy

This error occurs with MSAL.js v2.x and is due to improper configuration during **App Registration** on **Azure Portal**. In particular, you should ensure your `redirectUri` is registered as type: `Single-page application` under the **Authentication** blade in your App Registration. If done successfully, you will see a green checkmark that says:

> Your Redirect URI is eligible for the Authorization Code Flow with PKCE.

![image](https://user-images.githubusercontent.com/5307810/110390912-922fa380-801b-11eb-9e2b-d7aa88ca0687.png)
