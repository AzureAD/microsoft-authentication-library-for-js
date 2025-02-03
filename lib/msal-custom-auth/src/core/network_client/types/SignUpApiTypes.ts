/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export enum GrantType {
    OOB = "oob",
    PASSWORD = "password",
    ATTRIBUTES = "attributes",
}

export enum ChallengeType {
    OOB = "oob",
    PASSWORD = "password",
    REDIRECT = "redirect",
}

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

/**
 * Request types to initiate sign-up flow
 */
export interface SignUpStartRequest {
    /**
     * The email address of the user to sign up.
     */
    username: string;

    /**
     * The password of the user to sign up.
     */
    password?: string;

    /**
     * The attributes of the user to sign up.
     */
    attributes?: { [key: string]: string };
    challenge_type: string;
    client_id: string;
}

export interface SignUpChallengeRequest {
    client_id: string;
    continuation_token: string;
    challenge_type: string;
}

export interface SignUpContinueRequest {
    continuation_token: string;
    client_id: string;
    grant_type: GrantType;
    attributes?: { [key: string]: string };
    oob?: string;
}

/**
 * Response types for sign-up flow
 */
export interface RedirectChallengeResponse {
    challenge_type: ChallengeType.REDIRECT;
}

export interface SignUpChallengeResponse {
    interval: number;
    continuation_token: string;
    challenge_type: ChallengeType.OOB;
    binding_method: BindingMethod;
    challenge_channel: ChallengeChannel;
    challenge_target_label: string;
    code_length: number;
}

export interface SignUpStartResponse {
    continuation_token?: string;
}

/**
 * Union type for all possible challenge responses
 */
export type ChallengeResponse =
    | SignUpChallengeResponse
    | RedirectChallengeResponse;

export interface SignUpContinueResponse {
    challenge_type: ChallengeType;
    continuation_token: string;
}
