/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as https from "https";
import * as http from "http";
import {
    INetworkModule,
    NetworkRequestOptions,
    NetworkResponse,
    ClientAuthErrorCodes,
    createAuthError,
    createNetworkError,
    AuthError,
} from "@azure/msal-common/node";

/**
 * HTTP client that establishes a mutual-TLS connection using a client certificate.
 *
 * Used exclusively for the mTLS Proof-of-Possession token flow, where the TLS handshake
 * with the regional STS endpoint (mtlsauth.microsoft.com) acts as the client authentication
 * mechanism instead of a client_assertion JWT.
 *
 * This implementation uses Node.js's built-in `https` module so no additional npm packages
 * are required.
 * @public
 */
export class MtlsHttpClient implements INetworkModule {
    private readonly cert: string;
    private readonly key: string;

    /**
     * @param cert - PEM-encoded X.509 client certificate (the `x5c` value from clientCertificate config)
     * @param key - PEM-encoded private key corresponding to the certificate
     */
    constructor(cert: string, key: string) {
        this.cert = cert;
        this.key = key;
    }

    /**
     * Sends an HTTP GET request over a mutual-TLS connection.
     */
    async sendGetRequestAsync<T>(
        url: string,
        options?: NetworkRequestOptions,
        timeout?: number
    ): Promise<NetworkResponse<T>> {
        return this.sendRequest<T>("GET", url, options, timeout);
    }

    /**
     * Sends an HTTP POST request over a mutual-TLS connection.
     */
    async sendPostRequestAsync<T>(
        url: string,
        options?: NetworkRequestOptions
    ): Promise<NetworkResponse<T>> {
        return this.sendRequest<T>("POST", url, options);
    }

    private sendRequest<T>(
        method: string,
        url: string,
        options?: NetworkRequestOptions,
        timeout?: number
    ): Promise<NetworkResponse<T>> {
        return new Promise((resolve, reject) => {
            const parsedUrl = new URL(url);

            const agent = new https.Agent({
                cert: this.cert,
                key: this.key,
            });

            const requestOptions: https.RequestOptions = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port || "443",
                path: `${parsedUrl.pathname}${parsedUrl.search}`,
                method,
                headers: options?.headers || {},
                agent,
                timeout,
            };

            const body =
                method === "POST" ? (options?.body ?? "") : undefined;

            const req = https.request(
                requestOptions,
                (res: http.IncomingMessage) => {
                    let rawData = "";
                    res.setEncoding("utf8");
                    res.on("data", (chunk: string) => {
                        rawData += chunk;
                    });
                    res.on("end", () => {
                        try {
                            const headers: Record<string, string> = {};
                            for (const [name, value] of Object.entries(
                                res.headers
                            )) {
                                if (value !== undefined) {
                                    headers[name] = Array.isArray(value)
                                        ? value.join(", ")
                                        : value;
                                }
                            }
                            resolve({
                                headers,
                                body: JSON.parse(rawData) as T,
                                status: res.statusCode ?? 0,
                            });
                        } catch (parseError) {
                            reject(
                                createAuthError(
                                    ClientAuthErrorCodes.tokenParsingError,
                                    `Failed to parse mTLS response: ${
                                        parseError instanceof Error
                                            ? parseError.message
                                            : "unknown"
                                    }`
                                )
                            );
                        }
                    });
                }
            );

            req.on("error", (err: Error) => {
                const baseError: AuthError = createAuthError(
                    ClientAuthErrorCodes.networkError,
                    `mTLS network request failed: ${err.message}`
                );
                reject(createNetworkError(baseError, undefined, undefined, err));
            });

            req.on("timeout", () => {
                req.destroy();
                reject(
                    createAuthError(
                        ClientAuthErrorCodes.networkError,
                        "mTLS request timeout"
                    )
                );
            });

            if (body) {
                req.write(body);
            }

            req.end();
        });
    }
}
