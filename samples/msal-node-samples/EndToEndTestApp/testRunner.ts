import { runCLI } from "jest";

const { readScenarioNames, readTestFiles } = require("./sampleUtils.js");
const { runSample } = require("./index.js");

const scenarios = readScenarioNames();
const tests = readTestFiles();

// Filter so only scenarios that have tests are executed
const testScenarios = scenarios.filter((scenario: string) => tests.includes(scenario));

let testCacheLocation: string;

async function runE2ETests() {
  const globalResults = testScenarios.map(async (scenario: string) => {
      return testScenario(scenario);
  });

  Promise.all(globalResults).then(globalResults => {
      const globalFailedTests = globalResults.reduce((totalFailedTests: number, scenarioResults: any) => {
          return totalFailedTests + scenarioResults.results.numFailedTests;
      }, 0);
      // If any tests fail, exit with code 1 so CI/CD check fails
      process.exitCode = (globalFailedTests > 0) ? 1 : 0;
  })
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
