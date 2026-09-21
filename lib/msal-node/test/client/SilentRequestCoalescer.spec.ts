/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as AADServerParamKeys from "../../src/common/constants/AADServerParamKeys.js";
import { Logger } from "../../src/common/logger/Logger.js";
import { CommonSilentFlowRequest } from "../../src/common/request/CommonSilentFlowRequest.js";
import { AuthenticationResult } from "../../src/common/response/AuthenticationResult.js";
import {
    acquireTokenSilentDeduped,
    getSilentRequestKey,
    SilentRequestKeyInput,
} from "../../src/client/SilentRequestCoalescer.js";
import {
    mockAccountInfo,
    mockAuthenticationResult,
    TEST_CONSTANTS,
} from "../utils/TestConstants.js";

function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (reason: Error) => void;
    const promise = new Promise<T>((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });
    return { promise, resolve, reject };
}

function createKeyInput(
    requestOverrides: Partial<CommonSilentFlowRequest> = {}
): SilentRequestKeyInput {
    return {
        requestType: "non-native",
        authority: TEST_CONSTANTS.DEFAULT_AUTHORITY,
        clientId: TEST_CONSTANTS.CLIENT_ID,
        request: {
            account: mockAccountInfo,
            scopes: ["User.Read", "Mail.Read"],
            authority: TEST_CONSTANTS.DEFAULT_AUTHORITY,
            correlationId: "test-correlation-id",
            forceRefresh: false,
            ...requestOverrides,
        },
    };
}

describe("SilentRequestCoalescer", () => {
    const logger = new Logger({});

    test("shares an in-flight request and applies each caller correlation ID", async () => {
        const owner = {};
        const response = deferred<AuthenticationResult>();
        const acquireToken = jest.fn(() => response.promise);

        const firstRequest = acquireTokenSilentDeduped(
            owner,
            logger,
            "request-key",
            "first-correlation-id",
            acquireToken
        );
        const secondRequest = acquireTokenSilentDeduped(
            owner,
            logger,
            "request-key",
            "second-correlation-id",
            acquireToken
        );

        await new Promise<void>((resolve) => setImmediate(resolve));
        expect(acquireToken).toHaveBeenCalledTimes(1);

        response.resolve(mockAuthenticationResult);
        await expect(
            Promise.all([firstRequest, secondRequest])
        ).resolves.toEqual([
            {
                ...mockAuthenticationResult,
                correlationId: "first-correlation-id",
            },
            {
                ...mockAuthenticationResult,
                correlationId: "second-correlation-id",
            },
        ]);
    });

    test("removes completed and failed requests from the in-flight map", async () => {
        const owner = {};
        const requestError = new Error("request failed");
        const acquireToken = jest
            .fn<Promise<AuthenticationResult>, []>()
            .mockResolvedValueOnce(mockAuthenticationResult)
            .mockRejectedValueOnce(requestError)
            .mockResolvedValueOnce(mockAuthenticationResult);

        await acquireTokenSilentDeduped(
            owner,
            logger,
            "request-key",
            "first",
            acquireToken
        );
        await expect(
            acquireTokenSilentDeduped(
                owner,
                logger,
                "request-key",
                "second",
                acquireToken
            )
        ).rejects.toBe(requestError);
        await acquireTokenSilentDeduped(
            owner,
            logger,
            "request-key",
            "third",
            acquireToken
        );

        expect(acquireToken).toHaveBeenCalledTimes(3);
    });

    test("shares the original failure between callers", async () => {
        const owner = {};
        const response = deferred<AuthenticationResult>();
        const requestError = new Error("request failed");
        const acquireToken = jest.fn(() => response.promise);

        const firstRequest = acquireTokenSilentDeduped(
            owner,
            logger,
            "request-key",
            "first",
            acquireToken
        );
        const secondRequest = acquireTokenSilentDeduped(
            owner,
            logger,
            "request-key",
            "second",
            acquireToken
        );

        await new Promise<void>((resolve) => setImmediate(resolve));
        response.reject(requestError);

        await expect(
            Promise.allSettled([firstRequest, secondRequest])
        ).resolves.toEqual([
            { status: "rejected", reason: requestError },
            { status: "rejected", reason: requestError },
        ]);
        expect(acquireToken).toHaveBeenCalledTimes(1);
    });

    test("does not share requests across application instances", async () => {
        const acquireToken = jest
            .fn<Promise<AuthenticationResult>, []>()
            .mockResolvedValue(mockAuthenticationResult);

        await Promise.all([
            acquireTokenSilentDeduped(
                {},
                logger,
                "request-key",
                "first",
                acquireToken
            ),
            acquireTokenSilentDeduped(
                {},
                logger,
                "request-key",
                "second",
                acquireToken
            ),
        ]);

        expect(acquireToken).toHaveBeenCalledTimes(2);
    });

    test.each([
        ["scope order", { scopes: ["Mail.Read", "User.Read"] }],
        [
            "scope duplicates",
            { scopes: ["User.Read", "Mail.Read", "User.Read"] },
        ],
        ["scope whitespace", { scopes: [" User.Read ", "Mail.Read", "", " "] }],
        [
            "extra parameter order",
            { extraParameters: { alpha: "first", zeta: "last" } },
        ],
        [
            "extra query parameter order",
            { extraQueryParameters: { alpha: "first", zeta: "last" } },
        ],
    ])("uses the same key for equivalent %s", (_name, requestOverrides) => {
        const originalOverrides =
            "extraParameters" in requestOverrides
                ? { extraParameters: { zeta: "last", alpha: "first" } }
                : "extraQueryParameters" in requestOverrides
                ? {
                      extraQueryParameters: {
                          zeta: "last",
                          alpha: "first",
                      },
                  }
                : {};

        expect(getSilentRequestKey(createKeyInput(requestOverrides))).toBe(
            getSilentRequestKey(createKeyInput(originalOverrides))
        );
    });

    test("uses the same key for equivalent attribute token sets", () => {
        expect(
            getSilentRequestKey(
                createKeyInput({ attributeTokens: ["zeta", "alpha"] })
            )
        ).toBe(
            getSilentRequestKey(
                createKeyInput({ attributeTokens: ["alpha", "zeta"] })
            )
        );
    });

    test.each(["extraParameters", "extraQueryParameters"] as const)(
        "preserves case and whitespace when comparing %s",
        (parameterName) => {
            const parameterSets = [
                { Custom: "Value" },
                { custom: "Value" },
                { Custom: "value" },
                { Custom: " Value " },
            ];
            const keys = parameterSets.map((parameters) =>
                getSilentRequestKey(
                    createKeyInput({ [parameterName]: parameters })
                )
            );

            expect(new Set(keys).size).toBe(parameterSets.length);
        }
    );

    test.each([
        ["scope casing", { scopes: ["user.read", "Mail.Read"] }],
        ["authority", {}, "https://login.microsoftonline.com/different-tenant"],
        [
            "account",
            {
                account: {
                    ...mockAccountInfo,
                    homeAccountId: "different-home-account-id",
                },
            },
        ],
        [
            "claims",
            { claims: JSON.stringify({ access_token: { xms_cc: {} } }) },
        ],
        ["resource", { resource: "https://different-resource.example" }],
        [
            "account tenant",
            {
                account: {
                    ...mockAccountInfo,
                    tenantId: "different-tenant-id",
                },
            },
        ],
        [
            "account environment",
            {
                account: {
                    ...mockAccountInfo,
                    environment: "login.microsoftonline.us",
                },
            },
        ],
        ["force refresh", { forceRefresh: true }],
        [
            "refresh token expiration offset",
            { refreshTokenExpirationOffsetSeconds: 60 },
        ],
        ["redirect URI", { redirectUri: "http://localhost:3000/other" }],
        ["extra parameters", { extraParameters: { custom: "value" } }],
        [
            "extra query parameters",
            { extraQueryParameters: { custom: "value" } },
        ],
    ])("uses a different key for a different %s", (...args) => {
        const [, requestOverrides, authority] = args;
        const changedInput = createKeyInput(requestOverrides);
        if (authority) {
            changedInput.authority = authority;
        }

        expect(getSilentRequestKey(changedInput)).not.toBe(
            getSilentRequestKey(createKeyInput())
        );
    });

    test.each([
        ["embedded client ID", { embeddedClientId: "embedded-client-id" }],
        [
            "broker client ID parameter",
            {
                extraParameters: {
                    [AADServerParamKeys.BROKER_CLIENT_ID]: "broker-client-id",
                },
            },
        ],
    ])(
        "distinguishes skipBrokerClaims with a %s",
        (_name, requestOverrides) => {
            const firstInput = createKeyInput({
                ...requestOverrides,
                skipBrokerClaims: false,
            });
            const secondInput = createKeyInput({
                ...requestOverrides,
                skipBrokerClaims: true,
            });

            expect(getSilentRequestKey(firstInput)).not.toBe(
                getSilentRequestKey(secondInput)
            );
        }
    );
});
