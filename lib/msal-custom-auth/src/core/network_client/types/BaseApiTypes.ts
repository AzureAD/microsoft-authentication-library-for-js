/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ServerTelemetryManager } from "@azure/msal-browser";

export enum GrantType {
    OOB = "oob",
    PASSWORD = "password",
    ATTRIBUTES = "attributes",
}

export type ChallengeType = "oob" | "password" | "redirect";

export type BaseApiRequest = {
    correlationId: string;
    telemetryManager: ServerTelemetryManager;
};

/**
 * Enum for challenge binding methods
 */
export enum BindingMethod {
    PROMPT = "prompt",
}

/**
 * Enum for challenge channels
 */
export enum ChallengeChannel {
    EMAIL = "email",
}
