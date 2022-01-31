"use strict";
/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheOutcome = exports.RegionDiscoveryOutcomes = exports.RegionDiscoverySources = exports.ResponseCodes = exports.PasswordGrantConstants = exports.Errors = exports.ThrottlingConstants = exports.AuthenticationScheme = exports.SERVER_TELEM_CONSTANTS = exports.AuthorityMetadataSource = exports.AUTHORITY_METADATA_CONSTANTS = exports.THE_FAMILY_ID = exports.CLIENT_INFO = exports.APP_METADATA = exports.CacheType = exports.CacheSchemaType = exports.CredentialType = exports.Separators = exports.CacheAccountType = exports.GrantType = exports.ResponseMode = exports.CodeChallengeMethodValuesArray = exports.CodeChallengeMethodValues = exports.BlacklistedEQParams = exports.SSOTypes = exports.PromptValue = exports.ClaimsRequestKeys = exports.AADServerParamKeys = exports.AADAuthorityConstants = exports.PersistentCacheKeys = exports.HeaderNames = exports.OIDC_SCOPES = exports.OIDC_DEFAULT_SCOPES = exports.Constants = void 0;
var tslib_1 = require("tslib");
exports.Constants = {
    LIBRARY_NAME: "MSAL.JS",
    SKU: "msal.js.common",
    // Prefix for all library cache entries
    CACHE_PREFIX: "msal",
    // default authority
    DEFAULT_AUTHORITY: "https://login.microsoftonline.com/common/",
    DEFAULT_AUTHORITY_HOST: "login.microsoftonline.com",
    // ADFS String
    ADFS: "adfs",
    // Default AAD Instance Discovery Endpoint
    AAD_INSTANCE_DISCOVERY_ENDPT: "https://login.microsoftonline.com/common/discovery/instance?api-version=1.1&authorization_endpoint=",
    // Resource delimiter - used for certain cache entries
    RESOURCE_DELIM: "|",
    // Placeholder for non-existent account ids/objects
    NO_ACCOUNT: "NO_ACCOUNT",
    // Claims
    CLAIMS: "claims",
    // Consumer UTID
    CONSUMER_UTID: "9188040d-6c67-4c5b-b112-36a304b66dad",
    // Default scopes
    OPENID_SCOPE: "openid",
    PROFILE_SCOPE: "profile",
    OFFLINE_ACCESS_SCOPE: "offline_access",
    EMAIL_SCOPE: "email",
    // Default response type for authorization code flow
    CODE_RESPONSE_TYPE: "code",
    CODE_GRANT_TYPE: "authorization_code",
    RT_GRANT_TYPE: "refresh_token",
    FRAGMENT_RESPONSE_MODE: "fragment",
    S256_CODE_CHALLENGE_METHOD: "S256",
    URL_FORM_CONTENT_TYPE: "application/x-www-form-urlencoded;charset=utf-8",
    AUTHORIZATION_PENDING: "authorization_pending",
    NOT_DEFINED: "not_defined",
    EMPTY_STRING: "",
    FORWARD_SLASH: "/",
    IMDS_ENDPOINT: "http://169.254.169.254/metadata/instance/compute/location",
    IMDS_VERSION: "2020-06-01",
    IMDS_TIMEOUT: 2000,
    AZURE_REGION_AUTO_DISCOVER_FLAG: "TryAutoDetect",
    REGIONAL_AUTH_PUBLIC_CLOUD_SUFFIX: "login.microsoft.com",
    KNOWN_PUBLIC_CLOUDS: ["login.microsoftonline.com", "login.windows.net", "login.microsoft.com", "sts.windows.net"]
};
exports.OIDC_DEFAULT_SCOPES = [
    exports.Constants.OPENID_SCOPE,
    exports.Constants.PROFILE_SCOPE,
    exports.Constants.OFFLINE_ACCESS_SCOPE
];
exports.OIDC_SCOPES = (0, tslib_1.__spreadArray)((0, tslib_1.__spreadArray)([], exports.OIDC_DEFAULT_SCOPES, true), [
    exports.Constants.EMAIL_SCOPE
], false);
/**
 * Request header names
 */
var HeaderNames;
(function (HeaderNames) {
    HeaderNames["CONTENT_TYPE"] = "Content-Type";
    HeaderNames["RETRY_AFTER"] = "Retry-After";
    HeaderNames["CCS_HEADER"] = "X-AnchorMailbox";
    HeaderNames["WWWAuthenticate"] = "WWW-Authenticate";
    HeaderNames["AuthenticationInfo"] = "Authentication-Info";
})(HeaderNames = exports.HeaderNames || (exports.HeaderNames = {}));
/**
 * Persistent cache keys MSAL which stay while user is logged in.
 */
var PersistentCacheKeys;
(function (PersistentCacheKeys) {
    PersistentCacheKeys["ID_TOKEN"] = "idtoken";
    PersistentCacheKeys["CLIENT_INFO"] = "client.info";
    PersistentCacheKeys["ADAL_ID_TOKEN"] = "adal.idtoken";
    PersistentCacheKeys["ERROR"] = "error";
    PersistentCacheKeys["ERROR_DESC"] = "error.description";
    PersistentCacheKeys["ACTIVE_ACCOUNT"] = "active-account";
})(PersistentCacheKeys = exports.PersistentCacheKeys || (exports.PersistentCacheKeys = {}));
/**
 * String constants related to AAD Authority
 */
var AADAuthorityConstants;
(function (AADAuthorityConstants) {
    AADAuthorityConstants["COMMON"] = "common";
    AADAuthorityConstants["ORGANIZATIONS"] = "organizations";
    AADAuthorityConstants["CONSUMERS"] = "consumers";
})(AADAuthorityConstants = exports.AADAuthorityConstants || (exports.AADAuthorityConstants = {}));
/**
 * Keys in the hashParams sent by AAD Server
 */
var AADServerParamKeys;
(function (AADServerParamKeys) {
    AADServerParamKeys["CLIENT_ID"] = "client_id";
    AADServerParamKeys["REDIRECT_URI"] = "redirect_uri";
    AADServerParamKeys["RESPONSE_TYPE"] = "response_type";
    AADServerParamKeys["RESPONSE_MODE"] = "response_mode";
    AADServerParamKeys["GRANT_TYPE"] = "grant_type";
    AADServerParamKeys["CLAIMS"] = "claims";
    AADServerParamKeys["SCOPE"] = "scope";
    AADServerParamKeys["ERROR"] = "error";
    AADServerParamKeys["ERROR_DESCRIPTION"] = "error_description";
    AADServerParamKeys["ACCESS_TOKEN"] = "access_token";
    AADServerParamKeys["ID_TOKEN"] = "id_token";
    AADServerParamKeys["REFRESH_TOKEN"] = "refresh_token";
    AADServerParamKeys["EXPIRES_IN"] = "expires_in";
    AADServerParamKeys["STATE"] = "state";
    AADServerParamKeys["NONCE"] = "nonce";
    AADServerParamKeys["PROMPT"] = "prompt";
    AADServerParamKeys["SESSION_STATE"] = "session_state";
    AADServerParamKeys["CLIENT_INFO"] = "client_info";
    AADServerParamKeys["CODE"] = "code";
    AADServerParamKeys["CODE_CHALLENGE"] = "code_challenge";
    AADServerParamKeys["CODE_CHALLENGE_METHOD"] = "code_challenge_method";
    AADServerParamKeys["CODE_VERIFIER"] = "code_verifier";
    AADServerParamKeys["CLIENT_REQUEST_ID"] = "client-request-id";
    AADServerParamKeys["X_CLIENT_SKU"] = "x-client-SKU";
    AADServerParamKeys["X_CLIENT_VER"] = "x-client-VER";
    AADServerParamKeys["X_CLIENT_OS"] = "x-client-OS";
    AADServerParamKeys["X_CLIENT_CPU"] = "x-client-CPU";
    AADServerParamKeys["X_CLIENT_CURR_TELEM"] = "x-client-current-telemetry";
    AADServerParamKeys["X_CLIENT_LAST_TELEM"] = "x-client-last-telemetry";
    AADServerParamKeys["X_MS_LIB_CAPABILITY"] = "x-ms-lib-capability";
    AADServerParamKeys["POST_LOGOUT_URI"] = "post_logout_redirect_uri";
    AADServerParamKeys["ID_TOKEN_HINT"] = "id_token_hint";
    AADServerParamKeys["DEVICE_CODE"] = "device_code";
    AADServerParamKeys["CLIENT_SECRET"] = "client_secret";
    AADServerParamKeys["CLIENT_ASSERTION"] = "client_assertion";
    AADServerParamKeys["CLIENT_ASSERTION_TYPE"] = "client_assertion_type";
    AADServerParamKeys["TOKEN_TYPE"] = "token_type";
    AADServerParamKeys["REQ_CNF"] = "req_cnf";
    AADServerParamKeys["OBO_ASSERTION"] = "assertion";
    AADServerParamKeys["REQUESTED_TOKEN_USE"] = "requested_token_use";
    AADServerParamKeys["ON_BEHALF_OF"] = "on_behalf_of";
    AADServerParamKeys["FOCI"] = "foci";
    AADServerParamKeys["CCS_HEADER"] = "X-AnchorMailbox";
    AADServerParamKeys["RETURN_SPA_CODE"] = "return_spa_code";
})(AADServerParamKeys = exports.AADServerParamKeys || (exports.AADServerParamKeys = {}));
/**
 * Claims request keys
 */
var ClaimsRequestKeys;
(function (ClaimsRequestKeys) {
    ClaimsRequestKeys["ACCESS_TOKEN"] = "access_token";
    ClaimsRequestKeys["XMS_CC"] = "xms_cc";
})(ClaimsRequestKeys = exports.ClaimsRequestKeys || (exports.ClaimsRequestKeys = {}));
/**
 * we considered making this "enum" in the request instead of string, however it looks like the allowed list of
 * prompt values kept changing over past couple of years. There are some undocumented prompt values for some
 * internal partners too, hence the choice of generic "string" type instead of the "enum"
 */
exports.PromptValue = {
    LOGIN: "login",
    SELECT_ACCOUNT: "select_account",
    CONSENT: "consent",
    NONE: "none",
    CREATE: "create"
};
/**
 * SSO Types - generated to populate hints
 */
var SSOTypes;
(function (SSOTypes) {
    SSOTypes["ACCOUNT"] = "account";
    SSOTypes["SID"] = "sid";
    SSOTypes["LOGIN_HINT"] = "login_hint";
    SSOTypes["ID_TOKEN"] = "id_token";
    SSOTypes["DOMAIN_HINT"] = "domain_hint";
    SSOTypes["ORGANIZATIONS"] = "organizations";
    SSOTypes["CONSUMERS"] = "consumers";
    SSOTypes["ACCOUNT_ID"] = "accountIdentifier";
    SSOTypes["HOMEACCOUNT_ID"] = "homeAccountIdentifier";
})(SSOTypes = exports.SSOTypes || (exports.SSOTypes = {}));
/**
 * Disallowed extra query parameters.
 */
exports.BlacklistedEQParams = [
    SSOTypes.SID,
    SSOTypes.LOGIN_HINT
];
/**
 * allowed values for codeVerifier
 */
exports.CodeChallengeMethodValues = {
    PLAIN: "plain",
    S256: "S256"
};
/**
 * The method used to encode the code verifier for the code challenge parameter. can be one
 * of plain or s256. if excluded, code challenge is assumed to be plaintext. for more
 * information, see the pkce rcf: https://tools.ietf.org/html/rfc7636
 */
exports.CodeChallengeMethodValuesArray = [
    exports.CodeChallengeMethodValues.PLAIN,
    exports.CodeChallengeMethodValues.S256
];
/**
 * allowed values for response_mode
 */
var ResponseMode;
(function (ResponseMode) {
    ResponseMode["QUERY"] = "query";
    ResponseMode["FRAGMENT"] = "fragment";
    ResponseMode["FORM_POST"] = "form_post";
})(ResponseMode = exports.ResponseMode || (exports.ResponseMode = {}));
/**
 * allowed grant_type
 */
var GrantType;
(function (GrantType) {
    GrantType["IMPLICIT_GRANT"] = "implicit";
    GrantType["AUTHORIZATION_CODE_GRANT"] = "authorization_code";
    GrantType["CLIENT_CREDENTIALS_GRANT"] = "client_credentials";
    GrantType["RESOURCE_OWNER_PASSWORD_GRANT"] = "password";
    GrantType["REFRESH_TOKEN_GRANT"] = "refresh_token";
    GrantType["DEVICE_CODE_GRANT"] = "device_code";
    GrantType["JWT_BEARER"] = "urn:ietf:params:oauth:grant-type:jwt-bearer";
})(GrantType = exports.GrantType || (exports.GrantType = {}));
/**
 * Account types in Cache
 */
var CacheAccountType;
(function (CacheAccountType) {
    CacheAccountType["MSSTS_ACCOUNT_TYPE"] = "MSSTS";
    CacheAccountType["ADFS_ACCOUNT_TYPE"] = "ADFS";
    CacheAccountType["MSAV1_ACCOUNT_TYPE"] = "MSA";
    CacheAccountType["GENERIC_ACCOUNT_TYPE"] = "Generic"; // NTLM, Kerberos, FBA, Basic etc
})(CacheAccountType = exports.CacheAccountType || (exports.CacheAccountType = {}));
/**
 * Separators used in cache
 */
var Separators;
(function (Separators) {
    Separators["CACHE_KEY_SEPARATOR"] = "-";
    Separators["CLIENT_INFO_SEPARATOR"] = ".";
})(Separators = exports.Separators || (exports.Separators = {}));
/**
 * Credential Type stored in the cache
 */
var CredentialType;
(function (CredentialType) {
    CredentialType["ID_TOKEN"] = "IdToken";
    CredentialType["ACCESS_TOKEN"] = "AccessToken";
    CredentialType["ACCESS_TOKEN_WITH_AUTH_SCHEME"] = "AccessToken_With_AuthScheme";
    CredentialType["REFRESH_TOKEN"] = "RefreshToken";
})(CredentialType = exports.CredentialType || (exports.CredentialType = {}));
/**
 * Credential Type stored in the cache
 */
var CacheSchemaType;
(function (CacheSchemaType) {
    CacheSchemaType["ACCOUNT"] = "Account";
    CacheSchemaType["CREDENTIAL"] = "Credential";
    CacheSchemaType["ID_TOKEN"] = "IdToken";
    CacheSchemaType["ACCESS_TOKEN"] = "AccessToken";
    CacheSchemaType["REFRESH_TOKEN"] = "RefreshToken";
    CacheSchemaType["APP_METADATA"] = "AppMetadata";
    CacheSchemaType["TEMPORARY"] = "TempCache";
    CacheSchemaType["TELEMETRY"] = "Telemetry";
    CacheSchemaType["UNDEFINED"] = "Undefined";
    CacheSchemaType["THROTTLING"] = "Throttling";
})(CacheSchemaType = exports.CacheSchemaType || (exports.CacheSchemaType = {}));
/**
 * Combine all cache types
 */
var CacheType;
(function (CacheType) {
    CacheType[CacheType["ADFS"] = 1001] = "ADFS";
    CacheType[CacheType["MSA"] = 1002] = "MSA";
    CacheType[CacheType["MSSTS"] = 1003] = "MSSTS";
    CacheType[CacheType["GENERIC"] = 1004] = "GENERIC";
    CacheType[CacheType["ACCESS_TOKEN"] = 2001] = "ACCESS_TOKEN";
    CacheType[CacheType["REFRESH_TOKEN"] = 2002] = "REFRESH_TOKEN";
    CacheType[CacheType["ID_TOKEN"] = 2003] = "ID_TOKEN";
    CacheType[CacheType["APP_METADATA"] = 3001] = "APP_METADATA";
    CacheType[CacheType["UNDEFINED"] = 9999] = "UNDEFINED";
})(CacheType = exports.CacheType || (exports.CacheType = {}));
/**
 * More Cache related constants
 */
exports.APP_METADATA = "appmetadata";
exports.CLIENT_INFO = "client_info";
exports.THE_FAMILY_ID = "1";
exports.AUTHORITY_METADATA_CONSTANTS = {
    CACHE_KEY: "authority-metadata",
    REFRESH_TIME_SECONDS: 3600 * 24 // 24 Hours
};
var AuthorityMetadataSource;
(function (AuthorityMetadataSource) {
    AuthorityMetadataSource["CONFIG"] = "config";
    AuthorityMetadataSource["CACHE"] = "cache";
    AuthorityMetadataSource["NETWORK"] = "network";
})(AuthorityMetadataSource = exports.AuthorityMetadataSource || (exports.AuthorityMetadataSource = {}));
exports.SERVER_TELEM_CONSTANTS = {
    SCHEMA_VERSION: 5,
    MAX_CUR_HEADER_BYTES: 80,
    MAX_LAST_HEADER_BYTES: 330,
    MAX_CACHED_ERRORS: 50,
    CACHE_KEY: "server-telemetry",
    CATEGORY_SEPARATOR: "|",
    VALUE_SEPARATOR: ",",
    OVERFLOW_TRUE: "1",
    OVERFLOW_FALSE: "0",
    UNKNOWN_ERROR: "unknown_error"
};
/**
 * Type of the authentication request
 */
var AuthenticationScheme;
(function (AuthenticationScheme) {
    AuthenticationScheme["BEARER"] = "Bearer";
    AuthenticationScheme["POP"] = "pop";
    AuthenticationScheme["SSH"] = "ssh-cert";
})(AuthenticationScheme = exports.AuthenticationScheme || (exports.AuthenticationScheme = {}));
/**
 * Constants related to throttling
 */
exports.ThrottlingConstants = {
    // Default time to throttle RequestThumbprint in seconds
    DEFAULT_THROTTLE_TIME_SECONDS: 60,
    // Default maximum time to throttle in seconds, overrides what the server sends back
    DEFAULT_MAX_THROTTLE_TIME_SECONDS: 3600,
    // Prefix for storing throttling entries
    THROTTLING_PREFIX: "throttling",
    // Value assigned to the x-ms-lib-capability header to indicate to the server the library supports throttling
    X_MS_LIB_CAPABILITY_VALUE: "retry-after, h429"
};
exports.Errors = {
    INVALID_GRANT_ERROR: "invalid_grant",
    CLIENT_MISMATCH_ERROR: "client_mismatch",
};
/**
 * Password grant parameters
 */
var PasswordGrantConstants;
(function (PasswordGrantConstants) {
    PasswordGrantConstants["username"] = "username";
    PasswordGrantConstants["password"] = "password";
})(PasswordGrantConstants = exports.PasswordGrantConstants || (exports.PasswordGrantConstants = {}));
/**
 * Response codes
 */
var ResponseCodes;
(function (ResponseCodes) {
    ResponseCodes[ResponseCodes["httpSuccess"] = 200] = "httpSuccess";
    ResponseCodes[ResponseCodes["httpBadRequest"] = 400] = "httpBadRequest";
})(ResponseCodes = exports.ResponseCodes || (exports.ResponseCodes = {}));
/**
 * Region Discovery Sources
 */
var RegionDiscoverySources;
(function (RegionDiscoverySources) {
    RegionDiscoverySources["FAILED_AUTO_DETECTION"] = "1";
    RegionDiscoverySources["INTERNAL_CACHE"] = "2";
    RegionDiscoverySources["ENVIRONMENT_VARIABLE"] = "3";
    RegionDiscoverySources["IMDS"] = "4";
})(RegionDiscoverySources = exports.RegionDiscoverySources || (exports.RegionDiscoverySources = {}));
/**
 * Region Discovery Outcomes
 */
var RegionDiscoveryOutcomes;
(function (RegionDiscoveryOutcomes) {
    RegionDiscoveryOutcomes["CONFIGURED_MATCHES_DETECTED"] = "1";
    RegionDiscoveryOutcomes["CONFIGURED_NO_AUTO_DETECTION"] = "2";
    RegionDiscoveryOutcomes["CONFIGURED_NOT_DETECTED"] = "3";
    RegionDiscoveryOutcomes["AUTO_DETECTION_REQUESTED_SUCCESSFUL"] = "4";
    RegionDiscoveryOutcomes["AUTO_DETECTION_REQUESTED_FAILED"] = "5";
})(RegionDiscoveryOutcomes = exports.RegionDiscoveryOutcomes || (exports.RegionDiscoveryOutcomes = {}));
var CacheOutcome;
(function (CacheOutcome) {
    CacheOutcome["NO_CACHE_HIT"] = "0";
    CacheOutcome["FORCE_REFRESH"] = "1";
    CacheOutcome["NO_CACHED_ACCESS_TOKEN"] = "2";
    CacheOutcome["CACHED_ACCESS_TOKEN_EXPIRED"] = "3";
    CacheOutcome["REFRESH_CACHED_ACCESS_TOKEN"] = "4";
})(CacheOutcome = exports.CacheOutcome || (exports.CacheOutcome = {}));
//# sourceMappingURL=Constants.js.map