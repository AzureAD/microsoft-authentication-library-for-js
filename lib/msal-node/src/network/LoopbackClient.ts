/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    Constants as CommonConstants,
    ServerAuthorizationCodeResponse,
    UrlString,
    HttpStatus,
} from "@azure/msal-common";
import http from "http";
import net from "net";
import { NodeAuthError } from "../error/NodeAuthError.js";
import { Constants, LOOPBACK_SERVER_CONSTANTS } from "../utils/Constants.js";
import { ILoopbackClient } from "./ILoopbackClient.js";

export class LoopbackClient implements ILoopbackClient {
    private server: http.Server | undefined;
    private openSockets = new Set<net.Socket>();
    private authResult: {
        success?: ServerAuthorizationCodeResponse;
        error?: NodeAuthError;
        promise?: Promise<ServerAuthorizationCodeResponse>;
        resolve: (value: ServerAuthorizationCodeResponse) => void;
        reject: (error: NodeAuthError) => void;
    } = {
        resolve: (value) => {
            this.authResult.success = value;
        },
        reject: (error) => {
            this.authResult.error = error;
        },
    };

    /**
     * Spins up a loopback server which returns the server response when the localhost redirectUri is hit
     * @param successTemplate
     * @param errorTemplate
     * @returns
     */
    startServer(
        options: {
            successTemplate?: string;
            errorTemplate?: string;
            timeoutInMs?: number;
        } = {}
    ): Promise<void> {
        const successTemplate =
            options.successTemplate ??
            "Auth code was successfully acquired. You can close this window now.";
        const errorTemplate =
            options.errorTemplate ?? "Error occurred loading redirectUrl";
        const timeoutInMs =
            options.timeoutInMs ?? LOOPBACK_SERVER_CONSTANTS.TIMEOUT_MS;

        if (this.server) {
            return Promise.reject(
                NodeAuthError.createLoopbackServerAlreadyExistsError()
            );
        }

        return new Promise<void>((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                this.closeServer();
                reject(NodeAuthError.createLoopbackServerTimeoutError());
            }, timeoutInMs).unref();
            this.server = http.createServer();

            this.server.on(
                "request",
                (req: http.IncomingMessage, res: http.ServerResponse) => {
                    const url = req.url;
                    if (!url) {
                        res.end(errorTemplate, () => {
                            this.closeServer();
                        });
                        this.authResult.reject(
                            NodeAuthError.createUnableToLoadRedirectUrlError()
                        );
                        return;
                    } else if (url === CommonConstants.FORWARD_SLASH) {
                        res.end(successTemplate, () => {
                            this.closeServer();
                        });
                        return;
                    }

                    const authCodeResponse =
                        UrlString.getDeserializedQueryString(url);
                    if (authCodeResponse.code) {
                        res.writeHead(HttpStatus.REDIRECT, {
                            location: "/",
                        }); // Prevent auth code from being saved in the browser history
                        res.end();
                    }
                    this.authResult.resolve(authCodeResponse);
                }
            );
            this.server.on("connection", (socket) => {
                this.openSockets.add(socket);
                socket.once("close", () => {
                    this.openSockets.delete(socket);
                });
            });
            this.server.once("listening", () => {
                clearTimeout(timeoutId);
                resolve();
            });
            this.server.once("error", (e) => {
                this.closeServer();
                reject(e);
            });
            this.server.listen(0); // Listen on any available port
        });
    }

    waitForAuthCode(): Promise<ServerAuthorizationCodeResponse> {
        if (!this.server || !this.server.listening) {
            return Promise.reject(
                NodeAuthError.createNoLoopbackServerExistsError()
            );
        }
        if (!this.authResult.promise) {
            this.authResult.promise = new Promise((resolve, reject) => {
                this.authResult.resolve = resolve;
                this.authResult.reject = reject;
                if (this.authResult.error) {
                    reject(this.authResult.error);
                } else if (this.authResult.success) {
                    resolve(this.authResult.success);
                }
            });
        }
        return this.authResult.promise;
    }

    /**
     * Get the port that the loopback server is running on
     * @returns
     */
    getRedirectUri(): string {
        if (!this.server || !this.server.listening) {
            throw NodeAuthError.createNoLoopbackServerExistsError();
        }

        // address() returns null if server isn't listening yet or has closed
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
            this.server.close();
            this.server = undefined;
        }
        // close() will not terminate any open connections
        if (this.openSockets.size) {
            for (const socket of this.openSockets) {
                socket.destroy();
            }
            this.openSockets.clear();
        }
    }
}
