import {
    NESTED_APP_AUTH_HANDLER_NAME,
    NestedAppAuthHost,
    NestedAppAuthTransport,
    NestedAppAuthWindow,
    WebView2Host,
    WebView2MessageEvent,
    WKWebViewMessageHandler,
} from "./types.js";

/** WKWebView transport backed by a native script message handler. @public */
export class WKWebViewTransport implements NestedAppAuthTransport {
    readonly host = "wkwebview" as const;
    private readonly messageHandler: WKWebViewMessageHandler;

    constructor(
        hostWindow: NestedAppAuthWindow,
        handlerName: string = NESTED_APP_AUTH_HANDLER_NAME
    ) {
        const messageHandler =
            hostWindow.webkit?.messageHandlers?.[handlerName];
        if (!messageHandler) {
            throw new Error(
                `WKWebView message handler "${handlerName}" is unavailable.`
            );
        }
        this.messageHandler = messageHandler;
    }

    postMessage(message: string): void {
        this.messageHandler.postMessage(message);
    }

    start(): void {}

    dispose(): void {}
}

/** WebView2 transport backed by window.chrome.webview. @public */
export class WebView2Transport implements NestedAppAuthTransport {
    readonly host = "webview2" as const;
    private readonly webview: WebView2Host;
    private listener?: (event: WebView2MessageEvent) => void;

    constructor(hostWindow: NestedAppAuthWindow) {
        const webview = hostWindow.chrome?.webview;
        if (!webview) {
            throw new Error("WebView2 host messaging is unavailable.");
        }
        this.webview = webview;
    }

    postMessage(message: string): void {
        this.webview.postMessage(message);
    }

    start(onMessage: (message: unknown) => void): void {
        this.dispose();
        this.listener = (event: WebView2MessageEvent): void => {
            onMessage(event.data);
        };
        this.webview.addEventListener("message", this.listener);
    }

    dispose(): void {
        if (this.listener) {
            this.webview.removeEventListener("message", this.listener);
            this.listener = undefined;
        }
    }
}

/** Creates the selected transport, detecting WKWebView before WebView2. @public */
export function createNestedAppAuthTransport(
    hostWindow: NestedAppAuthWindow,
    host: NestedAppAuthHost = "auto",
    handlerName: string = NESTED_APP_AUTH_HANDLER_NAME
): NestedAppAuthTransport {
    if (host === "wkwebview") {
        return new WKWebViewTransport(hostWindow, handlerName);
    }
    if (host === "webview2") {
        return new WebView2Transport(hostWindow);
    }
    if (hostWindow.webkit?.messageHandlers?.[handlerName]) {
        return new WKWebViewTransport(hostWindow, handlerName);
    }
    if (hostWindow.chrome?.webview) {
        return new WebView2Transport(hostWindow);
    }
    throw new Error(
        "No supported Nested App Authentication host transport was found."
    );
}
