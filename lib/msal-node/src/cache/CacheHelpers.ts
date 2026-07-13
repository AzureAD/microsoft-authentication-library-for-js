/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AccountInfo,
    Constants,
    CredentialEntity,
} from "@azure/msal-common/node";
import { createHash } from "crypto";
import { CACHE } from "../utils/Constants.js";

const COMPONENT_KEY_VALUE_SEPARATOR = ":";
const COMPONENT_ENTRY_SEPARATOR = "|";
const COMPONENT_ESCAPE_CHAR = "\\";

/**
 * Escapes the delimiter and escape characters within a component key or value so
 * that the serialized form is unambiguous. The escape character is escaped first
 * to avoid double-processing already-escaped sequences.
 * @param value - The raw component key or value to escape.
 * @returns The escaped string, safe to concatenate with delimiters.
 */
function escapeComponent(value: string): string {
    return value
        .split(COMPONENT_ESCAPE_CHAR)
        .join(COMPONENT_ESCAPE_CHAR + COMPONENT_ESCAPE_CHAR)
        .split(COMPONENT_KEY_VALUE_SEPARATOR)
        .join(COMPONENT_ESCAPE_CHAR + COMPONENT_KEY_VALUE_SEPARATOR)
        .split(COMPONENT_ENTRY_SEPARATOR)
        .join(COMPONENT_ESCAPE_CHAR + COMPONENT_ENTRY_SEPARATOR);
}

/**
 * Computes a combined hash from additional cache key components.
 * Keys are sorted for determinism, then each key/value pair is escaped and joined
 * with delimiters ("key:value" pairs separated by "|") before hashing. The
 * delimiters and escaping guarantee an unambiguous serialization so that boundary
 * ambiguity between component sets (e.g. { "ab": "c" } vs { "a": "bc" }) cannot
 * produce identical hash inputs. The result is SHA-256 → Base64URL (no padding).
 * @param components - The additional cache key components to hash.
 * @returns The Base64URL-encoded SHA-256 hash of the serialized components.
 */
function computeAdditionalCacheKeyHash(
    components: Record<string, string>
): string {
    const sortedKeys = Object.keys(components).sort();
    const input = sortedKeys
        .map(
            (k) =>
                `${escapeComponent(
                    k
                )}${COMPONENT_KEY_VALUE_SEPARATOR}${escapeComponent(
                    components[k]
                )}`
        )
        .join(COMPONENT_ENTRY_SEPARATOR);
    return createHash("sha256").update(input, "utf8").digest("base64url");
}

export function generateCredentialKey(credential: CredentialEntity): string {
    const familyId =
        (credential.credentialType === Constants.CredentialType.REFRESH_TOKEN &&
            credential.familyId) ||
        credential.clientId;
    const scheme =
        credential.tokenType &&
        credential.tokenType.toLowerCase() !==
            Constants.AuthenticationScheme.BEARER.toLowerCase()
            ? credential.tokenType.toLowerCase()
            : "";
    const credentialKey = [
        credential.homeAccountId,
        credential.environment,
        credential.credentialType,
        familyId,
        credential.realm || "",
        credential.target || "",
        scheme,
    ];

    // Compute and append a combined hash from additional cache key components (e.g., fmi_path)
    if (
        credential.additionalCacheKeyComponents &&
        Object.keys(credential.additionalCacheKeyComponents).length > 0
    ) {
        credentialKey.push(
            computeAdditionalCacheKeyHash(
                credential.additionalCacheKeyComponents
            )
        );
    }

    return credentialKey.join(CACHE.KEY_SEPARATOR).toLowerCase();
}

export function generateAccountKey(account: AccountInfo): string {
    const homeTenantId = account.homeAccountId.split(".")[1];
    const accountKey = [
        account.homeAccountId,
        account.environment,
        homeTenantId || account.tenantId || "",
    ];

    return accountKey.join(CACHE.KEY_SEPARATOR).toLowerCase();
}
