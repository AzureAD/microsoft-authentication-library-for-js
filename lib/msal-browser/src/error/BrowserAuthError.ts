/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError } from "@azure/msal-common";
import * as ErrorCodes from "./BrowserAuthErrorCodes";

const ErrorLink = "For more visit: aka.ms/msaljs/browser-errors";

/**
 * BrowserAuthErrorMessage class containing string constants used by error codes and messages.
 */
export const BrowserAuthErrorMessages = {
    [ErrorCodes.pkceNotGenerated]:
        "The PKCE code challenge and verifier could not be generated.",
    [ErrorCodes.cryptoDoesNotExist]:
        "The crypto object or function is not available.",
    [ErrorCodes.emptyNavigateUriError]:
        "Navigation URI is empty. Please check stack trace for more info.",
    [ErrorCodes.hashEmptyError]: `Hash value cannot be processed because it is empty. Please verify that your redirectUri is not clearing the hash. ${ErrorLink}`,
    [ErrorCodes.hashDoesNotContainStateError]:
        "Hash does not contain state. Please verify that the request originated from msal.",
    [ErrorCodes.hashDoesNotContainKnownPropertiesError]: `Hash does not contain known properites. Please verify that your redirectUri is not changing the hash.  ${ErrorLink}`,
    [ErrorCodes.unableToParseStateError]:
        "Unable to parse state. Please verify that the request originated from msal.",
    [ErrorCodes.stateInteractionTypeMismatchError]:
        "Hash contains state but the interaction type does not match the caller.",
    [ErrorCodes.interactionInProgress]: `Interaction is currently in progress. Please ensure that this interaction has been completed before calling an interactive API.   ${ErrorLink}`,
    [ErrorCodes.popupWindowError]:
        "Error opening popup window. This can happen if you are using IE or if popups are blocked in the browser.",
    [ErrorCodes.emptyWindowError]:
        "window.open returned null or undefined window object.",
    [ErrorCodes.userCancelledError]: "User cancelled the flow.",
    [ErrorCodes.monitorPopupTimeoutError]: `Token acquisition in popup failed due to timeout.  ${ErrorLink}`,
    [ErrorCodes.monitorIframeTimeoutError]: `Token acquisition in iframe failed due to timeout.  ${ErrorLink}`,
    [ErrorCodes.redirectInIframeError]:
        "Redirects are not supported for iframed or brokered applications. Please ensure you are using MSAL.js in a top frame of the window if using the redirect APIs, or use the popup APIs.",
    [ErrorCodes.blockTokenRequestsInHiddenIframeError]: `Request was blocked inside an iframe because MSAL detected an authentication response.  ${ErrorLink}`,
    [ErrorCodes.blockAcquireTokenInPopupsError]:
        "Request was blocked inside a popup because MSAL detected it was running in a popup.",
    [ErrorCodes.iframeClosedPrematurelyError]:
        "The iframe being monitored was closed prematurely.",
    [ErrorCodes.silentLogoutUnsupportedError]:
        "Silent logout not supported. Please call logoutRedirect or logoutPopup instead.",
    [ErrorCodes.noAccountError]:
        "No account object provided to acquireTokenSilent and no active account has been set. Please call setActiveAccount or provide an account on the request.",
    [ErrorCodes.silentPromptValueError]:
        "The value given for the prompt value is not valid for silent requests - must be set to 'none' or 'no_session'.",
    [ErrorCodes.noTokenRequestCacheError]: "No token request found in cache.",
    [ErrorCodes.unableToParseTokenRequestCacheError]:
        "The cached token request could not be parsed.",
    [ErrorCodes.noCachedAuthorityError]: "No cached authority found.",
    [ErrorCodes.authRequestNotSet]:
        "Auth Request not set. Please ensure initiateAuthRequest was called from the InteractionHandler",
    [ErrorCodes.invalidCacheType]: "Invalid cache type",
    [ErrorCodes.notInBrowserEnvironment]:
        "Login and token requests are not supported in non-browser environments.",
    [ErrorCodes.databaseNotOpen]: "Database is not open!",
    [ErrorCodes.noNetworkConnectivity]:
        "No network connectivity. Check your internet connection.",
    [ErrorCodes.postRequestFailed]:
        "Network request failed: If the browser threw a CORS error, check that the redirectUri is registered in the Azure App Portal as type 'SPA'",
    [ErrorCodes.getRequestFailed]:
        "Network request failed. Please check the network trace to determine root cause.",
    [ErrorCodes.failedToParseNetworkResponse]:
        "Failed to parse network response. Check network trace.",
    [ErrorCodes.unableToLoadTokenError]: "Error loading token to cache.",
    [ErrorCodes.signingKeyNotFoundInStorage]:
        "Cryptographic Key or Keypair not found in browser storage.",
    [ErrorCodes.authCodeRequired]:
        "An authorization code must be provided (as the `code` property on the request) to this flow.",
    [ErrorCodes.authCodeOrNativeAccountRequired]:
        "An authorization code or nativeAccountId must be provided to this flow.",
    [ErrorCodes.spaCodeAndNativeAccountPresent]:
        "Request cannot contain both spa code and native account id.",
    [ErrorCodes.databaseUnavailable]:
        "IndexedDB, which is required for persistent cryptographic key storage, is unavailable. This may be caused by browser privacy features which block persistent storage in third-party contexts.",
    [ErrorCodes.unableToAcquireTokenFromNativePlatform]: `Unable to acquire token from native platform.  ${ErrorLink}`,
    [ErrorCodes.nativeHandshakeTimeout]:
        "Timed out while attempting to establish connection to browser extension",
    [ErrorCodes.nativeExtensionNotInstalled]:
        "Native extension is not installed. If you think this is a mistake call the initialize function.",
    [ErrorCodes.nativeConnectionNotEstablished]: `Connection to native platform has not been established. Please install a compatible browser extension and run initialize().  ${ErrorLink}`,
    [ErrorCodes.uninitializedPublicClientApplication]: `You must call and await the initialize function before attempting to call any other MSAL API.  ${ErrorLink}`,
    [ErrorCodes.nativePromptNotSupported]:
        "The provided prompt is not supported by the native platform. This request should be routed to the web based flow.",
};

/**
 * BrowserAuthErrorMessage class containing string constants used by error codes and messages.
 * @deprecated Use BrowserAuthErrorCodes instead
 */
export const BrowserAuthErrorMessage = {
    pkceNotGenerated: {
        code: ErrorCodes.pkceNotGenerated,
        desc: BrowserAuthErrorMessages[ErrorCodes.pkceNotGenerated],
    },
    cryptoDoesNotExist: {
        code: ErrorCodes.cryptoDoesNotExist,
        desc: BrowserAuthErrorMessages[ErrorCodes.cryptoDoesNotExist],
    },
    emptyNavigateUriError: {
        code: ErrorCodes.emptyNavigateUriError,
        desc: BrowserAuthErrorMessages[ErrorCodes.emptyNavigateUriError],
    },
    hashEmptyError: {
        code: ErrorCodes.hashEmptyError,
        desc: BrowserAuthErrorMessages[ErrorCodes.hashEmptyError],
    },
    hashDoesNotContainStateError: {
        code: ErrorCodes.hashDoesNotContainStateError,
        desc: BrowserAuthErrorMessages[ErrorCodes.hashDoesNotContainStateError],
    },
    hashDoesNotContainKnownPropertiesError: {
        code: ErrorCodes.hashDoesNotContainKnownPropertiesError,
        desc: BrowserAuthErrorMessages[
            ErrorCodes.hashDoesNotContainKnownPropertiesError
        ],
    },
    unableToParseStateError: {
        code: ErrorCodes.unableToParseStateError,
        desc: BrowserAuthErrorMessages[ErrorCodes.unableToParseStateError],
    },
    stateInteractionTypeMismatchError: {
        code: ErrorCodes.stateInteractionTypeMismatchError,
        desc: BrowserAuthErrorMessages[
            ErrorCodes.stateInteractionTypeMismatchError
        ],
    },
    interactionInProgress: {
        code: ErrorCodes.interactionInProgress,
        desc: BrowserAuthErrorMessages[ErrorCodes.interactionInProgress],
    },
    popupWindowError: {
        code: ErrorCodes.popupWindowError,
        desc: BrowserAuthErrorMessages[ErrorCodes.popupWindowError],
    },
    emptyWindowError: {
        code: ErrorCodes.emptyWindowError,
        desc: BrowserAuthErrorMessages[ErrorCodes.emptyWindowError],
    },
    userCancelledError: {
        code: ErrorCodes.userCancelledError,
        desc: BrowserAuthErrorMessages[ErrorCodes.userCancelledError],
    },
    monitorPopupTimeoutError: {
        code: ErrorCodes.monitorPopupTimeoutError,
        desc: BrowserAuthErrorMessages[ErrorCodes.monitorPopupTimeoutError],
    },
    monitorIframeTimeoutError: {
        code: ErrorCodes.monitorIframeTimeoutError,
        desc: BrowserAuthErrorMessages[ErrorCodes.monitorIframeTimeoutError],
    },
    redirectInIframeError: {
        code: ErrorCodes.redirectInIframeError,
        desc: BrowserAuthErrorMessages[ErrorCodes.redirectInIframeError],
    },
    blockTokenRequestsInHiddenIframeError: {
        code: ErrorCodes.blockTokenRequestsInHiddenIframeError,
        desc: BrowserAuthErrorMessages[
            ErrorCodes.blockTokenRequestsInHiddenIframeError
        ],
    },
    blockAcquireTokenInPopupsError: {
        code: ErrorCodes.blockAcquireTokenInPopupsError,
        desc: BrowserAuthErrorMessages[
            ErrorCodes.blockAcquireTokenInPopupsError
        ],
    },
    iframeClosedPrematurelyError: {
        code: ErrorCodes.iframeClosedPrematurelyError,
        desc: BrowserAuthErrorMessages[ErrorCodes.iframeClosedPrematurelyError],
    },
    silentLogoutUnsupportedError: {
        code: ErrorCodes.silentLogoutUnsupportedError,
        desc: BrowserAuthErrorMessages[ErrorCodes.silentLogoutUnsupportedError],
    },
    noAccountError: {
        code: ErrorCodes.noAccountError,
        desc: BrowserAuthErrorMessages[ErrorCodes.noAccountError],
    },
    silentPromptValueError: {
        code: ErrorCodes.silentPromptValueError,
        desc: BrowserAuthErrorMessages[ErrorCodes.silentPromptValueError],
    },
    noTokenRequestCacheError: {
        code: ErrorCodes.noTokenRequestCacheError,
        desc: BrowserAuthErrorMessages[ErrorCodes.noTokenRequestCacheError],
    },
    unableToParseTokenRequestCacheError: {
        code: ErrorCodes.unableToParseTokenRequestCacheError,
        desc: BrowserAuthErrorMessages[
            ErrorCodes.unableToParseTokenRequestCacheError
        ],
    },
    noCachedAuthorityError: {
        code: ErrorCodes.noCachedAuthorityError,
        desc: BrowserAuthErrorMessages[ErrorCodes.noCachedAuthorityError],
    },
    authRequestNotSet: {
        code: ErrorCodes.authRequestNotSet,
        desc: BrowserAuthErrorMessages[ErrorCodes.authRequestNotSet],
    },
    invalidCacheType: {
        code: ErrorCodes.invalidCacheType,
        desc: BrowserAuthErrorMessages[ErrorCodes.invalidCacheType],
    },
    notInBrowserEnvironment: {
        code: ErrorCodes.notInBrowserEnvironment,
        desc: BrowserAuthErrorMessages[ErrorCodes.notInBrowserEnvironment],
    },
    databaseNotOpen: {
        code: ErrorCodes.databaseNotOpen,
        desc: BrowserAuthErrorMessages[ErrorCodes.databaseNotOpen],
    },
    noNetworkConnectivity: {
        code: ErrorCodes.noNetworkConnectivity,
        desc: BrowserAuthErrorMessages[ErrorCodes.noNetworkConnectivity],
    },
    postRequestFailed: {
        code: ErrorCodes.postRequestFailed,
        desc: BrowserAuthErrorMessages[ErrorCodes.postRequestFailed],
    },
    getRequestFailed: {
        code: ErrorCodes.getRequestFailed,
        desc: BrowserAuthErrorMessages[ErrorCodes.getRequestFailed],
    },
    failedToParseNetworkResponse: {
        code: ErrorCodes.failedToParseNetworkResponse,
        desc: BrowserAuthErrorMessages[ErrorCodes.failedToParseNetworkResponse],
    },
    unableToLoadTokenError: {
        code: ErrorCodes.unableToLoadTokenError,
        desc: BrowserAuthErrorMessages[ErrorCodes.unableToLoadTokenError],
    },
    signingKeyNotFoundInStorage: {
        code: ErrorCodes.signingKeyNotFoundInStorage,
        desc: BrowserAuthErrorMessages[ErrorCodes.signingKeyNotFoundInStorage],
    },
    authCodeRequired: {
        code: ErrorCodes.authCodeRequired,
        desc: BrowserAuthErrorMessages[ErrorCodes.authCodeRequired],
    },
    authCodeOrNativeAccountRequired: {
        code: ErrorCodes.authCodeOrNativeAccountRequired,
        desc: BrowserAuthErrorMessages[
            ErrorCodes.authCodeOrNativeAccountRequired
        ],
    },
    spaCodeAndNativeAccountPresent: {
        code: ErrorCodes.spaCodeAndNativeAccountPresent,
        desc: BrowserAuthErrorMessages[
            ErrorCodes.spaCodeAndNativeAccountPresent
        ],
    },
    databaseUnavailable: {
        code: ErrorCodes.databaseUnavailable,
        desc: BrowserAuthErrorMessages[ErrorCodes.databaseUnavailable],
    },
    unableToAcquireTokenFromNativePlatform: {
        code: ErrorCodes.unableToAcquireTokenFromNativePlatform,
        desc: BrowserAuthErrorMessages[
            ErrorCodes.unableToAcquireTokenFromNativePlatform
        ],
    },
    nativeHandshakeTimeout: {
        code: ErrorCodes.nativeHandshakeTimeout,
        desc: BrowserAuthErrorMessages[ErrorCodes.nativeHandshakeTimeout],
    },
    nativeExtensionNotInstalled: {
        code: ErrorCodes.nativeExtensionNotInstalled,
        desc: BrowserAuthErrorMessages[ErrorCodes.nativeExtensionNotInstalled],
    },
    nativeConnectionNotEstablished: {
        code: ErrorCodes.nativeConnectionNotEstablished,
        desc: BrowserAuthErrorMessages[
            ErrorCodes.nativeConnectionNotEstablished
        ],
    },
    uninitializedPublicClientApplication: {
        code: ErrorCodes.uninitializedPublicClientApplication,
        desc: BrowserAuthErrorMessages[
            ErrorCodes.uninitializedPublicClientApplication
        ],
    },
    nativePromptNotSupported: {
        code: ErrorCodes.nativePromptNotSupported,
        desc: BrowserAuthErrorMessages[ErrorCodes.nativePromptNotSupported],
    },
};

/**
 * Browser library error class thrown by the MSAL.js library for SPAs
 */
export class BrowserAuthError extends AuthError {
    constructor(errorCode: string) {
        super(errorCode, BrowserAuthErrorMessages[errorCode]);

        Object.setPrototypeOf(this, BrowserAuthError.prototype);
        this.name = "BrowserAuthError";
    }
}
