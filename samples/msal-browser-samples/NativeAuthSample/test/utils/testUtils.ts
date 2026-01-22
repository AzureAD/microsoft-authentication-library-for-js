/**
 * Shared test utilities for Native Auth Sample E2E tests
 * Centralizes common patterns and reduces code duplication
 */

import * as puppeteer from "puppeteer";
import { BrowserCacheUtils, Screenshot } from "e2e-test-utils";

/**
 * Token verification utilities
 */
export class TokenVerificationUtils {
    /**
     * Standard token verification for successful authentication
     * Replaces the duplicated BrowserCache.getTokens() verification in all spec files
     */
    static async verifySuccessfulAuthentication(
        browserCache: BrowserCacheUtils,
        expectedScopes: string[] = ["openid", "profile", "user.read"]
    ): Promise<void> {
        const tokenStore = await browserCache.getTokens();

        // Verify token counts
        expect(tokenStore.idTokens).toHaveLength(1);
        expect(tokenStore.accessTokens).toHaveLength(1);
        expect(tokenStore.refreshTokens).toHaveLength(1);

        // Verify account exists
        expect(await browserCache.getAccountFromCache()).toBeDefined();

        // Verify access token has correct scopes
        expect(
            await browserCache.accessTokenForScopesExists(
                tokenStore.accessTokens,
                expectedScopes
            )
        ).toBeTruthy();
    }

    /**
     * Verify no tokens exist (for sign-out tests)
     */
    static async verifyNoTokensInCache(browserCache: BrowserCacheUtils): Promise<void> {
        const tokenStore = await browserCache.getTokens();
        expect(tokenStore.idTokens).toHaveLength(0);
        expect(tokenStore.accessTokens).toHaveLength(0);
        expect(tokenStore.refreshTokens).toHaveLength(0);
    }
}

/**
 * Browser state management utilities
 */
export class BrowserStateUtils {
    /**
     * Enhanced browser state cleanup - simplified version
     */
    static async cleanupBrowserState(page: puppeteer.Page): Promise<void> {
        await page.evaluate(() => {
            // Clear all storage types
            sessionStorage.clear();
            localStorage.clear();
        });
    }

    /**
     * Verify user is not signed in initially
     */
    static async verifyNotSignedIn(page: puppeteer.Page): Promise<void> {
        const authStatusBanner = await page.$eval(
            "#authStatusBanner",
            (el) => el.textContent
        );
        expect(authStatusBanner).toContain("No user signed in");
    }

    /**
     * Wait for authentication completion with retry logic
     * @param page Puppeteer page instance
     * @param timeout Base timeout per attempt (default: 30000ms)
     * @param maxAttempts Maximum retry attempts (default: 3)
     */
    static async waitForAuthenticationComplete(
        page: puppeteer.Page,
        timeout: number = 30000,
        maxAttempts: number = 3
    ): Promise<void> {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                await page.waitForFunction(
                    () => {
                        const authStatusBanner = document.getElementById("authStatusBanner");
                        return authStatusBanner?.textContent?.includes("Signed in");
                    },
                    { timeout }
                );
                return;

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                if (attempt === maxAttempts) {
                    // Final attempt failed
                    throw new Error(`Authentication completion failed after ${maxAttempts} attempts. Last error: ${errorMessage}`);
                }
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
        }
    }
}

/**
 * UI interaction utilities
 */
export class UIInteractionUtils {
    /**
     * Safe element click with better error messages
     * Replaces page.evaluate() click patterns with consistent implementation
     */
    static async clickElementSafely(
        page: puppeteer.Page,
        selector: string,
        description: string
    ): Promise<void> {
        await page.evaluate((sel, desc) => {
            const element = document.querySelector(sel) as HTMLElement;
            if (!element) {
                throw new Error(`${desc} not found in DOM (selector: ${sel})`);
            }
            if (element.offsetParent === null) {
                throw new Error(`${desc} is not visible`);
            }
            if ('disabled' in element && (element as any).disabled) {
                throw new Error(`${desc} is disabled`);
            }
            element.click();
        }, selector, description);
    }

    /**
     * Generic function to type into any field with optional clear-first and description
     */
    static async typeIntoElement(
        page: puppeteer.Page,
        selector: string,
        value: string,
        description: string = "",
        clearFirst: boolean = false
    ): Promise<void> {
        await page.waitForSelector(selector, { visible: true });
        if (clearFirst) {
            await page.evaluate((selector) => {
                const element = document.querySelector(selector) as HTMLInputElement;
                if (element && element.value !== undefined) {
                    element.value = '';
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    element.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }, selector);
        }
        await page.type(selector, value);
    }

    /**
     * Wait for element to be visible and enabled before clicking
     */
    static async waitAndClick(
        page: puppeteer.Page,
        selector: string,
        description: string,
        timeout: number = 15000
    ): Promise<void> {
        await page.waitForSelector(`${selector}:enabled`, {
            visible: true,
            timeout
        });
        await this.clickElementSafely(page, selector, description);
    }
}

/**
 * Common test flow utilities
 */
export class TestFlowUtils {
    /**
     * Navigate to app with config and wait for initialization
     */
    static async initializeApp(
        page: puppeteer.Page,
        baseUrl: string,
        configParams: string = "",
        timeout: number = 60000
    ): Promise<void> {
        const url = configParams ? `${baseUrl}?${configParams}` : baseUrl;
        await page.goto(url);

        // Wait for PCA initialization (common across all tests)
        await page.waitForFunction(
            () => {
                return (window as any).pca !== undefined;
            },
            { timeout }
        );
    }

    /**
     * Standard test setup that all spec files can use
     */
    static async setupTestEnvironment(
        page: puppeteer.Page,
        baseUrl: string,
        configParams: string = ""
    ): Promise<void> {
        await this.initializeApp(page, baseUrl, configParams);
        await BrowserStateUtils.verifyNotSignedIn(page);
    }

    /**
     * Standard test cleanup that all spec files can use
     */
    static async cleanupTestEnvironment(
        page: puppeteer.Page,
        browserCache: BrowserCacheUtils
    ): Promise<void> {
        await BrowserStateUtils.cleanupBrowserState(page);
        await page.close();
    }
}
