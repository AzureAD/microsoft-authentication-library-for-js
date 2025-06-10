/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { INetworkModule, Logger } from "@azure/msal-common/node";
// import { Agent } from "https";
import { ManagedIdentityId } from "../../config/ManagedIdentityId.js";
import { ManagedIdentityRequestParameters } from "../../config/ManagedIdentityRequestParameters.js";
import { BaseManagedIdentitySource } from "./BaseManagedIdentitySource.js";
import { CryptoProvider } from "../../crypto/CryptoProvider.js";
import {
    HttpMethod,
    ManagedIdentityHeaders,
    ManagedIdentityIdType,
    ManagedIdentityQueryParameters,
} from "../../utils/Constants.js";
import { NodeStorage } from "../../cache/NodeStorage.js";
import { Imds, IMDS_API_VERSION } from "./Imds.js";
import { ShortLivedCredential } from "../../response/ShortLivedCredentialResponse.js";

const CREDENTIAL_PATH: string =
    "/metadata/identity/credential?cred-api-version=1.0";

export class ImdsV2 extends BaseManagedIdentitySource {
    private identityEndpoint: string;

    constructor(
        logger: Logger,
        nodeStorage: NodeStorage,
        networkClient: INetworkModule,
        cryptoProvider: CryptoProvider,
        disableInternalRetries: boolean,
        identityEndpoint: string
    ) {
        super(
            logger,
            nodeStorage,
            networkClient,
            cryptoProvider,
            disableInternalRetries
        );

        this.identityEndpoint = identityEndpoint;
    }

    public static tryCreate(
        logger: Logger,
        nodeStorage: NodeStorage,
        networkClient: INetworkModule,
        cryptoProvider: CryptoProvider,
        disableInternalRetries: boolean
    ): ImdsV2 | null {
        if (!this.isCredentialEndpointAvailable()) {
            return null;
        }

        const validatedIdentityEndpoint: string =
            Imds.getValidatedIdentityEndpoint(CREDENTIAL_PATH, logger);

        return new ImdsV2(
            logger,
            nodeStorage,
            networkClient,
            cryptoProvider,
            disableInternalRetries,
            validatedIdentityEndpoint
        );
    }

    public static isCredentialEndpointAvailable(): boolean {
        // TODO: Probe credential endpoint. If it doesn't return 400, return null
        return false;
    }

    public createRequest(
        resource: string,
        managedIdentityId: ManagedIdentityId
    ): ManagedIdentityRequestParameters {
        const imdsRequest: ManagedIdentityRequestParameters =
            new ManagedIdentityRequestParameters(
                HttpMethod.POST,
                this.identityEndpoint
            );

        imdsRequest.headers[ManagedIdentityHeaders.METADATA_HEADER_NAME] =
            "true";
        imdsRequest.headers[
            ManagedIdentityHeaders.CLIENT_REQUEST_ID_HEADER_NAME
        ] = "1234567890"; // TODO: generate random request ID

        imdsRequest.queryParameters[
            ManagedIdentityQueryParameters.API_VERSION
        ] = IMDS_API_VERSION;
        imdsRequest.queryParameters[ManagedIdentityQueryParameters.RESOURCE] =
            resource;

        if (
            managedIdentityId.idType !== ManagedIdentityIdType.SYSTEM_ASSIGNED
        ) {
            imdsRequest.queryParameters[
                this.getManagedIdentityUserAssignedIdQueryParameterKey(
                    managedIdentityId.idType,
                    true // indicates source is IMDS
                )
            ] = managedIdentityId.id;
        }

        /*
         * TODO: add self-signed mTLS certificate functionality
         * If Windows, check certificate store for mTLS certificate (no Linux support)
         * Otherwise, check in-memory cache for mTLS certificate
         * If not either of the above, create self-signed mTLS certificate
         */
        /*
         * const mTLSCertificatePem: string = "fake_cert";
         * const privateKeyPem: string = "fake_private_key";
         */
        const sha256HashOfPublicKey: string = "fake_sha256_hash_of_public_key";
        const x5C: string = "fake_x5c";
        imdsRequest.bodyParameters = {
            cnf: JSON.stringify({
                jwk: {
                    kty: "RSA",
                    use: "sig",
                    alg: "RS256",
                    kid: sha256HashOfPublicKey,
                    x5c: [x5C],
                },
            }),
            latch_key: "false",
        };

        /*
         * TODO: Request SLC via "/credential" endpoint instead of using this fake object.
         * This will be complicated the current acquireTokenWithManagedIdentity function in
         * BaseManagedIdentitySource is not built to handle this request.
         */
        const shortLivedCredential: ShortLivedCredential = {
            client_id: "fake_string",
            credential: "fake_string",
            expires_in: 3599,
            identity_type: "fake_string",
            refresh_in: 3599,
            region: "fake_string",
            regional_token_url: "fake_string",
            tenant_id: "fake_string",
        };

        const estsRequest: ManagedIdentityRequestParameters =
            new ManagedIdentityRequestParameters(
                HttpMethod.POST,
                `${shortLivedCredential.regional_token_url}/${shortLivedCredential.tenant_id}/oauth2/v2.0/token`
            );

        // TODO: define constants for these values
        estsRequest.bodyParameters = {
            grant_type: "client_credentials",
            scope: "https://management.azure.com/.default",
            client_id: shortLivedCredential.client_id,
            client_assertion: shortLivedCredential.credential,
            client_assertion_type:
                "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
        };

        /*
         * TODO:
         * 1. Re-work the HttpClient to handle the self-signed mTLS certificate
         * 2. Add functionality to ManagedIdentityRequestParameters to handle the self-signed mTLS certificate
         */
        /*
         * const agent = new Agent({
         *     cert: mTLSCertificatePem,
         *     key: privateKeyPem,
         *     ca: mTLSCertificatePem,
         * });
         * estsRequest.agent = agent;
         */

        return estsRequest;
    }
}
