/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ServerRequestParameters } from "./ServerRequestParameters";
import { Authority } from "../../auth/authority/Authority";
import { MsalAccount } from "../../auth/MsalAccount";
import { ICrypto } from "../../utils/crypto/ICrypto";
import { ClientAuthError } from "../../error/ClientAuthError";
import { TokenExchangeParameters } from "../TokenExchangeParameters";
import { Constants } from "../../utils/Constants";

export class ACTokenExchangeServerRequestParameters extends ServerRequestParameters {

    request: TokenExchangeParameters;
    clientSecret: string;

    constructor(authority: Authority, 
        clientId: string, 
        clientSecret: string,
        request: TokenExchangeParameters, 
        isLoginCall: boolean, 
        isSilentRequest: boolean, 
        cachedAccount: MsalAccount, 
        redirectUri: string,
        crypto: ICrypto) {
        super(authority, clientId, request, isLoginCall, isSilentRequest, cachedAccount, redirectUri, crypto);
        this.clientSecret = clientSecret;
    }

    async createNavigateUrl(): Promise<string> {
        throw ClientAuthError.createUnexpectedError("createNavigateUrl is not supported for token exchange. Please call createRequestBody().");
    }

    async createRequestBody(): Promise<string> {
        const params = await this.createParamString();
        return params.join("&");
    }

    protected async createParamString(): Promise<Array<string>> {
        const str: Array<string> = [];
        const grantType = "authorization_code";
        this.replaceDefaultScopes();

        str.push(`client_id=${encodeURIComponent(this.clientId)}`);
        str.push(`redirect_uri=${encodeURIComponent(this.redirectUri)}`);
        str.push(`grant_type=${grantType}`);
        str.push(`scope=${encodeURIComponent(this.scopes.printScopes())}`);
        str.push(`code=${encodeURIComponent(this.request.code)}`);
        str.push(`code_verifier=${encodeURIComponent(this.request.codeVerifier)}`);
        str.push(`client_secret=${encodeURIComponent(this.clientSecret)}`);
        str.push(`state=${encodeURIComponent(this.state)}`);
        return str;
    }

    protected replaceDefaultScopes() {
        if (this.scopes.containsScope(this.clientId)) {
            super.replaceDefaultScopes();
        }
        this.scopes.appendScope(Constants.OFFLINE_ACCESS_SCOPE);
    }
}
