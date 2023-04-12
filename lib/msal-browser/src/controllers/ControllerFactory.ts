/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TeamsAppOperatingContext } from "../operatingcontext/TeamsAppOperatingContext";
import { StandardOperatingContext } from "../operatingcontext/StandardOperatingContext";
import { IController } from "./IController";
import { Logger } from "@azure/msal-common";
import { Configuration } from "../config/Configuration";
import { version, name } from "../packageMetadata";

export class ControllerFactory {
    protected config: Configuration;
    protected logger: Logger;

    constructor(config: Configuration) {
        this.config = config;
        const loggerOptions = {
            loggerCallback: undefined,
            piiLoggingEnabled: false,
            logLevel: undefined,
            correlationId: undefined,
        };
        this.logger = new Logger(loggerOptions, name, version);
    }

    async createController(): Promise<IController> {
        const standard = new StandardOperatingContext(this.config);
        const metaOS = new TeamsAppOperatingContext(this.config);

        const operatingContexts = [standard.initialize(), metaOS.initialize()];

        return Promise.all(operatingContexts).then(async () => {
            if (metaOS.isAvailable()) {
                /*
                 * pull down metaos module
                 * create associated controller
                 */
                // return await StandardController.createController(standard);
                const controller = await import("./StandardController");
                return await controller.StandardController.createController(
                    standard
                );
            } else if (standard.isAvailable()) {
                const controller = await import("./StandardController");
                return await controller.StandardController.createController(
                    standard
                );
            }

            throw new Error("No controller found.");
        });
    }
}
