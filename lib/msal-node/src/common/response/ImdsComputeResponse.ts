/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Response body returned by the IMDS compute metadata endpoint
 * (http://169.254.169.254/metadata/instance/compute). Only the `location`
 * field is used for region auto-discovery. `location` is optional because the
 * IMDS response can legitimately omit it or return `null`.
 */
export type ImdsComputeResponse = {
    location?: string;
};
