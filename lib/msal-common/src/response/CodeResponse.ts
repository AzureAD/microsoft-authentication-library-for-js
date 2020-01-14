/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthResponse } from "./AuthResponse";

/**
 * CodeResponse type returned by library containing authorization code.
 * - code: authorization code returned from interactive call
 * - userRequestState: State used in authorization code request. This is salted with a value that MSAL.js needs to send a token exchange response, and needs to be 
 *      sent to acquireToken without mutation.
 */
export type CodeResponse = AuthResponse & {
    code: string
};
