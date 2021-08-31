/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TimeUtils } from "../utils/TimeUtils";
import { CommonClientConfiguration } from "../config/ClientConfiguration";
import { BoundRefreshTokenRedemptionPayload } from "../request/BoundRefreshTokenRedemptionPayload";
import { CommonRefreshTokenRequest } from "../request/CommonRefreshTokenRequest";
import { ScopeSet } from "../request/ScopeSet";
import { AuthenticationScheme, ClaimsRequestKeys, GrantType, OIDC_DEFAULT_SCOPES } from "../utils/Constants";
import { ICrypto } from "./ICrypto";
import { KeyManager } from "./KeyManager";
import { RequestParameterBuilder } from "../request/RequestParameterBuilder";
import { ServerTelemetryManager } from "../telemetry/server/ServerTelemetryManager";
import { ClientConfigurationError } from "../error/ClientConfigurationError";
import { StringUtils } from "../utils/StringUtils";
import { RequestValidator } from "../request/RequestValidator";

/**
 * The BoundRefreshTokenRedemptionRequest class is responsible for generating
 * a bound refresh token redemption request query string. In order to generate the request string, 
 * this class builds the JWT assertion, signs it and incorporates it into the resulting query string
 * along with the query parameters that belong outside the assertion. 
 */
export class BoundRefreshTokenRedemptionRequest {
    private request: CommonRefreshTokenRequest;
    private config: CommonClientConfiguration;
    private keyManager: KeyManager;
    private cryptoUtils: ICrypto;
    private serverTelemetryManager: ServerTelemetryManager | null;

    constructor(request: CommonRefreshTokenRequest, config: CommonClientConfiguration, keyManager: KeyManager,  cryptoUtils: ICrypto, serverTelemetryManager: ServerTelemetryManager | null) {
        this.request = request;
        this.config = config;
        this.keyManager = keyManager;
        this.cryptoUtils = cryptoUtils;
        this.serverTelemetryManager = serverTelemetryManager;
    }

    /**
     * Generates and signs the JWT assertion containing the token refresh request parameters and then
     * creates the request body query string to be used in the POST token refresh request
     */
    async generateRequestBody(): Promise<string> {
        const jwtAssertion = await this.createBoundTokenRequestPayload();
        const signedAssertion = await this.cryptoUtils.signBoundTokenRequest(this.request, jwtAssertion);
        return this.createBoundTokenRequestBodyString(this.request, signedAssertion);
    }

    /**
     * Generates the JWT Assertion based on the Refresh Token request and client configuration
     */
    private async createBoundTokenRequestPayload(): Promise<BoundRefreshTokenRedemptionPayload> {
        const requestScopes =  [...this.request.scopes || [], ...OIDC_DEFAULT_SCOPES];
        const scopeSet = new ScopeSet(requestScopes);
        const scopes = scopeSet.printScopes();
        
        // Required parameters in the assertion payload
        const jwtPayload: BoundRefreshTokenRedemptionPayload = {
            client_id: this.config.authOptions.clientId,
            scope: scopes,
            grant_type: GrantType.REFRESH_TOKEN_GRANT,
            refresh_token: this.request.refreshToken,
            iss: this.request.authority,
            aud: this.config.authOptions.clientId,
            exp: TimeUtils.nowSeconds() + 3000
        };

        if (this.config.clientCredentials.clientSecret) {
            jwtPayload.client_secret = this.config.clientCredentials.clientSecret;
        }
        
        if (this.config.clientCredentials.clientAssertion) {
            const clientAssertion = this.config.clientCredentials.clientAssertion;
            jwtPayload.client_assertion = clientAssertion.assertion;
            jwtPayload.client_assertion_type = clientAssertion.assertionType;
        }
        
        if (this.request.authenticationScheme === AuthenticationScheme.POP) {
            const cnfString = await this.keyManager.generateCnf(this.request);
            jwtPayload.req_cnf = cnfString;
        }

        if (!StringUtils.isEmptyObj(this.request.claims) || this.config.authOptions.clientCapabilities && this.config.authOptions.clientCapabilities.length > 0) {
            const mergedClaims = this.addClientCapabilitiesToClaims(this.request.claims, this.config.authOptions.clientCapabilities);
            RequestValidator.validateClaims(mergedClaims);
            jwtPayload.claims = mergedClaims;
        }

        return jwtPayload;
    }

    /**
     * Helper function to create the token request body query string
     */
    private createBoundTokenRequestBodyString(request: CommonRefreshTokenRequest, signedPayload: string): string {
        const parameterBuilder = new RequestParameterBuilder();
        
        parameterBuilder.addSignedRequestPayload(signedPayload);

        parameterBuilder.addGrantType(GrantType.JWT_BEARER);
        
        parameterBuilder.addClientInfo();

        parameterBuilder.addLibraryInfo(this.config.libraryInfo);

        parameterBuilder.addThrottling();
        
        if (this.serverTelemetryManager) {
            parameterBuilder.addServerTelemetry(this.serverTelemetryManager);
        }

        const correlationId = request.correlationId || this.cryptoUtils.createNewGuid();
        parameterBuilder.addCorrelationId(correlationId);
        
        return parameterBuilder.createQueryString();
    }

    /**
     * Helper function used to merge client capabilities into the custom client claims object string
     * @param claims 
     * @param clientCapabilities 
     * @returns 
     */
    private addClientCapabilitiesToClaims(claims?: string, clientCapabilities?: Array<string>): string {
        let mergedClaims: object;

        // Parse provided claims into JSON object or initialize empty object
        if (!claims) {
            mergedClaims = {};
        } else {
            try {
                mergedClaims = JSON.parse(claims);
            } catch(e) {
                throw ClientConfigurationError.createInvalidClaimsRequestError();
            }
        }

        if (clientCapabilities && clientCapabilities.length > 0) {
            if (!mergedClaims.hasOwnProperty(ClaimsRequestKeys.ACCESS_TOKEN)){
                // Add access_token key to claims object
                mergedClaims[ClaimsRequestKeys.ACCESS_TOKEN] = {};
            }

            // Add xms_cc claim with provided clientCapabilities to access_token key
            mergedClaims[ClaimsRequestKeys.ACCESS_TOKEN][ClaimsRequestKeys.XMS_CC] = {
                values: clientCapabilities
            };
        }

        return JSON.stringify(mergedClaims);
    }
}
