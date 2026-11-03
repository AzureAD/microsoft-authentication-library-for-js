/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const APP_ORIGIN = window.location.origin;

// Reused from the LegacyPollingSample test slice app registration.
export const ESTS_TEST_SLICE = "ESTS-PUB-SCUS-FD000-TEST3-100";

export const CLIENT_ID = "9f33d0de-fdfd-431b-a565-af47c697a4c4";
export const AUTHORITY =
    "https://login.microsoftonline.com/c7cef333-42af-492c-afb0-21f74a661133";
export const REDIRECT_URI = APP_ORIGIN + "/redirect";
// The post-logout redirect URI reuses /redirect: it runs the redirect bridge,
// which relays logout completion back through the relay page.
export const POST_LOGOUT_REDIRECT_URI = APP_ORIGIN + "/redirect";
