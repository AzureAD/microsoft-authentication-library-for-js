/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ProtocolMode } from "./ProtocolMode.js";
import { OIDCOptions } from "./OIDCOptions.js";
import { AzureRegionConfiguration } from "./AzureRegionConfiguration.js";
import { CloudInstanceDiscoveryResponse } from "./CloudInstanceDiscoveryResponse.js";

export type AuthorityOptions = {
    protocolMode: ProtocolMode;
    OIDCOptions?: OIDCOptions | null;
    knownAuthorities: Array<string>;
    cloudDiscoveryMetadata: string;
    authorityMetadata: string;
    azureRegionConfiguration?: AzureRegionConfiguration;
    authority?: string;
    /**
     * When true, the `issuer` returned by the OIDC discovery document
     * fetched from the network is validated against the configured authority
     * per https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfigurationValidation
     * Defaults to false. Cached, hardcoded, and config-provided metadata are
     * not re-validated.
     */
    validateAuthorityIssuer?: boolean;
};

export type StaticAuthorityOptions = Partial<
    Pick<AuthorityOptions, "knownAuthorities">
> & {
    canonicalAuthority?: string;
    cloudDiscoveryMetadata?: CloudInstanceDiscoveryResponse;
};

export const AzureCloudInstance = {
    // AzureCloudInstance is not specified.
    None: "none",

    // Microsoft Azure public cloud
    AzurePublic: "https://login.microsoftonline.com",

    // Microsoft PPE
    AzurePpe: "https://login.windows-ppe.net",

    // Microsoft Chinese national/regional cloud
    AzureChina: "https://login.chinacloudapi.cn",

    // Microsoft German national/regional cloud ("Black Forest")
    AzureGermany: "https://login.microsoftonline.de",

    // US Government cloud
    AzureUsGovernment: "https://login.microsoftonline.us",
} as const;
export type AzureCloudInstance =
    (typeof AzureCloudInstance)[keyof typeof AzureCloudInstance];
