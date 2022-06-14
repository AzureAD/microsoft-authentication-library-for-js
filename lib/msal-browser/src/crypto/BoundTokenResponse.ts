/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BaseAuthRequest, BoundServerAuthorizationTokenResponse, ServerAuthorizationTokenResponse } from "@azure/msal-common";
import { BrowserAuthError } from "..";
import { CryptoKeyUsageSets } from "../utils/CryptoConstants";
import { CryptoKeyStore } from "./CryptoOps";
import { JsonWebEncryption } from "./JsonWebEncryption";

export class BoundTokenResponse {

    private sessionKeyJwe: JsonWebEncryption;
    private responseJwe: JsonWebEncryption;
    private keyStore: CryptoKeyStore;
    private keyId: string;

    constructor(boundTokenResponse: BoundServerAuthorizationTokenResponse, request: BaseAuthRequest, keyStore: CryptoKeyStore) {
        this.sessionKeyJwe = new JsonWebEncryption(boundTokenResponse.session_key_jwe);
        this.responseJwe = new JsonWebEncryption(boundTokenResponse.response_jwe);
        this.keyStore = keyStore;

        if (request.stkJwk) {
            this.keyId = request.stkJwk;
        } else {
            throw BrowserAuthError.createMissingStkKidError();
        }
    }

    async decrypt(): Promise<ServerAuthorizationTokenResponse | null> {
        // Retrieve Session Transport KeyPair from Key Store
        const sessionTransportKeypair = await this.keyStore.asymmetricKeys.getItem(this.keyId);

        if (!sessionTransportKeypair) {
            throw BrowserAuthError.createSigningKeyNotFoundInStorageError();
        }

        const contentEncryptionKey = await this.sessionKeyJwe.unwrap(
            sessionTransportKeypair.privateKey,
            CryptoKeyUsageSets.RefreshTokenBinding.SessionKey
        );
  
        // TODO: TEMPORARY CHECK TO GET AROUND LINTER
        if(contentEncryptionKey) {
            return null;
        }

        return null;
    }

}
