/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { parse } from "dotenv";
import { mkdtempSync, readFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import * as path from "path";
import { BrowserContext, chromium, Page } from "playwright-core";
import * as puppeteer from "puppeteer";
import {
    HostAuthResult,
    NAA_KMSI_TOKEN_APIS,
    acquireNestedKmsiToken,
    authenticateKmsiHost,
    openKmsiHost,
    readAccountKeys,
    readBrowserTokenStore,
    readCachedAccount,
    readKmsiIdTokenClaims,
    verifyHostTokenStore,
} from "./naaTestUtils";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { HOST_APP_PORT, NESTED_APP_PORT } = require("../sampleConfig.cjs") as {
    HOST_APP_PORT: number;
    NESTED_APP_PORT: number;
};

const HOST_URL =
    `https://localhost:${HOST_APP_PORT}` + "?kmsi=true&platformBroker=false";
const NESTED_URL = `https://localhost:${NESTED_APP_PORT}`;
const NESTED_APP_CLIENT_ID = parse(
    readFileSync(path.join(__dirname, "../.env.e2e"))
)["VITE_NESTED_CLIENT_ID"];
const WEB_HOST_TOKEN_STORE = {
    idTokens: 1,
    accessTokens: 1,
    refreshTokens: 1,
};

if (!NESTED_APP_CLIENT_ID) {
    throw new Error("VITE_NESTED_CLIENT_ID is missing from .env.e2e");
}

describe("NAA + KMSI tests", () => {
    jest.setTimeout(300000);

    let context: BrowserContext;
    let userDataDir: string;
    let hostPage: Page;
    let initialHostResult: HostAuthResult;

    async function launchWebContext(): Promise<BrowserContext> {
        return chromium.launchPersistentContext(userDataDir, {
            executablePath: puppeteer.executablePath(),
            headless: process.env["HEADLESS"] !== "false",
            ignoreHTTPSErrors: true,
        });
    }

    async function openHost(): Promise<void> {
        hostPage = await openKmsiHost(context, HOST_URL, NESTED_URL);
    }

    beforeAll(async () => {
        userDataDir = mkdtempSync(path.join(tmpdir(), "naa-kmsi-web-profile-"));
        context = await launchWebContext();
        await openHost();
        initialHostResult = await authenticateKmsiHost(hostPage, false);
        await verifyHostTokenStore(hostPage, WEB_HOST_TOKEN_STORE);
    });

    afterAll(async () => {
        await context?.close();
        if (userDataDir) {
            rmSync(userDataDir, { recursive: true, force: true });
        }
    });

    it.each(NAA_KMSI_TOKEN_APIS)(
        "$name returns a web KMSI token for the nested app via $bridge",
        async (api) => {
            await acquireNestedKmsiToken(
                {
                    hostPage,
                    initialHostResult,
                    fromPlatformBroker: false,
                    nestedClientId: NESTED_APP_CLIENT_ID,
                },
                api
            );
        }
    );

    it("restores the same web KMSI account and both silent NAA APIs after a browser restart", async () => {
        await context.close();
        context = await launchWebContext();
        await openHost();
        await verifyHostTokenStore(hostPage, WEB_HOST_TOKEN_STORE);
        const hostStore = await readBrowserTokenStore(hostPage, "localStorage");
        await readKmsiIdTokenClaims(
            hostPage,
            hostStore.idTokens[0],
            "localStorage"
        );
        const accountKeys = await readAccountKeys(hostPage, "localStorage");
        const restoredAccount = await readCachedAccount(
            hostPage,
            accountKeys?.[0],
            "localStorage"
        );
        expect(restoredAccount.homeAccountId).toBe(
            initialHostResult.account.homeAccountId
        );

        const popups: Page[] = [];
        const onPage = (page: Page): void => {
            popups.push(page);
        };
        context.on("page", onPage);
        try {
            for (const api of NAA_KMSI_TOKEN_APIS.filter((api) => api.silent)) {
                await acquireNestedKmsiToken(
                    {
                        hostPage,
                        initialHostResult,
                        fromPlatformBroker: false,
                        nestedClientId: NESTED_APP_CLIENT_ID,
                    },
                    api
                );
            }
            expect(popups).toHaveLength(0);
        } finally {
            context.off("page", onPage);
        }
    });
});
