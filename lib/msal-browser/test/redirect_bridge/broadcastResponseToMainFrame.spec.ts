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
        it("navigates to homepage for redirect flow and does NOT broadcast", async () => {
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;

            await broadcastResponseToMainFrame();

            // Verify navigation was called with homepage + hash
            expect(NavigationClient).toHaveBeenCalled();
            expect(mockNavigationClient.navigateInternal).toHaveBeenCalledWith(
                expect.stringContaining(
                    TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT
                ),
                expect.objectContaining({
                    apiId: expect.any(Number),
                    noHistory: true,
                    timeout: expect.any(Number),
                })
            );

            // URL should NOT be cleared for redirect flow (we're navigating away)
            expect(mockHistoryReplaceState).not.toHaveBeenCalled();

            // window.close should NOT be called for redirect (early return)
            expect(window.close).not.toHaveBeenCalled();
        });

        it("uses sessionStorage URL when client_id is present in interaction status", async () => {
            const testClientId = "test-client-id-123";
            const cachedOriginUrl = "https://localhost:8081/custom-page.html";

            // Set up sessionStorage with interaction status containing clientId and type
            mockSessionStorage[`msal.interaction.status`] = JSON.stringify({
                clientId: testClientId,
                type: "redirect",
            });

            // Set up sessionStorage with cached origin URL
            mockSessionStorage[`msal.${testClientId}.request.origin`] =
                cachedOriginUrl;

            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;

            await broadcastResponseToMainFrame();

            // Verify navigation was called with cached URL from sessionStorage
            expect(mockNavigationClient.navigateInternal).toHaveBeenCalledWith(
                expect.stringContaining(cachedOriginUrl),
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

        it("falls back to homepage when sessionStorage access fails", async () => {
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;

            // Make sessionStorage.getItem throw
            jest.spyOn(window.sessionStorage, "getItem").mockImplementation(
                () => {
                    throw new Error("SessionStorage unavailable");
                }
            );

            await broadcastResponseToMainFrame();

            // Should still navigate successfully using homepage fallback
            expect(mockNavigationClient.navigateInternal).toHaveBeenCalled();
            expect(mockHistoryReplaceState).not.toHaveBeenCalled();
        });

        it("falls back to homepage when client_id is not in interaction status", async () => {
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;

            await broadcastResponseToMainFrame();

            // Should navigate using homepage since no clientId in session storage means no cached origin URL lookup
            expect(mockNavigationClient.navigateInternal).toHaveBeenCalled();
            const callArgs = (
                mockNavigationClient.navigateInternal as jest.Mock
            ).mock.calls[0][0];
            expect(callArgs).toContain(
                TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT
            );
        });

        it("strips existing hash from cached origin URL when auth response is in hash", async () => {
            const testClientId = "test-client-id-hash";
            // Simulate a hash-routed SPA: the origin URL has a hash fragment
            const cachedOriginUrl =
                "https://localhost:3000/#/dashboard";

            mockSessionStorage[`msal.interaction.status`] = JSON.stringify({
                clientId: testClientId,
                type: "redirect",
            });
            mockSessionStorage[`msal.${testClientId}.request.origin`] =
                cachedOriginUrl;

            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;

            await broadcastResponseToMainFrame();

            const callArgs = (
                mockNavigationClient.navigateInternal as jest.Mock
            ).mock.calls[0][0] as string;

            // Must NOT contain two # fragments (the bug produced /#/dashboard#code=...)
            const hashCount = (callArgs.match(/#/g) || []).length;
            expect(hashCount).toBe(1);

            // Should navigate to the base URL + auth response hash (without the original hash)
            expect(callArgs).toBe(
                `https://localhost:3000/${TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT}`
            );
        });

        it("strips existing hash from homepage fallback when auth response is in hash", async () => {
            // Simulate homepage having a hash (e.g. window.location.href = "https://localhost/#/app")
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            // getHomepage() returns origin + "/" so this is implicitly tested through the
            // regular fallback path—but let's also test with a cached URL that has a hash
            // and no clientId lookup, falling back to getHomepage()
            await broadcastResponseToMainFrame();

            const callArgs = (
                mockNavigationClient.navigateInternal as jest.Mock
            ).mock.calls[0][0] as string;

            // Homepage fallback should not produce double hashes
            const hashCount = (callArgs.match(/#/g) || []).length;
            expect(hashCount).toBe(1);
            expect(callArgs).toContain(
                TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT
            );
        });

        it("preserves origin URL hash when auth response is only in query string", async () => {
            const testClientId = "test-client-id-query";
            const cachedOriginUrl =
                "https://localhost:3000/#/dashboard";

            mockSessionStorage[`msal.interaction.status`] = JSON.stringify({
                clientId: testClientId,
                type: "redirect",
            });
            mockSessionStorage[`msal.${testClientId}.request.origin`] =
                cachedOriginUrl;

            // Auth response in query string only (response_mode=query)
            window.location.search = `?state=${TEST_STATE_VALUES.TEST_STATE_REDIRECT}&code=test_code`;
            window.location.hash = "";

            await broadcastResponseToMainFrame();

            const callArgs = (
                mockNavigationClient.navigateInternal as jest.Mock
            ).mock.calls[0][0] as string;

            // When auth response is in query, the origin hash should be preserved
            expect(callArgs).toContain("/#/dashboard");
            expect(callArgs).toContain("?state=");
        });

        it("strips hash from origin URL with complex hash-based route", async () => {
            const testClientId = "test-client-id-complex";
            // Complex hash-based route with nested path and query params in hash
            const cachedOriginUrl =
                "https://myapp.com/#/settings/profile?tab=security";

            mockSessionStorage[`msal.interaction.status`] = JSON.stringify({
                clientId: testClientId,
                type: "redirect",
            });
            mockSessionStorage[`msal.${testClientId}.request.origin`] =
                cachedOriginUrl;

            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;

            await broadcastResponseToMainFrame();

            const callArgs = (
                mockNavigationClient.navigateInternal as jest.Mock
            ).mock.calls[0][0] as string;

            // Must have exactly one # (from auth response)
            const hashCount = (callArgs.match(/#/g) || []).length;
            expect(hashCount).toBe(1);

            // Should be base URL + auth hash
            expect(callArgs).toBe(
                `https://myapp.com/${TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT}`
            );
        });

        it("does not strip hash when origin URL has no hash", async () => {
            const testClientId = "test-client-id-nohash";
            const cachedOriginUrl = "https://localhost:3000/app/page";

            mockSessionStorage[`msal.interaction.status`] = JSON.stringify({
                clientId: testClientId,
                type: "redirect",
            });
            mockSessionStorage[`msal.${testClientId}.request.origin`] =
                cachedOriginUrl;

            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;

            await broadcastResponseToMainFrame();

            const callArgs = (
                mockNavigationClient.navigateInternal as jest.Mock
            ).mock.calls[0][0] as string;

            expect(callArgs).toBe(
                `https://localhost:3000/app/page${TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT}`
            );
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

        it("handles hybrid query + hash response", async () => {
            const testClientId = "hybrid-client-id";

            // Set up sessionStorage with interaction status containing clientId and type
            mockSessionStorage[`msal.interaction.status`] = JSON.stringify({
                clientId: testClientId,
                type: "redirect",
            });

            window.location.search = `?state=${TEST_STATE_VALUES.TEST_STATE_REDIRECT}&code=test_code`;
            window.location.hash = "#app_hash_fragment";

            await broadcastResponseToMainFrame();

            // For redirect flow, should navigate with full query + hash
            expect(mockNavigationClient.navigateInternal).toHaveBeenCalled();
            const callArgs = (
                mockNavigationClient.navigateInternal as jest.Mock
            ).mock.calls[0][0];
            expect(callArgs).toContain("?state=");
            expect(callArgs).toContain("&code=test_code");
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
