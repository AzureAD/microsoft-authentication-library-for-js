/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * The Cloud Discovery Metadata Response type.
 */
export type CloudDiscoveryMetadata = {
    preferred_network: string;
    preferred_cache: string;
    aliases: Array<string>;
};
