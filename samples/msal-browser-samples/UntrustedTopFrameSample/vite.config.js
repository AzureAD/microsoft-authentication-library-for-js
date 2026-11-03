/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 *
 * Vite multi-page build for the trusted app served on port 3001. Each HTML entry
 * pulls in only the MSAL export it needs, so Vite tree-shakes a clear separation
 * between MSAL instantiation and the popup-relay / redirect-bridge helpers:
 *
 *   - index.html    → embedded.js  → @azure/msal-browser                (PublicClientApplication)
 *   - relay.html    → relay.js     → @azure/msal-browser/popup-relay    (runPopupRelay)
 *   - redirect.html → redirect.js  → @azure/msal-browser/redirect-bridge (broadcastResponseToMainFrame)
 *
 * `@azure/msal-browser` resolves to the locally-built workspace package via its
 * `exports` map, so the build validates local library changes. Output goes to
 * `dist/`, which the Express app server (server.js) serves on the trusted origin.
 */
import { defineConfig } from "vite";
import { resolve } from "path";
import { fileURLToPath } from "url";

const dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
    root: "app",
    base: "/",
    build: {
        outDir: "../dist",
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: resolve(dirname, "app/index.html"),
                relay: resolve(dirname, "app/relay.html"),
                redirect: resolve(dirname, "app/redirect.html"),
            },
        },
    },
});
