/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export enum GrantType {
    OOB = "oob",
    PASSWORD = "password",
    ATTRIBUTES = "attributes",
}

export interface SignUpStartRequest {
    /**
     * The email address of the user to sign up.
     */
    username: string;

    /**
     * The password of the user to sign up.
     */
    password: string;

    /**
     * The attributes of the user to sign up.
     */
    attributes: { [key: string]: string };

    challenge_type: string;

    client_id: string;
}

export interface SignUpChallengeRequest {
    client_id: string;
    continuation_token: string;
    challenge_type?: string;
}

export interface SignUpContinueRequest {
    continuation_token: string;
    grant_type: string;
    client_id: string;
    oob: GrantType;
}
