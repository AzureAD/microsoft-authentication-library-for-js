import { TELEMETRY_BLOB_EVENT_NAMES } from "./TelemetryConstants";
import {
    EVENT_NAME_KEY,
    START_TIME_KEY,
    ELAPSED_TIME_KEY
} from "./TelemetryConstants";
import { prependEventNamePrefix } from "./TelemetryUtils";
import { CryptoUtils } from "../utils/CryptoUtils";

export default class TelemetryEvent {

    private startTimestamp: number;
    protected event: any; // TODO TYPE THIS
    public eventId: string;
    private label: string;

    constructor(eventName: string, correlationId: string, eventLabel: string) {
        this.eventId = CryptoUtils.createNewGuid();
        this.label = eventLabel;
        this.event = {
            [prependEventNamePrefix(EVENT_NAME_KEY)]: eventName,
            [prependEventNamePrefix(ELAPSED_TIME_KEY)]: -1,
            [`${TELEMETRY_BLOB_EVENT_NAMES.MsalCorrelationIdConstStrKey}`]: correlationId
        };
    }

    private setElapsedTime(time: Number): void {
        this.event[prependEventNamePrefix(ELAPSED_TIME_KEY)] = time;
    }

    public stop(): void {
        // Set duration of event
        this.setElapsedTime(+Date.now() - +this.startTimestamp);

        if ("performance" in window && window.performance.mark && window.performance.measure) {
            window.performance.mark(`end-${this.key}`);
            window.performance.measure(this.displayName, `start-${this.key}`, `end-${this.key}`);
    
            window.performance.clearMeasures(this.displayName);
            window.performance.clearMarks(`start-${this.key}`);
            window.performance.clearMarks(`end-${this.key}`);
        }
    }

    public start(): void {
        this.startTimestamp = Date.now();
        this.event[prependEventNamePrefix(START_TIME_KEY)] = this.startTimestamp;

        if ("performance" in window && window.performance.mark) {
            window.performance.mark(`start-${this.key}`);
        }
    }

    public get telemetryCorrelationId(): string {
        return this.event[`${TELEMETRY_BLOB_EVENT_NAMES.MsalCorrelationIdConstStrKey}`];
    }

    public set telemetryCorrelationId(value: string) {
        this.event[`${TELEMETRY_BLOB_EVENT_NAMES.MsalCorrelationIdConstStrKey}`] = value;
    }

    public get eventName(): string {
        return this.event[prependEventNamePrefix(EVENT_NAME_KEY)];
    }

    public get(): object {
        return {
            ...this.event,
            eventId: this.eventId
        };
    }

    public get key() {
        return `${this.telemetryCorrelationId}_${this.eventId}-${this.eventName}`;
    };

    public get displayName() {
        return `Msal-${this.label}-${this.telemetryCorrelationId}`;
    }
}
