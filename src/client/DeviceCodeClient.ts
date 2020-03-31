/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { DeviceCodeResponse } from "../response/DeviceCodeResponse";
import { BaseClient } from "./BaseClient";
import { DeviceCodeRequest } from "../request/DeviceCodeRequest";
import { Authority } from "../authority/Authority";
import { ClientAuthError } from "../error/ClientAuthError";
import { RequestParameterBuilder } from "../server/RequestParameterBuilder";
import { RequestValidator } from "../request/RequestValidator";
import { Constants, GrantType } from "../utils/Constants";
import { Configuration } from "../config/Configuration";
import { TimeUtils } from "../utils/TimeUtils";
import {NetworkResponse} from "..";
import {ServerAuthorizationTokenResponse} from "../server/ServerAuthorizationTokenResponse";

/**
 * OAuth2.0 Device code client
 */
export class DeviceCodeClient extends BaseClient {

    private authority: Authority;

    constructor(configuration: Configuration){
        super(configuration);
    }

    /**
     * Gets device code from device code endpoint, calls back to with device code response, and
     * polls token endpoint to exchange device code for tokens
     * @param request
     */
    public async acquireToken(request: DeviceCodeRequest): Promise<string> {
        this.authority = await this.createAuthority(request.authority);
        const deviceCodeResponse: NetworkResponse<DeviceCodeResponse> = await this.getDeviceCode(request);
        request.deviceCodeCallback(deviceCodeResponse.body);
        const response: ServerAuthorizationTokenResponse = await this.acquireTokenWithDeviceCode(
            request,
            deviceCodeResponse.body);

        // TODO handle response
        return JSON.stringify(response);
    }

    /**
     * Creates device code request and executes http GET
     * @param request
     */
    private async getDeviceCode(request: DeviceCodeRequest): Promise<NetworkResponse<DeviceCodeResponse>> {

        const deviceCodeUrl = this.createDeviceCodeUrl(request);
        const headers = this.createDefaultLibraryHeaders();

        return this.executeGetRequestToDeviceCodeEndpoint(deviceCodeUrl, headers);
    }

    /**
     * Executes GET request to device code endpoint
     * @param deviceCodeUrl
     * @param headers
     */
    private async executeGetRequestToDeviceCodeEndpoint(deviceCodeUrl: string, headers: Map<string, string>): Promise<NetworkResponse<DeviceCodeResponse>>{

        return this.networkClient.sendGetRequestAsync<DeviceCodeResponse>(
            deviceCodeUrl,
            {
                headers: headers
            });
    }

    /**
     * Create device code endpoint url
     * @param request
     */
    private createDeviceCodeUrl(request: DeviceCodeRequest) : string {
        const queryString: string = this.createQueryString(request);

        // TODO add device code endpoint to authority class
        return `${this.authority.canonicalAuthority}${Constants.DEVICE_CODE_ENDPOINT_PATH}?${queryString}`;
    }

    /**
     * Create device code endpoint query parameters and returns string
     */
    private createQueryString(request: DeviceCodeRequest): string {

        const parameterBuilder: RequestParameterBuilder = new RequestParameterBuilder();
        parameterBuilder.addClientId(this.config.authOptions.clientId);

        const scopes = RequestValidator.validateAndGenerateScopes(
            request.scopes,
            this.config.authOptions.clientId
        );
        parameterBuilder.addScopes(scopes);

        return parameterBuilder.createQueryString();
    }

    /**
     * Creates token request with device code response and polls token endpoint at interval set by the device code
     * response
     * @param request
     * @param deviceCodeResponse
     */
    private async acquireTokenWithDeviceCode(
        request: DeviceCodeRequest,
        deviceCodeResponse: DeviceCodeResponse): Promise<ServerAuthorizationTokenResponse> {

        const requestBody = this.createTokenRequestBody(request, deviceCodeResponse);
        const headers: Map<string, string> = this.createDefaultTokenRequestHeaders();

        const deviceCodeExpirationTime = TimeUtils.nowSeconds() + deviceCodeResponse.expires_in;
        const pollingIntervalMilli = deviceCodeResponse.interval * 1000;

        // Poll token endpoint while (device code is not expired AND operation has not been cancelled by
        // setting CancellationToken.cancel = true). POST request is sent at interval set by pollingIntervalMilli
        let intervalId: ReturnType<typeof setTimeout>;
        return new Promise<ServerAuthorizationTokenResponse>((resolve, reject) => {

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

                        const response = await this.executePostToTokenEndpoint(
                            this.authority.tokenEndpoint,
                            requestBody,
                            headers);

                        if(response.body && response.body.error == Constants.AUTHORIZATION_PENDING){
                            // user authorization is pending. Will sleep for polling interval and try again
                            // TODO use logger here
                            console.log(JSON.stringify(response.body));
                        } else {
                            clearInterval(intervalId);
                            resolve(response.body);
                        }
                    }
                } catch(error){
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
    private createTokenRequestBody(request: DeviceCodeRequest, deviceCodeResponse: DeviceCodeResponse): string {

        const scopes = RequestValidator.validateAndGenerateScopes(
            request.scopes,
            this.config.authOptions.clientId
        );

        const requestParameters: RequestParameterBuilder = new RequestParameterBuilder();
        requestParameters.addScopes( scopes);
        requestParameters.addClientId(this.config.authOptions.clientId);
        requestParameters.addGrantType(GrantType.DEVICE_CODE_GRANT);
        requestParameters.addDeviceCode(deviceCodeResponse.device_code);

        return requestParameters.createQueryString();
    }
}
