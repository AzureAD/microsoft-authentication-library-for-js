/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { HttpMethod } from "../utils/Constants";

export type BaseRequest = {
    uri: string,
    method: HttpMethod,
    headers?: Map<string, string>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body?: any
};
