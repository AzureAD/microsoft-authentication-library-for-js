/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthApiResponseBase } from "./CustomAuthApiResponseBase.js";

export class SignInInitiateResponse extends CustomAuthApiResponseBase {
    constructor(
        correlation_id?: string,
        public continuation_token?: string,
        public challenge_type?: string,
    ) {
        super(correlation_id);
    }
}

export class SignInChallengeResponse extends CustomAuthApiResponseBase {
    constructor(
        correlation_id?: string,
        public continuation_token?: string,
        public challenge_type?: string,
        public binding_method?: string,
        public target_challenge_label?: string,
        public challenge_channel?: string,
        public code_length?: number,
    ) {
        super(correlation_id);
    }
}

export class SignInTokenResponse extends CustomAuthApiResponseBase {
    constructor(
        correlation_id?: string,
        public token_type?: string,
        public scopes?: string,
        public expires_in?: number,
        public id_token?: string,
        public access_token?: string,
        public refresh_token?: string,
    ) {
        super(correlation_id);
    }
}
