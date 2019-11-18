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

    constructor(eventName: string, correlationId: string) {

        this.startTimestamp = Date.now();
        this.eventId = CryptoUtils.createNewGuid();
        this.event = {
            [prependEventNamePrefix(EVENT_NAME_KEY)]: eventName,
            [prependEventNamePrefix(START_TIME_KEY)]: this.startTimestamp,
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
}
