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
import { CACHE } from '../utils/Constants';
import debug from 'debug';
import { InMemoryCache } from "cache/serializer/SerializerTypes";

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
 * - cacheLocation            - Used to specify the cacheLocation user wants to set. Valid values are "localStorage" and "sessionStorage"
 * - storeAuthStateInCookie   - If set, MSAL store's the auth request state required for validation of the auth flows in the browser cookies. By default this flag is set to false.
 */
// TODO Temporary placeholder - this will be rewritten by cache PR.
export type CacheOptions = {
    cacheLocation?: string;
    storeAuthStateInCookie?: boolean;
    cacheInMemory?: InMemoryCache;
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

const DEFAULT_CACHE_OPTIONS: CacheOptions = {
    cacheLocation: CACHE.FILE_CACHE,
    storeAuthStateInCookie: false,
    cacheInMemory: {
        accounts: {},
        idTokens: {},
        accessTokens: {},
        refreshTokens: {},
        appMetadata: {},
    },
};

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
