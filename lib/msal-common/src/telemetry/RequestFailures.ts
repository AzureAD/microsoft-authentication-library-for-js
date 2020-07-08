/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export type RequestFailures = {
    requests: Array<string|number>;
    errors: string[];
    count: number;
};
