/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Configuration } from "../config/Configuration";
import { TokenValidationParameters } from "../config/TokenValidationParameters";
import { TokenValidationResponse } from "../response/TokenValidationResponse";
import { jwtVerify, createRemoteJWKSet, JWTVerifyOptions } from "jose";

export class TokenValidator {
    private config: Configuration;

    constructor(configuration: Configuration) {
        this.config = configuration;
    }
    
    /**
     * 
     * @param rawTokenString 
     */
    async validateToken(validationParams: TokenValidationParameters): Promise<TokenValidationResponse> {
        if (!validationParams && !this.config) {
            throw "Can't call this without params or config";
        }
        const jwtVerifyParams: JWTVerifyOptions = {};

        if (validationParams.issuer) { 
            jwtVerifyParams.issuer = validationParams.issuer;
        } else {
            throw new Error("Need issuer");
        }

        if (validationParams.audience) { 
            jwtVerifyParams.audience = validationParams.audience;
        } 

        const jwks = createRemoteJWKSet(new URL("https://login.microsoftonline.com/common/discovery/v2.0/keys"));
        const { payload, protectedHeader } = await jwtVerify(validationParams.rawTokenString, jwks, jwtVerifyParams);

        return {
            isValid: false,
            protectedHeader,
            payload
        };
    }
}
