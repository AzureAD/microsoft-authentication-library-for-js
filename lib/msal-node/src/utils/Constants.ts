/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// MSI Constants. Docs for MSI are available here https://docs.microsoft.com/azure/app-service/overview-managed-identity
export const SECRET_HEADER_NAME: string = "X-IDENTITY-HEADER";
export const METADATA_HEADER_NAME: string = "METADATA";

export const MANAGED_IDENTITY_CLIENT_ID = "client_id";
export const MANAGED_IDENTITY_OBJECT_ID = "object_id";
export const MANAGED_IDENTITY_RESOURCE_ID = "mi_res_id";
export const DEFAULT_MANAGED_IDENTITY_ID = "system_assigned_managed_identity";
export const MANAGED_IDENTITY_DEFAULT_TENANT = "managed_identity";
export const DEFAULT_AUTHORITY_FOR_MANAGED_IDENTITY = `https://login.microsoftonline.com/${MANAGED_IDENTITY_DEFAULT_TENANT}/`;

export const MANAGED_IDENTITY_TIMEOUT_ERROR: string =
    "[Managed Identity] Authentication unavailable. The request to the managed identity endpoint timed out.";

/**
 * Managed Identity Ids
 */
export const ManagedIdentityIdType = {
    SYSTEM_ASSIGNED: "system-assigned",
    USER_ASSIGNED_CLIENT_ID: "user-assigned-client-id",
    USER_ASSIGNED_RESOURCE_ID: "user-assigned-resource-id",
    USER_ASSIGNED_OBJECT_ID: "user-assigned-object-id",
} as const;
export type ManagedIdentityIdType =
    (typeof ManagedIdentityIdType)[keyof typeof ManagedIdentityIdType];

/**
 * Managed Identity Authentication Sources
 */
export const ManagedIdentitySource = {
    NONE: "None", // default
    IMDS: "Imds",
    APP_SERVICE: "AppService",
    AZURE_ARC: "AzureArc",
    CLOUD_SHELL: "CloudShell",
    SERVICE_FABRIC: "ServiceFabric",
} as const;
export type ManagedIdentitySource =
    (typeof ManagedIdentitySource)[keyof typeof ManagedIdentitySource];

/**
 * http methods
 */
export const HttpMethod = {
    GET: "get",
    POST: "post",
} as const;
export type HttpMethod = (typeof HttpMethod)[keyof typeof HttpMethod];

export const ProxyStatus = {
    SUCCESS_RANGE_START: 200,
    SUCCESS_RANGE_END: 299,
    SERVER_ERROR: 500,
} as const;
export type ProxyStatus = (typeof ProxyStatus)[keyof typeof ProxyStatus];

/**
 * Constants used for region discovery
 */
export const REGION_ENVIRONMENT_VARIABLE = "REGION_NAME";

/**
 * Constant used for PKCE
 */
export const RANDOM_OCTET_SIZE = 32;

/**
 * Constants used in PKCE
 */
export const Hash = {
    SHA256: "sha256",
};

/**
 * Constants for encoding schemes
 */
export const CharSet = {
    CV_CHARSET:
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~",
};

/**
 * Cache Constants
 */
export const CACHE = {
    FILE_CACHE: "fileCache",
    EXTENSION_LIB: "extenstion_library",
};

/**
 * Constants
 */
export const Constants = {
    MSAL_SKU: "msal.js.node",
    JWT_BEARER_ASSERTION_TYPE:
        "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
    AUTHORIZATION_PENDING: "authorization_pending",
    HTTP_PROTOCOL: "http://",
    LOCALHOST: "localhost",
};

/**
 * API Codes for Telemetry purposes.
 * Before adding a new code you must claim it in the MSAL Telemetry tracker as these number spaces are shared across all MSALs
 * 0-99 Silent Flow
 * 600-699 Device Code Flow
 * 800-899 Auth Code Flow
 */
export const ApiId = {
    acquireTokenSilent: 62,
    acquireTokenByUsernamePassword: 371,
    acquireTokenByDeviceCode: 671,
    acquireTokenByClientCredential: 771,
    acquireTokenByCode: 871,
    acquireTokenByRefreshToken: 872,
};
export type ApiId = (typeof ApiId)[keyof typeof ApiId];

/**
 * JWT  constants
 */
export const JwtConstants = {
    ALGORITHM: "alg",
    RSA_256: "RS256",
    X5T: "x5t",
    X5C: "x5c",
    AUDIENCE: "aud",
    EXPIRATION_TIME: "exp",
    ISSUER: "iss",
    SUBJECT: "sub",
    NOT_BEFORE: "nbf",
    JWT_ID: "jti",
};

export const LOOPBACK_SERVER_CONSTANTS = {
    INTERVAL_MS: 100,
    TIMEOUT_MS: 5000,
};
