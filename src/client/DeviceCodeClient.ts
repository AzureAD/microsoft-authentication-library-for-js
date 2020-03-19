/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { DeviceCodeResponse } from "../response/DeviceCodeResponse";
import { AuthenticationResult } from "../response/AuthenticationResult";
import { BaseClient } from "./BaseClient";
import { DeviceCodeParameters } from "../request/DeviceCodeParameters";
import { Authority } from "../authority/Authority";
import { ClientAuthError } from "../error/ClientAuthError";
import { ServerParamsGenerator } from "../server/ServerParamsGenerator";
import { RequestValidator } from "../request/RequestValidator";
import { GrantType } from "../utils/Constants";
import { Configuration } from "../config/Configuration";

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

    public async acquireToken(request: DeviceCodeParameters): Promise<AuthenticationResult> {
        this.authority = await this.createAuthority(request.authority);
        const deviceCodeResponse: DeviceCodeResponse = await this.getDeviceCode(request);
        request.deviceCodeCallback(deviceCodeResponse);
        return this.acquireTokenWithDeviceCode(request, deviceCodeResponse);
    }

    private async getDeviceCode(request: DeviceCodeParameters): Promise<DeviceCodeResponse> {

        const deviceCodeUrl = this.createDeviceCodeUrl(request);
        const headers: Map<string, string> = new Map<string, string>();

        let deviceCodeResponse;
        try {
            deviceCodeResponse = this.networkClient.sendGetRequestAsync<DeviceCodeResponse>(
                deviceCodeUrl,
                {
                    headers: ServerParamsGenerator.createHeaders(headers)
                }
            );
            return deviceCodeResponse;
        } catch (error) {
            console.log(error.response.data);
            return error.response.data;
        }
    }

    private createDeviceCodeUrl(request: DeviceCodeParameters) : string {
        const params: Map<string, string> = this.createQueryParameters(request);
        const queryString: string = ServerParamsGenerator.createQueryString(params);

        // TODO add device code endpoint to authority class
        return this.authority.canonicalAuthority + "oauth2/v2.0/devicecode"  + "?" + queryString;
    }

    private createQueryParameters(request: DeviceCodeParameters): Map<string, string>{

        const params: Map<string, string> = new Map<string, string>();
        ServerParamsGenerator.addClientId(params, this.config.authOptions.clientId);

        const scopes = RequestValidator.validateAndGenerateScopes(
            request.scopes,
            this.config.authOptions.clientId
        );
        ServerParamsGenerator.addScopes(params, scopes);

        return params;
    }

    private async acquireTokenWithDeviceCode(
        request: DeviceCodeParameters,
        deviceCodeResponse: DeviceCodeResponse): Promise<AuthenticationResult> {

        const params: Map<string, string>  = this.createTokenParameters(request, deviceCodeResponse);
        const headers: Map<string, string> = this.createTokenRequestHeaders();
        const requestBody = ServerParamsGenerator.createQueryString(params);

        const deviceCodeExpirationTime = this.getTimeNowInSeconds() + deviceCodeResponse.expires_in;
        const pollingIntervalMilli = deviceCodeResponse.interval * 1000;

        // Poll token endpoint while (device code is not expired AND operation has not been cancelled by
        // setting CancellationToken.cancel = true). POST request is sent at interval set by pollingIntervalMilli
        let intervalId: ReturnType<typeof setTimeout>;
        return new Promise((resolve, reject) => {

            intervalId = setInterval(async () => {
                try {
                    if(request.cancellationToken && request.cancellationToken.cancel){

                        // TODO use logger here
                        clearInterval(intervalId);
                        reject(ClientAuthError.createDeviceCodeCancelledError());

                    } else if(this.getTimeNowInSeconds() > deviceCodeExpirationTime){

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
                    if(error.response.data.error == "authorization_pending"){
                        // user authorization is pending. Will sleep for polling interval and try again
                        console.log("Error: " + JSON.stringify(error.response.data)); // TODO use logger instead
                    } else{
                        console.log("Error: " + JSON.stringify(error.response.data)); // TODO use logger instead
                        clearInterval(intervalId);
                        reject(error);
                    }
                }
            }, pollingIntervalMilli);
        });
    }

    private createTokenRequestHeaders(): Map<string, string> {
        const headers = new Map<string, string>();
        ServerParamsGenerator.addContentTypeHeader(headers);
        return headers;
    }

    private createTokenParameters(request: DeviceCodeParameters, deviceCodeResponse: DeviceCodeResponse): Map<string, string>{

        // validate and add scopes
        const scopes = RequestValidator.validateAndGenerateScopes(
            request.scopes,
            this.config.authOptions.clientId
        );

        const params: Map<string, string> = new Map<string, string>();
        ServerParamsGenerator.addScopes(params, scopes);
        ServerParamsGenerator.addClientId(params, this.config.authOptions.clientId);
        ServerParamsGenerator.addGrantType(params, GrantType.DEVICE_CODE_GRANT);
        ServerParamsGenerator.addDeviceCode(params, deviceCodeResponse.device_code);
        return params;
    }

    private getTimeNowInSeconds(): number {
        return Math.round(Date.now() / 1000);
    }
}
