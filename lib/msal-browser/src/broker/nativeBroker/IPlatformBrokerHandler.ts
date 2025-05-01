/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { PlatformBrokerRequest } from "./NativeRequest.js";
import { PlatformBrokerResponse } from "./NativeResponse.js";

/**
 * Interface for the Platform Broker Handlers
 */
export interface IPlatformBrokerHandler {
    getExtensionId(): string | undefined;
    getExtensionVersion(): string | undefined;
    sendMessage(
        request: PlatformBrokerRequest
    ): Promise<PlatformBrokerResponse>;
    validateNativeResponse(response: object): PlatformBrokerResponse;
}
