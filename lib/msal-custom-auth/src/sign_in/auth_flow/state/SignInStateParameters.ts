/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthBrowserConfiguration } from "../../../configuration/CustomAuthConfiguration.js";
import { CacheClient } from "../../../core/cache/CacheClient.js";
import { Logger } from "../../../core/utils/Logger.js";
import { SignInClient } from "../../interaction_client/SignInClient.js";

/**
 * Common parameters required to initialize sign-in state objects
 */
export interface SignInStateParameters {
    /**
     * Correlation ID for request tracing
     */
    correlationId: string;
    
    /**
     * Continuation token for multi-step auth flow
     */
    continuationToken: string;
    
    /**
     * Username for sign-in
     */
    username: string;
    
    /**
     * Scopes requested for the authentication token
     */
    scopes?: string[];
    
    /**
     * Client for sign-in API interactions
     */
    signInClient: SignInClient;
    
    /**
     * Logger for instrumentation
     */
    logger: Logger;
    
    /**
     * Application configuration
     */
    config: CustomAuthBrowserConfiguration;
    
    /**
     * Cache client for token storage
     */
    cacheClient: CacheClient;
}