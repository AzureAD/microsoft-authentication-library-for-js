/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowErrorBaseV2 } from "../../../../core/auth_flow/v2/error/AuthFlowErrorBaseV2.js";

/**
 * Error returned when native auth V2 sign-up cannot start.
 */
export class SignUpStartErrorV2 extends AuthFlowErrorBaseV2 {}
