const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { execFileSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const fixture = path.join(root, "temp", "consumer");
fs.rmSync(fixture, { recursive: true, force: true });
fs.mkdirSync(fixture, { recursive: true });
const npmCli =
    process.env.npm_execpath ||
    path.join(
        path.dirname(process.execPath),
        "node_modules",
        "npm",
        "bin",
        "npm-cli.js"
    );
function runNpm(args, cwd) {
    return execFileSync(process.execPath, [npmCli, ...args], {
        cwd,
        encoding: "utf8",
    });
}
const packed = JSON.parse(
    runNpm(
        ["pack", "--ignore-scripts", "--json", "--pack-destination", fixture],
        root
    )
)[0];
const tarball = path.join(fixture, packed.filename);
fs.writeFileSync(
    path.join(fixture, "package.json"),
    JSON.stringify({ private: true, type: "module" })
);
console.log(
    runNpm(
        [
            "install",
            tarball,
            "--ignore-scripts",
            "--no-audit",
            "--no-fund",
            "--package-lock=false",
        ],
        fixture
    )
);
const installed = path.join(fixture, "node_modules", "@azure", "msal-bridge");
const pkg = JSON.parse(
    fs.readFileSync(path.join(installed, "package.json"), "utf8")
);
const expected = [
    "DefaultNestedAppAuthBridge",
    "NESTED_APP_AUTH_HANDLER_NAME",
    "WKWebViewTransport",
    "WebView2Transport",
    "createNestedAppAuthTransport",
    "installNestedAppAuthBridge",
].sort();
execFileSync(
    process.execPath,
    [
        "--input-type=module",
        "-e",
        `
    import assert from 'node:assert/strict';
    import { createRequire } from 'node:module';
    const esm = await import('@azure/msal-bridge');
    const require = createRequire(import.meta.url);
    const cjs = require('@azure/msal-bridge');
    assert.deepEqual(Object.keys(esm).sort(), ${JSON.stringify(expected)});
    assert.deepEqual(Object.keys(cjs).sort(), Object.keys(esm).sort());
    assert.equal(globalThis.window, undefined);
    for (const api of [esm, cjs]) {
        const messages = [];
        const hostWindow = { webkit: { messageHandlers: { nestedAppAuth: { postMessage(message) { messages.push(message); } } } } };
        const bridge = api.installNestedAppAuthBridge({ window: hostWindow });
        bridge.postMessage('opaque');
        assert.deepEqual(messages, ['opaque']);
        bridge.dispose();
    }
    globalThis.window = { webkit: { messageHandlers: { nestedAppAuth: { postMessage() {} } } } };
    const auto = await import('@azure/msal-bridge/auto');
    assert.equal(auto.nestedAppAuthBridge, window.nestedAppAuthBridge);
    assert.deepEqual(Object.keys(auto).sort(), [...Object.keys(esm), 'nestedAppAuthBridge'].sort());
    auto.nestedAppAuthBridge.dispose();
`,
    ],
    { cwd: fixture, stdio: "inherit" }
);

const typeNames = [
    "NestedAppAuthBridge",
    "NestedAppAuthBridgeOptions",
    "NestedAppAuthHost",
    "NestedAppAuthMessageEvent",
    "NestedAppAuthMessageListener",
    "NestedAppAuthTransport",
    "NestedAppAuthWindow",
    "WebView2Host",
    "WebView2MessageEvent",
    "WKWebViewMessageHandler",
];
const fixtureSource = `
import { DefaultNestedAppAuthBridge, installNestedAppAuthBridge, createNestedAppAuthTransport, WebView2Transport, WKWebViewTransport, NESTED_APP_AUTH_HANDLER_NAME } from '@azure/msal-bridge';
import type { ${typeNames.join(", ")} } from '@azure/msal-bridge';
export type PublicTypes = [${typeNames.join(", ")}];
declare const hostWindow: NestedAppAuthWindow;
const transport: NestedAppAuthTransport = createNestedAppAuthTransport(hostWindow);
const bridge: NestedAppAuthBridge = installNestedAppAuthBridge({ window: hostWindow, transport });
bridge.addEventListener('message', (event: NestedAppAuthMessageEvent) => event.data.toUpperCase());
new DefaultNestedAppAuthBridge(transport, 1024);
new WebView2Transport(hostWindow);
new WKWebViewTransport(hostWindow, NESTED_APP_AUTH_HANDLER_NAME);
`;
fs.writeFileSync(
    path.join(fixture, "consumer.mts"),
    fixtureSource +
        "\nimport { nestedAppAuthBridge } from '@azure/msal-bridge/auto';\n nestedAppAuthBridge.dispose();\n"
);
fs.writeFileSync(path.join(fixture, "consumer.cts"), fixtureSource);
fs.writeFileSync(
    path.join(fixture, "tsconfig.json"),
    JSON.stringify({
        compilerOptions: {
            target: "ES2020",
            module: "NodeNext",
            moduleResolution: "NodeNext",
            strict: true,
            noEmit: true,
            types: [],
            lib: ["ES2020", "DOM"],
        },
        files: ["consumer.mts", "consumer.cts"],
    })
);
execFileSync(
    process.execPath,
    [
        require.resolve("typescript/bin/tsc"),
        "-p",
        path.join(fixture, "tsconfig.json"),
    ],
    { cwd: fixture, stdio: "inherit" }
);

const browserPath = path.join(installed, pkg.browser);
for (const host of ["webview2", "wkwebview"]) {
    const messages = [];
    const listeners = new Set();
    const window =
        host === "wkwebview"
            ? {
                  webkit: {
                      messageHandlers: {
                          nestedAppAuth: {
                              postMessage(message) {
                                  messages.push(message);
                              },
                          },
                      },
                  },
              }
            : {
                  chrome: {
                      webview: {
                          postMessage(message) {
                              messages.push(message);
                          },
                          addEventListener(name, listener) {
                              listeners.add(listener);
                          },
                          removeEventListener(name, listener) {
                              listeners.delete(listener);
                          },
                      },
                  },
              };
    const sandbox = vm.createContext({ window });
    vm.runInContext(fs.readFileSync(browserPath, "utf8"), sandbox);
    const bridge = window.nestedAppAuthBridge;
    assert.equal(bridge.host, host);
    assert.equal(sandbox.NestedAppAuthBridge.nestedAppAuthBridge, bridge);
    const received = [];
    bridge.addEventListener("message", (event) => received.push(event.data));
    bridge.postMessage("opaque");
    if (host === "wkwebview") bridge.__dispatch({ ok: true });
    else for (const listener of listeners) listener({ data: { ok: true } });
    assert.deepEqual(messages, ["opaque"]);
    assert.deepEqual(received, [JSON.stringify({ ok: true })]);
    bridge.dispose();
    assert.equal(listeners.size, 0);
}
const requiredArtifacts = [
    "dist/index.mjs",
    "dist/index.cjs",
    "dist/autoInstall.mjs",
    "dist/msal-bridge.js",
    "types/index.d.ts",
    "types/index.d.cts",
    "types/autoInstall.d.ts",
];
const packedNames = new Set(packed.files.map((file) => file.path));
for (const file of requiredArtifacts)
    assert.ok(packedNames.has(file), `Missing packed artifact: ${file}`);
for (const file of requiredArtifacts.filter((file) =>
    file.startsWith("dist/")
)) {
    assert.ok(
        packedNames.has(`${file}.map`),
        `Missing artifact source map: ${file}`
    );
}
for (const file of packed.files.filter((file) => file.path.endsWith(".map"))) {
    const fullPath = path.join(installed, file.path);
    const map = JSON.parse(fs.readFileSync(fullPath, "utf8"));
    assert.equal(map.version, 3);
    assert.ok(map.mappings.length > 0);
    assert.ok(map.sources.length > 0);
    for (const source of map.sources)
        assert.ok(
            fs.existsSync(path.resolve(path.dirname(fullPath), source)),
            `Missing mapped source: ${source}`
        );
    if (file.path.startsWith("dist/")) {
        assert.equal(map.sourcesContent.length, map.sources.length);
        assert.ok(
            map.sourcesContent.every(
                (source) => typeof source === "string" && source.length > 0
            )
        );
    }
}
assert.deepEqual(pkg.sideEffects, [
    "./dist/autoInstall.mjs",
    "./dist/msal-bridge.js",
]);
assert.ok(
    !packed.files.some((file) =>
        /(?:^|\/)(test|temp|node_modules)\//.test(file.path)
    )
);
assert.ok(
    !packed.files.some((file) =>
        /src\/(protocol\.js|nativeBridge\.js|index\.cjs|index\.mjs)$/.test(
            file.path
        )
    )
);
console.log(
    `PASS: packed ESM/CJS/auto imports, NodeNext types, both browser hosts, source maps (${packed.files.length} files; ${packed.filename})`
);

async function checkTreeShaking() {
    const { rollup } = require("rollup");
    const { nodeResolve } = require("@rollup/plugin-node-resolve");
    for (const entry of ["@azure/msal-bridge", "@azure/msal-bridge/auto"]) {
        const input = path.join(fixture, "side-effect-only.mjs");
        fs.writeFileSync(
            input,
            `import ${JSON.stringify(
                entry
            )};\nglobalThis.consumerLoaded = true;\n`
        );
        const bundle = await rollup({
            input,
            plugins: [nodeResolve()],
            onwarn(warning) {
                throw new Error(warning.message);
            },
        });
        try {
            const { output } = await bundle.generate({ format: "iife" });
            assert.equal(output.length, 1);
            const chunk = output[0];
            const retained = Object.keys(chunk.modules).filter((file) =>
                file.startsWith(installed)
            );
            assert.equal(
                retained.length > 0,
                entry.endsWith("/auto"),
                `Unexpected tree shaking for ${entry}`
            );
            for (const host of ["webview2", "wkwebview"]) {
                const messages = [];
                const listeners = new Set();
                const window =
                    host === "wkwebview"
                        ? {
                              webkit: {
                                  messageHandlers: {
                                      nestedAppAuth: {
                                          postMessage(message) {
                                              messages.push(message);
                                          },
                                      },
                                  },
                              },
                          }
                        : {
                              chrome: {
                                  webview: {
                                      postMessage(message) {
                                          messages.push(message);
                                      },
                                      addEventListener(name, listener) {
                                          listeners.add(listener);
                                      },
                                      removeEventListener(name, listener) {
                                          listeners.delete(listener);
                                      },
                                  },
                              },
                          };
                const sandbox = vm.createContext({ window });
                vm.runInContext(chunk.code, sandbox);
                assert.equal(sandbox.consumerLoaded, true);
                if (entry.endsWith("/auto")) {
                    const bridge = window.nestedAppAuthBridge;
                    assert.ok(
                        bridge,
                        "Side-effect-only /auto import must install the bridge"
                    );
                    assert.equal(bridge.host, host);
                    bridge.postMessage("bundled");
                    assert.deepEqual(messages, ["bundled"]);
                    bridge.dispose();
                } else {
                    assert.equal(window.nestedAppAuthBridge, undefined);
                }
                assert.equal(listeners.size, 0);
            }
        } finally {
            await bundle.close();
        }
    }
    console.log(
        "PASS: installed-package Rollup tree shaking drops root and retains side-effect-only /auto for both hosts"
    );
}

checkTreeShaking().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
