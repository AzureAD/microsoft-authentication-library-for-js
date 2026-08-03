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

/**
 * Computes a combined hash from additional cache key components.
 *
 * Matches the cross-SDK algorithm: sort keys ascending → for each key append a
 * length-prefixed (netstring-style) encoding of the key and value → SHA-256 →
 * Base64URL (no padding).
 *
 * Each entry is encoded as `<byteLen(key)>:<key><byteLen(value)>:<value>` where the
 * lengths are the UTF-8 **byte** lengths (via `Buffer.byteLength`, not `String.length`
 * which counts UTF-16 code units). The length prefixes make the serialization injective
 * so that semantically different component sets can never serialize to the same byte
 * string. A plain delimiter-less concatenation of key+value is ambiguous
 * (e.g. `{fmi_path:"value"}` and `{fmi_pat:"hvalue"}` would both yield `fmi_pathvalue`),
 * which would collide into the same credential cache slot.
 *
 * The encoding is byte-identical to the other MSAL SDKs (Go/.NET/Java/Python), so the
 * resulting hash is a stable cross-SDK cache key. The final credential key is lowercased
 * downstream in `generateCredentialKey`.
 */
function computeAdditionalCacheKeyHash(
    components: Record<string, string>
): string {
    const sortedKeys = Object.keys(components).sort();
    let input = "";
    for (const key of sortedKeys) {
        const value = components[key];
        input +=
            `${Buffer.byteLength(key, "utf8")}:${key}` +
            `${Buffer.byteLength(value, "utf8")}:${value}`;
    }
    return createHash("sha256").update(input, "utf8").digest("base64url");
}

export function generateCredentialKey(
    credential: CredentialEntity,
    hash?: string
): string {
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

    /*
     * Compute and append a combined hash from additional cache key components (e.g., fmi_path).
     * Use the explicitly passed hash if available; fall back to synchronous inline compute
     * for lookup paths where the entity was read from storage without a cached hash.
     */
    if (
        credential.additionalCacheKeyComponents &&
        Object.keys(credential.additionalCacheKeyComponents).length > 0
    ) {
        credentialKey.push(
            hash ??
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
