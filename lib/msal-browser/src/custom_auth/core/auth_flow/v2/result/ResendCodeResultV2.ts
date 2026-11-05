/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthResultV2 } from "../CustomAuthResultV2.js";
import type { CodeRequiredStateV2 } from "../state/CodeRequiredStateV2.js";
import type { FailedStateV2 } from "../state/FailedStateV2.js";

/**
 * States returned after requesting a replacement first-factor code.
 * @warning This API is experimental. It may be changed in the future without notice. Do not use in production applications.
 */
export type ResendCodeResultStateV2 = CodeRequiredStateV2 | FailedStateV2;

/**
 * Result of requesting a replacement first-factor code.
 * @warning This API is experimental. It may be changed in the future without notice. Do not use in production applications.
 */
export type ResendCodeResultV2 = CustomAuthResultV2<ResendCodeResultStateV2>;
