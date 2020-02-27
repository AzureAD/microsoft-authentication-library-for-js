/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import pkg from "../../package.json";
import { ScopeSet } from "../auth/ScopeSet";
import { TokenExchangeParameters } from "../request/TokenExchangeParameters";
import { CodeResponse } from "../response/CodeResponse";
import { ClientAuthError } from "../error/ClientAuthError";
import { ICrypto } from "../crypto/ICrypto";
import { StringUtils } from "../utils/StringUtils";
import { Constants, HEADER_NAMES, AADServerParamKeys } from "../utils/Constants";

/**
 * This class extends the ServerRequestParameters class. This class validates token request parameters and generates a form body and headers required for the request.
 */
export class ServerTokenRequestParameters {

    // Crypto functions
    private cryptoObj: ICrypto;

    // Telemetry Info
    xClientVer: string;
    xClientSku: string;
    correlationId: string;

    // Params
    clientId: string;
    scopes: ScopeSet;
    redirectUri: string;
    clientSecret: string;
    tokenRequest: TokenExchangeParameters;
    codeResponse: CodeResponse;
    refreshToken: string;

    constructor(clientId: string, clientSecret: string, tokenRequest: TokenExchangeParameters, codeResponse: CodeResponse, redirectUri: string, cryptoImpl: ICrypto, refreshToken?: string) {
        this.clientId = clientId;
        this.cryptoObj = cryptoImpl;
        this.redirectUri = redirectUri;

        // Telemetry Info
        this.xClientSku = Constants.LIBRARY_NAME;
        this.xClientVer = pkg.version;

        this.clientSecret = clientSecret;
        this.tokenRequest = tokenRequest;
        this.codeResponse = codeResponse;
        this.refreshToken = refreshToken;

        // Set scopes, always required for token request/exchange
        this.scopes = new ScopeSet(
            (this.tokenRequest && this.tokenRequest.scopes) || [], 
            this.clientId, 
            true
        );

        // Set correlation id
        this.correlationId = this.tokenRequest.correlationId || this.cryptoObj.createNewGuid();
    }

    /**
     * Creates headers required for token request.
     */
    createRequestHeaders(): Map<string, string> {
        const headers = new Map<string, string>();
        headers.set(HEADER_NAMES.CONTENT_TYPE, Constants.URL_FORM_CONTENT_TYPE);
        return headers;
    }

    /**
     * Creates string of parameters to send to server in request body.
     */
    createRequestBody(): string {
        const paramString = this.createParamString();
        return paramString.join("&");
    }

    /**
     * Helper creates an array of key value string pairs.
     */
    private createParamString(): Array<string> {
        const str: Array<string> = [];

        str.push(`${AADServerParamKeys.CLIENT_ID}=${encodeURIComponent(this.clientId)}`);
        str.push(`${AADServerParamKeys.SCOPE}=${encodeURIComponent(this.scopes.printScopes())}`);
        str.push(`${AADServerParamKeys.REDIRECT_URI}=${encodeURIComponent(this.redirectUri)}`);
        // If there is a code response or refresh token, push relevant variables. Throw error otherwise.
        if (this.codeResponse) {
            str.push(`${AADServerParamKeys.CODE}=${encodeURIComponent(this.codeResponse.code)}`);
            str.push(`${AADServerParamKeys.CODE_VERIFIER}=${encodeURIComponent(this.tokenRequest.codeVerifier)}`);
            str.push(`${AADServerParamKeys.GRANT_TYPE}=${Constants.CODE_GRANT_TYPE}`);
        } else if (!StringUtils.isEmpty(this.refreshToken)) {
            str.push(`${AADServerParamKeys.REFRESH_TOKEN}=${this.refreshToken}`);
            str.push(`${AADServerParamKeys.GRANT_TYPE}=${Constants.RT_GRANT_TYPE}`);
        } else {
            throw ClientAuthError.createTokenRequestCannotBeMadeError();
        }

        // Temporary until server allows CORS requests from browser without client secret
        str.push(`client_secret=${this.clientSecret}`);

        return str;
    }
}
