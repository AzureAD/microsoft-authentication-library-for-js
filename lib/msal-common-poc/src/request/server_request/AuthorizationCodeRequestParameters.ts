/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Authority } from "../../auth/authority/Authority";
import { MsalAccount } from "../../auth/MsalAccount";
import { AuthenticationParameters, validateClaimsRequest } from "../AuthenticationParameters";
import { CryptoUtils } from "../../utils/CryptoUtils";
import { StringUtils } from "../../utils/StringUtils";
import { ResponseTypes, PromptState, SSOTypes, BlacklistedEQParams, Constants } from "../../utils/Constants";
import { ScopeSet } from "../../auth/ScopeSet";
import { StringDict } from "../../app/MsalTypes";
import { ClientConfigurationError } from "../../error/ClientConfigurationError";

export class AuthorizationCodeRequestParameters {
    // Params
    authorityInstance: Authority;
    clientId: string;
    scopes: ScopeSet;
    responseType: string;
    redirectUri: string;
    request: AuthenticationParameters;
    queryParameters: string;
    extraQueryParameters: string;
    codeChallenge: string;

    // Validity checks
    nonce: string;
    state: string;

    // telemetry info
    xClientVer: string;
    xClientSku: string;
    correlationId: string;

    constructor(authority: Authority, clientId: string, request: AuthenticationParameters, isLoginCall: boolean, isSilentRequest: boolean, cachedAccount: MsalAccount, redirectUri: string) {
        this.authorityInstance = authority;
        this.clientId = clientId;

        this.scopes = new ScopeSet(request.scopes, clientId, !isLoginCall);

        this.request = request;
        // this.responseType = this.getResponseType(cachedAccount, isLoginCall, isSilentRequest);
        this.redirectUri = redirectUri;
        // this.codeChallenge = codeChallenge;

        this.nonce = CryptoUtils.createNewGuid();
        this.state = request.state && !StringUtils.isEmpty(this.state) ? `${CryptoUtils.createNewGuid()}|${this.state}` : CryptoUtils.createNewGuid();
    
        // TODO: Change this to user passed vs generated with separate PR
        this.correlationId = CryptoUtils.createNewGuid();

        // telemetry information
        this.xClientSku = "MSAL.JS";
        // TODO: Add package.json import
        this.xClientVer = "0.1.0";
    }
}
