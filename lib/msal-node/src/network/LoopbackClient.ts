/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthorizeResponse,
    Constants as CommonConstants,
    UrlUtils,
} from "@azure/msal-common/node";
import http from "http";
import { NodeAuthError } from "../error/NodeAuthError.js";
import { Constants } from "../utils/Constants.js";
import { ILoopbackClient } from "./ILoopbackClient.js";

export class LoopbackClient implements ILoopbackClient {
    private server: http.Server | undefined;
    private preferredPort: number | undefined;

    constructor(preferredPort?: number) {
        this.preferredPort = preferredPort;
    }

    /**
     * Spins up a loopback server which returns the server response when the localhost redirectUri is hit
     * @param successTemplate
     * @param errorTemplate
     * @returns
     */
    async listenForAuthCode(
        successTemplate?: string,
        errorTemplate?: string
    ): Promise<AuthorizeResponse> {
        if (this.server) {
            throw NodeAuthError.createLoopbackServerAlreadyExistsError();
        }

        return new Promise<AuthorizeResponse>((resolve, reject) => {
            this.server = http.createServer(
                (req: http.IncomingMessage, res: http.ServerResponse) => {
                    const method = req.method?.toUpperCase();

                    // Only allow GET and POST methods
                    if (method !== "GET" && method !== "POST") {
                        res.writeHead(405, {
                            Allow: "GET, POST",
                        });
                        res.end("Method Not Allowed");
                        return;
                    }

                    const url = req.url;
                    if (!url) {
                        res.end(
                            errorTemplate ||
                                "Error occurred loading redirectUrl"
                        );
                        reject(
                            NodeAuthError.createUnableToLoadRedirectUrlError()
                        );
                        return;
                    } else if (url === CommonConstants.FORWARD_SLASH) {
                        if (method === "POST") {
                            this.handlePostRequest(
                                req,
                                res,
                                resolve,
                                successTemplate,
                                errorTemplate
                            );
                            return;
                        }
                        // GET to root — return success page (after redirect)
                        res.end(
                            successTemplate ||
                                "Auth code was successfully acquired. You can close this window now."
                        );
                        return;
                    }

                    // GET with query params (existing query response_mode flow)
                    if (method === "GET") {
                        const redirectUri = this.getRedirectUri();
                        const parsedUrl = new URL(url, redirectUri);
                        const authCodeResponse =
                            UrlUtils.getDeserializedResponse(
                                parsedUrl.search
                            ) || {};

                        if (!authCodeResponse.code && !authCodeResponse.error) {
                            // Ignore requests without OAuth params (e.g., /favicon.ico)
                            res.writeHead(200);
                            res.end();
                            return;
                        }

                        if (authCodeResponse.code) {
                            res.writeHead(CommonConstants.HTTP_REDIRECT, {
                                location: redirectUri,
                            }); // Prevent auth code from being saved in the browser history
                            res.end();
                        }
                        if (authCodeResponse.error) {
                            res.end(
                                errorTemplate ||
                                    `Error occurred: ${authCodeResponse.error}`
                            );
                        }
                        resolve(authCodeResponse);
                    } else {
                        // Non-root POST (no OAuth response expected here) — ignore
                        res.writeHead(200);
                        res.end();
                    }
                }
            );

            const port = this.preferredPort || 0;
            /*
             * Register the error handler before listening so an immediate
             * listen failure (e.g. preferredPort in use) triggers the fallback.
             */
            this.server.on("error", (err: NodeJS.ErrnoException) => {
                if (
                    err.code === "EADDRINUSE" &&
                    this.preferredPort &&
                    port !== 0
                ) {
                    // Preferred port unavailable, fall back to random port
                    this.server?.listen(0, "127.0.0.1");
                } else {
                    reject(err);
                }
            });
            this.server.listen(port, "127.0.0.1");
        });
    }

    /**
     * Handles POST requests for form_post response mode
     */
    private handlePostRequest(
        req: http.IncomingMessage,
        res: http.ServerResponse,
        resolve: (value: AuthorizeResponse) => void,
        successTemplate?: string,
        errorTemplate?: string
    ): void {
        const contentType = req.headers["content-type"]?.split(";")[0]?.trim();
        if (contentType !== "application/x-www-form-urlencoded") {
            res.writeHead(415);
            res.end("Unsupported Media Type");
            return;
        }

        let body = "";
        req.on("error", () => {
            if (!res.headersSent) {
                res.writeHead(400);
            }
            res.end();
        });
        req.on("data", (chunk: Buffer) => {
            body += chunk.toString();
        });

        req.on("end", () => {
            const authCodeResponse =
                UrlUtils.getDeserializedResponse(`?${body}`) || {};

            if (!authCodeResponse.code && !authCodeResponse.error) {
                // POST without valid OAuth params — ignore
                res.writeHead(200);
                res.end();
                return;
            }

            if (authCodeResponse.error) {
                res.writeHead(200);
                res.end(
                    errorTemplate || `Error occurred: ${authCodeResponse.error}`
                );
            } else {
                res.writeHead(200);
                res.end(
                    successTemplate ||
                        "Auth code was successfully acquired. You can close this window now."
                );
            }
            resolve(authCodeResponse);
        });
    }

    /**
     * Get the port that the loopback server is running on
     * @returns
     */
    getRedirectUri(): string {
        if (!this.server || !this.server.listening) {
            throw NodeAuthError.createNoLoopbackServerExistsError();
        }

        const address = this.server.address();
        if (!address || typeof address === "string" || !address.port) {
            this.closeServer();
            throw NodeAuthError.createInvalidLoopbackAddressTypeError();
        }

        const port = address && address.port;

        return `${Constants.HTTP_PROTOCOL}${Constants.LOCALHOST}:${port}`;
    }

    /**
     * Close the loopback server
     */
    closeServer(): void {
        if (this.server) {
            // Only stops accepting new connections, server will close once open/idle connections are closed.
            this.server.close();

            if (typeof this.server.closeAllConnections === "function") {
                /*
                 * Close open/idle connections. This API is available in Node versions 18.2 and higher
                 */
                this.server.closeAllConnections();
            }
            this.server.unref();
            this.server = undefined;
        }
    }
}
