/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { KEY_FORMAT_JWK } from "../utils/BrowserConstants";
import { ISubtleCrypto } from "./ISubtleCrypto";

export class ModernBrowserCrypto implements ISubtleCrypto {
    getRandomValues(dataBuffer: Uint8Array): Uint8Array {
        return window.crypto.getRandomValues(dataBuffer);
    }

    async generateKey(algorithm: RsaHashedKeyGenParams, extractable: boolean, keyUsages: KeyUsage[]): Promise<CryptoKeyPair> {
        return window.crypto.subtle.generateKey(algorithm, extractable, keyUsages) as Promise<CryptoKeyPair>;
    }

    async exportKey(key: CryptoKey): Promise<JsonWebKey> {
        return window.crypto.subtle.exportKey(KEY_FORMAT_JWK, key) as Promise<JsonWebKey>;
    }

    async importKey(keyData: JsonWebKey, algorithm: RsaHashedImportParams, extractable: boolean, keyUsages: KeyUsage[]): Promise<CryptoKey> {
        return window.crypto.subtle.importKey(KEY_FORMAT_JWK, keyData, algorithm, extractable, keyUsages) as Promise<CryptoKey>;
    }

    async sign(algorithm: AlgorithmIdentifier, key: CryptoKey, data: ArrayBuffer): Promise<ArrayBuffer> {
        return window.crypto.subtle.sign(algorithm, key, data) as Promise<ArrayBuffer>;
    }

    async digest(algorithm: AlgorithmIdentifier, data: Uint8Array): Promise<ArrayBuffer> {
        return window.crypto.subtle.digest(algorithm, data) as Promise<ArrayBuffer>;
    }
}
