/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Constants } from "@azure/msal-browser";
import { version } from "./packageMetadata.js";

export const GrantType = {
    PASSWORD: "password",
    OOB: "oob",
    CONTINUATION_TOKEN: "continuation_token",
    REDIRECT: "redirect",
    ATTRIBUTES: "attributes",
} as const;

export const ChallengeType = {
    PASSWORD: "password",
    OOB: "oob",
    REDIRECT: "redirect",
} as const;

export const DefaultScopes = [Constants.OPENID_SCOPE, Constants.PROFILE_SCOPE, Constants.OFFLINE_ACCESS_SCOPE] as const;

export const HttpHeaderKeys = {
    CONTENT_TYPE: "Content-Type",
    X_MS_REQUEST_ID: "x-ms-request-id",
} as const;

export const DefaultPackageInfo = {
    SKU: "msal.custom.auth",
    VERSION: version,
    OS: "",
    CPU: "",
} as const;

export const ResetPasswordPollStatus = {
    IN_PROGRESS: "in_progress",
    SUCCEEDED: "succeeded",
    FAILED: "failed",
    NOT_STARTED: "not_started",
} as const;

export const DefaultCustomAuthApiCodeLength = 8;
export const DefaultCustomAuthApiCodeResendIntervalInSec = 300; // seconds
export const PasswordResetPollingTimeoutInMs = 300000; // milliseconds

export const REFRESH_TIME_SECONDS = 3600 * 24; // 24 Hours in seconds
