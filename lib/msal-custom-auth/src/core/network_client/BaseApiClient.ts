/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AADServerParamKeys,
    Logger,
    ServerTelemetryManager,
} from "@azure/msal-browser";
import { DefaultPackageInfo } from "../../CustomAuthConstants.js";
import { ApiErrorResponse } from "./types/ApiErrorResponseTypes.js";
import { ApiError, NotFoundError, UnauthorizedError } from "./ApiErrorHandlers.js";
import { IHttpClient } from "./http_client/IHttpClient.js";
import { FetchHttpClient } from "./http_client/FetchClient.js";

export abstract class BaseApiClient {
    protected readonly baseUrl: string;
    protected readonly clientId: string;
    protected readonly tenantSubdomain: string;
    protected httpClient: IHttpClient;

    constructor(
        clientId: string,
        tenantSubdomain: string,
        private logger: Logger,
    ) {
        this.clientId = clientId;
        this.tenantSubdomain = tenantSubdomain;
        this.baseUrl = `https://${this.tenantSubdomain}.ciamlogin.com/${this.tenantSubdomain}.onmicrosoft.com`;
        this.httpClient = new FetchHttpClient();
    }

    async request<T>(
        endpoint: string,
        data: Record<string, string | ServerTelemetryManager>,
        telemetryManager: ServerTelemetryManager,
        correlationId: string = "",
    ): Promise<T> {
        this.logger.trace(`Sending request to ${endpoint}`, correlationId);

        const startTime = performance.now();
        const formData = new URLSearchParams({
            client_id: this.clientId,
            ...data,
        });
        const headers = this.getCommonHeaders(correlationId, telemetryManager);
        try {
            const response = await this.httpClient.post(`${this.baseUrl}/${endpoint}`, formData, headers);
            const endTime = performance.now();
            this.logger.trace(`Request to ${endpoint} completed in ${endTime - startTime}ms`, correlationId);
            if (!response.ok) {
                const errorResponse: ApiErrorResponse = await response.json();
                switch (response.status) {
                    case 401:
                        throw new UnauthorizedError(response, errorResponse);
                    case 404:
                        throw new NotFoundError(response, errorResponse);
                    default:
                        throw new ApiError(response, errorResponse, "An error occurred");
                }
            }

            return await response.json();
        } catch (error) {
            this.logger.error(`Request to ${endpoint} failed`, correlationId);
            throw error;
        }
    }

    private getCommonHeaders(correlationId: string, telemetryManager: ServerTelemetryManager): Record<string, string> {
        return {
            "Content-Type": "application/x-www-form-urlencoded",
            [AADServerParamKeys.X_CLIENT_SKU]: DefaultPackageInfo.SKU,
            [AADServerParamKeys.X_CLIENT_VER]: DefaultPackageInfo.VERSION,
            [AADServerParamKeys.X_CLIENT_OS]: DefaultPackageInfo.OS,
            [AADServerParamKeys.X_CLIENT_CPU]: DefaultPackageInfo.CPU,
            [AADServerParamKeys.X_CLIENT_CURR_TELEM]: telemetryManager.generateCurrentRequestHeaderValue(),
            [AADServerParamKeys.X_CLIENT_LAST_TELEM]: telemetryManager.generateLastRequestHeaderValue(),
            [AADServerParamKeys.CLIENT_REQUEST_ID]: correlationId,
        };
    }

    protected abstract handleError<T>(response: Response): Promise<T>;
}
