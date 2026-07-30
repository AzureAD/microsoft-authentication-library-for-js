/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    BaseAuthRequest,
    AzureRegion,
    ClientAssertion,
    MtlsBindingCertificate,
} from "@azure/msal-common/node";

/**
 * CommonClientCredentialRequest
 */
export type CommonClientCredentialRequest = Omit<
    BaseAuthRequest,
    "extraQueryParameters" | "extraParameters"
> & {
    /**
     * Skip token cache lookup and force request to authority to get a a new token. Defaults to false.
     */
    skipCache?: boolean;
    /**
     * Azure region to be used for regional authentication.
     */
    azureRegion?: AzureRegion;
    /**
     * An assertion string or a callback function that returns an assertion string (both are Base64Url-encoded signed JWTs) used in the Client Credential flow.
     */
    clientAssertion?: ClientAssertion;
    /**
     * FMI path to scope the client credentials token to a specific agent identity. Sent as `fmi_path` in the POST body.
     */
    fmiPath?: string;
    /**
     * When true, requests an mTLS-bound Proof-of-Possession token (`token_type=mtls_pop`) from Entra ID.
     * The binding certificate (the app's configured `clientCertificate`, or `tokenBindingCertificate`
     * on this request) is presented as the client TLS certificate in the mutual-TLS handshake to the
     * token endpoint, and the returned token is cryptographically bound to that certificate.
     */
    mtlsProofOfPossession?: boolean;
    /**
     * Certificate that binds the mTLS connection for the second leg of a Federated Identity
     * Credential (FIC) exchange, where the credential in the request body is a client assertion.
     * Providing this field selects the FIC Leg 2 path: the assertion is sent as the credential
     * (with the `jwt-pop` assertion type) while this certificate is presented at the TLS layer,
     * decoupled from the credential.
     *
     * When omitted, the request runs as vanilla SN/I mTLS PoP — the app's configured
     * `clientCertificate` is both the credential and the TLS binding, and any supplied
     * `clientAssertion` is not sent. To present an assertion over the application certificate, set
     * this explicitly (it may be the same certificate as `auth.clientCertificate`).
     */
    tokenBindingCertificate?: MtlsBindingCertificate;
    /**
     * Client-originated claims to forward to the token endpoint, sent as the `claims` parameter on the wire.
     * Unlike `claims` (a server-issued challenge, which bypasses the token cache), client claims are cached and
     * the cache entry is keyed on the claims value. Must use stable, non-dynamic values to avoid unbounded cache growth.
     * See the MSAL Node token caching guide (`docs/caching.md`) for cache serialization and eviction strategies.
     */
    claimsFromClient?: string;
};
