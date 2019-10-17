/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @hidden
 * Constants File which contains string constants used by this library
 */

// Prefix for all library cache entries
export const CACHE_PREFIX = "msal";

// Resource delimiter - used for certain cache entries
export const RESOURCE_DELIM = "|";

// String constant to represent interaction status
export const INTERACTION_IN_PROGRESS = "interaction_in_progress";

/**
 * @hidden
 * Persistent Cache Keys for MSAL - entries kept after every request
 */
export enum PersistentCacheKeys {
    IDTOKEN = "idtoken",
    CLIENT_INFO = "client.info",
    ADAL_ID_TOKEN = "adal.idtoken",
    ERROR = "error",
    ERROR_DESC = "error.description",
    LOGIN_ERROR = "login.error"
}

/**
 * @hidden
 * Temporary Cache Keys for MSAL - entries deleted after every request
 */
export enum TemporaryCacheKeys {
    AUTHORITY = "authority",
    ACQUIRE_TOKEN_ACCOUNT = "acquireTokenAccount",
    SESSION_STATE = "session.state",
    STATE_LOGIN = "state.login",
    STATE_ACQ_TOKEN = "state.acquireToken",
    STATE_RENEW = "state.renew",
    NONCE_IDTOKEN = "nonce.idtoken",
    LOGIN_REQUEST = "login.request",
    RENEW_STATUS = "token.renew.status",
    URL_HASH = "urlHash",
    ANGULAR_LOGIN_REQUEST = "angular.login.request",
    INTERACTION_STATUS = "interaction.status"
}
