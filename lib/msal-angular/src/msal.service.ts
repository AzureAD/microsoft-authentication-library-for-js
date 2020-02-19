import {Inject, Injectable, InjectionToken} from "@angular/core";
import {
    UserAgentApplication,
    Configuration,
    AuthenticationParameters,
    AuthResponse,
    AuthError,
    Logger
} from "msal";
import {
     Router
} from "@angular/router";
import {BroadcastService} from "./broadcast.service";
import {MSALError} from "./MSALError";
import { AuthCache } from "msal/lib-commonjs/cache/AuthCache";
import { MsalAngularConfiguration } from "./msal-angular.configuration";
import { authResponseCallback, errorReceivedCallback, tokenReceivedCallback } from "msal/lib-commonjs/UserAgentApplication";
import { UrlUtils } from "msal/lib-commonjs/utils/UrlUtils";

export const MSAL_CONFIG = new InjectionToken<string>("MSAL_CONFIG");
export const MSAL_CONFIG_ANGULAR = new InjectionToken<string>("MSAL_CONFIG_ANGULAR");

const buildMsalConfig = (config: Configuration) : Configuration => {
    return {
        ...config,
        framework: {
            ...config.framework,
            isAngular: true
        }
    };
};

@Injectable()
export class MsalService extends UserAgentApplication {

    constructor(
        @Inject(MSAL_CONFIG) private msalConfig: Configuration,
        @Inject(MSAL_CONFIG_ANGULAR) private msalAngularConfig: MsalAngularConfiguration,
        private router: Router,
        private broadcastService: BroadcastService
    ) {
        super(buildMsalConfig(msalConfig));

        window.addEventListener("msal:popUpHashChanged", (e: CustomEvent) => {
            this.getLogger().verbose("popUpHashChanged ");
        });

        window.addEventListener('msal:popUpClosed', (e: CustomEvent) => {
            var errorParts = e.detail.split('|');
            var msalError = new MSALError(errorParts[0], errorParts[1]);
            if (this.getLoginInProgress()) {
                broadcastService.broadcast('msal:loginFailure', msalError);
                this.setloginInProgress(false);
            }
            else if (this.getAcquireTokenInProgress()) {
                broadcastService.broadcast('msal:acquireTokenFailure', msalError);
                this.setAcquireTokenInProgress(false);
            }
        });

        this.router.events.subscribe(event => {
            for (var i = 0; i < router.config.length; i++) {
                if (!router.config[i].canActivate) {
                    if (this.msalAngularConfig.unprotectedResources) {
                        if (!this.isUnprotectedResource(router.config[i].path) && !this.isEmpty(router.config[i].path)) {
                            this.msalAngularConfig.unprotectedResources.push(router.config[i].path);
                        }
                    }
                }
            }
        });
    }

    private isUnprotectedResource(url: string): boolean {
        const unprotectedResources = (this.msalConfig.framework && this.msalConfig.framework.unprotectedResources) || this.msalAngularConfig.unprotectedResources || [];

        return unprotectedResources.some(resource => url.indexOf(resource) > -1);
    }

    private isEmpty(str: string): boolean {
        return (typeof str === "undefined" || !str || 0 === str.length);
    }

    public getCacheStorage(): AuthCache {
        return this.cacheStorage;
    }

    public loginPopup(request?: AuthenticationParameters): Promise<any> {
        return super.loginPopup(request)
            .then((authResponse: AuthResponse) => {
                this.broadcastService.broadcast("msal:loginSuccess", authResponse);
                return authResponse;
            })
            .catch((error: AuthError) => {
                this.broadcastService.broadcast("msal:loginFailure", error);
                this.getLogger().error("Error during login:\n" + error.errorMessage);
                throw error;
            });
    }

    public acquireTokenSilent(request: AuthenticationParameters): Promise<AuthResponse> {
        return super.acquireTokenSilent(request)
            .then((authResponse: AuthResponse) => {
                this.broadcastService.broadcast('msal:acquireTokenSuccess', authResponse);
                return authResponse;
            })
            .catch((error: AuthError) => {
                this.broadcastService.broadcast('msal:acquireTokenFailure', error);
                this.getLogger().error('Error when acquiring token for scopes: ' + request.scopes + " " + error);
                throw error;
            });

    }

    public acquireTokenPopup(request: AuthenticationParameters): Promise<AuthResponse> {
        return super.acquireTokenPopup(request)
            .then((authResponse: AuthResponse) => {
                this.broadcastService.broadcast('msal:acquireTokenSuccess', authResponse);
                return authResponse;
            })
            .catch((error: AuthError) => {
                this.broadcastService.broadcast('msal:acquireTokenFailure', error);
                this.getLogger().error('Error when acquiring token for scopes : ' + request.scopes +" "+  error);
                throw error;
            });
    }

    handleRedirectCallback(tokenReceivedCallback: tokenReceivedCallback, errorReceivedCallback: errorReceivedCallback): void;
    handleRedirectCallback(authCallback: authResponseCallback): void;
    handleRedirectCallback(authOrTokenCallback: authResponseCallback | tokenReceivedCallback, errorReceivedCallback?: errorReceivedCallback): void {
        super.handleRedirectCallback((authError: AuthError, authResponse: AuthResponse) => {
            if (authResponse) {
                if (authResponse.tokenType === "id_token") {
                    this.broadcastService.broadcast("msal:loginSuccess", authResponse);
                } else {
                    this.broadcastService.broadcast("msal:acquireTokenSuccess", authResponse);
                }

                if (errorReceivedCallback) {
                    (authOrTokenCallback as tokenReceivedCallback)(authResponse);
                } else {
                    (authOrTokenCallback as authResponseCallback)(null, authResponse);
                }

            } else if (authError) {
                if (authResponse.tokenType === "id_token") {
                    this.broadcastService.broadcast("msal:loginFailure", authError);

                } else {
                    this.broadcastService.broadcast("msal:acquireTokenFailure", authError);
                }

                if (errorReceivedCallback) {
                    errorReceivedCallback(authError, authResponse.accountState);
                } else {
                    (authOrTokenCallback as authResponseCallback)(authError);
                }

            }
        });
    }

    public clearCacheForScope(accessToken: string) {
        return super.clearCacheForScope(accessToken);
    }

    public getScopesForEndpoint(endpoint: string) : Array<string> {
        if (this.msalConfig.framework && this.msalConfig.framework.unprotectedResources) {
            this.getLogger().info("msalConfig.framework.unprotectedResources is deprecated, use msalAngularConfig.unprotectedResources");
        }

        // if user specified list of unprotectedResources, no need to send token to these endpoints, return null.
        const isUnprotected = this.isUnprotectedResource(endpoint);
        if (isUnprotected) {
            return null;
        }

        if (this.msalConfig.framework && this.msalConfig.framework.protectedResourceMap) {
            this.getLogger().info("msalConfig.framework.protectedResourceMap is deprecated, use msalAngularConfig.protectedResourceMap");
        }

        const protectedResourceMap = (this.msalConfig.framework && this.msalConfig.framework.protectedResourceMap) || new Map(this.msalAngularConfig.protectedResourceMap);

        // process all protected resources and send the matched one
        const keyForEndpoint = Array.from(protectedResourceMap.keys()).find(key => endpoint.indexOf(key) > -1);
        if (keyForEndpoint) {
            return protectedResourceMap.get(keyForEndpoint);
        }

        /*
         * default resource will be clientid if nothing specified
         * App will use idtoken for calls to itself
         * check if it's staring from http or https, needs to match with app host
         */
        if (endpoint.indexOf("http://") > -1 || endpoint.indexOf("https://") > -1) {
            if (UrlUtils.getHostFromUri(endpoint) === UrlUtils.getHostFromUri(super.getRedirectUri())) {
                return new Array<string>(this.msalConfig.auth.clientId);
            }
        } else {
            /*
             * in angular level, the url for $http interceptor call could be relative url,
             * if it's relative call, we'll treat it as app backend call.
             */
            return new Array<string>(this.msalConfig.auth.clientId);
        }

        // if not the app's own backend or not a domain listed in the endpoints structure
        return null;
    }
}

