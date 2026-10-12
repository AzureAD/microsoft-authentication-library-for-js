/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Page } from "puppeteer";

export async function waitForSelectorWithPageDiagnostics(
    page: Page,
    selector: string
): Promise<void> {
    try {
        await page.waitForSelector(selector, { visible: true });
    } catch (error) {
        let diagnostics: string;

        try {
            const currentUrl = new URL(page.url());
            currentUrl.search = "";
            currentUrl.hash = "";
            const title = await page.title();
            const body = await page.evaluate(() => document.body.innerText);
            const sanitizedBody = body
                .replace(
                    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
                    "[redacted-email]"
                )
                .slice(0, 2000);

            diagnostics = `URL: ${currentUrl.toString()}\nTitle: ${title}\nBody:\n${sanitizedBody}`;
        } catch (diagnosticError) {
            diagnostics = `Page diagnostics unavailable: ${
                diagnosticError instanceof Error
                    ? diagnosticError.message
                    : String(diagnosticError)
            }`;
        }

        const originalError =
            error instanceof Error ? error.message : String(error);
        throw new Error(
            `Waiting for selector "${selector}" failed: ${originalError}\n${diagnostics}`
        );
    }
}
