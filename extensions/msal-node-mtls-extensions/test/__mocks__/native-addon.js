/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 *
 * Mock for the C++ N-API addon (msal_mtls_win.node).
 * Returns jest mock functions for all addon exports.
 * Actual mock implementations are set up per-test in NativeHelper.spec.ts.
 */

module.exports = {
    createOrOpenKey: jest.fn(),
    closeKey: jest.fn(),
    getPublicKeyDer: jest.fn(),
    signHashPss: jest.fn(),
    getAttestationToken: jest.fn(),
    makeMtlsRequest: jest.fn(),
};
