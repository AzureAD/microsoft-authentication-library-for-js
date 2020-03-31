/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import pkg from "../../package.json";
import { Authority } from "../auth/authority/Authority";
import { Account } from "../auth/Account";
import { ICrypto, PkceCodes } from "../crypto/ICrypto";
import { ScopeSet } from "../auth/ScopeSet";
import { IdToken } from "../auth/IdToken";
import { AuthenticationParameters, validateClaimsRequest } from "../request/AuthenticationParameters";
import { ClientConfigurationError } from "../error/ClientConfigurationError";
import { StringUtils } from "../utils/StringUtils";
import { ProtocolUtils } from "../utils/ProtocolUtils";
import { Constants, BlacklistedEQParams, SSOTypes, PromptValue, AADServerParamKeys } from "../utils/Constants";
import { StringDict } from "../utils/MsalTypes";

/**
 * This class extends the ServerRequestParameters class. This class validates URL request parameters, checks for SSO and generates required URL.
 */
export class ServerCodeRequestParameters {

    // Crypto functions
    private cryptoObj: ICrypto;    

    // Telemetry Info
    xClientVer: string;
    xClientSku: string;
    correlationId: string;

    // Params
    clientId: string;
    scopes: ScopeSet;
    redirectUri: string;
    authorityInstance: Authority;
    responseType: string;
    userRequest: AuthenticationParameters;
    queryParameters: string;
    extraQueryParameters: string;

    // Generated Params
    generatedPkce: PkceCodes;
    
    // Validity checks
    state: string;
    nonce: string;

    // Account
    account: Account;

    constructor(authority: Authority, clientId: string, userRequest: AuthenticationParameters, cachedAccount: Account, redirectUri: string, cryptoImpl: ICrypto, isLoginCall: boolean) {
        this.clientId = clientId;
        this.cryptoObj = cryptoImpl;
        this.redirectUri = redirectUri;

        // Telemetry Info
        this.xClientSku = Constants.LIBRARY_NAME;
        this.xClientVer = pkg.version;

        this.authorityInstance = authority;
        this.userRequest = userRequest;
        this.responseType = Constants.CODE_RESPONSE_TYPE;
        this.account = (userRequest && userRequest.account) || cachedAccount;

        // Set scopes, append extra scopes if there is a login call.
        this.scopes = new ScopeSet(
            (this.userRequest && this.userRequest.scopes) || [], 
            this.clientId, 
            !isLoginCall
        );
        if (isLoginCall) {
            this.appendExtraScopes();
        }

        // Set random vars
        const randomGuid = this.cryptoObj.createNewGuid();
        console.log("1: ", this.userRequest);
        console.log("2: ", this.userRequest.userRequestState);
        console.log("3: ", this.userRequest && this.userRequest.userRequestState);
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
    hasSSOParam(): boolean {
        const isSSORequest = this.userRequest && (this.account || this.userRequest.sid || this.userRequest.loginHint);
        return !!this.account || !!isSSORequest;
    }

    /**
     * Adds SSO parameter to query parameters:
     * - sid of the account object used to identify the session of the user on the service
     * - login_hint to authorization URL which is used to pre-fill the username field of sign in page for the user if known ahead of time
     * Also does a sanity check for extraQueryParameters passed by the user to ensure no repeat queryParameters
     *
     * @param {@link Account} account - Account for which the token is requested
     * @param queryparams
     * @param {@link ServerRequestParameters}
     */
    private addSSOQueryParameters(adalIdToken: IdToken): StringDict {
        /*
         * This is a final check for all queryParams added so far; preference order: sid > login_hint
         * sid cannot be passed along with login_hint or domain_hint, hence we check both are not populated yet in queryParameters
         */
        // preference order: account > sid > login_hint
        const serverReqParam: StringDict = {};

        // if account info is passed, account.sid > account.login_hint
        if (this.account) {
            // sid can only be passed if prompt = none
            if (this.account.sid && this.userRequest && this.userRequest.prompt === PromptValue.NONE) {
                serverReqParam[SSOTypes.SID] = this.account.sid;
            }
            else if (this.account.userName) {
                serverReqParam[SSOTypes.LOGIN_HINT] = this.account.userName;
            }
        }
        // if no account info available, request.sid > request.login_hint
        else if (this.userRequest) {
            // sid from request - can only be passed if prompt = none
            if (this.userRequest.sid && this.userRequest.prompt === PromptValue.NONE) {
                serverReqParam[SSOTypes.SID] = this.userRequest.sid;
            }
            // loginHint from request
            else if (this.userRequest.loginHint) {
                serverReqParam[SSOTypes.LOGIN_HINT] = this.userRequest.loginHint;
            }
        }
        // adalIdToken retrieved from cache
        if (adalIdToken && StringUtils.isEmpty(serverReqParam[SSOTypes.SID]) && StringUtils.isEmpty(serverReqParam[SSOTypes.LOGIN_HINT])) {
            if (adalIdToken.claims && adalIdToken.claims.upn) {
                serverReqParam[SSOTypes.LOGIN_HINT] = adalIdToken.claims.upn;
            }
        }

        return serverReqParam;
    }

    /**
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
        }

        /*
         * adds sid/login_hint if an SSO Parameter is available
         * this.logger.verbose("Calling addHint parameters");
         */
        if (this.hasSSOParam() || adalIdTokenObject) {
            queryParameters = this.addSSOQueryParameters(adalIdTokenObject);
        }

        // sanity check for developer passed extraQueryParameters
        let eQParams: StringDict;
        if (this.userRequest) {
            eQParams = this.sanitizeEQParams(this.userRequest, queryParameters);
        }

        // Populate the extraQueryParameters to be sent to the server
        this.queryParameters = this.generateQueryParametersString(queryParameters);
        this.extraQueryParameters = this.generateQueryParametersString(eQParams);
    }

    /**
     * Create navigation url.
     */
    async createNavigateUrl(): Promise<string> {
        const paramStrings = await this.createParamString();
        let authEndpoint: string = this.authorityInstance.authorizationEndpoint;
        // if the endpoint already has queryparams, lets add to it, otherwise add the first one
        if (authEndpoint.indexOf("?") < 0) {
            authEndpoint += "?";
        } else {
            authEndpoint += "&";
        }

        const requestUrl: string = `${authEndpoint}${paramStrings.join("&")}`;
        return requestUrl;
    }

    /**
     * Create a query parameter string.
     */
    private async createParamString(): Promise<Array<string>> {
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

        // Add codes here. May want to add optional step to allow for non-PKCE auth code flows
        this.generatedPkce = await this.cryptoObj.generatePkceCodes();
        str.push(`${AADServerParamKeys.CODE_CHALLENGE}=${encodeURIComponent(this.generatedPkce.challenge)}`);
        str.push(`${AADServerParamKeys.CODE_CHALLENGE_METHOD}=${Constants.S256_CODE_CHALLENGE_METHOD}`);

        // Append resource
        if (this.userRequest && this.userRequest.resource) {
            str.push(`${AADServerParamKeys.RESOURCE}=${encodeURIComponent(this.userRequest.resource)}`);
        }

        // Append prompt
        if (this.userRequest && this.userRequest.prompt) {
            str.push(`${AADServerParamKeys.PROMPT}=${(encodeURIComponent(this.userRequest.prompt))}`);
        }

        // Append claims request
        if (this.userRequest && this.userRequest.claimsRequest) {
            str.push(`${AADServerParamKeys.CLAIMS}=${encodeURIComponent(this.userRequest.claimsRequest)}`);
        }

        // Append query params
        if (this.queryParameters) {
            str.push(this.queryParameters);
        }

        // Append extra query params
        if (this.extraQueryParameters) {
            str.push(this.extraQueryParameters);
        }

        str.push(`${AADServerParamKeys.CLIENT_REQUEST_ID}=${encodeURIComponent(this.correlationId)}`);
        str.push(`${AADServerParamKeys.RESPONSE_MODE}=${Constants.FRAGMENT_RESPONSE_MODE}`);
        return str;
    }

    /**
     * Utility to test if valid prompt value is passed in the request
     * @param request
     */
    private validatePromptParameter(prompt: string): void {
        if ([PromptValue.LOGIN, PromptValue.SELECT_ACCOUNT, PromptValue.CONSENT, PromptValue.NONE].indexOf(prompt) < 0) {
            throw ClientConfigurationError.createInvalidPromptError(prompt);
        }
    }

    /**
     * Removes unnecessary or duplicate query parameters from extraQueryParameters
     * @param request
     */
    private sanitizeEQParams(request: AuthenticationParameters, ssoQueryParams: StringDict) : StringDict {
        const eQParams : StringDict = request.extraQueryParameters;
        if (!eQParams) {
            return null;
        }

        if (request.claimsRequest) {
            // TODO: this.logger.error("Removed duplicate claims from extraQueryParameters. Please use either the claimsRequest field OR pass as extraQueryParameter - not both.");
            delete eQParams[Constants.CLAIMS];
        }

        // Remove any query parameters that are blacklisted
        BlacklistedEQParams.forEach(param => {
            if (eQParams[param]) {
                // TODO: this.logger.error("Removed duplicate " + param + " from extraQueryParameters. Please use the " + param + " field in request object.");
                delete eQParams[param];
            }
        });

        // Remove any query parameters already included in SSO params
        Object.keys(ssoQueryParams).forEach(key => {
            if (eQParams[key]) {
                // TODO: this.logger.error("Removed param " + key + " from extraQueryParameters since it was already present in library query parameters.")
                delete eQParams[key];
            }

            if (key === SSOTypes.SID) {
                // TODO: this.logger.error("Removed domain hint since sid was provided.")
                delete eQParams[SSOTypes.DOMAIN_HINT];
            }
        });

        return eQParams;
    }

    /**
     * Utility to generate a QueryParameterString from a Key-Value mapping of extraQueryParameters passed
     * @param extraQueryParameters
     */
    private generateQueryParametersString(queryParameters: StringDict): string {
        let paramsString: string = "";

        if (queryParameters) {
            Object.keys(queryParameters).forEach((key: string) => {
                if (StringUtils.isEmpty(paramsString)) {
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
