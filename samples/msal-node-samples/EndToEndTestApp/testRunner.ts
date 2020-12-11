import { runCLI } from "jest";
import { Config } from "@jest/types";
import yargs from "yargs";

interface Arguments {
    [x:string]: unknown;
    s: string;
    p: number | undefined;
}

// Command line argument config
const argv = yargs(process.argv).options({
    s: { type: "string", alias: "scenario"},
    p: { type: "number", alias: "port"}
}).argv;

const { readScenarioNames, readTestFiles } = require("./sampleUtils.js");
const { runSample } = require("./index.js");

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

async function runE2ETests() {
    let globalResults: Array<any> = [];
    // Using reduce instead of map to chain each test scenario execution in serial, initial accumulator is a dummy Promise
    const executionResult = await testScenarios.reduce((currentScenarioPromise: Promise<string>, nextScenario: string) => {
        const currentScenarioResults = currentScenarioPromise.then(() => {
            return testScenario(nextScenario);
        });
        globalResults = [...globalResults, currentScenarioResults];
        return currentScenarioResults;
    }, Promise.resolve(null));
    
    Promise.all(globalResults).then((globalResults: Array<any>) => {
        const globalFailedTests = globalResults.reduce((totalFailedTests: number, scenarioResults: any) => {
            return totalFailedTests + scenarioResults.results.numFailedTests;
        }, 0);
        // If any tests fail, exit with code 1 so CI/CD check fails
        process.exitCode = (globalFailedTests > 0) ? 1 : 0;
    });
}

async function testScenario (scenario: string): Promise<any> {
    const testCacheLocation = `${__dirname}/app/test/${scenario}/data/testCache.json`;
    const testLocation = `./app/test/${scenario}`;

    // TODO: Improve this check to cater to all CLI implementations
    if (scenario === 'device-code-aad') {
        const args = {
            _: [] as any[],
            $0: '',
            roots: [testLocation],
            testTimeout: 30000
        };
        // Run tests for current scenario
        return await runCLI(args as Config.Argv, [testLocation]).then(results => results); 
    }

    // Execute sample application under scenario configuration
    return await runSample(scenario, 3000, testCacheLocation).then(async (server: any) => {
        const args = {
            _: [] as any[],
            $0: '',
            roots: [testLocation],
            testTimeout: 30000
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

runE2ETests();
