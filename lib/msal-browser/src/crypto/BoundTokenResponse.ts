/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BaseAuthRequest, BoundServerAuthorizationTokenResponse, ServerAuthorizationTokenResponse } from "@azure/msal-common";
import { BrowserAuthError } from "..";
import { Algorithms, CryptoKeyFormats, CryptoKeyUsageSets, KeyDerivationLabels, Lengths } from "../utils/CryptoConstants";
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
    private keyId: string;

    constructor(boundTokenResponse: BoundServerAuthorizationTokenResponse, request: BaseAuthRequest, keyStore: CryptoKeyStore) {
        this.sessionKeyJwe = new JsonWebEncryption(boundTokenResponse.session_key_jwe);
        this.responseJwe = new JsonWebEncryption(boundTokenResponse.response_jwe);
        this.keyDerivation = new KeyDerivation(Lengths.derivedKey, Lengths.prfOutput, Lengths.kdfCounter);
        this.keyStore = keyStore;

        if (request.stkJwk) {
            this.keyId = request.stkJwk;
        } else {
            throw BrowserAuthError.createMissingStkKidError();
        }
    }

    /**
     * Decrypts the encrypted server response that is bound to the browser through
     * a Session Transport Key
     */
    async decrypt(): Promise<ServerAuthorizationTokenResponse | null> {
        // Retrieve Session Transport KeyPair from Key Store
        const sessionTransportKeypair = await this.keyStore.asymmetricKeys.getItem(this.keyId);

        if (!sessionTransportKeypair) {
            throw BrowserAuthError.createSigningKeyNotFoundInStorageError();
        }

        const sessionKey = await this.getSessionKey(sessionTransportKeypair.privateKey);

        if (sessionKey) {
            return null;
        } else {
            throw BrowserAuthError.createMissingStkKidError();
        }
    }

    /**
     * Unwraps session key material from session_key_jwe and derives the server-generated
     * session key.
     * @param unwrappingKey Private CryptoKey from Session Transport Key which the response is bound to 
     */
    private async getSessionKey(unwrappingKey: CryptoKey): Promise<CryptoKey> {
        // Unwrap Content Encryption Key from Session Key JWE
        const contentEncryptionKey = await this.sessionKeyJwe.unwrap(
            unwrappingKey,
            CryptoKeyUsageSets.RefreshTokenBinding.DerivationKey
        );
        
        // Derive Session Key
        const sessionKeyBytes = await this.keyDerivation.computeKDFInCounterMode(
            contentEncryptionKey,
            this.responseJwe.protectedHeader.ctx,
            KeyDerivationLabels.DECRYPTION
        );

        // Set up AES-GCM Decryption Key Configuration
        const algorithm: AesKeyAlgorithm = { name: Algorithms.AES_GCM, length: Lengths.derivedKey };

        return await window.crypto.subtle.importKey(
            CryptoKeyFormats.raw,
            sessionKeyBytes,
            algorithm,
            false,
            CryptoKeyUsageSets.RefreshTokenBinding.SessionKey
        );
    }
}
