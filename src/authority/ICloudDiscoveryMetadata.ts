/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * The Cloud Discovery Metadata Response interface.
 */
export interface ICloudDiscoveryMetadata {
    preferred_network: string;
    preferred_cache: string;
    aliases: Array<string>;
}
