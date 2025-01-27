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
} from "@azure/msal-browser";
import { ICustomAuthApiClient } from "../network_client/custom_auth_api/ICustomAuthApiClient.js";
import { CustomAuthAuthority } from "../CustomAuthAuthority.js";
import { ArgumentValidator } from "../utils/ArgumentValidator.js";
import { CustomAuthInteractionClientBase } from "./CustomAuthInteractionClientBase.js";

export class CustomAuthInterationClientFactory {
    constructor(
        private config: BrowserConfiguration,
        private storageImpl: BrowserCacheManager,
        private browserCrypto: ICrypto,
        private logger: Logger,
        private eventHandler: EventHandler,
        private navigationClient: INavigationClient,
        private performanceClient: IPerformanceClient,
        private customAuthApiClient: ICustomAuthApiClient,
        private customAuthAuthority: CustomAuthAuthority,
    ) {
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined("config", config);
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "storageImpl",
            storageImpl,
        );
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "browserCrypto",
            browserCrypto,
        );
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined("logger", logger);
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "eventHandler",
            eventHandler,
        );
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "navigationClient",
            navigationClient,
        );
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "performanceClient",
            performanceClient,
        );
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "customAuthApiClient",
            customAuthApiClient,
        );
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "customAuthAuthority",
            customAuthAuthority,
        );
    }

    create<TClient extends CustomAuthInteractionClientBase>(
        clientConstructor: new (
            config: BrowserConfiguration,
            storageImpl: BrowserCacheManager,
            browserCrypto: ICrypto,
            logger: Logger,
            eventHandler: EventHandler,
            navigationClient: INavigationClient,
            performanceClient: IPerformanceClient,
            customAuthApiClient: ICustomAuthApiClient,
            customAuthAuthority: CustomAuthAuthority,
        ) => TClient,
    ): TClient {
        return new clientConstructor(
            this.config,
            this.storageImpl,
            this.browserCrypto,
            this.logger,
            this.eventHandler,
            this.navigationClient,
            this.performanceClient,
            this.customAuthApiClient,
            this.customAuthAuthority,
        );
    }
}
