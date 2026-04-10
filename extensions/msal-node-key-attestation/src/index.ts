/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// Re-export everything from the core package so callers can use a single
// import entry point.
export * from "@azure/msal-node-mtls-extensions";

// Override acquireMtlsMsiToken and makeMtlsMsiRequest with versions that
// automatically inject the path to the bundled MsalMtlsMsiHelper.exe binary.
export { acquireMtlsMsiToken, makeMtlsMsiRequest } from "./KeyAttestationClient.js";

// Expose getHelperPath so advanced callers can resolve the binary path directly.
export { getHelperPath } from "./KeyAttestationPaths.js";
