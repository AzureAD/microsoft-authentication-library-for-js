import {
    extractBrowserRequestState,
    BrowserStateObject,
} from "../../src/utils/BrowserProtocolUtils.js";
import { clearHash } from "../../src/utils/BrowserUtils.js";
import { InteractionType } from "../../src/utils/BrowserConstants.js";
import { Logger, ProtocolUtils } from "@azure/msal-common";
import { CryptoOps } from "../../src/crypto/CryptoOps.js";
import { DatabaseStorage } from "../../src/cache/DatabaseStorage.js";
import { TEST_STATE_VALUES } from "./StringConstants.js";

describe("BrowserProtocolUtils.ts Unit Tests", () => {
    const browserRedirectRequestState: BrowserStateObject = {
        interactionType: InteractionType.Redirect,
    };
    const browserPopupRequestState: BrowserStateObject = {
        interactionType: InteractionType.Popup,
    };

    let cryptoInterface: CryptoOps;
    let dbStorage = {};
    beforeEach(() => {
        jest.spyOn(DatabaseStorage.prototype, "open").mockImplementation(
            async (): Promise<void> => {
                dbStorage = {};
            }
        );
        cryptoInterface = new CryptoOps(new Logger({}));
    });

    describe("Redirect URL cleanup", () => {
        const base = "https://localhost:8081/";
        const replaceState = window.history.replaceState;

        afterEach(() => {
            jest.restoreAllMocks();
            window.history.replaceState = replaceState;
            window.history.replaceState(null, "", base);
        });

        it.each(['""', "old-code"])(
            "removes a flat code fragment with value %s",
            (code) => {
                window.history.replaceState(null, "", `${base}#code=${code}`);

                clearHash(window);
                expect(window.location.href).toBe(base);
            }
        );

        it.each([
            `code=old-code&state=${TEST_STATE_VALUES.TEST_STATE_REDIRECT}`,
            `accountId=broker-id&state=${TEST_STATE_VALUES.TEST_STATE_REDIRECT}`,
            "code=old-code&state=invalid",
        ])("removes a slash-prefixed callback: %s", (response) => {
            window.history.replaceState(null, "", `${base}#/${response}`);

            clearHash(window);
            expect(window.location.href).toBe(base);
        });

        it.each([
            [
                `${base}?state=CA&tab=orders#/home`,
                `${base}?state=CA&tab=orders#/home`,
            ],
            [`${base}?q=keep#state=CA&tab=orders`, `${base}?q=keep`],
            [`${base}?q=keep#state=CA`, `${base}?q=keep`],
        ])(
            "clears fragment state while preserving query state: %s",
            (url, expectedUrl) => {
                window.history.replaceState(null, "", url);

                clearHash(window);
                expect(window.location.href).toBe(expectedUrl);
            }
        );

        it("clears the complete response fragment while preserving the query", () => {
            window.history.replaceState(
                null,
                "",
                `${base}?q=a%20b#code=A&view=a%20b&state=invalid&code=B&client_info=info`
            );

            clearHash(window);

            expect(window.location.href).toBe(`${base}?q=a%20b`);
        });

        it("removes populated broker identifiers from accountId callback fragments", () => {
            window.history.replaceState(
                null,
                "",
                `${base}?keep=yes#accountId=old-id&state=${TEST_STATE_VALUES.TEST_STATE_REDIRECT}&view=home`
            );
            clearHash(window);
            expect(window.location.href).toBe(`${base}?keep=yes`);
        });

        it.each([
            "#/dashboard?code=application-code&state=application-state",
            "#dashboard?tab=one&code=application-code",
            "#section",
            "#/dashboard?accountId=application-id",
            "#/dashboard?nativeAccountId=application-id",
            "#nativeAccountId=",
            "#nativeAccountId=application-id",
        ])("preserves application fragment %s", (hash) => {
            window.history.replaceState(null, "", base + hash);

            clearHash(window);
            expect(window.location.href).toBe(base + hash);
        });

        it.each([
            TEST_STATE_VALUES.TEST_STATE_POPUP,
            TEST_STATE_VALUES.TEST_STATE_SILENT,
        ])(
            "clears recognized responses regardless of interaction type",
            (state) => {
                const url = `${base}#code=owned-by-other-flow&state=${state}`;
                window.history.replaceState(null, "", url);
                clearHash(window);
                expect(window.location.href).toBe(base);
                const brokerUrl = `${base}#accountId=owned-by-other-flow&state=${state}`;
                window.history.replaceState(null, "", brokerUrl);
                clearHash(window);
                expect(window.location.href).toBe(base);
                window.history.replaceState(null, "", `${base}#state=${state}`);
                clearHash(window);
                expect(window.location.href).toBe(base);
            }
        );

        it("clears the complete redirect error response fragment", () => {
            window.history.replaceState(
                null,
                "",
                `${base}#error=access_denied&error_description=denied&state=${TEST_STATE_VALUES.TEST_STATE_REDIRECT}&view=home`
            );

            clearHash(window);

            expect(window.location.href).toBe(base);
        });

        it("removes encrypted redirect responses", () => {
            window.history.replaceState(
                null,
                "",
                `${base}#ear_jwe=encrypted&state=bad`
            );

            clearHash(window);

            expect(window.location.href).toBe(base);
        });

        it("does not clear an authorization code from the query string", () => {
            const url = `${base}?code=application-code&state=application-state#/home`;
            window.history.replaceState(null, "", url);

            clearHash(window);
            expect(window.location.href).toBe(url);
        });

        it("does not clear a broker response from the query string", () => {
            const url = `${base}?accountId=old-id&state=${TEST_STATE_VALUES.TEST_STATE_REDIRECT}&q=keep#/home`;
            window.history.replaceState(null, "", url);
            clearHash(window);
            expect(window.location.href).toBe(url);
        });

        it("preserves query responses and fragment routing", () => {
            window.history.replaceState(
                null,
                "",
                `${base}?code=A&state=${TEST_STATE_VALUES.TEST_STATE_REDIRECT}&q=keep#/home`
            );

            clearHash(window);

            expect(window.location.href).toBe(
                `${base}?code=A&state=${TEST_STATE_VALUES.TEST_STATE_REDIRECT}&q=keep#/home`
            );
        });

        it("clears the hash before replacing the history entry with null state", () => {
            const state = { route: "home" };
            window.history.replaceState(
                state,
                "",
                `${base}?q=keep#code=A&view=home`
            );
            const historyLength = window.history.length;
            const replace = jest
                .spyOn(window.history, "replaceState")
                .mockImplementation((data, unused, url) => {
                    expect(window.location.hash).toBe("");
                    replaceState.call(window.history, data, unused, url);
                });

            clearHash(window);

            expect(window.location.href).toBe(`${base}?q=keep`);
            expect(window.history.state).toBeNull();
            expect(replace).toHaveBeenCalledWith(null, "", `${base}?q=keep`);
            expect(window.history.length).toBe(historyLength + 1);
        });

        it("clears the hash when Office disables replaceState", () => {
            window.history.replaceState(null, "", `${base}?q=keep#code=A`);
            // @ts-expect-error Office.js can disable this browser API.
            window.history.replaceState = null;

            clearHash(window);

            expect(window.location.hash).toBe("");
            expect(window.location.search).toBe("?q=keep");
        });

        it("keeps the hash cleared when replaceState throws", () => {
            window.history.replaceState(null, "", `${base}#code=A`);
            jest.spyOn(window.history, "replaceState").mockImplementation(
                () => {
                    throw new Error("History unavailable");
                }
            );
            const logger = new Logger({});
            const warning = jest.spyOn(logger, "warning");

            expect(() => clearHash(window, logger, "test-id")).not.toThrow();
            expect(window.location.hash).toBe("");
            expect(warning).not.toHaveBeenCalled();
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("extractBrowserRequestState() returns an null if given interaction type is null or empty", () => {
        //@ts-ignore
        const requestState1 = extractBrowserRequestState(
            cryptoInterface,
            //@ts-ignore
            null,
            ""
        );
        expect(requestState1).toBeNull();

        const requestState2 = extractBrowserRequestState(
            cryptoInterface,
            "",
            ""
        );
        expect(requestState2).toBeNull();
    });

    it("extractBrowserRequestState() returns a valid platform state string", () => {
        const redirectState = ProtocolUtils.setRequestState(
            cryptoInterface,
            undefined,
            browserRedirectRequestState,
            ""
        );
        const popupState = ProtocolUtils.setRequestState(
            cryptoInterface,
            undefined,
            browserPopupRequestState,
            ""
        );
        const redirectPlatformState = extractBrowserRequestState(
            cryptoInterface,
            redirectState,
            ""
        );
        expect(redirectPlatformState!.interactionType).toBe(
            InteractionType.Redirect
        );
        const popupPlatformState = extractBrowserRequestState(
            cryptoInterface,
            popupState,
            ""
        );
        expect(popupPlatformState!.interactionType).toBe(InteractionType.Popup);
    });
});
