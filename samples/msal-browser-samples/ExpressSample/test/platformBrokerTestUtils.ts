/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import type { Page } from "puppeteer";

export interface PlatformBrokerResponse {
    homeAccountId?: string;
    nativeAccountId: string;
}

interface PlatformBrokerAuthData {
    account?: {
        homeAccountId?: string;
        nativeAccountId?: string;
    };
    fromPlatformBroker?: boolean;
}

async function getPlatformBrokerAuthData(
    target: Page
): Promise<PlatformBrokerAuthData> {
    if (!target.url().endsWith("profile")) {
        await target.locator("a#viewProfileButton").click();
    }

    const authDataText = await target
        .locator("pre#auth-json")
        .filter(
            (value) => !!value.textContent && value.textContent !== "Loading..."
        )
        .map((value) => value.textContent)
        .wait();
    return JSON.parse(authDataText || "") as PlatformBrokerAuthData;
}

function requirePlatformBrokerAccount(
    authData: PlatformBrokerAuthData
): PlatformBrokerResponse {
    expect(authData.fromPlatformBroker).toBe(true);
    expect(authData.account?.nativeAccountId).toBeTruthy();
    if (!authData.account?.nativeAccountId) {
        throw new Error(
            "Platform-broker response did not contain account.nativeAccountId"
        );
    }

    return {
        homeAccountId: authData.account.homeAccountId,
        nativeAccountId: authData.account.nativeAccountId,
    };
}

export async function verifyPlatformBrokerResponse(
    target: Page
): Promise<PlatformBrokerResponse> {
    return requirePlatformBrokerAccount(
        await getPlatformBrokerAuthData(target)
    );
}

/**
 * Verifies that the current account is broker-linked without asserting that
 * the Profile page's later acquireTokenSilent response came from the broker.
 */
export async function verifyPlatformBrokerAccount(
    target: Page
): Promise<PlatformBrokerResponse> {
    const authData = await getPlatformBrokerAuthData(target);
    expect(authData.account?.nativeAccountId).toBeTruthy();
    if (!authData.account?.nativeAccountId) {
        throw new Error(
            "Platform-broker account did not contain account.nativeAccountId"
        );
    }

    return {
        homeAccountId: authData.account.homeAccountId,
        nativeAccountId: authData.account.nativeAccountId,
    };
}
