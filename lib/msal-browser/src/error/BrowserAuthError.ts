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
const ErrorMessages = {
    [ErrorCodes.pkceNotGenerated]: "The PKCE code challenge and verifier could not be generated.",
    [ErrorCodes.cryptoDoesNotExist]: "The crypto object or function is not available.",
    [ErrorCodes.emptyNavigateUriError]: "Navigation URI is empty. Please check stack trace for more info.",
    [ErrorCodes.hashEmptyError]: `Hash value cannot be processed because it is empty. Please verify that your redirectUri is not clearing the hash. ${ErrorLink}`,
    [ErrorCodes.hashDoesNotContainStateError]: "Hash does not contain state. Please verify that the request originated from msal.",
    [ErrorCodes.hashDoesNotContainKnownPropertiesError]: `Hash does not contain known properites. Please verify that your redirectUri is not changing the hash.  ${ErrorLink}`,
    [ErrorCodes.unableToParseStateError]: "Unable to parse state. Please verify that the request originated from msal.",
    [ErrorCodes.stateInteractionTypeMismatchError]: "Hash contains state but the interaction type does not match the caller.",
    [ErrorCodes.interactionInProgress]: `Interaction is currently in progress. Please ensure that this interaction has been completed before calling an interactive API.   ${ErrorLink}`,
    [ErrorCodes.popupWindowError]: "Error opening popup window. This can happen if you are using IE or if popups are blocked in the browser.",
    [ErrorCodes.emptyWindowError]: "window.open returned null or undefined window object.",
    [ErrorCodes.userCancelledError]: "User cancelled the flow.",
    [ErrorCodes.monitorPopupTimeoutError]: `Token acquisition in popup failed due to timeout.  ${ErrorLink}`,
    [ErrorCodes.monitorIframeTimeoutError]: `Token acquisition in iframe failed due to timeout.  ${ErrorLink}`,   
    [ErrorCodes.redirectInIframeError]: "Redirects are not supported for iframed or brokered applications. Please ensure you are using MSAL.js in a top frame of the window if using the redirect APIs, or use the popup APIs.",  
    [ErrorCodes.blockTokenRequestsInHiddenIframeError]: `Request was blocked inside an iframe because MSAL detected an authentication response.  ${ErrorLink}`,
    [ErrorCodes.blockAcquireTokenInPopupsError]: "Request was blocked inside a popup because MSAL detected it was running in a popup.",
    [ErrorCodes.iframeClosedPrematurelyError]: "The iframe being monitored was closed prematurely.",
    [ErrorCodes.silentLogoutUnsupportedError]: "Silent logout not supported. Please call logoutRedirect or logoutPopup instead.",
    [ErrorCodes.noAccountError]: "No account object provided to acquireTokenSilent and no active account has been set. Please call setActiveAccount or provide an account on the request.",
    [ErrorCodes.silentPromptValueError]: "The value given for the prompt value is not valid for silent requests - must be set to 'none' or 'no_session'.",
    [ErrorCodes.noTokenRequestCacheError]: "No token request found in cache.",
    [ErrorCodes.unableToParseTokenRequestCacheError]: "The cached token request could not be parsed.",
    [ErrorCodes.noCachedAuthorityError]: "No cached authority found.",  
    [ErrorCodes.authRequestNotSet]: "Auth Request not set. Please ensure initiateAuthRequest was called from the InteractionHandler",   
    [ErrorCodes.invalidCacheType]: "Invalid cache type",  
    [ErrorCodes.notInBrowserEnvironment]: "Login and token requests are not supported in non-browser environments.",
    [ErrorCodes.databaseNotOpen]: "Database is not open!", 
    [ErrorCodes.noNetworkConnectivity]: "No network connectivity. Check your internet connection.",
    [ErrorCodes.postRequestFailed]: "Network request failed: If the browser threw a CORS error, check that the redirectUri is registered in the Azure App Portal as type 'SPA'",
    [ErrorCodes.getRequestFailed]: "Network request failed. Please check the network trace to determine root cause.",
    [ErrorCodes.failedToParseNetworkResponse]: "Failed to parse network response. Check network trace.",
    [ErrorCodes.unableToLoadTokenError]: "Error loading token to cache.",  
    [ErrorCodes.signingKeyNotFoundInStorage]: "Cryptographic Key or Keypair not found in browser storage.", 
    [ErrorCodes.authCodeRequired]: "An authorization code must be provided (as the `code` property on the request) to this flow.", 
    [ErrorCodes.authCodeOrNativeAccountRequired]: "An authorization code or nativeAccountId must be provided to this flow.",  
    [ErrorCodes.spaCodeAndNativeAccountPresent]: "Request cannot contain both spa code and native account id.", 
    [ErrorCodes.databaseUnavailable]: "IndexedDB, which is required for persistent cryptographic key storage, is unavailable. This may be caused by browser privacy features which block persistent storage in third-party contexts.", 
    [ErrorCodes.unableToAcquireTokenFromNativePlatform]: `Unable to acquire token from native platform.  ${ErrorLink}`,
    [ErrorCodes.nativeHandshakeTimeout]: "Timed out while attempting to establish connection to browser extension",
    [ErrorCodes.nativeExtensionNotInstalled]: "Native extension is not installed. If you think this is a mistake call the initialize function.",
    [ErrorCodes.nativeConnectionNotEstablished]: `Connection to native platform has not been established. Please install a compatible browser extension and run initialize().  ${ErrorLink}`,
    [ErrorCodes.uninitializedPublicClientApplication]: `You must call and await the initialize function before attempting to call any other MSAL API.  ${ErrorLink}`,
    [ErrorCodes.nativePromptNotSupported]: "The provided prompt is not supported by the native platform. This request should be routed to the web based flow."
};

/**
 * BrowserAuthErrorMessage class containing string constants used by error codes and messages.
 * @deprecated Use BrowserAuthErrorCodes instead
 */
export const BrowserAuthErrorMessage = {
    pkceNotGenerated: {
        code: ErrorCodes.pkceNotGenerated,
        desc: ErrorMessages[ErrorCodes.pkceNotGenerated],
    },
    cryptoDoesNotExist: {
        code: ErrorCodes.cryptoDoesNotExist,
        desc: ErrorMessages[ErrorCodes.cryptoDoesNotExist],
    },
    emptyNavigateUriError: {
        code: ErrorCodes.emptyNavigateUriError,
        desc: ErrorMessages[ErrorCodes.emptyNavigateUriError],
    },
    hashEmptyError: {
        code: ErrorCodes.hashEmptyError,
        desc: ErrorMessages[ErrorCodes.hashEmptyError],
    },
    hashDoesNotContainStateError: {
        code: ErrorCodes.hashDoesNotContainStateError,
        desc: ErrorMessages[ErrorCodes.hashDoesNotContainStateError],
    },
    hashDoesNotContainKnownPropertiesError: {
        code: ErrorCodes.hashDoesNotContainKnownPropertiesError ,
        desc: ErrorMessages[ErrorCodes.hashDoesNotContainKnownPropertiesError],
    },
    unableToParseStateError: {
        code: ErrorCodes.unableToParseStateError,
        desc: ErrorMessages[ErrorCodes.unableToParseStateError],
    },
    stateInteractionTypeMismatchError: {
        code: ErrorCodes.stateInteractionTypeMismatchError,
        desc: ErrorMessages[ErrorCodes.stateInteractionTypeMismatchError],
    },
    interactionInProgress: {
        code: ErrorCodes.interactionInProgress,
        desc: ErrorMessages[ErrorCodes.interactionInProgress],
    },
    popupWindowError: {
        code: ErrorCodes.popupWindowError,
        desc: ErrorMessages[ErrorCodes.popupWindowError],
    },
    emptyWindowError: {
        code: ErrorCodes.emptyWindowError,
        desc: ErrorMessages[ErrorCodes.emptyWindowError],
    },
    userCancelledError: {
        code: ErrorCodes.userCancelledError,
        desc: ErrorMessages[ErrorCodes.userCancelledError],
    },
    monitorPopupTimeoutError: {
        code: ErrorCodes.monitorPopupTimeoutError,
        desc: ErrorMessages[ErrorCodes.monitorPopupTimeoutError],
    },
    monitorIframeTimeoutError: {
        code: ErrorCodes.monitorIframeTimeoutError,
        desc: ErrorMessages[ErrorCodes.monitorIframeTimeoutError],
    },
    redirectInIframeError: {
        code: ErrorCodes.redirectInIframeError,
        desc: ErrorMessages[ErrorCodes.redirectInIframeError],
    },
    blockTokenRequestsInHiddenIframeError: {
        code: ErrorCodes.blockTokenRequestsInHiddenIframeError,
        desc: ErrorMessages[ErrorCodes.blockTokenRequestsInHiddenIframeError],
    },
    blockAcquireTokenInPopupsError: {
        code: ErrorCodes.blockAcquireTokenInPopupsError,
        desc: ErrorMessages[ErrorCodes.blockAcquireTokenInPopupsError],
    },
    iframeClosedPrematurelyError: {
        code: ErrorCodes.iframeClosedPrematurelyError,
        desc: ErrorMessages[ErrorCodes.iframeClosedPrematurelyError],
    },
    silentLogoutUnsupportedError: {
        code: ErrorCodes.silentLogoutUnsupportedError,
        desc: ErrorMessages[ErrorCodes.silentLogoutUnsupportedError],
    },
    noAccountError: {
        code: ErrorCodes.noAccountError,
        desc: ErrorMessages[ErrorCodes.noAccountError],
    },
    silentPromptValueError: {
        code: ErrorCodes.silentPromptValueError,
        desc: ErrorMessages[ErrorCodes.silentPromptValueError],
    },
    noTokenRequestCacheError: {
        code: ErrorCodes.noTokenRequestCacheError,
        desc: ErrorMessages[ErrorCodes.noTokenRequestCacheError],
    },
    unableToParseTokenRequestCacheError: {
        code: ErrorCodes.unableToParseTokenRequestCacheError,
        desc: ErrorMessages[ErrorCodes.unableToParseTokenRequestCacheError],
    },
    noCachedAuthorityError: {
        code: ErrorCodes.noCachedAuthorityError,
        desc: ErrorMessages[ErrorCodes.noCachedAuthorityError],
    },
    authRequestNotSet: {
        code: ErrorCodes.authRequestNotSet,
        desc: ErrorMessages[ErrorCodes.authRequestNotSet],
    },
    invalidCacheType: {
        code: ErrorCodes.invalidCacheType,
        desc: ErrorMessages[ErrorCodes.invalidCacheType],
    },
    notInBrowserEnvironment: {
        code: ErrorCodes.notInBrowserEnvironment,
        desc: ErrorMessages[ErrorCodes.notInBrowserEnvironment],
    },
    databaseNotOpen: {
        code: ErrorCodes.databaseNotOpen,
        desc: ErrorMessages[ErrorCodes.databaseNotOpen],
    },
    noNetworkConnectivity: {
        code: ErrorCodes.noNetworkConnectivity,
        desc: ErrorMessages[ErrorCodes.noNetworkConnectivity],
    },
    postRequestFailed: {
        code: ErrorCodes.postRequestFailed,
        desc: ErrorMessages[ErrorCodes.postRequestFailed],
    },
    getRequestFailed: {
        code: ErrorCodes.getRequestFailed,
        desc: ErrorMessages[ErrorCodes.getRequestFailed],
    },
    failedToParseNetworkResponse: {
        code: ErrorCodes.failedToParseNetworkResponse,
        desc: ErrorMessages[ErrorCodes.failedToParseNetworkResponse],
    },
    unableToLoadTokenError: {
        code: ErrorCodes.unableToLoadTokenError,
        desc: ErrorMessages[ErrorCodes.unableToLoadTokenError],
    },
    signingKeyNotFoundInStorage: {
        code: ErrorCodes.signingKeyNotFoundInStorage,
        desc: ErrorMessages[ErrorCodes.signingKeyNotFoundInStorage],
    },
    authCodeRequired: {
        code: ErrorCodes.authCodeRequired,
        desc: ErrorMessages[ErrorCodes.authCodeRequired],
    },
    authCodeOrNativeAccountRequired: {
        code: ErrorCodes.authCodeOrNativeAccountRequired,
        desc: ErrorMessages[ErrorCodes.authCodeOrNativeAccountRequired],
    },
    spaCodeAndNativeAccountPresent: {
        code: ErrorCodes.spaCodeAndNativeAccountPresent,
        desc: ErrorMessages[ErrorCodes.spaCodeAndNativeAccountPresent],
    },
    databaseUnavailable: {
        code: ErrorCodes.databaseUnavailable,
        desc: ErrorMessages[ErrorCodes.databaseUnavailable],
    },
    unableToAcquireTokenFromNativePlatform: {
        code: ErrorCodes.unableToAcquireTokenFromNativePlatform,
        desc: ErrorMessages[ErrorCodes.unableToAcquireTokenFromNativePlatform],
    },
    nativeHandshakeTimeout: {
        code: ErrorCodes.nativeHandshakeTimeout,
        desc: ErrorMessages[ErrorCodes.nativeHandshakeTimeout],
    },
    nativeExtensionNotInstalled: {
        code: ErrorCodes.nativeExtensionNotInstalled,
        desc: ErrorMessages[ErrorCodes.nativeExtensionNotInstalled],
    },
    nativeConnectionNotEstablished: {
        code: ErrorCodes.nativeConnectionNotEstablished,
        desc: ErrorMessages[ErrorCodes.nativeConnectionNotEstablished],
    },
    uninitializedPublicClientApplication: {
        code: ErrorCodes.uninitializedPublicClientApplication,
        desc: ErrorMessages[ErrorCodes.uninitializedPublicClientApplication],
    },
    nativePromptNotSupported: {
        code: ErrorCodes.nativePromptNotSupported,
        desc: ErrorMessages[ErrorCodes.nativePromptNotSupported],
    },
};

/**
 * Browser library error class thrown by the MSAL.js library for SPAs
 */
export class BrowserAuthError extends AuthError {
    constructor(errorCode: string) {
        super(errorCode, ErrorMessages[errorCode]);

        Object.setPrototypeOf(this, BrowserAuthError.prototype);
        this.name = "BrowserAuthError";
    }
}
