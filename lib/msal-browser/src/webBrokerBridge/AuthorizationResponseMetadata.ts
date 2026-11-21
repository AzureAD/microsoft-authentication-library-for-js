/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationResult } from "../response/AuthenticationResult.js";

const AUTHORIZATION_RESPONSE_METADATA_KEY = Symbol.for(
    "@azure/msal-browser.authorization-response-metadata"
);

export type AuthorizationResponseMetadata = {
    issuer: string;
    expectedIssuer: string;
};

type AuthenticationResultWithAuthorizationResponseMetadata =
    AuthenticationResult & {
        [AUTHORIZATION_RESPONSE_METADATA_KEY]?: AuthorizationResponseMetadata;
    };

export function setAuthorizationResponseMetadata(
    result: AuthenticationResult,
    issuer?: string,
    expectedIssuer?: string
): void {
    if (!issuer || !expectedIssuer) {
        return;
    }

    Object.defineProperty(result, AUTHORIZATION_RESPONSE_METADATA_KEY, {
        value: { issuer, expectedIssuer },
    });
}

export function getAuthorizationResponseMetadata(
    result: AuthenticationResult
): AuthorizationResponseMetadata | undefined {
    return (result as AuthenticationResultWithAuthorizationResponseMetadata)[
        AUTHORIZATION_RESPONSE_METADATA_KEY
    ];
}
