import TelemetryEvent from "./TelemetryEvent";
import { EVENT_NAME_PREFIX } from "./TelemetryConstants";

export const USER_CANCELLED_KEY = EVENT_NAME_PREFIX + "user_cancelled";
export const ACCESS_DENIED_KEY = EVENT_NAME_PREFIX + "access_denied";

export default class UiEvent extends TelemetryEvent {
    constructor(correlationId: string) {
        super(`${EVENT_NAME_PREFIX}ui_event`, correlationId);
    }

    public set userCancelled(userCancelled: boolean) {
        this.event[USER_CANCELLED_KEY] = userCancelled;
    }

    public set accessDenied(accessDenied: boolean) {
        this.event[ACCESS_DENIED_KEY] = accessDenied;
    }
}
