/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { createClientAuthError } from "../error/ClientAuthError.js";
import { ageAssuranceTargetMismatch } from "../error/ClientAuthErrorCodes.js";
import { createClientConfigurationError } from "../error/ClientConfigurationError.js";
import { claimsRequestParsingError } from "../error/ClientConfigurationErrorCodes.js";

/**
 * Binds an ID-token age-assurance receipt to the requested targets.
 * Without explicit targets, only absent, empty, or a single signed all receipt is valid.
 * Receipt signs describe outcomes, not target identities or authorization.
 * Access-token claims are deliberately excluded.
 * @internal
 */
export function validateAgeAssuranceTargets(
    requestedClaims: string | undefined,
    idTokenClaims: object | undefined,
    correlationId: string
): void {
    let claims;
    if (requestedClaims) {
        try {
            claims = JSON.parse(requestedClaims);
        } catch {
            throw createClientConfigurationError(
                claimsRequestParsingError,
                correlationId
            );
        }
    }

    const properties = claims?.id_token?.xms_agvs?.additionalProperties;
    const targets = new Set<string>();
    for (const property of Array.isArray(properties) ? properties : []) {
        if (
            typeof property !== "string" ||
            !property.toLowerCase().startsWith("target-")
        ) {
            continue;
        }
        const target = property.substring("target-".length).toLowerCase();
        if (!isTargetIdentity(target)) {
            throw createClientAuthError(
                ageAssuranceTargetMismatch,
                correlationId
            );
        }
        targets.add(target);
    }
    const receipt = (idTokenClaims as { xms_agvt?: unknown } | undefined)
        ?.xms_agvt;
    if (!targets.size) {
        if (receipt === undefined || receipt === "") {
            return;
        }
        targets.add("all");
    }

    if (typeof receipt !== "string") {
        throw createClientAuthError(ageAssuranceTargetMismatch, correlationId);
    }

    const received = new Set<string>();
    for (const entry of receipt.split(",")) {
        const target = entry.substring(1).toLowerCase();
        if (
            (entry[0] !== "+" && entry[0] !== "-") ||
            !isTargetIdentity(target) ||
            received.has(target) ||
            !targets.has(target)
        ) {
            throw createClientAuthError(
                ageAssuranceTargetMismatch,
                correlationId
            );
        }
        received.add(target);
    }
    if (received.size !== targets.size) {
        throw createClientAuthError(ageAssuranceTargetMismatch, correlationId);
    }
}

/**
 * Target names are opaque, but must be unambiguous in a signed CSV receipt.
 */
function isTargetIdentity(target: string): boolean {
    return (
        target.length > 0 &&
        target[0] !== "+" &&
        target[0] !== "-" &&
        !/[,\s]/.test(target)
    );
}
