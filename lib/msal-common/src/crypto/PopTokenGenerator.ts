/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ICrypto, SignedHttpRequestParameters } from "./ICrypto";
import { AuthToken } from "../account/AuthToken";
import { TokenClaims } from "../account/TokenClaims";
import { TimeUtils } from "../utils/TimeUtils";
import { UrlString } from "../url/UrlString";
import { ClientAuthError } from "../error/ClientAuthError";

export class PopTokenGenerator {

    private cryptoUtils: ICrypto;

    constructor(cryptoUtils: ICrypto) {
        this.cryptoUtils = cryptoUtils;
    }

    async signPopToken(accessToken: string, request: SignedHttpRequestParameters): Promise<string> {
        const tokenClaims: TokenClaims | null = AuthToken.extractTokenClaims(accessToken, this.cryptoUtils);
        if (!tokenClaims?.cnf?.kid) {
            throw ClientAuthError.createTokenClaimsRequiredError();
        }
        
        return this.signPayload(accessToken, tokenClaims.cnf.kid, request);
    }

    async signPayload(payload: string, kid: string, request: SignedHttpRequestParameters, claims?: object): Promise<string> {
        // Deconstruct request to extract SHR parameters
        const { resourceRequestMethod, resourceRequestUri, shrClaims, shrNonce } = request;

        const resourceUrlString = (resourceRequestUri) ? new UrlString(resourceRequestUri) : undefined;
        const resourceUrlComponents = resourceUrlString?.getUrlComponents();

        return await this.cryptoUtils.signJwt({
            at: payload,
            ts: TimeUtils.nowSeconds(),
            m: resourceRequestMethod?.toUpperCase(),
            u: resourceUrlComponents?.HostNameAndPort,
            nonce: shrNonce || this.cryptoUtils.createNewGuid(),
            p: resourceUrlComponents?.AbsolutePath,
            q: (resourceUrlComponents?.QueryString) ? [[], resourceUrlComponents.QueryString] : undefined,
            client_claims: shrClaims || undefined,
            ...claims
        }, kid);
    }
}
