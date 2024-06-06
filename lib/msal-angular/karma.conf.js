/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

module.exports = function (config) {
    config.set({
        basePath: "",
        frameworks: ["jasmine", "@angular-devkit/build-angular"],
        plugins: [
            require("karma-jasmine"),
            require("karma-chrome-launcher"),
            require("karma-jasmine-html-reporter"),
            require("karma-coverage-istanbul-reporter"),
            require("@angular-devkit/build-angular/plugins/karma")
        ],
        client: {
            jasmine: {
                failSpecWithNoExpectations: true
            },
            clearContext: false // leave Jasmine Spec Runner output visible in browser
        },
        coverageIstanbulReporter: {
            dir: require("path").join(__dirname, "./coverage"),
            reports: ["html", "lcovonly", "text-summary"],
            "report-config":{
                lcovonly: {
                    projectRoot: "../.."
                }
            },
            fixWebpackSourcePaths: true
        },
        reporters: ["progress", "kjhtml", "coverage-istanbul"],
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: true,
        browsers: ["ChromeHeadless"],
        singleRun: true,
        restartOnFileChange: true,
        concurrency: 1
    });
};
