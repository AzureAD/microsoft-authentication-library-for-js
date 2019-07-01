import TelemetryEvent from "./TelemetryEvent";
import { EVENT_NAME_PREFIX } from "./TelemetryConstants";

const USER_CANCELLED = EVENT_NAME_PREFIX + "user_cancelled";
const ACCESS_DENIED = EVENT_NAME_PREFIX + "access_denied";

export default class UiEvent extends TelemetryEvent {
    constructor(correlationId: string) {
        super(`${EVENT_NAME_PREFIX}ui_event`, correlationId);
    }

    public set userCancelled(userCancelled: boolean) {
        this.event[USER_CANCELLED] = userCancelled.toString();
    }

    public set accessDenied(accessDenied: boolean) {
        this.event[ACCESS_DENIED] = accessDenied.toString();
    }
}
