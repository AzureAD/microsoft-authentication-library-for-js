/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { ClientRequestParameters } from "./ClientRequestParameters";

/**
 * TokenExchangeParameters used to exchange an authorization code for a token.
 * - scopes: requested token scopes
 * - resource: requested resource uri
 * - code_verifier: verifier to complete PKCE protocol
 * - extraQueryParameters: string to string map of custom query parameters
 * - authority: authority to request tokens from
 * - correlationId: custom correlationId given by user
 */
export type TokenExchangeParameters = ClientRequestParameters & {
    codeVerifier?: string;
};
