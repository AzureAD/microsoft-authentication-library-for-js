/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { INetworkModule, LoggerOptions, LogLevel, ProtocolMode } from "@azure/msal-common";
import { Constants } from "../utils/Constants";
import { NetworkUtils } from "../utils/NetworkUtils";

export type Configuration = {
    auth?: TokenValidationOptions,
    system?: SystemOptions
};

export type TokenValidationOptions = {
    authority?: string,
    /**
     * An array of URIs that are known to be valid. Used in B2C scenarios.
     */
    knownAuthorities?: Array<string>,
    protocolMode?: ProtocolMode
    clockSkew?: number,
};

export type SystemOptions = {
    loggerOptions?: LoggerOptions,
    networkClient?: INetworkModule
};

export type TokenValidationConfiguration = {
    auth: Required<TokenValidationOptions>,
    system: Required<SystemOptions>
};

const DEFAULT_LOGGER_OPTIONS: LoggerOptions = {
    loggerCallback: (): void => {
        // allow users to not set logger call back
    },
    logLevel: LogLevel.Info,
    piiLoggingEnabled: false
};

const DEFAULT_TOKEN_VALIDATION_OPTIONS: Required<TokenValidationOptions> = {
    authority: Constants.DEFAULT_AUTHORITY,
    knownAuthorities: [],
    protocolMode: ProtocolMode.OIDC,
    clockSkew: 0
};

const DEFAULT_SYSTEM_OPTIONS = {
    loggerOptions: DEFAULT_LOGGER_OPTIONS,
    networkClient: NetworkUtils.getNetworkClient()
};

/**
 * Function that sets default configurations when not explicitly configured
 * 
 * @param {@link (Configuration:type)} 
 * @returns 
 */
export function buildConfiguration(config?: Configuration): TokenValidationConfiguration {
    return {
        auth: { ...DEFAULT_TOKEN_VALIDATION_OPTIONS, ...config?.auth },
        system: { ...DEFAULT_SYSTEM_OPTIONS, ...config?.system },
    };
}
