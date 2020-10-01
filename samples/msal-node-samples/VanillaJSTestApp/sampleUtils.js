/*
*  Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
*  See LICENSE in the source repository root for complete license information.
*/
const fs = require('fs');
const Constants = require('./constants');

// Check if scenario name already has extension or add it
function generateScenarioFileName(scenario) {
    return (!scenario || scenario.split(".").pop() === Constants.SCENARIO_EXTENSION) ? scenario : `${scenario}.${Constants.SCENARIO_EXTENSION}`;
}

module.exports = {
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
    
    // Loads the names of the application directories containing the sample code
    readScenarios: function () {
        return fs.readdirSync(Constants.SCENARIOS_DIR, { withFileTypes: true }).filter(function(file) {
            const fileExtension = file.name.split(".").pop();
            const isScenarioConfigFile = fileExtension === Constants.SCENARIO_EXTENSION;
            return isScenarioConfigFile && file.name !== "scenario-template.json";
        }).map(function(file) {
            return file.name;
        });
    },

    buildRoutesPath: function (flow) {
        return `${Constants.ROUTES_DIR}/${flow}`;
    }
}