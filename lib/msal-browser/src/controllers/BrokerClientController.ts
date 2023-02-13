/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationResult, PerformanceCallbackFunction, AccountInfo, CommonAuthorizationUrlRequest, Logger, AuthError } from "@azure/msal-common";
import { BrokerCommChannel } from "../broker/BrokerCommChannel";
import { BrokerMessageName, IBrokerCommChannel } from "../broker/IBrokerCommChannel";
import { HandshakeRequest } from "../broker/messages/HandshakeRequest";
import { HandshakeResponse } from "../broker/messages/HandshakeResponse";
import { MessageConverterts } from "../broker/messages/MessageConverters";
import { TokenRequest } from "../broker/messages/TokenRequest";
import { ITokenCache } from "../cache/ITokenCache";
import { BrowserConfiguration, Configuration } from "../config/Configuration";
import { INavigationClient } from "../navigation/INavigationClient";
import { BaseOperatingContext } from "../operatingcontext/BaseOperatingContext";
import { AuthorizationCodeRequest } from "../request/AuthorizationCodeRequest";
import { EndSessionPopupRequest } from "../request/EndSessionPopupRequest";
import { EndSessionRequest } from "../request/EndSessionRequest";
import { PopupRequest } from "../request/PopupRequest";
import { RedirectRequest } from "../request/RedirectRequest";
import { SilentRequest } from "../request/SilentRequest";
import { WrapperSKU } from "../utils/BrowserConstants";
import { IController } from "./IController";

export class BrokerClientController implements IController {
    protected readonly loggerPrefix: string = "BrokerClientController";

    protected logger: Logger;
    protected config: Configuration;
    protected brokerAlias: string;
    protected commChannel: IBrokerCommChannel;

    protected converters: MessageConverterts;

    protected handshakeResponse: HandshakeResponse | null = null;

    private constructor(operatingContext: BaseOperatingContext, brokerAlias: string, commChannel: IBrokerCommChannel) {
        this.logger = operatingContext.getLogger();
        this.config = operatingContext.getConfig();
        this.brokerAlias = brokerAlias;
        this.commChannel = commChannel;

        this.converters = new MessageConverterts(this.config.auth.clientId);
    }

    async initialize(): Promise<void> {
        this.handshakeResponse =
            await this.commChannel.sendMessageWithPayloadAndGetResponse<HandshakeRequest, HandshakeResponse>(
                BrokerMessageName.Handshake,
                {
                    authLibName: "MSAL.js",
                    authLibVersion: "TODO: GetVersion",
                    supportedProtocolVersion: "1.0",
                    clientId: this.config.auth.clientId
                });
        
        // Check if the broker is supported. Otherwise throw non-recoverable error.
        if (this.handshakeResponse.brokerAlias !== this.brokerAlias) {
            this.logger.error(`${this.loggerPrefix}:: client_id ${this.config.auth.clientId}) not configured for ${this.handshakeResponse.brokerAlias}, but being used inside it`);
            throw AuthError.createUnexpectedError(`Application wasn't configured to be hosted inside ${this.handshakeResponse.brokerAlias}. Please contact the app developer.`);
        }
    }

    static async createController(operatingContext: BaseOperatingContext): Promise<IController> {
        const controller = new BrokerClientController(operatingContext, "brk-multihub", new BrokerCommChannel());
        controller.initialize();
        return controller;
    }

    async acquireTokenPopup(request: PopupRequest): Promise<AuthenticationResult> {
        const tokenResponse =
            await this.commChannel.sendMessageWithPayloadAndGetResponse<TokenRequest, AuthenticationResult>(
                BrokerMessageName.Token,
                this.converters.getTokenRequestFromPopupRequest(request));

        this.logger.info(`${this.loggerPrefix}:: acquireTokenPopup success. client_id ${this.config.auth.clientId}`);

        return tokenResponse;
    }

    acquireTokenRedirect(request: RedirectRequest): Promise<void> {
        this.logger.info(`${this.loggerPrefix}:: Not implemented acquireTokenRedirect attemted. client_id ${this.config.auth.clientId}`);
        throw new Error("Method not implemented.");
    }

    async acquireTokenSilent(request: SilentRequest): Promise<AuthenticationResult> {
        const tokenResponse =
            await this.commChannel.sendMessageWithPayloadAndGetResponse<TokenRequest, AuthenticationResult>(
                BrokerMessageName.Token,
                this.converters.getTokenRequestFromSilentRequest(request));

        this.logger.info(`${this.loggerPrefix}:: acquireTokenSilent success. client_id ${this.config.auth.clientId}`);

        return tokenResponse;
    }

    acquireTokenByCode(request: AuthorizationCodeRequest): Promise<AuthenticationResult> {
        this.logger.info(`${this.loggerPrefix}:: Not implemented acquireTokenByCode attemted. client_id ${this.config.auth.clientId}`);
        throw new Error("Method not implemented.");
    }

    addEventCallback(callback: Function): string | null {
        throw new Error("Method not implemented.");
    }

    removeEventCallback(callbackId: string): void {
        throw new Error("Method not implemented.");
    }

    addPerformanceCallback(callback: PerformanceCallbackFunction): string {
        throw new Error("Method not implemented.");
    }

    removePerformanceCallback(callbackId: string): boolean {
        throw new Error("Method not implemented.");
    }

    enableAccountStorageEvents(): void {
        throw new Error("Method not implemented.");
    }

    disableAccountStorageEvents(): void {
        throw new Error("Method not implemented.");
    }

    getAccountByHomeId(homeAccountId: string): AccountInfo | null {
        return this.handshakeResponse !== null && this.handshakeResponse.account.homeAccountId === homeAccountId ?
            this.handshakeResponse.account :
            null;
    }

    getAccountByLocalId(localId: string): AccountInfo | null {
        return this.handshakeResponse !== null && this.handshakeResponse.account.localAccountId === localId ?
            this.handshakeResponse.account :
            null;
    }

    getAccountByUsername(userName: string): AccountInfo | null {
        return this.handshakeResponse !== null && this.handshakeResponse.account.username === userName ?
            this.handshakeResponse.account :
            null;
    }

    getAllAccounts(): AccountInfo[] {
        const accounts = new Array<AccountInfo>();

        if (this.handshakeResponse !== null) {
            accounts[0] = this.handshakeResponse.account;
        }

        return accounts;

    }

    handleRedirectPromise(hash?: string | undefined): Promise<AuthenticationResult | null> {
        throw new Error("Method not implemented.");
    }

    loginPopup(request?: PopupRequest | undefined): Promise<AuthenticationResult> {
        throw new Error("Method not implemented.");
    }

    loginRedirect(request?: RedirectRequest | undefined): Promise<void> {
        throw new Error("Method not implemented.");
    }

    logout(logoutRequest?: EndSessionRequest | undefined): Promise<void> {
        throw new Error("Method not implemented.");
    }

    logoutRedirect(logoutRequest?: EndSessionRequest | undefined): Promise<void> {
        throw new Error("Method not implemented.");
    }

    logoutPopup(logoutRequest?: EndSessionPopupRequest | undefined): Promise<void> {
        throw new Error("Method not implemented.");
    }

    ssoSilent(request: Partial<Omit<CommonAuthorizationUrlRequest, "responseMode" | "codeChallenge" | "codeChallengeMethod" | "requestedClaimsHash" | "nativeBroker">>): Promise<AuthenticationResult> {
        throw new Error("Method not implemented.");
    }

    getTokenCache(): ITokenCache {
        throw new Error("Method not implemented.");
    }

    getLogger(): Logger {
        throw new Error("Method not implemented.");
    }

    setLogger(logger: Logger): void {
        throw new Error("Method not implemented.");
    }

    setActiveAccount(account: AccountInfo | null): void {
        // Do nothing
    }

    getActiveAccount(): AccountInfo | null {
        return this.handshakeResponse !== null ? this.handshakeResponse.account : null;
    }

    initializeWrapperLibrary(sku: WrapperSKU, version: string): void {
        throw new Error("Method not implemented.");
    }

    setNavigationClient(navigationClient: INavigationClient): void {
        throw new Error("Method not implemented.");
    }

    getConfiguration(): BrowserConfiguration {
        throw new Error("Method not implemented.");
    }
}
