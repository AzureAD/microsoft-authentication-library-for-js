/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { InvalidArgumentError } from "../../error/InvalidArgumentError.js";

export abstract class NativeAuthApiRequestBase {
    protected constructor(
        public requestUrl: string,
        public correlationId: string,
        public headers?: Record<string, string>
    ) {
        if (!correlationId) {
            throw new InvalidArgumentError("correlationId");
        }

        if (!requestUrl) {
            throw new InvalidArgumentError("requestUrl", correlationId);
        }
    }
}
