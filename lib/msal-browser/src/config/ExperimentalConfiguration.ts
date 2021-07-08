/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { InteractionType } from "../utils/BrowserConstants";
import { RedirectRequest } from "../request/RedirectRequest";

/**
 * Broker Options
 */
export type BrokerOptions = {
    actAsBroker?: boolean;
    preferredInteractionType: InteractionType.Popup | InteractionType.Redirect | InteractionType.None | null;
    allowBrokering?: boolean;
    trustedBrokerDomains?: string[];
    brokerRedirectParams?: Pick<RedirectRequest, "redirectStartPage" | "onRedirectNavigate">;
};

export type ExperimentalConfiguration = {
    brokerOptions?: BrokerOptions;
};

export type ExperimentalBrowserConfiguration = {
    brokerOptions: Required<BrokerOptions>;
};

// Default broker options for browser
const DEFAULT_BROKER_OPTIONS: Required<BrokerOptions> = {
    preferredInteractionType: null,
    brokerRedirectParams: {},
    actAsBroker: false,
    allowBrokering: false,
    trustedBrokerDomains: []
};

export function buildExperimentalConfiguration({ brokerOptions: userBrokerOpts }: ExperimentalConfiguration): ExperimentalBrowserConfiguration {
    const overlayedExperimentalConfig: ExperimentalBrowserConfiguration = {
        brokerOptions: { ...DEFAULT_BROKER_OPTIONS, ...userBrokerOpts }
    };
    return overlayedExperimentalConfig;
}
