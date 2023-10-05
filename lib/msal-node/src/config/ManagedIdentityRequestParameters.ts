/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { RequestParameterBuilder, UrlString } from "@azure/msal-common";
import { HttpMethod } from "../utils/Constants";

export class ManagedIdentityRequestParameters {
    private _baseEndpoint: string;
    public httpMethod: HttpMethod;
    public headers: Record<string, string>;
    public bodyParameters: Record<string, string>;
    public queryParameters: Record<string, string>;

    constructor(httpMethod: HttpMethod, endpoint: string) {
        this.httpMethod = httpMethod;
        this._baseEndpoint = endpoint;
    }

    // copied from createExtraQueryParameters in DeviceCodeClient
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

        const bodyParametersString = parameterBuilder.createQueryString();

        return UrlString.appendQueryString(
            this._baseEndpoint,
            bodyParametersString
        );
    }
}
