/**
 * Copyright (c) Microsoft Corporation
 *  All Rights Reserved
 *  MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the 'Software'), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
 * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
 * OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import { AccessTokenCacheItem } from "./AccessTokenCacheItem";
import { AccessTokenKey } from "./AccessTokenKey";
import { AccessTokenValue } from "./AccessTokenValue";
import { AuthenticationRequestParameters } from "./AuthenticationRequestParameters";
import { Authority } from "./Authority";
import { ClientInfo } from "./ClientInfo";
import { Constants, ErrorCodes, ErrorDescription } from "./Constants";
import { IdToken } from "./IdToken";
import { Logger } from "./Logger";
import { Storage } from "./Storage";
import { TokenResponse } from "./RequestInfo";
import { User } from "./User";
import { Utils } from "./Utils";
import { AuthorityFactory } from "./AuthorityFactory";
import { TConfiguration } from "./Configuration";
import * as MSALError from "./AuthError";
import { type } from 'os';


// TODO: move this when Constants are refactored
const DEFAULT_AUTHORITY = "https://login.microsoftonline.com/common";

/**
 * Interface to handle iFrame generation, Popup Window creation and redirect handling
 * TODO: Add more accurate description and document the design choices made 
 */
declare global {
  interface Window {
    msal: Object;
    CustomEvent: CustomEvent;
    Event: Event;
    activeRenewals: {};
    renewStates: Array<string>;
    callBackMappedToRenewStates: {};
    callBacksMappedToRenewStates: {};
    openedWindows: Array<Window>;
    requestType: string;
  }
}

/** 
 * response_type from OpenIDConnect
 * References: https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html & https://tools.ietf.org/html/rfc6749#section-4.2.1
 * Since we support only implicit flow in this library, we restrict the response_type support to only 'token' and 'id_token'
 * 
 * @hidden
 */
let ResponseTypes = {
  id_token: "id_token",
  token: "token",
  id_token_token: "id_token token"
};

/** 
 * TODO: This will move to Response Object
 *
 * @hidden
 */
export interface CacheResult {
  errorDesc: string;
  token: string;
  error: string;
}

/** 
 * A type alias of for a tokenReceivedCallback function.
 * TODO: Rework the callback as per new design - handleRedirectCallbacks() implementation etc.
 * 
 * @param tokenReceivedCallback.errorDesc error description returned from the STS if API call fails.
 * @param tokenReceivedCallback.token token returned from STS if token request is successful.
 * @param tokenReceivedCallback.error error code returned from the STS if API call fails.
 * @param tokenReceivedCallback.tokenType tokenType returned from the STS if API call is successful. Possible values are: id_token OR access_token.
 */
export type tokenReceivedCallback = (errorDesc: string, token: string, error: string, tokenType: string, userState: string) => void;

/**
 * A type alias for the callback called when an error is thrown by the library during a redirect.
 */
export type errorReceivedCallback = (error: MSALError.AuthError) => void;

/**
 * A wrapper to handle the token response/error within the iFrame always
 * TODO: This functionality of wrapper aroung a function seem to be changing in the latest TS, check this while fixing npm issues
 * 
 * @param target 
 * @param propertyKey 
 * @param descriptor 
 */
const resolveTokenOnlyIfOutOfIframe = (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
  const tokenAcquisitionMethod = descriptor.value;
  descriptor.value = function (...args: any[]) {
    return this.isInIframe()
      ? new Promise(() => {
        return;
      })
      : tokenAcquisitionMethod.apply(this, args);
  };
  return descriptor;
};


/**
 * UserAgentApplication class - Object Instance that the developer would need to make login/acquireToken calls
 */
export class UserAgentApplication {

  pConfig: TConfiguration;

  // TODO: Remove this from Configuration and add this as a parameter to redirect() calls
  private pTokenReceivedCallback: tokenReceivedCallback = null;

  /**
   * @hidden
   * 
   */
  private pErrorReceivedCallback: errorReceivedCallback = null;

  /** Authority Support Code */

  /** 
   * @hidden
   */
  protected authorityInstance: Authority;

  /** 
   * Used to set the authority.
   * 
   * TODO: Setter and Getter for authority is used to set the authorityInstance. 
   * Review: Should we rework this as a part of pConfig.auth.authority or maintain this as a class variable?
   * 
   * @param {string} authority - A URL indicating a directory that MSAL can use to obtain tokens.
   * - In Azure AD, it is of the form https://&lt;tenant&gt;/&lt;tenant&gt; 
   *      where &lt;tenant&gt; is the directory host (e.g. https://login.microsoftonline.com) 
   *      and &lt;tenant&gt; is a identifier within the directory itself 
   *      (e.g. a domain associated to the tenant, such as contoso.onmicrosoft.com, or the GUID representing the TenantID property of the directory)
   * - In Azure B2C, it is of the form https://&lt;instance&gt;/tfp/&lt;tenant&gt;/<policyName>/
   * - Default value is: "https://login.microsoftonline.com/common"
   */
  public set authority(val) {
    this.authorityInstance = AuthorityFactory.CreateInstance(val, this.pConfig.auth.validateAuthority);
  }

  /**
   * Used to get the authority.
   */
  public get authority(): string {
    return this.authorityInstance.CanonicalAuthority;
  }

  /** Other Variables */

  /**  
   * @hidden 
   * Storage instance
   */
  protected pCacheStorage: Storage;

  private pLoginInProgress: boolean;
  private pAcquireTokenInProgress: boolean;
  private pSilentAuthenticationState: string;
  private pSilentLogin: boolean;
  private _user: User;


  /** 
   * Initialize a UserAgentApplication with a given clientId and authority.
   * 
   * @constructor
   * @param {string} clientId - The clientID of your application, you should get this from the application registration portal.
   * @param {string} authority - A URL indicating a directory that MSAL can use to obtain tokens.
   * 
   * - In Azure AD, it is of the form https://&lt;instance>/&lt;tenant&gt;,\
   *    where &lt;instance&gt; is the directory host (e.g. https://login.microsoftonline.com) and &lt;tenant&gt; is a identifier within the directory itself 
   *    (e.g. a domain associated to the tenant, such as contoso.onmicrosoft.com, or the GUID representing the TenantID property of the directory)
   * - In Azure B2C, it is of the form https://&lt;instance&gt;/tfp/&lt;tenantId&gt;/&lt;policyName&gt;/
   * - Default value is: "https://login.microsoftonline.com/common"
   * 
   * @param pTokenReceivedCallback -  The function that will get the call back once this API is completed (either successfully or with a failure).
   * @param {boolean} validateAuthority -  boolean to turn authority validation on/off.
   */
  constructor(config: TConfiguration, callback: tokenReceivedCallback, errorCallback: errorReceivedCallback) {

    // Set the Configuration 
    this.pConfig = config;

    // if no authority is passed, set the default: "https://login.microsoftonline.com/common"
    this.authority = config.auth.authority || DEFAULT_AUTHORITY;

    // Set the callback
    this.pTokenReceivedCallback = callback;
    this.pErrorReceivedCallback = errorCallback;

    // track login and acquireToken in progress
    this.pLoginInProgress = false;
    this.pAcquireTokenInProgress = false;


    // Validate cache location and initialize storage 
    // if (!this.cacheLocations[this.pConfig.cache.cacheLocation]) {
    //   throw MSALError.ConfigurationError.createInvalidCacheLocationConfigError(
    //       this.pConfig.cache.cacheLocation,
    //       "unavailable",
    //       config.auth.state
    //     );
    // }

    //cache keys msal
    // cache keys msal - typescript throws an error if any value other than "localStorage" or "sessionStorage" is passed
    this.pCacheStorage = new Storage(this.pConfig.cache.cacheLocation);
    this.pCacheStorage.setEnableCookieStorage(this.pConfig.cache.storeAuthStateInCookie);

    // Initialize the Window Handling code
    // TODO: refactor - write a utility function 
    window.openedWindows = [];
    window.activeRenewals = {};
    window.renewStates = [];
    window.callBackMappedToRenewStates = {};
    window.callBacksMappedToRenewStates = {};
    window.msal = this;

    // identify if this is reinitialization post 302 from the server
    var urlHash = window.location.hash;
    var isCallback = this.isCallback(urlHash);

    // On the Server 302 - Redirect, handle this
    if (!this.pConfig.framework.isAngular) {
      if (isCallback) {
        this.handleAuthenticationResponse.call(this, urlHash);
      }
      else {
        var pendingCallback = this.pCacheStorage.getItem(Constants.urlHash);
        if (pendingCallback) {
          this.processCallBack(pendingCallback);
        }
      }
    }
  }


  /** 
   * Used to call the constructor callback with the token/error
   * 
   * @param {string} [hash=window.location.hash] - Hash fragment of Url.
   * @hidden
   */
  private processCallBack(hash: string): void {

    this.pConfig.system.logger.info("Processing the callback from redirect response");

    // get the request Info from the hash
    const requestInfo = this.getRequestInfo(hash);

    // save the token info from the hash
    // TODO: Refactor this to return an AuthResponse object
    this.saveTokenFromHash(requestInfo);

    const token = requestInfo.parameters[Constants.accessToken] || requestInfo.parameters[Constants.idToken];
    const errorDesc = requestInfo.parameters[Constants.errorDescription];
    const error = requestInfo.parameters[Constants.error];

    var tokenType: string;
    (requestInfo.parameters[Constants.accessToken]) ? tokenType = Constants.accessToken : tokenType = Constants.idToken;

    // remove the hash from the Cache
    this.pCacheStorage.removeItem(Constants.urlHash);

    try {
      if (this.pTokenReceivedCallback) {

        // clear the cookie in the hash
        this.pCacheStorage.clearCookie();

        // trigger callback
        // TODO: Refactor to 
        this.pTokenReceivedCallback.call(
          this,
          errorDesc,
          token,
          error,
          tokenType,
          this.getUserState(this.pCacheStorage.getItem(Constants.stateLogin))
        );
      }

    } catch (err) {
      let e = MSALError.ClientAuthError.createErrorInCallbackFunction(err, tokenType,
         this.getUserState(this.pCacheStorage.getItem(Constants.stateLogin)));
      this.pConfig.system.logger.error(e.message);
      // TODO: check if we should throw e here
      // throw e;
    }
  }


  /** 
   * Used to get the redirect uri. Evaluates redirectUri if its a function, otherwise simply returns its value.
   * 
   * @ignore
   * @hidden
   */
  private getRedirectUri(): string {
    if (typeof this.pConfig.auth.redirectUri === "function") {
      return this.pConfig.auth.redirectUri();
    }
    return this.pConfig.auth.redirectUri;
  }


  /** 
   * Used to get the post logout redirect uri. Evaluates postLogoutredirectUri if its a function, otherwise simply returns its value.
   * 
   * @ignore
   * @hidden
   */
  private getPostLogoutRedirectUri(): string {
    if (typeof this.pConfig.auth.postLogoutRedirectUri === "function") {
      return this.pConfig.auth.postLogoutRedirectUri();
    }
    return this.pConfig.auth.postLogoutRedirectUri;
  }


  /** 
   * Initiate the login process by redirecting the user to the STS authorization endpoint.
   * 
   * @param {Array.<string>} scopes - Permissions you want included in the access token. Not all scopes are guaranteed to be included in the access token returned.
   * @param {string} extraQueryParameters - Key-value pairs to pass to the authentication server during the interactive authentication flow.
   */
  // TODO: params to accept AuthRequest object instead
  loginRedirect(scopes?: Array<string>, extraQueryParameters?: string): void {

    // Create navigate url; saves value in cache; redirect user to AAD
    // If login already in progress, fail
    if (this.pLoginInProgress) {
      if(this.pErrorReceivedCallback) {
        this.pErrorReceivedCallback(
          MSALError.ClientAuthError.createLoginInProgressError(
            Constants.idToken,
            this.getUserState(this.pCacheStorage.getItem(Constants.stateLogin))
          )
        );
      }
      return;
    }

    // validate the scopes
    if (scopes) {
      try {
        this.validateInputScope(scopes, Constants.idToken);
      } catch (error) {
        if(error instanceof MSALError.ConfigurationError) {
          // Expected error from validation function
          this.pErrorReceivedCallback(error);
        } else {
          // Unexpected error
          this.pErrorReceivedCallback(
            MSALError.AuthError.createUnexpectedError(
              error.toString(), 
              Constants.idToken, 
              this.getUserState(this.pCacheStorage.getItem(Constants.stateLogin))
              )
            );
        }
        return;
      }

      scopes = this.filterScopes(scopes);
    }

    // extract ADAL id_token if exists 
    var idTokenObject;
    idTokenObject = this.extractADALIdToken();

    // silent login if ADAL id_token is retrieved successfully - SSO
    if (idTokenObject && !scopes) {
      this.pConfig.system.logger.info("ADAL's idToken exists. Extracting login information from ADAL's idToken ");
      extraQueryParameters = Utils.constructUnifiedCacheExtraQueryParameter(idTokenObject, extraQueryParameters);

      this.pSilentLogin = true;

      this.acquireTokenSilent([this.pConfig.auth.clientId], this.authority, this.getUser(), extraQueryParameters)
        .then((idToken) => {
          this.pSilentLogin = false;
          this.pConfig.system.logger.info("Unified cache call is successful");
          // TODO: Change callback to return AuthResponse
          if (this.pTokenReceivedCallback) {
            this.pTokenReceivedCallback.call(this, null, idToken, null, Constants.idToken, this.getUserState(this.pSilentAuthenticationState));
          }
        }, (error) => {
          this.pSilentLogin = false;
          this.pConfig.system.logger.error("Error occurred during unified cache ATS");
          this.loginRedirectHelper(scopes, extraQueryParameters);
        });
    }
    // else proceed to login
    else {
      this.loginRedirectHelper(scopes, extraQueryParameters);
    }
  }

  /**
   * Helper function to loginRedirect
   * 
   * @hidden
   * @param scopes 
   * @param extraQueryParameters 
   */
  // TODO: params to accept AuthRequest object instead
  private loginRedirectHelper(scopes?: Array<string>, extraQueryParameters?: string) {

    // track login in progress
    this.pLoginInProgress = true;

    // TODO: Make this more readable - is authorityInstance changed, what is happening with the return for AuthorityFactory??
    this.authorityInstance.ResolveEndpointsAsync()
      .then(() => {
        const authenticationRequest = new AuthenticationRequestParameters(
          this.authorityInstance,
          this.pConfig.auth.clientId,
          scopes,
          ResponseTypes.id_token,
          this.getRedirectUri(),
          this.pConfig.auth.state
        );

        if (extraQueryParameters) {
          authenticationRequest.extraQueryParameters = extraQueryParameters;
        }

        // if the user sets the login Start page - angular only??
        var loginStartPage = this.pCacheStorage.getItem(Constants.angularLoginRequest);
        if (!loginStartPage || loginStartPage === "") {
          loginStartPage = window.location.href;
        }
        else {
          this.pCacheStorage.setItem(Constants.angularLoginRequest, "");
        }

        // Cache the state, nonce and login request data
        this.pCacheStorage.setItem(Constants.loginRequest, loginStartPage);
        this.pCacheStorage.setItem(Constants.loginError, "");
        this.pCacheStorage.setItem(Constants.stateLogin, authenticationRequest.state);
        this.pCacheStorage.setItem(Constants.nonceIdToken, authenticationRequest.nonce);
        this.pCacheStorage.setItem(Constants.msalError, "");
        this.pCacheStorage.setItem(Constants.msalErrorDescription, "");

        const authorityKey = Constants.authority + Constants.resourceDelimeter + authenticationRequest.state;
        this.pCacheStorage.setItem(authorityKey, this.authority);

        // generate the URL to navigate to proceed with the login
        const urlNavigate = authenticationRequest.createNavigateUrl(scopes) + Constants.response_mode_fragment;

        // redirect the user to the login URL
        this.promptUser(urlNavigate);
      });
  }

  /** 
   * Initiate the login process by opening a popup window.
   * 
   * @param {Array.<string>} scopes - Permissions you want included in the access token. Not all scopes are  guaranteed to be included in the access token returned.
   * @param {string} extraQueryParameters - Key-value pairs to pass to the STS during the interactive authentication flow.
   * @returns {Promise.<string>} - A Promise that is fulfilled when this function has completed, or rejected if an error was raised. Returns the token or error.
   */
  loginPopup(scopes?: Array<string>, extraQueryParameters?: string): Promise<string> {

    // Create navigate url; saves value in cache; redirect user to AAD

    return new Promise<string>((resolve, reject) => {
      // fail if login is already in progress
      if (this.pLoginInProgress) {
        reject(
          MSALError.ClientAuthError.createLoginInProgressError(
            Constants.idToken, 
            this.getUserState(this.pCacheStorage.getItem(Constants.stateLogin))
          )
        );
        return;
      }

      // validate the scopes
      if (scopes) {
        try {
          this.validateInputScope(scopes, Constants.idToken);
        } catch (error) {
          if(error instanceof MSALError.ConfigurationError) {
            // Expected error from validation function
            reject(error);
          } else {
            // Unexpected error
            reject(
              MSALError.AuthError.createUnexpectedError(
                error.toString(), 
                Constants.idToken, 
                this.getUserState(this.pCacheStorage.getItem(Constants.stateLogin))
              )
            );
          }
          return;
        }
        // TODO: combine validate and filterScopes to reduce code duplication
        scopes = this.filterScopes(scopes);
      }

      // extract ADAL id_token if it exists
      var idTokenObject;
      idTokenObject = this.extractADALIdToken();

      // silent login if ADAL id_token is retrieved successfully - SSO
      if (idTokenObject && !scopes) {
        this.pConfig.system.logger.info("ADAL's idToken exists. Extracting login information from ADAL's idToken ");
        extraQueryParameters = Utils.constructUnifiedCacheExtraQueryParameter(idTokenObject, extraQueryParameters);

        this.pSilentLogin = true;
        this.acquireTokenSilent([this.pConfig.auth.clientId], this.authority, this.getUser(), extraQueryParameters)
          .then((idToken) => {
            this.pSilentLogin = false;
            this.pConfig.system.logger.info("Unified cache call is successful");
            // TODO: Change resolve to return AuthResponse object
            resolve(idToken);
          }, (error) => {
            this.pSilentLogin = false;
            this.pConfig.system.logger.error("Error occurred during unified cache ATS");
            this.loginPopupHelper(resolve, reject, scopes, extraQueryParameters);
          });
      }
      // else proceed with the login
      else {
        this.loginPopupHelper(resolve, reject, scopes, extraQueryParameters);
      }
    });
  }

  /**
   * Helper function to loginPopup
   * 
   * @hidden
   * @param resolve 
   * @param reject 
   * @param scopes 
   * @param extraQueryParameters 
   */
  private loginPopupHelper(resolve: any, reject: any, scopes: Array<string>, extraQueryParameters?: string) {

    // TODO: why this is needed only for loginpopup
    if (!scopes) {
      scopes = [this.pConfig.auth.clientId];
    }
    const scope = scopes.join(" ").toLowerCase();

    // generate a Popup window
    // TODO: Refactor this so that openWindow throws error, loginPopupHelper rejects or resolves based on action
    var popUpWindow = this.openWindow("about:blank", "_blank", 1, this, resolve, reject);

    if (!popUpWindow) {
      return;
    }

    // track login progress
    this.pLoginInProgress = true;

    // Resolve Endpoint
    this.authorityInstance.ResolveEndpointsAsync().then(() => {
      const authenticationRequest = new AuthenticationRequestParameters(
        this.authorityInstance,
        this.pConfig.auth.clientId,
        scopes,
        ResponseTypes.id_token,
        this.getRedirectUri(),
        this.pConfig.auth.state
      );

      // set extraParameters
      if (extraQueryParameters) {
        authenticationRequest.extraQueryParameters = extraQueryParameters;
      }

      // Cache the state, nonce and login request data
      this.pCacheStorage.setItem(Constants.loginRequest, window.location.href);
      this.pCacheStorage.setItem(Constants.loginError, "");
      this.pCacheStorage.setItem(Constants.nonceIdToken, authenticationRequest.nonce);
      this.pCacheStorage.setItem(Constants.msalError, "");
      this.pCacheStorage.setItem(Constants.msalErrorDescription, "");

      const authorityKey = Constants.authority + Constants.resourceDelimeter + authenticationRequest.state;
      this.pCacheStorage.setItem(authorityKey, this.authority);

      // generate the URL to navigate in the popup window
      const urlNavigate = authenticationRequest.createNavigateUrl(scopes) + Constants.response_mode_fragment;
      window.renewStates.push(authenticationRequest.state);
      window.requestType = Constants.login;

      // register the call back to capture the results from the server
      this.registerCallback(authenticationRequest.state, scope, resolve, reject);

      // navigate to the popup window
      if (popUpWindow) {
        this.pConfig.system.logger.infoPii("Navigated Popup window to:" + urlNavigate);
        popUpWindow.location.href = urlNavigate;
      }

    }, (err) => {
      // fail on endpoint resolution error
      let e = MSALError.ClientAuthError.createEndpointResolutionError(
        err.toString(),
        Constants.idToken, 
        this.getUserState(this.pCacheStorage.getItem(Constants.stateLogin))
      );
      this.pConfig.system.logger.info(e.errorCode + ":" + e.message);
      this.pCacheStorage.setItem(Constants.msalError, e.errorCode);
      this.pCacheStorage.setItem(Constants.msalErrorDescription, e.message);

      // What is this? Is this the reject that is passed in?? -- REDO this in the subsequent refactor, passing reject is confusing
      if (reject) {
        reject(e);
      }

      // close the popup window
      if (popUpWindow) {
        popUpWindow.close();
      }
    }).catch((err) => {
      // All catch - is this executed even when the promise is rejected?? Possibly executed if an error is thrown, but not if previous function rejects
      let e = MSALError.ClientAuthError.createEndpointResolutionError(
        err.toString(), 
        Constants.idToken, 
        this.getUserState(this.pCacheStorage.getItem(Constants.stateLogin))
      )
      this.pConfig.system.logger.warning(e.message);
      reject(e);
    });
  }

  /** 
    * Used to redirect the browser to the STS authorization endpoint
    * 
    * @param {string} urlNavigate - URL of the authorization endpoint
    * @hidden
    */
  private promptUser(urlNavigate: string) {

    // Navigate if valid URL
    if (urlNavigate && !Utils.isEmpty(urlNavigate)) {
      this.pConfig.system.logger.infoPii("Navigate to:" + urlNavigate);
      window.location.replace(urlNavigate);
    }
    // TODO: Log error on failure - we should be erroring out, unexpected library error
    else {
      this.pConfig.system.logger.info("Navigate url is empty");
    }
  }

  /** 
   * Used to send the user to the redirect_uri after authentication is complete. The user's bearer token is attached to the URI fragment as an id_token/access_token field.
   * This function also closes the popup window after redirection.
   * 
   * @param urlNavigate 
   * @param title 
   * @param interval 
   * @param instance 
   * @param resolve 
   * @param reject 
   * @hidden
   * @ignore
   */
  private openWindow(urlNavigate: string, title: string, interval: number, instance: this, resolve?: Function, reject?: Function): Window {

    // generate a popup Window
    var popupWindow = this.openPopup(urlNavigate, title, Constants.popUpWidth, Constants.popUpHeight);

    // if popupWindow is not valid, error out
    if (popupWindow == null) {

      instance.pLoginInProgress = false;
      instance.pAcquireTokenInProgress = false;
      // TODO: figure out some way to pass tokenType
      let e = MSALError.ClientAuthError.createPopupWindowError(
        "Unavailable", 
        this.getUserState(this.pCacheStorage.getItem(Constants.stateLogin))
      );

      this.pConfig.system.logger.info(e.errorCode + ":" + e.message);
      this.pCacheStorage.setItem(Constants.msalError, e.errorCode);
      this.pCacheStorage.setItem(Constants.msalErrorDescription, e.message);

      if (reject) {
        reject(e);
      }

      return null;
    }

    // stack the popup window
    window.openedWindows.push(popupWindow);

    var pollTimer = window.setInterval(() => {

      // if the popup is closed or the login is already in progress, cancel the login 
      if (popupWindow && popupWindow.closed && instance.pLoginInProgress) {
        // TODO: Figure out some way to pass tokenType
        let e = MSALError.ClientAuthError.createUserCancelledError(
          "Unavailable", 
          this.getUserState(this.pCacheStorage.getItem(Constants.stateLogin))
        );
        if (reject) {
          reject(e);
        }
        window.clearInterval(pollTimer);

        if (this.pConfig.framework.isAngular) {
          this.broadcast("msal:popUpClosed", e.errorCode + Constants.resourceDelimeter + e.message);
          return;
        }

        instance.pLoginInProgress = false;
        instance.pAcquireTokenInProgress = false;
      }

      try {
        var popUpWindowLocation = popupWindow.location;

        // if the popUp hash changes, close the popup window. Why are we closing only for Angular??
        if (popUpWindowLocation.href.indexOf(this.getRedirectUri()) !== -1) {
          window.clearInterval(pollTimer);

          instance.pLoginInProgress = false;
          instance.pAcquireTokenInProgress = false;

          this.pConfig.system.logger.info("Closing popup window");

          if (this.pConfig.framework.isAngular) {
            this.broadcast("msal:popUpHashChanged", popUpWindowLocation.hash);
            for (var i = 0; i < window.openedWindows.length; i++) {
              window.openedWindows[i].close();
            }
          }

        }
      } catch (e) {
        // Cross Domain url check error. 
        // Will be thrown until AAD redirects the user back to the app"s root page with the token.
        // No need to log or throw this error as it will create unnecessary traffic.
      }

    }, interval);

    return popupWindow;
  }

  /**
   * Broadcast messages - Used only for Angular?
   * TODO: consider moving this to msal-angular later 
   * 
   * @param eventName 
   * @param data 
   */
  private broadcast(eventName: string, data: string) {
    var evt = new CustomEvent(eventName, { detail: data });
    window.dispatchEvent(evt);
  }


  /**
   * Used to log out the current user, and redirect the user to the postLogoutRedirectUri.
   * Defaults behaviour is to redirect the user to `window.location.href`.
   */
  logout(): void {
    this.clearCache();
    this._user = null;
    let logout = "";
    if (this.getPostLogoutRedirectUri()) {
      logout = "post_logout_redirect_uri=" + encodeURIComponent(this.getPostLogoutRedirectUri());
    }

    const urlNavigate = this.authority + "/oauth2/v2.0/logout?" + logout;
    this.promptUser(urlNavigate);
  }


  /**
   * Clear all Access Tokens in the Cache
   * 
   * @ignore
   * @hidden
   */
  protected clearCache(): void {
    window.renewStates = [];
    const accessTokenItems = this.pCacheStorage.getAllAccessTokens(Constants.clientId, Constants.userIdentifier);
    for (let i = 0; i < accessTokenItems.length; i++) {
      this.pCacheStorage.removeItem(JSON.stringify(accessTokenItems[i].key));
    }
    this.pCacheStorage.resetCacheItems();
    this.pCacheStorage.clearCookie();
  }

  /**
   * Clear a given access token from the cache
   * 
   * @param accessToken 
   */
  protected clearCacheForScope(accessToken: string) {
    const accessTokenItems = this.pCacheStorage.getAllAccessTokens(Constants.clientId, Constants.userIdentifier);
    for (var i = 0; i < accessTokenItems.length; i++) {
      var token = accessTokenItems[i];
      if (token.value.accessToken === accessToken) {
        this.pCacheStorage.removeItem(JSON.stringify(token.key));
      }
    }
  }


  /**
   * Configures popup window for login.
   * 
   * @param urlNavigate 
   * @param title 
   * @param popUpWidth 
   * @param popUpHeight 
   * @ignore
   * @hidden
   */
  private openPopup(urlNavigate: string, title: string, popUpWidth: number, popUpHeight: number) {
    try {

      // adding winLeft and winTop to account for dual monitor
      // using screenLeft and screenTop for IE8 and earlier
      const winLeft = window.screenLeft ? window.screenLeft : window.screenX;
      const winTop = window.screenTop ? window.screenTop : window.screenY;

      // window.innerWidth displays browser window"s height and width excluding toolbars
      // using document.documentElement.clientWidth for IE8 and earlier
      const width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
      const height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
      const left = ((width / 2) - (popUpWidth / 2)) + winLeft;
      const top = ((height / 2) - (popUpHeight / 2)) + winTop;

      // open the window
      const popupWindow = window.open(urlNavigate, title, "width=" + popUpWidth + ", height=" + popUpHeight + ", top=" + top + ", left=" + left);
      if (popupWindow.focus) {
        popupWindow.focus();
      }

      return popupWindow;
    } catch (e) {
      // throw an error if opening popup window fails
      // TODO: Throw MSALError
      this.pConfig.system.logger.error("error opening popup " + e.message);
      this.pLoginInProgress = false;
      this.pAcquireTokenInProgress = false;
      return null;
    }
  }

  /** 
   * Used to validate the scopes input parameter requested  by the developer.
   * 
   * @param {Array<string>} scopes - Developer requested permissions. Not all scopes are guaranteed to be included in the access token returned.
   * @ignore
   * @hidden
   */
  private validateInputScope(scopes: Array<string>, tokenType: string): void {

    // Check that scopes object is array
    if (!Array.isArray(scopes)) {
      throw MSALError.ConfigurationError.createScopesNonArrayError(
        scopes,
        tokenType,
        this.getUserState(this.pCacheStorage.getItem(Constants.stateLogin))
      );
    }

    // Check that scopes array is not empty
    if (!scopes || scopes.length < 1) {
      throw MSALError.ConfigurationError.createEmptyScopesArrayError(
        scopes.toString(), 
        tokenType, 
        this.getUserState(this.pCacheStorage.getItem(Constants.stateLogin))
      );
    }

    // Check that if clientId is included, it is passed as a single scope
    if (scopes.indexOf(this.pConfig.auth.clientId) > -1) {
      if (scopes.length > 1) {
        throw MSALError.ConfigurationError.createClientIdSingleScopeError(
          scopes.toString(),
          tokenType,
          this.getUserState(this.pCacheStorage.getItem(Constants.stateLogin))
        );
      }
    }

    return;
  }

  /**
   * Used to remove openid and profile from the list of scopes passed by the developer. These scopes are added by default
   *
   * @param scopes 
   * @hidden
   */
  private filterScopes(scopes: Array<string>): Array<string> {

    scopes = scopes.filter(function (element) {
      return element !== "openid";
    });

    scopes = scopes.filter(function (element) {
      return element !== "profile";
    });

    return scopes;
  }

  // Seems to only be used for loginPopup
  // TODO: Identify functions for popup and redirect and separate them
  /** 
   * Used to add the developer requested callback to the array of callbacks for the specified scopes. The updated array is stored on the window object
   * 
   * @param {string} scope - Developer requested permissions. Not all scopes are guaranteed to be included in the access token returned.
   * @param {string} expectedState - Unique state identifier (guid).
   * @param {Function} resolve - The resolve function of the promise object.
   * @param {Function} reject - The reject function of the promise object.
   * @ignore
   * @hidden
   */
  private registerCallback(expectedState: string, scope: string, resolve: Function, reject: Function): void {

    // init the callbacks Mapped 
    window.activeRenewals[scope] = expectedState;

    if (!window.callBacksMappedToRenewStates[expectedState]) {
      window.callBacksMappedToRenewStates[expectedState] = [];
    }

    // indexing on the current state, push the callback params to callbacks mapped
    window.callBacksMappedToRenewStates[expectedState].push({ resolve: resolve, reject: reject });

    // store the server response in the current window??
    if (!window.callBackMappedToRenewStates[expectedState]) {

      window.callBackMappedToRenewStates[expectedState] = (errorDesc: string, token: string, error: string, tokenType: string) => {

        // reset the activeRenewals
        window.activeRenewals[scope] = null;

        // for all callBacksMappedtoRenewStates for a given 'state' - call the reject/resolve with error/token respectively
        // TODO: understand where the error, token are coming from
        for (let i = 0; i < window.callBacksMappedToRenewStates[expectedState].length; ++i) {
          try {
            if (errorDesc || error) {
              window.callBacksMappedToRenewStates[expectedState][i].reject(errorDesc + Constants.resourceDelimeter + error);
            }
            else if (token) {
              window.callBacksMappedToRenewStates[expectedState][i].resolve(token);
            }
          } catch (e) {
            this.pConfig.system.logger.warning(e);
          }
        }

        // reset 
        window.callBacksMappedToRenewStates[expectedState] = null;
        window.callBackMappedToRenewStates[expectedState] = null;
      };
    }
  }

  // TODO: Where is this being used?
  /**
   * Helper function to retrieve the cached token
   * 
   * @param scopes 
   * @param user 
   */
  protected getCachedTokenInternal(scopes: Array<string>, user: User): CacheResult {

    // Get the current session's user object 
    const userObject = user ? user : this.getUser();
    if (!userObject) {
      return null;
    }

    let authenticationRequest: AuthenticationRequestParameters;
    let newAuthority = this.authorityInstance ? this.authorityInstance : AuthorityFactory.CreateInstance(this.authority, this.pConfig.auth.validateAuthority);
    let responseType;

    // set response_type
    if (Utils.compareObjects(userObject, this.getUser())) {
      if (scopes.indexOf(this.pConfig.auth.clientId) > -1) {
        responseType = ResponseTypes.id_token;
      }
      else {
        responseType = ResponseTypes.token;
      }
    }
    else {
      responseType = ResponseTypes.id_token_token;
    }

    // construct AuthenticationRequest
    authenticationRequest = new AuthenticationRequestParameters(
      newAuthority,
      this.pConfig.auth.clientId,
      scopes,
      responseType,
      this.getRedirectUri(),
      this.pConfig.auth.state
    );

    // get the cached token now
    return this.getCachedToken(authenticationRequest, user);
  }

  /** 
   * Used to get token for the specified set of scopes from the cache
   * TODO: There is a lot of duplication code in this function, rework this sooner than later, may be as a part of Error??
   * TODO: Only used in ATS - we should separate this
   * 
   * @param {AuthenticationRequestParameters} authenticationRequest - Request sent to the STS to obtain an id_token/access_token
   * @param {User} user - User for which the scopes were requested
   * @hidden
   */
  private getCachedToken(authenticationRequest: AuthenticationRequestParameters, user: User): CacheResult {

    let accessTokenCacheItem: AccessTokenCacheItem = null;
    const scopes = authenticationRequest.scopes;

    //filter by clientId and user
    const tokenCacheItems = this.pCacheStorage.getAllAccessTokens(this.pConfig.auth.clientId, user ? user.userIdentifier : null);

    // No match found after initial filtering
    if (tokenCacheItems.length === 0) {
      return null;
    }

    const filteredItems: Array<AccessTokenCacheItem> = [];

    // if no authority is passed
    if (!authenticationRequest.authority) {

      // filter by scope
      for (let i = 0; i < tokenCacheItems.length; i++) {
        const cacheItem = tokenCacheItems[i];
        const cachedScopes = cacheItem.key.scopes.split(" ");
        if (Utils.containsScope(cachedScopes, scopes)) {
          filteredItems.push(cacheItem);
        }
      }

      // if only one cached token is found
      if (filteredItems.length === 1) {
        accessTokenCacheItem = filteredItems[0];
        authenticationRequest.authorityInstance = AuthorityFactory.CreateInstance(accessTokenCacheItem.key.authority, this.pConfig.auth.validateAuthority);
      }
      // if more than one cached token is found
      else if (filteredItems.length > 1) {
        // TODO: Make sure access token is the only use case for this
        throw MSALError.ClientAuthError.createMultipleMatchingTokensInCacheError(
          scopes.toString(), 
          Constants.accessToken, 
          this.getUserState(this.pCacheStorage.getItem(Constants.stateLogin))
        );
      }
      // if no match found. check if there was a single authority used
      else {
        const authorityList = this.getUniqueAuthority(tokenCacheItems, "authority");
        if (authorityList.length > 1) {
          // TODO: Make sure access token is the only use case for this
          throw MSALError.ClientAuthError.createMultipleAuthoritiesInCacheError(
            scopes.toString(),
            Constants.accessToken,
            this.getUserState(this.pCacheStorage.getItem(Constants.stateLogin))
          );
        }

        authenticationRequest.authorityInstance = AuthorityFactory.CreateInstance(authorityList[0], this.pConfig.auth.validateAuthority);
      }
    }
    // if an authority is passed in the API
    else {

      // filter by authority and scope
      for (let i = 0; i < tokenCacheItems.length; i++) {
        const cacheItem = tokenCacheItems[i];
        const cachedScopes = cacheItem.key.scopes.split(" ");
        if (Utils.containsScope(cachedScopes, scopes) && cacheItem.key.authority === authenticationRequest.authority) {
          filteredItems.push(cacheItem);
        }
      }

      // no match
      if (filteredItems.length === 0) {
        return null;
      }
      // if only one cached token is found
      else if (filteredItems.length === 1) {
        accessTokenCacheItem = filteredItems[0];
      }
      // if more than one cached token is found
      else {
        // TODO: Make sure access token is the only use case for this
        throw MSALError.ClientAuthError.createMultipleMatchingTokensInCacheError(
          scopes.toString(), 
          Constants.accessToken, 
          this.getUserState(this.pCacheStorage.getItem(Constants.stateLogin))
        );
      }
    }

    if (accessTokenCacheItem != null) {

      const expired = Number(accessTokenCacheItem.value.expiresIn);
      const offset = this.pConfig.system.tokenRenewalOffsetSeconds || 300;

      // If expiration is within offset, it will force renew
      if (expired && (expired > Utils.now() + offset)) {
        return {
          errorDesc: null,
          token: accessTokenCacheItem.value.accessToken,
          error: null
        };
      } else {
        this.pCacheStorage.removeItem(JSON.stringify(filteredItems[0].key));
        return null;
      }
    } else {
      return null;
    }

  }

  /*
   * Used to filter all cached items and return a list of unique users based on userIdentifier.
   * @param {Array<User>} Users - users saved in the cache.
   */
  getAllUsers(): Array<User> {
    const users: Array<User> = [];
    const accessTokenCacheItems = this.pCacheStorage.getAllAccessTokens(Constants.clientId, Constants.userIdentifier);
    for (let i = 0; i < accessTokenCacheItems.length; i++) {
      const idToken = new IdToken(accessTokenCacheItems[i].value.idToken);
      const clientInfo = new ClientInfo(accessTokenCacheItems[i].value.clientInfo);
      const user = User.createUser(idToken, clientInfo);
      users.push(user);
    }

    return this.getUniqueUsers(users);
  }

  /*
   * Used to filter users based on userIdentifier
   * @param {Array<User>}  Users - users saved in the cache
   * @ignore
   * @hidden
   */
  private getUniqueUsers(users: Array<User>): Array<User> {
    if (!users || users.length <= 1) {
      return users;
    }

    const flags: Array<string> = [];
    const uniqueUsers: Array<User> = [];
    for (let index = 0; index < users.length; ++index) {
      if (users[index].userIdentifier && flags.indexOf(users[index].userIdentifier) === -1) {
        flags.push(users[index].userIdentifier);
        uniqueUsers.push(users[index]);
      }
    }

    return uniqueUsers;
  }

  /**
   * Used to get a unique list of authoritues from the cache
   * 
   * @param {Array<AccessTokenCacheItem>}  accessTokenCacheItems - accessTokenCacheItems saved in the cache
   * @ignore
   * @hidden
   */
  private getUniqueAuthority(accessTokenCacheItems: Array<AccessTokenCacheItem>, property: string): Array<string> {

    const authorityList: Array<string> = [];
    const flags: Array<string> = [];

    accessTokenCacheItems.forEach(element => {
      if (element.key.hasOwnProperty(property) && (flags.indexOf(element.key[property]) === -1)) {
        flags.push(element.key[property]);
        authorityList.push(element.key[property]);
      }
    });

    return authorityList;
  }

  /** 
   * Adds login_hint to authorization URL which is used to pre-fill the username field of sign in page for the user if known ahead of time
   * domain_hint can be one of users/organisations which when added skips the email based discovery process of the user
   * domain_req utid received as part of the clientInfo
   * login_req uid received as part of clientInfo
   * 
   * @param {string} urlNavigate - Authentication request url
   * @param {User} user - User for which the token is requested
   * @ignore
   * @hidden
   */
  private addHintParameters(urlNavigate: string, user: User): string {

    const userObject = user ? user : this.getUser();

    if (userObject) {

      const decodedClientInfo = userObject.userIdentifier.split(".");
      const uid = Utils.base64DecodeStringUrlSafe(decodedClientInfo[0]);
      const utid = Utils.base64DecodeStringUrlSafe(decodedClientInfo[1]);

      // sid - first preference to identify a session
      if (userObject.sid && urlNavigate.indexOf(Constants.prompt_none) !== -1) {
        if (!this.urlContainsQueryStringParameter(Constants.sid, urlNavigate) && !this.urlContainsQueryStringParameter(Constants.login_hint, urlNavigate)) {
          urlNavigate += "&" + Constants.sid + "=" + encodeURIComponent(userObject.sid);
        }
      }
      // check for login_hint if sid is not passed
      else {
        if (!this.urlContainsQueryStringParameter(Constants.login_hint, urlNavigate) && userObject.displayableId && !Utils.isEmpty(userObject.displayableId)) {
          urlNavigate += "&" + Constants.login_hint + "=" + encodeURIComponent(userObject.displayableId);
        }
      }

      // client_info.utid = domain_req and client_info.uid = login_req
      if (!Utils.isEmpty(uid) && !Utils.isEmpty(utid)) {
        if (!this.urlContainsQueryStringParameter("domain_req", urlNavigate) && !Utils.isEmpty(utid)) {
          urlNavigate += "&domain_req=" + encodeURIComponent(utid);
        }

        if (!this.urlContainsQueryStringParameter("login_req", urlNavigate) && !Utils.isEmpty(uid)) {
          urlNavigate += "&login_req=" + encodeURIComponent(uid);
        }
      }

      // fill in the domain_hint
      if (!this.urlContainsQueryStringParameter(Constants.domain_hint, urlNavigate) && !Utils.isEmpty(utid)) {
        if (utid === Constants.consumersUtid) {
          urlNavigate += "&" + Constants.domain_hint + "=" + encodeURIComponent(Constants.consumers);
        } else {
          urlNavigate += "&" + Constants.domain_hint + "=" + encodeURIComponent(Constants.organizations);
        }
      }

    }

    return urlNavigate;
  }

  /** 
   * Checks if the authorization endpoint URL contains query string parameters
   * 
   * @ignore
   * @hidden
   */
  private urlContainsQueryStringParameter(name: string, url: string): boolean {
    // regex to detect pattern of a ? or & followed by the name parameter and an equals character
    const regex = new RegExp("[\\?&]" + name + "=");
    return regex.test(url);
  }

  /** 
   * Used to obtain an access_token by redirecting the user to the authorization endpoint.
   * To renew idToken, clientId should be passed as the only scope in the scopes array.
   * 
   * @param {Array<string>} scopes - Permissions you want included in the access token. 
   *  Not all scopes are  guaranteed to be included in the access token. Scopes like "openid" and "profile" are sent with every request.
   * @param {string} authority - A URL indicating a directory that MSAL can use to obtain tokens.
   * - In Azure AD, it is of the form https://{instance}/&lt;tenant&gt;, 
   *    where &lt;tenant&gt; is the directory host (e.g. https://login.microsoftonline.com) 
   *    and &lt;tenant&gt; is a identifier within the directory itself 
   *    (e.g. a domain associated to the tenant, such as contoso.onmicrosoft.com, or the GUID representing the TenantID property of the directory)
   * - In Azure B2C, it is of the form https://{instance}/tfp/&lt;tenant&gt;/<policyName>
   * - Default value is: "https://login.microsoftonline.com/common"
   * @param {User} user - The user for which the scopes are requested.The default user is the logged in user.
   * @param {string} extraQueryParameters - Key-value pairs to pass to the STS during the  authentication flow.
   */
  acquireTokenRedirect(scopes: Array<string>): void;
  acquireTokenRedirect(scopes: Array<string>, authority: string): void;
  acquireTokenRedirect(scopes: Array<string>, authority: string, user: User): void;
  acquireTokenRedirect(scopes: Array<string>, authority: string, user: User, extraQueryParameters: string): void;
  acquireTokenRedirect(scopes: Array<string>, authority?: string, user?: User, extraQueryParameters?: string): void {

    // validate the scopes
    if (scopes) {
      try {
        // TODO: is this always accessToken?
        this.validateInputScope(scopes, Constants.accessToken);
      } catch (error) {
        if(error instanceof MSALError.ConfigurationError) {
          // Expected error from validation function
          this.pErrorReceivedCallback(error);
        } else {
          // Unexpected error
          this.pErrorReceivedCallback(
            // TODO: is this always accessToken?
            MSALError.AuthError.createUnexpectedError(
              error.toString(), 
              Constants.accessToken, 
              this.getUserState(this.pCacheStorage.getItem(Constants.stateLogin))
            )
          );
        }
        return;
      }

      scopes = this.filterScopes(scopes);
    }

    // get the user object if a session exists
    const userObject = user ? user : this.getUser();

    // if already in progress, do not proceed
    if (this.pAcquireTokenInProgress) {
      return;
    }

    // TODO: This is not used. Get rid of this?
    const scope = scopes.join(" ").toLowerCase();

    // If no session exists prompt the user to login
    if (!userObject && !(extraQueryParameters && (extraQueryParameters.indexOf(Constants.login_hint) !== -1))) {
      // TODO: is it always access token?
      let e = MSALError.InteractionRequiredAuthError.createLoginRequiredAuthError(
        Constants.accessToken,
        this.getUserState(this.pCacheStorage.getItem(Constants.stateLogin))
      );
      this.pConfig.system.logger.info(e.errorCode + ": " + e.message);
      if (this.pErrorReceivedCallback) {
        this.pErrorReceivedCallback(e);
      }
      return;
    }

    // track the acquireToken progress
    this.pAcquireTokenInProgress = true;

    let authenticationRequest: AuthenticationRequestParameters;
    let acquireTokenAuthority = authority ? AuthorityFactory.CreateInstance(authority, this.pConfig.auth.validateAuthority) : this.authorityInstance;
    let responseType = ResponseTypes.id_token;

    acquireTokenAuthority.ResolveEndpointsAsync().then(() => {

      // Cache Nonce
      responseType = (Utils.compareObjects(userObject, this.getUser())) ? ResponseTypes.id_token : ResponseTypes.id_token_token;
      responseType = (scopes.indexOf(this.pConfig.auth.clientId) > -1) ? ResponseTypes.id_token : ResponseTypes.token;

      authenticationRequest = new AuthenticationRequestParameters(
        acquireTokenAuthority,
        this.pConfig.auth.clientId,
        scopes,
        responseType,
        this.getRedirectUri(),
        this.pConfig.auth.state
      );

      this.pCacheStorage.setItem(Constants.nonceIdToken, authenticationRequest.nonce);

      // Cache acquireTokenUserKey
      var acquireTokenUserKey;
      let userId;
      (userObject) ? userId = userObject.userIdentifier : userId = Constants.no_user;
      acquireTokenUserKey = Constants.acquireTokenUser + Constants.resourceDelimeter + userId + Constants.resourceDelimeter + authenticationRequest.state;
      this.pCacheStorage.setItem(acquireTokenUserKey, JSON.stringify(userObject));

      // Cache authorityKey
      const authorityKey = Constants.authority + Constants.resourceDelimeter + authenticationRequest.state;
      this.pCacheStorage.setItem(authorityKey, acquireTokenAuthority.CanonicalAuthority);

      // Set extraParameters to be sent to the Server
      if (extraQueryParameters) {
        authenticationRequest.extraQueryParameters = extraQueryParameters;
      }

      // Construct urlNavigate
      let urlNavigate = authenticationRequest.createNavigateUrl(scopes) + Constants.response_mode_fragment;
      urlNavigate = this.addHintParameters(urlNavigate, userObject);

      // set state in Cache and redirect to the urlNavigate
      if (urlNavigate) {
        this.pCacheStorage.setItem(Constants.stateAcquireToken, authenticationRequest.state);
        window.location.replace(urlNavigate);
      }

    });
  }

  /** 
   * Used to acquire an access token for a new user using interactive authentication via a popup Window.
   * To request an id_token, pass the clientId as the only scope in the scopes array.
   * 
   * @param {Array<string>} scopes - Permissions you want included in the access token. 
   *  Not all scopes are  guaranteed to be included in the access token. Scopes like "openid" and "profile" are sent with every request.
   * @param {string} authority - A URL indicating a directory that MSAL can use to obtain tokens.
   * - In Azure AD, it is of the form https://&lt;tenant&gt;/&lt;tenant&gt;, 
   *    where &lt;tenant&gt; is the directory host (e.g. https://login.microsoftonline.com) 
   *    and &lt;tenant&gt; is a identifier within the directory itself 
   *    (e.g. a domain associated to the tenant, such as contoso.onmicrosoft.com, or the GUID representing the TenantID property of the directory)
   * - In Azure B2C, it is of the form https://&lt;instance&gt;/tfp/&lt;tenant&gt;/<policyName>/
   * - Default value is: "https://login.microsoftonline.com/common".
   * @param {User} user - The user for which the scopes are requested.The default user is the logged in user.
   * @param {string} extraQueryParameters - Key-value pairs to pass to the STS during the  authentication flow.
   * @returns {Promise.<string>} - A Promise that is fulfilled when this function has completed, or rejected if an error was raised. Returns the token or error.
   */
  acquireTokenPopup(scopes: Array<string>): Promise<string>;
  acquireTokenPopup(scopes: Array<string>, authority: string): Promise<string>;
  acquireTokenPopup(scopes: Array<string>, authority: string, user: User): Promise<string>;
  acquireTokenPopup(scopes: Array<string>, authority: string, user: User, extraQueryParameters: string): Promise<string>;
  acquireTokenPopup(scopes: Array<string>, authority?: string, user?: User, extraQueryParameters?: string): Promise<string> {

    return new Promise<string>((resolve, reject) => {
      // validate the scopes
      if (scopes) {
        try {
          // TODO: Is this always access token?
          this.validateInputScope(scopes, Constants.accessToken);
        } catch (error) {
          if(error instanceof MSALError.ConfigurationError) {
            // Expected error from validation function
            reject(error);
          } else {
            // Unexpected error
            // TODO: Is this always access token?
            reject(
              MSALError.AuthError.createUnexpectedError(
                error.toString(), 
                Constants.accessToken, 
                this.getUserState(this.pCacheStorage.getItem(Constants.stateLogin))
              )
            );
          }
          return;
        }
        // TODO: combine validate and filterScopes to reduce code duplication
        scopes = this.filterScopes(scopes);
      }
      const scope = scopes.join(" ").toLowerCase();

      // get the user object if session exists
      const userObject = user ? user : this.getUser();

      // If already in progress, reject the request
      if (this.pAcquireTokenInProgress) {
        reject(
          // TODO: Is this always access token?
          MSALError.ClientAuthError.createAcquireTokenInProgressError(
            Constants.accessToken,
            this.getUserState(this.pCacheStorage.getItem(Constants.stateLogin))
          )
        );
        return;
      }

      //if user is not currently logged in and no login_hint is passed
      if (!userObject && !(extraQueryParameters && (extraQueryParameters.indexOf(Constants.login_hint) !== -1))) {
        this.pConfig.system.logger.info("User login is required");
        reject(ErrorCodes.userLoginError + Constants.resourceDelimeter + ErrorDescription.userLoginError);
        return;
      }

      // track the acquireToken progress
      this.pAcquireTokenInProgress = true;

      let authenticationRequest: AuthenticationRequestParameters;
      let acquireTokenAuthority = authority ? AuthorityFactory.CreateInstance(authority, this.pConfig.auth.validateAuthority) : this.authorityInstance;

      // open the popup window
      var popUpWindow = this.openWindow("about:blank", "_blank", 1, this, resolve, reject);
      if (!popUpWindow) {
        // TODO: we should be rejecting with an error here
        return;
      }

      let responseType = ResponseTypes.id_token;

      acquireTokenAuthority.ResolveEndpointsAsync().then(() => {
        // onFulfillment
        /*
        if (Utils.compareObjects(userObject, this.getUser())) {
          if (scopes.indexOf(this.pConfig.auth.clientId) > -1) {
            responseType = ResponseTypes.id_token;
          }
          else {
            responseType = ResponseTypes.token;
          }
        }
        else {
          responseType = ResponseTypes.id_token_token;
        }
        */

        // Cache nonce
        responseType = (Utils.compareObjects(userObject, this.getUser())) ? ResponseTypes.id_token : ResponseTypes.id_token_token;
        responseType = (scopes.indexOf(this.pConfig.auth.clientId) > -1) ? ResponseTypes.id_token : ResponseTypes.token;

        authenticationRequest = new AuthenticationRequestParameters(
          acquireTokenAuthority,
          this.pConfig.auth.clientId,
          scopes,
          responseType,
          this.getRedirectUri(),
          this.pConfig.auth.state
        );

        // TODO: Why is this.pConfig.cache.storeAuthStateInCookie not passed for CacheStorage here??
        this.pCacheStorage.setItem(Constants.nonceIdToken, authenticationRequest.nonce);

        // Cache acquireTokenUserKey
        var acquireTokenUserKey;
        let userId;
        (userObject) ? userId = userObject.userIdentifier : userId = Constants.no_user;
        acquireTokenUserKey = Constants.acquireTokenUser + Constants.resourceDelimeter + userId + Constants.resourceDelimeter + authenticationRequest.state;
        this.pCacheStorage.setItem(acquireTokenUserKey, JSON.stringify(userObject));

        // Cache authorityKey
        const authorityKey = Constants.authority + Constants.resourceDelimeter + authenticationRequest.state;
        this.pCacheStorage.setItem(authorityKey, acquireTokenAuthority.CanonicalAuthority);

        // set the extra Parameters
        if (extraQueryParameters) {
          authenticationRequest.extraQueryParameters = extraQueryParameters;
        }

        // Construct the urlNavigate, open the popup Window to the urlNavigate
        let urlNavigate = authenticationRequest.createNavigateUrl(scopes) + Constants.response_mode_fragment;
        urlNavigate = this.addHintParameters(urlNavigate, userObject);

        window.renewStates.push(authenticationRequest.state);
        window.requestType = Constants.renewToken;

        this.registerCallback(authenticationRequest.state, scope, resolve, reject);

        if (popUpWindow) {
          popUpWindow.location.href = urlNavigate;
        }

      }, () => {
        // onRejection
        // TODO: Is this always access token?
        let e = MSALError.ClientAuthError.createEndpointResolutionError(
          "",
          responseType,
          this.getUserState(this.pCacheStorage.getItem(Constants.stateLogin))
        );
        this.pConfig.system.logger.info(ErrorCodes.endpointResolutionError + ":" + ErrorDescription.endpointResolutionError);

        this.pCacheStorage.setItem(Constants.msalError, ErrorCodes.endpointResolutionError);
        this.pCacheStorage.setItem(Constants.msalErrorDescription, ErrorDescription.endpointResolutionError);

        if (reject) {
          reject(ErrorCodes.endpointResolutionError + Constants.resourceDelimeter + ErrorDescription.endpointResolutionError);
        }
        if (popUpWindow) {
          popUpWindow.close();
        }
      }).catch((err) => {
        this.pConfig.system.logger.warning("could not resolve endpoints");
        reject(err);
      });
    });
  }

  /** 
   * Used to get the token from cache.
   * MSAL will return the cached token if it is not expired.
   * Or it will send a request to the STS to obtain an access_token using a hidden iframe. 
   * To renew idToken, clientId should be passed as the only scope in the scopes array.
   * 
   * @param {Array<string>} scopes - Permissions you want included in the access token. 
   *  Not all scopes are  guaranteed to be included in the access token. Scopes like "openid" and "profile" are sent with every request.
   * @param {string} authority - A URL indicating a directory that MSAL can use to obtain tokens.
   * - In Azure AD, it is of the form https://&lt;tenant&gt;/&lt;tenant&gt;, 
   *    where &lt;tenant&gt; is the directory host (e.g. https://login.microsoftonline.com) 
   *    and &lt;tenant&gt; is a identifier within the directory itself 
   *    (e.g. a domain associated to the tenant, such as contoso.onmicrosoft.com, or the GUID representing the TenantID property of the directory)
   * - In Azure B2C, it is of the form https://&lt;instance&gt;/tfp/&lt;tenant&gt;/<policyName>/
   * - Default value is: "https://login.microsoftonline.com/common"
   * @param {User} user - The user for which the scopes are requested.The default user is the logged in user.
   * @param {string} extraQueryParameters - Key-value pairs to pass to the STS during the  authentication flow.
   * @returns {Promise.<string>} - A Promise that is fulfilled when this function has completed, or rejected if an error was raised. 
   *  Resolved with token or rejected with error.
   */
  @resolveTokenOnlyIfOutOfIframe
  acquireTokenSilent(scopes: Array<string>, authority?: string, user?: User, extraQueryParameters?: string): Promise<string> {

    return new Promise<string>((resolve, reject) => {

      // validate the scopes
      if (scopes) {
        try {
          // TODO: Is this always access token?
          this.validateInputScope(scopes, Constants.accessToken);
        } catch (error) {
          if(error instanceof MSALError.ConfigurationError) {
            // Expected error from validation function
            reject(error);
          } else {
            // Unexpected error
            // TODO: Is this always access token?
            reject(
              MSALError.AuthError.createUnexpectedError(
                error.toString(), 
                Constants.accessToken, 
                this.getUserState(this.pCacheStorage.getItem(Constants.stateLogin))
              )
            );
          }
          return null;
        }
        // TODO: combine validate and filterScopes to reduce code duplication
        scopes = this.filterScopes(scopes);
      }
      const scope = scopes.join(" ").toLowerCase();

      const userObject = user ? user : this.getUser();
      const adalIdToken = this.pCacheStorage.getItem(Constants.adalIdToken);

      //if user is not currently logged in and no login_hint/sid is passed as an extraQueryParamater
      if (!userObject && Utils.checkSSO(extraQueryParameters) && Utils.isEmpty(adalIdToken)) {
        this.pConfig.system.logger.info("User login is required");
        reject(
          MSALError.InteractionRequiredAuthError.createLoginRequiredAuthError(
            Constants.accessToken,
            this.getUserState(this.pCacheStorage.getItem(Constants.stateLogin))
          )
        );
        return null;
      }

      //if user didn't pass the login_hint and adal's idtoken is present and no userobject, use the login_hint from adal's idToken
      else if (!userObject && !Utils.isEmpty(adalIdToken)) {
        const idTokenObject = Utils.extractIdToken(adalIdToken);
        console.log("ADAL's idToken exists. Extracting login information from ADAL's idToken ");
        extraQueryParameters = Utils.constructUnifiedCacheExtraQueryParameter(idTokenObject, extraQueryParameters);
      }

      let authenticationRequest: AuthenticationRequestParameters;
      let responseType;
      responseType = (Utils.compareObjects(userObject, this.getUser())) ? ResponseTypes.id_token : ResponseTypes.id_token_token;
      responseType = (scopes.indexOf(this.pConfig.auth.clientId) > -1) ? ResponseTypes.id_token : ResponseTypes.token;

      authenticationRequest = new AuthenticationRequestParameters(
        AuthorityFactory.CreateInstance(authority, this.pConfig.auth.validateAuthority),
        this.pConfig.auth.clientId,
        scopes,
        responseType,
        this.getRedirectUri(),
        this.pConfig.auth.state
      );
      //const cacheResult = this.getCachedToken(authenticationRequest, userObject);
      var cacheResult;
      try{
        cacheResult = this.getCachedToken(authenticationRequest, userObject);
      } catch (err) {
        if (err instanceof MSALError.ClientAuthError) {
          this.pConfig.system.logger.infoPii(err.errorCode + ":" + err.message);
          reject(err);
        } else {
          let e = MSALError.AuthError.createUnexpectedError(
            "Error retrieving cached token result: " + err.toString(),
            responseType,
            this.getUserState(this.pCacheStorage.getItem(Constants.stateLogin))
          )
          this.pConfig.system.logger.infoPii(e.errorCode + ":" + e.message);
          reject(e);
        }
        return null;
      }
      // resolve/reject if in cache
      if (cacheResult) {
        if (cacheResult.token) {
          this.pConfig.system.logger.info("Token is already in cache for scope:" + scope);
          resolve(cacheResult.token);
          return null;
        }
      }
      // else proceed with the login
      else {
        this.pConfig.system.logger.verbose("Token is not in cache for scope:" + scope);
      }

      // Cache result can return null if cache is empty. In that case, set authority to default value if no authority is passed to the api.
      // TODO: Do we need to check if cache result is empty before calling this?
      if (!authenticationRequest.authorityInstance) {
        authenticationRequest.authorityInstance = authority ? AuthorityFactory.CreateInstance(authority, this.pConfig.auth.validateAuthority) : this.authorityInstance;
      }

      // cache miss - renew the Token
      // TODO: Grok this and see if this window specific code can be improved - it is complicated now
      return authenticationRequest.authorityInstance.ResolveEndpointsAsync()
        .then(() => {
          // refresh attept with iframe; Already renewing for this scope, callback when we get the token.
          if (window.activeRenewals[scope]) {
            this.pConfig.system.logger.verbose("Renew token for scope: " + scope + " is in progress. Registering callback");

            //Active renewals contains the state for each renewal
            this.registerCallback(window.activeRenewals[scope], scope, resolve, reject);
          }
          else {
            if (scopes && scopes.indexOf(this.pConfig.auth.clientId) > -1 && scopes.length === 1) {
              // App uses idToken to send to api endpoints; Default scope is tracked as clientId to store this token
              this.pConfig.system.logger.verbose("renewing idToken");
              this.renewIdToken(scopes, resolve, reject, userObject, authenticationRequest, extraQueryParameters);

            }
            else {
              // renew access token
              this.pConfig.system.logger.verbose("renewing accesstoken");
              this.renewToken(scopes, resolve, reject, userObject, authenticationRequest, extraQueryParameters);
            }
          }
        }).catch((err) => {
          let e = MSALError.ClientAuthError.createEndpointResolutionError(
            err.toString(),
            Constants.accessToken,
            this.getUserState(this.pCacheStorage.getItem(Constants.stateLogin))
          );
          this.pConfig.system.logger.warning(e.errorCode + ": "  + e.message);
          reject(e);
          return null;
        });
    });
  }

  /**
   * Check if ADAL id_token exists
   * 
   * @hidden
   */
  private extractADALIdToken(): any {
    const adalIdToken = this.pCacheStorage.getItem(Constants.adalIdToken);
    if (!Utils.isEmpty(adalIdToken)) {
      return Utils.extractIdToken(adalIdToken);
    }
    return null;
  }

  /** 
   * Calling _loadFrame but with a timeout to signal failure in loadframeStatus. Callbacks are left.
   * registered when network errors occur and subsequent token requests for same resource are registered to the pending request.
   * 
   * @ignore
   * @hidden
   */
  private loadIframeTimeout(urlNavigate: string, frameName: string, scope: string): void {

    //set iframe session to pending
    const expectedState = window.activeRenewals[scope];
    this.pConfig.system.logger.verbose("Set loading state to pending for: " + scope + ":" + expectedState);
    this.pCacheStorage.setItem(Constants.renewStatus + expectedState, Constants.tokenRenewStatusInProgress);

    this.loadFrame(urlNavigate, frameName);

    setTimeout(() => {
      if (this.pCacheStorage.getItem(Constants.renewStatus + expectedState) === Constants.tokenRenewStatusInProgress) {

        // fail the iframe session if it's in pending state
        this.pConfig.system.logger.verbose("Loading frame has timed out after: " +
          (this.pConfig.system.loadFrameTimeout / 1000) + " seconds for scope " + scope + ":" + expectedState);

        // errorout after the timeout
        if (expectedState && window.callBackMappedToRenewStates[expectedState]) {
          window.callBackMappedToRenewStates[expectedState]("Token renewal operation failed due to timeout", null, "Token Renewal Failed", Constants.accessToken);
        }

        this.pCacheStorage.setItem(Constants.renewStatus + expectedState, Constants.tokenRenewStatusCancelled);
      }
    }, this.pConfig.system.loadFrameTimeout);
  }

  /** 
   * Loads iframe with authorization endpoint URL
   * 
   * @ignore
   * @hidden
   */
  private loadFrame(urlNavigate: string, frameName: string): void {

    // This trick overcomes iframe navigation in IE; IE does not load the page consistently in iframe
    this.pConfig.system.logger.info("LoadFrame: " + frameName);
    var frameCheck = frameName;

    // TODO: VSTS AI, work on either removing the 500ms timeout or making it optional for IE??
    setTimeout(() => {
      var frameHandle = this.addAdalFrame(frameCheck);
      if (frameHandle.src === "" || frameHandle.src === "about:blank") {
        frameHandle.src = urlNavigate;
        this.pConfig.system.logger.infoPii("Frame Name : " + frameName + " Navigated to: " + urlNavigate);
      }
    }, 500);
  }

  /** 
   * Adds the hidden iframe for silent token renewal.
   * TODO: Should we rename this function as addHiddenIFrame??
   * 
   * @ignore
   * @hidden
   */
  private addAdalFrame(iframeId: string): HTMLIFrameElement {

    if (typeof iframeId === "undefined") {
      return null;
    }

    this.pConfig.system.logger.info("Add msal frame to document:" + iframeId);
    let adalFrame = document.getElementById(iframeId) as HTMLIFrameElement;

    if (!adalFrame) {
      if (document.createElement &&
        document.documentElement &&
        (window.navigator.userAgent.indexOf("MSIE 5.0") === -1)) {
        const ifr = document.createElement("iframe");
        ifr.setAttribute("id", iframeId);
        ifr.style.visibility = "hidden";
        ifr.style.position = "absolute";
        ifr.style.width = ifr.style.height = "0";
        ifr.style.border = "0";
        adalFrame = (document.getElementsByTagName("body")[0].appendChild(ifr) as HTMLIFrameElement);
      }
      else if (document.body && document.body.insertAdjacentHTML) {
        document.body.insertAdjacentHTML("beforeend", "<iframe name='" + iframeId + "' id='" + iframeId + "' style='display:none'></iframe>");
      }

      if (window.frames && window.frames[iframeId]) {
        adalFrame = window.frames[iframeId];
      }
    }

    return adalFrame;
  }

  /** 
   * Acquires access token using a hidden iframe.
   *
   * @ignore
   * @hidden
   */
  private renewToken(
    scopes: Array<string>,
    resolve: Function,
    reject: Function,
    user: User,
    authenticationRequest: AuthenticationRequestParameters,
    extraQueryParameters?: string
  ): void {

    const scope = scopes.join(" ").toLowerCase();
    this.pConfig.system.logger.verbose("renewToken is called for scope:" + scope);

    const frameHandle = this.addAdalFrame("msalRenewFrame" + scope);

    if (extraQueryParameters) {
      authenticationRequest.extraQueryParameters = extraQueryParameters;
    }

    // cache acquireTokenUserKey
    var acquireTokenUserKey;
    let userId = user ? user.userIdentifier : Constants.no_user;
    acquireTokenUserKey = Constants.acquireTokenUser + Constants.resourceDelimeter + userId + Constants.resourceDelimeter + authenticationRequest.state;
    this.pCacheStorage.setItem(acquireTokenUserKey, JSON.stringify(user));

    // cache authorityKey
    const authorityKey = Constants.authority + Constants.resourceDelimeter + authenticationRequest.state;
    this.pCacheStorage.setItem(authorityKey, authenticationRequest.authority);

    // renew happens in iframe, so it keeps javascript context
    this.pCacheStorage.setItem(Constants.nonceIdToken, authenticationRequest.nonce);
    this.pConfig.system.logger.verbose("Renew token Expected state: " + authenticationRequest.state);

    // construct the urlNavigate with prompt = none and navigate to the url in the hidden iFrame
    let urlNavigate = Utils.urlRemoveQueryStringParameter(authenticationRequest.createNavigateUrl(scopes), Constants.prompt) + Constants.prompt_none;
    urlNavigate = this.addHintParameters(urlNavigate, user);

    window.renewStates.push(authenticationRequest.state);
    window.requestType = Constants.renewToken;

    this.registerCallback(authenticationRequest.state, scope, resolve, reject);
    this.pConfig.system.logger.infoPii("Navigate to:" + urlNavigate);

    frameHandle.src = "about:blank";
    this.loadIframeTimeout(urlNavigate, "msalRenewFrame" + scope, scope);
  }

  /** 
   * Renews idtoken for app's own backend when clientId is passed as a single scope in the scopes array.
   * 
   * @ignore
   * @hidden
   */
  private renewIdToken(scopes: Array<string>,
    resolve: Function,
    reject: Function,
    user: User,
    authenticationRequest: AuthenticationRequestParameters,
    extraQueryParameters?: string
  ): void {

    this.pConfig.system.logger.info("renewidToken is called");
    const frameHandle = this.addAdalFrame("msalIdTokenFrame");

    // populate extraQueryParameters in the request sent to the server
    if (extraQueryParameters) {
      authenticationRequest.extraQueryParameters = extraQueryParameters;
    }

    // cache acquireTokenUserKey
    var acquireTokenUserKey;
    let userId = user ? user.userIdentifier : Constants.no_user;
    acquireTokenUserKey = Constants.acquireTokenUser + Constants.resourceDelimeter + userId + Constants.resourceDelimeter + authenticationRequest.state;
    this.pCacheStorage.setItem(acquireTokenUserKey, JSON.stringify(user));

    // cache authorityKey
    const authorityKey = Constants.authority + Constants.resourceDelimeter + authenticationRequest.state;
    this.pCacheStorage.setItem(authorityKey, authenticationRequest.authority);

    // cache nonce
    this.pCacheStorage.setItem(Constants.nonceIdToken, authenticationRequest.nonce);

    this.pConfig.system.logger.verbose("Renew Idtoken Expected state: " + authenticationRequest.state);

    // construct the urlNavigate with prompt = none and navigate to the url in the hidden iFrame
    let urlNavigate = Utils.urlRemoveQueryStringParameter(authenticationRequest.createNavigateUrl(scopes), Constants.prompt) + Constants.prompt_none;
    urlNavigate = this.addHintParameters(urlNavigate, user);


    if (this.pSilentLogin) {
      window.requestType = Constants.login;
      this.pSilentAuthenticationState = authenticationRequest.state;
    }
    else {
      window.requestType = Constants.renewToken;
      window.renewStates.push(authenticationRequest.state);
    }

    // note: scope here is clientId
    this.registerCallback(authenticationRequest.state, this.pConfig.auth.clientId, resolve, reject);

    this.pConfig.system.logger.infoPii("Navigate to:" + urlNavigate);

    frameHandle.src = "about:blank";
    this.loadIframeTimeout(urlNavigate, "msalIdTokenFrame", this.pConfig.auth.clientId);
  }


  /**
   * Returns the signed in user (received from a user object created at the time of login) or null.
   */
  getUser(): User {

    // if a session already exists, get the user from the session
    if (this._user) {
      return this._user;
    }

    // frame is used to get idToken - and populate the user for the given session
    const rawIdToken = this.pCacheStorage.getItem(Constants.idTokenKey);
    const rawClientInfo = this.pCacheStorage.getItem(Constants.msalClientInfo);

    if (!Utils.isEmpty(rawIdToken) && !Utils.isEmpty(rawClientInfo)) {
      const idToken = new IdToken(rawIdToken);
      const clientInfo = new ClientInfo(rawClientInfo);
      this._user = User.createUser(idToken, clientInfo);
      return this._user;
    }

    // if login not yet done, return null
    // TODO: Should we throw error instead of returning null?
    return null;
  }

  /** 
   * This method must be called for processing the response received from the STS. 
   * It extracts the hash, processes the token or error information and saves it in the cache. 
   * It then calls the registered callbacks in case of redirect or resolves the promises with the result.
   * 
   * @param {string} [hash=window.location.hash] - Hash fragment of Url.
   * @hidden
   */
  private handleAuthenticationResponse(hash: string): void {

    // retrieve the hash
    if (hash == null) {
      hash = window.location.hash;
    }

    var self = null;
    var isPopup: boolean = false;
    var isWindowOpenerMsal = false;

    // check if the current window opened the iFrame/popup 
    try {
      isWindowOpenerMsal = window.opener && window.opener.msal && window.opener.msal !== window.msal;
    } catch (err) {
      // err = SecurityError: Blocked a frame with origin "[url]" from accessing a cross-origin frame.
      isWindowOpenerMsal = false;
    }

    // set the self to the window that created the iFrame/popup??
    if (isWindowOpenerMsal) {
      self = window.opener.msal;
      isPopup = true;
    }
    else if (window.parent && window.parent.msal) {
      self = window.parent.msal;
    }

    // if (window.parent !== window), by using self, window.parent becomes equal to window in getRequestInfo method specifically
    // TODO: Refactor so that this function returns a response object
    const requestInfo = self.getRequestInfo(hash);

    let token: string = null;
    let tokenReceivedCallback: (errorDesc: string, token: string, error: string, tokenType: string) => void = null;
    let tokenType: string;

    self.pConfig.system.logger.info("Returned from redirect url");

    // if parent window is the msal instance that opened the other windows ??
    if (window.parent !== window && window.parent.msal) {
      tokenReceivedCallback = window.parent.callBackMappedToRenewStates[requestInfo.stateResponse];
    }
    // if current window is the opener
    else if (isWindowOpenerMsal) {
      tokenReceivedCallback = window.opener.callBackMappedToRenewStates[requestInfo.stateResponse];
    }
    // all other cases
    else {
      // if set to navigate to loginRequest page post login
      if (self.pConfig.auth.navigateToLoginRequestUrl) {
        tokenReceivedCallback = null;
        self.pCacheStorage.setItem(Constants.urlHash, hash);

        if (window.parent === window && !isPopup) {
          window.location.href = self.pCacheStorage.getItem(Constants.loginRequest, this.pConfig.cache.storeAuthStateInCookie);
        }
        return;
      }
      // close the current window ??
      else {
        tokenReceivedCallback = self.pTokenReceivedCallback;
        window.location.hash = "";
      }

    }

    // save the token from the hash
    self.saveTokenFromHash(requestInfo);

    // acquireToken request
    if ((requestInfo.requestType === Constants.renewToken) && window.parent) {
      // Log if silent or interactive login
      if (window.parent !== window) {
        self._logger.verbose("Window is in iframe, acquiring token silently");
      }
      else {
        self._logger.verbose("acquiring token interactive in progress");
      }

      // retrieve id_token or access_token, In case of response_type = id_token_token, retrieve only access_token
      token = requestInfo.parameters[Constants.accessToken] || requestInfo.parameters[Constants.idToken];
      tokenType = Constants.accessToken;
    }
    // login request
    else if (requestInfo.requestType === Constants.login) {
      token = requestInfo.parameters[Constants.idToken];
      tokenType = Constants.idToken;
    }

    var errorDesc = requestInfo.parameters[Constants.errorDescription];
    var error = requestInfo.parameters[Constants.error];
    var state = null;

    try {
      // We should only send the state back to the developer if it matches with what we received from the server
      // TODO: Change this so that it sends back response object or error object based on what is returned from getRequestInfo()
      if (tokenReceivedCallback) {
        if (requestInfo.stateMatch) {
          state = this.getUserState(requestInfo.stateResponse);
        }
        
        tokenReceivedCallback.call(self, errorDesc, token, error, tokenType, state);
      }
    } catch (err) {
      // TODO: Should we throw error here?
      self._logger.error("Error occurred in token received callback function: " + err);
    }

    // if the current window is the opener, close all windows
    if (isWindowOpenerMsal) {
      for (var i = 0; i < window.opener.openedWindows.length; i++) {
        window.opener.openedWindows[i].close();
      }
    }

  }

  /** 
   * This method must be called for processing the response received from AAD. 
   * It extracts the hash, processes the token or error, saves it in the cache and calls the registered callbacks with the result.
   * 
   * @param {string} authority authority received in the redirect response from AAD.
   * @param {TokenResponse} requestInfo an object created from the redirect response from AAD comprising of the keys - parameters, requestType, stateMatch, stateResponse and valid.
   * @param {User} user user object for which scopes are consented for. The default user is the logged in user.
   * @param {ClientInfo} clientInfo clientInfo received as part of the response comprising of fields uid and utid.
   * @param {IdToken} idToken idToken received as part of the response.
   * @ignore
   * @hidden
   */
  /* tslint:disable:no-string-literal */
  private saveAccessToken(authority: string, tokenResponse: TokenResponse, user: User, clientInfo: string, idToken: IdToken): void {

    let scope: string;
    let clientObj: ClientInfo = new ClientInfo(clientInfo);

    // if the response contains "scope" 
    if (tokenResponse.parameters.hasOwnProperty("scope")) {

      // read scopes
      scope = tokenResponse.parameters["scope"];
      const consentedScopes = scope.split(" ");

      // retrieve all access tokens from the cache, remove the dup scopes
      const accessTokenCacheItems = this.pCacheStorage.getAllAccessTokens(this.pConfig.auth.clientId, authority);

      for (let i = 0; i < accessTokenCacheItems.length; i++) {
        const accessTokenCacheItem = accessTokenCacheItems[i];

        if (accessTokenCacheItem.key.userIdentifier === user.userIdentifier) {
          const cachedScopes = accessTokenCacheItem.key.scopes.split(" ");

          if (Utils.isIntersectingScopes(cachedScopes, consentedScopes)) {
            this.pCacheStorage.removeItem(JSON.stringify(accessTokenCacheItem.key));
          }
        }
      }

      // Generate and cache accessTokenKey and accessTokenValue
      const accessTokenKey = new AccessTokenKey(authority, this.pConfig.auth.clientId, scope, clientObj.uid, clientObj.utid);

      const accessTokenValue = new AccessTokenValue(
        tokenResponse.parameters[Constants.accessToken],
        idToken.rawIdToken,
        Utils.expiresIn(tokenResponse.parameters[Constants.expiresIn]).toString(),
        clientInfo
      );

      this.pCacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
    }
    // if the response does not contain "scope" - scope is usually client_id and the token will be id_token
    else {
      scope = this.pConfig.auth.clientId;

      // Generate and cache accessTokenKey and accessTokenValue
      const accessTokenKey = new AccessTokenKey(authority, this.pConfig.auth.clientId, scope, clientObj.uid, clientObj.utid);

      const accessTokenValue = new AccessTokenValue(
        tokenResponse.parameters[Constants.idToken], // since there is no access_token, this is also set to id_token?
        tokenResponse.parameters[Constants.idToken],
        idToken.expiration,
        clientInfo
      );

      this.pCacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
    }
  }

  /** 
   * Saves token or error received in the response from AAD in the cache. In case of id_token, it also creates the user object.
   * TODO: Break this function - either into utils or token specific --- too long to be readable
   * 
   * @param tokenResponse 
   * @ignore
   * @hidden
   */
  protected saveTokenFromHash(tokenResponse: TokenResponse): void {

    this.pConfig.system.logger.info("State status:" + tokenResponse.stateMatch + "; Request type:" + tokenResponse.requestType);

    this.pCacheStorage.setItem(Constants.msalError, "");
    this.pCacheStorage.setItem(Constants.msalErrorDescription, "");

    var scope: string = "";
    var authorityKey: string = "";
    var acquireTokenUserKey: string = "";

    // if response has "scope" set it, else set the "scope" to client_id
    if (tokenResponse.parameters.hasOwnProperty("scope")) {
      scope = tokenResponse.parameters["scope"].toLowerCase();
    }
    else {
      scope = this.pConfig.auth.clientId;
    }

    // If the server returns an "Error"
    if (tokenResponse.parameters.hasOwnProperty(Constants.errorDescription) || tokenResponse.parameters.hasOwnProperty(Constants.error)) {

      this.pConfig.system.logger.infoPii("Error :" +
        tokenResponse.parameters[Constants.error] +
        "; Error description:" +
        tokenResponse.parameters[Constants.errorDescription]
      );

      this.pCacheStorage.setItem(Constants.msalError, tokenResponse.parameters["error"]);
      this.pCacheStorage.setItem(Constants.msalErrorDescription, tokenResponse.parameters[Constants.errorDescription]);

      // login
      if (tokenResponse.requestType === Constants.login) {
        this.pLoginInProgress = false;
        this.pCacheStorage.setItem(Constants.loginError, tokenResponse.parameters[Constants.errorDescription] + ":" + tokenResponse.parameters[Constants.error]);
        authorityKey = Constants.authority + Constants.resourceDelimeter + tokenResponse.stateResponse;
      }

      // acquireToken
      if (tokenResponse.requestType === Constants.renewToken) {
        this.pAcquireTokenInProgress = false;
        authorityKey = Constants.authority + Constants.resourceDelimeter + tokenResponse.stateResponse;
        var userKey = this.getUser() !== null ? this.getUser().userIdentifier : "";
        acquireTokenUserKey = Constants.acquireTokenUser + Constants.resourceDelimeter + userKey + Constants.resourceDelimeter + tokenResponse.stateResponse;
      }

    }
    // if the server returns "Success" 
    else {

      // Verify the state from redirect and record tokens to storage if exists
      if (tokenResponse.stateMatch) {

        this.pConfig.system.logger.info("State is right");

        if (tokenResponse.parameters.hasOwnProperty(Constants.sessionState)) {
          this.pCacheStorage.setItem(Constants.msalSessionState, tokenResponse.parameters[Constants.sessionState]);
        }

        var idToken: IdToken;
        var clientInfo: string = "";

        // Process access_token
        if (tokenResponse.parameters.hasOwnProperty(Constants.accessToken)) {

          this.pConfig.system.logger.info("Fragment has access token");
          this.pAcquireTokenInProgress = false;
          let user: User;

          // retrieve the id_token from response if present : Is this the case of id_token_token??
          if (tokenResponse.parameters.hasOwnProperty(Constants.idToken)) {
            idToken = new IdToken(tokenResponse.parameters[Constants.idToken]);
          }
          else {
            idToken = new IdToken(this.pCacheStorage.getItem(Constants.idTokenKey));
          }

          // retrieve the authority from cache and replace with tenantID 
          authorityKey = Constants.authority + Constants.resourceDelimeter + tokenResponse.stateResponse;
          let authority: string = this.pCacheStorage.getItem(authorityKey);
          if (!Utils.isEmpty(authority)) {
            authority = Utils.replaceFirstPath(authority, idToken.tenantId);
          }

          // retrieve client_info - if it is not found, generate the uid and utid from idToken
          if (tokenResponse.parameters.hasOwnProperty(Constants.clientInfo)) {
            clientInfo = tokenResponse.parameters[Constants.clientInfo];
          }
          else {
            this.pConfig.system.logger.warning("ClientInfo not received in the response from AAD");
          }

          user = User.createUser(idToken, new ClientInfo(clientInfo));

          // TODO: Can we optimize this?
          acquireTokenUserKey = Constants.acquireTokenUser +
            Constants.resourceDelimeter +
            user.userIdentifier +
            Constants.resourceDelimeter +
            tokenResponse.stateResponse;

          var acquireTokenUserKey_nouser = Constants.acquireTokenUser +
            Constants.resourceDelimeter +
            Constants.no_user +
            Constants.resourceDelimeter +
            tokenResponse.stateResponse;

          let cachedUser: string = this.pCacheStorage.getItem(acquireTokenUserKey);
          let acquireTokenUser: User;

          // Check with the user in the Cache
          if (!Utils.isEmpty(cachedUser)) {

            acquireTokenUser = JSON.parse(cachedUser);
            if (user && acquireTokenUser && Utils.compareObjects(user, acquireTokenUser)) {
              this.saveAccessToken(authority, tokenResponse, user, clientInfo, idToken);
              this.pConfig.system.logger.info(
                "The user object received in the response is the same as the one passed in the acquireToken request");
            }
            else {
              this.pConfig.system.logger.warning(
                "The user object created from the response is not the same as the one passed in the acquireToken request");
            }
          }
          else if (!Utils.isEmpty(this.pCacheStorage.getItem(acquireTokenUserKey_nouser))) {
            this.saveAccessToken(authority, tokenResponse, user, clientInfo, idToken);
          }

        }

        // Process id_token
        if (tokenResponse.parameters.hasOwnProperty(Constants.idToken)) {

          this.pConfig.system.logger.info("Fragment has id token");

          // Stop 
          this.pLoginInProgress = false;

          idToken = new IdToken(tokenResponse.parameters[Constants.idToken]);
          if (tokenResponse.parameters.hasOwnProperty(Constants.clientInfo)) {
            clientInfo = tokenResponse.parameters[Constants.clientInfo];
          }
          else {
            this.pConfig.system.logger.warning("ClientInfo not received in the response from AAD");
          }

          authorityKey = Constants.authority + Constants.resourceDelimeter + tokenResponse.stateResponse;
          let authority: string = this.pCacheStorage.getItem(authorityKey);
          if (!Utils.isEmpty(authority)) {
            authority = Utils.replaceFirstPath(authority, idToken.tenantId);
          }

          this._user = User.createUser(idToken, new ClientInfo(clientInfo));

          
          if (idToken && idToken.nonce) {
            // check nonce integrity if idToken has nonce - throw an error if not matched
            if (idToken.nonce !== this.pCacheStorage.getItem(Constants.nonceIdToken)) {
              this._user = null;
              
              // TODO: optimize this - may be combine if it is a string in both cases
              this.pCacheStorage.setItem(
                Constants.loginError, 
                "Nonce Mismatch. Expected Nonce: " + 
                this.pCacheStorage.getItem(Constants.nonceIdToken) + 
                "," + 
                "Actual Nonce: " + 
                idToken.nonce
              );

              this.pConfig.system.logger.error("Nonce Mismatch.Expected Nonce: " + 
                this.pCacheStorage.getItem(Constants.nonceIdToken) + 
                "," + 
                "Actual Nonce: " + 
                idToken.nonce
              );

            } 
            // save the token
            else {
              
              this.pCacheStorage.setItem(Constants.idTokenKey, tokenResponse.parameters[Constants.idToken]);
              this.pCacheStorage.setItem(Constants.msalClientInfo, clientInfo);

              // Save idToken as access token for app itself
              this.saveAccessToken(authority, tokenResponse, this._user, clientInfo, idToken);
            }
          } 
          else {
            // TODO: avoid repeated strings - will this be optimized with error handling?
            authorityKey = tokenResponse.stateResponse;
            acquireTokenUserKey = tokenResponse.stateResponse;

            this.pConfig.system.logger.error("Invalid id_token received in the response");

            tokenResponse.parameters["error"] = "invalid idToken";
            tokenResponse.parameters["error_description"] = "Invalid idToken. idToken: " + tokenResponse.parameters[Constants.idToken];

            this.pCacheStorage.setItem(Constants.msalError, "invalid idToken");
            this.pCacheStorage.setItem(Constants.msalErrorDescription, "Invalid idToken. idToken: " + tokenResponse.parameters[Constants.idToken]);
          }
        }
      }
      // Unexpected state 
      else {
        authorityKey = tokenResponse.stateResponse;
        acquireTokenUserKey = tokenResponse.stateResponse;

        this.pConfig.system.logger.error("State Mismatch.Expected State: " + 
          this.pCacheStorage.getItem(Constants.stateLogin) + 
          "," + 
          "Actual State: " + 
          tokenResponse.stateResponse
        );

        // TODO: avoid repeated strings - will this be optimized with error handling?
        tokenResponse.parameters["error"] = "Invalid_state";
        tokenResponse.parameters["error_description"] = "Invalid_state. state: " + tokenResponse.stateResponse;

        this.pCacheStorage.setItem(Constants.msalError, "Invalid_state");
        this.pCacheStorage.setItem(Constants.msalErrorDescription, "Invalid_state. state: " + tokenResponse.stateResponse);
      }
    }

    this.pCacheStorage.setItem(Constants.renewStatus + tokenResponse.stateResponse, Constants.tokenRenewStatusCompleted);
    this.pCacheStorage.removeAcquireTokenEntries(authorityKey, acquireTokenUserKey);

    //this is required if navigateToLoginRequestUrl = false
    if (this.pConfig.cache.storeAuthStateInCookie) {
      this.pCacheStorage.setItemCookie(authorityKey, "", -1);
      this.pCacheStorage.clearCookie();
    }

  }
  /* tslint:enable:no-string-literal */

  /** 
   * Checks if the redirect response is received from the STS. In case of redirect, the url fragment has either id_token, access_token or error.
   * 
   * @param {string} hash - Hash passed from redirect page.
   * @returns {Boolean} - true if response contains id_token, access_token or error, false otherwise.
   * @hidden
   */
  isCallback(hash: string): boolean {
    hash = this.getHash(hash);
    const parameters = Utils.deserialize(hash);

    return (
      parameters.hasOwnProperty(Constants.errorDescription) ||
      parameters.hasOwnProperty(Constants.error) ||
      parameters.hasOwnProperty(Constants.accessToken) ||
      parameters.hasOwnProperty(Constants.idToken)
    );
  }

  /** 
   * Returns the anchor part(#) of the URL
   * 
   * @param hash 
   * @ignore
   * @hidden
   */
  private getHash(hash: string): string {

    if (hash.indexOf("#/") > -1) {
      hash = hash.substring(hash.indexOf("#/") + 2);
    } 
    else if (hash.indexOf("#") > -1) {
      hash = hash.substring(1);
    }

    return hash;
  }


  /**
   * Creates a requestInfo object from the URL fragment and returns it.
   * 
   * @param {string} hash  -  Hash passed from redirect page
   * @returns {TokenResponse} an object created from the redirect response from AAD comprising of the keys 
   *  - parameters, requestType, stateMatch, stateResponse and valid.
   * @ignore
   * @hidden
   */
  // TODO: Change to return AuthResponse object
  protected getRequestInfo(hash: string): TokenResponse {

    hash = this.getHash(hash);
    const parameters = Utils.deserialize(hash);
    const tokenResponse = new TokenResponse();
    
    // if there is a hash with Parameters in the redirect response
    if (parameters) {

      tokenResponse.parameters = parameters;
      
      // check for error or tokens
      if (parameters.hasOwnProperty(Constants.errorDescription) ||
        parameters.hasOwnProperty(Constants.error) ||
        parameters.hasOwnProperty(Constants.accessToken) ||
        parameters.hasOwnProperty(Constants.idToken)
      ) {
        
        tokenResponse.valid = true;
      
        // Identify the callback based on the state
        let stateResponse: string;
        if (parameters.hasOwnProperty("state")) {
          stateResponse = parameters.state;
        } 
        else {
          return tokenResponse;
        }

        tokenResponse.stateResponse = stateResponse;

        // async calls can fire iframe and login request at the same time if developer does not use the API as expected
        // incoming callback needs to be looked up to find the request type

         // loginRedirect
        if (stateResponse === this.pCacheStorage.getItem(Constants.stateLogin) || 
          stateResponse === this.pSilentAuthenticationState) { 
          tokenResponse.requestType = Constants.login;
          tokenResponse.stateMatch = true;
          return tokenResponse;
        } 
        //acquireTokenRedirect
        else if (stateResponse === this.pCacheStorage.getItem(Constants.stateAcquireToken)) { 
          tokenResponse.requestType = Constants.renewToken;
          tokenResponse.stateMatch = true;
          return tokenResponse;
        }

        // external api requests may have many renewtoken requests for different resource
        if (!tokenResponse.stateMatch) {

          tokenResponse.requestType = window.requestType;
          const statesInParentContext = window.renewStates;

          for (let i = 0; i < statesInParentContext.length; i++) {
            if (statesInParentContext[i] === tokenResponse.stateResponse) {
              tokenResponse.stateMatch = true;
              break;
            }
          }

        }

      } // hash processing ends
    }

    return tokenResponse;
  }

  /** 
    * Extracts scope value from the state sent with the authentication request.
    * TODO: can this function be removed? not used.
    * 
    * @returns {string} scope.
    * @ignore
    * @hidden
    */
  private getScopeFromState(state: string): string {
    if (state) {
      const splitIndex = state.indexOf("|");
      if (splitIndex > -1 && splitIndex + 1 < state.length) {
        return state.substring(splitIndex + 1);
      }
    }
    return "";
  }

  /** 
   * Extracts state value from the userState sent with the authentication request.
   * 
   * @returns {string} scope.
   * @ignore
   * @hidden
   */
  // TODO: Rename user to account?
  getUserState(state: string) {
    if (state) {
      const splitIndex = state.indexOf("|");
      if (splitIndex > -1 && splitIndex + 1 < state.length) {
        return state.substring(splitIndex + 1);
      }
    }
    return "";
  }


  /** 
    * Returns whether current window is in ifram for token renewal
    * TODO: can this function be removed? not used, or may be use this instead of if in iFrame APIs. Will there be a performance issue for fn calls?
    * 
    * @ignore
    * @hidden
    */
  private isInIframe() {
    return window.parent !== window;
  }

  /**
   * tracks if login is in progress
   */
  loginInProgress(): boolean {
    var pendingCallback = this.pCacheStorage.getItem(Constants.urlHash);
    if (pendingCallback) {
      return true;
    }
    return this.pLoginInProgress;
  }

  /**
   * extract URI from the host
   * 
   * @param uri 
   * @hidden
   */
  private getHostFromUri(uri: string): string {

    // remove http:// or https:// from uri
    var extractedUri = String(uri).replace(/^(https?:)\/\//, "");
    extractedUri = extractedUri.split("/")[0];

    return extractedUri;
  }

  /**
   * Get scopes for the Endpoint - Used in Angular to track protected and unprotected resources without interaction from the developer app
   * 
   * @param endpoint 
   */
  protected getScopesForEndpoint(endpoint: string): Array<string> {

    // if user specified list of unprotectedResources, no need to send token to these endpoints, return null.
    if (this.pConfig.framework.unprotectedResources.length > 0) {

      for (var i = 0; i < this.pConfig.framework.unprotectedResources.length; i++) {
        if (endpoint.indexOf(this.pConfig.framework.unprotectedResources[i]) > -1) {
          return null;
        }
      }

    }

    // process all protected resources and send the matched one
    if (this.pConfig.framework.protectedResourceMap.size > 0) {
      for (let key of Array.from(this.pConfig.framework.protectedResourceMap.keys())) {
        // configEndpoint is like /api/Todo requested endpoint can be /api/Todo/1
        if (endpoint.indexOf(key) > -1) {
          return this.pConfig.framework.protectedResourceMap.get(key);
        }
      }
    }

    // default resource will be clientid if nothing is specified
    // App will use idtoken for calls to itself; check if it's staring from http or https, needs to match with app host
    if (endpoint.indexOf("http://") > -1 || endpoint.indexOf("https://") > -1) {
      if (this.getHostFromUri(endpoint) === this.getHostFromUri(this.getRedirectUri())) {
        return new Array<string>(this.pConfig.auth.clientId);
      }
    } 
    // in angular, the url for $http interceptor call could be relative url, if it's relative call, we'll treat it as app backend call.
    else {
      return new Array<string>(this.pConfig.auth.clientId);
    }

    // if not the app's own backend or not a domain listed in the endpoints structure
    return null;
  }


  /**
   * These APIS are exposed for msalAngular wrapper only
   * 
   * @param loginInProgress 
   */
  protected setloginInProgress(loginInProgress: boolean) {
    this.pLoginInProgress = loginInProgress;
  }

  /**
   * for msalAngular wrapper only
   */
  protected getAcquireTokenInProgress(): boolean {
    return this.pAcquireTokenInProgress;
  }

  /**
   * for msalAngular wrapper only
   * 
   * @param acquireTokenInProgress 
   */
  protected setAcquireTokenInProgress(acquireTokenInProgress: boolean) {
    this.pAcquireTokenInProgress = acquireTokenInProgress;
  }

  /**
   * for msalAngular wrapper only
   */
  protected getLogger() {
    return this.pConfig.system.logger;
  }
}
