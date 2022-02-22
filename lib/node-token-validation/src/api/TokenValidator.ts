/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { INetworkModule, Logger } from "@azure/msal-common";
import { jwtVerify, createLocalJWKSet, createRemoteJWKSet, JWTVerifyOptions, JWTPayload } from "jose";
import crypto from "crypto";
import { buildConfiguration, Configuration, TokenValidationConfiguration } from "../config/Configuration";
import { buildTokenValidationParameters, TokenValidationParameters, BaseValidationParameters } from "../config/TokenValidationParameters";
import { TokenValidationResponse } from "../response/TokenValidationResponse";
import { ValidationConfigurationError } from "../error/ValidationConfigurationError";
import { name, version } from "../packageMetadata";
import { OpenIdConfigProvider } from "../config/OpenIdConfigProvider";
import { ValidationError } from "../error/ValidationError";

/**
 * The TokenValidator class is the object exposed by the library to perform token validation.
 */
export class TokenValidator {

    // Input configuration
    private config: TokenValidationConfiguration;

    // Logger object
    protected logger: Logger;

    // Network interface implementation
    protected networkInterface: INetworkModule;

    // OpenIdConfig Provider implementation
    protected openIdConfigProvider: OpenIdConfigProvider;

    /**
     * Constructor for the TokenValidator class
     * @param configuration Object for the TokenValidator instance
     */
    constructor(configuration: Configuration) {
        // Set the configuration
        this.config = buildConfiguration(configuration);

        // Initialize logger
        this.logger = new Logger(this.config.system.loggerOptions, name, version);

        // Initialize network client
        this.networkInterface = this.config.system.networkClient,

        // Initialize OpenId configuration provider
        this.openIdConfigProvider = new OpenIdConfigProvider(this.config, this.networkInterface, this.logger);
    }

    /**
     * Base function that validates tokens against options provided.
     * @param token JWT token to be validated
     * @param {@link (TokenValidationParameters:type)}
     * @returns {Promise.<TokenValidationResponse>}
     */
    async validateToken(token: string, options: TokenValidationParameters): Promise<TokenValidationResponse> {
        this.logger.trace("TokenValidator.validateToken called");
        
        if (!token || token.length < 1) {
            throw ValidationConfigurationError.createMissingTokenError();
        }

        // Sets defaults for validation params
        const validationParams: BaseValidationParameters = await buildTokenValidationParameters(options);
        this.logger.verbose("TokenValidator - ValidationParams built");
        
        // Sets JWKS to be used in jwtVerify
        const jwks = await this.getJWKS(validationParams);

        // Sets JWT verify options to be used in jwtVerify
        const jwtVerifyParams: JWTVerifyOptions = {
            algorithms: validationParams.validAlgorithms,
            issuer: this.setIssuerParams(validationParams),
            audience: this.setAudienceParams(validationParams),
            subject: validationParams.subject,
            typ: validationParams.validTypes[0]
        };

        // Verifies using JOSE's jwtVerify function. Returns payload and header
        const { payload, protectedHeader } = await jwtVerify(token, jwks, jwtVerifyParams);

        // Validates additional claims not verified by jwtVerify
        this.validateClaims(payload, validationParams);

        // Returns TokenValidationResponse
        return {
            protectedHeader,
            payload,
            token,
            tokenType: validationParams.validTypes[0]
        };
    }
    
    /**
     * Function to return JWKS (JSON Web Key Set) from parameters provided, jwks_uri provided, or from well-known endpoint
     * @param {@link (BaseValidationParameters:type)}
     * @returns 
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async getJWKS(validationParams: BaseValidationParameters): Promise<any> {
        this.logger.trace("TokenValidator.getJWKS called");
        
        // Prioritize keystore or jwksUri if provided
        if (validationParams.issuerSigningKeys) {
            this.logger.verbose("TokenValidator - issuerSigningKeys provided");
            return createLocalJWKSet({
                keys: validationParams.issuerSigningKeys
            });
        } 
        
        if (validationParams.issuerSigningJwksUri) {
            this.logger.verbose("TokenValidator - Creating JWKS from JwksUri");
            return createRemoteJWKSet(new URL(validationParams.issuerSigningJwksUri));
        }

        // Do resiliency well-known endpoint thing here
        const retrievedJwksUri: string = await this.openIdConfigProvider.fetchJwksUriFromEndpoint();
        this.logger.verbose("TokenValidator - Creating JWKS from default");
        return createRemoteJWKSet(new URL(retrievedJwksUri));
    }

    /**
     * Function to check that validIssuers parameter is not an empty array. Throws emptyIssuerError if empty.
     * @param {@link (BaseValidationParameters:type)}
     * @returns 
     */
    setIssuerParams(options: BaseValidationParameters): string[] {
        this.logger.trace("TokenValidator.setIssuerParams called");

        // Check that validIssuers is not empty
        if (options.validIssuers.length < 1 || options.validIssuers[0].length < 1) {
            throw ValidationConfigurationError.createEmptyIssuerError();
        }

        return options.validIssuers;
    }

    /**
     * Function to check that validAudiences parameter is not an empty array. Throws emptyAudience error if empty.
     * @param {@link (BaseValidationParameters:type)} 
     * @returns 
     */
    setAudienceParams(options: BaseValidationParameters): string[] {
        this.logger.trace("TokenValidator.setAudienceParams called");

        // Check that validAudiences is not empty
        if (options.validAudiences.length < 1 || options.validAudiences[0].length < 1) {
            throw ValidationConfigurationError.createEmptyAudienceError();
        }

        return options.validAudiences;
    }
 
    /**
     * Function to validate additional claims on token, including nonce, c_hash, and at_hash. No return, throws error if invalid.
     * @param payload JWT payload
     * @param {@link (BaseValidationParameters:type)} 
     */
    async validateClaims(payload: JWTPayload, validationParams: BaseValidationParameters): Promise<void> {
        this.logger.trace("TokenValidator.validateClaims called");

        // Validate nonce
        if (payload.nonce) {
            if (!validationParams.nonce) {
                throw ValidationConfigurationError.createMissingNonceError();
            } else if (validationParams.nonce === payload.nonce) {
                this.logger.verbose("Nonce validated");
            } else {
                throw ValidationError.createInvalidNonceError();
            }
        }

        // Validate c_hash
        if (payload.c_hash && typeof payload.c_hash === "string") {
            this.logger.trace("TokenValidator - Validating c_hash");

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
            this.logger.trace("TokenValidator - Validating at_hash");

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

    /**
     * Function to check hash per OIDC spec, section 3.3.2.11 https://openid.net/specs/openid-connect-core-1_0.html#HybridTokenValidation
     * @param content 
     * @param hashProvided 
     * @returns 
     */
    async checkHashValue(content: string, hashProvided: string): Promise<Boolean> {
        this.logger.trace("TokenValidator.checkHashValue called");

        // 1. Hash the content (either code for c_hash, or token for at_hash) and save as buffer
        const digest = crypto.createHash("sha256").update(content, "ascii").digest();

        // 2. Only take left half of buffer, per OIDC spec
        const buffer = digest.slice(0, digest.length/2);

        // 3. Base64Url encode the buffer to get the hash
        const encodedHash = buffer.toString("base64url");

        return (hashProvided === encodedHash);
    }
}
