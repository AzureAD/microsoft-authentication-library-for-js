import TelemetryEvent from "./TelemetryEvent";
import { EventCount, TelemetryPlatform } from "./TelemetryTypes";
import { EVENT_NAME_PREFIX } from "./TelemetryConstants";
import { TELEMETRY_BLOB_EVENT_NAMES } from './TelemetryConstants';

export default class DefaultEvent extends TelemetryEvent {
    // TODO Platform Type
    constructor(platform: TelemetryPlatform, correlationId: string, clientId: string, eventCount: EventCount) {
        super(`${EVENT_NAME_PREFIX}default_event`, correlationId);
        this.event[`${EVENT_NAME_PREFIX}client_id`] = clientId;
        this.event[`${EVENT_NAME_PREFIX}sdk_plaform`] = platform.sdk;
        this.event[`${EVENT_NAME_PREFIX}sdk_version`] = platform.sdkVersion;
        this.event[`${EVENT_NAME_PREFIX}application_name`] = platform.applicationName;
        this.event[`${EVENT_NAME_PREFIX}application_version`] = platform.applicationVersion;
        this.event[`${TELEMETRY_BLOB_EVENT_NAMES.UiEventCountTelemetryBatchKey}`] = this.getEventCount(`${EVENT_NAME_PREFIX}ui_event`, eventCount);
        this.event[`${TELEMETRY_BLOB_EVENT_NAMES.HttpEventCountTelemetryBatchKey}`] = this.getEventCount(`${EVENT_NAME_PREFIX}http_event`, eventCount);
        this.event[`${TELEMETRY_BLOB_EVENT_NAMES.CacheEventCountConstStrKey}`] = this.getEventCount(`${EVENT_NAME_PREFIX}cache_event`, eventCount);
        /// Device id?  
    }

    private getEventCount(eventName: string, eventCount: EventCount) {
        if (!eventCount[eventName]) { 
            return '0';
        }
        return `${eventCount[eventName]}`;
    }
}