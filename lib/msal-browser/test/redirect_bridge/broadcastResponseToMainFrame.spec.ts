/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { broadcastResponseToMainFrame } from "../../src/redirect_bridge/index.js";
import { NavigationClient } from "../../src/navigation/NavigationClient.js";
import {
    clearHash,
    parseAuthResponseFromUrl,
} from "../../src/utils/BrowserUtils.js";
import {
    TEST_HASHES,
    TEST_STATE_VALUES,
    RANDOM_TEST_GUID,
} from "../utils/StringConstants.js";

jest.mock("../../src/utils/BrowserUtils.js", () => ({
    ...jest.requireActual("../../src/utils/BrowserUtils.js"),
    clearHash: jest.fn(),
}));
jest.mock("../../src/navigation/NavigationClient.js");

describe("broadcastResponseToMainFrame", () => {
    let mockNavigationClient: jest.Mocked<NavigationClient>;
    let mockSessionStorage: { [key: string]: string };
    let originalLocation: Location;

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

        // Mock window.close
        window.close = jest.fn();

        // Mock NavigationClient
        mockNavigationClient = {
            navigateInternal: jest.fn().mockResolvedValue(undefined),
        } as any;
        (NavigationClient as unknown as jest.Mock).mockImplementation(
            () => mockNavigationClient
        );

        // Mock clearHash
        (clearHash as jest.Mock).mockImplementation(() => {});

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
                "No auth payload found on URL (hash or query)"
            );
        });

        it("throws error when state parameter is missing from hash", async () => {
            window.location.hash = "#code=testCode&client_info=testClientInfo";

            await expect(broadcastResponseToMainFrame()).rejects.toThrow(
                "Missing state on redirect URL"
            );

            expect(clearHash).toHaveBeenCalledWith(window);
        });

        it("throws error when state is missing 'id' attribute", async () => {
            const invalidState = btoa(
                JSON.stringify({ meta: { interactionType: "popup" } })
            );
            window.location.hash = `#code=testCode&state=${invalidState}`;

            await expect(broadcastResponseToMainFrame()).rejects.toThrow(
                "Missing state 'id' and/or 'meta' attributes"
            );

            expect(clearHash).toHaveBeenCalledWith(window);
        });

        it("throws error when state is missing 'meta' attribute", async () => {
            const invalidState = btoa(JSON.stringify({ id: RANDOM_TEST_GUID }));
            window.location.hash = `#code=testCode&state=${invalidState}`;

            await expect(broadcastResponseToMainFrame()).rejects.toThrow(
                "Missing state 'id' and/or 'meta' attributes"
            );

            expect(clearHash).toHaveBeenCalledWith(window);
        });
    });

    describe("Success cases - Popup/Silent flow", () => {
        it("broadcasts response for popup flow from hash", async () => {
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_POPUP;

            await broadcastResponseToMainFrame();

            // Verify hash was cleared (indicates broadcast path was taken)
            expect(clearHash).toHaveBeenCalledWith(window);

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
            expect(clearHash).toHaveBeenCalledWith(window);

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
            expect(clearHash).toHaveBeenCalledWith(window);

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

            // Hash should NOT be cleared for redirect (early return before clearHash)
            expect(clearHash).not.toHaveBeenCalled();

            // window.close should NOT be called for redirect (early return)
            expect(window.close).not.toHaveBeenCalled();
        });

        it("uses sessionStorage URL when client_id is present", async () => {
            const testClientId = "test-client-id-123";
            const cachedOriginUrl = "https://localhost:8081/custom-page.html";

            // Set up sessionStorage with cached origin URL
            mockSessionStorage[`msal.${testClientId}.request.origin`] =
                cachedOriginUrl;

            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;

            // Mock URLSearchParams to return our test client_id
            const originalURLSearchParams = global.URLSearchParams;
            global.URLSearchParams = jest.fn().mockImplementation((query) => {
                const params = new originalURLSearchParams(query);
                params.get = jest.fn((key) => {
                    if (key === "client_id") return testClientId;
                    return new originalURLSearchParams(query).get(key);
                });
                return params;
            }) as any;

            await broadcastResponseToMainFrame();

            // Verify navigation was called with cached URL from sessionStorage
            expect(mockNavigationClient.navigateInternal).toHaveBeenCalledWith(
                expect.stringContaining(cachedOriginUrl),
                expect.any(Object)
            );

            global.URLSearchParams = originalURLSearchParams;
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
            expect(clearHash).not.toHaveBeenCalled();
        });

        it("falls back to homepage when client_id is not in URL", async () => {
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;

            await broadcastResponseToMainFrame();

            // Should navigate using homepage since no client_id means no sessionStorage lookup
            expect(mockNavigationClient.navigateInternal).toHaveBeenCalled();
            const callArgs = (
                mockNavigationClient.navigateInternal as jest.Mock
            ).mock.calls[0][0];
            expect(callArgs).toContain(
                TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT
            );
        });
    });

    describe("Hybrid response format (query + hash)", () => {
        it("handles query string only response", async () => {
            window.location.search = `?state=${TEST_STATE_VALUES.TEST_STATE_POPUP}&code=test_code`;
            window.location.hash = "";

            await broadcastResponseToMainFrame();

            expect(clearHash).toHaveBeenCalled();
            expect(window.close).toHaveBeenCalled();
        });

        it("handles hybrid query + hash response", async () => {
            const testClientId = "hybrid-client-id";
            window.location.search = `?state=${TEST_STATE_VALUES.TEST_STATE_REDIRECT}&code=test_code&client_id=${testClientId}`;
            window.location.hash = "#app_hash_fragment";

            await broadcastResponseToMainFrame();

            // For redirect flow, should navigate with full query + hash
            expect(mockNavigationClient.navigateInternal).toHaveBeenCalled();
            const callArgs = (
                mockNavigationClient.navigateInternal as jest.Mock
            ).mock.calls[0][0];
            expect(callArgs).toContain("?state=");
            expect(callArgs).toContain("#app_hash_fragment");
        });

        it("strips leading ? from query string", async () => {
            window.location.search = `?state=${TEST_STATE_VALUES.TEST_STATE_POPUP}&code=test_code`;
            window.location.hash = "";

            await broadcastResponseToMainFrame();

            // Should successfully parse state (indicates ? was stripped)
            expect(clearHash).toHaveBeenCalled();
        });

        it("strips leading # from hash", async () => {
            window.location.hash = `#state=${TEST_STATE_VALUES.TEST_STATE_POPUP}&code=test_code`;

            await broadcastResponseToMainFrame();

            // Should successfully parse state (indicates # was stripped)
            expect(clearHash).toHaveBeenCalled();
        });

        it("handles query string without leading ?", async () => {
            window.location.search = `state=${TEST_STATE_VALUES.TEST_STATE_POPUP}&code=test_code`;
            window.location.hash = "";

            await broadcastResponseToMainFrame();

            // Should still work even without leading ?
            expect(clearHash).toHaveBeenCalled();
        });

        it("handles hash without leading #", async () => {
            window.location.hash = `state=${TEST_STATE_VALUES.TEST_STATE_POPUP}&code=test_code`;

            await broadcastResponseToMainFrame();

            // Should still work even without leading #
            expect(clearHash).toHaveBeenCalled();
        });

        it("throws when both query and hash are empty", async () => {
            window.location.search = "";
            window.location.hash = "";

            await expect(broadcastResponseToMainFrame()).rejects.toThrow(
                "No auth payload found on URL (hash or query)"
            );
        });

        it("throws when query and hash contain only delimiters", async () => {
            window.location.search = "?";
            window.location.hash = "#";

            await expect(broadcastResponseToMainFrame()).rejects.toThrow(
                "No auth payload found on URL (hash or query)"
            );
        });
    });

    describe("Edge cases", () => {
        it("handles hash with only # character", async () => {
            window.location.hash = "#";

            await expect(broadcastResponseToMainFrame()).rejects.toThrow(
                "No auth payload found on URL (hash or query)"
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
            expect(clearHash).toHaveBeenCalledWith(window);
        });
    });

    describe("Hash clearing", () => {
        it("clears hash before throwing error when state is missing", async () => {
            window.location.hash = "#code=testCode";

            await expect(broadcastResponseToMainFrame()).rejects.toThrow();

            expect(clearHash).toHaveBeenCalledWith(window);
        });

        it("clears hash before throwing error when state attributes are missing", async () => {
            const invalidState = btoa(JSON.stringify({ id: RANDOM_TEST_GUID }));
            window.location.hash = `#code=testCode&state=${invalidState}`;

            await expect(broadcastResponseToMainFrame()).rejects.toThrow();

            expect(clearHash).toHaveBeenCalledWith(window);
        });

        it("clears hash after successful broadcast", async () => {
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_POPUP;

            await broadcastResponseToMainFrame();

            expect(clearHash).toHaveBeenCalledWith(window);
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

        // Mock clearHash
        (clearHash as jest.Mock).mockImplementation(() => {});
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
        expect(result.payload).toContain("app_fragment");
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
            "No auth payload found on URL (hash or query)"
        );
    });

    it("throws when state parameter is missing", () => {
        window.location.hash = "#code=testCode&client_info=testClientInfo";

        expect(() => parseAuthResponseFromUrl()).toThrow(
            "Missing state on redirect URL"
        );
    });

    it("throws when state is missing id attribute", () => {
        const invalidState = btoa(
            JSON.stringify({ meta: { interactionType: "popup" } })
        );
        window.location.hash = `#code=testCode&state=${invalidState}`;

        expect(() => parseAuthResponseFromUrl()).toThrow(
            "Missing state 'id' and/or 'meta' attributes"
        );
    });

    it("throws when state is missing meta attribute", () => {
        const invalidState = btoa(JSON.stringify({ id: RANDOM_TEST_GUID }));
        window.location.hash = `#code=testCode&state=${invalidState}`;

        expect(() => parseAuthResponseFromUrl()).toThrow(
            "Missing state 'id' and/or 'meta' attributes"
        );
    });
});
