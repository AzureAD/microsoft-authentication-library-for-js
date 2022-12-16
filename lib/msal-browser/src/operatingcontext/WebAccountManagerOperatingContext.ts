/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BaseOperatingContext } from "./BaseOperatingContext.js";
import { NativeMessageHandler } from "../broker/nativeBroker/NativeMessageHandler";
import { BrowserConfiguration } from "../config/Configuration.js";

export class WebAccountManagerOperatingContext extends BaseOperatingContext {
    
    /*
     * TODO: Once we have determine the bundling code return here to specify the name of the bundle
     * containing the implementation for this operating context
     */
    static readonly MODULE_NAME: string = "";

    /**
     * Unique identifier for the operating context
     */
    static readonly ID: string = "WebAccountManagerOperatingContext";

    // Native Extension Provider
    protected messageHandler: NativeMessageHandler | undefined = undefined;

    /**
     * Return the module name.  Intended for use with import() to enable dynamic import
     * of the implementation associated with this operating context
     * @returns 
     */
    getModuleName(): string {
        return WebAccountManagerOperatingContext.MODULE_NAME;
    }
    /**
     * Returns the unique identifier for this operating context
     * @returns string
     */
    getId(): string {
        return WebAccountManagerOperatingContext.ID;
    }

    /**
     * Checks whether the operating context is available.  
     * In this case by creating the NativeMessageHandler for the WAM Bridge
     * If unable to create the NativeMessageHandler the assumption is that it's not available
     * @returns Promise<boolean> indicating whether this operating context is currently available.
     */
    async isAvailable(): Promise<boolean> {
        if(this.messageHandler === undefined){
            // Let's try and create it
            try {
                this.messageHandler = await NativeMessageHandler.createProvider(this.logger, this.config.system.nativeBrokerHandshakeTimeout);
            } catch (e) {
                this.logger.verbose(e);
                return false;
            }
        }

        return true;
    }

    /**
     * Since we need to create the NativeMessageHandler to determine if this operating context is available
     * We can re-use it if this operating context is chosen to handle requests.
     * @returns NativeMessageHandler | undefined
     */
    getMessageHandler():NativeMessageHandler|undefined{
        return this.messageHandler;
    }

}
