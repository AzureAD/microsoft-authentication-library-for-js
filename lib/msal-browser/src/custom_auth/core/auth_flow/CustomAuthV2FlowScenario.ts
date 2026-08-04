/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * The native auth V2 flow that a result or error originates from.
 */
export type CustomAuthV2FlowScenario =
    | "signIn"
    | "signUp"
    | "resetPassword"
    | "unknown";
