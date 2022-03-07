/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { INetworkModule } from "@azure/msal-common";
import { HttpClient } from "../network/HttpClient";

export class NetworkUtils {
    static getNetworkClient(): INetworkModule {
        return new HttpClient();
    }
}
