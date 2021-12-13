/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export type Configuration = {
    authority: string,
    clockSkew: Number,
    policyName?: string,
    logLevel?: string,
    piiLoggingEnabled?: Boolean
};
