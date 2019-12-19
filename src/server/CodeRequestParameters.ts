/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Authority } from "../auth/authority/Authority";
import { Account } from "../auth/Account";
import { AuthenticationParameters, validateClaimsRequest } from "../request/AuthenticationParameters";
import { ICrypto } from "../crypto/ICrypto";
import { ScopeSet } from "../auth/ScopeSet";
import { StringUtils } from "../utils/StringUtils";
import pkg from "../../package.json";
import { StringDict } from "../utils/MsalTypes";
import { Constants, BlacklistedEQParams, SSOTypes, PromptState } from "../utils/Constants";
import { ClientConfigurationError } from "../error/ClientConfigurationError";

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

    constructor(authority: Authority, clientId: string, userRequest: AuthenticationParameters, redirectUri: string, cryptoImpl: ICrypto, isLoginCall: boolean) {
        this.authorityInstance = authority;
        this.clientId = clientId;
        this.cryptoObj = cryptoImpl;
        this.userRequest = userRequest;
        this.redirectUri = redirectUri;

        this.responseType = "code";

        this.scopes = new ScopeSet(this.userRequest.scopes, this.clientId, isLoginCall);
        if (this.scopes.isLoginScopeSet()) {
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

    /**
     * @hidden
     * @ignore
     * 
     * Utility to populate QueryParameters and ExtraQueryParameters to ServerRequestParamerers
     * @param adalIdTokenObject 
     */
    populateQueryParams(adalIdTokenObject?: any): void {
        let queryParameters: StringDict = {};

        if (this.userRequest) {
            // add the prompt parameter to serverRequestParameters if passed
            if (this.userRequest.prompt) {
                this.validatePromptParameter(this.userRequest.prompt);
            }

            // Add claims challenge to serverRequestParameters if passed
            if (this.userRequest.claimsRequest) {
                validateClaimsRequest(this.userRequest);
            }

            // if the developer provides one of these, give preference to developer choice
            if (this.isSSOParam(this.userRequest.account)) {
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
        if (this.userRequest) {
            eQParams = this.sanitizeEQParams(this.userRequest);
        }

        // Populate the extraQueryParameters to be sent to the server
        this.queryParameters = this.generateQueryParametersString(queryParameters);
        this.extraQueryParameters = this.generateQueryParametersString(eQParams);
    }

    /**
     * Create navigation url.
     */
    async createNavigateUrl(): Promise<string> {
        const str = await this.createParamString();
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

    /**
     * Create a query parameter string.
     */
    private async createParamString(): Promise<Array<string>> {
        const str: Array<string> = [];
        str.push(`response_type=${this.responseType}`);

        this.replaceDefaultScopes();
        str.push("scope=" + encodeURIComponent(this.scopes.printScopes()));
        str.push("client_id=" + encodeURIComponent(this.clientId));
        str.push("redirect_uri=" + encodeURIComponent(this.redirectUri));

        str.push("state=" + encodeURIComponent(this.state));
        // str.push("nonce=" + encodeURIComponent(this.nonce));

        str.push("client_info=1");
        str.push(`x-client-SKU=${this.xClientSku}`);
        str.push(`x-client-Ver=${this.xClientVer}`);

        const pkceCodes = await this.cryptoObj.generatePkceCodes();
        str.push(`code_challenge=${encodeURIComponent(pkceCodes.challenge)}`);
        str.push("code_challenge_method=S256");
        console.log(`PKCE Codes: ${JSON.stringify(pkceCodes)}`);

        if (this.userRequest.prompt) {
            str.push("prompt=" + encodeURIComponent(this.userRequest.prompt));
        }

        if (this.userRequest.claimsRequest) {
            str.push("claims=" + encodeURIComponent(this.userRequest.claimsRequest));
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

    /**
     * Replace client id with the default scopes used for token acquisition.
     */
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
            throw ClientConfigurationError.createInvalidPromptError(prompt);
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
        if (this.userRequest) {
            if (this.userRequest.account) {
                const account: Account = this.userRequest.account;
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
            else if (this.userRequest.sid) {
                ssoType = SSOTypes.SID;
                ssoData = this.userRequest.sid;
            }
            // loginHint from request
            else if (this.userRequest.loginHint) {
                ssoType = SSOTypes.LOGIN_HINT;
                ssoData = this.userRequest.loginHint;
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
        if (this.userRequest && this.userRequest.account && this.userRequest.account.homeAccountIdentifier) {
            serverReqParam = this.addSSOParameter(SSOTypes.HOMEACCOUNT_ID, this.userRequest.account.homeAccountIdentifier, serverReqParam);
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
        if (this.userRequest.account && !qParams[SSOTypes.SID]) {
            // sid - populate only if login_hint is not already populated and the account has sid
            const populateSID = !qParams[SSOTypes.LOGIN_HINT] && this.userRequest.account.sid && this.userRequest.prompt === PromptState.NONE;
            if (populateSID) {
                qParams = this.addSSOParameter(SSOTypes.SID, this.userRequest.account.sid, qParams);
            }
            // login_hint - account.userName
            else {
                const populateLoginHint = !qParams[SSOTypes.LOGIN_HINT] && this.userRequest.account.userName && !StringUtils.isEmpty(this.userRequest.account.userName);
                if (populateLoginHint) {
                    qParams = this.addSSOParameter(SSOTypes.LOGIN_HINT, this.userRequest.account.userName, qParams);
                }
            }

            const populateReqParams = !qParams[SSOTypes.DOMAIN_REQ] && !qParams[SSOTypes.LOGIN_REQ];
            if (populateReqParams) {
                qParams = this.addSSOParameter(SSOTypes.HOMEACCOUNT_ID, this.userRequest.account.homeAccountIdentifier, qParams);
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
                const uid = this.cryptoObj.base64Decode(homeAccountId[0]);
                const utid = this.cryptoObj.base64Decode(homeAccountId[1]);

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
