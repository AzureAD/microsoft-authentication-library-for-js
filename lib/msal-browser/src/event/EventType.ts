/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export enum EventType {
    LOGIN_START = "msal:loginStart",
    LOGIN_SUCCESS = "msal:loginSuccess",
    LOGIN_FAILURE = "msal:loginFailure",
    ACQUIRE_TOKEN_START = "msal:acquireTokenStart",
    ACQUIRE_TOKEN_SUCCESS = "msal:acquireTokenSuccess",
    ACQUIRE_TOKEN_FAILURE = "msal:acquireTokenFailure",
    ACQUIRE_TOKEN_NETWORK_START = "msal:acquireTokenFromNetworkStart",
    SSO_SILENT_START = "msal:ssoSilentStart",
    SSO_SILENT_SUCCESS = "msal:ssoSilentSuccess",
    SSO_SILENT_FAILURE = "msal:ssoSilentFailure",
    HANDLE_REDIRECT_START = "msal:handleRedirectStart",
    HANDLE_REDIRECT_END = "msal:handleRedirectEnd",
    LOGOUT_START = "msal:logoutStart",
    LOGOUT_SUCCESS = "msal:logoutSuccess",
    LOGOUT_FAILURE = "msal:logoutFailure"
}
