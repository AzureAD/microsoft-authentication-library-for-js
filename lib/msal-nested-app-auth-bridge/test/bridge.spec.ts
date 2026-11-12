/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    installNestedAppAuthBridge,
    NestedAppAuthMessageListener,
    NestedAppAuthWindow,
} from "../src/index.js";

describe("installNestedAppAuthBridge", () => {
    const hostWindow = window as NestedAppAuthWindow;

    afterEach(() => {
        hostWindow.nestedAppAuthBridge?.dispose();
        delete hostWindow.nestedAppAuthBridge;
        delete hostWindow.webkit;
        delete hostWindow.chrome;
    });

    it("posts requests and dispatches responses through WKWebView", () => {
        const postMessage = jest.fn();
        hostWindow.webkit = {
            messageHandlers: {
                nestedAppAuth: { postMessage },
            },
        };

        const bridge = installNestedAppAuthBridge();
        const listener =
            jest.fn() as jest.MockedFunction<NestedAppAuthMessageListener>;
        bridge.addEventListener("message", listener);

        bridge.postMessage('{"method":"GetInitContext"}');
        bridge.__dispatch({ requestId: "request-1", success: true });

        expect(bridge.host).toBe("wkwebview");
        expect(postMessage).toHaveBeenCalledWith('{"method":"GetInitContext"}');
        expect(listener).toHaveBeenCalledWith({
            data: '{"requestId":"request-1","success":true}',
        });
    });

    it("posts requests and receives responses through WebView2", () => {
        const postMessage = jest.fn();
        let hostListener: ((event: { data: unknown }) => void) | undefined;
        const removeEventListener = jest.fn();
        hostWindow.chrome = {
            webview: {
                postMessage,
                addEventListener: (_name, listener) => {
                    hostListener = listener;
                },
                removeEventListener,
            },
        };

        const bridge = installNestedAppAuthBridge();
        const listener =
            jest.fn() as jest.MockedFunction<NestedAppAuthMessageListener>;
        bridge.addEventListener("message", listener);

        bridge.postMessage('{"method":"GetToken"}');
        hostListener?.({ data: '{"requestId":"request-2","success":true}' });

        expect(bridge.host).toBe("webview2");
        expect(postMessage).toHaveBeenCalledWith('{"method":"GetToken"}');
        expect(listener).toHaveBeenCalledWith({
            data: '{"requestId":"request-2","success":true}',
        });

        bridge.dispose();
        expect(removeEventListener).toHaveBeenCalled();
    });

    it("returns the installed bridge unless replacement is requested", () => {
        hostWindow.webkit = {
            messageHandlers: {
                nestedAppAuth: { postMessage: jest.fn() },
            },
        };

        const first = installNestedAppAuthBridge();
        const second = installNestedAppAuthBridge();

        expect(second).toBe(first);
    });

    it("rejects unsupported hosts", () => {
        expect(() => installNestedAppAuthBridge()).toThrow(
            "No supported Nested App Authentication host transport was found."
        );
    });

    it("enforces the configured message size limit", () => {
        hostWindow.webkit = {
            messageHandlers: {
                nestedAppAuth: { postMessage: jest.fn() },
            },
        };

        const bridge = installNestedAppAuthBridge({ maxMessageLength: 4 });

        expect(() => bridge.postMessage("12345")).toThrow(
            "Nested App Authentication message exceeds 4 characters."
        );
    });
});
