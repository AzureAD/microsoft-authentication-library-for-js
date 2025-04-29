/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    Constants,
    ICrypto,
    Logger,
    createAuthError,
    AuthErrorCodes,
    IPerformanceClient,
} from "@azure/msal-common/browser";
import {
    PlatformDOMTokenRequest,
    PlatformDOMLogoutRequest,
} from "./NativeRequest.js";
import { createNewGuid } from "../../crypto/BrowserCrypto.js";
import { NativeConstants } from "../../utils/BrowserConstants.js";
import { EndSessionRequest } from "../../request/EndSessionRequest.js";
import {
    PlatformDOMTokenResponse,
    SignOutErrorResult,
} from "./NativeResponse.js";
import { BrowserCacheManager } from "../../cache/BrowserCacheManager.js";
import { createNativeAuthError } from "../../error/NativeAuthError.js";

export class PlatformDOMHandler {
    protected logger: Logger;
    protected performanceClient: IPerformanceClient;
    protected correlationId: string;
    protected extensionId: string;
    protected extensionVersion: string;
    protected browserCrypto: ICrypto;
    protected browserStorage: BrowserCacheManager;

    constructor(
        logger: Logger,
        performanceClient: IPerformanceClient,
        browserCrypto: ICrypto,
        browserStorage: BrowserCacheManager,
        extensionId?: string,
        correlationId?: string
    ) {
        this.logger = logger;
        this.performanceClient = performanceClient;
        this.extensionId =
            extensionId || NativeConstants.MICROSOFT_ENTRA_BROKERID;
        this.correlationId = correlationId || createNewGuid();
        this.extensionVersion = Constants.EMPTY_STRING;
        this.browserCrypto = browserCrypto;
        this.browserStorage = browserStorage;
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
    ): Promise<PlatformDOMTokenResponse> {
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
            this.logger.trace(
                "PlatformDOMHandler: acquireToken response",
                response
            );
            return this.validateNativeResponse(response);
        } catch (e) {
            this.logger.error(
                "PlatformDOMHandler: acquireToken platform error"
            );
            throw e;
        }
    }

    async logout(request: EndSessionRequest | undefined): Promise<void> {
        this.logger.trace("PlatformDOMHandler: logout called");
        const logoutRequest: PlatformDOMLogoutRequest = {
            brokerId: this.extensionId,
            accountId:
                request?.account?.nativeAccountId || Constants.EMPTY_STRING,
            extraParameters: request?.extraQueryParameters || {},
        };
        try {
            const logoutResponse =
                // @ts-ignore
                await window.navigator.platformAuthentication.executeSignOut(
                    logoutRequest
                );
            return this.handleLogoutResponse(logoutResponse);
        } catch (e) {
            this.logger.error("PlatformDOMHandler: platform logout failed");
            throw e;
        }
    }

    private validateNativeResponse(response: object): PlatformDOMTokenResponse {
        if (
            response.hasOwnProperty("isSuccess") &&
            response.hasOwnProperty("access_token") &&
            response.hasOwnProperty("id_token") &&
            response.hasOwnProperty("client_info") &&
            response.hasOwnProperty("account") &&
            response.hasOwnProperty("scopes") &&
            response.hasOwnProperty("expires_in")
        ) {
            return response as PlatformDOMTokenResponse;
        } else if (
            response.hasOwnProperty("isSuccess") &&
            response.hasOwnProperty("error")
        ) {
            const errorResponse = response as PlatformDOMTokenResponse;
            if (errorResponse.isSuccess === false) {
                this.logger.trace(
                    "PlatformDOMHandler: platform broker returned error response"
                );
                throw createNativeAuthError(
                    errorResponse.error.code,
                    errorResponse.error.description,
                    {
                        error: parseInt(errorResponse.error.errorCode),
                        protocol_error: errorResponse.error.protocolError,
                        status: errorResponse.error.status,
                        properties: errorResponse.error.properties,
                    }
                );
            }
        }
        throw createAuthError(
            AuthErrorCodes.unexpectedError,
            "Response missing expected properties."
        );
    }

    private handleLogoutResponse(logoutResponse: object): void {
        if (logoutResponse.hasOwnProperty("error")) {
            this.logger.trace("PlatformDOMHandler: logout unsuccessful");
            const logoutErrorResponse = logoutResponse as SignOutErrorResult;
            throw createNativeAuthError(
                logoutErrorResponse.error.code,
                logoutErrorResponse.error.status
            );
        } else {
            this.logger.trace("PlatformDOMHandler: logout successful");
        }
    }
}
