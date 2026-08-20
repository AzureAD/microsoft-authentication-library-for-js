/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { StringDict } from "@azure/msal-common/browser";

/**
 * Current request fields used by cross-version transformations.
 */
export interface CrossVersionRequestFields {
    extraQueryParameters?: StringDict;
    extraParameters?: StringDict;
    resource?: string;
}

/**
 * Deprecated request field names absent from the current request type.
 */
export interface LegacyRequestFields {
    tokenQueryParameters?: StringDict;
    tokenBodyParameters?: StringDict;
    authorizePostBodyParameters?: StringDict;
}

/**
 * Current request extended with all known legacy fields.
 */
export type CrossVersionRequest<
    TRequest extends CrossVersionRequestFields = CrossVersionRequestFields
> = TRequest & LegacyRequestFields;

/**
 * Promotes `extraParameters.resource` to the top-level `resource` field.
 *
 * Pre-5.5.0 embedded apps do not have a top-level `resource` field.
 *
 * @param request - The request to transform.
 * @returns A new request with `resource` promoted if applicable.
 */
export function normalizeResourceField<
    TRequest extends CrossVersionRequestFields
>(request: TRequest): TRequest {
    if (request.extraParameters?.resource) {
        const { resource, ...remainingParams } = request.extraParameters;
        const result = { ...request };
        result.resource = resource;
        result.extraParameters = remainingParams;
        return result;
    }
    return request;
}

/**
 * Demotes the top-level `resource` field into `extraParameters.resource`.
 *
 * Pre-5.5.0 embedded apps do not have a top-level `resource` field.
 *
 * @param request - The request to transform.
 * @returns A new request with `resource` demoted if applicable.
 */
export function addResourceField<TRequest extends CrossVersionRequestFields>(
    request: TRequest
): TRequest {
    if (request.resource) {
        const resource = request.resource;
        const result = { ...request };
        result.extraParameters = {
            ...result.extraParameters,
            resource,
        };
        delete result.resource;
        return result;
    }
    return request;
}

/**
 * Normalize an incoming request from any embedded-app version so that
 * the broker PCA methods can consume it correctly.
 *
 * - Folds legacy field values into their current equivalents.
 * - Strips legacy field names from the returned object.
 * - Is idempotent: safe to call on requests that already use current names.
 *
 * @param request - The request from a broker auth request.
 * @returns A new request with current field names only.
 */
export function normalizeIncomingRequest<
    TRequest extends CrossVersionRequestFields
>(request: CrossVersionRequest<TRequest>): TRequest {
    const normalized = normalizeResourceField(request);
    const currentFields = { ...normalized };
    const {
        tokenQueryParameters,
        tokenBodyParameters,
        authorizePostBodyParameters,
    } = currentFields;

    delete currentFields.tokenQueryParameters;
    delete currentFields.tokenBodyParameters;
    delete currentFields.authorizePostBodyParameters;

    /*
     * tokenQueryParameters (removed in v5) → extraQueryParameters.
     * Current values win on key conflicts.
     */
    if (tokenQueryParameters) {
        currentFields.extraQueryParameters = {
            ...tokenQueryParameters,
            ...currentFields.extraQueryParameters,
        };
    }

    /*
     * tokenBodyParameters (removed in v5) → extraParameters.
     * Current values win on key conflicts.
     */
    if (tokenBodyParameters) {
        currentFields.extraParameters = {
            ...tokenBodyParameters,
            ...currentFields.extraParameters,
        };
    }

    /*
     * authorizePostBodyParameters (removed in v5) → extraParameters.
     * Merged after tokenBodyParameters; current values still win.
     */
    if (authorizePostBodyParameters) {
        currentFields.extraParameters = {
            ...authorizePostBodyParameters,
            ...currentFields.extraParameters,
        };
    }

    return currentFields;
}

/**
 * Add legacy field aliases to an outgoing request so that an older broker
 * can still consume the parameters.
 *
 * - Copies current field values into all known legacy field names.
 * - Merges extraParameters into extraQueryParameters (extraParameters wins)
 *   so the v4 broker sees them on the /authorize query string.
 * - Deliberately omits authorizePostBodyParameters.
 * - Is idempotent: safe to call multiple times.
 *
 * @param request - The request about to be wrapped in a broker auth request.
 * @returns A new request carrying both current and legacy field names.
 */
export function addLegacyRequestFields<
    TRequest extends CrossVersionRequestFields
>(request: TRequest): CrossVersionRequest<TRequest> {
    const result: CrossVersionRequest<TRequest> = {
        ...addResourceField(request),
    };

    // extraQueryParameters → also set legacy tokenQueryParameters (removed in v5)
    if (result.extraQueryParameters) {
        result.tokenQueryParameters = { ...result.extraQueryParameters };
    }

    // extraParameters → also set legacy field aliases (removed in v5)
    if (result.extraParameters) {
        // Token endpoint is always POST, so body params always apply.
        result.tokenBodyParameters = { ...result.extraParameters };

        /*
         * In v5, extraParameters are sent on the /authorize query string (GET)
         * or POST body depending on httpMethod. The v4 broker reads
         * extraQueryParameters for both flows' query strings, so merging here
         * covers both. We intentionally omit authorizePostBodyParameters
         * because v4 throws if it is present without httpMethod === "POST",
         * and the embedded app cannot expect control over how the request
         * is made.
         */
        result.extraQueryParameters = {
            ...result.extraQueryParameters,
            ...result.extraParameters,
        };
    }

    return result;
}
