/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BrokerOptions } from "../config/Configuration";
import { BrokerHandshakeRequest } from "./BrokerHandshakeRequest";
import { BrokerHandshakeResponse } from "./BrokerHandshakeResponse";
import { BrokerMessage } from "./BrokerMessage";
import { BrokerAuthRequest } from "./BrokerAuthRequest";
import { BrokerMessageType, InteractionType } from "../utils/BrowserConstants";
import { BrokerRedirectResponse } from "./BrokerRedirectResponse";
import { Logger } from "@azure/msal-common";

export class BrokerManager {
    private brokerOptions: BrokerOptions;
    private version: string;
    private logger: Logger;

    constructor(brokerOptions: BrokerOptions, logger: Logger, version: string) {
        this.brokerOptions = brokerOptions;
        this.logger = logger;
        this.version = version;
    }

    listenForMessage(): void {
        window.addEventListener("message", (message: MessageEvent): void => {
            this.logger.verbose("Broker handshake request received");
            // Check that message is a BrokerHandshakeRequest
            const clientMessage = BrokerMessage.validateMessage(message);
            if (clientMessage) {
                switch (clientMessage.data.messageType) {
                    case BrokerMessageType.HANDSHAKE_REQUEST:
                        return this.handleHandshake(clientMessage);
                    case BrokerMessageType.AUTH_REQUEST:
                        return this.handleAuthRequest(clientMessage);
                    default:
                        return;
                }
            }
        });
    }

    /* eslint-disable */
    /**
     * Handle a broker handshake request from a child.
     * @param clientMessage 
     */
    private handleHandshake(clientMessage: MessageEvent): void {
        const validMessage = BrokerHandshakeRequest.validate(clientMessage);
        console.log("Broker handshake validated: ", validMessage);
        const brokerHandshakeResponse = new BrokerHandshakeResponse(this.version);

        // @ts-ignore
        clientMessage.source.postMessage(brokerHandshakeResponse, clientMessage.origin);
        console.log("Sending handshake response: ", brokerHandshakeResponse);
    }
    

    /**
     * Handle a brokered auth request from the child.
     * @param clientMessage 
     */
    private handleAuthRequest(clientMessage: MessageEvent): void {
        const validMessage = BrokerAuthRequest.validate(clientMessage);
        console.log("Broker auth request validated: ", validMessage);
        if (validMessage.interactionType === InteractionType.REDIRECT) {
            const brokerRedirectResp = new BrokerRedirectResponse();
            // @ts-ignore
            clientMessage.ports[0].postMessage(brokerRedirectResp);
            console.log("Sending redirect response: ", brokerRedirectResp);

            // Call loginRedirect
        }
    }
    /* eslint-enable */
}
