/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { parse } from "dotenv";
import { readFileSync } from "fs";
import * as path from "path";
import { Page } from "playwright-core";
import {
    BrokerContext,
    closeBrokerContext,
    launchBrokerContext,
} from "./brokerHarness";
import {
    ACTION_TIMEOUT,
    HostAuthResult,
    NAA_KMSI_TOKEN_APIS,
    acquireNestedKmsiToken,
    authenticateKmsiHost,
    openKmsiHost,
    readAccountKeys,
    readBrowserTokenStore,
    readHostAuthResult,
    verifyHostTokenStore,
} from "./naaTestUtils";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { HOST_APP_PORT, NESTED_APP_PORT } = require("../sampleConfig.cjs") as {
    HOST_APP_PORT: number;
    NESTED_APP_PORT: number;
};

const HOST_URL = `https://localhost:${HOST_APP_PORT}?kmsi=true`;
const NESTED_URL = `https://localhost:${NESTED_APP_PORT}`;
const NESTED_APP_CLIENT_ID = parse(
    readFileSync(path.join(__dirname, "../.env.e2e"))
)["VITE_NESTED_CLIENT_ID"];
const BROKER_HOST_TOKEN_STORE = {
    idTokens: 1,
    accessTokens: 0,
    refreshTokens: 0,
};

if (!NESTED_APP_CLIENT_ID) {
    throw new Error("VITE_NESTED_CLIENT_ID is missing from .env.e2e");
}

describe("NAA + KMSI + Platform Broker tests", () => {
    jest.setTimeout(300000);

    let broker: BrokerContext | undefined;
    let hostPage: Page;
    let initialHostResult: HostAuthResult;

    async function openHost(): Promise<void> {
        if (!broker?.extensionPresent) {
            throw new Error(
                "To test NAA + KMSI with platform brokering enabled, install " +
                    "the Microsoft SSO extension and enable BrowserCore on a " +
                    "self-hosted Windows agent. The WAM account must also have " +
                    "persistent sign-in enabled. See the NestedAuthAppSample README."
            );
        }
        hostPage = await openKmsiHost(broker.context, HOST_URL, NESTED_URL);
    }

    beforeAll(async () => {
        broker = await launchBrokerContext();
        await openHost();
        initialHostResult = await authenticateKmsiHost(hostPage, true);
        await verifyHostTokenStore(hostPage, BROKER_HOST_TOKEN_STORE);
    });

    afterAll(async () => {
        await closeBrokerContext(broker);
    });

    it.each(NAA_KMSI_TOKEN_APIS)(
        "$name returns a KMSI token for the nested app via $bridge",
        async (api) => {
            await acquireNestedKmsiToken(
                {
                    hostPage,
                    initialHostResult,
                    fromPlatformBroker: true,
                    nestedClientId: NESTED_APP_CLIENT_ID,
                    hostTokenStore: BROKER_HOST_TOKEN_STORE,
                },
                api
            );
        }
    );

    it("restores the same KMSI account and both silent NAA APIs after a browser restart", async () => {
        if (!broker) {
            throw new Error("Platform-broker context was not created");
        }
        const userDataDir = broker.userDataDir;
        await broker.context.close();
        broker = await launchBrokerContext(userDataDir);
        await openHost();
        expect(await readBrowserTokenStore(hostPage, "localStorage")).toEqual({
            idTokens: expect.any(Array),
            accessTokens: [],
            refreshTokens: [],
        });
        expect(
            (await readBrowserTokenStore(hostPage, "localStorage")).idTokens
        ).toHaveLength(1);
        expect(await readAccountKeys(hostPage, "localStorage")).toHaveLength(1);

        const popups: Page[] = [];
        const onPage = (page: Page): void => {
            popups.push(page);
        };
        broker.context.on("page", onPage);
        try {
            await hostPage
                .getByRole("button", { name: "ssoSilent", exact: true })
                .click({ timeout: ACTION_TIMEOUT });
            const restoredResult = await readHostAuthResult(hostPage, true);
            expect(restoredResult.account).toEqual(initialHostResult.account);
            await verifyHostTokenStore(hostPage, BROKER_HOST_TOKEN_STORE);
            for (const api of NAA_KMSI_TOKEN_APIS.filter((api) => api.silent)) {
                await acquireNestedKmsiToken(
                    {
                        hostPage,
                        initialHostResult,
                        fromPlatformBroker: true,
                        nestedClientId: NESTED_APP_CLIENT_ID,
                        hostTokenStore: BROKER_HOST_TOKEN_STORE,
                    },
                    api
                );
            }
            expect(popups).toHaveLength(0);
        } finally {
            broker.context.off("page", onPage);
        }
    });
});
