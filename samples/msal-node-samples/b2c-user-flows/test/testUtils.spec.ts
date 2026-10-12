/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Page } from "puppeteer";
import { waitForSelectorWithPageDiagnostics } from "./testUtils";

describe("waitForSelectorWithPageDiagnostics", () => {
    it("reports sanitized page state without callback parameters", async () => {
        const page = {
            waitForSelector: jest
                .fn()
                .mockRejectedValue(new Error("selector timed out")),
            url: jest
                .fn()
                .mockReturnValue(
                    "http://localhost:3000/redirect?code=secret-code"
                ),
            title: jest.fn().mockResolvedValue("Error"),
            evaluate: jest
                .fn()
                .mockResolvedValue(
                    "AADB2C90085 for lab.user@contoso.com\nCorrelation ID: 123"
                ),
        } as unknown as Page;

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
});
