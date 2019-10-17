/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

 /**
 * @hidden
 * Constants File which contains string constants used by this library
 */

/**
 * @hidden
 * SSO Types - generated to populate hints
 */
export enum SSOConstants {
    ACCOUNT = "account",
    SID = "sid",
    LOGIN_HINT = "login_hint",
    DOMAIN_HINT = "domain_hint",
    ACCOUNT_ID = "accountIdentifier",
    HOMEACCOUNT_ID = "homeAccountIdentifier",
    LOGIN_REQ = "login_req",
    DOMAIN_REQ = "domain_req"
};

export enum AuthorityConstants {
    COMMON = "common",
    ORGANIZATIONS = "organizations",
    CONSUMERS = "consumers"
}

/**
 * Keys in the hashParams
 */
export enum ServerHashParamKeys {
    SCOPE = "scope",
    ERROR = "error",
    ERROR_DESCRIPTION = "error_description",
    ACCESS_TOKEN = "access_token",
    ID_TOKEN = "id_token",
    EXPIRES_IN = "expires_in",
    SESSION_STATE = "session_state",
    CLIENT_INFO = "client_info"
};
