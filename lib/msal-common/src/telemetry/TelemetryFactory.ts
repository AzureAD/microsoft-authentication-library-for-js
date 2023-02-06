/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {Logger} from "../logger/Logger";
import {ApplicationTelemetry} from "../config/ClientConfiguration";
import {IPerformanceClient} from "./performance/IPerformanceClient";
import {StubPerformanceClient} from "./performance/StubPerformanceClient";

export interface PerfClientParams {
    clientId: string;
    authority: string;
    logger: Logger;
    application: ApplicationTelemetry;
    name: string;
    version: string;
}

export class TelemetryFactory {

    protected static perfClient?: IPerformanceClient;

    public static initClient(params: PerfClientParams): void {
        if (!this.perfClient) {
            this.perfClient = this.newClient(params);
        }
    }

    public static client(): IPerformanceClient | undefined {
        return this.perfClient;
    }

    public static newClient(params: PerfClientParams): IPerformanceClient {
        return new StubPerformanceClient(params.clientId, params.authority, params.logger, params.name, params.version, params.application);
    }
}

