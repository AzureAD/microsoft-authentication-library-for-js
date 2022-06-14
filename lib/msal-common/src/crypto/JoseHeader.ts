/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { JoseHeaderError } from "../error/JoseHeaderError";
import { JsonTypes } from "../utils/Constants";

/**
 * JOSE Header Parameter specification
 * https://datatracker.ietf.org/doc/html/rfc7516#section-4.1
 */
export type JoseHeaderOptions = {
    alg?: string,
    enc?: string,
    zip?: string,
    jku?: string,
    jwk?: string,
    kid?: string,
    x5u?: string,
    x5c?: string,
    x5t?: string,
    x5tS256?: string,
    typ?: JsonTypes,
    cty?: string,
    crit?: string,
    ctx?: string
};

export enum JoseClaims {
    ALG = "alg",
    KID = "kid",
    ENC = "enc"
}

export interface JweHeader extends JoseHeader {
    alg: string;
    enc: string;
}

export class JoseHeader {
    public alg?: string;
    public enc?: string;
    public zip?: string;
    public jku?: string;
    public jwk?: string;
    public kid?: string;
    public x5u?: string;
    public x5c?: string;
    public x5t?: string;
    public x5tS256?: string;
    public typ?: JsonTypes;
    public cty?: string;
    public crit?: string;
    public ctx?: string;

    constructor (options: JoseHeaderOptions) {
        Object.assign(this, options);
    }

    /**
     * Builds SignedHttpRequest formatted JOSE Header from the
     * JOSE Header options provided and returns the stringified header object.
     * Throws if keyId or algorithm aren't provided since they are required for Access Token Binding.
     * @param shrHeaderOptions 
     * @returns 
     */
    static getShrHeaderString(shrHeaderOptions: JoseHeaderOptions): string {
        // KeyID is required on the SHR header
        if (!shrHeaderOptions.kid) {
            throw JoseHeaderError.createMissingClaimError(JoseClaims.KID);
        }

        // Alg is required on the SHR header
        if (!shrHeaderOptions.alg) {
            throw JoseHeaderError.createMissingClaimError(JoseClaims.ALG);
        }

        const shrHeader = new JoseHeader({
            // Access Token PoP headers must have type JWT, but the type header can be overriden for special cases
            typ: shrHeaderOptions.typ || JsonTypes.Jwt,
            kid: shrHeaderOptions.kid,
            alg: shrHeaderOptions.alg
        });

        return JSON.stringify(shrHeader);
    }

    /**
     * Builds JWT formatted JOSE Header from the
     * JOSE Header options provided and returns the header object.
     * Throws if alg or enc claims aren't provided since they are required for Refresh Token Binding.
     * @param jweHeaderOptions
     * @returns 
     */
    static getJweHeader(jweHeaderOptions: JoseHeaderOptions): JweHeader {
        // KeyID is required on the SHR header
        if (!jweHeaderOptions.alg) {
            throw JoseHeaderError.createMissingClaimError(JoseClaims.ALG);
        }

        // Alg is required on the SHR header
        if (!jweHeaderOptions.enc) {
            throw JoseHeaderError.createMissingClaimError(JoseClaims.ENC);
        }

        return new JoseHeader(jweHeaderOptions) as JweHeader;
    }
}
