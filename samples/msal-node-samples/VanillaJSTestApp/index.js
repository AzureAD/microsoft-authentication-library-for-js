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
    .describe('scenario', '(Optional) Name of scenario to run')
    .describe('port', '(Optional) Port Number - default is 3000')
    .strict()
    .argv;

// Constants
const DEFAULT_PORT = 3000;
const APP_DIR = `${__dirname}/app`;
const SCENARIOS_DIR = `${APP_DIR}/scenarios`;
const ROUTES_DIR = `${APP_DIR}/routes`;
const  DEFAULT_SCENARIO_NAME = `silent-flow-aad`;
const WEB_APP_TYPE = "web";
const CLI_APP_TYPE = "cli";

// Loads the names of the application directories containing the sample code
function readScenarios() {
    return fs.readdirSync(SCENARIOS_DIR, { withFileTypes: true }).filter(function(file) {
        return file.isDirectory() && file.name !== "sample_template";
    }).map(function(file) {
        return file.name;
    });
}

// Validates that the input sample exists or defaults to auth-code
function validateScenario(scenarios, scenario) {
    const isSample = scenarios.includes(scenario);
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
function initializeWebApp(scenarioPath, inputPort, clientApplication, routesPath) {
    // Initialize MSAL Token Cache
    const msalTokenCache = clientApplication.getTokenCache();

    // Initialize express app
    const app = express();
    const port = (inputPort) ? inputPort : DEFAULT_PORT;

    msalTokenCache.readFromPersistence().then(() => {
        app.listen(port, () => console.log(`Msal Node Sample App listening on port ${port}!`));
        // Load sample routes
        const sampleRoutes = require(routesPath);
        sampleRoutes(app, clientApplication, msalTokenCache, scenarioPath);
    })
}

// Executes CLI script with scenario configuration when scenario is of CLI app type
function executeCliApp(scenarioPath, clientApplication, routesPath) {
    require(routesPath)(scenarioPath, clientApplication);
}

// Main script

// Sample selection
const scenarios = readScenarios();
const scenario = validateScenario(scenarios, argv.scenario);
const scenarioPath = `${SCENARIOS_DIR}/${scenario}`;

// App type selection
const scenarioConfig = require(`${scenarioPath}/scenarioConfig.json`);

// Build client application
const clientApplication = require(`${APP_DIR}/clientApplication`)(scenarioPath, scenarioConfig.clientType);

const routesPath = buildRoutesPath(scenarioConfig.flow);

switch(scenarioConfig.appType) {
    case WEB_APP_TYPE:
        initializeWebApp(scenarioPath, argv.port, clientApplication, routesPath);
        break;
    case CLI_APP_TYPE:
        executeCliApp(scenarioPath, clientApplication, routesPath);
        break;
    default:
        console.log("Unsupported appType: ", scenarioConfig.appType, clientApplication);
        break;
}