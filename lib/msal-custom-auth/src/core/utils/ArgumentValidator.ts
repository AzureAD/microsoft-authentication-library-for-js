/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { InvalidArgumentError } from "../error/InvalidArgumentError.js";

export class ArgumentValidator {
    static ensureArgumentIsNotEmptyString(
        argName: string,
        argValue: string,
        correlationId?: string
    ): void {
        if (!argValue || argValue.trim() === "") {
            throw new InvalidArgumentError(argName, correlationId);
        }
    }

    static ensureArgumentIsNotNullOrUndefined<T>(
        argName: string,
        argValue: T | undefined | null,
        correlationId?: string
    ): asserts argValue is T {
        if (argValue === null || argValue === undefined) {
            throw new InvalidArgumentError(argName, correlationId);
        }
    }
}
