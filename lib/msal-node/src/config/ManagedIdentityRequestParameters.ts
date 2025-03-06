/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { RequestParameterBuilder, UrlString } from "@azure/msal-common/node";
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
        const parameterBuilder = new RequestParameterBuilder();

        if (this.queryParameters) {
            parameterBuilder.addExtraQueryParameters(this.queryParameters);
        }

        const queryParametersString = parameterBuilder.createQueryString();

        return UrlString.appendQueryString(
            this._baseEndpoint,
            queryParametersString
        );
    }

    public computeParametersBodyString(): string {
        const parameterBuilder = new RequestParameterBuilder();

        if (this.bodyParameters) {
            parameterBuilder.addExtraQueryParameters(this.bodyParameters);
        }

        return parameterBuilder.createQueryString();
    }
}
