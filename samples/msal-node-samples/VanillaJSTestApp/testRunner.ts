import { runCLI } from "jest";

const { readScenarioNames, readTestFiles } = require("./sampleUtils.js");
const { runSample } = require("./index.js");

const scenarios = readScenarioNames();
const tests = readTestFiles();

// Filter so only scenarios that have tests are executed
const testScenarios = scenarios.filter((scenario: string) => tests.includes(scenario));

let testCacheLocation: string;

async function runE2ETests() {
  testScenarios.forEach((scenario: string) => testScenario(scenario));
}

async function testScenario (scenario: string): Promise<any> {
    testCacheLocation = `${__dirname}/app/test/${scenario}/data/testCache.json`;
    // Execute sample application under scenario configuration
    return await runSample(scenario, 3000, testCacheLocation).then((server: any) => {
        const args = {
            _: [] as any[],
            $0: '',
            testTimeout: 30000
        };
        // Run tests for current scenario
        return runCLI(args as any, [`./app/test/${scenario}`]).then(results => {
            if(server) {
                console.log(`Tests for ${scenario} done, closing server`);
                server.close();
            }
            return results;
        });
    });
}

runE2ETests();
