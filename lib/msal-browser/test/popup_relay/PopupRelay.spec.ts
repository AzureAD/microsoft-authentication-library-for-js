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
            REQUEST_STATE,
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
            REQUEST_STATE,
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
