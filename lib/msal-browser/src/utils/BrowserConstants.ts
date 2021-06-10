/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { OIDC_DEFAULT_SCOPES } from "@azure/msal-common";
import { PopupRequest } from "../request/PopupRequest";
import { RedirectRequest } from "../request/RedirectRequest";

/**
 * Constants
 */
export const BrowserConstants = {
    /**
     * Interaction in progress cache value
     */
    INTERACTION_IN_PROGRESS_VALUE: "interaction_in_progress",
    /**
     * Invalid grant error code
     */
    INVALID_GRANT_ERROR: "invalid_grant",
    /**
     * Default popup window width
     */
    POPUP_WIDTH: 483,
    /**
     * Default popup window height
     */
    POPUP_HEIGHT: 600,
    /**
     * Name of the popup window starts with
     */
    POPUP_NAME_PREFIX: "msal",
    /**
     * Default popup monitor poll interval in milliseconds
     */
    POLL_INTERVAL_MS: 50,
    /**
     * Msal-browser SKU
     */
    MSAL_SKU: "msal.js.browser",
};

export enum BrowserCacheLocation {
    LocalStorage = "localStorage",
    SessionStorage = "sessionStorage",
    MemoryStorage = "memoryStorage"
}

/**
 * HTTP Request types supported by MSAL.
 */
export enum HTTP_REQUEST_TYPE {
    GET = "GET",
    POST = "POST"
}

/**
 * Temporary cache keys for MSAL, deleted after any request.
 */
export enum TemporaryCacheKeys {
    AUTHORITY = "authority",
    ACQUIRE_TOKEN_ACCOUNT = "acquireToken.account",
    SESSION_STATE = "session.state",
    REQUEST_STATE = "request.state",
    NONCE_IDTOKEN = "nonce.id_token",
    ORIGIN_URI = "request.origin",
    RENEW_STATUS = "token.renew.status",
    URL_HASH = "urlHash",
    REQUEST_PARAMS = "request.params",
    SCOPES = "scopes",
    INTERACTION_STATUS_KEY = "interaction.status"
}

/**
 * API Codes for Telemetry purposes. 
 * Before adding a new code you must claim it in the MSAL Telemetry tracker as these number spaces are shared across all MSALs
 * 0-99 Silent Flow
 * 800-899 Auth Code Flow
 */
export enum ApiId {
    acquireTokenRedirect = 861,
    acquireTokenPopup = 862,
    ssoSilent = 863,
    acquireTokenSilent_authCode = 864,
    handleRedirectPromise = 865,
    acquireTokenSilent_silentFlow = 61,
    logout = 961,
    logoutPopup = 962
}

/*
 * Interaction type of the API - used for state and telemetry
 */
export enum InteractionType {
    Redirect = "redirect",
    Popup = "popup",
    Silent = "silent"
}

/**
 * Types of interaction currently in progress.
 * Used in events in wrapper libraries to invoke functions when certain interaction is in progress or all interactions are complete.
 */
export enum InteractionStatus {
    /**
     * Initial status before interaction occurs
     */
    Startup = "startup",
    /**
     * Status set when all login calls occuring
     */
    Login = "login",
    /**
     * Status set when logout call occuring
     */ 
    Logout = "logout",
    /**
     * Status set for acquireToken calls
     */
    AcquireToken = "acquireToken",
    /**
     * Status set for ssoSilent calls
     */
    SsoSilent = "ssoSilent",
    /**
     * Status set when handleRedirect in progress
     */
    HandleRedirect = "handleRedirect",
    /**
     * Status set when interaction is complete
     */
    None = "none"
}

export const DEFAULT_REQUEST: RedirectRequest|PopupRequest = {
    scopes: OIDC_DEFAULT_SCOPES
};

/**
 * JWK Key Format string (Type MUST be defined for window crypto APIs)
 */
export const KEY_FORMAT_JWK = "jwk";

// Supported wrapper SKUs
export enum WrapperSKU {
    React = "@azure/msal-react",
    Angular = "@azure/msal-angular"
}

// Supported Cryptographic Key Types
export enum CryptoKeyTypes {
    req_cnf = "req_cnf",
    stk_jwk = "stk_jwk"
}

// Crypto Key Usage sets
export const KEY_USAGES = {
    AT_BINDING: {
        KEYPAIR: ["sign", "verify"],
        PRIVATE_KEY: ["sign"]
    },
    RT_BINDING: {
        KEYPAIR: ["encrypt", "decrypt"],
        PRIVATE_KEY: ["decrypt"],
        DERIVATION_KEY: ["sign"],
        SESSION_KEY: ["decrypt"]
    }
};

// Cryptographic Constants
export const BROWSER_CRYPTO = {
    PKCS1_V15_KEYGEN_ALG: "RSASSA-PKCS1-v1_5",
    RSA_OAEP: "RSA-OAEP",
    AES_GCM: "AES-GCM",
    DIRECT: "dir",
    S256_HASH_ALG: "SHA-256",
    MODULUS_LENGTH: 2048
};

export const KEY_DERIVATION_LABELS = {
    DECRYPTION: "AzureAD-SecureConversation-BoundRT-AES-GCM-SHA256",
    SIGNING: "AzureAD-SecureConversation-BoundRT-HS256"
};

// The following are sizes in bits
export const KEY_DERIVATION_SIZES = {
    DERIVED_KEY_LENGTH: 256, // L
    PRF_OUTPUT_LENGTH: 256, // h
    COUNTER_LENGTH: 256 // r
};

// IndexedDB table names for key storage
export const DB_TABLE_NAMES = {
    ASYMMETRIC_KEYS: "asymmetricKeys",
    SYMMETRIC_KEYS: "symmetricKeys"
};
