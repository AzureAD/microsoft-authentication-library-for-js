/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    IPerformanceClient,
} from "@azure/msal-common";
import { BrowserPerformanceClient } from "../../src/telemetry/BrowserPerformanceClient";
import { TEST_CONFIG } from "./StringConstants";

export function getDefaultPerformanceClient(): IPerformanceClient {
    return new BrowserPerformanceClient(
        {
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            },
        }
    );
}
