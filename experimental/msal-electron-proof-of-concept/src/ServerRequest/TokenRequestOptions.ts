// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { TokenRequestForm } from './TokenRequestForm';
/**
 * The TokenRequestOptions type models the options
 * object that will be used to make a request to get
 * an access token from the authorization server.
 */
export type TokenRequestOptions = {
    uri: string;
    method: string;
    form: TokenRequestForm;
    json: boolean;
};
