/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @packageDocumentation
 * @module @azure/msal-browser/web-broker-bridge
 */

/**
 * Internal scaffolding for a `@azure/msal-browser/web-broker-bridge`
 * subpath export. The subpath is not yet wired in `package.json` / rollup,
 * so this module has no external callers and is intra-package only.
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
export {
    addLegacyRequestFields,
    addResourceField,
    normalizeIncomingRequest,
    normalizeResourceField,
} from "./adapter/CrossVersionRequestAdapter.js";
export type {
    CrossVersionRequest,
    CrossVersionRequestFields,
    LegacyRequestFields,
} from "./adapter/CrossVersionRequestAdapter.js";
