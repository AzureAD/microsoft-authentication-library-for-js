/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { INetworkModule, Logger } from "@azure/msal-common";
import { jwtVerify, createRemoteJWKSet, JWTVerifyOptions, JWTPayload } from "jose";
import crypto from "crypto";
import { buildConfiguration, Configuration, TokenValidationConfiguration } from "../config/Configuration";
import { buildTokenValidationParameters, TokenValidationParameters, ValidationParameters } from "../config/TokenValidationParameters";
import { TokenValidationResponse } from "../response/TokenValidationResponse";
import { ValidationConfigurationError } from "../error/ValidationConfigurationError";
import { name, version } from "../packageMetadata";
import { OpenIdConfigProvider } from "../config/OpenIdConfigProvider";
import { ValidationError } from "../error/ValidationError";

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

        const validationParams: ValidationParameters = await buildTokenValidationParameters(options, this.config);
        this.logger.verbose("ValidationParams built");
            
        const jwks = await this.getJWKS(validationParams);

        const jwtVerifyParams: JWTVerifyOptions = {
            algorithms: validationParams.validAlgorithms,
            issuer: validationParams.validIssuers,
            audience: validationParams.validAudiences,
            subject: validationParams.subject
            // Figure out types here
        };

        const { payload, protectedHeader } = await jwtVerify(token, jwks, jwtVerifyParams);

        this.validateClaims(payload, validationParams);

        return {
            protectedHeader,
            payload
        };
    }
    
    async getJWKS(validationParams: ValidationParameters): Promise<any> {
        this.logger.verbose("getJWKS called");
        
        // Prioritize keystore or jwksUri if provided
        if (validationParams.issuerSigningKeys) {
            this.logger.verbose("JweKeyStore provided");
            return validationParams.issuerSigningKeys;
        } 
        
        if (validationParams.issuerSigningJwksUri) {
            this.logger.verbose("JwksUri provided");
            return createRemoteJWKSet(new URL(validationParams.issuerSigningJwksUri));
        }

        // Do resiliency well-known endpoint thing here
        const retrievedJwksUri: string = await this.openIdConfigProvider.fetchJwksUriFromEndpoint();
        this.logger.verbose("Creating Jwks from default");
        return createRemoteJWKSet(new URL(retrievedJwksUri));
    
    }
 
    async validateClaims(payload: JWTPayload, validationParams: ValidationParameters): Promise<void> {
        this.logger.verbose("validateClaims called");

        // Validate nonce
        if (payload.nonce) {
            if (!validationParams.nonce) {
                this.logger.verbose("Nonce detected on token, but nonce not set in validationParams");
            } else if (validationParams.nonce === payload.nonce) {
                this.logger.verbose("Nonce validated");
            } else {
                throw ValidationError.createInvalidNonceError();
            }
        }

        // Validate c_hash
        if (payload.c_hash && typeof payload.c_hash === "string") {
            this.logger.verbose("Validating c_hash");

            if (!validationParams.code) {
                this.logger.verbose("C_hash present on token but code not set in validationParams. Unable to validate c_hash");
            } else {
                const hashResult = await this.checkHashValue(validationParams.code, payload.c_hash);
                if (!hashResult) {
                    throw ValidationError.createInvalidCHashError();
                }
            }
        }

        // Validate at_hash
        if (payload.at_hash && typeof payload.at_hash === "string") {
            this.logger.verbose("Validating at_hash");

            if (!validationParams.accessTokenForAtHash) {
                this.logger.verbose("At_hash present on token but access token not set in validationParams. Unable to validate at_hash");
            } else {
                const hashResult = await this.checkHashValue(validationParams.accessTokenForAtHash, payload.at_hash);
                if (!hashResult) {
                    throw ValidationError.createInvalidAtHashError();
                }
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
}
