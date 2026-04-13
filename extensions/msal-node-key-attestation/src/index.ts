/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// Re-export everything from the core package so callers can use a single
// import entry point.
export * from "@azure/msal-node-mtls-extensions";

// Expose getHelperPath so advanced callers can resolve the binary path directly.
export { getHelperPath } from "./KeyAttestationPaths.js";
