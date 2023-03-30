/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BridgeCapabilities } from "./BridgeCapabilities";

export interface InitializeBridgeResponse {
    success: boolean;
    capabilities: BridgeCapabilities;
    sdkName: string;
    sdkVersion: string;
}
