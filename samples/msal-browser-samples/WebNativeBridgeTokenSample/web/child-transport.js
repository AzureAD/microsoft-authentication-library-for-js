(function () {
    "use strict";
    const hostOrigin = window.webPocConfig.hostOrigin;
    if (window.parent === window) throw new Error("embedded_child_required");
    const listeners = new Set();
    const queue = [];
    const pending = new Set();
    const nonce = crypto.randomUUID();
    let epoch;
    let attached = false;
    let disposed = false;
    let bootTimer;
    function deliver(payload) {
        pending.delete(payload.requestId);
        for (const listener of listeners) listener({ data: payload });
    }
    function send(data) {
        window.parent.postMessage({ channel: "web-native", epoch, nonce, ...data }, hostOrigin);
    }
    function receive(event) {
        if (disposed || event.source !== window.parent || event.origin !== hostOrigin || event.data?.channel !== "web-native") return;
        const message = event.data;
        if (message.kind === "challenge" && typeof message.epoch === "string") {
            if (epoch && epoch !== message.epoch) {
                window.nestedAppAuthBridge?.dispose();
                disposed = true;
                location.reload();
                return;
            }
            epoch = message.epoch;
            send({ kind: "hello" });
        } else if (message.epoch === epoch && message.nonce === nonce) {
            if (message.kind === "attached") {
                attached = true;
                clearTimeout(bootTimer);
                for (const payload of queue.splice(0)) send({ kind: "request", payload });
            } else if (message.kind === "response" && message.payload?.messageType === "NestedAppAuthResponse" && pending.has(message.payload.requestId)) deliver(message.payload);
        }
    }
    window.addEventListener("message", receive);
    window.chrome = window.chrome || {};
    window.chrome.webview = {
        addEventListener(type, listener) { if (type === "message") listeners.add(listener); },
        removeEventListener(type, listener) { if (type === "message") listeners.delete(listener); },
        postMessage(payload) {
            const request = JSON.parse(payload);
            if (request.messageType === "BridgePocReady") return;
            if (disposed || payload.length > 1_048_576 || pending.size >= 8) throw new Error("transport_unavailable");
            pending.add(request.requestId);
            if (attached) send({ kind: "request", payload }); else queue.push(payload);
        },
    };
    window.webPocTransport = {
        host: "webview2",
        postMessage: payload => window.chrome.webview.postMessage(payload),
        start(onMessage) {
            this.listener = event => onMessage(event.data);
            listeners.add(this.listener);
        },
        dispose() {
            if (disposed) return;
            clearTimeout(bootTimer);
            for (const requestId of pending) if (attached) send({ kind: "cancel", requestId });
            disposed = true;
            window.removeEventListener("message", receive);
            window.removeEventListener("pagehide", pagehide);
            listeners.clear();
            pending.clear();
            queue.length = 0;
        },
    };
    bootTimer = setTimeout(() => {
        if (attached || disposed) return;
        window.nestedAppAuthBridge?.dispose();
    }, 15000);
    function pagehide() {
        window.nestedAppAuthBridge?.dispose();
    }
    window.addEventListener("pagehide", pagehide, { once: true });
})();