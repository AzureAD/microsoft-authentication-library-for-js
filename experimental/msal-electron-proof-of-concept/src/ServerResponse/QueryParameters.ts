// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * The QueryParamters type models the most
 * relevant elements of the Auth Code response
 */
export type QueryParameters = {
    code?: string;
    state?: string;
    error?: string;
    error_description?: string;
};
