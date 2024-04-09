/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ClientAssertionCallbackFunction = (...args: any[]) => string;

/**
 * Client Assertion credential for Confidential Clients
 */
export type ClientAssertion = {
    assertion: ClientAssertionCallbackFunction;
    assertionType: string;
};

/**
 * Client Credentials set for Confidential Clients
 */
export type ClientCredentials = {
    clientSecret?: string;
    clientAssertion?: ClientAssertion;
};
