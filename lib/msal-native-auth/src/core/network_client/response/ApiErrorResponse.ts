/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { UserAttribute } from "./UserAttribute.js";

export class NativeAuthApiError {
    constructor(
        public error?: string,
        public errorDescription?: string,
        public correlationId?: string,
        public errorCodes?: Array<string>,
        public continuationToken?: string,
        public requiredAttributes?: Array<UserAttribute>,
        public invalidAttributes?: Array<string>,
        public subError?: string
    ) {}
}
