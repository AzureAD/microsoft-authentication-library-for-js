/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ISubtleCrypto } from "./ISubtleCrypto";

export class ModernBrowserCrypto implements ISubtleCrypto {
    getRandomValues(dataBuffer: Uint8Array): Uint8Array {
        return window.crypto.getRandomValues(dataBuffer);
    }

    generateKey(algorithm: RsaHashedKeyGenParams, extractable: boolean, keyUsages: KeyUsage[]): Promise<CryptoKeyPair> {
        return window.crypto.subtle.generateKey(algorithm, extractable, keyUsages);
    }

    exportKey(format: string, key: CryptoKey): Promise<JsonWebKey> {
        return window.crypto.subtle.exportKey(format, key) as Promise<JsonWebKey>;
    }

    importKey(format: string, keyData: JsonWebKey, algorithm: RsaHashedImportParams, extractable: boolean, keyUsages: KeyUsage[]): Promise<CryptoKey> {
        return window.crypto.subtle.importKey(format, keyData, algorithm, extractable, keyUsages);
    }

    sign(algorithm: AlgorithmIdentifier, key: CryptoKey, data: ArrayBuffer): Promise<ArrayBuffer> {
        return window.crypto.subtle.sign(algorithm, key, data);
    }

    digest(algorithm: AlgorithmIdentifier, data: Uint8Array): Promise<ArrayBuffer> {
        return window.crypto.subtle.digest(algorithm, data);
    }
}
