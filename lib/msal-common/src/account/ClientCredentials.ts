/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export type ClientAssertionConfig = {
    clientId: string;
    tokenEndpoint?: string;
};

export type ClientAssertionCallbackFunction = (
    config: ClientAssertionConfig
) => Promise<string>;

/**
 * Client Assertion credential for Confidential Clients
 */
export type ClientAssertion = {
    assertion: string | ClientAssertionCallbackFunction;
    assertionType: string;
};

/**
 * Client Credentials set for Confidential Clients
 */
export type ClientCredentials = {
    clientSecret?: string;
    clientAssertion?: ClientAssertion;
};
