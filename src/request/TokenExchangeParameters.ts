/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { StringDict } from "../utils/MsalTypes";

/**
 * TokenExchangeParameters used to exchange an authorization code for a token.
 * - scopes: requested token scopes
 * - code: authorization code to exchange for tokens
 * - code_verifier: verifier to complete PKCE protocol
 * - extraQueryParameters: string to string map of custom query parameters
 * - authority: authority to request tokens from
 * - userRequestState: state parameter to ensure request/response integrity
 * - correlationId: custom correlationId given by user
 */
export type TokenExchangeParameters = {
    scopes?: Array<string>;
    resource?: string;
    codeVerifier?: string;
    extraQueryParameters?: StringDict;
    authority?: string;
    correlationId?: string;
};
