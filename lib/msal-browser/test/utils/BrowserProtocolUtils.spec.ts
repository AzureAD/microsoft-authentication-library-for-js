import {
    extractBrowserRequestState,
    BrowserStateObject,
} from "../../src/utils/BrowserProtocolUtils.js";
import { clearHash } from "../../src/utils/BrowserUtils.js";
import { InteractionType } from "../../src/utils/BrowserConstants.js";
import { Constants, Logger, ProtocolUtils } from "@azure/msal-common";
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

        it.each(["", '""', "old-code"])(
            "removes a flat code fragment with value %s",
            (code) => {
                window.history.replaceState(null, "", `${base}#code=${code}`);

                expect(clearHash(window)).toBe(true);
                expect(window.location.href).toBe(base);
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

        it("removes populated or empty broker identifiers from accountId callback fragments", () => {
            window.history.replaceState(null, "", `${base}#accountId=`);
            clearHash(window);
            expect(window.location.href).toBe(base);

            window.history.replaceState(
                null,
                "",
                `${base}?keep=yes#accountId=old-id&state=invalid&view=home`
            );
            clearHash(window);
            expect(window.location.href).toBe(`${base}?keep=yes`);
        });

        it.each([
            "#/dashboard?code=application-code&state=application-state",
            "#dashboard?tab=one&code=application-code",
            "#section",
            "#state=application-state&view=home",
            "#error=application-error",
            "#/dashboard?accountId=application-id",
            "#/dashboard?nativeAccountId=application-id",
            "#nativeAccountId=",
            "#nativeAccountId=application-id",
        ])("preserves application fragment %s", (hash) => {
            window.history.replaceState(null, "", base + hash);

            expect(clearHash(window)).toBe(false);
            expect(window.location.href).toBe(base + hash);
        });

        it.each([
            TEST_STATE_VALUES.TEST_STATE_POPUP,
            TEST_STATE_VALUES.TEST_STATE_SILENT,
        ])("leaves another interaction's response untouched", (state) => {
            const url = `${base}#code=owned-by-other-flow&state=${state}`;
            window.history.replaceState(null, "", url);
            expect(clearHash(window)).toBe(false);
            expect(window.location.href).toBe(url);
            const brokerUrl = `${base}#accountId=owned-by-other-flow&state=${state}`;
            window.history.replaceState(null, "", brokerUrl);
            expect(clearHash(window)).toBe(false);
            expect(window.location.href).toBe(brokerUrl);
        });

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

        it("does not treat an ordinary query code as an auth response in fragment mode", () => {
            const url = `${base}?code=application-code&state=application-state#/home`;
            window.history.replaceState(null, "", url);

            expect(clearHash(window)).toBe(false);
            expect(window.location.href).toBe(url);
        });

        it("preserves ordinary query accountId parameters unless query response mode is selected", () => {
            const url = `${base}?accountId=old-id&state=invalid&q=keep#/home`;
            window.history.replaceState(null, "", url);
            expect(clearHash(window)).toBe(false);
            expect(window.location.href).toBe(url);

            clearHash(window, Constants.ResponseMode.QUERY);
            expect(window.location.href).toBe(`${base}#/home`);
        });

        it("clears the complete query-mode response while preserving fragment routing", () => {
            window.history.replaceState(
                null,
                "",
                `${base}?code=A&state=invalid&q=a%20b#/home`
            );

            clearHash(window, Constants.ResponseMode.QUERY);

            expect(window.location.href).toBe(`${base}#/home`);
        });

        it("does not clear query responses when fragment mode is selected", () => {
            window.history.replaceState(
                null,
                "",
                `${base}?code=A&state=${TEST_STATE_VALUES.TEST_STATE_REDIRECT}&q=keep#/home`
            );

            expect(clearHash(window)).toBe(false);

            expect(window.location.href).toBe(
                `${base}?code=A&state=${TEST_STATE_VALUES.TEST_STATE_REDIRECT}&q=keep#/home`
            );
        });

        it.each([
            Constants.ResponseMode.FRAGMENT,
            Constants.ResponseMode.QUERY,
        ])("clears only the component selected by %s mode", (responseMode) => {
            const state = { route: "home" };
            window.history.replaceState(
                state,
                "",
                `${base}?code=query-code&state=${TEST_STATE_VALUES.TEST_STATE_REDIRECT}&q=a%20b#accountId=broker-id&state=${TEST_STATE_VALUES.TEST_STATE_REDIRECT}&view=home`
            );

            expect(clearHash(window, responseMode)).toBe(true);

            expect(window.location.href).toBe(
                responseMode === Constants.ResponseMode.QUERY
                    ? `${base}#accountId=broker-id&state=${TEST_STATE_VALUES.TEST_STATE_REDIRECT}&view=home`
                    : `${base}?code=query-code&state=${TEST_STATE_VALUES.TEST_STATE_REDIRECT}&q=a%20b`
            );
            expect(window.history.state).toEqual(state);
        });

        it("replaces the current history entry and preserves application history state", () => {
            const state = { route: "home" };
            window.history.replaceState(
                state,
                "",
                `${base}?q=keep#code=A&view=home`
            );
            const historyLength = window.history.length;

            clearHash(window);

            expect(window.location.href).toBe(`${base}?q=keep`);
            expect(window.history.state).toEqual(state);
            expect(window.history.length).toBe(historyLength);
        });

        it("falls back to clearing the hash when Office disables replaceState", () => {
            window.history.replaceState(null, "", `${base}?q=keep#code=A`);
            // @ts-expect-error Office.js can disable this browser API.
            window.history.replaceState = null;

            clearHash(window);

            expect(window.location.hash).toBe("");
            expect(window.location.search).toBe("?q=keep");
        });

        it("falls back to hash cleanup when replaceState throws", () => {
            window.history.replaceState(null, "", `${base}#code=A`);
            jest.spyOn(window.history, "replaceState").mockImplementation(
                () => {
                    throw new Error("History unavailable");
                }
            );
            const logger = new Logger({});
            const warning = jest.spyOn(logger, "warning");

            expect(() =>
                clearHash(window, undefined, logger, "test-id")
            ).not.toThrow();
            expect(window.location.hash).toBe("");
            expect(warning).not.toHaveBeenCalled();
        });

        it("reports query cleanup failure without throwing or navigating", () => {
            window.history.replaceState(null, "", `${base}?code=A#/home`);
            // @ts-expect-error Office.js can disable this browser API.
            window.history.replaceState = null;
            const logger = new Logger({});
            const warning = jest.spyOn(logger, "warning");

            expect(() =>
                clearHash(
                    window,
                    Constants.ResponseMode.QUERY,
                    logger,
                    "test-id"
                )
            ).not.toThrow();
            expect(warning).toHaveBeenCalledWith(
                expect.not.stringContaining("code=A"),
                "test-id"
            );
            expect(window.location.hash).toBe("#/home");
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
