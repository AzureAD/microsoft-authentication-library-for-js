/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthenticationResult,
    BrowserCacheManager,
    BrowserConfiguration,
    ClearCacheRequest,
    EndSessionRequest,
    EventHandler,
    ICrypto,
    INavigationClient,
    IPerformanceClient,
    Logger,
    PopupRequest,
    RedirectRequest,
    SsoSilentRequest,
    StandardInteractionClient,
} from "@azure/msal-browser";
import { ICustomAuthApiClient } from "../network_client/custom_auth_api/ICustomAuthApiClient.js";
import { ArgumentValidator } from "../utils/ArgumentValidator.js";
import { MethodNotImplementedError } from "../error/MethodNotImplementedError.js";
import { CustomAuthAuthority } from "../CustomAuthAuthority.js";

export abstract class CustomAuthInteractionClientBase extends StandardInteractionClient {
    constructor(
        config: BrowserConfiguration,
        storageImpl: BrowserCacheManager,
        browserCrypto: ICrypto,
        logger: Logger,
        eventHandler: EventHandler,
        navigationClient: INavigationClient,
        performanceClient: IPerformanceClient,
        protected customAuthApiClient: ICustomAuthApiClient,
        protected customAuthAuthority: CustomAuthAuthority
    ) {
        super(
            config,
            storageImpl,
            browserCrypto,
            logger,
            eventHandler,
            navigationClient,
            performanceClient
        );

        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "customAuthApiClient",
            customAuthApiClient,
            this.correlationId
        );

        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "customAuthAuthority",
            customAuthAuthority,
            this.correlationId
        );
    }

    // It is not necessary to implement this method from base class.
    acquireToken(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        request: RedirectRequest | PopupRequest | SsoSilentRequest
    ): Promise<AuthenticationResult | void> {
        throw new MethodNotImplementedError("SignInClient.acquireToken");
    }

    // It is not necessary to implement this method from base class.
    logout(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        request: EndSessionRequest | ClearCacheRequest | undefined
    ): Promise<void> {
        throw new MethodNotImplementedError("SignInClient.logout");
    }
}
