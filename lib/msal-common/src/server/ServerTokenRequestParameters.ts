/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import pkg from "../../package.json";
import { ICrypto } from "../crypto/ICrypto";
import { ScopeSet } from "../auth/ScopeSet";
import { TokenExchangeParameters } from "../request/TokenExchangeParameters";
import { ProtocolUtils } from "../utils/ProtocolUtils";
import { Constants, HEADER_NAMES, AADServerParamKeys } from "../utils/Constants";

export class ServerTokenRequestParameters {

    // Crypto functions
    private cryptoObj: ICrypto;

    // Params
    private clientId: string;
    private scopes: ScopeSet;
    private redirectUri: string;
    private tokenRequest: TokenExchangeParameters;

    // Validity checks
    private state: string;

    // Telemetry Info
    xClientVer: string;
    xClientSku: string;
    correlationId: string;

    constructor(clientId: string, tokenRequest: TokenExchangeParameters, redirectUri: string, cryptoImpl: ICrypto) {
        this.cryptoObj = cryptoImpl;
        this.clientId = clientId;
        this.redirectUri = redirectUri;
        this.tokenRequest = tokenRequest;

        this.scopes = new ScopeSet(this.tokenRequest && this.tokenRequest.scopes, this.clientId, false);

        const randomGuid = this.cryptoObj.createNewGuid();
        this.state = ProtocolUtils.setRequestState(this.tokenRequest && this.tokenRequest.userRequestState, randomGuid);

        // Telemetry Info
        this.xClientSku = Constants.LIBRARY_NAME;
        this.xClientVer = pkg.version;
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
        this.replaceDefaultScopes();

        str.push(`${AADServerParamKeys.CLIENT_ID}=${encodeURIComponent(this.clientId)}`);
        str.push(`${AADServerParamKeys.REDIRECT_URI}=${encodeURIComponent(this.redirectUri)}`);
        str.push(`${AADServerParamKeys.GRANT_TYPE}=${Constants.CODE_GRANT_TYPE}`);
        str.push(`${AADServerParamKeys.CODE}=${encodeURIComponent(this.tokenRequest.code)}`);
        str.push(`${AADServerParamKeys.CODE_VERIFIER}=${encodeURIComponent(this.tokenRequest.codeVerifier)}`);
        str.push(`${AADServerParamKeys.SCOPE}=${encodeURIComponent(this.scopes.printScopes())}`);
        str.push(`${AADServerParamKeys.STATE}=${encodeURIComponent(this.state)}`);

        // Temporary until server allows CORS requests from browser without client secret
        str.push(`client_secret=${encodeURIComponent("6HKmct7Jd7sZG@8phyJA/RJFVlwBq-/R")}`);

        return str;
    }

    protected replaceDefaultScopes() {
        if (this.scopes.containsScope(this.clientId)) {
            this.scopes.removeScope(this.clientId);
            this.scopes.appendScope(Constants.OPENID_SCOPE);
            this.scopes.appendScope(Constants.PROFILE_SCOPE);
        }
        this.scopes.appendScope(Constants.OFFLINE_ACCESS_SCOPE);
    }
}
