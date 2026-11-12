/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger, StubPerformanceClient } from "@azure/msal-common/browser";
import * as PopupRelay from "../../src/popup_relay/relayClient.js";
import {
    runPopupRelay as runRelay,
    PopupRelayOptions,
} from "../../src/popup_relay/index.js";
import {
    POPUP_RELAY_READY_TYPE,
    POPUP_RELAY_REQUEST_TYPE,
    POPUP_RELAY_V2_RESPONSE_TYPE as POPUP_RELAY_RESPONSE_TYPE,
    POPUP_RELAY_RESPONSE_TYPE as LEGACY_RESPONSE_TYPE,
} from "../../src/popup_relay/constants.js";
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
const NONCE = "relay-document-nonce";
const GET_ACTION: PopupRelay.PopupRelayAction = {
    method: "GET",
    url: AUTH_URL,
};

function runPopupRelay(options?: PopupRelayOptions): void {
    runRelay({ ...options, protocolVersion: 2 });
}

function deliverRequest(request: unknown, overrides?: MessageEventInit): void {
    const postMessage = window.opener.postMessage as jest.Mock;
    const ready = postMessage.mock.calls[0][0];
    window.dispatchEvent(
        new MessageEvent("message", {
            origin: window.location.origin,
            source: window.opener,
            data: {
                type: POPUP_RELAY_REQUEST_TYPE,
                id: CHANNEL_ID,
                nonce: ready.nonce,
                request,
            },
            ...overrides,
        })
    );
}

function signalReady(popup: Window = window): void {
    window.dispatchEvent(
        new MessageEvent("message", {
            origin: window.location.origin,
            source: popup,
            data: {
                type: POPUP_RELAY_READY_TYPE,
                id: CHANNEL_ID,
                nonce: NONCE,
            },
        })
    );
}

describe("popup-relay v1 compatibility and migration", () => {
    let postMessage: jest.Mock;
    let open: jest.SpyInstance;
    let submit: jest.SpyInstance;
    let childDocument: Document;

    beforeEach(() => {
        jest.useFakeTimers();
        postMessage = jest.fn();
        const opener = { postMessage };
        Object.defineProperty(window, "opener", {
            get: () => opener,
            configurable: true,
        });
        childDocument = document.implementation.createHTMLDocument("child");
        open = jest.spyOn(window, "open").mockReturnValue({
            closed: false,
            close: jest.fn(),
            document: childDocument,
        } as unknown as Window);
        submit = jest
            .spyOn(HTMLFormElement.prototype, "submit")
            .mockImplementation(() => {});
    });

    afterEach(() => {
        window.dispatchEvent(new Event("pagehide"));
        jest.clearAllTimers();
        jest.useRealTimers();
        jest.restoreAllMocks();
        window.location.hash = "";
    });

    it.each<PopupRelay.PopupRelayAction>([
        GET_ACTION,
        { method: "POST", action: ACTION_URL, fields: { client_id: "abc" } },
    ])(
        "preserves the previous $method URL format without a new setting",
        (action) => {
            const url = PopupRelay.buildPopupRelayUrl(
                "/relay",
                CHANNEL_ID,
                action,
                "cid"
            );
            expect(new URL(url).hash).toBe(
                "#" +
                    new URLSearchParams({
                        req: JSON.stringify({ id: CHANNEL_ID, ...action }),
                    }).toString()
            );
            expect(new URL(url).hash).not.toContain("id=");
        }
    );

    it("accepts a previous client's fragment with omitted options and no required pins", () => {
        window.location.hash =
            "#" +
            new URLSearchParams({
                req: JSON.stringify({ id: CHANNEL_ID, ...GET_ACTION }),
            }).toString();
        runRelay();
        expect(open).toHaveBeenCalledWith(
            AUTH_URL,
            "msalPopupRelayChild",
            expect.any(String)
        );
        expect(postMessage).not.toHaveBeenCalled();
        expect(window.location.hash).toBe("");
    });

    it.each([
        "https://contoso.b2clogin.com/tenant/authorize",
        "https://contoso.ciamlogin.com/tenant/authorize",
        "https://login.microsoftonline.us/common/authorize",
        "https://idp.contoso.com:8443/authorize",
    ])("keeps unpinned legacy POST support for %s", (action) => {
        window.location.hash =
            "#" +
            new URLSearchParams({
                req: JSON.stringify({
                    id: CHANNEL_ID,
                    method: "POST",
                    action,
                    fields: { client_id: "abc", claims: "custom-fields" },
                }),
            }).toString();
        runRelay();
        expect(open).toHaveBeenCalledWith(
            "about:blank",
            "msalPopupRelayChild",
            expect.any(String)
        );
        expect(childDocument.querySelector("form")?.action).toBe(action);
        expect(submit).toHaveBeenCalledTimes(1);
        expect(postMessage).not.toHaveBeenCalled();
    });

    it("continues enforcing an explicitly supplied v1 pin", () => {
        window.location.hash =
            "#" +
            new URLSearchParams({
                req: JSON.stringify({ id: CHANNEL_ID, ...GET_ACTION }),
            }).toString();
        expect(() => runRelay({ allowedAuthorityOrigins: [] })).toThrow(
            expect.objectContaining({
                subError: "popup_relay_untrusted_authority",
            })
        );
        expect(open).not.toHaveBeenCalled();
        expect(submit).not.toHaveBeenCalled();
    });

    it("returns the previous response envelope without a handshake or nonce", () => {
        window.location.hash =
            "#" +
            new URLSearchParams({
                req: JSON.stringify({ id: CHANNEL_ID, ...GET_ACTION }),
            }).toString();
        open.mockReturnValue({
            closed: true,
            close: jest.fn(),
        } as unknown as Window);
        runRelay();
        jest.advanceTimersByTime(500);
        expect(postMessage).toHaveBeenCalledWith(
            {
                type: LEGACY_RESPONSE_TYPE,
                id: CHANNEL_ID,
                error: "user_cancelled",
            },
            window.location.origin
        );
    });

    it("accepts a previous relay's source-checked response without a nonce", async () => {
        const fields = jest.spyOn(perfClient, "addFields");
        const promise = PopupRelay.waitForPopupRelayResponse(
            5000,
            logger,
            { correlationId: "cid", state: REQUEST_STATE },
            window,
            perfClient
        );
        window.dispatchEvent(
            new MessageEvent("message", {
                origin: window.location.origin,
                source: window,
                data: {
                    type: LEGACY_RESPONSE_TYPE,
                    id: CHANNEL_ID,
                    payload: "code=previous-relay",
                },
            })
        );
        await expect(promise).resolves.toBe("code=previous-relay");
        expect(fields).toHaveBeenCalledWith(
            {
                redirectBridgeTimeoutMs: 5000,
                popupRelayProtocolVersion: 1,
            },
            "cid"
        );
    });

    it.each<1 | 2>([1, 2])(
        "rejects mismatched v%s callers before opening a child",
        (incomingVersion) => {
            window.location.hash = new URL(
                PopupRelay.buildPopupRelayUrl(
                    "/relay",
                    CHANNEL_ID,
                    GET_ACTION,
                    "cid",
                    incomingVersion
                )
            ).hash;
            const endpointVersion = incomingVersion === 1 ? 2 : 1;
            expect(() =>
                runRelay({ protocolVersion: endpointVersion })
            ).toThrow(
                expect.objectContaining({
                    subError: "popup_relay_protocol_mismatch",
                })
            );
            expect(open).not.toHaveBeenCalled();
            expect(submit).not.toHaveBeenCalled();
            expect(postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type:
                        incomingVersion === 1
                            ? LEGACY_RESPONSE_TYPE
                            : POPUP_RELAY_RESPONSE_TYPE,
                    id: CHANNEL_ID,
                    error: "popup_relay_unsupported_flow",
                    subError: "popup_relay_protocol_mismatch",
                }),
                window.location.origin
            );
        }
    );

    it("can retire the old path by replacing its handler with v2-only behavior", () => {
        window.location.hash =
            "#" +
            new URLSearchParams({
                req: JSON.stringify({
                    id: CHANNEL_ID,
                    method: "POST",
                    action: ACTION_URL,
                    fields: {},
                }),
            }).toString();
        expect(() => runRelay({ protocolVersion: 2 })).toThrow(
            expect.objectContaining({
                subError: "popup_relay_protocol_mismatch",
            })
        );
        expect(open).not.toHaveBeenCalled();
        expect(submit).not.toHaveBeenCalled();
    });

    it("does not negotiate down from v2 after a legacy response or timeout", async () => {
        const send = jest
            .spyOn(window, "postMessage")
            .mockImplementation(() => {});
        const promise = PopupRelay.waitForPopupRelayResponse(
            1000,
            logger,
            { correlationId: "cid", state: REQUEST_STATE },
            window,
            perfClient,
            GET_ACTION,
            2
        );
        window.dispatchEvent(
            new MessageEvent("message", {
                origin: window.location.origin,
                source: window,
                data: {
                    type: LEGACY_RESPONSE_TYPE,
                    id: CHANNEL_ID,
                    payload: "code=legacy-response",
                },
            })
        );
        jest.advanceTimersByTime(1000);
        await expect(promise).rejects.toMatchObject({
            subError: "popup_relay_timeout",
        });
        signalReady();
        expect(send).not.toHaveBeenCalled();
        expect(open).not.toHaveBeenCalled();
    });

    it.each([null, 0, 3, "2"])(
        "rejects invalid protocol %p rather than selecting v1",
        async (version) => {
            const badVersion = version as unknown as 1 | 2;
            expect(() =>
                PopupRelay.buildPopupRelayUrl(
                    "/relay",
                    CHANNEL_ID,
                    GET_ACTION,
                    "cid",
                    badVersion
                )
            ).toThrow(
                expect.objectContaining({
                    subError: "popup_relay_invalid_protocol",
                })
            );
            expect(() => runRelay({ protocolVersion: badVersion })).toThrow(
                expect.objectContaining({
                    subError: "popup_relay_invalid_protocol",
                })
            );
            await expect(
                PopupRelay.waitForPopupRelayResponse(
                    1000,
                    logger,
                    { correlationId: "cid", state: REQUEST_STATE },
                    window,
                    perfClient,
                    GET_ACTION,
                    badVersion
                )
            ).rejects.toMatchObject({
                subError: "popup_relay_invalid_protocol",
            });
            expect(open).not.toHaveBeenCalled();
        }
    );
});

describe.each<1 | 2>([1, 2])(
    "popup-relay v%s round trip",
    (protocolVersion) => {
        afterEach(() => {
            window.dispatchEvent(new Event("pagehide"));
            jest.restoreAllMocks();
            window.location.hash = "";
        });

        it.each<PopupRelay.PopupRelayAction>([
            GET_ACTION,
            {
                method: "POST",
                action: ACTION_URL,
                fields: { client_id: "abc" },
            },
        ])(
            "connects the app, relay and redirect bridge for $method",
            async (action) => {
                const dispatch = (data: unknown, source: Window): void => {
                    window.dispatchEvent(
                        new MessageEvent("message", {
                            origin: window.location.origin,
                            source,
                            data,
                        })
                    );
                };
                const opener = {
                    postMessage: jest.fn((data: unknown) =>
                        dispatch(data, popup)
                    ),
                };
                const popup = {
                    closed: false,
                    postMessage: jest.fn((data: unknown) =>
                        dispatch(data, opener as unknown as Window)
                    ),
                } as unknown as Window;
                Object.defineProperty(window, "opener", {
                    get: () => opener,
                    configurable: true,
                });
                const document =
                    window.document.implementation.createHTMLDocument("child");
                const replace = jest.fn();
                const open = jest.spyOn(window, "open").mockReturnValue({
                    closed: false,
                    close: jest.fn(),
                    document,
                    location: { replace },
                } as unknown as Window);
                jest.spyOn(window, "close").mockImplementation(() => {});
                const submit = jest
                    .spyOn(HTMLFormElement.prototype, "submit")
                    .mockImplementation(() => {});
                const result = PopupRelay.waitForPopupRelayResponse(
                    5000,
                    logger,
                    { correlationId: "cid", state: REQUEST_STATE },
                    popup,
                    perfClient,
                    action,
                    protocolVersion
                );
                window.location.hash = new URL(
                    PopupRelay.buildPopupRelayUrl(
                        protocolVersion === 1 ? "/relay" : "/relay-v2",
                        CHANNEL_ID,
                        action,
                        "cid",
                        protocolVersion
                    )
                ).hash;
                runRelay({ protocolVersion });
                expect(
                    action.method === "GET"
                        ? protocolVersion === 1
                            ? open
                            : replace
                        : submit
                ).toHaveBeenCalledTimes(1);
                if (action.method === "POST") {
                    expect(document.querySelector("form")?.action).toBe(
                        ACTION_URL
                    );
                    expect(document.querySelector("input")?.value).toBe("abc");
                }
                const bridge = new BroadcastChannel(CHANNEL_ID);
                try {
                    bridge.postMessage({ payload: "code=trusted-response" });
                    await expect(result).resolves.toBe("code=trusted-response");
                } finally {
                    bridge.close();
                }
            }
        );
    }
);

describe("buildPopupRelayUrl", () => {
    it("carries only the channel id in the relay page hash", () => {
        const url = PopupRelay.buildPopupRelayUrl(
            "/relay",
            CHANNEL_ID,
            GET_ACTION,
            "cid",
            2
        );
        const parsed = new URL(url);

        expect(parsed.origin).toEqual(window.location.origin);
        expect(parsed.pathname).toEqual("/relay");
        expect(parsed.hash).toEqual(`#id=${CHANNEL_ID}`);
    });

    it("replaces a pre-existing fragment without changing the query", () => {
        const url = PopupRelay.buildPopupRelayUrl(
            "/relay?mode=popup#req=untrusted",
            CHANNEL_ID,
            GET_ACTION,
            "cid",
            2
        );
        expect(new URL(url).search).toEqual("?mode=popup");
        expect(new URL(url).hash).toEqual(`#id=${CHANNEL_ID}`);
    });

    it("throws popup_relay_cross_origin when popupRelayUri resolves to a different origin", () => {
        expect(() =>
            PopupRelay.buildPopupRelayUrl(
                "https://attacker.example.com/relay",
                CHANNEL_ID,
                GET_ACTION,
                "cid",
                2
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
    beforeEach(() => {
        jest.spyOn(window, "postMessage").mockImplementation(() => {});
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    it("reports failed v2 handoff and cleans up without retrying as v1", async () => {
        jest.useFakeTimers();
        const log = jest.spyOn(logger, "error");
        const fields = jest.spyOn(perfClient, "addFields");
        jest.mocked(window.postMessage).mockImplementationOnce(() => {
            throw new DOMException("Cannot clone", "DataCloneError");
        });
        const promise = PopupRelay.waitForPopupRelayResponse(
            5000,
            logger,
            { correlationId: "cid", state: REQUEST_STATE },
            window,
            perfClient,
            GET_ACTION,
            2
        );
        signalReady();
        await expect(promise).rejects.toMatchObject({
            errorCode: "popup_window_error",
            subError: "popup_relay_handoff_failed",
            correlationId: "cid",
        });
        expect(log).toHaveBeenCalledWith(
            expect.stringContaining("request handoff failed"),
            "cid"
        );
        expect(fields).toHaveBeenCalledWith(
            {
                redirectBridgeTimeoutMs: 5000,
                popupRelayProtocolVersion: 2,
            },
            "cid"
        );
        expect(fields).not.toHaveBeenCalledWith(
            { "ext.popupRelayRequestSent": true },
            "cid"
        );
        signalReady();
        expect(window.postMessage).toHaveBeenCalledTimes(1);
        expect(jest.getTimerCount()).toBe(0);
    });

    it("requires a retained action before starting v2", async () => {
        await expect(
            PopupRelay.waitForPopupRelayResponse(
                1000,
                logger,
                { correlationId: "cid", state: REQUEST_STATE },
                window,
                perfClient,
                undefined,
                2
            )
        ).rejects.toMatchObject({ subError: "popup_relay_bad_request" });
        signalReady();
        expect(window.postMessage).not.toHaveBeenCalled();
    });

    it("resolves with the payload relayed from the matching popup, origin and id", async () => {
        const fields = jest.spyOn(perfClient, "addFields");
        const promise = PopupRelay.waitForPopupRelayResponse(
            5000,
            logger,
            { correlationId: "cid", state: REQUEST_STATE },
            window,
            perfClient,
            GET_ACTION,
            2
        );
        signalReady();
        expect(fields).toHaveBeenCalledWith(
            { "ext.popupRelayRequestSent": true },
            "cid"
        );

        window.dispatchEvent(
            new MessageEvent("message", {
                data: {
                    type: POPUP_RELAY_RESPONSE_TYPE,
                    id: CHANNEL_ID,
                    nonce: NONCE,
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
            perfClient,
            GET_ACTION,
            2
        );
        signalReady();

        window.dispatchEvent(
            new MessageEvent("message", {
                data: {
                    type: POPUP_RELAY_RESPONSE_TYPE,
                    id: "wrong-id",
                    nonce: NONCE,
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
            perfClient,
            GET_ACTION,
            2
        );

        jest.advanceTimersByTime(500);
        await expect(promise).rejects.toBeDefined();
    });

    it("accepts a source-checked popup-blocker error before the handoff", async () => {
        const promise = PopupRelay.waitForPopupRelayResponse(
            5000,
            logger,
            { correlationId: "cid", state: REQUEST_STATE },
            window,
            perfClient,
            GET_ACTION,
            2
        );
        window.dispatchEvent(
            new MessageEvent("message", {
                origin: window.location.origin,
                source: window,
                data: {
                    type: POPUP_RELAY_RESPONSE_TYPE,
                    id: CHANNEL_ID,
                    error: "popup_window_error",
                },
            })
        );
        await expect(promise).rejects.toMatchObject({
            errorCode: "popup_window_error",
        });
        expect(window.postMessage).not.toHaveBeenCalled();
    });

    it.each<PopupRelay.PopupRelayAction>([
        GET_ACTION,
        { method: "POST", action: ACTION_URL, fields: { client_id: "abc" } },
    ])(
        "hands off the retained $method action only once to the authenticated popup",
        async (action) => {
            const promise = PopupRelay.waitForPopupRelayResponse(
                5000,
                logger,
                { correlationId: "cid", state: REQUEST_STATE },
                window,
                perfClient,
                action,
                2
            );
            expect(window.postMessage).not.toHaveBeenCalled();
            signalReady();
            expect(window.postMessage).toHaveBeenCalledWith(
                {
                    type: POPUP_RELAY_REQUEST_TYPE,
                    id: CHANNEL_ID,
                    nonce: NONCE,
                    request: { id: CHANNEL_ID, ...action },
                },
                window.location.origin
            );
            signalReady();
            expect(window.postMessage).toHaveBeenCalledTimes(1);
            window.dispatchEvent(
                new MessageEvent("message", {
                    origin: window.location.origin,
                    source: window,
                    data: {
                        type: POPUP_RELAY_RESPONSE_TYPE,
                        id: CHANNEL_ID,
                        nonce: NONCE,
                        payload: "code=abc",
                    },
                })
            );
            await expect(promise).resolves.toBe("code=abc");
            signalReady();
            expect(window.postMessage).toHaveBeenCalledTimes(1);
        }
    );

    it.each<[string, MessageEventInit]>([
        ["origin", { origin: "https://untrusted.example" }],
        ["source", { source: {} as Window }],
        [
            "id",
            {
                data: {
                    type: POPUP_RELAY_READY_TYPE,
                    id: "other",
                    nonce: NONCE,
                },
            },
        ],
        ["nonce", { data: { type: POPUP_RELAY_READY_TYPE, id: CHANNEL_ID } }],
    ])(
        "does not disclose the action for a ready signal with an invalid %s",
        async (_label, overrides) => {
            jest.useFakeTimers();
            const promise = PopupRelay.waitForPopupRelayResponse(
                5000,
                logger,
                { correlationId: "cid", state: REQUEST_STATE },
                window,
                perfClient,
                GET_ACTION,
                2
            );
            window.dispatchEvent(
                new MessageEvent("message", {
                    origin: window.location.origin,
                    source: window,
                    data: {
                        type: POPUP_RELAY_READY_TYPE,
                        id: CHANNEL_ID,
                        nonce: NONCE,
                    },
                    ...overrides,
                })
            );
            expect(window.postMessage).not.toHaveBeenCalled();
            jest.advanceTimersByTime(5000);
            await expect(promise).rejects.toMatchObject({
                subError: "popup_relay_timeout",
            });
            signalReady();
            expect(window.postMessage).not.toHaveBeenCalled();
        }
    );

    it("ignores responses without a completed handoff and preserves relay sub-errors", async () => {
        const promise = PopupRelay.waitForPopupRelayResponse(
            5000,
            logger,
            { correlationId: "cid", state: REQUEST_STATE },
            window,
            perfClient,
            GET_ACTION,
            2
        );
        const respond = (nonce: string): void => {
            window.dispatchEvent(
                new MessageEvent("message", {
                    origin: window.location.origin,
                    source: window,
                    data: {
                        type: POPUP_RELAY_RESPONSE_TYPE,
                        id: CHANNEL_ID,
                        nonce,
                        error: "popup_relay_unsupported_flow",
                        subError: "popup_relay_untrusted_authority",
                    },
                })
            );
        };
        window.dispatchEvent(
            new MessageEvent("message", {
                origin: window.location.origin,
                source: window,
                data: {
                    type: POPUP_RELAY_RESPONSE_TYPE,
                    id: CHANNEL_ID,
                    nonce: NONCE,
                    payload: "unbound-response",
                    error: "",
                },
            })
        );
        signalReady();
        expect(window.postMessage).toHaveBeenCalledTimes(1);
        respond("old-document-nonce");
        respond(NONCE);
        await expect(promise).rejects.toMatchObject({
            errorCode: "popup_relay_unsupported_flow",
            subError: "popup_relay_untrusted_authority",
            correlationId: "cid",
        });
    });
});

describe("runPopupRelay", () => {
    let openSpy: jest.SpyInstance;
    let childPopup: {
        closed: boolean;
        close: jest.Mock;
        document?: Document;
        location?: { replace: jest.Mock };
    };
    let postMessage: jest.Mock;
    let openerStub: { postMessage: jest.Mock } | null;
    let request: unknown;

    function setReq(req: unknown): void {
        request = req;
        window.location.hash = `#id=${CHANNEL_ID}`;
    }

    beforeEach(() => {
        jest.useFakeTimers();
        childPopup = {
            closed: false,
            close: jest.fn(),
            location: { replace: jest.fn() },
        };
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
        window.dispatchEvent(new Event("pagehide"));
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
            "about:blank",
            "_blank",
            expect.any(String)
        );
        expect(window.location.hash).toEqual("");
        expect(childPopup.location?.replace).not.toHaveBeenCalled();
        deliverRequest(request);
        expect(childPopup.location?.replace).toHaveBeenCalledWith(AUTH_URL);
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
        expect(submitSpy).not.toHaveBeenCalled();
        deliverRequest(request);

        expect(openSpy).toHaveBeenCalledWith(
            "about:blank",
            "_blank",
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
    let replace: jest.Mock;
    let close: jest.Mock;
    let request: unknown;

    function setReq(req: unknown): void {
        request = req;
        window.location.hash = `#id=${CHANNEL_ID}`;
    }

    function runAndReceive(
        options?: Parameters<typeof runPopupRelay>[0]
    ): void {
        runPopupRelay(options);
        deliverRequest(request);
    }

    function expectError(subError: string): void {
        expect(window.opener.postMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                type: POPUP_RELAY_RESPONSE_TYPE,
                error: "popup_relay_unsupported_flow",
                subError,
            }),
            window.location.origin
        );
        expect(replace).not.toHaveBeenCalled();
        expect(submitSpy).not.toHaveBeenCalled();
        expect(close).toHaveBeenCalled();
    }

    function expectRejected(req: unknown, subError: string): void {
        setReq(req);
        runAndReceive();
        expectError(subError);
    }

    beforeEach(() => {
        jest.useFakeTimers();
        childDoc = document.implementation.createHTMLDocument("child");
        replace = jest.fn();
        close = jest.fn();
        openSpy = jest.spyOn(window, "open").mockReturnValue({
            closed: false,
            close,
            document: childDoc,
            location: { replace },
        } as unknown as Window);
        submitSpy = jest
            .spyOn(HTMLFormElement.prototype, "submit")
            .mockImplementation(() => {});
        const opener = { postMessage: jest.fn() };
        Object.defineProperty(window, "opener", {
            get: () => opener,
            configurable: true,
        });
    });

    afterEach(() => {
        window.dispatchEvent(new Event("pagehide"));
        jest.clearAllTimers();
        jest.useRealTimers();
        jest.restoreAllMocks();
        window.location.hash = "";
    });

    it.each<[string, MessageEventInit]>([
        ["origin", { origin: "https://untrusted.example" }],
        ["source", { source: {} as Window }],
        [
            "id",
            {
                data: {
                    type: POPUP_RELAY_REQUEST_TYPE,
                    id: "other",
                    nonce: NONCE,
                },
            },
        ],
        [
            "nonce",
            {
                data: {
                    type: POPUP_RELAY_REQUEST_TYPE,
                    id: CHANNEL_ID,
                    nonce: "old-nonce",
                },
            },
        ],
        [
            "type",
            {
                data: {
                    type: POPUP_RELAY_RESPONSE_TYPE,
                    id: CHANNEL_ID,
                    nonce: NONCE,
                },
            },
        ],
    ])(
        "never navigates for a request with an invalid %s",
        (_label, overrides) => {
            setReq({ id: CHANNEL_ID, ...GET_ACTION });
            runPopupRelay();
            deliverRequest(request, overrides);
            expect(replace).not.toHaveBeenCalled();
            expect(submitSpy).not.toHaveBeenCalled();
            deliverRequest(request);
            expect(replace).toHaveBeenCalledWith(AUTH_URL);
        }
    );

    it("ignores fragment actions, including same-origin POSTs, until the opener authorizes navigation", () => {
        setReq({ id: CHANNEL_ID, ...GET_ACTION });
        window.location.hash +=
            "&" +
            new URLSearchParams({
                req: JSON.stringify({
                    id: CHANNEL_ID,
                    method: "POST",
                    action: `${window.location.origin}/account`,
                    fields: { update: "untrusted" },
                }),
            }).toString();
        runPopupRelay();
        expect(replace).not.toHaveBeenCalled();
        expect(submitSpy).not.toHaveBeenCalled();
        deliverRequest(request);
        expect(replace).toHaveBeenCalledWith(AUTH_URL);
        expect(submitSpy).not.toHaveBeenCalled();
    });

    it("accepts only one navigation per relay document", () => {
        setReq({ id: CHANNEL_ID, ...GET_ACTION });
        runAndReceive();
        deliverRequest({
            id: CHANNEL_ID,
            method: "POST",
            action: ACTION_URL,
            fields: {},
        });
        expect(replace).toHaveBeenCalledTimes(1);
        expect(submitSpy).not.toHaveBeenCalled();
    });

    it("rejects a descriptor with a different id even in an authenticated envelope", () => {
        expectRejected(
            { id: "other", ...GET_ACTION },
            "popup_relay_bad_request"
        );
    });

    it("closes the reserved child and rejects late handoffs after a timeout", () => {
        setReq({ id: CHANNEL_ID, ...GET_ACTION });
        runPopupRelay({ timeoutMs: 1000 });
        jest.advanceTimersByTime(1000);
        expect(close).toHaveBeenCalledTimes(1);
        expect(window.opener.postMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                error: "timed_out",
                subError: "popup_relay_handshake_timeout",
            }),
            window.location.origin
        );
        deliverRequest(request);
        expect(replace).not.toHaveBeenCalled();
        expect(submitSpy).not.toHaveBeenCalled();
    });

    it("does not leave an active handoff or child when the relay document is left", () => {
        setReq({ id: CHANNEL_ID, ...GET_ACTION });
        runPopupRelay();
        window.dispatchEvent(new Event("pagehide"));
        deliverRequest(request);
        jest.advanceTimersByTime(300000);
        expect(replace).not.toHaveBeenCalled();
        expect(close).toHaveBeenCalledTimes(1);
        expect(window.opener.postMessage).toHaveBeenCalledTimes(1);
    });

    it("reports blocked popups without requesting a navigation descriptor", () => {
        setReq({ id: CHANNEL_ID, ...GET_ACTION });
        openSpy.mockReturnValue(null);
        runPopupRelay();
        expect(window.opener.postMessage).toHaveBeenCalledTimes(1);
        expect(window.opener.postMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                type: POPUP_RELAY_RESPONSE_TYPE,
                error: "popup_window_error",
            }),
            window.location.origin
        );
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

        it("rejects legacy fragment descriptors instead of using an unauthenticated fallback", () => {
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
            runAndReceive();
            expectError("popup_relay_unsafe_url");
            expect(window.location.hash).toEqual("");
        });
    });

    describe("allowedAuthorityOrigins", () => {
        /*
         * The option remains additive: authenticated requests without a pin
         * must keep working for any https authority.
         */
        it("navigates when options are omitted entirely", () => {
            setReq({ id: CHANNEL_ID, method: "GET", url: AUTH_URL });

            runAndReceive();
            expect(replace).toHaveBeenCalledWith(AUTH_URL);
        });

        it("navigates when other options are set but no origins are pinned", () => {
            setReq({ id: CHANNEL_ID, method: "GET", url: AUTH_URL });

            runAndReceive({ timeoutMs: 1000 });
            expect(replace).toHaveBeenCalledWith(AUTH_URL);
        });

        it("navigates when allowedAuthorityOrigins is explicitly undefined", () => {
            setReq({ id: CHANNEL_ID, method: "GET", url: AUTH_URL });

            runAndReceive({ allowedAuthorityOrigins: undefined });
            expect(replace).toHaveBeenCalledWith(AUTH_URL);
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

                runAndReceive();
                expect(replace).toHaveBeenCalledWith(url);
            }
        );

        it("allows a url on a pinned authority origin", () => {
            setReq({ id: CHANNEL_ID, method: "GET", url: AUTH_URL });

            runAndReceive({
                allowedAuthorityOrigins: ["https://login.microsoftonline.com"],
            });

            expect(replace).toHaveBeenCalledWith(AUTH_URL);
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

            runAndReceive({ allowedAuthorityOrigins: [pin] });
            expect(replace).toHaveBeenCalledWith(AUTH_URL);
        });

        it("rejects an https url on an origin that is not pinned", () => {
            setReq({
                id: CHANNEL_ID,
                method: "GET",
                url: "https://attacker.example.com/authorize",
            });

            runAndReceive({
                allowedAuthorityOrigins: ["https://login.microsoftonline.com"],
            });
            expectError("popup_relay_untrusted_authority");
        });

        it("honors an explicitly empty allow list as allow-nothing", () => {
            setReq({ id: CHANNEL_ID, method: "GET", url: AUTH_URL });

            runAndReceive({ allowedAuthorityOrigins: [] });
            expectError("popup_relay_untrusted_authority");
        });

        it("fails loudly on a malformed allow-list entry rather than dropping it", () => {
            setReq({ id: CHANNEL_ID, method: "GET", url: AUTH_URL });

            runAndReceive({
                allowedAuthorityOrigins: [
                    "https://login.microsoftonline.com",
                    "not-a-url",
                ],
            });
            expectError("popup_relay_invalid_allowed_origin");
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

            runAndReceive({ allowedAuthorityOrigins: [entry] });
            expectError("popup_relay_invalid_allowed_origin");
        });

        it("rejects an allowedAuthorityOrigins that is not an array", () => {
            setReq({ id: CHANNEL_ID, method: "GET", url: AUTH_URL });

            runAndReceive({
                // Guards JS callers, who are not held to the string[] type.
                allowedAuthorityOrigins:
                    "https://login.microsoftonline.com" as unknown as string[],
            });
            expectError("popup_relay_invalid_allowed_origin");
        });

        it("pins the POST form action as well as the GET url", () => {
            setReq({
                id: CHANNEL_ID,
                method: "POST",
                action: "https://attacker.example.com/authorize",
                fields: {},
            });

            runAndReceive({
                allowedAuthorityOrigins: ["https://login.microsoftonline.com"],
            });
            expectError("popup_relay_untrusted_authority");
        });
    });
});
