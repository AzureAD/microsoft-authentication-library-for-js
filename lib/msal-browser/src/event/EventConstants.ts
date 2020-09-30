export enum BroadcastEvent {
    LOGIN_START = "msal:loginStart",
    LOGIN_SUCCESS = "msal:loginSuccess",
    LOGIN_FAILURE = "msal:loginFailure",
    ACQUIRE_TOKEN_START = "msal:acquireTokenStart",
    ACQUIRE_TOKEN_SUCCESS = "msal:acquireTokenSuccess",
    ACQUIRE_TOKEN_FAILURE = "msal:acquireTokenFailure",
    ACQUIRE_TOKEN_NETWORK_START = "msal:acquireTokenFromNetworkStart",
    ACQUIRE_TOKEN_NETWORK_END = "msal:acquireTokenFromNetworkEnd",
    SSO_SILENT_START = "msal:ssoSilentStart",
    SSO_SILENT_SUCCESS = "msal:ssoSilentSuccess",
    SSO_SILENT_FAILURE = "msal:ssoSilentFailure",
    HANDLE_REDIRECT_START = "msal:handleRedirectStart",
    HANDLE_REDIRECT_SUCCESS = "msal:handleRedirectSuccess",
    HANDLE_REDIRECT_FAILURE = "msal:handleRedirectFailure"
}
