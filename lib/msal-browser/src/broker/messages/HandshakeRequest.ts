/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export type HandshakeRequest = {
    /**
     * Name of the auth lib. It will be MSAL.js in this case
     */
    authLibName: string,

    /**
     * Version of auth lib, should be the loaded version of MSAL.js
     */
    authLibVersion: string,

    /**
     * Supported protocol version by broker client
     * This is the version of protocol between broker client (MSAL.js, this module) and the broker server (broker app)
     */
    supportedProtocolVersion: string,

    /**
     * The client ID as used by the broker client application
     * At the moment this isn't used, but might be used by broker server for validations in future
     */
    clientId: string
};
