/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as AADServerParamKeys from "../../constants/AADServerParamKeys.js";

/**
 * Partition identity produced by `getAttributeTokenPartitionKey` when the request
 * carries no attribute tokens. Used verbatim for both in-flight dedupe partitioning
 * (see `RequestThumbprint.attributeTokenPartition`) and downstream comparisons.
 */
export const ATTRIBUTE_TOKEN_BEARER_PARTITION = "bearer";

/**
 * Derive a deterministic partition identifier from caller-provided attribute tokens.
 *
 * The returned string is used as both:
 *   - the value stored under `AADServerParamKeys.ATTRIBUTE_TOKENS` in
 *     `AccessTokenEntity.additionalCacheKeyComponents`, and
 *   - the `attributeTokenPartition` dimension on `RequestThumbprint` for in-flight
 *     silent-request dedupe isolation.
 *
 * When `attributeTokens` is undefined or empty this returns
 * `ATTRIBUTE_TOKEN_BEARER_PARTITION`. Otherwise it returns
 * `"attribute_tokens:<sorted-space-joined values>"` verbatim. The partition value is
 * intentionally not hashed so that it can be derived synchronously in cache-read and
 * dedupe paths across all supported runtimes; the fixed-size credential-key segment
 * used for browser cache-key isolation is derived separately via `ICrypto.hashString`
 * at write time and persisted on the entity.
 *
 * @param attributeTokens - optional caller-provided attribute token strings
 * @returns partition identifier string
 */
export function getAttributeTokenPartitionKey(
    attributeTokens?: Array<string>
): string {
    if (!attributeTokens || attributeTokens.length === 0) {
        return ATTRIBUTE_TOKEN_BEARER_PARTITION;
    }

    const sortedJoined = [...attributeTokens].sort().join(" ");
    return `${AADServerParamKeys.ATTRIBUTE_TOKENS}:${sortedJoined}`;
}

/**
 * Given a partition identifier returned by `getAttributeTokenPartitionKey`,
 * build the `CredentialEntity.additionalCacheKeyComponents` record used for
 * cache read/write isolation. Bearer-mode requests return `undefined` so that
 * existing bearer cache identity semantics remain unchanged.
 *
 * @param partition - partition identifier from `getAttributeTokenPartitionKey`
 * @returns components record or `undefined` for bearer mode
 */
export function buildAttributeTokenAdditionalCacheKeyComponents(
    partition: string
): Record<string, string> | undefined {
    if (partition === ATTRIBUTE_TOKEN_BEARER_PARTITION) {
        return undefined;
    }

    return {
        [AADServerParamKeys.ATTRIBUTE_TOKENS]: partition,
    };
}

/**
 * Deterministic string payload derived from `CredentialEntity.additionalCacheKeyComponents`
 * suitable for hashing into a fixed-size credential-key segment. Keys are sorted
 * lexicographically then each entry is emitted as `${key}${value}` with no separator,
 * matching the cross-SDK cache-key-hash algorithm already implemented in msal-node.
 *
 * @param components - additional cache key components
 * @returns payload string, or `undefined` when there are no components to hash
 */
export function getAdditionalCacheKeyComponentsHashPayload(
    components?: Record<string, string>
): string | undefined {
    if (!components || Object.keys(components).length === 0) {
        return undefined;
    }

    const sortedKeys = Object.keys(components).sort();
    return sortedKeys.map((k) => `${k}${components[k]}`).join("");
}
