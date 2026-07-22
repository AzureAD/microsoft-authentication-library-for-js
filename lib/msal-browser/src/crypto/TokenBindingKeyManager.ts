/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    ClientAuthErrorCodes,
    createClientAuthError,
    IPerformanceClient,
    Logger,
} from "@azure/msal-common/browser";
import type {
    ITokenBindingKeyManager,
    TokenBindingKeyContext,
    TokenBindingKeyProvisioningParameters,
} from "@azure/msal-common/browser";
import * as BrowserPerformanceEvents from "../telemetry/BrowserPerformanceEvents.js";
import { urlEncode } from "../encode/Base64Encode.js";
import * as BrowserCrypto from "./BrowserCrypto.js";
import {
    BrowserAuthError,
    createBrowserAuthError,
    BrowserAuthErrorCodes,
} from "../error/BrowserAuthError.js";
import { AsyncMemoryStorage } from "../cache/AsyncMemoryStorage.js";

/**
 * Browser keystore record for asymmetric token-binding keys.
 */
export type CachedKeyPair = {
    /**
     * Public WebCrypto key.
     */
    publicKey: CryptoKey;
    /**
     * Private WebCrypto key used for signing.
     */
    privateKey: CryptoKey;
    /**
     * Protocol or token-binding family that owns the key.
     */
    tokenBindingKeyType?: string;
    /**
     * JOSE algorithm policy associated with the key.
     */
    tokenBindingKeyAlgorithm?: string;
    /**
     * Optional stable scope used to resolve scoped keys.
     */
    keyScope?: string;
    /**
     * JWK thumbprint used as the key identifier.
     */
    keyId?: string;
};

type GeneratedKeyPair = CachedKeyPair & { keyId: string };

/**
 * Token-binding key metadata emitted in performance measurements.
 */
export type TokenBindingKeyTelemetry = {
    /**
     * Protocol or token-binding family that owns the key.
     */
    tokenBindingKeyType?: string;
    /**
     * JOSE algorithm policy associated with the key.
     */
    tokenBindingKeyAlgorithm?: string;
};

/**
 * Supported token-binding key algorithm names.
 * @internal
 */
export const TOKEN_BINDING_KEY_ALGORITHMS = {
    ES256: "ES256",
    RS256: "RS256",
} as const;

/**
 * Owns browser token-binding key lifecycle and storage lookup.
 * @internal
 */
export class TokenBindingKeyManager implements ITokenBindingKeyManager {
    private static TOKEN_BINDING_KEY_USAGES: Array<KeyUsage> = [
        "sign",
        "verify",
    ];
    private static tokenBindingKeyStorage: AsyncMemoryStorage<CachedKeyPair>;
    private static activeScopedKeyRequests: Map<string, Promise<string>> =
        new Map();
    private cache: AsyncMemoryStorage<CachedKeyPair>;
    private logger: Logger;
    private performanceClient: IPerformanceClient | undefined;

    constructor(logger: Logger, performanceClient?: IPerformanceClient) {
        this.logger = logger;
        this.cache = TokenBindingKeyManager.getTokenBindingKeyStorage(
            this.logger
        );
        this.performanceClient = performanceClient;
    }

    private static getTokenBindingKeyStorage(
        logger: Logger
    ): AsyncMemoryStorage<CachedKeyPair> {
        if (!TokenBindingKeyManager.tokenBindingKeyStorage) {
            TokenBindingKeyManager.tokenBindingKeyStorage =
                new AsyncMemoryStorage<CachedKeyPair>(logger);
        }

        return TokenBindingKeyManager.tokenBindingKeyStorage;
    }

    /**
     * Provisions or reuses a browser token-binding key and returns its key identifier.
     * @param request - Key provisioning policy and cache scope.
     */
    async provisionTokenBindingKey(
        request: TokenBindingKeyProvisioningParameters
    ): Promise<string> {
        if (!request.keyScope) {
            return this.provisionTokenBindingKeyInternal(request);
        }

        const scopedRequestFingerprint =
            this.getScopedRequestFingerprint(request);
        const activeRequest =
            TokenBindingKeyManager.activeScopedKeyRequests.get(
                scopedRequestFingerprint
            );
        if (activeRequest) {
            return this.observeCoalescedScopedKeyRequest(
                request,
                activeRequest
            );
        }

        return this.startScopedKeyRequest(scopedRequestFingerprint, request);
    }

    private async provisionTokenBindingKeyInternal(
        request: TokenBindingKeyProvisioningParameters
    ): Promise<string> {
        const publicKeyThumbMeasurement =
            this.performanceClient?.startMeasurement(
                BrowserPerformanceEvents.CryptoOptsGetPublicKeyThumbprint,
                request.correlationId
            );
        let cachedKeyPair: GeneratedKeyPair | null = null;
        try {
            cachedKeyPair = request.keyScope
                ? await this.getScopedTokenBindingKeyPair(request)
                : null;
            const activeKeyPair =
                cachedKeyPair || (await this.createTokenBindingKey(request));

            publicKeyThumbMeasurement?.end({
                success: true,
                ...this.getTokenBindingKeyTelemetry(activeKeyPair),
                tokenBindingKeyCacheHit: !!cachedKeyPair?.keyId,
            });

            return activeKeyPair.keyId;
        } catch (e) {
            publicKeyThumbMeasurement?.end({
                success: false,
                ...(cachedKeyPair
                    ? this.getTokenBindingKeyTelemetry(cachedKeyPair)
                    : {
                          tokenBindingKeyType: request.tokenBindingKeyType,
                          tokenBindingKeyAlgorithm:
                              request.tokenBindingKeyAlgorithm,
                      }),
                tokenBindingKeyCacheHit: !!cachedKeyPair?.keyId,
            });
            throw e;
        }
    }

    /**
     * Removes a browser token-binding key by identifier and optional lookup context.
     * @param kid - Token-binding key identifier.
     * @param correlationId - Request correlation identifier.
     * @param context - Optional scoped lookup context.
     */
    async removeTokenBindingKey(
        kid: string,
        correlationId: string,
        context?: TokenBindingKeyContext
    ): Promise<void> {
        await this.removeKey(
            this.getTokenBindingCacheKey(kid, context),
            correlationId
        );
    }

    /**
     * Clears browser token-binding keys from memory and persistent storage.
     * @param correlationId - Request correlation identifier.
     */
    async clearKeystore(correlationId: string): Promise<boolean> {
        this.cache.clearInMemory(correlationId);

        try {
            await this.cache.clearPersistent(correlationId);
            return true;
        } catch (e) {
            if (e instanceof Error) {
                this.logger.error(
                    `Clearing keystore failed with error: '${e.message}'`,
                    correlationId
                );
            } else {
                this.logger.error(
                    "Clearing keystore failed with unknown error",
                    correlationId
                );
            }

            return false;
        }
    }

    /**
     * Gets a token-binding public key as a JWK by identifier and optional lookup context.
     * @param keyId - Token-binding key identifier.
     * @param correlationId - Request correlation identifier.
     * @param context - Optional scoped lookup context.
     */
    async getTokenBindingPublicKeyJwk(
        keyId: string,
        correlationId: string,
        context?: TokenBindingKeyContext
    ): Promise<JsonWebKey> {
        const cachedKeyPair = await this.getTokenBindingKeyPair(
            keyId,
            correlationId,
            context
        );

        return BrowserCrypto.exportJwk(cachedKeyPair.publicKey);
    }

    private async createTokenBindingKey(
        request: TokenBindingKeyProvisioningParameters
    ): Promise<GeneratedKeyPair> {
        const keyGenAlgorithm = this.getTokenBindingKeyGenAlgorithmOptions(
            request.tokenBindingKeyAlgorithm,
            request.correlationId
        );
        const generatedKeyPair = await this.generateKeyPairAndThumbprint(
            TokenBindingKeyManager.TOKEN_BINDING_KEY_USAGES,
            keyGenAlgorithm,
            request.correlationId
        );
        await this.cache.setItem(
            this.getTokenBindingCacheKey(generatedKeyPair.keyId, request),
            {
                ...generatedKeyPair,
                keyScope: request.keyScope,
                tokenBindingKeyType: request.tokenBindingKeyType,
                tokenBindingKeyAlgorithm: request.tokenBindingKeyAlgorithm,
            },
            request.correlationId
        );

        return {
            ...generatedKeyPair,
            keyScope: request.keyScope,
            tokenBindingKeyType: request.tokenBindingKeyType,
            tokenBindingKeyAlgorithm: request.tokenBindingKeyAlgorithm,
        };
    }

    private async generateKeyPairAndThumbprint(
        usages: Array<KeyUsage>,
        keyGenAlgorithm: AlgorithmIdentifier,
        correlationId: string
    ): Promise<GeneratedKeyPair> {
        const keyPair: CryptoKeyPair = await BrowserCrypto.generateKeyPair(
            false,
            usages,
            keyGenAlgorithm
        );
        const publicJwk: JsonWebKey = await BrowserCrypto.exportJwk(
            keyPair.publicKey
        );
        const keyId = await BrowserCrypto.computeJwkThumbprint(
            publicJwk,
            correlationId
        );
        return {
            publicKey: keyPair.publicKey,
            privateKey: keyPair.privateKey,
            keyId,
        };
    }

    private async getScopedTokenBindingKeyPair(
        request: TokenBindingKeyProvisioningParameters
    ): Promise<GeneratedKeyPair | null> {
        const scopedCacheKeyPrefix = `${urlEncode(request.keyScope || "")}.`;
        const cacheKeys =
            (await this.cache.getKeys(request.correlationId)) || [];
        const scopedCacheKeys = cacheKeys
            .filter((cacheKey) => cacheKey.startsWith(scopedCacheKeyPrefix))
            .sort();

        for (const scopedCacheKey of scopedCacheKeys) {
            const cachedKeyPair = await this.cache.getItem(
                scopedCacheKey,
                request.correlationId
            );
            if (
                cachedKeyPair?.keyId &&
                cachedKeyPair.keyScope === request.keyScope &&
                cachedKeyPair.tokenBindingKeyType ===
                    request.tokenBindingKeyType &&
                cachedKeyPair.tokenBindingKeyAlgorithm ===
                    request.tokenBindingKeyAlgorithm
            ) {
                return {
                    ...cachedKeyPair,
                    keyId: cachedKeyPair.keyId,
                };
            }
        }

        return null;
    }

    /** @internal */
    async getTokenBindingKeyPair(
        keyId: string,
        correlationId: string,
        context?: TokenBindingKeyContext
    ): Promise<CachedKeyPair> {
        return this.getKeyPair(
            this.getTokenBindingCacheKey(keyId, context),
            correlationId
        );
    }

    private async getKeyPair(
        cacheKey: string,
        correlationId: string
    ): Promise<CachedKeyPair> {
        const cachedKeyPair = await this.cache.getItem(cacheKey, correlationId);
        if (!cachedKeyPair) {
            throw createBrowserAuthError(
                BrowserAuthErrorCodes.cryptoKeyNotFound,
                correlationId
            );
        }

        return cachedKeyPair;
    }

    private async removeKey(
        cacheKey: string,
        correlationId: string
    ): Promise<void> {
        await this.cache.removeItem(cacheKey, correlationId);
        const keyFound = await this.cache.containsKey(cacheKey, correlationId);
        if (keyFound) {
            throw createClientAuthError(
                ClientAuthErrorCodes.bindingKeyNotRemoved,
                correlationId
            );
        }
    }

    /** @internal */
    getTokenBindingKeyTelemetry(
        cachedKeyPair: CachedKeyPair,
        fallbackAlgorithm?: string
    ): TokenBindingKeyTelemetry {
        return {
            ...(cachedKeyPair.tokenBindingKeyType && {
                tokenBindingKeyType: cachedKeyPair.tokenBindingKeyType,
            }),
            ...(cachedKeyPair.tokenBindingKeyAlgorithm || fallbackAlgorithm
                ? {
                      tokenBindingKeyAlgorithm:
                          cachedKeyPair.tokenBindingKeyAlgorithm ||
                          fallbackAlgorithm,
                  }
                : {}),
        };
    }

    private getTokenBindingKeyGenAlgorithmOptions(
        tokenBindingKeyAlgorithm: string,
        correlationId: string
    ): AlgorithmIdentifier {
        if (tokenBindingKeyAlgorithm === TOKEN_BINDING_KEY_ALGORITHMS.RS256) {
            return BrowserCrypto.RSA_KEYGEN_ALGORITHM_OPTIONS;
        }

        if (tokenBindingKeyAlgorithm === TOKEN_BINDING_KEY_ALGORITHMS.ES256) {
            return BrowserCrypto.ECDSA_P256_KEYGEN_ALGORITHM_OPTIONS;
        }

        throw createBrowserAuthError(
            BrowserAuthErrorCodes.unsupportedTokenBindingAlgorithm,
            correlationId
        );
    }

    private getTokenBindingCacheKey(
        keyId: string,
        context?: TokenBindingKeyContext
    ): string {
        return context?.keyScope
            ? `${urlEncode(context.keyScope)}.${keyId}`
            : keyId;
    }

    private startScopedKeyRequest(
        scopedRequestFingerprint: string,
        request: TokenBindingKeyProvisioningParameters
    ): Promise<string> {
        const requestPromise = this.provisionTokenBindingKeyInternal(
            request
        ).finally(() => {
            if (
                TokenBindingKeyManager.activeScopedKeyRequests.get(
                    scopedRequestFingerprint
                ) === requestPromise
            ) {
                TokenBindingKeyManager.activeScopedKeyRequests.delete(
                    scopedRequestFingerprint
                );
            }
        });
        TokenBindingKeyManager.activeScopedKeyRequests.set(
            scopedRequestFingerprint,
            requestPromise
        );
        return requestPromise;
    }

    private async observeCoalescedScopedKeyRequest(
        request: TokenBindingKeyProvisioningParameters,
        activeRequest: Promise<string>
    ): Promise<string> {
        const measurement = this.performanceClient?.startMeasurement(
            BrowserPerformanceEvents.CryptoOptsGetPublicKeyThumbprint,
            request.correlationId
        );
        try {
            const keyId = await activeRequest;
            measurement?.end({
                success: true,
                tokenBindingKeyType: request.tokenBindingKeyType,
                tokenBindingKeyAlgorithm: request.tokenBindingKeyAlgorithm,
                tokenBindingKeyRequestCoalesced: true,
            });
            return keyId;
        } catch (e) {
            measurement?.end({
                success: false,
                tokenBindingKeyType: request.tokenBindingKeyType,
                tokenBindingKeyAlgorithm: request.tokenBindingKeyAlgorithm,
                tokenBindingKeyRequestCoalesced: true,
            });
            if (e instanceof BrowserAuthError) {
                throw createBrowserAuthError(
                    e.errorCode,
                    request.correlationId,
                    e.subError
                );
            }
            throw e;
        }
    }

    private getScopedRequestFingerprint(
        request: TokenBindingKeyProvisioningParameters
    ): string {
        return JSON.stringify([
            request.keyScope,
            request.tokenBindingKeyType,
            request.tokenBindingKeyAlgorithm,
        ]);
    }
}
