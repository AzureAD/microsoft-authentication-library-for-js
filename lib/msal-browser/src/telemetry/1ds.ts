/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    ApplicationInsights, IExtendedConfiguration, IWebAnalyticsConfiguration, IExtendedTelemetryItem
} from "@ms/1ds-analytics-web-js";

export type PerformanceTelemetryEvent=IExtendedTelemetryItem["data"];
export type PerformanceTelemetryReporterConfiguration={
    samplingPrecentage?:number
};

export class PerformanceTelemetryReporter {
    constructor() {
       
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
        /*
         * sampling   %age->
         * Logger, log messages, sampling, filtering
         */

        const appInsightsConfig: IExtendedConfiguration = {
            instrumentationKey: instrumentationKey,
            // Extra extensions
            extensions: [],
            webAnalyticsConfiguration: webAnalyticsConfig,
            
        };

        // Initialize SDK
        this.appInsights = new ApplicationInsights();
        this.appInsights.initialize(appInsightsConfig, []);

    }

    private appInsights: ApplicationInsights;

    sendSimpleEvent(name: string): void {
        this.appInsights.track({ name });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sendCustomEvent(event: PerformanceTelemetryEvent): void {
        const event1: IExtendedTelemetryItem = {
            name: "CustomEventWithoutName",
            data: event
        };

        this.appInsights.track(event1);
    }

    getPerformanceTelemetryCallback():Function{
        return (events:PerformanceTelemetryEvent[])=>{
            events.forEach(event=>this.sendCustomEvent(event));
        };
    }
}

/*
 *export function sendSampleError(): void {
 *    const appInsights = getTelemetryClient();
 *    appInsights.trackException({
 *        exception: new Error("Sample Error"),
 *        severityLevel: SeverityLevel.Warning
 *    }, {
 *        custom: "data"
 *    });
 *}
 */
