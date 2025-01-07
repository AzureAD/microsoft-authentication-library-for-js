/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Constants } from "@azure/msal-browser";

export const GrantType = {
    PASSWORD: "password",
    OOB: "oob",
    CONTINUATION_TOKEN: "continuation_token",
    REDIRECT: "redirect",
    ATTRIBUTES: "attributes",
};

export const ChallengeType = {
    PASSWORD: "password",
    OOB: "oob",
    REDIRECT: "redirect",
};

export const DefaultScopes = [
    Constants.OPENID_SCOPE,
    Constants.PROFILE_SCOPE,
    Constants.OFFLINE_ACCESS_SCOPE,
];
