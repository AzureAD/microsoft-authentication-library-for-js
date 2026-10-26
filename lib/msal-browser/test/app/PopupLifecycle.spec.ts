/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    Authority,
    AuthorityFactory,
    ProtocolMode,
} from "@azure/msal-common/browser";
import { PublicClientApplication } from "../../src/app/PublicClientApplication.js";
import { Configuration } from "../../src/config/Configuration.js";
import { PopupClient } from "../../src/interaction_client/PopupClient.js";
import { RedirectClient } from "../../src/interaction_client/RedirectClient.js";
import { NavigationClient } from "../../src/navigation/NavigationClient.js";
import { AuthenticationResult } from "../../src/response/AuthenticationResult.js";
import {
    BrowserAuthErrorCodes,
    createBrowserAuthError,
} from "../../src/error/BrowserAuthError.js";
import {
    INTERACTION_TYPE,
    TemporaryCacheKeys,
} from "../../src/utils/BrowserConstants.js";
import * as BrowserUtils from "../../src/utils/BrowserUtils.js";
import * as Authorize from "../../src/protocol/Authorize.js";
import * as BrowserCrypto from "../../src/crypto/BrowserCrypto.js";
import * as PopupMonitor from "../../src/utils/PopupMonitor.js";
import {
    getTestAuthenticationResult,
    TEST_CONFIG,
    TEST_URIS,
    validEarJWK,
} from "../utils/StringConstants.js";

jest.mock("@azure/msal-common/browser", () => {
    const common = jest.requireActual<
        typeof import("@azure/msal-common/browser")
    >("@azure/msal-common/browser");
    return {
        ...common,
        AuthorityFactory: { ...common.AuthorityFactory },
    };
});

function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((complete, fail) => {
        resolve = complete;
        reject = fail;
    });
    return { promise, resolve, reject };
}

function createPopup() {
    return {
        closed: false,
        location: { href: "about:blank", assign: jest.fn() },
        document: { title: "" },
        focus: jest.fn(),
        close: jest.fn(function (this: { closed: boolean }) {
            this.closed = true;
        }),
    };
}

async function createApp(
    system: Configuration["system"] = {},
    auth: Partial<Configuration["auth"]> = {}
): Promise<PublicClientApplication> {
    const app = new PublicClientApplication({
        auth: { clientId: TEST_CONFIG.MSAL_CLIENT_ID, ...auth },
        system: { allowPlatformBroker: false, ...system },
    });
    await app.initialize();
    return app;
}

const interactionKey = `msal.${TemporaryCacheKeys.INTERACTION_STATUS_KEY}`;
const waitForBridgeResponse = BrowserUtils.waitForBridgeResponse;
const monitorPopupForHash = PopupMonitor.monitorPopupForHash;

describe("Popup interaction lifecycle", () => {
    beforeEach(() => {
        jest.spyOn(
            AuthorityFactory,
            "createDiscoveredInstance"
        ).mockImplementation(async (...args) => new Authority(...args));
        jest.spyOn(Authority.prototype, "isAlias").mockReturnValue(true);
        jest.spyOn(
            Authority.prototype,
            "endSessionEndpoint",
            "get"
        ).mockReturnValue(TEST_URIS.TEST_END_SESSION_ENDPOINT);
        jest.spyOn(BrowserUtils, "waitForBridgeResponse").mockResolvedValue(
            "code=old"
        );
        jest.spyOn(Authorize, "handleResponseCode").mockResolvedValue(
            getTestAuthenticationResult()
        );
        jest.spyOn(
            NavigationClient.prototype,
            "navigateInternal"
        ).mockResolvedValue(false);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        window.sessionStorage.clear();
        window.localStorage.clear();
    });

    it.each([
        ["old-request", false],
        ["replacement-request", false],
        ["old-request", true],
        ["replacement-request", true],
    ] as const)(
        "does not release a replacement interaction (correlation ID: %s, separate instance: %s)",
        async (correlationId, separateInstance) => {
            const app = await createApp();
            const replacementApp = separateInstance ? await createApp() : app;
            const first = deferred<AuthenticationResult>();
            const second = deferred<AuthenticationResult>();
            jest.spyOn(PopupClient.prototype, "acquireToken")
                .mockReturnValueOnce(first.promise)
                .mockReturnValueOnce(second.promise);
            const previous = app.acquireTokenPopup({
                scopes: ["User.Read"],
                correlationId: "old-request",
            });
            const result = getTestAuthenticationResult();
            const replacement = replacementApp.acquireTokenPopup({
                scopes: ["User.Read"],
                correlationId,
                overrideInteractionInProgress: true,
            });
            try {
                first.resolve(result);
                await expect(previous).resolves.toBe(result);
                expect(sessionStorage.getItem(interactionKey)).toBe(
                    JSON.stringify({
                        clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                        type: INTERACTION_TYPE.SIGNIN,
                    })
                );
                await expect(
                    app.acquireTokenPopup({ scopes: ["User.Read"] })
                ).rejects.toMatchObject({
                    errorCode: BrowserAuthErrorCodes.interactionInProgress,
                });
            } finally {
                first.resolve(getTestAuthenticationResult());
                second.resolve(getTestAuthenticationResult());
                await Promise.all([previous.catch(() => {}), replacement]);
            }
            expect(sessionStorage.getItem(interactionKey)).toBeNull();
        }
    );

    it.each([false, true])(
        "does not close a replacement popup when earlier setup fails with the same request values (separate instance: %s)",
        async (separateInstance) => {
            const app = await createApp({ navigatePopups: true });
            const replacementApp = separateInstance
                ? await createApp({ navigatePopups: true })
                : app;
            const windows = new Map<string, ReturnType<typeof createPopup>>();
            const open = jest
                .spyOn(window, "open")
                .mockImplementation((_url, name) => {
                    let popup = windows.get(name!);
                    if (!popup || popup.closed) {
                        popup = createPopup();
                        windows.set(name!, popup);
                    }
                    return popup as unknown as Window;
                });
            const first = deferred<Authority>();
            const second = deferred<Authority>();
            const firstReady = deferred<void>();
            const secondReady = deferred<void>();
            jest.spyOn(AuthorityFactory, "createDiscoveredInstance")
                .mockImplementationOnce(() => {
                    firstReady.resolve();
                    return first.promise;
                })
                .mockImplementationOnce(() => {
                    secondReady.resolve();
                    return second.promise;
                });
            const request = {
                scopes: ["User.Read"],
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
            };
            const error = new Error("Popup setup failed");
            const previous = app.acquireTokenPopup(request);
            const rejection = expect(previous).rejects.toBe(error);
            await firstReady.promise;
            const replacement = replacementApp.acquireTokenPopup({
                ...request,
                overrideInteractionInProgress: true,
            });
            const replacementRejection =
                expect(replacement).rejects.toBe(error);
            try {
                await secondReady.promise;
                expect(open).toHaveBeenCalledTimes(2);
                expect(open.mock.calls[0][0]).toBe("about:blank");
                expect(open.mock.calls[1][0]).toBe("about:blank");
                first.reject(error);
                await rejection;
                const previousPopup = open.mock.results[0].value;
                const replacementPopup = open.mock.results[1].value;
                expect(previousPopup).not.toBe(replacementPopup);
                expect(previousPopup.close).toHaveBeenCalledTimes(1);
                expect(replacementPopup.closed).toBe(false);
                expect(replacementPopup.close).not.toHaveBeenCalled();
                expect(sessionStorage.getItem(interactionKey)).not.toBeNull();
                await expect(
                    replacementApp.acquireTokenPopup({ scopes: ["User.Read"] })
                ).rejects.toMatchObject({
                    errorCode: BrowserAuthErrorCodes.interactionInProgress,
                });
            } finally {
                first.reject(error);
                second.reject(error);
                await Promise.all([rejection, replacementRejection]);
            }
            expect(sessionStorage.getItem(interactionKey)).toBeNull();
        }
    );

    it("keeps independent in-memory cache scopes isolated when session storage is unavailable", async () => {
        jest.spyOn(window, "sessionStorage", "get").mockImplementation(() => {
            throw new DOMException("Storage blocked", "SecurityError");
        });
        const firstApp = await createApp();
        const secondApp = await createApp();
        const first = deferred<AuthenticationResult>();
        const second = deferred<AuthenticationResult>();
        const result = getTestAuthenticationResult();
        jest.spyOn(PopupClient.prototype, "acquireToken")
            .mockReturnValueOnce(first.promise)
            .mockReturnValueOnce(second.promise)
            .mockResolvedValueOnce(result);
        const firstOperation = firstApp.acquireTokenPopup({
            scopes: ["User.Read"],
        });
        const secondOperation = secondApp.acquireTokenPopup({
            scopes: ["User.Read"],
        });
        try {
            first.resolve(result);
            await expect(firstOperation).resolves.toBe(result);
            await expect(
                firstApp.acquireTokenPopup({ scopes: ["User.Read"] })
            ).resolves.toBe(result);
        } finally {
            first.resolve(result);
            second.resolve(result);
            await Promise.all([firstOperation, secondOperation]);
        }
    });

    it("does not release a replacement interaction when the previous request fails", async () => {
        const app = await createApp();
        const first = deferred<AuthenticationResult>();
        const second = deferred<AuthenticationResult>();
        jest.spyOn(PopupClient.prototype, "acquireToken")
            .mockReturnValueOnce(first.promise)
            .mockReturnValueOnce(second.promise);
        const previous = app.acquireTokenPopup({ scopes: ["User.Read"] });
        const error = new Error("Previous request failed");
        const rejection = expect(previous).rejects.toBe(error);
        const replacement = app.acquireTokenPopup({
            scopes: ["User.Read"],
            overrideInteractionInProgress: true,
        });
        try {
            first.reject(error);
            await rejection;
            expect(sessionStorage.getItem(interactionKey)).not.toBeNull();
            await expect(
                app.acquireTokenPopup({ scopes: ["User.Read"] })
            ).rejects.toMatchObject({
                errorCode: BrowserAuthErrorCodes.interactionInProgress,
            });
        } finally {
            first.resolve(getTestAuthenticationResult());
            second.resolve(getTestAuthenticationResult());
            await replacement;
        }
        expect(sessionStorage.getItem(interactionKey)).toBeNull();
    });

    it.each(["signin", "signout"] as const)(
        "does not clear %s redirect state after an explicit cache clear",
        async (type) => {
            const app = await createApp();
            const first = deferred<AuthenticationResult>();
            const redirect = deferred<void>();
            jest.spyOn(PopupClient.prototype, "acquireToken").mockReturnValue(
                first.promise
            );
            jest.spyOn(
                RedirectClient.prototype,
                "acquireToken"
            ).mockReturnValue(redirect.promise);
            jest.spyOn(RedirectClient.prototype, "logout").mockReturnValue(
                redirect.promise
            );
            const previous = app.acquireTokenPopup({ scopes: ["User.Read"] });
            await app.clearCache();
            const replacement =
                type === "signin"
                    ? app.acquireTokenRedirect({ scopes: ["User.Read"] })
                    : app.logoutRedirect();
            try {
                const result = getTestAuthenticationResult();
                first.resolve(result);
                await expect(previous).resolves.toBe(result);
                expect(sessionStorage.getItem(interactionKey)).toBe(
                    JSON.stringify({
                        clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                        type:
                            type === "signin"
                                ? INTERACTION_TYPE.SIGNIN
                                : INTERACTION_TYPE.SIGNOUT,
                    })
                );
            } finally {
                first.resolve(getTestAuthenticationResult());
                redirect.resolve();
                await Promise.all([previous.catch(() => {}), replacement]);
            }
        }
    );

    it.each(["bridge", "legacy"])(
        "propagates cancellation from an active %s logout monitor without releasing its replacement",
        async (mode) => {
            const app = await createApp({
                enableLegacyPolling: mode === "legacy",
            });
            const popup = createPopup();
            jest.spyOn(window, "open").mockReturnValue(
                popup as unknown as Window
            );
            const ready = deferred<void>();
            if (mode === "legacy") {
                jest.spyOn(
                    PopupMonitor,
                    "monitorPopupForHash"
                ).mockImplementation((...args) => {
                    const response = monitorPopupForHash(...args);
                    ready.resolve();
                    return response;
                });
            } else {
                jest.mocked(
                    BrowserUtils.waitForBridgeResponse
                ).mockImplementation((...args) => {
                    const response = waitForBridgeResponse(...args);
                    ready.resolve();
                    return response;
                });
            }
            const second = deferred<AuthenticationResult>();
            jest.spyOn(PopupClient.prototype, "acquireToken").mockReturnValue(
                second.promise
            );
            const previous = app.logoutPopup({
                mainWindowRedirectUri: "/home",
            });
            const rejection = expect(previous).rejects.toMatchObject({
                errorCode: BrowserAuthErrorCodes.interactionInProgressCancelled,
            });
            let replacement: Promise<AuthenticationResult> | undefined;
            try {
                await ready.promise;
                replacement = app.acquireTokenPopup({
                    scopes: ["User.Read"],
                    overrideInteractionInProgress: true,
                });
                await rejection;
                expect(popup.closed).toBe(true);
                expect(
                    NavigationClient.prototype.navigateInternal
                ).not.toHaveBeenCalled();
                expect(sessionStorage.getItem(interactionKey)).toBe(
                    JSON.stringify({
                        clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                        type: INTERACTION_TYPE.SIGNIN,
                    })
                );
            } finally {
                BrowserUtils.cancelPendingBridgeResponse(app.getLogger(), "");
                PopupMonitor.cancelPendingPopupPollingResponse(app.getLogger());
                second.resolve(getTestAuthenticationResult());
                await Promise.all([previous.catch(() => {}), replacement]);
            }
            expect(sessionStorage.getItem(interactionKey)).toBeNull();
        }
    );

    it.each([true, false])(
        "closes the owned popup when EAR setup fails (navigatePopups: %s)",
        async (navigatePopups) => {
            jest.spyOn(window.navigator, "userAgent", "get").mockReturnValue(
                "Mozilla/5.0 Chrome/137.0.0.0 Safari/537.36"
            );
            const app = await createApp({
                protocolMode: ProtocolMode.EAR,
                navigatePopups,
            });
            const popup = createPopup();
            jest.spyOn(window, "open").mockReturnValue(
                popup as unknown as Window
            );
            const error = new Error("EAR setup failed");
            jest.spyOn(BrowserCrypto, "generateEarKey").mockResolvedValue(
                validEarJWK
            );
            jest.spyOn(Authorize, "getEARForm").mockRejectedValue(error);

            await expect(
                app.acquireTokenPopup({ scopes: ["User.Read"] })
            ).rejects.toBe(error);
            expect(popup.close).toHaveBeenCalledTimes(1);
            expect(sessionStorage.getItem(interactionKey)).toBeNull();
        }
    );

    it.each([false, true])(
        "keeps replacement ownership when an earlier logout settles (failed: %s)",
        async (failed) => {
            const app = await createApp();
            const first = deferred<void>();
            jest.spyOn(PopupClient.prototype, "logout").mockReturnValue(
                first.promise
            );
            const second = deferred<AuthenticationResult>();
            jest.spyOn(PopupClient.prototype, "acquireToken").mockReturnValue(
                second.promise
            );
            const previous = app.logoutPopup();
            const error = new Error("Previous logout failed");
            const completion = failed
                ? expect(previous).rejects.toBe(error)
                : expect(previous).resolves.toBeUndefined();
            const replacement = app.acquireTokenPopup({
                scopes: ["User.Read"],
                overrideInteractionInProgress: true,
            });
            try {
                if (failed) {
                    first.reject(error);
                } else {
                    first.resolve();
                }
                await completion;
                expect(sessionStorage.getItem(interactionKey)).toBe(
                    JSON.stringify({
                        clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                        type: INTERACTION_TYPE.SIGNIN,
                    })
                );
            } finally {
                first.resolve();
                second.resolve(getTestAuthenticationResult());
                await Promise.all([previous.catch(() => {}), replacement]);
            }
            expect(sessionStorage.getItem(interactionKey)).toBeNull();
        }
    );

    it("keeps all-account logout locked until server logout completes", async () => {
        const app = await createApp();
        const popup = createPopup();
        jest.spyOn(window, "open").mockReturnValue(popup as unknown as Window);
        const ready = deferred<void>();
        const discovery = deferred<void>();
        jest.spyOn(
            AuthorityFactory,
            "createDiscoveredInstance"
        ).mockImplementationOnce(async (...args) => {
            ready.resolve();
            await discovery.promise;
            return new Authority(...args);
        });
        const previous = app.logoutPopup();
        try {
            await ready.promise;
            expect(sessionStorage.getItem(interactionKey)).toBe(
                JSON.stringify({
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    type: INTERACTION_TYPE.SIGNOUT,
                })
            );
            await expect(
                app.acquireTokenPopup({ scopes: ["User.Read"] })
            ).rejects.toMatchObject({
                errorCode: BrowserAuthErrorCodes.interactionInProgress,
            });
            await expect(
                app.acquireTokenRedirect({ scopes: ["User.Read"] })
            ).rejects.toMatchObject({
                errorCode: BrowserAuthErrorCodes.interactionInProgress,
            });
            await expect(app.logoutRedirect()).rejects.toMatchObject({
                errorCode: BrowserAuthErrorCodes.interactionInProgress,
            });
            discovery.resolve();
            await expect(previous).resolves.toBeUndefined();
            expect(popup.location.assign).toHaveBeenCalledTimes(1);
            expect(sessionStorage.getItem(interactionKey)).toBeNull();
        } finally {
            discovery.resolve();
            await previous;
        }
    });

    it.each([
        ["server logout", false, false],
        ["server logout", false, true],
        ["OIDC without an end-session endpoint", true, false],
        ["OIDC without an end-session endpoint", true, true],
    ] as const)(
        "releases only the owned marker before pending navigation after %s (OIDC: %s, replacement before navigation: %s)",
        async (_label, oidc, replaceBeforeNavigation) => {
            const app = await createApp({
                protocolMode: oidc ? ProtocolMode.OIDC : ProtocolMode.AAD,
            });
            const popup = createPopup();
            jest.spyOn(window, "open").mockReturnValue(
                popup as unknown as Window
            );
            if (oidc) {
                jest.spyOn(
                    Authority.prototype,
                    "endSessionEndpoint",
                    "get"
                ).mockImplementation(() => {
                    throw new Error("No end-session endpoint");
                });
            }
            const discoveryStarted = deferred<void>();
            const discovery = deferred<void>();
            jest.spyOn(
                AuthorityFactory,
                "createDiscoveredInstance"
            ).mockImplementationOnce(async (...args) => {
                discoveryStarted.resolve();
                await discovery.promise;
                return new Authority(...args);
            });
            const navigationStarted = deferred<void>();
            const navigation = deferred<boolean>();
            jest.mocked(
                NavigationClient.prototype.navigateInternal
            ).mockImplementation(() => {
                navigationStarted.resolve();
                return navigation.promise;
            });
            const signIn = deferred<AuthenticationResult>();
            jest.spyOn(PopupClient.prototype, "acquireToken").mockReturnValue(
                signIn.promise
            );
            const logout = app.logoutPopup({
                mainWindowRedirectUri: "/home",
                ...(oidc && {
                    account: getTestAuthenticationResult().account,
                    postLogoutRedirectUri: "/signed-out",
                }),
            });
            let replacement: Promise<AuthenticationResult> | undefined;
            try {
                await discoveryStarted.promise;
                expect(sessionStorage.getItem(interactionKey)).not.toBeNull();
                if (replaceBeforeNavigation) {
                    replacement = app.acquireTokenPopup({
                        scopes: ["User.Read"],
                        overrideInteractionInProgress: true,
                    });
                }
                discovery.resolve();
                await navigationStarted.promise;
                expect(sessionStorage.getItem(interactionKey)).toBe(
                    replaceBeforeNavigation
                        ? JSON.stringify({
                              clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                              type: INTERACTION_TYPE.SIGNIN,
                          })
                        : null
                );
                if (!replaceBeforeNavigation) {
                    replacement = app.acquireTokenPopup({
                        scopes: ["User.Read"],
                    });
                }
                navigation.resolve(false);
                await logout;
                expect(sessionStorage.getItem(interactionKey)).toBe(
                    JSON.stringify({
                        clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                        type: INTERACTION_TYPE.SIGNIN,
                    })
                );
            } finally {
                discovery.resolve();
                navigation.resolve(false);
                signIn.resolve(getTestAuthenticationResult());
                await Promise.all([logout, replacement]);
            }
            expect(sessionStorage.getItem(interactionKey)).toBeNull();
        }
    );

    it.each([
        [BrowserAuthErrorCodes.userCancelled, false],
        [BrowserAuthErrorCodes.timedOut, false],
        [BrowserAuthErrorCodes.interactionInProgressCancelled, true],
    ] as const)(
        "preserves best-effort logout except for %s",
        async (errorCode, cancelled) => {
            const app = await createApp();
            const popup = createPopup();
            jest.spyOn(window, "open").mockReturnValue(
                popup as unknown as Window
            );
            jest.spyOn(BrowserUtils, "waitForBridgeResponse").mockRejectedValue(
                createBrowserAuthError(errorCode, "")
            );
            const operation = app.logoutPopup({
                account: getTestAuthenticationResult().account,
                mainWindowRedirectUri: "/home",
            });
            if (cancelled) {
                await expect(operation).rejects.toMatchObject({ errorCode });
                expect(
                    NavigationClient.prototype.navigateInternal
                ).not.toHaveBeenCalled();
                expect(popup.close).toHaveBeenCalledTimes(1);
            } else {
                await expect(operation).resolves.toBeUndefined();
                expect(
                    NavigationClient.prototype.navigateInternal
                ).toHaveBeenCalledTimes(1);
            }
            expect(sessionStorage.getItem(interactionKey)).toBeNull();
        }
    );
});
