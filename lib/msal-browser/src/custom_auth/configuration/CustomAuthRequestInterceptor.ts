/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Result type returned by {@link CustomAuthRequestInterceptor.addAdditionalHeaderFields}.
 *
 * Implementations may return either a synchronous value or a `Promise` resolving to one of
 * the following:
 * - A `Record<string, string>` of additional headers to add to the outgoing request.
 * - `null` (or `undefined`) when no additional headers should be added for the request.
 */
export type CustomAuthAdditionalHeaderFieldsResult =
    | Record<string, string>
    | null
    | undefined;

/**
 * Interface for intercepting custom auth network requests in order to attach additional
 * headers to outgoing requests.
 *
 * Implementations are invoked by MSAL before each backend request used by custom auth
 * (sign-in, sign-up, reset-password, and register endpoints). Use this hook to integrate
 * with third-party fraud and bot-detection SDKs that require custom `x-*` headers.
 *
 * MSAL applies the following rules when evaluating the headers you provide:
 * - Headers must start with `x-` (case-insensitive). Headers that don't start with `x-`
 *   are ignored.
 * - Headers that start with any of the following reserved prefixes are ignored:
 *   `x-client-`, `x-ms-`, `x-broker-`, `x-app-`.
 * - Headers that pass both rules are added to the network request. If a header you
 *   provide has the same name as one of MSAL's own internal headers, your value takes
 *   precedence.
 */
export interface CustomAuthRequestInterceptor {
    /**
     * Returns additional headers to add to a custom-auth network request.
     *
     * Scope your headers to specific endpoints by inspecting `requestUrl`. Sending
     * headers to unrelated endpoints can degrade signal quality and increase false
     * positives for fraud/bot-detection vendors.
     *
     * @param requestUrl - The full URL of the outgoing custom-auth request.
     * @returns A record of headers to add (or `null`/`undefined` if no extra headers
     *          are needed for the request). May be returned synchronously or as a
     *          `Promise`.
     */
    addAdditionalHeaderFields(
        requestUrl: URL
    ):
        | CustomAuthAdditionalHeaderFieldsResult
        | Promise<CustomAuthAdditionalHeaderFieldsResult>;
}
