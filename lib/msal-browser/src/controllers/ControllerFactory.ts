/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { MetaOSOperatingContext } from "../operatingcontext/MetaOSOperatingContext";
import { StandardOperatingContext } from "../operatingcontext/StandardOperatingContext";
import { IController } from "./IController";
import { StandardController } from "./StandardController";
import { Logger } from "@azure/msal-common";
import { BrowserConfiguration, buildConfiguration, Configuration } from "../config/Configuration";
import { version, name } from "../packageMetadata";

export class ControllerFactory {
    
    protected config:BrowserConfiguration;
    protected logger:Logger;

    constructor(config:Configuration){
        this.config = buildConfiguration(config, true);
        this.logger = new Logger(this.config.system.loggerOptions, name, version);
    }

    async createController(): Promise<IController> {

        const standard = new StandardOperatingContext(this.logger, this.config);
        const metaOS = new MetaOSOperatingContext(this.logger, this.config);

        const operatingContexts = [
            standard.isAvailable(),
            metaOS.isAvailable()
        ];

        return Promise.all(operatingContexts).then(async ()=> {
            if(metaOS.getAvailable()){
                /*
                 * pull down metaos module
                 * create associated controller
                 */
                return await StandardController.createController(standard);
            }else if(standard.getAvailable()){
                return await StandardController.createController(standard);
            }
            
            throw new Error("No controller found.");
        });
    }

}
