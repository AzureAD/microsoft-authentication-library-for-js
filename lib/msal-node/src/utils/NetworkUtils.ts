/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { INetworkModule } from "@azure/msal-common";
import { HttpClient } from "../network/HttpClient";

export class NetworkUtils {
    /**
     * Returns best compatible network client object.
     */
    static getNetworkClient(): INetworkModule {
        return new HttpClient();
    }
}
