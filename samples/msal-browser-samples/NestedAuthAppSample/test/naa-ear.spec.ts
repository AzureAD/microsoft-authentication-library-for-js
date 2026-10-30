// Tests the NAA, KMSI, and EAR end-to-end flow.

import { parse } from "dotenv";
import { mkdtempSync, readFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import * as path from "path";
import { BrowserContext, Frame, Page } from "playwright-core";
import {
    HostAuthResult,
    NAA_KMSI_TOKEN_APIS,
    Screenshot,
    acquireNestedKmsiToken,
    authenticateKmsiHost,
    getEarDecryptCount,
    installEarDecryptSpy,
    launchKmsiBrowserContext,
    openKmsiHost,
    readAccountKeys,
    readBrowserTokenStore,
    readCachedAccount,
    readKmsiIdTokenClaims,
    verifyHostTokenStore,
} from "./naaTestUtils";

const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots/nestedAppAuth`;
const WEB_HOST_TOKEN_STORE = {
    idTokens: 1,
    accessTokens: 1,
    refreshTokens: 1,
};
const ACQUIRE_TOKEN_SILENT = NAA_KMSI_TOKEN_APIS[0];

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { HOST_APP_PORT, NESTED_APP_PORT } = require("../sampleConfig.cjs") as {
    HOST_APP_PORT: number;
    NESTED_APP_PORT: number;
};

const HOST_URL =
    `https://localhost:${HOST_APP_PORT}/` +
    "?ear=true&kmsi=true&platformBroker=false";
const NESTED_URL = `https://localhost:${NESTED_APP_PORT}`;
const NESTED_APP_CLIENT_ID = parse(
    readFileSync(path.join(__dirname, "../.env.e2e"))
)["VITE_NESTED_CLIENT_ID"];

if (!NESTED_APP_CLIENT_ID) {
    throw new Error("VITE_NESTED_CLIENT_ID is missing from .env.e2e");
}

async function removeHostRefreshTokens(page: Page): Promise<void> {
    await page.evaluate(() => {
        Object.keys(window.localStorage)
            .filter((key) => key.includes("refreshtoken"))
            .forEach((key) => window.localStorage.removeItem(key));
    });
}

async function getTotalEarDecryptCount(
    hostPage: Page,
    nestedFrame: Frame
): Promise<number> {
    return (
        (await getEarDecryptCount(hostPage)) +
        (await getEarDecryptCount(nestedFrame))
    );
}

describe("Nested App Authentication + KMSI + EAR", () => {
    jest.setTimeout(300000);

    let context: BrowserContext;
    let userDataDir: string;
    let hostPage: Page;
    let initialHostResult: HostAuthResult;

    async function launchContext(): Promise<void> {
        context = await launchKmsiBrowserContext(userDataDir);
        await installEarDecryptSpy(context);
    }

    async function openHost(): Promise<void> {
        hostPage = await openKmsiHost(context, HOST_URL, NESTED_URL);
    }

    beforeAll(async () => {
        userDataDir = mkdtempSync(
            path.join(tmpdir(), "naa-kmsi-ear-web-profile-")
        );
        await launchContext();
        await openHost();
        initialHostResult = await authenticateKmsiHost(hostPage, false);
    });

    afterAll(async () => {
        await context?.close();
        if (userDataDir) {
            rmSync(userDataDir, { recursive: true, force: true });
        }
    });

    it("persists an EAR-enabled NAA KMSI session across a browser restart", async () => {
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/nestedAcquireTokenKmsiEar`
        );

        await verifyHostTokenStore(hostPage, WEB_HOST_TOKEN_STORE);
        expect(await getEarDecryptCount(hostPage)).toBeGreaterThan(0);

        await removeHostRefreshTokens(hostPage);
        const decryptCountBeforeNested = await getEarDecryptCount(hostPage);
        const nestedFrame = await acquireNestedKmsiToken(
            {
                hostPage,
                initialHostResult,
                fromPlatformBroker: false,
                nestedClientId: NESTED_APP_CLIENT_ID,
            },
            ACQUIRE_TOKEN_SILENT
        );
        expect(
            await getTotalEarDecryptCount(hostPage, nestedFrame)
        ).toBeGreaterThan(decryptCountBeforeNested);
        await screenshot.takeScreenshot(
            hostPage,
            "Nested KMSI EAR session established"
        );

        await context.close();
        await launchContext();
        await openHost();

        const restoredStore = await readBrowserTokenStore(
            hostPage,
            "localStorage"
        );
        expect(restoredStore.idTokens).toHaveLength(1);
        expect(restoredStore.accessTokens).toHaveLength(1);
        expect(restoredStore.refreshTokens).toHaveLength(1);
        await readKmsiIdTokenClaims(
            hostPage,
            restoredStore.idTokens[0],
            "localStorage"
        );
        const accountKeys = await readAccountKeys(hostPage, "localStorage");
        expect(accountKeys).toHaveLength(1);
        const restoredAccount = await readCachedAccount(
            hostPage,
            accountKeys?.[0],
            "localStorage"
        );
        expect(restoredAccount.homeAccountId).toBe(
            initialHostResult.account.homeAccountId
        );

        const decryptCountBeforeRestore = await getEarDecryptCount(hostPage);
        const restoredNestedFrame = await acquireNestedKmsiToken(
            {
                hostPage,
                initialHostResult,
                fromPlatformBroker: false,
                nestedClientId: NESTED_APP_CLIENT_ID,
            },
            ACQUIRE_TOKEN_SILENT
        );
        expect(
            await getTotalEarDecryptCount(hostPage, restoredNestedFrame)
        ).toBe(decryptCountBeforeRestore);
        await screenshot.takeScreenshot(
            hostPage,
            "Nested KMSI EAR session restored"
        );
    });
});
