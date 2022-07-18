/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { INetworkModule, LoggerOptions, LogLevel, ProtocolMode } from "@azure/msal-common";
import { Constants } from "../utils/Constants";
import { NetworkUtils } from "../utils/NetworkUtils";

/**
 * This object allows you to configure elements of the TokenValidator's functionality, and is passed into the constructor of TokenValidator.
 */
export type Configuration = {
    /**
     * This is where you configure auth elements like the authority used, the protocol used, and whether there is a clock skew.
     */
    auth?: TokenValidationOptions,
    /**
     * This is where you configure the logger and network client.
     */
    system?: SystemOptions
};

/**
 * Used this to configure the auth options in the Configuration object
 */
export type TokenValidationOptions = {
    /**
     * Specific authority, used for obtaining keys from the metadata endpoint. Usually takes the form of `https://{uri}/{tenantid}`.
     */
    authority?: string,
    /**
     * Enum that represents the protocol used by the TokenValidator. 
     * Used for configuring proper endpoints. 
     * When set to `OIDC`, the library will not include `/v2.0/` in the authority path when fetching authority metadata. 
     * When set to `AAD`, the library will include `/v2.0/` in the authority path when fetching authority metadata.
     */
    protocolMode?: ProtocolMode,
    /**
     * Clock skew (in seconds) allowed in token validation. Must be a positive integer.
     */
    knownAuthorities?: Array<string>,
    /**
     * An array of URIs that are known to be valid. Used in B2C scenarios.
     */
    clockSkew?: number
};

/**
 * Use this to configure the system options in the Configuration object
 */
export type SystemOptions = {
    /**
     * Used to initialize the Logger object
     */
    loggerOptions?: LoggerOptions;
    /**
     * Network interface implementation
     */
    networkClient?: INetworkModule;
};

/**
 * Configuration object used to configure the TokenValidator after defaults are set.
 */
export type TokenValidationConfiguration = {
    auth: Required<TokenValidationOptions>,
    system: Required<SystemOptions>
};

/**
 * Default logger options
 */
const DEFAULT_LOGGER_OPTIONS: LoggerOptions = {
    loggerCallback: (): void => {
        // allow users to not set logger call back
    },
    logLevel: LogLevel.Info,
    piiLoggingEnabled: false
};

/**
 * Default auth options
 */
const DEFAULT_TOKEN_VALIDATION_OPTIONS: Required<TokenValidationOptions> = {
    authority: Constants.DEFAULT_AUTHORITY,
    knownAuthorities: [],
    protocolMode: ProtocolMode.OIDC,
    clockSkew: 0
};

/**
 * Default system options
 */
const DEFAULT_SYSTEM_OPTIONS = {
    loggerOptions: DEFAULT_LOGGER_OPTIONS,
    networkClient: NetworkUtils.getNetworkClient()
};

/**
 * Function that sets default configurations when not explicitly configured
 * 
 * @param {Configuration} config Configuration
 * @returns {TokenValidationConfiguration} Configuration built with defaults
 */
export function buildConfiguration(config?: Configuration): TokenValidationConfiguration {
    return {
        auth: { ...DEFAULT_TOKEN_VALIDATION_OPTIONS, ...config?.auth },
        system: { ...DEFAULT_SYSTEM_OPTIONS, ...config?.system },
    };
}
