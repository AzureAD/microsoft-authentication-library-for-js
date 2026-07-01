/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export type ClientAssertionConfig = {
    clientId: string;
    tokenEndpoint?: string;
    fmiPath?: string;
};

export type ClientAssertionCallback = (
    config: ClientAssertionConfig
) => Promise<string>;

/**
 * Client Assertion credential for Confidential Clients
 */
export type ClientAssertion = {
    assertion: string | ClientAssertionCallback;
    assertionType: string;
};

/**
 * Certificate used to bind a mutual-TLS (mTLS) Proof-of-Possession token request.
 * Only public material (x5c + SHA-256 thumbprint) is ever surfaced back to callers; the private
 * key is used solely to establish the outbound TLS connection and is never returned.
 */
export type MtlsBindingCertificate = {
    privateKey: string;
    x5c: string;
    thumbprintSha256?: string;
};

/**
 * Client Credentials set for Confidential Clients
 */
export type ClientCredentials = {
    clientSecret?: string;
    clientAssertion?: ClientAssertion;
    /**
     * Raw certificate retained (in addition to any signed assertion) so it can be presented as the
     * client TLS certificate for mTLS Proof-of-Possession requests. Populated from the app's
     * configured `clientCertificate`.
     */
    mtlsBindingCertificate?: MtlsBindingCertificate;
};
