/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Configuration } from "../config/Configuration";
import { Logger, AuthenticationResult, CacheRecord, CacheManager, AccessTokenEntity, IdTokenEntity, AccountEntity } from "@azure/msal-common";
import { BrokerHandshakeRequest } from "./BrokerHandshakeRequest";
import { BrokerHandshakeResponse } from "./BrokerHandshakeResponse";
import { PopupRequest } from "../request/PopupRequest";
import { RedirectRequest } from "../request/RedirectRequest";
import { BrokerAuthRequest } from "./BrokerAuthRequest";
import { InteractionType } from "../utils/BrowserConstants";
import { BrokerRedirectResponse } from "./BrokerRedirectResponse";
import { BrokerAuthResult } from "./BrokerAuthResult";
import { BrowserStorage } from "../cache/BrowserStorage";
import { BrowserAuthError } from "../error/BrowserAuthError";
import { version } from "../../package.json";

const DEFAULT_MESSAGE_TIMEOUT = 2000;
const DEFAULT_POPUP_MESSAGE_TIMEOUT = 60000;
/**
 * Embedded application in a broker scenario.
 */
export class EmbeddedClientApplication {
    private logger: Logger;
    private config: Configuration;
    private version: string;
    private brokerOrigin: string;
    private browserStorage: BrowserStorage;

    private get trustedBrokersProvided(): boolean {
        return this.config.system.brokerOptions.trustedBrokerDomains && this.config.system.brokerOptions.trustedBrokerDomains.length >= 1;
    }
    public brokerConnectionEstablished: boolean;

    constructor(configuration: Configuration, logger: Logger, browserStorage: BrowserStorage) {
        this.config = configuration;
        this.logger = logger;
        this.browserStorage = browserStorage;
        this.brokerConnectionEstablished = false;
        this.version = version;
    }

    async initiateHandshake(): Promise<void> {
        if (!this.trustedBrokersProvided) {
            throw BrowserAuthError.createNoTrustedBrokersProvidedError();
        }

        try {
            const response = await this.sendHandshakeRequest();
            this.brokerOrigin = response.brokerOrigin;
            this.brokerConnectionEstablished = true;
        } catch (e) {
            this.logger.error(e);
            this.brokerConnectionEstablished = false;
            throw e;
        }
    }

    private async preflightBrokerRequest(): Promise<void> {
        if (!this.brokerConnectionEstablished) {
            this.logger.info("Attempting handshake...");
            try {
                await this.initiateHandshake();
            } catch (e) {
                this.logger.error("Handshake rejected");
                throw BrowserAuthError.createBrokeringDisabledError(e);
            }
        }
    }

    async sendPopupRequest(request: PopupRequest): Promise<AuthenticationResult> {
        await this.preflightBrokerRequest();

        const brokerAuthResultMessage = await this.sendRequest(request, InteractionType.POPUP, DEFAULT_POPUP_MESSAGE_TIMEOUT);
        const brokerAuthResult = BrokerAuthResult.validate(brokerAuthResultMessage);
        if (brokerAuthResult.error) {
            throw brokerAuthResult.error;
        }
        const accessTokenEntity: AccessTokenEntity = new AccessTokenEntity();
        const idTokenEntity: IdTokenEntity = new IdTokenEntity();
        const accountEntity: AccountEntity = new AccountEntity();
        const cacheRecord: CacheRecord = {
            accessToken: CacheManager.toObject(brokerAuthResult.result.tokensToCache.accessToken, accessTokenEntity) as AccessTokenEntity,
            idToken: CacheManager.toObject(brokerAuthResult.result.tokensToCache.idToken, idTokenEntity) as IdTokenEntity,
            account: CacheManager.toObject(brokerAuthResult.result.tokensToCache.account, accountEntity) as AccountEntity,
            refreshToken: null
        };
        this.browserStorage.saveCacheRecord(cacheRecord);
        delete brokerAuthResult.result.tokensToCache;
        return {
            ...brokerAuthResult.result
        };
    }

    async sendRedirectRequest(request: RedirectRequest): Promise<void> {
        await this.preflightBrokerRequest();

        const message = await this.sendRequest(request, InteractionType.REDIRECT, DEFAULT_MESSAGE_TIMEOUT);
        BrokerRedirectResponse.validate(message);
    }

    private async sendRequest(request: PopupRequest|RedirectRequest, interactionType: InteractionType, timeoutMs: number): Promise<MessageEvent> {
        const brokerRequest = new BrokerAuthRequest(this.config.auth.clientId, interactionType, request);

        return this.messageBroker<MessageEvent>(brokerRequest, timeoutMs);
    }

    private async sendHandshakeRequest(): Promise<BrokerHandshakeResponse> {
        return new Promise<BrokerHandshakeResponse>((resolve: any, reject: any) => {
            const timeoutId = setTimeout(() => {
                this.logger.warning("Broker handshake timed out");
                reject(BrowserAuthError.createMessageBrokerTimeoutError());
            }, DEFAULT_MESSAGE_TIMEOUT);

            const onHandshakeResponse = (message: MessageEvent) => {
                try {
                    const brokerHandshakeResponse = BrokerHandshakeResponse.validate(message, this.config.system.brokerOptions.trustedBrokerDomains);
                    if (brokerHandshakeResponse) {
                        clearTimeout(timeoutId);
                        this.logger.info(`Received handshake response: ${JSON.stringify(brokerHandshakeResponse)}`);
                        resolve(brokerHandshakeResponse);
                    } else {
                        this.logger.warning(`Message is not handshake response: ${message}`);
                    }
                } catch (e) {
                    reject(e);
                }
                window.removeEventListener("message", onHandshakeResponse);
            };

            window.addEventListener("message", onHandshakeResponse);

            const handshakeRequest = new BrokerHandshakeRequest(this.config.auth.clientId, this.version);
            this.logger.verbose(`Sending handshake request: ${handshakeRequest}`);
            // Message top frame window
            window.top.postMessage(handshakeRequest, "*");
        });
    }

    private async messageBroker<T>(payload: any, timeoutMs: number = DEFAULT_MESSAGE_TIMEOUT): Promise<T> {
        return new Promise<T>((resolve: any, reject: any) => {
            const timeoutId = setTimeout(() => {
                reject(BrowserAuthError.createMessageBrokerTimeoutError());
            }, timeoutMs);

            const messageChannel = new MessageChannel();
            messageChannel.port1.onmessage = ((message: MessageEvent): void => {
                this.logger.verbose(`in messageBroker<T> w/ origin: ${message}`);
                clearTimeout(timeoutId);
                resolve(message);
            });
            // Message top frame window
            window.top.postMessage(payload, this.brokerOrigin, [messageChannel.port2]);
        });
    }
}
