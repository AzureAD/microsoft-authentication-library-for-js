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
import { NativeAuthSessionManager } from "../../../../src/custom_auth/core/utils/NativeAuthSessionManager.js";
import {
    ApiId,
    BrowserCacheLocation,
} from "../../../../src/utils/BrowserConstants.js";
import {
    TEST_ACCOUNT_ENTITY,
    TEST_CONFIG,
} from "../../../utils/StringConstants.js";
import { getDefaultLogger } from "../../test_resources/TestModules.js";

describe("NativeAuthSessionManager", () => {
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
        jest.restoreAllMocks();
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
        new NativeAuthSessionManager(cacheManager, logger).setNativeAuthSession(
            account,
            correlationId
        );

        const restoredCacheManager = createCacheManager();
        const restoredAccount = restoredCacheManager.getAllAccounts(
            {},
            correlationId
        )[0];

        const restoredSessionManager = new NativeAuthSessionManager(
            restoredCacheManager,
            logger
        );
        expect(
            restoredSessionManager.isNativeAuthSession(restoredAccount)
        ).toBe(true);
        expect(
            new NativeAuthSessionManager(
                createCacheManager("other-client"),
                logger
            ).isNativeAuthSession(account)
        ).toBe(false);
        expect(
            restoredSessionManager.isNativeAuthSession({
                ...account,
                homeAccountId: "other-account",
            })
        ).toBe(false);
        expect(
            restoredSessionManager.isNativeAuthSession({
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
            new NativeAuthSessionManager(
                cacheManager,
                logger
            ).setNativeAuthSession(account, correlationId);

            if (removal === "account") {
                cacheManager.removeAccount(account, correlationId);
            } else {
                cacheManager.clear(correlationId);
            }

            expect(
                new NativeAuthSessionManager(
                    createCacheManager(),
                    logger
                ).isNativeAuthSession(account)
            ).toBe(false);
        }
    );

    it("cleans up markers with mixed-case account identifiers", () => {
        const cacheManager = createCacheManager();
        const mixedCaseAccount = {
            ...account,
            homeAccountId: account.homeAccountId.toUpperCase(),
            environment: account.environment.toUpperCase(),
        };
        const sessionManager = new NativeAuthSessionManager(
            cacheManager,
            logger
        );
        sessionManager.setNativeAuthSession(mixedCaseAccount, correlationId);

        expect(sessionManager.isNativeAuthSession(mixedCaseAccount)).toBe(true);
        cacheManager.removeAccount(mixedCaseAccount, correlationId);
        expect(sessionManager.isNativeAuthSession(mixedCaseAccount)).toBe(
            false
        );
    });

    it("reads current session state for each routing decision", async () => {
        const cacheManager = createCacheManager();
        const sessionManager = new NativeAuthSessionManager(
            cacheManager,
            logger
        );

        expect(sessionManager.shouldUseNativeAuth(correlationId)).toBe(true);

        await cacheManager.setAccount(
            { ...TEST_ACCOUNT_ENTITY },
            correlationId,
            false,
            ApiId.acquireTokenSilent_silentFlow
        );
        expect(sessionManager.shouldUseNativeAuth(correlationId)).toBe(false);

        sessionManager.setNativeAuthSession(account, correlationId);
        expect(sessionManager.shouldUseNativeAuth(correlationId)).toBe(true);

        cacheManager.removeAccount(account, correlationId);
        expect(sessionManager.shouldUseNativeAuth(correlationId)).toBe(true);

        await cacheManager.setAccount(
            { ...TEST_ACCOUNT_ENTITY },
            correlationId,
            false,
            ApiId.acquireTokenSilent_silentFlow
        );
        expect(sessionManager.shouldUseNativeAuth(correlationId)).toBe(false);
    });

    it.each([true, false])(
        "warns and uses the first account when its native marker = %s",
        (firstAccountIsNative) => {
            const cacheManager = createCacheManager();
            const sessionManager = new NativeAuthSessionManager(
                cacheManager,
                logger
            );
            const otherAccount = { ...account, homeAccountId: "other-account" };
            const getAccounts = jest
                .spyOn(cacheManager, "getAllAccounts")
                .mockReturnValue([account, otherAccount]);
            const warning = jest.spyOn(logger, "warning");
            sessionManager.setNativeAuthSession(
                firstAccountIsNative ? account : otherAccount,
                correlationId
            );

            expect(sessionManager.shouldUseNativeAuth(correlationId)).toBe(
                firstAccountIsNative
            );
            expect(getAccounts).toHaveBeenCalledWith({}, correlationId);
            expect(warning).toHaveBeenCalledWith(
                "Multiple accounts found in cache. This is not supported in the Native Auth scenario.",
                correlationId
            );
        }
    );
});
