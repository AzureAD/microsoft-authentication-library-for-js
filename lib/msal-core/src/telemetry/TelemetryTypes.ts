import TelemetryEvent from './TelemetryEvent';

export interface InProgressEvents { [key: string] : TelemetryEvent }
export interface EventCount { [eventName: string] : number };
export interface EventCountByCorrelationId { [correlationId: string] : EventCount }
export interface CompletedEvents { [correlationId: string ] : Array<TelemetryEvent> }

export interface TelemetryPlatform {
    sdk: string,
    sdkVersion: string,
    applicationName: string,
    applicationVersion: string
}