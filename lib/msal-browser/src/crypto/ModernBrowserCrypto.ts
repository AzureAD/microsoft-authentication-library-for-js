/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { KEY_FORMAT_JWK } from "../utils/BrowserConstants";
import { ISubtleCrypto } from "./ISubtleCrypto";

export class ModernBrowserCrypto implements ISubtleCrypto {
    private window: Window;

    constructor() {
        /*
         * Use window.crypto if available (for browser windows),
         * otherwise self.crypto (for service workers)
         */
        if (typeof self !== "undefined") {
            this.window = self;
        } else {
            this.window = window;
        }
    }

    getRandomValues(dataBuffer: Uint8Array): Uint8Array {
        return this.window.crypto.getRandomValues(dataBuffer);
    }

    async generateKey(algorithm: RsaHashedKeyGenParams, extractable: boolean, keyUsages: KeyUsage[]): Promise<CryptoKeyPair> {
        return this.window.crypto.subtle.generateKey(algorithm, extractable, keyUsages) as Promise<CryptoKeyPair>;
    }

    async exportKey(key: CryptoKey): Promise<JsonWebKey> {
        return this.window.crypto.subtle.exportKey(KEY_FORMAT_JWK, key) as Promise<JsonWebKey>;
    }

    async importKey(keyData: JsonWebKey, algorithm: RsaHashedImportParams, extractable: boolean, keyUsages: KeyUsage[]): Promise<CryptoKey> {
        return this.window.crypto.subtle.importKey(KEY_FORMAT_JWK, keyData, algorithm, extractable, keyUsages) as Promise<CryptoKey>;
    }

    async sign(algorithm: AlgorithmIdentifier, key: CryptoKey, data: ArrayBuffer): Promise<ArrayBuffer> {
        return this.window.crypto.subtle.sign(algorithm, key, data) as Promise<ArrayBuffer>;
    }

    async digest(algorithm: AlgorithmIdentifier, data: Uint8Array): Promise<ArrayBuffer> {
        return this.window.crypto.subtle.digest(algorithm, data) as Promise<ArrayBuffer>;
    }
}
