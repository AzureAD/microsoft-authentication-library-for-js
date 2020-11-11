/*
*  Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
*  See LICENSE in the source repository root for complete license information.
*/
const Constants = require('./constants');
const SampleUtils = require('./sampleUtils');
const initializeWebApp = require('./app');
const { DEFAULT_CACHE_LOCATION } = require('./constants');

// Command line argument configuration
const argv = require('yargs')
    .usage('Usage: $0 -scenario [scenario-name] -p [PORT]')
    .alias('p', 'port')
    .alias('s', 'scenario')
    .describe('scenario', '(Optional) Name of scenario to run - default is silent-flow-aad')
    .describe('port', '(Optional) Port Number - default is 3000')
    .strict()
    .argv;

// Main Script
async function runSample(scenario, port, cacheLocation) {
    // Sample selection
    const scenarios = SampleUtils.readScenarios();
    scenario = SampleUtils.validateScenario(scenarios, scenario);
    const scenarioPath = `${Constants.SCENARIOS_DIR}/${scenario}`;

    // Load all configuration for scenario
    const scenarioConfig = require(scenarioPath);

    // Build client application
    const clientApplication = await require(Constants.MSAL_CLIENT_APP_CONFIG_PATH)(scenarioConfig, cacheLocation);

    // Get sample metaconfig
    const sampleConfig = scenarioConfig.sample;

    // Get app routes file path
    const routesPath = SampleUtils.buildRoutesPath(sampleConfig.flow);

    switch(sampleConfig.appType) {
        case Constants.WEB_APP_TYPE:
            // Web app types use an express app
            port = port || Constants.DEFAULT_PORT;
            return initializeWebApp(scenarioConfig, port, clientApplication, routesPath);
        case Constants.CLI_APP_TYPE:
            // CLI app types only need to be required to execute
            require(routesPath)(scenarioConfig, clientApplication);
            break;
        default:
            console.log("Unsupported appType: ", sampleConfig.appType, clientApplication);
            break;
    }
}

// If the app is executed manually, the $0 argument in argv will correspond to this index.js file
if(argv.$0 === "index.js") {
    console.log("End to End Test App is being executed manually.");
    runSample(argv.s, argv.p, DEFAULT_CACHE_LOCATION);
} else {
    // Whenever argv.$0 is not index.js, it means it was required and executed in an external script
    console.log("End to End Test App is being executed from an external script.");
}

// Export the main script as a function so it can be executed programatically to enable E2E Test automation
module.exports = { 
    runSample: runSample
};