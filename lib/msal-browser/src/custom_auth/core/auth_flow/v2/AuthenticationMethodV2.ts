/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * An authentication method offered by the server during a native auth V2 flow.
 * Each method describes one way the user can prove control of their account
 * (for example an email one-time code), and is surfaced when the flow needs the
 * app to pick a method before a challenge is issued. The app passes the selected
 * method back to the SDK to request a challenge for it.
 */
export interface AuthenticationMethodV2 {
    id: string;

    type: string;

    hint?: string;

    challengeHref: string;
}
