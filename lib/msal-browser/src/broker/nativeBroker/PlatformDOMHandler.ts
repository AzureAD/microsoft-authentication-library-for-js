/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger } from "@azure/msal-common";
import { AuthenticationResult } from "../../response/AuthenticationResult.js";
import { PlatformDOMTokenRequest } from "./NativeRequest.js";
import { IPerformanceClient } from "../../../../msal-common/lib/types/exports-browser-only.js";
import { createNewGuid } from "../../crypto/BrowserCrypto.js";
import { NativeConstants } from "../../utils/BrowserConstants.js";
import { ClearCacheRequest } from "../../request/ClearCacheRequest.js";
import { EndSessionRequest } from "../../request/EndSessionRequest.js";

export class PlatformDOMHandler {
    protected logger: Logger;
    protected performanceClient: IPerformanceClient;
    protected correlationId: string;
    protected extensionId: string;
    protected extensionVersion: string;

    constructor(
        logger: Logger,
        performanceClient: IPerformanceClient,
        extensionId?: string,
        correlationId?: string
    ) {
        this.logger = logger;
        this.performanceClient = performanceClient;
        this.extensionId =
            extensionId || NativeConstants.MICROSOFT_ENTRA_BROKERID;
        this.correlationId = correlationId || createNewGuid();
        this.extensionVersion = "1.0.0";
    }

    /**
     * Returns the Id for the browser extension this handler is communicating with
     * @returns
     */
    getExtensionId(): string {
        return this.extensionId;
    }

    getExtensionVersion(): string | undefined {
        return this.extensionVersion;
    }

    async sendMessage(
        request: PlatformDOMTokenRequest
    ): Promise<AuthenticationResult> {
        this.logger.trace("PlatformDOMHandler: acquireToken called");

        try {
            const response =
                // @ts-ignore
                await window.navigator.platformAuthentication.executeGetToken(
                    request
                );
            this.logger.trace(
                "PlatformDOMHandler: acquireToken response received"
            );
            // NEED TO REMOVE THIS LATER
            this.logger.trace(
                "PlatformDOMHandler: acquireToken response",
                response
            );
            return response as AuthenticationResult;
        } catch (e) {
            this.logger.error("PlatformDOMHandler: acquireToken error");
            throw e;
        }
    }

    logout(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        request: EndSessionRequest | ClearCacheRequest | undefined
    ): Promise<void> {
        this.logger.trace("PlatformDOMHandler: logout called");
        throw new Error("Method not implemented.");
    }
}
