import * as puppeteer from "puppeteer";

/**
 * Returns an instance of {@link puppeteer.Browser}.
 */
export async function getBrowser(): Promise<puppeteer.Browser> {
    // @ts-ignore
    return global.__BROWSER__;
}

/**
 * Returns a host url.
 */
export function getHomeUrl(): string {
    // @ts-ignore
    return `http://localhost:${global.__PORT__}/`;
}
