/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    LoggerOptions,
    INetworkModule,
    LogLevel,
    ProtocolMode,
    ICachePlugin,
    Constants,
    AzureCloudInstance,
    AzureCloudOptions,
    ApplicationTelemetry
} from "@azure/msal-common";
import { NetworkUtils } from "../utils/NetworkUtils";

/**
 * - clientId               - Client id of the application.
 * - authority              - Url of the authority. If no value is set, defaults to https://login.microsoftonline.com/common.
 * - knownAuthorities       - Needed for Azure B2C and ADFS. All authorities that will be used in the client application. Only the host of the authority should be passed in.
 * - clientSecret           - Secret string that the application uses when requesting a token. Only used in confidential client applications. Can be created in the Azure app registration portal.
 * - clientAssertion        - Assertion string that the application uses when requesting a token. Only used in confidential client applications. Assertion should be of type urn:ietf:params:oauth:client-assertion-type:jwt-bearer.
 * - clientCertificate      - Certificate that the application uses when requesting a token. Only used in confidential client applications. Requires hex encoded X.509 SHA-1 thumbprint of the certificiate, and the PEM encoded private key (string should contain -----BEGIN PRIVATE KEY----- ... -----END PRIVATE KEY----- )
 * - protocolMode           - Enum that represents the protocol that msal follows. Used for configuring proper endpoints.
 * - skipAuthorityMetadataCache - A flag to choose whether to use or not use the local metadata cache during authority initialization. Defaults to false.
 * @public
 */
export type NodeAuthOptions = {
    clientId: string;
    authority?: string;
    clientSecret?: string;
    clientAssertion?: string;
    clientCertificate?: {
        thumbprint: string,
        privateKey: string,
        x5c?: string
    };
    knownAuthorities?: Array<string>;
    cloudDiscoveryMetadata?: string;
    authorityMetadata?: string;
    clientCapabilities?: Array<string>;
    protocolMode?: ProtocolMode;
    azureCloudOptions?: AzureCloudOptions;
    skipAuthorityMetadataCache?: boolean;
};

/**
 * Use this to configure the below cache configuration options:
 *
 * - cachePlugin   - Plugin for reading and writing token cache to disk.
 * @public
 */
export type CacheOptions = {
    cachePlugin?: ICachePlugin;
};

/**
 * Type for configuring logger and http client options
 *
 * - logger                       - Used to initialize the Logger object; TODO: Expand on logger details or link to the documentation on logger
 * - networkClient                - Http client used for all http get and post calls. Defaults to using MSAL's default http client.
 * @public
 */
export type NodeSystemOptions = {
    loggerOptions?: LoggerOptions;
    networkClient?: INetworkModule;
    proxyUrl?: string;
};

export type NodeTelemetryOptions = {
    application?: ApplicationTelemetry;
};

/**
 * Use the configuration object to configure MSAL and initialize the client application object
 *
 * - auth: this is where you configure auth elements like clientID, authority used for authenticating against the Microsoft Identity Platform
 * - cache: this is where you configure cache location
 * - system: this is where you can configure the network client, logger
 * @public
 */
export type Configuration = {
    auth: NodeAuthOptions;
    cache?: CacheOptions;
    system?: NodeSystemOptions;
    telemetry?: NodeTelemetryOptions;
};

const DEFAULT_AUTH_OPTIONS: Required<NodeAuthOptions> = {
    clientId: Constants.EMPTY_STRING,
    authority: Constants.DEFAULT_AUTHORITY,
    clientSecret: Constants.EMPTY_STRING,
    clientAssertion: Constants.EMPTY_STRING,
    clientCertificate: {
        thumbprint: Constants.EMPTY_STRING,
        privateKey: Constants.EMPTY_STRING,
        x5c: Constants.EMPTY_STRING
    },
    knownAuthorities: [],
    cloudDiscoveryMetadata: Constants.EMPTY_STRING,
    authorityMetadata: Constants.EMPTY_STRING,
    clientCapabilities: [],
    protocolMode: ProtocolMode.AAD,
    azureCloudOptions: {
        azureCloudInstance: AzureCloudInstance.None,
        tenant: Constants.EMPTY_STRING
    },
    skipAuthorityMetadataCache: false,
};

const DEFAULT_CACHE_OPTIONS: CacheOptions = {};

const DEFAULT_LOGGER_OPTIONS: LoggerOptions = {
    loggerCallback: (): void => {
        // allow users to not set logger call back
    },
    piiLoggingEnabled: false,
    logLevel: LogLevel.Info,
};

const DEFAULT_SYSTEM_OPTIONS: Required<NodeSystemOptions> = {
    loggerOptions: DEFAULT_LOGGER_OPTIONS,
    networkClient: NetworkUtils.getNetworkClient(),
    proxyUrl: Constants.EMPTY_STRING,
};

const DEFAULT_TELEMETRY_OPTIONS: Required<NodeTelemetryOptions> = {
    application: {
        appName: Constants.EMPTY_STRING,
        appVersion: Constants.EMPTY_STRING
    }
};

export type NodeConfiguration = {
    auth: Required<NodeAuthOptions>;
    cache: CacheOptions;
    system: Required<NodeSystemOptions>;
    telemetry: Required<NodeTelemetryOptions>;
};

/**
 * Sets the default options when not explicitly configured from app developer
 *
 * @param auth - Authentication options
 * @param cache - Cache options
 * @param system - System options
 * @param telemetry - Telemetry options
 *
 * @returns Configuration
 * @public
 */
export function buildAppConfiguration({
    auth,
    cache,
    system,
    telemetry
}: Configuration): NodeConfiguration {

    return {
        auth: { ...DEFAULT_AUTH_OPTIONS, ...auth },
        cache: { ...DEFAULT_CACHE_OPTIONS, ...cache },
        system: { ...DEFAULT_SYSTEM_OPTIONS, ...system },
        telemetry: { ...DEFAULT_TELEMETRY_OPTIONS, ...telemetry }
    };
}
