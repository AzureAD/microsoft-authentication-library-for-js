/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BaseAuthRequest, BoundServerAuthorizationTokenResponse, Logger, ServerAuthorizationTokenResponse } from "@azure/msal-common";
import { BrowserAuthError } from "../error/BrowserAuthError";
import { Base64Encode } from "../encode/Base64Encode";
import { Algorithms, CryptoKeyFormats, CryptoKeyUsageSets, KeyDerivationLabels, Lengths } from "../utils/CryptoConstants";
import { BrowserCrypto } from "./BrowserCrypto";
import { CryptoKeyStore } from "./CryptoOps";
import { JsonWebEncryption } from "./JsonWebEncryption";
import { KeyDerivation } from "./KeyDerivation";

/**
 * This class represents a Bound Server Authorization Response that has been encrypted using a server-generated
 * Session Key that is itself protected by an MSAL generated Session Transport Keypair, as specified in the Bound Refresh Token Protocol v1.
 * The BoundTokenResponse class also exposes the APIs responsible for decrypting the Session Key JWE and Response components of a Bound Token Response.
 */
export class BoundTokenResponse {
    private sessionKeyJwe: JsonWebEncryption;
    private responseJwe: JsonWebEncryption;
    private keyStore: CryptoKeyStore;
    private keyDerivation: KeyDerivation;
    private stkKid: string;
    private browserCrypto: BrowserCrypto;
    private base64Encode: Base64Encode;
    private logger: Logger;

    constructor(boundTokenResponse: BoundServerAuthorizationTokenResponse, request: BaseAuthRequest, keyStore: CryptoKeyStore, browserCrypto: BrowserCrypto, logger: Logger) {
        this.logger = logger;
        this.sessionKeyJwe = new JsonWebEncryption(boundTokenResponse.session_key_jwe, this.logger);
        this.responseJwe = new JsonWebEncryption(boundTokenResponse.response_jwe, this.logger);
        this.keyDerivation = new KeyDerivation(Lengths.derivedKey, Lengths.prfOutput, Lengths.kdfCounter, this.logger);
        this.keyStore = keyStore;
        this.browserCrypto = browserCrypto;
        this.base64Encode = new Base64Encode();
        if (request.stkJwk) {
            this.stkKid = request.stkJwk;
        } else {
            throw BrowserAuthError.createMissingStkKidError();
        }
    }

    /**
     * Decrypts the encrypted server response that is bound to the browser through
     * a Session Transport Key
     */
    async decrypt(): Promise<ServerAuthorizationTokenResponse> {
        // Retrieve Session Transport Key from KeyStore
        this.logger.verbose("Retrieving Session Transport Key");
        const sessionTransportKeypair = await this.keyStore.asymmetricKeys.getItem(this.stkKid);

        if (!sessionTransportKeypair) {
            throw BrowserAuthError.createSigningKeyNotFoundInStorageError();
        }

        this.logger.verbose("Successfully retrieved Session Transport Key");

        const sessionKey = await this.getSessionKey(sessionTransportKeypair.privateKey);
        const decryptedResponse = await this.responseJwe.getDecryptedResponse(sessionKey);

        // Generate Thumbprint for Session Key
        const sessionKeyJwk: JsonWebKey = await this.browserCrypto.exportJwk(sessionKey);
        const sessionKeyIdBytes = await this.browserCrypto.generateJwkThumbprintHash(sessionKeyJwk);
        const sessionKeyId = this.base64Encode.urlEncodeArr(sessionKeyIdBytes);
        await this.keyStore.symmetricKeys.setItem(sessionKeyId, sessionKey);
            
        return {
            ...decryptedResponse,
            stkKid: this.stkKid,
            skKid: sessionKeyId
        };
    }

    /**
     * Unwraps session key material from session_key_jwe and derives the server-generated
     * session key.
     * @param unwrappingKey Private CryptoKey from Session Transport Key which the response is bound to 
     */
    private async getSessionKey(unwrappingKey: CryptoKey): Promise<CryptoKey> {
        this.logger.verbose("Unwrapping Content Encryption Key from Session Key JWE");
        // Unwrap Content Encryption Key from Session Key JWE
        const contentEncryptionKey = await this.sessionKeyJwe.unwrap(
            unwrappingKey,
            CryptoKeyUsageSets.RefreshTokenBinding.DerivationKey
        );
        
        this.logger.verbose("Successfully unwrapped Content Encryption Key using Session Transport Key");

        // Derive Session Key
        const sessionKeyBytes = await this.keyDerivation.computeKDFInCounterMode(
            contentEncryptionKey,
            this.responseJwe.protectedHeader.ctx,
            KeyDerivationLabels.DECRYPTION
        );

        this.logger.verbose("Successfully derived keying material");

        // Set up AES-GCM Decryption Key Configuration
        const algorithm: AesKeyAlgorithm = { name: Algorithms.AES_GCM, length: Lengths.derivedKey };

        return await window.crypto.subtle.importKey(
            CryptoKeyFormats.raw,
            sessionKeyBytes,
            algorithm,
            true,
            CryptoKeyUsageSets.RefreshTokenBinding.SessionKey
        );
    }
}
