/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { AuthError, StringUtils } from "@azure/msal-common";

/**
 * BrowserAuthErrorMessage class containing string constants used by error codes and messages.
 */
export const BrowserAuthErrorMessage = {
    noWindowObjectError: {
        code: "no_window_object",
        desc: "No window object detected."
    },
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
        desc: "Hash value cannot be processed because it is empty."
    },
    interactionInProgress: {
        code: "interaction_in_progress",
        desc: "Interaction is currently in progress. Please ensure that this interaction has been completed before calling an interactive API."
    },
    popUpWindowError: {
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
    monitorWindowTimeoutError: {
        code: "monitor_window_timeout",
        desc: "Token acquisition in popup failed due to timeout."
    },
    redirectInIframeError: {
        code: "redirect_in_iframe",
        desc: "Code flow is not supported inside an iframe. Please ensure you are using MSAL.js in a top frame of the window if using the redirect APIs, or use the popup APIs."
    },
    blockTokenRequestsInHiddenIframeError: {
        code: "block_iframe_reload",
        desc: "Request was blocked inside an iframe because MSAL detected an authentication response. Please ensure monitorWindowForHash was called."
    },
    iframeClosedPrematurelyError: {
        code: "iframe_closed_prematurely",
        desc: "The iframe being monitored was closed prematurely."
    },
    silentSSOInsufficientInfoError: {
        code: "silent_sso_error",
        desc: "Silent SSO could not be completed - insufficient information was provided. Please provide either a loginHint or sid."
    },
    silentPromptValueError: {
        code: "silent_prompt_value_error",
        desc: "The value given for the prompt value is not valid for silent requests - must be set to 'none'."
    },
    tokenRequestCacheError: {
        code: "token_request_cache_error",
        desc: "The token request could not be fetched from the cache correctly."
    },
    invalidCacheType: {
        code: "invalid_cache_type",
        desc: "Invalid cache type"
    },
    brokerTimeoutError: {
        code: "broker_timeout",
        desc: "Message broker timed out."
    },
    invalidBrokerMessage: {
        code: "invalid_broker_message",
        desc: "messageType for broker message is invalid"
    },
    untrustedBrokerError: {
        code: "untrusted_broker_error",
        desc: "The given broker origin is not trusted."
    },
    noTrustedBrokersProvided: {
        code: "no_trusted_brokers_provided",
        desc: "No trusted brokers provided."
    },
    brokeringDisabledError: {
        code: "brokering_disabled",
        desc: "Brokering is not enabled for the client application. Please check logs to see if handshake was performed."
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
     * Creates error thrown when no window object can be found.
     */
    static createNoWindowObjectError(): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.noWindowObjectError.code, BrowserAuthErrorMessage.noWindowObjectError.desc);
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
        let errorMessage = BrowserAuthErrorMessage.popUpWindowError.desc;
        errorMessage = !StringUtils.isEmpty(errDetail) ? `${errorMessage} Details: ${errDetail}` : errorMessage;
        return new BrowserAuthError(BrowserAuthErrorMessage.popUpWindowError.code, errorMessage);
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
     * Creates an error thrown when monitorWindowFromHash times out for a given popup.
     * @param urlNavigate 
     */
    static createMonitorWindowTimeoutError(): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.monitorWindowTimeoutError.code,
            BrowserAuthErrorMessage.monitorWindowTimeoutError.desc);
    }

    /**
     * Creates an error thrown when navigateWindow is called inside an iframe.
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
     * Creates an error thrown when an iframe is found to be closed before the timeout is reached.
     */
    static createIframeClosedPrematurelyError(): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.iframeClosedPrematurelyError.code, BrowserAuthErrorMessage.iframeClosedPrematurelyError.desc);
    }

    /**
     * Creates an error thrown when the login_hint, sid or account object is not provided in the ssoSilent API.
     */
    static createSilentSSOInsufficientInfoError(): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.silentSSOInsufficientInfoError.code, BrowserAuthErrorMessage.silentSSOInsufficientInfoError.desc);
    }

    /**
     * Creates an error thrown when a given prompt value is invalid for silent requests.
     */
    static createSilentPromptValueError(givenPrompt: string): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.silentPromptValueError.code, `${BrowserAuthErrorMessage.silentPromptValueError.desc} Given value: ${givenPrompt}`);
    }

    /**
     * Creates an error thrown when the token request could not be retrieved from the cache
     * @param errDetail
     */
    static createTokenRequestCacheError(errDetail: string): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.tokenRequestCacheError.code,
            `${BrowserAuthErrorMessage.tokenRequestCacheError.desc} Error Detail: ${errDetail}`);
    }

    /**
    * Creates an error thrown if cache type is invalid.
    */
    static createInvalidCacheTypeError(): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.invalidCacheType.code, `${BrowserAuthErrorMessage.invalidCacheType.desc}`);
    }

    static createMessageBrokerTimeoutError(): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.brokerTimeoutError.code, BrowserAuthErrorMessage.brokerTimeoutError.desc);
    }

    static createInvalidBrokerMessageError(): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.invalidBrokerMessage.code, BrowserAuthErrorMessage.invalidBrokerMessage.desc);
    }

    static createUntrustedBrokerError(): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.untrustedBrokerError.code, BrowserAuthErrorMessage.untrustedBrokerError.desc);
    }

    static createNoTrustedBrokersProvidedError(): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.noTrustedBrokersProvided.code, BrowserAuthErrorMessage.noTrustedBrokersProvided.desc);
    }

    static createBrokeringDisabledError(innerError: string): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.brokeringDisabledError.code, `${BrowserAuthErrorMessage.brokeringDisabledError.desc} Inner Error: ${innerError}`);
    }
}
