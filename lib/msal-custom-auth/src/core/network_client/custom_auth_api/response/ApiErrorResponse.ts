/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { UserAttribute } from "./UserAttribute.js";

export class ApiErrorResponse {
    constructor(
        public error?: string,
        public error_description?: string,
        public correlation_id?: string,
        public trace_id?: string,
        public error_codes?: Array<string>,
        public continuation_token?: string,
        public required_attributes?: Array<UserAttribute>,
        public invalid_attributes?: Array<UserAttribute>,
        public suberror?: string
    ) {}
}
