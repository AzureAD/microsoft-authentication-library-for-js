/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    JoseHeaderErrorCodes,
    createJoseHeaderError,
} from "../error/JoseHeaderError.js";
import { isPlainObject } from "../utils/ObjectUtils.js";
import { JsonWebTokenTypes } from "../utils/Constants.js";
import type { PublicJsonWebKey } from "./PublicJsonWebKey.js";

export type JoseHeaderOptions = {
    typ?: JsonWebTokenTypes;
    alg?: string;
    kid?: string;
    jwk?: PublicJsonWebKey;
};

/** @internal */
export class JoseHeader {
    public typ?: JsonWebTokenTypes;
    public alg: string;
    public kid?: string;
    public jwk?: PublicJsonWebKey;

    constructor(
        options: JoseHeaderOptions & { alg: string },
        correlationId: string
    ) {
        if (typeof options.alg !== "string" || !options.alg) {
            throw createJoseHeaderError(
                JoseHeaderErrorCodes.missingAlgError,
                correlationId
            );
        }

        this.typ = options.typ;
        this.alg = options.alg;
        this.kid = options.kid;
        this.jwk = options.jwk;
    }

    /**
     * Builds SignedHttpRequest formatted JOSE Header from the
     * JOSE Header options provided or previously set on the object.
     * Throws if keyId or algorithm aren't provided since they are required for Access Token Binding.
     * @param shrHeaderOptions
     * @param correlationId
     * @returns
     */
    static getShrHeader(
        shrHeaderOptions: JoseHeaderOptions,
        correlationId: string
    ): JoseHeader {
        // KeyID is required on the SHR header
        if (!shrHeaderOptions.kid) {
            throw createJoseHeaderError(
                JoseHeaderErrorCodes.missingKidError,
                correlationId
            );
        }

        // Alg is required on the SHR header
        if (!shrHeaderOptions.alg) {
            throw createJoseHeaderError(
                JoseHeaderErrorCodes.missingAlgError,
                correlationId
            );
        }

        return new JoseHeader(
            {
                // Access Token PoP headers must have type pop, but the type header can be overriden for special cases
                typ: shrHeaderOptions.typ || JsonWebTokenTypes.Pop,
                kid: shrHeaderOptions.kid,
                alg: shrHeaderOptions.alg,
            },
            correlationId
        );
    }

    /**
     * Builds a DPoP formatted JOSE Header from the JOSE Header options provided.
     * Throws if public JWK or algorithm aren't provided since they are required for DPoP.
     * @param dpopHeaderOptions
     * @param correlationId
     * @returns
     */
    static getDpopHeader(
        dpopHeaderOptions: JoseHeaderOptions,
        correlationId: string
    ): JoseHeader {
        if (!isPlainObject(dpopHeaderOptions.jwk)) {
            throw createJoseHeaderError(
                JoseHeaderErrorCodes.missingJwkError,
                correlationId
            );
        }

        if (!dpopHeaderOptions.alg) {
            throw createJoseHeaderError(
                JoseHeaderErrorCodes.missingAlgError,
                correlationId
            );
        }

        if (Object.keys(dpopHeaderOptions.jwk).length === 0) {
            throw createJoseHeaderError(
                JoseHeaderErrorCodes.invalidJwkError,
                correlationId
            );
        }

        return new JoseHeader(
            {
                typ: JsonWebTokenTypes.Dpop,
                alg: dpopHeaderOptions.alg,
                jwk: dpopHeaderOptions.jwk,
            },
            correlationId
        );
    }
}
