/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger } from "@azure/msal-common";
import { BrowserConfiguration } from "../config/Configuration";

export class ControllerFactory {
    
    protected config:BrowserConfiguration;
    protected logger:Logger;

    constructor(logger:Logger, config:BrowserConfiguration){
        this.config = config;
        this.logger = logger;
    }

    createController():IController{

    }

}
