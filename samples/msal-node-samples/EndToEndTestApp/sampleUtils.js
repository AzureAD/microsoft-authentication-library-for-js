/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const fs = require("fs");
const Constants = require("./constants");

// Check if scenario name already has extension or add it
function generateScenarioFileName(scenario) {
    return (!scenario || scenario.split(".").pop() === Constants.SCENARIO_EXTENSION) ? scenario : `${scenario}.${Constants.SCENARIO_EXTENSION}`;
}

function readScenarios() {
    return fs.readdirSync(Constants.SCENARIOS_DIR, { withFileTypes: true }).filter(function(file) {
        const fileExtension = file.name.split(".").pop();
        const isScenarioConfigFile = fileExtension === Constants.SCENARIO_EXTENSION;
        return isScenarioConfigFile && file.name !== "scenario-template.json";
    }).map(function(file) {
        return file.name;
    });
}

function readScenarioType(scenario) {
    const scenarios = readScenarios();
    const scenarioFileName = generateScenarioFileName(scenario);

    if (scenarios.includes(scenarioFileName)) {
       const scenarioConfig = require(`${Constants.SCENARIOS_DIR}/${scenarioFileName}`);
       return scenarioConfig.sample.appType; 
    }

    console.error(`ERROR: Scenario ${scenario} not found.\n`);
    return null;
}

module.exports = {
    readScenarios: readScenarios,
    readScenarioType: readScenarioType,
    readScenarioNames: function () {
        return readScenarios().map(function (scenarioName) {
            return scenarioName.split(".")[0];
        });
    },
    readTestFiles: function () {
        return fs.readdirSync(Constants.TESTS_DIR, { withFileTypes: true }).filter(function(file) {
            return file.isDirectory() && file.name !== "data" && file.name !== "screenshots";
        }).map(function(file) {
            return file.name;
        });
    },
    buildRoutesPath: function (flow) {
        return `${Constants.ROUTES_DIR}/${flow}`;
    },
    // Validates that the input sample exists or defaults to auth-code
    validateScenario: function (scenarios, scenario) {
        const scenarioFileName = generateScenarioFileName(scenario);
        const isSample = scenarios.includes(scenarioFileName);
        if (scenario && isSample) {
            console.log(`Starting scenario ${scenario}`);
            return scenario;
        } else {
            if (scenario && !isSample) {
                console.warn(`WARNING: Scenario ${scenario} not found.\n`);
            }
            console.log(`Running default scenario: ${Constants.DEFAULT_SCENARIO_NAME}.\n`);
            return Constants.DEFAULT_SCENARIO_NAME;
        }
    },
    extractRuntimeOptions: function (runtimeOptionString) {
        try { 
            if (runtimeOptionString) return JSON.parse(runtimeOptionString);
        } catch (e) {
            console.warn(`[Warning]: Runtime option string was not a valid javascript object string\n${e}`);
        }

        return {};
    }
}