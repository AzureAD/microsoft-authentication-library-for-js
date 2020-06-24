/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ICloudDiscoveryMetadata } from "./ICloudDiscoveryMetadata";

/**
 * The OpenID Configuration Endpoint Response interface. Used by the authority class to get relevant OAuth endpoints.
 */
export interface ICloudInstanceDiscoveryResponse {
    tenant_discovery_endpoint: string;
    metadata: Array<ICloudDiscoveryMetadata>;
}
