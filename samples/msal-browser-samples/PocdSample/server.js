/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const express = require("express");
const morgan = require("morgan");
const fs = require("fs");
const https = require("https");
const path = require("path");

const credentials = {
    key: fs.readFileSync(path.join(__dirname, "key.pem")),
    cert: fs.readFileSync(path.join(__dirname, "cert.pem")),
};
const dist = path.join(__dirname, "dist");

const app = express();
app.use(morgan("dev"));
app.get("/redirect", (req, res) => {
    res.set("Cache-Control", "no-store");
    res.sendFile(path.join(dist, "redirect.html"));
});
app.use(express.static(dist));
https.createServer(credentials, app).listen(3001, () => {
    console.log("POCD app: https://localhost:3001");
});

const host = express();
host.use(morgan("dev"));
host.use(express.static(path.join(__dirname, "host")));
https.createServer(credentials, host).listen(3000, () => {
    console.log("Cross-origin launcher: https://localhost:3000");
});
