
import uuidv4 from 'uuid/v4';
import TelemetryBlogEventNames from './TelemetryBlobEventNames';
import { 
    EVENT_NAME_PREFIX, 
    EVENT_NAME_KEY, 
    START_TIME_KEY, 
    ELAPSED_TIME_KEY
} from './TelemetryConstants';

export default class TelemetryEvent { 

    private startTime: Number;
    protected event; // TOOD TYPE THIS
    public eventId: string;

    constructor(eventName: string, correlationId: string) {
        this.startTime = new Date().getTime()
        this.eventId = uuidv4();
        this.event = {
            [`${EVENT_NAME_PREFIX}${EVENT_NAME_KEY}`]: eventName,
            [`${EVENT_NAME_PREFIX}${START_TIME_KEY}`]: this.startTime,
            [`${EVENT_NAME_PREFIX}${ELAPSED_TIME_KEY}`]: -1,
            [`${TelemetryBlogEventNames.MsalCorrelationIdConstStrKey}`]: correlationId
        }
    }

    private setElapsedTime(time: Number): void { 
        this.event[`${EVENT_NAME_PREFIX}${ELAPSED_TIME_KEY}`] = time;
    }

    public stop(): void {
        // Set duration of event
        this.setElapsedTime(+new Date().getTime() - +this.startTime)
    }

    public get telemetryCorrelationId(): string {
        return this.event[`${TelemetryBlogEventNames.MsalCorrelationIdConstStrKey}`];
    }

    public set telemetryCorrelationId(value: string) {
        this.event[`${TelemetryBlogEventNames.MsalCorrelationIdConstStrKey}`] = value;
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