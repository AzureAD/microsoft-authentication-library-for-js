/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    ClientAuthErrorCodes,
    createClientAuthError,
    IPerformanceClient,
    JsonWebTokenAlgorithms,
    Logger,
} from "@azure/msal-common/browser";
import type {
    ITokenBindingKeyManager,
    TokenBindingKeyProvisioningParameters,
} from "@azure/msal-common/browser";
import * as BrowserPerformanceEvents from "../telemetry/BrowserPerformanceEvents.js";
import * as BrowserCrypto from "./BrowserCrypto.js";
import {
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
 * Owns browser token-binding key lifecycle and storage lookup.
 * @internal
 */
export class TokenBindingKeyManager implements ITokenBindingKeyManager {
    private static TOKEN_BINDING_KEY_USAGES: Array<KeyUsage> = [
        "sign",
        "verify",
    ];
    private static tokenBindingKeyStorage: AsyncMemoryStorage<CachedKeyPair>;
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
     * Provisions a browser token-binding key and returns its key identifier.
     * @param request - Key provisioning policy.
     */
    async provisionTokenBindingKey(
        request: TokenBindingKeyProvisioningParameters
    ): Promise<string> {
        const publicKeyThumbMeasurement =
            this.performanceClient?.startMeasurement(
                BrowserPerformanceEvents.CryptoOptsGetPublicKeyThumbprint,
                request.correlationId
            );
        try {
            const activeKeyPair = await this.createTokenBindingKey(request);

            publicKeyThumbMeasurement?.end({
                success: true,
                ...this.getTokenBindingKeyTelemetry(activeKeyPair),
            });

            return activeKeyPair.keyId;
        } catch (e) {
            publicKeyThumbMeasurement?.end({
                success: false,
                tokenBindingKeyType: request.tokenBindingKeyType,
                tokenBindingKeyAlgorithm: request.tokenBindingKeyAlgorithm,
            });
            throw e;
        }
    }

    /**
     * Removes a browser token-binding key by identifier.
     * @param kid - Token-binding key identifier.
     * @param correlationId - Request correlation identifier.
     */
    async removeTokenBindingKey(
        kid: string,
        correlationId: string
    ): Promise<void> {
        await this.cache.removeItem(kid, correlationId);
        const keyFound = await this.cache.containsKey(kid, correlationId);
        if (keyFound) {
            throw createClientAuthError(
                ClientAuthErrorCodes.bindingKeyNotRemoved,
                correlationId
            );
        }
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
     * Gets a token-binding public key as a JWK by identifier.
     * @param keyId - Token-binding key identifier.
     * @param correlationId - Request correlation identifier.
     */
    async getTokenBindingPublicKeyJwk(
        keyId: string,
        correlationId: string
    ): Promise<JsonWebKey> {
        const cachedKeyPair = await this.getTokenBindingKeyPair(
            keyId,
            correlationId
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
            generatedKeyPair.keyId,
            {
                ...generatedKeyPair,
                tokenBindingKeyType: request.tokenBindingKeyType,
                tokenBindingKeyAlgorithm: request.tokenBindingKeyAlgorithm,
            },
            request.correlationId
        );

        return {
            ...generatedKeyPair,
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

    /** @internal */
    async getTokenBindingKeyPair(
        keyId: string,
        correlationId: string
    ): Promise<CachedKeyPair> {
        const cachedKeyPair = await this.cache.getItem(keyId, correlationId);
        if (!cachedKeyPair) {
            throw createBrowserAuthError(
                BrowserAuthErrorCodes.cryptoKeyNotFound,
                correlationId
            );
        }

        return cachedKeyPair;
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
        if (tokenBindingKeyAlgorithm === JsonWebTokenAlgorithms.RS256) {
            return BrowserCrypto.RSA_KEYGEN_ALGORITHM_OPTIONS;
        }

        if (tokenBindingKeyAlgorithm === JsonWebTokenAlgorithms.ES256) {
            return BrowserCrypto.ECDSA_P256_KEYGEN_ALGORITHM_OPTIONS;
        }

        throw createBrowserAuthError(
            BrowserAuthErrorCodes.unsupportedTokenBindingAlgorithm,
            correlationId
        );
    }
}
