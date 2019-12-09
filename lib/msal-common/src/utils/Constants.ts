/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export const Constants = {
    // Prefix for all library cache entries
    CACHE_PREFIX: "msal",
    // Resource delimiter - used for certain cache entries
    RESOURCE_DELIM: "|",
    // Placeholder for non-existent account ids/objects
    NO_ACCOUNT: "NO_ACCOUNT",
    INTERACTION_IN_PROGRESS: "interaction_in_progress"
};

/**
 * @hidden
 * CacheKeys for MSAL
 */
export enum TemporaryCacheKeys {
    AUTHORITY = "authority",
    ACQUIRE_TOKEN_ACCOUNT = "acquireTokenAccount",
    SESSION_STATE = "session.state",
    REQUEST_STATE = "state.request",
    NONCE_IDTOKEN = "nonce.idtoken",
    ORIGIN_URI = "login.request",
    RENEW_STATUS = "token.renew.status",
    URL_HASH = "urlHash",
    INTERACTION_STATUS = "interaction.status",
    REQUEST_PARAMS = "request.params",
    REDIRECT_REQUEST = "redirect.request"
};

export enum AuthApiType {
    LOGIN = "login_auth_api_type",
    ACQUIRE_TOKEN = "acquire_token_auth_api_type",
    SILENT = "silent_auth_api_type"
};

export enum PersistentCacheKeys {
    ID_TOKEN = "idtoken",
    CLIENT_INFO = "client.info",
    ADAL_ID_TOKEN = "adal.idtoken",
};

export enum ErrorCacheKeys {
    LOGIN_ERROR = "login.error",
    ERROR = "error",
    ERROR_DESC = "error.description"
}

/**
 * List of pre-established trusted host URLs. 
 */
export const AADTrustedHostList: string[] = [
    "login.windows.net",
    "login.chinacloudapi.cn",
    "login.cloudgovapi.us",
    "login.microsoftonline.com",
    "login.microsoftonline.de",
    "login.microsoftonline.us"
];

/**
 * String constants related to AAD Authority
 */
export enum AADAuthorityConstants {
    COMMON = "common",
    ORGANIZATIONS = "organizations",
    CONSUMERS = "consumers"
};

/**
 * Keys in the hashParams sent by AAD Server
 */
export enum AADServerHashParamKeys {
    SCOPE = "scope",
    ERROR = "error",
    ERROR_DESCRIPTION = "error_description",
    ACCESS_TOKEN = "access_token",
    ID_TOKEN = "id_token",
    EXPIRES_IN = "expires_in",
    SESSION_STATE = "session_state",
    CLIENT_INFO = "client_info",
    CODE = "code"
};

/**
 * IdToken claim string constants
 */
export enum IdTokenClaimName {
    ISSUER = "iss",
    OBJID = "oid",
    SUBJECT = "sub",
    TENANTID = "tid",
    VERSION = "ver",
    PREF_USERNAME = "preferred_username",
    NAME = "name",
    NONCE = "nonce",
    EXPIRATION = "exp",
    HOME_OBJID = "home_oid",
    SESSIONID = "sid",
    CLOUD_INSTANCE_HOSTNAME = "cloud_instance_host_name"
}
