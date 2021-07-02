/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ISubtleCrypto } from "./ISubtleCrypto";

declare global {
    interface Window {
        msrCrypto: Crypto
    }
}

export class MsrBrowserCrypto implements ISubtleCrypto {
    getRandomValues(dataBuffer: Uint8Array): Uint8Array {
        return window.msrCrypto.getRandomValues(dataBuffer);
    }

    generateKey(algorithm: RsaHashedKeyGenParams, extractable: boolean, keyUsages: KeyUsage[]): Promise<CryptoKeyPair> {
        return window.msrCrypto.subtle.generateKey(algorithm, extractable, keyUsages);
    }

    exportKey(format: string, key: CryptoKey): Promise<JsonWebKey> {
        return window.msrCrypto.subtle.exportKey(format, key) as Promise<JsonWebKey>;
    }

    importKey(format: string, keyData: JsonWebKey, algorithm: RsaHashedImportParams, extractable: boolean, keyUsages: KeyUsage[]): Promise<CryptoKey> {
        return window.msrCrypto.subtle.importKey(format, keyData, algorithm, extractable, keyUsages);
    }

    sign(algorithm: AlgorithmIdentifier, key: CryptoKey, data: ArrayBuffer): Promise<ArrayBuffer> {
        return window.msrCrypto.subtle.sign(algorithm, key, data);
    }

    digest(algorithm: AlgorithmIdentifier, data: Uint8Array): Promise<ArrayBuffer> {
        return window.msrCrypto.subtle.digest(algorithm, data);
    }
}
