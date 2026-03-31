/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { broadcastResponseToMainFrame } from "../../src/redirect_bridge/index.js";
import { NavigationClient } from "../../src/navigation/NavigationClient.js";
import { parseAuthResponseFromUrl } from "../../src/utils/BrowserUtils.js";
import {
    TEST_HASHES,
    TEST_STATE_VALUES,
    RANDOM_TEST_GUID,
} from "../utils/StringConstants.js";
import { TemporaryCacheKeys } from "../../src/utils/BrowserConstants.js";

jest.mock("../../src/navigation/NavigationClient.js");

describe("broadcastResponseToMainFrame", () => {
    let mockNavigationClient: jest.Mocked<NavigationClient>;
    let mockSessionStorage: { [key: string]: string };
    let originalLocation: Location;
    let mockHistoryReplaceState: jest.Mock;

    beforeAll(() => {
        // Save original location
        originalLocation = window.location;
    });

    beforeEach(() => {
        // Mock window.location with a fresh object for each test
        delete (window as any).location;
        (window as any).location = {
            ...originalLocation,
            hash: "",
            search: "",
        };

        // Mock history.replaceState
        mockHistoryReplaceState = jest.fn();
        window.history.replaceState = mockHistoryReplaceState;

        // Mock window.close
        window.close = jest.fn();

        // Mock NavigationClient
        mockNavigationClient = {
            navigateInternal: jest.fn().mockResolvedValue(undefined),
        } as any;
        (NavigationClient as unknown as jest.Mock).mockImplementation(
            () => mockNavigationClient
        );

        // Mock sessionStorage
        mockSessionStorage = {};
        Object.defineProperty(window, "sessionStorage", {
            value: {
                getItem: jest.fn(
                    (key: string) => mockSessionStorage[key] || null
                ),
                setItem: jest.fn((key: string, value: string) => {
                    mockSessionStorage[key] = value;
                }),
                removeItem: jest.fn((key: string) => {
                    delete mockSessionStorage[key];
                }),
                clear: jest.fn(() => {
                    mockSessionStorage = {};
                }),
            },
            writable: true,
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
        mockSessionStorage = {};
    });

    afterAll(() => {
        // Restore original location
        (window as any).location = originalLocation;
    });

    describe("Error cases", () => {
        it("throws error when no hash or query string is present", async () => {
            window.location.hash = "";

            await expect(broadcastResponseToMainFrame()).rejects.toThrow(
                "empty_response: See https://aka.ms/msal.js.errors#empty_response for details"
            );
        });

        it("throws error when state parameter is missing from hash", async () => {
            window.location.hash = "#code=testCode&client_info=testClientInfo";

            await expect(broadcastResponseToMainFrame()).rejects.toThrow(
                "empty_response: See https://aka.ms/msal.js.errors#empty_response for details"
            );

            expect(mockHistoryReplaceState).toHaveBeenCalled();
        });

        it("throws error when state is missing 'id' attribute", async () => {
            const invalidState = btoa(
                JSON.stringify({ meta: { interactionType: "popup" } })
            );
            window.location.hash = `#code=testCode&state=${invalidState}`;

            await expect(broadcastResponseToMainFrame()).rejects.toThrow(
                "unable_to_parse_state: See https://aka.ms/msal.js.errors#unable_to_parse_state for details"
            );

            expect(mockHistoryReplaceState).toHaveBeenCalled();
        });

        it("throws error when state is missing 'meta' attribute", async () => {
            const invalidState = btoa(JSON.stringify({ id: RANDOM_TEST_GUID }));
            window.location.hash = `#code=testCode&state=${invalidState}`;

            await expect(broadcastResponseToMainFrame()).rejects.toThrow(
                "unable_to_parse_state: See https://aka.ms/msal.js.errors#unable_to_parse_state for details"
            );

            expect(mockHistoryReplaceState).toHaveBeenCalled();
        });
    });

    describe("Success cases - Popup/Silent flow", () => {
        it("broadcasts response for popup flow from hash", async () => {
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_POPUP;

            await broadcastResponseToMainFrame();

            // Verify hash was cleared (indicates broadcast path was taken)
            expect(mockHistoryReplaceState).toHaveBeenCalled();

            // Verify window.close was called
            expect(window.close).toHaveBeenCalled();

            // Verify navigation was NOT called for popup
            expect(
                mockNavigationClient.navigateInternal
            ).not.toHaveBeenCalled();
        });

        it("broadcasts response for silent flow from hash", async () => {
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_SILENT;

            await broadcastResponseToMainFrame();

            // Verify hash was cleared (indicates broadcast path was taken)
            expect(mockHistoryReplaceState).toHaveBeenCalled();

            // Verify window.close was called
            expect(window.close).toHaveBeenCalled();

            // Verify navigation was NOT called for silent
            expect(
                mockNavigationClient.navigateInternal
            ).not.toHaveBeenCalled();
        });

        it("handles error responses in hash", async () => {
            // Create error hash with POPUP state (not redirect) so it broadcasts
            const errorHashWithPopupState = `#error=error_code&error_description=msal+error+description&state=${TEST_STATE_VALUES.TEST_STATE_POPUP}`;
            window.location.hash = errorHashWithPopupState;

            await broadcastResponseToMainFrame();

            // Should still broadcast the error response (verify via hash clearing)
            expect(mockHistoryReplaceState).toHaveBeenCalled();

            // Verify window.close was called
            expect(window.close).toHaveBeenCalled();

            // Verify navigation was NOT called
            expect(
                mockNavigationClient.navigateInternal
            ).not.toHaveBeenCalled();
        });
    });

    describe("Success cases - Redirect flow", () => {
        it("navigates to homepage without auth params when no interaction status is set", async () => {
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;

            await broadcastResponseToMainFrame();

            // With no clientId, navigates to homepage; handleRedirectPromise will return null
            expect(NavigationClient).toHaveBeenCalled();
            expect(mockNavigationClient.navigateInternal).toHaveBeenCalled();
            const navigatedUrl = (
                mockNavigationClient.navigateInternal as jest.Mock
            ).mock.calls[0][0];
            expect(navigatedUrl).not.toContain("code=");

            // URL should NOT be cleared for redirect flow (we're navigating away)
            expect(mockHistoryReplaceState).not.toHaveBeenCalled();

            // window.close should NOT be called for redirect (early return)
            expect(window.close).not.toHaveBeenCalled();
        });

        it("caches payload in sessionStorage and navigates to origin URL when client_id is present", async () => {
            const testClientId = "test-client-id-123";
            const cachedOriginUrl = "https://localhost:8081/custom-page.html";

            // Set up sessionStorage with interaction status containing clientId and type
            mockSessionStorage[`msal.interaction.status`] = JSON.stringify({
                clientId: testClientId,
                type: "signin",
            });

            // Set up sessionStorage with cached origin URL
            mockSessionStorage[`msal.${testClientId}.request.origin`] =
                cachedOriginUrl;

            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;

            await broadcastResponseToMainFrame();

            // Verify payload was cached in sessionStorage under URL_HASH key
            expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
                `msal.${testClientId}.${TemporaryCacheKeys.URL_HASH}`,
                expect.stringContaining("code=thisIsATestCode")
            );

            // Verify navigation was called with the origin URL (not modified with auth hash)
            expect(mockNavigationClient.navigateInternal).toHaveBeenCalledWith(
                cachedOriginUrl,
                expect.any(Object)
            );
        });

        it("navigates to hash-routed origin URL without appending auth response", async () => {
            const testClientId = "test-client-id-456";
            const hashRoutedOriginUrl = "https://localhost:8081/#/dashboard";

            mockSessionStorage[`msal.interaction.status`] = JSON.stringify({
                clientId: testClientId,
                type: "signin",
            });
            mockSessionStorage[`msal.${testClientId}.request.origin`] =
                hashRoutedOriginUrl;

            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;

            await broadcastResponseToMainFrame();

            // Verify payload was cached
            expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
                `msal.${testClientId}.${TemporaryCacheKeys.URL_HASH}`,
                expect.stringContaining("code=thisIsATestCode")
            );

            // Verify navigation goes to the hash-routed URL directly (no double-hash)
            expect(mockNavigationClient.navigateInternal).toHaveBeenCalledWith(
                hashRoutedOriginUrl,
                expect.any(Object)
            );
        });

        it("strips bare trailing '?' from origin URL before navigating", async () => {
            const testClientId = "test-client-bare-query";
            const originUrlWithBareQuery = "https://localhost:8081/?";

            mockSessionStorage[`msal.interaction.status`] = JSON.stringify({
                clientId: testClientId,
                type: "signin",
            });
            mockSessionStorage[`msal.${testClientId}.request.origin`] =
                originUrlWithBareQuery;

            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;

            await broadcastResponseToMainFrame();

            // Verify navigation strips the bare "?" to match canonical URL form
            expect(mockNavigationClient.navigateInternal).toHaveBeenCalledWith(
                "https://localhost:8081/",
                expect.any(Object)
            );
        });

        it("preserves non-empty query string in origin URL when navigating", async () => {
            const testClientId = "test-client-query";
            const originUrlWithQuery = "https://localhost:8081/?test=value";

            mockSessionStorage[`msal.interaction.status`] = JSON.stringify({
                clientId: testClientId,
                type: "signin",
            });
            mockSessionStorage[`msal.${testClientId}.request.origin`] =
                originUrlWithQuery;

            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;

            await broadcastResponseToMainFrame();

            // Verify non-empty query string is preserved
            expect(mockNavigationClient.navigateInternal).toHaveBeenCalledWith(
                originUrlWithQuery,
                expect.any(Object)
            );
        });

        it("uses custom NavigationClient when provided", async () => {
            const customNavClient = {
                navigateInternal: jest.fn().mockResolvedValue(undefined),
            } as any;

            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;

            await broadcastResponseToMainFrame(customNavClient);

            // Verify custom navigation client was used, not the default
            expect(customNavClient.navigateInternal).toHaveBeenCalled();
            expect(
                mockNavigationClient.navigateInternal
            ).not.toHaveBeenCalled();
        });

        it("navigates to homepage when sessionStorage.getItem fails", async () => {
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;

            // Make sessionStorage.getItem throw
            jest.spyOn(window.sessionStorage, "getItem").mockImplementation(
                () => {
                    throw new Error("SessionStorage unavailable");
                }
            );

            await broadcastResponseToMainFrame();

            // Should navigate to homepage without auth params
            expect(mockNavigationClient.navigateInternal).toHaveBeenCalled();
            const navigatedUrl = (
                mockNavigationClient.navigateInternal as jest.Mock
            ).mock.calls[0][0];
            expect(navigatedUrl).not.toContain("code=");
        });

        it("navigates to origin URL when sessionStorage.setItem fails", async () => {
            const testClientId = "setitem-fail-client";
            const cachedOriginUrl = "https://localhost:8081/app";

            mockSessionStorage[`msal.interaction.status`] = JSON.stringify({
                clientId: testClientId,
                type: "signin",
            });
            mockSessionStorage[`msal.${testClientId}.request.origin`] =
                cachedOriginUrl;

            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;

            // Make sessionStorage.setItem throw
            (window.sessionStorage.setItem as jest.Mock).mockImplementation(
                () => {
                    throw new Error("QuotaExceeded");
                }
            );

            await broadcastResponseToMainFrame();

            // Should navigate to origin URL without auth params
            expect(mockNavigationClient.navigateInternal).toHaveBeenCalled();
            const navigatedUrl = (
                mockNavigationClient.navigateInternal as jest.Mock
            ).mock.calls[0][0];
            expect(navigatedUrl).toBe(cachedOriginUrl);
            expect(navigatedUrl).not.toContain("code=");
        });

        it("does not cache URL_HASH when client_id is not available", async () => {
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;

            await broadcastResponseToMainFrame();

            // Should navigate without auth params
            expect(mockNavigationClient.navigateInternal).toHaveBeenCalled();
            const navigatedUrl = (
                mockNavigationClient.navigateInternal as jest.Mock
            ).mock.calls[0][0];
            expect(navigatedUrl).not.toContain("code=");

            // sessionStorage.setItem should not be called with a urlHash key
            const setItemCalls = (window.sessionStorage.setItem as jest.Mock)
                .mock.calls;
            const urlHashCalls = setItemCalls.filter(([key]: [string]) =>
                key.includes(`${TemporaryCacheKeys.URL_HASH}`)
            );
            expect(urlHashCalls).toHaveLength(0);
        });
    });

    describe("Success cases - Signout redirect flow", () => {
        it("uses ApiId.logout when interaction type is signout", async () => {
            const testClientId = "test-client-signout";
            const cachedOriginUrl = "https://localhost:8081/signed-out";

            mockSessionStorage["msal.interaction.status"] = JSON.stringify({
                clientId: testClientId,
                type: "signout",
            });
            mockSessionStorage[`msal.${testClientId}.request.origin`] =
                cachedOriginUrl;

            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;

            await broadcastResponseToMainFrame();

            // Should navigate with ApiId.logout (961) for signout flow
            expect(mockNavigationClient.navigateInternal).toHaveBeenCalledWith(
                cachedOriginUrl,
                expect.objectContaining({
                    apiId: 961, // ApiId.logout
                    noHistory: true,
                })
            );
        });

        it("uses ApiId.handleRedirectPromise when interaction type is signin", async () => {
            const testClientId = "test-client-signin";
            const cachedOriginUrl = "https://localhost:8081/home";

            mockSessionStorage["msal.interaction.status"] = JSON.stringify({
                clientId: testClientId,
                type: "signin",
            });
            mockSessionStorage[`msal.${testClientId}.request.origin`] =
                cachedOriginUrl;

            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;

            await broadcastResponseToMainFrame();

            // Should navigate with ApiId.handleRedirectPromise (865) for signin flow
            expect(mockNavigationClient.navigateInternal).toHaveBeenCalledWith(
                cachedOriginUrl,
                expect.objectContaining({
                    apiId: 865, // ApiId.handleRedirectPromise
                    noHistory: true,
                })
            );
        });

        it("broadcasts and closes popup window for signout popup flow", async () => {
            mockSessionStorage["msal.interaction.status"] = JSON.stringify({
                clientId: "test-client",
                type: "signout",
            });

            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_POPUP;

            await broadcastResponseToMainFrame();

            // Popup signout should broadcast + close, same as popup signin
            expect(mockHistoryReplaceState).toHaveBeenCalled();
            expect(window.close).toHaveBeenCalled();
            expect(
                mockNavigationClient.navigateInternal
            ).not.toHaveBeenCalled();
        });
    });

    describe("Hybrid response format (query + hash)", () => {
        it("handles query string only response", async () => {
            window.location.search = `?state=${TEST_STATE_VALUES.TEST_STATE_POPUP}&code=test_code`;
            window.location.hash = "";

            await broadcastResponseToMainFrame();

            expect(mockHistoryReplaceState).toHaveBeenCalled();
            expect(window.close).toHaveBeenCalled();
        });

        it("caches query-string auth response when hash contains non-auth fragment (redirect flow)", async () => {
            const testClientId = "hybrid-client-id";

            // Set up sessionStorage with interaction status containing clientId and type
            mockSessionStorage[`msal.interaction.status`] = JSON.stringify({
                clientId: testClientId,
                type: "signin",
            });

            window.location.search = `?state=${TEST_STATE_VALUES.TEST_STATE_REDIRECT}&code=test_code`;
            window.location.hash = "#app_hash_fragment";

            await broadcastResponseToMainFrame();

            // For redirect flow, payload should be cached in sessionStorage
            expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
                `msal.${testClientId}.${TemporaryCacheKeys.URL_HASH}`,
                expect.stringContaining("code=test_code")
            );

            // Navigation URL should not contain the auth response
            expect(mockNavigationClient.navigateInternal).toHaveBeenCalled();
            const navigatedUrl = (
                mockNavigationClient.navigateInternal as jest.Mock
            ).mock.calls[0][0];
            expect(navigatedUrl).not.toContain("code=test_code");
        });

        it("strips leading ? from query string", async () => {
            window.location.search = `?state=${TEST_STATE_VALUES.TEST_STATE_POPUP}&code=test_code`;
            window.location.hash = "";

            await broadcastResponseToMainFrame();

            // Should successfully parse state (indicates ? was stripped)
            expect(mockHistoryReplaceState).toHaveBeenCalled();
        });

        it("strips leading # from hash", async () => {
            window.location.hash = `#state=${TEST_STATE_VALUES.TEST_STATE_POPUP}&code=test_code`;

            await broadcastResponseToMainFrame();

            // Should successfully parse state (indicates # was stripped)
            expect(mockHistoryReplaceState).toHaveBeenCalled();
        });

        it("handles query string without leading ?", async () => {
            window.location.search = `state=${TEST_STATE_VALUES.TEST_STATE_POPUP}&code=test_code`;
            window.location.hash = "";

            await broadcastResponseToMainFrame();

            // Should still work even without leading ?
            expect(mockHistoryReplaceState).toHaveBeenCalled();
        });

        it("handles hash without leading #", async () => {
            window.location.hash = `state=${TEST_STATE_VALUES.TEST_STATE_POPUP}&code=test_code`;

            await broadcastResponseToMainFrame();

            // Should still work even without leading #
            expect(mockHistoryReplaceState).toHaveBeenCalled();
        });

        it("throws when both query and hash are empty", async () => {
            window.location.search = "";
            window.location.hash = "";

            await expect(broadcastResponseToMainFrame()).rejects.toThrow(
                "empty_response: See https://aka.ms/msal.js.errors#empty_response for details"
            );
        });

        it("preserves hash fragment when auth response is in query string (popup/silent flow)", async () => {
            // Scenario: redirectUri is https://contoso.com/redirect#myReplyUrl
            // Auth response comes in query string, hash should be preserved
            window.location.search = `?state=${TEST_STATE_VALUES.TEST_STATE_POPUP}&code=test_code`;
            window.location.hash = "#myReplyUrl";

            await broadcastResponseToMainFrame();

            // Should clear query string but preserve hash
            expect(mockHistoryReplaceState).toHaveBeenCalledWith(
                null,
                "",
                expect.stringContaining("#myReplyUrl")
            );
            expect(mockHistoryReplaceState).toHaveBeenCalledWith(
                null,
                "",
                expect.not.stringContaining("?state=")
            );
        });

        it("preserves query string when auth response is in hash (popup/silent flow)", async () => {
            // Scenario: redirectUri has query params, auth response in hash
            window.location.search = "?app_param=value";
            window.location.hash = `#state=${TEST_STATE_VALUES.TEST_STATE_POPUP}&code=test_code`;

            await broadcastResponseToMainFrame();

            // Should clear hash but preserve query string
            expect(mockHistoryReplaceState).toHaveBeenCalledWith(
                null,
                "",
                expect.stringContaining("?app_param=value")
            );
            expect(mockHistoryReplaceState).toHaveBeenCalledWith(
                null,
                "",
                expect.not.stringContaining("#state=")
            );
        });

        it("throws when query and hash contain only delimiters", async () => {
            window.location.search = "?";
            window.location.hash = "#";

            await expect(broadcastResponseToMainFrame()).rejects.toThrow(
                "empty_response: See https://aka.ms/msal.js.errors#empty_response for details"
            );
        });
    });

    describe("Edge cases", () => {
        it("handles hash with only # character", async () => {
            window.location.hash = "#";

            await expect(broadcastResponseToMainFrame()).rejects.toThrow(
                "empty_response: See https://aka.ms/msal.js.errors#empty_response for details"
            );
        });

        it("does not throw when window.close() fails for popup/silent flows", async () => {
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_POPUP;

            // Mock window.close to throw an error
            window.close = jest.fn(() => {
                throw new Error("Cannot close window");
            });

            // Should not throw despite window.close failing
            await expect(
                broadcastResponseToMainFrame()
            ).resolves.toBeUndefined();

            // Verify clearHash was still called (indicates broadcast completed)
            expect(mockHistoryReplaceState).toHaveBeenCalled();
        });
    });

    describe("URL clearing", () => {
        it("clears hash before throwing error when state is missing", async () => {
            window.location.hash = "#code=testCode";

            await expect(broadcastResponseToMainFrame()).rejects.toThrow();

            expect(mockHistoryReplaceState).toHaveBeenCalled();
        });

        it("clears hash before throwing error when state attributes are missing", async () => {
            const invalidState = btoa(JSON.stringify({ id: RANDOM_TEST_GUID }));
            window.location.hash = `#code=testCode&state=${invalidState}`;

            await expect(broadcastResponseToMainFrame()).rejects.toThrow();

            expect(mockHistoryReplaceState).toHaveBeenCalled();
        });

        it("clears hash after successful broadcast", async () => {
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_POPUP;

            await broadcastResponseToMainFrame();

            expect(mockHistoryReplaceState).toHaveBeenCalled();
        });
    });
});

describe("parseAuthResponseFromUrl", () => {
    let originalLocation: Location;

    beforeAll(() => {
        originalLocation = window.location;
    });

    beforeEach(() => {
        // Mock window.location with a fresh object for each test
        delete (window as any).location;
        (window as any).location = {
            ...originalLocation,
            hash: "",
            search: "",
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    afterAll(() => {
        (window as any).location = originalLocation;
    });

    it("parses auth response from hash only", () => {
        window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_POPUP;

        const result = parseAuthResponseFromUrl();

        expect(result.urlHash).toBe(TEST_HASHES.TEST_SUCCESS_CODE_HASH_POPUP);
        expect(result.urlQuery).toBe("");
        expect(result.payload).toContain("state=");
        expect(result.params.get("state")).toBeTruthy();
        expect(result.libraryState.id).toBeTruthy();
        expect(result.libraryState.meta).toBeTruthy();
    });

    it("parses auth response from query string only", () => {
        window.location.search = `?state=${TEST_STATE_VALUES.TEST_STATE_POPUP}&code=test_code`;
        window.location.hash = "";

        const result = parseAuthResponseFromUrl();

        expect(result.urlQuery).toContain("?state=");
        expect(result.urlHash).toBe("");
        expect(result.payload).toContain("state=");
        expect(result.params.get("state")).toBe(
            TEST_STATE_VALUES.TEST_STATE_POPUP
        );
        expect(result.libraryState.meta["interactionType"]).toBe("popup");
    });

    it("parses hybrid response (query + hash)", () => {
        window.location.search = `?state=${TEST_STATE_VALUES.TEST_STATE_REDIRECT}&code=test_code`;
        window.location.hash = "#app_fragment";

        const result = parseAuthResponseFromUrl();

        expect(result.urlQuery).toContain("?state=");
        expect(result.urlHash).toBe("#app_fragment");
        expect(result.payload).toContain("state=");
        expect(result.payload).toContain("code=test_code");
        // Hash fragment without state should NOT be in payload
        expect(result.payload).not.toContain("app_fragment");
        expect(result.hasResponseInQuery).toBe(true);
        expect(result.hasResponseInHash).toBe(false);
        expect(result.libraryState.meta["interactionType"]).toBe("redirect");
    });

    it("strips leading ? from query string", () => {
        window.location.search = `?state=${TEST_STATE_VALUES.TEST_STATE_POPUP}&code=test_code`;

        const result = parseAuthResponseFromUrl();

        // Payload should not have leading ?
        expect(result.payload.charAt(0)).not.toBe("?");
        expect(result.payload).toContain("state=");
    });

    it("strips leading # from hash", () => {
        window.location.hash = `#state=${TEST_STATE_VALUES.TEST_STATE_POPUP}&code=test_code`;

        const result = parseAuthResponseFromUrl();

        // Payload should not have leading # (when hash is the only content)
        expect(result.payload).toContain("state=");
        expect(result.params.get("state")).toBe(
            TEST_STATE_VALUES.TEST_STATE_POPUP
        );
    });

    it("handles query without leading ?", () => {
        window.location.search = `state=${TEST_STATE_VALUES.TEST_STATE_POPUP}&code=test_code`;

        const result = parseAuthResponseFromUrl();

        expect(result.payload).toContain("state=");
        expect(result.params.get("state")).toBe(
            TEST_STATE_VALUES.TEST_STATE_POPUP
        );
    });

    it("handles hash without leading #", () => {
        window.location.hash = `state=${TEST_STATE_VALUES.TEST_STATE_POPUP}&code=test_code`;

        const result = parseAuthResponseFromUrl();

        expect(result.payload).toContain("state=");
        expect(result.params.get("state")).toBe(
            TEST_STATE_VALUES.TEST_STATE_POPUP
        );
    });

    it("throws when both query and hash are empty", () => {
        window.location.search = "";
        window.location.hash = "";

        expect(() => parseAuthResponseFromUrl()).toThrow(
            "empty_response: See https://aka.ms/msal.js.errors#empty_response for details"
        );
    });

    it("throws when state parameter is missing", () => {
        window.location.hash = "#code=testCode&client_info=testClientInfo";

        expect(() => parseAuthResponseFromUrl()).toThrow(
            "empty_response: See https://aka.ms/msal.js.errors#empty_response for details"
        );
    });

    it("throws when state is missing id attribute", () => {
        const invalidState = btoa(
            JSON.stringify({ meta: { interactionType: "popup" } })
        );
        window.location.hash = `#code=testCode&state=${invalidState}`;

        expect(() => parseAuthResponseFromUrl()).toThrow(
            "unable_to_parse_state: See https://aka.ms/msal.js.errors#unable_to_parse_state for details"
        );
    });

    it("throws when state is missing meta attribute", () => {
        const invalidState = btoa(JSON.stringify({ id: RANDOM_TEST_GUID }));
        window.location.hash = `#code=testCode&state=${invalidState}`;

        expect(() => parseAuthResponseFromUrl()).toThrow(
            "unable_to_parse_state: See https://aka.ms/msal.js.errors#unable_to_parse_state for details"
        );
    });
});
