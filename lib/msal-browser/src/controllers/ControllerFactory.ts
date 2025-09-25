/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { NestedAppOperatingContext } from "../operatingcontext/NestedAppOperatingContext.js";
import { StandardOperatingContext } from "../operatingcontext/StandardOperatingContext.js";
import { IController } from "./IController.js";
import { Configuration } from "../config/Configuration.js";
import { StandardController } from "./StandardController.js";
import { NestedAppAuthController } from "./NestedAppAuthController.js";
import { InitializeApplicationRequest } from "../request/InitializeApplicationRequest.js";
import { createNewGuid } from "../crypto/BrowserCrypto.js";

export async function createV3Controller(
    config: Configuration,
    request?: InitializeApplicationRequest
): Promise<IController> {
    const correlationId = request?.correlationId || createNewGuid();
    const standard = new StandardOperatingContext(config);

    await standard.initialize(correlationId);
    return StandardController.createController(standard, { correlationId });
}

export async function createController(
    config: Configuration,
    request?: InitializeApplicationRequest
): Promise<IController | null> {
    const correlationId = request?.correlationId || createNewGuid();
    const standard = new StandardOperatingContext(config);
    const nestedApp = new NestedAppOperatingContext(config);

    const operatingContexts = [
        standard.initialize(correlationId),
        nestedApp.initialize(correlationId),
    ];

    await Promise.all(operatingContexts);

    if (nestedApp.isAvailable()) {
        return NestedAppAuthController.createController(nestedApp);
    } else if (standard.isAvailable()) {
        return StandardController.createController(standard, { correlationId });
    } else {
        // Since neither of the actual operating contexts are available keep the UnknownOperatingContextController
        return null;
    }
}
