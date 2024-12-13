/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BaseOperatingContext } from "@azure/msal-browser";
import { NativeAuthConfiguration } from "../configuration/NativeAuthConfiguration.js";

export class NativeAuthOperatingContext extends BaseOperatingContext {
    private static readonly MODULE_NAME: string = "";
    private static readonly ID: string = "NativeAuthOperatingContext";

    constructor(configuration: NativeAuthConfiguration) {
        super(configuration);
    }

    getModuleName(): string {
        return NativeAuthOperatingContext.MODULE_NAME;
    }

    getId(): string {
        return NativeAuthOperatingContext.ID;
    }

    getNativeAuthConfig(): NativeAuthConfiguration {
        return this.config as NativeAuthConfiguration;
    }

    async initialize(): Promise<boolean> {
        this.available = typeof window !== "undefined";
        return this.available;
    }
}
