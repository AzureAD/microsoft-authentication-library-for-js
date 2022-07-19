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
     * Configuration options related to authentication, such as, authority, protocol, and whether to use a clock skew.
     */
    auth?: TokenValidationOptions,
    /**
     * Configuration options related to operations performed by the library, such as, logging and network requests.
     */
    system?: SystemOptions
};

/**
 * Use this to configure the auth options in the Configuration object
 */
export type TokenValidationOptions = {
    /**
     * Specific authority, used for obtaining keys from the metadata endpoint. Usually takes the form of `https://{uri}/{tenantid}`.
     */
    authority?: string,
    /**
     * Enum that represents the protocol used by the TokenValidator. 
     * Used for configuring proper endpoints. 
     */
    protocolMode?: ProtocolMode,
    /**
     * An array of URIs that are known to be valid. Used in B2C scenarios.
     */
    knownAuthorities?: Array<string>,
    /**
     * Clock skew (in seconds) allowed in token validation. Must be a positive integer.
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
