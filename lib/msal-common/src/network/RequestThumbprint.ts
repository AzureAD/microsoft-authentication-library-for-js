/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ShrOptions } from "../crypto/SignedHttpRequest.js";
import { BaseAuthRequest } from "../request/BaseAuthRequest.js";
import { AuthenticationScheme } from "../utils/Constants.js";
import { buildDpopResourceRequestContext } from "../crypto/DpopProof.js";

/**
 * Type representing a unique request thumbprint.
 */
export type RequestThumbprint = {
    clientId: string;
    authority: string;
    scopes: Array<string>;
    homeAccountIdentifier?: string;
    claims?: string;
    authenticationScheme?: AuthenticationScheme;
    resourceRequestMethod?: string;
    resourceRequestUri?: string;
    dpopJkt?: string;
    shrClaims?: string;
    sshKid?: string;
    shrOptions?: ShrOptions;
    embeddedClientId?: string;
};

export function getRequestThumbprint(
    clientId: string,
    request: BaseAuthRequest,
    homeAccountId?: string
): RequestThumbprint {
    const dpopResourceRequestContext =
        request.authenticationScheme === AuthenticationScheme.DPOP
            ? request.dpopResourceRequest ||
              buildDpopResourceRequestContext(
                  request.resourceRequestMethod,
                  request.resourceRequestUri,
                  request.correlationId
              )
            : undefined;

    return {
        clientId: clientId,
        authority: request.authority,
        scopes: request.scopes,
        homeAccountIdentifier: homeAccountId,
        claims: request.claims,
        authenticationScheme: request.authenticationScheme,
        resourceRequestMethod:
            dpopResourceRequestContext?.normalizedMethod ||
            request.resourceRequestMethod,
        resourceRequestUri:
            dpopResourceRequestContext?.normalizedUri ||
            request.resourceRequestUri,
        dpopJkt: request.dpopJkt,
        shrClaims: request.shrClaims,
        sshKid: request.sshKid,
        embeddedClientId:
            request.embeddedClientId || request.extraParameters?.clientId,
    };
}
