/*
*  Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
*  See LICENSE in the source repository root for complete license information.
*/
const Constants = require('./constants');
const SampleUtils = require('./sampleUtils');
const initializeWebApp = require('./app');

// Command line argument configuration
const argv = require('yargs')
    .usage('Usage: $0 -scenario [scenario-name] -p [PORT]')
    .alias('p', 'port')
    .alias('s', 'scenario')
    .describe('scenario', '(Optional) Name of scenario to run - default is silent-flow-aad')
    .describe('port', '(Optional) Port Number - default is 3000')
    .strict()
    .argv;


// Sample selection
const scenarios = SampleUtils.readScenarios();
const scenario = SampleUtils.validateScenario(scenarios, argv.scenario);
const scenarioPath = `${Constants.SCENARIOS_DIR}/${scenario}`;

// Load all configuration for scenario
const scenarioConfig = require(scenarioPath);

// Build client application
const clientApplication = require(Constants.MSAL_CLIENT_APP_CONFIG_PATH)(scenarioConfig);

// Get sample metaconfig
const sampleConfig = scenarioConfig.sample;

// Get app routes file path
const routesPath = SampleUtils.buildRoutesPath(sampleConfig.flow);

switch(sampleConfig.appType) {
    case Constants.WEB_APP_TYPE:
        // Web app types use an express app
        const port = (argv.port) ? argv.port : Constants.DEFAULT_PORT;
        initializeWebApp(scenarioConfig, port, clientApplication, routesPath);
        break;
    case Constants.CLI_APP_TYPE:
        // CLI app types only need to be required to execute
        require(routesPath)(scenarioConfig, clientApplication);
        break;
    default:
        console.log("Unsupported appType: ", sampleConfig.appType, clientApplication);
        break;
}