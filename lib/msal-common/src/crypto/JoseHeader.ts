/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { JoseHeaderError } from "../error/JoseHeaderError";
import { JsonTypes } from "../utils/Constants";

export type JoseHeaderOptions = {
    typ?: JsonTypes;
    alg?: string;
    kid?: string;
};

/** @internal */
export class JoseHeader {
    public typ?: JsonTypes;
    public alg?: string;
    public kid?: string;

    constructor(options: JoseHeaderOptions) {
        this.typ = options.typ;
        this.alg = options.alg;
        this.kid = options.kid;
    }

    /**
     * Builds SignedHttpRequest formatted JOSE Header from the
     * JOSE Header options provided or previously set on the object and returns
     * the stringified header object.
     * Throws if keyId or algorithm aren't provided since they are required for Access Token Binding.
     * @param shrHeaderOptions
     * @returns
     */
    static getShrHeaderString(shrHeaderOptions: JoseHeaderOptions): string {
        // KeyID is required on the SHR header
        if (!shrHeaderOptions.kid) {
            throw JoseHeaderError.createMissingKidError();
        }

        // Alg is required on the SHR header
        if (!shrHeaderOptions.alg) {
            throw JoseHeaderError.createMissingAlgError();
        }

        const shrHeader = new JoseHeader({
            // Access Token PoP headers must have type pop, but the type header can be overriden for special cases
            typ: shrHeaderOptions.typ || JsonTypes.Pop,
            kid: shrHeaderOptions.kid,
            alg: shrHeaderOptions.alg,
        });

        return JSON.stringify(shrHeader);
    }
}
