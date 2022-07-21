/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationResult, AuthenticationScheme, INetworkModule, Logger } from "@azure/msal-common";
import { jwtVerify, createLocalJWKSet, createRemoteJWKSet, JWTVerifyOptions, JWTPayload } from "jose";
import { buildConfiguration, Configuration, TokenValidationConfiguration } from "../config/Configuration";
import { OpenIdConfigProvider } from "../config/OpenIdConfigProvider";
import { buildTokenValidationParameters, TokenValidationParameters, BaseValidationParameters } from "../config/TokenValidationParameters";
import { ValidationConfigurationError } from "../error/ValidationConfigurationError";
import { ValidationError } from "../error/ValidationError";
import { ExpressNextFunction, ExpressRequest, ExpressResponse } from "../request/MiddlewareTypes";
import { TokenValidationResponse } from "../response/TokenValidationResponse";
import { TokenValidationMiddlewareResponse } from "../response/TokenValidationMiddlewareResponse";
import { name, version } from "../packageMetadata";
import crypto from "crypto";
import { NodeCacheManager } from "../cache/NodeCacheManager";
import { CryptoProvider } from "../crypto/CryptoProvider";
import { Constants } from "../utils/Constants";

/**
 * The TokenValidator class is the object exposed by the library to perform token validation.
 * Use the TokenValidator class if you wish to validate id or access tokens for your app. 
 * 
 * TokenValidator can be initialized as follows:
 * ```js
 * const nodeTokenValidation = require("@azure/node-token-validation");
 * const tokenValidator = new nodeTokenValidation.TokenValidator();
 * ```
 * 
 * Note that the TokenValidator may be initialized with optional configurations. When configurations are not provided, library defaults will be used. See {@link Configuration} for more details.
 * 
 * Once initialized, APIs for token validation are available for use. 
 */
export class TokenValidator {

    // Input configuration
    private config: TokenValidationConfiguration;

    // Logger object
    protected logger: Logger;

    // Network interface implementation
    protected networkInterface: INetworkModule;

    // Crypto Provider
    protected cryptoProvider: CryptoProvider;

    // Platform storage object
    protected storage: NodeCacheManager;

    // OpenIdConfig Provider implementation
    protected openIdConfigProvider: OpenIdConfigProvider;

    /**
     * Constructor for the TokenValidator class used to instantiate the TokenValidator object.
     * 
     * The Configuration object is optional, and default configuration options will be used when configurations are not passed in.
     *
     * @param {Configuration} configuration Optional configuration object
     */
    constructor(configuration?: Configuration) {
        // Build configurations from options passed in or defaults
        this.config = buildConfiguration(configuration);

        // Initialize logger
        this.logger = new Logger(this.config.system.loggerOptions, name, version);

        // Initialize crypto provider
        this.cryptoProvider = new CryptoProvider();

        // Initialize storage
        this.storage = new NodeCacheManager(this.logger, Constants.EMPTY_STRING, this.cryptoProvider);

        // Initialize network client
        this.networkInterface = this.config.system.networkClient,

        // Initialize OpenId configuration provider
        this.openIdConfigProvider = new OpenIdConfigProvider(this.config, this.networkInterface, this.storage, this.logger);
    }

    /**
     * Middleware-style function to validate token from request.
     * 
     * `validateTokenMiddleware` is an Express.js-style middleware function that validates a token on an Express network request. 
     * It can also optionally extract a token from the request session and add it to the authorization header before validating.
     * 
     * `validateTokenMiddleware` calls {@link validateTokenFromRequest} and {@link validateToken} to carry out token validation.
     * See {@link validateTokenFromRequest} for details on token extraction from a request header or body.
     * See {@link validateToken} for details on claims validated and errors thrown.
     * 
     * ### Parameters
     * 
     * `validateTokenMiddleware` takes in options in the form of {@link TokenValidationParameters}, which must be set for the token to be validated.
     * 
     * `validateTokenMiddleware` also takes in an optional `resource` string. This is the resource for which an access token should be extracted from req.sessions.protectedResources, and attached to the authorization header. 
     * 
     * ### Returns
     * 
     * `validateTokenMiddleware` returns a {@link TokenValidationMiddlewareResponse}, and will call next() when a token is found and successfully validated.
     * 
     * ### Usage example
     * 
     * See the below example for how to instantiate `TokenValidator` and use `validateTokenMiddleware`.
     * 
     * ```js
     * const validator = require('@azure/node-token-validation');
     * 
     * // Instantiate TokenValidator
     * const tokenValidator = new validator.TokenValidator();
     * 
     * // Set token validation parameters
     * const tokenValidationParams = {
     *      validIssuers: ['valid-issuer-here],
     *      validAudiences: ['valid-audience-here]
     * };
     * 
     * // Validate token
     * app.get('/myRoute', 
     *      // Write function or have some other way of putting token in req.session.protectedResources
     *      mainController.getToken('custom', appSettings, msalClient, cryptoProvider),
     *      // Use validateTokenMiddleware
     *      tokenValidator.validateTokenMiddleware(tokenValidationParams, 'custom'), 
     *      (req, res) => {
     *          // Call function with validated access token stored in req.session.protectedResources.custom
     *          res.status(200);  
     *      });
     * ```
     * 
     * A sample demonstrating this usage can also be found [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/node-token-validation-samples/express-sample).
     * 
     * ### Errors
     * 
     * The `next` function may be called with a missing token error for the following reasons:
     * 
     * - The resource provided is not a protectedResource in req.session. As the resource is not found, a token is unable to be found and added.
     * - The resource provided is found in req.session.protectedResource, but no access token was in the resource. 
     * 
     * You should ensure that a token is available in req.sessions.protectedResource[YOUR-RESOURCE] before calling validateTokenMiddleware again.
     * 
     * `validateTokenMiddleware` will also call next with any other errors that are thrown in {@link validateTokenFromRequest} and {@link validateToken}.
     * 
     * @param {TokenValidationParameters} options Options for validating token
     * @param {string} resource Optional resource to retrieve access token from session 
     * @returns {TokenValidationMiddlewareResponse} Returns a response specifically for middleware scenarios, and will call next() when a token is found and successfully validated.
     */
    validateTokenMiddleware(options: TokenValidationParameters, resource?: string): TokenValidationMiddlewareResponse {

        return (req: ExpressRequest, _res: ExpressResponse, next: ExpressNextFunction) => {

            // Adding access token to authorization header from session
            if (resource && req.session && req.session.protectedResources) {
                if (!req.session.protectedResources[resource]) {
                    const error = ValidationConfigurationError.createMissingTokenError(`Resource ${resource} is not a protectedResource in req session. No access token to add to headers.`);
                    next(error);
                } else {
                    const token = req.session.protectedResources[resource].accessToken;
                    if (!token) {
                        const error = ValidationConfigurationError.createMissingTokenError(`No access token for resource ${resource} in session. Unable to add to request headers.`);
                        next(error);
                    }
    
                    // Attach bearer token to authorization header
                    req.headers.authorization = `Bearer ${token}`;
                }
            }

            // Validating token from request
            this.validateTokenFromRequest(req, options)
                .then(() => {
                    next();
                })
                .catch((error) => {
                    next(error);
                });
        };
    }

    /**
     * Function to validate token from request object.
     * 
     * `validateTokenFromRequest` extracts the token from either the request authorization header or the request body, and calls {@link validateToken} to validate the token.
     * 
     * `validateTokenFromRequest` may be called directly or called by other TokenValidator APIs.
     * See {@link validateToken} for details on claims validated and errors thrown.
     * 
     * ### Parameters
     * 
     * `validateTokenFromRequest` takes in a request in the form of {@link ExpressRequest}, with headers, and optional body and sessions. The token to be validated should be present in either the authorization header or the request body.
     * 
     * It also takes in options in the form of {@link TokenValidationParameters}, which must be set for the token to be validated.
     * 
     * ### Usage example
     * 
     * The following code snippet demonstrates instantiating the TokenValidator and using `validateTokenFromRequest`.
     * 
     * ```js
     * const validator = require('@azure/node-token-validation');
     * 
     * // Instantiate TokenValidator
     * const tokenValidator = new validator.TokenValidator();
     * 
     * // Ensure token is present in request authorization header or body
     * const request = {
     *    // Your request here
     * };
     * 
     * // Set token validation parameters
     * const tokenValidationParams = {
     *    validIssuers: ['valid-issuer-here],
     *    validAudiences: ['valid-audience-here]
     * };
     * 
     * // Validate token
     * tokenValidator.validateTokenFromRequest(request, tokenValidationParams).then((response) => {
     *    // Use token validation response
     * }).catch((error) => {
     *    // Handle error here
     * });
     * ```
     * 
     * ### Response
     * 
     * If a token is successfully validated, `validateTokenFromRequest` will return a {@link TokenValidationResponse}.
     * 
     * ### Errors
     * 
     * `validateTokenFromRequest` may throw a Missing Token Error if a token is not found in the authorization header or request body. 
     * 
     * At this time, `validateTokenFromRequest` is only validating tokens from the authorization header with the authorization scheme of "Bearer".
     * Tokens extracted from the authorization header that are not "Bearer" tokens will be validated separately from the Node Token Validation library in the future.
     * 
     * @param {ExpressRequest} request Express-style request
     * @param {TokenValidationParameters} options Options for validating token
     * @returns {Promise.<TokenValidationResponse>} Returns a token validation response
     */
    async validateTokenFromRequest(request: ExpressRequest, options: TokenValidationParameters): Promise<TokenValidationResponse> {
        this.logger.trace("TokenValidator.validateTokenFromRequest called");

        // Validates token if found in authorization header
        if (request.headers && request.headers.authorization) {
            const [ scheme, token ] = request.headers.authorization.split(" ");
            
            // Validates token if authorization header is bearer
            if (scheme.toLowerCase() === AuthenticationScheme.BEARER.toLowerCase()) {
                this.logger.verbose("Bearer token extracted from request authorization headers");
                return this.validateToken(token, options);
            } else {
                this.logger.verbose("Request authorization headers does not include bearer token");
                // If not bearer, call CAE/EasyAuth/MISE solution here for more complex handling
            }
        } 
        
        // Validates token if found in request body
        if (request.body?.access_token) {
            this.logger.verbose("Token extracted from request body");
            return this.validateToken(request.body.access_token, options);
        }

        throw ValidationConfigurationError.createMissingTokenError("No tokens found in authorization header or body.");
    }

    /**
     * Function to validate tokens from msal-node token acquisition response.
     * 
     * `validateTokenFromResponse` is able to validate both the id token and the access token returned on an MSAL acquire token response and return an array of {@link TokenValidationResponse}.
     * `validateTokenFromResponse` currently only validates tokens if the `tokenType` on the response is 'Bearer'.
     * 
     * `validateTokenFromResponse` calls {@link validateToken} to perform token validation. See {@link validateToken} for details on claims validated and errors thrown.
     * 
     * ### Parameters
     * 
     * `validateTokenFromResponse` takes in a response in the form of an {@link AuthenticationResult}. 
     * This is the response from MSAL's acquire token APIs, and can be passed into `validateTokenFromResponse` directly.
     * 
     * It also takes in optional `idTokenOptions` or `accessTokenOptions` in the form of {@link TokenValidationParameters}. 
     * These are the parameters against which the id token or the access token from the response will be validated.
     * 
     * If options are not provided, but an id token or an access token is present in the response, validation will not occur, and a message indicating that the token was not validated will be logged. 
     * 
     * ### Usage example
     * 
     * See the below example for how to instantiate `TokenValidator` and use `validateTokenFromResponse`:
     * 
     * ```js
     * const validator = require('@azure/node-token-validation');
     * 
     * // Instantiate TokenValidator
     * const tokenValidator = new validator.TokenValidator();
     * 
     * // Additional steps are needed before this to acquire token using msal-node. Omitted for brevity. See full sample for details.
     * clientApplication.acquireTokenByCode(tokenRequest, authCodeResponse).then((response) => {
     * 
     *      // Set id token options
     *      const idTokenOptions = {
     *          validIssuers: ['valid-issuer-here],
     *          validAudiences: ['valid-audience-here],
     *          // Nonce should be validated against claims received from response
     *          nonce: response.idTokenClaims.nonce
     *      };
     * 
     *      // Validate token
     *      tokenValidator.validateTokenFromResponse(response, idTokenOptions).then((response) => {
     *           // Use token validation response
     *      }).catch((error) => {
     *           // Handle token validation errors here
     *      });
     *
     * }).catch((error) => {
     *      // Handle token acquisition errors here
     * });
     * ```
     * 
     * A sample demonstrating acquiring a token using msal-node and validating the response can be found [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/node-token-validation-samples/response-sample).
     * More information on how to acquire tokens using msal-node can be found [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-node).
     * 
     * ### Returns
     * 
     * `validateTokenFromResponse` returns an array of {@link TokenValidationResponse}, with separate responses for the id tokens and access tokens validated.
     * 
     * ### Errors
     * 
     * `validateTokenFromResponse` will currently throw an Invalid Authentication Scheme error if the `tokenType` on the response is not "Bearer". 
     * 
     * | Error         | Error code |
     * | ------------- | -----------|
     * | Invalid authorization scheme | `invalid_auth_scheme` |
     * 
     * The Node Token Validation library is currently only handling bearer tokens. 
     * Other types of tokens will be validated separately from the Node Token Validation library in the future.
     * 
     * @param {AuthenticationResult} response MSAL authentication result 
     * @param {TokenValidationParameters} idTokenOptions Options for validating id token from response
     * @param {TokenValidationParameters} accessTokenOptions Options for validating access token from response
     * @returns {Promise.<TokenValidationResponse[]>} Array of token validation responses
     */
    async validateTokenFromResponse(response: AuthenticationResult, idTokenOptions?: TokenValidationParameters, accessTokenOptions?: TokenValidationParameters): Promise<TokenValidationResponse[]> {
        this.logger.trace("TokenValidator.validateTokenFromResponse called");

        // Only validates token if tokenType from response is Bearer
        if (response.tokenType.toLowerCase() === AuthenticationScheme.BEARER.toLowerCase()) {
            this.logger.verbose("TokenValidator - Bearer authentication scheme confirmed");
            const validateResponse:TokenValidationResponse[] = [];

            if (!response.idToken && !response.accessToken) {
                this.logger.verbose("TokenValidator.validateTokenFromResponse - No tokens on response object to validate");
            }

            // Validates id token on response separately from access token
            if (response.idToken) {
                if (!idTokenOptions) {
                    this.logger.verbose("TokenValidator.validateTokenFromResponse - id token present on response but idTokenOptions not passed. Id token is not validated");
                } else {
                    this.logger.verbose("TokenValidator.validateTokenFromResponse - id token present on response, validating");

                    // Add code for validating c_hash if present
                    if (response.code) {
                        idTokenOptions.code = response.code;
                    }

                    // Add access token for validating at_hash if present
                    if (response.accessToken) {
                        idTokenOptions.accessTokenForAtHash = response.accessToken;
                    }

                    const validateIdTokenResponse: TokenValidationResponse = await this.validateToken(response.idToken, idTokenOptions);
                    validateResponse.push(validateIdTokenResponse);
                }
            }

            // Validates access token on response separately from id token
            if (response.accessToken) {
                if (!accessTokenOptions) {
                    this.logger.verbose("TokenValidator.validateTokenFromResponse - access token present on response but idTokenOptions not passed. Access token is not validated");
                } else {
                    this.logger.verbose("TokenValidator.validateTokenFromResponse - access token present on response, validating");
                    const validateAccessTokenResponse: TokenValidationResponse = await this.validateToken(response.accessToken, accessTokenOptions);
                    validateResponse.push(validateAccessTokenResponse);
                }
            }

            return validateResponse;
        } else {
            // If not bearer, investigate CAE/EasyAuth/MISE solution here for more complex handling
            throw ValidationConfigurationError.createInvalidAuthenticationScheme("TokenType in response is not bearer.");
        }
    }

    /**
     * Base function for token validation.
     * 
     * `validateToken` takes in a JWT token and options in the form of {@link TokenValidationParameters}, which must be set for the token to be validated.
     * `validateToken` may be called directly, or called by other TokenValidator APIs.
     * 
     * The following operations are performed on the token by the JOSE library:
     * 
     * - Verifies the JWT format
     * - Verifies the JWS signature
     * - Validates the JWT claims set
     * 
     * See documentation for more details on JOSE: https://github.com/panva/jose.
     * 
     * `validateToken` also performs the following additional operations on the token:
     * 
     * - Validates additional claims for id tokens (nonce, c_hash, at_hash)
     * 
     * ### Parameters
     * 
     * {@link TokenValidationParameters} are passed in and defaults added if not already set.
     * 
     * ### Usage example
     * 
     * To validate a token using the `validateToken` API, pass in a token along with the {@link TokenValidationParameters}`.
     * 
     * ```js
     * const nodeTokenValidation = require("@azure/node-token-validation");
     * const tokenValidator = new nodeTokenValidation.TokenValidator();
     *
     * const tokenValidationParams = {
     *    validIssuers: ["issuer-here"],
     *    validAudiences: ["audience-here"]
     * };
     *
     * tokenValidator.validateToken("token-here", tokenValidationParams).then((response) => {
     *    // Use token validation response
     * }).catch((error) => {
     *    // Handle error here
     * });
     * ```
     * 
     * A sample demonstrating usage can also be found [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/node-token-validation-samples/basic-sample).
     * 
     * ### Returns
     * 
     * `validateToken` returns a {@link TokenValidationResponse} if a token is successfully validated.
     * 
     * ### Errors
     * 
     * The following configuration errors from the Node Token Validation library may be thrown when validating a token.
     * Ensure the missing token/claims are present before validating.
     * 
     * | Error         | Error code |
     * | ------------- | -----------|
     * | Missing token | `missing_token` |
     * | Empty issuer  | `empty_issuer` |
     * | Empty audience | `empty_audience` |
     * | Missing nonce | `missing_nonce` |
     * | Invalid metadata | `invalid_metadata` |
     * 
     * The following validation errors from the Node Token Validation library may be thrown. This indicates an invalid token.
     * 
     * | Error         | Error code |
     * | ------------- | -----------|
     * | Invalid nonce | `invalid_nonce` |
     * | Invalid c_hash | `invalid_c_hash` |
     * | Invalid at_hash | `invalid_at_hash` |
     * 
     * Additional errors regarding the JWS signature or JWT claims may be thrown by the JOSE library. These errors indicate an invalid token.
     * 
     * @param {string} token JWT token to be validated
     * @param {TokenValidationParameters} options Options for validation tokens
     * @returns {Promise.<TokenValidationResponse>} Returns token validation response
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
            typ: validationParams.validTypes[0],
            clockTolerance: this.setClockTolerance(this.config.auth.clockSkew)
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
        } as TokenValidationResponse;
    }
    
    /**
     * Function to return JWKS (JSON Web Key Set) from parameters provided, jwks_uri provided, or from well-known endpoint.
     * 
     * @param {BaseValidationParameters} validationParams Built validation parameters
     * @returns {Promise<any>} Returns JWKS
     * @ignore
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
     * 
     * @param {BaseValidationParameters} options Built validation parameters
     * @returns {string[]} Returns an array of valid issuers
     * @ignore
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
     * 
     * @param {BaseValidationParameters} options Built validation parameters
     * @returns {string[]} Returns an array of valid audiences
     * @ignore
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
     * Function to check that the clockSkew configuration is a positive integer. Throws negativeClockSkew error if not.
     * 
     * @param {number} clockSkew Number from configuration to allow clock skew 
     * @returns {number} Returns clock tolerance
     * @ignore
     */
    setClockTolerance(clockSkew: number): number {
        this.logger.trace("TokenValidator.setClockTolerance called");

        // Check that the clockSkew value is a positive integer
        if (clockSkew < 0) {
            throw ValidationConfigurationError.createNegativeClockSkewError();
        }

        return clockSkew;
    }
 
    /**
     * Function to validate additional claims on token, including nonce, c_hash, and at_hash. No return, throws error if invalid.
     * 
     * OIDC specification for validating nonce on id tokens: https://openid.net/specs/openid-connect-core-1_0.html#IDTokenValidation
     * OIDC specification for c_hash and at_hash validation: https://openid.net/specs/openid-connect-core-1_0.html#HybridTokenValidation
     * 
     * @param {JWTPayload} payload JWT payload
     * @param {BaseValidationParameters} validationParams Validation parameters
     * @returns {Promise<void>}
     * @ignore
     */
    async validateClaims(payload: JWTPayload, validationParams: BaseValidationParameters): Promise<void> {
        this.logger.trace("TokenValidator.validateClaims called");

        // Validate nonce in token against nonce provided in params
        if (payload.nonce) {
            if (!validationParams.nonce) {
                throw ValidationConfigurationError.createMissingNonceError();
            } else if (validationParams.nonce === payload.nonce) {
                this.logger.verbose("Nonce validated");
            } else {
                throw ValidationError.createInvalidNonceError();
            }
        }

        // Validate c_hash on token against code provided in params
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

        // Validate at_hash on token against access token provided in params
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
     * Function to check hash for c_hash and at_hash per OIDC spec, section 3.3.2.11 https://openid.net/specs/openid-connect-core-1_0.html#HybridTokenValidation
     * 
     * @param {string} content Either code or access token string to be checked against hash
     * @param {string} hashProvided C_hash or at_hash to be checked
     * @returns {Promise<boolean>} Whether hash value matches
     * @ignore
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
