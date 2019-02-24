/**
  * Copyright (c) Microsoft Corporation
  *  All Rights Reserved
  *  MIT License
  *
  * Permission is hereby granted, free of charge, to any person obtaining a copy of this
  * software and associated documentation files (the "Software"), to deal in the Software
  * without restriction, including without limitation the rights to use, copy, modify,
  * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
  * permit persons to whom the Software is furnished to do so, subject to the following
  * conditions:
  *
  * The above copyright notice and this permission notice shall be
  * included in all copies or substantial portions of the Software.
  *
  * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
  * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
  * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
  * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
  * OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
  */


export const E = {

    // Client Authentication Errors
    multipleMatchingTokens: {
        code: "multiple_matching_tokens",
        desc: "The cache contains multiple tokens satisfying the requirements. " +
            "Call AcquireToken again providing more requirements like authority."
    },
    multipleMatchingAuthorities: {
        code: "multiple_matching_authorities",
        desc: "Multiple authorities found in the cache. Pass authority in the API overload"
    },
    endpointResolutionError: {
        code: "endpoints_resolution_error",
        desc: "ErrorL: could not resolve endpoints. Please check network and try again"
    },
    popUpWindowError: {
        code: "popup_window_error",
        desc: "Error opening popup window. This can happen if you are using IE or if popups are blocked in the browser"
    },
    tokenRenewalError: {
        code: "token_renewal_error",
        desc: "Token renewal operation failed due to timeout"
    },
    invalidStateError: {
        code: "invalid_state_error",
        desc: "Invalid state"
    },
    nonceMismatchError: {
        code: "nonce_mismatch_error",
        desc: "Nonce is not matching, Nonce received: "
    },
    loginProgressError: {
        code: "login_progress_error",
        desc: "Login_In_Progress: Error during login call - login is already in progress"
    },
    acquireTokenProgressError: {
        code: "acquiretoken_progress_error",
        desc: "AcquireToken_In_Progress: Error during login call - login is already in progress."
    },
    userCancelledError: {
        code: "user_cancelled",
        desc: "User cancelled the flow"
    },
    callbackError: {
        code: "callback_error",
        desc: "Error occurred in token received callback function"
    },

    // Configuration Errors
    invalidCacheLocation: {
        code: "invalid_cache_location",
        desc: "The cache contains multiple tokens satisfying the requirements" +
            "Call AcquireToken again providing more requirements like authority."
    },
    noCallback: {
        code: "no_callback",
        desc: "Error in configuration: no callback(s) registered for login/acquireTokenRedirect flows." +
            "Please call handleRedirectCallbacks() with the appropriate callback signatures." +
            "More information is available here: https://github.com/AzureAD/microsoft-authentication-library-for-js/wiki/-basics"
    },
    emptyScopes: {
        code: "empty_input_scopes_error",
        desc: "Scopes cannot be passed as empty array"
    },
    nonArrayScopes: {
        code: "nonarray_input_scopes_error",
        desc: "Scopes cannot be passed as non-array"
    },
    clientScope: {
        code: "clientid_input_scopes_error",
        desc: "Client ID can only be provided as a single scope"
    },

    // Server Authentication Errors
    serverUnavailable: {
        code: "server_unavailable",
        desc: "Server is temporarily unavailable"
    },
    unknownServerError: {
        code: "unknown_server_error",
        desc: "Unknown server error"
    },

    // Interaction Required Errors
    loginRequired: {
        code: "login_required",
        desc: "login_required: User must login"
    },
    interactionRequired: {
        code: "interaction_required",
        desc: "interaction_required: "
    },
    consentRequired: {
        code: "consent_required",
        desc: "consent_required: "
    },

    // No bucket failure
    userLoginError: {
        code: "user_login_error",
        desc: "User login is required"
    },
    unexpectedError: {
        code: "unexpected_error",
        desc: "unexpected error in authentication"
    }
};
