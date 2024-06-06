/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BridgeCapabilities } from "./BridgeCapabilities";
import { AccountContext } from "./BridgeAccountContext";

export interface InitContext {
    capabilities?: BridgeCapabilities;
    sdkName: string;
    sdkVersion: string;
    accountContext?: AccountContext;
}
