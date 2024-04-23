/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    ClientAssertionCallbackFunction,
    ClientAssertionConfig,
} from "../account/ClientCredentials";

export async function getClientAssertion(
    clientAssertion: string | ClientAssertionCallbackFunction,
    clientId: string,
    tokenEndpoint?: string
): Promise<string> {
    if (typeof clientAssertion === "string") {
        return clientAssertion;
    } else {
        const config: ClientAssertionConfig = {
            clientId: clientId,
            tokenEndpoint: tokenEndpoint,
        };
        return clientAssertion(config);
    }
}
