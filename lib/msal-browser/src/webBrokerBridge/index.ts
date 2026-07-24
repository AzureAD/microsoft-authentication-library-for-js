/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @packageDocumentation
 * @module @azure/msal-browser/web-broker-bridge
 */

/**
 * Entrypoint for the web-broker-bridge subpath e.g.
 * `import { PendingRequestRegistry } from "@azure/msal-browser/web-broker-bridge"`.
 */

export type {
    IWebBrokerBridgeMessage,
    IWebBrokerBridgeResponse,
} from "./IWebBrokerBridgeMessage.js";
export type { WebBrokerBridgeError } from "./WebBrokerBridgeError.js";
export { WebBrokerBridgeErrorCode } from "./WebBrokerBridgeError.js";
export { toAuthError } from "./WebBrokerBridgeErrorMap.js";
export { PendingRequestRegistry } from "./PendingRequestRegistry.js";
export type { WebBrokerBridgeSendFn } from "./PendingRequestRegistry.js";
