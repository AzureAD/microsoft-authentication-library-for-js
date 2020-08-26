/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { version } from "../../package.json";
import { BrokerAuthenticationResult, ServerTelemetryManager, AuthorizationCodeClient, BrokerAuthorizationCodeClient } from "@azure/msal-common";
import { PublicClientApplication } from "../app/PublicClientApplication";
import { BrokerMessage } from "./BrokerMessage";
import { BrokerMessageType, InteractionType } from "../utils/BrowserConstants";
import { Configuration } from "../config/Configuration";
import { BrokerHandshakeRequest } from "./BrokerHandshakeRequest";
import { BrokerHandshakeResponse } from "./BrokerHandshakeResponse";
import { BrokerAuthRequest } from "./BrokerAuthRequest";
import { BrokerRedirectResponse } from "./BrokerRedirectResponse";
import { RedirectRequest } from "../request/RedirectRequest";
import { BrokerAuthResult } from "./BrokerAuthResult";

/**
 * Broker Application class to manage brokered requests.
 */
export class BrokerClientApplication extends PublicClientApplication {

    constructor(configuration: Configuration) {
        super(configuration);
        this.logger.verbose("Acting as Broker");
        this.listenForBrokerMessage();
    }

    /**
     * 
     */
    private listenForBrokerMessage(): void {
        window.addEventListener("message", this.handleBrokerMessage);
    }

    /**
     * 
     * @param message 
     */
    private handleBrokerMessage(message: MessageEvent): void {
        // Check that message is a BrokerHandshakeRequest
        const clientMessage = BrokerMessage.validateMessage(message);
        if (clientMessage) {
            switch (clientMessage.data.messageType) {
                case BrokerMessageType.HANDSHAKE_REQUEST:
                    this.logger.verbose("Broker handshake request received");
                    return this.handleBrokerHandshake(clientMessage);
                case BrokerMessageType.AUTH_REQUEST:
                    this.logger.verbose("Broker auth request received");
                    return this.handleBrokerAuthRequest(clientMessage);
                default:
                    return;
            }
        }
    }

    /* eslint-disable */
    /**
     * Handle a broker handshake request from a child.
     * @param clientMessage 
     */
    private handleBrokerHandshake(clientMessage: MessageEvent): void {
        const validMessage = BrokerHandshakeRequest.validate(clientMessage);
        this.logger.verbose(`Broker handshake validated: ${validMessage}`);
        const brokerHandshakeResponse = new BrokerHandshakeResponse(version);

        // @ts-ignore
        clientMessage.source.postMessage(brokerHandshakeResponse, clientMessage.origin);
        this.logger.info(`Sending handshake response: ${brokerHandshakeResponse}`);
    }

    /**
     * Handle a brokered auth request from the child.
     * @param clientMessage 
     */
    private handleBrokerAuthRequest(clientMessage: MessageEvent): void {
        const validMessage = BrokerAuthRequest.validate(clientMessage);
        this.logger.verbose(`Broker auth request validated: ${validMessage}`);
        if (validMessage.interactionType === InteractionType.REDIRECT) {
            const brokerRedirectResp = new BrokerRedirectResponse();
            // @ts-ignore
            clientMessage.ports[0].postMessage(brokerRedirectResp);
            this.logger.info(`Sending redirect response: ${brokerRedirectResp}`);

            // Call loginRedirect
            this.acquireTokenRedirect(validMessage.request as RedirectRequest);
        } else if (validMessage.interactionType === InteractionType.POPUP) {
            this.loginPopup().then((response: BrokerAuthenticationResult) => {
                const brokerAuthResponse = new BrokerAuthResult(InteractionType.POPUP, response);
                this.logger.info(`Sending auth response: ${brokerAuthResponse}`);
                clientMessage.ports[0].postMessage(brokerAuthResponse);
            }).catch((err: Error) => {
                const brokerAuthResponse = new BrokerAuthResult(InteractionType.POPUP, null, err);
                this.logger.info(`Found auth error: ${err}`);
                clientMessage.ports[0].postMessage(brokerAuthResponse);
            });
        }
    }

    /**
     * Creates an Broker Authorization Code Client with the given authority, or the default authority.
     * @param authorityUrl 
     */
    protected async createAuthCodeClient(serverTelemetryManager: ServerTelemetryManager, authorityUrl?: string): Promise<AuthorizationCodeClient> {
        // Create auth module.
        const clientConfig = await this.getClientConfiguration(serverTelemetryManager, authorityUrl);
        
        return new BrokerAuthorizationCodeClient(clientConfig);
    }
}
