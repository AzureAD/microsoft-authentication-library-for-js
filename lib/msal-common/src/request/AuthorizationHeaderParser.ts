/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

type WWWAuthenticateChallenges = {
    nonce?: string,
    error?: string
};

type AuthenticationInfoChallenges = {
    nextnonce?: string
};

export class AuthorizationHeaderParser{
    private headers: Headers;
    constructor(headers: Headers) {
        this.headers = headers;
    }

    getShrNonce(): string {
        const wwwAuthenticate = this.headers.get("WWW-Authenticate");
        if (wwwAuthenticate) {
            const wwwAuthenticateChallenges = this.parseChallenges(wwwAuthenticate) as WWWAuthenticateChallenges;
            return wwwAuthenticateChallenges.nonce || "";
        }

        const authenticationInfo = this.headers.get("AuthenticationInfo");
        if (authenticationInfo) {
            const authenticationInfoChallenges = this.parseChallenges(authenticationInfo) as AuthenticationInfoChallenges;
            return authenticationInfoChallenges.nextnonce || "";
        }

        return "";
    }

    private parseChallenges(header: string): Object {
        const schemeSeparator = header.indexOf(" ");
        const challenges = header.substr(schemeSeparator + 1).split(",");
        const challengeMap = {};
        challenges.forEach((challenge: string) => {
            const [ key, value ] = challenge.split("=");
            challengeMap[key] = unescape(value.replace(/['"]+/g, ""));
        });
        return challengeMap;
    }
}
