/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BaseAuthRequest, BoundServerAuthorizationTokenResponse, ServerAuthorizationTokenResponse } from "@azure/msal-common";
import { DatabaseStorage } from "../cache/DatabaseStorage";
import { KEY_USAGES } from "../utils/CryptoConstants";
import { CachedKeyPair } from "./CryptoOps";
import { JsonWebEncryption } from "./JsonWebEncryption";

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
    
        // TODO: TEMPORARY CHECK TO GET AROUND LINTER
        if(contentEncryptionKey) {
            return null;
        }

        return null;
    }

}
