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
import { RequestContextV2 } from "../../network_client/custom_auth_api/v2/request/RequestsV2.js";
import { TokenResponseV2 } from "../../network_client/custom_auth_api/v2/response/ResponsesV2.js";

/*
 * Shared base for Native Auth V2 interaction clients. It extends
 * `StandardInteractionClient` for common browser infrastructure while keeping
 * V1 and V2 token handling independent.
 */
export abstract class InteractionClientBaseV2 extends StandardInteractionClient {
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

    // Required by the base contract. After sign-in, use CustomAuthAccountData.getAccessToken().
    acquireToken(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        request: RedirectRequest | PopupRequest | SsoSilentRequest
    ): Promise<AuthenticationResult | void> {
        throw new MethodNotImplementedError(
            "InteractionClientBaseV2.acquireToken"
        );
    }

    // Required by the base contract. After sign-in, use CustomAuthAccountData.signOut().
    logout(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        request: EndSessionRequest | ClearCacheRequest | undefined
    ): Promise<void> {
        throw new MethodNotImplementedError("InteractionClientBaseV2.logout");
    }

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

    protected async handleTokenResponse(
        tokenResponse: TokenResponseV2,
        requestScopes: string[],
        correlationId: string,
        apiId: number
    ): Promise<AuthenticationResult> {
        this.logger.verbose("Processing V2 token response.", correlationId);

        const requestTimestamp = Math.round(new Date().getTime() / 1000.0);

        const result =
            await this.tokenResponseHandler.handleServerTokenResponse(
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

    protected createRequestContext(
        apiId: number,
        correlationId: string
    ): RequestContextV2 {
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
}
