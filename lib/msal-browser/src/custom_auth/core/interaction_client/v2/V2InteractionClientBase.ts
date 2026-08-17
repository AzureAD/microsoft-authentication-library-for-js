/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    Constants,
    ICrypto,
    IPerformanceClient,
    Logger,
    ResponseHandler,
    ServerAuthorizationTokenResponse,
} from "@azure/msal-common/browser";
import { StandardInteractionClient } from "../../../../interaction_client/StandardInteractionClient.js";
import { BrowserConfiguration } from "../../../../config/Configuration.js";
import { BrowserCacheManager } from "../../../../cache/BrowserCacheManager.js";
import { EventHandler } from "../../../../event/EventHandler.js";
import { INavigationClient } from "../../../../navigation/INavigationClient.js";
import { RedirectRequest } from "../../../../request/RedirectRequest.js";
import { PopupRequest } from "../../../../request/PopupRequest.js";
import { SsoSilentRequest } from "../../../../request/SsoSilentRequest.js";
import { EndSessionRequest } from "../../../../request/EndSessionRequest.js";
import { ClearCacheRequest } from "../../../../request/ClearCacheRequest.js";
import { AuthenticationResult } from "../../../../response/AuthenticationResult.js";
import { CustomAuthAuthority } from "../../CustomAuthAuthority.js";
import { MethodNotImplementedError } from "../../error/MethodNotImplementedError.js";
import { initializeServerTelemetryManager } from "../../../../interaction_client/BaseInteractionClient.js";
import { V2RequestContext } from "../../network_client/custom_auth_api/v2/request/V2Requests.js";
import { V2TokenResponse } from "../../network_client/custom_auth_api/v2/response/V2Responses.js";

/*
 * Shared base for the Native Auth V2 interaction clients. It deliberately does NOT extend the V1
 * `CustomAuthInteractionClientBase`, which is coupled to the V1 token/response shape; V2 owns its
 * own base so the two stacks evolve independently. It extends `StandardInteractionClient` only to
 * inherit the browser plumbing (config, storage, crypto, telemetry) shared by every interaction
 * client, and holds the V2 network client plus the custom-auth authority that the flow steps use.
 */
export abstract class V2InteractionClientBase extends StandardInteractionClient {
    private readonly tokenResponseHandler: ResponseHandler;

    constructor(
        config: BrowserConfiguration,
        storageImpl: BrowserCacheManager,
        browserCrypto: ICrypto,
        logger: Logger,
        eventHandler: EventHandler,
        navigationClient: INavigationClient,
        performanceClient: IPerformanceClient,
        protected customAuthAuthority: CustomAuthAuthority
    ) {
        super(
            config,
            storageImpl,
            browserCrypto,
            logger,
            eventHandler,
            navigationClient,
            performanceClient,
            ""
        );

        this.tokenResponseHandler = new ResponseHandler(
            this.config.auth.clientId,
            this.browserStorage,
            this.browserCrypto,
            this.logger,
            this.performanceClient,
            null,
            null
        );
    }

    /*
     * Union the caller's scopes with the standard OIDC set: honour the
     * caller's scopes (and their order) when provided, then append any of `openid`, `profile`, and
     * `offline_access` that are missing so the terminal sign-in always returns the ID/refresh-token
     * material required for account creation and subsequent silent authentication. Deduplication is
     * case-insensitive to match the shared `ScopeSet` semantics. The array is the internal
     * representation - the network layer joins it into the space-delimited `scope` form for the
     * token request, while the response handler consumes the same array to build the result's scope
     * set.
     */
    protected getScopes(scopes: string[] | undefined): string[] {
        const requestedScopes = scopes?.filter((scope) => !!scope) ?? [];
        const seenScopes = new Set(
            requestedScopes.map((scope) => scope.toLowerCase())
        );

        const defaultScopes = [
            Constants.OPENID_SCOPE,
            Constants.PROFILE_SCOPE,
            Constants.OFFLINE_ACCESS_SCOPE,
        ];

        return [
            ...requestedScopes,
            ...defaultScopes.filter(
                (scope) => !seenScopes.has(scope.toLowerCase())
            ),
        ];
    }

    /*
     * Turn a V2 `/token` response into an `AuthenticationResult` by delegating to the shared
     * msal-common `handleServerTokenResponse`: it validates the response, decodes `client_info` (or
     * falls back to the id_token claims) to derive the home account id, saves the access/id/refresh
     * tokens to the browser cache, and returns the result carrying the account. The cast is needed
     * because `V2TokenResponse.token_type` is a plain string whereas the shared type narrows it to
     * the `AuthenticationScheme` union; the fields are otherwise structurally identical.
     */
    protected async handleTokenResponse(
        tokenResponse: V2TokenResponse,
        requestScopes: string[],
        correlationId: string,
        apiId: number
    ): Promise<AuthenticationResult> {
        this.logger.verbose("Processing V2 token response.", correlationId);

        const requestTimestamp = Math.round(new Date().getTime() / 1000.0);

        const result = await this.tokenResponseHandler.handleServerTokenResponse(
            tokenResponse as ServerAuthorizationTokenResponse,
            this.customAuthAuthority,
            requestTimestamp,
            {
                authority: this.customAuthAuthority.canonicalAuthority,
                correlationId,
                scopes: requestScopes,
            },
            apiId
        );

        return result as AuthenticationResult;
    }

    /*
     * Build the per-request context threaded through every V2 network call: the correlation id and
     * a server-telemetry manager seeded with the given public API id. Every flow step goes through
     * here so telemetry and correlation are attached uniformly.
     */
    protected createRequestContext(
        apiId: number,
        correlationId: string
    ): V2RequestContext {
        return {
            correlationId,
            telemetryManager: initializeServerTelemetryManager(
                apiId,
                this.config.auth.clientId,
                correlationId,
                this.browserStorage,
                this.logger
            ),
        };
    }

    // Not applicable to the V2 native-auth flows; required by the base contract.
    acquireToken(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        request: RedirectRequest | PopupRequest | SsoSilentRequest
    ): Promise<AuthenticationResult | void> {
        throw new MethodNotImplementedError(
            "V2InteractionClientBase.acquireToken"
        );
    }

    // Not applicable to the V2 native-auth flows; required by the base contract.
    logout(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        request: EndSessionRequest | ClearCacheRequest | undefined
    ): Promise<void> {
        throw new MethodNotImplementedError("V2InteractionClientBase.logout");
    }
}
