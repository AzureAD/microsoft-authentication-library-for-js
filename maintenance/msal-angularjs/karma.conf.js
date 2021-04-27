/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const path = require("path");
const process = require("process");
process.env.CHROME_BIN = require("puppeteer").executablePath();

module.exports = function (config) {
    config.set({
        frameworks: ["jasmine-ajax", "jasmine"],
        files: [
            "node_modules/angular/angular.js",
            "node_modules/angular-mocks/angular-mocks.js",
            "node_modules/angular-route/angular-route.js",
            "node_modules/angular-resource/angular-resource.js",
            "node_modules/angular-ui-router/release/angular-ui-router.js",
            "dist/msal-angular.js",
            "tests/testApp.js",
            "tests/angularModuleSpec.js"
        ],

        plugins: [
            "karma-phantomjs-launcher",
            "karma-jasmine",
            "karma-jasmine-ajax",
            "karma-chrome-launcher"
        ],
        // start these browsers
        browsers: ["Chrome", "ChromeHeadless", "ChromeHeadlessNoSandbox"],
        reporters: ["progress", "coverage"],
        preprocessors: {
            "dist/*.js": ["coverage"],
        },
        coverageReporter: {
            dir: "coverage/",
            reporters: [
                { type: "html", subdir: "report-html" },
                { type: "cobertura", subdir: ".", file: "cobertura.xml" }
            ]
        },
        customLaunchers: {
            ChromeHeadlessNoSandbox: {
                base: "ChromeHeadless",
                flags: [
                    "--no-sandbox",
                    "--disable-gpu",
                    // Without a remote debugging port, Google Chrome exits immediately.
                    "--remote-debugging-port=9222",
                ]
            }
        },
        logLevel: config.LOG_INFO,
        singleRun: true
    });
};
