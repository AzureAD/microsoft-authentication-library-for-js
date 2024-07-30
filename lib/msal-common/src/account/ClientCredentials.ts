/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export type ClientAssertionConfig = {
    clientId: string;
    tokenEndpoint?: string;
    claims?: string;
};

export type ClientAssertionCallback = (
    config: ClientAssertionConfig
) => Promise<string>;

/**
 * @deprecated Provide a callback instead of a string
 */
type assertionString = string;
type assertionCallback = ClientAssertionCallback;
/**
 * Client Assertion credential for Confidential Clients
 */
export type ClientAssertion = {
    assertion: assertionString | assertionCallback;
    assertionType: string;
};

/**
 * Client Credentials set for Confidential Clients
 */
export type ClientCredentials = {
    clientSecret?: string;
    clientAssertion?: ClientAssertion;
};
