
import { v4 as uuid } from "uuid";
import { TELEMETRY_BLOB_EVENT_NAMES } from "./TelemetryConstants";
import {
    EVENT_NAME_PREFIX,
    EVENT_NAME_KEY,
    START_TIME_KEY,
    ELAPSED_TIME_KEY
} from "./TelemetryConstants";

export default class TelemetryEvent {

    private startTimestamp: number;
    protected event: any; // TODO TYPE THIS
    public eventId: string;

    constructor(eventName: string, correlationId: string) {

        this.startTimestamp = Date.now();
        this.eventId = uuid();
        this.event = {
            [`${EVENT_NAME_PREFIX}${EVENT_NAME_KEY}`]: eventName,
            [`${EVENT_NAME_PREFIX}${START_TIME_KEY}`]: this.startTimestamp,
            [`${EVENT_NAME_PREFIX}${ELAPSED_TIME_KEY}`]: -1,
            [`${TELEMETRY_BLOB_EVENT_NAMES.MsalCorrelationIdConstStrKey}`]: correlationId
        };
    }

    private setElapsedTime(time: Number): void {
        this.event[`${EVENT_NAME_PREFIX}${ELAPSED_TIME_KEY}`] = time;
    }

    public stop(): void {
        // Set duration of event
        this.setElapsedTime(+Date.now() - +this.startTimestamp);
    }

    public get telemetryCorrelationId(): string {
        return this.event[`${TELEMETRY_BLOB_EVENT_NAMES.MsalCorrelationIdConstStrKey}`];
    }

    public set telemetryCorrelationId(value: string) {
        this.event[`${TELEMETRY_BLOB_EVENT_NAMES.MsalCorrelationIdConstStrKey}`] = value;
    }

    public get eventName(): string {
        return this.event[`${EVENT_NAME_PREFIX}${EVENT_NAME_KEY}`];
    }

    public get(): object {
        return {
            ...this.event,
            eventId: this.eventId
        };
    }
}
