/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CryptoOps } from "./CryptoOps";
import { PopTokenGenerator } from "@azure/msal-common";

export type TokenBindingPublicKeyOptions = {
    resourceRequestMethod: string,
    resourceRequestUri: string
};

export class TokenBinding {
    private popTokenGenerator: PopTokenGenerator;
    private cryptoOpts: CryptoOps;

    constructor() {
        this.cryptoOpts = new CryptoOps();
        this.popTokenGenerator = new PopTokenGenerator(this.cryptoOpts);
    }

    /**
     * Generates and caches a keypair for the given request options.
     * @param publicKeyOptions 
     * @returns Public key digest, which should be sent to the token issuer.
     */
    async generatePublicKey(publicKeyOptions?: TokenBindingPublicKeyOptions): Promise<string> {
        const resourceRequestMethod = publicKeyOptions?.resourceRequestMethod || "";
        const resourceRequestUri = publicKeyOptions?.resourceRequestUri || "";

        const { kid } = await this.popTokenGenerator.generateKid(resourceRequestMethod, resourceRequestUri);

        return kid;
    }

    /**
     * Generates a signed http request for the given payload with the given key.
     * @param payload Payload to sign (e.g. access token)
     * @param publicKey Public key digest (from generatePublicKey API)
     * @param publicKeyOptions 
     * @returns Pop token signed with the corresponding private key
     */
    async signPopToken(payload: string, publicKey: string, publicKeyOptions?: TokenBindingPublicKeyOptions): Promise<string> {
        const resourceRequestMethod = publicKeyOptions?.resourceRequestMethod || "";
        const resourceRequestUri = publicKeyOptions?.resourceRequestUri || "";
        
        return this.popTokenGenerator.signPayload(payload, publicKey, resourceRequestMethod, resourceRequestUri);
    }
}
