/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 *
 * @jest-environment node
 */

import { Page } from "puppeteer";
import { waitForSelectorWithPageDiagnostics } from "./testUtils";

describe("waitForSelectorWithPageDiagnostics", () => {
    let page: Page;

    beforeEach(() => {
        page = {
            waitForSelector: jest
                .fn()
                .mockRejectedValue(new Error("selector timed out")),
            url: jest
                .fn()
                .mockReturnValue(
                    "http://localhost:3000/redirect?code=secret-code#id_token=secret-token"
                ),
            title: jest.fn().mockResolvedValue("Error"),
            evaluate: jest
                .fn()
                .mockResolvedValue(
                    "AADB2C90085 for lab.user@contoso.com\nCorrelation ID: 123"
                ),
        } as unknown as Page;
    });

    it("reports sanitized page state without callback parameters", async () => {
        await expect(
            waitForSelectorWithPageDiagnostics(page, "#editProfile")
        ).rejects.toThrow(
            [
                'Waiting for selector "#editProfile" failed: selector timed out',
                "URL: http://localhost:3000/redirect",
                "Title: Error",
                "Body:",
                "AADB2C90085 for [redacted-email]",
                "Correlation ID: 123",
            ].join("\n")
        );
    });

    it("redacts email addresses from the page title", async () => {
        jest.spyOn(page, "title").mockResolvedValue(
            "Error for lab.user@contoso.com"
        );

        await expect(
            waitForSelectorWithPageDiagnostics(page, "#editProfile")
        ).rejects.toThrow("Title: Error for [redacted-email]");
    });

    it.each([
        ["URL", "url"],
        ["Title", "title"],
        ["Body", "evaluate"],
    ] as const)(
        "preserves other diagnostics when reading %s fails",
        async (label, method) => {
            jest.spyOn(page, method).mockImplementation(() => {
                throw new Error("Execution context was destroyed");
            });

            const diagnostics = {
                URL: "URL: http://localhost:3000/redirect",
                Title: "Title: Error",
                Body: "Body:\nAADB2C90085 for [redacted-email]\nCorrelation ID: 123",
            };

            await expect(
                waitForSelectorWithPageDiagnostics(page, "#editProfile")
            ).rejects.toThrow(
                [
                    'Waiting for selector "#editProfile" failed: selector timed out',
                    ...Object.entries(diagnostics).map(([field, value]) =>
                        field === label
                            ? `${label} unavailable: Execution context was destroyed`
                            : value
                    ),
                ].join("\n")
            );
        }
    );

    it("does not collect diagnostics when the selector is visible", async () => {
        jest.spyOn(page, "waitForSelector").mockResolvedValue(null);

        await waitForSelectorWithPageDiagnostics(page, "#editProfile");

        expect(page.waitForSelector).toHaveBeenCalledWith("#editProfile", {
            visible: true,
        });
        expect(page.url).not.toHaveBeenCalled();
        expect(page.title).not.toHaveBeenCalled();
        expect(page.evaluate).not.toHaveBeenCalled();
    });

    it("uses the Node environment without launching a browser", () => {
        expect(global).not.toHaveProperty("__BROWSER__");
    });
});
