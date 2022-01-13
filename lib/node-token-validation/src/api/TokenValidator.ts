/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError, INetworkModule, Logger, ScopeSet } from "@azure/msal-common";
import { jwtVerify, createRemoteJWKSet, JWTVerifyOptions, JWTPayload } from "jose";
import crypto from "crypto";
import { buildConfiguration, Configuration, TokenValidationConfiguration } from "../config/Configuration";
import { buildTokenValidationParameters, TokenValidationParameters } from "../config/TokenValidationParameters";
import { TokenValidationResponse } from "../response/TokenValidationResponse";
import { ValidationConfigurationError } from "../error/ValidationConfigurationError";
import { name, version } from "../packageMetadata";
import { OpenIdConfigProvider } from "../config/OpenIdConfigProvider";


export class TokenValidator {
    private config: TokenValidationConfiguration;
    protected logger: Logger;
    protected networkInterface: INetworkModule;
    protected openIdConfigProvider: OpenIdConfigProvider;

    constructor(configuration: Configuration) {
        this.config = buildConfiguration(configuration);
        this.logger = new Logger(this.config.system.loggerOptions, name, version);
        this.networkInterface = this.config.system.networkClient,
        this.openIdConfigProvider = new OpenIdConfigProvider(this.config.auth.authority, this.networkInterface, this.logger);
    }

    async validateToken(token: string, options: TokenValidationParameters): Promise<TokenValidationResponse> {
        this.logger.verbose("validateToken called");
        
        if (!token) {
            throw ValidationConfigurationError.createMissingTokenError();
        }

        const validationParams = await buildTokenValidationParameters(options);
        this.logger.verbose("ValidationParams built");

        const jwtVerifyParams: JWTVerifyOptions = {
            algorithms: validationParams.algorithm,
            issuer: validationParams.issuer,
            audience: validationParams.audience,
            subject: validationParams.subject
        };

        const jwks = await this.getJweKeyStore(validationParams);

        const { payload, protectedHeader } = await jwtVerify(token, jwks, jwtVerifyParams);

        this.validateClaims(payload, validationParams);

        return {
            protectedHeader,
            payload
        };
    }

    async getJweKeyStore(validationParams: TokenValidationParameters): Promise<any> {
        this.logger.verbose("getJweKeyStore called");
        
        // Prioritize keystore or jwksUri if provided
        if (validationParams.jweKeyStore) {
            this.logger.verbose("JweKeyStore provided");
            return validationParams.jweKeyStore;
        } 
        
        if (validationParams.jwksUri) {
            this.logger.verbose("JwksUri provided");
            return createRemoteJWKSet(new URL(validationParams.jwksUri));
        }

        // Do resiliency well-known endpoint thing here
        const retrievedJwksUri: string = await this.openIdConfigProvider.fetchJwksUriFromEndpoint();
        this.logger.verbose("Creating Jwks from default");
        return createRemoteJWKSet(new URL(retrievedJwksUri));
    
    }

    async validateClaims(payload: JWTPayload, validationParams: TokenValidationParameters): Promise<void> {
        this.logger.verbose("validateClaims called");

        // Validate B2C policy
        if (payload.tfp || payload.acr) {
            this.logger.verbose("Validating B2C policy");
            if (!this.config.auth.policyName) {
                this.logger.verbose("B2C token detected but no policy set, cannot validate B2C policy on token");
            } else {
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
                    throw ValidationConfigurationError.createInvalidPolicyError();
                }
            }
        } else if(!payload.tfp && !payload.acr && this.config.auth.policyName) {
            this.logger.verbose("B2C policy set to be validated, but no B2C policy on token");
        }

        // Validate nonce
        if (payload.nonce) {
            if (!validationParams.nonce) {
                this.logger.verbose("Nonce detected on token, but nonce not set in validationParams");
            } else if (validationParams.nonce === payload.nonce) {
                this.logger.verbose("Nonce validated");
            } else {
                throw ValidationConfigurationError.createInvalidNonceError();
            }
        }

        // Validate c_hash
        if (payload.c_hash && typeof payload.c_hash === "string") {
            this.logger.verbose("Validating c_hash");
            if (validationParams.code) {
                if (!this.checkHashValue(validationParams.code, payload.c_hash)) {
                    throw ValidationConfigurationError.createInvalidCHashError();
                }
            }
        }

        // Validate at_hash
        if (payload.at_hash && typeof payload.at_hash === "string") {
            this.logger.verbose("Validating at_hash");
            if (validationParams.accessToken) {
                if (!this.checkHashValue(validationParams.accessToken, payload.at_hash)) {
                    throw ValidationConfigurationError.createInvalidAtHashError();
                }
            }
        }

        // Validate scopes
        if (payload.scp) {
            if (typeof payload.scp === 'string' || Array.isArray(payload.scp)) {
                const scopesAreValid = await this.validateScopes(payload.scp, validationParams);
                
                if (!scopesAreValid) {
                    throw ValidationConfigurationError.createInvalidScopesError();
                }
            } else {
                throw new AuthError("Invalid token scopes");
            }
        }
    }

    async checkHashValue(content: string, hashProvided: string): Promise<Boolean> {
        this.logger.verbose("checkHashValue called");

        // 1. Hash the content (either code for c_hash, or token for at_hash) and save as buffer
        const digest = crypto.createHash("sha256").update(content, "ascii").digest();

        // 2. Only take first half of buffer
        const buffer = digest.slice(0, digest.length/2); // End not inclusive? +1?

        // 3. Base64Url encode the buffer to get the hash
        const encodedHash = buffer.toString("base64url");

        return (hashProvided === encodedHash);
    }

    async validateScopes(tokenScopes: string|Array<string>, validationParams: TokenValidationParameters): Promise<Boolean> {
        this.logger.verbose("validateScopes called");

        let paramScopeSet: ScopeSet;
        if (validationParams.scopes) {
            paramScopeSet = new ScopeSet(validationParams.scopes);
        } else {
            this.logger.verbose("Scopes on token but no scopes required to validate");
            return true;
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
