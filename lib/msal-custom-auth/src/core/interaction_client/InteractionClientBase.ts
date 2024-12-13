/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { InvalidArgumentError } from "../error/InvalidArgumentError.js";
import { ICustomAuthApiClient } from "../network_client/ICustomAuthApiClient.js";

export abstract class InteractionClientBase {
    constructor(protected customAuthApiClient: ICustomAuthApiClient) {
        if (!customAuthApiClient) {
            throw new InvalidArgumentError("customAuthApiClient");
        }
    }
}
