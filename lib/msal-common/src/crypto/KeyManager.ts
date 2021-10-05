/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CryptoKeyTypes } from "../utils/Constants";
import { ICrypto, SignedHttpRequestParameters } from "./ICrypto";

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

    async generateCnf(request: SignedHttpRequestParameters): Promise<string> {
        const reqCnf = await this.generateKid(request, CryptoKeyTypes.req_cnf);
        return this.cryptoUtils.base64Encode(JSON.stringify(reqCnf));
    }

    async generateKid(request: SignedHttpRequestParameters, keyType: CryptoKeyTypes): Promise<ReqCnf> {
        const kidThumbprint = await this.cryptoUtils.getPublicKeyThumbprint(request, keyType);

        return {
            kid: kidThumbprint,
            xms_ksl: KeyLocation.SW
        };
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
