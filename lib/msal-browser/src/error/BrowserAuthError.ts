/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { AuthError, StringUtils } from "msal-common";

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
    emptyRedirectUriError: {
        code: "empty_redirect_uri",
        desc: "Redirect URI is empty. Please check stack trace for more info."
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
    userCancelledError: {
        code: "user_cancelled",
        desc: "User cancelled the flow."
    },
    tokenRenewalError: {
        code: "token_renewal_error",
        desc: "Token renewal operation failed due to timeout."
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

    static createNoWindowObjectError(): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.noWindowObjectError.code, BrowserAuthErrorMessage.noWindowObjectError.desc);
    }

    static createPkceNotGeneratedError(errDetail: string): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.pkceNotGenerated.code,
            `${BrowserAuthErrorMessage.pkceNotGenerated.desc} Detail:${errDetail}`);
    }

    static createCryptoNotAvailableError(errDetail: string): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.cryptoDoesNotExist.code, 
            `${BrowserAuthErrorMessage.cryptoDoesNotExist.desc} Detail:${errDetail}`);
    }

    static createHttpMethodNotImplementedError(method: string): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.httpMethodNotImplementedError.code,
            `${BrowserAuthErrorMessage.httpMethodNotImplementedError.desc} Given Method: ${method}`);
    }

    static createEmptyRedirectUriError(): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.emptyRedirectUriError.code, BrowserAuthErrorMessage.emptyRedirectUriError.desc);
    }

    static createEmptyHashError(hashValue: string): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.hashEmptyError.code, `${BrowserAuthErrorMessage.hashEmptyError.desc} Given Url: ${hashValue}`);
    }

    static createInteractionInProgressError(): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.interactionInProgress.code, BrowserAuthErrorMessage.interactionInProgress.desc);
    }

    static createPopupWindowError(errDetail?: string): BrowserAuthError {
        let errorMessage = BrowserAuthErrorMessage.popUpWindowError.desc;
        errorMessage = !StringUtils.isEmpty(errDetail) ? `${errorMessage} Details: ${errDetail}` : errorMessage;
        return new BrowserAuthError(BrowserAuthErrorMessage.popUpWindowError.code, errorMessage);
    }

    static createUserCancelledError(): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.userCancelledError.code,
            BrowserAuthErrorMessage.userCancelledError.desc);
    }

    static createTokenRenewalTimeoutError(urlNavigate: string): BrowserAuthError {
        const errorMessage = `URL navigated to is ${urlNavigate}, ${BrowserAuthErrorMessage.tokenRenewalError.desc}`;
        return new BrowserAuthError(BrowserAuthErrorMessage.tokenRenewalError.code,
            errorMessage);
    }
}
