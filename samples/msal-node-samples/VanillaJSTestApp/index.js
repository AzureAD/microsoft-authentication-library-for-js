/*
*  Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
*  See LICENSE in the source repository root for complete license information.
*/
const express = require('express');
const fs = require('fs');
const path = require('path');
const argv = require('yargs')
    .usage('Usage: $0 -scenario [scenario-name] -p [PORT]')
    .alias('p', 'port')
    .alias('s', 'scenario')
    .describe('scenario', '(Optional) Name of scenario to run - default is silent-flow-aad')
    .describe('port', '(Optional) Port Number - default is 3000')
    .strict()
    .argv;

// Constants
const DEFAULT_PORT = 3000;
const APP_DIR = `${__dirname}/app`;
const MSAL_CLIENT_APP_CONFIG_PATH = `${APP_DIR}/msalClientAppConfig.js`;
const SCENARIOS_DIR = `${APP_DIR}/scenarios`;
const ROUTES_DIR = `${APP_DIR}/routes`;
const DEFAULT_SCENARIO_NAME = `silent-flow-aad`;
const WEB_APP_TYPE = "web";
const CLI_APP_TYPE = "cli";
const SCENARIO_EXTENSION = "json";

// Loads the names of the application directories containing the sample code
function readScenarios() {
    return fs.readdirSync(SCENARIOS_DIR, { withFileTypes: true }).filter(function(file) {
        const fileExtension = file.name.split(".").pop();
        const isScenarioConfigFile = fileExtension === SCENARIO_EXTENSION;
        return isScenarioConfigFile && file.name !== "scenario-template.json";
    }).map(function(file) {
        return file.name;
    });
}

// Check if scenario name already has extension or add it
function generateScenarioFileName(scenario) {
     return (!scenario || scenario.split(".").pop() === SCENARIO_EXTENSION) ? scenario : `${scenario}.${SCENARIO_EXTENSION}`;
}

// Validates that the input sample exists or defaults to auth-code
function validateScenario(scenarios, scenario) {
    const scenarioFileName = generateScenarioFileName(scenario);
    const isSample = scenarios.includes(scenarioFileName);
    if (scenario && isSample) {
        console.log(`Starting scenario ${scenario}`);
        return scenario;
    } else {
        if (scenario && !isSample) {
            console.warn(`WARNING: Scenario ${scenario} not found.\n`);
        }
        console.log(`Running default scenario: ${DEFAULT_SCENARIO_NAME}.\n`);
        return DEFAULT_SCENARIO_NAME;
    }
}

function buildRoutesPath(flow) {
    return `${ROUTES_DIR}/${flow}`;
}

// Initializes express server with scenario routes when scenario is web app type
function initializeWebApp(scenarioConfig, inputPort, clientApplication, routesPath) {
    // Initialize MSAL Token Cache
    const msalTokenCache = clientApplication.getTokenCache();

    // Initialize express app
    const app = express();
    const port = (inputPort) ? inputPort : DEFAULT_PORT;

    msalTokenCache.readFromPersistence().then(() => {
        app.listen(port, () => console.log(`Msal Node Sample App listening on port ${port}!`));
        // Load sample routes
        const sampleRoutes = require(routesPath);
        sampleRoutes(app, clientApplication, msalTokenCache, scenarioConfig);
    })
}

// Executes CLI script with scenario configuration when scenario is of CLI app type
function executeCliApp(scenarioConfig, clientApplication, routesPath) {
    require(routesPath)(scenarioConfig, clientApplication);
}

// Main script

// Sample selection
const scenarios = readScenarios();
const scenario = validateScenario(scenarios, argv.scenario);
const scenarioPath = `${SCENARIOS_DIR}/${scenario}`;

// Load all configuration for scenario
const scenarioConfig = require(scenarioPath);

// Build client application
const clientApplication = require(MSAL_CLIENT_APP_CONFIG_PATH)(scenarioConfig);

// Get sample metaconfig
const sampleConfig = scenarioConfig.sample;

const routesPath = buildRoutesPath(sampleConfig.flow);

switch(sampleConfig.appType) {
    case WEB_APP_TYPE:
        initializeWebApp(scenarioConfig, argv.port, clientApplication, routesPath);
        break;
    case CLI_APP_TYPE:
        executeCliApp(scenarioConfig, clientApplication, routesPath);
        break;
    default:
        console.log("Unsupported appType: ", sampleConfig.appType, clientApplication);
        break;
}