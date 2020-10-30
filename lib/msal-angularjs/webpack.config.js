/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const path = require("path");
const UnminifiedWebpackPlugin = require("unminified-webpack-plugin");

module.exports = {
    entry: "./lib/msal-angular.js",
    output: {
        filename: "msal-angular.min.js",
        path: path.resolve(__dirname, "dist")
    },
    plugins: [
        new UnminifiedWebpackPlugin()
    ]
};
