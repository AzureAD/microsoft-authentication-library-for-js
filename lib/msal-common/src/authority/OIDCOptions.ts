/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ServerResponseType } from "../utils/Constants";

/**
 * Options for the OIDC protocol mode.
 */
export type OIDCOptions = {
    serverResponseType?: ServerResponseType;
    defaultScopes?: Array<string>;
};

export function CompareOIDCOptions(first: OIDCOptions, second: OIDCOptions): boolean {
    return (first.serverResponseType === second.serverResponseType &&
        first.defaultScopes === second.defaultScopes);
};
