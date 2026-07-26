/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    JoseHeaderErrorCodes,
    createJoseHeaderError,
} from "../error/JoseHeaderError.js";
import { JsonWebTokenTypes } from "../utils/Constants.js";

export type JoseHeaderOptions = {
    typ?: JsonWebTokenTypes;
    alg?: string;
    kid?: string;
    jwk?: JsonWebKey;
};

/** @internal */
export class JoseHeader {
    public typ?: JsonWebTokenTypes;
    public alg: string;
    public kid?: string;
    public jwk?: JsonWebKey;

    constructor(options: JoseHeaderOptions & { alg: string }) {
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
        correlationId: string = ""
    ): JoseHeader {
        // KeyID is required on the SHR header
        if (typeof shrHeaderOptions.kid !== "string" || !shrHeaderOptions.kid) {
            throw createJoseHeaderError(
                JoseHeaderErrorCodes.missingKidError,
                correlationId
            );
        }

        // Alg is required on the SHR header
        if (typeof shrHeaderOptions.alg !== "string" || !shrHeaderOptions.alg) {
            throw createJoseHeaderError(
                JoseHeaderErrorCodes.missingAlgError,
                correlationId
            );
        }

        return new JoseHeader({
            // Access Token PoP headers must have type pop, but the type header can be overriden for special cases
            typ: shrHeaderOptions.typ || JsonWebTokenTypes.Pop,
            kid: shrHeaderOptions.kid,
            alg: shrHeaderOptions.alg,
        });
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
        correlationId: string = ""
    ): JoseHeader {
        if (!isRecord(dpopHeaderOptions.jwk)) {
            throw createJoseHeaderError(
                JoseHeaderErrorCodes.missingJwkError,
                correlationId
            );
        }

        if (
            typeof dpopHeaderOptions.alg !== "string" ||
            !dpopHeaderOptions.alg
        ) {
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

        return new JoseHeader({
            typ: JsonWebTokenTypes.Dpop,
            alg: dpopHeaderOptions.alg,
            jwk: dpopHeaderOptions.jwk,
        });
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}
