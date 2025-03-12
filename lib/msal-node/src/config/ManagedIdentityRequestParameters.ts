/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    RequestParameterBuilder,
    UrlString,
    UrlUtils,
} from "@azure/msal-common/node";
import {
    HttpMethod,
    MANAGED_IDENTITY_HTTP_STATUS_CODES_TO_RETRY_ON,
    MANAGED_IDENTITY_MAX_RETRIES,
    MANAGED_IDENTITY_RETRY_DELAY,
    RetryPolicies,
} from "../utils/Constants.js";
import { LinearRetryPolicy } from "../retry/LinearRetryPolicy.js";

export class ManagedIdentityRequestParameters {
    private _baseEndpoint: string;
    public httpMethod: HttpMethod;
    public headers: Record<string, string>;
    public bodyParameters: Record<string, string>;
    public queryParameters: Record<string, string>;
    public retryPolicy: RetryPolicies;

    constructor(
        httpMethod: HttpMethod,
        endpoint: string,
        retryPolicy?: RetryPolicies
    ) {
        this.httpMethod = httpMethod;
        this._baseEndpoint = endpoint;
        this.headers = {} as Record<string, string>;
        this.bodyParameters = {} as Record<string, string>;
        this.queryParameters = {} as Record<string, string>;

        const defaultRetryPolicy: LinearRetryPolicy = new LinearRetryPolicy(
            MANAGED_IDENTITY_MAX_RETRIES,
            MANAGED_IDENTITY_RETRY_DELAY,
            MANAGED_IDENTITY_HTTP_STATUS_CODES_TO_RETRY_ON
        );
        this.retryPolicy = retryPolicy || defaultRetryPolicy;
    }

    public computeUri(): string {
        const parameters = new Map<string, string>();

        if (this.queryParameters) {
            RequestParameterBuilder.addExtraQueryParameters(
                parameters,
                this.queryParameters
            );
        }

        const queryParametersString = UrlUtils.mapToQueryString(parameters);

        return UrlString.appendQueryString(
            this._baseEndpoint,
            queryParametersString
        );
    }

    public computeParametersBodyString(): string {
        const parameters = new Map<string, string>();

        if (this.bodyParameters) {
            RequestParameterBuilder.addExtraQueryParameters(
                parameters,
                this.bodyParameters
            );
        }

        return UrlUtils.mapToQueryString(parameters);
    }
}
