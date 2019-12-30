/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { ICrypto } from "../crypto/ICrypto";
import { ScopeSet } from "../auth/ScopeSet";
import { TokenExchangeParameters } from "../request/TokenExchangeParameters";
import { ProtocolUtils } from "../utils/ProtocolUtils";
import { Constants, HEADER_NAMES, AADServerParamKeys } from "../utils/Constants";
import { ServerRequestParameters } from "./ServerRequestParameters";

export class ServerTokenRequestParameters extends ServerRequestParameters {

    // Params
    tokenRequest: TokenExchangeParameters;

    constructor(clientId: string, tokenRequest: TokenExchangeParameters, redirectUri: string, cryptoImpl: ICrypto) {
        super(clientId, redirectUri, cryptoImpl);
        this.tokenRequest = tokenRequest;

        this.scopes = new ScopeSet(this.tokenRequest && this.tokenRequest.scopes, this.clientId, false);

        const randomGuid = this.cryptoObj.createNewGuid();
        this.state = ProtocolUtils.setRequestState(this.tokenRequest && this.tokenRequest.userRequestState, randomGuid);

        this.correlationId = this.tokenRequest.correlationId || this.cryptoObj.createNewGuid();
    }

    createRequestHeaders(): Map<string, string> {
        const headers = new Map<string, string>();
        headers.set(HEADER_NAMES.CONTENT_TYPE, Constants.URL_FORM_CONTENT_TYPE);
        return headers;
    }

    async createRequestBody(): Promise<string> {
        const paramString = await this.createParamString();
        return paramString.join("&");
    }

    protected async createParamString(): Promise<Array<string>> {
        const str: Array<string> = [];
        this.replaceDefaultScopes();

        str.push(`${AADServerParamKeys.CLIENT_ID}=${encodeURIComponent(this.clientId)}`);
        str.push(`${AADServerParamKeys.REDIRECT_URI}=${encodeURIComponent(this.redirectUri)}`);
        str.push(`${AADServerParamKeys.GRANT_TYPE}=${Constants.CODE_GRANT_TYPE}`);
        str.push(`${AADServerParamKeys.CODE}=${encodeURIComponent(this.tokenRequest.code)}`);
        str.push(`${AADServerParamKeys.CODE_VERIFIER}=${encodeURIComponent(this.tokenRequest.codeVerifier)}`);
        str.push(`${AADServerParamKeys.SCOPE}=${encodeURIComponent(this.scopes.printScopes())}`);
        str.push(`${AADServerParamKeys.STATE}=${encodeURIComponent(this.state)}`);

        // Temporary until server allows CORS requests from browser without client secret
        // str.push(`client_secret=`);

        return str;
    }
}
