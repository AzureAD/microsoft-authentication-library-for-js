/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * The Instance Discovery Metadata Response interface.
 */
export interface IInstanceDiscoveryMetadata {
    preferred_network: string;
    preferred_cache: string;
    aliases: Array<string>;
}
