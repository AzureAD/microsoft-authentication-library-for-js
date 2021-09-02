/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CommonRefreshTokenRequest, BoundRefreshTokenRedemptionPayload } from "@azure/msal-common";
import { DBTableNames } from "../utils/BrowserConstants";
import { DatabaseStorage } from "../cache/DatabaseStorage";
import { CryptoAlgorithms, CryptoLengths, CryptoKeyFormats, KeyDerivationLabels, KEY_USAGES, CRYPTO_KEY_CONFIG } from "../utils/CryptoConstants";
import { KeyDerivation } from "./KeyDerivation";
import { CtxGenerator } from "./CtxGenerator";
import { BrowserStringUtils } from "../utils/BrowserStringUtils";
import { Base64Encode } from "../encode/Base64Encode";
import { BrowserCrypto } from "./BrowserCrypto";
import { BrowserAuthError } from "../error/BrowserAuthError";

export type BoundTokenRequestHeader = {
    ctx: string,
    alg: CryptoAlgorithms
};

/**
 * This class represents a Bound Server Token Refresh Request that will be signed using a server-generated and client-stored
 * Session Key that is itself protected by an MSAL generated Session Transport Keypair, as specified in the Bound Refresh Token Protocol v1.
 * The BoundTokenRequest class also exposes the APIs responsible for signing the JWT request parameter of the bound token refresh request.
 */
export class BoundTokenRequest {
    private payload: BoundRefreshTokenRedemptionPayload;
    private keyDerivation: KeyDerivation;
    private keyStore: DatabaseStorage;
    private keyId: string;
    private b64Encode: Base64Encode;
    private browserCrypto: BrowserCrypto;
    private ctx: Uint8Array;
    private base64Encoder: Base64Encode;

    constructor(request: CommonRefreshTokenRequest, payload: BoundRefreshTokenRedemptionPayload, keyStore: DatabaseStorage, browserCrypto: BrowserCrypto) {
        this.payload = payload;
        this.keyDerivation = new KeyDerivation(CryptoLengths.DERIVED_KEY, CryptoLengths.PRF_OUTPUT, CryptoLengths.COUNTER);
        this.keyStore = keyStore;
        this.b64Encode = new Base64Encode();
        this.browserCrypto = browserCrypto;
        this.ctx = new CtxGenerator(this.browserCrypto).generateCtx();
        this.base64Encoder = new Base64Encode();

        if (request.skKid) {
            this.keyId = request.skKid;
        } else {
            throw BrowserAuthError.createMissingSessionKeyIdError();
        }
    }

    /**
     * Signs JWT Payload using the session key corresponding to the refresh token request
     */
    async sign(): Promise<string> {
        // Get JWT header.payload string
        const jwtString = this.getJwtString();
        // Encode jwtString into an ArrayBuffer to prepare for signing
        const jwtBuffer = BrowserStringUtils.stringToArrayBuffer(jwtString);
        // Get session key
        const sessionKey = await this.getSessionKey();
        // Sign JWT
        const signatureBuffer = await this.signJwt(jwtBuffer, sessionKey);
        // Encode signature
        const encodedSignature = this.b64Encode.urlEncodeArr(new Uint8Array(signatureBuffer));
        // Append signature to JWT
        return `${jwtString}.${encodedSignature}`;
    }

    /**
     * Builds JWT Header
     */
    private getHeader(): BoundTokenRequestHeader {
        return {
            ctx: this.base64Encoder.base64EncArr(this.ctx),
            alg: CryptoAlgorithms.HS256
        };
    }

    /**
     * 
     * Signs JWT Buffer with provided signing key
     */
    private async signJwt(jwtBuffer: ArrayBuffer, signingKey: CryptoKey): Promise<ArrayBuffer> {
        return await this.browserCrypto.sign(
            CRYPTO_KEY_CONFIG.RT_BINDING_SIGN_JWT,
            signingKey,
            jwtBuffer
        );
    }

    /**
     * Generates JWT header, Base64URL encodes header and payload
     * and concatenates them in order to form the JWT string
     * of the form BASE64URL(header).BASE64URL(payload)
     */
    private getJwtString(): string {
        const header = this.getHeader();
        const encodedHeader = this.b64Encode.urlEncode(JSON.stringify(header));
        const encodedPayload = this.b64Encode.urlEncode(JSON.stringify(this.payload));
        return `${encodedHeader}.${encodedPayload}`;
    }

    /**
     * Retrieves content encryption key from KeyStore and uses it to derive
     * and return the session key that will be used to sign the request payload
     */
    private async getSessionKey(): Promise<CryptoKey> {
        // Retrieve content encryption key (derivation key) from Key Store
        const contentEncryptionKey: CryptoKey = await this.keyStore.get<CryptoKey>(DBTableNames.symmetricKeys, this.keyId);
        const hashedInputData = await this.generateKDFInputData();
        // Derive session key
        const derivedKeyData = new Uint8Array(await this.keyDerivation.computeKDFInCounterMode(contentEncryptionKey, hashedInputData, KeyDerivationLabels.SIGNING));
        const sessionKeyAlgorithm: HmacImportParams = { name: CryptoAlgorithms.HMAC, hash: CryptoAlgorithms.S256_HASH_ALG };
        // Import and return session key
        return await window.crypto.subtle.importKey(CryptoKeyFormats.RAW, derivedKeyData, sessionKeyAlgorithm, false, KEY_USAGES.RT_BINDING.SIGN);
    }

    /**
     * Encodes payload into a UTF-8 byte array and appends it to
     * the ctx byte array, then calculates the SHA-256 digest of
     * the ctx || payload byte array to generate the expected
     * input data byte array for key derivation.
     */
    private async generateKDFInputData(): Promise<Uint8Array> {
        const payloadBytes = BrowserStringUtils.stringToUtf8Arr(JSON.stringify(this.payload));
        const inputData = new Uint8Array(this.ctx.byteLength + payloadBytes.byteLength);
        inputData.set(this.ctx, 0);
        inputData.set(payloadBytes, this.ctx.byteLength);
        return new Uint8Array(await window.crypto.subtle.digest({ name: CryptoAlgorithms.S256_HASH_ALG }, inputData));
    }
}
