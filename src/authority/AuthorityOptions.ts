/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ProtocolMode } from "./ProtocolMode";
import { AzureRegionConfiguration } from "./AzureRegionConfiguration";

export type AuthorityOptions = {
    protocolMode: ProtocolMode;
    knownAuthorities: Array<string>;
    cloudDiscoveryMetadata: string;
    authorityMetadata: string;
    skipLocalMetadataCache: boolean;
    azureRegionConfiguration?: AzureRegionConfiguration;
};

export enum AzureCloudInstance {
    // AzureCloudInstance is not specified.
    None,

    // Microsoft Azure public cloud
    AzurePublic = "https://login.microsoftonline.com",

    // Microsoft Chinese national cloud
    AzureChina = "https://login.chinacloudapi.cn",

    // Microsoft German national cloud ("Black Forest")
    AzureGermany = "https://login.microsoftonline.de",

    // US Government cloud
    AzureUsGovernment = "https://login.microsoftonline.us",
}
