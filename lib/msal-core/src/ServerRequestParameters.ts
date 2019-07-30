// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Authority } from "./Authority";
import { CryptoUtils } from "./utils/CryptoUtils";
import { AuthenticationParameters, validateClaimsRequest } from "./AuthenticationParameters";
import { StringDict } from "./MsalTypes"
import { Account } from "./Account";
import { SSOTypes, Constants, PromptState, BlacklistedEQParams, libraryVersion } from "./utils/Constants";
import { ClientConfigurationError } from "./error/ClientConfigurationError";
import { StringUtils } from "./utils/StringUtils";

/**
 * Nonce: OIDC Nonce definition: https://openid.net/specs/openid-connect-core-1_0.html#IDToken
 * State: OAuth Spec: https://tools.ietf.org/html/rfc6749#section-10.12
 * @hidden
 */
export class ServerRequestParameters {

  authorityInstance: Authority;
  clientId: string;
  scopes: Array<string>;

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
   * @param scope
   * @param responseType
   * @param redirectUri
   * @param state
   */
  constructor (authority: Authority, clientId: string, scope: Array<string>, responseType: string, redirectUri: string, state: string) {
    this.authorityInstance = authority;
    this.clientId = clientId;
    if (!scope) {
      this.scopes = [clientId];
    } else {
      this.scopes = [ ...scope ];
    }

    this.nonce = CryptoUtils.createNewGuid();
    this.state = state && !StringUtils.isEmpty(state) ?  CryptoUtils.createNewGuid() + "|" + state   : CryptoUtils.createNewGuid();

    // TODO: Change this to user passed vs generated with the new PR
    this.correlationId = CryptoUtils.createNewGuid();

    // telemetry information
    this.xClientSku = "MSAL.JS";
    this.xClientVer = libraryVersion();

    this.responseType = responseType;
    this.redirectUri = redirectUri;
  }

  /**
   * @hidden
   * @ignore
   *
   * Utility to populate QueryParameters and ExtraQueryParameters to ServerRequestParamerers
   * @param request
   * @param serverAuthenticationRequest
   */
  populateQueryParams(account: Account, request: AuthenticationParameters, adalIdTokenObject?: any): void {
    let queryParameters: StringDict = {};

    if (request) {
      // add the prompt parameter to serverRequestParameters if passed
      if (request.prompt) {
        this.validatePromptParameter(request.prompt);
        this.promptValue = request.prompt;
      }

      // Add claims challenge to serverRequestParameters if passed
      if (request.claimsRequest) {
        validateClaimsRequest(request);
        this.claimsValue = request.claimsRequest;
      }

      // if the developer provides one of these, give preference to developer choice
      if (ServerRequestParameters.isSSOParam(request)) {
        queryParameters = this.constructUnifiedCacheQueryParameter(request, null);
      }
    }

    if (adalIdTokenObject) {
      queryParameters = this.constructUnifiedCacheQueryParameter(null, adalIdTokenObject);
    }

    // adds sid/login_hint if not populated; populates domain_req, login_req and domain_hint
    // this.logger.verbose("Calling addHint parameters");
    queryParameters = this.addHintParameters(account, queryParameters);

    // sanity check for developer passed extraQueryParameters
    let eQParams: StringDict;
    if (request) {
      eQParams = this.sanitizeEQParams(request);
    }

    // Populate the extraQueryParameters to be sent to the server
    this.queryParameters = ServerRequestParameters.generateQueryParametersString(queryParameters);
    this.extraQueryParameters = ServerRequestParameters.generateQueryParametersString(eQParams);
  }

  //#region QueryParam helpers

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
  //TODO: check how this behaves when domain_hint only is sent in extraparameters and idToken has no upn.
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
    // This is a final check for all queryParams added so far; preference order: sid > login_hint
    // sid cannot be passed along with login_hint or domain_hint, hence we check both are not populated yet in queryParameters
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
        let homeAccountId = ssoData.split(".");
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
    let eQParams : StringDict = request.extraQueryParameters;
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
  static generateQueryParametersString(queryParameters: StringDict): string {
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

  //#endregion

  /**
   * Check to see if there are SSO params set in the Request
   * @param request
   */
  static isSSOParam(request: AuthenticationParameters) {
      return request && (request.account || request.sid || request.loginHint);
  }
}
