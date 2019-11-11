/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { StringDict } from "../app/MsalTypes";

/**
 * @link AuthenticationParameters}AuthenticationParameters
 */
export type TokenExchangeParameters = {
    scopes?: Array<string>;
    code?: string;
    codeVerifier?: string;
    extraQueryParameters?: StringDict;
    authority?: string;
    state?: string;
    correlationId?: string;
};
