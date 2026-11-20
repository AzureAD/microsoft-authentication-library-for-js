/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Default native message-handler name used by WKWebView hosts.
 *
 * @public
 */
export const NESTED_APP_AUTH_HANDLER_NAME = "nestedAppAuth";

/**
 * Native webview host selected for bridge messaging.
 *
 * @public
 */
export type NestedAppAuthHost = "auto" | "wkwebview" | "webview2";

/**
 * Message event delivered to Nested App Authentication listeners.
 *
 * @public
 */
export interface NestedAppAuthMessageEvent {
    data: string;
}

/**
 * Listener invoked when the native host returns a message.
 *
 * @public
 */
export type NestedAppAuthMessageListener = (
    event: NestedAppAuthMessageEvent
) => void;

/**
 * Browser-facing bridge contract consumed by MSAL Browser.
 *
 * @public
 */
export interface NestedAppAuthBridge {
    readonly host: Exclude<NestedAppAuthHost, "auto">;
    postMessage(message: string): void;
    addEventListener(
        name: "message",
        callback: NestedAppAuthMessageListener
    ): void;
    removeEventListener(
        name: "message",
        callback: NestedAppAuthMessageListener
    ): void;
    __dispatch(message: unknown): void;
    dispose(): void;
}

/**
 * Host-specific transport used by the browser-facing bridge.
 *
 * @public
 */
export interface NestedAppAuthTransport {
    readonly host: Exclude<NestedAppAuthHost, "auto">;
    postMessage(message: string): void;
    start(onMessage: (message: unknown) => void): void;
    dispose(): void;
}

/**
 * Options used to install the global Nested App Authentication bridge.
 *
 * @public
 */
export interface NestedAppAuthBridgeOptions {
    host?: NestedAppAuthHost;
    handlerName?: string;
    maxMessageLength?: number;
    replaceExisting?: boolean;
    transport?: NestedAppAuthTransport;
    window?: Window;
}

/**
 * WKWebView native script message handler.
 *
 * @public
 */
export interface WKWebViewMessageHandler {
    postMessage(message: string): void;
}

/**
 * Message event emitted by a WebView2 host.
 *
 * @public
 */
export interface WebView2MessageEvent {
    data: unknown;
}

/**
 * WebView2 host messaging surface.
 *
 * @public
 */
export interface WebView2Host {
    postMessage(message: string): void;
    addEventListener(
        name: "message",
        callback: (event: WebView2MessageEvent) => void
    ): void;
    removeEventListener(
        name: "message",
        callback: (event: WebView2MessageEvent) => void
    ): void;
}

/**
 * Window shape exposed by supported native webview hosts.
 *
 * @public
 */
export type NestedAppAuthWindow = Window & {
    nestedAppAuthBridge?: NestedAppAuthBridge;
    webkit?: {
        messageHandlers?: Record<string, WKWebViewMessageHandler | undefined>;
    };
    chrome?: {
        webview?: WebView2Host;
    };
};
