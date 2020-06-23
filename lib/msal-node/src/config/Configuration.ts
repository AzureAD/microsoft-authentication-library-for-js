/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import {
    LoggerOptions,
    INetworkModule,
    LogLevel
} from '@azure/msal-common';
import { NetworkUtils } from '../utils/NetworkUtils';
import debug from 'debug';
import { ICachePlugin } from "cache/ICachePlugin";

/**
 * - clientId               - Client id of the application.
 * - authority              - Url of the authority. If no value is set, defaults to https://login.microsoftonline.com/common.
 * - knownAuthorities       - Needed for Azure B2C. All authorities that will be used in the client application.
 */
export type NodeAuthOptions = {
    clientId: string;
    authority?: string;
    knownAuthorities?: Array<string>;
};

/**
 * Use this to configure the below cache configuration options:
 *
 * - cachePlugin   - Plugin for reading and writing token cache to disk.
 */
export type CacheOptions = {
    cachePlugin?: ICachePlugin;
};

/**
 * Type for configuring logger and http client options
 *
 * - logger                       - Used to initialize the Logger object; TODO: Expand on logger details or link to the documentation on logger
 * - networkClient                - Http client used for all http get and post calls. Defaults to using MSAL's default http client.
 */
export type NodeSystemOptions = {
    loggerOptions?: LoggerOptions;
    networkClient?: INetworkModule;
};

/**
 * Use the configuration object to configure MSAL and initialize the client application object
 *
 * - auth: this is where you configure auth elements like clientID, authority used for authenticating against the Microsoft Identity Platform
 * - cache: this is where you configure cache location
 * - system: this is where you can configure the network client, logger
 */
export type Configuration = {
    auth: NodeAuthOptions;
    cache?: CacheOptions;
    system?: NodeSystemOptions;
};

const DEFAULT_AUTH_OPTIONS: NodeAuthOptions = {
    clientId: '',
    authority: '',
    knownAuthorities: [],
};

const DEFAULT_CACHE_OPTIONS: CacheOptions = {};

const DEFAULT_LOGGER_OPTIONS: LoggerOptions = {
    loggerCallback: (
        level: LogLevel,
        message: string,
        containsPii: boolean
    ) => {
        debug(`msal:${LogLevel[level]}${containsPii ? '-Pii' : ''}`)(message);
    },
    piiLoggingEnabled: false,
    logLevel: LogLevel.Info,
};

const DEFAULT_SYSTEM_OPTIONS: NodeSystemOptions = {
    loggerOptions: DEFAULT_LOGGER_OPTIONS,
    networkClient: NetworkUtils.getNetworkClient(),
};

/**
 * Sets the default options when not explicitly configured from app developer
 *
 * @param auth
 * @param cache
 * @param system
 *
 * @returns Configuration
 */
export function buildAppConfiguration({
    auth,
    cache,
    system,
}: Configuration): Configuration {
    return {
        auth: { ...DEFAULT_AUTH_OPTIONS, ...auth },
        cache: { ...DEFAULT_CACHE_OPTIONS, ...cache },
        system: { ...DEFAULT_SYSTEM_OPTIONS, ...system },
    };
}
