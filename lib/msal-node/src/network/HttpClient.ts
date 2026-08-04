/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthError,
    ClientAuthErrorCodes,
    INetworkModule,
    NetworkRequestOptions,
    NetworkResponse,
    createAuthError,
    createNetworkError,
} from "@azure/msal-common/node";
import { HttpMethod } from "../utils/Constants.js";
import https from "https";
import type { IncomingHttpHeaders } from "http";

/**
 * HTTP client implementation using Node.js native fetch API.
 *
 * This class provides a clean interface for making HTTP requests using the modern
 * fetch API available in Node.js 18+. It replaces the previous implementation that
 * relied on custom proxy handling and the legacy http/https modules.
 */
export class HttpClient implements INetworkModule {
    /**
     * Sends an HTTP GET request to the specified URL.
     *
     * This method handles GET requests with optional timeout support. The timeout
     * is implemented using AbortController, which provides a clean way to cancel
     * fetch requests that take too long to complete.
     *
     * @param url - The target URL for the GET request
     * @param options - Optional request configuration including headers
     * @param timeout - Optional timeout in milliseconds. If specified, the request
     *                  will be aborted if it doesn't complete within this time
     * @returns Promise that resolves to a NetworkResponse containing headers, body, and status
     * @throws {AuthError} When the request times out or response parsing fails
     * @throws {NetworkError} When the network request fails
     */
    async sendGetRequestAsync<T>(
        url: string,
        options?: NetworkRequestOptions,
        timeout?: number
    ): Promise<NetworkResponse<T>> {
        return this.sendRequest<T>(url, HttpMethod.GET, options, timeout);
    }

    /**
     * Sends an HTTP POST request to the specified URL.
     *
     * This method handles POST requests with request body support. Currently,
     * timeout functionality is not exposed for POST requests, but the underlying
     * implementation supports it through the shared sendRequest method.
     *
     * @param url - The target URL for the POST request
     * @param options - Optional request configuration including headers and body
     * @returns Promise that resolves to a NetworkResponse containing headers, body, and status
     * @throws {AuthError} When the request times out or response parsing fails
     * @throws {NetworkError} When the network request fails
     */
    async sendPostRequestAsync<T>(
        url: string,
        options?: NetworkRequestOptions
    ): Promise<NetworkResponse<T>> {
        if (options?.mtlsCertificate) {
            return this.sendMtlsPostRequestAsync<T>(url, options);
        }
        return this.sendRequest<T>(url, HttpMethod.POST, options);
    }

    /**
     * Sends an HTTP POST request over a mutual-TLS connection using Node's `https` module.
     *
     * Native `fetch` cannot attach a client certificate to the TLS handshake, so mTLS
     * Proof-of-Possession requests are routed through `https.request` with an `https.Agent`
     * configured with the binding certificate's `cert` and `key`. The certificate authenticates
     * the client at the TLS layer; ESTS returns a token bound to that certificate.
     *
     * The response shape, JSON parsing, and error semantics mirror the fetch-based path.
     *
     * @param url - The target mTLS token endpoint URL
     * @param options - Request configuration; `mtlsCertificate` (PEM cert + key) is required here
     * @returns Promise resolving to a NetworkResponse with parsed JSON body
     * @throws {AuthError} When response parsing fails
     * @throws {NetworkError} When the network request fails
     */
    private sendMtlsPostRequestAsync<T>(
        url: string,
        options: NetworkRequestOptions
    ): Promise<NetworkResponse<T>> {
        return new Promise<NetworkResponse<T>>((resolve, reject) => {
            let parsedUrl: URL;
            try {
                parsedUrl = new URL(url);
            } catch (error) {
                const baseAuthError: AuthError = createAuthError(
                    ClientAuthErrorCodes.networkError,
                    "",
                    `Network request failed: ${
                        error instanceof Error ? error.message : "unknown"
                    }`
                );
                reject(
                    createNetworkError(
                        baseAuthError,
                        undefined,
                        undefined,
                        error instanceof Error ? error : undefined
                    )
                );
                return;
            }

            const body = options.body || "";
            const agent = new https.Agent({
                cert: options.mtlsCertificate?.cert,
                key: options.mtlsCertificate?.key,
            });
            const requestOptions: https.RequestOptions = {
                method: HttpMethod.POST,
                hostname: parsedUrl.hostname,
                port: parsedUrl.port,
                path: `${parsedUrl.pathname}${parsedUrl.search}`,
                headers: {
                    ...options.headers,
                    "Content-Length": Buffer.byteLength(body),
                },
                agent,
            };

            const request = https.request(requestOptions, (response) => {
                const chunks: Buffer[] = [];
                response.on("data", (chunk: Buffer) => chunks.push(chunk));
                response.on("end", () => {
                    const rawBody = Buffer.concat(chunks).toString();
                    try {
                        resolve({
                            headers: getIncomingHeaderDict(response.headers),
                            body: JSON.parse(rawBody) as T,
                            status: response.statusCode ?? 0,
                        });
                    } catch (error) {
                        reject(
                            createAuthError(
                                ClientAuthErrorCodes.tokenParsingError,
                                "",
                                `Failed to parse response: ${
                                    error instanceof Error
                                        ? error.message
                                        : "unknown"
                                }`
                            )
                        );
                    }
                });
            });

            request.on("error", (error: Error) => {
                const baseAuthError: AuthError = createAuthError(
                    ClientAuthErrorCodes.networkError,
                    "",
                    `Network request failed: ${error.message}`
                );
                reject(
                    createNetworkError(
                        baseAuthError,
                        undefined,
                        undefined,
                        error
                    )
                );
            });

            if (body) {
                request.write(body);
            }
            request.end();
        });
    }

    /**
     * Core HTTP request implementation using native fetch API.
     *
     * This method handles GET and POST HTTP requests with comprehensive
     * timeout support and error handling. The timeout mechanism works as follows:
     *
     * 1. An AbortController is created for each request
     * 2. If a timeout is specified, setTimeout is used to call abort() after the delay
     * 3. The abort signal is passed to fetch, which will reject the promise if aborted
     * 4. Cleanup occurs in both success and error cases to prevent timer leaks
     *
     * Error handling priority:
     * 1. Timeout errors (AbortError) are converted to "Request timeout" messages
     * 2. Network/connection errors are wrapped with "Network request failed" prefix
     * 3. JSON parsing errors are wrapped with "Failed to parse response" prefix
     *
     * @param url - The target URL for the request
     * @param method - HTTP method (GET or POST)
     * @param options - Optional request configuration (headers, body)
     * @param timeout - Optional timeout in milliseconds for request cancellation
     * @returns Promise resolving to NetworkResponse with parsed JSON body
     * @throws {AuthError} For timeouts or JSON parsing errors
     * @throws {NetworkError} For network failures
     */
    private async sendRequest<T>(
        url: string,
        method: string,
        options?: NetworkRequestOptions,
        timeout?: number
    ): Promise<NetworkResponse<T>> {
        /*
         * Setup timeout mechanism using AbortController
         * This provides a standard way to cancel fetch requests
         */
        const controller = new AbortController();
        let timeoutId: NodeJS.Timeout | undefined;

        /*
         * Configure timeout if specified
         * The setTimeout will trigger abort() if the request takes too long
         */
        if (timeout) {
            timeoutId = setTimeout(() => {
                // Calling abort() will cause fetch to reject with AbortError
                controller.abort();
            }, timeout);
        }

        const fetchOptions: RequestInit = {
            method: method,
            headers: getFetchHeaders(options),
            signal: controller.signal, // Enable cancellation via AbortController
        };

        if (method === HttpMethod.POST) {
            fetchOptions.body = options?.body || "";
        }

        let response: Response;
        try {
            response = await fetch(url, fetchOptions);
        } catch (error) {
            // Clean up timeout to prevent memory leaks
            if (timeoutId) {
                clearTimeout(timeoutId);
            }

            if (error instanceof Error && error.name === "AbortError") {
                throw createAuthError(
                    ClientAuthErrorCodes.networkError,
                    "",
                    "Request timeout"
                );
            }

            const baseAuthError: AuthError = createAuthError(
                ClientAuthErrorCodes.networkError,
                "",
                `Network request failed: ${
                    error instanceof Error ? error.message : "unknown"
                }`
            );
            throw createNetworkError(
                baseAuthError,
                undefined,
                undefined,
                error instanceof Error ? error : undefined
            );
        }

        // Clean up timeout to prevent memory leaks
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        try {
            return {
                headers: getHeaderDict(response.headers),
                body: (await response.json()) as T,
                status: response.status,
            };
        } catch (error) {
            throw createAuthError(
                ClientAuthErrorCodes.tokenParsingError,
                "",
                `Failed to parse response: ${
                    error instanceof Error ? error.message : "unknown"
                }`
            );
        }
    }
}

/**
 * Converts a fetch Headers object to a plain JavaScript object.
 *
 * The fetch API returns headers as a Headers object with methods like get(), has(),
 * etc. However, the rest of the MSAL codebase expects headers as a simple key-value
 * object. This function performs that conversion.
 *
 * @param headers - The Headers object returned by fetch response
 * @returns A plain object with header names as keys and values as strings
 */
function getHeaderDict(headers: Headers): Record<string, string> {
    const headerDict: Record<string, string> = {};

    headers.forEach((value: string, key: string) => {
        headerDict[key] = value;
    });

    return headerDict;
}

/**
 * Converts a Node.js `IncomingHttpHeaders` object to a plain string key-value object.
 *
 * The `https` module exposes response headers as an object whose values may be strings or
 * string arrays (e.g. multiple `set-cookie` headers). This normalizes them to the flat
 * `Record<string, string>` shape the rest of MSAL expects, joining array values with `, `.
 *
 * @param headers - The headers object from an `https` `IncomingMessage`
 * @returns A plain object with header names as keys and string values
 */
function getIncomingHeaderDict(
    headers: IncomingHttpHeaders
): Record<string, string> {
    const headerDict: Record<string, string> = {};

    Object.entries(headers).forEach(([key, value]) => {
        if (value !== undefined) {
            headerDict[key] = Array.isArray(value) ? value.join(", ") : value;
        }
    });

    return headerDict;
}

/**
 * Converts NetworkRequestOptions headers to a fetch-compatible Headers object.
 *
 * The MSAL library uses plain objects for headers in NetworkRequestOptions,
 * but the fetch API expects either a Headers object, plain object, or array
 * of arrays. Using the Headers constructor provides better compatibility
 * and validation.
 *
 * @param options - Optional NetworkRequestOptions containing headers
 * @returns A Headers object ready for use with fetch API
 */
function getFetchHeaders(options?: NetworkRequestOptions): Headers {
    const headers = new Headers();

    if (!(options && options.headers)) {
        return headers;
    }

    Object.entries(options.headers).forEach(([key, value]) => {
        headers.append(key, value);
    });

    return headers;
}
