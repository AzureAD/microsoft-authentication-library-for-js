/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AccountEntity,
    AuthorityType,
    AuthToken,
    Constants,
    ICrypto,
    Logger,
    AccountInfo,
    createAuthError,
    AuthErrorCodes,
} from "@azure/msal-common/browser";
import { AuthenticationResult } from "../../response/AuthenticationResult.js";
import { PlatformDOMTokenRequest } from "./NativeRequest.js";
import { IPerformanceClient } from "../../../../msal-common/lib/types/exports-browser-only.js";
import { createNewGuid } from "../../crypto/BrowserCrypto.js";
import { NativeConstants } from "../../utils/BrowserConstants.js";
import { ClearCacheRequest } from "../../request/ClearCacheRequest.js";
import { EndSessionRequest } from "../../request/EndSessionRequest.js";
import { PlatformDOMTokenResponse } from "./NativeResponse.js";
import { base64Decode } from "../../encode/Base64Decode.js";
import { BrowserCacheManager } from "../../cache/BrowserCacheManager.js";

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
            this.validateNativeResponse(response);
            return this.handleNativeResponse(request, response);
        } catch (e) {
            this.logger.error("PlatformDOMHandler: acquireToken error");
            throw e;
        }
    }

    handleNativeResponse(
        request: PlatformDOMTokenRequest,
        response: PlatformDOMTokenResponse
    ): AuthenticationResult {
        this.logger.trace("PlatformDOMHandler: handleNativeResponse called");
        // eslint-disable-next-line no-console
        console.log(response);
        // generate identifiers

        if (response.isSuccess) {
            const idTokenClaims = AuthToken.extractTokenClaims(
                response.idToken ?? Constants.EMPTY_STRING,
                base64Decode
            );
            // Save account in browser storage
            const homeAccountIdentifier = AccountEntity.generateHomeAccountId(
                response.clientInfo || Constants.EMPTY_STRING,
                AuthorityType.Default,
                this.logger,
                this.browserCrypto,
                idTokenClaims
            );

            const cachedhomeAccountId =
                this.browserStorage.getAccountInfoFilteredBy({
                    nativeAccountId: request.accountId,
                })?.homeAccountId;
        }

        const authenticationResult: AuthenticationResult = {
            authority: "",
            uniqueId: "",
            tenantId: "",
            scopes: [],
            idToken: "",
            idTokenClaims: {},
            accessToken: "",
            fromCache: false,
            expiresOn: null,
            correlationId: this.correlationId,
            tokenType: "",
            account: {} as AccountInfo,
        };

        return authenticationResult;
    }

    logout(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        request: EndSessionRequest | ClearCacheRequest | undefined
    ): Promise<void> {
        this.logger.trace("PlatformDOMHandler: logout called");
        throw new Error("Method not implemented.");
    }

    private validateNativeResponse(response: object): PlatformDOMTokenResponse {
        if (
            response.hasOwnProperty("access_token") &&
            response.hasOwnProperty("id_token") &&
            response.hasOwnProperty("client_info") &&
            response.hasOwnProperty("account") &&
            response.hasOwnProperty("scope") &&
            response.hasOwnProperty("expires_in")
        ) {
            return response as PlatformDOMTokenResponse;
        } else {
            throw createAuthError(
                AuthErrorCodes.unexpectedError,
                "Response missing expected properties."
            );
        }
    }
}
