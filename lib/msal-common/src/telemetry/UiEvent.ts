import TelemetryEvent from "./TelemetryEvent";
import { prependEventNamePrefix } from "./TelemetryUtils";

export const EVENT_KEYS = {
    USER_CANCELLED: prependEventNamePrefix("user_cancelled"),
    ACCESS_DENIED: prependEventNamePrefix("access_denied")
};

export default class UiEvent extends TelemetryEvent {
    constructor(eventId: string, correlationId: string) {
        super(eventId, prependEventNamePrefix("ui_event"), correlationId, "UiEvent");
    }

    public set userCancelled(userCancelled: boolean) {
        this.event[EVENT_KEYS.USER_CANCELLED] = userCancelled;
    }

    public set accessDenied(accessDenied: boolean) {
        this.event[EVENT_KEYS.ACCESS_DENIED] = accessDenied;
    }
}
