/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Constants as CommonConstants, ServerAuthorizationCodeResponse, UrlString } from "@azure/msal-common";
import { createServer, IncomingMessage, Server, ServerResponse } from "http";
import { NodeAuthError } from "../error/NodeAuthError";
import { Constants, LOOPBACK_SERVER_CONSTANTS } from "../utils/Constants";

export class LoopbackClient {
    private server: Server;

    /**
     * Spins up a loopback server which returns the server response when the localhost redirectUri is hit
     * @param successTemplate 
     * @param errorTemplate 
     * @returns 
     */
    async listenForAuthCode(successTemplate?: string, errorTemplate?: string): Promise<ServerAuthorizationCodeResponse> {
        if (!!this.server) {
            throw NodeAuthError.createLoopbackServerAlreadyExistsError();
        }

        return new Promise((resolve, reject) => {
            this.server = createServer((req: IncomingMessage, res: ServerResponse) => {
                const url = req.url;
                if (!url) {
                    res.end(errorTemplate || "Error occurred loading redirectUrl");
                    reject(NodeAuthError.createUnableToLoadRedirectUrlError());
                    return;
                } else if (url === CommonConstants.FORWARD_SLASH) {
                    res.end(successTemplate || "Auth code was successfully acquired. You can close this window now.");
                    return;
                }
    
                const authCodeResponse = UrlString.getDeserializedQueryString(url);
                if (authCodeResponse.code) {
                    const redirectUri = `${Constants.HTTP_PROTOCOL}${req.headers.host}`;
                    res.writeHead(302, { location: redirectUri }); // Prevent auth code from being saved in the browser history
                    res.end();
                }
                resolve(authCodeResponse);
            });
            this.server.listen(0); // Listen on any available port
        });
    }

    /**
     * Get the port that the loopback server is running on
     * @returns 
     */
    async getPort(): Promise<number> {
        if (!this.server) {
            throw NodeAuthError.createNoLoopbackServerExistsError();
        }
        const port: number = await new Promise((resolve, reject) => {
            let ticks = 0;
            const id = setInterval(() => {
                if ((LOOPBACK_SERVER_CONSTANTS.GET_PORT_TIMEOUT_MS / LOOPBACK_SERVER_CONSTANTS.GET_PORT_INTERVAL_MS) < ticks) {
                    throw NodeAuthError.createGetPortTimeoutError();
                }
                
                const address = this.server.address();
                if (typeof address === "string") {
                    clearInterval(id);
                    reject(NodeAuthError.createAddressWrongTypeError());
                } else if (address && address.port) {
                    clearInterval(id);
                    resolve(address.port);
                }
                ticks++;
            }, LOOPBACK_SERVER_CONSTANTS.GET_PORT_INTERVAL_MS);
        });

        return port;
    }

    /**
     * Close the loopback server
     */
    closeServer(): void {
        if (!!this.server) {
            this.server.close();
        }
    }
}
