/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {PerfClientParams, TelemetryFactory, IPerformanceClient, ICrypto} from "@azure/msal-common";
import {BrowserPerformanceClient} from "./BrowserPerformanceClient";

export interface BrowserPerfClientParams extends PerfClientParams {
    isBrowserEnv?: boolean;
    crypto: ICrypto;
}

export class BrowserTelemetryFactory extends TelemetryFactory {

    public static initClient(params: BrowserPerfClientParams): void {
        super.initClient(params);
    }

    public static newClient(params: BrowserPerfClientParams): IPerformanceClient {
        return params.isBrowserEnv ?
            new BrowserPerformanceClient(params.clientId, params.authority, params.logger, params.name, params.version, params.application, params.crypto):
            super.newClient(params);
    }
}

