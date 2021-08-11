/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ICrypto, INetworkModule, Logger, AuthenticationResult } from "@azure/msal-common";
import { BrowserConfiguration } from "../config/Configuration";
import { BrowserCacheManager } from "../cache/BrowserCacheManager";
import { EventHandler } from "../event/EventHandler";
import { EndSessionRequest } from "../request/EndSessionRequest";
import { RedirectRequest } from "../request/RedirectRequest";
import { PopupRequest } from "../request/PopupRequest";
import { SsoSilentRequest } from "../request/SsoSilentRequest";
import { version } from "../packageMetadata";
import { BrowserConstants } from "../utils/BrowserConstants";

export abstract class BaseInteractionClient {

    protected config: BrowserConfiguration;
    protected browserStorage: BrowserCacheManager;
    protected browserCrypto: ICrypto;
    protected networkClient: INetworkModule;
    protected logger: Logger;
    protected eventHandler: EventHandler;
    protected correlationId: string;

    constructor(config: BrowserConfiguration, storageImpl: BrowserCacheManager, browserCrypto: ICrypto, logger: Logger, eventHandler: EventHandler, correlationId?: string) {
        this.config = config;
        this.browserStorage = storageImpl;
        this.browserCrypto = browserCrypto;
        this.networkClient = this.config.system.networkClient;
        this.eventHandler = eventHandler;
        this.correlationId = correlationId || this.browserCrypto.createNewGuid();
        this.logger = logger.clone(BrowserConstants.MSAL_SKU, version, this.correlationId);
    }

    abstract acquireToken(request: RedirectRequest|PopupRequest|SsoSilentRequest): Promise<AuthenticationResult|void>;

    abstract logout(request: EndSessionRequest): Promise<void>;
}
