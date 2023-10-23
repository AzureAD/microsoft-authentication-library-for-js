/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BridgeCapabilities } from "./BridgeCapabilities";

export interface InitializeBridgeResponse {
    capabilities: BridgeCapabilities;
    sdkName: string;
    sdkVersion: string;
}
