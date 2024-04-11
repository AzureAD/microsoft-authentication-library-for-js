/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError } from "@azure/msal-common";
import * as ConfigurationErrorCodes from "./ConfigurationErrorCodes";
export { ConfigurationErrorCodes };

/**
 * ConfigurationErrorMessages class containing string constants used by error codes and messages.
 */
export const ConfigurationErrorMessages = {
    [ConfigurationErrorCodes.claimsBasedCachingEnabled]:
        "Claims based caching is no longer supported.",
};

export class ConfigurationError extends AuthError {
    constructor(errorCode: string) {
        super(errorCode, ConfigurationErrorMessages[errorCode]);
        this.name = "ConfigurationError";
        Object.setPrototypeOf(this, ConfigurationError.prototype);
    }
}

export function createConfigurationError(
    errorCode: string
): ConfigurationError {
    return new ConfigurationError(errorCode);
}
