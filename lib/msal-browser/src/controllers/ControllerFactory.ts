/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TeamsAppOperatingContext } from "../operatingcontext/TeamsAppOperatingContext";
import { StandardOperatingContext } from "../operatingcontext/StandardOperatingContext";
import { IController } from "./IController";
import { Configuration } from "../config/Configuration";
import { StandardController } from "./StandardController";
import { NestedAppAuthController } from "./NestedAppAuthController";

export async function createV3Controller(
    config: Configuration
): Promise<IController> {
    const standard = new StandardOperatingContext(config);

    await standard.initialize();
    return StandardController.createController(standard);
}

export async function createController(
    config: Configuration
): Promise<IController | null> {
    const standard = new StandardOperatingContext(config);
    const teamsApp = new TeamsAppOperatingContext(config);

    const operatingContexts = [standard.initialize(), teamsApp.initialize()];

    await Promise.all(operatingContexts);

    if (teamsApp.isAvailable()) {
        return NestedAppAuthController.createController(teamsApp);
    } else if (standard.isAvailable()) {
        return StandardController.createController(standard);
    } else {
        // Since neither of the actual operating contexts are available keep the UnknownOperatingContextController
        return null;
    }
}
