/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/*
 * PrefferedAzureRegionOptions
 * - useAzureRegion                     - Detect azure region and modify the authority to a regional authority
 * - regionUsedIfAutoDetectionFails     - Region to use if region auto detection fails
 * - fallbackToGlobal                   - Use the global authority if no region is available for use
 */

export type PreferredAzureRegionOptions = {
    useAzureRegion: boolean;
    regionUsedIfAutoDetectionFails?: string;
    fallbackToGlobal?: boolean;
};
