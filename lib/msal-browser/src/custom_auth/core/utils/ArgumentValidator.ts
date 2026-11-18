/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import type { Logger } from "@azure/msal-common/browser";
import type { UserAccountAttributes } from "../../UserAccountAttributes.js";
import { InvalidArgumentError } from "../error/InvalidArgumentError.js";

export function ensureArgumentIsNotNullOrUndefined<T>(
    argName: string,
    argValue: T | undefined | null,
    correlationId?: string
): asserts argValue is T {
    if (argValue === null || argValue === undefined) {
        throw new InvalidArgumentError(argName, correlationId);
    }
}

export function ensureArgumentIsNotEmptyString(
    argName: string,
    argValue: string | undefined,
    correlationId?: string
): void {
    if (!argValue || argValue.trim() === "") {
        throw new InvalidArgumentError(argName, correlationId);
    }
}

export function ensureArgumentIsJSONString(
    argName: string,
    argValue: string,
    correlationId?: string
): void {
    try {
        const parsed = JSON.parse(argValue);
        if (
            typeof parsed !== "object" ||
            parsed === null ||
            Array.isArray(parsed)
        ) {
            throw new InvalidArgumentError(argName, correlationId);
        }
    } catch (e) {
        if (e instanceof SyntaxError) {
            throw new InvalidArgumentError(argName, correlationId);
        }
        throw e; // Rethrow unexpected errors
    }
}

export function ensureArgumentIsStringArray(
    argName: string,
    argValue: unknown,
    correlationId?: string
): asserts argValue is string[] {
    if (
        !Array.isArray(argValue) ||
        !argValue.every((value) => typeof value === "string")
    ) {
        throw new InvalidArgumentError(argName, correlationId);
    }
}

export function filterReservedSignUpAttributesV2(
    attributes: Readonly<UserAccountAttributes> | undefined,
    logger: Logger,
    correlationId: string
): UserAccountAttributes {
    const reservedSignUpAttributeNames = new Set(["email", "password"]);
    const reservedSignUpAttributeWarning =
        "Ignoring app-supplied sign-up attribute because it uses a reserved SDK attribute name.";
    const filteredAttributes: Array<[string, string]> = [];

    for (const [attributeId, value] of Object.entries(attributes ?? {})) {
        if (reservedSignUpAttributeNames.has(attributeId.toLowerCase())) {
            logger.warning(reservedSignUpAttributeWarning, correlationId);
            continue;
        }

        if (value !== undefined) {
            filteredAttributes.push([attributeId, value]);
        }
    }

    return Object.fromEntries(filteredAttributes);
}
