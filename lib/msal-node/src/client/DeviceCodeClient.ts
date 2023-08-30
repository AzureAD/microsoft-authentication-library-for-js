/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthenticationResult,
    BaseClient,
    ClientAuthError,
    ClientConfiguration,
    CommonDeviceCodeRequest,
    Constants,
    DeviceCodeResponse,
    GrantType,
    RequestParameterBuilder,
    RequestThumbprint,
    ResponseHandler,
    ServerAuthorizationTokenResponse,
    ServerDeviceCodeResponse,
    ServerError,
    StringUtils,
    TimeUtils,
    UrlString,
} from "@azure/msal-common";

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
    public async acquireToken(
        request: CommonDeviceCodeRequest
    ): Promise<AuthenticationResult | null> {
        const deviceCodeResponse: DeviceCodeResponse = await this.getDeviceCode(
            request
        );
        request.deviceCodeCallback(deviceCodeResponse);
        const reqTimestamp = TimeUtils.nowSeconds();
        const response: ServerAuthorizationTokenResponse =
            await this.acquireTokenWithDeviceCode(request, deviceCodeResponse);

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
    private async getDeviceCode(
        request: CommonDeviceCodeRequest
    ): Promise<DeviceCodeResponse> {
        const queryParametersString = this.createExtraQueryParameters(request);
        const endpoint = UrlString.appendQueryString(
            this.authority.deviceCodeEndpoint,
            queryParametersString
        );
        const queryString = this.createQueryString(request);
        const headers = this.createTokenRequestHeaders();
        const thumbprint: RequestThumbprint = {
            clientId: this.config.authOptions.clientId,
            authority: request.authority,
            scopes: request.scopes,
            claims: request.claims,
            authenticationScheme: request.authenticationScheme,
            resourceRequestMethod: request.resourceRequestMethod,
            resourceRequestUri: request.resourceRequestUri,
            shrClaims: request.shrClaims,
            sshKid: request.sshKid,
        };

        return this.executePostRequestToDeviceCodeEndpoint(
            endpoint,
            queryString,
            headers,
            thumbprint
        );
    }

    /**
     * Creates query string for the device code request
     * @param request
     */
    createExtraQueryParameters(request: CommonDeviceCodeRequest): string {
        const parameterBuilder = new RequestParameterBuilder();

        if (request.extraQueryParameters) {
            parameterBuilder.addExtraQueryParameters(
                request.extraQueryParameters
            );
        }

        return parameterBuilder.createQueryString();
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
        thumbprint: RequestThumbprint
    ): Promise<DeviceCodeResponse> {
        const {
            body: {
                user_code: userCode,
                device_code: deviceCode,
                verification_uri: verificationUri,
                expires_in: expiresIn,
                interval,
                message,
            },
        } = await this.networkManager.sendPostRequest<ServerDeviceCodeResponse>(
            thumbprint,
            deviceCodeEndpoint,
            {
                body: queryString,
                headers: headers,
            }
        );

        return {
            userCode,
            deviceCode,
            verificationUri,
            expiresIn,
            interval,
            message,
        };
    }

    /**
     * Create device code endpoint query parameters and returns string
     */
    private createQueryString(request: CommonDeviceCodeRequest): string {
        const parameterBuilder: RequestParameterBuilder =
            new RequestParameterBuilder();

        parameterBuilder.addScopes(request.scopes);
        parameterBuilder.addClientId(this.config.authOptions.clientId);

        if (request.extraQueryParameters) {
            parameterBuilder.addExtraQueryParameters(
                request.extraQueryParameters
            );
        }

        if (
            request.claims ||
            (this.config.authOptions.clientCapabilities &&
                this.config.authOptions.clientCapabilities.length > 0)
        ) {
            parameterBuilder.addClaims(
                request.claims,
                this.config.authOptions.clientCapabilities
            );
        }

        return parameterBuilder.createQueryString();
    }

    /**
     * Breaks the polling with specific conditions.
     * @param request CommonDeviceCodeRequest
     * @param deviceCodeResponse DeviceCodeResponse
     */
    private continuePolling(
        deviceCodeExpirationTime: number,
        userSpecifiedTimeout?: number,
        userSpecifiedCancelFlag?: boolean
    ): boolean {
        if (userSpecifiedCancelFlag) {
            this.logger.error(
                "Token request cancelled by setting DeviceCodeRequest.cancel = true"
            );
            throw ClientAuthError.createDeviceCodeCancelledError();
        } else if (
            userSpecifiedTimeout &&
            userSpecifiedTimeout < deviceCodeExpirationTime &&
            TimeUtils.nowSeconds() > userSpecifiedTimeout
        ) {
            this.logger.error(
                `User defined timeout for device code polling reached. The timeout was set for ${userSpecifiedTimeout}`
            );
            throw ClientAuthError.createUserTimeoutReachedError();
        } else if (TimeUtils.nowSeconds() > deviceCodeExpirationTime) {
            if (userSpecifiedTimeout) {
                this.logger.verbose(
                    `User specified timeout ignored as the device code has expired before the timeout elapsed. The user specified timeout was set for ${userSpecifiedTimeout}`
                );
            }
            this.logger.error(
                `Device code expired. Expiration time of device code was ${deviceCodeExpirationTime}`
            );
            throw ClientAuthError.createDeviceCodeExpiredError();
        }
        return true;
    }

    /**
     * Creates token request with device code response and polls token endpoint at interval set by the device code
     * response
     * @param request
     * @param deviceCodeResponse
     */
    private async acquireTokenWithDeviceCode(
        request: CommonDeviceCodeRequest,
        deviceCodeResponse: DeviceCodeResponse
    ): Promise<ServerAuthorizationTokenResponse> {
        const queryParametersString = this.createTokenQueryParameters(request);
        const endpoint = UrlString.appendQueryString(
            this.authority.tokenEndpoint,
            queryParametersString
        );
        const requestBody = this.createTokenRequestBody(
            request,
            deviceCodeResponse
        );
        const headers: Record<string, string> =
            this.createTokenRequestHeaders();

        const userSpecifiedTimeout = request.timeout
            ? TimeUtils.nowSeconds() + request.timeout
            : undefined;
        const deviceCodeExpirationTime =
            TimeUtils.nowSeconds() + deviceCodeResponse.expiresIn;
        const pollingIntervalMilli = deviceCodeResponse.interval * 1000;

        /*
         * Poll token endpoint while (device code is not expired AND operation has not been cancelled by
         * setting CancellationToken.cancel = true). POST request is sent at interval set by pollingIntervalMilli
         */
        while (
            this.continuePolling(
                deviceCodeExpirationTime,
                userSpecifiedTimeout,
                request.cancel
            )
        ) {
            const thumbprint: RequestThumbprint = {
                clientId: this.config.authOptions.clientId,
                authority: request.authority,
                scopes: request.scopes,
                claims: request.claims,
                authenticationScheme: request.authenticationScheme,
                resourceRequestMethod: request.resourceRequestMethod,
                resourceRequestUri: request.resourceRequestUri,
                shrClaims: request.shrClaims,
                sshKid: request.sshKid,
            };
            const response = await this.executePostToTokenEndpoint(
                endpoint,
                requestBody,
                headers,
                thumbprint,
                request.correlationId
            );

            if (response.body && response.body.error) {
                // user authorization is pending. Sleep for polling interval and try again
                if (response.body.error === Constants.AUTHORIZATION_PENDING) {
                    this.logger.info(
                        "Authorization pending. Continue polling."
                    );
                    await TimeUtils.delay(pollingIntervalMilli);
                } else {
                    // for any other error, throw
                    this.logger.info(
                        "Unexpected error in polling from the server"
                    );
                    throw ServerError.createPostRequestFailed(
                        response.body.error
                    );
                }
            } else {
                this.logger.verbose(
                    "Authorization completed successfully. Polling stopped."
                );
                return response.body;
            }
        }

        /*
         * The above code should've thrown by this point, but to satisfy TypeScript,
         * and in the rare case the conditionals in continuePolling() may not catch everything...
         */
        this.logger.error("Polling stopped for unknown reasons.");
        throw ClientAuthError.createDeviceCodeUnknownError();
    }

    /**
     * Creates query parameters and converts to string.
     * @param request
     * @param deviceCodeResponse
     */
    private createTokenRequestBody(
        request: CommonDeviceCodeRequest,
        deviceCodeResponse: DeviceCodeResponse
    ): string {
        const requestParameters: RequestParameterBuilder =
            new RequestParameterBuilder();

        requestParameters.addScopes(request.scopes);
        requestParameters.addClientId(this.config.authOptions.clientId);
        requestParameters.addGrantType(GrantType.DEVICE_CODE_GRANT);
        requestParameters.addDeviceCode(deviceCodeResponse.deviceCode);
        const correlationId =
            request.correlationId ||
            this.config.cryptoInterface.createNewGuid();
        requestParameters.addCorrelationId(correlationId);
        requestParameters.addClientInfo();
        requestParameters.addLibraryInfo(this.config.libraryInfo);
        requestParameters.addApplicationTelemetry(
            this.config.telemetry.application
        );
        requestParameters.addThrottling();
        if (this.serverTelemetryManager) {
            requestParameters.addServerTelemetry(this.serverTelemetryManager);
        }

        if (
            !StringUtils.isEmptyObj(request.claims) ||
            (this.config.authOptions.clientCapabilities &&
                this.config.authOptions.clientCapabilities.length > 0)
        ) {
            requestParameters.addClaims(
                request.claims,
                this.config.authOptions.clientCapabilities
            );
        }
        return requestParameters.createQueryString();
    }
}
