/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { NativeExtensionMethod } from "../../utils/BrowserConstants.js";
import { Constants, StringDict } from "@azure/msal-common/browser";

/**
 * Key storage enclaves supported by the platform broker.
 */
export const PlatformAuthEnclave = {
    /**
     * Persisted software key using MS_KEY_STORAGE_PROVIDER.
     */
    SOFTWARE: "sw",
    /**
     * TPM-backed key using MS_PLATFORM_KEY_STORAGE_PROVIDER.
     */
    HARDWARE: "hw",
    /**
     * KeyGuard-protected key using MS_KEY_STORAGE_PROVIDER.
     */
    KEY_GUARD: "kg",
} as const;

/**
 * Supported platform broker key storage enclave.
 */
export type PlatformAuthEnclave =
    (typeof PlatformAuthEnclave)[keyof typeof PlatformAuthEnclave];

/**
 * Token types supported by the platform broker request contract.
 * DPOP_WITH_PROOF_LEGACY is retained temporarily while the WAM proof of concept
 * migrates to the canonical DPOP_WITH_PROOF value.
 */
export const PlatformAuthTokenType = {
    DPOP_WITH_PROOF: "dpop+proof",
    DPOP_WITH_PROOF_LEGACY: "dpop_proof",
} as const;

/**
 * Supported platform broker request token type. Authentication schemes are
 * internal request intent; the additional values are WAM DPoP wire contracts.
 */
export type PlatformAuthTokenType =
    | Constants.AuthenticationScheme
    | (typeof PlatformAuthTokenType)[keyof typeof PlatformAuthTokenType];

/**
 * Token binding preferences supported by the platform broker.
 */
export const PlatformAuthBindingPreference = {
    ATTESTED: "attested",
} as const;

/**
 * Supported platform broker token binding preference.
 */
export type PlatformAuthBindingPreference =
    (typeof PlatformAuthBindingPreference)[keyof typeof PlatformAuthBindingPreference];

const PROOF_OF_POSSESSION_TOKEN_TYPES: readonly PlatformAuthTokenType[] = [
    Constants.AuthenticationScheme.POP,
    Constants.AuthenticationScheme.DPOP,
    PlatformAuthTokenType.DPOP_WITH_PROOF,
    PlatformAuthTokenType.DPOP_WITH_PROOF_LEGACY,
];

/**
 * Returns whether a platform broker token type requires proof request metadata.
 */
export function isProofOfPossessionTokenType(
    tokenType: PlatformAuthTokenType | undefined
): boolean {
    return (
        tokenType !== undefined &&
        PROOF_OF_POSSESSION_TOKEN_TYPES.includes(tokenType)
    );
}

/**
 * No-cache parameters MSAL.js sends to the native broker for proof-of-possession requests.
 */
export type PlatformAuthRequestExtraParametersNoCache = {
    pop_nonce?: string;
};

/**
 * No-cache proof parameters sent directly to WAM through the browser extension.
 */
export type PlatformAuthExtensionExtraParametersNoCache =
    PlatformAuthRequestExtraParametersNoCache & {
        pop_method?: string;
        pop_url?: string;
    };

/**
 * No-cache proof parameters accepted by the platform DOM API.
 */
export type PlatformDOMExtraParametersNoCache =
    PlatformAuthRequestExtraParametersNoCache & {
        pop_method?: string;
        pop_uri?: string;
    };

/**
 * Token request which native broker will use to acquire tokens
 */
export type PlatformAuthRequest = {
    accountId: string; // WAM specific account id used for identification of WAM account. This can be any broker-id eventually
    clientId: string;
    authority: string;
    redirectUri: string;
    scope: string;
    correlationId: string;
    windowTitleSubstring: string; // The name of the document title. This helps the native prompt properly "parent" to the window making the request
    isSts?: boolean; // Whether the request is from STS or not
    prompt?: string;
    nonce?: string;
    claims?: string;
    state?: string;
    loginHint?: string; // UPN of the user
    preferBinding?: PlatformAuthBindingPreference;
    enclave?: PlatformAuthEnclave;
    reqCnf?: string;
    keyId?: string;
    tokenType?: PlatformAuthTokenType;
    shrClaims?: string;
    shrNonce?: string;
    resourceRequestMethod?: string;
    resourceRequestUri?: string;
    extendedExpiryToken?: boolean;
    extraParameters?: StringDict;
    extraParametersNoCache?: PlatformAuthRequestExtraParametersNoCache;
    signPopToken?: boolean; // Set to true only if token request does not contain a PoP keyId
    attributeTokens?: string; // Pre-serialized attribute tokens (sorted, space-separated)
};

/**
 * Request which will be forwarded to native broker by the browser extension
 */
export type NativeExtensionRequestBody = {
    method: NativeExtensionMethod;
    request?: PlatformAuthRequest;
};

/**
 * Browser extension request
 */
export type NativeExtensionRequest = {
    channel: string;
    responseId: string;
    extensionId?: string;
    body: NativeExtensionRequestBody;
};

export type PlatformDOMTokenRequest = {
    brokerId: string;
    accountId?: string;
    clientId: string;
    authority: string;
    scope: string;
    redirectUri: string;
    correlationId: string;
    isSecurityTokenService: boolean;
    state?: string;
    preferBinding?: PlatformAuthBindingPreference;
    enclave?: PlatformAuthEnclave;
    requestConfirmation?: string;
    extraParametersNoCache?: PlatformDOMExtraParametersNoCache;
    /*
     * Known optional parameters will go into extraQueryParameters.
     * List of known parameters is:
     * "prompt", "nonce", "claims", "loginHint", "instanceAware", "windowTitleSubstring", "extendedExpiryToken",
     * ProofOfPossessionParams: "keyId", "tokenType", "shrClaims", "shrNonce", "signPopToken"
     */
    extraParameters?: DOMExtraParameters;
};

export type DOMExtraParameters = StringDict & {
    prompt?: string;
    nonce?: string;
    claims?: string;
    loginHint?: string;
    instanceAware?: string;
    windowTitleSubstring?: string;
    extendedExpiryToken?: string;
    keyId?: string;
    tokenType?: string;
    shrClaims?: string;
    shrNonce?: string;
    resourceRequestMethod?: string;
    resourceRequestUri?: string;
    signPopToken?: string; // Set to true only if token request deos not contain a PoP keyId
};
