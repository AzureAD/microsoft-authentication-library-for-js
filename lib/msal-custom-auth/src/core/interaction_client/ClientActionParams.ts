/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { InvalidArgumentError } from "../error/InvalidArgumentError.js";

export abstract class ClientActionParamsBase {
    protected constructor(
        public authorityUrl: string,
        public clientId: string,
        public correlationId: string,
        public challengeType: Array<string>
    ) {
        if (!correlationId) {
            throw new InvalidArgumentError("correlationId");
        }

        if (!authorityUrl) {
            throw new InvalidArgumentError("authorityUrl", correlationId);
        }

        if (!clientId) {
            throw new InvalidArgumentError("clientId", correlationId);
        }

        if (!challengeType) {
            throw new InvalidArgumentError("challengeType", correlationId);
        }
    }
}
