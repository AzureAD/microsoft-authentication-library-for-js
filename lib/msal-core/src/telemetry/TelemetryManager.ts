import TelemetryEvent from "./TelemetryEvent";
import { CompletedEvents, EventCount, EventCountByCorrelationId, InProgressEvents } from "./TelemetryTypes";

const MSAL_CACHE_EVENT_VALUE_PREFIX = "msal.token";
const MSAL_CACHE_EVENT_NAME = "msal.cache_event";

const createEventKey = (event: TelemetryEvent): string => (
    `${event.telemetryCorrelationId}-${event.eventId}-${event.eventName}`
);


export default class TelemetryManager {

    // correlation Id to list of events
    private completedEvents: CompletedEvents = {};
    // event key to event
    private inProgressEvents: InProgressEvents = {};
    // correlation id to map of eventname to count
    private eventCountByCorrelationId: EventCountByCorrelationId = {};

    private onlySendFailureTelemetry = false;
    private telemetryConfig = {};
    private telemetryCallback: Function = null;

    constructor(options: Object, cb: Function) {
        // TODO THROW if bad options or callback
        this.telemetryConfig = options;
        this.telemetryCallback = cb;
    }

    startEvent(event: TelemetryEvent) {
        if (!this.telemetryCallback) {
            return;
        }
        const eventKey = createEventKey(event);
        this.inProgressEvents[eventKey] = event;
    }

    stopEvent(event: TelemetryEvent) {
        if (!this.telemetryCallback || !this.inProgressEvents[createEventKey(event)]) {
            return;
        }
        event.stop();
        this.incrementEventCount(event);

        const completedEvents = this.completedEvents[event.telemetryCorrelationId];

        if (completedEvents && completedEvents.length) {
            this.completedEvents[event.telemetryCorrelationId] = [...completedEvents, event];
        } else {
            this.completedEvents[event.telemetryCorrelationId] = [event];
        }

        delete this.completedEvents[event.telemetryCorrelationId];
    }

    flush(correlationId: string) {
        if (!this.telemetryCallback || !this.completedEvents[correlationId]) {
            return;
        }
        const orphanedEvents = this.getOrphanedEvents(correlationId);
        orphanedEvents.map(this.incrementEventCount);
        const eventsToFlush: Array<TelemetryEvent> = [
            ...this.completedEvents[correlationId],
            ...orphanedEvents
        ];
        delete this.completedEvents[correlationId];
        const eventCountsToFlush: EventCount = this.eventCountByCorrelationId[correlationId];
        delete this.eventCountByCorrelationId[correlationId];

        // TODO add funcitonality for onlyFlushFailures ??

        if (!eventsToFlush || !eventsToFlush.length) {
            return;
        }

        // TODO INSERT DEFAULT EVENT

        // TODO  Format events?
        this.telemetryCallback(eventsToFlush.map(e => e.get()));

    }

    private incrementEventCount(event: TelemetryEvent): void {
        // TODO, name cache event different?
        // if type is cache event, change name
        const eventName = event.eventName;
        const eventCount = this.eventCountByCorrelationId[event.telemetryCorrelationId];
        if (!eventCount) {
            this.eventCountByCorrelationId[event.telemetryCorrelationId] = {
                [event.eventName]: 1
            };
        } else {
            eventCount[event.eventName] = eventCount[event.eventName] + 1;
        }
    }

    private getOrphanedEvents(correlationId: string): Array<TelemetryEvent> {
        let orphanedEvents: Array<TelemetryEvent> = Object.keys(this.inProgressEvents)
            .reduce((memo, eventKey) => {
                if (eventKey.indexOf(correlationId) !== -1) {
                    const event = this.inProgressEvents[eventKey];
                    delete this.inProgressEvents[eventKey];
                    return [...memo, event];
                }
                return memo;
            }, []);
        return orphanedEvents;
    }
}
