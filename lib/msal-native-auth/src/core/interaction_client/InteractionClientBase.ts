/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { InvalidArgumentError } from "../error/InvalidArgumentError.js";
import { INativeAuthApiClient } from "../network_client/INativeAuthApiClient.js";

export abstract class InteractionClientBase {
    constructor(protected nativeAuthApiClient: INativeAuthApiClient) {
        if (!nativeAuthApiClient) {
            throw new InvalidArgumentError("nativeAuthApiClient");
        }
    }
}
