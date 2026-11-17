/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AccountEntityUtils,
    StubPerformanceClient,
} from "@azure/msal-common/browser";
import { BrowserCacheManager } from "../../../../src/cache/BrowserCacheManager.js";
import { CryptoOps } from "../../../../src/crypto/CryptoOps.js";
import { EventHandler } from "../../../../src/event/EventHandler.js";
import {
    isNativeAuthSession,
    setNativeAuthSession,
} from "../../../../src/custom_auth/core/utils/NativeAuthSession.js";
import {
    ApiId,
    BrowserCacheLocation,
} from "../../../../src/utils/BrowserConstants.js";
import {
    TEST_ACCOUNT_ENTITY,
    TEST_CONFIG,
} from "../../../utils/StringConstants.js";
import { getDefaultLogger } from "../../test_resources/TestModules.js";

describe("Native Auth session", () => {
    const account = AccountEntityUtils.getAccountInfo(TEST_ACCOUNT_ENTITY);
    const correlationId = TEST_CONFIG.CORRELATION_ID;
    const logger = getDefaultLogger();
    const createCacheManager = (
        clientId: string = TEST_CONFIG.MSAL_CLIENT_ID
    ): BrowserCacheManager =>
        new BrowserCacheManager(
            clientId,
            {
                cacheLocation: BrowserCacheLocation.SessionStorage,
                cacheRetentionDays: 5,
            },
            new CryptoOps(logger),
            logger,
            new StubPerformanceClient(),
            new EventHandler()
        );

    afterEach(() => {
        window.sessionStorage.clear();
    });

    it("restores the native session marker with a new cache manager", async () => {
        const cacheManager = createCacheManager();
        await cacheManager.setAccount(
            { ...TEST_ACCOUNT_ENTITY },
            correlationId,
            false,
            ApiId.acquireTokenSilent_silentFlow
        );
        setNativeAuthSession(cacheManager, account, correlationId);

        const restoredCacheManager = createCacheManager();
        const restoredAccount = restoredCacheManager.getAllAccounts(
            {},
            correlationId
        )[0];

        expect(isNativeAuthSession(restoredCacheManager, restoredAccount)).toBe(
            true
        );
        expect(
            isNativeAuthSession(createCacheManager("other-client"), account)
        ).toBe(false);
        expect(
            isNativeAuthSession(restoredCacheManager, {
                ...account,
                homeAccountId: "other-account",
            })
        ).toBe(false);
        expect(
            isNativeAuthSession(restoredCacheManager, {
                ...account,
                environment: "other.ciamlogin.com",
            })
        ).toBe(false);
    });

    it.each(["account", "all"])(
        "clears the marker when removing %s session data",
        async (removal) => {
            const cacheManager = createCacheManager();
            await cacheManager.setAccount(
                { ...TEST_ACCOUNT_ENTITY },
                correlationId,
                false,
                ApiId.acquireTokenSilent_silentFlow
            );
            setNativeAuthSession(cacheManager, account, correlationId);

            if (removal === "account") {
                cacheManager.removeAccount(account, correlationId);
            } else {
                cacheManager.clear(correlationId);
            }

            expect(isNativeAuthSession(createCacheManager(), account)).toBe(
                false
            );
        }
    );

    it("cleans up markers with mixed-case account identifiers", () => {
        const cacheManager = createCacheManager();
        const mixedCaseAccount = {
            ...account,
            homeAccountId: account.homeAccountId.toUpperCase(),
            environment: account.environment.toUpperCase(),
        };
        setNativeAuthSession(cacheManager, mixedCaseAccount, correlationId);

        expect(isNativeAuthSession(cacheManager, mixedCaseAccount)).toBe(true);
        cacheManager.removeAccount(mixedCaseAccount, correlationId);
        expect(isNativeAuthSession(cacheManager, mixedCaseAccount)).toBe(false);
    });
});
