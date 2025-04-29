/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// feature flag configuration for new features in MSAL.js
export type FeatureSupportConfiguration = {
    enablePlatformBrokerDOMSupport?: boolean;
};

// populate user input or return default values
export function buildFeatureSupportConfiguration(
    userInput?: FeatureSupportConfiguration
): FeatureSupportConfiguration {
    return {
        enablePlatformBrokerDOMSupport:
            userInput?.enablePlatformBrokerDOMSupport || false,
    };
}
