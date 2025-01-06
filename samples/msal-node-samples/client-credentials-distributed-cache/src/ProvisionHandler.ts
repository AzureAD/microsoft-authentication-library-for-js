/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import http from "http";
import { CryptoProvider } from "@azure/msal-node";
import open from "open";

/**
 * This class helps with granting admin consent to provision a
 * multi-tenant application into other tenants. For more information, visit:
 * https://learn.microsoft.com/azure/active-directory/develop/single-and-multi-tenant-apps
 */
class ProvisionHandler {
    private server: http.Server;
    private cryptoProvider: CryptoProvider;
    private state: string;

    constructor() {
        this.cryptoProvider = new CryptoProvider();
    }

    /**
     * Opens a browser window to grant admin consent to the application. This is required
     * to provision the application into another tenant.
     *
     * @param instance
     * @param tenantId
     * @param clientId
     * @param scope
     */
    async grantAdminConsent(
        instance: string,
        tenantId: string,
        clientId: string,
        scope: string
    ): Promise<boolean> {
        const adminConsentListener = this.listenForAdminConsentResponse();
        const redirectUri = this.getRedirectUri();

        this.state = this.cryptoProvider.createNewGuid();

        /**
         * Construct URL for admin consent endpoint. For more information, visit:
         * https://docs.microsoft.com/azure/active-directory/develop/v2-admin-consent
         */
        let adminConsentUri = `${instance}/${tenantId}/v2.0/adminconsent`;

        const searchParams = new URLSearchParams({});

        searchParams.append("client_id", clientId);
        searchParams.append("state", this.state);
        searchParams.append("redirect_uri", redirectUri);
        searchParams.append("scope", scope);

        await open(`${adminConsentUri}?${searchParams.toString()}`);

        const adminConsentResponse = await adminConsentListener.finally(() => {
            this.server.close();
        });

        return adminConsentResponse;
    }

    private async listenForAdminConsentResponse(): Promise<boolean> {
        if (!!this.server) {
            throw new Error("Server already exists. Cannot create another.");
        }

        const adminConsentListener = new Promise<boolean>((resolve, reject) => {
            this.server = http.createServer(
                async (req: http.IncomingMessage, res: http.ServerResponse) => {
                    const url = req.url;

                    if (!url) {
                        res.end("Error occurred loading redirectUrl");
                        reject(
                            new Error(
                                "Server callback was invoked without a url. This is unexpected."
                            )
                        );
                        return;
                    }

                    const redirectUri = await this.getRedirectUri();
                    const responseUri = new URL(`${redirectUri}${url}`);

                    /**
                     * Retrieve the response parameters. For more information, visit:
                     * https://docs.microsoft.com/azure/active-directory/develop/v2-admin-consent#successful-response
                     */
                    const isGranted =
                        responseUri.searchParams.get("admin_consent") ===
                        "True";
                    const doesStateMatch =
                        responseUri.searchParams.get("state") === this.state;
                    const hasAnyErrors = responseUri.searchParams.has("error");

                    if (isGranted && doesStateMatch && !hasAnyErrors) {
                        res.end(
                            "Admin consent was successfully acquired. You can close this window now."
                        );
                    } else {
                        res.end(
                            "Admin consent was not acquired. Make sure the account has admin privileges in the tenant and try again."
                        );
                    }

                    resolve(isGranted && doesStateMatch && !hasAnyErrors);
                }
            );

            this.server.listen(0);
        });

        // wait for server to be listening
        await new Promise<void>((resolve) => {
            let ticks = 0;

            const id = setInterval(() => {
                if (5000 / 100 < ticks) {
                    throw new Error(
                        "Timed out waiting for auth code listener to be registered."
                    );
                }

                if (this.server.listening) {
                    clearInterval(id);
                    resolve();
                }

                ticks++;
            }, 100);
        });

        return adminConsentListener;
    }

    private getRedirectUri(): string {
        if (!this.server) {
            throw new Error("No loopback server exists yet.");
        }

        const address = this.server.address();

        if (!address || typeof address === "string" || !address.port) {
            this.closeServer();
            throw new Error(
                "Loopback server address is not type string. This is unexpected."
            );
        }

        const port = address && address.port;

        return `http://localhost:${port}`;
    }

    private closeServer(): void {
        if (!!this.server) {
            this.server.close();
        }
    }
}

export default ProvisionHandler;
