/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { AuthError, AuthenticationResult } from "@azure/msal-common";

/**
 * A type alias for an authResponseCallback function.
 * {@link (authResponseCallback:type)}
 * @param authErr error created for failure cases
 * @param response response containing token strings in success cases, or just state value in error cases
 */
export type AuthCallback = (authErr: AuthError, response?: AuthenticationResult) => void;
