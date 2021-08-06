/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BaseAuthRequest, BoundServerAuthorizationTokenResponse, ServerAuthorizationTokenResponse } from "@azure/msal-common";
import { DatabaseStorage } from "../cache/DatabaseStorage";
import { BrowserAuthError } from "../error/BrowserAuthError";
import { CryptoAlgorithms, CryptoLengths, CryptoKeyFormats, KeyDerivationLabels, KEY_USAGES } from "../utils/CryptoConstants";
import { CachedKeyPair } from "./CryptoOps";
import { JsonWebEncryption } from "./JsonWebEncryption";
import { KeyDerivation } from "./KeyDerivation";

export class BoundTokenResponse {

    private sessionKeyJwe: JsonWebEncryption;
    private responseJwe: JsonWebEncryption;
    private keyStore: DatabaseStorage<CachedKeyPair>;
    private keyId: string;

    constructor(boundTokenResponse: BoundServerAuthorizationTokenResponse, request: BaseAuthRequest, keyStore: DatabaseStorage<CachedKeyPair>) {
        this.sessionKeyJwe = new JsonWebEncryption(boundTokenResponse.session_key_jwe);
        this.responseJwe = new JsonWebEncryption(boundTokenResponse.response_jwe);
        this.keyStore = keyStore;
        this.keyId = request.stkJwk!;
    }

    async decrypt(): Promise<ServerAuthorizationTokenResponse | null> {
        // Retrieve Session Transport KeyPair from Key Store
        const sessionTransportKeypair: CachedKeyPair = await this.keyStore.get(this.keyId);
        const contentEncryptionKey = await this.sessionKeyJwe.unwrap(
            sessionTransportKeypair.privateKey,
            KEY_USAGES.RT_BINDING.SESSION_KEY
        );
    
        // Derive the session key from the content encryption key
        const kdf = new KeyDerivation(
            contentEncryptionKey,
            CryptoLengths.DERIVED_KEY,
            CryptoLengths.PRF_OUTPUT,
            CryptoLengths.COUNTER
        );

        const derivedKeyData = await kdf.computeKDFInCounterMode(this.responseJwe.protectedHeader.ctx, KeyDerivationLabels.DECRYPTION);
        const sessionKeyUsages = KEY_USAGES.RT_BINDING.SESSION_KEY;
        const sessionKeyAlgorithm: AesKeyAlgorithm = { name: CryptoAlgorithms.AES_GCM, length: CryptoLengths.DERIVED_KEY };
        const sessionKey = await window.crypto.subtle.importKey(CryptoKeyFormats.RAW, derivedKeyData, sessionKeyAlgorithm, false, sessionKeyUsages);

        if (sessionKey) {
            return null;
        } else {
            throw BrowserAuthError.createMissingStkKidError();
        }
    }
}
