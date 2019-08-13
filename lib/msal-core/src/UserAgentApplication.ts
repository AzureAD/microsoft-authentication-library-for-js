// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { AccessTokenCacheItem } from "./AccessTokenCacheItem";
import { AccessTokenKey } from "./AccessTokenKey";
import { AccessTokenValue } from "./AccessTokenValue";
import { ServerRequestParameters } from "./ServerRequestParameters";
import { Authority } from "./Authority";
import { ClientInfo } from "./ClientInfo";
import { Constants, SSOTypes, PromptState, BlacklistedEQParams, InteractionType, libraryVersion } from "./utils/Constants";
import { IdToken } from "./IdToken";
import { Logger } from "./Logger";
import { Storage } from "./Storage";
import { Account } from "./Account";
import { ScopeSet } from "./ScopeSet";
import { StringUtils } from "./utils/StringUtils";
import { CryptoUtils } from "./utils/CryptoUtils";
import { TokenUtils } from "./utils/TokenUtils";
import { TimeUtils } from "./utils/TimeUtils";
import { UrlUtils } from "./utils/UrlUtils";
import { ResponseUtils } from "./utils/ResponseUtils";
import { AuthorityFactory } from "./AuthorityFactory";
import { Configuration, buildConfiguration, TelemetryOptions } from "./Configuration";
import { AuthenticationParameters, validateClaimsRequest } from "./AuthenticationParameters";
import { ClientConfigurationError } from "./error/ClientConfigurationError";
import { AuthError } from "./error/AuthError";
import { ClientAuthError, ClientAuthErrorMessage } from "./error/ClientAuthError";
import { ServerError } from "./error/ServerError";
import { InteractionRequiredAuthError } from "./error/InteractionRequiredAuthError";
import { AuthResponse, buildResponseStateOnly } from "./AuthResponse";
import TelemetryManager from "./telemetry/TelemetryManager";
import { TelemetryPlatform, TelemetryConfig } from './telemetry/TelemetryTypes';


 // default authority
const DEFAULT_AUTHORITY = "https://login.microsoftonline.com/common";

/**
 * Interface to handle iFrame generation, Popup Window creation and redirect handling
 */
declare global {
    interface Window {
        msal: Object;
        CustomEvent: CustomEvent;
        Event: Event;
        activeRenewals: {};
        renewStates: Array<string>;
        callbackMappedToRenewStates : {};
        promiseMappedToRenewStates: {};
        openedWindows: Array<Window>;
        requestType: string;
    }
}

/**
 * @hidden
 * @ignore
 * response_type from OpenIDConnect
 * References: https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html & https://tools.ietf.org/html/rfc6749#section-4.2.1
 * Since we support only implicit flow in this library, we restrict the response_type support to only 'token' and 'id_token'
 *
 */
const ResponseTypes = {
  id_token: "id_token",
  token: "token",
  id_token_token: "id_token token"
};

/**
 * @hidden
 * @ignore
 */
export interface CacheResult {
  errorDesc: string;
  token: string;
  error: string;
}

/**
 * @hidden
 * @ignore
 * Data type to hold information about state returned from the server
 */
export type ResponseStateInfo = {
  state: string;
  stateMatch: boolean;
  requestType: string;
};

/**
 * A type alias for an authResponseCallback function.
 * {@link (authResponseCallback:type)}
 * @param authErr error created for failure cases
 * @param response response containing token strings in success cases, or just state value in error cases
 */
export type authResponseCallback = (authErr: AuthError, response?: AuthResponse) => void;

/**
 * A type alias for a tokenReceivedCallback function.
 * {@link (tokenReceivedCallback:type)}
 * @returns response of type {@link (AuthResponse:type)}
 * The function that will get the call back once this API is completed (either successfully or with a failure).
 */
export type tokenReceivedCallback = (response: AuthResponse) => void;

/**
 * A type alias for a errorReceivedCallback function.
 * {@link (errorReceivedCallback:type)}
 * @returns response of type {@link (AuthError:class)}
 * @returns {string} account state
 */
export type errorReceivedCallback = (authErr: AuthError, accountState: string) => void;

/**
 * @hidden
 * @ignore
 * A wrapper to handle the token response/error within the iFrame always
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
 * UserAgentApplication class
 *
 * Object Instance that the developer can use to make loginXX OR acquireTokenXX functions
 */
export class UserAgentApplication {

  // input Configuration by the developer/user
  private config: Configuration;

  // callbacks for token/error
  private authResponseCallback: authResponseCallback = null;
  private tokenReceivedCallback: tokenReceivedCallback = null;
  private errorReceivedCallback: errorReceivedCallback = null;

  // Added for readability as these params are very frequently used
  private logger: Logger;
  private clientId: string;
  private inCookie: boolean;
  private telemetryManager: TelemetryManager;

  // Cache and Account info referred across token grant flow
  protected cacheStorage: Storage;
  private account: Account;

  // state variables
  private loginInProgress: boolean;
  private acquireTokenInProgress: boolean;
  private silentAuthenticationState: string;
  private silentLogin: boolean;
  private redirectCallbacksSet: boolean;

  // Authority Functionality
  protected authorityInstance: Authority;

  /**
   * setter for the authority URL
   * @param {string} authority
   */
  // If the developer passes an authority, create an instance
  public set authority(val) {
    this.authorityInstance = AuthorityFactory.CreateInstance(val, this.config.auth.validateAuthority);
  }

  /**
   * Method to manage the authority URL.
   *
   * @returns {string} authority
   */
  public get authority(): string {
    return this.authorityInstance.CanonicalAuthority;
  }

  /**
   * Get the current authority instance from the MSAL configuration object
   *
   * @returns {@link Authority} authority instance
   */
  public getAuthorityInstance(): Authority {
    return this.authorityInstance;
  }

  /**
   * @constructor
   * Constructor for the UserAgentApplication used to instantiate the UserAgentApplication object
   *
   * Important attributes in the Configuration object for auth are:
   * - clientID: the application ID of your application.
   * You can obtain one by registering your application with our Application registration portal : https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredAppsPreview
   * - authority: the authority URL for your application.
   *
   * In Azure AD, authority is a URL indicating the Azure active directory that MSAL uses to obtain tokens.
   * It is of the form https://login.microsoftonline.com/&lt;Enter_the_Tenant_Info_Here&gt;.
   * If your application supports Accounts in one organizational directory, replace "Enter_the_Tenant_Info_Here" value with the Tenant Id or Tenant name (for example, contoso.microsoft.com).
   * If your application supports Accounts in any organizational directory, replace "Enter_the_Tenant_Info_Here" value with organizations.
   * If your application supports Accounts in any organizational directory and personal Microsoft accounts, replace "Enter_the_Tenant_Info_Here" value with common.
   * To restrict support to Personal Microsoft accounts only, replace "Enter_the_Tenant_Info_Here" value with consumers.
   *
   *
   * In Azure B2C, authority is of the form https://&lt;instance&gt;/tfp/&lt;tenant&gt;/&lt;policyName&gt;/

   * @param {@link (Configuration:type)} configuration object for the MSAL UserAgentApplication instance
   */
  constructor(configuration: Configuration) {

    // Set the Configuration
    this.config = buildConfiguration(configuration);

    // Set the callback boolean
    this.redirectCallbacksSet = false;

    this.logger = this.config.system.logger;
    this.clientId = this.config.auth.clientId;
    this.inCookie = this.config.cache.storeAuthStateInCookie;

    this.telemetryManager = this.getTelemetryManagerFromConfig(this.config.system.telemetry, this.clientId);

    // if no authority is passed, set the default: "https://login.microsoftonline.com/common"
    this.authority = this.config.auth.authority || DEFAULT_AUTHORITY;

    // track login and acquireToken in progress
    this.loginInProgress = false;
    this.acquireTokenInProgress = false;

    // cache keys msal - typescript throws an error if any value other than "localStorage" or "sessionStorage" is passed
    try {
      this.cacheStorage = new Storage(this.config.cache.cacheLocation);
    } catch (e) {
        throw ClientConfigurationError.createInvalidCacheLocationConfigError(this.config.cache.cacheLocation);
    }

    // Initialize window handling code
    window.openedWindows = [];
    window.activeRenewals = {};
    window.renewStates = [];
    window.callbackMappedToRenewStates = { };
    window.promiseMappedToRenewStates = { };
    window.msal = this;

    const urlHash = window.location.hash;
    const urlContainsHash = this.urlContainsHash(urlHash);

    // On the server 302 - Redirect, handle this
    if (!this.config.framework.isAngular) {
      if (urlContainsHash) {
        this.handleAuthenticationResponse(urlHash);
      }
    }
  }

  //#region Redirect Callbacks
  /**
   * @hidden
   * @ignore
   * Set the callback functions for the redirect flow to send back the success or error object.
   * @param {@link (tokenReceivedCallback:type)} successCallback - Callback which contains the AuthResponse object, containing data from the server.
   * @param {@link (errorReceivedCallback:type)} errorCallback - Callback which contains a AuthError object, containing error data from either the server
   * or the library, depending on the origin of the error.
   */
  handleRedirectCallback(tokenReceivedCallback: tokenReceivedCallback, errorReceivedCallback: errorReceivedCallback): void;
  handleRedirectCallback(authCallback: authResponseCallback): void;
  handleRedirectCallback(authOrTokenCallback: authResponseCallback | tokenReceivedCallback, errorReceivedCallback?: errorReceivedCallback): void {
    if (!authOrTokenCallback) {
      this.redirectCallbacksSet = false;
      throw ClientConfigurationError.createInvalidCallbackObjectError(authOrTokenCallback);
    }

    // Set callbacks
    if (errorReceivedCallback) {
      this.tokenReceivedCallback = authOrTokenCallback as tokenReceivedCallback;
      this.errorReceivedCallback = errorReceivedCallback;
      this.logger.warning("This overload for callback is deprecated - please change the format of the callbacks to a single callback as shown: (err: AuthError, response: AuthResponse).");
    } else {
      this.authResponseCallback = authOrTokenCallback as authResponseCallback;
    }

    this.redirectCallbacksSet = true;

    // On the server 302 - Redirect, handle this
    if (!this.config.framework.isAngular) {
      const cachedHash = this.cacheStorage.getItem(Constants.urlHash);
      if (cachedHash) {
        this.processCallBack(cachedHash, null);
      }
    }
  }

  private authResponseHandler(interactionType: InteractionType, response: AuthResponse, resolve?: any) : void {
    if (interactionType === Constants.interactionTypeRedirect) {
      if (this.errorReceivedCallback) {
        this.tokenReceivedCallback(response);
      } else if (this.authResponseCallback) {
        this.authResponseCallback(null, response);
      }
    } else if (interactionType === Constants.interactionTypePopup) {
      resolve(response);
    } else {
      throw ClientAuthError.createInvalidInteractionTypeError();
    }
  }

  private authErrorHandler(interactionType: InteractionType, authErr: AuthError, response: AuthResponse, reject?: any) : void {
    if (interactionType === Constants.interactionTypeRedirect) {
      if (this.errorReceivedCallback) {
        this.errorReceivedCallback(authErr, response.accountState);
      } else {
        this.authResponseCallback(authErr, response);
      }
    } else if (interactionType === Constants.interactionTypePopup) {
      reject(authErr);
    } else {
      throw ClientAuthError.createInvalidInteractionTypeError();
    }
  }

  //#endregion
  /**
   * Use when initiating the login process by redirecting the user's browser to the authorization endpoint.
   * @param {@link (AuthenticationParameters:type)}
   */
  loginRedirect(request?: AuthenticationParameters): void {
    // Throw error if callbacks are not set before redirect
    if (!this.redirectCallbacksSet) {
      throw ClientConfigurationError.createRedirectCallbacksNotSetError();
    }
    this.acquireTokenInteractive(Constants.interactionTypeRedirect, true, request);
  }

  /**
   * Use when you want to obtain an access_token for your API by redirecting the user's browser window to the authorization endpoint.
   * @param {@link (AuthenticationParameters:type)}
   *
   * To renew idToken, please pass clientId as the only scope in the Authentication Parameters
   */
  acquireTokenRedirect(request: AuthenticationParameters): void {
    if (!request) {
      throw ClientConfigurationError.createEmptyRequestError();
    }

    // Throw error if callbacks are not set before redirect
    if (!this.redirectCallbacksSet) {
      throw ClientConfigurationError.createRedirectCallbacksNotSetError();
    }
    this.acquireTokenInteractive(Constants.interactionTypeRedirect, false, request);
  }

  /**
   * Use when initiating the login process via opening a popup window in the user's browser
   *
   * @param {@link (AuthenticationParameters:type)}
   *
   * @returns {Promise.<AuthResponse>} - a promise that is fulfilled when this function has completed, or rejected if an error was raised. Returns the {@link AuthResponse} object
   */
  loginPopup(request?: AuthenticationParameters): Promise<AuthResponse> {
    return new Promise<AuthResponse>((resolve, reject) => {
      this.acquireTokenInteractive(Constants.interactionTypePopup, true, request, resolve, reject);
    });
  }

  /**
   * Use when you want to obtain an access_token for your API via opening a popup window in the user's browser
   * @param {@link AuthenticationParameters}
   *
   * To renew idToken, please pass clientId as the only scope in the Authentication Parameters
   * @returns {Promise.<AuthResponse>} - a promise that is fulfilled when this function has completed, or rejected if an error was raised. Returns the {@link AuthResponse} object
   */
  acquireTokenPopup(request: AuthenticationParameters): Promise<AuthResponse> {
    if (!request) {
      throw ClientConfigurationError.createEmptyRequestError();
    }

    return new Promise<AuthResponse>((resolve, reject) => {
      this.acquireTokenInteractive(Constants.interactionTypePopup, false, request, resolve, reject);
    });
  }

  //#region Acquire Token

  /**
   * Use when initiating the login process or when you want to obtain an access_token for your API,
   * either by redirecting the user's browser window to the authorization endpoint or via opening a popup window in the user's browser.
   * @param {@link (AuthenticationParameters:type)}
   *
   * To renew idToken, please pass clientId as the only scope in the Authentication Parameters
   */
  private acquireTokenInteractive(interactionType: InteractionType, isLoginCall: boolean, request?: AuthenticationParameters, resolve?: any, reject?: any): void {

    // If already in progress, do not proceed
    if (this.loginInProgress || this.acquireTokenInProgress) {
      const thrownError = this.loginInProgress ? ClientAuthError.createLoginInProgressError() : ClientAuthError.createAcquireTokenInProgressError();
      const stateOnlyResponse = buildResponseStateOnly(this.getAccountState(request && request.state));
      this.authErrorHandler(interactionType,
        thrownError,
        stateOnlyResponse,
        reject);
      return;
    }

    // if extraScopesToConsent is passed in loginCall, append them to the login request
    const scopes: Array<string> = isLoginCall ? this.appendScopes(request) : request.scopes;

    // Validate and filter scopes (the validate function will throw if validation fails)
    this.validateInputScope(scopes, !isLoginCall);

    // Get the account object if a session exists
    const account: Account = (request && request.account && !isLoginCall) ? request.account : this.getAccount();

    // If no session exists, prompt the user to login.
    if (!account && !ServerRequestParameters.isSSOParam(request)) {
      if (isLoginCall) {
        // extract ADAL id_token if exists
        let adalIdToken = this.extractADALIdToken();

        // silent login if ADAL id_token is retrieved successfully - SSO
        if (adalIdToken && !scopes) {
          this.logger.info("ADAL's idToken exists. Extracting login information from ADAL's idToken ");
          let tokenRequest: AuthenticationParameters = this.buildIDTokenRequest(request);

          this.silentLogin = true;
          this.acquireTokenSilent(tokenRequest).then(response => {
            this.silentLogin = false;
            this.logger.info("Unified cache call is successful");

            this.authResponseHandler(interactionType, response, resolve);
            return;
          }, (error) => {
            this.silentLogin = false;
            this.logger.error("Error occurred during unified cache ATS: " + error);

            // proceed to login since ATS failed
            this.acquireTokenHelper(null, interactionType, isLoginCall, request, scopes, resolve, reject);
          });
        }
        // No ADAL token found, proceed to login
        else {
          this.acquireTokenHelper(null, interactionType, isLoginCall, request, scopes, resolve, reject);
        }
      }
      // AcquireToken call, but no account or context given, so throw error
      else {
        this.logger.info("User login is required");
        throw ClientAuthError.createUserLoginRequiredError();
      }
    }
    // User session exists
    else {
      this.acquireTokenHelper(account, interactionType, isLoginCall, request, scopes, resolve, reject);
    }
  }

  /**
   * @hidden
   * @ignore
   * Helper function to acquireToken
   *
   */
  private acquireTokenHelper(account: Account, interactionType: InteractionType, isLoginCall: boolean, request?: AuthenticationParameters, scopes?: Array<string>, resolve?: any, reject?: any): void {
    // Track the acquireToken progress
    if (isLoginCall) {
      this.loginInProgress = true;
    } else {
      this.acquireTokenInProgress = true;
    }

    const scope = scopes ? scopes.join(" ").toLowerCase() : this.clientId.toLowerCase();

    let serverAuthenticationRequest: ServerRequestParameters;
    const acquireTokenAuthority = (!isLoginCall && request && request.authority) ? AuthorityFactory.CreateInstance(request.authority, this.config.auth.validateAuthority) : this.authorityInstance;

    let popUpWindow: Window;
    if (interactionType === Constants.interactionTypePopup) {
      // Generate a popup window
      popUpWindow = this.openWindow("about:blank", "_blank", 1, this, resolve, reject);
      if (!popUpWindow) {
        // We pass reject in openWindow, we reject there during an error
        return;
      }
    }

    acquireTokenAuthority.resolveEndpointsAsync().then(() => {
      // On Fulfillment
      const responseType: string = isLoginCall ? ResponseTypes.id_token : this.getTokenType(account, scopes, false);
      let loginStartPage: string;

      if (isLoginCall) {
        // if the user sets the login start page - angular only??
        loginStartPage = this.cacheStorage.getItem(Constants.angularLoginRequest);
        if (!loginStartPage || loginStartPage === "") {
          loginStartPage = window.location.href;
        } else {
          this.cacheStorage.setItem(Constants.angularLoginRequest, "");
        }
      }

      serverAuthenticationRequest = new ServerRequestParameters(
        acquireTokenAuthority,
        this.clientId,
        scopes,
        responseType,
        this.getRedirectUri(),
        request && request.state
      );

      this.updateCacheEntries(serverAuthenticationRequest, account, loginStartPage);

      // populate QueryParameters (sid/login_hint/domain_hint) and any other extraQueryParameters set by the developer
      serverAuthenticationRequest.populateQueryParams(account, request);

      // Construct urlNavigate
      let urlNavigate = UrlUtils.createNavigateUrl(serverAuthenticationRequest) + Constants.response_mode_fragment;

      // set state in cache
      if (interactionType === Constants.interactionTypeRedirect) {
        if (!isLoginCall) {
          this.cacheStorage.setItem(Constants.stateAcquireToken, serverAuthenticationRequest.state, this.inCookie);
        }
      } else if (interactionType === Constants.interactionTypePopup) {
        window.renewStates.push(serverAuthenticationRequest.state);
        window.requestType = isLoginCall ? Constants.login : Constants.renewToken;

        // Register callback to capture results from server
        this.registerCallback(serverAuthenticationRequest.state, scope, resolve, reject);
      } else {
        throw ClientAuthError.createInvalidInteractionTypeError();
      }

      // prompt user for interaction
      this.navigateWindow(urlNavigate, popUpWindow);
    }).catch((err) => {
      this.logger.warning("could not resolve endpoints");
      this.authErrorHandler(interactionType, ClientAuthError.createEndpointResolutionError(err.toString), buildResponseStateOnly(request.state), reject);
      if (popUpWindow) {
        popUpWindow.close();
      }
    });
  }

  /**
   * Use this function to obtain a token before every call to the API / resource provider
   *
   * MSAL return's a cached token when available
   * Or it send's a request to the STS to obtain a new token using a hidden iframe.
   *
   * @param {@link AuthenticationParameters}
   *
   * To renew idToken, please pass clientId as the only scope in the Authentication Parameters
   * @returns {Promise.<AuthResponse>} - a promise that is fulfilled when this function has completed, or rejected if an error was raised. Returns the {@link AuthResponse} object
   *
   */
  @resolveTokenOnlyIfOutOfIframe
  acquireTokenSilent(request: AuthenticationParameters): Promise<AuthResponse> {
    if (!request) {
      throw ClientConfigurationError.createEmptyRequestError();
    }
    return new Promise<AuthResponse>((resolve, reject) => {

      // Validate and filter scopes (the validate function will throw if validation fails)
      this.validateInputScope(request.scopes, true);

      const scope = request.scopes.join(" ").toLowerCase();

      // if the developer passes an account, give that account the priority
      const account: Account = request.account || this.getAccount();

      // extract if there is an adalIdToken stashed in the cache
      const adalIdToken = this.cacheStorage.getItem(Constants.adalIdToken);

      //if there is no account logged in and no login_hint/sid is passed in the request
      if (!account && !(request.sid  || request.loginHint) && StringUtils.isEmpty(adalIdToken) ) {
        this.logger.info("User login is required");
        return reject(ClientAuthError.createUserLoginRequiredError());
      }

      const responseType = this.getTokenType(account, request.scopes, true);

      let serverAuthenticationRequest = new ServerRequestParameters(
        AuthorityFactory.CreateInstance(request.authority, this.config.auth.validateAuthority),
        this.clientId,
        request.scopes,
        responseType,
        this.getRedirectUri(),
        request && request.state
      );
      // populate QueryParameters (sid/login_hint/domain_hint) and any other extraQueryParameters set by the developer
      if (ServerRequestParameters.isSSOParam(request) || account) {
        serverAuthenticationRequest.populateQueryParams(account, request);
      }
      //if user didn't pass login_hint/sid and adal's idtoken is present, extract the login_hint from the adalIdToken
      else if (!account && !StringUtils.isEmpty(adalIdToken)) {
        // if adalIdToken exists, extract the SSO info from the same
        const adalIdTokenObject = TokenUtils.extractIdToken(adalIdToken);
        this.logger.verbose("ADAL's idToken exists. Extracting login information from ADAL's idToken ");
        serverAuthenticationRequest.populateQueryParams(account, null, adalIdTokenObject);
      }
      const userContainedClaims = request.claimsRequest || serverAuthenticationRequest.claimsValue;

      let authErr: AuthError;
      let cacheResultResponse;

      if (!userContainedClaims && !request.forceRefresh) {
        try {
          cacheResultResponse = this.getCachedToken(serverAuthenticationRequest, account);
        } catch (e) {
          authErr = e;
        }
      }

      // resolve/reject based on cacheResult
      if (cacheResultResponse) {
        this.logger.info("Token is already in cache for scope:" + scope);
        resolve(cacheResultResponse);
        return null;
      }
      else if (authErr) {
        this.logger.infoPii(authErr.errorCode + ":" + authErr.errorMessage);
        reject(authErr);
        return null;
      }
      // else proceed with login
      else {
        let logMessage;
        if (userContainedClaims) {
          logMessage = "Skipped cache lookup since claims were given.";
        } else if (request.forceRefresh) {
          logMessage = "Skipped cache lookup since request.forceRefresh option was set to true";
        } else {
          logMessage = "Token is not in cache for scope:" + scope;
        }
        this.logger.verbose(logMessage);

        // Cache result can return null if cache is empty. In that case, set authority to default value if no authority is passed to the api.
        if (!serverAuthenticationRequest.authorityInstance) {
            serverAuthenticationRequest.authorityInstance = request.authority ? AuthorityFactory.CreateInstance(request.authority, this.config.auth.validateAuthority) : this.authorityInstance;
        }
        // cache miss
        return serverAuthenticationRequest.authorityInstance.resolveEndpointsAsync()
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
              this.silentLogin = true;
              this.renewIdToken(request.scopes, resolve, reject, account, serverAuthenticationRequest);
            } else {
              // renew access token
              this.logger.verbose("renewing accesstoken");
              this.renewToken(request.scopes, resolve, reject, account, serverAuthenticationRequest);
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

  //#endregion

  //#region Popup Window Creation

  /**
   * @hidden
   *
   * Used to send the user to the redirect_uri after authentication is complete. The user's bearer token is attached to the URI fragment as an id_token/access_token field.
   * This function also closes the popup window after redirection.
   *
   * @param urlNavigate
   * @param title
   * @param interval
   * @param instance
   * @param resolve
   * @param reject
   * @ignore
   */
  private openWindow(urlNavigate: string, title: string, interval: number, instance: this, resolve?: Function, reject?: Function): Window {
    // Generate a popup window
    var popupWindow: Window;
    try {
      popupWindow = this.openPopup(urlNavigate, title, Constants.popUpWidth, Constants.popUpHeight);
    } catch (e) {
      instance.loginInProgress = false;
      instance.acquireTokenInProgress = false;

      this.logger.info(ClientAuthErrorMessage.popUpWindowError.code + ":" + ClientAuthErrorMessage.popUpWindowError.desc);
      this.cacheStorage.setItem(Constants.msalError, ClientAuthErrorMessage.popUpWindowError.code);
      this.cacheStorage.setItem(Constants.msalErrorDescription, ClientAuthErrorMessage.popUpWindowError.desc);
      if (reject) {
        reject(ClientAuthError.createPopupWindowError());
      }
      return null;
    }

    // Push popup window handle onto stack for tracking
    window.openedWindows.push(popupWindow);

    const pollTimer = window.setInterval(() => {
      // If popup closed or login in progress, cancel login
      if (popupWindow && popupWindow.closed && (instance.loginInProgress || instance.acquireTokenInProgress)) {
        if (reject) {
          reject(ClientAuthError.createUserCancelledError());
        }
        window.clearInterval(pollTimer);
        if (this.config.framework.isAngular) {
            this.broadcast("msal:popUpClosed", ClientAuthErrorMessage.userCancelledError.code + Constants.resourceDelimiter + ClientAuthErrorMessage.userCancelledError.desc);
            return;
        }
        instance.loginInProgress = false;
        instance.acquireTokenInProgress = false;
      }

      try {
        const popUpWindowLocation = popupWindow.location;

        // If the popup hash changes, close the popup window
        if (popUpWindowLocation.href.indexOf(this.getRedirectUri()) !== -1) {
          window.clearInterval(pollTimer);
          instance.loginInProgress = false;
          instance.acquireTokenInProgress = false;
          this.logger.info("Closing popup window");
          // TODO: Check how this can be extracted for any framework specific code?
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
   * @hidden
   *
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
      this.loginInProgress = false;
      this.acquireTokenInProgress = false;
      throw ClientAuthError.createPopupWindowError(e.toString());
    }
  }

  //#endregion

  //#region Iframe Management

  /**
   * @hidden
   * Returns whether current window is in ifram for token renewal
   * @ignore
   */
  public isInIframe() {
      return window.parent !== window;
  }

  /**
   * @hidden
   * Returns whether parent window exists and has msal
   */
  private parentIsMsal() {
    return window.parent !== window && window.parent.msal;
  }

  /**
   * @hidden
   * Calling _loadFrame but with a timeout to signal failure in loadframeStatus. Callbacks are left.
   * registered when network errors occur and subsequent token requests for same resource are registered to the pending request.
   * @ignore
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
        if (expectedState && window.callbackMappedToRenewStates[expectedState]) {
          window.callbackMappedToRenewStates[expectedState](null, ClientAuthError.createTokenRenewalTimeoutError());
        }

        this.cacheStorage.setItem(Constants.renewStatus + expectedState, Constants.tokenRenewStatusCancelled);
      }
    }, this.config.system.loadFrameTimeout);
  }

  /**
   * @hidden
   * Loads iframe with authorization endpoint URL
   * @ignore
   */
  private loadFrame(urlNavigate: string, frameName: string): void {
    // This trick overcomes iframe navigation in IE
    // IE does not load the page consistently in iframe
    this.logger.info("LoadFrame: " + frameName);
    const frameCheck = frameName;

    setTimeout(() => {
      const frameHandle = this.addHiddenIFrame(frameCheck);
      if (frameHandle.src === "" || frameHandle.src === "about:blank") {
        frameHandle.src = urlNavigate;
        this.logger.infoPii("Frame Name : " + frameName + " Navigated to: " + urlNavigate);
      }
    },
    this.config.system.navigateFrameWait);
  }

  /**
   * @hidden
   * Adds the hidden iframe for silent token renewal.
   * @ignore
   */
  private addHiddenIFrame(iframeId: string): HTMLIFrameElement {
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
   * @hidden
   * Used to redirect the browser to the STS authorization endpoint
   * @param {string} urlNavigate - URL of the authorization endpoint
   */
  private navigateWindow(urlNavigate: string, popupWindow?: Window) {
    // Navigate if valid URL
    if (urlNavigate && !StringUtils.isEmpty(urlNavigate)) {
      let navigateWindow: Window = popupWindow ? popupWindow : window;
      let logMessage: string = popupWindow ? "Navigated Popup window to:" + urlNavigate : "Navigate to:" + urlNavigate;
      this.logger.infoPii(logMessage);
      navigateWindow.location.replace(urlNavigate);
    }
    else {
      this.logger.info("Navigate url is empty");
      throw AuthError.createUnexpectedError("Navigate url is empty");
    }
  }

  /**
   * @hidden
   * Used to add the developer requested callback to the array of callbacks for the specified scopes. The updated array is stored on the window object
   * @param {string} expectedState - Unique state identifier (guid).
   * @param {string} scope - Developer requested permissions. Not all scopes are guaranteed to be included in the access token returned.
   * @param {Function} resolve - The resolve function of the promise object.
   * @param {Function} reject - The reject function of the promise object.
   * @ignore
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
    if (!window.callbackMappedToRenewStates[expectedState]) {
      window.callbackMappedToRenewStates[expectedState] =
      (response: AuthResponse, error: AuthError) => {
        // reset active renewals
        window.activeRenewals[scope] = null;

        // for all promiseMappedtoRenewStates for a given 'state' - call the reject/resolve with error/token respectively
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
        window.callbackMappedToRenewStates[expectedState] = null;
      };
    }
  }

  //#endregion

  //#region Logout

  /**
   * Use to log out the current user, and redirect the user to the postLogoutRedirectUri.
   * Default behaviour is to redirect the user to `window.location.href`.
   */
  logout(): void {
    this.clearCache();
    this.account = null;
    let logout = "";
    if (this.getPostLogoutRedirectUri()) {
      logout = "post_logout_redirect_uri=" + encodeURIComponent(this.getPostLogoutRedirectUri());
    }
    this.authorityInstance.resolveEndpointsAsync().then(authority => {
        const urlNavigate = authority.EndSessionEndpoint
            ? `${authority.EndSessionEndpoint}?${logout}`
            : `${this.authority}oauth2/v2.0/logout?${logout}`;
        this.navigateWindow(urlNavigate);
    });
  }

  /**
   * @hidden
   * Clear all access tokens in the cache.
   * @ignore
   */
  protected clearCache(): void {
    window.renewStates = [];
    const accessTokenItems = this.cacheStorage.getAllAccessTokens(Constants.clientId, Constants.homeAccountIdentifier);
    for (let i = 0; i < accessTokenItems.length; i++) {
      this.cacheStorage.removeItem(JSON.stringify(accessTokenItems[i].key));
    }
    this.cacheStorage.resetCacheItems();
    this.cacheStorage.clearCookie();
  }

  /**
   * @hidden
   * Clear a given access token from the cache.
   *
   * @param accessToken
   */
  protected clearCacheForScope(accessToken: string) {
    const accessTokenItems = this.cacheStorage.getAllAccessTokens(Constants.clientId, Constants.homeAccountIdentifier);
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
   * @hidden
   * @ignore
   * Checks if the redirect response is received from the STS. In case of redirect, the url fragment has either id_token, access_token or error.
   * @param {string} hash - Hash passed from redirect page.
   * @returns {Boolean} - true if response contains id_token, access_token or error, false otherwise.
   */
  isCallback(hash: string): boolean {
    this.logger.info("isCallback will be deprecated in favor of urlContainsHash in MSAL.js v2.0.");
    return this.urlContainsHash(hash);
  }

  private urlContainsHash(urlString: string): boolean {
    const parameters = this.deserializeHash(urlString);
    return (
      parameters.hasOwnProperty(Constants.errorDescription) ||
      parameters.hasOwnProperty(Constants.error) ||
      parameters.hasOwnProperty(Constants.accessToken) ||
      parameters.hasOwnProperty(Constants.idToken)
    );
  }

  /**
   * @hidden
   * Used to call the constructor callback with the token/error
   * @param {string} [hash=window.location.hash] - Hash fragment of Url.
   */
  private processCallBack(hash: string, stateInfo: ResponseStateInfo, parentCallback?: Function): void {
    this.logger.info("Processing the callback from redirect response");
    // get the state info from the hash
    if (!stateInfo) {
      stateInfo = this.getResponseState(hash);
    }

    let response : AuthResponse;
    let authErr : AuthError;
    // Save the token info from the hash
    try {
      response = this.saveTokenFromHash(hash, stateInfo);
    } catch (err) {
      authErr = err;
    }

    // remove hash from the cache
    this.cacheStorage.removeItem(Constants.urlHash);

    try {
      // Clear the cookie in the hash
      this.cacheStorage.clearCookie();
      const accountState: string = this.getAccountState(stateInfo.state);
      if (response) {
        if ((stateInfo.requestType === Constants.renewToken) || response.accessToken) {
          if (window.parent !== window) {
            this.logger.verbose("Window is in iframe, acquiring token silently");
          } else {
            this.logger.verbose("acquiring token interactive in progress");
          }
          response.tokenType = Constants.accessToken;
        }
        else if (stateInfo.requestType === Constants.login) {
          response.tokenType = Constants.idToken;
        }
        if (!parentCallback) {
          this.authResponseHandler(Constants.interactionTypeRedirect, response);
          return;
        }
      } else if (!parentCallback) {
        this.authErrorHandler(Constants.interactionTypeRedirect, authErr, buildResponseStateOnly(accountState));
        return;
      }

      parentCallback(response, authErr);
    } catch (err) {
      this.logger.error("Error occurred in token received callback function: " + err);
      throw ClientAuthError.createErrorInCallbackFunction(err.toString());
    }
  }

  /**
   * @hidden
   * This method must be called for processing the response received from the STS. It extracts the hash, processes the token or error information and saves it in the cache. It then
   * calls the registered callbacks in case of redirect or resolves the promises with the result.
   * @param {string} [hash=window.location.hash] - Hash fragment of Url.
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
    } else if (window.parent && window.parent.msal) {
      self = window.parent.msal;
    }

    // if (window.parent !== window), by using self, window.parent becomes equal to window in getResponseState method specifically
    const stateInfo = self.getResponseState(hash);

    let tokenResponseCallback: (response: AuthResponse, error: AuthError) => void = null;

    self.logger.info("Returned from redirect url");
    // If parent window is the msal instance which opened the current window (iframe)
    if (this.parentIsMsal()) {
        tokenResponseCallback = window.parent.callbackMappedToRenewStates[stateInfo.state];
    }
    // Current window is window opener (popup)
    else if (isWindowOpenerMsal) {
        tokenResponseCallback = window.opener.callbackMappedToRenewStates[stateInfo.state];
    }
    // Redirect cases
    else {
      tokenResponseCallback = null;
      // if set to navigate to loginRequest page post login
      if (self.config.auth.navigateToLoginRequestUrl) {
        self.cacheStorage.setItem(Constants.urlHash, hash);
        if (window.parent === window && !isPopup) {
          window.location.href = self.cacheStorage.getItem(Constants.loginRequest, self.inCookie);
        }
        return;
      }
      else {
        window.location.hash = "";
      }
      if (!this.redirectCallbacksSet) {
        // We reached this point too early - cache hash, return and process in handleRedirectCallbacks
        self.cacheStorage.setItem(Constants.urlHash, hash);
        return;
      }
    }

    self.processCallBack(hash, stateInfo, tokenResponseCallback);

    // If current window is opener, close all windows
    if (isWindowOpenerMsal) {
      for (let i = 0; i < window.opener.openedWindows.length; i++) {
        window.opener.openedWindows[i].close();
      }
    }
  }

  /**
   * @hidden
   * Returns deserialized portion of URL hash
   * @param hash
   */
  private deserializeHash(urlFragment: string) {
    let hash = UrlUtils.getHashFromUrl(urlFragment);
    return CryptoUtils.deserialize(hash);
  }

  /**
   * @hidden
   * Creates a stateInfo object from the URL fragment and returns it.
   * @param {string} hash  -  Hash passed from redirect page
   * @returns {TokenResponse} an object created from the redirect response from AAD comprising of the keys - parameters, requestType, stateMatch, stateResponse and valid.
   * @ignore
   */
  protected getResponseState(hash: string): ResponseStateInfo {
    const parameters = this.deserializeHash(hash);
    let stateResponse: ResponseStateInfo;
    if (!parameters) {
      throw AuthError.createUnexpectedError("Hash was not parsed correctly.");
    }
    if (parameters.hasOwnProperty("state")) {
      stateResponse = {
        requestType: Constants.unknown,
        state: parameters.state,
        stateMatch: false
      };
    } else {
      throw AuthError.createUnexpectedError("Hash does not contain state.");
    }
    // async calls can fire iframe and login request at the same time if developer does not use the API as expected
    // incoming callback needs to be looked up to find the request type

    // loginRedirect
    if (stateResponse.state === this.cacheStorage.getItem(Constants.stateLogin, this.inCookie) || stateResponse.state === this.silentAuthenticationState) { // loginRedirect
      stateResponse.requestType = Constants.login;
      stateResponse.stateMatch = true;
      return stateResponse;
    }
    // acquireTokenRedirect
    else if (stateResponse.state === this.cacheStorage.getItem(Constants.stateAcquireToken, this.inCookie)) { //acquireTokenRedirect
      stateResponse.requestType = Constants.renewToken;
      stateResponse.stateMatch = true;
      return stateResponse;
    }

    // external api requests may have many renewtoken requests for different resource
    if (!stateResponse.stateMatch) {
      stateResponse.requestType = window.requestType;
      const statesInParentContext = window.renewStates;
      for (let i = 0; i < statesInParentContext.length; i++) {
        if (statesInParentContext[i] === stateResponse.state) {
          stateResponse.stateMatch = true;
          break;
        }
      }
    }

    return stateResponse;
  }

  //#endregion

  //#region Token Processing (Extract to TokenProcessing.ts)

  /**
   * @hidden
   * Used to get token for the specified set of scopes from the cache
   * @param {@link ServerRequestParameters} - Request sent to the STS to obtain an id_token/access_token
   * @param {Account} account - Account for which the scopes were requested
   */
  private getCachedToken(serverAuthenticationRequest: ServerRequestParameters, account: Account): AuthResponse {
    let accessTokenCacheItem: AccessTokenCacheItem = null;
    const scopes = serverAuthenticationRequest.scopes;

    // filter by clientId and account
    const tokenCacheItems = this.cacheStorage.getAllAccessTokens(this.clientId, account ? account.homeAccountIdentifier : null);

    // No match found after initial filtering
    if (tokenCacheItems.length === 0) {
      return null;
    }

    const filteredItems: Array<AccessTokenCacheItem> = [];

    // if no authority passed
    if (!serverAuthenticationRequest.authority) {
      // filter by scope
      for (let i = 0; i < tokenCacheItems.length; i++) {
        const cacheItem = tokenCacheItems[i];
        const cachedScopes = cacheItem.key.scopes.split(" ");
        if (ScopeSet.containsScope(cachedScopes, scopes)) {
          filteredItems.push(cacheItem);
        }
      }

      // if only one cached token found
      if (filteredItems.length === 1) {
        accessTokenCacheItem = filteredItems[0];
        serverAuthenticationRequest.authorityInstance = AuthorityFactory.CreateInstance(accessTokenCacheItem.key.authority, this.config.auth.validateAuthority);
      }
      // if more than one cached token is found
      else if (filteredItems.length > 1) {
        throw ClientAuthError.createMultipleMatchingTokensInCacheError(scopes.toString());
      }
      // if no match found, check if there was a single authority used
      else {
        const authorityList = this.getUniqueAuthority(tokenCacheItems, "authority");
        if (authorityList.length > 1) {
          throw ClientAuthError.createMultipleAuthoritiesInCacheError(scopes.toString());
        }

        serverAuthenticationRequest.authorityInstance = AuthorityFactory.CreateInstance(authorityList[0], this.config.auth.validateAuthority);
      }
    }
    // if an authority is passed in the API
    else {
      // filter by authority and scope
      for (let i = 0; i < tokenCacheItems.length; i++) {
        const cacheItem = tokenCacheItems[i];
        const cachedScopes = cacheItem.key.scopes.split(" ");
        if (ScopeSet.containsScope(cachedScopes, scopes) && UrlUtils.CanonicalizeUri(cacheItem.key.authority) === serverAuthenticationRequest.authority) {
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
        throw ClientAuthError.createMultipleMatchingTokensInCacheError(scopes.toString());
      }
    }

    if (accessTokenCacheItem != null) {
      let expired = Number(accessTokenCacheItem.value.expiresIn);
      // If expiration is within offset, it will force renew
      const offset = this.config.system.tokenRenewalOffsetSeconds || 300;
      if (expired && (expired > TimeUtils.now() + offset)) {
        let idTokenObj = new IdToken(accessTokenCacheItem.value.idToken);
        if (!account) {
          account = this.getAccount();
          if (!account) {
            throw AuthError.createUnexpectedError("Account should not be null here.");
          }
        }
        const aState = this.getAccountState(serverAuthenticationRequest.state);
        let response : AuthResponse = {
          uniqueId: "",
          tenantId: "",
          tokenType: (accessTokenCacheItem.value.idToken === accessTokenCacheItem.value.accessToken) ? Constants.idToken : Constants.accessToken,
          idToken: idTokenObj,
          idTokenClaims: idTokenObj.claims,
          accessToken: accessTokenCacheItem.value.accessToken,
          scopes: accessTokenCacheItem.key.scopes.split(" "),
          expiresOn: new Date(expired * 1000),
          account: account,
          accountState: aState,
        };
        ResponseUtils.setResponseIdToken(response, idTokenObj);
        return response;
      } else {
        this.cacheStorage.removeItem(JSON.stringify(filteredItems[0].key));
        return null;
      }
    } else {
      return null;
    }
  }

  /**
   * @hidden
   * Used to get a unique list of authoritues from the cache
   * @param {Array<AccessTokenCacheItem>}  accessTokenCacheItems - accessTokenCacheItems saved in the cache
   * @ignore
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
   * @hidden
   * Check if ADAL id_token exists and return if exists.
   *
   */
  private extractADALIdToken(): any {
    const adalIdToken = this.cacheStorage.getItem(Constants.adalIdToken);
    if (!StringUtils.isEmpty(adalIdToken)) {
      return TokenUtils.extractIdToken(adalIdToken);
    }
    return null;
  }

  /**
   * @hidden
   * Acquires access token using a hidden iframe.
   * @ignore
   */
  private renewToken(scopes: Array<string>, resolve: Function, reject: Function, account: Account, serverAuthenticationRequest: ServerRequestParameters): void {
    const scope = scopes.join(" ").toLowerCase();
    this.logger.verbose("renewToken is called for scope:" + scope);
    const frameHandle = this.addHiddenIFrame("msalRenewFrame" + scope);

    this.updateCacheEntries(serverAuthenticationRequest, account);
    this.logger.verbose("Renew token Expected state: " + serverAuthenticationRequest.state);

    // Build urlNavigate with "prompt=none" and navigate to URL in hidden iFrame
    let urlNavigate = UrlUtils.urlRemoveQueryStringParameter(UrlUtils.createNavigateUrl(serverAuthenticationRequest), Constants.prompt) + Constants.prompt_none;

    window.renewStates.push(serverAuthenticationRequest.state);
    window.requestType = Constants.renewToken;
    this.registerCallback(serverAuthenticationRequest.state, scope, resolve, reject);
    this.logger.infoPii("Navigate to:" + urlNavigate);
    frameHandle.src = "about:blank";
    this.loadIframeTimeout(urlNavigate, "msalRenewFrame" + scope, scope);
  }

  /**
   * @hidden
   * Renews idtoken for app"s own backend when clientId is passed as a single scope in the scopes array.
   * @ignore
   */
  private renewIdToken(scopes: Array<string>, resolve: Function, reject: Function, account: Account, serverAuthenticationRequest: ServerRequestParameters): void {

    this.logger.info("renewidToken is called");
    const frameHandle = this.addHiddenIFrame("msalIdTokenFrame");

    this.updateCacheEntries(serverAuthenticationRequest, account);

    this.logger.verbose("Renew Idtoken Expected state: " + serverAuthenticationRequest.state);

    // Build urlNavigate with "prompt=none" and navigate to URL in hidden iFrame
    let urlNavigate = UrlUtils.urlRemoveQueryStringParameter(UrlUtils.createNavigateUrl(serverAuthenticationRequest), Constants.prompt) + Constants.prompt_none;

    if (this.silentLogin) {
        window.requestType = Constants.login;
        this.silentAuthenticationState = serverAuthenticationRequest.state;
    } else {
        window.requestType = Constants.renewToken;
        window.renewStates.push(serverAuthenticationRequest.state);
    }

    // note: scope here is clientId
    this.registerCallback(serverAuthenticationRequest.state, this.clientId, resolve, reject);
    this.logger.infoPii("Navigate to:" + urlNavigate);
    frameHandle.src = "about:blank";
    this.loadIframeTimeout(urlNavigate, "msalIdTokenFrame", this.clientId);
  }

  /**
   * @hidden
   *
   * This method must be called for processing the response received from AAD. It extracts the hash, processes the token or error, saves it in the cache and calls the registered callbacks with the result.
   * @param {string} authority authority received in the redirect response from AAD.
   * @param {TokenResponse} requestInfo an object created from the redirect response from AAD comprising of the keys - parameters, requestType, stateMatch, stateResponse and valid.
   * @param {Account} account account object for which scopes are consented for. The default account is the logged in account.
   * @param {ClientInfo} clientInfo clientInfo received as part of the response comprising of fields uid and utid.
   * @param {IdToken} idToken idToken received as part of the response.
   * @ignore
   * @private
   */
  /* tslint:disable:no-string-literal */
  private saveAccessToken(response: AuthResponse, authority: string, parameters: any, clientInfo: string, idTokenObj: IdToken): AuthResponse {
    let scope: string;
    let accessTokenResponse = { ...response };
    const clientObj: ClientInfo = new ClientInfo(clientInfo);
    let expiration: number;

    // if the response contains "scope"
    if (parameters.hasOwnProperty("scope")) {
      // read the scopes
      scope = parameters["scope"];
      const consentedScopes = scope.split(" ");

      // retrieve all access tokens from the cache, remove the dup scores
      const accessTokenCacheItems = this.cacheStorage.getAllAccessTokens(this.clientId, authority);

      for (let i = 0; i < accessTokenCacheItems.length; i++) {
        const accessTokenCacheItem = accessTokenCacheItems[i];

        if (accessTokenCacheItem.key.homeAccountIdentifier === response.account.homeAccountIdentifier) {
          const cachedScopes = accessTokenCacheItem.key.scopes.split(" ");
          if (ScopeSet.isIntersectingScopes(cachedScopes, consentedScopes)) {
            this.cacheStorage.removeItem(JSON.stringify(accessTokenCacheItem.key));
          }
        }
      }

      // Generate and cache accessTokenKey and accessTokenValue
      const expiresIn = TimeUtils.parseExpiresIn(parameters[Constants.expiresIn]);
      expiration = TimeUtils.now() + expiresIn;
      const accessTokenKey = new AccessTokenKey(authority, this.clientId, scope, clientObj.uid, clientObj.utid);
      const accessTokenValue = new AccessTokenValue(parameters[Constants.accessToken], idTokenObj.rawIdToken, expiration.toString(), clientInfo);

      this.cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));

      accessTokenResponse.accessToken  = parameters[Constants.accessToken];
      accessTokenResponse.scopes = consentedScopes;
    }
    // if the response does not contain "scope" - scope is usually client_id and the token will be id_token
    else {
      scope = this.clientId;

      // Generate and cache accessTokenKey and accessTokenValue
      const accessTokenKey = new AccessTokenKey(authority, this.clientId, scope, clientObj.uid, clientObj.utid);
      expiration = Number(idTokenObj.expiration);
      const accessTokenValue = new AccessTokenValue(parameters[Constants.idToken], parameters[Constants.idToken], expiration.toString(), clientInfo);
      this.cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
      accessTokenResponse.scopes = [scope];
      accessTokenResponse.accessToken = parameters[Constants.idToken];
    }

    if (expiration) {
        accessTokenResponse.expiresOn = new Date(expiration * 1000);
    } else {
        this.logger.error("Could not parse expiresIn parameter");
    }

    return accessTokenResponse;
  }

  /**
   * @hidden
   * Saves token or error received in the response from AAD in the cache. In case of id_token, it also creates the account object.
   * @ignore
   */
  protected saveTokenFromHash(hash: string, stateInfo: ResponseStateInfo): AuthResponse {
    this.logger.info("State status:" + stateInfo.stateMatch + "; Request type:" + stateInfo.requestType);
    this.cacheStorage.setItem(Constants.msalError, "");
    this.cacheStorage.setItem(Constants.msalErrorDescription, "");

    let response : AuthResponse = {
      uniqueId: "",
      tenantId: "",
      tokenType: "",
      idToken: null,
      idTokenClaims: null,
      accessToken: null,
      scopes: [],
      expiresOn: null,
      account: null,
      accountState: "",
    };

    let error: AuthError;
    const hashParams = this.deserializeHash(hash);
    let authorityKey: string = "";
    let acquireTokenAccountKey: string = "";
    let idTokenObj: IdToken = null;

    // If server returns an error
    if (hashParams.hasOwnProperty(Constants.errorDescription) || hashParams.hasOwnProperty(Constants.error)) {
      this.logger.infoPii("Error :" + hashParams[Constants.error] + "; Error description:" + hashParams[Constants.errorDescription]);
      this.cacheStorage.setItem(Constants.msalError, hashParams[Constants.error]);
      this.cacheStorage.setItem(Constants.msalErrorDescription, hashParams[Constants.errorDescription]);

      // login
      if (stateInfo.requestType === Constants.login) {
        this.loginInProgress = false;
        this.cacheStorage.setItem(Constants.loginError, hashParams[Constants.errorDescription] + ":" + hashParams[Constants.error]);
        authorityKey = Storage.generateAuthorityKey(stateInfo.state);
      }

      // acquireToken
      if (stateInfo.requestType === Constants.renewToken) {
        this.acquireTokenInProgress = false;
        authorityKey = Storage.generateAuthorityKey(stateInfo.state);

        const account: Account = this.getAccount();
        let accountId;

        if (account && !StringUtils.isEmpty(account.homeAccountIdentifier)) {
            accountId = account.homeAccountIdentifier;
        }
        else {
            accountId = Constants.no_account;
        }

        acquireTokenAccountKey = Storage.generateAcquireTokenAccountKey(accountId, stateInfo.state);
      }

      const {
        [Constants.error]: hashErr,
        [Constants.errorDescription]: hashErrDesc
      } = hashParams;
      if (InteractionRequiredAuthError.isInteractionRequiredError(hashErr) ||
        InteractionRequiredAuthError.isInteractionRequiredError(hashErrDesc)) {
        error = new InteractionRequiredAuthError(hashParams[Constants.error], hashParams[Constants.errorDescription]);
      } else {
        error = new ServerError(hashParams[Constants.error], hashParams[Constants.errorDescription]);
      }
    }
    // If the server returns "Success"
    else {
      // Verify the state from redirect and record tokens to storage if exists
      if (stateInfo.stateMatch) {
        this.logger.info("State is right");
        if (hashParams.hasOwnProperty(Constants.sessionState)) {
            this.cacheStorage.setItem(Constants.msalSessionState, hashParams[Constants.sessionState]);
        }
        response.accountState = this.getAccountState(stateInfo.state);

        let clientInfo: string = "";

        // Process access_token
        if (hashParams.hasOwnProperty(Constants.accessToken)) {
          this.logger.info("Fragment has access token");
          this.acquireTokenInProgress = false;

          // retrieve the id_token from response if present
          if (hashParams.hasOwnProperty(Constants.idToken)) {
            idTokenObj = new IdToken(hashParams[Constants.idToken]);
            response.idToken = idTokenObj;
            response.idTokenClaims = idTokenObj.claims;
          } else {
            idTokenObj = new IdToken(this.cacheStorage.getItem(Constants.idTokenKey));
            response = ResponseUtils.setResponseIdToken(response, idTokenObj);
          }

          // retrieve the authority from cache and replace with tenantID
          const authorityKey = Storage.generateAuthorityKey(stateInfo.state);
          let authority: string = this.cacheStorage.getItem(authorityKey, this.inCookie);

          if (!StringUtils.isEmpty(authority)) {
            authority = UrlUtils.replaceTenantPath(authority, response.tenantId);
          }

          // retrieve client_info - if it is not found, generate the uid and utid from idToken
          if (hashParams.hasOwnProperty(Constants.clientInfo)) {
            clientInfo = hashParams[Constants.clientInfo];
          } else {
            this.logger.warning("ClientInfo not received in the response from AAD");
            throw ClientAuthError.createClientInfoNotPopulatedError("ClientInfo not received in the response from the server");
          }

          response.account = Account.createAccount(idTokenObj, new ClientInfo(clientInfo));

          let accountKey: string;
          if (response.account && !StringUtils.isEmpty(response.account.homeAccountIdentifier)) {
            accountKey = response.account.homeAccountIdentifier;
          }
          else {
            accountKey = Constants.no_account;
          }

          acquireTokenAccountKey = Storage.generateAcquireTokenAccountKey(accountKey, stateInfo.state);
          const acquireTokenAccountKey_noaccount = Storage.generateAcquireTokenAccountKey(Constants.no_account, stateInfo.state);

          let cachedAccount: string = this.cacheStorage.getItem(acquireTokenAccountKey);
          let acquireTokenAccount: Account;

          // Check with the account in the Cache
          if (!StringUtils.isEmpty(cachedAccount)) {
            acquireTokenAccount = JSON.parse(cachedAccount);
            if (response.account && acquireTokenAccount && Account.compareAccounts(response.account, acquireTokenAccount)) {
              response = this.saveAccessToken(response, authority, hashParams, clientInfo, idTokenObj);
              this.logger.info("The user object received in the response is the same as the one passed in the acquireToken request");
            }
            else {
              this.logger.warning(
                "The account object created from the response is not the same as the one passed in the acquireToken request");
            }
          }
          else if (!StringUtils.isEmpty(this.cacheStorage.getItem(acquireTokenAccountKey_noaccount))) {
            response = this.saveAccessToken(response, authority, hashParams, clientInfo, idTokenObj);
          }
        }

        // Process id_token
        if (hashParams.hasOwnProperty(Constants.idToken)) {
            this.logger.info("Fragment has id token");

            // login no longer in progress
            this.loginInProgress = false;

            // set the idToken
            idTokenObj = new IdToken(hashParams[Constants.idToken]);

            response = ResponseUtils.setResponseIdToken(response, idTokenObj);
            if (hashParams.hasOwnProperty(Constants.clientInfo)) {
              clientInfo = hashParams[Constants.clientInfo];
            } else {
              this.logger.warning("ClientInfo not received in the response from AAD");
            }

            authorityKey = Storage.generateAuthorityKey(stateInfo.state);
            let authority: string = this.cacheStorage.getItem(authorityKey, this.inCookie);

            if (!StringUtils.isEmpty(authority)) {
              authority = UrlUtils.replaceTenantPath(authority, idTokenObj.tenantId);
            }

            this.account = Account.createAccount(idTokenObj, new ClientInfo(clientInfo));
            response.account = this.account;

            if (idTokenObj && idTokenObj.nonce) {
              // check nonce integrity if idToken has nonce - throw an error if not matched
              if (idTokenObj.nonce !== this.cacheStorage.getItem(Constants.nonceIdToken, this.inCookie)) {
                this.account = null;
                this.cacheStorage.setItem(Constants.loginError, "Nonce Mismatch. Expected Nonce: " + this.cacheStorage.getItem(Constants.nonceIdToken, this.inCookie) + "," + "Actual Nonce: " + idTokenObj.nonce);
                this.logger.error("Nonce Mismatch.Expected Nonce: " + this.cacheStorage.getItem(Constants.nonceIdToken, this.inCookie) + "," + "Actual Nonce: " + idTokenObj.nonce);
                error = ClientAuthError.createNonceMismatchError(this.cacheStorage.getItem(Constants.nonceIdToken, this.inCookie), idTokenObj.nonce);
              }
              // Save the token
              else {
                this.cacheStorage.setItem(Constants.idTokenKey, hashParams[Constants.idToken]);
                this.cacheStorage.setItem(Constants.msalClientInfo, clientInfo);

                // Save idToken as access token for app itself
                this.saveAccessToken(response, authority, hashParams, clientInfo, idTokenObj);
              }
            } else {
              authorityKey = stateInfo.state;
              acquireTokenAccountKey = stateInfo.state;

              this.logger.error("Invalid id_token received in the response");
              error = ClientAuthError.createInvalidIdTokenError(idTokenObj);
              this.cacheStorage.setItem(Constants.msalError, error.errorCode);
              this.cacheStorage.setItem(Constants.msalErrorDescription, error.errorMessage);
            }
        }
      }
      // State mismatch - unexpected/invalid state
      else {
        authorityKey = stateInfo.state;
        acquireTokenAccountKey = stateInfo.state;

        const expectedState = this.cacheStorage.getItem(Constants.stateLogin, this.inCookie);
        this.logger.error("State Mismatch.Expected State: " + expectedState + "," + "Actual State: " + stateInfo.state);
        error = ClientAuthError.createInvalidStateError(stateInfo.state, expectedState);
        this.cacheStorage.setItem(Constants.msalError, error.errorCode);
        this.cacheStorage.setItem(Constants.msalErrorDescription, error.errorMessage);
      }
    }

    this.cacheStorage.setItem(Constants.renewStatus + stateInfo.state, Constants.tokenRenewStatusCompleted);
    this.cacheStorage.removeAcquireTokenEntries(stateInfo.state);
    // this is required if navigateToLoginRequestUrl=false
    if (this.inCookie) {
      this.cacheStorage.setItemCookie(authorityKey, "", -1);
      this.cacheStorage.clearCookie();
    }
    if (error) {
      throw error;
    }

    if (!response) {
        throw AuthError.createUnexpectedError("Response is null");
    }
    return response;
  }
  /* tslint:enable:no-string-literal */

  //#endregion

  //#region Account

  /**
   * Returns the signed in account
   * (the account object is created at the time of successful login)
   * or null when no state is found
   * @returns {@link Account} - the account object stored in MSAL
   */
  getAccount(): Account {
    // if a session already exists, get the account from the session
    if (this.account) {
      return this.account;
    }

    // frame is used to get idToken and populate the account for the given session
    const rawIdToken = this.cacheStorage.getItem(Constants.idTokenKey);
    const rawClientInfo = this.cacheStorage.getItem(Constants.msalClientInfo);

    if (!StringUtils.isEmpty(rawIdToken) && !StringUtils.isEmpty(rawClientInfo)) {
      const idToken = new IdToken(rawIdToken);
      const clientInfo = new ClientInfo(rawClientInfo);
      this.account = Account.createAccount(idToken, clientInfo);
      return this.account;
    }
    // if login not yet done, return null
    return null;
  }

  /**
   * @hidden
   *
   * Extracts state value from the accountState sent with the authentication request.
   * @returns {string} scope.
   * @ignore
   */
  getAccountState (state: string) {
    if (state) {
      const splitIndex = state.indexOf("|");
      if (splitIndex > -1 && splitIndex + 1 < state.length) {
        return state.substring(splitIndex + 1);
      }
    }
    return state;
  }

  /**
   * Use to get a list of unique accounts in MSAL cache based on homeAccountIdentifier.
   *
   * @param {@link Array<Account>} Account - all unique accounts in MSAL cache.
   */
  getAllAccounts(): Array<Account> {
    const accounts: Array<Account> = [];
    const accessTokenCacheItems = this.cacheStorage.getAllAccessTokens(Constants.clientId, Constants.homeAccountIdentifier);

    for (let i = 0; i < accessTokenCacheItems.length; i++) {
      const idToken = new IdToken(accessTokenCacheItems[i].value.idToken);
      const clientInfo = new ClientInfo(accessTokenCacheItems[i].value.homeAccountIdentifier);
      const account: Account = Account.createAccount(idToken, clientInfo);
      accounts.push(account);
    }

    return this.getUniqueAccounts(accounts);
  }

  /**
   * @hidden
   *
   * Used to filter accounts based on homeAccountIdentifier
   * @param {Array<Account>}  Accounts - accounts saved in the cache
   * @ignore
   */
  private getUniqueAccounts(accounts: Array<Account>): Array<Account> {
    if (!accounts || accounts.length <= 1) {
      return accounts;
    }

    const flags: Array<string> = [];
    const uniqueAccounts: Array<Account> = [];
    for (let index = 0; index < accounts.length; ++index) {
      if (accounts[index].homeAccountIdentifier && flags.indexOf(accounts[index].homeAccountIdentifier) === -1) {
        flags.push(accounts[index].homeAccountIdentifier);
        uniqueAccounts.push(accounts[index]);
      }
    }

    return uniqueAccounts;
  }

  //#endregion

  //#region Scopes (Extract to Scopes.ts)

  // Note: "this" dependency in this section is minimal.
  // If pCacheStorage is separated from the class object, or passed as a fn param, scopesUtils.ts can be created

  /**
   * @hidden
   *
   * Used to validate the scopes input parameter requested  by the developer.
   * @param {Array<string>} scopes - Developer requested permissions. Not all scopes are guaranteed to be included in the access token returned.
   * @param {boolean} scopesRequired - Boolean indicating whether the scopes array is required or not
   * @ignore
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
   * @hidden
   *
   * Extracts scope value from the state sent with the authentication request.
   * @param {string} state
   * @returns {string} scope.
   * @ignore
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
   * @ignore
   * Appends extraScopesToConsent if passed
   * @param {@link AuthenticationParameters}
   */
  private appendScopes(request: AuthenticationParameters): Array<string> {

    let scopes: Array<string>;

    if (request && request.scopes) {
        if (request.extraScopesToConsent) {
            scopes = [...request.scopes, ...request.extraScopesToConsent];
        }
        else {
        scopes = request.scopes;
        }
    }

    return scopes;
  }

  //#endregion

  //#region Angular

  /**
   * @hidden
   *
   * Broadcast messages - Used only for Angular?  *
   * @param eventName
   * @param data
   */
  private broadcast(eventName: string, data: string) {
    const evt = new CustomEvent(eventName, { detail: data });
    window.dispatchEvent(evt);
  }

  /**
   * @hidden
   *
   * Helper function to retrieve the cached token
   *
   * @param scopes
   * @param {@link Account} account
   * @param state
   * @return {@link AuthResponse} AuthResponse
   */
  protected getCachedTokenInternal(scopes : Array<string> , account: Account, state: string): AuthResponse {
    // Get the current session's account object
    const accountObject: Account = account || this.getAccount();
    if (!accountObject) {
        return null;
    }

    // Construct AuthenticationRequest based on response type
    const newAuthority = this.authorityInstance ? this.authorityInstance : AuthorityFactory.CreateInstance(this.authority, this.config.auth.validateAuthority);
    const responseType = this.getTokenType(accountObject, scopes, true);
    const serverAuthenticationRequest = new ServerRequestParameters(
      newAuthority,
      this.clientId,
      scopes,
      responseType,
      this.getRedirectUri(),
      state
    );

    // get cached token
    return this.getCachedToken(serverAuthenticationRequest, account);
  }

  /**
   * @hidden
   *
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
   * Return boolean flag to developer to help inform if login is in progress
   * @returns {boolean} true/false
   */
  public getLoginInProgress(): boolean {
    const pendingCallback = this.cacheStorage.getItem(Constants.urlHash);
    if (pendingCallback) {
        return true;
    }
    return this.loginInProgress;
  }

  /**
   * @hidden
   * @ignore
   *
   * @param loginInProgress
   */
  protected setloginInProgress(loginInProgress : boolean) {
    this.loginInProgress = loginInProgress;
  }

  /**
   * @hidden
   * @ignore
   *
   * returns the status of acquireTokenInProgress
   */
  protected getAcquireTokenInProgress(): boolean {
      return this.acquireTokenInProgress;
  }

  /**
   * @hidden
   * @ignore
   *
   * @param acquireTokenInProgress
   */
  protected setAcquireTokenInProgress(acquireTokenInProgress : boolean) {
      this.acquireTokenInProgress = acquireTokenInProgress;
  }

  /**
   * @hidden
   * @ignore
   *
   * returns the logger handle
   */
  protected getLogger() {
      return this.config.system.logger;
  }

  //#endregion

  //#region Getters and Setters

  /**
   *
   * Use to get the redirect uri configured in MSAL or null.
   * Evaluates redirectUri if its a function, otherwise simply returns its value.
   * @returns {string} redirect URL
   *
   */
  public getRedirectUri(): string {
    if (typeof this.config.auth.redirectUri === "function") {
      return this.config.auth.redirectUri();
    }
    return this.config.auth.redirectUri;
  }

  /**
   * Use to get the post logout redirect uri configured in MSAL or null.
   * Evaluates postLogoutredirectUri if its a function, otherwise simply returns its value.
   *
   * @returns {string} post logout redirect URL
   */
  public getPostLogoutRedirectUri(): string {
    if (typeof this.config.auth.postLogoutRedirectUri === "function") {
      return this.config.auth.postLogoutRedirectUri();
    }
    return this.config.auth.postLogoutRedirectUri;
  }

  /**
   * Use to get the current {@link Configuration} object in MSAL
   *
   * @returns {@link Configuration}
   */
  public getCurrentConfiguration(): Configuration {
    if (!this.config) {
      throw ClientConfigurationError.createNoSetConfigurationError();
    }
    return this.config;
  }

  //#endregion

  //#region String Util (Should be extracted to Utils.ts)

  /**
   * @hidden
   * @ignore
   *
   * extract URI from the host
   *
   * @param {string} URI
   * @returns {string} host from the URI
   */
  private getHostFromUri(uri: string): string {
    // remove http:// or https:// from uri
    let extractedUri = String(uri).replace(/^(https?:)\/\//, "");
    extractedUri = extractedUri.split("/")[0];
    return extractedUri;
  }

  /**
   * @hidden
   * @ignore
   *
   * Utils function to create the Authentication
   * @param {@link account} account object
   * @param scopes
   * @param silentCall
   *
   * @returns {string} token type: id_token or access_token
   *
   */
  private getTokenType(accountObject: Account, scopes: string[], silentCall: boolean): string {

    // if account is passed and matches the account object/or set to getAccount() from cache
    // if client-id is passed as scope, get id_token else token/id_token_token (in case no session exists)
    let tokenType: string;

    // acquireTokenSilent
    if (silentCall) {
      if (Account.compareAccounts(accountObject, this.getAccount())) {
        tokenType = (scopes.indexOf(this.config.auth.clientId) > -1) ? ResponseTypes.id_token : ResponseTypes.token;
      }
      else {
        tokenType  = (scopes.indexOf(this.config.auth.clientId) > -1) ? ResponseTypes.id_token : ResponseTypes.id_token_token;
      }

      return tokenType;
    }
    // all other cases
    else {
      if (!Account.compareAccounts(accountObject, this.getAccount())) {
        tokenType = ResponseTypes.id_token_token;
      }
      else {
        tokenType = (scopes.indexOf(this.clientId) > -1) ? ResponseTypes.id_token : ResponseTypes.token;
      }

      return tokenType;
    }

  }

  /**
   * @hidden
   * @ignore
   *
   * Sets the cachekeys for and stores the account information in cache
   * @param account
   * @param state
   * @hidden
   */
  private setAccountCache(account: Account, state: string) {

    // Cache acquireTokenAccountKey
    let accountId = account ? this.getAccountId(account) : Constants.no_account;

    const acquireTokenAccountKey = Storage.generateAcquireTokenAccountKey(accountId, state);
    this.cacheStorage.setItem(acquireTokenAccountKey, JSON.stringify(account));
  }

  /**
   * @hidden
   * @ignore
   *
   * Sets the cacheKey for and stores the authority information in cache
   * @param state
   * @param authority
   * @hidden
   */
  private setAuthorityCache(state: string, authority: string) {
    // Cache authorityKey
    const authorityKey = Storage.generateAuthorityKey(state);
    this.cacheStorage.setItem(authorityKey, UrlUtils.CanonicalizeUri(authority), this.inCookie);
  }

  /**
   * Updates account, authority, and nonce in cache
   * @param serverAuthenticationRequest
   * @param account
   * @hidden
   * @ignore
   */
  private updateCacheEntries(serverAuthenticationRequest: ServerRequestParameters, account: Account, loginStartPage?: any) {
    // Cache account and authority
    if (loginStartPage) {
      // Cache the state, nonce, and login request data
      this.cacheStorage.setItem(Constants.loginRequest, loginStartPage, this.inCookie);
      this.cacheStorage.setItem(Constants.loginError, "");

      this.cacheStorage.setItem(Constants.stateLogin, serverAuthenticationRequest.state, this.inCookie);

      this.cacheStorage.setItem(Constants.msalError, "");
      this.cacheStorage.setItem(Constants.msalErrorDescription, "");
    } else {
      this.setAccountCache(account, serverAuthenticationRequest.state);
    }
    // Cache authorityKey
    this.setAuthorityCache(serverAuthenticationRequest.state, serverAuthenticationRequest.authority);

    // Cache nonce
    this.cacheStorage.setItem(Constants.nonceIdToken, serverAuthenticationRequest.nonce, this.inCookie);
  }

  /**
   * Returns the unique identifier for the logged in account
   * @param account
   * @hidden
   * @ignore
   */
  private getAccountId(account: Account): any {
    //return `${account.accountIdentifier}` + Constants.resourceDelimiter + `${account.homeAccountIdentifier}`;
    let accountId: string;
    if (!StringUtils.isEmpty(account.homeAccountIdentifier)) {
         accountId = account.homeAccountIdentifier;
    }
    else {
        accountId = Constants.no_account;
    }

    return accountId;
  }

  /**
   * @hidden
   * @ignore
   *
   * Construct 'tokenRequest' from the available data in adalIdToken
   * @param extraQueryParameters
   * @hidden
   */
  private buildIDTokenRequest(request: AuthenticationParameters): AuthenticationParameters {

    let tokenRequest: AuthenticationParameters = {
      scopes: [this.clientId],
      authority: this.authority,
      account: this.getAccount(),
      extraQueryParameters: request.extraQueryParameters
    };

    return tokenRequest;
  }

 //#endregion

  private getTelemetryManagerFromConfig(config: TelemetryOptions, clientId: string): TelemetryManager {
    if (!config) { // if unset
      return null
    }
    // if set then validate
    const { applicationName, applicationVersion, telemetryEmitter } = config;
    if (!applicationName || !applicationVersion || ! telemetryEmitter) {
      throw ClientConfigurationError.createTelemetryConfigError(config);
    }
    // if valid then construct
    const telemetryPlatform: TelemetryPlatform = {
      sdk: "msal.js", // TODO need to be able to override this for angular, react, etc
      sdkVersion: libraryVersion(),
      applicationName,
      applicationVersion
    };
    const telemetryManagerConfig: TelemetryConfig = {
      platform: telemetryPlatform,
      clientId: clientId
    };
    return new TelemetryManager(telemetryManagerConfig, telemetryEmitter);
  }
}
