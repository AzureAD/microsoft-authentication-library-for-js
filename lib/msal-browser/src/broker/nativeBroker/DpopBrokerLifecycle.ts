/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthErrorCodes,
    Constants,
    DpopProofGenerator,
    ICrypto,
    IPerformanceClient,
    ITokenBindingKeyManager,
    JsonWebTokenAlgorithms,
    Logger,
    TimeUtils,
    createAuthError,
    invokeAsync,
} from "@azure/msal-common/browser";
import { BrowserCacheManager } from "../../cache/BrowserCacheManager.js";
import {
    ECDSA_P256_KEYGEN_ALGORITHM_OPTIONS,
    ECDSA_SHA256_SIGN_ALGORITHM_OPTIONS,
    computeJwkThumbprint,
    importJwk,
    verify,
} from "../../crypto/BrowserCrypto.js";
import { base64DecToArr, base64Decode } from "../../encode/Base64Decode.js";
import {
    BrowserAuthErrorCodes,
    createBrowserAuthError,
} from "../../error/BrowserAuthError.js";
import { TemporaryCacheKeys } from "../../utils/BrowserConstants.js";
import * as BrowserPerformanceEvents from "../../telemetry/BrowserPerformanceEvents.js";
import {
    DPOP_BROKER_REQUEST_TOKEN_TYPE,
    PlatformAuthRequest,
} from "./PlatformAuthRequest.js";
import { PlatformAuthResponse } from "./PlatformAuthResponse.js";

const MAX_DPOP_KEY_CLEANUP_ATTEMPTS = 3;
const DPOP_PROOF_IAT_TOLERANCE_SECONDS = 300;

/**
 * Dependencies used by the broker DPoP lifecycle.
 */
export type DpopBrokerLifecycleContext = {
    browserCrypto: ICrypto;
    browserStorage: BrowserCacheManager;
    correlationId: string;
    logger: Logger;
    performanceClient: IPerformanceClient;
    tokenBindingKeyManager: ITokenBindingKeyManager;
};

/**
 * Mutable state owned by one broker interaction client.
 */
export type DpopBrokerLifecycle = {
    context: DpopBrokerLifecycleContext;
    msalOwnedRequests: WeakMap<PlatformAuthRequest, string>;
    unclaimedPersistedKeyCleanup: PersistedDpopKeyCleanupState[];
};

type BrokerDpopProofClaims = {
    ath: string;
    htm: string;
    htu: string;
    iat: number;
    jti: string;
    nonce?: string;
};

type DpopKeyCleanupState = {
    activeRequestCount: number;
    cleanupAttemptCount: number;
    cleanupRequested: boolean;
    keyThumbprint?: string;
};

type PersistedDpopKeyCleanupState = {
    keyId: string;
    cleanupAttemptCount: number;
    keyThumbprint: string;
};

const dpopKeyCleanupByManager = new WeakMap<
    ITokenBindingKeyManager,
    Map<string, DpopKeyCleanupState>
>();

/**
 * Creates isolated request state for broker DPoP processing.
 */
export function createDpopBrokerLifecycle(
    context: DpopBrokerLifecycleContext
): DpopBrokerLifecycle {
    return {
        context,
        msalOwnedRequests: new WeakMap<PlatformAuthRequest, string>(),
        unclaimedPersistedKeyCleanup: [],
    };
}

/**
 * Provisions or validates the request key and adds its JWK thumbprint.
 */
export async function prepareDpopBrokerRequest(
    lifecycle: DpopBrokerLifecycle,
    request: PlatformAuthRequest
): Promise<void> {
    const { context } = lifecycle;
    return invokeAsync(
        async (): Promise<void> => {
            await restorePersistedDpopKeyCleanup(lifecycle);
            await retryDpopKeyCleanup(lifecycle);

            if (request.tokenType !== DPOP_BROKER_REQUEST_TOKEN_TYPE) {
                return;
            }

            if (!request.keyId) {
                request.keyId =
                    await context.tokenBindingKeyManager.provisionTokenBindingKey(
                        {
                            tokenBindingKeyType:
                                Constants.AuthenticationScheme.DPOP.toLowerCase(),
                            tokenBindingKeyAlgorithm:
                                JsonWebTokenAlgorithms.ES256,
                            correlationId: context.correlationId,
                        }
                    );
                trackDpopRequestKey(lifecycle, request, request.keyId);
            }

            const publicJwk =
                await context.tokenBindingKeyManager.getTokenBindingPublicKeyJwk(
                    request.keyId,
                    context.correlationId
                );
            if (!isValidDpopPublicJwk(publicJwk)) {
                throw createBrowserAuthError(
                    BrowserAuthErrorCodes.invalidPublicJwk,
                    context.correlationId
                );
            }

            const jkt = await computeJwkThumbprint(
                publicJwk,
                context.correlationId
            );
            const ownedKeyId = lifecycle.msalOwnedRequests.get(request);
            if (ownedKeyId) {
                getDpopKeyCleanupState(lifecycle, ownedKeyId).keyThumbprint =
                    jkt;
            }
            request.reqCnf = context.browserCrypto.base64UrlEncode(
                JSON.stringify({ jkt })
            );
        },
        BrowserPerformanceEvents.DpopBrokerLifecyclePrepareRequest,
        context.logger,
        context.performanceClient,
        context.correlationId
    )();
}

/**
 * Validates that a broker response is a well-formed L1 or L3 DPoP outcome.
 */
export async function validateDpopBrokerOutcome(
    lifecycle: DpopBrokerLifecycle,
    response: PlatformAuthResponse,
    request: PlatformAuthRequest
): Promise<void> {
    const { context } = lifecycle;
    return invokeAsync(
        async (): Promise<void> => {
            const isDpopRequest =
                request.tokenType === DPOP_BROKER_REQUEST_TOKEN_TYPE;
            if (
                (response.token_type !== undefined &&
                    typeof response.token_type !== "string") ||
                (response.DPoP !== undefined &&
                    typeof response.DPoP !== "string") ||
                (response.attested_chosen !== undefined &&
                    typeof response.attested_chosen !== "boolean") ||
                (response.token_binding_key_id !== undefined &&
                    typeof response.token_binding_key_id !== "string")
            ) {
                throwMalformedDpopResponse(
                    context,
                    "Malformed DPoP broker response."
                );
            }

            const responseTokenType = response.token_type?.toLowerCase();
            const isDpopResponseToken =
                responseTokenType ===
                DPOP_BROKER_REQUEST_TOKEN_TYPE.toLowerCase();
            const isStandardDpopResponseToken =
                responseTokenType ===
                Constants.AuthenticationScheme.DPOP.toLowerCase();
            const hasDpopResponse =
                isDpopResponseToken ||
                isStandardDpopResponseToken ||
                response.DPoP !== undefined ||
                response.attested_chosen !== undefined ||
                response.token_binding_key_id !== undefined;

            if (!isDpopRequest) {
                if (hasDpopResponse) {
                    throwMalformedDpopResponse(
                        context,
                        "Unexpected DPoP broker response."
                    );
                }
                return;
            }

            if (!isDpopResponseToken && !isStandardDpopResponseToken) {
                throwMalformedDpopResponse(
                    context,
                    "Unknown DPoP broker response."
                );
            }

            if (response.DPoP !== undefined) {
                if (
                    !(await isValidBrokerDpopProof(
                        context,
                        response.DPoP,
                        response.access_token,
                        request
                    )) ||
                    response.attested_chosen !== true ||
                    (response.token_binding_key_id !== undefined &&
                        response.token_binding_key_id === request.keyId)
                ) {
                    throwMalformedDpopResponse(
                        context,
                        "Malformed DPoP broker response."
                    );
                }
                context.performanceClient.addFields(
                    {
                        "ext.brokerDpopSupported": true,
                        "ext.brokerDpopBindingLevel": "L3",
                    },
                    context.correlationId
                );
                return;
            }

            if (
                !request.reqCnf ||
                !request.keyId ||
                response.attested_chosen !== false ||
                (response.token_binding_key_id !== undefined &&
                    response.token_binding_key_id !== request.keyId)
            ) {
                throwMalformedDpopResponse(
                    context,
                    "Malformed DPoP broker fallback response."
                );
            }
            context.performanceClient.addFields(
                {
                    "ext.brokerDpopSupported": true,
                    "ext.brokerDpopBindingLevel": "L1",
                },
                context.correlationId
            );
        },
        BrowserPerformanceEvents.DpopBrokerLifecycleValidateOutcome,
        context.logger,
        context.performanceClient,
        context.correlationId
    )();
}

/**
 * Returns a broker L3 proof or locally signs an L1 fallback proof.
 */
export async function generateDpopProof(
    lifecycle: DpopBrokerLifecycle,
    response: PlatformAuthResponse,
    request: PlatformAuthRequest
): Promise<string> {
    const { context } = lifecycle;
    return invokeAsync(
        async (): Promise<string> => {
            if (response.DPoP !== undefined) {
                return response.DPoP;
            }

            return new DpopProofGenerator(
                context.browserCrypto,
                context.tokenBindingKeyManager
            ).generateResourceProof(
                {
                    htu: request.resourceRequestUri,
                    htm: request.resourceRequestMethod,
                    nonce: request.extraParametersNoCache?.pop_nonce,
                    accessToken: response.access_token,
                },
                request.keyId as string,
                context.correlationId
            );
        },
        BrowserPerformanceEvents.DpopBrokerLifecycleGenerateProof,
        context.logger,
        context.performanceClient,
        context.correlationId
    )();
}

/**
 * Removes an MSAL-generated request key and resets its broker binding.
 */
export async function resetGeneratedDpopRequestKey(
    lifecycle: DpopBrokerLifecycle,
    request: PlatformAuthRequest
): Promise<void> {
    const { context } = lifecycle;
    return invokeAsync(
        async (): Promise<void> => {
            if (!request.keyId || !lifecycle.msalOwnedRequests.has(request)) {
                return;
            }

            await removeDpopRequestKey(lifecycle, request);
            request.keyId = undefined;
            request.reqCnf = undefined;
        },
        BrowserPerformanceEvents.DpopBrokerLifecycleResetRequestKey,
        context.logger,
        context.performanceClient,
        context.correlationId
    )();
}

/**
 * Releases an MSAL-generated request key and queues bounded cleanup.
 */
export async function removeDpopRequestKey(
    lifecycle: DpopBrokerLifecycle,
    request: PlatformAuthRequest
): Promise<boolean> {
    const { context } = lifecycle;
    return invokeAsync(
        async (): Promise<boolean> => {
            const ownedKeyId = lifecycle.msalOwnedRequests.get(request);
            if (!ownedKeyId) {
                return true;
            }

            lifecycle.msalOwnedRequests.delete(request);
            const cleanupState = getDpopKeyCleanupState(lifecycle, ownedKeyId);
            cleanupState.activeRequestCount = Math.max(
                cleanupState.activeRequestCount - 1,
                0
            );
            cleanupState.cleanupRequested = true;
            return removeInactiveDpopKey(lifecycle, ownedKeyId, cleanupState);
        },
        BrowserPerformanceEvents.DpopBrokerLifecycleRemoveRequestKey,
        context.logger,
        context.performanceClient,
        context.correlationId
    )();
}

/**
 * Validates the broker proof structure, signature, access-token binding, and
 * resource request claims.
 * @param context - Broker DPoP dependencies.
 * @param proof - Compact DPoP proof returned by the broker.
 * @param accessToken - Access token the proof must bind.
 * @param request - Request context the proof must cover.
 * @returns Whether the proof satisfies the complete L3 validation contract.
 */
async function isValidBrokerDpopProof(
    context: DpopBrokerLifecycleContext,
    proof: string,
    accessToken: string,
    request: PlatformAuthRequest
): Promise<boolean> {
    const tokenParts = proof.split(".");
    if (
        tokenParts.length !== 3 ||
        tokenParts.some((part) => part.length === 0)
    ) {
        return false;
    }

    try {
        const header = JSON.parse(base64Decode(tokenParts[0])) as {
            alg?: unknown;
            jwk?: unknown;
            typ?: unknown;
        };
        const claims = JSON.parse(
            base64Decode(tokenParts[1])
        ) as Partial<BrokerDpopProofClaims>;
        if (
            header.alg !== JsonWebTokenAlgorithms.ES256 ||
            typeof header.typ !== "string" ||
            header.typ.toLowerCase() !== "dpop+jwt" ||
            !isValidDpopPublicJwk(header.jwk)
        ) {
            return false;
        }

        const publicKey = await importJwk(
            header.jwk,
            false,
            ["verify"],
            ECDSA_P256_KEYGEN_ALGORITHM_OPTIONS
        );
        const signatureValid = await verify(
            publicKey,
            base64DecToArr(tokenParts[2]),
            new TextEncoder().encode(`${tokenParts[0]}.${tokenParts[1]}`),
            ECDSA_SHA256_SIGN_ALGORITHM_OPTIONS
        );
        if (!signatureValid) {
            return false;
        }

        const proofJkt = await computeJwkThumbprint(
            header.jwk,
            context.correlationId
        );
        const accessTokenJkt = getAccessTokenJkt(accessToken);
        if (!accessTokenJkt || proofJkt !== accessTokenJkt) {
            return false;
        }

        const expectedAth = await context.browserCrypto.hashString(accessToken);
        const currentTime = TimeUtils.nowSeconds();
        const expectedNonce = request.extraParametersNoCache?.pop_nonce;
        return (
            claims.htm === request.resourceRequestMethod &&
            claims.htu === request.resourceRequestUri &&
            claims.ath === expectedAth &&
            typeof claims.iat === "number" &&
            Number.isFinite(claims.iat) &&
            Math.abs(currentTime - claims.iat) <=
                DPOP_PROOF_IAT_TOLERANCE_SECONDS &&
            typeof claims.jti === "string" &&
            claims.jti.length > 0 &&
            (expectedNonce === undefined || claims.nonce === expectedNonce)
        );
    } catch {
        return false;
    }
}

/**
 * Extracts the DPoP JWK thumbprint from an access token confirmation claim.
 * @param accessToken - JWT access token returned by the broker.
 * @returns The `cnf.jkt` value, or undefined when absent or malformed.
 */
function getAccessTokenJkt(accessToken: string): string | undefined {
    const tokenParts = accessToken.split(".");
    if (tokenParts.length !== 3 || tokenParts[1].length === 0) {
        return undefined;
    }
    try {
        const claims = JSON.parse(base64Decode(tokenParts[1])) as {
            cnf?: unknown;
        };
        if (
            typeof claims.cnf !== "object" ||
            claims.cnf === null ||
            Array.isArray(claims.cnf)
        ) {
            return undefined;
        }
        const jkt = (claims.cnf as Record<string, unknown>).jkt;
        return typeof jkt === "string" && jkt.length > 0 ? jkt : undefined;
    } catch {
        return undefined;
    }
}

/**
 * Checks that a value is a public P-256 JWK suitable for DPoP verification.
 * @param jwk - Candidate JWK value.
 * @returns Whether the value is a valid public DPoP JWK.
 */
function isValidDpopPublicJwk(jwk: unknown): jwk is JsonWebKey {
    if (typeof jwk !== "object" || jwk === null || Array.isArray(jwk)) {
        return false;
    }
    const publicJwk = jwk as JsonWebKey;
    return (
        publicJwk.kty === "EC" &&
        publicJwk.crv === "P-256" &&
        typeof publicJwk.x === "string" &&
        publicJwk.x.length > 0 &&
        typeof publicJwk.y === "string" &&
        publicJwk.y.length > 0 &&
        publicJwk.d === undefined
    );
}

/**
 * Validates persisted DPoP cleanup state before it is restored.
 * @param entry - Candidate persisted cleanup entry.
 * @returns Whether the entry has a supported shape and retry count.
 */
function isPersistedDpopKeyCleanupState(
    entry: unknown
): entry is PersistedDpopKeyCleanupState {
    if (typeof entry !== "object" || entry === null) {
        return false;
    }
    const candidate = entry as Record<string, unknown>;
    return (
        typeof candidate.keyId === "string" &&
        candidate.keyId.length > 0 &&
        typeof candidate.keyThumbprint === "string" &&
        candidate.keyThumbprint.length > 0 &&
        typeof candidate.cleanupAttemptCount === "number" &&
        Number.isInteger(candidate.cleanupAttemptCount) &&
        candidate.cleanupAttemptCount >= 0 &&
        candidate.cleanupAttemptCount < MAX_DPOP_KEY_CLEANUP_ATTEMPTS
    );
}

/**
 * Retries cleanup for inactive keys owned by the current key manager.
 * @param lifecycle - Broker DPoP lifecycle state.
 */
async function retryDpopKeyCleanup(
    lifecycle: DpopBrokerLifecycle
): Promise<void> {
    const cleanupStates = dpopKeyCleanupByManager.get(
        lifecycle.context.tokenBindingKeyManager
    );
    if (!cleanupStates) {
        return;
    }
    for (const [keyId, cleanupState] of cleanupStates) {
        await removeInactiveDpopKey(lifecycle, keyId, cleanupState);
    }
}

/**
 * Restores cleanup state belonging to the current key manager and retains
 * unmatched entries for bounded future retries.
 * @param lifecycle - Broker DPoP lifecycle state.
 */
async function restorePersistedDpopKeyCleanup(
    lifecycle: DpopBrokerLifecycle
): Promise<void> {
    const { context } = lifecycle;
    const persistedCleanup = context.browserStorage.getTemporaryCache(
        TemporaryCacheKeys.DPOP_KEY_CLEANUP,
        context.correlationId,
        true
    );
    if (!persistedCleanup) {
        return;
    }

    let cleanupEntries: unknown;
    try {
        cleanupEntries = JSON.parse(persistedCleanup);
    } catch {
        context.logger.warning(
            "Ignoring invalid persisted DPoP key cleanup state",
            context.correlationId
        );
        removePersistedDpopKeyCleanup(lifecycle);
        return;
    }
    if (!Array.isArray(cleanupEntries)) {
        removePersistedDpopKeyCleanup(lifecycle);
        return;
    }

    lifecycle.unclaimedPersistedKeyCleanup = [];
    for (const entry of cleanupEntries) {
        if (!isPersistedDpopKeyCleanupState(entry)) {
            continue;
        }

        let ownsKey = false;
        try {
            const publicJwk =
                await context.tokenBindingKeyManager.getTokenBindingPublicKeyJwk(
                    entry.keyId,
                    context.correlationId
                );
            ownsKey =
                isValidDpopPublicJwk(publicJwk) &&
                (await computeJwkThumbprint(
                    publicJwk,
                    context.correlationId
                )) === entry.keyThumbprint;
        } catch {
            ownsKey = false;
        }

        if (!ownsKey) {
            entry.cleanupAttemptCount += 1;
            if (entry.cleanupAttemptCount < MAX_DPOP_KEY_CLEANUP_ATTEMPTS) {
                lifecycle.unclaimedPersistedKeyCleanup.push(entry);
            } else {
                context.performanceClient.incrementFields(
                    { "ext.dpopKeyCleanupRetryExhausted": 1 },
                    context.correlationId
                );
            }
            continue;
        }

        const cleanupState = getDpopKeyCleanupState(lifecycle, entry.keyId);
        cleanupState.cleanupAttemptCount = Math.max(
            cleanupState.cleanupAttemptCount,
            entry.cleanupAttemptCount
        );
        cleanupState.cleanupRequested = true;
        cleanupState.keyThumbprint = entry.keyThumbprint;
    }
    persistDpopKeyCleanup(lifecycle);
}

/**
 * Writes pending cleanup state or removes storage when no work remains.
 * @param lifecycle - Broker DPoP lifecycle state.
 */
function persistDpopKeyCleanup(lifecycle: DpopBrokerLifecycle): void {
    const cleanupEntries = Array.from(
        getDpopKeyCleanupStates(lifecycle),
        ([keyId, cleanupState]): PersistedDpopKeyCleanupState | null =>
            cleanupState.cleanupRequested && cleanupState.keyThumbprint
                ? {
                      keyId,
                      cleanupAttemptCount: cleanupState.cleanupAttemptCount,
                      keyThumbprint: cleanupState.keyThumbprint,
                  }
                : null
    )
        .filter(
            (entry): entry is PersistedDpopKeyCleanupState => entry !== null
        )
        .concat(lifecycle.unclaimedPersistedKeyCleanup);

    if (cleanupEntries.length === 0) {
        removePersistedDpopKeyCleanup(lifecycle);
        return;
    }
    lifecycle.context.browserStorage.setTemporaryCache(
        TemporaryCacheKeys.DPOP_KEY_CLEANUP,
        JSON.stringify(cleanupEntries),
        true
    );
}

/**
 * Removes persisted DPoP cleanup state from temporary storage.
 * @param lifecycle - Broker DPoP lifecycle state.
 */
function removePersistedDpopKeyCleanup(lifecycle: DpopBrokerLifecycle): void {
    const storage = lifecycle.context.browserStorage;
    storage.removeTemporaryItem(
        storage.generateCacheKey(TemporaryCacheKeys.DPOP_KEY_CLEANUP)
    );
}

/**
 * Marks a provisioned request key as MSAL-owned and active.
 * @param lifecycle - Broker DPoP lifecycle state.
 * @param request - Request that owns the key reference.
 * @param keyId - Provisioned key identifier.
 */
function trackDpopRequestKey(
    lifecycle: DpopBrokerLifecycle,
    request: PlatformAuthRequest,
    keyId: string
): void {
    lifecycle.msalOwnedRequests.set(request, keyId);
    getDpopKeyCleanupState(lifecycle, keyId).activeRequestCount += 1;
}

/**
 * Returns mutable cleanup state for a key, creating it when necessary.
 * @param lifecycle - Broker DPoP lifecycle state.
 * @param keyId - Token-binding key identifier.
 * @returns Cleanup state associated with the key.
 */
function getDpopKeyCleanupState(
    lifecycle: DpopBrokerLifecycle,
    keyId: string
): DpopKeyCleanupState {
    const cleanupStates = getDpopKeyCleanupStates(lifecycle);
    let cleanupState = cleanupStates.get(keyId);
    if (!cleanupState) {
        cleanupState = {
            activeRequestCount: 0,
            cleanupAttemptCount: 0,
            cleanupRequested: false,
        };
        cleanupStates.set(keyId, cleanupState);
    }
    return cleanupState;
}

/**
 * Returns cleanup state scoped to the lifecycle's token-binding key manager.
 * @param lifecycle - Broker DPoP lifecycle state.
 * @returns The key manager's cleanup-state map.
 */
function getDpopKeyCleanupStates(
    lifecycle: DpopBrokerLifecycle
): Map<string, DpopKeyCleanupState> {
    const keyManager = lifecycle.context.tokenBindingKeyManager;
    let cleanupStates = dpopKeyCleanupByManager.get(keyManager);
    if (!cleanupStates) {
        cleanupStates = new Map<string, DpopKeyCleanupState>();
        dpopKeyCleanupByManager.set(keyManager, cleanupStates);
    }
    return cleanupStates;
}

/**
 * Removes a cleanup-requested key when it has no active request references,
 * persisting bounded retry state when removal fails.
 * @param lifecycle - Broker DPoP lifecycle state.
 * @param keyId - Token-binding key identifier.
 * @param cleanupState - Current cleanup and reference state.
 * @returns Whether cleanup is complete or not currently required.
 */
async function removeInactiveDpopKey(
    lifecycle: DpopBrokerLifecycle,
    keyId: string,
    cleanupState: DpopKeyCleanupState
): Promise<boolean> {
    if (cleanupState.activeRequestCount > 0 || !cleanupState.cleanupRequested) {
        return true;
    }

    const { context } = lifecycle;
    try {
        await context.tokenBindingKeyManager.removeTokenBindingKey(
            keyId,
            context.correlationId
        );
        getDpopKeyCleanupStates(lifecycle).delete(keyId);
        persistDpopKeyCleanup(lifecycle);
        return true;
    } catch {
        cleanupState.cleanupAttemptCount += 1;
        context.performanceClient.incrementFields(
            { removeTokenBindingKeyFailure: 1 },
            context.correlationId
        );
        if (cleanupState.cleanupAttemptCount >= MAX_DPOP_KEY_CLEANUP_ATTEMPTS) {
            getDpopKeyCleanupStates(lifecycle).delete(keyId);
            context.performanceClient.incrementFields(
                { "ext.dpopKeyCleanupRetryExhausted": 1 },
                context.correlationId
            );
        }
        persistDpopKeyCleanup(lifecycle);
        context.logger.error(
            "Failed to remove unused DPoP request key",
            context.correlationId
        );
        return false;
    }
}

/**
 * Throws the standard unexpected-error shape for a malformed broker outcome.
 * @param context - Broker DPoP dependencies.
 * @param message - Validation failure description.
 */
function throwMalformedDpopResponse(
    context: DpopBrokerLifecycleContext,
    message: string
): never {
    throw createAuthError(
        AuthErrorCodes.unexpectedError,
        context.correlationId,
        message
    );
}
