/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// Constants
module.exports = {
    DEFAULT_PORT: 3000,
    APP_DIR: `${__dirname}/app`,
    MSAL_CLIENT_APP_CONFIG_PATH: `${__dirname}/app/msalClientAppConfig.js`,
    SCENARIOS_DIR: `${__dirname}/app/scenarios`,
    TESTS_DIR: `${__dirname}/app/test`,
    ROUTES_DIR: `${__dirname}/app/routes`,
    DEFAULT_SCENARIO_NAME: `silent-flow-aad`,
    DEFAULT_CACHE_LOCATION: `${__dirname}/data/cache.json`,
    WEB_APP_TYPE: "web",
    CLI_APP_TYPE: "cli",
    SCENARIO_EXTENSION: "json",
    TEST_EXTENSION: "spec.ts"
}
