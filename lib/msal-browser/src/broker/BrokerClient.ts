/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BrokerOptions } from "../config/Configuration";
import { Logger, ClientAuthError, AuthenticationResult, CacheRecord, CacheManager, AccessTokenEntity, IdTokenEntity, AccountEntity } from "@azure/msal-common";
import { BrokerHandshakeRequest } from "./BrokerHandshakeRequest";
import { BrokerHandshakeResponse } from "./BrokerHandshakeResponse";
import { PopupRequest } from "../request/PopupRequest";
import { RedirectRequest } from "../request/RedirectRequest";
import { BrokerAuthRequest } from "./BrokerAuthRequest";
import { InteractionType } from "../utils/BrowserConstants";
import { BrokerRedirectResponse } from "./BrokerRedirectResponse";
import { BrokerAuthResult } from "./BrokerAuthResult";
import { BrowserStorage } from "../cache/BrowserStorage";

const DEFAULT_MESSAGE_TIMEOUT = 2000;
/**
 * Embedded application in a broker scenario.
 */
export class BrokerClient {
    private brokerOptions: BrokerOptions;
    private logger: Logger;
    private clientId: string;
    private version: string;
    private brokerOrigin: string;
    private browserStorage: BrowserStorage;

    public brokeringEnabled: boolean;

    constructor(brokerOptions: BrokerOptions, logger: Logger, clientId: string, version: string, browserStorage: BrowserStorage) {
        this.brokerOptions = brokerOptions;
        this.logger = logger;
        this.clientId = clientId;
        this.version = version;
        this.browserStorage = browserStorage;

        if (!this.brokerOptions.trustedBrokerDomains || this.brokerOptions.trustedBrokerDomains.length < 1) {
            this.logger.info("Application was identified as an embedded app in a broker scenario, but no trusted broker domains were provided.");
            this.brokeringEnabled = false;
        } else {
            this.brokeringEnabled = true;
        }
    }

    async initiateHandshake(): Promise<void> {
        if (!this.brokeringEnabled) {
            this.logger.verbose("Brokering is not enabled, handshake was not performed.");
            return;
        }

        try {
            const response = await this.sendHandshakeRequest();
            this.brokerOrigin = response.brokerOrigin;
        } catch (e) {
            this.logger.error(e);
            this.brokeringEnabled = false;
            throw e;
        }
    }

    async sendPopupRequest(request: PopupRequest): Promise<AuthenticationResult> {
        return new Promise<AuthenticationResult> ((resolve: any, reject: any) => {
            this.sendRequest(request, InteractionType.POPUP, 6000).then((brokerAuthResultMessage: MessageEvent) => {
                const brokerAuthResult = BrokerAuthResult.validate(brokerAuthResultMessage);
                if (brokerAuthResult.error) {
                    reject(brokerAuthResult.error);
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
                resolve(brokerAuthResult.result);
            }).catch((err: ClientAuthError) => {
                reject(err);
            });
        });
    }

    async sendRedirectRequest(request: RedirectRequest): Promise<void> {
        const message = await this.sendRequest(request, InteractionType.REDIRECT, 2000);
        BrokerRedirectResponse.validate(message);
    }

    private async sendRequest(request: PopupRequest|RedirectRequest, interactionType: InteractionType, timeoutMs: number): Promise<MessageEvent> {
        const brokerRequest = new BrokerAuthRequest(this.clientId, interactionType, request);

        return this.messageBroker<MessageEvent>(brokerRequest, timeoutMs);
    }

    private async sendHandshakeRequest(): Promise<BrokerHandshakeResponse> {
        return new Promise<BrokerHandshakeResponse>((resolve: any, reject: any) => {
            const timeoutId = setTimeout(() => {
                this.logger.warning("Broker handshake timed out");
                reject(new ClientAuthError("message_broker_timeout", "Message broker timed out"));
            }, 2000);

            const onHandshakeResponse = (message: MessageEvent) => {
                try {
                    const brokerHandshakeResponse = BrokerHandshakeResponse.validate(message, this.brokerOptions.trustedBrokerDomains);
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

            const handshakeRequest = new BrokerHandshakeRequest(this.clientId, this.version);
            this.logger.verbose(`Sending handshake request: ${handshakeRequest}`);
            window.top.postMessage(handshakeRequest, "*");
        });
    }

    private async messageBroker<T>(payload: any, timeoutMs: number = DEFAULT_MESSAGE_TIMEOUT): Promise<T> {
        return new Promise<T>((resolve: any, reject: any) => {
            const timeoutId = setTimeout(() => {
                // TODO: Make this a BrowserAuthError
                reject(new ClientAuthError("message_broker_timeout", "Message broker timed out"));                
            }, timeoutMs);

            const messageChannel = new MessageChannel();
            messageChannel.port1.onmessage = ((message: MessageEvent): void => {
                this.logger.verbose(`in messageBroker<T> w/ origin: ${message}`);
                clearTimeout(timeoutId);
                resolve(message);
            });
            window.top.postMessage(payload, this.brokerOrigin, [messageChannel.port2]);
        });
    }
}
