/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    BaseAuthRequest,
    RequestParameterBuilder,
    StringUtils,
} from "@azure/msal-common/node";

/**
 * Binds response validation to the claims sent on the wire without turning
 * client-originated claims into a server challenge that bypasses the cache.
 */
export function getResponseRequest(
    request: BaseAuthRequest & { claimsFromClient?: string }
): BaseAuthRequest {
    if (StringUtils.isEmptyObj(request.claimsFromClient)) {
        return request;
    }

    return {
        ...request,
        claims: RequestParameterBuilder.buildMergedClaims(
            request.claims,
            undefined,
            request.correlationId,
            request.claimsFromClient
        ),
    };
}
