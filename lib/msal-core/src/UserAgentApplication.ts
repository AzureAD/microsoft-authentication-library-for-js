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
        callBackMappedToRenewStates : {};
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
const ResponseTypes = {
  id_token: "id_token",
  token: "token",
  id_token_token: "id_token token"
};

/**
 *
 * @hidden
 */
// TODO: This will move to Response Object
export interface CacheResult {
  errorDesc: string;
  token: string;
  error: string;
}

/**
 * A type alias of for a tokenReceivedCallback function.
 * @param tokenReceivedCallback.errorDesc error description returned from the STS if API call fails.
 * @param tokenReceivedCallback.token token returned from STS if token request is successful.
 * @param tokenReceivedCallback.error error code returned from the STS if API call fails.
 * @param tokenReceivedCallback.tokenType tokenType returned from the STS if API call is successful. Possible values are: id_token OR access_token.
 */
// TODO: Rework the callback as per new design - handleRedirectCallbacks() implementation etc.
export type tokenReceivedCallback = (errorDesc: string, token: string, error: string, tokenType: string, userState: string ) => void;

// TODO: Add second callback for error cases

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

  // TODO: Initialize configuration object
  // TODO: Many of these variables will be set in the configuration object

  /**
   * @hidden
   */
  private _cacheLocations = {
    localStorage: "localStorage",
    sessionStorage: "sessionStorage"
  };

  /**
   * @hidden
   */
  private _cacheLocation: string;

  /**
   * Used to get the cache location
   */
  get cacheLocation(): string {
    return this._cacheLocation;
  }

  /**
   * @hidden
   */
  protected _logger: Logger;

  /**
   * @hidden
   */
  private _loginInProgress: boolean;

  /**
   * @hidden
   */
  private _acquireTokenInProgress: boolean;

  /**
   * @hidden
   */
  private _clockSkew = 300;

  /**
   * @hidden
   */
  protected _cacheStorage: Storage;

  /**
   * @hidden
   */
  private _tokenReceivedCallback: tokenReceivedCallback = null;

  /**
   * @hidden
   */
  private _user: User;

  /**
   * Client ID assigned to your app by Azure Active Directory.
   */
  clientId: string;

  /**
   * @hidden
   */
  protected authorityInstance: Authority;

  /**
   * Used to set the authority.
   * @param {string} authority - A URL indicating a directory that MSAL can use to obtain tokens.
   * - In Azure AD, it is of the form https://&lt;tenant&gt;/&lt;tenant&gt;, where &lt;tenant&gt; is the directory host (e.g. https://login.microsoftonline.com) and &lt;tenant&gt; is a identifier within the directory itself (e.g. a domain associated to the tenant, such as contoso.onmicrosoft.com, or the GUID representing the TenantID property of the directory)
   * - In Azure B2C, it is of the form https://&lt;instance&gt;/tfp/&lt;tenant&gt;/<policyName>/
   * - Default value is: "https://login.microsoftonline.com/common"
   */
  // TODO: Setter and Getter for authority is used to set the authorityInstance.
  // Should we rework this as a part of pConfig.auth.authority or maintain this as a class variable?
  public set authority(val) {
    this.authorityInstance = AuthorityFactory.CreateInstance(val, this.validateAuthority);
  }

  /**
   * Used to get the authority.
   */
  public get authority(): string {
    return this.authorityInstance.CanonicalAuthority;
  }

  /**
   * Used to turn authority validation on/off.
   * When set to true (default), MSAL will compare the application"s authority against well-known URLs templates representing well-formed authorities. It is useful when the authority is obtained at run time to prevent MSAL from displaying authentication prompts from malicious pages.
   */
  validateAuthority: boolean;

  /**
   * The redirect URI of the application, this should be same as the value in the application registration portal.
   * Defaults to `window.location.href`.
   */
  private _redirectUri: string | (() => string);

    /**
     * Use to send the state parameter with authentication request
     */
    private _state: string;
  /**
   * Used to redirect the user to this location after logout.
   * Defaults to `window.location.href`.
   */
  private _postLogoutredirectUri: string | (() => string);

  loadFrameTimeout: number;

  protected _navigateToLoginRequestUrl: boolean;

  private _isAngular: boolean = false;

  private _protectedResourceMap: Map<string, Array<string>>;

  private _unprotectedResources: Array<string>;

  private storeAuthStateInCookie: boolean;

  private _silentAuthenticationState: string;

  private _silentLogin: boolean;

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
  // TODO: Update constructor to accept configuration object, success callback and error callback
  constructor(
    clientId: string,
    authority: string | null,
    tokenReceivedCallback: tokenReceivedCallback,
    options:
      {
        validateAuthority?: boolean,
        cacheLocation?: string,
        redirectUri?: string | (() => string),
        postLogoutRedirectUri?: string | (() => string),
        logger?: Logger,
        loadFrameTimeout?: number,
        navigateToLoginRequestUrl?: boolean,
        state?: string,
        isAngular?: boolean,
        unprotectedResources?: Array<string>
        protectedResourceMap?: Map<string, Array<string>>,
        storeAuthStateInCookie?: boolean
      } = {}) {
      const {
          validateAuthority = true,
          cacheLocation = "sessionStorage",
          redirectUri = () => window.location.href.split("?")[0].split("#")[0],
          postLogoutRedirectUri = () => window.location.href.split("?")[0].split("#")[0],
          logger = new Logger(null),
          loadFrameTimeout = 6000,
          navigateToLoginRequestUrl = true,
          state = "",
          isAngular = false,
          unprotectedResources = new Array<string>(),
          protectedResourceMap = new Map<string, Array<string>>(),
          storeAuthStateInCookie = false
      } = options;

    // TODO: The configuration object will take care of many of these assignments
    this.loadFrameTimeout = loadFrameTimeout;
    this.clientId = clientId;
    this.validateAuthority = validateAuthority;
    // TODO: Replace string with constant
    this.authority = authority || "https://login.microsoftonline.com/common";
    this._navigateToLoginRequestUrl = navigateToLoginRequestUrl;
    this._state = state;
    this._isAngular = isAngular;
    this._unprotectedResources = unprotectedResources;
    this._protectedResourceMap = protectedResourceMap;
    this._redirectUri = redirectUri;
    this._postLogoutredirectUri = postLogoutRedirectUri;
    this._logger = logger;
    this.storeAuthStateInCookie = storeAuthStateInCookie;

    // TODO: This should be replaced with two different callbacks for success and error cases
    this._tokenReceivedCallback = tokenReceivedCallback;

    // Track login and acquireToken in progress
    this._loginInProgress = false;
    this._acquireTokenInProgress = false;

    // TODO: This should be replaced with cache object, typescript checking for "localStorage" and "sessionStorage" values
    this._cacheLocation = cacheLocation;
    if (!this._cacheLocations[cacheLocation]) {
      throw new Error("Cache Location is not valid. Provided value:" + this._cacheLocation + ".Possible values are: " + this._cacheLocations.localStorage + ", " + this._cacheLocations.sessionStorage);
    }
    this._cacheStorage = new Storage(this._cacheLocation); //cache keys msal

    // Initialize window handling code
    // TODO: refactor - write a utility function
    window.openedWindows = [];
    window.activeRenewals = {};
    window.renewStates = [];
    window.callBackMappedToRenewStates = { };
    window.callBacksMappedToRenewStates = { };
    window.msal = this;
    const urlHash = window.location.hash;
    const isCallback = this.isCallback(urlHash);

    // On the server 302 - Redirect, handle this
    if (!this._isAngular) {
        if (isCallback) {
            this.handleAuthenticationResponse.call(this, urlHash);
        }
        else {
            const pendingCallback = this._cacheStorage.getItem(Constants.urlHash);
            if (pendingCallback) {
                this.processCallBack(pendingCallback);
            }
        }
    }
  }

  //#region Redirect Flow

  /**
   * Initiate the login process by redirecting the user to the STS authorization endpoint.
   * @param {Array.<string>} scopes - Permissions you want included in the access token. Not all scopes are guaranteed to be included in the access token returned.
   * @param {string} extraQueryParameters - Key-value pairs to pass to the authentication server during the interactive authentication flow.
   */
  // TODO: params to accept AuthRequest object instead
  loginRedirect(scopes?: Array<string>, extraQueryParameters?: string): void {
    /*
    1. Create navigate url
    2. saves value in cache
    3. redirect user to AAD
     */
    if (this._loginInProgress) {
      // TODO: use error callback here
      if (this._tokenReceivedCallback) {
            this._tokenReceivedCallback(ErrorDescription.loginProgressError, null, ErrorCodes.loginProgressError, Constants.idToken, this.getUserState(this._cacheStorage.getItem(Constants.stateLogin, this.storeAuthStateInCookie)));
        return;
      }
      // TODO: Should we throw noCallback error here?
    }

    // TODO: Replace with new validation pattern - This will come with Error
    if (scopes) {
      const isValidScope = this.validateInputScope(scopes);
      if (isValidScope && !Utils.isEmpty(isValidScope)) {
          if (this._tokenReceivedCallback) {
              this._tokenReceivedCallback(ErrorDescription.inputScopesError, null, ErrorCodes.inputScopesError, Constants.idToken, this.getUserState(this._cacheStorage.getItem(Constants.stateLogin, this.storeAuthStateInCookie)));
          return;
        }
      }
      scopes = this.filterScopes(scopes);
    }

    // extract ADAL id_token if exists
    let idTokenObject = this.extractADALIdToken();

    // silent login if ADAL id_token is retrieved successfully - SSO
    if (idTokenObject && !scopes) {
      this._logger.info("ADAL's idToken exists. Extracting login information from ADAL's idToken ");
      extraQueryParameters = Utils.constructUnifiedCacheExtraQueryParameter(idTokenObject, extraQueryParameters);
      this._silentLogin = true;
      this.acquireTokenSilent([this.clientId], this.authority, this.getUser(), extraQueryParameters)
      .then((idToken) => {
        this._silentLogin = false;
        this._logger.info("Unified cache call is successful");
        // TODO: Change callback to return AuthResponse
        if (this._tokenReceivedCallback) {
          this._tokenReceivedCallback.call(this, null, idToken, null, Constants.idToken, this.getUserState(this._silentAuthenticationState));
        }
      }, (error) => {
        this._silentLogin = false;
        this._logger.error("Error occurred during unified cache ATS");
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
  private loginRedirectHelper(scopes?: Array<string>, extraQueryParameters?: string) {
    // Track login in progress
    this._loginInProgress = true;

    // TODO: Make this more readable - is authorityInstance changed, what is happening with the return for AuthorityKey?
    this.authorityInstance.ResolveEndpointsAsync()
    .then(() => {
      const authenticationRequest = new AuthenticationRequestParameters(this.authorityInstance, this.clientId, scopes, ResponseTypes.id_token, this.getRedirectUri(), this._state);
      if (extraQueryParameters) {
        authenticationRequest.extraQueryParameters = extraQueryParameters;
      }

      // if the user sets the login start page - angular only??
      let loginStartPage = this._cacheStorage.getItem(Constants.angularLoginRequest);
      if (!loginStartPage || loginStartPage === "") {
        loginStartPage = window.location.href;
      } else {
        this._cacheStorage.setItem(Constants.angularLoginRequest, "");
      }

      // Cache the state, nonce, and login request data
      this._cacheStorage.setItem(Constants.loginRequest, loginStartPage, this.storeAuthStateInCookie);
      this._cacheStorage.setItem(Constants.loginError, "");

      this._cacheStorage.setItem(Constants.stateLogin, authenticationRequest.state, this.storeAuthStateInCookie);
      this._cacheStorage.setItem(Constants.nonceIdToken, authenticationRequest.nonce, this.storeAuthStateInCookie);

      this._cacheStorage.setItem(Constants.msalError, "");
      this._cacheStorage.setItem(Constants.msalErrorDescription, "");

      // Cache authorityKey
      const authorityKey = Storage.generateAuthorityKey(authenticationRequest.state);
      this._cacheStorage.setItem(authorityKey, this.authority, this.storeAuthStateInCookie);

      // build URL to navigate to proceed with the login
      const urlNavigate = authenticationRequest.createNavigateUrl(scopes)  + Constants.response_mode_fragment;

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
  acquireTokenRedirect(scopes: Array<string>): void;
  acquireTokenRedirect(scopes: Array<string>, authority: string): void;
  acquireTokenRedirect(scopes: Array<string>, authority: string, user: User): void;
  acquireTokenRedirect(scopes: Array<string>, authority: string, user: User, extraQueryParameters: string): void;
  acquireTokenRedirect(scopes: Array<string>, authority?: string, user?: User, extraQueryParameters?: string): void {
    // Validate scopes
    // TODO: Change to new validation pattern
    // TODO: is this always access token?
    const isValidScope = this.validateInputScope(scopes);
    if (isValidScope && !Utils.isEmpty(isValidScope)) {
        if (this._tokenReceivedCallback) {
            this._tokenReceivedCallback(ErrorDescription.inputScopesError, null, ErrorCodes.inputScopesError, Constants.accessToken, this.getUserState(this._cacheStorage.getItem(Constants.stateLogin, this.storeAuthStateInCookie)));
        return;
      }
    }

    if (scopes) {
      scopes = this.filterScopes(scopes);
    }

    // Get the user object if a session exists
    const userObject = user ? user : this.getUser();

    // If already in progress, do not proceed
    // TODO: Should we throw or return an error here?
    if (this._acquireTokenInProgress) {
      return;
    }

    // If no session exists, prompt the user to login.
    if (!userObject && !(extraQueryParameters && (extraQueryParameters.indexOf(Constants.login_hint) !== -1 ))) {
    // TODO: This should be replaced with error callback
    // TODO: Is this always accessToken?
      if (this._tokenReceivedCallback) {
        this._logger.info("User login is required");
        this._tokenReceivedCallback(ErrorDescription.userLoginError, null, ErrorCodes.userLoginError, Constants.accessToken, this.getUserState(this._cacheStorage.getItem(Constants.stateLogin, this.storeAuthStateInCookie)));
        return;
      }
    }

    // Track the acquireToken progress
    this._acquireTokenInProgress = true;

    let authenticationRequest: AuthenticationRequestParameters;
    const acquireTokenAuthority = authority ? AuthorityFactory.CreateInstance(authority, this.validateAuthority) : this.authorityInstance;

    // TODO: Set response type here
    acquireTokenAuthority.ResolveEndpointsAsync().then(() => {
      // On Fulfillment
      if (Utils.compareObjects(userObject, this.getUser())) {
        if (scopes.indexOf(this.clientId) > -1) {
          authenticationRequest = new AuthenticationRequestParameters(acquireTokenAuthority, this.clientId, scopes, ResponseTypes.id_token, this.getRedirectUri(), this._state);
        } else {
          authenticationRequest = new AuthenticationRequestParameters(acquireTokenAuthority, this.clientId, scopes, ResponseTypes.token, this.getRedirectUri(), this._state);
        }
      } else {
        authenticationRequest = new AuthenticationRequestParameters(acquireTokenAuthority, this.clientId, scopes, ResponseTypes.id_token_token, this.getRedirectUri(), this._state);
      }

      // Cache nonce
      this._cacheStorage.setItem(Constants.nonceIdToken, authenticationRequest.nonce, this.storeAuthStateInCookie);

      // Cache acquireTokenUserKey
      const userId = userObject ? userObject.userIdentifier : Constants.no_user;
      const acquireTokenUserKey = Storage.generateAcquireTokenUserKey(userId, authenticationRequest.state);
      this._cacheStorage.setItem(acquireTokenUserKey, JSON.stringify(userObject));

      // Cache authorityKey
      const authorityKey = Storage.generateAuthorityKey(authenticationRequest.state);
      this._cacheStorage.setItem(authorityKey, acquireTokenAuthority.CanonicalAuthority, this.storeAuthStateInCookie);

      // Set extraQueryParameters to be sent to the server
      if (extraQueryParameters) {
        authenticationRequest.extraQueryParameters = extraQueryParameters;
      }

      // Construct urlNavigate
      let urlNavigate = authenticationRequest.createNavigateUrl(scopes) + Constants.response_mode_fragment;
      urlNavigate = this.addHintParameters(urlNavigate, userObject);

      // set state in cache and redirect to urlNavigate
      if (urlNavigate) {
        this._cacheStorage.setItem(Constants.stateAcquireToken, authenticationRequest.state, this.storeAuthStateInCookie);
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
  // TODO: params to accept AuthRequest object instead
  loginPopup(scopes ?: Array<string>, extraQueryParameters?: string): Promise<string> {
    /*
    1. Create navigate url
    2. saves value in cache
    3. redirect user to AAD
     */
    return new Promise<string>((resolve, reject) => {
      // Fail if login is already in progress
      if (this._loginInProgress) {
        // TODO: Return custom error object here in future
        reject(ErrorCodes.loginProgressError + Constants.resourceDelimiter + ErrorDescription.loginProgressError);
        return;
      }

      // Validate scopes
      // TODO: Replace with new validation pattern
      if (scopes) {
        const isValidScope = this.validateInputScope(scopes);
        if (isValidScope && !Utils.isEmpty(isValidScope)) {
          // TODO: Return custom error object here in future
          reject(ErrorCodes.inputScopesError + Constants.resourceDelimiter + ErrorDescription.inputScopesError);
          return;
        }

        scopes = this.filterScopes(scopes);
      }

      // Extract ADAL id_token if it exists
      let idTokenObject;
      idTokenObject = this.extractADALIdToken();

      // silent login if ADAL id_token is retrieved successfully - SSO
      if (idTokenObject && !scopes) {
        this._logger.info("ADAL's idToken exists. Extracting login information from ADAL's idToken ");
        extraQueryParameters = Utils.constructUnifiedCacheExtraQueryParameter(idTokenObject, extraQueryParameters);

        this._silentLogin = true;
        this.acquireTokenSilent([this.clientId], this.authority, this.getUser(), extraQueryParameters)
        .then((idToken) => {
          this._silentLogin = false;
          this._logger.info("Unified cache call is successful");
          // TODO: Change resolve to return AuthResponse object
          resolve(idToken);
        }, (error) => {
          this._silentLogin = false;
          this._logger.error("Error occurred during unified cache ATS");
          this.loginPopupHelper(resolve, reject, scopes, extraQueryParameters);
        });
      }
      // else proceed with login
      else {
        this.loginPopupHelper(resolve, reject, scopes, extraQueryParameters );
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
  private loginPopupHelper( resolve: any , reject: any, scopes: Array<string>, extraQueryParameters?: string) {
    // TODO: why this is needed only for loginpopup
    if (!scopes) {
      scopes = [this.clientId];
    }
    const scope = scopes.join(" ").toLowerCase();

    // Generate a popup window
    // TODO: Refactor this so that openWindow throws an error, loginPopupHelper rejects or resolves based on that action
    const popUpWindow = this.openWindow("about:blank", "_blank", 1, this, resolve, reject);
    if (!popUpWindow) {
      return;
    }

    // Track login progress
    this._loginInProgress = true;

    // Resolve endpoint
    this.authorityInstance.ResolveEndpointsAsync().then(() => {
      const authenticationRequest = new AuthenticationRequestParameters(this.authorityInstance, this.clientId, scopes, ResponseTypes.id_token, this.getRedirectUri(), this._state);

      // set extraQueryParameters
      if (extraQueryParameters) {
        authenticationRequest.extraQueryParameters = extraQueryParameters;
      }

      // Cache the state, nonce, and login request data
      this._cacheStorage.setItem(Constants.loginRequest, window.location.href, this.storeAuthStateInCookie);
      this._cacheStorage.setItem(Constants.loginError, "");
      this._cacheStorage.setItem(Constants.nonceIdToken, authenticationRequest.nonce, this.storeAuthStateInCookie);
      this._cacheStorage.setItem(Constants.msalError, "");
      this._cacheStorage.setItem(Constants.msalErrorDescription, "");

      // cache authorityKey
      const authorityKey = Storage.generateAuthorityKey(authenticationRequest.state);
      this._cacheStorage.setItem(authorityKey, this.authority, this.storeAuthStateInCookie);

      // Build the URL to navigate to in the popup window
      const urlNavigate = authenticationRequest.createNavigateUrl(scopes)  + Constants.response_mode_fragment;
      window.renewStates.push(authenticationRequest.state);
      window.requestType = Constants.login;

      // Register callback to capture results from server
      // TODO: Need to possible rework functionality here
      this.registerCallback(authenticationRequest.state, scope, resolve, reject);

      // Navigate url in popupWindow
      if (popUpWindow) {
        this._logger.infoPii("Navigated Popup window to:" + urlNavigate);
        popUpWindow.location.href = urlNavigate;
      }
    }, () => {
      // Endpoint resolution failure error
      this._logger.info(ErrorCodes.endpointResolutionError + ":" + ErrorDescription.endpointResolutionError);
      this._cacheStorage.setItem(Constants.msalError, ErrorCodes.endpointResolutionError);
      this._cacheStorage.setItem(Constants.msalErrorDescription, ErrorDescription.endpointResolutionError);

      // What is this? Is this the reject that is passed in?? -- REDO this in the subsequent refactor, passing reject is confusing
      if (reject) {
        reject(ErrorCodes.endpointResolutionError + ":" + ErrorDescription.endpointResolutionError);
      }

      // Close the popup window
      if (popUpWindow) {
        popUpWindow.close();
      }
    }).catch((err) => {
      // All catch - when is this executed? Possibly when error is thrown, but not if previous function rejects instead of throwing
      this._logger.warning("could not resolve endpoints");
      reject(err);
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
  // TODO: params to accept AuthRequest object instead
  acquireTokenPopup(scopes: Array<string>): Promise<string>;
  acquireTokenPopup(scopes: Array<string>, authority: string): Promise<string>;
  acquireTokenPopup(scopes: Array<string>, authority: string, user: User): Promise<string>;
  acquireTokenPopup(scopes: Array<string>, authority: string, user: User, extraQueryParameters: string): Promise<string>;
  acquireTokenPopup(scopes: Array<string>, authority?: string, user?: User, extraQueryParameters?: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      // Validate scopes
      // TODO: Replace with new validation pattern
      const isValidScope = this.validateInputScope(scopes);
      if (isValidScope && !Utils.isEmpty(isValidScope)) {
        // TODO: Should reject with custom error
        // TODO: Is this always accessToken?
        reject(ErrorCodes.inputScopesError + Constants.resourceDelimiter + isValidScope);
      }

      if (scopes) {
        scopes = this.filterScopes(scopes);
      }

      const scope = scopes.join(" ").toLowerCase();

      // Get the user object if session exists
      const userObject = user ? user : this.getUser();

      // If already in progress, reject the request
      if (this._acquireTokenInProgress) {
        // TODO: Should reject with custom error
        reject(ErrorCodes.acquireTokenProgressError + Constants.resourceDelimiter + ErrorDescription.acquireTokenProgressError);
        return;
      }

      //if user is not currently logged in and no login_hint is passed
      if (!userObject && !(extraQueryParameters && (extraQueryParameters.indexOf(Constants.login_hint) !== -1))) {
        this._logger.info("User login is required");
        reject(ErrorCodes.userLoginError + Constants.resourceDelimiter + ErrorDescription.userLoginError);
        return;
      }

      // track the acquireToken progress
      this._acquireTokenInProgress = true;

      let authenticationRequest: AuthenticationRequestParameters;
      const acquireTokenAuthority = authority ? AuthorityFactory.CreateInstance(authority, this.validateAuthority) : this.authorityInstance;

      // Open the popup window
      const popUpWindow = this.openWindow("about:blank", "_blank", 1, this, resolve, reject);
      if (!popUpWindow) {
        // TODO: we should be rejecting with an error here
        return;
      }

      acquireTokenAuthority.ResolveEndpointsAsync().then(() => {
        // On fullfillment
        if (Utils.compareObjects(userObject, this.getUser())) {
          if (scopes.indexOf(this.clientId) > -1) {
            authenticationRequest = new AuthenticationRequestParameters(acquireTokenAuthority, this.clientId, scopes, ResponseTypes.id_token, this.getRedirectUri(), this._state);
          }
          else {
            authenticationRequest = new AuthenticationRequestParameters(acquireTokenAuthority, this.clientId, scopes, ResponseTypes.token, this.getRedirectUri(), this._state);
          }
        } else {
          authenticationRequest = new AuthenticationRequestParameters(acquireTokenAuthority, this.clientId, scopes, ResponseTypes.id_token_token, this.getRedirectUri(), this._state);
        }

        // Cache nonce
        // TODO: why is storeAuthStateInCookie not passed here?
        this._cacheStorage.setItem(Constants.nonceIdToken, authenticationRequest.nonce);
        authenticationRequest.state = authenticationRequest.state;

        // Cache acquireTokenUserKey
        const userId = userObject ? userObject.userIdentifier : Constants.no_user;
        const acquireTokenUserKey = Storage.generateAcquireTokenUserKey(userId, authenticationRequest.state);

        this._cacheStorage.setItem(acquireTokenUserKey, JSON.stringify(userObject));

        // Cache authorityKey
        const authorityKey = Storage.generateAuthorityKey(authenticationRequest.state);
        this._cacheStorage.setItem(authorityKey, acquireTokenAuthority.CanonicalAuthority, this.storeAuthStateInCookie);

        // Set the extraQueryParameters
        if (extraQueryParameters) {
          authenticationRequest.extraQueryParameters = extraQueryParameters;
        }

        // Construct the urlNavigate
        let urlNavigate = authenticationRequest.createNavigateUrl(scopes) + Constants.response_mode_fragment;
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
        // TODO: Is this always accessToken?
        this._logger.info(ErrorCodes.endpointResolutionError + ":" + ErrorDescription.endpointResolutionError);
        this._cacheStorage.setItem(Constants.msalError, ErrorCodes.endpointResolutionError);
        this._cacheStorage.setItem(Constants.msalErrorDescription, ErrorDescription.endpointResolutionError);
        // TODO: Should reject with custom error here
        if (reject) {
          reject(ErrorCodes.endpointResolutionError + Constants.resourceDelimiter + ErrorDescription.endpointResolutionError);
        }
        if (popUpWindow) {
            popUpWindow.close();
        }
      }).catch((err) => {
        // TODO: Should reject with custom error here
        this._logger.warning("could not resolve endpoints");
        reject(err);
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
    const popupWindow = this.openPopup(urlNavigate, title, Constants.popUpWidth, Constants.popUpHeight);

    // if popupWindow is not valid, throw error
    if (popupWindow == null) {
      instance._loginInProgress = false;
      instance._acquireTokenInProgress = false;
      this._logger.info(ErrorCodes.popUpWindowError + ":" + ErrorDescription.popUpWindowError);
      this._cacheStorage.setItem(Constants.msalError, ErrorCodes.popUpWindowError);
      this._cacheStorage.setItem(Constants.msalErrorDescription, ErrorDescription.popUpWindowError);
      if (reject) {
        // TODO: Throw custom error here
        // TODO: Figure out some way to pass tokenType
        reject(ErrorCodes.popUpWindowError + Constants.resourceDelimiter + ErrorDescription.popUpWindowError);
      }
      return null;
    }

    // Push popup window handle onto stack for tracking
    window.openedWindows.push(popupWindow);

    const pollTimer = window.setInterval(() => {
      // If popup closed or login in progress, cancel login
      if (popupWindow && popupWindow.closed && instance._loginInProgress) {
        if (reject) {
          // TODO: Reject with custom error here
          // TODO: Figure out some way to pass tokenType
          reject(ErrorCodes.userCancelledError + Constants.resourceDelimiter + ErrorDescription.userCancelledError);
        }
        window.clearInterval(pollTimer);
        if (this._isAngular) {
            this.broadcast("msal:popUpClosed", ErrorCodes.userCancelledError + Constants.resourceDelimiter + ErrorDescription.userCancelledError);
            return;
        }
        instance._loginInProgress = false;
        instance._acquireTokenInProgress = false;
      }

      try {
        const popUpWindowLocation = popupWindow.location;

        // If the popup hash changes, close the popup window
        if (popUpWindowLocation.href.indexOf(this.getRedirectUri()) !== -1) {
          window.clearInterval(pollTimer);
          instance._loginInProgress = false;
          instance._acquireTokenInProgress = false;
          this._logger.info("Closing popup window");
          // TODO: Why are we only closing for angular?
          if (this._isAngular) {
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
      if (popupWindow.focus) {
        popupWindow.focus();
      }

      return popupWindow;
    } catch (e) {
      // TODO: Throw a custom error if opening popup fails
      this._logger.error("error opening popup " + e.message);
      this._loginInProgress = false;
      this._acquireTokenInProgress = false;
      return null;
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
  // TODO: params to accept AuthRequest object instead
  @resolveTokenOnlyIfOutOfIframe
  acquireTokenSilent(scopes: Array<string>, authority?: string, user?: User, extraQueryParameters?: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      // Validate scopes
      // TODO: Replace with new validation pattern
      const isValidScope = this.validateInputScope(scopes);
      if (isValidScope && !Utils.isEmpty(isValidScope)) {
        // TODO: Reject with custom error here
        // TODO: Is this always accessToken?
        reject(ErrorCodes.inputScopesError + "|" + isValidScope);
        return null;
      } else {
        // TODO: Remove this from the else block, it is unnecessary
        if (scopes) {
          scopes = this.filterScopes(scopes);
        }

        const scope = scopes.join(" ").toLowerCase();
        const userObject = user ? user : this.getUser();
        const adalIdToken = this._cacheStorage.getItem(Constants.adalIdToken);
        //if user is not currently logged in and no login_hint/sid is passed as an extraQueryParamater
        if (!userObject && Utils.checkSSO(extraQueryParameters) && Utils.isEmpty(adalIdToken) ) {
          this._logger.info("User login is required");
          // TODO: Reject with custom error here
          reject(ErrorCodes.userLoginError + Constants.resourceDelimiter + ErrorDescription.userLoginError);
          return null;
        }
        //if user didn't passes the login_hint and adal's idtoken is present and no userobject, use the login_hint from adal's idToken
        else if (!userObject && !Utils.isEmpty(adalIdToken)) {
          const idTokenObject = Utils.extractIdToken(adalIdToken);
          console.log("ADAL's idToken exists. Extracting login information from ADAL's idToken ");
          extraQueryParameters = Utils.constructUnifiedCacheExtraQueryParameter(idTokenObject, extraQueryParameters);
        }

        let authenticationRequest: AuthenticationRequestParameters;
        if (Utils.compareObjects(userObject, this.getUser())) {
          if (scopes.indexOf(this.clientId) > -1) {
            authenticationRequest = new AuthenticationRequestParameters(AuthorityFactory.CreateInstance(authority, this.validateAuthority), this.clientId, scopes, ResponseTypes.id_token, this.getRedirectUri(), this._state);
          }
          else {
              authenticationRequest = new AuthenticationRequestParameters(AuthorityFactory.CreateInstance(authority, this.validateAuthority), this.clientId, scopes, ResponseTypes.token, this.getRedirectUri(), this._state);
          }
        } else {
            if (scopes.indexOf(this.clientId) > -1) {
                authenticationRequest = new AuthenticationRequestParameters(AuthorityFactory.CreateInstance(authority, this.validateAuthority), this.clientId, scopes, ResponseTypes.id_token, this.getRedirectUri(), this._state);
            }
            else {
                authenticationRequest = new AuthenticationRequestParameters(AuthorityFactory.CreateInstance(authority, this.validateAuthority), this.clientId, scopes, ResponseTypes.id_token_token, this.getRedirectUri(), this._state);
            }
        }

        const cacheResult = this.getCachedToken(authenticationRequest, userObject);
        // resolve/reject based on cacheResult
        if (cacheResult) {
          if (cacheResult.token) {
            this._logger.info("Token is already in cache for scope:" + scope);
            resolve(cacheResult.token);
            return null;
          }
          else if (cacheResult.errorDesc || cacheResult.error) {
            this._logger.infoPii(cacheResult.errorDesc + ":" + cacheResult.error);
            reject(cacheResult.errorDesc + Constants.resourceDelimiter + cacheResult.error);
            return null;
          }
        }
        // else proceed with login
        else {
          this._logger.verbose("Token is not in cache for scope:" + scope);
        }

        // Cache result can return null if cache is empty. In that case, set authority to default value if no authority is passed to the api.
        // TODO: Do we need to check if cache result is empty before calling this?
        if (!authenticationRequest.authorityInstance) {//Cache result can return null if cache is empty. In that case, set authority to default value if no authority is passed to the api.
            authenticationRequest.authorityInstance = authority ? AuthorityFactory.CreateInstance(authority, this.validateAuthority) : this.authorityInstance;
        }
        // cache miss
        return authenticationRequest.authorityInstance.ResolveEndpointsAsync()
        .then(() => {
          // refresh attept with iframe
          // Already renewing for this scope, callback when we get the token.
          if (window.activeRenewals[scope]) {
            this._logger.verbose("Renew token for scope: " + scope + " is in progress. Registering callback");
            // Active renewals contains the state for each renewal.
            this.registerCallback(window.activeRenewals[scope], scope, resolve, reject);
          }
          else {
            if (scopes && scopes.indexOf(this.clientId) > -1 && scopes.length === 1) {
              // App uses idToken to send to api endpoints
              // Default scope is tracked as clientId to store this token
              this._logger.verbose("renewing idToken");
              this.renewIdToken(scopes, resolve, reject, userObject, authenticationRequest, extraQueryParameters);
            } else {
              // renew access token
              this._logger.verbose("renewing accesstoken");
              this.renewToken(scopes, resolve, reject, userObject, authenticationRequest, extraQueryParameters);
            }
          }
        }).catch((err) => {
          this._logger.warning("could not resolve endpoints");
          reject(err);
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
    this._logger.verbose("Set loading state to pending for: " + scope + ":" + expectedState);
    this._cacheStorage.setItem(Constants.renewStatus + expectedState, Constants.tokenRenewStatusInProgress);
    this.loadFrame(urlNavigate, frameName);
    setTimeout(() => {
      if (this._cacheStorage.getItem(Constants.renewStatus + expectedState) === Constants.tokenRenewStatusInProgress) {
        // fail the iframe session if it"s in pending state
        this._logger.verbose("Loading frame has timed out after: " + (this.loadFrameTimeout / 1000) + " seconds for scope " + scope + ":" + expectedState);
        // Error after timeout
        if (expectedState && window.callBackMappedToRenewStates[expectedState]) {
          window.callBackMappedToRenewStates[expectedState]("Token renewal operation failed due to timeout", null, "Token Renewal Failed", Constants.accessToken);
        }

        this._cacheStorage.setItem(Constants.renewStatus + expectedState, Constants.tokenRenewStatusCancelled);
      }
    }, this.loadFrameTimeout);
  }

  /**
   * Loads iframe with authorization endpoint URL
   * @ignore
   * @hidden
   */
  private loadFrame(urlNavigate: string, frameName: string): void {
    // This trick overcomes iframe navigation in IE
    // IE does not load the page consistently in iframe
    this._logger.info("LoadFrame: " + frameName);
    const frameCheck = frameName;

    // TODO: VSTS AI, work on either removing the 500ms timeout or making it optional for IE??
    setTimeout(() => {
      const frameHandle = this.addAdalFrame(frameCheck);
      if (frameHandle.src === "" || frameHandle.src === "about:blank") {
        frameHandle.src = urlNavigate;
        this._logger.infoPii("Frame Name : " + frameName + " Navigated to: " + urlNavigate);
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

    this._logger.info("Add msal frame to document:" + iframeId);
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
  private addHintParameters(urlNavigate: string, user: User): string {
    const userObject = user ? user : this.getUser();
    if (userObject) {
        const decodedClientInfo = userObject.userIdentifier.split(".");
        const uid = Utils.base64DecodeStringUrlSafe(decodedClientInfo[0]);
        const utid = Utils.base64DecodeStringUrlSafe(decodedClientInfo[1]);

        // sid - first preference to identify a session
        if (userObject.sid  && urlNavigate.indexOf(Constants.prompt_none) !== -1) {
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
                urlNavigate += "&" +  Constants.domain_hint + "=" + encodeURIComponent(Constants.consumers);
            } else {
                urlNavigate += "&" + Constants.domain_hint + "=" + encodeURIComponent(Constants.organizations);
            }
        }

    }

    return urlNavigate;
  }

  //#endregion

  //#region General Helpers

  /**
   * Used to redirect the browser to the STS authorization endpoint
   * @param {string} urlNavigate - URL of the authorization endpoint
   * @hidden
   */
  private promptUser(urlNavigate: string) {
    // Navigate if valid URL
    if (urlNavigate && !Utils.isEmpty(urlNavigate)) {
      this._logger.infoPii("Navigate to:" + urlNavigate);
      window.location.replace(urlNavigate);
    }

    // TODO: Log error on failure - we should be erroring out, unexpected library error
    else {
      this._logger.info("Navigate url is empty");
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
    if (!window.callBacksMappedToRenewStates[expectedState]) {
        window.callBacksMappedToRenewStates[expectedState] = [];
    }
    // indexing on the current state, push the callback params to callbacks mapped
    window.callBacksMappedToRenewStates[expectedState].push({ resolve: resolve, reject: reject });

    // Store the server esponse in the current window??
    if (!window.callBackMappedToRenewStates[expectedState]) {
      window.callBackMappedToRenewStates[expectedState] =
      (errorDesc: string, token: string, error: string, tokenType: string) => {
        // reset active renewals
        window.activeRenewals[scope] = null;

        // for all callBacksMappedtoRenewStates for a given 'state' - call the reject/resolve with error/token respectively
        // TODO: understand where the error, token are coming from
        for (let i = 0; i < window.callBacksMappedToRenewStates[expectedState].length; ++i) {
          try {
            if (errorDesc || error) {
                window.callBacksMappedToRenewStates[expectedState][i].reject(errorDesc + Constants.resourceDelimiter + error);
            }
            else if (token) {
                window.callBacksMappedToRenewStates[expectedState][i].resolve(token);
            }
          } catch (e) {
            this._logger.warning(e);
          }
        }

        // reset
        window.callBacksMappedToRenewStates[expectedState] = null;
        window.callBackMappedToRenewStates[expectedState] = null;
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
    this._user = null;
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
    const accessTokenItems = this._cacheStorage.getAllAccessTokens(Constants.clientId, Constants.userIdentifier);
    for (let i = 0; i < accessTokenItems.length; i++) {
      this._cacheStorage.removeItem(JSON.stringify(accessTokenItems[i].key));
    }
    this._cacheStorage.resetCacheItems();
    this._cacheStorage.clearCookie();
  }

  /**
   * Clear a given access token from the cache.
   *
   * @param accessToken
   */
  // TODO: Consider moving this to Storage.ts
  protected clearCacheForScope(accessToken: string) {
    const accessTokenItems = this._cacheStorage.getAllAccessTokens(Constants.clientId, Constants.userIdentifier);
    for (let i = 0; i < accessTokenItems.length; i++) {
        let token = accessTokenItems[i];
        if (token.value.accessToken === accessToken) {
            this._cacheStorage.removeItem(JSON.stringify(token.key));
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
    this._logger.info("Processing the callback from redirect response");

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
    this._cacheStorage.removeItem(Constants.urlHash);

    try {
        if (this._tokenReceivedCallback) {
          // Clear the cookie in the hash
          this._cacheStorage.clearCookie();

          // Trigger callback
          // TODO: Refactor to new callback pattern
          this._tokenReceivedCallback.call(this, errorDesc, token, error, tokenType,  this.getUserState(this._cacheStorage.getItem(Constants.stateLogin, this.storeAuthStateInCookie)));
        }

    } catch (err) {
      // TODO: Check if we should be throwing an error here
      this._logger.error("Error occurred in token received callback function: " + err);
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
    let tokenReceivedCallback: (errorDesc: string, token: string, error: string, tokenType: string) => void = null;
    let tokenType: string;

    self._logger.info("Returned from redirect url");
    // If parent window is the msal instance which opened the current window
    if (window.parent !== window && window.parent.msal) {
        tokenReceivedCallback = window.parent.callBackMappedToRenewStates[requestInfo.stateResponse];
    }
    // Current window is window opener
    else if (isWindowOpenerMsal) {
        tokenReceivedCallback = window.opener.callBackMappedToRenewStates[requestInfo.stateResponse];
    }
    // Other cases
    else {
      // if set to navigate to loginRequest page post login
      if (self._navigateToLoginRequestUrl) {
        tokenReceivedCallback = null;
        self._cacheStorage.setItem(Constants.urlHash, hash);
        if (window.parent === window && !isPopup) {
          window.location.href = self._cacheStorage.getItem(Constants.loginRequest, this.storeAuthStateInCookie);
        }
        return;
      }
      // Close current window??
      else {
        tokenReceivedCallback = self._tokenReceivedCallback;
        window.location.hash = "";
      }
    }

    // Save token from hash (TODO: Possibly refactor to return AuthResponse)
    self.saveTokenFromHash(requestInfo);

    // Acquire token request
    if ((requestInfo.requestType === Constants.renewToken) && window.parent) {
      // Log whether silent or interactive
      if (window.parent !== window) {
        self._logger.verbose("Window is in iframe, acquiring token silently");
      } else {
        self._logger.verbose("acquiring token interactive in progress");
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
      // TODO: Change this so that it sends back response object or error object based on what is returned from getRequestInfo()
      if (tokenReceivedCallback) {
        //We should only send the stae back to the developer if it matches with what we received from the server
        if (requestInfo.stateMatch) {
          tokenReceivedCallback.call(self, errorDesc, token, error, tokenType, this.getUserState(requestInfo.stateResponse));
        }
        else {
          tokenReceivedCallback.call(self, errorDesc, token, error, tokenType, null);
        }
      }
    } catch (err) {
      // TODO: Should we throw an error here?
      self._logger.error("Error occurred in token received callback function: " + err);
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
        if (stateResponse === this._cacheStorage.getItem(Constants.stateLogin, this.storeAuthStateInCookie) || stateResponse === this._silentAuthenticationState) { // loginRedirect
          tokenResponse.requestType = Constants.login;
          tokenResponse.stateMatch = true;
          return tokenResponse;
        }
        // acquireTokenRedirect
        else if (stateResponse === this._cacheStorage.getItem(Constants.stateAcquireToken, this.storeAuthStateInCookie)) { //acquireTokenRedirect
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
    const tokenCacheItems = this._cacheStorage.getAllAccessTokens(this.clientId, user ? user.userIdentifier : null);

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
        authenticationRequest.authorityInstance = AuthorityFactory.CreateInstance(accessTokenCacheItem.key.authority, this.validateAuthority);
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

        authenticationRequest.authorityInstance = AuthorityFactory.CreateInstance(authorityList[0], this.validateAuthority);
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
      const offset = this._clockSkew || 300;
      if (expired && (expired > Utils.now() + offset)) {
        return {
          errorDesc: null,
          token: accessTokenCacheItem.value.accessToken,
          error: null
        };
      } else {
        this._cacheStorage.removeItem(JSON.stringify(filteredItems[0].key));
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
    const adalIdToken = this._cacheStorage.getItem(Constants.adalIdToken);
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
    this._logger.verbose("renewToken is called for scope:" + scope);
    const frameHandle = this.addAdalFrame("msalRenewFrame" + scope);
    if (extraQueryParameters) {
      authenticationRequest.extraQueryParameters = extraQueryParameters;
    }

    // Cache acquireTokenUserKey
    const userId = user ? user.userIdentifier : Constants.no_user;
    const acquireTokenUserKey = Storage.generateAcquireTokenUserKey(userId, authenticationRequest.state);

    this._cacheStorage.setItem(acquireTokenUserKey, JSON.stringify(user));

    // Cache authorityKey
    const authorityKey = Storage.generateAuthorityKey(authenticationRequest.state);
    this._cacheStorage.setItem(authorityKey, authenticationRequest.authority);

    // renew happens in iframe, so it keeps javascript context
    this._cacheStorage.setItem(Constants.nonceIdToken, authenticationRequest.nonce);
    this._logger.verbose("Renew token Expected state: " + authenticationRequest.state);

    // Build urlNavigate with "prompt=none" and navigate to URL in hidden iFrame
    let urlNavigate = Utils.urlRemoveQueryStringParameter(authenticationRequest.createNavigateUrl(scopes), Constants.prompt) + Constants.prompt_none;
    urlNavigate = this.addHintParameters(urlNavigate, user);
    window.renewStates.push(authenticationRequest.state);
    window.requestType = Constants.renewToken;
    this.registerCallback(authenticationRequest.state, scope, resolve, reject);
    this._logger.infoPii("Navigate to:" + urlNavigate);
    frameHandle.src = "about:blank";
    this.loadIframeTimeout(urlNavigate, "msalRenewFrame" + scope, scope);
  }

  /**
   * Renews idtoken for app"s own backend when clientId is passed as a single scope in the scopes array.
   * @ignore
   * @hidden
   */
  private renewIdToken(scopes: Array<string>, resolve: Function, reject: Function, user: User, authenticationRequest: AuthenticationRequestParameters, extraQueryParameters?: string): void {

    this._logger.info("renewidToken is called");
    const frameHandle = this.addAdalFrame("msalIdTokenFrame");

    // Populate extraQueryParameters in the request sent to the server
    if (extraQueryParameters) {
      authenticationRequest.extraQueryParameters = extraQueryParameters;
    }

    // Cache acquireTokenUserKey
    const userId = user ? user.userIdentifier : Constants.no_user;
    const acquireTokenUserKey = Storage.generateAcquireTokenUserKey(userId, authenticationRequest.state);

    this._cacheStorage.setItem(acquireTokenUserKey, JSON.stringify(user));

    // Cache authorityKey
    const authorityKey = Storage.generateAuthorityKey(authenticationRequest.state);
    this._cacheStorage.setItem(authorityKey, authenticationRequest.authority);

    // Cache nonce
    this._cacheStorage.setItem(Constants.nonceIdToken, authenticationRequest.nonce);

    this._logger.verbose("Renew Idtoken Expected state: " + authenticationRequest.state);

    // Build urlNavigate with "prompt=none" and navigate to URL in hidden iFrame
    let urlNavigate = Utils.urlRemoveQueryStringParameter(authenticationRequest.createNavigateUrl(scopes), Constants.prompt) + Constants.prompt_none;
    urlNavigate = this.addHintParameters(urlNavigate, user);
    if (this._silentLogin) {
        window.requestType = Constants.login;
        this._silentAuthenticationState = authenticationRequest.state;
    } else {
        window.requestType = Constants.renewToken;
        window.renewStates.push(authenticationRequest.state);
    }

    // note: scope here is clientId
    this.registerCallback(authenticationRequest.state, this.clientId, resolve, reject);
    this._logger.infoPii("Navigate to:" + urlNavigate);
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
      const accessTokenCacheItems = this._cacheStorage.getAllAccessTokens(this.clientId, authority);
      for (let i = 0; i < accessTokenCacheItems.length; i++) {
        const accessTokenCacheItem = accessTokenCacheItems[i];
        if (accessTokenCacheItem.key.userIdentifier === user.userIdentifier) {
          const cachedScopes = accessTokenCacheItem.key.scopes.split(" ");
          if (Utils.isIntersectingScopes(cachedScopes, consentedScopes)) {
            this._cacheStorage.removeItem(JSON.stringify(accessTokenCacheItem.key));
          }
        }
      }

      // Generate and cache accessTokenKey and accessTokenValue
      const accessTokenKey = new AccessTokenKey(authority, this.clientId, scope, clientObj.uid, clientObj.utid);
      const accessTokenValue = new AccessTokenValue(tokenResponse.parameters[Constants.accessToken], idToken.rawIdToken, Utils.expiresIn(tokenResponse.parameters[Constants.expiresIn]).toString(), clientInfo);
      this._cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
    }
    // if the response does not contain "scope" - scope is usually client_id and the token will be id_token
    else {
      scope = this.clientId;

      // Generate and cache accessTokenKey and accessTokenValue
      const accessTokenKey = new AccessTokenKey(authority, this.clientId, scope, clientObj.uid, clientObj.utid);
      // TODO: since there is no access_token, this is also set to id_token?
      const accessTokenValue = new AccessTokenValue(tokenResponse.parameters[Constants.idToken], tokenResponse.parameters[Constants.idToken], idToken.expiration, clientInfo);
      this._cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
    }
  }

  /**
   * Saves token or error received in the response from AAD in the cache. In case of id_token, it also creates the user object.
   * @ignore
   * @hidden
   */
  // TODO: Break this function up - either into utils or token specific --- too long to be readable
  protected saveTokenFromHash(tokenResponse: TokenResponse): void {

    this._logger.info("State status:" + tokenResponse.stateMatch + "; Request type:" + tokenResponse.requestType);
    this._cacheStorage.setItem(Constants.msalError, "");
    this._cacheStorage.setItem(Constants.msalErrorDescription, "");

    let authorityKey: string = "";
    let acquireTokenUserKey: string = "";

    // If server returns an error
    if (tokenResponse.parameters.hasOwnProperty(Constants.errorDescription) || tokenResponse.parameters.hasOwnProperty(Constants.error)) {
      this._logger.infoPii("Error :" + tokenResponse.parameters[Constants.error] + "; Error description:" + tokenResponse.parameters[Constants.errorDescription]);
      this._cacheStorage.setItem(Constants.msalError, tokenResponse.parameters["error"]);
      this._cacheStorage.setItem(Constants.msalErrorDescription, tokenResponse.parameters[Constants.errorDescription]);

      // login
      if (tokenResponse.requestType === Constants.login) {
        this._loginInProgress = false;
        this._cacheStorage.setItem(Constants.loginError, tokenResponse.parameters[Constants.errorDescription] + ":" + tokenResponse.parameters[Constants.error]);
        authorityKey = Storage.generateAuthorityKey(tokenResponse.stateResponse);
      }

      // acquireToken
      if (tokenResponse.requestType === Constants.renewToken) {
        this._acquireTokenInProgress = false;
        authorityKey = Storage.generateAuthorityKey(tokenResponse.stateResponse);
        var userKey = this.getUser() !== null ? this.getUser().userIdentifier : "";
        acquireTokenUserKey = Storage.generateAcquireTokenUserKey(userKey, tokenResponse.stateResponse);
      }
    }
    // If the server returns "Success"
    else {
      // Verify the state from redirect and record tokens to storage if exists
      if (tokenResponse.stateMatch) {
        this._logger.info("State is right");
        if (tokenResponse.parameters.hasOwnProperty(Constants.sessionState)) {
            this._cacheStorage.setItem(Constants.msalSessionState, tokenResponse.parameters[Constants.sessionState]);
        }

        let idToken: IdToken;
        let clientInfo: string = "";

        // Process access_token
        if (tokenResponse.parameters.hasOwnProperty(Constants.accessToken)) {
          this._logger.info("Fragment has access token");
          this._acquireTokenInProgress = false;
          let user: User;

          // retrieve the id_token from response if present :
          // TODO: Is this the case of id_token_token??
          if (tokenResponse.parameters.hasOwnProperty(Constants.idToken)) {
            idToken = new IdToken(tokenResponse.parameters[Constants.idToken]);
          } else {
            idToken = new IdToken(this._cacheStorage.getItem(Constants.idTokenKey));
          }

          // retrieve the authority from cache and replace with tenantID
          const authorityKey = Storage.generateAuthorityKey(tokenResponse.stateResponse);
          let authority: string = this._cacheStorage.getItem(authorityKey, this.storeAuthStateInCookie);
          if (!Utils.isEmpty(authority)) {
            authority = Utils.replaceFirstPath(authority, idToken.tenantId);
          }

          // retrieve client_info - if it is not found, generate the uid and utid from idToken
          if (tokenResponse.parameters.hasOwnProperty(Constants.clientInfo)) {
            clientInfo = tokenResponse.parameters[Constants.clientInfo];
            user = User.createUser(idToken, new ClientInfo(clientInfo));
          } else {
            this._logger.warning("ClientInfo not received in the response from AAD");
            user = User.createUser(idToken, new ClientInfo(clientInfo));
          }

          const acquireTokenUserKey = Storage.generateAcquireTokenUserKey(user.userIdentifier, tokenResponse.stateResponse);
          const acquireTokenUserKey_nouser = Storage.generateAcquireTokenUserKey(Constants.no_user, tokenResponse.stateResponse);

          let cachedUser: string = this._cacheStorage.getItem(acquireTokenUserKey);
          let acquireTokenUser: User;

          // Check with the user in the Cache
          if (!Utils.isEmpty(cachedUser)) {
            acquireTokenUser = JSON.parse(cachedUser);
            if (user && acquireTokenUser && Utils.compareObjects(user, acquireTokenUser)) {
              this.saveAccessToken(authority, tokenResponse, user, clientInfo, idToken);
              this._logger.info("The user object received in the response is the same as the one passed in the acquireToken request");
            } else {
              this._logger.warning(
                "The user object created from the response is not the same as the one passed in the acquireToken request");
            }
          } else if (!Utils.isEmpty(this._cacheStorage.getItem(acquireTokenUserKey_nouser))) {
            this.saveAccessToken(authority, tokenResponse, user, clientInfo, idToken);
          }
        }

        // Process id_token
        if (tokenResponse.parameters.hasOwnProperty(Constants.idToken)) {
            this._logger.info("Fragment has id token");
            // login no longer in progress
            this._loginInProgress = false;
            idToken = new IdToken(tokenResponse.parameters[Constants.idToken]);
            if (tokenResponse.parameters.hasOwnProperty(Constants.clientInfo)) {
              clientInfo = tokenResponse.parameters[Constants.clientInfo];
            } else {
              this._logger.warning("ClientInfo not received in the response from AAD");
            }

            authorityKey = Storage.generateAuthorityKey(tokenResponse.stateResponse);
            let authority: string = this._cacheStorage.getItem(authorityKey, this.storeAuthStateInCookie);
            if (!Utils.isEmpty(authority)) {
              authority = Utils.replaceFirstPath(authority, idToken.tenantId);
            }

            this._user = User.createUser(idToken, new ClientInfo(clientInfo));

            if (idToken && idToken.nonce) {
              // check nonce integrity if idToken has nonce - throw an error if not matched
              if (idToken.nonce !== this._cacheStorage.getItem(Constants.nonceIdToken, this.storeAuthStateInCookie)) {
                this._user = null;
                // TODO: optimize this - may be combine if it is a string in both cases
                this._cacheStorage.setItem(Constants.loginError, "Nonce Mismatch. Expected Nonce: " + this._cacheStorage.getItem(Constants.nonceIdToken, this.storeAuthStateInCookie) + "," + "Actual Nonce: " + idToken.nonce);
                this._logger.error("Nonce Mismatch.Expected Nonce: " + this._cacheStorage.getItem(Constants.nonceIdToken, this.storeAuthStateInCookie) + "," + "Actual Nonce: " + idToken.nonce);
              }
              // Save the token
              else {
                this._cacheStorage.setItem(Constants.idTokenKey, tokenResponse.parameters[Constants.idToken]);
                this._cacheStorage.setItem(Constants.msalClientInfo, clientInfo);

                // Save idToken as access token for app itself
                this.saveAccessToken(authority, tokenResponse, this._user, clientInfo, idToken);
              }
            } else {
              // TODO: avoid repeated strings - will this be optimized with error handling?
              authorityKey = tokenResponse.stateResponse;
              acquireTokenUserKey = tokenResponse.stateResponse;
              this._logger.error("Invalid id_token received in the response");
              tokenResponse.parameters["error"] = "invalid idToken";
              tokenResponse.parameters["error_description"] = "Invalid idToken. idToken: " + tokenResponse.parameters[Constants.idToken];
              this._cacheStorage.setItem(Constants.msalError, "invalid idToken");
              this._cacheStorage.setItem(Constants.msalErrorDescription, "Invalid idToken. idToken: " + tokenResponse.parameters[Constants.idToken]);
            }
        }
      }
      // State mismatch - unexpected/invalid state
      else {
        authorityKey = tokenResponse.stateResponse;
        acquireTokenUserKey = tokenResponse.stateResponse;
        this._logger.error("State Mismatch.Expected State: " + this._cacheStorage.getItem(Constants.stateLogin, this.storeAuthStateInCookie) + "," + "Actual State: " + tokenResponse.stateResponse);
        // TODO: avoid repeated strings - will this be optimized with error handling?
        tokenResponse.parameters["error"] = "Invalid_state";
        tokenResponse.parameters["error_description"] = "Invalid_state. state: " + tokenResponse.stateResponse;
        this._cacheStorage.setItem(Constants.msalError, "Invalid_state");
        this._cacheStorage.setItem(Constants.msalErrorDescription, "Invalid_state. state: " + tokenResponse.stateResponse);
      }
    }
    this._cacheStorage.setItem(Constants.renewStatus + tokenResponse.stateResponse, Constants.tokenRenewStatusCompleted);
    this._cacheStorage.removeAcquireTokenEntries(authorityKey, acquireTokenUserKey);
    // this is required if navigateToLoginRequestUrl=false
    if (this.storeAuthStateInCookie) {
      this._cacheStorage.setItemCookie(authorityKey, "", -1);
      this._cacheStorage.clearCookie();
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
    if (this._user) {
      return this._user;
    }

    // frame is used to get idToken and populate the user for the given session
    const rawIdToken = this._cacheStorage.getItem(Constants.idTokenKey);
    const rawClientInfo = this._cacheStorage.getItem(Constants.msalClientInfo);

    if (!Utils.isEmpty(rawIdToken) && !Utils.isEmpty(rawClientInfo)) {
      const idToken = new IdToken(rawIdToken);
      const clientInfo = new ClientInfo(rawClientInfo);
      this._user = User.createUser(idToken, clientInfo);
      return this._user;
    }

    // if login not yet done, return null
    // TODO: DEFER: Should we throw error instead of returning null? This is where folks not using the pattern keep looping!!
    // we need more clarity to make this change
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
    const accessTokenCacheItems = this._cacheStorage.getAllAccessTokens(Constants.clientId, Constants.userIdentifier);
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
   * @ignore
   * @hidden
   */
  // TODO: Check if this can be combined with filterScopes()
  private validateInputScope(scopes: Array<string>): string {
    // Check that scopes is not an empty array
    if (!scopes || scopes.length < 1) {
      return "Scopes cannot be passed as an empty array";
    }

    // Check that scopes is an array object
    if (!Array.isArray(scopes)) {
      throw new Error("API does not accept non-array scopes");
    }

    // Check that clientId is passed as single scope
    if (scopes.indexOf(this.clientId) > -1) {
      if (scopes.length > 1) {
        return "ClientId can only be provided as a single scope";
      }
    }
    return "";
  }

  /**
  * Used to remove openid and profile from the list of scopes passed by the developer.These scopes are added by default
  * @hidden
  */
  // TODO: Check if this can be combined with validateInputScope()
  private filterScopes(scopes: Array<string>): Array<string> {
    scopes = scopes.filter(function (element) {
      return element !== "openid";
    });

    scopes = scopes.filter(function (element) {
      return element !== "profile";
    });

    return scopes;
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
    let authenticationRequest: AuthenticationRequestParameters;
    const newAuthority = this.authorityInstance ? this.authorityInstance : AuthorityFactory.CreateInstance(this.authority, this.validateAuthority);

    // Construct AuthenticationRequest based on response type
    if (Utils.compareObjects(userObject, this.getUser())) {
      if (scopes.indexOf(this.clientId) > -1) {
        authenticationRequest = new AuthenticationRequestParameters(newAuthority, this.clientId, scopes, ResponseTypes.id_token, this.getRedirectUri(), this._state);
      }
      else {
        authenticationRequest = new AuthenticationRequestParameters(newAuthority, this.clientId, scopes, ResponseTypes.token, this.getRedirectUri(), this._state);
      }
    } else {
      authenticationRequest = new AuthenticationRequestParameters(newAuthority, this.clientId, scopes, ResponseTypes.id_token_token, this.getRedirectUri(), this._state);
    }

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
    if (this._unprotectedResources.length > 0) {
        for (let i = 0; i < this._unprotectedResources.length; i++) {
            if (endpoint.indexOf(this._unprotectedResources[i]) > -1) {
                return null;
            }
        }
    }

    // process all protected resources and send the matched one
    if (this._protectedResourceMap.size > 0) {
        for (let key of Array.from(this._protectedResourceMap.keys())) {
            // configEndpoint is like /api/Todo requested endpoint can be /api/Todo/1
            if (endpoint.indexOf(key) > -1) {
                return this._protectedResourceMap.get(key);
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
    const pendingCallback = this._cacheStorage.getItem(Constants.urlHash);
    if (pendingCallback) {
        return true;
    }
    return this._loginInProgress;
  }

  /**
   * @param loginInProgress
   */
  protected setloginInProgress(loginInProgress : boolean) {
    this._loginInProgress = loginInProgress;
  }

  /**
   * returns the status of acquireTokenInProgress
   */
  protected getAcquireTokenInProgress(): boolean {
      return this._acquireTokenInProgress;
  }

  /**
   * @param acquireTokenInProgress
   */
  protected setAcquireTokenInProgress(acquireTokenInProgress : boolean) {
      this._acquireTokenInProgress = acquireTokenInProgress;
  }

  /**
   * returns the logger handle
   */
  protected getLogger() {
      return this._logger;
  }

  //#endregion

  //#region Getters and Setters

  /**
   * Used to get the redirect uri. Evaluates redirectUri if its a function, otherwise simply returns its value.
   * @ignore
   * @hidden
   */
  private getRedirectUri(): string {
    if (typeof this._redirectUri === "function") {
      return this._redirectUri();
    }
    return this._redirectUri;
  }

  /**
   * Used to get the post logout redirect uri. Evaluates postLogoutredirectUri if its a function, otherwise simply returns its value.
   * @ignore
   * @hidden
   */
  private getPostLogoutRedirectUri(): string {
    if (typeof this._postLogoutredirectUri === "function") {
      return this._postLogoutredirectUri();
    }
    return this._postLogoutredirectUri;
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

 //#endregion
}
