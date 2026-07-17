/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    ICrypto,
    IPerformanceClient,
    JoseHeader,
    Logger,
    PublicKeyThumbprintParameters,
    ShrOptions,
    SignedHttpRequest,
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
    CachedKeyPair,
    TOKEN_BINDING_KEY_ALGORITHMS,
    TokenBindingKeyContext,
    TokenBindingKeyTelemetry,
    TokenBindingKeyManager,
} from "./TokenBindingKeyManager.js";
import {
    BrowserAuthErrorCodes,
    createBrowserAuthError,
} from "../error/BrowserAuthError.js";

type TokenBindingKeySigningAlgorithm = {
    signAlgorithm: AlgorithmIdentifier;
};

type TokenBindingSigningHeader = {
    alg: string;
    jwk?: JsonWebKey;
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
    private tokenBindingKeyManager: TokenBindingKeyManager;

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
        this.performanceClient = performanceClient;
        this.tokenBindingKeyManager = new TokenBindingKeyManager(
            this.logger,
            this.performanceClient
        );
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
     * @deprecated Legacy SHR compatibility wrapper. New MSAL token-binding
     * flows should use protocol-specific key lifecycle and signing helpers.
     *
     * @param request - PoP/SHR request parameters.
     * @returns RFC 7638 public JWK thumbprint for the selected key.
     */
    async getPublicKeyThumbprint(
        request: PublicKeyThumbprintParameters
    ): Promise<string> {
        return this.tokenBindingKeyManager.provisionTokenBindingKey({
            correlationId: request.correlationId || "",
            tokenBindingKeyType: "shr",
            tokenBindingKeyAlgorithm: TOKEN_BINDING_KEY_ALGORITHMS.RS256,
        });
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
        await this.tokenBindingKeyManager.removeTokenBindingKey(
            kid,
            correlationId,
            context
        );
    }

    /**
     * Removes all cryptographic keys from IndexedDB storage
     * @param correlationId
     */
    async clearKeystore(correlationId: string): Promise<boolean> {
        return this.tokenBindingKeyManager.clearKeystore(correlationId);
    }

    /** @internal */
    async signTokenBindingJwt(
        header: object,
        payload: object,
        kid: string,
        correlationId: string,
        context?: TokenBindingKeyContext
    ): Promise<string> {
        let telemetry: TokenBindingKeyTelemetry = {};
        const signTokenBindingJwtMeasurement =
            this.performanceClient?.startMeasurement(
                BrowserPerformanceEvents.CryptoOptsSignJwt,
                correlationId
            );
        try {
            const cachedKeyPair =
                await this.tokenBindingKeyManager.getTokenBindingKeyPair(
                    kid,
                    correlationId,
                    context
                );
            const jwtHeader = validateTokenBindingSigningHeader(
                header,
                correlationId
            );
            await this.validateTokenBindingJwtHeaderKey(
                jwtHeader,
                kid,
                correlationId
            );
            telemetry = this.tokenBindingKeyManager.getTokenBindingKeyTelemetry(
                cachedKeyPair,
                jwtHeader.alg
            );

            const signingAlgorithm = this.getTokenBindingKeySigningAlgorithm(
                cachedKeyPair,
                jwtHeader.alg,
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
     * @deprecated Legacy SHR signing helper. New MSAL token-binding flows should
     * use protocol-specific proof builders and signing helpers.
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
        const publicKeyJwk =
            await this.tokenBindingKeyManager.getTokenBindingPublicKeyJwk(
                kid,
                resolvedCorrelationId
            );
        const encodedKeyIdThumbprint = urlEncode(JSON.stringify({ kid: kid }));
        const shrAlgorithm =
            shrOptions?.header?.alg ||
            publicKeyJwk.alg ||
            TOKEN_BINDING_KEY_ALGORITHMS.RS256;
        const shrHeader = JoseHeader.getShrHeader(
            {
                ...shrOptions?.header,
                alg: shrAlgorithm,
                kid: encodedKeyIdThumbprint,
            },
            resolvedCorrelationId
        );
        const shrPayload: SignedHttpRequest = {
            ...payload,
            cnf: {
                jwk: publicKeyJwk,
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
            requestedAlgorithm === TOKEN_BINDING_KEY_ALGORITHMS.RS256 &&
            keyAlgorithm.name === BrowserCrypto.RSA_SIGN_ALGORITHM_OPTIONS.name
        ) {
            return {
                signAlgorithm: BrowserCrypto.RSA_SIGN_ALGORITHM_OPTIONS,
            };
        }

        if (
            requestedAlgorithm === TOKEN_BINDING_KEY_ALGORITHMS.ES256 &&
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

        if (
            requestedAlgorithm === TOKEN_BINDING_KEY_ALGORITHMS.RS256 ||
            requestedAlgorithm === TOKEN_BINDING_KEY_ALGORITHMS.ES256
        ) {
            throw createBrowserAuthError(
                BrowserAuthErrorCodes.tokenBindingKeyAlgorithmMismatch,
                correlationId
            );
        }

        throw createBrowserAuthError(
            BrowserAuthErrorCodes.unsupportedTokenBindingAlgorithm,
            correlationId
        );
    }

    private async validateTokenBindingJwtHeaderKey(
        header: TokenBindingSigningHeader,
        kid: string,
        correlationId: string
    ): Promise<void> {
        if (!header.jwk) {
            return;
        }

        const headerKeyId = await BrowserCrypto.computeJwkThumbprint(
            header.jwk
        );
        if (headerKeyId !== kid) {
            throw createBrowserAuthError(
                BrowserAuthErrorCodes.tokenBindingKeyJwkThumbprintMismatch,
                correlationId
            );
        }
    }

}

function validateTokenBindingSigningHeader(
    header: object,
    correlationId: string
): TokenBindingSigningHeader {
    if (!isRecord(header) || typeof header.alg !== "string" || !header.alg) {
        throw createBrowserAuthError(
            BrowserAuthErrorCodes.missingTokenBindingJwtAlgorithm,
            correlationId
        );
    }

    const tokenBindingJwtHeader: TokenBindingSigningHeader = {
        alg: header.alg,
    };

    if (!("jwk" in header) || typeof header.jwk === "undefined") {
        return tokenBindingJwtHeader;
    }

    if (isRecord(header.jwk)) {
        return {
            ...tokenBindingJwtHeader,
            jwk: header.jwk,
        };
    }

    throw createBrowserAuthError(
        BrowserAuthErrorCodes.tokenBindingKeyJwkThumbprintMismatch,
        correlationId
    );
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}
