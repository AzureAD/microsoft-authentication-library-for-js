/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger, StubPerformanceClient } from "@azure/msal-common/browser";
import * as PopupRelay from "../../src/popup_relay/relayClient.js";
import { runPopupRelay } from "../../src/popup_relay/index.js";
import { POPUP_RELAY_RESPONSE_TYPE } from "../../src/popup_relay/constants.js";
import {
    RANDOM_TEST_GUID,
    TEST_STATE_VALUES,
} from "../utils/StringConstants.js";

const logger = new Logger({});
const perfClient = new StubPerformanceClient();

// TEST_STATE_REDIRECT decodes to a library state whose id is RANDOM_TEST_GUID.
const REQUEST_STATE = TEST_STATE_VALUES.TEST_STATE_REDIRECT;
const CHANNEL_ID = RANDOM_TEST_GUID;
const AUTH_URL =
    "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=abc&state=wrapped";
const ACTION_URL =
    "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";

describe("buildPopupRelayUrl", () => {
    it("encodes a GET action with the channel id into the relay page hash", () => {
        const url = PopupRelay.buildPopupRelayUrl(
            "/relay",
            CHANNEL_ID,
            { method: "GET", url: AUTH_URL },
            "cid"
        );
        const parsed = new URL(url);

        expect(parsed.origin).toEqual(window.location.origin);
        expect(parsed.pathname).toEqual("/relay");
        const req = JSON.parse(
            new URLSearchParams(parsed.hash.slice(1)).get("req") || ""
        );
        expect(req).toEqual({
            id: CHANNEL_ID,
            method: "GET",
            url: AUTH_URL,
        });
    });

    it("encodes a POST form action with fields", () => {
        const url = PopupRelay.buildPopupRelayUrl(
            "/relay",
            CHANNEL_ID,
            {
                method: "POST",
                action: ACTION_URL,
                fields: { client_id: "abc", code_challenge: "xyz" },
            },
            "cid"
        );
        const req = JSON.parse(
            new URLSearchParams(new URL(url).hash.slice(1)).get("req") || ""
        );
        expect(req).toEqual({
            id: CHANNEL_ID,
            method: "POST",
            action: ACTION_URL,
            fields: { client_id: "abc", code_challenge: "xyz" },
        });
    });

    it("throws popup_relay_cross_origin when popupRelayUri resolves to a different origin", () => {
        expect(() =>
            PopupRelay.buildPopupRelayUrl(
                "https://attacker.example.com/relay",
                CHANNEL_ID,
                { method: "GET", url: AUTH_URL },
                "cid"
            )
        ).toThrowError(
            expect.objectContaining({
                errorCode: "popup_relay_unsupported_flow",
                subError: "popup_relay_cross_origin",
            })
        );
    });
});

describe("waitForPopupRelayResponse", () => {
    afterEach(() => {
        jest.useRealTimers();
    });

    it("resolves with the payload relayed from the matching popup, origin and id", async () => {
        const promise = PopupRelay.waitForPopupRelayResponse(
            5000,
            logger,
            { correlationId: "cid", state: REQUEST_STATE },
            window,
            perfClient
        );

        window.dispatchEvent(
            new MessageEvent("message", {
                data: {
                    type: POPUP_RELAY_RESPONSE_TYPE,
                    id: CHANNEL_ID,
                    payload: "code=abc",
                },
                origin: window.location.origin,
                source: window,
            })
        );

        await expect(promise).resolves.toEqual("code=abc");
    });

    it("ignores messages with a mismatched library-state id", async () => {
        jest.useFakeTimers();
        const promise = PopupRelay.waitForPopupRelayResponse(
            5000,
            logger,
            { correlationId: "cid", state: REQUEST_STATE },
            window,
            perfClient
        );

        window.dispatchEvent(
            new MessageEvent("message", {
                data: {
                    type: POPUP_RELAY_RESPONSE_TYPE,
                    id: "wrong-id",
                    payload: "code=abc",
                },
                origin: window.location.origin,
                source: window,
            })
        );

        jest.advanceTimersByTime(5000);
        await expect(promise).rejects.toBeDefined();
    });

    it("rejects when the relay popup is closed before responding", async () => {
        jest.useFakeTimers();
        const promise = PopupRelay.waitForPopupRelayResponse(
            60000,
            logger,
            { correlationId: "cid", state: REQUEST_STATE },
            { closed: true } as Window,
            perfClient
        );

        jest.advanceTimersByTime(500);
        await expect(promise).rejects.toBeDefined();
    });
});

describe("runPopupRelay", () => {
    let openSpy: jest.SpyInstance;
    let childPopup: { closed: boolean; close: jest.Mock; document?: Document };
    let postMessage: jest.Mock;
    let openerStub: { postMessage: jest.Mock } | null;

    function setReq(req: unknown): void {
        window.location.hash =
            "#" + new URLSearchParams({ req: JSON.stringify(req) }).toString();
    }

    beforeEach(() => {
        jest.useFakeTimers();
        childPopup = { closed: false, close: jest.fn() };
        openSpy = jest
            .spyOn(window, "open")
            .mockReturnValue(childPopup as unknown as Window);
        postMessage = jest.fn();
        openerStub = { postMessage };
        Object.defineProperty(window, "opener", {
            get: () => openerStub,
            configurable: true,
        });
        setReq({ id: CHANNEL_ID, method: "GET", url: AUTH_URL });
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
        jest.restoreAllMocks();
        window.location.hash = "";
    });

    it("throws when there is no opener", () => {
        openerStub = null;
        expect(() => runPopupRelay()).toThrow();
    });

    it("opens the IdP child popup to the GET url and scrubs its own hash", () => {
        runPopupRelay();

        expect(openSpy).toHaveBeenCalledWith(
            AUTH_URL,
            "msalPopupRelayChild",
            expect.any(String)
        );
        expect(window.location.hash).toEqual("");
    });
    it("opens an about:blank child and submits the relayed form for POST", () => {
        const submitSpy = jest
            .spyOn(HTMLFormElement.prototype, "submit")
            .mockImplementation(() => {});
        const childDoc = document.implementation.createHTMLDocument("child");
        childPopup = { closed: false, close: jest.fn(), document: childDoc };
        openSpy.mockReturnValue(childPopup as unknown as Window);
        setReq({
            id: CHANNEL_ID,
            method: "POST",
            action: ACTION_URL,
            fields: { client_id: "abc", code_challenge: "xyz" },
        });

        runPopupRelay();

        expect(openSpy).toHaveBeenCalledWith(
            "about:blank",
            "msalPopupRelayChild",
            expect.any(String)
        );
        const form = childDoc.querySelector("form");
        expect(form).toBeTruthy();
        expect(form!.getAttribute("action")).toEqual(ACTION_URL);
        const input = childDoc.querySelector(
            'input[name="client_id"]'
        ) as HTMLInputElement | null;
        expect(input!.value).toEqual("abc");
        expect(submitSpy).toHaveBeenCalled();
    });

    it("relays the IdP child popup being closed back to the opener as an error", () => {
        childPopup.closed = true;

        runPopupRelay();

        // Advance past the closed-popup poll interval.
        jest.advanceTimersByTime(500);

        expect(postMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                type: POPUP_RELAY_RESPONSE_TYPE,
                id: CHANNEL_ID,
                error: expect.any(String),
            }),
            window.location.origin
        );
    });
});

/*
 * The relay page is directly reachable, so its hash is attacker-controlled: a
 * crafted link must never be able to talk the relay into navigating its child
 * popup to an active scheme (which would execute in the relay app's own
 * first-party origin) or to an arbitrary origin.
 */
describe("runPopupRelay request validation", () => {
    let openSpy: jest.SpyInstance;
    let submitSpy: jest.SpyInstance;
    let childDoc: Document;

    function setReq(req: unknown): void {
        window.location.hash =
            "#" + new URLSearchParams({ req: JSON.stringify(req) }).toString();
    }

    function expectRejected(req: unknown, subError: string): void {
        setReq(req);
        expect(() => runPopupRelay()).toThrowError(
            expect.objectContaining({
                errorCode: "popup_relay_unsupported_flow",
                subError,
            })
        );
        expect(openSpy).not.toHaveBeenCalled();
        expect(submitSpy).not.toHaveBeenCalled();
    }

    beforeEach(() => {
        jest.useFakeTimers();
        childDoc = document.implementation.createHTMLDocument("child");
        openSpy = jest.spyOn(window, "open").mockReturnValue({
            closed: false,
            close: jest.fn(),
            document: childDoc,
        } as unknown as Window);
        submitSpy = jest
            .spyOn(HTMLFormElement.prototype, "submit")
            .mockImplementation(() => {});
        Object.defineProperty(window, "opener", {
            get: () => ({ postMessage: jest.fn() }),
            configurable: true,
        });
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
        jest.restoreAllMocks();
        window.location.hash = "";
    });

    describe("rejects unsafe GET navigation targets", () => {
        it.each([
            ["javascript:", "javascript:fetch('https://attacker.example.com')"],
            ["data:", "data:text/html,<script>alert(1)</script>"],
            ["blob:", "blob:https://login.microsoftonline.com/abc"],
            ["file:", "file:///etc/passwd"],
            ["http:", "http://login.microsoftonline.com/common/authorize"],
        ])("rejects a %s url", (_scheme, url) => {
            expectRejected(
                { id: CHANNEL_ID, method: "GET", url },
                "popup_relay_unsafe_url"
            );
        });

        it("rejects a relative url", () => {
            expectRejected(
                { id: CHANNEL_ID, method: "GET", url: "/authorize" },
                "popup_relay_unsafe_url"
            );
        });

        it("rejects an https url carrying embedded credentials", () => {
            expectRejected(
                {
                    id: CHANNEL_ID,
                    method: "GET",
                    url: "https://user:pass@login.microsoftonline.com/common/authorize",
                },
                "popup_relay_unsafe_url"
            );
        });
    });

    describe("rejects unsafe POST form actions", () => {
        it("rejects a javascript: action before the form is submitted", () => {
            expectRejected(
                {
                    id: CHANNEL_ID,
                    method: "POST",
                    action: "javascript:fetch('https://attacker.example.com')",
                    fields: {},
                },
                "popup_relay_unsafe_url"
            );
            expect(childDoc.querySelector("form")).toBeNull();
        });

        it("rejects a non-object fields bag", () => {
            expectRejected(
                {
                    id: CHANNEL_ID,
                    method: "POST",
                    action: ACTION_URL,
                    fields: "client_id=abc",
                },
                "popup_relay_bad_request"
            );
        });

        it("rejects non-string field values", () => {
            expectRejected(
                {
                    id: CHANNEL_ID,
                    method: "POST",
                    action: ACTION_URL,
                    fields: { client_id: { toString: "abc" } },
                },
                "popup_relay_bad_request"
            );
        });
    });

    describe("rejects malformed requests", () => {
        it("rejects a request with no method rather than falling back to GET", () => {
            expectRejected(
                { id: CHANNEL_ID, url: AUTH_URL },
                "popup_relay_bad_request"
            );
        });

        it("rejects an unknown method", () => {
            expectRejected(
                { id: CHANNEL_ID, method: "DELETE", url: AUTH_URL },
                "popup_relay_bad_request"
            );
        });

        it("rejects a non-string id", () => {
            expectRejected(
                { id: 42, method: "GET", url: AUTH_URL },
                "popup_relay_bad_request"
            );
        });

        it("rejects an empty id", () => {
            expectRejected(
                { id: "", method: "GET", url: AUTH_URL },
                "popup_relay_bad_request"
            );
        });

        it("rejects a missing GET url", () => {
            expectRejected(
                { id: CHANNEL_ID, method: "GET" },
                "popup_relay_bad_request"
            );
        });

        it("rejects a non-object payload", () => {
            expectRejected("not-a-request", "popup_relay_bad_request");
        });

        it("rejects a hash that is not valid JSON", () => {
            window.location.hash =
                "#" + new URLSearchParams({ req: "{oops" }).toString();
            expect(() => runPopupRelay()).toThrowError(
                expect.objectContaining({
                    subError: "popup_relay_bad_request",
                })
            );
            expect(openSpy).not.toHaveBeenCalled();
        });

        it("still scrubs the hash when the request is rejected", () => {
            setReq({
                id: CHANNEL_ID,
                method: "GET",
                url: "javascript:alert(1)",
            });
            expect(() => runPopupRelay()).toThrow();
            expect(window.location.hash).toEqual("");
        });
    });

    describe("allowedAuthorityOrigins", () => {
        /*
         * The option is additive: every relay page that predates it — and every
         * page that simply does not set it — must keep working unchanged, for
         * any https authority. These are the backward-compatibility guards.
         */
        it("navigates when options are omitted entirely", () => {
            setReq({ id: CHANNEL_ID, method: "GET", url: AUTH_URL });

            runPopupRelay();

            expect(openSpy).toHaveBeenCalledWith(
                AUTH_URL,
                "msalPopupRelayChild",
                expect.any(String)
            );
        });

        it("navigates when other options are set but no origins are pinned", () => {
            setReq({ id: CHANNEL_ID, method: "GET", url: AUTH_URL });

            runPopupRelay({ timeoutMs: 1000 });

            expect(openSpy).toHaveBeenCalledWith(
                AUTH_URL,
                "msalPopupRelayChild",
                expect.any(String)
            );
        });

        it("navigates when allowedAuthorityOrigins is explicitly undefined", () => {
            setReq({ id: CHANNEL_ID, method: "GET", url: AUTH_URL });

            runPopupRelay({ allowedAuthorityOrigins: undefined });

            expect(openSpy).toHaveBeenCalledWith(
                AUTH_URL,
                "msalPopupRelayChild",
                expect.any(String)
            );
        });

        it.each([
            [
                "B2C",
                "https://contoso.b2clogin.com/tenant/b2c_1_si/oauth2/v2.0/authorize",
            ],
            [
                "CIAM",
                "https://contoso.ciamlogin.com/tenant/oauth2/v2.0/authorize",
            ],
            [
                "sovereign",
                "https://login.chinacloudapi.cn/common/oauth2/v2.0/authorize",
            ],
            [
                "US Gov",
                "https://login.microsoftonline.us/common/oauth2/v2.0/authorize",
            ],
            [
                "non-standard port",
                "https://idp.contoso.com:8443/oauth2/v2.0/authorize",
            ],
        ])(
            "navigates to a %s authority when no origins are pinned",
            (_label, url) => {
                setReq({ id: CHANNEL_ID, method: "GET", url });

                runPopupRelay();

                expect(openSpy).toHaveBeenCalledWith(
                    url,
                    "msalPopupRelayChild",
                    expect.any(String)
                );
            }
        );

        it("allows a url on a pinned authority origin", () => {
            setReq({ id: CHANNEL_ID, method: "GET", url: AUTH_URL });

            runPopupRelay({
                allowedAuthorityOrigins: ["https://login.microsoftonline.com"],
            });

            expect(openSpy).toHaveBeenCalledWith(
                AUTH_URL,
                "msalPopupRelayChild",
                expect.any(String)
            );
        });

        /*
         * Entries are compared by origin, so the shapes a developer naturally
         * reaches for — most commonly the configured authority itself — must
         * not silently fail closed.
         */
        it.each([
            ["a trailing slash", "https://login.microsoftonline.com/"],
            [
                "the full authority url",
                "https://login.microsoftonline.com/common",
            ],
            ["mixed case", "https://Login.MicrosoftOnline.com"],
            [
                "an explicit default port",
                "https://login.microsoftonline.com:443",
            ],
        ])("accepts a pin written with %s", (_label, pin) => {
            setReq({ id: CHANNEL_ID, method: "GET", url: AUTH_URL });

            runPopupRelay({ allowedAuthorityOrigins: [pin] });

            expect(openSpy).toHaveBeenCalledWith(
                AUTH_URL,
                "msalPopupRelayChild",
                expect.any(String)
            );
        });

        it("rejects an https url on an origin that is not pinned", () => {
            setReq({
                id: CHANNEL_ID,
                method: "GET",
                url: "https://attacker.example.com/authorize",
            });

            expect(() =>
                runPopupRelay({
                    allowedAuthorityOrigins: [
                        "https://login.microsoftonline.com",
                    ],
                })
            ).toThrowError(
                expect.objectContaining({
                    subError: "popup_relay_untrusted_authority",
                })
            );
            expect(openSpy).not.toHaveBeenCalled();
        });

        it("honors an explicitly empty allow list as allow-nothing", () => {
            setReq({ id: CHANNEL_ID, method: "GET", url: AUTH_URL });

            expect(() =>
                runPopupRelay({ allowedAuthorityOrigins: [] })
            ).toThrowError(
                expect.objectContaining({
                    subError: "popup_relay_untrusted_authority",
                })
            );
            expect(openSpy).not.toHaveBeenCalled();
        });

        it("fails loudly on a malformed allow-list entry rather than dropping it", () => {
            setReq({ id: CHANNEL_ID, method: "GET", url: AUTH_URL });

            expect(() =>
                runPopupRelay({
                    allowedAuthorityOrigins: [
                        "https://login.microsoftonline.com",
                        "not-a-url",
                    ],
                })
            ).toThrowError(
                expect.objectContaining({
                    subError: "popup_relay_invalid_allowed_origin",
                })
            );
            expect(openSpy).not.toHaveBeenCalled();
        });

        /*
         * The allow list is a security control, so an entry that cannot express
         * a trustworthy origin must not be accepted as one. A non-https or
         * credential-bearing entry is a configuration bug, and silently keeping
         * it would let the pin appear stricter than it is.
         */
        it.each([
            ["a non-https entry", "http://login.microsoftonline.com"],
            [
                "an entry carrying credentials",
                "https://user:pass@login.microsoftonline.com",
            ],
        ])("rejects %s in the allow list", (_label, entry) => {
            setReq({ id: CHANNEL_ID, method: "GET", url: AUTH_URL });

            expect(() =>
                runPopupRelay({ allowedAuthorityOrigins: [entry] })
            ).toThrowError(
                expect.objectContaining({
                    subError: "popup_relay_invalid_allowed_origin",
                })
            );
            expect(openSpy).not.toHaveBeenCalled();
        });

        it("rejects an allowedAuthorityOrigins that is not an array", () => {
            setReq({ id: CHANNEL_ID, method: "GET", url: AUTH_URL });

            expect(() =>
                runPopupRelay({
                    // Guards JS callers, who are not held to the string[] type.
                    allowedAuthorityOrigins:
                        "https://login.microsoftonline.com" as unknown as string[],
                })
            ).toThrowError(
                expect.objectContaining({
                    subError: "popup_relay_invalid_allowed_origin",
                })
            );
            expect(openSpy).not.toHaveBeenCalled();
        });

        it("pins the POST form action as well as the GET url", () => {
            setReq({
                id: CHANNEL_ID,
                method: "POST",
                action: "https://attacker.example.com/authorize",
                fields: {},
            });

            expect(() =>
                runPopupRelay({
                    allowedAuthorityOrigins: [
                        "https://login.microsoftonline.com",
                    ],
                })
            ).toThrowError(
                expect.objectContaining({
                    subError: "popup_relay_untrusted_authority",
                })
            );
            expect(submitSpy).not.toHaveBeenCalled();
        });
    });
});
