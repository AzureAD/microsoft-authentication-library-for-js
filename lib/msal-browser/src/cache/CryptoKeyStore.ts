/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AsyncMemoryStorage } from "./AsyncMemoryStorage";

export type CachedKeyPair = {
    publicKey: CryptoKey,
    privateKey: CryptoKey,
    requestMethod?: string,
    requestUri?: string
};

export enum CryptoKeyStoreNames {
    asymmetricKeys = "asymmetricKeys",
    symmetricKeys = "symmetricKeys"
}

/**
 * MSAL CryptoKeyStore DB Version 2
 */
export type CryptoKeyStore = {
    asymmetricKeys: AsyncMemoryStorage<CachedKeyPair>;
    symmetricKeys: AsyncMemoryStorage<CryptoKey>;
};
