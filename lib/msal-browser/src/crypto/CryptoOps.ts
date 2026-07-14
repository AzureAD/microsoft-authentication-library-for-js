/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    ClientAuthErrorCodes,
    createClientAuthError,
    ICrypto,
    IPerformanceClient,
    JoseHeader,
    Logger,
    JsonWebTokenAlgorithms,
    PublicKeyThumbprintParameters,
    ShrOptions,
    SignedHttpRequest,
    TokenBindingKeyContext,
    TokenBindingKeyProvisioningParameters,
} from "@azure/msal-common/browser";
import * as BrowserPerformanceEvents from "../telemetry/BrowserPerformanceEvents.js";
import {
    base64Encode,
    urlEncode,
    urlEncodeArr,
} from "../encode/Base64Encode.js";
import { base64Decode } from "../encode/Base64Decode.js";
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
    publicKey: CryptoKey;
    privateKey: CryptoKey;
    tokenBindingKeyType?: string;
    tokenBindingKeyAlgorithm?: string;
    /**
     * Stable scope for keys that are reusable before their JWK thumbprint is
     * known.
     */
    keyScope?: string;
    keyId?: string;
};

type GeneratedKeyPair = CachedKeyPair & { keyId: string };

type TokenBindingKeySigningAlgorithm = {
    signAlgorithm: AlgorithmIdentifier;
};

type TokenBindingSigningTelemetry = {
    tokenBindingKeyType?: string;
    tokenBindingKeyAlgorithm?: string;
};

/**
 * This class implements MSAL's crypto interface, which allows it to perform base64 encoding and decoding, generating cryptographically random GUIDs and
 * implementing Proof Key for Code Exchange specs for the OAuth Authorization Code Flow using PKCE (rfc here: https://tools.ietf.org/html/rfc7636).
 */
export class CryptoOps implements ICrypto {
    private logger: Logger;

    /**
     * CryptoOps can be used in contexts outside a PCA instance,
     * meaning there won't be a performance manager available.
     */
    private performanceClient: IPerformanceClient | undefined;

    private static TOKEN_BINDING_KEY_USAGES: Array<KeyUsage> = [
        "sign",
        "verify",
    ];
    private cache: AsyncMemoryStorage<CachedKeyPair>;

    constructor(
        logger: Logger,
        performanceClient?: IPerformanceClient,
        skipValidateSubtleCrypto?: boolean
    ) {
        this.logger = logger;
        // Browser crypto needs to be validated first before any other classes can be set.
        BrowserCrypto.validateCryptoAvailable(
            skipValidateSubtleCrypto ?? false
        );
        this.cache = new AsyncMemoryStorage<CachedKeyPair>(this.logger);
        this.performanceClient = performanceClient;
    }

    /**
     * Creates a new random GUID - used to populate state and nonce.
     * @returns string (GUID)
     */
    createNewGuid(): string {
        return BrowserCrypto.createNewGuid();
    }

    /**
     * Encodes input string to base64.
     * @param input
     */
    base64Encode(input: string): string {
        return base64Encode(input);
    }

    /**
     * Decodes input string from base64.
     * @param input
     */
    base64Decode(input: string): string {
        return base64Decode(input);
    }

    /**
     * Encodes input string to base64 URL safe string.
     * @param input
     */
    base64UrlEncode(input: string): string {
        return urlEncode(input);
    }

    /**
     * Stringifies and base64Url encodes input public key
     * @param inputKid
     * @returns Base64Url encoded public key
     */
    encodeKid(inputKid: string): string {
        return this.base64UrlEncode(JSON.stringify({ kid: inputKid }));
    }

    /**
     * Provisions or reuses a browser token-binding key and returns the public JWK
     * thumbprint.
     *
     * @deprecated Compatibility wrapper for the legacy get-or-create API. New
     * token-binding flows should provision a key with protocol-owned key type
     * and JOSE algorithm policy, then use lookup/signing APIs with the returned
     * key id.
     *
     * @param request - PoP/SHR request parameters.
     * @returns RFC 7638 public JWK thumbprint for the selected key.
     */
    async getPublicKeyThumbprint(
        request: PublicKeyThumbprintParameters
    ): Promise<string> {
        return this.provisionTokenBindingKey({
            correlationId: request.correlationId || "",
            tokenBindingKeyType: "shr",
            tokenBindingKeyAlgorithm: JsonWebTokenAlgorithms.RS256,
        });
    }

    /**
     * Provisions or reuses a browser token-binding key from caller-provided key
     * policy and returns the public JWK thumbprint.
     * @param request
     * @internal
     */
    async provisionTokenBindingKey(
        request: TokenBindingKeyProvisioningParameters
    ): Promise<string> {
        const publicKeyThumbMeasurement =
            this.performanceClient?.startMeasurement(
                BrowserPerformanceEvents.CryptoOptsGetPublicKeyThumbprint,
                request.correlationId
            );
        const cachedKeyPair = request.keyScope
            ? await this.getScopedTokenBindingKeyPair(
                  request.keyScope,
                  request.correlationId
              )
            : null;
        try {
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
     * Removes cryptographic keypair from key store matching the keyId passed in
     * @param kid
     * @param correlationId
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
     * Removes all cryptographic keys from IndexedDB storage
     * @param correlationId
     */
    async clearKeystore(correlationId: string): Promise<boolean> {
        // Delete in-memory keystores
        this.cache.clearInMemory(correlationId);

        /**
         * There is only one database, so calling clearPersistent on asymmetric keystore takes care of
         * every persistent keystore
         */
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
     * Signs a compact JWT with a browser token-binding key.
     * @param header
     * @param payload
     * @param kid
     * @param correlationId
     * @param context
     * @internal
     */
    async signTokenBindingJwt(
        header: object,
        payload: object,
        kid: string,
        correlationId: string,
        context?: TokenBindingKeyContext
    ): Promise<string> {
        let telemetry: TokenBindingSigningTelemetry = {};
        const signTokenBindingJwtMeasurement =
            this.performanceClient?.startMeasurement(
                BrowserPerformanceEvents.CryptoOptsSignJwt,
                correlationId
            );
        try {
            const cachedKeyPair = await this.getTokenBindingKeyPair(
                kid,
                correlationId,
                context
            );
            telemetry = this.getTokenBindingKeyTelemetry(cachedKeyPair);

            const jwtHeaderAlgorithm = this.getTokenBindingJwtHeaderAlgorithm(
                header,
                correlationId
            );
            if (!telemetry.tokenBindingKeyAlgorithm) {
                telemetry.tokenBindingKeyAlgorithm = jwtHeaderAlgorithm;
            }

            const signingAlgorithm = this.getTokenBindingKeySigningAlgorithm(
                cachedKeyPair,
                jwtHeaderAlgorithm,
                correlationId
            );

            const tokenString = `${urlEncode(
                JSON.stringify(header)
            )}.${urlEncode(JSON.stringify(payload))}`;
            const encodedSignature = await this.signInput(
                cachedKeyPair,
                tokenString,
                signingAlgorithm.signAlgorithm
            );

            signTokenBindingJwtMeasurement?.end({
                success: true,
                ...telemetry,
            });
            return `${tokenString}.${encodedSignature}`;
        } catch (e) {
            signTokenBindingJwtMeasurement?.end({
                success: false,
                ...telemetry,
            });
            throw e;
        }
    }

    /**
     * Signs the given object as an SHR JWT payload with the private key retrieved by the given kid.
     * @deprecated Build SHR payloads in PopTokenGenerator and call signTokenBindingJwt instead.
     * @param payload
     * @param kid
     */
    async signJwt(
        payload: SignedHttpRequest,
        kid: string,
        shrOptions?: ShrOptions,
        correlationId?: string
    ): Promise<string> {
        const resolvedCorrelationId = correlationId || "";
        const cachedKeyPair = await this.getTokenBindingKeyPair(
            kid,
            resolvedCorrelationId
        );

        const publicKeyJwk = await BrowserCrypto.exportJwk(
            cachedKeyPair.publicKey
        );
        const publicKeyJwkString = getSortedObjectString(publicKeyJwk);
        const encodedKeyIdThumbprint = urlEncode(JSON.stringify({ kid: kid }));
        const shrHeader = JoseHeader.getShrHeader(
            {
                ...shrOptions?.header,
                alg: publicKeyJwk.alg,
                kid: encodedKeyIdThumbprint,
            },
            resolvedCorrelationId
        );
        const shrPayload: SignedHttpRequest = {
            ...payload,
            cnf: {
                jwk: JSON.parse(publicKeyJwkString),
            },
        };

        return this.signTokenBindingJwt(
            shrHeader,
            shrPayload,
            kid,
            resolvedCorrelationId
        );
    }

    /**
     * Returns the SHA-256 hash of an input string
     * @param plainText
     */
    async hashString(plainText: string): Promise<string> {
        return BrowserCrypto.hashString(plainText);
    }

    private async createTokenBindingKey(
        request: TokenBindingKeyProvisioningParameters
    ): Promise<GeneratedKeyPair> {
        const keyGenAlgorithm = this.getTokenBindingKeyGenAlgorithmOptions(
            request.tokenBindingKeyAlgorithm,
            request.correlationId
        );
        const generatedKeyPair = await this.generateKeyPairAndThumbprint(
            CryptoOps.TOKEN_BINDING_KEY_USAGES,
            keyGenAlgorithm
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
        keyGenAlgorithm: AlgorithmIdentifier
    ): Promise<GeneratedKeyPair> {
        const keyPair: CryptoKeyPair = await BrowserCrypto.generateKeyPair(
            false,
            usages,
            keyGenAlgorithm
        );
        const publicJwk: JsonWebKey = await BrowserCrypto.exportJwk(
            keyPair.publicKey
        );
        const keyId = await BrowserCrypto.computeJwkThumbprint(publicJwk);
        return {
            publicKey: keyPair.publicKey,
            privateKey: keyPair.privateKey,
            keyId,
        };
    }

    private async getScopedTokenBindingKeyPair(
        keyScope: string,
        correlationId: string
    ): Promise<GeneratedKeyPair | null> {
        const scopedCacheKeyPrefix =
            this.getScopedTokenBindingCacheKeyPrefix(keyScope);
        const cacheKeys = (await this.cache.getKeys(correlationId)) || [];
        /*
         * The thumbprint is only known after key generation, so scoped key
         * reuse is discovered by scanning for the stable caller-owned prefix.
         */
        const scopedCacheKey = cacheKeys.find((cacheKey) =>
            cacheKey.startsWith(scopedCacheKeyPrefix)
        );
        if (!scopedCacheKey) {
            return null;
        }

        const cachedKeyPair = await this.cache.getItem(
            scopedCacheKey,
            correlationId
        );
        if (!cachedKeyPair?.keyId) {
            return null;
        }

        return {
            ...cachedKeyPair,
            keyId: cachedKeyPair.keyId,
        };
    }

    private async getTokenBindingKeyPair(
        keyId: string,
        correlationId: string,
        context?: TokenBindingKeyContext
    ): Promise<CachedKeyPair> {
        return this.getKeyPair(
            this.getTokenBindingCacheKey(keyId, context),
            correlationId
        );
    }

    /**
     * Gets the public JWK for a browser token-binding key. Scoped callers
     * provide context to resolve a partitioned key.
     * @internal
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

    private async signInput(
        cachedKeyPair: CachedKeyPair,
        signingInput: string,
        algorithm: AlgorithmIdentifier
    ): Promise<string> {
        const encoder = new TextEncoder();
        const signatureBuffer = await BrowserCrypto.sign(
            cachedKeyPair.privateKey,
            encoder.encode(signingInput),
            algorithm
        );

        return urlEncodeArr(new Uint8Array(signatureBuffer));
    }

    private getTokenBindingKeySigningAlgorithm(
        cachedKeyPair: CachedKeyPair,
        requestedAlgorithm: string,
        correlationId: string
    ): TokenBindingKeySigningAlgorithm {
        const keyAlgorithm = cachedKeyPair.privateKey.algorithm;
        if (
            requestedAlgorithm === JsonWebTokenAlgorithms.RS256 &&
            keyAlgorithm.name === BrowserCrypto.RSA_SIGN_ALGORITHM_OPTIONS.name
        ) {
            return {
                signAlgorithm: BrowserCrypto.RSA_SIGN_ALGORITHM_OPTIONS,
            };
        }

        if (
            requestedAlgorithm === JsonWebTokenAlgorithms.ES256 &&
            keyAlgorithm.name ===
                BrowserCrypto.ECDSA_SHA256_SIGN_ALGORITHM_OPTIONS.name &&
            (keyAlgorithm as EcKeyAlgorithm).namedCurve ===
                BrowserCrypto.ECDSA_P256_KEYGEN_ALGORITHM_OPTIONS.namedCurve
        ) {
            return {
                signAlgorithm:
                    BrowserCrypto.ECDSA_SHA256_SIGN_ALGORITHM_OPTIONS,
            };
        }

        throw createBrowserAuthError(
            BrowserAuthErrorCodes.unsupportedTokenBindingAlgorithm,
            correlationId
        );
    }

    private getTokenBindingKeyTelemetry(
        cachedKeyPair: CachedKeyPair
    ): TokenBindingSigningTelemetry {
        return {
            ...(cachedKeyPair.tokenBindingKeyType && {
                tokenBindingKeyType: cachedKeyPair.tokenBindingKeyType,
            }),
            ...(cachedKeyPair.tokenBindingKeyAlgorithm && {
                tokenBindingKeyAlgorithm:
                    cachedKeyPair.tokenBindingKeyAlgorithm,
            }),
        };
    }

    private getTokenBindingJwtHeaderAlgorithm(
        header: object,
        correlationId: string
    ): string {
        const requestedAlgorithm = (header as { alg?: unknown }).alg;
        if (typeof requestedAlgorithm === "string" && requestedAlgorithm) {
            return requestedAlgorithm;
        }

        throw createBrowserAuthError(
            BrowserAuthErrorCodes.missingTokenBindingJwtAlgorithm,
            correlationId
        );
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

    private getTokenBindingCacheKey(
        keyId: string,
        context?: TokenBindingKeyContext
    ): string {
        return context?.keyScope
            ? `${this.getScopedTokenBindingCacheKeyPrefix(
                  context.keyScope
              )}${keyId}`
            : keyId;
    }

    private getScopedTokenBindingCacheKeyPrefix(keyScope: string): string {
        return `${urlEncode(keyScope)}.`;
    }
}

function getSortedObjectString(obj: object): string {
    return JSON.stringify(obj, Object.keys(obj).sort());
}
