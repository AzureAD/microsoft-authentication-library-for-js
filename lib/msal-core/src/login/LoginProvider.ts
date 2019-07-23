import { AuthenticationParameters } from "../AuthenticationParameters";
import { UserAgentApplication, ResponseTypes } from "../UserAgentApplication";
import { ClientConfigurationError } from "../error/ClientConfigurationError";
import { ClientAuthError } from "../error/ClientAuthError";
import { buildResponseStateOnly } from "../AuthResponse";
import { Utils } from "../Utils";
import { Account } from "../Account";
import { Logger } from "../Logger";
import { ServerRequestParameters } from "../ServerRequestParameters";
import { Constants } from "../Constants";

export default class LoginProvider {

    private userAgentApplicationInstance: UserAgentApplication;
    private logger: Logger;

    constructor(uaaInstance: UserAgentApplication, logger: Logger) {
        this.userAgentApplicationInstance = uaaInstance;
        this.logger = logger;
    }

    public loginRedirect(request: AuthenticationParameters): void {
        // Throw error if callbacks are not set before redirect
        if (!this.userAgentApplicationInstance.redirectCallbacksAreSet()) {
            throw ClientConfigurationError.createRedirectCallbacksNotSetError();
        }
        // Creates navigate url; saves value in cache; redirect user to AAD
        if (this.userAgentApplicationInstance.loginIsInProgress()) {
            this.userAgentApplicationInstance.redirectErrorHandler(
                ClientAuthError.createLoginInProgressError(), buildResponseStateOnly(request && request.state)
            );
            return;
        }

        // if extraScopesToConsent is passed, append them to the login request
        let scopes: Array<string> = this.userAgentApplicationInstance.appendScopes(request);

        // Validate and filter scopes (the validate function will throw if validation fails)
        this.userAgentApplicationInstance.validateInputScope(scopes, false);

        const account: Account = this.userAgentApplicationInstance.getAccount();

        // defer queryParameters generation to Helper if developer passes account/sid/login_hint
        if (Utils.isSSOParam(request)) {
            // if account is not provided, we pass null
            this.loginRedirectHelper(account, request, scopes);
        }
        // else handle the library data
        else {
            // extract ADAL id_token if exists
            let adalIdToken = this.userAgentApplicationInstance.extractADALIdToken();

            // silent login if ADAL id_token is retrieved successfully - SSO
            if (adalIdToken && !scopes) {
                this.logger.info("ADAL's idToken exists. Extracting login information from ADAL's idToken ");
                let tokenRequest: AuthenticationParameters = this.userAgentApplicationInstance.buildIDTokenRequest(request);

                this.userAgentApplicationInstance.setSilentLogin(true);
                this.userAgentApplicationInstance.acquireTokenSilent(tokenRequest).then(response => {
                    this.userAgentApplicationInstance.setSilentLogin(false);
                    this.logger.info("Unified cache call is successful");

                    if (this.userAgentApplicationInstance.redirectCallbacksAreSet()) {
                        this.userAgentApplicationInstance.redirectSuccessHandler(response);
                    }
                    return;
                }, (error) => {
                    this.userAgentApplicationInstance.setSilentLogin(false);
                    this.logger.error("Error occurred during unified cache ATS");

                    // call the loginRedirectHelper later with no user account context
                    this.loginRedirectHelper(null, request, scopes);
                });
            }
            // else proceed to login
            else {
            // call the loginRedirectHelper later with no user account context
            this.loginRedirectHelper(null, request, scopes);
            }
        }
    }

    private loginRedirectHelper(account: Account, request?: AuthenticationParameters, scopes?: Array<string>) {
        // Track login in progress
        this.userAgentApplicationInstance.setLoginInProgress(true);

        this.userAgentApplicationInstance.authorityInstance.resolveEndpointsAsync().then(() => {

          // create the Request to be sent to the Server
          let serverAuthenticationRequest = new ServerRequestParameters(
            this.userAgentApplicationInstance.authorityInstance,
            this.userAgentApplicationInstance.clientId,
            scopes,
            ResponseTypes.id_token,
            this.userAgentApplicationInstance.getRedirectUri(),
            request && request.state
          );

          // populate QueryParameters (sid/login_hint/domain_hint) and any other extraQueryParameters set by the developer
          serverAuthenticationRequest = this.userAgentApplicationInstance.populateQueryParams(account, request, serverAuthenticationRequest);

          // if the user sets the login start page - angular only??
          let loginStartPage = this.userAgentApplicationInstance.cacheStorage.getItem(Constants.angularLoginRequest);
          if (!loginStartPage || loginStartPage === "") {
            loginStartPage = window.location.href;
          } else {
            this.userAgentApplicationInstance.cacheStorage.setItem(Constants.angularLoginRequest, "");
          }

          this.userAgentApplicationInstance.updateCacheEntries(serverAuthenticationRequest, account, loginStartPage);

          // build URL to navigate to proceed with the login
          let urlNavigate = serverAuthenticationRequest.createNavigateUrl(scopes) + Constants.response_mode_fragment;

          // Redirect user to login URL
          this.userAgentApplicationInstance.promptUser(urlNavigate);
        }).catch((err) => {
          this.logger.warning("could not resolve endpoints");
          this.userAgentApplicationInstance.redirectErrorHandler(ClientAuthError.createEndpointResolutionError(err.toString), buildResponseStateOnly(request && request.state));
        });
      }

}