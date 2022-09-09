/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger } from "@azure/msal-common";
import { CachedKeyPair } from "../crypto/CryptoOps";
import { AsyncMemoryStorage } from "./AsyncMemoryStorage";

export enum CryptoKeyStoreNames {
    asymmetricKeys = "asymmetricKeys",
    symmetricKeys = "symmetricKeys"
}
/**
 * MSAL CryptoKeyStore DB Version 2
 */
export class CryptoKeyStore {
    public asymmetricKeys: AsyncMemoryStorage<CachedKeyPair>;
    public symmetricKeys: AsyncMemoryStorage<CryptoKey>;
    public logger: Logger;

    constructor(logger: Logger){
        this.logger = logger;
        this.asymmetricKeys = new AsyncMemoryStorage<CachedKeyPair>(this.logger, CryptoKeyStoreNames.asymmetricKeys);
        this.symmetricKeys = new AsyncMemoryStorage<CryptoKey>(this.logger, CryptoKeyStoreNames.symmetricKeys);
    }

    async clear(): Promise<boolean> {
        // Delete in-memory keystores
        this.asymmetricKeys.clearInMemory();
	    this.symmetricKeys.clearInMemory();
		
        /**
         * There is only one database, so calling clearPersistent on asymmetric keystore takes care of
         * every persistent keystore
         */
        try {
            await this.asymmetricKeys.clearPersistent();
            return true;
        } catch (e) {
            if (e instanceof Error) {
                this.logger.error(`Clearing keystore failed with error: ${e.message}`);
            } else {
                this.logger.error("Clearing keystore failed with unknown error");
            }
            
            return false;
        }
    }
}
