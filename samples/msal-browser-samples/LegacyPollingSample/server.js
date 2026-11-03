/*
 * Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
 * Minimal static-file server for the Legacy Polling Sample. Serves the
 * locally-built msal-browser bundle alongside the sample's static assets.
 */
const express = require("express");
const morgan = require("morgan");
const path = require("path");
const argv = require("yargs")
    .usage("Usage: $0 -p [PORT]")
    .alias("p", "port")
    .describe(
        "port",
        "(Optional) Legacy Polling Sample Port Number - default is 30664"
    )
    .strict().argv;

const DEFAULT_PORT = 30664;
const port = argv.p || DEFAULT_PORT;

const app = express();
app.use(morgan("dev"));

// Serve the locally-built msal-browser bundle.
app.use(
    "/lib",
    express.static(path.join(__dirname, "../../../lib/msal-browser/lib"))
);

// Serve the sample's own static assets.
app.use(express.static(path.join(__dirname, "app")));

app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(
        `Legacy Polling Sample listening on http://localhost:${port}\n` +
            `Open the page and click "Login (Legacy Polling)" to exercise the v4-style popup flow.`
    );
});
