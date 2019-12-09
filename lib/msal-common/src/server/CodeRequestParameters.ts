/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Authority } from "../auth/authority/Authority";
import { Account } from "../auth/Account";
import { AuthenticationParameters } from "../request/AuthenticationParameters";
import { ICrypto } from "../utils/crypto/ICrypto";
import { ScopeSet } from "../auth/ScopeSet";
import { StringUtils } from "../utils/StringUtils";
import { AuthApiType } from "../utils/Constants";
import pkg from "../../package.json";

export class CodeRequestParameters {
    
    // Crypto functions
    private cryptoObj: ICrypto;

    // Params
    authorityInstance: Authority;
    clientId: string;
    scopes: ScopeSet;
    responseType: string;
    redirectUri: string;
    userRequest: AuthenticationParameters;
    queryParameters: string;
    extraQueryParameters: string;
    
    // Validity checks
    state: string;

    // Telemetry Info
    xClientVer: string;
    xClientSku: string;
    correlationId: string;

    constructor(authority: Authority, clientId: string, userRequest: AuthenticationParameters, cachedAccount: Account, redirectUri: string, cryptoImpl: ICrypto, authApiType: AuthApiType) {
        this.authorityInstance = authority;
        this.clientId = clientId;
        this.cryptoObj = cryptoImpl;
        this.userRequest = userRequest;
        this.redirectUri = redirectUri;

        this.responseType = "code";

        this.scopes = new ScopeSet(this.userRequest.scopes, this.clientId, authApiType);
        if (authApiType === AuthApiType.LOGIN) {
            this.appendExtraScopes();
        }
        
        const randomGuid = this.cryptoObj.createNewGuid();
        this.state = userRequest.state && !StringUtils.isEmpty(userRequest.state) ? `${randomGuid}|${userRequest.state}` : randomGuid;

        this.correlationId = userRequest.correlationId || this.cryptoObj.createNewGuid();

        // Telemetry Info
        this.xClientSku = "MSAL.JS";
        this.xClientVer = pkg.version;
    }

    /**
     * Appends extraScopesToConsent if passed
     */
    private appendExtraScopes(): void {
        if (this.userRequest && this.scopes) {
            if (this.userRequest.extraScopesToConsent) {
                this.scopes.appendScopes(this.userRequest.extraScopesToConsent);
            }
        }
    }

    /**
     * Check to see if there are SSO params set in the Request
     * @param request
     */
    isSSOParam(account: Account) {
        const isSSORequest = this.userRequest && (this.userRequest.account || this.userRequest.sid || this.userRequest.loginHint);
        return account || isSSORequest;
    }
}
