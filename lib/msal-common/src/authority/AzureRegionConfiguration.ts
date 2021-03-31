/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/*
 * AzureRegionConfiguration
 * - preferredAzureRegionOptions        - Preferred azure region options from the user 
 * - environmentRegionFunc              - Environment specific way of fetching the region from the environment
 */
import { PreferredAzureRegionOptions } from "./PreferredAzureRegionOptions";

export type AzureRegionConfiguration = PreferredAzureRegionOptions & {
    environmentRegionFunc: () => string | undefined; 
};

