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
        const diagnostics: string[] = [];

        try {
            const currentUrl = new URL(page.url());
            currentUrl.search = "";
            currentUrl.hash = "";
            diagnostics.push(`URL: ${currentUrl.toString()}`);
        } catch (diagnosticError) {
            diagnostics.push(
                `URL unavailable: ${getErrorMessage(diagnosticError)}`
            );
        }

        try {
            const title = redactEmails(await page.title());
            diagnostics.push(`Title: ${title}`);
        } catch (diagnosticError) {
            diagnostics.push(
                `Title unavailable: ${getErrorMessage(diagnosticError)}`
            );
        }

        try {
            const body = await page.evaluate(() => document.body.innerText);
            const sanitizedBody = redactEmails(body).slice(0, 2000);
            diagnostics.push(`Body:\n${sanitizedBody}`);
        } catch (diagnosticError) {
            diagnostics.push(
                `Body unavailable: ${getErrorMessage(diagnosticError)}`
            );
        }

        const originalError = getErrorMessage(error);
        throw new Error(
            `Waiting for selector "${selector}" failed: ${originalError}\n${diagnostics.join(
                "\n"
            )}`
        );
    }
}

function redactEmails(value: string): string {
    return value.replace(
        /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
        "[redacted-email]"
    );
}

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
