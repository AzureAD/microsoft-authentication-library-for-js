/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

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
