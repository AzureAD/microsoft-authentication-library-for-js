import {
    extractBrowserRequestState,
    BrowserStateObject,
    clearRedirectResponseFromUrl,
    sanitizeRedirectUrl,
} from "../../src/utils/BrowserProtocolUtils.js";
import { InteractionType } from "../../src/utils/BrowserConstants.js";
import { Constants, Logger, ProtocolUtils } from "@azure/msal-common";
import { CryptoOps } from "../../src/crypto/CryptoOps.js";
import { DatabaseStorage } from "../../src/cache/DatabaseStorage.js";
import { TEST_HASHES, TEST_STATE_VALUES } from "./StringConstants.js";

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
                expect(sanitizeRedirectUrl(`${base}#code=${code}`)).toBe(base);
            }
        );

        it("preserves unrelated parameters verbatim while removing duplicate auth fields", () => {
            expect(
                sanitizeRedirectUrl(
                    `${base}?q=a%20b#code=A&view=a%20b&state=invalid&code=B&client_info=info`
                )
            ).toBe(`${base}?q=a%20b#view=a%20b&client_info=info`);
        });

        it("removes response values and companion markers without removing other metadata", () => {
            const metadata =
                "client_info=info&session_state=session&cloud_instance_name=cloud&cloud_instance_host_name=host&cloud_graph_host_name=graph&msgraph_host=graphhost&error_uri=help&suberror=detail&timestamp=now&trace_id=trace&correlation_id=correlation&claims=claims&clientdata=data";
            expect(
                sanitizeRedirectUrl(
                    `${base}#code=A&ear_jwe=encrypted&accountId=broker-id&nativeAccountId=old-id&state=invalid&error=error&error_description=description&${metadata}`
                )
            ).toBe(`${base}#${metadata}`);
        });

        it.each(["accountId", "nativeAccountId"])(
            "removes populated or empty broker identifiers from %s callback fragments",
            (key) => {
                expect(sanitizeRedirectUrl(`${base}#${key}=`)).toBe(base);
                expect(
                    sanitizeRedirectUrl(
                        `${base}?keep=yes#${key}=old-id&state=invalid&view=home`
                    )
                ).toBe(`${base}?keep=yes#view=home`);
            }
        );

        it.each([
            "#/dashboard?code=application-code&state=application-state",
            "#dashboard?tab=one&code=application-code",
            "#section",
            "#state=application-state&view=home",
            "#error=application-error",
            "#/dashboard?accountId=application-id",
            "#/dashboard?nativeAccountId=application-id",
        ])("preserves application fragment %s", (hash) => {
            expect(sanitizeRedirectUrl(base + hash)).toBe(base + hash);
        });

        it.each([
            TEST_STATE_VALUES.TEST_STATE_POPUP,
            TEST_STATE_VALUES.TEST_STATE_SILENT,
        ])("leaves another interaction's response untouched", (state) => {
            const url = `${base}#code=owned-by-other-flow&state=${state}`;
            expect(sanitizeRedirectUrl(url)).toBe(url);
            const brokerUrl = `${base}#accountId=owned-by-other-flow&state=${state}`;
            expect(sanitizeRedirectUrl(brokerUrl)).toBe(brokerUrl);
        });

        it("removes a redirect error response and preserves unrelated parameters", () => {
            expect(
                sanitizeRedirectUrl(
                    `${base}#error=access_denied&error_description=denied&state=${TEST_STATE_VALUES.TEST_STATE_REDIRECT}&view=home`
                )
            ).toBe(`${base}#view=home`);
        });

        it("removes encrypted redirect responses", () => {
            expect(
                sanitizeRedirectUrl(`${base}#ear_jwe=encrypted&state=bad`)
            ).toBe(base);
        });

        it("does not treat an ordinary query code as an auth response in fragment mode", () => {
            const url = `${base}?code=application-code&state=application-state#/home`;
            expect(sanitizeRedirectUrl(url)).toBe(url);
        });

        it.each(["accountId", "nativeAccountId"])(
            "preserves ordinary query %s parameters unless query response mode is selected",
            (key) => {
                const url = `${base}?${key}=old-id&state=invalid&q=keep#/home`;
                expect(sanitizeRedirectUrl(url)).toBe(url);
                expect(
                    sanitizeRedirectUrl(url, Constants.ResponseMode.QUERY)
                ).toBe(`${base}?q=keep#/home`);
            }
        );

        it("removes query-mode responses while preserving routing and unrelated query data", () => {
            expect(
                sanitizeRedirectUrl(
                    `${base}?code=A&state=invalid&q=a%20b#/home`,
                    Constants.ResponseMode.QUERY
                )
            ).toBe(`${base}?q=a%20b#/home`);
        });

        it("recognizes MSAL redirect state in query callback URLs without configuration", () => {
            expect(
                sanitizeRedirectUrl(
                    `${base}?code=A&state=${TEST_STATE_VALUES.TEST_STATE_REDIRECT}&q=keep#/home`
                )
            ).toBe(`${base}?q=keep#/home`);
        });

        it("replaces the current history entry and preserves application history state", () => {
            const state = { route: "home" };
            window.history.replaceState(
                state,
                "",
                `${base}?q=keep#code=A&view=home`
            );
            const historyLength = window.history.length;

            clearRedirectResponseFromUrl(window);

            expect(window.location.href).toBe(`${base}?q=keep#view=home`);
            expect(window.history.state).toEqual(state);
            expect(window.history.length).toBe(historyLength);
        });

        it("falls back to clearing the hash when Office disables replaceState", () => {
            window.history.replaceState(null, "", `${base}?q=keep#code=A`);
            // @ts-expect-error Office.js can disable this browser API.
            window.history.replaceState = null;

            clearRedirectResponseFromUrl(window);

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
                clearRedirectResponseFromUrl(
                    window,
                    undefined,
                    logger,
                    "test-id"
                )
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
                clearRedirectResponseFromUrl(
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
