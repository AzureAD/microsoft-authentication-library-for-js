const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const vm = require("node:vm");
const { createHash } = require("node:crypto");
const api = require("../dist/index.cjs");

function webviewWindow() {
    const sent = [];
    const listeners = new Set();
    const webview = {
        postMessage(message) {
            sent.push(message);
        },
        addEventListener(name, listener) {
            assert.equal(name, "message");
            listeners.add(listener);
        },
        removeEventListener(name, listener) {
            assert.equal(name, "message");
            listeners.delete(listener);
        },
    };
    return {
        window: { chrome: { webview } },
        sent,
        listeners,
        receive(data) {
            for (const listener of [...listeners]) listener({ data });
        },
    };
}

test("exact public runtime exports, no legacy API", () => {
    assert.deepEqual(
        Object.keys(api).sort(),
        [
            "DefaultNestedAppAuthBridge",
            "NESTED_APP_AUTH_HANDLER_NAME",
            "WKWebViewTransport",
            "WebView2Transport",
            "createNestedAppAuthTransport",
            "installNestedAppAuthBridge",
        ].sort()
    );
    assert.equal(api.NESTED_APP_AUTH_HANDLER_NAME, "nestedAppAuth");
});

test("public declarations match the pinned PR8928 API report", () => {
    const report = readFileSync(
        require.resolve("../apiReview/msal-bridge.api.md"),
        "utf8"
    );
    const normalized = report
        .replace(/^## API Report File.*$/m, "")
        .replace(/\s/g, "");
    assert.equal(
        createHash("sha256").update(normalized).digest("hex"),
        "d2b0f3e634f17ddeef9ac7a89bcafb0ff00258042b494b4280aeaa9b07f76d4a"
    );
});

test("WebView2 opaque outgoing strings and serialized incoming objects", () => {
    const context = webviewWindow();
    const bridge = api.installNestedAppAuthBridge({ window: context.window });
    const received = [];
    bridge.addEventListener("message", (event) => received.push(event.data));
    for (const message of [
        "not-json",
        "{",
        "",
        "null",
        "[1]",
        '{"unrecognized":true}',
    ]) {
        bridge.postMessage(message);
        context.receive(message);
    }
    assert.deepEqual(received, context.sent);
    context.receive({ any: "object" });
    context.receive(null);
    assert.deepEqual(received.slice(-2), [
        JSON.stringify({ any: "object" }),
        "null",
    ]);
    assert.equal(bridge.host, "webview2");
    bridge.dispose();
    assert.equal(context.listeners.size, 0);
});

test("auto detection prefers WKWebView and supports custom handler names and explicit hosts", () => {
    const context = webviewWindow();
    const sent = [];
    context.window.webkit = {
        messageHandlers: {
            custom: {
                postMessage(message) {
                    sent.push(message);
                },
            },
        },
    };
    const transport = api.createNestedAppAuthTransport(
        context.window,
        "auto",
        "custom"
    );
    assert.equal(transport.host, "wkwebview");
    const bridge = api.installNestedAppAuthBridge({
        window: context.window,
        handlerName: "custom",
    });
    const received = [];
    bridge.addEventListener("message", (event) => received.push(event.data));
    bridge.postMessage("opaque");
    bridge.__dispatch({ response: true });
    assert.deepEqual(sent, ["opaque"]);
    assert.deepEqual(received, [JSON.stringify({ response: true })]);
    assert.equal(
        api.createNestedAppAuthTransport(context.window, "webview2").host,
        "webview2"
    );
    assert.throws(
        () => new api.WKWebViewTransport(context.window),
        /nestedAppAuth.*unavailable/
    );
    assert.throws(
        () => new api.WebView2Transport({}),
        /WebView2 host messaging is unavailable/
    );
    assert.throws(() => api.createNestedAppAuthTransport({}), /No supported/);
    context.window.webkit.messageHandlers.nestedAppAuth =
        context.window.webkit.messageHandlers.custom;
    assert.equal(
        api.createNestedAppAuthTransport(context.window).host,
        "wkwebview"
    );
    bridge.dispose();
});

test("injected transport takes precedence over detection and preserves method receiver", () => {
    const transport = {
        host: "wkwebview",
        sent: [],
        disposed: 0,
        start(callback) {
            this.receive = callback;
        },
        postMessage(message) {
            this.sent.push(message);
        },
        dispose() {
            this.disposed++;
        },
    };
    const bridge = api.installNestedAppAuthBridge({ window: {}, transport });
    const received = [];
    bridge.addEventListener("message", (event) => received.push(event.data));
    bridge.postMessage("hello");
    transport.receive("world");
    assert.deepEqual(transport.sent, ["hello"]);
    assert.deepEqual(received, ["world"]);
    bridge.dispose();
    bridge.dispose();
    assert.equal(transport.disposed, 1);
});

test("listeners are deduplicated, removable, snapshotted, and exception-isolated", () => {
    const context = webviewWindow();
    const bridge = api.installNestedAppAuthBridge({ window: context.window });
    const received = [];
    const listener = (event) => received.push(event.data);
    bridge.addEventListener("message", () => {
        throw new Error("subscriber failure");
    });
    bridge.addEventListener("message", listener);
    bridge.addEventListener("message", listener);
    const last = () => received.push("last");
    bridge.addEventListener("message", () =>
        bridge.removeEventListener("message", last)
    );
    bridge.addEventListener("message", last);
    context.receive("one");
    context.receive("two");
    bridge.removeEventListener("message", listener);
    context.receive("three");
    assert.deepEqual(received, ["one", "last", "two"]);
    bridge.dispose();
});

test("dispatch isolates mutable message events between listeners", () => {
    const context = webviewWindow();
    const bridge = api.installNestedAppAuthBridge({ window: context.window });
    const events = [];
    const received = [];
    bridge.addEventListener("message", (event) => {
        events.push(event);
        event.data = "mutated";
    });
    bridge.addEventListener("message", (event) => {
        events.push(event);
        received.push(event.data);
    });
    try {
        context.receive({ response: "original" });
        assert.deepEqual(received, [JSON.stringify({ response: "original" })]);
        assert.notEqual(events[0], events[1]);
    } finally {
        bridge.dispose();
    }
});

test("disposal during dispatch preserves the current listener snapshot only", () => {
    const context = webviewWindow();
    const bridge = api.installNestedAppAuthBridge({ window: context.window });
    const received = [];
    bridge.addEventListener("message", (event) => {
        received.push(`disposing:${event.data}`);
        bridge.dispose();
    });
    bridge.addEventListener("message", (event) =>
        received.push(`last:${event.data}`)
    );
    context.receive("one");
    context.receive("two");
    assert.deepEqual(received, ["disposing:one", "last:one"]);
    assert.equal(context.listeners.size, 0);
    assert.throws(() => bridge.__dispatch("three"), /disposed/);
    bridge.dispose();
});

test("size defaults, boundaries, serialization errors, and invalid limits match baseline", () => {
    const context = webviewWindow();
    for (const limit of [
        0,
        -1,
        1.5,
        NaN,
        Infinity,
        Number.MAX_SAFE_INTEGER + 1,
    ]) {
        assert.throws(
            () =>
                new api.DefaultNestedAppAuthBridge(
                    api.createNestedAppAuthTransport(context.window),
                    limit
                ),
            /positive integer/
        );
    }
    assert.equal(context.listeners.size, 0);
    const bridge = api.installNestedAppAuthBridge({
        window: context.window,
        maxMessageLength: 4,
    });
    bridge.postMessage("1234");
    assert.throws(() => bridge.postMessage("12345"), /exceeds 4 characters/);
    assert.throws(() => bridge.__dispatch("12345"), /exceeds 4 characters/);
    for (const message of [undefined, () => {}, Symbol("x")]) {
        assert.throws(() => bridge.__dispatch(message), /not serializable/);
    }
    const cyclic = {};
    cyclic.self = cyclic;
    assert.throws(() => bridge.__dispatch(cyclic), TypeError);
    assert.throws(() => bridge.__dispatch(1n), TypeError);
    bridge.dispose();
    const defaults = api.installNestedAppAuthBridge({ window: context.window });
    defaults.postMessage("x".repeat(1024 * 1024));
    assert.throws(
        () => defaults.postMessage("x".repeat(1024 * 1024 + 1)),
        /exceeds 1048576 characters/
    );
    defaults.dispose();
});

test("reuse, replacement prevalidation failures, successful replacement, and disposed reinstall", () => {
    const context = webviewWindow();
    const first = api.installNestedAppAuthBridge({ window: context.window });
    assert.equal(
        api.installNestedAppAuthBridge({
            window: context.window,
            host: "wkwebview",
        }),
        first
    );
    assert.throws(
        () =>
            api.installNestedAppAuthBridge({
                window: context.window,
                replaceExisting: true,
                host: "wkwebview",
            }),
        /unavailable/
    );
    assert.throws(
        () =>
            api.installNestedAppAuthBridge({
                window: context.window,
                replaceExisting: true,
                maxMessageLength: 0,
            }),
        /positive integer/
    );
    assert.equal(context.window.nestedAppAuthBridge, first);
    assert.equal(context.listeners.size, 1);
    first.postMessage("still active");
    const second = api.installNestedAppAuthBridge({
        window: context.window,
        replaceExisting: true,
    });
    assert.notEqual(second, first);
    assert.equal(context.listeners.size, 1);
    assert.throws(() => first.postMessage("x"), /disposed/);
    assert.throws(() => first.__dispatch("x"), /disposed/);
    assert.throws(
        () => first.addEventListener("message", () => {}),
        /disposed/
    );
    second.dispose();
    assert.equal(context.window.nestedAppAuthBridge, second);
    const third = api.installNestedAppAuthBridge({ window: context.window });
    assert.notEqual(third, second);
    third.postMessage("fresh");
    third.dispose();
});

test("replacement startup failure disposes the previous bridge and permits a fresh installation", () => {
    const context = webviewWindow();
    const first = api.installNestedAppAuthBridge({ window: context.window });
    assert.throws(
        () =>
            api.installNestedAppAuthBridge({
                window: context.window,
                replaceExisting: true,
                transport: {
                    host: "wkwebview",
                    start() {
                        throw new Error("start failure");
                    },
                    dispose() {},
                    postMessage() {},
                },
            }),
        /start failure/
    );
    assert.equal(context.listeners.size, 0);
    assert.throws(() => first.postMessage("request"), /disposed/);
    const replacement = api.installNestedAppAuthBridge({
        window: context.window,
    });
    replacement.postMessage("request");
    assert.deepEqual(context.sent, ["request"]);
    replacement.dispose();
});

test("replacement can reuse the same injected transport and still deliver responses", () => {
    const context = webviewWindow();
    const transport = new api.WebView2Transport(context.window);
    const first = api.installNestedAppAuthBridge({
        window: context.window,
        transport,
    });
    const second = api.installNestedAppAuthBridge({
        window: context.window,
        transport,
        replaceExisting: true,
    });
    const received = [];
    second.addEventListener("message", (event) => received.push(event.data));
    context.receive("response");
    second.postMessage("request");
    assert.deepEqual(received, ["response"]);
    assert.deepEqual(context.sent, ["request"]);
    assert.equal(context.listeners.size, 1);
    assert.throws(() => first.postMessage("request"), /disposed/);
    second.dispose();
    assert.equal(context.listeners.size, 0);
});

test("WebView2 transport restart removes the previous subscription", () => {
    const context = webviewWindow();
    const transport = new api.WebView2Transport(context.window);
    const received = [];
    transport.start((message) => received.push(`old:${message}`));
    transport.start((message) => received.push(`new:${message}`));
    assert.equal(context.listeners.size, 1);
    context.receive("value");
    assert.deepEqual(received, ["new:value"]);
    transport.dispose();
    transport.dispose();
    assert.equal(context.listeners.size, 0);
});

test("browser IIFE exposes NestedAppAuthBridge and automatically installs for either host", () => {
    const source = readFileSync(
        require.resolve("../dist/msal-bridge.js"),
        "utf8"
    );
    for (const host of ["webview2", "wkwebview"]) {
        const context = webviewWindow();
        if (host === "wkwebview")
            context.window.webkit = {
                messageHandlers: { nestedAppAuth: { postMessage() {} } },
            };
        const sandbox = vm.createContext({ window: context.window });
        vm.runInContext(source, sandbox);
        assert.equal(
            sandbox.NestedAppAuthBridge.nestedAppAuthBridge,
            context.window.nestedAppAuthBridge
        );
        assert.equal(context.window.nestedAppAuthBridge.host, host);
        assert.deepEqual(
            Object.keys(sandbox.NestedAppAuthBridge).sort(),
            [...Object.keys(api), "nestedAppAuthBridge"].sort()
        );
        context.window.nestedAppAuthBridge.dispose();
    }
});
