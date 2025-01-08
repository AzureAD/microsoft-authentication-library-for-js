/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ArgumentValidator } from "../utils/ArgumentValidator.js";

export abstract class ClientActionParamsBase {
    protected constructor(
        public clientId: string,
        public correlationId: string,
        public challengeType: Array<string>,
    ) {
        ArgumentValidator.ensureArgumentIsNotEmptyString(
            "correlationId",
            correlationId
        );

        ArgumentValidator.ensureArgumentIsNotEmptyString(
            "clientId",
            clientId,
            correlationId
        );

        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "challengeType",
            challengeType,
            correlationId
        );
    }
}
