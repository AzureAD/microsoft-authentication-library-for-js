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
     * Certificate used to bind the mTLS connection when the credential in the request body is an
     * assertion (e.g. the second leg of a Federated Identity Credential exchange). When set, the
     * certificate is presented at the TLS layer while the assertion remains the credential. Defaults
     * to the app's configured `clientCertificate` when omitted.
     */
    tokenBindingCertificate?: MtlsBindingCertificate;
};
