/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AccountInfo,
    Constants,
    ResponseHandler,
} from "@azure/msal-common/browser";
import { BrowserCacheManager } from "../../src/cache/BrowserCacheManager.js";
import { StandardController } from "../../src/controllers/StandardController.js";
import { StandardOperatingContext } from "../../src/operatingcontext/StandardOperatingContext.js";
import { AuthenticationResult } from "../../src/response/AuthenticationResult.js";
import {
    DEFAULT_OPENID_CONFIG_RESPONSE,
    ID_TOKEN_CLAIMS,
    TEST_CONFIG,
    TEST_DATA_CLIENT_INFO,
    TEST_TOKENS,
} from "../utils/StringConstants.js";

function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((res) => {
        resolve = res;
    });
    return { promise, resolve };
}

describe("DPoP silent request coalescing", () => {
    const account: AccountInfo = {
        homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
        localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
        environment: "login.microsoftonline.com",
        tenantId: ID_TOKEN_CLAIMS.tid,
        username: "user@contoso.com",
    };
    const resourceRequestUri = "https://api.contoso.com/resource";
    let controller: StandardController;

    beforeEach(async () => {
        controller = new StandardController(
            new StandardOperatingContext({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    knownAuthorities: ["login.microsoftonline.com"],
                    authorityMetadata: JSON.stringify(
                        DEFAULT_OPENID_CONFIG_RESPONSE.body
                    ),
                },
            })
        );
        await controller.initialize();
    });

    afterEach(() => {
        jest.restoreAllMocks();
        sessionStorage.clear();
        localStorage.clear();
    });

    it("shares token acquisition but generates a fresh proof for a joining caller", async () => {
        const started = deferred<void>();
        const response = deferred<AuthenticationResult>();
        const result: AuthenticationResult = {
            authority: TEST_CONFIG.validAuthority,
            uniqueId: account.localAccountId,
            tenantId: account.tenantId,
            scopes: ["User.Read"],
            idToken: TEST_TOKENS.IDTOKEN_V2,
            idTokenClaims: ID_TOKEN_CLAIMS,
            accessToken: TEST_TOKENS.ACCESS_TOKEN,
            dpopProof: "initiating-proof",
            fromCache: true,
            correlationId: "initiating",
            expiresOn: new Date(Date.now() + 3600000),
            account,
            tokenType: Constants.AuthenticationScheme.DPOP,
        };
        const acquire = jest
            .spyOn(
                controller as unknown as {
                    acquireTokenSilentAsync: StandardController["acquireTokenSilent"];
                },
                "acquireTokenSilentAsync"
            )
            .mockImplementation(() => {
                started.resolve();
                return response.promise;
            });
        const generateProof = jest
            .spyOn(ResponseHandler, "generateDpopResourceProof")
            .mockResolvedValue("joining-proof");
        const request = {
            scopes: ["User.Read"],
            account,
            authenticationScheme: Constants.AuthenticationScheme.DPOP,
            resourceRequestMethod: "GET",
            resourceRequestUri,
        };

        const initiatingRequest = controller.acquireTokenSilent({
            ...request,
            correlationId: "initiating",
        });
        await started.promise;
        await controller.loadDpopNonce(resourceRequestUri, "latest-nonce");
        const joiningRequest = controller.acquireTokenSilent({
            ...request,
            correlationId: "joining",
        });
        response.resolve(result);

        const [initiatingResult, joiningResult] = await Promise.all([
            initiatingRequest,
            joiningRequest,
        ]);

        expect(acquire).toHaveBeenCalledTimes(1);
        expect(initiatingResult).toMatchObject(result);
        expect(initiatingResult.dpopProof).toBe("initiating-proof");
        expect(joiningResult).not.toBe(initiatingResult);
        expect(joiningResult.accessToken).toBe(result.accessToken);
        expect(joiningResult.dpopProof).toBe("joining-proof");
        expect(generateProof).toHaveBeenCalledTimes(1);
        expect(generateProof.mock.calls[0][2]).toMatchObject({
            correlationId: "joining",
            resourceRequestMethod: "GET",
            resourceRequestUri,
        });
        const browserStorage = (
            controller as unknown as {
                browserStorage: BrowserCacheManager;
            }
        ).browserStorage;
        expect(generateProof.mock.calls[0][4]).toEqual(
            expect.objectContaining({ cacheManager: browserStorage })
        );
        expect(browserStorage.getDpopNonce(resourceRequestUri)).toEqual({
            nonce: "latest-nonce",
        });
    });
});
