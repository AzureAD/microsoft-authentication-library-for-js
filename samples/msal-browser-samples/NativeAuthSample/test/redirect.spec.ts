/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import type * as puppeteer from "puppeteer";
import { getBrowser, getHomeUrl } from "e2e-test-utils";

describe("Native Auth Sample - Redirect Bridge", () => {
    let browser: puppeteer.Browser;
    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let configRequests: number;
    let useRealBridge: boolean;

    beforeAll(async () => {
        browser = await getBrowser();
    });

    afterAll(async () => {
        await browser?.close();
    });

    beforeEach(async () => {
        configRequests = 0;
        useRealBridge = false;
        context = await browser.createBrowserContext();
        page = await context.newPage();
        await page.setRequestInterception(true);
        page.on("request", async (request) => {
            const pathname = new URL(request.url()).pathname;
            if (
                pathname === "/lib/redirect-bridge/msal-redirect-bridge.js" &&
                !useRealBridge
            ) {
                await request.respond({
                    contentType: "application/javascript",
                    body: `window.msalRedirectBridge = {
                        broadcastResponseToMainFrame: async () => {
                            document.title = "Authentication response received";
                        }
                    };`,
                });
            } else if (pathname === "/nativeAuthConfig.json") {
                configRequests++;
                await request.respond({
                    status: 503,
                    contentType: "application/json",
                    body: "{}",
                });
            } else {
                await request.continue();
            }
        });
    });

    afterEach(async () => {
        await context?.close();
    });

    it.each([
        "#code=test-code&state=test-state",
        "?error=access_denied&state=test-state",
        "#ear_jwe=test-response&state=test-state",
    ])("broadcasts %s without initializing the app", async (response) => {
        const navigation = await page.goto(`${getHomeUrl()}${response}`);
        await page.waitForFunction(
            'document.title === "Authentication response received"'
        );

        expect(configRequests).toBe(0);
        expect(navigation?.headers()["cache-control"]).toBe("no-store");
        expect(
            await page.$eval("#pca-initialized", (element) =>
                element.textContent?.trim()
            )
        ).toBe("false");
    });

    it("initializes the app on a normal sample URL", async () => {
        const configRequest = page.waitForRequest(
            (request) =>
                new URL(request.url()).pathname === "/nativeAuthConfig.json"
        );
        await page.goto(`${getHomeUrl()}?usePwdConfig=true`);
        await configRequest;

        expect(configRequests).toBe(1);
        expect(await page.title()).not.toBe("Authentication response received");
    });

    it("delivers popup responses through the real MSAL redirect bridge", async () => {
        useRealBridge = true;
        await page.goto(`${getHomeUrl()}?usePwdConfig=true`);

        const channelId = "native-auth-redirect-test";
        const state = Buffer.from(
            JSON.stringify({
                id: channelId,
                meta: { interactionType: "popup" },
            })
        ).toString("base64");
        const payload = `code=test-code&state=${encodeURIComponent(state)}`;

        const response = await page.evaluate(
            ({ channelId, url }) =>
                new Promise<unknown>((resolve, reject) => {
                    const channel = new BroadcastChannel(channelId);
                    channel.onmessage = ({ data }) => {
                        channel.close();
                        resolve(data);
                    };
                    if (!window.open(url, "_blank")) {
                        channel.close();
                        reject(new Error("Failed to open the redirect popup"));
                    }
                }),
            { channelId, url: `${getHomeUrl()}#${payload}` }
        );

        expect(response).toEqual({ v: 1, payload });
    });
});
