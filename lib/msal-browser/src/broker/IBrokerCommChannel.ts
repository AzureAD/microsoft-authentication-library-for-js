/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export interface IBrokerCommChannel {
    /**
     * Sends a message to the broker server and gets a response back. The method throws an exception in case of failure.
     * @param messageName Name of the message to be sent
     * @param payload Payload to be sent along with the message
     */
    sendMessageWithPayloadAndGetResponse<T1, T2>(messageName: BrokerMessageName, payload: T1): Promise<T2>;

    /**
     * Sends a message to the broker server and gets a response back. The method throws an exception in case of failure.
     * @param messageName Name of the message to be sent
     */
    sendMessageAndGetResponse<T>(messageName: BrokerMessageName): Promise<T>;
    
    /**
     * Sends a message to the broker server. The method throws an exception in case of failure.
     * @param messageName Name of the message to be sent.
     * @param payload Payload to be sent along with the message
     */
    sendMessageWithPayload<T>(messageName: BrokerMessageName, payload: T): Promise<void>;

    /**
     * Sends a message to the broker server. The method throws an exception in case of failure.
     * @param messageName Name of the message to be sent.
     */
    sendMessage(messageName: BrokerMessageName): Promise<void>;
}

/**
 * Names of messages sent from broker client to broker server
 */
export enum BrokerMessageName {
    /**
     * Name of Initial handshake message sent
     * This message should be sent only while initializing the module for once
     */
    Handshake = 0,

    /**
     * Name of message sent to get the current account info
     */
    Account = 1,

    /**
     * Name of message sent to get the access + id tokens
     */
    Token = 2
}
