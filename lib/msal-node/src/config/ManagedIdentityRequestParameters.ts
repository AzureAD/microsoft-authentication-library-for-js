/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { RequestParameterBuilder, UrlString } from "@azure/msal-common/node";
import { HttpMethod } from "../utils/Constants.js";

export class ManagedIdentityRequestParameters {
    private _baseEndpoint: string;
    public httpMethod: HttpMethod;
    public headers: Record<string, string>;
    public bodyParameters: Record<string, string>;
    public queryParameters: Record<string, string>;

    constructor(httpMethod: HttpMethod, endpoint: string) {
        this.httpMethod = httpMethod;
        this._baseEndpoint = endpoint;
        this.headers = {} as Record<string, string>;
        this.bodyParameters = {} as Record<string, string>;
        this.queryParameters = {} as Record<string, string>;
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
