/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError, Logger, ScopeSet } from "@azure/msal-common";
import { jwtVerify, createRemoteJWKSet, JWTVerifyOptions, JWTPayload } from "jose";
import crypto from "crypto";
import { buildConfiguration, Configuration, TokenValidationConfiguration } from "../config/Configuration";
import { buildTokenValidationParameters, TokenValidationParameters } from "../config/TokenValidationParameters";
import { TokenValidationResponse } from "../response/TokenValidationResponse";
import { Constants } from "../utils/Constants";
import { name, version } from "../packageMetadata";

export class TokenValidator {
    private config: TokenValidationConfiguration;
    protected logger: Logger;

    constructor(configuration: Configuration) {
        this.config = buildConfiguration(configuration);
        this.logger = new Logger(this.config.system.loggerOptions, name, version);
    }

    async validateToken(options: TokenValidationParameters): Promise<TokenValidationResponse> {
        this.logger.info("validateToken called");

        const validationParams = await buildTokenValidationParameters(options);

        const jwtVerifyParams: JWTVerifyOptions = {
            algorithms: validationParams.algorithm,
            issuer: validationParams.issuer,
            audience: validationParams.audience,
            subject: validationParams.subject
        };

        const jwks = await this.getJweKeyStore(validationParams);

        const { payload, protectedHeader } = await jwtVerify(validationParams.rawTokenString, jwks, jwtVerifyParams);

        this.validateIdTokenClaims(payload, validationParams);
        this.validateAccessTokenClaims(payload, validationParams);

        return {
            isValid: false,
            protectedHeader,
            payload
        };
    }

    async getJweKeyStore(validationParams: TokenValidationParameters): Promise<any> {
        let jwks; 

        // Do resiliency well-known endpoint thing here

        // Choose either jweKeyStore or jwksUri
        if (validationParams.jweKeyStore) {
            this.logger.info("JweKeyStore provided");
            jwks = validationParams.jweKeyStore;
        } else if (validationParams.jwksUri) {
            this.logger.info("JwksUri provided");
            jwks = createRemoteJWKSet(new URL(validationParams.jwksUri));
        } else {
            this.logger.info("Creating Jwks from default");
            jwks = createRemoteJWKSet(new URL(Constants.DEFAULT_JWKS_URI));
        }

        return jwks;
    }

    async validateIdTokenClaims(payload: JWTPayload, validationParams: TokenValidationParameters): Promise<void> {
        // Validate B2C policy
        if (payload.tfp || payload.acr) {
            if (!this.config.auth.policyName) {
                throw new AuthError("B2C token detected but no policy set, cannot validate B2C policy");
            }

            let tokenPolicy: string;

            if (payload.tfp && typeof payload.tfp === "string") {
                tokenPolicy = payload.tfp.toLowerCase();
            } else if (payload.acr && typeof payload.acr === "string") {
                tokenPolicy = payload.acr.toLowerCase();
            } else {
                throw new AuthError("Invalid B2C policy type on token");
            }

            if (this.config.auth.policyName.toLowerCase() === tokenPolicy) {
                this.logger.verbose("Validated B2C policy");
            } else {
                throw new AuthError("B2C policy on token cannot be validated with policy provided in config");
            }
        }

        // Validate nonce
        if (payload.nonce) {
            if (!validationParams.nonce) {
                this.logger.info("Nonce detected on token, but nonce not set in validationParams");
            }
            
            if (validationParams.nonce === payload.nonce) {
                this.logger.info("Validated nonce");
            } else {
                throw new AuthError("Invalid nonce");
            }
        }

        // Validate c_hash
        if (payload.c_hash && typeof payload.c_hash === "string") {
            if (validationParams.code) {
                if (!this.checkHashValue(validationParams.code, payload.c_hash)) {
                    throw new AuthError("Invalid c_hash");
                }
            }
        }

        // Validate at_hash
        if (payload.at_hash && typeof payload.at_hash === "string") {
            if (validationParams.accessToken) {
                if (!this.checkHashValue(validationParams.accessToken, payload.at_hash)) {
                    throw new AuthError("Invalid at_hash");
                }
            }
        }
    }

    async validateAccessTokenClaims(payload: JWTPayload, validationParams: TokenValidationParameters): Promise<void> {
        // Validate scopes
        if (payload.scp) {
            if (typeof payload.scp === 'string' || Array.isArray(payload.scp)) {
                const scopesAreValid = await this.validateScopes(payload.scp, validationParams);
                
                if (!scopesAreValid) {
                    throw new AuthError("Token does not contain valid scopes"); // Error here? Or just no valid scopes?
                }
            } else {
                throw new AuthError("Invalid token scopes");
            }
        }
    }

    async checkHashValue(content: string, hashProvided: string): Promise<Boolean> {
        // 1. Hash the content (either code for c_hash, or token for at_hash) and save as buffer
        const digest = crypto.createHash("sha256").update(content, "ascii").digest();

        // 2. Only take first half of buffer
        const buffer = digest.slice(0, digest.length/2); // End not inclusive? +1?

        // 3. Base64Url encode the buffer to get the hash
        const encodedHash = buffer.toString("base64url");

        return (hashProvided === encodedHash);
    }

    async validateScopes(tokenScopes: string|Array<string>, validationParams: TokenValidationParameters): Promise<Boolean> {
        let paramScopeSet: ScopeSet;
        if (validationParams.scopes) {
            paramScopeSet = new ScopeSet(validationParams.scopes);
        } else {
            this.logger.verbose("Scopes on token but no scopes required to validate");
            return false; // TODO: True or false here?
        }

        const tokenScopeSet = typeof tokenScopes === 'string' ? ScopeSet.fromString(tokenScopes) : new ScopeSet(tokenScopes);

        if (validationParams.tokenMustContainScopes && paramScopeSet) {
            // Must set flag to true for token to fully contain scopes
            return tokenScopeSet.containsScopeSet(paramScopeSet);
        } else {
            // Default is intersect
            return tokenScopeSet.intersectingScopeSets(paramScopeSet);
        }
    }
}
