/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { runCLI } from "jest";
import { Config } from "@jest/types";
import yargs from "yargs";

const { readScenarioNames, readScenarioType, readTestFiles } = require("./sampleUtils.js");
const { CLI_APP_TYPE } = require("./constants.js");
const { runSample } = require("./index.js");

interface Arguments {
    [x:string]: unknown;
    s: string;
    p: number | undefined;
}

// Command line argument config
const argv: Arguments = yargs(process.argv).options({
    s: { type: "string", alias: "scenario"},
    p: { type: "number", alias: "port"}
}).argv;



async function runE2ETests(testScenarios: Array<string>, currentScenarioIndex: number, totalScenarios: number, globalResults: Array<any>) {
    if (currentScenarioIndex < totalScenarios) {
        const currentScenario = testScenarios[currentScenarioIndex];
        const results = await testScenario(currentScenario);
        globalResults = [...globalResults, results];
        runE2ETests(testScenarios, currentScenarioIndex + 1, totalScenarios, globalResults);
    } else {
        const globalFailedTests = globalResults.reduce((totalFailedTests: number, scenarioResults: any) => {
            return totalFailedTests + scenarioResults.results.numFailedTests;
        }, 0);
        // If any tests fail, exit with code 1 so CI/CD check fails
        process.exitCode = (globalFailedTests > 0) ? 1 : 0;
    }
}

async function testScenario (scenario: string): Promise<any> {
    const testCacheLocation = `${__dirname}/app/test/${scenario}/data/testCache.json`;
    const testLocation = `./app/test/${scenario}`;

    // If the scenarion is a CLI application we expect the test suite to 
    // run the cli itself to best capture the output from the CLI
    if (readScenarioType(scenario) === CLI_APP_TYPE) {
        const args = {
            _: [] as any[],
            $0: '',
            roots: [testLocation],
            testTimeout: 30000
        };
        // Run tests for current scenario
        return await runCLI(args as Config.Argv, [testLocation]); 
    }

    // Execute sample application under scenario configuration
    return await runSample(scenario, 3000, testCacheLocation).then(async (server: any) => {
        const args = {
            _: [] as any[],
            $0: "",
            roots: [testLocation],
            testTimeout: 60000
        };
        // Run tests for current scenario
        return await runCLI(args as Config.Argv, [testLocation]).then(results => {
            if(server) {
                console.log(`Tests for ${scenario} done, closing server`);
                server.close();
            }
            return results;
        });
    });
}


// Execution script

const scenarios = readScenarioNames();
const tests = readTestFiles();

// Filter so only scenarios that have tests are executed
let testScenarios = scenarios.filter((scenario: string) => tests.includes(scenario));

const selectedScenario = argv.s;

if (selectedScenario) {
    testScenarios = testScenarios.filter((scenario: string) => scenario === selectedScenario);
    if (testScenarios.length === 1) {
        console.log(`Test Runner executed with scenario flag, executing scenario ${selectedScenario} only.`);
    } else if (testScenarios.length < 0) {
        console.log(`Selected test scenario ${selectedScenario} not found, aborting.`);
    }
}

runE2ETests(testScenarios, 0, testScenarios.length, []);
