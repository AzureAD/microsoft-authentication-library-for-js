import {Inject, Injectable, InjectionToken} from "@angular/core";
import "rxjs/add/observable/of";
import "rxjs/add/operator/do";
import "rxjs/add/operator/delay";
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

export const MSAL_CONFIG = new InjectionToken<string>("MSAL_CONFIG");
export const MSAL_CONFIG_ANGULAR = new InjectionToken<string>("MSAL_CONFIG_ANGULAR");

const buildMsalConfig = (config: Configuration) : Configuration => {
    return {
        ...config,
        framework: {
            ...config.framework,
            isAngular: true
        }
    }
}

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
                    if (this.msalConfig.framework.unprotectedResources) {
                        if (!this.isUnprotectedResource(router.config[i].path) && !this.isEmpty(router.config[i].path)) {
                            this.msalConfig.framework.unprotectedResources.push(router.config[i].path);
                        }
                    }
                }
            }
        })

    }

    private isUnprotectedResource(url: string) {
        if (this.msalConfig && this.msalConfig.framework.unprotectedResources) {
            for (var i = 0; i < this.msalConfig.framework.unprotectedResources.length; i++) {
                if (url.indexOf(this.msalConfig.framework.unprotectedResources[i]) > -1) {
                    return true;
                }
            }
        }
        return false;
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

    public getLogger(): Logger {
        return super.getLogger();
    }

    public getScopesForEndpoint(endpoint: string): string[] {
        return super.getScopesForEndpoint(endpoint);
    }

    public clearCacheForScope(accessToken: string) {
        return super.clearCacheForScope(accessToken);
    }
}

