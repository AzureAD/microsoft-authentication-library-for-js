/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger } from "@azure/msal-common";
import { BrowserConfiguration } from "../config/Configuration";

/**
 * Base class for operating context
 * Operating contexts are contexts in which MSAL.js is being run
 * More than one operating context may be available at a time
 * It's important from a logging and telemetry point of view for us to be able to identify the operating context.
 * For example: Some operating contexts will pre-cache tokens impacting performance telemetry
 */
export abstract class BaseOperatingContext {

    protected logger:Logger;
    protected config:BrowserConfiguration;

    constructor(logger:Logger, config:BrowserConfiguration){
        this.logger = logger;
        this.config = config;
    }

    /**
     * returns the name of the module containing the API controller associated with this operating context
     */
    abstract getModuleName():string;

    /**
     * returns the string identifier of this operating context
     */
    abstract getId():string;

    /**
     * returns a boolean indicating whether this operating context is present
     */
    abstract isAvailable():Promise<boolean>;

    /**
     * Return the MSAL config
     * @returns BrowserConfiguration
     */
    getConfig():BrowserConfiguration {
        return this.config;
    }

    /**
     * Returns the MSAL Logger
     * @returns Logger
     */
    getLogger():Logger {
        return this.logger;
    }

}
