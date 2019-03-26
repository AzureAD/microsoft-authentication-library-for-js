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
import { Constants, ErrorCodes, ErrorDescription, SSOTypes, PromptState } from "./Constants";
import { IdToken } from "./IdToken";
import { Logger } from "./Logger";
import { Storage } from "./Storage";
import { TokenResponse } from "./RequestInfo";
import { User } from "./User";
import { Utils } from "./Utils";
import { AuthorityFactory } from "./AuthorityFactory";
import { Configuration } from "./Configuration";
import { AuthenticationParameters } from "./Request";
import { ClientConfigurationError } from "./error/ClientConfigurationError";
import { AuthError } from "./error/AuthError";
import { ClientAuthError } from "./error/ClientAuthError";
import { ServerError } from "./error/ServerError";
import { AuthResponse } from './AuthResponse';

// default authority
/**
 * @param {string} authority - A URL indicating a directory that MSAL can use to obtain tokens.
 * - In Azure AD, it is of the form https://&lt;tenant&gt;/&lt;tenant&gt;, where &lt;tenant&gt; is the directory host (e.g. https://login.microsoftonline.com) and &lt;tenant&gt; is a identifier within the directory itself (e.g. a domain associated to the tenant, such as contoso.onmicrosoft.com, or the GUID representing the TenantID property of the directory)
 * - In Azure B2C, it is of the form https://&lt;instance&gt;/tfp/&lt;tenant&gt;/<policyName>/
 * - Default value is: "https://login.microsoftonline.com/common"
 */
const DEFAULT_AUTHORITY = "https://login.microsoftonline.com/common";

/**
 * Interface to handle iFrame generation, Popup Window creation and redirect handling
 */
// TODO: Add more accurate description and document the design choices made
declare global {
    interface Window {
        msal: Object;
        CustomEvent: CustomEvent;
        Event: Event;
        activeRenewals: {};
        renewStates: Array<string>;
        primaryMsalCallbackMappedToRenewStates : {};
        promiseMappedToRenewStates: {};
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
const ResponseTypes = {
  id_token: "id_token",
  token: "token",
  id_token_token: "id_token token"
};

/**
 * @hidden
 */
// TODO: This will move to Response Object
export interface CacheResult {
  errorDesc: string;
  token: string;
  error: string;
}

/**
 * A type alias for a tokenReceivedCallback function.
 * @param tokenReceivedCallback.token token returned from STS if token request is successful.
 * @param tokenReceivedCallback.tokenType tokenType returned from the STS if API call is successful. Possible values are: id_token OR access_token.
 */
// TODO: Rework the callback as per new design - handleRedirectCallbacks() implementation etc.
export type tokenReceivedCallback = (token: string, tokenType: string, userState: string ) => void;

/**
 * A type alias for a errorReceivedCallback function.
 * @param errorReceivedCallback.errorDesc error object created by library containing error string returned from the STS if API call fails.
 */
export type errorReceivedCallback = (authError: AuthError, userState: string) => void;

/**
 * A wrapper to handle the token response/error within the iFrame always
 *
 * @param target
 * @param propertyKey
 * @param descriptor
 */
// TODO: This functionality of wrapper around a function seem to be changing in the latest TS, check this while fixing npm issues
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

  // input Configuration by the user
  private config: Configuration;

  // TODO: This will be extracted with Response Changes
  private tokenReceivedCallback: tokenReceivedCallback = null;
  private errorReceivedCallback: errorReceivedCallback = null;

  // Added for readability as these params are very frequently used
  private logger: Logger;
  private clientId: string;
  private inCookie: boolean;

  // Cache and Account info referred across token grant flow
  protected cacheStorage: Storage;
  private user: User;

  // state variables
  private userLoginInProgress: boolean;
  private acquireTokenInProgress: boolean;
  private silentAuthenticationState: string;
  private silentLogin: boolean;
  private redirectCallbacksSet: boolean;

  // Authority Functionality
  protected authorityInstance: Authority;

  // If the developer passes an authority, create an instance
  public set authority(val) {
    this.authorityInstance = AuthorityFactory.CreateInstance(val, this.config.auth.validateAuthority);
  }

  // retrieve the authority instance
  public get authority(): string {
    return this.authorityInstance.CanonicalAuthority;
  }

  /**
   * Initialize a UserAgentApplication with a given clientId and authority.
   * @constructor
   * @param {string} clientId - The clientID of your application, you should get this from the application registration portal.
   * @param {string} authority - A URL indicating a directory that MSAL can use to obtain tokens.
   * - In Azure AD, it is of the form https://&lt;instance>/&lt;tenant&gt;,\ where &lt;instance&gt; is the directory host (e.g. https://login.microsoftonline.com) and &lt;tenant&gt; is a identifier within the directory itself (e.g. a domain associated to the tenant, such as contoso.onmicrosoft.com, or the GUID representing the TenantID property of the directory)
   * - In Azure B2C, it is of the form https://&lt;instance&gt;/tfp/&lt;tenantId&gt;/&lt;policyName&gt;/
   * - Default value is: "https://login.microsoftonline.com/common"
   * @param _tokenReceivedCallback -  The function that will get the call back once this API is completed (either successfully or with a failure).
   * @param {boolean} validateAuthority -  boolean to turn authority validation on/off.
   */
  constructor(configuration: Configuration) {

    // Set the Configuration
    this.config = configuration;

    // Set the callback boolean
    this.redirectCallbacksSet = false;

    this.logger = this.config.system.logger;
    this.clientId = this.config.auth.clientId;
    this.inCookie = this.config.cache.storeAuthStateInCookie;

    // if no authority is passed, set the default: "https://login.microsoftonline.com/common"
    this.authority = this.config.auth.authority || DEFAULT_AUTHORITY;

    // track login and acquireToken in progress
    this.userLoginInProgress = false;
    this.acquireTokenInProgress = false;

    // cache keys msal - typescript throws an error if any value other than "localStorage" or "sessionStorage" is passed
    try {
        this.cacheStorage = new Storage(this.config.cache.cacheLocation);
    } catch (e) {
        this.config.system.logger.error("CacheLocation can be set only to 'localStorage' or 'sessionStorage' ");
    }

    // Initialize window handling code
    window.openedWindows = [];
    window.activeRenewals = {};
    window.renewStates = [];
    window.primaryMsalCallbackMappedToRenewStates = { };
    window.promiseMappedToRenewStates = { };
    window.msal = this;

    const urlHash = window.location.hash;
    const isCallback = this.isCallback(urlHash);

    // On the server 302 - Redirect, handle this
    if (!this.config.framework.isAngular) {
      if (isCallback) {
        this.handleAuthenticationResponse(urlHash);
      }
      else {
        const pendingCallback = this.cacheStorage.getItem(Constants.urlHash);
        if (pendingCallback) {
          this.processCallBack(pendingCallback);
        }
      }
    }
  }

  //#region Redirect Callbacks
  /**
   * Sets the callback functions for the redirect flow to send back the success or error object.
   * @param {tokenReceivedCallback} successCallback - Callback which contains the AuthResponse object, containing data from the server.
   * @param {errorReceivedCallback} errorCallback - Callback which contains a AuthError object, containing error data from either the server
   * or the library, depending on the origin of the error.
   */
  setRedirectCallbacks(successCallback: tokenReceivedCallback, errorCallback: errorReceivedCallback): void {
    if (!successCallback) {
      this.redirectCallbacksSet = false;
      throw ClientConfigurationError.createInvalidCallbackObjectError("successCallback", successCallback);
    } else if (!errorCallback) {
      this.redirectCallbacksSet = false;
      throw ClientConfigurationError.createInvalidCallbackObjectError("errorCallback", errorCallback);
    }

    // Set callbacks
    this.tokenReceivedCallback = successCallback;
    this.errorReceivedCallback = errorCallback;

    this.redirectCallbacksSet = true;
  }

  //#endregion

  //#region Redirect Flow

  /**
   * Initiate the login process by redirecting the user to the STS authorization endpoint.
   * @param {Array.<string>} scopes - Permissions you want included in the access token. Not all scopes are guaranteed to be included in the access token returned.
   * @param {string} extraQueryParameters - Key-value pairs to pass to the authentication server during the interactive authentication flow.
   */
  loginRedirect(request: AuthenticationParameters): void {
    // Throw error if callbacks are not set before redirect
    if (!this.redirectCallbacksSet) {
      throw ClientConfigurationError.createRedirectCallbacksNotSetError();
    }

    // Creates navigate url; saves value in cache; redirect user to AAD
    if (this.userLoginInProgress) {
      this.errorReceivedCallback(ClientAuthError.createLoginInProgressError(), this.getUserState(this.silentAuthenticationState));
      return;
    }

    // if extraScopesToConsent is passed, append them to the login request
    let scopes: Array<string>;
    if (request.extraScopesToConsent) {
      scopes = [...request.scopes, ...request.extraScopesToConsent];
    }
    else {
      scopes = request.scopes;
    }

    // Validate and filter scopes (the validate function will throw if validation fails)
    this.validateInputScope(scopes, false);

    // construct extraQueryParams string from the request
    let extraQueryParameters = Utils.constructExtraQueryParametersString(request.extraQueryParameters);
    extraQueryParameters = Utils.addPromptParameter(extraQueryParameters, request.prompt);
    let user = this.getUser();

    if (request.account || request.sid || request.loginHint) {
      // if the developer provides one of these, give preference to developer choice
      extraQueryParameters = Utils.constructUnifiedCacheExtraQueryParameter(extraQueryParameters, request, null);

      // if user is not provided, we pass null
      this.loginRedirectHelper(user, scopes, extraQueryParameters);
    }
    // else handle the library data
    else {
      // extract ADAL id_token if exists
      let idTokenObject = this.extractADALIdToken();

      // silent login if ADAL id_token is retrieved successfully - SSO
      if (idTokenObject && !scopes) {
        this.logger.info("ADAL's idToken exists. Extracting login information from ADAL's idToken ");
        let tokenRequest: AuthenticationParameters = this.buildIDTokenRequest(extraQueryParameters);

        this.silentLogin = true;
        this.acquireTokenSilent(tokenRequest).then((idToken) => {
          this.silentLogin = false;
          this.logger.info("Unified cache call is successful");

          // TODO: Change callback to return AuthResponse
          if (this.tokenReceivedCallback) {
            this.tokenReceivedCallback.call(this, null, idToken, null, Constants.idToken, this.getUserState(this.silentAuthenticationState));
          }
        }, (error) => {
          this.silentLogin = false;
          this.logger.error("Error occurred during unified cache ATS");
          this.loginRedirectHelper(null, scopes, extraQueryParameters);
        });
      }
      // else proceed to login
      else {
        this.loginRedirectHelper(null, scopes, extraQueryParameters);
      }
    }
  }

  /**
   * Helper function to loginRedirect
   *
   * @hidden
   * @param scopes
   * @param extraQueryParameters
   */
  private loginRedirectHelper(user: User, scopes?: Array<string>, extraQueryParameters?: string) {
    // Track login in progress
    this.userLoginInProgress = true;

    // TODO: Make this more readable - is authorityInstance changed, what is happening with the return for AuthorityKey?
    this.authorityInstance.ResolveEndpointsAsync()
    .then(() => {
      const authenticationRequest = new AuthenticationRequestParameters(this.authorityInstance, this.clientId, scopes, ResponseTypes.id_token, this.getRedirectUri(), this.config.auth.state);
      if (extraQueryParameters) {
        authenticationRequest.extraQueryParameters = extraQueryParameters;
      }

      // if the user sets the login start page - angular only??
      let loginStartPage = this.cacheStorage.getItem(Constants.angularLoginRequest);
      if (!loginStartPage || loginStartPage === "") {
        loginStartPage = window.location.href;
      } else {
        this.cacheStorage.setItem(Constants.angularLoginRequest, "");
      }

      // Cache the state, nonce, and login request data
      this.cacheStorage.setItem(Constants.loginRequest, loginStartPage, this.inCookie);
      this.cacheStorage.setItem(Constants.loginError, "");

      this.cacheStorage.setItem(Constants.stateLogin, authenticationRequest.state, this.inCookie);
      this.cacheStorage.setItem(Constants.nonceIdToken, authenticationRequest.nonce, this.inCookie);

      this.cacheStorage.setItem(Constants.msalError, "");
      this.cacheStorage.setItem(Constants.msalErrorDescription, "");

      // Cache authorityKey
      const authorityKey = Storage.generateAuthorityKey(authenticationRequest.state);
      this.cacheStorage.setItem(authorityKey, this.authority, this.inCookie);

      // build URL to navigate to proceed with the login
      let urlNavigate = authenticationRequest.createNavigateUrl(scopes)  + Constants.response_mode_fragment;
      // TODO: check if this is needed, if yes, why is it not there before?
      urlNavigate = this.addHintParameters(urlNavigate, user);

      // Redirect user to login URL
      this.promptUser(urlNavigate);
    });
  }

  /**
   * Used to obtain an access_token by redirecting the user to the authorization endpoint.
   * To renew idToken, clientId should be passed as the only scope in the scopes array.
   * @param {Array<string>} scopes - Permissions you want included in the access token. Not all scopes are  guaranteed to be included in the access token. Scopes like "openid" and "profile" are sent with every request.
   * @param {string} authority - A URL indicating a directory that MSAL can use to obtain tokens.
   * - In Azure AD, it is of the form https://{instance}/&lt;tenant&gt;, where &lt;tenant&gt; is the directory host (e.g. https://login.microsoftonline.com) and &lt;tenant&gt; is a identifier within the directory itself (e.g. a domain associated to the tenant, such as contoso.onmicrosoft.com, or the GUID representing the TenantID property of the directory)
   * - In Azure B2C, it is of the form https://{instance}/tfp/&lt;tenant&gt;/<policyName>
   * - Default value is: "https://login.microsoftonline.com/common"
   * @param {User} user - The user for which the scopes are requested.The default user is the logged in user.
   * @param {string} extraQueryParameters - Key-value pairs to pass to the STS during the  authentication flow.
   */
  // TODO: params to accept AuthRequest object instead
  acquireTokenRedirect(request: AuthenticationParameters): void {
    // Throw error if callbacks are not set before redirect
    if (!this.redirectCallbacksSet) {
      throw ClientConfigurationError.createRedirectCallbacksNotSetError();
    }

    // Validate and filter scopes (the validate function will throw if validation fails)
    this.validateInputScope(request.scopes, true);

    // Get the user object if a session exists
    const userObject = request.account ? request.account : this.getUser();

    // If already in progress, do not proceed
    if (this.acquireTokenInProgress) {
      this.errorReceivedCallback(ClientAuthError.createAcquireTokenInProgressError(), this.getUserState(this.silentAuthenticationState));
      return;
    }

    // If no session exists, prompt the user to login.
    const scope = request.scopes.join(" ").toLowerCase();
    if (!userObject && !(request.sid  || request.loginHint)) {
      this.logger.info("User login is required");
      throw ClientAuthError.createUserLoginRequiredError();
    }

    // construct extraQueryParams string from the request
    let extraQueryParameters = Utils.constructExtraQueryParametersString(request.extraQueryParameters);
    extraQueryParameters = Utils.addPromptParameter(extraQueryParameters, request.prompt);

    // if the developer provides one of these, give preference to developer choice
    if (request.account || request.sid || request.loginHint) {
      extraQueryParameters = Utils.constructUnifiedCacheExtraQueryParameter(extraQueryParameters, request, null);
    }

    // Track the acquireToken progress
    this.acquireTokenInProgress = true;

    let authenticationRequest: AuthenticationRequestParameters;
    const acquireTokenAuthority = request.authority ? AuthorityFactory.CreateInstance(request.authority, this.config.auth.validateAuthority) : this.authorityInstance;

    // TODO: Set response type here
    acquireTokenAuthority.ResolveEndpointsAsync().then(() => {
      // On Fulfillment
      const responseType = this.getTokenType(userObject, request.scopes, false);
      authenticationRequest = new AuthenticationRequestParameters(
        acquireTokenAuthority,
        this.clientId,
        request.scopes,
        responseType,
        this.getRedirectUri(),
        this.config.auth.state
      );

      // Cache nonce
      this.cacheStorage.setItem(Constants.nonceIdToken, authenticationRequest.nonce, this.inCookie);

      // Cache acquireTokenUserKey
      const userId = userObject ? userObject.userIdentifier : Constants.no_user;
      const acquireTokenUserKey = Storage.generateAcquireTokenUserKey(userId, authenticationRequest.state);
      this.cacheStorage.setItem(acquireTokenUserKey, JSON.stringify(userObject));

      // Cache authorityKey
      const authorityKey = Storage.generateAuthorityKey(authenticationRequest.state);
      this.cacheStorage.setItem(authorityKey, acquireTokenAuthority.CanonicalAuthority, this.inCookie);

      // Set extraQueryParameters to be sent to the server
      if (extraQueryParameters) {
        authenticationRequest.extraQueryParameters = extraQueryParameters;
      }

      // Construct urlNavigate
      let urlNavigate = authenticationRequest.createNavigateUrl(request.scopes) + Constants.response_mode_fragment;
      urlNavigate = this.addHintParameters(urlNavigate, userObject);

      // set state in cache and redirect to urlNavigate
      if (urlNavigate) {
        this.cacheStorage.setItem(Constants.stateAcquireToken, authenticationRequest.state, this.inCookie);
        window.location.replace(urlNavigate);
      }
    });
  }

  /**
   * Checks if the redirect response is received from the STS. In case of redirect, the url fragment has either id_token, access_token or error.
   * @param {string} hash - Hash passed from redirect page.
   * @returns {Boolean} - true if response contains id_token, access_token or error, false otherwise.
   * @hidden
   */
  // TODO - rename this, the name is confusing
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

  //#endregion

  //#region Popup Flow

  /**
   * Initiate the login process by opening a popup window.
   * @param {Array.<string>} scopes - Permissions you want included in the access token. Not all scopes are  guaranteed to be included in the access token returned.
   * @param {string} extraQueryParameters - Key-value pairs to pass to the STS during the interactive authentication flow.
   * @returns {Promise.<string>} - A Promise that is fulfilled when this function has completed, or rejected if an error was raised. Returns the token or error.
   */
  loginPopup(request: AuthenticationParameters): Promise<string> {
    // Creates navigate url; saves value in cache; redirect user to AAD
    return new Promise<string>((resolve, reject) => {
      // Fail if login is already in progress
      if (this.userLoginInProgress) {
        return reject(ClientAuthError.createLoginInProgressError());
      }

      // if extraScopesToConsent is passed, append them to the login request
      let scopes: Array<string>;
      if (request.extraScopesToConsent) {
        scopes = [...request.scopes, ...request.extraScopesToConsent];
      }
      else {
        scopes = request.scopes;
      }

      // Validate and filter scopes (the validate function will throw if validation fails)
      this.validateInputScope(scopes, false);

      // construct extraQueryParams string from the request
      let extraQueryParameters = Utils.constructExtraQueryParametersString(request.extraQueryParameters);
      extraQueryParameters = Utils.addPromptParameter(extraQueryParameters, request.prompt);
      let user = this.getUser();

      // if the developer provides one of these, give preference to developer choice
      if (request.account || request.sid || request.loginHint) {
        extraQueryParameters = Utils.constructUnifiedCacheExtraQueryParameter(extraQueryParameters, request, null);

        // if user is not provided, we pass null
        this.loginPopupHelper(user, resolve, reject, scopes, extraQueryParameters);
      }
      // else handle the library data
      else {
        // Extract ADAL id_token if it exists
        let idTokenObject = this.extractADALIdToken();

        // silent login if ADAL id_token is retrieved successfully - SSO
        if (idTokenObject && !scopes) {
          this.logger.info("ADAL's idToken exists. Extracting login information from ADAL's idToken ");
          let tokenRequest: AuthenticationParameters = this.buildIDTokenRequest(extraQueryParameters);

          this.silentLogin = true;
          this.acquireTokenSilent(tokenRequest)
              .then((idToken) => {
            this.silentLogin = false;
            this.logger.info("Unified cache call is successful");

            // TODO: Change resolve to return AuthResponse object
            resolve(idToken);
          }, (error) => {

            this.silentLogin = false;
            this.logger.error("Error occurred during unified cache ATS");
            this.loginPopupHelper(null, resolve, reject, scopes, extraQueryParameters);
          });
        }
        // else proceed with login
        else {
          this.loginPopupHelper(null, resolve, reject, scopes, extraQueryParameters );
        }
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
  private loginPopupHelper(user: User, resolve: any , reject: any, scopes: Array<string>, extraQueryParameters?: string) {
    // TODO: why this is needed only for loginpopup
    if (!scopes) {
      scopes = [this.clientId];
    }
    const scope = scopes.join(" ").toLowerCase();

    // Generate a popup window
    const popUpWindow = this.openWindow("about:blank", "_blank", 1, this, resolve, reject);
    if (!popUpWindow) {
      // We pass reject in openWindow, we reject there during an error
      return;
    }

    // Track login progress
    this.userLoginInProgress = true;

    // Resolve endpoint
    this.authorityInstance.ResolveEndpointsAsync().then(() => {
      const authenticationRequest = new AuthenticationRequestParameters(this.authorityInstance, this.clientId, scopes, ResponseTypes.id_token, this.getRedirectUri(), this.config.auth.state);

      // set extraQueryParameters
      if (extraQueryParameters) {
        authenticationRequest.extraQueryParameters = extraQueryParameters;
      }

      // Cache the state, nonce, and login request data
      this.cacheStorage.setItem(Constants.loginRequest, window.location.href, this.inCookie);
      this.cacheStorage.setItem(Constants.loginError, "");

      this.cacheStorage.setItem(Constants.nonceIdToken, authenticationRequest.nonce, this.inCookie);

      this.cacheStorage.setItem(Constants.msalError, "");
      this.cacheStorage.setItem(Constants.msalErrorDescription, "");

      // cache authorityKey
      const authorityKey = Storage.generateAuthorityKey(authenticationRequest.state);
      this.cacheStorage.setItem(authorityKey, this.authority, this.inCookie);

      // Build the URL to navigate to in the popup window
      let urlNavigate = authenticationRequest.createNavigateUrl(scopes)  + Constants.response_mode_fragment;

      // TODO: Is this needed?
      urlNavigate = this.addHintParameters(urlNavigate, user);

      window.renewStates.push(authenticationRequest.state);
      window.requestType = Constants.login;

      // Register callback to capture results from server
      // TODO: Need to possible rework functionality here
      this.registerCallback(authenticationRequest.state, scope, resolve, reject);

      // Navigate url in popupWindow
      if (popUpWindow) {
        this.logger.infoPii("Navigated Popup window to:" + urlNavigate);
        popUpWindow.location.href = urlNavigate;
      }
    }, () => {
      // Endpoint resolution failure error
      this.logger.info(ErrorCodes.endpointResolutionError + ":" + ErrorDescription.endpointResolutionError);
      this.cacheStorage.setItem(Constants.msalError, ErrorCodes.endpointResolutionError);
      this.cacheStorage.setItem(Constants.msalErrorDescription, ErrorDescription.endpointResolutionError);

      // What is this? Is this the reject that is passed in?? -- REDO this in the subsequent refactor, passing reject is confusing
      if (reject) {
        reject(ClientAuthError.createEndpointResolutionError());
      }

      // Close the popup window
      if (popUpWindow) {
        popUpWindow.close();
      }
    }).catch((err) => {
      // All catch - when is this executed? Possibly when error is thrown, but not if previous function rejects instead of throwing
      this.logger.warning("could not resolve endpoints");
      reject(ClientAuthError.createEndpointResolutionError(err.toString));
    });
  }

  /**
   * Used to acquire an access token for a new user using interactive authentication via a popup Window.
   * To request an id_token, pass the clientId as the only scope in the scopes array.
   * @param {Array<string>} scopes - Permissions you want included in the access token. Not all scopes are  guaranteed to be included in the access token. Scopes like "openid" and "profile" are sent with every request.
   * @param {string} authority - A URL indicating a directory that MSAL can use to obtain tokens.
   * - In Azure AD, it is of the form https://&lt;tenant&gt;/&lt;tenant&gt;, where &lt;tenant&gt; is the directory host (e.g. https://login.microsoftonline.com) and &lt;tenant&gt; is a identifier within the directory itself (e.g. a domain associated to the tenant, such as contoso.onmicrosoft.com, or the GUID representing the TenantID property of the directory)
   * - In Azure B2C, it is of the form https://&lt;instance&gt;/tfp/&lt;tenant&gt;/<policyName>/
   * - Default value is: "https://login.microsoftonline.com/common".
   * @param {User} user - The user for which the scopes are requested.The default user is the logged in user.
   * @param {string} extraQueryParameters - Key-value pairs to pass to the STS during the  authentication flow.
   * @returns {Promise.<string>} - A Promise that is fulfilled when this function has completed, or rejected if an error was raised. Returns the token or error.
   */
  acquireTokenPopup(request: AuthenticationParameters): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      // Validate and filter scopes (the validate function will throw if validation fails)
      this.validateInputScope(request.scopes, true);

      const scope = request.scopes.join(" ").toLowerCase();

      // Get the user object if a session exists
      const userObject = request.account ? request.account : this.getUser();

      // If already in progress, throw an error and reject the request
      if (this.acquireTokenInProgress) {
        return reject(ClientAuthError.createAcquireTokenInProgressError());
      }

      // If no session exists, prompt the user to login.
      if (!userObject && !!(request.sid  || request.loginHint)) {
        this.logger.info("User login is required");
        return reject(ClientAuthError.createUserLoginRequiredError());
      }

      // construct extraQueryParams string from the request
      let extraQueryParameters = Utils.constructExtraQueryParametersString(request.extraQueryParameters);
      extraQueryParameters = Utils.addPromptParameter(extraQueryParameters, request.prompt);

      // if the developer provides one of these, give preference to developer choice
      if (request.account || request.sid || request.loginHint) {
        extraQueryParameters = Utils.constructUnifiedCacheExtraQueryParameter(extraQueryParameters, request, null);
      }

      // track the acquireToken progress
      this.acquireTokenInProgress = true;

      let authenticationRequest: AuthenticationRequestParameters;
      const acquireTokenAuthority = request.authority ? AuthorityFactory.CreateInstance(request.authority, this.config.auth.validateAuthority) : this.authorityInstance;

      // Open the popup window
      const popUpWindow = this.openWindow("about:blank", "_blank", 1, this, resolve, reject);
      if (!popUpWindow) {
        // We pass reject to openWindow, so we are rejecting there.
        return;
      }

      acquireTokenAuthority.ResolveEndpointsAsync().then(() => {
        // On fullfillment
        const responseType = this.getTokenType(userObject, request.scopes, false);
        authenticationRequest = new AuthenticationRequestParameters(
          acquireTokenAuthority,
          this.clientId,
          request.scopes,
          responseType,
          this.getRedirectUri(),
          this.config.auth.state
        );

        // Cache nonce
        // TODO: why is inCookie not passed here?
        this.cacheStorage.setItem(Constants.nonceIdToken, authenticationRequest.nonce);
        authenticationRequest.state = authenticationRequest.state;

        // Cache acquireTokenUserKey
        const userId = userObject ? userObject.userIdentifier : Constants.no_user;
        const acquireTokenUserKey = Storage.generateAcquireTokenUserKey(userId, authenticationRequest.state);

        this.cacheStorage.setItem(acquireTokenUserKey, JSON.stringify(userObject));

        // Cache authorityKey
        const authorityKey = Storage.generateAuthorityKey(authenticationRequest.state);
        this.cacheStorage.setItem(authorityKey, acquireTokenAuthority.CanonicalAuthority, this.inCookie);

        // Set the extraQueryParameters
        if (extraQueryParameters) {
          authenticationRequest.extraQueryParameters = extraQueryParameters;
        }

        // Construct the urlNavigate
        let urlNavigate = authenticationRequest.createNavigateUrl(request.scopes) + Constants.response_mode_fragment;
        urlNavigate = this.addHintParameters(urlNavigate, userObject);
        window.renewStates.push(authenticationRequest.state);
        window.requestType = Constants.renewToken;
        this.registerCallback(authenticationRequest.state, scope, resolve, reject);

        // open popup window to urlNavigate
        if (popUpWindow) {
          popUpWindow.location.href = urlNavigate;
        }

      }, () => {
        // On rejection
        this.logger.info(ErrorCodes.endpointResolutionError + ":" + ErrorDescription.endpointResolutionError);
        this.cacheStorage.setItem(Constants.msalError, ErrorCodes.endpointResolutionError);
        this.cacheStorage.setItem(Constants.msalErrorDescription, ErrorDescription.endpointResolutionError);

        if (reject) {
          reject(ClientAuthError.createEndpointResolutionError());
        }
        if (popUpWindow) {
            popUpWindow.close();
        }
      }).catch((err) => {
        this.logger.warning("could not resolve endpoints");
        reject(ClientAuthError.createEndpointResolutionError(err.toString()));
      });
    });
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
    // Generate a popup window
    var popupWindow: Window;
    try {
      popupWindow = this.openPopup(urlNavigate, title, Constants.popUpWidth, Constants.popUpHeight);
    } catch (e) {
      instance.userLoginInProgress = false;
      instance.acquireTokenInProgress = false;

      this.logger.info(ErrorCodes.popUpWindowError + ":" + ErrorDescription.popUpWindowError);
      this.cacheStorage.setItem(Constants.msalError, ErrorCodes.popUpWindowError);
      this.cacheStorage.setItem(Constants.msalErrorDescription, ErrorDescription.popUpWindowError);
      if (reject) {
        reject(ClientAuthError.createPopupWindowError());
      }
      return null;
    }

    // Push popup window handle onto stack for tracking
    window.openedWindows.push(popupWindow);

    const pollTimer = window.setInterval(() => {
      // If popup closed or login in progress, cancel login
      if (popupWindow && popupWindow.closed && instance.userLoginInProgress) {
        if (reject) {
          reject(ClientAuthError.createUserCancelledError());
        }
        window.clearInterval(pollTimer);
        if (this.config.framework.isAngular) {
            this.broadcast("msal:popUpClosed", ErrorCodes.userCancelledError + Constants.resourceDelimiter + ErrorDescription.userCancelledError);
            return;
        }
        instance.userLoginInProgress = false;
        instance.acquireTokenInProgress = false;
      }

      try {
        const popUpWindowLocation = popupWindow.location;

        // If the popup hash changes, close the popup window
        if (popUpWindowLocation.href.indexOf(this.getRedirectUri()) !== -1) {
          window.clearInterval(pollTimer);
          instance.userLoginInProgress = false;
          instance.acquireTokenInProgress = false;
          this.logger.info("Closing popup window");
          // TODO: Why are we only closing for angular?
          if (this.config.framework.isAngular) {
              this.broadcast("msal:popUpHashChanged", popUpWindowLocation.hash);
              for (let i = 0; i < window.openedWindows.length; i++) {
                  window.openedWindows[i].close();
              }
          }
        }
      } catch (e) {
        // Cross Domain url check error.
        // Will be thrown until AAD redirects the user back to the app"s root page with the token.
        // No need to log or throw this error as it will create unnecessary traffic.
      }
    },
    interval);

    return popupWindow;
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
      /**
       * adding winLeft and winTop to account for dual monitor
       * using screenLeft and screenTop for IE8 and earlier
       */
      const winLeft = window.screenLeft ? window.screenLeft : window.screenX;
      const winTop = window.screenTop ? window.screenTop : window.screenY;
      /**
       * window.innerWidth displays browser window"s height and width excluding toolbars
       * using document.documentElement.clientWidth for IE8 and earlier
       */
      const width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
      const height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
      const left = ((width / 2) - (popUpWidth / 2)) + winLeft;
      const top = ((height / 2) - (popUpHeight / 2)) + winTop;

      // open the window
      const popupWindow = window.open(urlNavigate, title, "width=" + popUpWidth + ", height=" + popUpHeight + ", top=" + top + ", left=" + left);
      if (!popupWindow) {
        throw ClientAuthError.createPopupWindowError();
      }
      if (popupWindow.focus) {
        popupWindow.focus();
      }

      return popupWindow;
    } catch (e) {
      this.logger.error("error opening popup " + e.message);
      this.userLoginInProgress = false;
      this.acquireTokenInProgress = false;
      throw ClientAuthError.createPopupWindowError(e.toString());
    }
  }

  //#endregion

  //#region Silent Flow

  /**
   * Used to get the token from cache.
   * MSAL will return the cached token if it is not expired.
   * Or it will send a request to the STS to obtain an access_token using a hidden iframe. To renew idToken, clientId should be passed as the only scope in the scopes array.
   * @param {Array<string>} scopes - Permissions you want included in the access token. Not all scopes are  guaranteed to be included in the access token. Scopes like "openid" and "profile" are sent with every request.
   * @param {string} authority - A URL indicating a directory that MSAL can use to obtain tokens.
   * - In Azure AD, it is of the form https://&lt;tenant&gt;/&lt;tenant&gt;, where &lt;tenant&gt; is the directory host (e.g. https://login.microsoftonline.com) and &lt;tenant&gt; is a identifier within the directory itself (e.g. a domain associated to the tenant, such as contoso.onmicrosoft.com, or the GUID representing the TenantID property of the directory)
   * - In Azure B2C, it is of the form https://&lt;instance&gt;/tfp/&lt;tenant&gt;/<policyName>/
   * - Default value is: "https://login.microsoftonline.com/common"
   * @param {User} user - The user for which the scopes are requested.The default user is the logged in user.
   * @param {string} extraQueryParameters - Key-value pairs to pass to the STS during the  authentication flow.
   * @returns {Promise.<string>} - A Promise that is fulfilled when this function has completed, or rejected if an error was raised. Resolved with token or rejected with error.
   */
  @resolveTokenOnlyIfOutOfIframe
  acquireTokenSilent(request: AuthenticationParameters): Promise<string> {
    return new Promise<string>((resolve, reject) => {

      // Validate and filter scopes (the validate function will throw if validation fails)
      this.validateInputScope(request.scopes, true);

      const scope = request.scopes.join(" ").toLowerCase();

      // if the developer passes a userObject give him the priority
      const userObject = request.account ? request.account : this.getUser();

      // extract if there is an adalIdToken stashed in the cache
      const adalIdToken = this.cacheStorage.getItem(Constants.adalIdToken);

      //if user is not currently logged in and no login_hint/sid is passed in the request
      if (!userObject && !!(request.sid  || request.loginHint) && Utils.isEmpty(adalIdToken) ) {
        this.logger.info("User login is required");
        return reject(ClientAuthError.createUserLoginRequiredError());
      }

      // construct extraQueryParams string from the request
      let extraQueryParameters = Utils.constructExtraQueryParametersString(request.extraQueryParameters);
      extraQueryParameters = Utils.addPromptParameter(extraQueryParameters, request.prompt);

      // if the developer provides one of these, give preference to developer choice
      if (request.account || request.sid || request.loginHint) {
        extraQueryParameters = Utils.constructUnifiedCacheExtraQueryParameter(extraQueryParameters, request, null);
      }

      //if user didn't pass login_hint/sid and adal's idtoken is present, extract the login_hint from the adalIdToken
      else if (!userObject && !Utils.isEmpty(adalIdToken)) {
        const idTokenObject = Utils.extractIdToken(adalIdToken);
        console.log("ADAL's idToken exists. Extracting login information from ADAL's idToken ");
        extraQueryParameters = Utils.constructUnifiedCacheExtraQueryParameter(extraQueryParameters, null, idTokenObject);
      }

      const responseType = this.getTokenType(userObject, request.scopes, true);
      const authenticationRequest = new AuthenticationRequestParameters(
        AuthorityFactory.CreateInstance(request.authority, this.config.auth.validateAuthority),
        this.clientId,
        request.scopes,
        responseType,
        this.getRedirectUri(),
        this.config.auth.state
      );

      const cacheResult = this.getCachedToken(authenticationRequest, userObject);

      // resolve/reject based on cacheResult
      if (cacheResult) {
        if (cacheResult.token) {
          this.logger.info("Token is already in cache for scope:" + scope);
          resolve(cacheResult.token);
          return null;
        }
        else if (cacheResult.errorDesc || cacheResult.error) {
          this.logger.infoPii(cacheResult.errorDesc + ":" + cacheResult.error);
          reject(cacheResult.errorDesc + Constants.resourceDelimiter + cacheResult.error);
          return null;
        }
      }
      // else proceed with login
      else {
        this.logger.verbose("Token is not in cache for scope:" + scope);

        // Cache result can return null if cache is empty. In that case, set authority to default value if no authority is passed to the api.
        // TODO: Do we need to check if cache result is empty before calling this?
        if (!authenticationRequest.authorityInstance) {
            authenticationRequest.authorityInstance = request.authority ? AuthorityFactory.CreateInstance(request.authority, this.config.auth.validateAuthority) : this.authorityInstance;
        }
        // cache miss
        return authenticationRequest.authorityInstance.ResolveEndpointsAsync()
        .then(() => {
          // refresh attempt with iframe
          // Already renewing for this scope, callback when we get the token.
          if (window.activeRenewals[scope]) {
            this.logger.verbose("Renew token for scope: " + scope + " is in progress. Registering callback");
            // Active renewals contains the state for each renewal.
            this.registerCallback(window.activeRenewals[scope], scope, resolve, reject);
          }
          else {
            if (request.scopes && request.scopes.indexOf(this.clientId) > -1 && request.scopes.length === 1) {
              // App uses idToken to send to api endpoints
              // Default scope is tracked as clientId to store this token
              this.logger.verbose("renewing idToken");
              this.renewIdToken(request.scopes, resolve, reject, userObject, authenticationRequest, extraQueryParameters);
            } else {
              // renew access token
              this.logger.verbose("renewing accesstoken");
              this.renewToken(request.scopes, resolve, reject, userObject, authenticationRequest, extraQueryParameters);
            }
          }
        }).catch((err) => {
          this.logger.warning("could not resolve endpoints");
          reject(ClientAuthError.createEndpointResolutionError(err.toString()));
          return null;
        });
      }
    });
  }

  /**
   * Returns whether current window is in ifram for token renewal
   * @ignore
   * @hidden
   */
  // TODO: can this function be removed? not used, or may be use this instead of if in iFrame APIs. Will there be a performance issue for fn calls?
  private isInIframe() {
      return window.parent !== window;
  }

  /**
   * Calling _loadFrame but with a timeout to signal failure in loadframeStatus. Callbacks are left.
   * registered when network errors occur and subsequent token requests for same resource are registered to the pending request.
   * @ignore
   * @hidden
   */
  private loadIframeTimeout(urlNavigate: string, frameName: string, scope: string): void {
    //set iframe session to pending
    const expectedState = window.activeRenewals[scope];
    this.logger.verbose("Set loading state to pending for: " + scope + ":" + expectedState);
    this.cacheStorage.setItem(Constants.renewStatus + expectedState, Constants.tokenRenewStatusInProgress);
    this.loadFrame(urlNavigate, frameName);
    setTimeout(() => {
      if (this.cacheStorage.getItem(Constants.renewStatus + expectedState) === Constants.tokenRenewStatusInProgress) {
        // fail the iframe session if it"s in pending state
        this.logger.verbose("Loading frame has timed out after: " + (this.config.system.loadFrameTimeout / 1000) + " seconds for scope " + scope + ":" + expectedState);
        // Error after timeout
        if (expectedState && window.primaryMsalCallbackMappedToRenewStates[expectedState]) {
          window.primaryMsalCallbackMappedToRenewStates[expectedState]("Token renewal operation failed due to timeout", null, "Token Renewal Failed", Constants.accessToken);
        }

        this.cacheStorage.setItem(Constants.renewStatus + expectedState, Constants.tokenRenewStatusCancelled);
      }
    }, this.config.system.loadFrameTimeout);
  }

  /**
   * Loads iframe with authorization endpoint URL
   * @ignore
   * @hidden
   */
  private loadFrame(urlNavigate: string, frameName: string): void {
    // This trick overcomes iframe navigation in IE
    // IE does not load the page consistently in iframe
    this.logger.info("LoadFrame: " + frameName);
    const frameCheck = frameName;

    // TODO: VSTS AI, work on either removing the 500ms timeout or making it optional for IE??
    setTimeout(() => {
      const frameHandle = this.addAdalFrame(frameCheck);
      if (frameHandle.src === "" || frameHandle.src === "about:blank") {
        frameHandle.src = urlNavigate;
        this.logger.infoPii("Frame Name : " + frameName + " Navigated to: " + urlNavigate);
      }
    },
    500);
  }

  /**
   * Adds the hidden iframe for silent token renewal.
   * @ignore
   * @hidden
   */
  // TODO: Should we rename this function as addHiddenIFrame??
  private addAdalFrame(iframeId: string): HTMLIFrameElement {
    if (typeof iframeId === "undefined") {
      return null;
    }

    this.logger.info("Add msal frame to document:" + iframeId);
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
      } else if (document.body && document.body.insertAdjacentHTML) {
          document.body.insertAdjacentHTML("beforeend", "<iframe name='" + iframeId + "' id='" + iframeId + "' style='display:none'></iframe>");
      }

      if (window.frames && window.frames[iframeId]) {
        adalFrame = window.frames[iframeId];
      }
    }

    return adalFrame;
  }

  //#endregion

  //#region General Helpers

  /**
   * Adds login_hint to authorization URL which is used to pre-fill the username field of sign in page for the user if known ahead of time
   * domain_hint can be one of users/organisations which when added skips the email based discovery process of the user
   * domain_req utid received as part of the clientInfo
   * login_req uid received as part of clientInfo
   * @param {string} urlNavigate - Authentication request url
   * @param {User} user - User for which the token is requested
   * @ignore
   * @hidden
   */
  // TODO: Optimize this
  private addHintParameters(urlNavigate: string, user: User): string {
    const userObject = user ? user : this.getUser();
    if (userObject) {
        const decodedClientInfo = userObject.userIdentifier.split(".");
        const uid = Utils.base64DecodeStringUrlSafe(decodedClientInfo[0]);
        const utid = Utils.base64DecodeStringUrlSafe(decodedClientInfo[1]);

        // sid - first preference to identify a session
        if (userObject.sid  && urlNavigate.indexOf(PromptState.NONE) !== -1) {
            if (!this.urlContainsQueryStringParameter(SSOTypes.SID, urlNavigate) && !this.urlContainsQueryStringParameter(SSOTypes.LOGIN_HINT, urlNavigate)) {
                urlNavigate += Utils.generateSSOUrlParameter(userObject.sid, SSOTypes.SID);
            }
        }
        // check for login_hint if sid is not passed
        else {
            if (!this.urlContainsQueryStringParameter(SSOTypes.LOGIN_HINT, urlNavigate) && userObject.displayableId && !Utils.isEmpty(userObject.displayableId)) {
                urlNavigate += Utils.generateSSOUrlParameter(userObject.displayableId, SSOTypes.LOGIN_HINT);
            }
        }

        // client_info.utid = domain_req and client_info.uid = login_req
        if (!Utils.isEmpty(uid) && !Utils.isEmpty(utid)) {
            if (!this.urlContainsQueryStringParameter(SSOTypes.DOMAIN_REQ, urlNavigate) && !Utils.isEmpty(utid)) {
                urlNavigate += Utils.generateSSOUrlParameter(utid, SSOTypes.DOMAIN_REQ);
            }

            if (!this.urlContainsQueryStringParameter(SSOTypes.LOGIN_REQ, urlNavigate) && !Utils.isEmpty(uid)) {
                urlNavigate += Utils.generateSSOUrlParameter(uid, SSOTypes.LOGIN_REQ);
            }
        }

        // fill in the domain_hint
        if (!this.urlContainsQueryStringParameter(SSOTypes.DOMAIN_HINT, urlNavigate) && !Utils.isEmpty(utid)) {
            if (utid === Constants.consumersUtid) {
                urlNavigate += Utils.generateSSOUrlParameter(uid, SSOTypes.CONSUMERS);
            }
            else {
                urlNavigate += Utils.generateSSOUrlParameter(uid, SSOTypes.ORGANIZATIONS);
            }
        }
    }

    return urlNavigate;
  }

  /**
   * Used to redirect the browser to the STS authorization endpoint
   * @param {string} urlNavigate - URL of the authorization endpoint
   * @hidden
   */
  private promptUser(urlNavigate: string) {
    // Navigate if valid URL
    if (urlNavigate && !Utils.isEmpty(urlNavigate)) {
      this.logger.infoPii("Navigate to:" + urlNavigate);
      window.location.replace(urlNavigate);
    }
    else {
      this.logger.info("Navigate url is empty");
      throw AuthError.createUnexpectedError("Navigate url is empty");
    }
  }

  /**
   * Used to add the developer requested callback to the array of callbacks for the specified scopes. The updated array is stored on the window object
   * @param {string} scope - Developer requested permissions. Not all scopes are guaranteed to be included in the access token returned.
   * @param {string} expectedState - Unique state identifier (guid).
   * @param {Function} resolve - The resolve function of the promise object.
   * @param {Function} reject - The reject function of the promise object.
   * @ignore
   * @hidden
   */
  private registerCallback(expectedState: string, scope: string, resolve: Function, reject: Function): void {
    // track active renewals
    window.activeRenewals[scope] = expectedState;

    // initialize callbacks mapped array
    if (!window.promiseMappedToRenewStates[expectedState]) {
        window.promiseMappedToRenewStates[expectedState] = [];
    }
    // indexing on the current state, push the callback params to callbacks mapped
    window.promiseMappedToRenewStates[expectedState].push({ resolve: resolve, reject: reject });

    // Store the server esponse in the current window??
    if (!window.primaryMsalCallbackMappedToRenewStates[expectedState]) {
      window.primaryMsalCallbackMappedToRenewStates[expectedState] =
      (response: AuthResponse, error: AuthError) => {
        // reset active renewals
        window.activeRenewals[scope] = null;

        // for all callBacksMappedtoRenewStates for a given 'state' - call the reject/resolve with error/token respectively
        for (let i = 0; i < window.promiseMappedToRenewStates[expectedState].length; ++i) {
          try {
            if (error) {
                window.promiseMappedToRenewStates[expectedState][i].reject(error);
            } else if (response) {
                window.promiseMappedToRenewStates[expectedState][i].resolve(response);
            } else {
              throw AuthError.createUnexpectedError("Error and response are both null");
            }
          } catch (e) {
            this.logger.warning(e);
          }
        }

        // reset
        window.promiseMappedToRenewStates[expectedState] = null;
        window.primaryMsalCallbackMappedToRenewStates[expectedState] = null;
      };
    }
  }

  //#endregion

  //#region Logout

  /**
   * Used to log out the current user, and redirect the user to the postLogoutRedirectUri.
   * Defaults behaviour is to redirect the user to `window.location.href`.
   */
  logout(): void {
    this.clearCache();
    this.user = null;
    let logout = "";
    if (this.getPostLogoutRedirectUri()) {
      logout = "post_logout_redirect_uri=" + encodeURIComponent(this.getPostLogoutRedirectUri());
    }

    const urlNavigate = this.authority + "/oauth2/v2.0/logout?" + logout;
    this.promptUser(urlNavigate);
  }

  /**
   * Clear all access tokens in the cache.
   * @ignore
   * @hidden
   */
  // TODO: Consider moving this to Storage.ts
  protected clearCache(): void {
    window.renewStates = [];
    const accessTokenItems = this.cacheStorage.getAllAccessTokens(Constants.clientId, Constants.userIdentifier);
    for (let i = 0; i < accessTokenItems.length; i++) {
      this.cacheStorage.removeItem(JSON.stringify(accessTokenItems[i].key));
    }
    this.cacheStorage.resetCacheItems();
    this.cacheStorage.clearCookie();
  }

  /**
   * Clear a given access token from the cache.
   *
   * @param accessToken
   */
  // TODO: Consider moving this to Storage.ts
  protected clearCacheForScope(accessToken: string) {
    const accessTokenItems = this.cacheStorage.getAllAccessTokens(Constants.clientId, Constants.userIdentifier);
    for (let i = 0; i < accessTokenItems.length; i++) {
        let token = accessTokenItems[i];
        if (token.value.accessToken === accessToken) {
            this.cacheStorage.removeItem(JSON.stringify(token.key));
        }
    }
  }

  //#endregion

  //#region Response

  /**
   * Used to call the constructor callback with the token/error
   * @param {string} [hash=window.location.hash] - Hash fragment of Url.
   * @hidden
   */
  private processCallBack(hash: string): void {
    this.logger.info("Processing the callback from redirect response");

    // get the request Info from the hash
    // TODO: Refactor this or saveTokenFromHash to return an AuthResponse object
    const requestInfo = this.getRequestInfo(hash);

    // Save the token info from the hash
    this.saveTokenFromHash(requestInfo);

    const token = requestInfo.parameters[Constants.accessToken] || requestInfo.parameters[Constants.idToken];
    const errorDesc = requestInfo.parameters[Constants.errorDescription];
    const error = requestInfo.parameters[Constants.error];

    let tokenType: string;
    if (requestInfo.parameters[Constants.accessToken]) {
      tokenType = Constants.accessToken;
    }
    else {
      tokenType = Constants.idToken;
    }

    // remove hash from the cache
    this.cacheStorage.removeItem(Constants.urlHash);

    try {
      // Clear the cookie in the hash
      this.cacheStorage.clearCookie();
      const userState = this.getUserState(this.cacheStorage.getItem(Constants.stateLogin, this.inCookie));
      if (error || errorDesc) {
        if (this.errorReceivedCallback) {
          this.errorReceivedCallback(new ServerError(error, errorDesc), userState);
        }
      }
      if (token) {
        if (this.tokenReceivedCallback) {
          // Trigger callback
          this.tokenReceivedCallback(token, tokenType, userState);
        }
      }
    } catch (err) {
      this.logger.error("Error occurred in token received callback function: " + err);
      throw ClientAuthError.createErrorInCallbackFunction(err.toString());
    }
  }

  /**
   * This method must be called for processing the response received from the STS. It extracts the hash, processes the token or error information and saves it in the cache. It then
   * calls the registered callbacks in case of redirect or resolves the promises with the result.
   * @param {string} [hash=window.location.hash] - Hash fragment of Url.
   * @hidden
   */
  private handleAuthenticationResponse(hash: string): void {
    // retrieve the hash
    if (hash == null) {
      hash = window.location.hash;
    }

    let self = null;
    let isPopup: boolean = false;
    let isWindowOpenerMsal = false;

    // Check if the current window opened the iFrame/popup
    try {
      isWindowOpenerMsal = window.opener && window.opener.msal && window.opener.msal !== window.msal;
    } catch (err) {
      // err = SecurityError: Blocked a frame with origin "[url]" from accessing a cross-origin frame.
      isWindowOpenerMsal = false;
    }

    // Set the self to the window that created the popup/iframe
    if (isWindowOpenerMsal) {
      self = window.opener.msal;
      isPopup = true;
    }
    else if (window.parent && window.parent.msal) {
      self = window.parent.msal;
    }

    // if (window.parent !== window), by using self, window.parent becomes equal to window in getRequestInfo method specifically
    // TODO: Refactor so that this or saveTokenFromHash function returns a response object
    const requestInfo = self.getRequestInfo(hash);

    let token: string = null;
    let tokenResponseCallback: (errorDesc: string, token: string, error: string, tokenType: string) => void = null;
    let tokenType: string;

    self.logger.info("Returned from redirect url");
    // If parent window is the msal instance which opened the current window (iframe)
    if (window.parent !== window && window.parent.msal) {
        tokenResponseCallback = window.parent.primaryMsalCallbackMappedToRenewStates[requestInfo.stateResponse];
    }
    // Current window is window opener (popup)
    else if (isWindowOpenerMsal) {
        tokenResponseCallback = window.opener.callBackMappedToRenewStates[requestInfo.stateResponse];
    }
    // Redirect cases
    else {
      tokenResponseCallback = null;
      // if set to navigate to loginRequest page post login
      if (self.navigateToLoginRequestUrl) {
        self.cacheStorage.setItem(Constants.urlHash, hash);
        if (window.parent === window && !isPopup) {
          window.location.href = self.cacheStorage.getItem(Constants.loginRequest, this.inCookie);
        }
        return;
      }
      else {
        window.location.hash = "";
      }
    }

    // Save token from hash (TODO: Possibly refactor to return AuthResponse)
    self.saveTokenFromHash(requestInfo);

    // Acquire token request
    if ((requestInfo.requestType === Constants.renewToken) && window.parent) {
      // Log whether silent or interactive
      if (window.parent !== window) {
        self.logger.verbose("Window is in iframe, acquiring token silently");
      } else {
        self.logger.verbose("acquiring token interactive in progress");
      }

      // retrieve id_token or access_token, in case of response_type = id_token_token, retrieve only access_token
      token = requestInfo.parameters[Constants.accessToken] || requestInfo.parameters[Constants.idToken];
      tokenType = Constants.accessToken;
    }
    // login request
    else if (requestInfo.requestType === Constants.login) {
      token = requestInfo.parameters[Constants.idToken];
      tokenType = Constants.idToken;
    }

    const errorDesc = requestInfo.parameters[Constants.errorDescription];
    const error = requestInfo.parameters[Constants.error];

    try {
       // We should only send the state back to the developer if it matches with what we received from the server
      const state = (requestInfo.stateMatch) ? this.getUserState(requestInfo.stateResponse) : null;
      // TODO: Change this so that it sends back response object or error object based on what is returned from getRequestInfo()
      if (tokenResponseCallback) {
        // We should only send the state back to the developer if it matches with what we received from the server
        tokenResponseCallback.call(self, errorDesc, token, error, tokenType, state);
      } else {
        // Redirect cases
        if (error || errorDesc) {
          self.errorReceivedCallback.call(new ServerError(error, errorDesc), state);
        } else if (token) {
          self.tokenReceivedCallback.call(token, tokenType, state);
        }
      }
    } catch (err) {
      self.logger.error("Error occurred in token received callback function: " + err);
      throw ClientAuthError.createErrorInCallbackFunction(err.toString());
    }

    // If current window is opener, close all windows
    if (isWindowOpenerMsal) {
      for (let i = 0; i < window.opener.openedWindows.length; i++) {
        window.opener.openedWindows[i].close();
      }
    }
  }

  /**
   * Creates a requestInfo object from the URL fragment and returns it.
   * @param {string} hash  -  Hash passed from redirect page
   * @returns {TokenResponse} an object created from the redirect response from AAD comprising of the keys - parameters, requestType, stateMatch, stateResponse and valid.
   * @ignore
   * @hidden
   */
  // TODO: Change to return AuthResponse object, rename this, it is not request but response
  protected getRequestInfo(hash: string): TokenResponse {
    hash = this.getHash(hash);
    const parameters = Utils.deserialize(hash);
    const tokenResponse = new TokenResponse();

    // If there is a hash with parameters in the redirect response
    if (parameters) {
      tokenResponse.parameters = parameters;

      // Check for error or tokens
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
        } else {
          return tokenResponse;
        }

        tokenResponse.stateResponse = stateResponse;
        // async calls can fire iframe and login request at the same time if developer does not use the API as expected
        // incoming callback needs to be looked up to find the request type

        // loginRedirect
        if (stateResponse === this.cacheStorage.getItem(Constants.stateLogin, this.inCookie) || stateResponse === this.silentAuthenticationState) { // loginRedirect
          tokenResponse.requestType = Constants.login;
          tokenResponse.stateMatch = true;
          return tokenResponse;
        }
        // acquireTokenRedirect
        else if (stateResponse === this.cacheStorage.getItem(Constants.stateAcquireToken, this.inCookie)) { //acquireTokenRedirect
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

  //#endregion

  //#region Token Processing (Extract to TokenProcessing.ts)

  /**
   * Used to get token for the specified set of scopes from the cache
   * @param {AuthenticationRequestParameters} authenticationRequest - Request sent to the STS to obtain an id_token/access_token
   * @param {User} user - User for which the scopes were requested
   * @hidden
   */
  // TODO: There is a lot of duplication code in this function, rework this sooner than later, may be as a part of Error??
  // TODO: Only used in ATS - we should separate this
  private getCachedToken(authenticationRequest: AuthenticationRequestParameters, user: User): CacheResult {
    let accessTokenCacheItem: AccessTokenCacheItem = null;
    const scopes = authenticationRequest.scopes;

    // filter by clientId and user
    const tokenCacheItems = this.cacheStorage.getAllAccessTokens(this.clientId, user ? user.userIdentifier : null);

    // No match found after initial filtering
    if (tokenCacheItems.length === 0) {
      return null;
    }

    const filteredItems: Array<AccessTokenCacheItem> = [];

    // if no authority passed
    if (!authenticationRequest.authority) {
      // filter by scope
      for (let i = 0; i < tokenCacheItems.length; i++) {
        const cacheItem = tokenCacheItems[i];
        const cachedScopes = cacheItem.key.scopes.split(" ");
        if (Utils.containsScope(cachedScopes, scopes)) {
          filteredItems.push(cacheItem);
        }
      }

      // if only one cached token found
      if (filteredItems.length === 1) {
        accessTokenCacheItem = filteredItems[0];
        authenticationRequest.authorityInstance = AuthorityFactory.CreateInstance(accessTokenCacheItem.key.authority, this.config.auth.validateAuthority);
      }
      // if more than one cached token is found
      // TODO: Return custom error here
      // TODO: Check that accessToken is only possible tokenType for this error type
      else if (filteredItems.length > 1) {
        return {
          errorDesc: "The cache contains multiple tokens satisfying the requirements. Call AcquireToken again providing more requirements like authority",
          token: null,
          error: "multiple_matching_tokens_detected"
        };
      }
      // if no match found, check if there was a single authority used
      else {
        const authorityList = this.getUniqueAuthority(tokenCacheItems, "authority");
        if (authorityList.length > 1) {
          // TODO: Return custom error here
          // TODO: Check that accessToken is only possible tokenType for this error type
          return {
            errorDesc: "Multiple authorities found in the cache. Pass authority in the API overload.",
            token: null,
            error: "multiple_matching_tokens_detected"
          };
        }

        authenticationRequest.authorityInstance = AuthorityFactory.CreateInstance(authorityList[0], this.config.auth.validateAuthority);
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
      // if only one cachedToken Found
      else if (filteredItems.length === 1) {
        accessTokenCacheItem = filteredItems[0];
      }
      else {
        // if more than cached token is found
        // TODO: Return custom error here
        // TODO: Check that accessToken is only possible tokenType for this error type
        return {
          errorDesc: "The cache contains multiple tokens satisfying the requirements.Call AcquireToken again providing more requirements like authority",
          token: null,
          error: "multiple_matching_tokens_detected"
        };
      }
    }

    if (accessTokenCacheItem != null) {
      const expired = Number(accessTokenCacheItem.value.expiresIn);
      // If expiration is within offset, it will force renew
      const offset = this.config.system.tokenRenewalOffsetSeconds || 300;
      if (expired && (expired > Utils.now() + offset)) {
        return {
          errorDesc: null,
          token: accessTokenCacheItem.value.accessToken,
          error: null
        };
      } else {
        this.cacheStorage.removeItem(JSON.stringify(filteredItems[0].key));
        return null;
      }
    } else {
      return null;
    }
  }

  /**
   * Used to get a unique list of authoritues from the cache
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
   * Check if ADAL id_token exists and return if exists.
   *
   * @hidden
   */
  private extractADALIdToken(): any {
    const adalIdToken = this.cacheStorage.getItem(Constants.adalIdToken);
    if (!Utils.isEmpty(adalIdToken)) {
        return Utils.extractIdToken(adalIdToken);
    }
    return null;
  }

  /**
   * Acquires access token using a hidden iframe.
   * @ignore
   * @hidden
   */
  private renewToken(scopes: Array<string>, resolve: Function, reject: Function, user: User, authenticationRequest: AuthenticationRequestParameters, extraQueryParameters?: string): void {
    const scope = scopes.join(" ").toLowerCase();
    this.logger.verbose("renewToken is called for scope:" + scope);
    const frameHandle = this.addAdalFrame("msalRenewFrame" + scope);
    if (extraQueryParameters) {
      authenticationRequest.extraQueryParameters = extraQueryParameters;
    }

    // Cache acquireTokenUserKey
    const userId = user ? user.userIdentifier : Constants.no_user;
    const acquireTokenUserKey = Storage.generateAcquireTokenUserKey(userId, authenticationRequest.state);

    this.cacheStorage.setItem(acquireTokenUserKey, JSON.stringify(user));

    // Cache authorityKey
    const authorityKey = Storage.generateAuthorityKey(authenticationRequest.state);
    this.cacheStorage.setItem(authorityKey, authenticationRequest.authority);

    // renew happens in iframe, so it keeps javascript context
    this.cacheStorage.setItem(Constants.nonceIdToken, authenticationRequest.nonce);
    this.logger.verbose("Renew token Expected state: " + authenticationRequest.state);

    // Build urlNavigate with "prompt=none" and navigate to URL in hidden iFrame
    let urlNavigate = Utils.urlRemoveQueryStringParameter(authenticationRequest.createNavigateUrl(scopes), Constants.prompt) + Constants.prompt_none;
    urlNavigate = this.addHintParameters(urlNavigate, user);

    window.renewStates.push(authenticationRequest.state);
    window.requestType = Constants.renewToken;
    this.registerCallback(authenticationRequest.state, scope, resolve, reject);
    this.logger.infoPii("Navigate to:" + urlNavigate);
    frameHandle.src = "about:blank";
    this.loadIframeTimeout(urlNavigate, "msalRenewFrame" + scope, scope);
  }

  /**
   * Renews idtoken for app"s own backend when clientId is passed as a single scope in the scopes array.
   * @ignore
   * @hidden
   */
  private renewIdToken(scopes: Array<string>, resolve: Function, reject: Function, user: User, authenticationRequest: AuthenticationRequestParameters,          extraQueryParameters?: string): void {

    this.logger.info("renewidToken is called");
    const frameHandle = this.addAdalFrame("msalIdTokenFrame");

    // Populate extraQueryParameters in the request sent to the server
    if (extraQueryParameters) {
      authenticationRequest.extraQueryParameters = extraQueryParameters;
    }

    // Cache acquireTokenUserKey
    const userId = user ? user.userIdentifier : Constants.no_user;
    const acquireTokenUserKey = Storage.generateAcquireTokenUserKey(userId, authenticationRequest.state);

    this.cacheStorage.setItem(acquireTokenUserKey, JSON.stringify(user));

    // Cache authorityKey
    const authorityKey = Storage.generateAuthorityKey(authenticationRequest.state);
    this.cacheStorage.setItem(authorityKey, authenticationRequest.authority);

    // Cache nonce
    this.cacheStorage.setItem(Constants.nonceIdToken, authenticationRequest.nonce);

    this.logger.verbose("Renew Idtoken Expected state: " + authenticationRequest.state);

    // Build urlNavigate with "prompt=none" and navigate to URL in hidden iFrame
    let urlNavigate = Utils.urlRemoveQueryStringParameter(authenticationRequest.createNavigateUrl(scopes), Constants.prompt) + Constants.prompt_none;
    urlNavigate = this.addHintParameters(urlNavigate, user);
    if (this.silentLogin) {
        window.requestType = Constants.login;
        this.silentAuthenticationState = authenticationRequest.state;
    } else {
        window.requestType = Constants.renewToken;
        window.renewStates.push(authenticationRequest.state);
    }

    // note: scope here is clientId
    this.registerCallback(authenticationRequest.state, this.clientId, resolve, reject);
    this.logger.infoPii("Navigate to:" + urlNavigate);
    frameHandle.src = "about:blank";
    this.loadIframeTimeout(urlNavigate, "msalIdTokenFrame", this.clientId);
  }

  /**
   * This method must be called for processing the response received from AAD. It extracts the hash, processes the token or error, saves it in the cache and calls the registered callbacks with the result.
   * @param {string} authority authority received in the redirect response from AAD.
   * @param {TokenResponse} requestInfo an object created from the redirect response from AAD comprising of the keys - parameters, requestType, stateMatch, stateResponse and valid.
   * @param {User} user user object for which scopes are consented for. The default user is the logged in user.
   * @param {ClientInfo} clientInfo clientInfo received as part of the response comprising of fields uid and utid.
   * @param {IdToken} idToken idToken received as part of the response.
   * @ignore
   * @private
   * @hidden
   */
  /* tslint:disable:no-string-literal */
  //TODO: Break this function - too long
  private saveAccessToken(authority: string, tokenResponse: TokenResponse, user: User, clientInfo: string, idToken: IdToken): void {
    let scope: string;
    const clientObj: ClientInfo = new ClientInfo(clientInfo);
    // if the response contains "scope"
    if (tokenResponse.parameters.hasOwnProperty("scope")) {
      // read the scopes
      scope = tokenResponse.parameters["scope"];
      const consentedScopes = scope.split(" ");
      // retrieve all access tokens from the cache, remove the dup scores
      const accessTokenCacheItems = this.cacheStorage.getAllAccessTokens(this.clientId, authority);
      for (let i = 0; i < accessTokenCacheItems.length; i++) {
        const accessTokenCacheItem = accessTokenCacheItems[i];
        if (accessTokenCacheItem.key.userIdentifier === user.userIdentifier) {
          const cachedScopes = accessTokenCacheItem.key.scopes.split(" ");
          if (Utils.isIntersectingScopes(cachedScopes, consentedScopes)) {
            this.cacheStorage.removeItem(JSON.stringify(accessTokenCacheItem.key));
          }
        }
      }

      // Generate and cache accessTokenKey and accessTokenValue
      const accessTokenKey = new AccessTokenKey(authority, this.clientId, scope, clientObj.uid, clientObj.utid);
      const accessTokenValue = new AccessTokenValue(tokenResponse.parameters[Constants.accessToken], idToken.rawIdToken, Utils.expiresIn(tokenResponse.parameters[Constants.expiresIn]).toString(), clientInfo);
      this.cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
    }
    // if the response does not contain "scope" - scope is usually client_id and the token will be id_token
    else {
      scope = this.clientId;

      // Generate and cache accessTokenKey and accessTokenValue
      const accessTokenKey = new AccessTokenKey(authority, this.clientId, scope, clientObj.uid, clientObj.utid);
      // TODO: since there is no access_token, this is also set to id_token?
      const accessTokenValue = new AccessTokenValue(tokenResponse.parameters[Constants.idToken], tokenResponse.parameters[Constants.idToken], idToken.expiration, clientInfo);
      this.cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
    }
  }

  /**
   * Saves token or error received in the response from AAD in the cache. In case of id_token, it also creates the user object.
   * @ignore
   * @hidden
   */
  // TODO: Break this function up - either into utils or token specific --- too long to be readable
  protected saveTokenFromHash(tokenResponse: TokenResponse): void {

    this.logger.info("State status:" + tokenResponse.stateMatch + "; Request type:" + tokenResponse.requestType);
    this.cacheStorage.setItem(Constants.msalError, "");
    this.cacheStorage.setItem(Constants.msalErrorDescription, "");

    let authorityKey: string = "";
    let acquireTokenUserKey: string = "";

    // If server returns an error
    if (tokenResponse.parameters.hasOwnProperty(Constants.errorDescription) || tokenResponse.parameters.hasOwnProperty(Constants.error)) {
      this.logger.infoPii("Error :" + tokenResponse.parameters[Constants.error] + "; Error description:" + tokenResponse.parameters[Constants.errorDescription]);
      this.cacheStorage.setItem(Constants.msalError, tokenResponse.parameters["error"]);
      this.cacheStorage.setItem(Constants.msalErrorDescription, tokenResponse.parameters[Constants.errorDescription]);

      // login
      if (tokenResponse.requestType === Constants.login) {
        this.userLoginInProgress = false;
        this.cacheStorage.setItem(Constants.loginError, tokenResponse.parameters[Constants.errorDescription] + ":" + tokenResponse.parameters[Constants.error]);
        authorityKey = Storage.generateAuthorityKey(tokenResponse.stateResponse);
      }

      // acquireToken
      if (tokenResponse.requestType === Constants.renewToken) {
        this.acquireTokenInProgress = false;
        authorityKey = Storage.generateAuthorityKey(tokenResponse.stateResponse);
        const userKey = this.getUser() !== null ? this.getUser().userIdentifier : "";
        acquireTokenUserKey = Storage.generateAcquireTokenUserKey(userKey, tokenResponse.stateResponse);
      }
    }
    // If the server returns "Success"
    else {
      // Verify the state from redirect and record tokens to storage if exists
      if (tokenResponse.stateMatch) {
        this.logger.info("State is right");
        if (tokenResponse.parameters.hasOwnProperty(Constants.sessionState)) {
            this.cacheStorage.setItem(Constants.msalSessionState, tokenResponse.parameters[Constants.sessionState]);
        }

        let idToken: IdToken;
        let clientInfo: string = "";

        // Process access_token
        if (tokenResponse.parameters.hasOwnProperty(Constants.accessToken)) {
          this.logger.info("Fragment has access token");
          this.acquireTokenInProgress = false;
          let user: User;

          // retrieve the id_token from response if present :
          // TODO: Is this the case of id_token_token??
          if (tokenResponse.parameters.hasOwnProperty(Constants.idToken)) {
            idToken = new IdToken(tokenResponse.parameters[Constants.idToken]);
          } else {
            idToken = new IdToken(this.cacheStorage.getItem(Constants.idTokenKey));
          }

          // retrieve the authority from cache and replace with tenantID
          const authorityKey = Storage.generateAuthorityKey(tokenResponse.stateResponse);
          let authority: string = this.cacheStorage.getItem(authorityKey, this.inCookie);
          if (!Utils.isEmpty(authority)) {
            authority = Utils.replaceTenantPath(authority, idToken.tenantId);
          }

          // retrieve client_info - if it is not found, generate the uid and utid from idToken
          if (tokenResponse.parameters.hasOwnProperty(Constants.clientInfo)) {
            clientInfo = tokenResponse.parameters[Constants.clientInfo];
            user = User.createUser(idToken, new ClientInfo(clientInfo));
          } else {
            this.logger.warning("ClientInfo not received in the response from AAD");
            user = User.createUser(idToken, new ClientInfo(clientInfo));
          }

          const acquireTokenUserKey = Storage.generateAcquireTokenUserKey(user.userIdentifier, tokenResponse.stateResponse);
          const acquireTokenUserKey_nouser = Storage.generateAcquireTokenUserKey(Constants.no_user, tokenResponse.stateResponse);

          let cachedUser: string = this.cacheStorage.getItem(acquireTokenUserKey);
          let acquireTokenUser: User;

          // Check with the user in the Cache
          if (!Utils.isEmpty(cachedUser)) {
            acquireTokenUser = JSON.parse(cachedUser);
            if (user && acquireTokenUser && Utils.compareObjects(user, acquireTokenUser)) {
              this.saveAccessToken(authority, tokenResponse, user, clientInfo, idToken);
              this.logger.info("The user object received in the response is the same as the one passed in the acquireToken request");
            } else {
              this.logger.warning(
                "The user object created from the response is not the same as the one passed in the acquireToken request");
            }
          } else if (!Utils.isEmpty(this.cacheStorage.getItem(acquireTokenUserKey_nouser))) {
            this.saveAccessToken(authority, tokenResponse, user, clientInfo, idToken);
          }
        }

        // Process id_token
        if (tokenResponse.parameters.hasOwnProperty(Constants.idToken)) {
            this.logger.info("Fragment has id token");
            // login no longer in progress
            this.userLoginInProgress = false;
            idToken = new IdToken(tokenResponse.parameters[Constants.idToken]);
            if (tokenResponse.parameters.hasOwnProperty(Constants.clientInfo)) {
              clientInfo = tokenResponse.parameters[Constants.clientInfo];
            } else {
              this.logger.warning("ClientInfo not received in the response from AAD");
            }

            authorityKey = Storage.generateAuthorityKey(tokenResponse.stateResponse);
            let authority: string = this.cacheStorage.getItem(authorityKey, this.inCookie);
            if (!Utils.isEmpty(authority)) {
              authority = Utils.replaceTenantPath(authority, idToken.tenantId);
            }

            this.user = User.createUser(idToken, new ClientInfo(clientInfo));

            if (idToken && idToken.nonce) {
              // check nonce integrity if idToken has nonce - throw an error if not matched
              if (idToken.nonce !== this.cacheStorage.getItem(Constants.nonceIdToken, this.inCookie)) {
                this.user = null;
                // TODO: optimize this - may be combine if it is a string in both cases
                this.cacheStorage.setItem(Constants.loginError, "Nonce Mismatch. Expected Nonce: " + this.cacheStorage.getItem(Constants.nonceIdToken, this.inCookie) + "," + "Actual Nonce: " + idToken.nonce);
                this.logger.error("Nonce Mismatch.Expected Nonce: " + this.cacheStorage.getItem(Constants.nonceIdToken, this.inCookie) + "," + "Actual Nonce: " + idToken.nonce);
              }
              // Save the token
              else {
                this.cacheStorage.setItem(Constants.idTokenKey, tokenResponse.parameters[Constants.idToken]);
                this.cacheStorage.setItem(Constants.msalClientInfo, clientInfo);

                // Save idToken as access token for app itself
                this.saveAccessToken(authority, tokenResponse, this.user, clientInfo, idToken);
              }
            } else {
              // TODO: avoid repeated strings - will this be optimized with error handling?
              authorityKey = tokenResponse.stateResponse;
              acquireTokenUserKey = tokenResponse.stateResponse;
              this.logger.error("Invalid id_token received in the response");
              tokenResponse.parameters["error"] = "invalid idToken";
              tokenResponse.parameters["error_description"] = "Invalid idToken. idToken: " + tokenResponse.parameters[Constants.idToken];
              this.cacheStorage.setItem(Constants.msalError, "invalid idToken");
              this.cacheStorage.setItem(Constants.msalErrorDescription, "Invalid idToken. idToken: " + tokenResponse.parameters[Constants.idToken]);
            }
        }
      }
      // State mismatch - unexpected/invalid state
      else {
        authorityKey = tokenResponse.stateResponse;
        acquireTokenUserKey = tokenResponse.stateResponse;
        this.logger.error("State Mismatch.Expected State: " + this.cacheStorage.getItem(Constants.stateLogin, this.inCookie) + "," + "Actual State: " + tokenResponse.stateResponse);
        // TODO: avoid repeated strings - will this be optimized with error handling?
        tokenResponse.parameters["error"] = "Invalid_state";
        tokenResponse.parameters["error_description"] = "Invalid_state. state: " + tokenResponse.stateResponse;
        this.cacheStorage.setItem(Constants.msalError, "Invalid_state");
        this.cacheStorage.setItem(Constants.msalErrorDescription, "Invalid_state. state: " + tokenResponse.stateResponse);
      }
    }
    this.cacheStorage.setItem(Constants.renewStatus + tokenResponse.stateResponse, Constants.tokenRenewStatusCompleted);
    this.cacheStorage.removeAcquireTokenEntries(authorityKey, acquireTokenUserKey);
    // this is required if navigateToLoginRequestUrl=false
    if (this.inCookie) {
      this.cacheStorage.setItemCookie(authorityKey, "", -1);
      this.cacheStorage.clearCookie();
    }
  }
  /* tslint:enable:no-string-literal */

  //#endregion

  //#region Account

  // TODO: Change User to Account

  /**
   * Returns the signed in user (received from a user object created at the time of login) or null.
   */
  // TODO: Should there be a public function modifier here?
  getUser(): User {
    // if a session already exists, get the user from the session
    if (this.user) {
      return this.user;
    }

    // frame is used to get idToken and populate the user for the given session
    const rawIdToken = this.cacheStorage.getItem(Constants.idTokenKey);
    const rawClientInfo = this.cacheStorage.getItem(Constants.msalClientInfo);

    if (!Utils.isEmpty(rawIdToken) && !Utils.isEmpty(rawClientInfo)) {
      const idToken = new IdToken(rawIdToken);
      const clientInfo = new ClientInfo(rawClientInfo);
      this.user = User.createUser(idToken, clientInfo);
      return this.user;
    }
    // if login not yet done, return null
    return null;
  }

  /**
   * Extracts state value from the userState sent with the authentication request.
   * @returns {string} scope.
   * @ignore
   * @hidden
   */
  getUserState (state: string) {
    if (state) {
      const splitIndex = state.indexOf("|");
      if (splitIndex > -1 && splitIndex + 1 < state.length) {
        return state.substring(splitIndex + 1);
      }
    }
    return "";
  }

  /**
   * Used to filter all cached items and return a list of unique users based on userIdentifier.
   * @param {Array<User>} Users - users saved in the cache.
   */
  getAllUsers(): Array<User> {
    const users: Array<User> = [];
    const accessTokenCacheItems = this.cacheStorage.getAllAccessTokens(Constants.clientId, Constants.userIdentifier);
    for (let i = 0; i < accessTokenCacheItems.length; i++) {
      const idToken = new IdToken(accessTokenCacheItems[i].value.idToken);
      const clientInfo = new ClientInfo(accessTokenCacheItems[i].value.clientInfo);
      const user = User.createUser(idToken, clientInfo);
      users.push(user);
    }

    return this.getUniqueUsers(users);
  }

  /**
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

  //#endregion

  //#region Scopes (Extract to Scopes.ts)

  // TODO: "this" dependency in this section is minimal.
  // If pCacheStorage is separated from the class object, or passed as a fn param, scopesUtils.ts can be created

  /**
   * Used to validate the scopes input parameter requested  by the developer.
   * @param {Array<string>} scopes - Developer requested permissions. Not all scopes are guaranteed to be included in the access token returned.
   * @param {boolean} scopesRequired - Boolean indicating whether the scopes array is required or not
   * @ignore
   * @hidden
   */
  private validateInputScope(scopes: Array<string>, scopesRequired: boolean): void {
    if (!scopes) {
      if (scopesRequired) {
        throw ClientConfigurationError.createScopesRequiredError(scopes);
      } else {
        return;
      }
    }

    // Check that scopes is an array object (also throws error if scopes == null)
    if (!Array.isArray(scopes)) {
      throw ClientConfigurationError.createScopesNonArrayError(scopes);
    }

    // Check that scopes is not an empty array
    if (scopes.length < 1) {
      throw ClientConfigurationError.createEmptyScopesArrayError(scopes.toString());
    }

    // Check that clientId is passed as single scope
    if (scopes.indexOf(this.clientId) > -1) {
      if (scopes.length > 1) {
        throw ClientConfigurationError.createClientIdSingleScopeError(scopes.toString());
      }
    }
  }

  /**
  * Extracts scope value from the state sent with the authentication request.
  * @returns {string} scope.
  * @ignore
  * @hidden
  */
  // TODO: can this function be removed? not used.
  private getScopeFromState(state: string): string {
    if (state) {
      const splitIndex = state.indexOf("|");
      if (splitIndex > -1 && splitIndex + 1 < state.length) {
        return state.substring(splitIndex + 1);
      }
    }
    return "";
  }

  //#endregion

  //#region Angular

  /**
  * Broadcast messages - Used only for Angular?
  *
  * @param eventName
  * @param data
  */
  // TODO: Is there a better way to do this? At the least, sandbox this to the wrapper listening in to the core after the handshake
  private broadcast(eventName: string, data: string) {
    const evt = new CustomEvent(eventName, { detail: data });
    window.dispatchEvent(evt);
  }

  // TODO: All the below fns are used in msal-angular ONLY, refactor this, implement the bulk in angular if possible?
  /**
   * Helper function to retrieve the cached token
   *
   * @param scopes
   * @param user
   */
  protected getCachedTokenInternal(scopes : Array<string> , user: User): CacheResult {
    // Get the current session's user object
    const userObject = user ? user : this.getUser();
    if (!userObject) {
        return null;
    }

    // Construct AuthenticationRequest based on response type
    const newAuthority = this.authorityInstance ? this.authorityInstance : AuthorityFactory.CreateInstance(this.authority, this.config.auth.validateAuthority);
    const responseType = this.getTokenType(userObject, scopes, true);
    const authenticationRequest = new AuthenticationRequestParameters(
      newAuthority,
      this.clientId,
      scopes,
      responseType,
      this.getRedirectUri(),
      this.config.auth.state
    );

    // get cached token
    return this.getCachedToken(authenticationRequest, user);
  }

  /**
   * Get scopes for the Endpoint - Used in Angular to track protected and unprotected resources without interaction from the developer app
   *
   * @param endpoint
   */
  protected getScopesForEndpoint(endpoint: string) : Array<string> {
    // if user specified list of unprotectedResources, no need to send token to these endpoints, return null.
    if (this.config.framework.unprotectedResources.length > 0) {
        for (let i = 0; i < this.config.framework.unprotectedResources.length; i++) {
            if (endpoint.indexOf(this.config.framework.unprotectedResources[i]) > -1) {
                return null;
            }
        }
    }

    // process all protected resources and send the matched one
    if (this.config.framework.protectedResourceMap.size > 0) {
        for (let key of Array.from(this.config.framework.protectedResourceMap.keys())) {
            // configEndpoint is like /api/Todo requested endpoint can be /api/Todo/1
            if (endpoint.indexOf(key) > -1) {
                return this.config.framework.protectedResourceMap.get(key);
            }
        }
    }

    // default resource will be clientid if nothing specified
    // App will use idtoken for calls to itself
    // check if it's staring from http or https, needs to match with app host
    if (endpoint.indexOf("http://") > -1 || endpoint.indexOf("https://") > -1) {
        if (this.getHostFromUri(endpoint) === this.getHostFromUri(this.getRedirectUri())) {
            return new Array<string>(this.clientId);
        }
    } else {
    // in angular level, the url for $http interceptor call could be relative url,
    // if it's relative call, we'll treat it as app backend call.
        return new Array<string>(this.clientId);
    }

    // if not the app's own backend or not a domain listed in the endpoints structure
    return null;
  }

  /**
   * tracks if login is in progress
   */
  loginInProgress(): boolean {
    const pendingCallback = this.cacheStorage.getItem(Constants.urlHash);
    if (pendingCallback) {
        return true;
    }
    return this.userLoginInProgress;
  }

  /**
   * @param userLoginInProgress
   */
  protected setuserLoginInProgress(userLoginInProgress : boolean) {
    this.userLoginInProgress = userLoginInProgress;
  }

  /**
   * returns the status of acquireTokenInProgress
   */
  protected getAcquireTokenInProgress(): boolean {
      return this.acquireTokenInProgress;
  }

  /**
   * @param acquireTokenInProgress
   */
  protected setAcquireTokenInProgress(acquireTokenInProgress : boolean) {
      this.acquireTokenInProgress = acquireTokenInProgress;
  }

  /**
   * returns the logger handle
   */
  protected getLogger() {
      return this.config.system.logger;
  }

  //#endregion

  //#region Getters and Setters

  /**
   * Used to get the redirect uri. Evaluates redirectUri if its a function, otherwise simply returns its value.
   * @ignore
   * @hidden
   */
  private getRedirectUri(): string {
    if (typeof this.config.auth.redirectUri === "function") {
      return this.config.auth.redirectUri();
    }
    return this.config.auth.redirectUri;
  }

  /**
   * Used to get the post logout redirect uri. Evaluates postLogoutredirectUri if its a function, otherwise simply returns its value.
   * @ignore
   * @hidden
   */
  private getPostLogoutRedirectUri(): string {
    if (typeof this.config.auth.postLogoutRedirectUri === "function") {
      return this.config.auth.postLogoutRedirectUri();
    }
    return this.config.auth.postLogoutRedirectUri;
  }

  //#endregion

  //#region String Util (Should be extracted to Utils.ts)

  /**
   * Checks if the authorization endpoint URL contains query string parameters
   * @ignore
   * @hidden
   */
  // TODO: Terrible name, rename it
  private urlContainsQueryStringParameter(name: string, url: string): boolean {
    // regex to detect pattern of a ? or & followed by the name parameter and an equals character
    const regex = new RegExp("[\\?&]" + name + "=");
    return regex.test(url);
  }

  /**
   * Returns the anchor part(#) of the URL
   * @ignore
   * @hidden
   */
  private getHash(hash: string): string {
    if (hash.indexOf("#/") > -1) {
      hash = hash.substring(hash.indexOf("#/") + 2);
    } else if (hash.indexOf("#") > -1) {
      hash = hash.substring(1);
    }

    return hash;
  }

  /**
   * extract URI from the host
   *
   * @param uri
   * @hidden
   */
  private getHostFromUri(uri: string): string {
    // remove http:// or https:// from uri
    // TODO: Test this:: return  extractedUri = String(uri).replace(/^(https?:)\/\//, "").split("/")[0];
    let extractedUri = String(uri).replace(/^(https?:)\/\//, "");
    extractedUri = extractedUri.split("/")[0];
    return extractedUri;
  }

  /**
   * Utils function to create the Authentication
   * @param userObject
   * @param scopes
   * @param silentCall
   */
  private getTokenType(userObject: User, scopes: string[], silentCall: boolean): string {

    // if user is passed and matches the user object/or set to getUser() from cache
    // if client-id is passed as scope, get id_token else token/id_token_token (in case no session exists)
    let tokenType: string;

    // acquireTokenSilent
    if (silentCall) {
      if (Utils.compareObjects(userObject, this.getUser())) {
        tokenType = (scopes.indexOf(this.config.auth.clientId) > -1) ? ResponseTypes.id_token : ResponseTypes.token;
      }
      else {
        tokenType  = (scopes.indexOf(this.config.auth.clientId) > -1) ? ResponseTypes.id_token : ResponseTypes.id_token_token;
      }

      return tokenType;
    }
    // all other cases
    else {
      tokenType = Utils.compareObjects(userObject, this.getUser()) ? ResponseTypes.id_token : ResponseTypes.id_token_token;

      if (tokenType === ResponseTypes.id_token) {
        tokenType = (scopes.indexOf(this.config.auth.clientId) > -1) ? ResponseTypes.id_token : ResponseTypes.token;
      }

      return tokenType;
    }

  }

  /**
   * Construct 'tokenRequest' from the available data in adalIdToken
   * @param extraQueryParameters
   */
  private buildIDTokenRequest(extraQueryParameters: string): AuthenticationParameters {
    // TODO: This is not to be called here because acquireTokenSilent makes this call again
    // extraQueryParameters = Utils.constructUnifiedCacheExtraQueryParameter(idTokenObject, extraQueryParameters);

    let reqExtraQueryParameters = Utils.destructExtraQueryParameterString(extraQueryParameters);

    let tokenRequest: AuthenticationParameters = {
      scopes: [this.clientId],
      authority: this.authority,
      account: this.getUser(),
      extraQueryParameters: reqExtraQueryParameters
    };

    return tokenRequest;
  }

 //#endregion
}
