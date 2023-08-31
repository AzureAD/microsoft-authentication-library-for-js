/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError } from "@azure/msal-common";
import * as BrowserAuthErrorCodes from "./BrowserAuthErrorCodes";
export { BrowserAuthErrorCodes }; // Allow importing as "BrowserAuthErrorCodes"

const ErrorLink = "For more visit: aka.ms/msaljs/browser-errors";

/**
 * BrowserAuthErrorMessage class containing string constants used by error codes and messages.
 */
export const BrowserAuthErrorMessages = {
    [BrowserAuthErrorCodes.pkceNotGenerated]:
        "The PKCE code challenge and verifier could not be generated.",
    [BrowserAuthErrorCodes.cryptoDoesNotExist]:
        "The crypto object or function is not available.",
    [BrowserAuthErrorCodes.emptyNavigateUriError]:
        "Navigation URI is empty. Please check stack trace for more info.",
    [BrowserAuthErrorCodes.hashEmptyError]: `Hash value cannot be processed because it is empty. Please verify that your redirectUri is not clearing the hash. ${ErrorLink}`,
    [BrowserAuthErrorCodes.hashDoesNotContainStateError]:
        "Hash does not contain state. Please verify that the request originated from msal.",
    [BrowserAuthErrorCodes.hashDoesNotContainKnownPropertiesError]: `Hash does not contain known properites. Please verify that your redirectUri is not changing the hash.  ${ErrorLink}`,
    [BrowserAuthErrorCodes.unableToParseStateError]:
        "Unable to parse state. Please verify that the request originated from msal.",
    [BrowserAuthErrorCodes.stateInteractionTypeMismatchError]:
        "Hash contains state but the interaction type does not match the caller.",
    [BrowserAuthErrorCodes.interactionInProgress]: `Interaction is currently in progress. Please ensure that this interaction has been completed before calling an interactive API.   ${ErrorLink}`,
    [BrowserAuthErrorCodes.popupWindowError]:
        "Error opening popup window. This can happen if you are using IE or if popups are blocked in the browser.",
    [BrowserAuthErrorCodes.emptyWindowError]:
        "window.open returned null or undefined window object.",
    [BrowserAuthErrorCodes.userCancelledError]: "User cancelled the flow.",
    [BrowserAuthErrorCodes.monitorPopupTimeoutError]: `Token acquisition in popup failed due to timeout.  ${ErrorLink}`,
    [BrowserAuthErrorCodes.monitorIframeTimeoutError]: `Token acquisition in iframe failed due to timeout.  ${ErrorLink}`,
    [BrowserAuthErrorCodes.redirectInIframeError]:
        "Redirects are not supported for iframed or brokered applications. Please ensure you are using MSAL.js in a top frame of the window if using the redirect APIs, or use the popup APIs.",
    [BrowserAuthErrorCodes.blockTokenRequestsInHiddenIframeError]: `Request was blocked inside an iframe because MSAL detected an authentication response.  ${ErrorLink}`,
    [BrowserAuthErrorCodes.blockAcquireTokenInPopupsError]:
        "Request was blocked inside a popup because MSAL detected it was running in a popup.",
    [BrowserAuthErrorCodes.iframeClosedPrematurelyError]:
        "The iframe being monitored was closed prematurely.",
    [BrowserAuthErrorCodes.silentLogoutUnsupportedError]:
        "Silent logout not supported. Please call logoutRedirect or logoutPopup instead.",
    [BrowserAuthErrorCodes.noAccountError]:
        "No account object provided to acquireTokenSilent and no active account has been set. Please call setActiveAccount or provide an account on the request.",
    [BrowserAuthErrorCodes.silentPromptValueError]:
        "The value given for the prompt value is not valid for silent requests - must be set to 'none' or 'no_session'.",
    [BrowserAuthErrorCodes.noTokenRequestCacheError]:
        "No token request found in cache.",
    [BrowserAuthErrorCodes.unableToParseTokenRequestCacheError]:
        "The cached token request could not be parsed.",
    [BrowserAuthErrorCodes.noCachedAuthorityError]:
        "No cached authority found.",
    [BrowserAuthErrorCodes.authRequestNotSet]:
        "Auth Request not set. Please ensure initiateAuthRequest was called from the InteractionHandler",
    [BrowserAuthErrorCodes.invalidCacheType]: "Invalid cache type",
    [BrowserAuthErrorCodes.notInBrowserEnvironment]:
        "Login and token requests are not supported in non-browser environments.",
    [BrowserAuthErrorCodes.databaseNotOpen]: "Database is not open!",
    [BrowserAuthErrorCodes.noNetworkConnectivity]:
        "No network connectivity. Check your internet connection.",
    [BrowserAuthErrorCodes.postRequestFailed]:
        "Network request failed: If the browser threw a CORS error, check that the redirectUri is registered in the Azure App Portal as type 'SPA'",
    [BrowserAuthErrorCodes.getRequestFailed]:
        "Network request failed. Please check the network trace to determine root cause.",
    [BrowserAuthErrorCodes.failedToParseNetworkResponse]:
        "Failed to parse network response. Check network trace.",
    [BrowserAuthErrorCodes.unableToLoadTokenError]:
        "Error loading token to cache.",
    [BrowserAuthErrorCodes.signingKeyNotFoundInStorage]:
        "Cryptographic Key or Keypair not found in browser storage.",
    [BrowserAuthErrorCodes.authCodeRequired]:
        "An authorization code must be provided (as the `code` property on the request) to this flow.",
    [BrowserAuthErrorCodes.authCodeOrNativeAccountRequired]:
        "An authorization code or nativeAccountId must be provided to this flow.",
    [BrowserAuthErrorCodes.spaCodeAndNativeAccountPresent]:
        "Request cannot contain both spa code and native account id.",
    [BrowserAuthErrorCodes.databaseUnavailable]:
        "IndexedDB, which is required for persistent cryptographic key storage, is unavailable. This may be caused by browser privacy features which block persistent storage in third-party contexts.",
    [BrowserAuthErrorCodes.unableToAcquireTokenFromNativePlatform]: `Unable to acquire token from native platform.  ${ErrorLink}`,
    [BrowserAuthErrorCodes.nativeHandshakeTimeout]:
        "Timed out while attempting to establish connection to browser extension",
    [BrowserAuthErrorCodes.nativeExtensionNotInstalled]:
        "Native extension is not installed. If you think this is a mistake call the initialize function.",
    [BrowserAuthErrorCodes.nativeConnectionNotEstablished]: `Connection to native platform has not been established. Please install a compatible browser extension and run initialize().  ${ErrorLink}`,
    [BrowserAuthErrorCodes.uninitializedPublicClientApplication]: `You must call and await the initialize function before attempting to call any other MSAL API.  ${ErrorLink}`,
    [BrowserAuthErrorCodes.nativePromptNotSupported]:
        "The provided prompt is not supported by the native platform. This request should be routed to the web based flow.",
};

/**
 * BrowserAuthErrorMessage class containing string constants used by error codes and messages.
 * @deprecated Use BrowserAuthBrowserAuthErrorCodes instead
 */
export const BrowserAuthErrorMessage = {
    pkceNotGenerated: {
        code: BrowserAuthErrorCodes.pkceNotGenerated,
        desc: BrowserAuthErrorMessages[BrowserAuthErrorCodes.pkceNotGenerated],
    },
    cryptoDoesNotExist: {
        code: BrowserAuthErrorCodes.cryptoDoesNotExist,
        desc: BrowserAuthErrorMessages[
            BrowserAuthErrorCodes.cryptoDoesNotExist
        ],
    },
    emptyNavigateUriError: {
        code: BrowserAuthErrorCodes.emptyNavigateUriError,
        desc: BrowserAuthErrorMessages[
            BrowserAuthErrorCodes.emptyNavigateUriError
        ],
    },
    hashEmptyError: {
        code: BrowserAuthErrorCodes.hashEmptyError,
        desc: BrowserAuthErrorMessages[BrowserAuthErrorCodes.hashEmptyError],
    },
    hashDoesNotContainStateError: {
        code: BrowserAuthErrorCodes.hashDoesNotContainStateError,
        desc: BrowserAuthErrorMessages[
            BrowserAuthErrorCodes.hashDoesNotContainStateError
        ],
    },
    hashDoesNotContainKnownPropertiesError: {
        code: BrowserAuthErrorCodes.hashDoesNotContainKnownPropertiesError,
        desc: BrowserAuthErrorMessages[
            BrowserAuthErrorCodes.hashDoesNotContainKnownPropertiesError
        ],
    },
    unableToParseStateError: {
        code: BrowserAuthErrorCodes.unableToParseStateError,
        desc: BrowserAuthErrorMessages[
            BrowserAuthErrorCodes.unableToParseStateError
        ],
    },
    stateInteractionTypeMismatchError: {
        code: BrowserAuthErrorCodes.stateInteractionTypeMismatchError,
        desc: BrowserAuthErrorMessages[
            BrowserAuthErrorCodes.stateInteractionTypeMismatchError
        ],
    },
    interactionInProgress: {
        code: BrowserAuthErrorCodes.interactionInProgress,
        desc: BrowserAuthErrorMessages[
            BrowserAuthErrorCodes.interactionInProgress
        ],
    },
    popupWindowError: {
        code: BrowserAuthErrorCodes.popupWindowError,
        desc: BrowserAuthErrorMessages[BrowserAuthErrorCodes.popupWindowError],
    },
    emptyWindowError: {
        code: BrowserAuthErrorCodes.emptyWindowError,
        desc: BrowserAuthErrorMessages[BrowserAuthErrorCodes.emptyWindowError],
    },
    userCancelledError: {
        code: BrowserAuthErrorCodes.userCancelledError,
        desc: BrowserAuthErrorMessages[
            BrowserAuthErrorCodes.userCancelledError
        ],
    },
    monitorPopupTimeoutError: {
        code: BrowserAuthErrorCodes.monitorPopupTimeoutError,
        desc: BrowserAuthErrorMessages[
            BrowserAuthErrorCodes.monitorPopupTimeoutError
        ],
    },
    monitorIframeTimeoutError: {
        code: BrowserAuthErrorCodes.monitorIframeTimeoutError,
        desc: BrowserAuthErrorMessages[
            BrowserAuthErrorCodes.monitorIframeTimeoutError
        ],
    },
    redirectInIframeError: {
        code: BrowserAuthErrorCodes.redirectInIframeError,
        desc: BrowserAuthErrorMessages[
            BrowserAuthErrorCodes.redirectInIframeError
        ],
    },
    blockTokenRequestsInHiddenIframeError: {
        code: BrowserAuthErrorCodes.blockTokenRequestsInHiddenIframeError,
        desc: BrowserAuthErrorMessages[
            BrowserAuthErrorCodes.blockTokenRequestsInHiddenIframeError
        ],
    },
    blockAcquireTokenInPopupsError: {
        code: BrowserAuthErrorCodes.blockAcquireTokenInPopupsError,
        desc: BrowserAuthErrorMessages[
            BrowserAuthErrorCodes.blockAcquireTokenInPopupsError
        ],
    },
    iframeClosedPrematurelyError: {
        code: BrowserAuthErrorCodes.iframeClosedPrematurelyError,
        desc: BrowserAuthErrorMessages[
            BrowserAuthErrorCodes.iframeClosedPrematurelyError
        ],
    },
    silentLogoutUnsupportedError: {
        code: BrowserAuthErrorCodes.silentLogoutUnsupportedError,
        desc: BrowserAuthErrorMessages[
            BrowserAuthErrorCodes.silentLogoutUnsupportedError
        ],
    },
    noAccountError: {
        code: BrowserAuthErrorCodes.noAccountError,
        desc: BrowserAuthErrorMessages[BrowserAuthErrorCodes.noAccountError],
    },
    silentPromptValueError: {
        code: BrowserAuthErrorCodes.silentPromptValueError,
        desc: BrowserAuthErrorMessages[
            BrowserAuthErrorCodes.silentPromptValueError
        ],
    },
    noTokenRequestCacheError: {
        code: BrowserAuthErrorCodes.noTokenRequestCacheError,
        desc: BrowserAuthErrorMessages[
            BrowserAuthErrorCodes.noTokenRequestCacheError
        ],
    },
    unableToParseTokenRequestCacheError: {
        code: BrowserAuthErrorCodes.unableToParseTokenRequestCacheError,
        desc: BrowserAuthErrorMessages[
            BrowserAuthErrorCodes.unableToParseTokenRequestCacheError
        ],
    },
    noCachedAuthorityError: {
        code: BrowserAuthErrorCodes.noCachedAuthorityError,
        desc: BrowserAuthErrorMessages[
            BrowserAuthErrorCodes.noCachedAuthorityError
        ],
    },
    authRequestNotSet: {
        code: BrowserAuthErrorCodes.authRequestNotSet,
        desc: BrowserAuthErrorMessages[BrowserAuthErrorCodes.authRequestNotSet],
    },
    invalidCacheType: {
        code: BrowserAuthErrorCodes.invalidCacheType,
        desc: BrowserAuthErrorMessages[BrowserAuthErrorCodes.invalidCacheType],
    },
    notInBrowserEnvironment: {
        code: BrowserAuthErrorCodes.notInBrowserEnvironment,
        desc: BrowserAuthErrorMessages[
            BrowserAuthErrorCodes.notInBrowserEnvironment
        ],
    },
    databaseNotOpen: {
        code: BrowserAuthErrorCodes.databaseNotOpen,
        desc: BrowserAuthErrorMessages[BrowserAuthErrorCodes.databaseNotOpen],
    },
    noNetworkConnectivity: {
        code: BrowserAuthErrorCodes.noNetworkConnectivity,
        desc: BrowserAuthErrorMessages[
            BrowserAuthErrorCodes.noNetworkConnectivity
        ],
    },
    postRequestFailed: {
        code: BrowserAuthErrorCodes.postRequestFailed,
        desc: BrowserAuthErrorMessages[BrowserAuthErrorCodes.postRequestFailed],
    },
    getRequestFailed: {
        code: BrowserAuthErrorCodes.getRequestFailed,
        desc: BrowserAuthErrorMessages[BrowserAuthErrorCodes.getRequestFailed],
    },
    failedToParseNetworkResponse: {
        code: BrowserAuthErrorCodes.failedToParseNetworkResponse,
        desc: BrowserAuthErrorMessages[
            BrowserAuthErrorCodes.failedToParseNetworkResponse
        ],
    },
    unableToLoadTokenError: {
        code: BrowserAuthErrorCodes.unableToLoadTokenError,
        desc: BrowserAuthErrorMessages[
            BrowserAuthErrorCodes.unableToLoadTokenError
        ],
    },
    signingKeyNotFoundInStorage: {
        code: BrowserAuthErrorCodes.signingKeyNotFoundInStorage,
        desc: BrowserAuthErrorMessages[
            BrowserAuthErrorCodes.signingKeyNotFoundInStorage
        ],
    },
    authCodeRequired: {
        code: BrowserAuthErrorCodes.authCodeRequired,
        desc: BrowserAuthErrorMessages[BrowserAuthErrorCodes.authCodeRequired],
    },
    authCodeOrNativeAccountRequired: {
        code: BrowserAuthErrorCodes.authCodeOrNativeAccountRequired,
        desc: BrowserAuthErrorMessages[
            BrowserAuthErrorCodes.authCodeOrNativeAccountRequired
        ],
    },
    spaCodeAndNativeAccountPresent: {
        code: BrowserAuthErrorCodes.spaCodeAndNativeAccountPresent,
        desc: BrowserAuthErrorMessages[
            BrowserAuthErrorCodes.spaCodeAndNativeAccountPresent
        ],
    },
    databaseUnavailable: {
        code: BrowserAuthErrorCodes.databaseUnavailable,
        desc: BrowserAuthErrorMessages[
            BrowserAuthErrorCodes.databaseUnavailable
        ],
    },
    unableToAcquireTokenFromNativePlatform: {
        code: BrowserAuthErrorCodes.unableToAcquireTokenFromNativePlatform,
        desc: BrowserAuthErrorMessages[
            BrowserAuthErrorCodes.unableToAcquireTokenFromNativePlatform
        ],
    },
    nativeHandshakeTimeout: {
        code: BrowserAuthErrorCodes.nativeHandshakeTimeout,
        desc: BrowserAuthErrorMessages[
            BrowserAuthErrorCodes.nativeHandshakeTimeout
        ],
    },
    nativeExtensionNotInstalled: {
        code: BrowserAuthErrorCodes.nativeExtensionNotInstalled,
        desc: BrowserAuthErrorMessages[
            BrowserAuthErrorCodes.nativeExtensionNotInstalled
        ],
    },
    nativeConnectionNotEstablished: {
        code: BrowserAuthErrorCodes.nativeConnectionNotEstablished,
        desc: BrowserAuthErrorMessages[
            BrowserAuthErrorCodes.nativeConnectionNotEstablished
        ],
    },
    uninitializedPublicClientApplication: {
        code: BrowserAuthErrorCodes.uninitializedPublicClientApplication,
        desc: BrowserAuthErrorMessages[
            BrowserAuthErrorCodes.uninitializedPublicClientApplication
        ],
    },
    nativePromptNotSupported: {
        code: BrowserAuthErrorCodes.nativePromptNotSupported,
        desc: BrowserAuthErrorMessages[
            BrowserAuthErrorCodes.nativePromptNotSupported
        ],
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

export function createBrowserAuthError(errorCode: string): BrowserAuthError {
    return new BrowserAuthError(errorCode);
}
