/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { ICrypto } from "../crypto/ICrypto";
import { ScopeSet } from "../auth/ScopeSet";
import { TokenExchangeParameters } from "../request/TokenExchangeParameters";
import { Constants, HEADER_NAMES, AADServerParamKeys } from "../utils/Constants";
import { ServerRequestParameters } from "./ServerRequestParameters";
import { CodeResponse } from "../response/CodeResponse";
import { Account } from "../auth/Account";
import { StringUtils } from "../utils/StringUtils";
import { ClientAuthError } from "../error/ClientAuthError";

export class ServerTokenRequestParameters extends ServerRequestParameters {

    // Params
    tokenRequest: TokenExchangeParameters;
    codeResponse: CodeResponse;
    refreshToken: string;

    constructor(clientId: string, tokenRequest: TokenExchangeParameters, codeResponse: CodeResponse, redirectUri: string, cryptoImpl: ICrypto, refreshToken?: string) {
        super(clientId, redirectUri, cryptoImpl);
        this.tokenRequest = tokenRequest;
        this.codeResponse = codeResponse;
        this.refreshToken = refreshToken || "";

        this.scopes = new ScopeSet(this.tokenRequest && this.tokenRequest.scopes, this.clientId, true);

        this.correlationId = this.tokenRequest.correlationId || this.cryptoObj.createNewGuid();
    }

    createRequestHeaders(): Map<string, string> {
        const headers = new Map<string, string>();
        headers.set(HEADER_NAMES.CONTENT_TYPE, Constants.URL_FORM_CONTENT_TYPE);
        return headers;
    }

    createRequestBody(): string {
        const paramString = this.createParamString();
        return paramString.join("&");
    }

    private createParamString(): Array<string> {
        const str: Array<string> = [];

        str.push(`${AADServerParamKeys.CLIENT_ID}=${encodeURIComponent(this.clientId)}`);
        str.push(`${AADServerParamKeys.SCOPE}=${encodeURIComponent(this.scopes.printScopes())}`);
        str.push(`${AADServerParamKeys.REDIRECT_URI}=${encodeURIComponent(this.redirectUri)}`);
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
        str.push("client_secret=");

        return str;
    }
}
