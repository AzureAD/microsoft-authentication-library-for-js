/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Authority } from "./authority/Authority";
import { CryptoUtils } from "./utils/CryptoUtils";
import { AuthenticationParameters, validateClaimsRequest } from "./AuthenticationParameters";
import { StringDict } from "./MsalTypes";
import { Account } from "./Account";
import { SSOTypes, Constants, PromptState, BlacklistedEQParams, libraryVersion, ResponseTypes, InteractionType } from "./utils/Constants";
import { ClientConfigurationError } from "./error/ClientConfigurationError";
import { StringUtils } from "./utils/StringUtils";
import { ScopeSet } from "./ScopeSet";

/**
 * Nonce: OIDC Nonce definition: https://openid.net/specs/openid-connect-core-1_0.html#IDToken
 * State: OAuth Spec: https://tools.ietf.org/html/rfc6749#section-10.12
 * @hidden
 */
export class ServerRequestParameters {

    authRequest: AuthenticationParameters;
    isLoginCall: boolean;
    interactionType: InteractionType;

    authorityInstance: Authority;
    clientId: string;
    scopes: ScopeSet;
    account: Account;

    nonce: string;
    state: string;

    // telemetry information
    xClientVer: string;
    xClientSku: string;
    correlationId: string;

    responseType: string;
    redirectUri: string;

    promptValue: string;
    claimsValue: string;

    queryParameters: string;
    extraQueryParameters: string;

    public get authority(): string {
        return this.authorityInstance ? this.authorityInstance.CanonicalAuthority : null;
    }

    /**
     * Constructor
     * @param authority
     * @param clientId
     * @param request
     * @param cachedAccount
     * @param redirectUri
     * @param isLoginCall
     */
    constructor (authority: Authority, clientId: string, request: AuthenticationParameters, cachedAccount: Account, redirectUri: string, isLoginCall: boolean, interactionType: InteractionType) {
        this.authRequest = request;
        this.isLoginCall = isLoginCall;
        this.interactionType = interactionType;

        this.authorityInstance = authority;
        this.clientId = clientId;
        this.scopes = new ScopeSet(request.scopes, clientId, isLoginCall);
        this.account = (request && request.account && !isLoginCall) ? request.account : cachedAccount;

        // if extraScopesToConsent is passed in loginCall, append them to the login request
        if (isLoginCall && request.extraScopesToConsent) {
            this.scopes.appendExtraScopes(request.extraScopesToConsent);
        }

        this.nonce = CryptoUtils.createNewGuid();
        this.state = request.state && !StringUtils.isEmpty(request.state) ?  CryptoUtils.createNewGuid() + "|" + request.state   : CryptoUtils.createNewGuid();

        // TODO: Change this to user passed vs generated with the new PR
        this.correlationId = CryptoUtils.createNewGuid();

        // telemetry information
        this.xClientSku = "MSAL.JS";
        this.xClientVer = libraryVersion();

        this.responseType = isLoginCall ? ResponseTypes.id_token : this.scopes.getTokenType(Account.compareAccounts(request.account, cachedAccount), false);
        this.redirectUri = redirectUri;
    }

    /**
     * Check to see if there are SSO params set in the Request
     * @param request
     */
    isSSOParam() {
        return this.authRequest && (this.authRequest.account || this.authRequest.sid || this.authRequest.loginHint);
    }

    // #region QueryParam helpers

    /**
     * @hidden
     * @ignore
     *
     * Utility to populate QueryParameters and ExtraQueryParameters to ServerRequestParamerers
     * @param request
     * @param serverAuthenticationRequest
     */
    populateQueryParams(adalIdTokenObject?: any): void {
        let queryParameters: StringDict = {};

        if (this.authRequest) {
            // add the prompt parameter to serverRequestParameters if passed
            if (this.authRequest.prompt) {
                this.validatePromptParameter(this.authRequest.prompt);
                this.promptValue = this.authRequest.prompt;
            }

            // Add claims challenge to serverRequestParameters if passed
            if (this.authRequest.claimsRequest) {
                validateClaimsRequest(this.authRequest);
                this.claimsValue = this.authRequest.claimsRequest;
            }

            // if the developer provides one of these, give preference to developer choice
            if (this.isSSOParam()) {
                queryParameters = this.constructUnifiedCacheQueryParameter(this.authRequest, null);
            }
        }

        if (adalIdTokenObject) {
            queryParameters = this.constructUnifiedCacheQueryParameter(null, adalIdTokenObject);
        }

        // adds sid/login_hint if not populated; populates domain_req, login_req and domain_hint
        queryParameters = this.addHintParameters(this.account, queryParameters);
        // this.logger.verbose("Calling addHint parameters");

        // sanity check for developer passed extraQueryParameters
        let eQParams: StringDict;
        if (this.authRequest) {
            eQParams = this.sanitizeEQParams(this.authRequest);
        }

        // Populate the extraQueryParameters to be sent to the server
        this.queryParameters = this.generateQueryParametersString(queryParameters);
        this.extraQueryParameters = this.generateQueryParametersString(eQParams);
    }

    /**
     * @hidden
     * @ignore
     *
     * Utility to test if valid prompt value is passed in the request
     * @param request
     */
    private validatePromptParameter (prompt: string) {
        if (!([PromptState.LOGIN, PromptState.SELECT_ACCOUNT, PromptState.CONSENT, PromptState.NONE].indexOf(prompt) >= 0)) {
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
    private constructUnifiedCacheQueryParameter(request: AuthenticationParameters, idTokenObject: any): StringDict {

        // preference order: account > sid > login_hint
        let ssoType;
        let ssoData;
        let serverReqParam: StringDict = {};
        // if account info is passed, account.sid > account.login_hint
        if (request) {
            if (request.account) {
                const account: Account = request.account;
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
            else if (request.sid) {
                ssoType = SSOTypes.SID;
                ssoData = request.sid;
            }
            // loginHint from request
            else if (request.loginHint) {
                ssoType = SSOTypes.LOGIN_HINT;
                ssoData = request.loginHint;
            }
        }
        // adalIdToken retrieved from cache
        else if (idTokenObject) {
            if (idTokenObject.hasOwnProperty(Constants.upn)) {
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
        if (request && request.account && request.account.homeAccountIdentifier) {
            serverReqParam = this.addSSOParameter(SSOTypes.HOMEACCOUNT_ID, request.account.homeAccountIdentifier, serverReqParam);
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
    private addHintParameters(account: Account, qParams: StringDict): StringDict {
    /*
     * This is a final check for all queryParams added so far; preference order: sid > login_hint
     * sid cannot be passed along with login_hint or domain_hint, hence we check both are not populated yet in queryParameters
     */
        if (account && !qParams[SSOTypes.SID]) {
            // sid - populate only if login_hint is not already populated and the account has sid
            const populateSID = !qParams[SSOTypes.LOGIN_HINT] && account.sid && this.promptValue === PromptState.NONE;
            if (populateSID) {
                qParams = this.addSSOParameter(SSOTypes.SID, account.sid, qParams);
            }
            // login_hint - account.userName
            else {
                const populateLoginHint = !qParams[SSOTypes.LOGIN_HINT] && account.userName && !StringUtils.isEmpty(account.userName);
                if (populateLoginHint) {
                    qParams = this.addSSOParameter(SSOTypes.LOGIN_HINT, account.userName, qParams);
                }
            }

            const populateReqParams = !qParams[SSOTypes.DOMAIN_REQ] && !qParams[SSOTypes.LOGIN_REQ];
            if (populateReqParams) {
                qParams = this.addSSOParameter(SSOTypes.HOMEACCOUNT_ID, account.homeAccountIdentifier, qParams);
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

                if (utid === Constants.consumersUtid) {
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
            delete eQParams[Constants.claims];
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

    // #endregion

    /**
     * generates the URL with QueryString Parameters
     * @param scopes
     */
    createNavigateUrl(): string {
        const str = this.createNavigationUrlString();
        let authEndpoint: string = this.authorityInstance.AuthorizationEndpoint;
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
     * Generate the array of all QueryStringParams to be sent to the server
     * @param scopes
     */
    createNavigationUrlString(): Array<string> {
        if (!this.scopes.containsScope(this.clientId)) {
            this.scopes.appendExtraScope(this.clientId);
        }
        const str: Array<string> = [];
        str.push("response_type=" + this.responseType);

        this.appendDefaultScopes();
        str.push("scope=" + encodeURIComponent(this.scopes.printScopes()));
        str.push("client_id=" + encodeURIComponent(this.clientId));
        str.push("redirect_uri=" + encodeURIComponent(this.redirectUri));

        str.push("state=" + encodeURIComponent(this.state));
        str.push("nonce=" + encodeURIComponent(this.nonce));

        str.push("client_info=1");
        str.push(`x-client-SKU=${this.xClientSku}`);
        str.push(`x-client-Ver=${this.xClientVer}`);
        if (this.promptValue) {
            str.push("prompt=" + encodeURIComponent(this.promptValue));
        }

        if (this.claimsValue) {
            str.push("claims=" + encodeURIComponent(this.claimsValue));
        }

        if (this.queryParameters) {
            str.push(this.queryParameters);
        }

        if (this.extraQueryParameters) {
            str.push(this.extraQueryParameters);
        }

        str.push("client-request-id=" + encodeURIComponent(this.correlationId));
        return str;
    }

    /**
     * append the required scopes: https://openid.net/specs/openid-connect-basic-1_0.html#Scopes
     * @param scopes
     */
    private appendDefaultScopes(): void {
        if (!this.scopes.containsScope("openid")) {
            this.scopes.appendExtraScope("openid");
        }
        if (!this.scopes.containsScope("profile")) {
            this.scopes.appendExtraScope("profile");
        }
    }
}
