/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { DeviceCodeResponse, ServerDeviceCodeResponse } from "../response/DeviceCodeResponse";
import { BaseClient } from "./BaseClient";
import { CommonDeviceCodeRequest } from "../request/CommonDeviceCodeRequest";
import { ClientAuthError } from "../error/ClientAuthError";
import { RequestParameterBuilder } from "../request/RequestParameterBuilder";
import { Constants, GrantType } from "../utils/Constants";
import { ClientConfiguration } from "../config/ClientConfiguration";
import { TimeUtils } from "../utils/TimeUtils";
import { ServerAuthorizationTokenResponse } from "../response/ServerAuthorizationTokenResponse";
import { ResponseHandler } from "../response/ResponseHandler";
import { AuthenticationResult } from "../response/AuthenticationResult";
import { StringUtils } from "../utils/StringUtils";
import { RequestThumbprint } from "../network/RequestThumbprint";

/**
 * OAuth2.0 Device code client
 */
export class DeviceCodeClient extends BaseClient {

    constructor(configuration: ClientConfiguration) {
        super(configuration);
    }

    /**
     * Gets device code from device code endpoint, calls back to with device code response, and
     * polls token endpoint to exchange device code for tokens
     * @param request
     */
    public async acquireToken(request: CommonDeviceCodeRequest): Promise<AuthenticationResult | null> {
        const deviceCodeResponse: DeviceCodeResponse = await this.getDeviceCode(request);
        request.deviceCodeCallback(deviceCodeResponse);
        const reqTimestamp = TimeUtils.nowSeconds();
        const response: ServerAuthorizationTokenResponse = await this.acquireTokenWithDeviceCode(
            request,
            deviceCodeResponse);

        const responseHandler = new ResponseHandler(
            this.config.authOptions.clientId,
            this.cacheManager,
            this.cryptoUtils,
            this.logger,
            this.config.serializableCache,
            this.config.persistencePlugin
        );

        // Validate response. This function throws a server error if an error is returned by the server.
        responseHandler.validateTokenResponse(response);
        return await responseHandler.handleServerTokenResponse(
            response,
            this.authority,
            reqTimestamp,
            request
        );
    }

    /**
     * Creates device code request and executes http GET
     * @param request
     */
    private async getDeviceCode(request: CommonDeviceCodeRequest): Promise<DeviceCodeResponse> {
        const queryString = this.createQueryString(request);
        const headers = this.createDefaultTokenRequestHeaders();
        const thumbprint: RequestThumbprint = {
            clientId: this.config.authOptions.clientId,
            authority: request.authority,
            scopes: request.scopes
        };

        return this.executePostRequestToDeviceCodeEndpoint(this.authority.deviceCodeEndpoint, queryString, headers, thumbprint);
    }

    /**
     * Executes POST request to device code endpoint
     * @param deviceCodeEndpoint
     * @param queryString
     * @param headers
     */
    private async executePostRequestToDeviceCodeEndpoint(
        deviceCodeEndpoint: string,
        queryString: string,
        headers: Record<string, string>,
        thumbprint: RequestThumbprint): Promise<DeviceCodeResponse> {

        const {
            body: {
                user_code: userCode,
                device_code: deviceCode,
                verification_uri: verificationUri,
                expires_in: expiresIn,
                interval,
                message
            }
        } = await this.networkManager.sendPostRequest<ServerDeviceCodeResponse>(
            thumbprint,
            deviceCodeEndpoint,
            {
                body: queryString,
                headers: headers
            });

        return {
            userCode,
            deviceCode,
            verificationUri,
            expiresIn,
            interval,
            message
        };
    }

    /**
     * Create device code endpoint query parameters and returns string
     */
    private createQueryString(request: CommonDeviceCodeRequest): string {

        const parameterBuilder: RequestParameterBuilder = new RequestParameterBuilder();

        parameterBuilder.addScopes(request.scopes);
        parameterBuilder.addClientId(this.config.authOptions.clientId);

        if (!StringUtils.isEmpty(request.claims) || this.config.authOptions.clientCapabilities && this.config.authOptions.clientCapabilities.length > 0) {
            parameterBuilder.addClaims(request.claims, this.config.authOptions.clientCapabilities);
        }

        return parameterBuilder.createQueryString();
    }

    /**
     * Creates token request with device code response and polls token endpoint at interval set by the device code
     * response
     * @param request
     * @param deviceCodeResponse
     */
    private async acquireTokenWithDeviceCode(
        request: CommonDeviceCodeRequest,
        deviceCodeResponse: DeviceCodeResponse): Promise<ServerAuthorizationTokenResponse> {

        const requestBody = this.createTokenRequestBody(request, deviceCodeResponse);
        const headers: Record<string, string> = this.createDefaultTokenRequestHeaders();

        const userSpecifiedTimeout = request.timeout ? TimeUtils.nowSeconds() + request.timeout : undefined;
        const deviceCodeExpirationTime = TimeUtils.nowSeconds() + deviceCodeResponse.expiresIn;
        const pollingIntervalMilli = deviceCodeResponse.interval * 1000;

        /*
         * Poll token endpoint while (device code is not expired AND operation has not been cancelled by
         * setting CancellationToken.cancel = true). POST request is sent at interval set by pollingIntervalMilli
         */
        return new Promise<ServerAuthorizationTokenResponse>((resolve, reject) => {

            const intervalId: ReturnType<typeof setTimeout> = setInterval(async () => {
                try {
                    if (request.cancel) {

                        this.logger.error("Token request cancelled by setting DeviceCodeRequest.cancel = true");
                        clearInterval(intervalId);
                        reject(ClientAuthError.createDeviceCodeCancelledError());

                    } else if (userSpecifiedTimeout && userSpecifiedTimeout < deviceCodeExpirationTime && TimeUtils.nowSeconds() > userSpecifiedTimeout) {

                        this.logger.error(`User defined timeout for device code polling reached. The timeout was set for ${userSpecifiedTimeout}`);
                        clearInterval(intervalId);
                        reject(ClientAuthError.createUserTimeoutReachedError());

                    } else if (TimeUtils.nowSeconds() > deviceCodeExpirationTime) {

                        if (userSpecifiedTimeout) {
                            this.logger.verbose(`User specified timeout ignored as the device code has expired before the timeout elapsed. The user specified timeout was set for ${userSpecifiedTimeout}`);
                        }

                        this.logger.error(`Device code expired. Expiration time of device code was ${deviceCodeExpirationTime}`);
                        clearInterval(intervalId);
                        reject(ClientAuthError.createDeviceCodeExpiredError());

                    } else {
                        const thumbprint: RequestThumbprint = {
                            clientId: this.config.authOptions.clientId,
                            authority: request.authority,
                            scopes: request.scopes
                        };
                        const response = await this.executePostToTokenEndpoint(
                            this.authority.tokenEndpoint,
                            requestBody,
                            headers,
                            thumbprint);

                        if (response.body && response.body.error === Constants.AUTHORIZATION_PENDING) {
                            // user authorization is pending. Sleep for polling interval and try again
                            this.logger.info(response.body.error_description || "no_error_description");
                        } else {
                            clearInterval(intervalId);
                            resolve(response.body);
                        }
                    }
                } catch (error) {
                    clearInterval(intervalId);
                    reject(error);
                }
            }, pollingIntervalMilli);
        });
    }

    /**
     * Creates query parameters and converts to string.
     * @param request
     * @param deviceCodeResponse
     */
    private createTokenRequestBody(request: CommonDeviceCodeRequest, deviceCodeResponse: DeviceCodeResponse): string {

        const requestParameters: RequestParameterBuilder = new RequestParameterBuilder();

        requestParameters.addScopes(request.scopes);
        requestParameters.addClientId(this.config.authOptions.clientId);
        requestParameters.addGrantType(GrantType.DEVICE_CODE_GRANT);
        requestParameters.addDeviceCode(deviceCodeResponse.deviceCode);
        const correlationId = request.correlationId || this.config.cryptoInterface.createNewGuid();
        requestParameters.addCorrelationId(correlationId);
        requestParameters.addClientInfo();
        requestParameters.addLibraryInfo(this.config.libraryInfo);
        requestParameters.addThrottling();
        
        if (this.serverTelemetryManager) {
            requestParameters.addServerTelemetry(this.serverTelemetryManager);
        }

        if (!StringUtils.isEmptyObj(request.claims) || this.config.authOptions.clientCapabilities && this.config.authOptions.clientCapabilities.length > 0) {
            requestParameters.addClaims(request.claims, this.config.authOptions.clientCapabilities);
        }
        return requestParameters.createQueryString();
    }
}
