// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export type TokenRequestForm = {
    client_id: string;
    scope: string;
    redirect_uri: string;
    grant_type: string;
    code: string;
    code_verifier: string;
};
