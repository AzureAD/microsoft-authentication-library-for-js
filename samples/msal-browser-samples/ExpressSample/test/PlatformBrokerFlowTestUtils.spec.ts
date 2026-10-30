import * as puppeteer from "puppeteer";
import { EventType, InteractionType } from "@azure/msal-browser";
import {
    observePopupEarRequests,
    verifyPlatformBrokerOperation,
    verifyPlatformBrokerRedirect,
} from "./PlatformBrokerFlowTestUtils";

const TEST_ORIGIN = "http://localhost:3000";
const AUTH_MODULE = `
    let callback;
    let result = {
        accessToken: "synthetic-test-token",
        fromPlatformBroker: true,
        fromCache: false,
        account: { homeAccountId: "home", nativeAccountId: "native" }
    };
    export const msalInstance = {
        handleRedirectPromise: () => Promise.resolve(result),
        addEventCallback: (value) => { callback = value; return "callback"; },
        removeEventCallback: () => { callback = undefined; }
    };
    export function setResult(value) { result = value; }
    export function emit(eventType, interactionType) {
        callback?.({ eventType, interactionType, payload: result });
    }
    export function hasCallback() { return !!callback; }
`;

describe("Platform broker operation observation", () => {
    let browser: puppeteer.Browser;
    let page: puppeteer.Page;

    beforeAll(async () => {
        browser = await puppeteer.launch({ headless: true });
    });

    afterAll(async () => {
        await browser.close();
    });

    beforeEach(async () => {
        page = await browser.newPage();
        await page.setRequestInterception(true);
        page.on("request", (request) =>
            request.respond({
                contentType: request.url().endsWith("/js/auth.js")
                    ? "text/javascript"
                    : "text/html",
                body: request.url().endsWith("/js/auth.js")
                    ? AUTH_MODULE
                    : "<html><body></body></html>",
            })
        );
        await page.goto(TEST_ORIGIN);
    });

    afterEach(async () => {
        jest.restoreAllMocks();
        await Promise.all(
            (await browser.pages()).map((openPage) => openPage.close())
        );
    });

    it("reads original redirect provenance without returning tokens", async () => {
        await expect(verifyPlatformBrokerRedirect(page)).resolves.toEqual({
            fromPlatformBroker: true,
            fromCache: false,
            homeAccountId: "home",
            nativeAccountId: "native",
        });
        await page.evaluate(
            "import('/js/auth.js').then(module => module.setResult(null))"
        );
        await expect(verifyPlatformBrokerRedirect(page)).rejects.toThrow();
    });

    it("rejects a web result even when its account is native-linked", async () => {
        await page.evaluate(`import('/js/auth.js').then(module => module.setResult({
            accessToken: "synthetic-test-token",
            fromPlatformBroker: false,
            fromCache: true,
            account: { homeAccountId: "home", nativeAccountId: "native" }
        }))`);
        await expect(
            verifyPlatformBrokerOperation(
                page,
                InteractionType.Popup,
                async () => {
                    await page.evaluate(
                        `import('/js/auth.js').then(module => module.emit(
                        ${JSON.stringify(EventType.ACQUIRE_TOKEN_SUCCESS)},
                        ${JSON.stringify(InteractionType.Popup)}
                    ))`
                    );
                }
            )
        ).rejects.toThrow();
        expect(
            await page.evaluate(
                "import('/js/auth.js').then(module => module.hasCallback())"
            )
        ).toBe(false);
    });

    it("accepts native silent cache hits and removes callbacks on action failure", async () => {
        await page.evaluate(`import('/js/auth.js').then(module => module.setResult({
            accessToken: "synthetic-test-token",
            fromPlatformBroker: false,
            fromCache: true,
            account: { homeAccountId: "home", nativeAccountId: "native" }
        }))`);
        const result = await verifyPlatformBrokerOperation(
            page,
            InteractionType.Silent,
            async () => {
                await page.evaluate(
                    `import('/js/auth.js').then(module => module.emit(
                        ${JSON.stringify(EventType.ACQUIRE_TOKEN_SUCCESS)},
                        ${JSON.stringify(InteractionType.Silent)}
                    ))`
                );
            }
        );
        expect(result.fromCache).toBe(true);
        expect(result.nativeAccountId).toBe("native");
        await expect(
            verifyPlatformBrokerOperation(
                page,
                InteractionType.Silent,
                async () => {
                    throw new Error("Action failed");
                }
            )
        ).rejects.toThrow("Action failed");
        expect(
            await page.evaluate(
                "import('/js/auth.js').then(module => module.hasCallback())"
            )
        ).toBe(false);
    });

    it("observes the popup's first authorize POST before the popup event", async () => {
        let popupEventFired = false;
        const popupPromise = new Promise<puppeteer.Page | null>((resolve) => {
            page.once("popup", (popup) => {
                popupEventFired = true;
                resolve(popup);
            });
        });
        const count = await observePopupEarRequests(page, async () => {
            await page.evaluate((origin) => {
                const form = document.createElement("form");
                form.action = `${origin}/authorize`;
                form.method = "POST";
                form.target = "ear-popup";
                document.body.appendChild(form);
                form.submit();
            }, TEST_ORIGIN);
            const popup = await popupPromise;
            if (!popup) {
                throw new Error("Test popup did not open");
            }
        });
        expect(popupEventFired).toBe(true);
        expect(count).toBe(1);
    });

    it("propagates observer failures, resumes targets and detaches sessions", async () => {
        const target = browser.target();
        const root = await target.createCDPSession();
        jest.spyOn(target, "createCDPSession").mockResolvedValue(root);
        const childSpies: jest.SpyInstance[] = [];
        root.on("Target.attachedToTarget", ({ sessionId }) => {
            const session = root.connection()?.session(sessionId);
            if (!session) {
                throw new Error("Test CDP session was not found");
            }
            const send = session.send.bind(session);
            childSpies.push(
                jest
                    .spyOn(session, "send")
                    .mockImplementation((method, ...args) =>
                        method === "Network.enable"
                            ? Promise.reject(
                                  new Error("Network observation failed")
                              )
                            : send(method, ...args)
                    )
            );
        });
        await expect(
            observePopupEarRequests(page, () =>
                page.evaluate(() => {
                    window.open("about:blank");
                })
            )
        ).rejects.toThrow("Network observation failed");
        expect(
            childSpies.some((spy) =>
                spy.mock.calls.some(
                    ([method]) => method === "Runtime.runIfWaitingForDebugger"
                )
            )
        ).toBe(true);
        expect(root.detached).toBe(true);
    });
});
