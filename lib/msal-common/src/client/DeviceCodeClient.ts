/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { DeviceCodeResponse } from "../response/DeviceCodeResponse";
import { AuthenticationResult } from "../response/AuthenticationResult";
import { BaseClient } from "./BaseClient";
import { DeviceCodeRequest } from "../request/DeviceCodeRequest";
import { Authority } from "../authority/Authority";
import { ClientAuthError } from "../error/ClientAuthError";
import { RequestUtils } from "../utils/RequestUtils";
import { RequestValidator } from "../request/RequestValidator";
import {Constants, GrantType} from "../utils/Constants";
import { Configuration } from "../config/Configuration";
import { TimeUtils } from "../utils/TimeUtils";

/**
 * OAuth2.0 Device code client
 */
export class DeviceCodeClient extends BaseClient {

    private authority: Authority;

    constructor(configuration: Configuration){
        super({
            authOptions: configuration.authOptions,
            systemOptions: configuration.systemOptions,
            loggerOptions: configuration.loggerOptions,
            storageInterface: configuration.storageInterface,
            networkInterface: configuration.networkInterface,
            cryptoInterface: configuration.cryptoInterface
        });
    }

    /**
     * Gets device code from device code endpoint, calls back to with device code response, and
     * polls token endpoint to exchange device code for tokens
     * @param request
     */
    public async acquireToken(request: DeviceCodeRequest): Promise<AuthenticationResult> {
        this.authority = await this.createAuthority(request.authority);
        const deviceCodeResponse: DeviceCodeResponse = await this.getDeviceCode(request);
        request.deviceCodeCallback(deviceCodeResponse);
        return this.acquireTokenWithDeviceCode(request, deviceCodeResponse);
    }

    /**
     * Creates device code request and executes http GET
     * @param request
     */
    private async getDeviceCode(request: DeviceCodeRequest): Promise<DeviceCodeResponse> {

        const deviceCodeUrl = this.createDeviceCodeUrl(request);
        const headers: Map<string, string> = new Map<string, string>();
        RequestUtils.addLibrarydataHeaders(headers);

        let deviceCodeResponse;
        try {
            deviceCodeResponse = this.networkClient.sendGetRequestAsync<DeviceCodeResponse>(
                deviceCodeUrl,
                {
                    headers: headers
                }
            );
            return deviceCodeResponse;
        } catch (error) {
            console.log(error.response.data);
            return error.response.data;
        }
    }

    /**
     * Create device code endpoint url
     * @param request
     */
    private createDeviceCodeUrl(request: DeviceCodeRequest) : string {
        const params: Map<string, string> = this.createQueryParameters(request);
        const queryString: string = RequestUtils.createQueryString(params);

        // TODO add device code endpoint to authority class
        return this.authority.canonicalAuthority + "oauth2/v2.0/devicecode"  + "?" + queryString;
    }

    /**
     * Create device code endpoint query parameters
     * @param request
     */
    private createQueryParameters(request: DeviceCodeRequest): Map<string, string>{

        const params: Map<string, string> = new Map<string, string>();
        RequestUtils.addClientId(params, this.config.authOptions.clientId);

        const scopes = RequestValidator.validateAndGenerateScopes(
            request.scopes,
            this.config.authOptions.clientId
        );
        RequestUtils.addScopes(params, scopes);

        return params;
    }

    /**
     * Creates token request with device code response and polls token endpoint
     * @param request
     * @param deviceCodeResponse
     */
    private async acquireTokenWithDeviceCode(
        request: DeviceCodeRequest,
        deviceCodeResponse: DeviceCodeResponse): Promise<AuthenticationResult> {

        const params: Map<string, string>  = this.createTokenParameters(request, deviceCodeResponse);
        const requestBody = RequestUtils.createQueryString(params);
        const headers: Map<string, string> = this.createDefaultTokenRequestHeaders();

        const deviceCodeExpirationTime = TimeUtils.nowSeconds() + deviceCodeResponse.expires_in;
        const pollingIntervalMilli = deviceCodeResponse.interval * 1000;

        // Poll token endpoint while (device code is not expired AND operation has not been cancelled by
        // setting CancellationToken.cancel = true). POST request is sent at interval set by pollingIntervalMilli
        let intervalId: ReturnType<typeof setTimeout>;
        return new Promise<AuthenticationResult>((resolve, reject) => {

            intervalId = setInterval(async () => {
                try {
                    if(request.cancellationToken && request.cancellationToken.cancel){

                        // TODO use logger here
                        clearInterval(intervalId);
                        reject(ClientAuthError.createDeviceCodeCancelledError());

                    } else if(TimeUtils.nowSeconds() > deviceCodeExpirationTime){

                        // TODO use logger here
                        clearInterval(intervalId);
                        reject(ClientAuthError.createDeviceCodeExpiredError());

                    } else {

                        const response = await this.networkClient.sendPostRequestAsync<AuthenticationResult>(
                            this.authority.tokenEndpoint,
                            {
                                body: requestBody,
                                headers: headers
                            }
                        );
                        clearInterval(intervalId);
                        resolve(response);
                    }
                } catch(error){
                    if(error.response.data.error == Constants.AUTHORIZATION_PENDING){
                        // user authorization is pending. Will sleep for polling interval and try again
                        // TODO use logger here
                    } else{
                        // TODO use logger instead
                        clearInterval(intervalId);
                        reject(error);
                    }
                }
            }, pollingIntervalMilli);
        });
    }

    /**
     * Creates query parameters sent to the token endpoint.
     * @param request
     * @param deviceCodeResponse
     */
    private createTokenParameters(request: DeviceCodeRequest, deviceCodeResponse: DeviceCodeResponse): Map<string, string>{

        // validate and add scopes
        const scopes = RequestValidator.validateAndGenerateScopes(
            request.scopes,
            this.config.authOptions.clientId
        );

        const params: Map<string, string> = new Map<string, string>();
        RequestUtils.addScopes(params, scopes);
        RequestUtils.addClientId(params, this.config.authOptions.clientId);
        RequestUtils.addGrantType(params, GrantType.DEVICE_CODE_GRANT);
        RequestUtils.addDeviceCode(params, deviceCodeResponse.device_code);
        return params;
    }
}
