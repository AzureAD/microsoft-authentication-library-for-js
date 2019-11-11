/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Authority } from "../../auth/authority/Authority";
import { MsalAccount } from "../../auth/MsalAccount";
import { AuthenticationParameters } from "../AuthenticationParameters";
import { ICrypto, PKCECodes } from "../../utils/crypto/ICrypto";
import { ServerRequestParameters } from "./ServerRequestParameters";

export class AuthCodeServerRequestParameters extends ServerRequestParameters {

    pkceCodes: PKCECodes;
    
    constructor(authority: Authority, 
        clientId: string, 
        request: AuthenticationParameters, 
        isLoginCall: boolean, 
        isSilentRequest: boolean, 
        cachedAccount: MsalAccount, 
        redirectUri: string,
        crypto: ICrypto) {
        super(authority, clientId, request, isLoginCall, isSilentRequest, cachedAccount, redirectUri, crypto);
    }

    protected async createParamString(): Promise<Array<string>> {
        const str: Array<string> = [];
        str.push("response_type=code");

        this.replaceDefaultScopes();
        str.push("scope=" + encodeURIComponent(this.scopes.printScopes()));
        str.push("client_id=" + encodeURIComponent(this.clientId));
        str.push("redirect_uri=" + encodeURIComponent(this.redirectUri));

        str.push("state=" + encodeURIComponent(this.state));
        // str.push("nonce=" + encodeURIComponent(this.nonce));

        str.push("client_info=1");
        str.push(`x-client-SKU=${this.xClientSku}`);
        str.push(`x-client-Ver=${this.xClientVer}`);

        this.pkceCodes = await this.crypto.generatePKCECodes();
        str.push(`code_challenge=${encodeURIComponent(this.pkceCodes.challenge)}`);
        str.push("code_challenge_method=S256");
        console.log(`PKCE Codes: ${JSON.stringify(this.pkceCodes)}`);

        if (this.request.prompt) {
            str.push("prompt=" + encodeURIComponent(this.request.prompt));
        }

        if (this.request.claimsRequest) {
            str.push("claims=" + encodeURIComponent(this.request.claimsRequest));
        }

        if (this.queryParameters) {
            str.push(this.queryParameters);
        }

        if (this.extraQueryParameters) {
            str.push(this.extraQueryParameters);
        }

        str.push("client-request-id=" + encodeURIComponent(this.correlationId));
        str.push("response_mode=fragment");
        return str;
    }
}
