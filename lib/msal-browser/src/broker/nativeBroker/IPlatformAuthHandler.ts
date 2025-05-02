/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { PlatformBrokerRequest } from "./PlatformBrokerRequest.js";
import { PlatformBrokerResponse } from "./PlatformBrokerResponse.js";

/**
 * Interface for the Platform Broker Handlers
 */
export interface IPlatformAuthHandler {
    getExtensionId(): string | undefined;
    getExtensionVersion(): string | undefined;
    sendMessage(
        request: PlatformBrokerRequest
    ): Promise<PlatformBrokerResponse>;
    validatePlatformBrokerResponse(response: object): PlatformBrokerResponse;
}
