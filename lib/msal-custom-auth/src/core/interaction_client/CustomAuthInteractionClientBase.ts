/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    BrowserCacheManager,
    BrowserConfiguration,
    EventHandler,
    ICrypto,
    INavigationClient,
    IPerformanceClient,
    Logger,
    StandardInteractionClient,
} from "@azure/msal-browser";
import { ICustomAuthApiClient } from "../network_client/custom_auth_api/ICustomAuthApiClient.js";
import { ArgumentValidator } from "../utils/ArgumentValidator.js";

export abstract class CustomAuthInteractionClientBase extends StandardInteractionClient {
    constructor(
        config: BrowserConfiguration,
        storageImpl: BrowserCacheManager,
        browserCrypto: ICrypto,
        logger: Logger,
        eventHandler: EventHandler,
        navigationClient: INavigationClient,
        performanceClient: IPerformanceClient,
        protected customAuthApiClient: ICustomAuthApiClient
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
    }
}
