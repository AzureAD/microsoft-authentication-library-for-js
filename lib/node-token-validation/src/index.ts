/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @packageDocumentation
 * @module @azure/node-token-validation
 */

export { TokenValidator } from "./api/TokenValidator";

// Configuration Options
export { Configuration, TokenValidationOptions, SystemOptions, TokenValidationConfiguration } from "./config/Configuration";
export { TokenValidationParameters } from "./config/TokenValidationParameters";

// Request and Response Objects
export { TokenValidationResponse } from "./response/TokenValidationResponse";
export { TokenValidationMiddlewareResponse } from "./response/TokenValidationMiddlewareResponse";
export { ExpressRequest, ExpressResponse, ExpressNextFunction } from "./request/MiddlewareTypes";

// Errors
export { ValidationConfigurationError, ValidationConfigurationErrorMessage } from "./error/ValidationConfigurationError";
export { ValidationError, ValidationErrorMessage } from "./error/ValidationError";

export {
    // Logger
    Logger,
    LogLevel,
    ProtocolMode
} from "@azure/msal-common";
