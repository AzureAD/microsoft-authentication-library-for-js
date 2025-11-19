/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { broadcastResponseToMainFrame } from "../../src/redirect_bridge/index.js";
import { NavigationClient } from "../../src/navigation/NavigationClient.js";
import { clearHash } from "../../src/utils/BrowserUtils.js";
import {
    TEST_HASHES,
    TEST_STATE_VALUES,
    RANDOM_TEST_GUID,
} from "../utils/StringConstants.js";

jest.mock("../../src/utils/BrowserUtils.js");
jest.mock("../../src/navigation/NavigationClient.js");

describe("broadcastResponseToMainFrame", () => {
    let mockNavigationClient: jest.Mocked<NavigationClient>;

    beforeEach(() => {
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
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
        window.location.hash = "";
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

        it("navigates to custom URL for redirect flow when navigateToUrl is provided", async () => {
            const customUrl = "https://localhost:8081/custom-page.html";
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;

            await broadcastResponseToMainFrame(customUrl);

            // Verify navigation was called with custom URL + hash
            expect(mockNavigationClient.navigateInternal).toHaveBeenCalledWith(
                `${customUrl}${TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT}`,
                expect.objectContaining({
                    apiId: expect.any(Number),
                    noHistory: true,
                    timeout: expect.any(Number),
                })
            );

            // Hash should NOT be cleared for redirect
            expect(clearHash).not.toHaveBeenCalled();

            // window.close should NOT be called for redirect
            expect(window.close).not.toHaveBeenCalled();
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
