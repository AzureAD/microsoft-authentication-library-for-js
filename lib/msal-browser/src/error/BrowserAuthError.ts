/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError, StringUtils } from "@azure/msal-common";

/**
 * BrowserAuthErrorMessage class containing string constants used by error codes and messages.
 */
export const BrowserAuthErrorMessage = {
    pkceNotGenerated: {
        code: "pkce_not_created",
        desc: "The PKCE code challenge and verifier could not be generated."
    },
    cryptoDoesNotExist: {
        code: "crypto_nonexistent",
        desc: "The crypto object or function is not available."
    },
    httpMethodNotImplementedError: {
        code: "http_method_not_implemented",
        desc: "The HTTP method given has not been implemented in this library."
    },
    emptyNavigateUriError: {
        code: "empty_navigate_uri",
        desc: "Navigation URI is empty. Please check stack trace for more info."
    },
    hashEmptyError: {
        code: "hash_empty_error",
        desc: "Hash value cannot be processed because it is empty. Please verify that your redirectUri is not clearing the hash. For more visit: aka.ms/msaljs/browser-errors."
    },
    hashDoesNotContainStateError: {
        code: "no_state_in_hash",
        desc: "Hash does not contain state. Please verify that the request originated from msal."
    },
    hashDoesNotContainKnownPropertiesError: {
        code: "hash_does_not_contain_known_properties",
        desc: "Hash does not contain known properites. Please verify that your redirectUri is not changing the hash. For more visit: aka.ms/msaljs/browser-errors."
    },
    unableToParseStateError: {
        code: "unable_to_parse_state",
        desc: "Unable to parse state. Please verify that the request originated from msal."
    },
    stateInteractionTypeMismatchError: {
        code: "state_interaction_type_mismatch",
        desc: "Hash contains state but the interaction type does not match the caller."
    },
    interactionInProgress: {
        code: "interaction_in_progress",
        desc: "Interaction is currently in progress. Please ensure that this interaction has been completed before calling an interactive API.  For more visit: aka.ms/msaljs/browser-errors."
    },
    popupWindowError: {
        code: "popup_window_error",
        desc: "Error opening popup window. This can happen if you are using IE or if popups are blocked in the browser."
    },
    emptyWindowError: {
        code: "empty_window_error",
        desc: "window.open returned null or undefined window object."
    },
    userCancelledError: {
        code: "user_cancelled",
        desc: "User cancelled the flow."
    },
    monitorPopupTimeoutError: {
        code: "monitor_window_timeout",
        desc: "Token acquisition in popup failed due to timeout. For more visit: aka.ms/msaljs/browser-errors."
    },
    monitorIframeTimeoutError: {
        code: "monitor_window_timeout",
        desc: "Token acquisition in iframe failed due to timeout. For more visit: aka.ms/msaljs/browser-errors."
    },
    redirectInIframeError: {
        code: "redirect_in_iframe",
        desc: "Redirects are not supported for iframed or brokered applications. Please ensure you are using MSAL.js in a top frame of the window if using the redirect APIs, or use the popup APIs."
    },
    blockTokenRequestsInHiddenIframeError: {
        code: "block_iframe_reload",
        desc: "Request was blocked inside an iframe because MSAL detected an authentication response. For more visit: aka.ms/msaljs/browser-errors"
    },
    blockAcquireTokenInPopupsError: {
        code: "block_nested_popups",
        desc: "Request was blocked inside a popup because MSAL detected it was running in a popup."
    },
    iframeClosedPrematurelyError: {
        code: "iframe_closed_prematurely",
        desc: "The iframe being monitored was closed prematurely."
    },
    silentLogoutUnsupportedError: {
        code: "silent_logout_unsupported",
        desc: "Silent logout not supported. Please call logoutRedirect or logoutPopup instead."
    },
    noAccountError: {
        code: "no_account_error",
        desc: "No account object provided to acquireTokenSilent and no active account has been set. Please call setActiveAccount or provide an account on the request."
    },
    silentPromptValueError: {
        code: "silent_prompt_value_error",
        desc: "The value given for the prompt value is not valid for silent requests - must be set to 'none' or 'no_session'."
    },
    noTokenRequestCacheError: {
        code: "no_token_request_cache_error",
        desc: "No token request found in cache."
    },
    unableToParseTokenRequestCacheError: {
        code: "unable_to_parse_token_request_cache_error",
        desc: "The cached token request could not be parsed."
    },
    noCachedAuthorityError: {
        code: "no_cached_authority_error",
        desc: "No cached authority found."
    },
    authRequestNotSet: {
        code: "auth_request_not_set_error",
        desc: "Auth Request not set. Please ensure initiateAuthRequest was called from the InteractionHandler"
    },
    invalidCacheType: {
        code: "invalid_cache_type",
        desc: "Invalid cache type"
    },
    notInBrowserEnvironment: {
        code: "non_browser_environment",
        desc: "Login and token requests are not supported in non-browser environments."
    },
    databaseNotOpen: {
        code: "database_not_open",
        desc: "Database is not open!"
    },
    noNetworkConnectivity: {
        code: "no_network_connectivity",
        desc: "No network connectivity. Check your internet connection."
    },
    postRequestFailed: {
        code: "post_request_failed",
        desc: "Network request failed: If the browser threw a CORS error, check that the redirectUri is registered in the Azure App Portal as type 'SPA'"
    },
    getRequestFailed: {
        code: "get_request_failed",
        desc: "Network request failed. Please check the network trace to determine root cause."
    },
    failedToParseNetworkResponse: {
        code: "failed_to_parse_response",
        desc: "Failed to parse network response. Check network trace."
    },
    unableToLoadTokenError: {
        code: "unable_to_load_token",
        desc: "Error loading token to cache."
    },
    signingKeyNotFoundInStorage: {
        code: "crypto_key_not_found",
        desc: "Cryptographic Key or Keypair not found in browser storage."
    },
    authCodeRequired: {
        code: "auth_code_required",
        desc: "An authorization code must be provided (as the `code` property on the request) to this flow."
    },
    authCodeOrNativeAccountRequired: {
        code: "auth_code_or_nativeAccountId_required",
        desc: "An authorization code or nativeAccountId must be provided to this flow."
    },
    databaseUnavailable: {
        code: "database_unavailable",
        desc: "IndexedDB, which is required for persistent cryptographic key storage, is unavailable. This may be caused by browser privacy features which block persistent storage in third-party contexts."
    },
    unableToAcquireTokenFromNativePlatform: {
        code: "unable_to_acquire_token_from_native_platform",
        desc: "Unable to acquire token from native platform. For a list of possible reasons visit aka.ms/msaljs/browser-errors."
    },
    nativeHandshakeTimeout: {
        code: "native_handshake_timeout",
        desc: "Timed out while attempting to establish connection to browser extension"
    },
    nativeExtensionNotInstalled: {
        code: "native_extension_not_installed",
        desc: "Native extension is not installed. If you think this is a mistake call the initialize function."
    },
    nativeConnectionNotEstablished: {
        code: "native_connection_not_established",
        desc: "Connection to native platform has not been established. Please install a compatible browser extension and run initialize(). For more please visit aka.ms/msaljs/browser-errors."
    },
    nativeBrokerCalledBeforeInitialize: {
        code: "native_broker_called_before_initialize",
        desc: "You must call and await the initialize function before attempting to call any other MSAL API when native brokering is enabled. For more please visit aka.ms/msaljs/browser-errors."
    },
    nativePromptNotSupported: {
        code: "native_prompt_not_supported",
        desc: "The provided prompt is not supported by the native platform. This request should be routed to the web based flow."
    }
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

    /**
     * Creates an error thrown when PKCE is not implemented.
     * @param errDetail
     */
    static createPkceNotGeneratedError(errDetail: string): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.pkceNotGenerated.code,
            `${BrowserAuthErrorMessage.pkceNotGenerated.desc} Detail:${errDetail}`);
    }

    /**
     * Creates an error thrown when the crypto object is unavailable.
     * @param errDetail
     */
    static createCryptoNotAvailableError(errDetail: string): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.cryptoDoesNotExist.code,
            `${BrowserAuthErrorMessage.cryptoDoesNotExist.desc} Detail:${errDetail}`);
    }

    /**
     * Creates an error thrown when an HTTP method hasn't been implemented by the browser class.
     * @param method
     */
    static createHttpMethodNotImplementedError(method: string): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.httpMethodNotImplementedError.code,
            `${BrowserAuthErrorMessage.httpMethodNotImplementedError.desc} Given Method: ${method}`);
    }

    /**
     * Creates an error thrown when the navigation URI is empty.
     */
    static createEmptyNavigationUriError(): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.emptyNavigateUriError.code, BrowserAuthErrorMessage.emptyNavigateUriError.desc);
    }

    /**
     * Creates an error thrown when the hash string value is unexpectedly empty.
     * @param hashValue
     */
    static createEmptyHashError(hashValue: string): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.hashEmptyError.code, `${BrowserAuthErrorMessage.hashEmptyError.desc} Given Url: ${hashValue}`);
    }

    /**
     * Creates an error thrown when the hash string value is unexpectedly empty.
     */
    static createHashDoesNotContainStateError(): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.hashDoesNotContainStateError.code, BrowserAuthErrorMessage.hashDoesNotContainStateError.desc);
    }

    /**
     * Creates an error thrown when the hash string value does not contain known properties
     */
    static createHashDoesNotContainKnownPropertiesError(): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.hashDoesNotContainKnownPropertiesError.code, BrowserAuthErrorMessage.hashDoesNotContainKnownPropertiesError.desc);
    }

    /**
     * Creates an error thrown when the hash string value is unexpectedly empty.
     */
    static createUnableToParseStateError(): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.unableToParseStateError.code, BrowserAuthErrorMessage.unableToParseStateError.desc);
    }

    /**
     * Creates an error thrown when the state value in the hash does not match the interaction type of the API attempting to consume it.
     */
    static createStateInteractionTypeMismatchError(): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.stateInteractionTypeMismatchError.code, BrowserAuthErrorMessage.stateInteractionTypeMismatchError.desc);
    }

    /**
     * Creates an error thrown when a browser interaction (redirect or popup) is in progress.
     */
    static createInteractionInProgressError(): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.interactionInProgress.code, BrowserAuthErrorMessage.interactionInProgress.desc);
    }

    /**
     * Creates an error thrown when the popup window could not be opened.
     * @param errDetail
     */
    static createPopupWindowError(errDetail?: string): BrowserAuthError {
        let errorMessage = BrowserAuthErrorMessage.popupWindowError.desc;
        errorMessage = !StringUtils.isEmpty(errDetail) ? `${errorMessage} Details: ${errDetail}` : errorMessage;
        return new BrowserAuthError(BrowserAuthErrorMessage.popupWindowError.code, errorMessage);
    }

    /**
     * Creates an error thrown when window.open returns an empty window object.
     * @param errDetail
     */
    static createEmptyWindowCreatedError(): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.emptyWindowError.code, BrowserAuthErrorMessage.emptyWindowError.desc);
    }

    /**
     * Creates an error thrown when the user closes a popup.
     */
    static createUserCancelledError(): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.userCancelledError.code,
            BrowserAuthErrorMessage.userCancelledError.desc);
    }

    /**
     * Creates an error thrown when monitorPopupFromHash times out for a given popup.
     */
    static createMonitorPopupTimeoutError(): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.monitorPopupTimeoutError.code,
            BrowserAuthErrorMessage.monitorPopupTimeoutError.desc);
    }

    /**
     * Creates an error thrown when monitorIframeFromHash times out for a given iframe.
     */
    static createMonitorIframeTimeoutError(): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.monitorIframeTimeoutError.code,
            BrowserAuthErrorMessage.monitorIframeTimeoutError.desc);
    }

    /**
     * Creates an error thrown when navigateWindow is called inside an iframe or brokered applications.
     * @param windowParentCheck
     */
    static createRedirectInIframeError(windowParentCheck: boolean): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.redirectInIframeError.code,
            `${BrowserAuthErrorMessage.redirectInIframeError.desc} (window.parent !== window) => ${windowParentCheck}`);
    }

    /**
     * Creates an error thrown when an auth reload is done inside an iframe.
     */
    static createBlockReloadInHiddenIframeError(): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.blockTokenRequestsInHiddenIframeError.code,
            BrowserAuthErrorMessage.blockTokenRequestsInHiddenIframeError.desc);
    }

    /**
     * Creates an error thrown when a popup attempts to call an acquireToken API
     * @returns
     */
    static createBlockAcquireTokenInPopupsError(): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.blockAcquireTokenInPopupsError.code,
            BrowserAuthErrorMessage.blockAcquireTokenInPopupsError.desc);
    }

    /**
     * Creates an error thrown when an iframe is found to be closed before the timeout is reached.
     */
    static createIframeClosedPrematurelyError(): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.iframeClosedPrematurelyError.code, BrowserAuthErrorMessage.iframeClosedPrematurelyError.desc);
    }

    /**
     * Creates an error thrown when the logout API is called on any of the silent interaction clients
     */
    static createSilentLogoutUnsupportedError(): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.silentLogoutUnsupportedError.code, BrowserAuthErrorMessage.silentLogoutUnsupportedError.desc);
    }

    /**
     * Creates an error thrown when the account object is not provided in the acquireTokenSilent API.
     */
    static createNoAccountError(): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.noAccountError.code, BrowserAuthErrorMessage.noAccountError.desc);
    }

    /**
     * Creates an error thrown when a given prompt value is invalid for silent requests.
     */
    static createSilentPromptValueError(givenPrompt: string): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.silentPromptValueError.code, `${BrowserAuthErrorMessage.silentPromptValueError.desc} Given value: ${givenPrompt}`);
    }

    /**
     * Creates an error thrown when the cached token request could not be retrieved from the cache
     */
    static createUnableToParseTokenRequestCacheError(): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.unableToParseTokenRequestCacheError.code,
            BrowserAuthErrorMessage.unableToParseTokenRequestCacheError.desc);
    }

    /**
     * Creates an error thrown when the token request could not be retrieved from the cache
     */
    static createNoTokenRequestCacheError(): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.noTokenRequestCacheError.code,
            BrowserAuthErrorMessage.noTokenRequestCacheError.desc);
    }

    /**
     * Creates an error thrown when handleCodeResponse is called before initiateAuthRequest (InteractionHandler)
     */
    static createAuthRequestNotSetError(): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.authRequestNotSet.code,
            BrowserAuthErrorMessage.authRequestNotSet.desc);
    }

    /**
     * Creates an error thrown when the authority could not be retrieved from the cache
     */
    static createNoCachedAuthorityError(): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.noCachedAuthorityError.code,
            BrowserAuthErrorMessage.noCachedAuthorityError.desc);
    }

    /**
     * Creates an error thrown if cache type is invalid.
     */
    static createInvalidCacheTypeError(): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.invalidCacheType.code, `${BrowserAuthErrorMessage.invalidCacheType.desc}`);
    }

    /**
     * Create an error thrown when login and token requests are made from a non-browser environment
     */
    static createNonBrowserEnvironmentError(): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.notInBrowserEnvironment.code, BrowserAuthErrorMessage.notInBrowserEnvironment.desc);
    }

    /**
     * Create an error thrown when indexDB database is not open
     */
    static createDatabaseNotOpenError(): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.databaseNotOpen.code, BrowserAuthErrorMessage.databaseNotOpen.desc);
    }

    /**
     * Create an error thrown when token fetch fails due to no internet
     */
    static createNoNetworkConnectivityError(): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.noNetworkConnectivity.code, BrowserAuthErrorMessage.noNetworkConnectivity.desc);
    }

    /**
     * Create an error thrown when token fetch fails due to reasons other than internet connectivity
     */
    static createPostRequestFailedError(errorDesc: string, endpoint: string): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.postRequestFailed.code, `${BrowserAuthErrorMessage.postRequestFailed.desc} | Network client threw: ${errorDesc} | Attempted to reach: ${endpoint.split("?")[0]}`);
    }

    /**
     * Create an error thrown when get request fails due to reasons other than internet connectivity
     */
    static createGetRequestFailedError(errorDesc: string, endpoint: string): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.getRequestFailed.code, `${BrowserAuthErrorMessage.getRequestFailed.desc} | Network client threw: ${errorDesc} | Attempted to reach: ${endpoint.split("?")[0]}`);
    }

    /**
     * Create an error thrown when network client fails to parse network response
     */
    static createFailedToParseNetworkResponseError(endpoint: string): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.failedToParseNetworkResponse.code, `${BrowserAuthErrorMessage.failedToParseNetworkResponse.desc} | Attempted to reach: ${endpoint.split("?")[0]}`);
    }

    /**
     * Create an error thrown when the necessary information is not available to sideload tokens
     */
    static createUnableToLoadTokenError(errorDetail: string): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.unableToLoadTokenError.code, `${BrowserAuthErrorMessage.unableToLoadTokenError.desc} | ${errorDetail}`);
    }

    /**
     * Create an error thrown when the queried cryptographic key is not found in IndexedDB
     */
    static createSigningKeyNotFoundInStorageError(keyId: string): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.signingKeyNotFoundInStorage.code, `${BrowserAuthErrorMessage.signingKeyNotFoundInStorage.desc} | No match found for KeyId: ${keyId}`);
    }

    /**
     * Create an error when an authorization code is required but not provided
     */
    static createAuthCodeRequiredError(): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.authCodeRequired.code, BrowserAuthErrorMessage.authCodeRequired.desc);
    }

    /**
     * Create an error when an authorization code or native account ID is required but not provided
     */
    static createAuthCodeOrNativeAccountIdRequiredError(): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.authCodeOrNativeAccountRequired.code, BrowserAuthErrorMessage.authCodeOrNativeAccountRequired.desc);
    }

    /**
     * Create an error when IndexedDB is unavailable
     */
    static createDatabaseUnavailableError(): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.databaseUnavailable.code, BrowserAuthErrorMessage.databaseUnavailable.desc);
    }

    /**
     * Create an error when native token acquisition is not possible
     */
    static createUnableToAcquireTokenFromNativePlatformError(): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.unableToAcquireTokenFromNativePlatform.code, BrowserAuthErrorMessage.unableToAcquireTokenFromNativePlatform.desc);
    }

    /**
     * Create an error thrown when Handshake with browser extension times out
     */
    static createNativeHandshakeTimeoutError(): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.nativeHandshakeTimeout.code, BrowserAuthErrorMessage.nativeHandshakeTimeout.desc);
    }

    /**
     * Create an error thrown when browser extension is not installed
     */
    static createNativeExtensionNotInstalledError(): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.nativeExtensionNotInstalled.code, BrowserAuthErrorMessage.nativeExtensionNotInstalled.desc);
    }

    /**
     * Create an error when native connection has not been established
     * @returns
     */
    static createNativeConnectionNotEstablishedError(): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.nativeConnectionNotEstablished.code, BrowserAuthErrorMessage.nativeConnectionNotEstablished.desc);
    }

    /**
     * Create an error thrown when the initialize function hasn't been called
     */
    static createNativeBrokerCalledBeforeInitialize(): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.nativeBrokerCalledBeforeInitialize.code, BrowserAuthErrorMessage.nativeBrokerCalledBeforeInitialize.desc);
    }

    /**
     * Create an error thrown when requesting a token directly from the native platform with an unsupported prompt parameter e.g. select_account, login or create
     * These requests must go through eSTS to ensure eSTS is aware of the new account
     */
    static createNativePromptParameterNotSupportedError(): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.nativePromptNotSupported.code, BrowserAuthErrorMessage.nativePromptNotSupported.desc);
    }
}
