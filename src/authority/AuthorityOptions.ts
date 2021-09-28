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
    azureRegionConfiguration?: AzureRegionConfiguration;
    azureCloudInstance?: AzureCloudInstance;
};

export enum AzureCloudInstance {
    // AzureCloudInstance is not specified.
    None,

    // Microsoft Azure public cloud. Maps to https://login.microsoftonline.com
    AzurePublic,

    // Microsoft Chinese national cloud. Maps to https://login.chinacloudapi.cn
    AzureChina,

    // Microsoft German national cloud ("Black Forest"). Maps to https://login.microsoftonline.de
    AzureGermany,

    // US Government cloud. Maps to https://login.microsoftonline.us
    AzureUsGovernment,
}
