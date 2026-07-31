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
 * Certificate used to bind a mutual-TLS (mTLS) Proof-of-Possession token request. The private key
 * is used solely to establish the outbound TLS connection and is never surfaced back to callers;
 * only the public `x5c` (and its derived SHA-256 thumbprint) is returned on the result.
 */
export type MtlsBindingCertificate = {
    privateKey: string;
    x5c: string;
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
    /**
     * App-level opt-in to present the configured certificate as the client TLS certificate on the
     * token request handshake (routing to the mTLS endpoint) while still receiving a plain Bearer
     * token — i.e. Bearer-over-mTLS. Distinct from per-request mTLS Proof-of-Possession, which
     * always takes precedence when both are set. Populated from the app's
     * `clientCertificate.sendCertificateOverMtls`.
     */
    sendCertificateOverMtls?: boolean;
};
