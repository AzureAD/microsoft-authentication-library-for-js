/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAgentOptions } from "../config/ClientConfiguration";

export type ImdsOptions = {
    headers?: {
        Metadata: string,
    },
    proxyUrl?: string,
    customAgentOptions?: CustomAgentOptions,
};
