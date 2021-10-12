/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Configuration } from "../config/Configuration";
import { TokenValidationParameters } from "../config/TokenValidationParameters";
import { TokenValidationResponse } from "../response/TokenValidationResponse";

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
            throw "Can't call this without params";
        }

        return {
            isValid: false
        };
    }
}
