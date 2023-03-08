/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    Constants as CommonConstants,
    ServerAuthorizationCodeResponse,
    UrlString
} from "@azure/msal-common";
import { createServer, IncomingMessage, Server, ServerResponse } from "http";
import { NodeAuthError } from "../error/NodeAuthError";
import {
    Constants,
    HttpStatus,
    LOOPBACK_SERVER_CONSTANTS
} from "../utils/Constants";

export class LoopbackClient {
    public server: Server | null;
    private port: number = 64000;
    public authCodeListener: Promise<ServerAuthorizationCodeResponse> | null;

    async startServer() {
        let error = null;
        try {
            this.server!.listen(this.port, Constants.LOCALHOST);
        } catch (e) {
            error = e;
        }
        return error;
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
    ): Promise<ServerAuthorizationCodeResponse> {
        if (!!this.server) {
            throw NodeAuthError.createLoopbackServerAlreadyExistsError();
        }

         this.authCodeListener = new Promise<ServerAuthorizationCodeResponse>(
            (resolve, reject) => {
                this.server = createServer(
                    async (req: IncomingMessage, res: ServerResponse) => {
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
                            res.end(
                                false
                                    ? successTemplate
                                    : "asfea" ||
                                          "Auth code was successfully acquired. You can close this window now."
                            );
                            return;
                        }

                        const authCodeResponse = UrlString.getDeserializedQueryString(
                            url
                        );
                        if (authCodeResponse.code) {
                            const redirectUri = this.getRedirectUri();
                            res.writeHead(HttpStatus.REDIRECT, {
                                location: redirectUri
                            }); // Prevent auth code from being saved in the browser history
                            res.end();
                        }
                        resolve(authCodeResponse);
                    }
                );
                this.server.listen(this.port, Constants.LOCALHOST);
            }
        );

        // Wait for server to be listening
        await new Promise<void>(resolve => {
            let ticks = 0;
            const id = setInterval(() => {
                if (
                    LOOPBACK_SERVER_CONSTANTS.TIMEOUT_MS /
                        LOOPBACK_SERVER_CONSTANTS.INTERVAL_MS <
                    ticks
                ) {
                    throw NodeAuthError.createLoopbackServerTimeoutError();
                }

                if (this.server!.listening) {
                    clearInterval(id);
                    resolve();
                }
                ticks++;
            }, LOOPBACK_SERVER_CONSTANTS.INTERVAL_MS);
        });

        return this.authCodeListener;
    }

    /**
     * Get the port that the loopback server is running on
     * @returns
     */
    getRedirectUri(): string {
        if (!this.server) {
            throw NodeAuthError.createNoLoopbackServerExistsError();
        }

        return `${Constants.HTTP_PROTOCOL}${Constants.LOCALHOST}:${this.port}`;
    }

    /**
     * Close the loopback server
     */
    closeServer(): void {
        if (!!this.server) {
            this.server.close();
            this.server = null;
            this.authCodeListener = null;
        }
    }
}
