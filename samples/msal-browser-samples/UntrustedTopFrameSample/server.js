/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 *
 * Untrusted Top Frame Sample server.
 *
 * Demonstrates token acquisition for a trusted MSAL.js app embedded via a
 * cross-origin iframe inside an UNTRUSTED host. The app just calls
 * `acquireTokenPopup` with `auth.popupRelayUri` configured; MSAL brokers the
 * interactive step through a top-level page on the app's own origin (so it works
 * despite storage partitioning + COOP). Tokens land in MSAL's own cache
 * and no token ever crosses the window boundary.
 *
 * Two Express servers model the cross-origin relationship:
 *   - Host app (port 3000): an untrusted third-party page that embeds the app in
 *                           an iframe. It never touches auth.
 *   - App      (port 3001): the trusted first-party origin. Serves the embedded
 *                           iframe app, the top-level popup-relay page, and the
 *                           OAuth redirect page.
 */
const express = require("express");
const morgan = require("morgan");
const fs = require("fs");
const https = require("https");
const path = require("path");
const argv = require("yargs")
    .usage("Usage: $0 --host-port [PORT] --app-port [PORT] [--https]")
    .option("host-port", {
        describe: "Untrusted host app port",
        default: 3000,
        type: "number",
    })
    .option("app-port", {
        describe: "Trusted app port",
        default: 3001,
        type: "number",
    })
    .option("https", {
        alias: "h",
        describe: "Serve over HTTPS (run `npm run generate:certs` first)",
        type: "boolean",
        default: false,
    })
    .strict().argv;

const HOST_PORT = argv["host-port"];
const APP_PORT = argv["app-port"];
const USE_HTTPS = argv.https;
const SCHEME = USE_HTTPS ? "https" : "http";

// With --https/-h, serve over TLS using a gitignored localhost dev cert
// (generate it with `npm run generate:certs`). A secure context mirrors how the
// cross-origin iframe + relay popup behave in production.
const credentials = USE_HTTPS
    ? {
          key: fs.readFileSync(path.join(__dirname, "key.pem")),
          cert: fs.readFileSync(path.join(__dirname, "cert.pem")),
      }
    : null;

// Starts an Express app over HTTP or HTTPS depending on the --https flag.
function listen(app, port, label) {
    const onReady = () => {
        // eslint-disable-next-line no-console
        console.log(`${label} listening on ${SCHEME}://localhost:${port}...`);
    };
    if (USE_HTTPS) {
        https.createServer(credentials, app).listen(port, onReady);
    } else {
        app.listen(port, onReady);
    }
}

// ============================================================
// App (trusted) server (port 3001)
// ============================================================
const appServer = express();
appServer.use(morgan("dev"));

// Serve the Vite-built app (run `vite build` first; `npm start` does this). Each
// page bundles only the MSAL export it imports:
//   index.html    -> @azure/msal-browser                (PublicClientApplication)
//   relay.html    -> @azure/msal-browser/popup-relay     (runPopupRelay)
//   redirect.html -> @azure/msal-browser/redirect-bridge (broadcastResponseToMainFrame)
const DIST_DIR = path.join(__dirname, "dist");

// The top-level popup-relay page — opened by the iframe with window.open(). Must
// be served at a stable path on the trusted origin.
appServer.get("/relay", (req, res) => {
    res.sendFile(path.join(DIST_DIR, "relay.html"));
});

// The OAuth redirect page. This is the registered SPA redirect URI; the relay
// page's child popup lands here with ?code=... It lives on the trusted origin
// only.
appServer.get("/redirect", (req, res) => {
    res.sendFile(path.join(DIST_DIR, "redirect.html"));
});

// App static assets (index.html plus the hashed JS/CSS bundles under assets/).
appServer.use(express.static(DIST_DIR));

listen(appServer, APP_PORT, "App (trusted)");

// ============================================================
// Untrusted host server (port 3000)
// ============================================================
const hostApp = express();
hostApp.use(morgan("dev"));

// The host only ever serves its own page. It has no auth routes, no MSAL, and
// no knowledge of tokens — it simply embeds the trusted iframe.
hostApp.use(express.static(path.join(__dirname, "host")));

listen(hostApp, HOST_PORT, "Untrusted host");
// eslint-disable-next-line no-console
console.log(
    `Open ${SCHEME}://localhost:${HOST_PORT} and use the embedded frame to sign in.`
);
