/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor
} from "@angular/common/http";
import { Location } from "@angular/common";
import { Observable, EMPTY, of } from "rxjs";
import { switchMap, catchError } from "rxjs/operators";
import { MsalService } from "./msal.service";
import { AccountInfo, AuthenticationResult, BrowserConfigurationAuthError, InteractionType, StringUtils, UrlString } from "@azure/msal-browser";
import { Injectable, Inject } from "@angular/core";
import { MSAL_INTERCEPTOR_CONFIG } from "./constants";
import { MsalInterceptorAuthRequest, MsalInterceptorConfiguration } from "./msal.interceptor.config";

@Injectable()
export class MsalInterceptor implements HttpInterceptor {
    constructor(
        @Inject(MSAL_INTERCEPTOR_CONFIG) private msalInterceptorConfig: MsalInterceptorConfiguration,
        private authService: MsalService,
        private location: Location
    ) {}

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (this.msalInterceptorConfig.interactionType !== InteractionType.Popup && this.msalInterceptorConfig.interactionType !== InteractionType.Redirect) {
            throw new BrowserConfigurationAuthError("invalid_interaction_type", "Invalid interaction type provided to MSAL Interceptor. InteractionType.Popup, InteractionType.Redirect must be provided in the msalInterceptorConfiguration");
        }

        this.authService.getLogger().verbose("MSAL Interceptor activated");
        const scopes = this.getScopesForEndpoint(req.url);

        // If no scopes for endpoint, does not acquire token
        if (!scopes || scopes.length === 0) {
            this.authService.getLogger().verbose("Interceptor - no scopes for endpoint");
            return next.handle(req);
        }

        // Sets account as active account or first account
        let account: AccountInfo;
        if (!!this.authService.instance.getActiveAccount()) {
            this.authService.getLogger().verbose("Interceptor - active account selected");
            account = this.authService.instance.getActiveAccount();
        } else {
            this.authService.getLogger().verbose("Interceptor - no active account, fallback to first account");
            account = this.authService.instance.getAllAccounts()[0];
        }

        const authRequest = typeof this.msalInterceptorConfig.authRequest === "function"
            ? this.msalInterceptorConfig.authRequest(this.authService, req, { account: account })
            : { ...this.msalInterceptorConfig.authRequest, account };

        this.authService.getLogger().info(`Interceptor - ${scopes.length} scopes found for endpoint`);
        this.authService.getLogger().infoPii(`Interceptor - [${scopes}] scopes found for ${req.url}`);

        // Note: For MSA accounts, include openid scope when calling acquireTokenSilent to return idToken
        return this.authService.acquireTokenSilent({...authRequest, scopes, account })
            .pipe(
                catchError(() => {
                    this.authService.getLogger().error("Interceptor - acquireTokenSilent rejected with error. Invoking interaction to resolve.");
                    return this.acquireTokenInteractively(authRequest, scopes);
                }),
                switchMap((result: AuthenticationResult)  => {
                    if (!result.accessToken) {
                        this.authService.getLogger().error("Interceptor - acquireTokenSilent resolved with null access token. Known issue with B2C tenants, invoking interaction to resolve.");
                        return this.acquireTokenInteractively(authRequest, scopes);
                    }
                    return of(result);
                }),
                switchMap((result: AuthenticationResult) => {
                    this.authService.getLogger().verbose("Interceptor - setting authorization headers");
                    const headers = req.headers
                        .set("Authorization", `Bearer ${result.accessToken}`);

                    const requestClone = req.clone({headers});
                    return next.handle(requestClone);
                })
            );
    }

    /**
     * Invoke interaction for the given set of scopes
     * @param scopes Array of scopes for the request
     * @returns Result from the interactive request
     */
    private acquireTokenInteractively(authRequest: MsalInterceptorAuthRequest, scopes: string[]): Observable<AuthenticationResult> {
        if (this.msalInterceptorConfig.interactionType === InteractionType.Popup) {
            this.authService.getLogger().verbose("Interceptor - error acquiring token silently, acquiring by popup");
            return this.authService.acquireTokenPopup({ ...authRequest, scopes });
        }
        this.authService.getLogger().verbose("Interceptor - error acquiring token silently, acquiring by redirect");
        const redirectStartPage = window.location.href;
        this.authService.acquireTokenRedirect({...authRequest, scopes, redirectStartPage });
        return EMPTY;
    }

    /**
     * Looks up the scopes for the given endpoint from the protectedResourceMap
     * @param endpoint Url of the request
     * @returns Array of scopes, or null if not found
     *
     */
    private getScopesForEndpoint(endpoint: string): Array<string>|null {
        this.authService.getLogger().verbose("Interceptor - getting scopes for endpoint");

        // Ensures endpoints and protected resources compared are normalized
        const normalizedEndpoint = this.location.normalize(endpoint);

        const protectedResourcesArray = Array.from(this.msalInterceptorConfig.protectedResourceMap.keys());

        const keyMatchesEndpointArray = protectedResourcesArray.filter(key => {
            const normalizedKey = this.location.normalize(key);
            
            // Normalized key should include query strings if applicable
            const keyComponents = new UrlString(key).getUrlComponents();
            const relativeNormalizedKey = keyComponents.QueryString ? `${keyComponents.AbsolutePath}?${keyComponents.QueryString}` : this.location.normalize(keyComponents.AbsolutePath);

            // Relative endpoint not applicable, matching endpoint with protected resource. StringUtils.matchPattern accounts for wildcards
            if (relativeNormalizedKey === "" || relativeNormalizedKey === "/*") {
                return StringUtils.matchPattern(normalizedKey, normalizedEndpoint);
            } else {
                // Matching endpoint with both protected resource and relative url of protected resource
                return StringUtils.matchPattern(normalizedKey, normalizedEndpoint) || StringUtils.matchPattern(relativeNormalizedKey, normalizedEndpoint);
            }
        });

        // Process all protected resources and send the first matched resource
        if (keyMatchesEndpointArray.length > 0) {
            const keyForEndpoint = keyMatchesEndpointArray[0];
            if (keyForEndpoint) {
                return this.msalInterceptorConfig.protectedResourceMap.get(keyForEndpoint);
            }
        }

        return null;
    }

}
