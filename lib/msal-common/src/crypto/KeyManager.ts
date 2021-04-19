/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BaseAuthRequest } from "../request/BaseAuthRequest";
import { CryptoKeyTypes } from "../utils/Constants";
import { ICrypto } from "./ICrypto";

/**
 * See eSTS docs for more info.
 * - A kid element, with the value containing an RFC 7638-compliant JWK thumbprint that is base64 encoded.
 * -  xms_ksl element, representing the storage location of the key's secret component on the client device. One of two values:
 *      - sw: software storage
 *      - uhw: hardware storage
 */
 type ReqCnf = {
    kid: string;
    xms_ksl: KeyLocation;
};

enum KeyLocation {
    SW = "sw",
    UHW = "uhw"
}

export class KeyManager {
    private cryptoUtils: ICrypto;

    constructor(cryptoUtils: ICrypto) {
        this.cryptoUtils = cryptoUtils;
    }

    /**
     * Generates an asymmetric crypto keypair and returns the base64 encoded stringified
     * req_cnf parameter from the public key's thumbprint
     * @param request 
     * @returns Public Key JWK string
     */
    async generateCnf(request: BaseAuthRequest): Promise<string> {
        const kidThumbprint = await this.cryptoUtils.getPublicKeyThumbprint(request, CryptoKeyTypes.req_cnf);
        const reqCnf: ReqCnf = {
            kid: kidThumbprint,
            xms_ksl: KeyLocation.SW
        };
        return this.cryptoUtils.base64Encode(JSON.stringify(reqCnf));
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