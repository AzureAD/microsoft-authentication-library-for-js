/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Authority } from "../auth/authority/Authority";
import { Account } from "../auth/Account";
import { AuthenticationParameters, validateClaimsRequest } from "../request/AuthenticationParameters";
import { ICrypto, PkceCodes } from "../crypto/ICrypto";
import { ScopeSet } from "../auth/ScopeSet";
import { StringUtils } from "../utils/StringUtils";
import { StringDict } from "../utils/MsalTypes";
import { Constants, BlacklistedEQParams, SSOTypes, PromptState, AADServerParamKeys } from "../utils/Constants";
import { ClientConfigurationError } from "../error/ClientConfigurationError";
import { ProtocolUtils } from "../utils/ProtocolUtils";
import { ServerRequestParameters } from "./ServerRequestParameters";
import { IdToken } from "../auth/IdToken";

export class ServerCodeRequestParameters extends ServerRequestParameters {

    // Params
    authorityInstance: Authority;
    responseType: string;
    userRequest: AuthenticationParameters;
    queryParameters: string;
    extraQueryParameters: string;

    // Generated Params
    generatedPkce: PkceCodes;
    
    // Validity checks
    nonce: string;

    // Account
    account: Account;

    constructor(authority: Authority, clientId: string, userRequest: AuthenticationParameters, cachedAccount: Account, redirectUri: string, cryptoImpl: ICrypto, isLoginCall: boolean) {
        super(clientId, redirectUri, cryptoImpl);
        this.authorityInstance = authority;
        this.userRequest = userRequest;
        this.responseType = Constants.CODE_RESPONSE_TYPE;
        this.account = (userRequest && userRequest.account) || cachedAccount;

        this.scopes = new ScopeSet(this.userRequest && this.userRequest.scopes, this.clientId, !isLoginCall);
        if (this.scopes.isLoginScopeSet()) {
            this.appendExtraScopes();
        }

        const randomGuid = this.cryptoObj.createNewGuid();
        this.state = ProtocolUtils.setRequestState(this.userRequest && this.userRequest.userRequestState, randomGuid);
        this.nonce = this.cryptoObj.createNewGuid();

        this.correlationId = this.userRequest.correlationId || this.cryptoObj.createNewGuid();
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
    isSSOParam(): boolean {
        const isSSORequest = this.userRequest && (this.account || this.userRequest.sid || this.userRequest.loginHint);
        return !!this.account || !!isSSORequest;
    }

    /**
     * @hidden
     * @ignore
     * 
     * Utility to populate QueryParameters and ExtraQueryParameters to ServerRequestParamerers
     * @param adalIdTokenObject 
     */
    populateQueryParams(adalIdTokenObject?: IdToken): void {
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
            if (this.isSSOParam()) {
                queryParameters = this.constructUnifiedCacheQueryParameter(null);
            }
        }

        // ADAL token SSO
        if (adalIdTokenObject) {
            queryParameters = this.constructUnifiedCacheQueryParameter(adalIdTokenObject);
        }

        /*
         * adds sid/login_hint if not populated; populates domain_hint
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
    protected async createParamString(): Promise<Array<string>> {
        const str: Array<string> = [];
        str.push(`${AADServerParamKeys.RESPONSE_TYPE}=${this.responseType}`);
        str.push(`${AADServerParamKeys.SCOPE}=${encodeURIComponent(this.scopes.printScopes())}`);
        str.push(`${AADServerParamKeys.CLIENT_ID}=${encodeURIComponent(this.clientId)}`);
        str.push(`${AADServerParamKeys.REDIRECT_URI}=${encodeURIComponent(this.redirectUri)}`);

        str.push(`${AADServerParamKeys.STATE}=${encodeURIComponent(this.state)}`);
        str.push(`${AADServerParamKeys.NONCE}=${encodeURIComponent(this.nonce)}`);

        str.push(`${AADServerParamKeys.CLIENT_INFO}=1`);
        str.push(`${AADServerParamKeys.X_CLIENT_SKU}=${this.xClientSku}`);
        str.push(`${AADServerParamKeys.X_CLIENT_VER}=${this.xClientVer}`);

        this.generatedPkce = await this.cryptoObj.generatePkceCodes();
        str.push(`${AADServerParamKeys.CODE_CHALLENGE}=${encodeURIComponent(this.generatedPkce.challenge)}`);
        str.push(`${AADServerParamKeys.CODE_CHALLENGE_METHOD}=${Constants.S256_CODE_CHALLENGE_METHOD}`);

        if (this.userRequest && this.userRequest.resource) {
            str.push(`${AADServerParamKeys.RESOURCE}=${encodeURIComponent(this.userRequest.resource)}`);
        }

        if (this.userRequest && this.userRequest.prompt) {
            str.push(`${AADServerParamKeys.PROMPT}=${(encodeURIComponent(this.userRequest.prompt))}`);
        }

        if (this.userRequest && this.userRequest.claimsRequest) {
            str.push(`${AADServerParamKeys.CLAIMS}=${encodeURIComponent(this.userRequest.claimsRequest)}`);
        }

        if (this.queryParameters) {
            str.push(this.queryParameters);
        }

        if (this.extraQueryParameters) {
            str.push(this.extraQueryParameters);
        }

        str.push(`${AADServerParamKeys.CLIENT_REQUEST_ID}=${encodeURIComponent(this.correlationId)}`);
        str.push(`${AADServerParamKeys.RESPONSE_MODE}=${Constants.FRAGMENT_RESPONSE_MODE}`);
        return str;
    }

    /**
     * @hidden
     * @ignore
     *
     * Utility to test if valid prompt value is passed in the request
     * @param request
     */
    private validatePromptParameter(prompt: string): void {
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
    private constructUnifiedCacheQueryParameter(idTokenObject: IdToken): StringDict {

        // preference order: account > sid > login_hint
        let ssoType;
        let ssoData;
        let serverReqParam: StringDict = {};
        // if account info is passed, account.sid > account.login_hint
        if (this.userRequest) {
            if (this.account) {
                const account: Account = this.account;
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
            if (idTokenObject.claims && idTokenObject.claims.preferred_username) {
                ssoType = SSOTypes.ID_TOKEN;
                ssoData = idTokenObject.claims.preferred_username;
            }
            else {
                ssoType = SSOTypes.ORGANIZATIONS;
                ssoData = null;
            }
        }

        serverReqParam = this.addSSOParameter(ssoType, ssoData);

        // add the HomeAccountIdentifier info/ domain_hint
        if (this.account && this.account.homeAccountIdentifier) {
            serverReqParam = this.addSSOParameter(SSOTypes.HOMEACCOUNT_ID, this.account.homeAccountIdentifier, serverReqParam);
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
        if (this.account && !qParams[SSOTypes.SID]) {
            // sid - populate only if login_hint is not already populated and the account has sid
            const populateSID = !qParams[SSOTypes.LOGIN_HINT] && this.account.sid && this.userRequest.prompt === PromptState.NONE;
            if (populateSID) {
                qParams = this.addSSOParameter(SSOTypes.SID, this.account.sid, qParams);
            }
            // login_hint - account.userName
            else {
                const populateLoginHint = !qParams[SSOTypes.LOGIN_HINT] && this.account.userName && !StringUtils.isEmpty(this.account.userName);
                if (populateLoginHint) {
                    qParams = this.addSSOParameter(SSOTypes.LOGIN_HINT, this.account.userName, qParams);
                }
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
                const utid = this.cryptoObj.base64Decode(homeAccountId[1]);

                if (utid === Constants.CONSUMER_UTID) {
                    ssoParam[SSOTypes.DOMAIN_HINT] = SSOTypes.CONSUMERS;
                }
                else {
                    ssoParam[SSOTypes.DOMAIN_HINT] = SSOTypes.ORGANIZATIONS;
                }
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
