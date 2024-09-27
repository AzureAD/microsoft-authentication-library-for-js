/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Broker parameters
 */
export type BrokerParameters = {
    // Embedded client id
    embeddedClientId: string;
    // Broker client id
    brokerClientId: string;
    // Broker redirect URI
    brokerRedirectUri: string;
};
