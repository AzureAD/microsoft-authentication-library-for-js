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
};
