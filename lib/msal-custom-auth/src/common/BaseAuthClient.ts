/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TenantConfig } from "./TenantConfig.js";

export abstract class BaseAuthClient {
    protected readonly baseUrl: string;
    protected readonly clientId: string;
    protected readonly tenantSubdomain: string;
    protected readonly version: string = "v1.0";

    constructor(config: TenantConfig) {
        this.clientId = config.clientId;
        this.tenantSubdomain = config.tenantSubdomain;
        this.baseUrl = `https://${this.tenantSubdomain}.ciamlogin.com/${this.tenantSubdomain}.onmicrosoft.com`;
    }

    protected async makeRequest<T>(
        endpoint: string,
        data: Record<string, string>,
        method: "GET" | "POST" = "POST"
    ): Promise<T> {
        const formData = new URLSearchParams({
            client_id: this.clientId,
            ...data,
        });

        const response = await fetch(`${this.baseUrl}/${endpoint}`, {
            method,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: formData,
        });

        if (!response.ok) {
            throw await this.handleError(response);
        }

        return response.json();
    }

    protected abstract handleError<T>(response: Response): Promise<T>;
}
