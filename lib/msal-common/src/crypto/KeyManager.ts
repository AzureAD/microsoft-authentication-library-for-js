/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger } from "../logger/Logger";
import { ICrypto } from "./ICrypto";

export class KeyManager {
    private cryptoUtils: ICrypto;
    private logger: Logger;

    constructor(cryptoUtils: ICrypto, logger: Logger) {
        this.cryptoUtils = cryptoUtils;
        this.logger = logger;
    }

    /**
     * Returns the public key from an asymmetric key pair stored in IndexedDB based on the
     * public key thumbprint parameter
     * @param keyThumbprint 
     * @returns Public Key JWK string
     */
    async retrieveAsymmetricPublicKey(keyThumbprint: string): Promise<string> {
        return await this.cryptoUtils.getAsymmetricPublicKey(keyThumbprint);
    }
}