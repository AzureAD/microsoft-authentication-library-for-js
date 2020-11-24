/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { LogLevel, ILoggerCallback } from "@azure/msal-browser";

export type MsalLoggerConfiguration = {
    loggerCallback: ILoggerCallback,
    logLevel: LogLevel,
    piiLoggingEnabled: boolean
};
