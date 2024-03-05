/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AccountInfo,
    Logger,
    PerformanceCallbackFunction,
    IPerformanceClient,
    AccountFilter,
} from "@azure/msal-common";
import { RedirectRequest } from "../request/RedirectRequest";
import { PopupRequest } from "../request/PopupRequest";
import { SilentRequest } from "../request/SilentRequest";
import { SsoSilentRequest } from "../request/SsoSilentRequest";
import { EndSessionRequest } from "../request/EndSessionRequest";
import { ApiId, WrapperSKU } from "../utils/BrowserConstants";
import { INavigationClient } from "../navigation/INavigationClient";
import { EndSessionPopupRequest } from "../request/EndSessionPopupRequest";
import { ITokenCache } from "../cache/ITokenCache";
import { AuthorizationCodeRequest } from "../request/AuthorizationCodeRequest";
import { BrowserConfiguration } from "../config/Configuration";
import { EventHandler } from "../event/EventHandler";
import { AuthenticationResult } from "../response/AuthenticationResult";
import { EventCallbackFunction } from "../event/EventMessage";
import { ClearCacheRequest } from "../request/ClearCacheRequest";

export interface IController {
    initialize(): Promise<void>;

    acquireTokenPopup(request: PopupRequest): Promise<AuthenticationResult>;

    acquireTokenRedirect(request: RedirectRequest): Promise<void>;

    acquireTokenSilent(
        silentRequest: SilentRequest
    ): Promise<AuthenticationResult>;

    acquireTokenByCode(
        request: AuthorizationCodeRequest
    ): Promise<AuthenticationResult>;

    acquireTokenNative(
        request: PopupRequest | SilentRequest | SsoSilentRequest,
        apiId: ApiId,
        accountId?: string
    ): Promise<AuthenticationResult>;

    addEventCallback(callback: EventCallbackFunction): string | null;

    removeEventCallback(callbackId: string): void;

    addPerformanceCallback(callback: PerformanceCallbackFunction): string;

    removePerformanceCallback(callbackId: string): boolean;

    enableAccountStorageEvents(): void;

    disableAccountStorageEvents(): void;

    getAccount(accountFilter: AccountFilter): AccountInfo | null;

    getAccountByHomeId(homeAccountId: string): AccountInfo | null;

    getAccountByLocalId(localId: string): AccountInfo | null;

    getAccountByUsername(userName: string): AccountInfo | null;

    getAllAccounts(accountFilter?: AccountFilter): AccountInfo[];

    handleRedirectPromise(hash?: string): Promise<AuthenticationResult | null>;

    loginPopup(request?: PopupRequest): Promise<AuthenticationResult>;

    loginRedirect(request?: RedirectRequest): Promise<void>;

    logout(logoutRequest?: EndSessionRequest): Promise<void>;

    logoutRedirect(logoutRequest?: EndSessionRequest): Promise<void>;

    logoutPopup(logoutRequest?: EndSessionPopupRequest): Promise<void>;

    clearCache(logoutRequest?: ClearCacheRequest): Promise<void>;

    ssoSilent(request: SsoSilentRequest): Promise<AuthenticationResult>;

    getTokenCache(): ITokenCache;

    getLogger(): Logger;

    setLogger(logger: Logger): void;

    setActiveAccount(account: AccountInfo | null): void;

    getActiveAccount(): AccountInfo | null;

    initializeWrapperLibrary(sku: WrapperSKU, version: string): void;

    setNavigationClient(navigationClient: INavigationClient): void;

    /** @internal */
    getConfiguration(): BrowserConfiguration;

    hydrateCache(
        result: AuthenticationResult,
        request:
            | SilentRequest
            | SsoSilentRequest
            | RedirectRequest
            | PopupRequest
    ): Promise<void>;

    /** @internal */
    isBrowserEnv(): boolean;

    /** @internal */
    getPerformanceClient(): IPerformanceClient;

    /** @internal */
    getEventHandler(): EventHandler;
}
