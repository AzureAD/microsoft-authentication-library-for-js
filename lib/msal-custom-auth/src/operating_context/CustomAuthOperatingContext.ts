/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BaseOperatingContext } from "@azure/msal-browser";
import { CustomAuthConfiguration } from "../configuration/CustomAuthConfiguration.js";

export class CustomAuthOperatingContext extends BaseOperatingContext {
    private static readonly MODULE_NAME: string = "";
    private static readonly ID: string = "CustomAuthOperatingContext";

    constructor(configuration: CustomAuthConfiguration) {
        super(configuration);
    }

    getModuleName(): string {
        return CustomAuthOperatingContext.MODULE_NAME;
    }

    getId(): string {
        return CustomAuthOperatingContext.ID;
    }

    getCustomAuthConfig(): CustomAuthConfiguration {
        return this.config as CustomAuthConfiguration;
    }

    async initialize(): Promise<boolean> {
        this.available = typeof window !== "undefined";
        return this.available;
    }
}
