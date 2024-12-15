/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

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
 * Interface for redirect challenge response
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
