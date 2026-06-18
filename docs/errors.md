# MSAL.js errors

## Auth errors

### `unexpected_error`

-   Unexpected error in authentication.

### `post_request_failed`

-   Post request failed from the network, could be a 4xx/5xx or a network unavailability. Please check the exact error code for details.

## Cache errors

### `cache_quota_exceeded`

-   Exceeded cache storage capacity.

This error occurs when MSAL.js surpasses the allotted storage limit when attempting to save token information in the [configured cache storage](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-browser/docs/caching.md#cache-storage). See [here](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria#web_storage) for web storage limits.

**Mitigation**:

1. Make sure the configured cache storage has enough capacity to allow MSAL.js to persist token payload. The amount of cache storage required depends on the number of [cached artifacts](./caching.md#cached-artifacts).

### `cache_error_unknown`

-   An unknown error occurred while accessing the browser cache.

## Client auth errors

### `client_info_decoding_error`

-   The client info could not be parsed/decoded correctly.

### `client_info_empty_error`

-   The client info was empty.

### `token_parsing_error`

-   Token cannot be parsed.

### `null_or_empty_token`

-   The token is null or empty.

### `endpoints_resolution_error`

-   Could not resolve endpoints. Please check network and try again.

### `network_error`

-   Network request failed. Please check network and try again.

### `openid_config_error`

-   Could not retrieve endpoints. Check your authority and verify the .well-known/openid-configuration endpoint returns the required endpoints.

### `hash_not_deserialized`

-   The hash parameters could not be deserialized.

### `invalid_state`

-   State was not the expected format.

### `state_mismatch`

-   State mismatch error.

### `state_not_found`

-   State not found.

### `nonce_mismatch`

-   Nonce mismatch error.

### `auth_time_not_found`

-   **Deprecated:** No longer thrown. MSAL no longer validates token `max_age` and this error code will be removed in a future major version. Previously thrown when `maxAge` was requested but the ID token was missing the `auth_time` claim.

### `max_age_transpired`

-   **Deprecated:** No longer thrown. MSAL no longer validates token `max_age` and this error code will be removed in a future major version. Previously thrown when `maxAge` was set to 0, or too much time had elapsed since the last end-user authentication.

### `multiple_matching_tokens`

-   The cache contains multiple tokens satisfying the requirements. Call AcquireToken again providing more requirements such as authority or account.

### `multiple_matching_appMetadata`

-   The cache contains multiple appMetadata satisfying the given parameters. Please pass more info to obtain the correct appMetadata.

### `request_cannot_be_made`

-   Token request cannot be made without authorization code or refresh token.

### `cannot_remove_empty_scope`

-   Cannot remove null or empty scope from ScopeSet.

### `cannot_append_scopeset`

-   Cannot append ScopeSet.

### `empty_input_scopeset`

-   Empty input ScopeSet cannot be processed.

### `no_account_in_silent_request`

-   Please pass an account object, silent flow is not supported without account information.

### `invalid_cache_record`

-   Cache record object was null or undefined.

### `invalid_cache_environment`

-   Invalid environment when attempting to create cache entry.

### `no_account_found`

-   No account found in cache for given key.

### `no_crypto_object`

-   No crypto object detected.

### `unexpected_credential_type`

-   Unexpected credential type.

### `token_refresh_required`

-   Cannot return token from cache because it must be refreshed. This may be due to one of the following reasons: forceRefresh parameter is set to true, claims have been requested, there is no cached access token or it is expired.

### `token_claims_cnf_required_for_signedjwt`

-   Cannot generate a POP jwt if the token_claims are not populated.

### `authorization_code_missing_from_server_response`

-   Server response does not contain an authorization code to proceed.

### `binding_key_not_removed`

-   Could not remove the credential's binding key from storage.

### `end_session_endpoint_not_supported`

-   The provided authority does not support logout.

### `key_id_missing`

-   A keyId value is missing from the requested bound token's cache record and is required to match the token to its stored binding key.

### `no_network_connectivity`

-   No network connectivity. Check your internet connection.

### `user_canceled`

-   User cancelled the flow.

### `method_not_implemented`

-   This method has not been implemented.

### `nested_app_auth_bridge_disabled`

-   The nested app auth bridge is disabled.

### `platform_broker_error`
-   An error occurred in the native broker. When this error is thrown, check the `platformBrokerError` property on the error object for detailed information.

### `empty_fic_assertion`

-   The assertion provided to `acquireTokenByUserFederatedIdentityCredential` is empty. A non-empty assertion (typically an instance token from Leg 2 of the agent identity protocol) is required.

### `conflicting_user_identifiers`

-   Both `userObjectId` and `username` were provided to `acquireTokenByUserFederatedIdentityCredential`. Only one user identifier should be specified.

### `missing_user_identifier`

-   Neither `userObjectId` nor `username` was provided to `acquireTokenByUserFederatedIdentityCredential`. Exactly one user identifier is required.

## Client configuration errors

### `redirect_uri_empty`

-   A redirect URI is required for all calls and none has been set.

### `claims_request_parsing_error`

-   Could not parse the given claims request object.

### `authority_uri_insecure`

-   Authority URIs must use https. Please see here for valid authority configuration options: https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-js-initializing-client-applications#configuration-options.

### `url_parse_error`

-   URL could not be parsed into appropriate segments.

### `empty_url_error`

-   URL was empty or null.

### `empty_input_scopes_error`

-   Scopes cannot be passed as null, undefined or empty array because they are required to obtain an access token.

### `invalid_prompt_value`

-   Invalid prompt value. Please see here for valid configuration options: https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_common.html#commonauthorizationurlrequest

### `invalid_claims`

-   Given claims parameter must be a stringified JSON object.

### `token_request_empty`

-   Token request was empty and not found in cache.

### `logout_request_empty`

-   The logout request was null or undefined.

### `invalid_code_challenge_method`

-   code_challenge_method passed is invalid. Valid values are "plain" and "S256".

### `pkce_params_missing`

-   Both params: code_challenge and code_challenge_method are to be passed if to be sent in the request.

### `invalid_cloud_discovery_metadata`

-   Invalid cloudDiscoveryMetadata provided. Must be a stringified JSON object containing tenant_discovery_endpoint and metadata fields.

### `invalid_authority_metadata`

-   Invalid authorityMetadata provided. Must by a stringified JSON object containing authorization_endpoint, token_endpoint, and issuer fields.

### `untrusted_authority`

-   The provided authority is not a trusted authority. Please include this authority in the knownAuthorities config parameter.

### `missing_ssh_jwk`

-   Missing sshJwk in SSH certificate request. A stringified JSON Web Key is required when using the SSH authentication scheme.

### `missing_ssh_kid`

-   Missing sshKid in SSH certificate request. A string that uniquely identifies the public SSH key is required when using the SSH authentication scheme.

### `missing_nonce_authentication_header`

-   Unable to find an authentication header containing server nonce. Either the Authentication-Info or WWW-Authenticate headers must be present in order to obtain a server nonce.

### `invalid_authentication_header`

-   Invalid authentication header provided.

### `cannot_set_OIDCOptions`

-   Cannot set OIDCOptions parameter. Please change the protocol mode to OIDC or use a non-Microsoft authority.

### `cannot_allow_platform_broker`

-   Cannot set allowPlatformBroker parameter to true when not in AAD protocol mode.

### `invalid_platform_broker_configuration`

-   Invalid platform broker configuration. `allowPlatformBrokerWithDOM` requires `allowPlatformBroker` to also be set to `true`.

### `authority_mismatch`

-   Authority mismatch error. Authority provided in login request or PublicClientApplication config does not match the environment of the provided account. Please use a matching account or make an interactive request to login to this authority.

### `invalid_request_method_for_EAR`
- The EAR protocol cannot be used with HTTP method `GET`. The `httpMethod` parameter in all requests using `protocolMode: ProtocolMode.EAR` must be either unset or `"POST"`/`HttpMethod.POST`.

### `issuer_validation_failed`
- Issuer returned from OpenID configuration endpoint does not match with the authority configured by the application.

## Interaction required errors

### `no_tokens_found`

-   No refresh token found in the cache. Please sign-in.

### `native_account_unavailable`

-   The requested account is not available in the native broker. It may have been deleted or logged out. Please sign-in again using an interactive API.

### `refresh_token_expired`

-   Refresh token has expired.

### `interaction_required`

-   User interaction is required.

### `consent_required`

-   User consent is required.

### `login_required`

-   User login is required.

### `bad_token`

-   Identity provider returned bad_token due to an expired or invalid refresh token. Please invoke an interactive API to resolve.

### `ui_not_allowed`

-   `canShowUI` flag in Edge was set to false. User interaction required on web page. Please invoke an interactive API to resolve.

### `interrupted_user`

-   The user could not be authenticated due to an interrupted state. Please invoke an interactive API to resolve.

## JOSE header errors

### `missing_kid_error`

-   The JOSE Header for the requested JWT, JWS or JWK object requires a keyId to be configured as the 'kid' header claim. No 'kid' value was provided.

### `missing_alg_error`

-   The JOSE Header for the requested JWT, JWS or JWK object requires an algorithm to be specified as the 'alg' header claim. No 'alg' value was provided.

## Browser auth errors

### `pkce_not_created`

-   The PKCE code challenge and verifier could not be generated.

### `ear_jwk_empty`

-   No EAR encryption key provided. This is unexpected.

### `ear_jwe_empty`

-   Server response does not contain ear_jwe property. This is unexpected.

### `crypto_nonexistent`

-   The crypto object or function is not available.

### `empty_navigate_uri`

-   Navigation URI is empty. Please check stack trace for more info.

### `hash_empty_error`

-   Hash value cannot be processed because it is empty. Please verify that your redirectUri is not clearing the hash.

This error occurs when the page you use as your redirectUri is removing the hash, or auto-redirecting to another page. This most commonly happens when the application implements a router which navigates to another route, dropping the hash.

To resolve this error we recommend using a dedicated redirectUri page that implements the MSAL redirect bridge. This page should not include any router logic that could interfere with hash handling. For detailed setup instructions, see the [redirectUri considerations](../lib/msal-browser/docs/login-user.md#redirecturi-considerations). Please make sure the router does not navigate while MSAL token acquisition is in progress. You can do this by detecting if your application is loaded in an iframe for silent calls, in a popup for popup calls or by awaiting `handleRedirectPromise` for redirect calls.

### `no_state_in_hash`

-   Hash does not contain state. Please verify that the request originated from MSAL.

### `hash_does_not_contain_known_properties`

-   Hash does not contain known properties. Please verify that your redirectUri is not changing the hash.

Please see explanation for [hash_empty_error](#hash_empty_error) above. The root cause for this error is similar, the difference being the hash has been changed, rather than dropped.

### `unable_to_parse_state`

-   Unable to parse state. Please verify that the request originated from MSAL.

#### Sub-errors

##### `missing_library_state`

-   Missing state 'id' and/or 'meta' attributes.

### `state_interaction_type_mismatch`

-   Hash contains state but the interaction type does not match the caller.

### `interaction_in_progress`

-   Interaction is currently in progress. Please ensure that this interaction has been completed before calling an interactive API.

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

If you are not using any of the wrapper libraries but concerned that your application might trigger concurrent interactive requests, you should check if any other interaction is in progress prior to invoking an interaction in your token acquisition method. You can achieve this by implementing a global application state or a broadcast service etc. that emits the current MSAL interaction status via [MSAL Events API](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-browser/docs/events.md).

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

### `interaction_in_progress_cancelled`

-   The current interaction was cancelled by a new interaction request with `overrideInteractionInProgress` set to `true`.

This error is thrown when an existing popup interaction is cancelled because a new popup request was initiated with the `overrideInteractionInProgress` flag set to `true`. This is not necessarily an error condition - it indicates that the previous interaction was intentionally cancelled to allow a new one to proceed.

**When This Occurs:**

This error is thrown for the **previous/cancelled** interaction when:
1. A popup interaction is in progress (e.g., `acquireTokenPopup`)
2. A new popup request is made with `overrideInteractionInProgress: true`
3. The library cancels the pending interaction and starts the new one

**Example:**

```javascript
// First popup request starts
const request1 = { scopes: ["User.Read"] };
const promise1 = msalInstance.acquireTokenPopup(request1);

// User closes the popup or something goes wrong
// App decides to retry with override flag
const request2 = {
    scopes: ["User.Read"],
    overrideInteractionInProgress: true  // Override the previous interaction
};
const promise2 = msalInstance.acquireTokenPopup(request2);

// promise1 will reject with interaction_in_progress_cancelled
// promise2 will proceed normally
```

**Note:** This error should only be seen when you explicitly use the `overrideInteractionInProgress` flag. Under normal circumstances, concurrent interaction attempts will throw `interaction_in_progress` instead.

### `popup_window_error`

-   Error opening popup window. This can happen if you are using IE or if popups are blocked in the browser.

### `empty_window_error`

-   window.open returned null or undefined window object.

### `user_cancelled`

-   User cancelled the flow.


### `redirect_bridge_empty_response`

-   The redirect bridge returned an empty response, indicating the redirect bridge script may have been modified or replaced.

### `redirect_in_iframe`

-   Redirects are not supported for iframed or brokered applications. Please ensure you are using MSAL.js in a top frame of the window if using the redirect APIs, or use the popup APIs.

### `block_iframe_reload`

-   Request was blocked inside an iframe because MSAL detected an authentication response.

This error is thrown when calling `ssoSilent` or `acquireTokenSilent` and the page used as your `redirectUri` is attempting to invoke a login or acquireToken function.
Our recommended mitigation for this is to set your `redirectUri` to a dedicated page that implements the MSAL redirect bridge and does not invoke any MSAL APIs. This will also have the added benefit of improving performance as the hidden iframe doesn't need to render your page. For setup instructions, see [RedirectUri Considerations](../lib/msal-browser/docs/login-user.md#redirecturi-considerations).

✔️ You can do this on a per request basis, for example:

```javascript
msalInstance.acquireTokenSilent({
    scopes: ["User.Read"],
    redirectUri: "http://localhost:3000/redirect",
});
```

Remember that you will need to register this new `redirectUri` on your App Registration.

If you do not want to use a dedicated `redirectUri` for this purpose, you should instead ensure that your `redirectUri` is not attempting to call MSAL APIs when rendered inside the hidden iframe used by the silent APIs.

### `block_nested_popups`

-   Request was blocked inside a popup because MSAL detected it was running in a popup.

### `iframe_closed_prematurely`

-   The iframe being monitored was closed prematurely.

### `silent_logout_unsupported`

-   Silent logout not supported. Please call logoutRedirect or logoutPopup instead.

### `no_account_error`

-   No account object provided to acquireTokenSilent and no active account has been set. Please call setActiveAccount or provide an account on the request.

### `silent_prompt_value_error`

-   The value given for the prompt value is not valid for silent requests - must be set to 'none' or 'no_session'.

### `no_token_request_cache_error`

-   No token request found in cache.

### `unable_to_parse_token_request_cache_error`

-   The cached token request could not be parsed.

### `auth_request_not_set_error`

-   Auth Request not set. Please ensure initiateAuthRequest was called from the InteractionHandler.

### `invalid_cache_type`

-   Invalid cache type.

### `non_browser_environment`

-   Login and token requests are not supported in non-browser environments.

### `database_not_open`

-   Database is not open.

### `no_network_connectivity`

-   No network connectivity. Check your internet connection.

### `post_request_failed`

-   Network request failed: If the browser threw a CORS error, check that the redirectUri is registered in the Azure App Portal as type 'SPA'.

### `get_request_failed`

-   Network request failed. Please check the network trace to determine root cause.

### `failed_to_parse_response`

-   Failed to parse network response. Check network trace.

### `unable_to_load_token`

-   Error loading token to cache.

### `crypto_key_not_found`

-   Cryptographic Key or Keypair not found in browser storage.

### `auth_code_required`

-   An authorization code must be provided (as the `code` property on the request) to this flow.

### `auth_code_or_nativeAccountId_required`

-   An authorization code or nativeAccountId must be provided to this flow.

### `spa_code_and_nativeAccountId_present`

-   Request cannot contain both spa code and native account id.

### `database_unavailable`

-   IndexedDB, which is required for persistent cryptographic key storage, is unavailable. This may be caused by browser privacy features which block persistent storage in third-party contexts.

### `unable_to_acquire_token_from_native_platform`

-   Unable to acquire token from native platform.

This error is thrown when calling the `acquireTokenByCode` API with the `nativeAccountId` instead of `code` and the app is running in an environment which does not acquire tokens from the native broker. For a list of pre-requisites please review the doc on [device bound tokens](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/device-bound-tokens.md).

### `native_handshake_timeout`

-   Timed out while attempting to establish connection to browser extension.

### `native_extension_not_installed`

-   Native extension is not installed. If you think this is a mistake call the initialize function.

### `native_connection_not_established`

-   Connection to native platform has not been established. Please install a compatible browser extension and run initialize().

This error is thrown when the user signed in with the native broker but no connection to the native broker currently exists. This can happen for the following reasons:

-   The Windows Accounts extension was uninstalled or disabled
-   The `initialize` API has not been called or was not awaited before invoking another MSAL API

### `uninitialized_public_client_application`

-   You must call and await the initialize function before attempting to call any other MSAL API.

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

-   The provided prompt is not supported by the native platform. This request should be routed to the web based flow.

### `invalid_base64_string`

-   Invalid base64 encoded string.

### `invalid_pop_token_request`

-   Invalid PoP token request. The request should not have both a popKid value and signPopToken set to true.

### `failed_to_build_headers`

-   Failed to build request headers object.

### `failed_to_parse_headers`

-   Failed to parse response headers.

### `failed_to_decrypt_ear_response`

-   Failed to decrypt ear response.

### `timed_out`

-   The request failed to complete within the configured timeout. Review logs and network traces to identify potential causes. Retrying the request once or increasing the configured timeout may sometimes resolve timeouts caused by general runtime or network latency.

#### acquireTokenRedirect timed out

If this error is thrown from `acquireTokenRedirect` it means your application failed to redirect to your identity provider's /authorize endpoint in time. Review the network trace to identify potential causes.

#### redirect_bridge_timeout (suberror)

**Error Code**: `timed_out`
**SubError**: `redirect_bridge_timeout`

Communication with the redirect page (popup or iframe) timed out while waiting for authentication response.

**Error Messages**:

- Token acquisition in popup failed due to timeout.
- Token acquisition in iframe failed due to timeout.

This suberror is thrown when calling `ssoSilent`, `acquireTokenSilent`, `acquireTokenPopup` or `loginPopup` when the redirect bridge script fails to send the authentication response back to the main window within the configured timeout period.

**What is the redirect bridge?**

The redirect bridge is a mechanism that enables authentication flows in COOP (Cross-Origin-Opener-Policy) enabled applications. When COOP headers are present, popup and iframe windows cannot directly communicate with the main application window. The redirect bridge solves this by using the BroadcastChannel API to transmit authentication responses from the redirect page back to the main window. For more details on COOP support and the redirect bridge, see the [COOP Migration Guide](../lib/msal-browser/docs/v4-migration.md#cross-origin-opener-policy-coop-support).

**Common Causes:**

This timeout typically occurs for the following reasons:

1. The page you use as your `redirectUri` is not loading the redirect bridge script (either via the ESM import from `@azure/msal-browser/redirect-bridge` or the UMD bundle `msal-redirect-bridge(.min).js`)
1. The redirect page is removing or manipulating the URL hash before the bridge script can process it
1. The redirect page is automatically navigating to a different page before the bridge can communicate the response
1. Your identity provider is being slow to redirect back to your `redirectUri` (network latency)
1. You are being throttled by your identity provider due to too many requests in a short period

**Resolution Steps:**

✔️ **Ensure the redirect bridge script is loaded:**

Your `redirectUri` page must include the redirect bridge script to enable communication back to the main window.

**Option A — ESM (recommended for apps using a bundler such as Vite or Webpack):**

```html
<!DOCTYPE html>
<html>
<head>
    <title>Redirect</title>
</head>
<body>
    <script type="module">
        import { broadcastResponseToMainFrame } from "@azure/msal-browser/redirect-bridge";
        broadcastResponseToMainFrame().catch(console.error);
    </script>
</body>
</html>
```

**Option B — UMD (for static pages served without a bundler):**

Copy `msal-redirect-bridge.min.js` from `node_modules/@azure/msal-browser/lib/redirect-bridge/` to your public directory, then reference it directly:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Redirect</title>
</head>
<body>
    <script src="/msal-redirect-bridge.min.js"></script>
    <script>
        msalRedirectBridge.broadcastResponseToMainFrame().catch(console.error);
    </script>
</body>
</html>
```

For framework-specific setup instructions (Angular, React, Next.js, Vite, Webpack), see the [redirect bridge guide](../lib/msal-browser/docs/redirect-bridge.md).

**Important**: If your application uses a router library (e.g. React Router, Angular Router), please make sure it does not strip the hash or auto-redirect while MSAL token acquisition is in progress. If possible, it is best if your `redirectUri` page does not invoke the router at all.

**Issues caused by the redirectUri page:**

When you make a silent call, in some cases, an iframe will be opened and will navigate to your identity provider's authorization page. After the identity provider has authorized the user it will redirect the iframe back to the `redirectUri` with the authorization code or error information in the hash fragment. The MSAL redirect bridge running in the iframe will broadcast response to MSAL instance running in the frame or window that originally made the request. If your `redirectUri` is removing or manipulating this hash or navigating to a different page before MSAL redirect bridge has extracted it you will receive this timeout error.

✔️ To solve this problem you should ensure that the page you use as your `redirectUri` is not doing any of these things.

Remember that you will need to register `redirectUri` on your App Registration. We recommend using one of the HTML snippets above as the content for your registered redirect page.

**Notes regarding Angular and React:**

-   If you are using `@azure/msal-angular` your `redirectUri` page should not be protected by the `MsalGuard`.
-   If you are using `@azure/msal-react` your `redirectUri` page should not render the `MsalAuthenticationComponent` or use the `useMsalAuthentication` hook.

**Issues caused by the Identity Provider:**

**Throttling:**

One of the most common reasons this error can be thrown is that your application has gotten stuck in a loop or made too many token requests in a short amount of time. When this happens the identity provider may throttle subsequent requests for a short time which will result in not being redirected back to your `redirectUri` and ultimately this error.

✔️ To resolve throttling based issues you have 2 options:

1. Stop making requests for a short time before trying again.
1. Invoke an interactive API, such as `acquireTokenPopup` or `acquireTokenRedirect`.

**X-Frame-Options Deny:**

You can also get this error if the Identity Provider fails to redirect back to your application. In silent scenarios this error is sometimes accompanied by an X-Frame-Options: Deny error indicating that your identity provider is attempting to either show you an error message or is expecting interaction.

✔️ The X-Frame-Options error will usually have a url in it and opening this url in a new tab may help you discern what is happening. If interaction is required consider using an interactive API instead. If an error is being displayed, address the error.

Some B2C flows are expected to throw this error due to their need for user interaction. These flows include:

-   Password reset
-   Profile edit
-   Sign up
-   Some custom policies depending on how they are configured

**Network Latency:**

Another potential reason the identity provider may not redirect back to your application in time may be that there is some extra network latency.

✔️ The default timeout is about 10 seconds and should be sufficient in most cases, however, if your identity provider is taking longer than that to redirect, you can increase this timeout in the MSAL config with either the `iframeBridgeTimeout` (for aquireTokenSilent() or ssoSilent()) or `popupBridgeTimeout` (acquireTokenPopup()) configuration parameters.

```javascript
const msalConfig = {
    auth: {
        clientId: "your-client-id",
    },
    system: {
        popupBridgeTimeout: 50000, // Applies just to popup calls - In milliseconds
        iframeBridgeTimeout: 9000, // Applies just to silent calls - In milliseconds
    },
};
```

> [!IMPORTANT]
> Please consult the [Troubleshooting Single-Sign On](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/FAQ.md#troubleshooting-single-sign-on) section of the MSAL Browser FAQ if you are having trouble with the `ssoSilent` API.

### `resource_parameter_required`

-   `isMcp` is set as `true` in the configuration, yet the request does not have a `resource` parameter. See the MCP documentation for [msal-browser](../lib/msal-browser/docs/mcp.md) or [msal-node](../lib/msal-node/docs/mcp.md).

### `misplaced_resource_parameter`

-   A resource was found both directly in the `resource` parameter and in `extraQueryParameters` or `extraParameters`. Please only include the resource in one location. See the MCP documentation for [msal-browser](../lib/msal-browser/docs/mcp.md) or [msal-node](../lib/msal-node/docs/mcp.md).

## Browser configuration errors

### `storage_not_supported`

-   Given storage configuration option was not supported.

### `stubbed_public_client_application_called`

-   Stub instance of Public Client Application was called. If using msal-react, please ensure context is not used without a provider.
-   See [msal-react errors](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-react/docs/errors.md).

### `in_mem_redirect_unavailable`

-   Redirect cannot be supported. In-memory storage was selected and storeAuthStateInCookie=false, which would cause the library to be unable to handle the incoming hash. If you would like to use the redirect API, please use session/localStorage or set storeAuthStateInCookie=true.

## Native auth errors

### `ContentError`

-   Platform broker flow, error in the context script for extension.

### `PageException`

-   Platform broker flow, error as there is an exception on the page in the extension.

### `user_switch`

-   User attempted to switch accounts in the native broker, which is not allowed. All new accounts must sign-in through the standard web flow first, please try again.

### `unsupported_method`

-   This method is not supported in nested app environment.

## Custom Authentication errors

### HTTP errors

#### `no_network_connectivity`

-   No network connectivity. Check your internet connection.

#### `failed_send_request`

-   Failed to send HTTP request to the server.

### Configuration errors

#### `missing_configuration`

-   Required configuration is missing for the custom authentication flow.

#### `invalid_authority`

-   The provided authority URL is invalid or not supported for custom authentication.

#### `invalid_challenge_type`

-   The challenge type specified in the configuration is not supported.

### URL parsing errors

#### `invalid_url`

-   The provided URL could not be parsed or is malformed.

### User account attribute errors

#### `invalid_attribute`

-   One or more user account attributes provided are invalid or malformed.

### API errors

#### `continuation_token_missing`

-   The continuation token required for the next step in the authentication flow is missing.

#### `invalid_response_body`

-   The response body from the authentication server is invalid or malformed.

#### `empty_response`

-   The server returned an empty response when data was expected.

#### `unsupported_challenge_type`

-   The challenge type provided is not supported.

#### `access_token_missing`

-   The access token is missing from the authentication response.

#### `id_token_missing`

-   The ID token is missing from the authentication response.

#### `refresh_token_missing`

-   The refresh token is missing from the authentication response.

#### `invalid_expires_in`

-   The token expiration time (expires_in) value is invalid.

#### `invalid_token_type`

-   The token type returned by the server is not supported.

#### `http_request_failed`

-   The HTTP request to the authentication server failed.

#### `invalid_request`

-   The authentication request is malformed or contains invalid parameters.

#### `user_not_found`

-   The specified user could not be found.

#### `invalid_grant`

-   The authorization grant provided is invalid, expired, or revoked.

#### `credential_required`

-   User credentials are required to complete the authentication flow.

#### `attributes_required`

-   Additional user attributes are required to complete the authentication flow.

#### `user_already_exists`

-   A user with the specified identifier already exists.

#### `invalid_poll_status`

-   The polling status returned by the server is invalid.

#### `password_change_failed`

-   The password change operation failed.

#### `password_reset_timeout`

-   The password reset operation timed out.

#### `client_info_missing`

-   Client information is missing from the authentication response.

#### `expired_token`

-   The provided token has expired and cannot be used.

#### `access_denied`
- The authentication method verification failed because access was denied.

## Other

Errors not thrown by MSAL, such as server or cache errors.

### Access to fetch at [url] has been blocked by CORS policy

This error occurs with MSAL.js v2.x and is due to improper configuration during **App Registration** on **Azure Portal**. In particular, you should ensure your `redirectUri` is registered as type: `Single-page application` under the **Authentication** blade in your App Registration. If done successfully, you will see a green checkmark that says:

> Your Redirect URI is eligible for the Authorization Code Flow with PKCE.

![image](https://user-images.githubusercontent.com/5307810/110390912-922fa380-801b-11eb-9e2b-d7aa88ca0687.png)
