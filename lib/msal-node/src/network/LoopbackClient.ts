/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Constants as CommonConstants, ServerAuthorizationCodeResponse, UrlString } from "@azure/msal-common";
import { createServer, IncomingMessage, Server, ServerResponse } from "http";
import { NodeAuthError } from "../error/NodeAuthError";
import { Constants, HttpStatus, LOOPBACK_SERVER_CONSTANTS } from "../utils/Constants";

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

        const authCodeListener = new Promise<ServerAuthorizationCodeResponse>((resolve, reject) => {
            this.server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
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
                    const redirectUri = await this.getRedirectUri();
                    res.writeHead(HttpStatus.REDIRECT, { location: redirectUri }); // Prevent auth code from being saved in the browser history
                    res.end();
                }
                resolve(authCodeResponse);
            });
            this.server.listen(0); // Listen on any available port
        });

        // Wait for server to be listening
        await new Promise<void>((resolve) => {
            let ticks = 0;
            const id = setInterval(() => {
                if ((LOOPBACK_SERVER_CONSTANTS.TIMEOUT_MS / LOOPBACK_SERVER_CONSTANTS.INTERVAL_MS) < ticks) {
                    throw NodeAuthError.createLoopbackServerTimeoutError();
                }
                
                if (this.server.listening) {
                    clearInterval(id);
                    resolve();
                }
                ticks++;
            }, LOOPBACK_SERVER_CONSTANTS.INTERVAL_MS);
        });

        return authCodeListener;
    }

    /**
     * Get the port that the loopback server is running on
     * @returns 
     */
    getRedirectUri(): string {
        if (!this.server) {
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
        if (!!this.server) {
            this.server.close();
        }
    }
}
