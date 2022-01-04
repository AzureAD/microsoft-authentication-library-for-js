/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { LoggerOptions, LogLevel } from "@azure/msal-common";
import { Constants } from "../utils/Constants";

export type Configuration = {
    auth: TokenValidationOptions,
    system?: SystemOptions
};

export type TokenValidationOptions = {
    authority: string,
    clockSkew: Number,
    policyName?: string,
}

export type SystemOptions = {
    loggerOptions: LoggerOptions
}

export type TokenValidationConfiguration = {
    auth: Required<TokenValidationOptions>,
    system: Required<SystemOptions>
}

const DEFAULT_LOGGER_OPTIONS: LoggerOptions = {
    loggerCallback: (): void => {
        // allow users to not set logger call back
    },
    logLevel: LogLevel.Info,
    piiLoggingEnabled: false
};

const DEFAULT_TOKEN_VALIDATION_OPTIONS = {
    authority: Constants.DEFAULT_AUTHORITY,
    clockSkew: 0,
    policyName: ""
};

const DEFAULT_SYSTEM_OPTIONS = {
    loggerOptions: DEFAULT_LOGGER_OPTIONS
};

export function buildConfiguration({
    auth,
    system,
}: Configuration): TokenValidationConfiguration {
    return {
        auth: { ...DEFAULT_TOKEN_VALIDATION_OPTIONS, ...auth },
        system: { ...DEFAULT_SYSTEM_OPTIONS, ...system },
    };
}