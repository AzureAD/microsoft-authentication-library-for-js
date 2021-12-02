/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { IWeb, SeverityLevel } from "@microsoft/applicationinsights-common";
import {
    ApplicationInsights, IExtendedConfiguration, IWebAnalyticsConfiguration, IExtendedTelemetryItem
} from "@ms/1ds-analytics-web-js";
import { EventType } from "@ms/1ds-wa-js";

const initializeTelemetry = () => {
    const appInsights = new ApplicationInsights();
    // Configure ApplicationInsights
    const instrumentationKey = "fc2e0ddd37df42e4a0889b5cc81f7f23-b4eb643d-e415-4f38-aa60-16e10044b0bf-7765";
    const webAnalyticsConfig: IWebAnalyticsConfiguration = {
        autoCapture: {
            /**
             * Toggles automatic pageView event capturing. Default is true. PageView events are the primary BI events for counting the number of times pages on your site/application are seen.
             */
            pageView: false,
            /**
             * Toggles automatic contentUpdate event capturing on onLoad. Default is true. ContentUpdate events fire after the current view has finished loading, upon full page load (domComplete),
             * and if the viewport changes (scroll, etc). ContentUpdate events firing upon DOMComplete will contain page load time information.
             */
            onLoad: false,
            /**
             * Toggles automatic firing of Unload events. Default is true. Unload events fire when the page is unloaded and will contain time on page and scroll depth information.
             */
            onUnload: false,
            /**
             * Toggles automatic pageAction event capturing. Default is true.
             */
            click: false,
            /**
             * Toggles automatic contentUpdate event capturing when the user scrolls the web page. Default is false.
             */
            scroll: false,
            /**
             * Toggles automatic contentUpdate event capturing when the user resizes the web page. Default is false.
             */
            resize: false,
            /**
             * Toggles capturing of lineage data. Default is false.
             */
            lineage: false,
            /**
             * Toggles automatic clientError event capturing when js errors are thrown in the webpage. Default is true.
             */
            jsError: false,
            
        },
        
    };

    const config: IExtendedConfiguration = {
        instrumentationKey: instrumentationKey,
        // Extra extensions
        extensions: [],
        webAnalyticsConfiguration: webAnalyticsConfig,
        
    };

    // Initialize SDK
    appInsights.initialize(config, []);

    return appInsights;
};

let telemetry: ApplicationInsights;
function getTelemetryClient() {
    if (!telemetry) {
        telemetry = initializeTelemetry();
    }
    return telemetry;
}

export function sendSimpleEvent(name: string): void {
    const appInsights = getTelemetryClient();
    appInsights.track({ name });
}

export function sendCustomEvent(): void {
    const event1:IExtendedTelemetryItem ={name:"Event1", data:{
        correlationId: "03cad3ff-6682-4e3d-a0b4-d517b531c718",
	  durationMs: 1873,
	  endPageVisibility: "hidden",
	  fromCache: false,
	  name: "acquireTokenByRefreshToken",
	  startPageVisibility: "visible",
	  startTimeMs: 1636414041888,
	  success: true
    }};
    
    const appInsights = getTelemetryClient();
    appInsights.track(event1);
}

export function sendSampleError(): void {
    const appInsights = getTelemetryClient();
    appInsights.trackException({
        exception: new Error("Sample Error"),
        severityLevel: SeverityLevel.Warning
    }, {
        custom:"data"
    });
}
