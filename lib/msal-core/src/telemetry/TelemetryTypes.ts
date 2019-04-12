import TelemetryEvent from "./TelemetryEvent";

export interface InProgressEvents { [key: string] : TelemetryEvent; }
export interface EventCount { [eventName: string] : number; }
export interface EventCountByCorrelationId { [correlationId: string] : EventCount; }
export interface CompletedEvents { [correlationId: string ] : Array<TelemetryEvent>; }

// SDK SHOULD BE DEFAULTED and Pulled from Package
export interface TelemetryPlatform {
    sdk: string;
    sdkVersion: string;
    applicationName: string;
    applicationVersion: string;
}

export interface TelemetryConfig {
    platform: TelemetryPlatform;
    onlySendFailureTelemetry?: boolean;
    clientId: string;
}
