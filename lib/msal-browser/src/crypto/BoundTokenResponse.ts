/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BaseAuthRequest, BoundServerAuthorizationTokenResponse, ServerAuthorizationTokenResponse } from "@azure/msal-common";
import { DBTableNames } from "../utils/BrowserConstants";
import { DatabaseStorage } from "../cache/DatabaseStorage";
import { CryptoAlgorithms, CryptoLengths, CryptoKeyFormats, KeyDerivationLabels, KEY_USAGES } from "../utils/CryptoConstants";
import { CachedKeyPair } from "./CryptoOps";
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
    private keyDerivation: KeyDerivation;
    private keyStore: DatabaseStorage;
    private keyId: string;

    constructor(boundTokenResponse: BoundServerAuthorizationTokenResponse, request: BaseAuthRequest, keyStore: DatabaseStorage) {
        this.sessionKeyJwe = new JsonWebEncryption(boundTokenResponse.session_key_jwe);
        this.responseJwe = new JsonWebEncryption(boundTokenResponse.response_jwe);
        this.keyDerivation = new KeyDerivation(CryptoLengths.DERIVED_KEY, CryptoLengths.PRF_OUTPUT, CryptoLengths.COUNTER);
        this.keyStore = keyStore;
        this.keyId = request.stkJwk!;
    }

    /**
     * Decrypts the encrypted server response that is bound to the browser through
     * a Session Transport Key
     */
    async decrypt(): Promise<ServerAuthorizationTokenResponse> {
        // Retrieve Session Transport Key from KeyStore
        const sessionTransportKeypair: CachedKeyPair = await this.keyStore.get<CryptoKeyPair>(DBTableNames.asymmetricKeys, this.keyId);
        const sessionKey = await this.getSessionKey(sessionTransportKeypair.privateKey);
        const decryptedResponse = await this.responseJwe.getDecryptedResponse(sessionKey);
            
        return {
            ...decryptedResponse,
            stkKid: this.keyId,
            skKid: this.keyId
        };
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
            KEY_USAGES.RT_BINDING.DERIVATION_KEY
        );

        await this.keyStore.put<CryptoKey>(DBTableNames.symmetricKeys, this.keyId, contentEncryptionKey);
        
        // Derive Session Key
        const sessionKeyBytes = await this.keyDerivation.computeKDFInCounterMode(
            contentEncryptionKey,
            this.responseJwe.protectedHeader.ctx,
            KeyDerivationLabels.DECRYPTION
        );

        const algorithm: AesKeyAlgorithm = { name: CryptoAlgorithms.AES_GCM, length: CryptoLengths.DERIVED_KEY };
        return await window.crypto.subtle.importKey(
            CryptoKeyFormats.RAW,
            sessionKeyBytes,
            algorithm,
            false,
            KEY_USAGES.RT_BINDING.SESSION_KEY
        );
    }
}
