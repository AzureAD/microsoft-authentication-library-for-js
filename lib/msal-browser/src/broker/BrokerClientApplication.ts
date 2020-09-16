/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { version } from "../../package.json";
import { BrokerAuthenticationResult, ServerTelemetryManager, AuthorizationCodeClient, BrokerAuthorizationCodeClient, BrokerRefreshTokenClient, RefreshTokenClient } from "@azure/msal-common";
import { BrokerMessage } from "./BrokerMessage";
import { BrokerMessageType, InteractionType } from "../utils/BrowserConstants";
import { Configuration } from "../config/Configuration";
import { BrokerHandshakeRequest } from "./BrokerHandshakeRequest";
import { BrokerHandshakeResponse } from "./BrokerHandshakeResponse";
import { BrokerAuthRequest } from "./BrokerAuthRequest";
import { BrokerRedirectResponse } from "./BrokerRedirectResponse";
import { RedirectRequest } from "../request/RedirectRequest";
import { BrokerAuthResponse } from "./BrokerAuthResponse";
import { ClientApplication } from "../app/ClientApplication";
import { PopupRequest } from "../request/PopupRequest";
import { SilentRequest } from "../request/SilentRequest";

/**
 * Broker Application class to manage brokered requests.
 */
export class BrokerClientApplication extends ClientApplication {

    constructor(configuration: Configuration) {
        super(configuration);
        this.logger.verbose("Acting as Broker");
    }

    /**
     * 
     */
    listenForBrokerMessage(): void {
        window.addEventListener("message", this.handleBrokerMessage.bind(this));
    }

    /**
     * 
     * @param message 
     */
    private async handleBrokerMessage(message: MessageEvent): Promise<void> {
        // Check that message is a BrokerHandshakeRequest
        const clientMessage = BrokerMessage.validateMessage(message);
        if (clientMessage) {
            switch (clientMessage.data.messageType) {
                case BrokerMessageType.HANDSHAKE_REQUEST:
                    this.logger.verbose("Broker handshake request received");
                    return await this.handleBrokerHandshake(clientMessage);
                case BrokerMessageType.AUTH_REQUEST:
                    this.logger.verbose("Broker auth request received");
                    return await this.handleBrokerAuthRequest(clientMessage);
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
    private async handleBrokerHandshake(clientMessage: MessageEvent): Promise<void> {
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
    private async handleBrokerAuthRequest(clientMessage: MessageEvent): Promise<void> {
        const validMessage = BrokerAuthRequest.validate(clientMessage);
        if (validMessage) {
            this.logger.verbose(`Broker auth request validated: ${validMessage}`);
            switch (validMessage.interactionType) {
                case InteractionType.REDIRECT:
                    return this.brokeredRedirectRequest(validMessage, clientMessage.ports[0]);
                case InteractionType.POPUP:
                    return this.brokeredPopupRequest(validMessage, clientMessage.ports[0]);
                case InteractionType.SILENT:
                    return this.brokeredSilentRequest(validMessage, clientMessage.ports[0]);
                default:
                    return;
            }
        }
    }

    private async brokeredRedirectRequest(validMessage: BrokerAuthRequest, clientPort: MessagePort): Promise<void> {
        const brokerRedirectResp = new BrokerRedirectResponse();
        // @ts-ignore
        clientPort.postMessage(brokerRedirectResp);
        clientPort.close();
        this.logger.info(`Sending redirect response: ${brokerRedirectResp}`);

        // Call loginRedirect
        this.acquireTokenRedirect(validMessage.request as RedirectRequest);
    }

    private async brokeredPopupRequest(validMessage: BrokerAuthRequest, clientPort: MessagePort): Promise<void> {
        try {
            const response: BrokerAuthenticationResult = (await this.acquireTokenPopup(validMessage.request as PopupRequest)) as BrokerAuthenticationResult;
            const brokerAuthResponse: BrokerAuthResponse = new BrokerAuthResponse(InteractionType.POPUP, response);
            this.logger.info(`Sending auth response: ${brokerAuthResponse}`);
            clientPort.postMessage(brokerAuthResponse);
            clientPort.close();
        } catch (err) {
            const brokerAuthResponse = new BrokerAuthResponse(InteractionType.POPUP, null, err);
            this.logger.info(`Found auth error: ${err}`);
            clientPort.postMessage(brokerAuthResponse);
            clientPort.close();
        }
    }

    private async brokeredSilentRequest(validMessage: BrokerAuthRequest, clientPort: MessagePort): Promise<void> {
        try {
            const response: BrokerAuthenticationResult = (await this.acquireTokenByRefreshToken(validMessage.request as SilentRequest)) as BrokerAuthenticationResult;
            const brokerAuthResponse: BrokerAuthResponse = new BrokerAuthResponse(InteractionType.SILENT, response);
            this.logger.info(`Sending auth response: ${brokerAuthResponse}`);
            clientPort.postMessage(brokerAuthResponse);
            clientPort.close();
        } catch (err) {
            const brokerAuthResponse = new BrokerAuthResponse(InteractionType.SILENT, null, err);
            this.logger.info(`Found auth error: ${err}`);
            clientPort.postMessage(brokerAuthResponse);
            clientPort.close();
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

    /**
     * Creates a Refresh Client with the given authority, or the default authority.
     * @param authorityUrl 
     */
    protected async createRefreshTokenClient(serverTelemetryManager: ServerTelemetryManager, authorityUrl?: string): Promise<RefreshTokenClient> {
        // Create auth module.
        const clientConfig = await this.getClientConfiguration(serverTelemetryManager, authorityUrl);
        return new BrokerRefreshTokenClient(clientConfig);
    }
}
