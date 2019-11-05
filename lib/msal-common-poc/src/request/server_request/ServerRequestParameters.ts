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

export class ServerRequestParameters {

    // Params
    authorityInstance: Authority;
    clientId: string;
    scopes: ScopeSet;
    responseType: string;
    redirectUri: string;
    request: AuthenticationParameters;
    queryParameters: string;
    extraQueryParameters: string;

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
        this.responseType = this.getResponseType(cachedAccount, isLoginCall, isSilentRequest);
        this.redirectUri = redirectUri;

        this.nonce = CryptoUtils.createNewGuid();
        this.state = request.state && !StringUtils.isEmpty(this.state) ? `${CryptoUtils.createNewGuid()}|${this.state}` : CryptoUtils.createNewGuid();
    
        // TODO: Change this to user passed vs generated with separate PR
        this.correlationId = CryptoUtils.createNewGuid();

        // telemetry information
        this.xClientSku = "MSAL.JS";
        // TODO: Add package.json import
        this.xClientVer = "0.1.0";
    }

    /**
     * @ignore
     * Appends extraScopesToConsent if passed
     * @param {@link AuthenticationParameters}
     */
    appendExtraScopes(): void {
        if (this.request && this.scopes) {
            if (this.request.extraScopesToConsent) {
                this.scopes.appendScopes(this.request.extraScopesToConsent);
            }
        }
    }

    /**
     * Check to see if there are SSO params set in the Request
     * @param request
     */
    isSSOParam(account: MsalAccount) {
        const isSSORequest = this.request && (this.request.account || this.request.sid || this.request.loginHint);
        return account || isSSORequest;
    }

    /**
     * @hidden
     * @ignore
     * 
     * Utility to populate QueryParameters and ExtraQueryParameters to ServerRequestParamerers
     * @param adalIdTokenObject 
     */
    populateQueryParams(adalIdTokenObject?: any): void {
        let queryParameters: StringDict = {};

        if (this.request) {
            // add the prompt parameter to serverRequestParameters if passed
            if (this.request.prompt) {
                this.validatePromptParameter(this.request.prompt);
            }

            // Add claims challenge to serverRequestParameters if passed
            if (this.request.claimsRequest) {
                validateClaimsRequest(this.request);
            }

            // if the developer provides one of these, give preference to developer choice
            if (this.isSSOParam(this.request.account)) {
                queryParameters = this.constructUnifiedCacheQueryParameter(null);
            }
        }

        if (adalIdTokenObject) {
            queryParameters = this.constructUnifiedCacheQueryParameter(adalIdTokenObject);
        }

        /*
         * adds sid/login_hint if not populated; populates domain_req, login_req and domain_hint
         * this.logger.verbose("Calling addHint parameters");
         */
        queryParameters = this.addHintParameters(queryParameters);

        // sanity check for developer passed extraQueryParameters
        let eQParams: StringDict;
        if (this.request) {
            eQParams = this.sanitizeEQParams(this.request);
        }

        // Populate the extraQueryParameters to be sent to the server
        this.queryParameters = this.generateQueryParametersString(queryParameters);
        this.extraQueryParameters = this.generateQueryParametersString(eQParams);
    }

    createNavigateUrl(): string {
        const str = this.createNavigationUrlString();
        console.log("Nav Url String: " + str);
        let authEndpoint: string = this.authorityInstance.authorizationEndpoint;
        // if the endpoint already has queryparams, lets add to it, otherwise add the first one
        if (authEndpoint.indexOf("?") < 0) {
            authEndpoint += "?";
        } else {
            authEndpoint += "&";
        }

        const requestUrl: string = `${authEndpoint}${str.join("&")}`;
        return requestUrl;
    }

    private createNavigationUrlString(): Array<string> {
        const str: Array<string> = [];
        str.push("response_type=" + this.responseType);

        this.replaceDefaultScopes();
        str.push("scope=" + encodeURIComponent(this.scopes.printScopes()));
        str.push("client_id=" + encodeURIComponent(this.clientId));
        str.push("redirect_uri=" + encodeURIComponent(this.redirectUri));

        str.push("state=" + encodeURIComponent(this.state));
        str.push("nonce=" + encodeURIComponent(this.nonce));

        str.push("client_info=1");
        str.push(`x-client-SKU=${this.xClientSku}`);
        str.push(`x-client-Ver=${this.xClientVer}`);
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

    private replaceDefaultScopes() {
        if (this.scopes.containsScope(this.clientId)) {
            this.scopes.removeScope(this.clientId);
            this.scopes.appendScope(Constants.OPENID_SCOPE);
            this.scopes.appendScope(Constants.PROFILE_SCOPE);
        }
    }

    /**
     * @hidden
     * @ignore
     *
     * Utility to test if valid prompt value is passed in the request
     * @param request
     */
    private validatePromptParameter (prompt: string) {
        if ([PromptState.LOGIN, PromptState.SELECT_ACCOUNT, PromptState.CONSENT, PromptState.NONE].indexOf(prompt) < 0) {
            console.log("prompt err");
            throw ClientConfigurationError.createInvalidPromptError(prompt);
        }
    }

    /**
     * Helper to get response type of request parameters.
     * @param matchingAccount 
     * @param silentCall 
     */
    private getResponseType(cachedAccount: MsalAccount, isLoginCall: boolean, silentCall: boolean) {
        const matchingAccount = MsalAccount.compareAccounts(this.request.account, cachedAccount);
        // if account is passed and matches the account object set to getAccount() from cache
        if (!matchingAccount || !this.request.account || !cachedAccount) {
            return silentCall && isLoginCall ? ResponseTypes.id_token : ResponseTypes.id_token_token;
        } else {
            return isLoginCall ? ResponseTypes.id_token : ResponseTypes.token;
        }
    }

    /**
     * Constructs extraQueryParameters to be sent to the server for the AuthenticationParameters set by the developer
     * in any login() or acquireToken() calls
     * @param idTokenObject
     * @param extraQueryParameters
     * @param sid
     * @param loginHint
     */
    // TODO: check how this behaves when domain_hint only is sent in extraparameters and idToken has no upn.
    private constructUnifiedCacheQueryParameter(idTokenObject: any): StringDict {

        // preference order: account > sid > login_hint
        let ssoType;
        let ssoData;
        let serverReqParam: StringDict = {};
        // if account info is passed, account.sid > account.login_hint
        if (this.request) {
            if (this.request.account) {
                const account: MsalAccount = this.request.account;
                if (account.sid) {
                    ssoType = SSOTypes.SID;
                    ssoData = account.sid;
                }
                else if (account.userName) {
                    ssoType = SSOTypes.LOGIN_HINT;
                    ssoData = account.userName;
                }
            }
            // sid from request
            else if (this.request.sid) {
                ssoType = SSOTypes.SID;
                ssoData = this.request.sid;
            }
            // loginHint from request
            else if (this.request.loginHint) {
                ssoType = SSOTypes.LOGIN_HINT;
                ssoData = this.request.loginHint;
            }
        }
        // adalIdToken retrieved from cache
        else if (idTokenObject) {
            if (idTokenObject.hasOwnProperty(Constants.UPN)) {
                ssoType = SSOTypes.ID_TOKEN;
                ssoData = idTokenObject.upn;
            }
            else {
                ssoType = SSOTypes.ORGANIZATIONS;
                ssoData = null;
            }
        }

        serverReqParam = this.addSSOParameter(ssoType, ssoData);

        // add the HomeAccountIdentifier info/ domain_hint
        if (this.request && this.request.account && this.request.account.homeAccountIdentifier) {
            serverReqParam = this.addSSOParameter(SSOTypes.HOMEACCOUNT_ID, this.request.account.homeAccountIdentifier, serverReqParam);
        }

        return serverReqParam;
    }

    /**
     * @hidden
     *
     * Adds login_hint to authorization URL which is used to pre-fill the username field of sign in page for the user if known ahead of time
     * domain_hint can be one of users/organizations which when added skips the email based discovery process of the user
     * domain_req utid received as part of the clientInfo
     * login_req uid received as part of clientInfo
     * Also does a sanity check for extraQueryParameters passed by the user to ensure no repeat queryParameters
     *
     * @param {@link Account} account - Account for which the token is requested
     * @param queryparams
     * @param {@link ServerRequestParameters}
     * @ignore
     */
    private addHintParameters(qParams: StringDict): StringDict {
        /*
         * This is a final check for all queryParams added so far; preference order: sid > login_hint
         * sid cannot be passed along with login_hint or domain_hint, hence we check both are not populated yet in queryParameters
         */
        if (this.request.account && !qParams[SSOTypes.SID]) {
            // sid - populate only if login_hint is not already populated and the account has sid
            const populateSID = !qParams[SSOTypes.LOGIN_HINT] && this.request.account.sid && this.request.prompt === PromptState.NONE;
            if (populateSID) {
                qParams = this.addSSOParameter(SSOTypes.SID, this.request.account.sid, qParams);
            }
            // login_hint - account.userName
            else {
                const populateLoginHint = !qParams[SSOTypes.LOGIN_HINT] && this.request.account.userName && !StringUtils.isEmpty(this.request.account.userName);
                if (populateLoginHint) {
                    qParams = this.addSSOParameter(SSOTypes.LOGIN_HINT, this.request.account.userName, qParams);
                }
            }

            const populateReqParams = !qParams[SSOTypes.DOMAIN_REQ] && !qParams[SSOTypes.LOGIN_REQ];
            if (populateReqParams) {
                qParams = this.addSSOParameter(SSOTypes.HOMEACCOUNT_ID, this.request.account.homeAccountIdentifier, qParams);
            }
        }

        return qParams;
    }

    /**
     * Add SID to extraQueryParameters
     * @param sid
     */
    private addSSOParameter(ssoType: string, ssoData: string, ssoParam?: StringDict): StringDict {
        if (!ssoParam) {
            ssoParam = {};
        }

        if (!ssoData) {
            return ssoParam;
        }

        switch (ssoType) {
            case SSOTypes.SID: {
                ssoParam[SSOTypes.SID] = ssoData;
                break;
            }
            case SSOTypes.ID_TOKEN: {
                ssoParam[SSOTypes.LOGIN_HINT] = ssoData;
                ssoParam[SSOTypes.DOMAIN_HINT] = SSOTypes.ORGANIZATIONS;
                break;
            }
            case SSOTypes.LOGIN_HINT: {
                ssoParam[SSOTypes.LOGIN_HINT] = ssoData;
                break;
            }
            case SSOTypes.ORGANIZATIONS: {
                ssoParam[SSOTypes.DOMAIN_HINT] = SSOTypes.ORGANIZATIONS;
                break;
            }
            case SSOTypes.CONSUMERS: {
                ssoParam[SSOTypes.DOMAIN_HINT] = SSOTypes.CONSUMERS;
                break;
            }
            case SSOTypes.HOMEACCOUNT_ID: {
                const homeAccountId = ssoData.split(".");
                const uid = CryptoUtils.base64Decode(homeAccountId[0]);
                const utid = CryptoUtils.base64Decode(homeAccountId[1]);

                // TODO: domain_req and login_req are not needed according to eSTS team
                ssoParam[SSOTypes.LOGIN_REQ] = uid;
                ssoParam[SSOTypes.DOMAIN_REQ] = utid;

                if (utid === Constants.CONSUMER_UTID) {
                    ssoParam[SSOTypes.DOMAIN_HINT] = SSOTypes.CONSUMERS;
                }
                else {
                    ssoParam[SSOTypes.DOMAIN_HINT] = SSOTypes.ORGANIZATIONS;
                }
                break;
            }
            case SSOTypes.LOGIN_REQ: {
                ssoParam[SSOTypes.LOGIN_REQ] = ssoData;
                break;
            }
            case SSOTypes.DOMAIN_REQ: {
                ssoParam[SSOTypes.DOMAIN_REQ] = ssoData;
                break;
            }
        }

        return ssoParam;
    }

    /**
     * @hidden
     * @ignore
     * Removes unnecessary or duplicate query parameters from extraQueryParameters
     * @param request
     */
    private sanitizeEQParams(request: AuthenticationParameters) : StringDict {
        const eQParams : StringDict = request.extraQueryParameters;
        if (!eQParams) {
            return null;
        }
        if (request.claimsRequest) {
            // this.logger.warning("Removed duplicate claims from extraQueryParameters. Please use either the claimsRequest field OR pass as extraQueryParameter - not both.");
            delete eQParams[Constants.CLAIMS];
        }
        BlacklistedEQParams.forEach(param => {
            if (eQParams[param]) {
                // this.logger.warning("Removed duplicate " + param + " from extraQueryParameters. Please use the " + param + " field in request object.");
                delete eQParams[param];
            }
        });
        return eQParams;
    }

    /**
     * Utility to generate a QueryParameterString from a Key-Value mapping of extraQueryParameters passed
     * @param extraQueryParameters
     */
    private generateQueryParametersString(queryParameters: StringDict): string {
        let paramsString: string = null;

        if (queryParameters) {
            Object.keys(queryParameters).forEach((key: string) => {
                if (paramsString == null) {
                    paramsString = `${key}=${encodeURIComponent(queryParameters[key])}`;
                }
                else {
                    paramsString += `&${key}=${encodeURIComponent(queryParameters[key])}`;
                }
            });
        }

        return paramsString;
    }
}
