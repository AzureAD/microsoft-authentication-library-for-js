/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Injectable, Inject } from "@angular/core";
import { Location, DOCUMENT } from "@angular/common";
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
} from "@angular/common/http"; // eslint-disable-line import/no-unresolved
import {
  AccountInfo,
  AuthenticationResult,
  BrowserConfigurationAuthError,
  InteractionStatus,
  InteractionType,
} from "@azure/msal-browser";
import { Observable, EMPTY, of } from "rxjs";
import { switchMap, catchError, take, filter } from "rxjs/operators";
import { MsalService } from "./msal.service";
import {
  MsalInterceptorAuthRequest,
  MsalInterceptorConfiguration,
  ProtectedResourceScopes,
} from "./msal.interceptor.config";
import { MsalBroadcastService } from "./msal.broadcast.service";
import { MSAL_INTERCEPTOR_CONFIG } from "./constants";

@Injectable()
export class MsalInterceptor implements HttpInterceptor {
  private _document: Document;

  constructor(
    @Inject(MSAL_INTERCEPTOR_CONFIG)
    private msalInterceptorConfig: MsalInterceptorConfiguration,
    private authService: MsalService,
    private location: Location,
    private msalBroadcastService: MsalBroadcastService,
    @Inject(DOCUMENT) document: Document
  ) {
    this._document = document;

    if (this.msalInterceptorConfig.strictMatching === undefined) {
      this.authService
        .getLogger()
        .warning(
          `[MSAL] strictMatching is enabled by default. See: https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/msal-interceptor.md#strict-matching-strictmatching`,
          ""
        );
    }
  }

  intercept(
    req: HttpRequest<any>, // eslint-disable-line @typescript-eslint/no-explicit-any
    next: HttpHandler
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Observable<HttpEvent<any>> {
    if (
      this.msalInterceptorConfig.interactionType !== InteractionType.Popup &&
      this.msalInterceptorConfig.interactionType !== InteractionType.Redirect
    ) {
      throw new BrowserConfigurationAuthError(
        "invalid_interaction_type",
        "",
        "Invalid interaction type provided to MSAL Interceptor. InteractionType.Popup, InteractionType.Redirect must be provided in the msalInterceptorConfiguration"
      );
    }

    this.authService.getLogger().verbose("MSAL Interceptor activated", "");
    const scopes = this.getScopesForEndpoint(req.url, req.method);

    // If no scopes for endpoint, does not acquire token
    if (!scopes || scopes.length === 0) {
      this.authService
        .getLogger()
        .verbose("Interceptor - no scopes for endpoint", "");
      return next.handle(req);
    }

    // Sets account as active account or first account
    let account: AccountInfo;
    const activeAccount = this.authService.instance.getActiveAccount();
    if (activeAccount) {
      this.authService
        .getLogger()
        .verbose("Interceptor - active account selected", "");
      account = activeAccount;
    } else {
      this.authService
        .getLogger()
        .verbose(
          "Interceptor - no active account, fallback to first account",
          ""
        );
      account = this.authService.instance.getAllAccounts()[0];
    }

    const authRequest =
      typeof this.msalInterceptorConfig.authRequest === "function"
        ? this.msalInterceptorConfig.authRequest(this.authService, req, {
            account: account,
          })
        : { ...this.msalInterceptorConfig.authRequest, account };

    this.authService
      .getLogger()
      .info(`Interceptor - ${scopes.length} scopes found for endpoint`, "");
    this.authService
      .getLogger()
      .infoPii(`Interceptor - [${scopes}] scopes found for ${req.url}`, "");

    return this.acquireToken(authRequest, scopes, account).pipe(
      switchMap((result: AuthenticationResult) => {
        this.authService
          .getLogger()
          .verbose("Interceptor - setting authorization headers", "");
        const headers = req.headers.set(
          "Authorization",
          `Bearer ${result.accessToken}`
        );

        const requestClone = req.clone({ headers });
        return next.handle(requestClone);
      })
    );
  }

  /**
   * Try to acquire token silently. Invoke interaction if acquireTokenSilent rejected with error or resolved with null access token
   * @param authRequest Request
   * @param scopes Array of scopes for the request
   * @param account Account
   * @returns Authentication result
   */
  private acquireToken(
    authRequest: MsalInterceptorAuthRequest,
    scopes: string[],
    account: AccountInfo
  ): Observable<AuthenticationResult> {
    // Note: For MSA accounts, include openid scope when calling acquireTokenSilent to return idToken
    return this.authService
      .acquireTokenSilent({ ...authRequest, scopes, account })
      .pipe(
        catchError(() => {
          this.authService
            .getLogger()
            .error(
              "Interceptor - acquireTokenSilent rejected with error. Invoking interaction to resolve.",
              authRequest.correlationId ?? ""
            );
          return this.msalBroadcastService.inProgress$.pipe(
            take(1),
            switchMap((status: InteractionStatus) => {
              if (status === InteractionStatus.None) {
                return this.acquireTokenInteractively(authRequest, scopes);
              }

              return this.msalBroadcastService.inProgress$.pipe(
                filter(
                  (status: InteractionStatus) =>
                    status === InteractionStatus.None
                ),
                take(1),
                switchMap(() => this.acquireToken(authRequest, scopes, account))
              );
            })
          );
        }),
        switchMap((result: AuthenticationResult) => {
          if (!result.accessToken) {
            this.authService
              .getLogger()
              .error(
                "Interceptor - acquireTokenSilent resolved with null access token. Known issue with B2C tenants, invoking interaction to resolve.",
                authRequest.correlationId ?? ""
              );
            return this.msalBroadcastService.inProgress$.pipe(
              filter(
                (status: InteractionStatus) => status === InteractionStatus.None
              ),
              take(1),
              switchMap(() =>
                this.acquireTokenInteractively(authRequest, scopes)
              )
            );
          }
          return of(result);
        })
      );
  }

  /**
   * Invoke interaction for the given set of scopes
   * @param authRequest Request
   * @param scopes Array of scopes for the request
   * @returns Result from the interactive request
   */
  private acquireTokenInteractively(
    authRequest: MsalInterceptorAuthRequest,
    scopes: string[]
  ): Observable<AuthenticationResult> {
    if (this.msalInterceptorConfig.interactionType === InteractionType.Popup) {
      this.authService
        .getLogger()
        .verbose(
          "Interceptor - error acquiring token silently, acquiring by popup",
          authRequest.correlationId ?? ""
        );
      return this.authService.acquireTokenPopup({ ...authRequest, scopes });
    }
    this.authService
      .getLogger()
      .verbose(
        "Interceptor - error acquiring token silently, acquiring by redirect",
        authRequest.correlationId ?? ""
      );
    const redirectStartPage = window.location.href;
    this.authService.acquireTokenRedirect({
      ...authRequest,
      scopes,
      redirectStartPage,
    });
    return EMPTY;
  }

  /**
   * Looks up the scopes for the given endpoint from the protectedResourceMap
   * @param endpoint Url of the request
   * @param httpMethod Http method of the request
   * @returns Array of scopes, or null if not found
   *
   */
  private getScopesForEndpoint(
    endpoint: string,
    httpMethod: string
  ): Array<string> | null {
    this.authService
      .getLogger()
      .verbose("Interceptor - getting scopes for endpoint", "");

    // Ensures endpoints and protected resources compared are normalized
    const normalizedEndpoint = this.location.normalize(endpoint);

    const protectedResourcesArray = Array.from(
      this.msalInterceptorConfig.protectedResourceMap.keys()
    );

    const matchingProtectedResources = this.matchResourcesToEndpoint(
      protectedResourcesArray,
      normalizedEndpoint
    );

    if (matchingProtectedResources.length > 0) {
      return this.matchScopesToEndpoint(
        this.msalInterceptorConfig.protectedResourceMap,
        matchingProtectedResources,
        httpMethod
      );
    }

    return null;
  }

  /**
   * Finds resource endpoints that match request endpoint
   * @param protectedResourcesEndpoints
   * @param endpoint
   * @returns
   */
  private matchResourcesToEndpoint(
    protectedResourcesEndpoints: string[],
    endpoint: string
  ): Array<string> {
    const matchingResources: Array<string> = [];

    protectedResourcesEndpoints.forEach((key) => {
      const normalizedKey = this.location.normalize(key);

      // Get url components
      const absoluteKey = this.getAbsoluteUrl(normalizedKey);
      const keyComponents = new URL(absoluteKey);
      const absoluteEndpoint = this.getAbsoluteUrl(endpoint);
      const endpointComponents = new URL(absoluteEndpoint);

      if (this.checkUrlComponents(keyComponents, endpointComponents)) {
        matchingResources.push(key);
      }
    });

    return matchingResources;
  }

  /**
   * Compares URL segments between key and endpoint
   * @param key
   * @param endpoint
   * @returns
   */
  private checkUrlComponents(
    keyComponents: URL,
    endpointComponents: URL
  ): boolean {
    // URL properties from https://developer.mozilla.org/en-US/docs/Web/API/URL
    const urlProperties = [
      "protocol",
      "host",
      "pathname",
      "search",
      "hash",
    ] as const;

    // Maps URL property names to the component identifiers used by matchPatternStrict.
    const componentMap: Record<
      string,
      "protocol" | "host" | "path" | "search" | "hash"
    > = {
      protocol: "protocol",
      host: "host",
      pathname: "path",
      search: "search",
      hash: "hash",
    };

    const useStrictMatching =
      this.msalInterceptorConfig.strictMatching !== false;

    for (const property of urlProperties) {
      if (keyComponents[property]) {
        const decodedInput = decodeURIComponent(keyComponents[property]);
        if (useStrictMatching) {
          /*
           * Strict matching (v5 default): anchored patterns, metacharacters
           * are treated as literals, host wildcards do not span dot separators.
           */
          const component = componentMap[property];
          if (
            !this.matchPatternStrict(
              decodedInput,
              endpointComponents[property],
              component
            )
          ) {
            return false;
          }
        } else {
          // Legacy matching: preserved for backwards compatibility with v4.
          if (!this.matchPattern(decodedInput, endpointComponents[property])) {
            return false;
          }
        }
      }
    }

    return true;
  }

  /**
   * Transforms relative urls to absolute urls
   * @param url
   * @returns
   */
  private getAbsoluteUrl(url: string): string {
    const link = this._document.createElement("a");
    link.href = url;
    return link.href;
  }

  /**
   * Finds scopes from first matching endpoint with HTTP method that matches request
   * @param protectedResourceMap Protected resource map
   * @param endpointArray Array of resources that match request endpoint
   * @param httpMethod Http method of the request
   * @returns
   */
  private matchScopesToEndpoint(
    protectedResourceMap: Map<
      string,
      Array<string | ProtectedResourceScopes> | null
    >,
    endpointArray: string[],
    httpMethod: string
  ): Array<string> | null {
    const allMatchedScopes: Array<string[] | null> = [];

    // Check each matched endpoint for matching HttpMethod and scopes
    endpointArray.forEach((matchedEndpoint) => {
      const scopesForEndpoint: string[] = [];
      const methodAndScopesArray = protectedResourceMap.get(matchedEndpoint);

      // Return if resource is unprotected
      if (methodAndScopesArray === null) {
        allMatchedScopes.push(null);
        return;
      }

      if (methodAndScopesArray === undefined) {
        return;
      }

      methodAndScopesArray.forEach((entry) => {
        // Entry is either array of scopes or ProtectedResourceScopes object
        if (typeof entry === "string") {
          scopesForEndpoint.push(entry);
        } else {
          // Ensure methods being compared are normalized
          const normalizedRequestMethod = httpMethod.toLowerCase();
          const normalizedResourceMethod = entry.httpMethod.toLowerCase();
          // Method in protectedResourceMap matches request http method
          if (normalizedResourceMethod === normalizedRequestMethod) {
            // Validate if scopes comes null to unprotect the resource in a certain http method
            if (entry.scopes === null) {
              allMatchedScopes.push(null);
            } else {
              entry.scopes.forEach((scope) => {
                scopesForEndpoint.push(scope);
              });
            }
          }
        }
      });

      // Only add to all scopes if scopes for endpoint and method is found
      if (scopesForEndpoint.length > 0) {
        allMatchedScopes.push(scopesForEndpoint);
      }
    });

    if (allMatchedScopes.length > 0) {
      if (allMatchedScopes.length > 1) {
        this.authService
          .getLogger()
          .warning(
            "Interceptor - More than 1 matching scopes for endpoint found.",
            ""
          );
      }
      // Returns scopes for first matching endpoint
      return allMatchedScopes[0];
    }

    return null;
  }

  /**
   * Tests if a given string matches a given pattern, with support for wildcards and queries.
   * @param pattern Wildcard pattern to string match. Supports "*" for wildcards and "?" for queries
   * @param input String to match against
   */
  private matchPattern(pattern: string, input: string): boolean {
    /**
     * Wildcard support: https://stackoverflow.com/a/3117248/4888559
     * Queries: replaces "?" in string with escaped "\?" for regex test
     */
    // eslint-disable-next-line security/detect-non-literal-regexp
    const regex: RegExp = new RegExp(
      pattern
        .replace(/\\/g, "\\\\")
        .replace(/\*/g, "[^ ]*")
        .replace(/\?/g, "\\?")
    );

    return regex.test(input);
  }

  /**
   * Tests if a given string matches a given pattern using stricter, anchored
   * matching semantics.
   *
   * Differences from `matchPattern` (legacy):
   * - All regex metacharacters (including `.` and `?`) are treated as literals.
   * - The generated regex is anchored with `^` and `$` (full-string match).
   * - `*` wildcard behaviour depends on the URL component:
   *   - `host`: `*` maps to `[^.]*` — matches any characters that do NOT
   *     include `.`, so wildcards stay within a single DNS label.
   *   - All other components: `*` matches any characters.
   *
   * @param pattern - The protectedResourceMap key pattern.
   * @param input - The URL component value from the outgoing request.
   * @param component - Which URL component is being matched.
   * @returns `true` if the full input string matches the pattern.
   */
  private matchPatternStrict(
    pattern: string,
    input: string,
    component: "protocol" | "host" | "path" | "search" | "hash"
  ): boolean {
    // Step 1: Escape all regex metacharacters so literals (including . and ?) match literally.
    let regexBody = pattern.replace(/[.+^${}()|[\]\\*?]/g, "\\$&");

    // Step 2: Replace escaped wildcards with component-aware regex equivalents.
    if (component === "host") {
      regexBody = regexBody.replace(/\\\*/g, "[^.]*");
    } else {
      // Path, protocol, search, hash: `*` matches any characters.
      regexBody = regexBody.replace(/\\\*/g, ".*");
    }

    // Step 3: Anchor for full-string matching.
    // eslint-disable-next-line security/detect-non-literal-regexp
    const regex = new RegExp(`^${regexBody}$`);
    return regex.test(input);
  }
}
