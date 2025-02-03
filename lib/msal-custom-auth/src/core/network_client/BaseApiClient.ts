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

export abstract class BaseApiClient {
    protected readonly baseUrl: string;
    protected readonly clientId: string;
    protected readonly tenantSubdomain: string;

    constructor(
        clientId: string,
        tenantSubdomain: string,
        private telemetryManager: ServerTelemetryManager,
        private logger: Logger,
    ) {
        this.clientId = clientId;
        this.tenantSubdomain = tenantSubdomain;
        this.baseUrl = `https://${this.tenantSubdomain}.ciamlogin.com/${this.tenantSubdomain}.onmicrosoft.com`;
    }

    async request<T>(
        endpoint: string,
        data: Record<string, string>,
        method: "GET" | "POST" = "POST",
        correlationId: string = "",
    ): Promise<T> {
        const startTime = performance.now();
        this.logger.trace(`Sending request to ${endpoint}`, correlationId);

        const formData = new URLSearchParams({
            client_id: this.clientId,
            ...data,
        });

        const headers = this.getCommonHeaders();
        const response = await fetch(`${this.baseUrl}/${endpoint}`, {
            method,
            headers,
            body: formData,
        });
        const endTime = performance.now();
        this.logger.trace(
            `Request to ${endpoint} completed in ${endTime - startTime}ms`,
            correlationId,
        );
        if (!response.ok) {
            throw await this.handleError(response);
        }

        /*
         * this.logger.error(
         *     `Failed to send request: ${e}`,
         *     request.correlationId,
         * );
         */

        /*
         * if (!window.navigator.onLine) {
         *     throw new HttpError(
         *         NoNetworkConnectivity,
         *         `No network connectivity: ${e}`,
         *         request.correlationId,
         *     );
         * }
         */

        /*
         * throw new HttpError(
         *     FailedSendRequest,
         *     `Failed to send request: ${e}`,
         *     request.correlationId,
         * );
         */
        return response.json();
    }

    private getCommonHeaders() {
        return {
            [AADServerParamKeys.X_CLIENT_SKU]: DefaultPackageInfo.SKU,
            [AADServerParamKeys.X_CLIENT_VER]: DefaultPackageInfo.VERSION,
            [AADServerParamKeys.X_CLIENT_OS]: DefaultPackageInfo.OS,
            [AADServerParamKeys.X_CLIENT_CPU]: DefaultPackageInfo.CPU,
            [AADServerParamKeys.X_CLIENT_CURR_TELEM]:
                this.telemetryManager.generateCurrentRequestHeaderValue(),
            [AADServerParamKeys.X_CLIENT_LAST_TELEM]:
                this.telemetryManager.generateLastRequestHeaderValue(),
            [AADServerParamKeys.CLIENT_REQUEST_ID]: this.correlationId,
        };
    }

    protected abstract handleError<T>(response: Response): Promise<T>;
}
