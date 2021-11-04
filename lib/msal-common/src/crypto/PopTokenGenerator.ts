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

/**
 * See eSTS docs for more info.
 * - A kid element, with the value containing an RFC 7638-compliant JWK thumbprint that is base64 encoded.
 * -  xms_ksl element, representing the storage location of the key's secret component on the client device. One of two values:
 *      - sw: software storage
 *      - uhw: hardware storage
 */
type ReqCnf = {
    kid: string;
    xms_ksl: KeyLocation;
};

enum KeyLocation {
    SW = "sw",
    UHW = "uhw"
}

export class PopTokenGenerator {

    private cryptoUtils: ICrypto;

    constructor(cryptoUtils: ICrypto) {
        this.cryptoUtils = cryptoUtils;
    }

    async generateCnf(request: SignedHttpRequestParameters): Promise<string> {
        const reqCnf = await this.generateKid(request);
        return this.cryptoUtils.base64Encode(JSON.stringify(reqCnf));
    }

    async generateKid(request: SignedHttpRequestParameters): Promise<ReqCnf> {
        const kidThumbprint = await this.cryptoUtils.getPublicKeyThumbprint(request);

        return {
            kid: kidThumbprint,
            xms_ksl: KeyLocation.SW
        };
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
