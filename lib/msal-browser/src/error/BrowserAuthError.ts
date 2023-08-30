/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError } from "@azure/msal-common";

export type ErrorProperties = {
    code: string,
    desc: string
}

type BrowserAuthErrors = {
    pkceNotGenerated: ErrorProperties,
    cryptoDoesNotExist: ErrorProperties,
    httpMethodNotImplementedError: ErrorProperties,
    emptyNavigateUriError: ErrorProperties,
    hashEmptyError: ErrorProperties,
    hashDoesNotContainStateError: ErrorProperties,
    hashDoesNotContainKnownPropertiesError: ErrorProperties,
    unableToParseStateError: ErrorProperties,
    stateInteractionTypeMismatchError: ErrorProperties,
    interactionInProgress: ErrorProperties,
    popupWindowError: ErrorProperties,
    emptyWindowError: ErrorProperties,
    userCancelledError: ErrorProperties,
    monitorPopupTimeoutError: ErrorProperties,
    monitorIframeTimeoutError: ErrorProperties,
    redirectInIframeError: ErrorProperties,
    blockTokenRequestsInHiddenIframeError: ErrorProperties,
    blockAcquireTokenInPopupsError: ErrorProperties,
    iframeClosedPrematurelyError: ErrorProperties,
    silentLogoutUnsupportedError: ErrorProperties,
    noAccountError: ErrorProperties,
    silentPromptValueError: ErrorProperties,
    noTokenRequestCacheError: ErrorProperties,
    unableToParseTokenRequestCacheError: ErrorProperties,
    noCachedAuthorityError: ErrorProperties,
    authRequestNotSet: ErrorProperties,
    invalidCacheType: ErrorProperties,
    notInBrowserEnvironment: ErrorProperties,
    databaseNotOpen: ErrorProperties,
    noNetworkConnectivity: ErrorProperties,
    postRequestFailed: ErrorProperties,
    getRequestFailed: ErrorProperties,
    failedToParseNetworkResponse: ErrorProperties,
    unableToLoadTokenError: ErrorProperties,
    signingKeyNotFoundInStorage: ErrorProperties,
    authCodeRequired: ErrorProperties,
    authCodeOrNativeAccountRequired: ErrorProperties,
    spaCodeAndNativeAccountPresent: ErrorProperties,
    databaseUnavailable: ErrorProperties,
    unableToAcquireTokenFromNativePlatform: ErrorProperties,
    nativeHandshakeTimeout: ErrorProperties,
    nativeExtensionNotInstalled: ErrorProperties,
    nativeConnectionNotEstablished: ErrorProperties,
    uninitializedPublicClientApplication: ErrorProperties,
    nativePromptNotSupported: ErrorProperties,
}

/**
 * BrowserAuthErrorMessage class containing string constants used by error codes and messages.
 */
export const BrowserAuthErrorMessage: BrowserAuthErrors = {
    pkceNotGenerated: {
        code: "pkce_not_created",
        desc: "The PKCE code challenge and verifier could not be generated.",
    },
    cryptoDoesNotExist: {
        code: "crypto_nonexistent",
        desc: "The crypto object or function is not available.",
    },
    emptyNavigateUriError: {
        code: "empty_navigate_uri",
        desc: "Navigation URI is empty. Please check stack trace for more info.",
    },
    hashEmptyError: {
        code: "hash_empty_error",
        desc: "Hash value cannot be processed because it is empty. Please verify that your redirectUri is not clearing the hash. For more visit: aka.ms/msaljs/browser-errors.",
    },
    hashDoesNotContainStateError: {
        code: "no_state_in_hash",
        desc: "Hash does not contain state. Please verify that the request originated from msal.",
    },
    hashDoesNotContainKnownPropertiesError: {
        code: "hash_does_not_contain_known_properties",
        desc: "Hash does not contain known properites. Please verify that your redirectUri is not changing the hash. For more visit: aka.ms/msaljs/browser-errors.",
    },
    unableToParseStateError: {
        code: "unable_to_parse_state",
        desc: "Unable to parse state. Please verify that the request originated from msal.",
    },
    stateInteractionTypeMismatchError: {
        code: "state_interaction_type_mismatch",
        desc: "Hash contains state but the interaction type does not match the caller.",
    },
    interactionInProgress: {
        code: "interaction_in_progress",
        desc: "Interaction is currently in progress. Please ensure that this interaction has been completed before calling an interactive API.  For more visit: aka.ms/msaljs/browser-errors.",
    },
    popupWindowError: {
        code: "popup_window_error",
        desc: "Error opening popup window. This can happen if you are using IE or if popups are blocked in the browser.",
    },
    emptyWindowError: {
        code: "empty_window_error",
        desc: "window.open returned null or undefined window object.",
    },
    userCancelledError: {
        code: "user_cancelled",
        desc: "User cancelled the flow.",
    },
    monitorPopupTimeoutError: {
        code: "monitor_window_timeout",
        desc: "Token acquisition in popup failed due to timeout. For more visit: aka.ms/msaljs/browser-errors.",
    },
    monitorIframeTimeoutError: {
        code: "monitor_window_timeout",
        desc: "Token acquisition in iframe failed due to timeout. For more visit: aka.ms/msaljs/browser-errors.",
    },
    redirectInIframeError: {
        code: "redirect_in_iframe",
        desc: "Redirects are not supported for iframed or brokered applications. Please ensure you are using MSAL.js in a top frame of the window if using the redirect APIs, or use the popup APIs.",
    },
    blockTokenRequestsInHiddenIframeError: {
        code: "block_iframe_reload",
        desc: "Request was blocked inside an iframe because MSAL detected an authentication response. For more visit: aka.ms/msaljs/browser-errors",
    },
    blockAcquireTokenInPopupsError: {
        code: "block_nested_popups",
        desc: "Request was blocked inside a popup because MSAL detected it was running in a popup.",
    },
    iframeClosedPrematurelyError: {
        code: "iframe_closed_prematurely",
        desc: "The iframe being monitored was closed prematurely.",
    },
    silentLogoutUnsupportedError: {
        code: "silent_logout_unsupported",
        desc: "Silent logout not supported. Please call logoutRedirect or logoutPopup instead.",
    },
    noAccountError: {
        code: "no_account_error",
        desc: "No account object provided to acquireTokenSilent and no active account has been set. Please call setActiveAccount or provide an account on the request.",
    },
    silentPromptValueError: {
        code: "silent_prompt_value_error",
        desc: "The value given for the prompt value is not valid for silent requests - must be set to 'none' or 'no_session'.",
    },
    noTokenRequestCacheError: {
        code: "no_token_request_cache_error",
        desc: "No token request found in cache.",
    },
    unableToParseTokenRequestCacheError: {
        code: "unable_to_parse_token_request_cache_error",
        desc: "The cached token request could not be parsed.",
    },
    noCachedAuthorityError: {
        code: "no_cached_authority_error",
        desc: "No cached authority found.",
    },
    authRequestNotSet: {
        code: "auth_request_not_set_error",
        desc: "Auth Request not set. Please ensure initiateAuthRequest was called from the InteractionHandler",
    },
    invalidCacheType: {
        code: "invalid_cache_type",
        desc: "Invalid cache type",
    },
    notInBrowserEnvironment: {
        code: "non_browser_environment",
        desc: "Login and token requests are not supported in non-browser environments.",
    },
    databaseNotOpen: {
        code: "database_not_open",
        desc: "Database is not open!",
    },
    noNetworkConnectivity: {
        code: "no_network_connectivity",
        desc: "No network connectivity. Check your internet connection.",
    },
    postRequestFailed: {
        code: "post_request_failed",
        desc: "Network request failed: If the browser threw a CORS error, check that the redirectUri is registered in the Azure App Portal as type 'SPA'",
    },
    getRequestFailed: {
        code: "get_request_failed",
        desc: "Network request failed. Please check the network trace to determine root cause.",
    },
    failedToParseNetworkResponse: {
        code: "failed_to_parse_response",
        desc: "Failed to parse network response. Check network trace.",
    },
    unableToLoadTokenError: {
        code: "unable_to_load_token",
        desc: "Error loading token to cache.",
    },
    signingKeyNotFoundInStorage: {
        code: "crypto_key_not_found",
        desc: "Cryptographic Key or Keypair not found in browser storage.",
    },
    authCodeRequired: {
        code: "auth_code_required",
        desc: "An authorization code must be provided (as the `code` property on the request) to this flow.",
    },
    authCodeOrNativeAccountRequired: {
        code: "auth_code_or_nativeAccountId_required",
        desc: "An authorization code or nativeAccountId must be provided to this flow.",
    },
    spaCodeAndNativeAccountPresent: {
        code: "spa_code_and_nativeAccountId_present",
        desc: "Request cannot contain both spa code and native account id.",
    },
    databaseUnavailable: {
        code: "database_unavailable",
        desc: "IndexedDB, which is required for persistent cryptographic key storage, is unavailable. This may be caused by browser privacy features which block persistent storage in third-party contexts.",
    },
    unableToAcquireTokenFromNativePlatform: {
        code: "unable_to_acquire_token_from_native_platform",
        desc: "Unable to acquire token from native platform. For a list of possible reasons visit aka.ms/msaljs/browser-errors.",
    },
    nativeHandshakeTimeout: {
        code: "native_handshake_timeout",
        desc: "Timed out while attempting to establish connection to browser extension",
    },
    nativeExtensionNotInstalled: {
        code: "native_extension_not_installed",
        desc: "Native extension is not installed. If you think this is a mistake call the initialize function.",
    },
    nativeConnectionNotEstablished: {
        code: "native_connection_not_established",
        desc: "Connection to native platform has not been established. Please install a compatible browser extension and run initialize(). For more please visit aka.ms/msaljs/browser-errors.",
    },
    uninitializedPublicClientApplication: {
        code: "uninitialized_public_client_application",
        desc: "You must call and await the initialize function before attempting to call any other MSAL API. For more please visit aka.ms/msaljs/browser-errors.",
    },
    nativePromptNotSupported: {
        code: "native_prompt_not_supported",
        desc: "The provided prompt is not supported by the native platform. This request should be routed to the web based flow.",
    },
};

/**
 * Browser library error class thrown by the MSAL.js library for SPAs
 */
export class BrowserAuthError extends AuthError {
    constructor(errorCode: string, errorMessage?: string) {
        super(errorCode, errorMessage);

        Object.setPrototypeOf(this, BrowserAuthError.prototype);
        this.name = "BrowserAuthError";
    }

    static create(error: ErrorProperties): BrowserAuthError {
        return new BrowserAuthError(error.code, error.desc);
    }
}
