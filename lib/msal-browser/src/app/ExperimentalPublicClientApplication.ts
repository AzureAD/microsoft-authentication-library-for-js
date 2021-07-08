/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Configuration } from "../config/Configuration";
import { IPublicClientApplication } from "./IPublicClientApplication";
import { PublicClientApplication } from "./PublicClientApplication";
import { ExperimentalBrowserConfiguration, ExperimentalConfiguration, buildExperimentalConfiguration } from "../config/ExperimentalConfiguration";

export class ExperimentalPublicClientApplication extends PublicClientApplication implements IPublicClientApplication {

    protected experimentalConfig: ExperimentalBrowserConfiguration;

    constructor(configuration: Configuration, experimentalConfiguration: ExperimentalConfiguration) {
        super(configuration);
        this.experimentalConfig = buildExperimentalConfiguration(experimentalConfiguration);
    }
}
